"""
routes/battle.py - VERSÃO REFATORADA
Sistema de batalha usando Services + Repositories

REDUÇÃO: ~3185 linhas → ~800 linhas (75% menor)
BENEFÍCIOS:
- Lógica delegada aos services
- Rotas apenas fazem validação HTTP
- Fácil de testar e manter
- Compatível com código existente
"""

# ===== IMPORTS PADRÃO =====
import json
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify

# ===== IMPORTS CORE =====
from database import db
from core.logging_config import get_logger
from core.exceptions.game_exceptions import GameException, NoActiveEnemyException
from core.validators import DAMAGE_BOSS_VALIDATOR, SELECT_ENEMY_VALIDATOR

# ===== IMPORTS SERVICES =====
from services.battle_service import BattleService
from services.enemy_service import EnemyService
from services.reward_service import RewardService
from services.player_service import PlayerService

# ===== IMPORTS REPOSITORIES =====
from repositories.player_repository import PlayerRepository
from repositories.enemy_repository import EnemyRepository

# ===== IMPORTS MODELS =====
from models import Player, GenericEnemy, LastBoss, PlayerProgress

# ===== IMPORTS MÓDULOS EXISTENTES (manter compatibilidade) =====
from routes.battle_modules import (
    generate_enemy_by_theme, ensure_minimum_enemies,
    initialize_enemy_themes, check_login_rewards,
    register_memory_routes, initialize_game_for_new_player
)
from routes.battle_cache import calculate_attack_cache, get_cached_attack, get_cached_defense
from characters import get_player_attacks, get_player_specials, use_special_skill

# ===== SETUP =====
logger = get_logger(__name__)
battle_bp = Blueprint('battle', __name__, url_prefix='/gamification')

# Instanciar services
battle_service = BattleService()
enemy_service = EnemyService()
reward_service = RewardService()
player_service = PlayerService()
player_repo = PlayerRepository()
enemy_repo = EnemyRepository()

# Registrar rotas de memórias (compatibilidade)
register_memory_routes(battle_bp)


# ===== ERROR HANDLERS =====

@battle_bp.errorhandler(GameException)
def handle_game_exception(error: GameException):
    """Handler para exceções do jogo"""
    logger.warning(f"Game exception: {error.message}", exc_info=True)
    return jsonify({
        'success': False,
        'error': error.message,
        'code': error.code
    }), error.code


# ===== HELPERS =====

def get_authenticated_player_id() -> int:
    """Retorna ID do player autenticado (ou primeiro para single-player)"""
    player = player_repo.get_first()
    if not player:
        from core.exceptions.game_exceptions import PlayerNotFoundException
        raise PlayerNotFoundException()
    return player.id


def get_current_battle_enemy(player_id: int):
    """Retorna o inimigo atual da batalha"""
    return enemy_repo.get_current_enemy(player_id)


# ===== ROTAS PRINCIPAIS =====

@battle_bp.route("")
def gamification():
    """Main gamification hub page"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)

        if not player or not player.character_id:
            return redirect(url_for('choose_character_route'))

        # Inicializar temas e progresso
        initialize_enemy_themes()
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if not progress:
            progress = initialize_game_for_new_player(player_id)

        # Check login rewards
        check_login_rewards(player_id)

        # Buscar estado atual
        enemy = get_current_battle_enemy(player_id)
        available_enemies = enemy_service.get_available_enemies(player_id)

        return render_template(
            'gamification/hub.html',
            player=player,
            enemy=enemy,
            available_enemies=available_enemies
        )

    except Exception as e:
        logger.exception("Error in gamification hub")
        return str(e), 500


@battle_bp.route("/battle")
def battle():
    """Battle page"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return redirect(url_for('battle.gamification'))

        # Recalcular cache se necessário
        calculate_attack_cache(player_id)

        return render_template(
            'gamification/battle.html',
            player=player,
            enemy=enemy
        )

    except Exception as e:
        logger.exception("Error in battle page")
        return str(e), 500


