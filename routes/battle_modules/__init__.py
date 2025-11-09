# routes/battle/__init__.py
"""
Módulo de batalha - Sistema de combate e inimigos genéricos
"""

# Importar apenas as funções dos submódulos, NÃO o blueprint
from .enemy_generation import (
    generate_enemy_by_theme,
    ensure_minimum_enemies,
    get_minimum_enemy_count,
    initialize_enemy_themes,
    calculate_enemy_base_stats,
    calculate_rarity_chances,
    apply_rarity_modifiers,
    check_and_create_boss_milestone,
    clean_expired_enemies,
    calculate_equipment_rank,
    load_enemy_themes_config,
    update_theme_proportions
)

from .reward_system import (
    determine_enemy_reward_type,
    calculate_gold_reward,
    calculate_hourglass_reward,
    get_player_run_buffs,
    get_run_buff_total,
    add_run_buff,
    select_random_memory_options,
    format_buff_display_value,
    format_memory_value_display,
    register_memory_routes,
    REWARD_SYSTEM,
    MEMORY_TYPES
)

from .battle_utils import (
    apply_damage_to_player,
    add_boss_to_bestiary,
    check_login_rewards,
    update_rounds_for_all_enemies,
    initialize_game_for_new_player,
    format_buff_duration,
    apply_buffs_to_stats
)

# ❌ REMOVER ESTA LINHA (causava o erro circular):
# from ..battle import battle_bp

# Exportar apenas as funções, NÃO o blueprint
__all__ = [
    'generate_enemy_by_theme',
    'ensure_minimum_enemies',
    'initialize_enemy_themes',
    'calculate_enemy_base_stats',
    'calculate_rarity_chances',
    'apply_rarity_modifiers',
    'check_and_create_boss_milestone',
    'clean_expired_enemies',
    'calculate_equipment_rank',
    'load_enemy_themes_config',
    'update_theme_proportions',
    'determine_enemy_reward_type',
    'calculate_gold_reward',
    'calculate_hourglass_reward',
    'get_player_run_buffs',
    'get_run_buff_total',
    'add_run_buff',
    'select_random_memory_options',
    'format_buff_display_value',
    'format_memory_value_display',
    'register_memory_routes',
    'REWARD_SYSTEM',
    'MEMORY_TYPES',
    'apply_damage_to_player',
    'add_boss_to_bestiary',
    'check_login_rewards',
    'update_rounds_for_all_enemies',
    'initialize_game_for_new_player',
    'format_buff_duration'
]