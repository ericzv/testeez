"""
Script para adicionar colorização automática nas descrições dos eventos.
Verde para benefícios, vermelho para malefícios.
"""

import re

def colorize_text(text):
    """Adiciona colorização a um texto (sem sobrescrever spans existentes)"""

    # Padrões de MALEFÍCIOS (vermelho) - mais abrangentes
    patterns_danger = [
        (r'(Perca?\s+\d+%?\s*(?:do\s+)?HP(?:\s+Máximo)?(?:\s+permanentemente)?)', r'<span class="txt-danger">\1</span>'),
        (r'(Pague?\s+\d+\s+(?:HP|ouro))', r'<span class="txt-danger">\1</span>'),
        (r'(perca?\s+\d+%?\s*(?:do\s+)?(?:HP|ouro|Relíquia)(?:\s+Máximo)?(?:\s+permanentemente)?)', r'<span class="txt-danger">\1</span>'),
        (r'(pague?\s+\d+\s+(?:HP|ouro))', r'<span class="txt-danger">\1</span>'),
        (r'(perde?\s+\d+%?\s*(?:do\s+)?(?:HP|ouro)(?:\s+Máximo)?(?:\s+permanentemente)?)', r'<span class="txt-danger">\1</span>'),
        (r'(perde?\s+tudo)', r'<span class="txt-danger">\1</span>'),
        (r'(Entregue\s+\d+\s+relíquia)', r'<span class="txt-danger">\1</span>'),
        (r'(-\d+\s+de\s+dano)', r'<span class="txt-danger">\1</span>'),
    ]

    # Padrões de BENEFÍCIOS (verde)
    patterns_green = [
        (r'(Ganhe?\s+\+?\d+\s+HP(?:\s+Máximo)?(?:\s+permanente)?)', r'<span class="txt-green">\1</span>'),
        (r'(ganhe?\s+\+?\d+\s+HP(?:\s+Máximo)?(?:\s+permanente)?)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+TODO\s+o\s+seu\s+HP)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+\d+%)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+\d+\s+HP)', r'<span class="txt-green">\1</span>'),
        (r'(\d+-\d+\s+(?:de\s+)?ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Ganhe?\s+\d+\s+(?:de\s+)?ouro)', r'<span class="txt-green">\1</span>'),
        (r'(ganhe?\s+\d+\s+(?:de\s+)?ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Receba?\s+\d+\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Relíquia\s+(?:Comum|Rara|Épica|Lendária|aleatória))', r'<span class="txt-green">\1</span>'),
        (r'(\d+\s+relíquias?\s+(?:comuns|raras|épicas?|aleatórias?))', r'<span class="txt-green">\1</span>'),
        (r'(escolha?\s+\d+\s+entre\s+(?:as\s+)?\d+\s+relíquias?)', r'<span class="txt-green">\1</span>'),
        (r'(\+\d+\s+(?:de\s+)?dano)', r'<span class="txt-green">\1</span>'),
        (r'(\+\d+%?\s+(?:de\s+)?(?:força|defesa|velocidade|lifesteal|chance\s+crítica))', r'<span class="txt-green">\1</span>'),
        (r'(Ganhe?\s+a\s+Memória)', r'<span class="txt-green">\1</span>'),
        (r'(recompensa\s+dobrada)', r'<span class="txt-green">\1</span>'),
        (r'(com\s+segurança)', r'<span class="txt-green">\1</span>'),
        (r'(dobrar\s+todo\s+seu\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(AMBOS\s+os\s+bônus)', r'<span class="txt-green">\1</span>'),
    ]

    result = text

    # Aplicar malefícios primeiro
    for pattern, replacement in patterns_danger:
        # Só substituir se não estiver dentro de um span
        if '<span class="txt-' not in result:
            result = re.sub(pattern, replacement, result)
        else:
            # Cuidado para não substituir texto já dentro de spans
            parts = result.split('<span')
            new_parts = []
            for i, part in enumerate(parts):
                if i == 0 or part.startswith('>') == False:
                    # Primeira parte ou parte antes do span
                    new_parts.append(re.sub(pattern, replacement, part))
                else:
                    # Dentro de um span, procurar o fechamento
                    close_idx = part.find('</span>')
                    if close_idx != -1:
                        # Tem fechamento, processar apenas depois dele
                        before = part[:close_idx+7]
                        after = part[close_idx+7:]
                        new_parts.append(before + re.sub(pattern, replacement, after))
                    else:
                        new_parts.append(part)
            result = '<span'.join(new_parts)

    # Depois benefícios (mesma lógica)
    for pattern, replacement in patterns_green:
        if '<span class="txt-' not in result:
            result = re.sub(pattern, replacement, result)
        else:
            parts = result.split('<span')
            new_parts = []
            for i, part in enumerate(parts):
                if i == 0:
                    new_parts.append(re.sub(pattern, replacement, part))
                else:
                    close_idx = part.find('</span>')
                    if close_idx != -1:
                        before = part[:close_idx+7]
                        after = part[close_idx+7:]
                        new_parts.append(before + re.sub(pattern, replacement, after))
                    else:
                        new_parts.append(part)
            result = '<span'.join(new_parts)

    return result


# Ler arquivo
with open('routes/map_modules/events.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Processar todas as descriptions usando regex mais robusto
def process_description(match):
    """Processa uma linha de description"""
    full_line = match.group(0)
    desc_content = match.group(1)

    # Colorizar
    colorized = colorize_text(desc_content)

    if colorized != desc_content:
        print(f"✓ Colorizado: {desc_content[:60]}...")
        return full_line.replace(desc_content, colorized)

    return full_line

# Processar todas as linhas com 'description': '...'
new_content = re.sub(
    r"'description':\s*'([^']+)'",
    process_description,
    content
)

# Escrever de volta
with open('routes/map_modules/events.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\n✅ Colorização concluída!")