@battle_bp.route("/api/damage_boss", methods=['POST'])
def damage_boss():
    """
    Executa ataque ao boss/inimigo.
    REFATORADO: Usa BattleService
    """
    try:
        # 1. Autenticar e validar
        player_id = get_authenticated_player_id()
        data = DAMAGE_BOSS_VALIDATOR.validate(request.json or {})
        skill_id = data['skill_id']

        logger.info(f"Player {player_id} attacking with skill {skill_id}")

        # 2. Executar ataque via service
        result = battle_service.execute_attack(player_id, skill_id)

        # 3. Buscar estados atualizados
        player = player_repo.get_by_id(player_id)
        enemy = enemy_repo.get_current_enemy(player_id)

        # 4. Se inimigo morreu, processar derrota
        if result.enemy_died:
            defeat_result = enemy_service.handle_enemy_defeat(player_id, enemy.id)
            rewards = reward_service.apply_victory_rewards(player_id, {
                'number': getattr(enemy, 'enemy_number', player.enemies_defeated),
                'rarity': getattr(enemy, 'rarity', 1)
            })
        else:
            rewards = None

        logger.info(f"Attack result: {result.damage} damage, critical={result.is_critical}, enemy_died={result.enemy_died}")

        # 5. Retornar resposta
        return jsonify({
            'success': True,
            'damage': result.damage,
            'is_critical': result.is_critical,
            'lifesteal': result.lifesteal,
            'enemy_died': result.enemy_died,
            'rewards': rewards,
            'player': {
                'hp': player.hp,
                'max_hp': player.max_hp,
                'energy': player.energy,
                'max_energy': player.max_energy,
                'barrier': getattr(player, 'barrier', 0)
            },
            'enemy': {
                'hp': enemy.hp if enemy and not result.enemy_died else 0,
                'max_hp': enemy.max_hp if enemy else 0
            } if enemy else None,
            'breakdown': result.breakdown
        })

    except GameException as e:
        return jsonify({'success': False, 'error': str(e)}), e.code
    except Exception as e:
        logger.exception("Error in damage_boss")
        return jsonify({'success': False, 'error': 'Erro interno'}), 500


@battle_bp.route("/api/select_enemy", methods=['POST'])
def select_enemy():
    """
    Seleciona inimigo para batalha.
    REFATORADO: Usa EnemyService
    """
    try:
        player_id = get_authenticated_player_id()
        data = SELECT_ENEMY_VALIDATOR.validate(request.json or {})
        enemy_id = data['enemy_id']

        logger.info(f"Player {player_id} selecting enemy {enemy_id}")

        # Selecionar via service
        enemy_info = enemy_service.select_enemy_for_battle(player_id, enemy_id)

        # Resetar estado de batalha
        battle_service.reset_battle_state(player_id)

        # Recalcular cache
        calculate_attack_cache(player_id)

        return jsonify({
            'success': True,
            'enemy': enemy_info
        })

    except GameException as e:
        return jsonify({'success': False, 'error': str(e)}), e.code
    except Exception as e:
        logger.exception("Error in select_enemy")
        return jsonify({'success': False, 'error': 'Erro interno'}), 500


@battle_bp.route("/api/generate_enemies", methods=['POST'])
def generate_initial_enemies():
    """
    Gera inimigos iniciais.
    REFATORADO: Usa EnemyService
    """
    try:
        player_id = get_authenticated_player_id()

        # Verificar mínimo de inimigos
        ensure_minimum_enemies(player_id)

        enemies = enemy_service.get_available_enemies(player_id)

        return jsonify({
            'success': True,
            'enemies': [{
                'id': e.id,
                'name': e.name,
                'hp': e.hp,
                'max_hp': e.max_hp,
                'number': e.enemy_number
            } for e in enemies]
        })

    except Exception as e:
        logger.exception("Error generating enemies")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/get_available_enemies", methods=['GET'])
def get_available_enemies():
    """Retorna inimigos disponíveis"""
    try:
        player_id = get_authenticated_player_id()
        enemies = enemy_service.get_available_enemies(player_id)

        return jsonify({
            'success': True,
            'enemies': [{
                'id': e.id,
                'name': e.name,
                'hp': e.hp,
                'max_hp': e.max_hp,
                'number': e.enemy_number,
                'theme': e.theme_id
            } for e in enemies]
        })

    except Exception as e:
        logger.exception("Error getting available enemies")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/get_battle_data", methods=['GET'])
