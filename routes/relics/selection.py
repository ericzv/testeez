"""
Sistema de seleção e aquisição de relíquias.
"""

import random
from database import db
from models import Player, PlayerRelic, RelicDefinition
from .registry import get_relic_definition, get_all_relic_ids, get_rarity_weights
from .hooks import on_acquire

def generate_relic_options(player_id, context='first_relic'):
    """
    Gera opções de relíquias para escolha.
    SEMPRE gera 3 opções base (+ ID 49 se houver).
    
    Args:
        player_id: ID do jogador
        context: 'first_relic' ou 'last_boss'
    
    Returns:
        Lista de definições de relíquias
    """
    from models import PlayerRelic
    
    # Base: sempre 3 opções
    count = 3
        
    # ID 49: +1 opção sempre
    extra_option_relic = PlayerRelic.query.filter_by(
        player_id=player_id,
        relic_id='49',
        is_active=True
    ).first()
    if extra_option_relic:
        count += 1
        print(f"🔿 Coleção de Tecla: +1 opção ({count} opções)")

    player = Player.query.get(player_id)
    
    # Relíquias já possuídas
    owned_relic_ids = [r.relic_id for r in player.relics if r.is_active]
    
    # Pool disponível
    all_ids = get_all_relic_ids()
    available_ids = [rid for rid in all_ids if rid not in owned_relic_ids]
    
    if len(available_ids) < count:
        count = len(available_ids)
    
    if count == 0:
        return []
    
    # Pesos de raridade
    rarity_weights = get_rarity_weights(context)
    
    # Separar por raridade
    by_rarity = {}
    for rid in available_ids:
        definition = get_relic_definition(rid)
        rarity = definition['rarity']
        if rarity not in by_rarity:
            by_rarity[rarity] = []
        by_rarity[rarity].append(definition)
    
    # Selecionar com peso
    selected = []
    for _ in range(count):
        # Escolher raridade
        rarities = list(rarity_weights.keys())
        weights = [rarity_weights[r] for r in rarities]
        
        # Filtrar raridades que ainda têm relíquias disponíveis
        available_rarities = [(r, w) for r, w in zip(rarities, weights) 
                             if r in by_rarity and len(by_rarity[r]) > 0]
        
        if not available_rarities:
            break
        
        rarities, weights = zip(*available_rarities)
        chosen_rarity = random.choices(rarities, weights=weights)[0]
        
        # Escolher relíquia dessa raridade
        relic = random.choice(by_rarity[chosen_rarity])
        selected.append(relic)
        
        # Remover para não repetir
        by_rarity[chosen_rarity].remove(relic)
    
    return selected

def award_relic_to_player(player_id, relic_id):
    """
    Adiciona relíquia ao jogador.
    
    Args:
        player_id: ID do jogador
        relic_id: ID da relíquia
    
    Returns:
        PlayerRelic criado
    """
    from datetime import datetime
    
    # Criar PlayerRelic
    player_relic = PlayerRelic(
        player_id=player_id,
        relic_id=relic_id,
        acquired_at=datetime.utcnow(),
        counter_value=0,
        times_triggered=0,
        is_active=True
    )
    db.session.add(player_relic)
    db.session.flush()  # Para ter o ID
    
    # Efeito on_acquire
    definition = get_relic_definition(relic_id)
    if 'on_acquire' in definition.get('hooks', []):
        on_acquire(player_id, player_relic)
    
    # Se afeta cache, recalcular
    if _affects_cache(definition):
        from routes.battle_cache import calculate_attack_cache
        calculate_attack_cache(player_id)
    
    db.session.commit()
    return player_relic

def _affects_cache(definition):
    """
    Verifica se relíquia afeta cache de combate.
    
    Cache deve ser recalculado quando:
    - Modifica stats base (HP/MP/etc)
    - Modifica dano permanente
    - Modifica crítico/bloqueio/esquiva permanente
    - Modifica custos de skills
    """
    effect_type = definition['effect']['type']
    
    cache_affecting = [
        # Stats base
        'stat_boost',                # ID 41, 42 - HP/MP máximo
        
        # Dano permanente
        'accumulating_damage',       # ID 20 - Acumuladora
        'paradox_power',             # ID 21 - Paradoxo da Liberdade
        'power_kill_bonus',          # ID 26 - Báculo Carregado
        'damage_per_relic',          # ID 22 - Petrus
        
        # Modificadores de skills
        'special_trade',             # ID 23 - Doxologia (dobra Especial)
        
        # Bônus por quantidade de relíquias
        'crit_per_relic',            # ID 13 - Coleção de Espinhos
        'block_per_relic',           # ID 43 - Muralha de Constantino
        'lifesteal_per_relic'        # ID 44 - Amuleto Sedento
    ]
    
    return effect_type in cache_affecting

def format_relic_for_display(relic_definition):
    """Formata relíquia para exibição no frontend"""
    return {
        'id': relic_definition['id'],
        'name': relic_definition['name'],
        'description': relic_definition['description'],
        'icon': relic_definition['icon'],
        'rarity': relic_definition['rarity']
    }

def format_relic_with_counter(player_relic):
    """Formata relíquia do jogador com contador"""
    definition = get_relic_definition(player_relic.relic_id)
    
    data = {
        'id': player_relic.id,
        'relic_id': player_relic.relic_id,
        'name': definition['name'],
        'description': definition['description'],
        'icon': definition['icon'],
        'rarity': definition['rarity'],
        'requires_counter': definition['requires_counter'],
        'times_triggered': player_relic.times_triggered
    }
    
    if definition['requires_counter']:
        data['counter_value'] = player_relic.counter_value
        data['counter_threshold'] = definition.get('counter_threshold')
    
    return data

# ===== FUNÇÃO DE TESTE =====

def add_relic_for_testing(player_id, relic_id):
    """
    Adiciona relíquia diretamente ao jogador (para testes).
    
    Uso:
        from routes.relics.selection import add_relic_for_testing
        add_relic_for_testing(1, 'vampire_fang')
    """
    return award_relic_to_player(player_id, relic_id)