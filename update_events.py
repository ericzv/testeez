"""
Script para atualizar eventos com condições e raridades corretas
"""
import re

# Mapeamento completo de configurações
EVENT_CONFIGS = {
    'tumulo_profanado': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'relicario_abandonado': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'fonte_de_sangue': {'rarity': 'common', 'min_act': 1, 'conditions': {'boost_weight_if': {'hp_below': 0.7}}},
    'camara_regeneracao': {'rarity': 'common', 'min_act': 1, 'conditions': {'max_hp_percent': 0.6, 'boost_weight_if': {'hp_below': 0.4}}},
    'tesouro_amaldicoado': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'cacador_recompensas': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'forja_sombria': {'rarity': 'common', 'min_act': 1, 'conditions': {'min_gold': 30}},
    'biblioteca_proibida': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'mestre_armas': {'rarity': 'common', 'min_act': 2, 'conditions': {'min_gold': 50}},
    'goblin_vendedor': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'poco_desejos': {'rarity': 'common', 'min_act': 1, 'conditions': {'min_gold': 15}},
    'fantasma_heroi': {'rarity': 'common', 'min_act': 2, 'conditions': {}},
    'encruzilhada_mistica': {'rarity': 'common', 'min_act': 1, 'conditions': {}},
    'espelho_dimensional': {'rarity': 'common', 'min_act': 2, 'conditions': {}},

    'comerciante_sombrio': {'rarity': 'uncommon', 'min_act': 1, 'conditions': {'boost_weight_if': {'gold_above': 50}}},
    'altar_sangue_antigo': {'rarity': 'uncommon', 'min_act': 2, 'conditions': {'boost_weight_if': {'hp_below': 0.5}}},
    'vampiro_anciao': {'rarity': 'uncommon', 'min_act': 2, 'conditions': {'min_hp_percent': 0.4}},
    'roda_fortuna': {'rarity': 'uncommon', 'min_act': 1, 'conditions': {}},
    'demonio_tentador': {'rarity': 'uncommon', 'min_act': 2, 'conditions': {}},
    'aposta_morte': {'rarity': 'uncommon', 'min_act': 3, 'conditions': {'min_gold': 50}},

    'espelho_verdade': {'rarity': 'rare', 'min_act': 2, 'conditions': {'one_time': True, 'min_relics': 1}},
}

def format_conditions(conditions):
    """Formata dicionário de condições em string Python"""
    if not conditions:
        return "{}"

    lines = []
    lines.append("{")

    for key, value in conditions.items():
        if key == 'boost_weight_if':
            lines.append(f"            '{key}': {{")
            for subkey, subvalue in value.items():
                lines.append(f"                '{subkey}': {subvalue}")
            lines.append("            }")
        else:
            if isinstance(value, str):
                lines.append(f"            '{key}': '{value}'")
            else:
                lines.append(f"            '{key}': {value}")

    if len(lines) > 1:
        lines[-1] += ","
    lines.append("        }")

    return "\n".join(lines)

# Ler arquivo
with open('/home/user/testeez/routes/map_modules/events.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Lista de eventos que precisam ser atualizados
events_to_update = [
    'vampiro_anciao', 'camara_regeneracao', 'tesouro_amaldicoado',
    'cacador_recompensas', 'roda_fortuna', 'forja_sombria',
    'biblioteca_proibida', 'mestre_armas', 'espelho_verdade',
    'demonio_tentador', 'poco_desejos', 'fantasma_heroi',
    'encruzilhada_mistica', 'goblin_vendedor', 'aposta_morte',
    'espelho_dimensional'
]

# Fazer updates necessários
changes_made = 0

for event_id in events_to_update:
    if event_id not in EVENT_CONFIGS:
        print(f"⚠️  {event_id} não encontrado em EVENT_CONFIGS")
        continue

    config = EVENT_CONFIGS[event_id]

    # Procurar o evento no arquivo
    pattern = rf"('{event_id}': {{\s+.*?'min_act': \d+,)"
    match = re.search(pattern, content, re.DOTALL)

    if match:
        # Verificar se já tem 'conditions'
        event_block = match.group(1)
        if "'conditions':" not in event_block:
            # Adicionar conditions após min_act
            new_text = event_block + f"\n        'conditions': {format_conditions(config['conditions'])},"
            content = content.replace(match.group(1), new_text)
            changes_made += 1
            print(f"✅ {event_id}: Adicionado 'conditions'")
        else:
            print(f"ℹ️  {event_id}: Já tem 'conditions'")
    else:
        print(f"❌ {event_id}: Não encontrado no arquivo")

# Salvar arquivo
if changes_made > 0:
    with open('/home/user/testeez/routes/map_modules/events.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n✅ {changes_made} eventos atualizados!")
else:
    print("\nℹ️  Nenhuma alteração necessária")
