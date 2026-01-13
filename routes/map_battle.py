"""
Rotas de batalha integradas ao sistema de mapa procedural.
Conecta os nós de batalha do mapa com o sistema de combate existente.
"""

from flask import Blueprint, jsonify, request, redirect, url_for, flash
from database import db
from models_map import MapNode, PlayerMapProgress
from models import Player, GenericEnemy, LastBoss, PlayerProgress, EnemyTheme
from .map_modules.node_types import ELITE_BOSSES, FINAL_BOSSES
from .battle_modules.enemy_generation import (
    get_enemy_template_by_act_and_position,
    get_enemy_template_excluding_names,
    get_used_enemy_names_in_run,
    get_infernal_challenger_template,
    create_enemy_from_template
)
from .relics import hooks as relic_hooks
import json
import random

map_battle_bp = Blueprint('map_battle', __name__, url_prefix='/map/battle')


@map_battle_bp.route('/start')
def start_battle():
    """
    Inicia uma batalha comum baseada no nó atual do mapa.
    Gera um inimigo procedural adequado ao progresso no mapa.
    """
    player = Player.query.first()
    if not player:
        flash('Jogador não encontrado.', 'error')
        return redirect(url_for('battle.gamification'))

    # Verificar progresso no mapa
    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not map_progress or not map_progress.current_node_id:
        flash('Nenhum nó selecionado no mapa.', 'error')
        return redirect(url_for('map.map_view'))

    current_node = MapNode.query.get(map_progress.current_node_id)
    if not current_node or current_node.node_type != 'battle':
        flash('Nó atual não é uma batalha.', 'error')
        return redirect(url_for('map.map_view'))

    # Obter ato atual e posição Y do nó para selecionar o grupo correto
    act_number = map_progress.current_act or 1
    node_y = current_node.y

    try:
        # ================================================================
        # VERIFICAR SE O NODE JÁ TEM UM INIMIGO ASSOCIADO
        # ================================================================
        # Se o node já tem um inimigo, usar esse inimigo (persistência)
        # Só criar novo inimigo se o node ainda não tiver um
        enemy = None

        if current_node.enemy_id:
            # Tentar carregar o inimigo existente
            enemy = GenericEnemy.query.get(current_node.enemy_id)
            if enemy:
                print(f"📌 NODE JÁ TEM INIMIGO: {enemy.name} (ID: {enemy.id})")
            else:
                print(f"⚠️ Inimigo ID {current_node.enemy_id} não encontrado, criando novo...")
                current_node.enemy_id = None  # Limpar referência inválida

        # Se não tem inimigo associado, criar um novo
        if not enemy:
            # ================================================================
            # ANTI-REPETIÇÃO: Buscar nomes de inimigos já usados na run
            # ================================================================
            used_names = get_used_enemy_names_in_run()
            print(f"🔒 Anti-repetição: {len(used_names)} inimigos já usados na run")

            # SELECIONAR TEMPLATE BASEADO NO ATO E POSIÇÃO DO NÓ
            # Usando função que exclui nomes já usados
            # - Ato 1, nodes 0-7:  Grupo 1
            # - Ato 1, nodes 8-15: Grupo 2
            # - Ato 2, nodes 0-7:  Grupo 3
            # - Ato 2, nodes 8-15: Grupo 4
            # - Ato 3, nodes 0-7:  Grupo 5
            # - Ato 3, nodes 8-15: Grupo 6
            template = get_enemy_template_excluding_names(act_number, node_y, used_names)

            if not template:
                flash('Erro ao carregar template de inimigo.', 'error')
                return redirect(url_for('map.map_view'))

            # enemy_number ainda é usado para tracking interno (não afeta grupo)
            enemy_number = map_progress.battles_won + 1

            # Criar inimigo a partir do template
            enemy = create_enemy_from_template(
                template=template,
                enemy_number=enemy_number,
                player_id=player.id
            )

            if not enemy:
                flash('Erro ao criar inimigo.', 'error')
                return redirect(url_for('map.map_view'))

            # Associar inimigo ao nó (PERSISTÊNCIA)
            current_node.enemy_id = enemy.id
            print(f"🆕 NOVO INIMIGO CRIADO: {enemy.name} (ID: {enemy.id}) → Node {current_node.id}")

        # GERAR INTENÇÕES INICIAIS DO TURNO 1 (sempre recalcular)
        from .battle_modules.battle_turns import get_next_actions
        next_turn_data = get_next_actions(enemy)
        next_intentions = next_turn_data['actions']
        enemy.next_intentions_cached = json.dumps(next_intentions)
        print(f"🔮 Intenções do Turno 1: {[a.get('type') for a in next_intentions]}")

        # Atualizar progresso do jogador (sistema antigo)
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = enemy.id
        progress.selected_boss_id = None  # Não é boss

        # ===== TRIGGER RELIC HOOKS ON_COMBAT_START =====
        relic_hooks.trigger_relic_hooks(player, 'on_combat_start', {'enemy': enemy})
        print(f"✨ Relic hooks on_combat_start triggered")

        db.session.commit()

        print(f"⚔️ MAP BATTLE: Iniciando batalha contra {enemy.name} (nível {current_node.y})")

        # Redirecionar para SPA com batalha ativa
        return redirect(url_for('battle.gamification_spa') + '?go_battle=true')

    except Exception as e:
        print(f"❌ Erro ao iniciar batalha do mapa: {e}")
        flash(f'Erro ao iniciar batalha: {str(e)}', 'error')
        return redirect(url_for('map.map_view'))


