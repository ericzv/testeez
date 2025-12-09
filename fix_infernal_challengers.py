#!/usr/bin/env python3
"""
Script para ajustar os Desafiantes Infernais para o Grupo 6 (Elites)
"""
import json

# Carregar templates
with open('static/game.data/enemy_templates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

templates = data['templates']

# Definir quais inimigos são Desafiantes Infernais (Grupo 6 - Elites)
infernal_names = [
    # Ato 1
    "Diabo Verde",
    "Sanguinolato",
    # Ato 2
    "Redline",
    "Brasa",
    "Maldade Rubra",
    # Ato 3
    "Réprobo",
    "Inquirido",
    "Cremado"
]

print("🔥 Ajustando Desafiantes Infernais para Grupo 6 (Elites)...")

# Marcar os Infernais com manual_group = 6
for template in templates:
    if template['name'] in infernal_names:
        template['manual_group'] = 6
        print(f"   ✅ {template['name']} → Grupo 6 (Elite)")

# Salvar de volta
with open('static/game.data/enemy_templates.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✅ Desafiantes Infernais ajustados com sucesso!")
print(f"   Total de Elites: {len(infernal_names)}")
