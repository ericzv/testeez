import os
from pathlib import Path
from collections import defaultdict

# ============= CONFIG =====================
# Use whitelist para contar só pastas de código seu
MODE = "whitelist"  # opções: "whitelist" ou "blacklist"

# Extensões de CÓDIGO (sem .json)
INCLUDED_EXTS = {".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css"}

# Pastas a ignorar (funciona em ambos os modos)
EXCLUDED_DIRS = {
    "env", ".env", ".venv", "venv", "ENV",
    "Lib", "Include", "Scripts",  # subpastas comuns do venv no Windows
    "site-packages",
    "__pycache__", ".git", ".idea", ".vscode",
    "dist", "build", ".next", ".cache",
    "coverage", ".pytest_cache", ".mypy_cache",
    "docs", "documentation", "examples", "example",
    "tutorials", "benchmark", "benchmarks",
    "alembic", "migrations",
    "staticfiles", "public", "assets", "vendor", "third_party", "thirdparty",
    ".ipynb_checkpoints"
}

# Whitelist: conte APENAS estes diretórios de 1º nível
# (ajuste conforme seu projeto)
WHITELIST_DIRS = {"static", "templates"}

# Também permitir ARQUIVOS na RAIZ com estas extensões (ex.: seus .py)
ROOT_WHITELIST_EXTS = {".py"}

# Arquivos/nomes a excluir
EXCLUDED_SUFFIXES = {".min.js", ".map", ".lock", ".log", ".bundle.js"}
EXCLUDED_FILE_NAMES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}

# Evita bundles gigantes
MAX_BYTES = 600_000  # ~600 KB
TOP_N_FILES = 30
# ==========================================

def is_inside_whitelist(path: Path, project_root: Path) -> bool:
    """True se estiver em diretório whitelisted OU se for arquivo na raiz permitido."""
    try:
        rel = path.relative_to(project_root)
    except ValueError:
        return False
    parts = rel.parts
    if not parts:
        return False
    # arquivo diretamente na raiz
    if len(parts) == 1 and path.suffix.lower() in ROOT_WHITELIST_EXTS:
        return True
    # diretório de 1º nível está na whitelist?
    top = parts[0].lower()
    return top in {d.lower() for d in WHITELIST_DIRS}

def should_skip_dir(dirname: str) -> bool:
    return dirname.lower() in EXCLUDED_DIRS

def should_count_file(path: Path, project_root: Path) -> bool:
    if MODE.lower() == "whitelist" and not is_inside_whitelist(path, project_root):
        return False

    suffix = path.suffix.lower()
    if suffix not in INCLUDED_EXTS:
        return False

    low = str(path).lower()
    if any(low.endswith(bad) for bad in EXCLUDED_SUFFIXES):
        return False

    if path.name in EXCLUDED_FILE_NAMES:
        return False

    try:
        if path.stat().st_size > MAX_BYTES:
            return False
    except OSError:
        return False

    return True

def count_lines_in_file(path: Path) -> int:
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except (OSError, UnicodeDecodeError):
        return 0

def top_level_dir_of(path: Path, project_root: Path) -> str:
    try:
        rel = path.relative_to(project_root)
    except ValueError:
        return "_externo_"
    parts = rel.parts
    if not parts:
        return "."
    return parts[0]

def main(root: Path):
    total = 0
    by_ext = defaultdict(int)
    by_top_dir = defaultdict(int)
    top_files = []

    for current_root, dirs, files in os.walk(root):
        # sempre pule diretórios excluídos
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in files:
            p = Path(current_root) / fname
            if should_count_file(p, root):
                n = count_lines_in_file(p)
                if n <= 0:
                    continue
                total += n
                by_ext[p.suffix.lower()] += n
                by_top_dir[top_level_dir_of(p, root)] += n
                top_files.append((n, p))

    top_files.sort(reverse=True, key=lambda t: t[0])

    print("=== Contagem de linhas (só seu código) ===")
    for ext in sorted(by_ext):
        print(f"{ext:8s}: {by_ext[ext]:>10,d}")
    print("-" * 56)
    print("Por diretório (nível 1):")
    for d, n in sorted(by_top_dir.items(), key=lambda t: t[1], reverse=True):
        print(f"{d:20s}: {n:>10,d}")
    print("-" * 56)
    print(f"TOTAL   : {total:>10,d}")

    print("\nTop arquivos por número de linhas:")
    for i, (n, p) in enumerate(top_files[:TOP_N_FILES], 1):
        rel = os.path.relpath(p, root)
        print(f"{i:2d}. {n:>10,d}  {rel}")

if __name__ == "__main__":
    main(Path('.'))
