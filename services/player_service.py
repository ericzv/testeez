"""
Player Service - Lógica de gerenciamento de players
"""

from typing import Dict, Any
from database import db
from repositories.player_repository import PlayerRepository
from core.logging_config import get_logger

logger = get_logger(__name__)


class PlayerService:
    """Serviço de gerenciamento de players"""

    def __init__(self):
        self.player_repo = PlayerRepository()

    def get_player_status(self, player_id: int) -> Dict[str, Any]:
        """
        Retorna status completo do player.

        Args:
            player_id: ID do player

        Returns:
            Dict com todos os dados do player
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        return {
            'id': player.id,
            'hp': player.hp,
            'max_hp': player.max_hp,
            'energy': player.energy,
            'max_energy': player.max_energy,
            'barrier': getattr(player, 'barrier', 0),
            'crystals': player.crystals,
            'gold': player.run_gold,
            'hourglasses': player.eternal_hourglasses,
            'enemies_defeated': player.enemies_defeated
        }

    def reset_run(self, player_id: int) -> None:
        """
        Reseta a run do jogador (mantém apenas progressão permanente).

        Args:
            player_id: ID do player
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        # Resetar HP/Energia para máximo
        player.hp = player.max_hp
        player.energy = player.max_energy
        player.barrier = 0

        # Resetar contadores de run
        player.run_gold = 0
        player.run_gold_gained = 0
        player.run_crystals_gained = 0
        player.run_hourglasses_gained = 0
        player.enemies_defeated = 0

        # Resetar flags de batalha
        player.first_attack_done = False
        player.first_power_or_special_done = False

        # Resetar contadores de ataques
        player.total_attacks_any_type = 0
        player.total_special_uses = 0

        # Resetar skills usadas
        import json
        player.skills_used_this_battle = json.dumps({
            'attack': 0,
            'power': 0,
            'special': 0,
            'ultimate': 0
        })
        player.last_three_skills = json.dumps([])

        # Resetar bônus acumulados de relíquias
        player.accumulated_attack_bonus = 0
        player.accumulated_power_bonus = 0

        # Desativar relíquias
        from models import PlayerRelic
        PlayerRelic.query.filter_by(player_id=player_id, is_active=True).update({
            'is_active': False
        })

        # Limpar lembranças (buffs de run)
        from models import PlayerRunBuff
        PlayerRunBuff.query.filter_by(player_id=player_id).delete()

        # Limpar inimigos
        from models import GenericEnemy
        GenericEnemy.query.filter_by(player_id=player_id).delete()

        # Limpar progresso
        from models import PlayerProgress
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if progress:
            progress.selected_enemy_id = None
            progress.selected_boss_id = None

        db.session.commit()

        logger.info(f"Player {player_id} run reset")

    def heal_player(self, player_id: int, amount: int) -> int:
        """
        Cura o player.

        Args:
            player_id: ID do player
            amount: Quantidade de HP a curar

        Returns:
            HP curado efetivamente
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        old_hp = player.hp
        player.hp = min(player.hp + amount, player.max_hp)
        actual_heal = player.hp - old_hp

        db.session.commit()

        logger.debug(f"Player {player_id} healed {actual_heal} HP")

        return actual_heal

    def damage_player(self, player_id: int, amount: int) -> Dict[str, Any]:
        """
        Causa dano ao player.

        Args:
            player_id: ID do player
            amount: Quantidade de dano

        Returns:
            Dict com info do dano aplicado
        """
        from routes.battle_modules import apply_damage_to_player

        player = self.player_repo.get_by_id_or_fail(player_id)

        # Usar sistema existente que lida com barreira, bloqueio, etc
        result = apply_damage_to_player(player, amount)

        db.session.commit()

        logger.debug(f"Player {player_id} took {result.get('damage', 0)} damage")

        return result

    def get_player_currencies(self, player_id: int) -> Dict[str, int]:
        """
        Retorna moedas do player.

        Args:
            player_id: ID do player

        Returns:
            Dict com ouro, cristais, ampulhetas
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        return {
            'gold': player.run_gold,
            'crystals': player.crystals,
            'hourglasses': player.eternal_hourglasses
        }
