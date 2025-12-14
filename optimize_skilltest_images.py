#!/usr/bin/env python3
"""
Script para otimizar imagens do Skill Test.
Otimiza ícones de dificuldade (gems) e resultado (result icons).

Instalação:
    pip install Pillow

Uso:
    python3 optimize_skilltest_images.py
"""

import os
from pathlib import Path
from PIL import Image
import shutil

# Configurações
ICON_MAX_SIZE = (128, 128)  # Tamanho máximo para os ícones do skill test
SKILLTEST_PATH = Path('static/game.data/skilltests')

def optimize_skilltest_image(filepath, backup_dir):
    """Otimiza uma imagem de skill test e gera versão WebP"""
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

        # Redimensionar se necessário (manter proporção)
        if img.size[0] > ICON_MAX_SIZE[0] or img.size[1] > ICON_MAX_SIZE[1]:
            img.thumbnail(ICON_MAX_SIZE, Image.Resampling.LANCZOS)
            print(f"  📐 Redimensionado: {original_dimensions} → {img.size}")

        # Salvar PNG otimizado
        img.save(filepath, 'PNG', optimize=True, quality=90)

        new_size = os.path.getsize(filepath)
        reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0

        print(f"  ✅ PNG: {filepath.name}")
        print(f"     {original_size/1024:.2f}KB → {new_size/1024:.2f}KB "
              f"({reduction:.1f}% redução)")

        # Gerar versão WebP (muito menor)
        webp_path = filepath.with_suffix('.webp')
        img.save(webp_path, 'WebP', quality=90, method=6)

        webp_size = os.path.getsize(webp_path)
        webp_reduction = ((original_size - webp_size) / original_size) * 100 if original_size > 0 else 0

        print(f"  🌐 WebP: {webp_path.name}")
        print(f"     {original_size/1024:.2f}KB → {webp_size/1024:.2f}KB "
              f"({webp_reduction:.1f}% redução)")

        return original_size, new_size

    except Exception as e:
        print(f"  ❌ Erro ao processar {filepath.name}: {e}")
        return 0, 0


def main():
    print("🎯 Otimizador de Imagens do Skill Test\n")

    if not SKILLTEST_PATH.exists():
        print(f"❌ Pasta não encontrada: {SKILLTEST_PATH}")
        print("   Criando pasta...")
        SKILLTEST_PATH.mkdir(parents=True, exist_ok=True)

    print(f"📁 Processando: {SKILLTEST_PATH}")

    # Criar pasta de backup
    backup_dir = SKILLTEST_PATH / '_originals'
    backup_dir.mkdir(exist_ok=True)

    # Processar arquivos PNG
    png_files = list(SKILLTEST_PATH.glob('*.png'))

    if not png_files:
        print(f"\n⚠️  Nenhum arquivo PNG encontrado em {SKILLTEST_PATH}")
        print("\n📋 Arquivos esperados:")
        print("   - easy.png (dificuldade fácil)")
        print("   - medium.png (dificuldade média)")
        print("   - hard.png (dificuldade difícil)")
        print("   - veryhard.png (dificuldade muito difícil)")
        print("   - result-verybad.png (resultado score 1)")
        print("   - result-bad.png (resultado scores 2-6)")
        print("   - result-normal.png (resultado score 7)")
        print("   - result-good.png (resultado scores 8-9)")
        print("   - result-perfect.png (resultado score 10)")
        return

    total_original = 0
    total_optimized = 0
    processed_count = 0

    for png_file in png_files:
        # Pular backups
        if '_originals' in str(png_file):
            continue

        print(f"\n🖼️  {png_file.name}")
        original, optimized = optimize_skilltest_image(png_file, backup_dir)

        if original > 0:
            total_original += original
            total_optimized += optimized
            processed_count += 1

    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO")
    print("="*60)
    print(f"Arquivos processados: {processed_count}")
    print(f"Tamanho original: {total_original/1024:.2f}KB")
    print(f"Tamanho otimizado PNG: {total_optimized/1024:.2f}KB")

    if total_original > 0:
        total_reduction = ((total_original - total_optimized) / total_original) * 100
        print(f"Redução total: {(total_original - total_optimized)/1024:.2f}KB "
              f"({total_reduction:.1f}%)")

    print("\n💡 Os arquivos originais foram salvos em '_originals'")
    print("   Versões WebP foram geradas para todos os arquivos.")
    print("   Se algo der errado, você pode restaurar os originais.")


if __name__ == '__main__':
    main()
