"""
Script para adicionar colorização automática nas descrições dos eventos.
Verde para benefícios, vermelho para malefícios.
"""

import re

def colorize_description(desc):
    """Adiciona tags de colorização em uma descrição"""

    # Já tem colorização? Retorna sem mudanças
    if '<span class="txt-' in desc:
        return desc

    # Padrões de MALEFÍCIOS (vermelho)
    patterns_danger = [
        (r'(Perca?\s+\d+\s*HP(?:\s+Máximo)?(?:\s+permanentemente)?)', r'<span class="txt-danger">\1</span>'),
        (r'(Perca?\s+\d+%\s*(?:do\s+)?HP[^M])', r'<span class="txt-danger">\1</span>'),
        (r'(Perca?\s+\d+%\s+do\s+HP\s+(?:atual|Máximo))', r'<span class="txt-danger">\1</span>'),
        (r'(Pague\s+\d+\s+HP)', r'<span class="txt-danger">\1</span>'),
        (r'(Pague\s+\d+\s+ouro)', r'<span class="txt-danger">\1</span>'),
        (r'(Perca?\s+\d+\s+ouro)', r'<span class="txt-danger">\1</span>'),
        (r'(Entregue\s+\d+\s+relíquia)', r'<span class="txt-danger">\1</span>'),
        (r'(Sacrifique\s+[^.]+)', r'<span class="txt-danger">\1</span>'),
        (r'(pague\s+\d+\s+ouro)', r'<span class="txt-danger">\1</span>'),
        (r'(perca?\s+\d+\s+(?:HP|ouro|Relíquia))', r'<span class="txt-danger">\1</span>'),
        (r'(perde?\s+\d+\s+(?:HP|ouro))', r'<span class="txt-danger">\1</span>'),
        (r'(perde?\s+tudo)', r'<span class="txt-danger">\1</span>'),
        (r'(perder\s+tudo)', r'<span class="txt-danger">\1</span>'),
        (r'(-\d+\s+de\s+dano)', r'<span class="txt-danger">\1</span>'),
    ]

    # Padrões de BENEFÍCIOS (verde)
    patterns_green = [
        (r'(Ganhe?\s+\+?\d+\s+HP(?:\s+Máximo)?(?:\s+permanente)?)', r'<span class="txt-green">\1</span>'),
        (r'(ganhe?\s+\+?\d+\s+HP\s+Máximo\s+permanente)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+TODO\s+o\s+seu\s+HP)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+\d+%)', r'<span class="txt-green">\1</span>'),
        (r'(Cure?\s+\d+\s+HP)', r'<span class="txt-green">\1</span>'),
        (r'(\d+-\d+\s+(?:de\s+)?ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Ganhe?\s+\d+\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(ganhe?\s+\d+\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(ganhe?\s+\d+\s+de\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Receba\s+\d+\s+ouro)', r'<span class="txt-green">\1</span>'),
        (r'(Relíquia\s+(?:Comum|Rara|Épica|Lendária|aleatória))', r'<span class="txt-green">\1</span>'),
        (r'(\d+\s+relíquias?\s+(?:comuns|raras|épicas?|aleatórias?))', r'<span class="txt-green">\1</span>'),
        (r'(\d+\s+relíquia)', r'<span class="txt-green">\1</span>'),
        (r'(\+\d+\s+(?:de\s+)?dano)', r'<span class="txt-green">\1</span>'),
        (r'(\+\d+%?\s+(?:de\s+)?(?:força|defesa|velocidade|lifesteal|chance\s+crítica))', r'<span class="txt-green">\1</span>'),
        (r'(escolha?\s+\d+\s+entre\s+(?:as\s+)?\d+\s+relíquias?)', r'<span class="txt-green">\1</span>'),
        (r'(recompensa\s+dobrada)', r'<span class="txt-green">\1</span>'),
        (r'(Ganhe?\s+a\s+Memória)', r'<span class="txt-green">\1</span>'),
        (r'(com\s+segurança)', r'<span class="txt-green">\1</span>'),
        (r'(dobrar\s+todo\s+seu\s+ouro)', r'<span class="txt-green">\1</span>'),
    ]

    result = desc

    # Aplicar malefícios primeiro
    for pattern, replacement in patterns_danger:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # Depois benefícios
    for pattern, replacement in patterns_green:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


# Ler arquivo
with open('routes/map_modules/events.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar todas as linhas de description
lines = content.split('\n')
new_lines = []

for line in lines:
    # É uma linha de description de choice?
    if "'description':" in line and 'choice' in '\n'.join(lines[max(0, lines.index(line)-10):lines.index(line)]):
        # Extrair a descrição
        match = re.search(r"'description':\s*'([^']+)'", line)
        if match:
            original_desc = match.group(1)
            colorized_desc = colorize_description(original_desc)
            if original_desc != colorized_desc:
                line = line.replace(original_desc, colorized_desc)
                print(f"✓ Colorizado: {original_desc[:50]}...")

    new_lines.append(line)

# Escrever de volta
with open('routes/map_modules/events.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("\n✅ Colorização concluída!")