# ROTA REMOVIDA: Elite battles agora usam o sistema antigo com LastBoss (Heresiarca/Alma Negra)
# Ver routes/map.py:elite_battle() para a implementação atual
# O Grupo 6 dos templates ficará sem uso por enquanto


@map_battle_bp.route('/boss/<int:boss_id>')
def start_boss_battle(boss_id):
    """
    Inicia batalha contra o Boss Final do Ato.
    Purassombra (Ato 1), Formofagus (Ato 2), Nefasto (Ato 3).
    """
    player = Player.query.first()
    if not player:
        flash('Jogador não encontrado.', 'error')
        return redirect(url_for('battle.gamification'))

    # Verificar progresso no mapa
    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not map_progress:
        flash('Progresso não encontrado.', 'error')
        return redirect(url_for('map.map_view'))

    # Buscar o boss final
    final_boss = LastBoss.query.get(boss_id)
    if not final_boss:
        # Criar o boss se não existir
        final_boss = _create_final_boss(boss_id, map_progress.current_act)

    if not final_boss:
        flash('Erro ao carregar Boss Final.', 'error')
        return redirect(url_for('map.map_view'))

    # Resetar HP do boss
    final_boss.reset_to_full_health()
    final_boss.is_active = True

    # Atualizar progresso
    progress = PlayerProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        progress = PlayerProgress(player_id=player.id)
        db.session.add(progress)

    progress.selected_boss_id = final_boss.id
    progress.selected_enemy_id = None

    # ===== TRIGGER RELIC HOOKS ON_COMBAT_START =====
    relic_hooks.trigger_relic_hooks(player, 'on_combat_start', {'enemy': final_boss})
    print(f"✨ Relic hooks on_combat_start triggered for boss")

    db.session.commit()

    print(f"💀 MAP BOSS: Iniciando batalha contra {final_boss.name}")

    # Redirecionar para SPA com batalha ativa
    return redirect(url_for('battle.gamification_spa') + '?go_battle=true')


