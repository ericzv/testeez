"""
Módulos para o sistema de mapa procedural.
"""

from .generation import MapGenerator
from .node_types import get_node_icon, get_node_color, NODE_TYPE_INFO
from .events import EVENT_DEFINITIONS, get_event_by_id, get_events_for_act
from .event_effects import apply_event_effects, check_choice_requirements

__all__ = [
    'MapGenerator',
    'get_node_icon',
    'get_node_color',
    'NODE_TYPE_INFO',
    'EVENT_DEFINITIONS',
    'get_event_by_id',
    'get_events_for_act',
    'apply_event_effects',
    'check_choice_requirements'
]
