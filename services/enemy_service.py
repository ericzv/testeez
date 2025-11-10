"""
Enemy Service - Lógica de geração e gerenciamento de inimigos
"""

from typing import List, Dict, Any
from database import db
from repositories.enemy_repository import EnemyRepository
from repositories.player_repository import PlayerRepository
from core.logging_config import get_logger

logger = get_logger(__name__)


class EnemyService:
    """Serviço de gerenciamento de inimigos"""

    def __init__(self):
        self.enemy_repo = EnemyRepository()
        self.player_repo = PlayerRepository()

    def generate_enemies_for_player(self, player_id: int, count: int = 3) -> List:
        """
        Gera N inimigos aleatórios para o player escolher.

        Args:
            player_id: ID do player
            count: Quantidade de inimigos a gerar

        Returns:
            Lista de inimigos gerados
        """
        from routes.battle_modules import generate_enemy_by_theme

        player = self.player_repo.get_by_id_or_fail(player_id)

        enemies = []
        for i in range(count):
            # Gerar inimigo usando sistema existente
            enemy = generate_enemy_by_theme(player_id, player.enemies_defeated + 1)
            enemies.append(enemy)

        db.session.commit()

        logger.info(f"Generated {count} enemies for player {player_id}")
        return enemies

    def get_available_enemies(self, player_id: int) -> List:
        """
        Retorna lista de inimigos disponíveis para seleção.

        Args:
            player_id: ID do player

        Returns:
            Lista de inimigos disponíveis
        """
        return self.enemy_repo.get_available_enemies(player_id)

    def select_enemy_for_battle(self, player_id: int, enemy_id: int) -> Dict[str, Any]:
        """
        Seleciona um inimigo para batalha.

        Args:
            player_id: ID do player
            enemy_id: ID do inimigo

        Returns:
            Dict com info do inimigo selecionado
        """
        self.enemy_repo.select_enemy(player_id, enemy_id)
        enemy = self.enemy_repo.get_current_enemy(player_id)

        db.session.commit()

        logger.info(f"Player {player_id} selected enemy {enemy_id}")

        return {
            'id': enemy.id,
            'name': enemy.name,
            'hp': enemy.hp,
            'max_hp': enemy.max_hp,
            'number': getattr(enemy, 'enemy_number', 0)
        }

    def handle_enemy_defeat(self, player_id: int, enemy_id: int) -> Dict[str, Any]:
        """
        Processa derrota do inimigo.

        Args:
            player_id: ID do player
            enemy_id: ID do inimigo derrotado

        Returns:
            Dict com recompensas e info
        """
        player = self.player_repo.get_by_id_or_fail(player_id)
        enemy = self.enemy_repo.get_current_enemy_or_fail(player_id)

        # Marcar como derrotado
        self.enemy_repo.mark_as_defeated(enemy)

        # Atualizar contador do player
        player.enemies_defeated += 1

        # Aplicar hooks de relíquias (on_kill)
        from routes.relics.hooks import trigger_relic_hooks
        trigger_relic_hooks(player_id, 'on_kill', {'enemy': enemy})

        db.session.commit()

        logger.info(f"Player {player_id} defeated enemy {enemy_id}")

        return {
            'enemy_defeated': True,
            'total_enemies_defeated': player.enemies_defeated
        }