def get_battle_data():
    """Retorna dados completos da batalha"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)
        enemy = enemy_repo.get_current_enemy(player_id)

        if not enemy:
            raise NoActiveEnemyException()

        # Buscar skills do cache
        attacks = get_player_attacks(player_id)

        return jsonify({
            'success': True,
            'player': {
                'id': player.id,
                'hp': player.hp,
                'max_hp': player.max_hp,
                'energy': player.energy,
                'max_energy': player.max_energy,
                'barrier': getattr(player, 'barrier', 0)
            },
            'enemy': {
                'id': enemy.id,
                'name': enemy.name,
                'hp': enemy.hp,
                'max_hp': enemy.max_hp,
                'number': getattr(enemy, 'enemy_number', 0)
            },
            'attacks': attacks
        })

    except GameException as e:
        return jsonify({'success': False, 'error': str(e)}), e.code
    except Exception as e:
        logger.exception("Error getting battle data")
        return jsonify({'success': False, 'error': 'Erro interno'}), 500


@battle_bp.route("/api/player_attacks", methods=['GET'])
def player_attacks():
    """Retorna ataques do player"""
    try:
        player_id = get_authenticated_player_id()
        attacks = get_player_attacks(player_id)

        return jsonify({
            'success': True,
            'attacks': attacks
        })

    except Exception as e:
        logger.exception("Error getting player attacks")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/player_specials", methods=['GET'])
def player_specials():
    """Retorna skills especiais do player"""
    try:
        player_id = get_authenticated_player_id()
        specials = get_player_specials(player_id)

        return jsonify({
            'success': True,
            'specials': specials
        })

    except Exception as e:
        logger.exception("Error getting player specials")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/use_special", methods=['POST'])
def use_special():
    """Usa skill especial"""
    try:
        player_id = get_authenticated_player_id()
        data = request.json or {}
        special_id = data.get('special_id')

        if not special_id:
            return jsonify({'success': False, 'error': 'special_id obrigatório'}), 400

        # Usar função existente
        result = use_special_skill(player_id, special_id)

        return jsonify({
            'success': True,
            'result': result
        })

    except Exception as e:
        logger.exception("Error using special")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/get_player_currencies", methods=['GET'])
def get_player_currencies():
    """
    Retorna moedas do player.
    REFATORADO: Usa PlayerService
    """
    try:
        player_id = get_authenticated_player_id()
        currencies = player_service.get_player_currencies(player_id)

        return jsonify({
            'success': True,
            'currencies': currencies
        })

    except Exception as e:
        logger.exception("Error getting currencies")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/api/reset_run", methods=['POST'])
def reset_run():
    """
    Reseta a run do player.
    REFATORADO: Usa PlayerService
    """
    try:
        player_id = get_authenticated_player_id()

        logger.info(f"Resetting run for player {player_id}")

        # Resetar via service
        player_service.reset_run(player_id)

        # Recalcular cache
        calculate_attack_cache(player_id)

        return jsonify({
            'success': True,
            'message': 'Run resetada com sucesso'
        })

    except Exception as e:
        logger.exception("Error resetting run")
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ROTAS DE COMBATE E TURNOS =====

@battle_bp.route("/boss_defeated", methods=['POST'])
def boss_defeated():
    """
    Processa derrota de inimigo.
    REFATORADO: Usa EnemyService
    """
    try:
        player_id = get_authenticated_player_id()

        logger.info(f"Processing enemy defeat for player {player_id}")

        # Processar derrota via service
        result = enemy_service.handle_enemy_defeat(player_id, None)  # None = current enemy

        # Gerar novos inimigos se necessário
        ensure_minimum_enemies(player_id)

        return jsonify({
            'success': True,
            'enemies_defeated': result.get('enemies_defeated', 0),
            'is_boss_milestone': result.get('is_boss_milestone', False),
            'message': result.get('message', 'Inimigo derrotado!')
        })

    except Exception as e:
        logger.exception("Error in boss_defeated")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/get_run_statistics", methods=['GET'])
def get_run_statistics():
    """Retorna estatísticas da run atual"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)

        progress = PlayerProgress.query.filter_by(player_id=player_id).first()

        return jsonify({
            'success': True,
            'gold_gained': player.run_gold_gained,
            'crystals_gained': player.run_crystals_gained,
            'hourglasses_gained': player.run_hourglasses_gained,
            'enemies_defeated': progress.generic_enemies_defeated if progress else 0,
            'max_damage_dealt': getattr(player, 'max_damage_dealt', 0)
        })

    except Exception as e:
        logger.exception("Error getting run statistics")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/select_boss", methods=['POST'])