@map_battle_bp.route('/victory', methods=['POST'])
def handle_map_victory():
    """
    Chamado após vitória em batalha do mapa.
    Atualiza o nó como completado e prepara para próximo movimento.
    """
    from models import PlayerRelic
    from routes.relics.registry import get_relic_definition

    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Não logado'}), 401

    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not map_progress or not map_progress.current_node_id:
        return jsonify({'error': 'Sem nó atual'}), 400

    current_node = MapNode.query.get(map_progress.current_node_id)
    if not current_node:
        return jsonify({'error': 'Nó não encontrado'}), 404

    # Marcar nó como completado
    current_node.is_completed = True

    game_completed = False
    victory_summary = None

    # Atualizar estatísticas
    if current_node.node_type == 'battle':
        map_progress.battles_won += 1
    elif current_node.node_type == 'elite':
        map_progress.elites_defeated += 1
    elif current_node.node_type == 'boss':
        # Boss final derrotado!
        from models_map import ProceduralMap
        current_map = ProceduralMap.query.get(map_progress.current_map_id)
        if current_map:
            current_map.is_completed = True
            current_map.boss_defeated = True
        map_progress.total_acts_completed += 1

        # CRÍTICO: Verificar se é o ato 3 (fim de jogo!)
        if map_progress.current_act >= 3:
            game_completed = True
            print(f"🏆 TODOS OS ATOS COMPLETADOS! Parabéns!")

            # Incrementar vitória do personagem
            player.total_victories = (player.total_victories or 0) + 1
            print(f"🎖️ Vitória registrada! Total: {player.total_victories}")

            # Montar sumário da vitória
            # Buscar relíquias adquiridas
            player_relics = PlayerRelic.query.filter_by(player_id=player.id, is_active=True).all()
            relics_list = []
            for pr in player_relics:
                relic_def = get_relic_definition(pr.relic_id)
                if relic_def:
                    relics_list.append({
                        'id': pr.relic_id,
                        'name': relic_def['name'],
                        'icon': relic_def['icon'],
                        'rarity': relic_def['rarity']
                    })

            # Buscar lembranças (run buffs)
            from models import PlayerRunBuff
            run_buffs = PlayerRunBuff.query.filter_by(player_id=player.id).all()
            memories_list = []
            for buff in run_buffs:
                memories_list.append({
                    'type': buff.buff_type,
                    'value': buff.value,
                    'icon': f"resources/memory-{buff.buff_type}.png"
                })

            victory_summary = {
                'relics': relics_list,
                'memories': memories_list,
                'gold_gained': player.run_gold_gained or 0,
                'crystals_gained': player.run_crystals_gained or 0,
                'hourglasses_gained': player.run_hourglasses_gained or 0,
                'enemies_defeated': map_progress.battles_won or 0,
                'elites_defeated': map_progress.elites_defeated or 0,
                'bosses_defeated': (player.run_bosses_defeated or 0) + 1,  # +1 para o Nefasto
                'difficulty': 'Fácil',
                'character_id': player.character_id,
                'total_victories': player.total_victories,
                'total_runs': player.total_runs or 0
            }
        else:
            # Avançar para o próximo ato
            map_progress.current_act += 1
            print(f"🎉 ATO {map_progress.current_act - 1} COMPLETO! Avançando para Ato {map_progress.current_act}")

    db.session.commit()

    response = {
        'success': True,
        'node_type': current_node.node_type,
        'map_completed': current_node.node_type == 'boss',
        'redirect_url': url_for('map.map_view'),
        'game_completed': game_completed
    }

    if game_completed and victory_summary:
        response['victory_summary'] = victory_summary
        response['redirect_url'] = '/choose-character?from=victory'

    return jsonify(response)


