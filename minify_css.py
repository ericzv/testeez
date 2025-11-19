#!/usr/bin/env python3
"""
Script simples para minificar CSS
Remove comentários, espaços em branco desnecessários e quebras de linha
"""

import re
from pathlib import Path

def minify_css(css_content):
    """Minifica CSS removendo espaços e comentários"""
    # Remover comentários
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)

    # Remover espaços em branco desnecessários
    css_content = re.sub(r'\s+', ' ', css_content)

    # Remover espaços ao redor de caracteres especiais
    css_content = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css_content)

    # Remover último ponto e vírgula antes de }
    css_content = re.sub(r';\}', '}', css_content)

    return css_content.strip()

def process_css_file(filepath):
    """Processa um arquivo CSS"""
    print(f"Processando: {filepath}")

    # Ler arquivo
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    original_size = len(original_content)

    # Minificar
    minified_content = minify_css(original_content)
    minified_size = len(minified_content)

    # Salvar versão minificada
    minified_path = filepath.parent / f"{filepath.stem}.min{filepath.suffix}"
    with open(minified_path, 'w', encoding='utf-8') as f:
        f.write(minified_content)

    reduction = ((original_size - minified_size) / original_size) * 100

    print(f"  Original: {original_size/1024:.2f}KB")
    print(f"  Minificado: {minified_size/1024:.2f}KB")
    print(f"  Redução: {reduction:.1f}%")
    print(f"  Salvo em: {minified_path.name}\n")

    return original_size, minified_size

def main():
    print("CSS Minifier\n")

    css_files = list(Path('static/css').glob('*.css'))
    # Não processar arquivos .min.css
    css_files = [f for f in css_files if '.min.' not in f.name]

    if not css_files:
        print("Nenhum arquivo CSS encontrado em static/css/")
        return

    total_original = 0
    total_minified = 0

    for css_file in css_files:
        original, minified = process_css_file(css_file)
        total_original += original
        total_minified += minified

    print("=" * 60)
    print("RESUMO")
    print("=" * 60)
    print(f"Arquivos processados: {len(css_files)}")
    print(f"Tamanho original: {total_original/1024:.2f}KB")
    print(f"Tamanho minificado: {total_minified/1024:.2f}KB")

    if total_original > 0:
        total_reduction = ((total_original - total_minified) / total_original) * 100
        print(f"Redução total: {total_reduction:.1f}%")

if __name__ == '__main__':
    main()
