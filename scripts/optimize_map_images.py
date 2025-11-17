#!/usr/bin/env python3
"""
Script para otimizar imagens da pasta map/ para melhor performance.
Reduz tamanho dos arquivos PNG mantendo qualidade visual.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow não instalado. Instalando...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image

# Configurações
MAP_DIR = Path(__file__).parent.parent / "static/game.data/map"
MAX_SIZE = (512, 512)  # Tamanho máximo para ícones
QUALITY = 85
CONVERT_TO_WEBP = True  # Converter para WebP (menor tamanho)


def optimize_image(file_path: Path) -> dict:
    """
    Otimiza uma única imagem.

    Args:
        file_path: Caminho para a imagem

    Returns:
        Dict com estatísticas de otimização
    """
    original_size = file_path.stat().st_size

    try:
        with Image.open(file_path) as img:
            # Converter RGBA se necessário
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                background = Image.new('RGBA', img.size, (255, 255, 255, 0))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background

            # Redimensionar se muito grande (mantendo proporção)
            if img.size[0] > MAX_SIZE[0] or img.size[1] > MAX_SIZE[1]:
                img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

            # Salvar versão otimizada PNG
            optimized_path = file_path.with_suffix('.png')
            img.save(optimized_path, 'PNG', optimize=True)
            new_size_png = optimized_path.stat().st_size

            # Opcionalmente criar versão WebP (ainda menor)
            webp_size = 0
            if CONVERT_TO_WEBP:
                webp_path = file_path.with_suffix('.webp')
                if img.mode == 'RGBA':
                    img.save(webp_path, 'WEBP', quality=QUALITY, lossless=False, method=6)
                else:
                    img.save(webp_path, 'WEBP', quality=QUALITY, method=6)
                webp_size = webp_path.stat().st_size

            return {
                'original': original_size,
                'optimized_png': new_size_png,
                'webp': webp_size,
                'reduction_png': (original_size - new_size_png) / original_size * 100,
                'reduction_webp': (original_size - webp_size) / original_size * 100 if webp_size else 0
            }
    except Exception as e:
        print(f"  Erro ao processar {file_path}: {e}")
        return None


def main():
    """Processa todas as imagens na pasta map/"""

    if not MAP_DIR.exists():
        print(f"Pasta não encontrada: {MAP_DIR}")
        print("Criando pasta...")
        MAP_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Pasta criada. Adicione as imagens do mapa em: {MAP_DIR}")
        return

    # Listar imagens
    image_files = list(MAP_DIR.glob("*.png")) + list(MAP_DIR.glob("*.jpg")) + list(MAP_DIR.glob("*.jpeg"))

    if not image_files:
        print(f"Nenhuma imagem encontrada em: {MAP_DIR}")
        print("\nImagens esperadas:")
        print("  - map.png (background 1024x1024)")
        print("  - map-generic.png (ícone batalha)")
        print("  - map-challanger.png (ícone elite)")
        print("  - map-shop.png (ícone loja)")
        print("  - map-random.png (ícone evento)")
        print("  - map-rest.png (ícone descanso)")
        print("  - map-lastboss.png (ícone boss)")
        return

    print(f"Otimizando {len(image_files)} imagens em {MAP_DIR}")
    print("=" * 60)

    total_original = 0
    total_optimized = 0
    total_webp = 0

    for img_file in image_files:
        print(f"\nProcessando: {img_file.name}")

        stats = optimize_image(img_file)

        if stats:
            total_original += stats['original']
            total_optimized += stats['optimized_png']
            total_webp += stats['webp']

            print(f"  Original: {stats['original'] / 1024:.1f} KB")
            print(f"  PNG Otimizado: {stats['optimized_png'] / 1024:.1f} KB ({stats['reduction_png']:.1f}% menor)")
            if CONVERT_TO_WEBP:
                print(f"  WebP: {stats['webp'] / 1024:.1f} KB ({stats['reduction_webp']:.1f}% menor)")

    print("\n" + "=" * 60)
    print("RESUMO TOTAL:")
    print(f"  Original: {total_original / 1024:.1f} KB")
    print(f"  PNG Otimizado: {total_optimized / 1024:.1f} KB")
    if CONVERT_TO_WEBP:
        print(f"  WebP: {total_webp / 1024:.1f} KB")

    if total_original > 0:
        total_saving = (total_original - total_optimized) / total_original * 100
        print(f"\nEconomia total (PNG): {total_saving:.1f}%")
        if CONVERT_TO_WEBP and total_webp > 0:
            webp_saving = (total_original - total_webp) / total_original * 100
            print(f"Economia total (WebP): {webp_saving:.1f}%")

    print("\nDica: Para usar WebP com fallback PNG, atualize o código:")
    print('  <picture>')
    print('    <source srcset="/static/game.data/map/icon.webp" type="image/webp">')
    print('    <img src="/static/game.data/map/icon.png" alt="Icon">')
    print('  </picture>')


if __name__ == "__main__":
    main()
