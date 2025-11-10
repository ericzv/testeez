"""
Fórmulas de jogo centralizadas
ÚNICA fonte de verdade para cálculos de progressão
"""

from core.constants.game_constants import XP_BASE, XP_LEVEL_EXPONENT


def get_exp_for_next_level(level: int) -> int:
    """
    Calcula a experiência necessária para o próximo nível.

    FÓRMULA: 100 × (level ^ 1.5)

    Esta é a ÚNICA implementação válida desta função.
    Todas as outras devem ser removidas e substituídas por imports daqui.

    Args:
        level: Nível atual do jogador

    Returns:
        Experiência necessária para subir ao próximo nível

    Examples:
        >>> get_exp_for_next_level(1)
        100
        >>> get_exp_for_next_level(10)
        316
        >>> get_exp_for_next_level(50)
        3535
    """
    if level < 1:
        raise ValueError("Nível deve ser >= 1")

    return int(XP_BASE * (level ** XP_LEVEL_EXPONENT))


def get_total_exp_for_level(level: int) -> int:
    """
    Calcula a experiência TOTAL necessária para atingir um nível.

    Args:
        level: Nível desejado

    Returns:
        XP total acumulado necessário

    Examples:
        >>> get_total_exp_for_level(5)
        1118  # Soma de XP do 1→2, 2→3, 3→4, 4→5
    """
    if level < 1:
        raise ValueError("Nível deve ser >= 1")

    total = 0
    for lvl in range(1, level):
        total += get_exp_for_next_level(lvl)
    return total


def levels_gained_from_exp(current_level: int, current_exp: int, exp_gained: int) -> tuple:
    """
    Calcula quantos níveis o jogador sobe com a experiência ganha.

    Args:
        current_level: Nível atual
        current_exp: XP atual do nível atual
        exp_gained: XP ganho

    Returns:
        Tupla (novos_níveis, xp_restante)

    Examples:
        >>> levels_gained_from_exp(1, 50, 100)
        (1, 50)  # Subiu 1 nível, sobrou 50 XP
    """
    level = current_level
    exp = current_exp + exp_gained
    levels_gained = 0

    while exp >= get_exp_for_next_level(level):
        exp -= get_exp_for_next_level(level)
        level += 1
        levels_gained += 1

    return levels_gained, exp
