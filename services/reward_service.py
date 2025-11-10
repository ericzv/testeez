"""
Reward Service - Lógica de recompensas (cristais, ouro, ampulhetas, lembranças)
"""

from typing import Dict, Any
from database import db
from repositories.player_repository import PlayerRepository
from core.logging_config import get_logger

logger = get_logger(__name__)


class RewardService:
    """Serviço de recompensas"""

    def __init__(self):
        self.player_repo = PlayerRepository()

    def apply_victory_rewards(self, player_id: int, enemy_data: Dict) -> Dict[str, Any]:
        """
        Aplica recompensas de vitória.

        Args:
            player_id: ID do player
            enemy_data: Dados do inimigo derrotado

        Returns:
            Dict com recompensas aplicadas
        """
        from routes.battle_modules import (
            determine_enemy_reward_type,
            calculate_gold_reward,
            calculate_hourglass_reward
        )

        player = self.player_repo.get_by_id_or_fail(player_id)

        # Determinar tipo de recompensa
        reward_type = determine_enemy_reward_type()

        # Calcular valores
        enemy_number = enemy_data.get('number', player.enemies_defeated)
        rarity = enemy_data.get('rarity', 1)
        equipment_bonus = 0  # TODO: calcular

        rewards = {
            'exp': 0,  # Sistema de XP deprecated
            'crystals': 0,
            'gold': 0,
            'hourglasses': 0
        }

        # Aplicar recompensa baseado no tipo
        if reward_type == 'crystals':
            crystals = 1 + (enemy_number // 10)  # +1 a cada 10 inimigos
            player.crystals += crystals
            player.run_crystals_gained += crystals
            rewards['crystals'] = crystals

        elif reward_type == 'gold':
            gold = calculate_gold_reward(enemy_number, rarity, equipment_bonus)
            player.run_gold += gold
            player.run_gold_gained += gold
            rewards['gold'] = gold

        elif reward_type == 'hourglasses':
            hourglasses = calculate_hourglass_reward(rarity)
            player.eternal_hourglasses += hourglasses
            player.run_hourglasses_gained += hourglasses
            rewards['hourglasses'] = hourglasses

        # Aplicar hooks de relíquias (on_rewards)
        from routes.relics.hooks import trigger_relic_hooks
        trigger_relic_hooks(player_id, 'on_rewards', {
            'event': 'rewards',
            'rewards': rewards
        })

        db.session.commit()

        logger.info(f"Rewards applied to player {player_id}: {rewards}")

        return rewards

    def grant_gold(self, player_id: int, amount: int) -> None:
        """
        Concede ouro ao player.

        Args:
            player_id: ID do player
            amount: Quantidade de ouro
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        player.run_gold += amount
        player.run_gold_gained += amount

        db.session.commit()

        logger.info(f"Granted {amount} gold to player {player_id}")

    def grant_crystals(self, player_id: int, amount: int) -> None:
        """
        Concede cristais ao player.

        Args:
            player_id: ID do player
            amount: Quantidade de cristais
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        player.crystals += amount
        player.run_crystals_gained += amount

        db.session.commit()

        logger.info(f"Granted {amount} crystals to player {player_id}")

    def grant_hourglasses(self, player_id: int, amount: int) -> None:
        """
        Concede ampulhetas ao player.

        Args:
            player_id: ID do player
            amount: Quantidade de ampulhetas
        """
        player = self.player_repo.get_by_id_or_fail(player_id)

        player.eternal_hourglasses += amount
        player.run_hourglasses_gained += amount

        db.session.commit()

        logger.info(f"Granted {amount} hourglasses to player {player_id}")
