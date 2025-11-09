"""
Sistema de Relíquias - API Pública
"""

# Expor funções principais
from .hooks import (
    on_combat_start,
    before_attack,
    after_attack,
    on_kill,
    on_rewards,
    reset_battle_counters
)

from .selection import (
    generate_relic_options,
    award_relic_to_player,
    format_relic_for_display,
    format_relic_with_counter,
    add_relic_for_testing  # Para testes
)

from .registry import get_relic_definition, get_all_relic_ids

__all__ = [
    # Hooks
    'on_combat_start',
    'before_attack',
    'after_attack',
    'on_kill',
    'on_rewards',
    'reset_battle_counters',
    
    # Selection
    'generate_relic_options',
    'award_relic_to_player',
    'format_relic_for_display',
    'format_relic_with_counter',
    'add_relic_for_testing',
    
    # Registry
    'get_relic_definition',
    'get_all_relic_ids'
]