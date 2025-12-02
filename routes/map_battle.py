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
    generate_enemy_by_theme,
    get_enemy_template_by_progression,
    get_infernal_challenger_template,
    create_enemy_from_template
)
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

    # Calcular número do inimigo baseado no progresso
    # Nível do nó (0-14) + batalhas vencidas no mapa
    enemy_number = min(99, (current_node.y * 6) + map_progress.battles_won + 1)

    try:
        # NOVO SISTEMA: Usar templates fixos ao invés de geração procedural
        template = get_enemy_template_by_progression(enemy_number)

        if not template:
            flash('Erro ao carregar template de inimigo.', 'error')
            return redirect(url_for('map.map_view'))

        # Criar inimigo a partir do template
        enemy = create_enemy_from_template(
            template=template,
            enemy_number=enemy_number,
            player_id=player.id
        )

        if not enemy:
            flash('Erro ao criar inimigo.', 'error')
            return redirect(url_for('map.map_view'))

        # GERAR INTENÇÕES INICIAIS DO TURNO 1
        from .battle_modules.battle_turns import get_next_actions
        next_turn_data = get_next_actions(enemy)
        next_intentions = next_turn_data['actions']
        enemy.next_intentions_cached = json.dumps(next_intentions)
        print(f"🔮 Intenções do Turno 1 pré-calculadas: {[a.get('type') for a in next_intentions]}")

        # Associar inimigo ao nó
        current_node.enemy_id = enemy.id

        # Atualizar progresso do jogador (sistema antigo)
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = enemy.id
        progress.selected_boss_id = None  # Não é boss

        db.session.commit()

        print(f"⚔️ MAP BATTLE: Iniciando batalha contra {enemy.name} (nível {current_node.y})")

        # Redirecionar para a rota de batalha existente
        return redirect(url_for('battle.battle'))

    except Exception as e:
        print(f"❌ Erro ao iniciar batalha do mapa: {e}")
        flash(f'Erro ao iniciar batalha: {str(e)}', 'error')
        return redirect(url_for('map.map_view'))


@map_battle_bp.route('/elite/<int:boss_id>')
def start_elite_battle(boss_id):
    """
    Inicia uma batalha contra Desafiante Infernal (sub-boss).
    NOVO SISTEMA: Usa templates do Grupo 7 (Desafiantes Infernais).
    """
    player = Player.query.first()
    if not player:
        flash('Jogador não encontrado.', 'error')
        return redirect(url_for('battle.gamification'))

    try:
        # NOVO SISTEMA: Selecionar Desafiante Infernal do Grupo 7
        template = get_infernal_challenger_template()

        if not template:
            flash('Erro ao carregar Desafiante Infernal.', 'error')
            return redirect(url_for('map.map_view'))

        # Criar inimigo a partir do template (enemy_number alto para ser forte)
        enemy_number = 90  # Número alto para refletir dificuldade de elite
        enemy = create_enemy_from_template(
            template=template,
            enemy_number=enemy_number,
            player_id=player.id
        )

        if not enemy:
            flash('Erro ao criar Desafiante Infernal.', 'error')
            return redirect(url_for('map.map_view'))

        # GERAR INTENÇÕES INICIAIS DO TURNO 1
        from .battle_modules.battle_turns import get_next_actions
        next_turn_data = get_next_actions(enemy)
        next_intentions = next_turn_data['actions']
        enemy.next_intentions_cached = json.dumps(next_intentions)
        print(f"🔮 Intenções do Turno 1 (Elite) pré-calculadas: {[a.get('type') for a in next_intentions]}")

        # Atualizar progresso
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        progress.selected_enemy_id = enemy.id
        progress.selected_boss_id = None  # Agora é um enemy genérico, não LastBoss

        db.session.commit()

        print(f"🔥 MAP ELITE: Iniciando batalha contra Desafiante Infernal {enemy.name}")

        # Redirecionar para batalha
        return redirect(url_for('battle.battle'))

    except Exception as e:
        print(f"❌ Erro ao iniciar batalha elite: {e}")
        import traceback
        traceback.print_exc()
        flash(f'Erro ao iniciar batalha: {str(e)}', 'error')
        return redirect(url_for('map.map_view'))


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

    db.session.commit()

    print(f"💀 MAP BOSS: Iniciando batalha contra {final_boss.name}")

    # Redirecionar para batalha
    return redirect(url_for('battle.battle'))


@map_battle_bp.route('/victory', methods=['POST'])
def handle_map_victory():
    """
    Chamado após vitória em batalha do mapa.
    Atualiza o nó como completado e prepara para próximo movimento.
    """
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

        # CRÍTICO: Incrementar o ato atual para o próximo mapa
        if map_progress.current_act < 3:
            map_progress.current_act += 1
            print(f"🎉 ATO {map_progress.current_act - 1} COMPLETO! Avançando para Ato {map_progress.current_act}")
        else:
            print(f"🏆 TODOS OS ATOS COMPLETADOS! Parabéns!")

    db.session.commit()

    return jsonify({
        'success': True,
        'node_type': current_node.node_type,
        'map_completed': current_node.node_type == 'boss',
        'redirect_url': url_for('map.map_view')
    })


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
