#!/usr/bin/env python3
"""
Script para otimizar imagens PNG do projeto.
Reduz o tamanho de imagens grandes mantendo boa qualidade visual.

Instalação:
    pip install Pillow

Uso:
    python3 optimize_images.py

O script:
- Cria backup das imagens originais (pasta '_originals')
- Redimensiona imagens muito grandes
- Otimiza a compressão PNG
- Para ícones pequenos: max 512x512px
- Para backgrounds: max 1920x1080px
- Para portraits/sprites: mantém proporção original se < 2048px
"""

import os
from pathlib import Path
from PIL import Image
import shutil

# Configurações
ICON_MAX_SIZE = (512, 512)  # Tamanho máximo para ícones (buffs, relics, skills)
BACKGROUND_MAX_SIZE = (1920, 1080)  # Tamanho máximo para backgrounds
PORTRAIT_MAX_SIZE = (2048, 2048)  # Tamanho máximo para portraits/sprites

# Pastas para processar
PATHS_TO_PROCESS = [
    'static/game.data/buffs',
    'static/game.data/relics',
    'static/game.data/skills',
    'static/game.data/icons',  # ícones de UI (atk1-4, damage, etc)
    'static/game.data',  # backgrounds e outros
]

# Pastas que contêm ícones (usar ICON_MAX_SIZE)
ICON_PATHS = ['buffs', 'relics', 'skills', 'items', 'icons']

# Pastas que contêm backgrounds (usar BACKGROUND_MAX_SIZE)
BACKGROUND_KEYWORDS = ['background', 'bg']


def should_be_icon(filepath):
    """Verifica se o arquivo é um ícone baseado no caminho"""
    path_str = str(filepath).lower()
    return any(icon_path in path_str for icon_path in ICON_PATHS)


def should_be_background(filepath):
    """Verifica se o arquivo é um background baseado no nome"""
    filename = filepath.name.lower()
    return any(keyword in filename for keyword in BACKGROUND_KEYWORDS)


def get_max_size(filepath):
    """Retorna o tamanho máximo apropriado para o arquivo"""
    if should_be_icon(filepath):
        return ICON_MAX_SIZE
    elif should_be_background(filepath):
        return BACKGROUND_MAX_SIZE
    else:
        return PORTRAIT_MAX_SIZE


def optimize_image(filepath, backup_dir):
    """Otimiza uma imagem PNG"""
    try:
        # Criar backup
        backup_path = backup_dir / filepath.name
        if not backup_path.exists():
            shutil.copy2(filepath, backup_path)
            print(f"  📦 Backup criado: {backup_path.name}")

        # Abrir imagem
        img = Image.open(filepath)
        original_size = os.path.getsize(filepath)
        original_dimensions = img.size

        # Determinar tamanho máximo
        max_size = get_max_size(filepath)

        # Redimensionar se necessário
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"  📐 Redimensionado: {original_dimensions} → {img.size}")

        # Converter para RGB se não tiver transparência (menor tamanho)
        if img.mode == 'RGBA':
            # Verificar se tem transparência real
            alpha = img.split()[3]
            if alpha.getextrema() == (255, 255):
                # Sem transparência, converter para RGB
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
                print(f"  🎨 Convertido para RGB (sem transparência)")

        # Salvar otimizado
        img.save(filepath, 'PNG', optimize=True, quality=85)

        new_size = os.path.getsize(filepath)
        reduction = ((original_size - new_size) / original_size) * 100

        print(f"  ✅ {filepath.name}")
        print(f"     {original_size/1024/1024:.2f}MB → {new_size/1024/1024:.2f}MB "
              f"({reduction:.1f}% redução)")

        return original_size, new_size

    except Exception as e:
        print(f"  ❌ Erro ao processar {filepath.name}: {e}")
        return 0, 0


def main():
    print("🖼️  Otimizador de Imagens PNG\n")

    total_original = 0
    total_optimized = 0
    processed_count = 0

    for path_str in PATHS_TO_PROCESS:
        path = Path(path_str)

        if not path.exists():
            print(f"⚠️  Pasta não encontrada: {path}")
            continue

        print(f"\n📁 Processando: {path}")

        # Criar pasta de backup
        backup_dir = path / '_originals'
        backup_dir.mkdir(exist_ok=True)

        # Processar arquivos PNG
        png_files = list(path.glob('*.png'))

        if not png_files:
            print(f"  ℹ️  Nenhum arquivo PNG encontrado")
            continue

        for png_file in png_files:
            # Pular backups
            if '_originals' in str(png_file):
                continue

            original, optimized = optimize_image(png_file, backup_dir)

            if original > 0:
                total_original += original
                total_optimized += optimized
                processed_count += 1

    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO")
    print("="*60)
    print(f"Arquivos processados: {processed_count}")
    print(f"Tamanho original: {total_original/1024/1024:.2f}MB")
    print(f"Tamanho otimizado: {total_optimized/1024/1024:.2f}MB")

    if total_original > 0:
        total_reduction = ((total_original - total_optimized) / total_original) * 100
        print(f"Redução total: {(total_original - total_optimized)/1024/1024:.2f}MB "
              f"({total_reduction:.1f}%)")

    print("\n💡 Os arquivos originais foram salvos nas pastas '_originals'")
    print("   Se algo der errado, você pode restaurá-los de lá.")


if __name__ == '__main__':
    main()
