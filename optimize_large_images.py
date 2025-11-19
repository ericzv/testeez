#!/usr/bin/env python3
"""
Script otimizado para processar apenas imagens grandes (>500KB)
Pula arquivos já processados (que já têm backup)
"""

import os
from pathlib import Path
from PIL import Image
import shutil

# Configurações
ICON_MAX_SIZE = (512, 512)
BACKGROUND_MAX_SIZE = (1920, 1080)
PORTRAIT_MAX_SIZE = (2048, 2048)
MIN_SIZE_KB = 500  # Processar apenas arquivos maiores que 500KB

# Pastas para processar
PATHS_TO_PROCESS = [
    'static/game.data',
    'static/game.data/npcs',
    'static/game.data/events',
]

ICON_PATHS = ['buffs', 'relics', 'skills', 'items', 'icons', 'events/icons', 'events/choices', 'resources']
BACKGROUND_KEYWORDS = ['background', 'bg']

def should_be_icon(filepath):
    path_str = str(filepath).lower()
    return any(icon_path in path_str for icon_path in ICON_PATHS)

def should_be_background(filepath):
    filename = filepath.name.lower()
    return any(keyword in filename for keyword in BACKGROUND_KEYWORDS)

def get_max_size(filepath):
    if should_be_icon(filepath):
        return ICON_MAX_SIZE
    elif should_be_background(filepath):
        return BACKGROUND_MAX_SIZE
    else:
        return PORTRAIT_MAX_SIZE

def optimize_image(filepath, backup_dir):
    """Otimiza uma imagem PNG e gera versão WebP"""
    try:
        # Verificar se já foi processado (existe backup)
        backup_path = backup_dir / filepath.name
        if backup_path.exists():
            print(f"  ⏭️  Pulando {filepath.name} (já processado)")
            return 0, 0

        # Criar backup
        shutil.copy2(filepath, backup_path)
        print(f"  📦 {filepath.name}")

        # Abrir imagem
        img = Image.open(filepath)
        original_size = os.path.getsize(filepath)
        original_dimensions = img.size

        # Determinar tamanho máximo
        max_size = get_max_size(filepath)
        is_background = should_be_background(filepath)

        # Redimensionar se necessário
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"     📐 {original_dimensions} → {img.size}")

        # Converter para RGB se não tiver transparência
        img_for_webp = img
        if img.mode == 'RGBA':
            alpha = img.split()[3]
            if alpha.getextrema() == (255, 255):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
                img_for_webp = rgb_img

        # Salvar PNG otimizado
        if is_background:
            img.save(filepath, 'PNG', optimize=True, compress_level=9)
        else:
            img.save(filepath, 'PNG', optimize=True, quality=85)

        new_size = os.path.getsize(filepath)

        # Gerar versão WebP
        webp_path = filepath.with_suffix('.webp')
        webp_quality = 75 if is_background else 85
        img_for_webp.save(webp_path, 'WebP', quality=webp_quality, method=6)

        webp_size = os.path.getsize(webp_path)

        print(f"     PNG: {original_size/1024:.0f}KB → {new_size/1024:.0f}KB")
        print(f"     WebP: {webp_size/1024:.0f}KB ({((original_size - webp_size) / original_size * 100):.0f}% menor)")

        return original_size, new_size

    except Exception as e:
        print(f"  ❌ Erro: {filepath.name}: {e}")
        return 0, 0

def main():
    print("🖼️  Otimizador de Imagens Grandes (>500KB)\n")

    # Coletar todos os arquivos grandes
    large_files = []

    for path_str in PATHS_TO_PROCESS:
        path = Path(path_str)
        if not path.exists():
            continue

        # Buscar recursivamente
        png_files = list(path.rglob('*.png'))

        for png_file in png_files:
            if '_originals' in str(png_file):
                continue

            file_size_kb = os.path.getsize(png_file) / 1024

            if file_size_kb >= MIN_SIZE_KB:
                large_files.append((png_file, file_size_kb))

    # Ordenar por tamanho (maiores primeiro)
    large_files.sort(key=lambda x: x[1], reverse=True)

    print(f"Encontrados {len(large_files)} arquivos grandes (>500KB)\n")

    total_original = 0
    total_optimized = 0
    processed = 0

    for png_file, file_size in large_files:
        print(f"[{processed + 1}/{len(large_files)}] {file_size:.0f}KB - {png_file.name}")

        # Criar pasta de backup
        backup_dir = png_file.parent / '_originals'
        backup_dir.mkdir(exist_ok=True)

        original, optimized = optimize_image(png_file, backup_dir)

        if original > 0:
            total_original += original
            total_optimized += optimized
            processed += 1

    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO")
    print("="*60)
    print(f"Arquivos processados: {processed}")
    print(f"Tamanho original: {total_original/1024/1024:.2f}MB")
    print(f"Tamanho otimizado PNG: {total_optimized/1024/1024:.2f}MB")

    if total_original > 0:
        total_reduction = ((total_original - total_optimized) / total_original) * 100
        print(f"Redução PNG: {(total_original - total_optimized)/1024/1024:.2f}MB ({total_reduction:.1f}%)")

if __name__ == '__main__':
    main()
