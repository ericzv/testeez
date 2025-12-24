#!/usr/bin/env python3
"""
Script de Otimização de Ícones
Converte imagens PNG para WebP otimizado e redimensiona se necessário.

Uso:
    python scripts/optimize_icons.py [--all] [--resize WxH] [--quality Q]

Opções:
    --all       Processa todos os ícones, não apenas os novos do Vlad
    --resize    Redimensiona para WxH (ex: 128x128)
    --quality   Qualidade WebP de 1-100 (padrão: 85)
    --dry-run   Mostra o que seria feito sem executar
"""

import os
import sys
import argparse
from pathlib import Path

# Diretório de ícones
ICONS_DIR = Path(__file__).parent.parent / "static" / "game.data" / "icons"

# Ícones do Vlad para otimizar
VLAD_ICONS = [
    "vlad_attack1.png",
    "vlad_attack2.png",
    "vlad_attack3.png",
    "vlad_attack4.png",
    "vlad_special1.png",
    "vlad_special2.png",
    "vlad_special3.png",
    "vlad_special4.png",
]


def check_pillow():
    """Verifica se Pillow está instalado"""
    try:
        from PIL import Image
        return True
    except ImportError:
        print("❌ Pillow não está instalado!")
        print("   Instale com: pip install Pillow")
        return False


