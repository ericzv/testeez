#!/usr/bin/env python3
"""
Script para otimizar ícones de escolhas de eventos.
- Move originais para _originals/
- Cria versões otimizadas (max 512x512, qualidade 85)
"""

import os
import sys
from PIL import Image
from pathlib import Path

# Diretório dos ícones
ICONS_DIR = Path("static/game.data/events/choices")
ORIGINALS_DIR = ICONS_DIR / "_originals"

# Parâmetros de otimização
MAX_SIZE = (512, 512)
QUALITY = 85

def optimize_icon(input_path, output_path):
    """Otimiza um ícone PNG"""
    try:
        with Image.open(input_path) as img:
            # Converter para RGBA se necessário
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # Redimensionar mantendo aspect ratio se maior que MAX_SIZE
            if img.size[0] > MAX_SIZE[0] or img.size[1] > MAX_SIZE[1]:
                img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
                print(f"   📏 Redimensionado para {img.size}")

            # Salvar otimizado
            img.save(output_path, 'PNG', optimize=True, quality=QUALITY)

            # Comparar tamanhos
            original_size = input_path.stat().st_size
            new_size = output_path.stat().st_size
            reduction = ((original_size - new_size) / original_size) * 100

            print(f"   💾 {original_size/1024:.1f}KB → {new_size/1024:.1f}KB ({reduction:.1f}% redução)")
            return True

    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False

def main():
    """Processa todos os ícones"""

    # Criar diretório de originais se não existir
    ORIGINALS_DIR.mkdir(exist_ok=True)
    print(f"📁 Diretório de originais: {ORIGINALS_DIR}")

    # Procurar todos os PNGs (exceto os já em _originals)
    icons = list(ICONS_DIR.glob("choice-*.png"))
    icons = [icon for icon in icons if "_originals" not in str(icon)]

    if not icons:
        print("⚠️  Nenhum ícone encontrado para processar")
        return

    print(f"\n🔍 Encontrados {len(icons)} ícones\n")

    processed = 0
    for icon_path in sorted(icons):
        icon_name = icon_path.name
        original_path = ORIGINALS_DIR / icon_name

        print(f"🎨 Processando: {icon_name}")

        # Se já existe original, otimizar diretamente
        if original_path.exists():
            print(f"   ✓ Original já existe em _originals/")
            if optimize_icon(original_path, icon_path):
                processed += 1
        else:
            # Mover para _originals e criar otimizado
            print(f"   → Movendo original para _originals/")
            icon_path.rename(original_path)

            if optimize_icon(original_path, icon_path):
                processed += 1

        print()

    print(f"✅ Processamento concluído!")
    print(f"📊 {processed}/{len(icons)} ícones otimizados com sucesso")

if __name__ == "__main__":
    main()
