#!/usr/bin/env python3
"""
Script para atualizar os ícones dos eventos para usar os PNG paths corretos
"""
import re

# Mapeamento de eventos para ícones PNG (baseado nos nomes reais dos 21 eventos)
EVENT_TO_ICON = {
    'tumulo_profanado': 'shire.png',  # Túmulo Profanado
    'comerciante_sombrio': 'merchant.png',  # Comerciante Sombrio
    'altar_sangue_antigo': 'offering.png',  # Altar do Sangue Antigo
    'relicario_abandonado': 'chest.png',  # Relicário Abandonado
    'fonte_de_sangue': 'fountain.png',  # Fonte de Sangue
    'vampiro_anciao': 'statue.png',  # Vampiro Ancião
    'camara_regeneracao': 'campfire.png',  # Câmara de Regeneração
    'tesouro_amaldicoado': 'treasure.png',  # Tesouro Amaldiçoado
    'cacador_recompensas': 'trap.png',  # Caçador de Recompensas
    'roda_fortuna': 'cards.png',  # Roda da Fortuna
    'forja_sombria': 'forge.png',  # Forja Sombria
    'biblioteca_proibida': 'library.png',  # Biblioteca Proibida
    'mestre_armas': 'shrine-mysterious.png',  # Mestre de Armas Aposentado
    'espelho_verdade': 'mirror.png',  # Espelho da Verdade
    'demonio_tentador': 'portal.png',  # Demônio Tentador
    'poco_desejos': 'well.png',  # Poço dos Desejos
    'fantasma_heroi': 'tree.png',  # Fantasma do Herói Caído
    'encruzilhada_mistica': 'crossroads.png',  # Encruzilhada Mística
    'goblin_vendedor': 'goblin.png',  # Goblin Vendedor
    'aposta_morte': 'cage.png',  # Aposta com a Morte
    'espelho_dimensional': 'garden.png',  # Espelho Dimensional
}


def update_events_file():
    """Atualiza o arquivo events.py"""
    filepath = 'routes/map_modules/events.py'

    print(f"🔄 Lendo {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    updates_count = 0

    # Para cada evento, procurar o bloco e atualizar o campo 'image'
    for event_id, icon_file in EVENT_TO_ICON.items():
        # Pattern: procura por 'id': 'event_id', seguido de campos até encontrar 'image': '...'
        # Grupo 1: tudo antes do nome do arquivo
        # Grupo 2: nome do arquivo atual
        # Grupo 3: tudo depois
        pattern = rf"('id':\s*'{event_id}',[^}}]*?'image':\s*')([^']*?)(')"

        # Verifica se o pattern existe
        if re.search(pattern, content, re.DOTALL):
            # Substitui apenas o nome do arquivo
            new_content = re.sub(pattern, rf"\1{icon_file}\3", content, flags=re.DOTALL)
            if new_content != content:
                content = new_content
                updates_count += 1
                print(f"  ✅ {event_id}: {icon_file}")
            else:
                print(f"  ⚠️  {event_id}: já estava com {icon_file}")
        else:
            print(f"  ❌ {event_id}: não encontrado!")

    # Salvar se houve mudanças
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Arquivo atualizado com sucesso!")
        print(f"   {updates_count}/{len(EVENT_TO_ICON)} eventos atualizados")
    else:
        print(f"\n⚠️  Nenhuma mudança necessária")

    return updates_count


if __name__ == '__main__':
    updated = update_events_file()
    print(f"\n📊 Total: {updated} atualizações feitas")
