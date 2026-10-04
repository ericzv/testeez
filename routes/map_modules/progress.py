"""
Conclusão de nós do mapa.

Antes, um nó de batalha só era concluído quando o NAVEGADOR chamava
/map/api/complete-node no fim da animação de morte do inimigo. Se algo falhasse
no frontend (erro de JS, aba recarregada, internet caindo), o jogador ficava
preso no nó sem conseguir avançar (bug "recompensa não aparece").

Agora o próprio servidor conclui o nó de batalha/elite assim que o inimigo
morre, e a conclusão é idempotente (chamar de novo não conta a vitória 2x).
O nó de boss continua sendo concluído pelo /map/api/complete-node, porque ele
avança o ato e o frontend precisa da resposta (fim de jogo, próximo ato).

Nenhuma função aqui faz commit; quem chama decide quando gravar.
"""
from models_map import MapNode, PlayerMapProgress

COMBAT_NODE_TYPES = ('battle', 'elite')


def unlock_next_nodes(node):
    """Libera os nós conectados acima de `node`."""
    for (up_x, up_y) in node.get_connections_up():
        next_node = MapNode.query.filter_by(map_id=node.map_id, x=up_x, y=up_y).first()
        if next_node and not next_node.is_visited:
            next_node.is_available = True


def mark_node_completed(progress, node):
    """
    Marca o nó como concluído e atualiza as estatísticas da run.
    Idempotente: retorna False (sem alterar nada) se o nó já estava concluído.
    Não trata o avanço de ato do boss (ver complete_current_node em routes/map.py).
    """
    if node.is_completed:
        return False

    node.is_completed = True

    if node.node_type in COMBAT_NODE_TYPES:
        unlock_next_nodes(node)

    if node.node_type == 'battle':
        progress.battles_won += 1
    elif node.node_type == 'elite':
        progress.elites_defeated += 1
    return True


def complete_current_combat_node(player_id):
    """
    Chamado pelo servidor quando o inimigo do nó atual é derrotado.
    Só age em nós de batalha/elite. Retorna o nó concluído ou None.
    """
    progress = PlayerMapProgress.query.filter_by(player_id=player_id).first()
    if not progress or not progress.current_node_id:
        return None
    node = MapNode.query.get(progress.current_node_id)
    if not node or node.node_type not in COMBAT_NODE_TYPES:
        return None
    if mark_node_completed(progress, node):
        return node
    return None


def repair_stuck_battle_node(player_id):
    """
    Conserta saves que travaram antes desta correção: se o nó atual é uma
    batalha cujo inimigo já está morto mas o nó não foi concluído, conclui.
    Retorna True se consertou algo.
    """
    from models import GenericEnemy

    progress = PlayerMapProgress.query.filter_by(player_id=player_id).first()
    if not progress or not progress.current_node_id:
        return False
    node = MapNode.query.get(progress.current_node_id)
    if not node or node.node_type != 'battle' or node.is_completed or not node.enemy_id:
        return False
    enemy = GenericEnemy.query.get(node.enemy_id)
    if enemy and enemy.hp <= 0:
        return mark_node_completed(progress, node)
    return False
