"""
Definições e informações sobre tipos de nós do mapa.
"""

# Informações completas sobre cada tipo de nó
NODE_TYPE_INFO = {
    'battle': {
        'name': 'Batalha',
        'icon': 'crossed_swords',
        'emoji': '⚔️',
        'color': '#4a4a4a',
        'color_hex': 0x4a4a4a,
        'description': 'Enfrente um inimigo comum',
        'reward_type': 'mixed'
    },
    'elite': {
        'name': 'Desafiante Infernal',
        'icon': 'fire',
        'emoji': '🔥',
        'color': '#ff4444',
        'color_hex': 0xff4444,
        'description': 'Batalha difícil com melhor recompensa',
        'reward_type': 'elite'
    },
    'shop': {
        'name': 'Loja',
        'icon': 'shopping_cart',
        'emoji': '🛒',
        'color': '#ffd700',
        'color_hex': 0xffd700,
        'description': 'Compre itens e melhorias',
        'reward_type': 'none'
    },
    'event': {
        'name': 'Evento Aleatório',
        'icon': 'question',
        'emoji': '❓',
        'color': '#00ff88',
        'color_hex': 0x00ff88,
        'description': 'Um encontro misterioso',
        'reward_type': 'varied'
    },
    'rest': {
        'name': 'Descanso',
        'icon': 'campfire',
        'emoji': '🏕️',
        'color': '#44aaff',
        'color_hex': 0x44aaff,
        'description': 'Recupere HP e descanse',
        'reward_type': 'heal'
    },
    'boss': {
        'name': 'Boss Final',
        'icon': 'skull',
        'emoji': '💀',
        'color': '#9900ff',
        'color_hex': 0x9900ff,
        'description': 'O guardião desta fase',
        'reward_type': 'boss'
    }
}

# Bosses finais por ato
FINAL_BOSSES = {
    1: {
        'id': 1,
        'name': 'Purassombra',
        'description': 'O primeiro guardião das trevas'
    },
    2: {
        'id': 4,  # Assumindo que é o ID 4 no banco
        'name': 'Formofagus',
        'description': 'O devorador de formas'
    },
    3: {
        'id': 5,  # Assumindo que é o ID 5 no banco
        'name': 'Nefasto',
        'description': 'A encarnação do mal supremo'
    }
}

# Sub-bosses para Desafiante Infernal (elites)
ELITE_BOSSES = [
    {
        'id': 2,
        'name': 'Heresiarca',
        'description': 'Líder dos hereges'
    },
    {
        'id': 3,
        'name': 'Alma Negra',
        'description': 'Espírito corrompido pela escuridão'
    }
]


def get_node_icon(node_type: str) -> str:
    """
    Retorna o emoji/ícone para um tipo de nó.

    Args:
        node_type: Tipo do nó

    Returns:
        String com emoji
    """
    info = NODE_TYPE_INFO.get(node_type, {})
    return info.get('emoji', '?')


def get_node_color(node_type: str) -> int:
    """
    Retorna a cor hexadecimal para um tipo de nó.

    Args:
        node_type: Tipo do nó

    Returns:
        Inteiro hexadecimal da cor
    """
    info = NODE_TYPE_INFO.get(node_type, {})
    return info.get('color_hex', 0x666666)


def get_node_name(node_type: str) -> str:
    """
    Retorna o nome legível do tipo de nó.

    Args:
        node_type: Tipo do nó

    Returns:
        Nome em português
    """
    info = NODE_TYPE_INFO.get(node_type, {})
    return info.get('name', 'Desconhecido')


def get_elite_boss():
    """
    Retorna um sub-boss aleatório para Desafiante Infernal.
    Alterna entre Heresiarca e Alma Negra.

    Returns:
        Dict com informações do sub-boss
    """
    import random
    return random.choice(ELITE_BOSSES)


def get_final_boss(act_number: int) -> dict:
    """
    Retorna o boss final para um ato específico.

    Args:
        act_number: Número do ato (1, 2 ou 3)

    Returns:
        Dict com informações do boss
    """
    return FINAL_BOSSES.get(act_number, FINAL_BOSSES[1])
