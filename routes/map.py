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

    # CRÍTICO: Verificar se o nó já tem um evento persistido
    if current_node.event_id:
        # Usar o evento já atribuído a este nó
        event = get_event_by_id(current_node.event_id)
        if not event:
            # Evento não encontrado (pode ter sido removido), gerar novo
            print(f"⚠️  Evento {current_node.event_id} não encontrado, gerando novo")
            event = _select_event_for_node(current_node, player, progress)
            current_node.event_id = event['id']
            db.session.commit()
    else:
        # Primeira vez que o nó é acessado, selecionar e persistir evento
        event = _select_event_for_node(current_node, player, progress)
        current_node.event_id = event['id']
        db.session.commit()
        print(f"🎭 Evento '{event['id']}' atribuído ao nó {current_node.id}")

    # Registrar evento como visto (para anti-repetição)
    progress.add_event_seen(event['id'])
    db.session.commit()

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


# ROTA REMOVIDA: Elite battles agora usam o sistema de templates do Grupo 6
# Ver routes/map_battle.py:start_elite_battle() para a implementação atual
# A rota antiga criava Heresiarca e Alma Negra como LastBoss, mas agora
# os Desafiantes Infernais são inimigos genéricos do Grupo 6


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

    # Mapeamento de ID para nome do boss (APENAS BOSSES FINAIS)
    # IDs 2 e 3 (Heresiarca e Alma Negra) foram REMOVIDOS - agora são elites do Grupo 6
    BOSS_ID_TO_NAME = {
        1: 'purassombra',   # Ato 1
        4: 'formofagus',    # Ato 2
        5: 'nefasto'        # Ato 3
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

    # Buscar progresso para determinar ato atual
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()

    # Usar ato do progresso se não for especificado
    if 'act_number' in data:
        act_number = data.get('act_number')
    elif progress and progress.current_act:
        act_number = progress.current_act
    else:
        act_number = 1

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

    # Verificar se precisa redirecionar para outra tela (ex: seleção de relíquias)
    requires_redirect = any(r.get('requires_redirect', False) for r in results)
    redirect_url = None

    if requires_redirect:
        # Pegar URL de redirecionamento do primeiro resultado que tem
        for r in results:
            if r.get('requires_redirect'):
                redirect_url = r.get('redirect_url', '/gamification')
                break
    elif requires_combat:
        redirect_url = None  # Combate usa lógica específica do frontend
    else:
        redirect_url = '/map'

    return jsonify({
        'success': True,
        'results': results,
        'player_hp': player.hp,
        'player_max_hp': player.max_hp,
        'player_gold': player.run_gold,
        'requires_combat': requires_combat,
        'requires_redirect': requires_redirect,
        'redirect_url': redirect_url
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
# API - Sistema de Shop
# ============================================================================

@map_bp.route('/api/shop/generate', methods=['POST'])
def generate_shop_inventory():
    """
    Gera o inventário da loja para o jogador quando entra no nó shop.
    Cada nó shop tem seu próprio inventory único.

    Returns:
        JSON com inventário gerado
    """
    from models import ShopInventory, PlayerRelic
    from routes.relics.registry import get_all_relics, get_rarity_weights

    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 404

    # Pegar nó atual
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress or not progress.current_node_id:
        return jsonify({'success': False, 'error': 'Nó atual não encontrado'}), 400

    current_node_id = progress.current_node_id

    # Verificar se já existe inventory para este nó
    existing_inventory = ShopInventory.query.filter_by(
        player_id=player.id,
        node_id=current_node_id
    ).first()

    if existing_inventory:
        # Inventory já existe para este nó, retornar existente
        return jsonify({
            'success': True,
            'message': 'Inventory já existe para este shop',
            'items': [item.to_dict() for item in ShopInventory.query.filter_by(
                player_id=player.id,
                node_id=current_node_id
            ).all()]
        })

    # Limpar inventory de OUTROS nós (manter apenas do nó atual se houver)
    # Na prática, como estamos criando novo, não precisa fazer nada aqui

    # Gerar 3 poções
    potions = [
        {
            'type': 'potion',
            'id': 'potion_vital',
            'name': 'Poção Vital',
            'description': 'Cura 20 HP',
            'icon': 'resources/potion-vital.png',
            'price': random.randint(20, 30),
            'rarity': None
        },
        {
            'type': 'potion',
            'id': 'potion_protective',
            'name': 'Poção Protetora',
            'description': 'Concede 16 de Barreira',
            'icon': 'resources/potion-protective.png',
            'price': random.randint(18, 28),
            'rarity': None
        },
        {
            'type': 'potion',
            'id': 'potion_energetic',
            'name': 'Poção Energética',
            'description': 'Concede 5 de Energia',
            'icon': 'resources/potion-energetic.png',
            'price': random.randint(24, 34),
            'rarity': None
        }
    ]

    # Gerar 2 lembranças (vales lembrança com raridades)
    memory_rarities = ['common', 'rare', 'epic', 'legendary']
    memory_weights = [40, 35, 20, 5]  # Pesos de probabilidade
    memories = []

    for i in range(2):
        rarity = random.choices(memory_rarities, weights=memory_weights)[0]

        # Preço baseado na raridade
        price_ranges = {
            'common': (24, 36),
            'rare': (42, 59),
            'epic': (66, 78),
            'legendary': (84, 97)
        }

        price = random.randint(*price_ranges[rarity])

        memories.append({
            'type': 'memory',
            'id': f'memory_{i+1}',
            'name': 'Lembrança',
            'description': 'Adquira uma nova lembrança',
            'icon': 'resources/memory-icon.png',
            'price': price,
            'rarity': rarity
        })

    # Gerar 3 relíquias
    all_relics = get_all_relics()

    # Obter relíquias que o jogador já possui
    player_relic_ids = [pr.relic_id for pr in PlayerRelic.query.filter_by(player_id=player.id).all()]

    # Filtrar relíquias disponíveis (que o jogador ainda não tem)
    available_relics = [r for r in all_relics if r['id'] not in player_relic_ids]

    # Se não tem relíquias disponíveis suficientes, permitir repetidas
    if len(available_relics) < 3:
        available_relics = all_relics

    # Selecionar 3 relíquias aleatórias baseadas na raridade
    relic_rarity_weights = get_rarity_weights('shop')
    selected_relics = []

    for i in range(3):
        # Escolher raridade baseada nos pesos
        rarity = random.choices(
            list(relic_rarity_weights.keys()),
            weights=list(relic_rarity_weights.values())
        )[0]

        # Filtrar relíquias da raridade escolhida
        relics_of_rarity = [r for r in available_relics if r['rarity'] == rarity]

        # Se não tem relíquias dessa raridade, pegar qualquer uma
        if not relics_of_rarity:
            relics_of_rarity = available_relics

        # Selecionar relíquia aleatória
        relic = random.choice(relics_of_rarity)

        # Preço baseado na raridade
        price_ranges = {
            'common': (68, 102),
            'uncommon': (100, 140),
            'rare': (134, 170),
            'epic': (160, 210),
            'legendary': (180, 270)
        }

        price = random.randint(*price_ranges.get(relic['rarity'], (50, 100)))

        selected_relics.append({
            'type': 'relic',
            'id': relic['id'],
            'name': relic['name'],
            'description': relic['description'],
            'icon': relic['icon'],
            'price': price,
            'rarity': relic['rarity']
        })

    # Salvar no banco de dados
    all_items = potions + memories + selected_relics

    for item in all_items:
        shop_item = ShopInventory(
            player_id=player.id,
            node_id=current_node_id,  # Vincular ao nó atual
            item_type=item['type'],
            item_id=item['id'],
            price=item['price'],
            rarity=item['rarity']
        )
        db.session.add(shop_item)

    db.session.commit()

    return jsonify({
        'success': True,
        'items': all_items
    })


@map_bp.route('/api/shop/get-inventory', methods=['GET'])
def get_shop_inventory():
    """
    Retorna o inventário atual da loja do jogador.

    Returns:
        JSON com inventário
    """
    from models import ShopInventory
    from routes.relics.registry import get_relic_definition

    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 404

    # Pegar nó atual
    progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()
    if not progress or not progress.current_node_id:
        return jsonify({'success': False, 'error': 'Nó atual não encontrado'}), 400

    current_node_id = progress.current_node_id

    # Buscar inventário da loja DESTE NÓ
    shop_items = ShopInventory.query.filter_by(
        player_id=player.id,
        node_id=current_node_id,
        is_purchased=False
    ).all()

    # Se não tem inventário, gerar
    if not shop_items:
        # Redirecionar para geração
        return jsonify({
            'success': False,
            'error': 'Inventário não gerado',
            'should_generate': True
        })

    # Montar resposta
    items = []
    for shop_item in shop_items:
        if shop_item.item_type == 'potion':
            # Poções
            potion_data = {
                'vital': {
                    'name': 'Poção Vital',
                    'description': 'Cura 20 HP',
                    'icon': 'resources/potion-vital.png'
                },
                'protective': {
                    'name': 'Poção Protetora',
                    'description': 'Concede 16 de Barreira',
                    'icon': 'resources/potion-protective.png'
                },
                'energetic': {
                    'name': 'Poção Energética',
                    'description': 'Concede 5 de Energia',
                    'icon': 'resources/potion-energetic.png'
                }
            }

            potion_type = shop_item.item_id.replace('potion_', '')
            data = potion_data.get(potion_type, {})

            items.append({
                'id': shop_item.id,
                'type': 'potion',
                'item_id': shop_item.item_id,
                'name': data.get('name', 'Poção'),
                'description': data.get('description', ''),
                'icon': data.get('icon', 'resources/potion.png'),
                'price': shop_item.price,
                'rarity': None
            })

        elif shop_item.item_type == 'memory':
            # Lembranças
            items.append({
                'id': shop_item.id,
                'type': 'memory',
                'item_id': shop_item.item_id,
                'name': 'Lembrança',
                'description': 'Adquira uma nova lembrança',
                'icon': 'resources/memory-icon.png',
                'price': shop_item.price,
                'rarity': shop_item.rarity
            })

        elif shop_item.item_type == 'relic':
            # Relíquias
            relic = get_relic_definition(shop_item.item_id)
            if relic:
                items.append({
                    'id': shop_item.id,
                    'type': 'relic',
                    'item_id': shop_item.item_id,
                    'name': relic['name'],
                    'description': relic['description'],
                    'icon': relic['icon'],
                    'price': shop_item.price,
                    'rarity': relic['rarity']
                })

    return jsonify({
        'success': True,
        'items': items,
        'player_gold': player.run_gold
    })


@map_bp.route('/api/shop/buy-item/<int:shop_item_id>', methods=['POST'])
def buy_shop_item(shop_item_id):
    """
    Compra um item da loja.

    Args:
        shop_item_id: ID do item na tabela ShopInventory

    Returns:
        JSON com resultado da compra
    """
    from models import ShopInventory, PlayerPotionSlot
    from routes.relics.selection import award_relic_to_player

    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'error': 'Jogador não encontrado'}), 404

    # Buscar item da loja
    shop_item = ShopInventory.query.get(shop_item_id)
    if not shop_item or shop_item.player_id != player.id:
        return jsonify({'success': False, 'error': 'Item não encontrado'}), 404

    if shop_item.is_purchased:
        return jsonify({'success': False, 'error': 'Item já foi comprado'}), 400

    # Verificar se jogador tem ouro suficiente
    if player.run_gold < shop_item.price:
        return jsonify({'success': False, 'error': 'Ouro insuficiente'}), 400

    # Descontar ouro
    player.run_gold -= shop_item.price

    # Processar compra baseado no tipo
    if shop_item.item_type == 'potion':
        # Adicionar poção ao inventário
        potion_type = shop_item.item_id.replace('potion_', '')

        # Verificar se já tem essa poção em algum slot
        existing_slot = PlayerPotionSlot.query.filter_by(
            player_id=player.id,
            potion_type=potion_type
        ).first()

        if existing_slot:
            # Adicionar à quantidade existente
            existing_slot.quantity += 1
        else:
            # Encontrar slot vazio ou criar novo
            slots = PlayerPotionSlot.query.filter_by(player_id=player.id).order_by(PlayerPotionSlot.slot_number).all()

            # Garantir que existem 3 slots
            for i in range(1, 4):
                if not any(s.slot_number == i for s in slots):
                    new_slot = PlayerPotionSlot(
                        player_id=player.id,
                        slot_number=i,
                        potion_type=None,
                        quantity=0
                    )
                    db.session.add(new_slot)

            db.session.flush()

            # Recarregar slots
            slots = PlayerPotionSlot.query.filter_by(player_id=player.id).order_by(PlayerPotionSlot.slot_number).all()

            # Encontrar primeiro slot vazio
            empty_slot = None
            for slot in slots:
                if slot.potion_type is None or slot.quantity == 0:
                    empty_slot = slot
                    break

            if empty_slot:
                empty_slot.potion_type = potion_type
                empty_slot.quantity = 1
            else:
                return jsonify({'success': False, 'error': 'Inventário de poções cheio'}), 400

        result_message = f'Poção adicionada ao inventário'
        redirect_needed = False

    elif shop_item.item_type == 'memory':
        # Gerar opções de lembranças baseado na raridade
        shop_item.is_purchased = True
        db.session.commit()

        return jsonify({
            'success': True,
            'requires_redirect': True,
            'redirect_url': f'/gamification?show_memory_selection=true&rarity={shop_item.rarity}',
            'player_gold': player.run_gold
        })

    elif shop_item.item_type == 'relic':
        # Adicionar relíquia ao jogador
        success = award_relic_to_player(player.id, shop_item.item_id)

        if not success:
            # Reverter desconto de ouro
            player.run_gold += shop_item.price
            return jsonify({'success': False, 'error': 'Erro ao adicionar relíquia'}), 500

        result_message = f'Relíquia adquirida!'
        redirect_needed = False

    # Marcar como comprado
    shop_item.is_purchased = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': result_message,
        'player_gold': player.run_gold
    })


