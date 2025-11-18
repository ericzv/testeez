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
from .map_modules.events import EVENT_DEFINITIONS, get_event_by_id, get_events_for_act
from .map_modules.event_effects import apply_event_effects, check_choice_requirements
import json
import random
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
        act_number=progress.current_act if progress else 1,
        node_type_info=NODE_TYPE_INFO
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
    """Página de evento aleatório"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    # Obter progresso e nó atual
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress or not progress.current_node_id:
        return redirect(url_for('map.map_view'))

    current_node = MapNode.query.get(progress.current_node_id)
    if not current_node or current_node.node_type != 'event':
        return redirect(url_for('map.map_view'))

    # Selecionar evento baseado no nó
    event = _select_event_for_node(current_node, player, progress)

    # Verificar requisitos de cada escolha
    choices_with_status = []
    for choice in event['choices']:
        can_select = check_choice_requirements(choice, player)
        choice_copy = choice.copy()
        choice_copy['can_select'] = can_select
        choices_with_status.append(choice_copy)

    event_data = event.copy()
    event_data['choices'] = choices_with_status

    return render_template(
        'gamification/map_event.html',
        player=player,
        event=event_data
    )


@map_bp.route('/rest')
def rest_view():
    """Página de descanso"""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    return render_template('gamification/map_rest.html', player=player)


@map_bp.route('/battle/elite/<int:boss_id>')
def elite_battle(boss_id):
    """
    Inicia batalha contra um boss elite.
    Seleciona o boss e redireciona para a página de batalha.
    """
    from models import PlayerProgress, GenericEnemy
    from routes.battle_modules.enemy_generation import create_boss_by_name
    import json

    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    # Mapeamento de ID para nome do boss
    BOSS_ID_TO_NAME = {
        1: 'purassombra',
        2: 'heresiarca',
        3: 'alma_negra',
        4: 'formofagus',
        5: 'nefasto'
    }

    # Verificar se o boss existe
    boss = LastBoss.query.get(boss_id)

    if not boss:
        # Boss não existe, criar usando as definições existentes
        if boss_id in BOSS_ID_TO_NAME:
            boss_name = BOSS_ID_TO_NAME[boss_id]
            print(f"🎭 Criando boss {boss_name} para elite...")
            boss = create_boss_by_name(boss_name)
            if boss:
                db.session.add(boss)
                db.session.commit()
                print(f"✅ Boss {boss.name} criado com sucesso!")

        if not boss:
            print(f"❌ Não foi possível criar boss ID {boss_id}")
            return redirect(url_for('battle.gamification'))

    # Ativar o boss se não estiver ativo
    if not boss.is_active:
        boss.is_active = True
        boss.current_hp = boss.max_hp
        print(f"🔓 Boss {boss.name} ativado para elite battle")

    # Obter progresso do jogador
    progress = PlayerProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        progress = PlayerProgress(player_id=player.id)
        db.session.add(progress)

    # Limpar seleção de inimigo genérico e selecionar o boss
    progress.selected_enemy_id = None
    progress.selected_boss_id = boss.id

    # Resetar contador de turnos e calcular intenções
    boss.battle_turn_counter = 0

    # Pré-calcular intenções do Turno 1
    from routes.battle import get_next_actions
    next_turn_data = get_next_actions(boss)
    next_intentions = next_turn_data['actions']
    boss.next_intentions_cached = json.dumps(next_intentions)

    print(f"⚔️ Elite Battle iniciando: {boss.name} (ID: {boss.id})")
    print(f"🔮 Intenções do Turno 1 calculadas: {[a.get('type') for a in next_intentions]}")

    db.session.commit()

    # Redirecionar para a página de batalha
    return redirect(url_for('battle.battle'))


@map_bp.route('/battle/boss/<int:boss_id>')
def boss_battle(boss_id):
    """
    Inicia batalha contra um boss final de ato.
    Seleciona o boss e redireciona para a página de batalha.
    """
    from models import PlayerProgress, GenericEnemy
    from routes.battle_modules.enemy_generation import create_boss_by_name
    import json

    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))

    # Mapeamento de ID para nome do boss
    BOSS_ID_TO_NAME = {
        1: 'purassombra',
        2: 'heresiarca',
        3: 'alma_negra',
        4: 'formofagus',
        5: 'nefasto'
    }

    # Verificar se o boss existe
    boss = LastBoss.query.get(boss_id)

    if not boss:
        # Boss não existe, criar usando as definições existentes
        if boss_id in BOSS_ID_TO_NAME:
            boss_name = BOSS_ID_TO_NAME[boss_id]
            print(f"🎭 Criando boss final {boss_name}...")
            boss = create_boss_by_name(boss_name)
            if boss:
                db.session.add(boss)
                db.session.commit()
                print(f"✅ Boss final {boss.name} criado com sucesso!")

        if not boss:
            print(f"❌ Não foi possível criar boss ID {boss_id}")
            return redirect(url_for('battle.gamification'))

    # Ativar o boss se não estiver ativo
    if not boss.is_active:
        boss.is_active = True
        boss.current_hp = boss.max_hp
        print(f"🔓 Boss {boss.name} ativado para boss final battle")

    # Obter progresso do jogador
    progress = PlayerProgress.query.filter_by(player_id=player.id).first()
    if not progress:
        progress = PlayerProgress(player_id=player.id)
        db.session.add(progress)

    # Limpar seleção de inimigo genérico e selecionar o boss
    progress.selected_enemy_id = None
    progress.selected_boss_id = boss.id

    # Resetar contador de turnos e calcular intenções
    boss.battle_turn_counter = 0

    # Pré-calcular intenções do Turno 1
    from routes.battle import get_next_actions
    next_turn_data = get_next_actions(boss)
    next_intentions = next_turn_data['actions']
    boss.next_intentions_cached = json.dumps(next_intentions)

    print(f"⚔️ Boss Final Battle iniciando: {boss.name} (ID: {boss.id})")
    print(f"🔮 Intenções do Turno 1 calculadas: {[a.get('type') for a in next_intentions]}")

    db.session.commit()

    # Redirecionar para a página de batalha
    return redirect(url_for('battle.battle'))


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

    # Aceitar tanto JSON quanto request vazio
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = {}
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
        # Buscar o nó do banco para obter boss_id
        db_node = MapNode.query.filter_by(
            map_id=new_map.id,
            x=x,
            y=y
        ).first()

        nodes_response.append({
            'id': node_id_map[(x, y)],
            'x': x,
            'y': y,
            'node_type': node_data['type'],  # Padronizado como 'node_type'
            'connections_up': node_data['connections_up'],
            'connections_down': node_data['connections_down'],
            'is_available': node_data['is_available'],
            'is_visited': False,
            'is_current': False,
            'boss_id': db_node.boss_id if db_node else None
        })

    return jsonify({
        'success': True,
        'map_data': {
            'map_id': new_map.id,
            'act_number': act_number,
            'seed': new_map.seed,
            'nodes': nodes_response,
            'statistics': generator.get_statistics()
        }
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
            'success': False,
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
        'success': True,
        'map_data': {
            'map_id': progress.current_map_id,
            'act_number': current_map.act_number,
            'seed': current_map.seed,
            'current_node_id': progress.current_node_id,
            'nodes_visited': progress.get_nodes_visited(),
            'nodes': nodes_data,
            'progress': progress.to_dict(),
            'is_completed': current_map.is_completed
        }
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

    # Verificar se deve avançar para próximo ato AUTOMATICAMENTE
    next_act = None
    if node.node_type == 'boss' and progress.current_act < 3:
        # Avançar automaticamente para o próximo ato
        new_act = progress.current_act + 1
        progress.current_act = new_act
        # Limpar mapa atual para forçar geração de novo mapa
        if progress.current_map_id:
            MapNode.query.filter_by(map_id=progress.current_map_id).delete()
            ProceduralMap.query.filter_by(id=progress.current_map_id).delete()
        progress.current_map_id = None
        progress.current_node_id = None
        db.session.commit()
        next_act = new_act
        print(f"🎯 Avançou automaticamente para o Ato {new_act}!")

    return jsonify({
        'success': True,
        'node_completed': node.id,
        'map_completed': node.node_type == 'boss',
        'next_act': next_act,
        'act_advanced': next_act is not None,
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


# ============================================================================
# API - Sistema de Eventos Aleatórios
# ============================================================================

@map_bp.route('/api/event/choose', methods=['POST'])
def choose_event_option():
    """
    Processa a escolha do jogador em um evento.

    Request JSON:
        event_id (str): ID do evento
        choice_id (str): ID da escolha selecionada

    Returns:
        JSON com resultados da escolha
    """
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 404

    data = request.get_json()
    event_id = data.get('event_id')
    choice_id = data.get('choice_id')

    print(f"🎭 EVENT CHOOSE: event_id={event_id}, choice_id={choice_id}")
    print(f"🎭 ANTES: HP={player.hp}/{player.max_hp}, Gold={player.run_gold}")

    if not event_id or not choice_id:
        return jsonify({'success': False, 'error': 'Dados incompletos'}), 400

    # Buscar evento
    event = get_event_by_id(event_id)
    if not event:
        return jsonify({'success': False, 'error': 'Evento não encontrado'}), 404

    # Buscar escolha
    choice = None
    for c in event['choices']:
        if c['id'] == choice_id:
            choice = c
            break

    if not choice:
        return jsonify({'success': False, 'error': 'Escolha não encontrada'}), 404

    print(f"🎭 Escolha encontrada: {choice.get('text', 'N/A')}")
    print(f"🎭 Efeitos a aplicar: {choice.get('effects', [])}")

    # Verificar requisitos
    if not check_choice_requirements(choice, player):
        return jsonify({'success': False, 'error': 'Você não atende aos requisitos'}), 400

    # Aplicar efeitos
    results = apply_event_effects(player, choice.get('effects', []))

    print(f"🎭 DEPOIS de apply_event_effects: HP={player.hp}/{player.max_hp}, Gold={player.run_gold}")
    print(f"🎭 Resultados: {results}")

    # SEMPRE commit para persistir mudanças no player (HP, gold, max_hp, etc)
    db.session.commit()

    print(f"🎭 DEPOIS do commit: HP={player.hp}/{player.max_hp}, Gold={player.run_gold}")

    # Marcar nó como completo
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if progress and progress.current_node_id:
        current_node = MapNode.query.get(progress.current_node_id)
        if current_node:
            current_node.is_completed = True
            progress.events_completed = (progress.events_completed or 0) + 1
            db.session.commit()

    # Verificar se precisa redirecionar para combate
    requires_combat = any(r.get('requires_combat', False) for r in results)

    return jsonify({
        'success': True,
        'results': results,
        'player_hp': player.hp,
        'player_max_hp': player.max_hp,
        'player_gold': player.run_gold,
        'requires_combat': requires_combat,
        'redirect_url': '/map' if not requires_combat else None
    })


@map_bp.route('/api/event/skip', methods=['POST'])
def skip_event():
    """
    Pula o evento sem fazer escolha (caso raro).

    Returns:
        JSON com sucesso
    """
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 404

    # Marcar nó como completo
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if progress and progress.current_node_id:
        current_node = MapNode.query.get(progress.current_node_id)
        if current_node:
            current_node.is_completed = True
            progress.events_completed = (progress.events_completed or 0) + 1
            db.session.commit()

    return jsonify({
        'success': True,
        'redirect_url': '/map'
    })


# ============================================================================
# Funções Auxiliares - Eventos
# ============================================================================

def _select_event_for_node(node: MapNode, player, progress: PlayerMapProgress) -> dict:
    """
    Seleciona um evento aleatório baseado no nó, ato e seed.

    Args:
        node: Nó atual do mapa
        player: Jogador
        progress: Progresso do jogador no mapa

    Returns:
        Dicionário com dados do evento selecionado
    """
    # Obter mapa para seed
    map_obj = ProceduralMap.query.get(node.map_id)
    if not map_obj:
        # Fallback: evento padrão
        return list(EVENT_DEFINITIONS.values())[0]

    # Criar seed determinística baseada no nó
    event_seed = f"{map_obj.seed}_{node.x}_{node.y}_event"
    random.seed(hash(event_seed) % (2**32))

    # Filtrar eventos disponíveis para o ato atual
    act_number = progress.current_act if progress else 1
    available_events = get_events_for_act(act_number)

    if not available_events:
        available_events = list(EVENT_DEFINITIONS.values())

    # Peso por raridade
    weights = []
    for event in available_events:
        rarity = event.get('rarity', 'common')
        if rarity == 'common':
            weights.append(60)
        elif rarity == 'uncommon':
            weights.append(30)
        else:  # rare
            weights.append(10)

    # Selecionar evento
    selected = random.choices(available_events, weights=weights, k=1)[0]

    # Resetar seed para não afetar outros sistemas
    random.seed()

    return selected


def _get_event_image_path(event: dict) -> str:
    """
    Retorna o caminho completo da imagem do evento.

    Args:
        event: Dicionário do evento

    Returns:
        Caminho da imagem
    """
    image_name = event.get('image', 'default_event.png')
    return f'/static/game_data/events/{image_name}'
