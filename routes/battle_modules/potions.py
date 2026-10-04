"""
Inventário de poções (3 slots por jogador).

Usado pela loja do mapa e pelas poções que inimigos derrubam ao morrer.
Nenhuma função aqui faz commit.
"""
from database import db
from models import PlayerPotionSlot

MAX_POTION_SLOTS = 3

POTION_INFO = {
    'vital': {'name': 'Poção Vital', 'description': 'Cura 20 HP',
              'icon': 'resources/potion-vital.png'},
    'protective': {'name': 'Poção Protetora', 'description': 'Concede 16 de Barreira',
                   'icon': 'resources/potion-protective.png'},
    'energetic': {'name': 'Poção Energética', 'description': 'Concede 5 de Energia',
                  'icon': 'resources/potion-energetic.png'},
}

# Os templates de inimigos (enemy_templates.json) ainda usam os nomes antigos.
# Mana virou energia; não existe poção de força, então ela vira energética.
ENEMY_DROP_TO_POTION = {
    'health_potion': 'vital',
    'defense_potion': 'protective',
    'mana_potion': 'energetic',
    'strength_potion': 'energetic',
}


def potion_type_from_drop(drop_name):
    """Converte o nome do drop do inimigo no tipo de poção do inventário (ou None)."""
    if not drop_name:
        return None
    if drop_name in POTION_INFO:
        return drop_name
    return ENEMY_DROP_TO_POTION.get(drop_name)


def ensure_potion_slots(player_id):
    """Garante que o jogador tem os 3 slots criados e retorna-os ordenados."""
    slots = PlayerPotionSlot.query.filter_by(player_id=player_id).order_by(PlayerPotionSlot.slot_number).all()
    existing = {s.slot_number for s in slots}
    created = False
    for number in range(1, MAX_POTION_SLOTS + 1):
        if number not in existing:
            db.session.add(PlayerPotionSlot(player_id=player_id, slot_number=number, potion_type=None, quantity=0))
            created = True
    if created:
        db.session.flush()
        slots = PlayerPotionSlot.query.filter_by(player_id=player_id).order_by(PlayerPotionSlot.slot_number).all()
    return slots


def add_potion_to_inventory(player_id, potion_type):
    """
    Adiciona uma poção: empilha num slot do mesmo tipo ou ocupa o primeiro slot vazio.
    Retorna True se coube, False se os 3 slots estão ocupados com outros tipos.
    """
    existing_slot = PlayerPotionSlot.query.filter_by(player_id=player_id, potion_type=potion_type).first()
    if existing_slot:
        existing_slot.quantity += 1
        return True

    for slot in ensure_potion_slots(player_id):
        if slot.potion_type is None or slot.quantity == 0:
            slot.potion_type = potion_type
            slot.quantity = 1
            return True
    return False