def select_boss():
    """Seleciona boss para batalha"""
    try:
        player_id = get_authenticated_player_id()
        data = request.json or {}
        boss_id = data.get('boss_id')

        if not boss_id:
            return jsonify({'success': False, 'error': 'boss_id obrigatório'}), 400

        logger.info(f"Player {player_id} selecting boss {boss_id}")

        # Selecionar boss
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if progress:
            progress.selected_boss_id = boss_id
            progress.selected_enemy_id = None  # Limpar inimigo genérico
            db.session.commit()

        # Resetar estado de batalha
        battle_service.reset_battle_state(player_id)

        return jsonify({'success': True})

    except Exception as e:
        logger.exception("Error selecting boss")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/end_player_turn", methods=['POST'])
def end_player_turn():
    """Processa turno do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo em combate'}), 404

        from routes.battle_modules.battle_turns import process_enemy_turn

        logger.info(f"Processing enemy turn for {enemy.name}")

        result = process_enemy_turn(enemy, player_id=player_id)

        return jsonify({
            'success': True,
            'message': f'Turno processado: {result["num_actions"]} ação(ões)',
            'enemy_name': enemy.name,
            'num_actions': result['num_actions'],
            'actions': result['actions'],
            'has_actions': result['action_queue_size'] > 0 or result['buff_debuff_queue_size'] > 0
        })

    except Exception as e:
        logger.exception("Error processing enemy turn")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/enemy_attack_status", methods=['GET'])
def enemy_attack_status_route():
    """Retorna status de ataques do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo em combate'}), 404

        from routes.enemy_attacks import get_enemy_attack_status
        status = get_enemy_attack_status(player_id)

        import json
        status['action_pattern'] = json.loads(enemy.action_pattern) if enemy.action_pattern else []
        status['current_action_index'] = enemy.current_action_index

        return jsonify({'success': True, 'status': status})

    except Exception as e:
        logger.exception("Error getting enemy attack status")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/execute_enemy_attack", methods=['POST'])
def execute_enemy_attack_route():
    """Executa ataque do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo selecionado'}), 404

        from routes.enemy_attacks import execute_enemy_attack
        result = execute_enemy_attack(player, enemy)

        return jsonify(result)

    except Exception as e:
        logger.exception("Error executing enemy attack")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/execute_buff_debuff_skills", methods=['POST'])
def execute_buff_debuff_skills_route():
    """Executa skills de buff/debuff do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo selecionado'}), 404

        from routes.enemy_attacks import execute_buff_debuff_skills_sequence
        result = execute_buff_debuff_skills_sequence(player, enemy)

        return jsonify(result)

    except Exception as e:
        logger.exception("Error executing buff/debuff skills")
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ROTAS DE RELÍQUIAS =====

