#!/usr/bin/env python3
"""
Script para atualizar os ícones de escolhas de emojis para PNG
"""
import re

# Mapeamento de emojis para ícones PNG de escolhas
EMOJI_TO_CHOICE_ICON = {
    # ATTACK - Combate, ataque, agressivo
    '🗡️': 'choice-attack.png',
    '⚔️': 'choice-attack.png',
    '🤺': 'choice-attack.png',
    '🔥': 'choice-attack.png',
    '💀': 'choice-attack.png',
    '😈': 'choice-attack.png',
    '🔴': 'choice-attack.png',  # Caminho Vermelho = Sangue/Ataque

    # DESTROY - Destruir, quebrar
    '🔨': 'choice-destroy.png',
    '🧹': 'choice-destroy.png',

    # TRADE - Negociar, trocar, comprar, jogar
    '💰': 'choice-trade.png',
    '🪙': 'choice-trade.png',
    '💎': 'choice-trade.png',
    '🎁': 'choice-trade.png',
    '🎲': 'choice-trade.png',
    '🎰': 'choice-trade.png',
    '🃏': 'choice-trade.png',
    '🔄': 'choice-trade.png',
    '🤝': 'choice-trade.png',
    '🟡': 'choice-trade.png',  # Caminho Dourado = Riqueza/Trade

    # REFUSE - Recusar, sair, deixar em paz
    '🚶': 'choice-refuse.png',
    '❌': 'choice-refuse.png',
    '✌️': 'choice-refuse.png',

    # PRAY - Rezar, oração
    '🙏': 'choice-pray.png',

    # INSPECT - Estudar, olhar, investigar
    '👁️': 'choice-inspect.png',
    '👀': 'choice-inspect.png',
    '📖': 'choice-inspect.png',
    '📕': 'choice-inspect.png',
    '📚': 'choice-inspect.png',
    '🎓': 'choice-inspect.png',
    '🔬': 'choice-inspect.png',

    # RUN - Fugir, correr
    '🏃': 'choice-run.png',

    # REST - Curar, descansar, fortalecer
    '❤️': 'choice-rest.png',
    '🩹': 'choice-rest.png',
    '🩸': 'choice-rest.png',
    '💉': 'choice-rest.png',
    '💪': 'choice-rest.png',
    '🛡️': 'choice-rest.png',
    '🏊': 'choice-rest.png',
    '🪣': 'choice-rest.png',
    '🔵': 'choice-rest.png',  # Caminho Azul = Vitalidade/Rest

    # ACCEPT - Aceitar, pegar, interagir
    '✨': 'choice-accept.png',
    '🌟': 'choice-accept.png',
    '🎯': 'choice-accept.png',
    '👻': 'choice-accept.png',
    '⚰️': 'choice-accept.png',
    '🦴': 'choice-accept.png',
    '🤚': 'choice-accept.png',
}


def update_choice_icons():
    """Atualiza os ícones de escolhas em events.py"""
    filepath = 'routes/map_modules/events.py'

    print(f"🔄 Lendo {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    updates_count = 0
    not_found = []

    # Para cada emoji, substituir pelo PNG correspondente
    for emoji, png_file in EMOJI_TO_CHOICE_ICON.items():
        # Padrão: 'icon': 'emoji'
        pattern = rf"('icon':\s*'){re.escape(emoji)}(')"

        if re.search(pattern, content):
            new_content = re.sub(pattern, rf"\1{png_file}\2", content)
            if new_content != content:
                count = content.count(f"'{emoji}'") - new_content.count(f"'{emoji}'")
                content = new_content
                updates_count += count
                print(f"  ✅ {emoji} → {png_file} ({count}x)")
        else:
            # Emoji não encontrado no arquivo
            pass

    # Verificar emojis que não foram mapeados
    remaining_emojis = re.findall(r"'icon':\s*'([^']+)'", content)
    remaining_emojis = [e for e in remaining_emojis if e.endswith('.png') == False]

    if remaining_emojis:
        print(f"\n⚠️  Emojis não mapeados encontrados:")
        for emoji in set(remaining_emojis):
            count = remaining_emojis.count(emoji)
            print(f"     {emoji} ({count}x)")

    # Salvar se houve mudanças
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Arquivo atualizado com sucesso!")
        print(f"   {updates_count} ícones de escolhas atualizados")
    else:
        print(f"\n⚠️  Nenhuma mudança necessária")

    return updates_count


if __name__ == '__main__':
    updated = update_choice_icons()
    print(f"\n📊 Total: {updated} atualizações feitas")
