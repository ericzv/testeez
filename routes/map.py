"""
Rotas Flask para o sistema de mapa procedural.
Blueprint separado para manter organização.
"""

from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for
from database import db
from models_map import ProceduralMap, MapNode, PlayerMapProgress
from models import Player, LastBoss
from .map_modules.generation import MapGenerator
from .map_modules.node_types import (
    NODE_TYPE_INFO,
    ELITE_BOSSES,
    FINAL_BOSSES,
    get_elite_boss,
    get_final_boss
)
import json
from datetime import datetime

map_bp = Blueprint('map', __name__, url_prefix='/map')


# ============================================================================
# ROTAS DE PÁGINA (Templates HTML)
# ============================================================================

@map_bp.route('/')
def map_view():
    """Página principal do mapa"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    # Obter progresso do jogador no mapa
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()

    # Se não tem progresso, criar
    if not progress:
        progress = PlayerMapProgress(player_id=player.id)
        db.session.add(progress)
        db.session.commit()

    return render_template(
        'gamification/map.html',
        player=player,
        progress=progress,
        act_number=progress.current_act if progress else 1
    )


@map_bp.route('/shop')
def shop_view():
    """Página da loja (placeholder)"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    return render_template('gamification/map_shop.html', player=player)


@map_bp.route('/event')
def event_view():
    """Página de evento aleatório (placeholder)"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    return render_template('gamification/map_event.html', player=player)


@map_bp.route('/rest')
def rest_view():
    """Página de descanso"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    return render_template('gamification/map_rest.html', player=player)


# ============================================================================
# API - Geração e Gerenciamento do Mapa
# ============================================================================

@map_bp.route('/api/generate', methods=['POST'])
def generate_new_map():
    """
    Gera um novo mapa procedural para o jogador.

    Request JSON:
        act_number (int): Número do ato (1, 2 ou 3)
        seed (str, optional): Seed específica para reproduzir mapa

    Returns:
        JSON com dados do mapa gerado
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    data = request.get_json() or {}
    act_number = data.get('act_number', 1)
    seed = data.get('seed', None)

    # Validar ato
    if act_number not in [1, 2, 3]:
        return jsonify({'error': 'Ato inválido. Deve ser 1, 2 ou 3'}), 400

    # Gerar mapa
    generator = MapGenerator(seed=seed)
    map_data = generator.generate_map()

    # Criar registro do mapa no banco
    new_map = ProceduralMap(
        player_id=player.id,
        act_number=act_number,
        seed=map_data['seed']
    )
    db.session.add(new_map)
    db.session.flush()  # Para obter o ID

    # Criar nós no banco
    node_id_map = {}  # (x,y) -> db_node_id

    for (x, y), node_data in map_data['nodes'].items():
        db_node = MapNode(
            map_id=new_map.id,
            x=x,
            y=y,
            node_type=node_data['type'],
            is_available=(y == 0)  # Primeiro nível disponível
        )
        db_node.set_connections_up(node_data['connections_up'])
        db_node.set_connections_down(node_data['connections_down'])

        # Se for elite (Desafiante Infernal), atribuir sub-boss
        if node_data['type'] == 'elite':
            elite_boss = get_elite_boss()
            db_node.boss_id = elite_boss['id']

        # Se for boss final, atribuir boss do ato
        if node_data['type'] == 'boss':
            final_boss = get_final_boss(act_number)
            db_node.boss_id = final_boss['id']

        db.session.add(db_node)
        db.session.flush()
        node_id_map[(x, y)] = db_node.id

    # Atualizar progresso do jogador
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        progress = PlayerMapProgress(player_id=player.id)
        db.session.add(progress)

    progress.current_map_id = new_map.id
    progress.current_node_id = None
    progress.current_act = act_number
    progress.reset_for_new_map()

    db.session.commit()

    # Montar resposta
    nodes_response = []
    for (x, y), node_data in map_data['nodes'].items():
        nodes_response.append({
            'id': node_id_map[(x, y)],
            'x': x,
            'y': y,
            'type': node_data['type'],
            'connections_up': node_data['connections_up'],
            'connections_down': node_data['connections_down'],
            'is_available': node_data['is_available'],
            'is_visited': False,
            'is_current': False
        })

    return jsonify({
        'success': True,
        'map_id': new_map.id,
        'act_number': act_number,
        'seed': new_map.seed,
        'nodes': nodes_response,
        'statistics': generator.get_statistics()
    })


@map_bp.route('/api/current', methods=['GET'])
def get_current_map():
    """
    Retorna o mapa atual do jogador.

    Returns:
        JSON com estado completo do mapa ou indicação de ausência
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()

    if not progress or not progress.current_map_id:
        return jsonify({
            'has_map': False,
            'current_act': progress.current_act if progress else 1
        })

    # Buscar todos os nós do mapa
    nodes = MapNode.query.filter_by(map_id=progress.current_map_id).all()
    current_map = ProceduralMap.query.get(progress.current_map_id)

    nodes_data = []
    for node in nodes:
        node_dict = node.to_dict()
        # Adicionar informações extras
        node_dict['type_info'] = NODE_TYPE_INFO.get(node.node_type, {})
        nodes_data.append(node_dict)

    return jsonify({
        'has_map': True,
        'map_id': progress.current_map_id,
        'act_number': current_map.act_number,
        'seed': current_map.seed,
        'current_node_id': progress.current_node_id,
        'nodes_visited': progress.get_nodes_visited(),
        'nodes': nodes_data,
        'progress': progress.to_dict(),
        'is_completed': current_map.is_completed
    })