def optimize_image(input_path, output_path=None, resize=None, quality=85, dry_run=False):
    """
    Otimiza uma imagem PNG para WebP

    Args:
        input_path: Caminho da imagem original
        output_path: Caminho de saída (padrão: mesmo nome com .webp)
        resize: Tupla (width, height) para redimensionar
        quality: Qualidade WebP (1-100)
        dry_run: Se True, apenas mostra o que seria feito

    Returns:
        dict com informações sobre a otimização
    """
    from PIL import Image

    input_path = Path(input_path)

    if not input_path.exists():
        return {"success": False, "error": f"Arquivo não encontrado: {input_path}"}

    if output_path is None:
        output_path = input_path.with_suffix(".webp")
    else:
        output_path = Path(output_path)

    # Informações do arquivo original
    original_size = input_path.stat().st_size

    if dry_run:
        print(f"  [DRY-RUN] Converteria: {input_path.name} -> {output_path.name}")
        if resize:
            print(f"            Redimensionaria para: {resize[0]}x{resize[1]}")
        return {"success": True, "dry_run": True}

    try:
        # Abrir imagem
        img = Image.open(input_path)
        original_dimensions = img.size

        # Converter para RGBA se necessário (para preservar transparência)
        if img.mode not in ('RGBA', 'RGB'):
            img = img.convert('RGBA')

        # Redimensionar se especificado
        if resize:
            img = img.resize(resize, Image.Resampling.LANCZOS)

        # Salvar como WebP
        img.save(output_path, 'WEBP', quality=quality, method=6)

        # Informações do arquivo otimizado
        new_size = output_path.stat().st_size
        reduction = ((original_size - new_size) / original_size) * 100

        return {
            "success": True,
            "input": str(input_path),
            "output": str(output_path),
            "original_size": original_size,
            "new_size": new_size,
            "reduction_percent": reduction,
            "original_dimensions": original_dimensions,
            "new_dimensions": img.size
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def optimize_png(input_path, dry_run=False):
    """
    Otimiza um PNG in-place usando quantização

    Args:
        input_path: Caminho da imagem PNG
        dry_run: Se True, apenas mostra o que seria feito
    """
    from PIL import Image

    input_path = Path(input_path)

    if not input_path.exists():
        return {"success": False, "error": f"Arquivo não encontrado: {input_path}"}

    original_size = input_path.stat().st_size

    if dry_run:
        print(f"  [DRY-RUN] Otimizaria PNG: {input_path.name}")
        return {"success": True, "dry_run": True}

    try:
        img = Image.open(input_path)

        # Salvar com otimização máxima
        img.save(input_path, 'PNG', optimize=True)

        new_size = input_path.stat().st_size
        reduction = ((original_size - new_size) / original_size) * 100

        return {
            "success": True,
            "original_size": original_size,
            "new_size": new_size,
            "reduction_percent": reduction
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def format_size(size_bytes):
    """Formata tamanho em bytes para formato legível"""
    for unit in ['B', 'KB', 'MB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} GB"


def main():
    parser = argparse.ArgumentParser(description="Otimiza ícones do jogo")
    parser.add_argument("--all", action="store_true", help="Processa todos os ícones PNG")
    parser.add_argument("--resize", type=str, help="Redimensiona para WxH (ex: 128x128)")
    parser.add_argument("--quality", type=int, default=85, help="Qualidade WebP (1-100)")
    parser.add_argument("--dry-run", action="store_true", help="Mostra o que seria feito sem executar")
    parser.add_argument("--png-only", action="store_true", help="Apenas otimiza PNGs sem converter para WebP")

    args = parser.parse_args()

    # Verificar Pillow
    if not check_pillow():
        sys.exit(1)

    # Verificar diretório
    if not ICONS_DIR.exists():
        print(f"❌ Diretório de ícones não encontrado: {ICONS_DIR}")
        sys.exit(1)

    print(f"📁 Diretório de ícones: {ICONS_DIR}")
    print()

    # Determinar quais arquivos processar
    if args.all:
        files = list(ICONS_DIR.glob("*.png"))
        print(f"🔍 Processando todos os {len(files)} ícones PNG...")
    else:
        files = [ICONS_DIR / f for f in VLAD_ICONS]
        print(f"🧛 Processando {len(VLAD_ICONS)} ícones do Vlad...")

    print()

    # Parsear resize
    resize = None
    if args.resize:
        try:
            w, h = args.resize.lower().split("x")
            resize = (int(w), int(h))
            print(f"📐 Redimensionando para: {resize[0]}x{resize[1]}")
        except:
            print(f"❌ Formato de resize inválido: {args.resize}")
            print("   Use formato WxH (ex: 128x128)")
            sys.exit(1)

    # Estatísticas
    total_original = 0
    total_new = 0
    processed = 0
    errors = 0

    # Processar cada arquivo
    for file_path in files:
        if not file_path.exists():
            print(f"⚠️  Arquivo não encontrado: {file_path.name}")
            errors += 1
            continue

        print(f"📄 {file_path.name}")

        if args.png_only:
            # Apenas otimizar PNG
            result = optimize_png(file_path, dry_run=args.dry_run)
        else:
            # Converter para WebP
            result = optimize_image(
                file_path,
                resize=resize,
                quality=args.quality,
                dry_run=args.dry_run
            )

        if result.get("dry_run"):
            continue

        if result["success"]:
            processed += 1
            total_original += result["original_size"]
            total_new += result["new_size"]

            print(f"   ✅ {format_size(result['original_size'])} -> {format_size(result['new_size'])} ({result['reduction_percent']:.1f}% menor)")

            if "original_dimensions" in result and "new_dimensions" in result:
                orig_dim = result["original_dimensions"]
                new_dim = result["new_dimensions"]
                if orig_dim != new_dim:
                    print(f"      {orig_dim[0]}x{orig_dim[1]} -> {new_dim[0]}x{new_dim[1]}")
        else:
            errors += 1
            print(f"   ❌ Erro: {result['error']}")

    # Resumo
    print()
    print("=" * 50)
    print("📊 RESUMO")
    print("=" * 50)

    if args.dry_run:
        print("   (Modo dry-run - nenhum arquivo foi modificado)")
    else:
        print(f"   Arquivos processados: {processed}")
        print(f"   Erros: {errors}")

        if total_original > 0:
            total_reduction = ((total_original - total_new) / total_original) * 100
            print(f"   Tamanho original: {format_size(total_original)}")
            print(f"   Tamanho final: {format_size(total_new)}")
            print(f"   Economia total: {format_size(total_original - total_new)} ({total_reduction:.1f}%)")

    print()


if __name__ == "__main__":
    main()
