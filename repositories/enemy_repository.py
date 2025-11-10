"""
Repository Pattern para Enemies e Bosses
Abstrai acesso ao banco de dados relacionado a inimigos
"""

from typing import Optional, Union, List
from database import db
from models import GenericEnemy, LastBoss, PlayerProgress
from core.exceptions.game_exceptions import EnemyNotFoundException, NoActiveEnemyException


class EnemyRepository:
    """Gerencia persistência de Enemies"""

    @staticmethod
    def get_generic_by_id(enemy_id: int) -> Optional[GenericEnemy]:
        """Busca inimigo genérico por ID"""
        return GenericEnemy.query.get(enemy_id)

    @staticmethod
    def get_boss_by_id(boss_id: int) -> Optional[LastBoss]:
        """Busca boss por ID"""
        return LastBoss.query.get(boss_id)

    @staticmethod
    def get_current_enemy(player_id: int) -> Optional[Union[GenericEnemy, LastBoss]]:
        """
        Retorna o inimigo atual da batalha do player.

        Args:
            player_id: ID do player

        Returns:
            GenericEnemy, LastBoss ou None
        """
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if not progress:
            return None

        # Prioridade 1: Boss selecionado
        if progress.selected_boss_id:
            boss = LastBoss.query.get(progress.selected_boss_id)
            if boss and boss.is_active:
                return boss
            else:
                # Boss não está mais ativo, limpar seleção
                progress.selected_boss_id = None
                db.session.flush()

        # Prioridade 2: Inimigo genérico selecionado
        if progress.selected_enemy_id:
            enemy = GenericEnemy.query.get(progress.selected_enemy_id)
            if enemy and enemy.is_available:
                return enemy
            else:
                # Inimigo não está mais disponível, limpar seleção
                progress.selected_enemy_id = None
                db.session.flush()

        return None

    @staticmethod
    def get_current_enemy_or_fail(player_id: int) -> Union[GenericEnemy, LastBoss]:
        """
        Retorna o inimigo atual ou levanta exceção.

        Args:
            player_id: ID do player

        Returns:
            GenericEnemy ou LastBoss

        Raises:
            NoActiveEnemyException: Se não houver inimigo selecionado
        """
        enemy = EnemyRepository.get_current_enemy(player_id)
        if not enemy:
            raise NoActiveEnemyException()
        return enemy

    @staticmethod
    def get_available_enemies(player_id: int) -> List[GenericEnemy]:
        """
        Retorna lista de inimigos disponíveis para seleção (globais).

        Args:
            player_id: ID do player (não usado, inimigos são globais)

        Returns:
            Lista de GenericEnemy disponíveis
        """
        return GenericEnemy.query.filter_by(
            is_available=True
        ).order_by(GenericEnemy.enemy_number).all()

    @staticmethod
    def create_generic_enemy(player_id: int, **kwargs) -> GenericEnemy:
        """
        Cria novo inimigo genérico (inimigos são globais, não por player).

        Args:
            player_id: ID do player (não usado, inimigos são globais)
            **kwargs: Atributos do inimigo

        Returns:
            GenericEnemy criado
        """
        enemy = GenericEnemy(**kwargs)
        db.session.add(enemy)
        db.session.flush()
        return enemy

    @staticmethod
    def select_enemy(player_id: int, enemy_id: int) -> None:
        """
        Seleciona um inimigo para batalha.

        Args:
            player_id: ID do player
            enemy_id: ID do inimigo

        Raises:
            EnemyNotFoundException: Se inimigo não existir ou não estiver disponível
        """
        enemy = GenericEnemy.query.get(enemy_id)
        if not enemy or not enemy.is_available:
            raise EnemyNotFoundException(enemy_id)

        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if not progress:
            progress = PlayerProgress(player_id=player_id)
            db.session.add(progress)

        progress.selected_enemy_id = enemy_id
        progress.selected_boss_id = None  # Limpar boss se houver
        db.session.flush()

    @staticmethod
    def update_hp(enemy: Union[GenericEnemy, LastBoss], new_hp: int) -> None:
        """
        Atualiza HP do inimigo.

        Args:
            enemy: Inimigo a atualizar
            new_hp: Novo valor de HP
        """
        enemy.hp = max(0, min(new_hp, enemy.max_hp))
        db.session.flush()

    @staticmethod
    def mark_as_defeated(enemy: Union[GenericEnemy, LastBoss]) -> None:
        """
        Marca inimigo como derrotado.

        Args:
            enemy: Inimigo derrotado
        """
        enemy.hp = 0

        if isinstance(enemy, GenericEnemy):
            enemy.is_available = False
            enemy.is_defeated = True
        elif isinstance(enemy, LastBoss):
            enemy.is_active = False

        db.session.flush()

    @staticmethod
    def delete_enemy(enemy: Union[GenericEnemy, LastBoss]) -> None:
        """
        Deleta inimigo do banco.

        Args:
            enemy: Inimigo a deletar
        """
        db.session.delete(enemy)
        db.session.flush()
