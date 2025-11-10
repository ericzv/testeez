"""
Rotas de batalha REFATORADAS
Exemplo de como usar Service Layer + Repository Pattern + Validação

DIFERENÇAS da versão antiga:
- Apenas 200 linhas (vs 3185 linhas)
- Lógica desacoplada do Flask
- Validação de inputs
- Logging adequado
- Exception handling específico
- Transações adequadas
- Fácil de testar

NOTA: Este arquivo é um EXEMPLO. A versão completa requer migrar
todas as rotas do battle.py antigo.
"""

from flask import Blueprint, request, jsonify, session
from core.logging_config import get_logger
from core.validators import DAMAGE_BOSS_VALIDATOR, SELECT_ENEMY_VALIDATOR
from core.exceptions.game_exceptions import (
    GameException,
    PlayerNotFoundException,
    PlayerNotAuthenticatedException,
    InsufficientEnergyException,
    SkillNotFoundException,
    NoActiveEnemyException,
    EnemyAlreadyDeadException,
    ValidationException
)
from services.battle_service import BattleService
from repositories.player_repository import PlayerRepository
from repositories.enemy_repository import EnemyRepository

# Logger
logger = get_logger(__name__)

# Blueprint
battle_refactored_bp = Blueprint('battle_refactored', __name__, url_prefix='/api/v2')

# Services (idealmente injeção de dependência, mas simplificado aqui)
battle_service = BattleService()
player_repo = PlayerRepository()
enemy_repo = EnemyRepository()


def get_authenticated_player_id() -> int:
    """
    Retorna ID do player autenticado.

    Returns:
        player_id

    Raises:
        PlayerNotAuthenticatedException: Se não autenticado
    """
    player_id = session.get('player_id')
    if not player_id:
        # Para single-player, pegar o primeiro
        player = player_repo.get_first()
        if not player:
            raise PlayerNotAuthenticatedException()
        return player.id

    return player_id


@battle_refactored_bp.errorhandler(GameException)
def handle_game_exception(error: GameException):
    """
    Handler global para exceções do jogo.
    Converte exceções customizadas em respostas HTTP apropriadas.
    """
    logger.warning(f"Game exception: {error.message}", exc_info=True)
    return jsonify({
        'success': False,
        'error': error.message,
        'code': error.code
    }), error.code


@battle_refactored_bp.errorhandler(Exception)
def handle_unexpected_exception(error: Exception):
    """
    Handler para exceções não esperadas.
    Loga stack trace completo e retorna erro genérico.
    """
    logger.exception("Unexpected error in battle API")
    return jsonify({
        'success': False,
        'error': 'Erro interno do servidor',
        'code': 500
    }), 500


@battle_refactored_bp.route('/damage_boss', methods=['POST'])
def damage_boss():
    """
    Executa ataque ao inimigo atual.

    Request JSON:
        {
            "skill_id": int
        }

    Response JSON:
        {
            "success": true,
            "damage": int,
            "is_critical": bool,
            "lifesteal": int,
            "enemy_died": bool,
            "player_hp": int,
            "player_energy": int,
            "enemy_hp": int
        }

    Errors:
        400: Validação falhou, energia insuficiente, inimigo morto
        401: Não autenticado
        404: Player, skill ou inimigo não encontrado
        500: Erro interno
    """
    # 1. Obter player autenticado
    player_id = get_authenticated_player_id()

    # 2. Validar input
    data = DAMAGE_BOSS_VALIDATOR.validate(request.json or {})
    skill_id = data['skill_id']

    logger.info(f"Player {player_id} attacking with skill {skill_id}")

    # 3. Executar ataque via service (toda lógica de negócio aqui)
    result = battle_service.execute_attack(player_id, skill_id)

    # 4. Buscar estados atualizados para resposta
    player = player_repo.get_by_id(player_id)
    enemy = enemy_repo.get_current_enemy(player_id)

    logger.info(
        f"Attack result: {result.damage} damage, "
        f"critical={result.is_critical}, enemy_died={result.enemy_died}"
    )

    # 5. Retornar resposta
    return jsonify({
        'success': True,
        'damage': result.damage,
        'is_critical': result.is_critical,
        'lifesteal': result.lifesteal,
        'enemy_died': result.enemy_died,
        'player_hp': player.hp,
        'player_max_hp': player.max_hp,
        'player_energy': player.energy,
        'player_max_energy': player.max_energy,
        'enemy_hp': enemy.hp if enemy else 0,
        'enemy_max_hp': enemy.max_hp if enemy else 0,
        'breakdown': result.breakdown
    })


