"""
Script para associar os novos ícones aos eventos apropriados.
Baseado em NOVOS_ICONES_ASSOCIACAO.md
"""

import re

# Mapeamento de (evento_id, choice_id) -> novo_icone
ICON_REPLACEMENTS = {
    # choice-power.png (Poder/Magia)
    ('forja_sombria', 'fortalecer_poder'): 'choice-power.png',
    ('altar_sangue_antigo', 'oferecer_sangue'): 'choice-power.png',
    ('biblioteca_proibida', 'estudar_ofensiva'): 'choice-power.png',
    ('poco_desejos', 'desejo_poder'): 'choice-power.png',

    # choice-vitality.png/choice-shield.png (HP/Defesa)
    ('forja_sombria', 'reforcar_barreira'): 'choice-vitality.png',
    ('camara_regeneracao', 'banho_regenerador'): 'choice-vitality.png',
    ('poco_desejos', 'desejo_saude'): 'choice-vitality.png',

    # choice-study.png (Aprendizado)
    ('biblioteca_proibida', 'estudar_defensiva'): 'choice-study.png',
    ('vampiro_anciao', 'aprender_tecnica'): 'choice-study.png',

    # choice-curse.png (Perigo/Maldição)
    ('altar_sangue_antigo', 'destruir_altar'): 'choice-curse.png',
    ('tesouro_amaldicoado', 'pegar_tudo'): 'choice-curse.png',
    ('goblin_vendedor', 'aceitar_misterio'): 'choice-curse.png',

    # choice-heal.png (Cura/Poções)
    ('fonte_de_sangue', 'beber'): 'choice-heal.png',
    ('fonte_de_sangue', 'banhar'): 'choice-heal.png',
    ('camara_regeneracao', 'usar_capsula'): 'choice-heal.png',
    ('heroi_ferido', 'ajudar_curar'): 'choice-heal.png',

    # choice-gold.png (Ganhar Ouro)
    ('cacador_recompensas', 'vender_info'): 'choice-gold.png',
    ('heroi_ferido', 'roubar'): 'choice-gold.png',
    ('goblin_vendedor', 'vender_lixo'): 'choice-gold.png',
}

def update_event_icons():
    """Atualiza os ícones nos eventos"""

    with open('routes/map_modules/events.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Dividir em blocos de eventos
    events = content.split("    '")

    replacements_made = 0
    current_event_id = None

    new_events = []
    for i, block in enumerate(events):
        if i == 0:
            new_events.append(block)
            continue

        # Detectar início de novo evento
        if block.startswith("'id':"):
            match = re.search(r"'id':\s*'([^']+)'", block)
            if match:
                current_event_id = match.group(1)

        # Detectar choice_id e substituir ícone se necessário
        choice_match = re.search(r"'id':\s*'([^']+)'", block)
        icon_match = re.search(r"'icon':\s*'([^']+)'", block)

        if choice_match and icon_match and current_event_id:
            choice_id = choice_match.group(1)
            current_icon = icon_match.group(1)

            # Verificar se deve substituir
            key = (current_event_id, choice_id)
            if key in ICON_REPLACEMENTS:
                new_icon = ICON_REPLACEMENTS[key]
                # Substituir
                block = re.sub(
                    r"'icon':\s*'[^']+'",
                    f"'icon': '{new_icon}'",
                    block,
                    count=1
                )
                print(f"✓ {current_event_id} / {choice_id}: {current_icon} → {new_icon}")
                replacements_made += 1

        new_events.append(block)

    # Juntar de volta
    new_content = "    '".join(new_events)

    # Escrever de volta
    with open('routes/map_modules/events.py', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\n✅ {replacements_made} ícones atualizados!")
    return replacements_made

if __name__ == '__main__':
    count = update_event_icons()
    print(f"\n📊 Total de associações: {count}/22")