@map_bp.route('/api/shop/close', methods=['POST'])
def close_shop():
    """
    Fecha a loja e marca o nó como completo.

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
        if current_node and current_node.node_type == 'shop':
            current_node.is_completed = True
            progress.shops_visited = (progress.shops_visited or 0) + 1
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

    # Filtrar eventos baseado em condições (HP, gold, relíquias, etc)
    filtered_events = []
    for event in available_events:
        if _check_event_conditions(event, player, progress):
            filtered_events.append(event)

    # Se nenhum evento passou nas condições, usar todos disponíveis
    if not filtered_events:
        filtered_events = available_events

    # Calcular peso por raridade (70% common, 25% uncommon, 5% rare)
    # Sistema de anti-repetição: eventos recentes têm peso muito reduzido
    events_seen = progress.get_events_seen() if hasattr(progress, 'get_events_seen') else []

    weights = []
    for event in filtered_events:
        rarity = event.get('rarity', 'common')
        base_weight = 70 if rarity == 'common' else (25 if rarity == 'uncommon' else 5)

        # Boost weight se condições especiais forem atendidas
        boost = _get_event_weight_boost(event, player)

        # ANTI-REPETIÇÃO: Penalizar eventos vistos recentemente
        # Lista events_seen é ordenada: [mais recente, ..., mais antigo]
        anti_repeat_penalty = 1.0
        event_id = event['id']

        if event_id in events_seen:
            # Encontrar posição do evento (0 = mais recente)
            position = events_seen.index(event_id)

            if position == 0:
                # Último evento visto: reduz peso em 95% (quase impossível repetir)
                anti_repeat_penalty = 0.05
            elif position == 1:
                # Penúltimo evento: reduz peso em 80%
                anti_repeat_penalty = 0.2
            elif position == 2:
                # Antepenúltimo: reduz peso em 60%
                anti_repeat_penalty = 0.4
            elif position <= 4:
                # Eventos 3-4 atrás: reduz peso em 40%
                anti_repeat_penalty = 0.6
            else:
                # Eventos mais antigos (5+): penalidade leve de 20%
                anti_repeat_penalty = 0.8

        final_weight = base_weight * boost * anti_repeat_penalty

        weights.append(final_weight)

    # Selecionar evento
    selected = random.choices(filtered_events, weights=weights, k=1)[0]

    # Resetar seed para não afetar outros sistemas
    random.seed()

    return selected


def _check_event_conditions(event: dict, player, progress) -> bool:
    """
    Verifica se as condições de um evento são atendidas.

    Args:
        event: Dicionário do evento
        player: Jogador
        progress: Progresso do jogador

    Returns:
        True se todas as condições forem atendidas
    """
    conditions = event.get('conditions', {})

    # Sem condições = sempre disponível
    if not conditions:
        return True

    # Verificar HP mínimo (percentual)
    if 'min_hp_percent' in conditions:
        hp_percent = player.hp / player.max_hp if player.max_hp > 0 else 0
        if hp_percent < conditions['min_hp_percent']:
            return False

    # Verificar HP máximo (percentual)
    if 'max_hp_percent' in conditions:
        hp_percent = player.hp / player.max_hp if player.max_hp > 0 else 0
        if hp_percent > conditions['max_hp_percent']:
            return False

    # Verificar gold mínimo
    if 'min_gold' in conditions:
        if player.run_gold < conditions['min_gold']:
            return False

    # Verificar número mínimo de relíquias
    if 'min_relics' in conditions:
        from models import PlayerRelic
        relic_count = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).count()
        if relic_count < conditions['min_relics']:
            return False

    # Verificar eventos one-time (só pode acontecer 1x por run)
    if conditions.get('one_time', False):
        # Verificar se já aconteceu nesta run
        events_seen = progress.get_events_seen() if hasattr(progress, 'get_events_seen') else []
        if event['id'] in events_seen:
            return False

    return True


def _get_event_weight_boost(event: dict, player) -> float:
    """
    Calcula boost de peso baseado em condições especiais.

    Args:
        event: Dicionário do evento
        player: Jogador

    Returns:
        Multiplicador de peso (1.0 = sem boost, 2.0 = dobro, etc)
    """
    conditions = event.get('conditions', {})
    boost_rules = conditions.get('boost_weight_if', {})

    if not boost_rules:
        return 1.0

    boost = 1.0

    # Boost se HP estiver abaixo de um threshold
    if 'hp_below' in boost_rules:
        hp_percent = player.hp / player.max_hp if player.max_hp > 0 else 0
        if hp_percent < boost_rules['hp_below']:
            boost *= 2.0

    # Boost se gold estiver acima de um threshold
    if 'gold_above' in boost_rules:
        if player.run_gold > boost_rules['gold_above']:
            boost *= 1.5

    return boost


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