@battle_bp.route("/get_relic_options")
def get_relic_options():
    """Retorna opções de relíquias para escolha"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)

        from routes.relics import generate_relic_options, get_relic_definition, format_relic_for_display

        pending = session.get('pending_relic_selection')
        if not pending:
            return jsonify({'success': False, 'error': 'Nenhuma seleção pendente'}), 400

        context = pending.get('context', 'first_relic')

        # Verificar se já tem opções salvas
        if 'options' in pending and pending['options']:
            option_ids = pending['options']
        else:
            # Gerar novas opções
            options = generate_relic_options(player_id, context)
            option_ids = [opt['id'] for opt in options]

            # Salvar na session
            pending['options'] = option_ids
            session['pending_relic_selection'] = pending
            session.modified = True

        options = [get_relic_definition(rid) for rid in option_ids]

        return jsonify({
            'success': True,
            'options': [format_relic_for_display(opt) for opt in options],
            'context': context
        })

    except Exception as e:
        logger.exception("Error getting relic options")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/select_relic", methods=['POST'])
def select_relic():
    """Seleciona uma relíquia"""
    try:
        player_id = get_authenticated_player_id()
        data = request.json or {}
        relic_id = data.get('relic_id')

        if not relic_id:
            return jsonify({'success': False, 'error': 'relic_id obrigatório'}), 400

        from routes.relics import get_relic_definition, award_relic_to_player, format_relic_for_display

        # Verificar se relíquia existe
        definition = get_relic_definition(relic_id)
        if not definition:
            return jsonify({'success': False, 'error': 'Relíquia inválida'}), 400

        # Adicionar ao jogador
        award_relic_to_player(player_id, relic_id)

        # Verificar se há mais relíquias pendentes
        pending = session.get('pending_relic_selection')
        has_more = False
        remaining_count = 0

        if pending:
            pending['count'] -= 1
            pending.pop('options', None)  # Limpar opções para gerar novas
            remaining_count = pending['count']

            if pending['count'] > 0:
                session['pending_relic_selection'] = pending
                session.modified = True
                has_more = True
            else:
                session.pop('pending_relic_selection', None)
        else:
            session.pop('pending_relic_selection', None)

        return jsonify({
            'success': True,
            'message': f'Relíquia {definition["name"]} adquirida!',
            'relic': format_relic_for_display(definition),
            'has_more_relics': has_more,
            'remaining_count': remaining_count
        })

    except Exception as e:
        logger.exception("Error selecting relic")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/check_relic_reward")
def check_relic_reward():
    """Verifica se há recompensa de relíquia pendente"""
    try:
        player_id = get_authenticated_player_id()

        pending = session.get('pending_relic_selection')

        if pending:
            return jsonify({
                'success': True,
                'has_relic_reward': True,
                'count': pending['count'],
                'context': pending['context']
            })
        else:
            return jsonify({
                'success': True,
                'has_relic_reward': False
            })

    except Exception as e:
        logger.exception("Error checking relic reward")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/get_player_relics")
def get_player_relics():
    """Retorna todas as relíquias do jogador"""
    try:
        player_id = get_authenticated_player_id()

        from models import PlayerRelic
        from routes.relics import format_relic_with_counter

        relics = PlayerRelic.query.filter_by(
            player_id=player_id,
            is_active=True
        ).all()

        return jsonify({
            'success': True,
            'relics': [format_relic_with_counter(r) for r in relics]
        })

    except Exception as e:
        logger.exception("Error getting player relics")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/check_relic_state/<int:relic_id>")
def check_relic_state(relic_id):
    """Verifica estado de uma relíquia específica"""
    try:
        player_id = get_authenticated_player_id()

        from models import PlayerRelic
        player_relic = PlayerRelic.query.filter_by(
            player_id=player_id,
            relic_id=relic_id,
            is_active=True
        ).first()

        if not player_relic:
            return jsonify({'success': False, 'error': 'Relíquia não encontrada'}), 404

        return jsonify({
            'success': True,
            'relic': {
                'id': player_relic.relic_id,
                'counter': player_relic.counter,
                'is_active': player_relic.is_active
            }
        })

    except Exception as e:
        logger.exception("Error checking relic state")
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ROTAS DE SKILLS =====

@battle_bp.route("/skills")
def skills():
    """Página de skills"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)

        attacks = get_player_attacks(player_id)
        specials = get_player_specials(player_id)

        return render_template(
            'gamification/skills.html',
            player=player,
            attacks=attacks,
            specials=specials
        )

    except Exception as e:
        logger.exception("Error in skills page")
        return str(e), 500