@map_bp.route('/api/select-node/<int:node_id>', methods=['POST'])
def select_node(node_id):
    """
    Jogador seleciona um nó para ir.
    Atualiza o estado do mapa e redireciona para ação apropriada.

    Args:
        node_id: ID do nó selecionado

    Returns:
        JSON com tipo do nó e URL de redirecionamento
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    # Buscar nó
    node = MapNode.query.get(node_id)
    if not node:
        return jsonify({'error': 'Nó não encontrado'}), 404

    if not node.is_available:
        return jsonify({'error': 'Nó não está disponível'}), 400

    # Obter progresso
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        return jsonify({'error': 'Progresso não encontrado'}), 404

    # Verificar se o nó pertence ao mapa atual
    if node.map_id != progress.current_map_id:
        return jsonify({'error': 'Nó não pertence ao mapa atual'}), 400

    # === ATUALIZAR ESTADO DO MAPA ===

    # Desmarcar nó anterior como atual
    if progress.current_node_id:
        current = MapNode.query.get(progress.current_node_id)
        if current:
            current.is_current = False

    # Atualizar nó selecionado
    node.is_visited = True
    node.is_current = True
    node.is_available = False
    node.visited_at = datetime.utcnow()

    # Marcar nós acima como disponíveis
    connections_up = node.get_connections_up()
    for (up_x, up_y) in connections_up:
        next_node = MapNode.query.filter_by(
            map_id=node.map_id,
            x=up_x,
            y=up_y
        ).first()
        if next_node and not next_node.is_visited:
            next_node.is_available = True

    # Marcar todos os outros nós no mesmo nível como indisponíveis
    same_level_nodes = MapNode.query.filter_by(
        map_id=node.map_id,
        y=node.y
    ).all()
    for n in same_level_nodes:
        if n.id != node.id:
            n.is_available = False

    # Atualizar progresso do jogador
    progress.current_node_id = node.id
    progress.add_visited_node(node.id)

    # Atualizar estatísticas baseado no tipo
    if node.node_type == 'battle':
        # Batalha será contada após vitória
        pass
    elif node.node_type == 'elite':
        # Elite será contado após vitória
        pass
    elif node.node_type == 'shop':
        progress.shops_visited += 1
    elif node.node_type == 'event':
        progress.events_completed += 1

    db.session.commit()

    # Determinar URL de redirecionamento
    redirect_url = _get_redirect_url_for_node(node)

    return jsonify({
        'success': True,
        'node_id': node.id,
        'node_type': node.node_type,
        'x': node.x,
        'y': node.y,
        'redirect_url': redirect_url,
        'boss_id': node.boss_id
    })


@map_bp.route('/api/complete-node', methods=['POST'])
def complete_current_node():
    """
    Marca o nó atual como completado (após vitória em batalha, etc).

    Returns:
        JSON com status atualizado
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress or not progress.current_node_id:
        return jsonify({'error': 'Nenhum nó atual'}), 400

    node = MapNode.query.get(progress.current_node_id)
    if not node:
        return jsonify({'error': 'Nó não encontrado'}), 404

    # Marcar como completado
    node.is_completed = True

    # Atualizar estatísticas
    if node.node_type == 'battle':
        progress.battles_won += 1
    elif node.node_type == 'elite':
        progress.elites_defeated += 1
    elif node.node_type == 'boss':
        # Boss derrotado - mapa completado
        current_map = ProceduralMap.query.get(progress.current_map_id)
        if current_map:
            current_map.is_completed = True
            current_map.boss_defeated = True
        progress.total_acts_completed += 1

    db.session.commit()

    # Verificar se deve avançar para próximo ato
    next_act = None
    if node.node_type == 'boss' and progress.current_act < 3:
        next_act = progress.current_act + 1

    return jsonify({
        'success': True,
        'node_completed': node.id,
        'map_completed': node.node_type == 'boss',
        'next_act': next_act,
        'stats': {
            'battles_won': progress.battles_won,
            'elites_defeated': progress.elites_defeated,
            'shops_visited': progress.shops_visited,
            'events_completed': progress.events_completed
        }
    })


