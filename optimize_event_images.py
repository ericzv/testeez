#!/usr/bin/env python3
"""
Script para otimizar imagens dos eventos.
Processa apenas as imagens em static/game.data/events/images/

Uso:
    python3 optimize_event_images.py
"""

import os
from pathlib import Path
from PIL import Image
import shutil

# Configurações
EVENT_IMAGE_MAX_SIZE = (800, 800)  # Tamanho máximo para imagens de eventos
WEBP_QUALITY = 85  # Qualidade WebP (85 é um bom balanço)
PNG_QUALITY = 90  # Qualidade PNG

# Diretório a processar
EVENTS_IMAGES_DIR = Path('static/game.data/events/images')


def optimize_event_image(filepath, backup_dir):
    """Otimiza uma imagem PNG de evento e gera versão WebP"""
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

        print(f"\n🖼️  Processando: {filepath.name}")
        print(f"  📐 Dimensões originais: {original_dimensions}")
        print(f"  📊 Tamanho original: {original_size/1024:.2f}KB")

        # Redimensionar se necessário
        if img.size[0] > EVENT_IMAGE_MAX_SIZE[0] or img.size[1] > EVENT_IMAGE_MAX_SIZE[1]:
            img.thumbnail(EVENT_IMAGE_MAX_SIZE, Image.Resampling.LANCZOS)
            print(f"  ✂️  Redimensionado para: {img.size}")

        # Converter para RGB se não tiver transparência (menor tamanho)
        img_for_webp = img
        if img.mode == 'RGBA':
            # Verificar se tem transparência real
            alpha = img.split()[3]
            if alpha.getextrema() == (255, 255):
                # Sem transparência, converter para RGB
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
                img_for_webp = rgb_img
                print(f"  🎨 Convertido para RGB (sem transparência)")

        # Salvar PNG otimizado
        img.save(filepath, 'PNG', optimize=True, quality=PNG_QUALITY)
        new_size = os.path.getsize(filepath)
        reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0

        print(f"  ✅ PNG otimizado:")
        print(f"     {original_size/1024:.2f}KB → {new_size/1024:.2f}KB ({reduction:.1f}% redução)")

        # Gerar versão WebP (muito menor)
        webp_path = filepath.with_suffix('.webp')
        img_for_webp.save(webp_path, 'WebP', quality=WEBP_QUALITY, method=6)

        webp_size = os.path.getsize(webp_path)
        webp_reduction = ((original_size - webp_size) / original_size) * 100 if original_size > 0 else 0

        print(f"  🌐 WebP gerado:")
        print(f"     {original_size/1024:.2f}KB → {webp_size/1024:.2f}KB ({webp_reduction:.1f}% redução)")

        return original_size, new_size, webp_size

    except Exception as e:
        print(f"  ❌ Erro ao processar {filepath.name}: {e}")
        return 0, 0, 0


def main():
    print("="*70)
    print("🖼️  OTIMIZADOR DE IMAGENS DE EVENTOS")
    print("="*70)
    print()

    if not EVENTS_IMAGES_DIR.exists():
        print(f"❌ Diretório não encontrado: {EVENTS_IMAGES_DIR}")
        print(f"   Crie o diretório e adicione as imagens antes de executar este script.")
        return

    # Criar pasta de backup
    backup_dir = EVENTS_IMAGES_DIR / '_originals'
    backup_dir.mkdir(exist_ok=True)
    print(f"📁 Diretório: {EVENTS_IMAGES_DIR}")
    print(f"📦 Backups serão salvos em: {backup_dir}")
    print()

    # Processar arquivos PNG
    png_files = list(EVENTS_IMAGES_DIR.glob('*.png'))

    # Filtrar arquivos que não estão na pasta _originals
    png_files = [f for f in png_files if '_originals' not in str(f)]

    if not png_files:
        print("⚠️  Nenhum arquivo PNG encontrado no diretório.")
        print()
        print("📝 Copie suas imagens para:")
        print(f"   {EVENTS_IMAGES_DIR.absolute()}")
        print()
        print("   As imagens devem ter os seguintes nomes:")
        print("   - tomb.png")
        print("   - dark_merchant.png")
        print("   - blood_altar.png")
        print("   - reliquary.png")
        print("   - blood_fountain.png")
        print("   - ancient_vampire.png")
        print("   - regen_chamber.png")
        print("   - cursed_treasure.png")
        print("   - bounty_hunter.png")
        print("   - fortune_wheel.png")
        print("   - shadow_forge.png")
        print("   - forbidden_library.png")
        print("   - weapon_master.png")
        print("   - truth_mirror.png")
        print("   - tempter_demon.png")
        print("   - wishing_well.png")
        print("   - ghost_hero.png")
        print("   - mystic_crossroads.png")
        print("   - goblin_merchant.png")
        print("   - death_gamble.png")
        print("   - dimensional_mirror.png")
        return

    total_original = 0
    total_optimized = 0
    total_webp = 0
    processed_count = 0

    print(f"🔍 Encontrados {len(png_files)} arquivo(s) PNG")
    print()

    for png_file in sorted(png_files):
        original, optimized, webp = optimize_event_image(png_file, backup_dir)

        if original > 0:
            total_original += original
            total_optimized += optimized
            total_webp += webp
            processed_count += 1

    # Resumo
    print()
    print("="*70)
    print("📊 RESUMO")
    print("="*70)
    print(f"Arquivos processados: {processed_count}")
    print(f"Tamanho original total: {total_original/1024:.2f}KB ({total_original/1024/1024:.2f}MB)")
    print(f"Tamanho PNG otimizado: {total_optimized/1024:.2f}KB ({total_optimized/1024/1024:.2f}MB)")
    print(f"Tamanho WebP total: {total_webp/1024:.2f}KB ({total_webp/1024/1024:.2f}MB)")
    print()

    if total_original > 0:
        png_reduction = ((total_original - total_optimized) / total_original) * 100
        webp_reduction = ((total_original - total_webp) / total_original) * 100
        print(f"Redução PNG: {(total_original - total_optimized)/1024:.2f}KB ({png_reduction:.1f}%)")
        print(f"Redução WebP: {(total_original - total_webp)/1024:.2f}KB ({webp_reduction:.1f}%)")
        print()

    print("✅ Otimização concluída!")
    print()
    print("💡 Os arquivos originais foram salvos em '_originals'")
    print("   Versões WebP foram geradas para todos os arquivos.")
    print("   O frontend preferirá WebP quando disponível (melhor performance).")
    print()


if __name__ == '__main__':
    main()