@battle_bp.route("/fill_special_charges")
def fill_special_charges():
    """Preenche cargas de especiais (dev)"""
    try:
        player_id = get_authenticated_player_id()

        from characters import fill_special_charges as fill_charges
        fill_charges(player_id)

        return jsonify({'success': True, 'message': 'Cargas preenchidas'})

    except Exception as e:
        logger.exception("Error filling special charges")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/finish_study", methods=['POST'])
def finish_study():
    """Finaliza estudo (sistema de memórias)"""
    try:
        player_id = get_authenticated_player_id()

        # Lógica de finalizar estudo (se houver)
        # TODO: Implementar se necessário

        return jsonify({'success': True})

    except Exception as e:
        logger.exception("Error finishing study")
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ROTAS UTILITÁRIAS =====

@battle_bp.route("/restore_energy", methods=['POST'])
def restore_energy():
    """Restaura energia do player"""
    try:
        player_id = get_authenticated_player_id()
        player = player_repo.get_by_id(player_id)

        player.energy = player.max_energy
        db.session.commit()

        return jsonify({
            'success': True,
            'energy': player.energy,
            'max_energy': player.max_energy
        })

    except Exception as e:
        logger.exception("Error restoring energy")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/battle_log")
def battle_log():
    """Retorna log de batalha"""
    try:
        player_id = get_authenticated_player_id()

        from models import BattleLog
        logs = BattleLog.query.filter_by(player_id=player_id).order_by(
            BattleLog.timestamp.desc()
        ).limit(50).all()

        return jsonify({
            'success': True,
            'logs': [{'message': log.message, 'timestamp': log.timestamp.isoformat()} for log in logs]
        })

    except Exception as e:
        logger.exception("Error getting battle log")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/clear_battle_log", methods=['POST'])
def clear_battle_log():
    """Limpa log de batalha"""
    try:
        player_id = get_authenticated_player_id()

        from models import BattleLog
        BattleLog.query.filter_by(player_id=player_id).delete()
        db.session.commit()

        return jsonify({'success': True})

    except Exception as e:
        logger.exception("Error clearing battle log")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/apply_victory_rewards", methods=['POST'])
def apply_victory_rewards():
    """Aplica recompensas de vitória"""
    try:
        player_id = get_authenticated_player_id()
        data = request.json or {}

        enemy_data = {
            'number': data.get('enemy_number', 1),
            'rarity': data.get('rarity', 1)
        }

        rewards = reward_service.apply_victory_rewards(player_id, enemy_data)

        return jsonify({
            'success': True,
            'rewards': rewards
        })

    except Exception as e:
        logger.exception("Error applying victory rewards")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/get_enemy_active_buffs", methods=['GET'])
