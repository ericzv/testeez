#!/usr/bin/env python3
"""
Instalador do Git Pre-Commit Hook para Otimização de Imagens

Execute este script para instalar o hook que otimiza automaticamente
imagens PNG antes de cada commit.

Uso:
    python install_git_hook.py
"""

import os
import sys
import shutil
from pathlib import Path

HOOK_CONTENT = r'''#!/usr/bin/env python3
"""
Git Pre-Commit Hook - Otimizador Automático de Imagens PNG

Este hook roda automaticamente antes de cada commit e otimiza
quaisquer arquivos PNG novos ou modificados.
"""

import os
import sys
import subprocess
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("⚠️  Pillow não instalado - pulando otimização de imagens")
    print("   Para ativar: pip install Pillow")
    sys.exit(0)

# Configurações
ICON_MAX_SIZE = (512, 512)
BACKGROUND_MAX_SIZE = (1920, 1080)
PORTRAIT_MAX_SIZE = (2048, 2048)

ICON_PATHS = ['buffs', 'relics', 'skills', 'items']
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


def optimize_image(filepath):
    """Otimiza uma imagem PNG"""
    try:
        img = Image.open(filepath)
        original_size = os.path.getsize(filepath)

        # Determinar tamanho máximo
        max_size = get_max_size(filepath)

        # Redimensionar se necessário
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Converter para RGB se não tiver transparência
        if img.mode == 'RGBA':
            alpha = img.split()[3]
            if alpha.getextrema() == (255, 255):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img

        # Salvar otimizado
        img.save(filepath, 'PNG', optimize=True, quality=85)

        new_size = os.path.getsize(filepath)

        if new_size < original_size:
            reduction = ((original_size - new_size) / original_size) * 100
            print(f"  ✅ {filepath.name}: {original_size/1024:.1f}KB → {new_size/1024:.1f}KB (-{reduction:.1f}%)")
            return True

        return False

    except Exception as e:
        print(f"  ⚠️  Erro ao otimizar {filepath.name}: {e}")
        return False


def get_staged_pngs():
    """Retorna lista de arquivos PNG que estão staged para commit"""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only', '--diff-filter=ACM'],
            capture_output=True,
            text=True,
            check=True
        )

        files = result.stdout.strip().split('\n')
        png_files = [f for f in files if f.lower().endswith('.png') and os.path.exists(f)]

        return png_files

    except subprocess.CalledProcessError:
        return []


def main():
    # Obter PNGs staged
    staged_pngs = get_staged_pngs()

    if not staged_pngs:
        sys.exit(0)

    print(f"\n🖼️  Otimizando {len(staged_pngs)} imagem(ns) PNG...")

    optimized_count = 0

    for png_path in staged_pngs:
        filepath = Path(png_path)

        if optimize_image(filepath):
            # Re-adicionar ao staging area
            subprocess.run(['git', 'add', str(filepath)], check=False)
            optimized_count += 1

    if optimized_count > 0:
        print(f"\n✨ {optimized_count} imagem(ns) otimizada(s) e adicionada(s) ao commit!\n")

    sys.exit(0)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n⚠️  Erro no pre-commit hook: {e}")
        print("   Commit continuando normalmente...\n")
        sys.exit(0)
'''


def main():
    print("🔧 Instalador do Git Pre-Commit Hook")
    print("="*60)

    # Verificar se estamos em um repositório git
    if not os.path.exists('.git'):
        print("❌ Erro: Este diretório não é um repositório git!")
        print("   Execute este script na raiz do projeto.")
        sys.exit(1)

    # Criar diretório de hooks se não existir
    hooks_dir = Path('.git/hooks')
    hooks_dir.mkdir(exist_ok=True)

    # Caminho do hook
    hook_path = hooks_dir / 'pre-commit'

    # Fazer backup se já existir
    if hook_path.exists():
        backup_path = hooks_dir / 'pre-commit.backup'
        shutil.copy2(hook_path, backup_path)
        print(f"📦 Backup criado: {backup_path}")

    # Escrever o hook
    hook_path.write_text(HOOK_CONTENT, encoding='utf-8')
    print(f"✅ Hook criado: {hook_path}")

    # Tornar executável (Linux/Mac)
    if sys.platform != 'win32':
        os.chmod(hook_path, 0o755)
        print("🔐 Permissões de execução definidas")

    print("\n" + "="*60)
    print("✨ INSTALAÇÃO CONCLUÍDA!")
    print("="*60)
    print("\nO que acontece agora:")
    print("• Toda vez que você fizer 'git commit'")
    print("• O hook detecta automaticamente PNGs novos/modificados")
    print("• Otimiza e adiciona ao commit")
    print("\nPara testar:")
    print("1. Adicione um PNG grande ao projeto")
    print("2. git add <arquivo.png>")
    print("3. git commit -m 'test'")
    print("4. Veja a otimização acontecer automaticamente!")
    print("\nPara desativar:")
    print("• Renomeie ou delete .git/hooks/pre-commit")
    print()


if __name__ == '__main__':
    main()
