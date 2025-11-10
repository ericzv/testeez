"""
Repository Pattern para Player
Abstrai todo acesso ao banco de dados relacionado a Players
"""

from typing import Optional
from database import db
from models import Player
from core.exceptions.game_exceptions import PlayerNotFoundException


class PlayerRepository:
    """Gerencia persistência de Players"""

    @staticmethod
    def get_by_id(player_id: int) -> Optional[Player]:
        """
        Busca player por ID.

        Args:
            player_id: ID do player

        Returns:
            Player ou None se não encontrado
        """
        return Player.query.get(player_id)

    @staticmethod
    def get_by_id_or_fail(player_id: int) -> Player:
        """
        Busca player por ID ou levanta exceção.

        Args:
            player_id: ID do player

        Returns:
            Player

        Raises:
            PlayerNotFoundException: Se player não existir
        """
        player = Player.query.get(player_id)
        if not player:
            raise PlayerNotFoundException(player_id)
        return player

    @staticmethod
    def get_first() -> Optional[Player]:
        """
        Retorna o primeiro player (para testes/single-player).

        Returns:
            Player ou None
        """
        return Player.query.first()

    @staticmethod
    def create(character_id: int, **kwargs) -> Player:
        """
        Cria novo player.

        Args:
            character_id: ID do personagem escolhido
            **kwargs: Atributos adicionais

        Returns:
            Player criado
        """
        player = Player(character_id=character_id, **kwargs)
        db.session.add(player)
        db.session.flush()  # Garante que tem ID antes de retornar
        return player

    @staticmethod
    def save(player: Player) -> Player:
        """
        Salva alterações no player.

        Args:
            player: Player a ser salvo

        Returns:
            Player salvo
        """
        db.session.add(player)
        db.session.flush()
        return player

    @staticmethod
    def delete(player: Player) -> None:
        """
        Deleta player.

        Args:
            player: Player a ser deletado
        """
        db.session.delete(player)
        db.session.flush()

    @staticmethod
    def update_hp(player_id: int, new_hp: int) -> None:
        """
        Atualiza HP do player.

        Args:
            player_id: ID do player
            new_hp: Novo valor de HP
        """
        player = PlayerRepository.get_by_id_or_fail(player_id)
        player.hp = max(0, min(new_hp, player.max_hp))  # Clamp entre 0 e max_hp
        db.session.flush()

    @staticmethod
    def update_energy(player_id: int, new_energy: int) -> None:
        """
        Atualiza energia do player.

        Args:
            player_id: ID do player
            new_energy: Novo valor de energia
        """
        player = PlayerRepository.get_by_id_or_fail(player_id)
        player.energy = max(0, min(new_energy, player.max_energy))  # Clamp entre 0 e max_energy
        db.session.flush()

    @staticmethod
    def add_experience(player_id: int, exp: int) -> dict:
        """
        Adiciona experiência ao player e processa level ups.

        Args:
            player_id: ID do player
            exp: Experiência a adicionar

        Returns:
            Dict com info do level up: {'leveled_up': bool, 'new_level': int, 'attribute_points': int}
        """
        from core.formulas import get_exp_for_next_level
        from core.constants.game_constants import ATTRIBUTE_POINTS_PER_LEVEL

        player = PlayerRepository.get_by_id_or_fail(player_id)

        player.experience += exp
        leveled_up = False
        levels_gained = 0

        # Processar level ups
        while player.experience >= get_exp_for_next_level(player.level):
            player.experience -= get_exp_for_next_level(player.level)
            player.level += 1
            player.attribute_points += ATTRIBUTE_POINTS_PER_LEVEL
            leveled_up = True
            levels_gained += 1

        db.session.flush()

        return {
            'leveled_up': leveled_up,
            'levels_gained': levels_gained,
            'new_level': player.level,
            'attribute_points': player.attribute_points
        }