@battle_refactored_bp.route('/select_enemy', methods=['POST'])
def select_enemy():
    """
    Seleciona um inimigo para batalha.

    Request JSON:
        {
            "enemy_id": int
        }

    Response JSON:
        {
            "success": true,
            "enemy": {
                "id": int,
                "name": str,
                "hp": int,
                "max_hp": int,
                ...
            }
        }

    Errors:
        400: Validação falhou
        401: Não autenticado
        404: Inimigo não encontrado
        500: Erro interno
    """
    # 1. Autenticar
    player_id = get_authenticated_player_id()

    # 2. Validar
    data = SELECT_ENEMY_VALIDATOR.validate(request.json or {})
    enemy_id = data['enemy_id']

    logger.info(f"Player {player_id} selecting enemy {enemy_id}")

    # 3. Selecionar via repository
    enemy_repo.select_enemy(player_id, enemy_id)

    # 4. Buscar inimigo selecionado
    enemy = enemy_repo.get_current_enemy(player_id)

    # 5. Resetar estado de batalha
    battle_service.reset_battle_state(player_id)

    logger.info(f"Enemy {enemy_id} selected successfully")

    # 6. Retornar
    return jsonify({
        'success': True,
        'enemy': {
            'id': enemy.id,
            'name': enemy.name,
            'hp': enemy.hp,
            'max_hp': enemy.max_hp,
            'number': getattr(enemy, 'enemy_number', 0)
        }
    })


@battle_refactored_bp.route('/player/regenerate_energy', methods=['POST'])
def regenerate_energy():
    """
    Regenera energia do player (início de turno).

    Response JSON:
        {
            "success": true,
            "energy": int,
            "max_energy": int
        }
    """
    # 1. Autenticar
    player_id = get_authenticated_player_id()

    # 2. Regenerar via service
    new_energy = battle_service.regenerate_energy(player_id)

    # 3. Buscar player atualizado
    player = player_repo.get_by_id(player_id)

    logger.debug(f"Player {player_id} energy regenerated: {new_energy}/{player.max_energy}")

    # 4. Retornar
    return jsonify({
        'success': True,
        'energy': player.energy,
        'max_energy': player.max_energy
    })


# ===== EXEMPLO DE TESTE UNITÁRIO (comentado) =====

"""
# tests/unit/test_battle_service.py

import pytest
from services.battle_service import BattleService
from repositories.player_repository import PlayerRepository
from repositories.enemy_repository import EnemyRepository
from core.exceptions.game_exceptions import InsufficientEnergyException

def test_execute_attack_success(db_session):
    '''Testa ataque bem-sucedido'''
    # Arrange
    service = BattleService()
    player_id = create_test_player(hp=100, energy=10)
    enemy_id = create_test_enemy(hp=50)
    skill_id = create_test_skill(damage=20, cost=5)

    # Act
    result = service.execute_attack(player_id, skill_id)

    # Assert
    assert result.damage > 0
    assert result.enemy_died == False

    # Verificar estado
    player = PlayerRepository.get_by_id(player_id)
    enemy = EnemyRepository.get_generic_by_id(enemy_id)

    assert player.energy == 5  # Gastou 5
    assert enemy.hp == 30  # Perdeu 20

def test_execute_attack_insufficient_energy(db_session):
    '''Testa ataque sem energia'''
    # Arrange
    service = BattleService()
    player_id = create_test_player(energy=2)
    skill_id = create_test_skill(cost=5)

    # Act & Assert
    with pytest.raises(InsufficientEnergyException):
        service.execute_attack(player_id, skill_id)
"""