@map_battle_bp.route('/defeat', methods=['POST'])
def handle_map_defeat():
    """
    Chamado após derrota em batalha do mapa.
    Reseta o progresso do mapa (run over).
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Não logado'}), 401

    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if map_progress:
        # Deletar mapa atual
        if map_progress.current_map_id:
            from models_map import ProceduralMap
            old_map = ProceduralMap.query.get(map_progress.current_map_id)
            if old_map:
                db.session.delete(old_map)

        # Resetar para ato 1
        map_progress.current_act = 1
        map_progress.current_map_id = None
        map_progress.current_node_id = None
        map_progress.reset_for_new_map()

        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Run finalizada. Voltando ao Ato 1.',
        'redirect_url': url_for('map.map_view')
    })


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def _create_elite_boss(boss_id: int) -> LastBoss:
    """
    Cria um sub-boss para Desafiante Infernal.

    Args:
        boss_id: ID do boss (2=Heresiarca, 3=Alma Negra)

    Returns:
        Objeto LastBoss criado
    """
    elite_configs = {
        2: {
            'name': 'Heresiarca',
            'hp': 500,
            'max_hp': 500,
            'damage': 35,
            'posture': 300,
            'block_percentage': 15.0,
            'sprite_idle': '/static/game.data/bosses/heresiarca/idle.png',
            'sprite_frames': 4,
            'sprite_size': '128x128',
            'reward_crystals': 150
        },
        3: {
            'name': 'Alma Negra',
            'hp': 450,
            'max_hp': 450,
            'damage': 40,
            'posture': 250,
            'block_percentage': 10.0,
            'sprite_idle': '/static/game.data/bosses/alma_negra/idle.png',
            'sprite_frames': 4,
            'sprite_size': '128x128',
            'reward_crystals': 150
        }
    }

    config = elite_configs.get(boss_id)
    if not config:
        return None

    boss = LastBoss(
        id=boss_id,
        name=config['name'],
        hp=config['hp'],
        max_hp=config['max_hp'],
        damage=config['damage'],
        posture=config['posture'],
        block_percentage=config['block_percentage'],
        sprite_idle=config['sprite_idle'],
        sprite_frames=config['sprite_frames'],
        sprite_size=config['sprite_size'],
        reward_crystals=config['reward_crystals'],
        hit_animation='hit1',
        is_active=False
    )

    db.session.add(boss)
    db.session.commit()

    return boss


def _create_final_boss(boss_id: int, act_number: int) -> LastBoss:
    """
    Cria um boss final para o ato.

    Args:
        boss_id: ID do boss
        act_number: Número do ato (1, 2 ou 3)

    Returns:
        Objeto LastBoss criado
    """
    boss_configs = {
        1: {  # Purassombra - Ato 1
            'name': 'Purassombra',
            'hp': 800,
            'max_hp': 800,
            'damage': 45,
            'posture': 500,
            'block_percentage': 20.0,
            'sprite_idle': '/static/game.data/bosses/purassombra/idle.png',
            'sprite_frames': 6,
            'sprite_size': '256x256',
            'reward_crystals': 300
        },
        4: {  # Formofagus - Ato 2
            'name': 'Formofagus',
            'hp': 1200,
            'max_hp': 1200,
            'damage': 55,
            'posture': 700,
            'block_percentage': 25.0,
            'sprite_idle': '/static/game.data/bosses/formofagus/idle.png',
            'sprite_frames': 6,
            'sprite_size': '256x256',
            'reward_crystals': 500
        },
        5: {  # Nefasto - Ato 3
            'name': 'Nefasto',
            'hp': 1600,
            'max_hp': 1600,
            'damage': 70,
            'posture': 900,
            'block_percentage': 30.0,
            'sprite_idle': '/static/game.data/bosses/nefasto/idle.png',
            'sprite_frames': 8,
            'sprite_size': '256x256',
            'reward_crystals': 800
        }
    }

    config = boss_configs.get(boss_id)
    if not config:
        # Fallback para Purassombra
        config = boss_configs[1]

    boss = LastBoss(
        id=boss_id,
        name=config['name'],
        hp=config['hp'],
        max_hp=config['max_hp'],
        damage=config['damage'],
        posture=config['posture'],
        block_percentage=config['block_percentage'],
        sprite_idle=config['sprite_idle'],
        sprite_frames=config['sprite_frames'],
        sprite_size=config['sprite_size'],
        reward_crystals=config['reward_crystals'],
        hit_animation='hit1',
        is_active=False
    )

    db.session.add(boss)
    db.session.commit()

    return boss


def check_map_battle_context(player_id: int) -> dict:
    """
    Verifica se o jogador está em uma batalha do mapa.
    Útil para integração com o sistema de recompensas.

    Args:
        player_id: ID do jogador

    Returns:
        Dict com contexto da batalha do mapa
    """
    map_progress = PlayerMapProgress.query.filter_by(player_id=player_id).first()

    if not map_progress or not map_progress.current_node_id:
        return {'is_map_battle': False}

    current_node = MapNode.query.get(map_progress.current_node_id)
    if not current_node:
        return {'is_map_battle': False}

    return {
        'is_map_battle': True,
        'node_type': current_node.node_type,
        'node_level': current_node.y,
        'act_number': map_progress.current_act,
        'node_id': current_node.id
    }


# ============================================================================
# API ENDPOINTS FOR SPA - NO REDIRECTS
# ============================================================================

@map_battle_bp.route('/api/prepare', methods=['POST'])
def api_prepare_battle():
    """
    API endpoint to prepare a regular battle without redirecting.
    Used by SPA navigation.
    Returns JSON with success status.
    """
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 401

    # Verificar progresso no mapa
    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not map_progress or not map_progress.current_node_id:
        return jsonify({'success': False, 'error': 'Nenhum nó selecionado no mapa'}), 400

    current_node = MapNode.query.get(map_progress.current_node_id)
    if not current_node or current_node.node_type != 'battle':
        return jsonify({'success': False, 'error': 'Nó atual não é uma batalha'}), 400

    # Obter ato atual e posição Y do nó
    act_number = map_progress.current_act or 1
    node_y = current_node.y

    try:
        # Verificar se o node já tem um inimigo associado
        enemy = None

        if current_node.enemy_id:
            enemy = GenericEnemy.query.get(current_node.enemy_id)
            if enemy:
                print(f"📌 NODE JÁ TEM INIMIGO: {enemy.name} (ID: {enemy.id})")
            else:
                current_node.enemy_id = None

        # Se não tem inimigo associado, criar um novo
        if not enemy:
            used_names = get_used_enemy_names_in_run()
            template = get_enemy_template_excluding_names(act_number, node_y, used_names)

            if not template:
                return jsonify({'success': False, 'error': 'Erro ao carregar template de inimigo'}), 500

            enemy_number = map_progress.battles_won + 1
            enemy = create_enemy_from_template(
                template=template,
                enemy_number=enemy_number,
                player_id=player.id
            )

            if not enemy:
                return jsonify({'success': False, 'error': 'Erro ao criar inimigo'}), 500

            current_node.enemy_id = enemy.id
            print(f"🆕 NOVO INIMIGO CRIADO: {enemy.name} (ID: {enemy.id}) → Node {current_node.id}")

        # Gerar intenções iniciais
        from .battle_modules.battle_turns import get_next_actions
        next_turn_data = get_next_actions(enemy)
        next_intentions = next_turn_data['actions']
        enemy.next_intentions_cached = json.dumps(next_intentions)

        # Atualizar progresso do jogador
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = enemy.id
        progress.selected_boss_id = None

        # ===== TRIGGER RELIC HOOKS ON_COMBAT_START =====
        relic_hooks.trigger_relic_hooks(player, 'on_combat_start', {'enemy': enemy})
        print(f"✨ Relic hooks on_combat_start triggered (API)")

        db.session.commit()

        print(f"⚔️ MAP BATTLE API: Preparado batalha contra {enemy.name}")

        return jsonify({
            'success': True,
            'enemy': {
                'id': enemy.id,
                'name': enemy.name,
                'hp': enemy.hp,
                'max_hp': enemy.max_hp
            },
            'player_energy': player.energy,
            'player_max_energy': player.max_energy
        })

    except Exception as e:
        print(f"❌ Erro ao preparar batalha: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@map_battle_bp.route('/api/prepare-elite/<int:boss_id>', methods=['POST'])
def api_prepare_elite_battle(boss_id):
    """
    API endpoint to prepare an elite battle without redirecting.
    Used by SPA navigation.
    """
    from routes.battle_modules.enemy_generation import create_boss_by_name

    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 401

    # Mapeamento de ID para boss
    BOSS_ID_TO_DATA = {
        1: {'key': 'purassombra', 'display': 'Purassombra'},
        2: {'key': 'heresiarca', 'display': 'Heresiarca'},
        3: {'key': 'alma_negra', 'display': 'Alma Negra'},
        4: {'key': 'formofagus', 'display': 'Formofagus'},
        5: {'key': 'nefasto', 'display': 'Nefasto'}
    }

    if boss_id not in BOSS_ID_TO_DATA:
        return jsonify({'success': False, 'error': 'Boss ID inválido'}), 400

    boss_data = BOSS_ID_TO_DATA[boss_id]
    boss_key = boss_data['key']
    boss_display_name = boss_data['display']

    try:
        boss = LastBoss.query.filter_by(name=boss_display_name).first()

        if not boss:
            boss = create_boss_by_name(boss_key)
            if boss:
                db.session.add(boss)
                db.session.commit()

        if not boss:
            return jsonify({'success': False, 'error': 'Não foi possível criar boss'}), 500

        # Resetar estado do boss
        boss.is_active = True
        boss.hp = boss.max_hp
        boss.current_hp = boss.max_hp
        boss.blood_stacks = 0
        boss.battle_turn_counter = 0
        boss.action_queue = '[]'
        boss.buff_debuff_queue = '[]'
        boss.current_action_index = 0
        boss.attack_skill_rotation_index = 0
        boss.buff_debuff_rotation_index = 0

        # Atualizar progresso
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = None
        progress.selected_boss_id = boss.id

        # Pré-calcular intenções
        from routes.battle import get_next_actions
        next_turn_data = get_next_actions(boss)
        next_intentions = next_turn_data['actions']
        boss.next_intentions_cached = json.dumps(next_intentions)

        # ===== TRIGGER RELIC HOOKS ON_COMBAT_START =====
        relic_hooks.trigger_relic_hooks(player, 'on_combat_start', {'enemy': boss})
        print(f"✨ Relic hooks on_combat_start triggered for elite (API)")

        db.session.commit()

        print(f"⚔️ ELITE BATTLE API: Preparado batalha contra {boss.name}")

        return jsonify({
            'success': True,
            'boss': {
                'id': boss.id,
                'name': boss.name,
                'hp': boss.hp,
                'max_hp': boss.max_hp
            },
            'player_energy': player.energy,
            'player_max_energy': player.max_energy
        })

    except Exception as e:
        print(f"❌ Erro ao preparar batalha elite: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@map_battle_bp.route('/api/prepare-boss/<int:boss_id>', methods=['POST'])
def api_prepare_boss_battle(boss_id):
    """
    API endpoint to prepare a boss battle without redirecting.
    Used by SPA navigation.
    """
    from routes.battle_modules.enemy_generation import create_boss_by_name

    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 401

    # Obter ato atual do mapa
    map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not map_progress:
        return jsonify({'success': False, 'error': 'Progresso do mapa não encontrado'}), 400

    act_number = map_progress.current_act or 1

    # Mapeamento FIXO de ATO para BOSS
    ACT_TO_BOSS = {
        1: {'key': 'purassombra', 'display': 'Purassombra'},
        2: {'key': 'formofagus', 'display': 'Formofagus'},
        3: {'key': 'nefasto', 'display': 'Nefasto'}
    }

    boss_data = ACT_TO_BOSS.get(act_number, ACT_TO_BOSS[1])
    boss_key = boss_data['key']
    boss_display_name = boss_data['display']

    try:
        boss = LastBoss.query.filter_by(name=boss_display_name).first()

        if not boss:
            boss = create_boss_by_name(boss_key)
            if boss:
                db.session.add(boss)
                db.session.commit()

        if not boss:
            return jsonify({'success': False, 'error': 'Não foi possível criar boss'}), 500

        # Resetar estado do boss
        boss.is_active = True
        boss.hp = boss.max_hp
        boss.current_hp = boss.max_hp
        boss.blood_stacks = 0
        boss.battle_turn_counter = 0
        boss.action_queue = '[]'
        boss.buff_debuff_queue = '[]'
        boss.current_action_index = 0
        boss.attack_skill_rotation_index = 0
        boss.buff_debuff_rotation_index = 0

        # Atualizar progresso
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = None
        progress.selected_boss_id = boss.id

        # Pré-calcular intenções
        from routes.battle import get_next_actions
        next_turn_data = get_next_actions(boss)
        next_intentions = next_turn_data['actions']
        boss.next_intentions_cached = json.dumps(next_intentions)

        # ===== TRIGGER RELIC HOOKS ON_COMBAT_START =====
        relic_hooks.trigger_relic_hooks(player, 'on_combat_start', {'enemy': boss})
        print(f"✨ Relic hooks on_combat_start triggered for final boss (API)")

        db.session.commit()

        print(f"💀 BOSS BATTLE API: Preparado batalha contra {boss.name} (Ato {act_number})")

        return jsonify({
            'success': True,
            'boss': {
                'id': boss.id,
                'name': boss.name,
                'hp': boss.hp,
                'max_hp': boss.max_hp
            },
            'player_energy': player.energy,
            'player_max_energy': player.max_energy
        })

    except Exception as e:
        print(f"❌ Erro ao preparar batalha boss: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
