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
        Processa derrota do inimigo (usa PlayerProgress).

        Args:
            player_id: ID do player
            enemy_id: ID do inimigo derrotado

        Returns:
            Dict com recompensas e info
        """
        from models import PlayerProgress, EnemyTheme, GenericEnemy
        from routes.battle_modules.enemy_generation import generate_enemy_by_theme, ensure_minimum_enemies, get_minimum_enemy_count

        player = self.player_repo.get_by_id_or_fail(player_id)

        # Obter progresso
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if not progress:
            progress = PlayerProgress(player_id=player_id)
            db.session.add(progress)

        # Gerar inimigos iniciais se necessário
        if GenericEnemy.query.filter_by(is_available=True).count() == 0:
            themes = EnemyTheme.query.all()
            if themes:
                for i in range(3):
                    theme = themes[i % len(themes)]
                    generate_enemy_by_theme(theme.id, 1)

        # Incrementar contador (usa PlayerProgress, não Player!)
        progress.generic_enemies_defeated += 1
        progress.current_boss_phase += 1

        # Verificar milestone de boss
        is_boss_milestone = progress.generic_enemies_defeated % 20 == 0

        # Resetar fase se passou de 20
        if progress.current_boss_phase > 20:
            progress.current_boss_phase = 1

        # Garantir mínimo de inimigos
        if not is_boss_milestone:
            available_count = GenericEnemy.query.filter_by(is_available=True).count()
            minimum_required = get_minimum_enemy_count(player_id)

            if available_count < minimum_required:
                ensure_minimum_enemies(progress, minimum_required)

        # Limpar seleção em milestone
        if is_boss_milestone:
            progress.selected_enemy_id = None

        db.session.commit()

        logger.info(f"Player {player_id} defeated enemy. Total: {progress.generic_enemies_defeated}")

        return {
            'enemy_defeated': True,
            'enemies_defeated': progress.generic_enemies_defeated,
            'is_boss_milestone': is_boss_milestone,
            'message': 'Boss milestone atingido!' if is_boss_milestone else 'Inimigo derrotado!'
        }