def get_enemy_active_buffs():
    """Retorna buffs ativos do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo em combate'}), 404

        # TODO: Implementar sistema de buffs se necessário
        buffs = []

        return jsonify({
            'success': True,
            'buffs': buffs
        })

    except Exception as e:
        logger.exception("Error getting enemy buffs")
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ROTAS DE DESENVOLVIMENTO (manter compatibilidade) =====

@battle_bp.route("/dev/check_vlad_skills")
def dev_check_vlad_skills():
    """Dev: Verificar skills do Vlad"""
    try:
        from characters import init_vlad_skills
        result = init_vlad_skills()
        return jsonify({'success': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev/force_vlad_skills")
def dev_force_vlad_skills():
    """Dev: Forçar inicialização das skills"""
    try:
        from characters import init_vlad_skills
        result = init_vlad_skills()
        return jsonify({'success': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_add_relic/<relic_id>")
def dev_add_relic(relic_id):
    """Dev: Adicionar relíquia para teste"""
    try:
        player_id = get_authenticated_player_id()

        from routes.relics import add_relic_for_testing, get_relic_definition, format_relic_for_display

        definition = get_relic_definition(relic_id)
        if not definition:
            from routes.relics import get_all_relic_ids
            available = get_all_relic_ids()
            return jsonify({
                'success': False,
                'message': f'Relíquia {relic_id} não existe',
                'available_relics': available
            })

        add_relic_for_testing(player_id, relic_id)

        return jsonify({
            'success': True,
            'message': f'Relíquia {definition["name"]} adicionada!',
            'relic': format_relic_for_display(definition)
        })

    except Exception as e:
        logger.exception("Error adding relic")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_add_enemy_charges")
def dev_add_enemy_charges():
    """Dev: Adicionar cargas ao inimigo"""
    try:
        player_id = get_authenticated_player_id()
        enemy = get_current_battle_enemy(player_id)

        if enemy:
            enemy.attack_charges = (enemy.attack_charges or 0) + 3
            db.session.commit()
            return jsonify({'success': True, 'charges': enemy.attack_charges})

        return jsonify({'success': False, 'error': 'Nenhum inimigo'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_add_skill_charges")
def dev_add_skill_charges():
    """Dev: Adicionar cargas de skills"""
    try:
        player_id = get_authenticated_player_id()

        from characters import fill_special_charges
        fill_special_charges(player_id)

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_add_damage")
def dev_add_damage():
    """Dev: Adicionar dano ao inimigo"""
    try:
        player_id = get_authenticated_player_id()
        enemy = get_current_battle_enemy(player_id)

        if enemy:
            enemy.hp = max(0, enemy.hp - 50)
            db.session.commit()
            return jsonify({'success': True, 'hp': enemy.hp})

        return jsonify({'success': False, 'error': 'Nenhum inimigo'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_clear_and_regenerate")
def dev_clear_and_regenerate():
    """Dev: Limpar e regenerar inimigos"""
    try:
        player_id = get_authenticated_player_id()

        # Limpar inimigos
        GenericEnemy.query.filter_by(player_id=player_id).delete()

        # Gerar novos
        ensure_minimum_enemies(player_id)

        db.session.commit()

        return jsonify({'success': True})

    except Exception as e:
        logger.exception("Error clearing and regenerating")
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/dev_force_boss_milestone")
def dev_force_boss_milestone():
    """Dev: Forçar milestone de boss"""
    try:
        player_id = get_authenticated_player_id()

        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if progress:
            progress.generic_enemies_defeated = 20
            progress.current_boss_phase = 20
            db.session.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@battle_bp.route("/debug_enemy_skills")
def debug_enemy_skills():
    """Dev: Debug skills do inimigo"""
    try:
        player_id = get_authenticated_player_id()
        enemy = get_current_battle_enemy(player_id)

        if not enemy:
            return jsonify({'success': False, 'error': 'Nenhum inimigo'})

        import json

        return jsonify({
            'success': True,
            'enemy': {
                'id': enemy.id,
                'name': enemy.name,
                'action_pattern': json.loads(enemy.action_pattern) if enemy.action_pattern else [],
                'current_action_index': enemy.current_action_index,
                'attack_charges': enemy.attack_charges
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== FUNÇÕES DE COMPATIBILIDADE =====
# Estas funções existem para manter compatibilidade com código existente

def reset_player_run(player_id):
    """
    Wrapper de compatibilidade para player_service.reset_run().
    Esta função existe para manter compatibilidade com imports antigos.
    """
    logger.warning("reset_player_run está deprecated. Use player_service.reset_run() diretamente.")
    player_service.reset_run(player_id)
    return True, "Run resetada com sucesso"


def get_run_buff_total(player_id, buff_type):
    """
    Wrapper de compatibilidade para battle_cache.get_run_buff_total().
    Esta função existe para manter compatibilidade com imports antigos.
    """
    from routes.battle_cache import get_run_buff_total as cache_get_buff
    return cache_get_buff(player_id, buff_type)


# ===== EXPORTS =====
# Manter exports para compatibilidade com imports existentes
__all__ = [
    'battle_bp',
    'get_current_battle_enemy',
    'battle_service',
    'enemy_service',
    'reward_service',
    'player_service',
    'reset_player_run',  # Compatibilidade
    'get_run_buff_total',  # Compatibilidade
    'check_login_rewards'  # Re-export do battle_modules
]