@map_bp.route('/api/advance-act', methods=['POST'])
def advance_to_next_act():
    """
    Avança para o próximo ato após derrotar o boss.

    Returns:
        JSON com novo número do ato
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        return jsonify({'error': 'Progresso não encontrado'}), 404

    # Verificar se pode avançar
    if progress.current_act >= 3:
        return jsonify({'error': 'Já está no ato máximo'}), 400

    current_map = ProceduralMap.query.get(progress.current_map_id)
    if not current_map or not current_map.boss_defeated:
        return jsonify({'error': 'Boss atual não foi derrotado'}), 400

    # Avançar ato
    new_act = progress.current_act + 1
    progress.current_act = new_act
    progress.current_map_id = None
    progress.current_node_id = None

    db.session.commit()

    return jsonify({
        'success': True,
        'new_act': new_act,
        'message': f'Avançou para o Ato {new_act}!'
    })


@map_bp.route('/api/reset', methods=['POST'])
def reset_map_progress():
    """
    Reseta o progresso do mapa (usado quando o jogador morre).

    Returns:
        JSON confirmando reset
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if progress:
        # Deletar mapa atual se existir
        if progress.current_map_id:
            old_map = ProceduralMap.query.get(progress.current_map_id)
            if old_map:
                db.session.delete(old_map)

        # Resetar para ato 1
        progress.current_act = 1
        progress.current_map_id = None
        progress.current_node_id = None
        progress.reset_for_new_map()

        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Progresso resetado para o Ato 1'
    })


@map_bp.route('/api/rest/heal', methods=['POST'])
def rest_heal():
    """
    Jogador descansa e recupera HP.

    Returns:
        JSON com HP recuperado
    """
    player = Player.query.first()
    if not player:
        return jsonify({'error': 'Jogador não encontrado'}), 401

    # Calcular cura (30% do HP máximo)
    heal_percent = 0.30
    heal_amount = int(player.max_hp * heal_percent)
    old_hp = player.hp

    player.hp = min(player.hp + heal_amount, player.max_hp)
    actual_heal = player.hp - old_hp

    # Marcar nó como completado
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if progress and progress.current_node_id:
        node = MapNode.query.get(progress.current_node_id)
        if node:
            node.is_completed = True

    db.session.commit()

    return jsonify({
        'success': True,
        'old_hp': old_hp,
        'new_hp': player.hp,
        'max_hp': player.max_hp,
        'healed': actual_heal,
        'heal_percent': heal_percent * 100
    })


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def _get_redirect_url_for_node(node: MapNode) -> str:
    """
    Retorna a URL de redirecionamento apropriada para o tipo de nó.

    Args:
        node: Objeto MapNode

    Returns:
        String com URL
    """
    node_type = node.node_type

    if node_type == 'battle':
        return '/map/battle/start'
    elif node_type == 'elite':
        return f'/map/battle/elite/{node.boss_id}'
    elif node_type == 'shop':
        return '/map/shop'
    elif node_type == 'event':
        return '/map/event'
    elif node_type == 'rest':
        return '/map/rest'
    elif node_type == 'boss':
        return f'/map/battle/boss/{node.boss_id}'
    else:
        return '/map/'


def get_player_map_state(player_id: int) -> dict:
    """
    Retorna estado completo do mapa para um jogador.
    Útil para integração com outros sistemas.

    Args:
        player_id: ID do jogador

    Returns:
        Dict com estado do mapa
    """
    progress = PlayerMapProgress.query.filter_by(player_id=player_id).first()

    if not progress:
        return {
            'has_progress': False,
            'current_act': 1
        }

    return {
        'has_progress': True,
        'has_map': progress.current_map_id is not None,
        'current_act': progress.current_act,
        'current_node_id': progress.current_node_id,
        'battles_won': progress.battles_won,
        'elites_defeated': progress.elites_defeated
    }
