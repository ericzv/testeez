#!/usr/bin/env python3
"""
Script para fixar stats, ações e recompensas de todos os inimigos
"""
import json
import random

# Carregar templates
with open('static/game.data/enemy_templates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

templates = data['templates']

# ========================================
# 1. ORGANIZAR POR GRUPOS
# ========================================
print("📊 Organizando inimigos por grupos...")

# Calcular tier total para cada template
for t in templates:
    tiers = t.get('equipment_tiers', {})
    t['total_tier'] = tiers.get('body', 0) + tiers.get('head', 0) + tiers.get('weapon', 0)

# Ordenar por tier total
templates.sort(key=lambda x: x['total_tier'])

# Dividir em 7 grupos (excluindo aqueles com manual_group)
templates_without_manual_group = [t for t in templates if 'manual_group' not in t]
templates_with_manual_group = [t for t in templates if 'manual_group' in t]

# Organizar os sem manual_group em 6 grupos (0-5)
group_size = len(templates_without_manual_group) // 6
remainder = len(templates_without_manual_group) % 6

groups = [[] for _ in range(7)]
current_idx = 0

for i in range(6):
    size = group_size + (1 if i < remainder else 0)
    for _ in range(size):
        if current_idx < len(templates_without_manual_group):
            t = templates_without_manual_group[current_idx]
            t['group'] = i
            groups[i].append(t)
            current_idx += 1

# Adicionar os com manual_group aos seus respectivos grupos
for t in templates_with_manual_group:
    group_idx = t['manual_group']
    t['group'] = group_idx
    groups[group_idx].append(t)

print(f"✅ Distribuição por grupos:")
for i, group in enumerate(groups):
    print(f"   Grupo {i}: {len(group)} inimigos")

# ========================================
# 2. DEFINIR STATS FIXOS BASEADO NO GRUPO
# ========================================
print("\n💪 Definindo stats fixos...")

# Ranges de stats por grupo
group_stat_ranges = {
    0: {'hp': (32, 48),   'damage': (8, 12)},    # Grupo 1 - Enemy 1-16
    1: {'hp': (48, 64),   'damage': (12, 16)},   # Grupo 2 - Enemy 17-33
    2: {'hp': (64, 80),   'damage': (16, 20)},   # Grupo 3 - Enemy 34-50
    3: {'hp': (80, 96),   'damage': (20, 24)},   # Grupo 4 - Enemy 51-66
    4: {'hp': (96, 112),  'damage': (24, 28)},   # Grupo 5 - Enemy 67-83
    5: {'hp': (112, 128), 'damage': (28, 32)},   # Grupo 6 - Enemy 84-100
    6: {'hp': (128, 144), 'damage': (32, 36)}    # Grupo 7 - Elites (Desafiantes Infernais)
}

for group_idx, group in enumerate(groups):
    stat_range = group_stat_ranges[group_idx]
    hp_min, hp_max = stat_range['hp']
    damage_min, damage_max = stat_range['damage']

    # Distribuir stats uniformemente dentro do grupo
    group_size = len(group)

    for i, enemy in enumerate(group):
        # Posição relativa no grupo (0.0 a 1.0)
        position = i / max(group_size - 1, 1)

        # Calcular stats baseado na posição
        fixed_hp = int(hp_min + (hp_max - hp_min) * position)
        fixed_damage = int(damage_min + (damage_max - damage_min) * position)

        enemy['fixed_hp'] = fixed_hp
        enemy['fixed_damage'] = fixed_damage

        print(f"   {enemy['name']} (Grupo {group_idx}): HP={fixed_hp}, Dano={fixed_damage}")

# ========================================
# 3. CRIAR PADRÕES DE AÇÕES CÍCLICOS
# ========================================
print("\n⚔️ Criando padrões de ações cíclicos...")

# Padrões base por grupo (quanto maior o grupo, mais complexo)
action_pattern_templates = {
    0: [  # Grupo 1 - Simples
        ["attack"],
        ["attack", "attack"],
        ["attack", "attack", "attack"],
    ],
    1: [  # Grupo 2 - Simples+
        ["attack", "attack"],
        ["attack", "attack", "attack"],
        ["attack", "skill", "attack"],
    ],
    2: [  # Grupo 3 - Intermediário
        ["attack", "attack", "attack"],
        ["attack", "skill", "attack"],
        ["attack", "attack", "skill"],
    ],
    3: [  # Grupo 4 - Intermediário+
        ["attack", "skill", "attack", "attack"],
        ["attack", "attack", "skill", "attack"],
        ["attack", "attack", "attack", "skill"],
    ],
    4: [  # Grupo 5 - Avançado
        ["attack", "attack", "skill", "attack", "attack"],
        ["attack", "skill", "attack", "skill"],
        ["attack", "attack", "attack", "attack", "skill"],
    ],
    5: [  # Grupo 6 - Avançado+
        ["attack", "attack", "skill", "attack", "skill"],
        ["attack", "skill", "attack", "attack", "skill"],
        ["skill", "attack", "attack", "attack", "skill"],
    ],
    6: [  # Grupo 7 - Elite
        ["attack", "attack", "skill", "skill", "attack"],
        ["skill", "attack", "attack", "skill", "attack"],
        ["attack", "skill", "attack", "skill", "skill"],
    ]
}

for group_idx, group in enumerate(groups):
    pattern_options = action_pattern_templates[group_idx]

    for enemy in group:
        # Escolher um padrão aleatório para este inimigo (será fixo para ele)
        random.seed(enemy.get('id', 0))  # Usar ID como seed para consistência
        pattern = random.choice(pattern_options)

        enemy['action_pattern'] = pattern
        print(f"   {enemy['name']}: {' → '.join(pattern)}")

# ========================================
# 4. ADICIONAR RECOMPENSAS FIXAS
# ========================================
print("\n💰 Adicionando recompensas fixas...")

# Recompensas base por grupo
reward_ranges = {
    0: {'memory_crystals': (8, 12), 'gold': (3, 6), 'potion_chance': 5},
    1: {'memory_crystals': (12, 18), 'gold': (6, 10), 'potion_chance': 8},
    2: {'memory_crystals': (18, 25), 'gold': (10, 15), 'potion_chance': 10},
    3: {'memory_crystals': (25, 35), 'gold': (15, 22), 'potion_chance': 12},
    4: {'memory_crystals': (35, 45), 'gold': (22, 30), 'potion_chance': 15},
    5: {'memory_crystals': (45, 60), 'gold': (30, 40), 'potion_chance': 18},
    6: {'memory_crystals': (60, 80), 'gold': (40, 55), 'potion_chance': 25},
}

# Tipos de poções disponíveis
potion_types = ['health_potion', 'mana_potion', 'strength_potion', 'defense_potion']

for group_idx, group in enumerate(groups):
    reward_range = reward_ranges[group_idx]
    mc_min, mc_max = reward_range['memory_crystals']
    gold_min, gold_max = reward_range['gold']
    potion_chance = reward_range['potion_chance']

    for enemy in group:
        # Usar ID como seed para consistência
        random.seed(enemy.get('id', 0) + 1000)

        # Calcular recompensas fixas
        memory_crystals = random.randint(mc_min, mc_max)
        gold = random.randint(gold_min, gold_max)

        # Verificar se dropa poção
        drops_potion = random.randint(1, 100) <= potion_chance
        potion_type = random.choice(potion_types) if drops_potion else None

        enemy['rewards'] = {
            'memory_crystals': memory_crystals,
            'gold': gold,
            'potion': potion_type,
            'potion_chance': potion_chance  # Para referência
        }

        potion_info = f", Poção: {potion_type}" if potion_type else ""
        print(f"   {enemy['name']}: {memory_crystals} cristais, {gold} ouro{potion_info}")

# ========================================
# 5. SALVAR TEMPLATES ATUALIZADOS
# ========================================
print("\n💾 Salvando templates atualizados...")

# Remover chave 'group' temporária (manter manual_group se existir)
for t in templates:
    if 'group' in t and 'manual_group' not in t:
        del t['group']

# Salvar de volta
with open('static/game.data/enemy_templates.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Templates atualizados com sucesso!")
print(f"\n📊 Resumo:")
print(f"   Total de inimigos: {len(templates)}")
print(f"   Grupos: 7 (0-6)")
print(f"   Stats: HP e Dano fixos por inimigo")
print(f"   Ações: Padrões cíclicos fixos por inimigo")
print(f"   Recompensas: Cristais + Ouro + Chance de Poção")
