#!/usr/bin/env python3
"""
Script para atualizar os eventos com as novas imagens principais
e manter os ícones existentes
"""
import re

# Mapeamento de eventos para suas novas imagens principais
EVENT_TO_IMAGE = {
    'tumulo_profanado': 'tomb.png',  # Túmulo Profanado
    'comerciante_sombrio': 'dark_merchant.png',  # Comerciante Sombrio
    'altar_sangue_antigo': 'blood_altar.png',  # Altar do Sangue Antigo
    'relicario_abandonado': 'reliquary.png',  # Relicário Abandonado
    'fonte_de_sangue': 'blood_fountain.png',  # Fonte de Sangue
    'vampiro_anciao': 'ancient_vampire.png',  # Vampiro Ancião
    'camara_regeneracao': 'regen_chamber.png',  # Câmara de Regeneração
    'tesouro_amaldicoado': 'cursed_treasure.png',  # Tesouro Amaldiçoado
    'cacador_recompensas': 'bounty_hunter.png',  # Caçador de Recompensas
    'roda_fortuna': 'fortune_wheel.png',  # Roda da Fortuna
    'forja_sombria': 'shadow_forge.png',  # Forja Sombria
    'biblioteca_proibida': 'forbidden_library.png',  # Biblioteca Proibida
    'mestre_armas': 'weapon_master.png',  # Mestre de Armas Aposentado
    'espelho_verdade': 'truth_mirror.png',  # Espelho da Verdade
    'demonio_tentador': 'tempter_demon.png',  # Demônio Tentador
    'poco_desejos': 'wishing_well.png',  # Poço dos Desejos
    'fantasma_heroi': 'ghost_hero.png',  # Fantasma do Herói Caído
    'encruzilhada_mistica': 'mystic_crossroads.png',  # Encruzilhada Mística
    'goblin_vendedor': 'goblin_merchant.png',  # Goblin Vendedor
    'aposta_morte': 'death_gamble.png',  # Aposta com a Morte
    'espelho_dimensional': 'dimensional_mirror.png',  # Espelho Dimensional
}

# Mapeamento de eventos para seus ícones (os que estavam como 'image' antes)
EVENT_TO_ICON = {
    'tumulo_profanado': 'shire.png',
    'comerciante_sombrio': 'merchant.png',
    'altar_sangue_antigo': 'offering.png',
    'relicario_abandonado': 'chest.png',
    'fonte_de_sangue': 'fountain.png',
    'vampiro_anciao': 'statue.png',
    'camara_regeneracao': 'campfire.png',
    'tesouro_amaldicoado': 'treasure.png',
    'cacador_recompensas': 'trap.png',
    'roda_fortuna': 'cards.png',
    'forja_sombria': 'forge.png',
    'biblioteca_proibida': 'library.png',
    'mestre_armas': 'shrine-mysterious.png',
    'espelho_verdade': 'mirror.png',
    'demonio_tentador': 'portal.png',
    'poco_desejos': 'well.png',
    'fantasma_heroi': 'tree.png',
    'encruzilhada_mistica': 'crossroads.png',
    'goblin_vendedor': 'goblin.png',
    'aposta_morte': 'cage.png',
    'espelho_dimensional': 'garden.png',
}


def update_events_file():
    """Atualiza o arquivo events.py com novas imagens e ícones"""
    filepath = 'routes/map_modules/events.py'

    print(f"🔄 Lendo {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    updates_count = 0

    # Para cada evento, atualizar o campo 'image' e adicionar o campo 'icon'
    for event_id, new_image in EVENT_TO_IMAGE.items():
        icon_file = EVENT_TO_ICON.get(event_id, '')

        # Pattern: procura por 'id': 'event_id', seguido de campos até encontrar 'image': '...'
        # e adiciona o campo 'icon' logo após
        pattern = rf"('id':\s*'{event_id}',[^}}]*?'image':\s*')([^']*?)(',\s*\n)"

        # Verifica se o pattern existe
        match = re.search(pattern, content, re.DOTALL)
        if match:
            # Substitui o nome do arquivo de 'image' e adiciona o campo 'icon'
            old_image = match.group(2)
            replacement = rf"\1{new_image}\3        'icon': '{icon_file}',\n"
            new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

            if new_content != content:
                content = new_content
                updates_count += 1
                print(f"  ✅ {event_id}:")
                print(f"     image: {old_image} → {new_image}")
                print(f"     icon: {icon_file}")
            else:
                print(f"  ⚠️  {event_id}: nenhuma mudança necessária")
        else:
            print(f"  ❌ {event_id}: não encontrado!")

    # Salvar se houve mudanças
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Arquivo atualizado com sucesso!")
        print(f"   {updates_count}/{len(EVENT_TO_IMAGE)} eventos atualizados")
    else:
        print(f"\n⚠️  Nenhuma mudança necessária")

    return updates_count


if __name__ == '__main__':
    updated = update_events_file()
    print(f"\n📊 Total: {updated} atualizações feitas")
