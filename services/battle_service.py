"""
Battle Service - Lógica de batalha desacoplada do Flask
Orquestra o fluxo de combate entre player e inimigos
"""

from typing import Dict, Any
from database import db
from repositories.player_repository import PlayerRepository
from repositories.enemy_repository import EnemyRepository
from core.exceptions.game_exceptions import (
    InsufficientEnergyException,
    SkillNotFoundException,
    EnemyAlreadyDeadException
)
from core.constants.game_constants import (
    CRITICAL_BASE_MULTIPLIER,
    ENERGY_REGEN_PER_TURN
)


class AttackResult:
    """Resultado de um ataque"""

    def __init__(self, damage: int, is_critical: bool, lifesteal: int = 0,
                 enemy_died: bool = False, breakdown: dict = None):
        self.damage = damage
        self.is_critical = is_critical
        self.lifesteal = lifesteal
        self.enemy_died = enemy_died
        self.breakdown = breakdown or {}

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário para serialização"""
        return {
            'damage': self.damage,
            'is_critical': self.is_critical,
            'lifesteal': self.lifesteal,
            'enemy_died': self.enemy_died,
            'breakdown': self.breakdown
        }


class BattleService:
    """
    Serviço de batalha - SEM dependência de Flask.
    Pode ser usado em CLI, testes, APIs diferentes, etc.
    """

    def __init__(self):
        self.player_repo = PlayerRepository()
        self.enemy_repo = EnemyRepository()

    def execute_attack(self, player_id: int, skill_id: int) -> AttackResult:
        """
        Executa um ataque do player no inimigo atual.

        Args:
            player_id: ID do player
            skill_id: ID da skill a usar

        Returns:
            AttackResult com detalhes do ataque

        Raises:
            PlayerNotFoundException: Player não existe
            NoActiveEnemyException: Sem inimigo selecionado
            SkillNotFoundException: Skill não existe
            InsufficientEnergyException: Sem energia
            EnemyAlreadyDeadException: Inimigo já morto
        """
        # 1. Validar entidades
        player = self.player_repo.get_by_id_or_fail(player_id)
        enemy = self.enemy_repo.get_current_enemy_or_fail(player_id)

        if enemy.hp <= 0:
            raise EnemyAlreadyDeadException()

        # 2. Buscar skill do cache
        from routes.battle_cache import get_cached_attack
        cached_skill = get_cached_attack(player_id, skill_id)

        if not cached_skill:
            raise SkillNotFoundException(skill_id)

        # 3. Validar energia
        if player.energy < cached_skill.energy_cost:
            raise InsufficientEnergyException(
                required=cached_skill.energy_cost,
                available=player.energy
            )

        # 4. Calcular dano
        damage_result = self._calculate_damage(player, enemy, cached_skill)

        # 5. Aplicar dano ao inimigo
        new_enemy_hp = max(0, enemy.hp - damage_result['damage'])
        self.enemy_repo.update_hp(enemy, new_enemy_hp)

        enemy_died = new_enemy_hp == 0

        # 6. Aplicar lifesteal (se houver)
        lifesteal_amount = 0
        if cached_skill.lifesteal_percent > 0:
            lifesteal_amount = int(damage_result['damage'] * cached_skill.lifesteal_percent)
            new_player_hp = min(player.max_hp, player.hp + lifesteal_amount)
            self.player_repo.update_hp(player_id, new_player_hp)

        # 7. Consumir energia
        new_energy = player.energy - cached_skill.energy_cost
        self.player_repo.update_energy(player_id, new_energy)

        # 8. Atualizar contadores (TODO: mover para sistema de contadores)
        player.total_attacks_any_type += 1

        if cached_skill.skill_type == 'special':
            player.total_special_uses += 1

        # 9. Marcar primeiro ataque (para relíquias)
        if not player.first_attack_done:
            player.first_attack_done = True

        if cached_skill.skill_type in ['power', 'special'] and not player.first_power_or_special_done:
            player.first_power_or_special_done = True

        # 10. Commit transação
        db.session.commit()

        # 11. Retornar resultado
        return AttackResult(
            damage=damage_result['damage'],
            is_critical=damage_result['is_critical'],
            lifesteal=lifesteal_amount,
            enemy_died=enemy_died,
            breakdown=damage_result.get('breakdown', {})
        )

    def _calculate_damage(self, player, enemy, cached_skill) -> Dict[str, Any]:
        """
        Calcula dano do ataque.

        Args:
            player: Player atacando
            enemy: Inimigo alvo
            cached_skill: Skill do cache

        Returns:
            Dict com 'damage', 'is_critical', 'breakdown'
        """
        # Usar sistema de dano centralizado
        from damage_system import calculate_total_damage

        # Buscar buffs ativos (TODO: mover para sistema de buffs)
        active_buffs = []  # Implementar busca de buffs

        # Buscar lembranças (TODO: mover para sistema de lembranças)
        from routes.battle_cache import get_run_buff_total
        run_buffs = {
            'damage_global': get_run_buff_total(player.id, 'damage_global'),
            'damage_attack': get_run_buff_total(player.id, 'damage_attack'),
            'damage_power': get_run_buff_total(player.id, 'damage_power'),
            'damage_special': get_run_buff_total(player.id, 'damage_special'),
            'damage_ultimate': get_run_buff_total(player.id, 'damage_ultimate'),
        }

        # Skill como dict para o damage_system
        skill_dict = {
            'damage_modifier': 1.0,  # Não usamos mais modifier, mas manter compatibilidade
            'effect_type': cached_skill.effect_type,
            'effect_value': cached_skill.effect_value
        }

        # Calcular dano
        result = calculate_total_damage(
            player=player,
            skill=skill_dict,
            damage_points=cached_skill.base_damage,
            active_buffs=active_buffs,
            run_buffs=run_buffs,
            is_critical=None  # Deixar o sistema calcular
        )

        return {
            'damage': result['damage'],
            'is_critical': result['is_critical'],
            'breakdown': result.get('breakdown', {})
        }

    def regenerate_energy(self, player_id: int) -> int:
        """
        Regenera energia do player (início de turno).

        Args:
            player_id: ID do player

        Returns:
            Nova quantidade de energia
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        new_energy = min(player.max_energy, player.energy + ENERGY_REGEN_PER_TURN)
        self.player_repo.update_energy(player_id, new_energy)

        db.session.commit()

        return new_energy

    def reset_battle_state(self, player_id: int) -> None:
        """
        Reseta estado de batalha (novo combate).

        Args:
            player_id: ID do player
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        # Resetar flags de primeiro ataque
        player.first_attack_done = False
        player.first_power_or_special_done = False

        # Resetar skills usadas nesta batalha
        import json
        player.skills_used_this_battle = json.dumps({
            'attack': 0,
            'power': 0,
            'special': 0,
            'ultimate': 0
        })

        db.session.commit()
