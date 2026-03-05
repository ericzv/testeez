"""
Sistema de logging centralizado para o jogo.

Uso:
    from utils.logger import get_logger
    logger = get_logger(__name__)

    logger.debug("Detalhes de debug")
    logger.info("Ação importante executada")
    logger.warning("Algo inesperado mas não crítico")
    logger.error("Erro que precisa atenção")

Configuração via variáveis de ambiente:
    LOG_LEVEL: DEBUG, INFO, WARNING, ERROR (default: DEBUG)
    LOG_TO_FILE: true/false (default: true)
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Diretório de logs
LOG_DIR = Path(__file__).parent.parent / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Configuração via ambiente
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'DEBUG').upper()
LOG_TO_FILE = os.environ.get('LOG_TO_FILE', 'true').lower() == 'true'

# Formato do log
LOG_FORMAT = '%(asctime)s | %(name)s | %(levelname)s | %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# Cache de loggers já configurados
_loggers = {}

# Cache de file handlers compartilhados por arquivo de log
# Evita criar múltiplos RotatingFileHandler para o mesmo arquivo,
# o que causaria PermissionError no Windows ao tentar rotacionar.
_file_handlers: dict = {}


def _get_file_handler(log_file: Path, level: int, formatter: logging.Formatter) -> RotatingFileHandler:
    """Retorna um RotatingFileHandler compartilhado para o arquivo especificado."""
    key = str(log_file)
    if key not in _file_handlers:
        handler = RotatingFileHandler(
            log_file,
            maxBytes=10_000_000,  # 10MB
            backupCount=5,
            encoding='utf-8',
            delay=True,
        )
        handler.setFormatter(formatter)
        handler.setLevel(level)
        _file_handlers[key] = handler
    return _file_handlers[key]


def get_logger(name: str) -> logging.Logger:
    """
    Retorna um logger configurado para o módulo especificado.

    Args:
        name: Nome do módulo (use __name__)

    Returns:
        Logger configurado
    """
    # Retorna do cache se já existe
    if name in _loggers:
        return _loggers[name]

    logger = logging.getLogger(name)

    # Evita adicionar handlers duplicados
    if logger.handlers:
        _loggers[name] = logger
        return logger

    # Configurar nível
    level = getattr(logging, LOG_LEVEL, logging.DEBUG)
    logger.setLevel(level)

    # Formatter
    formatter = logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT)

    # Handler para console (sempre ativo em desenvolvimento)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)
    logger.addHandler(console_handler)

    # Handler para arquivo compartilhado (evita múltiplas instâncias por arquivo)
    if LOG_TO_FILE:
        # Agrupa logs por categoria
        if 'battle' in name.lower():
            log_file = LOG_DIR / 'battle.log'
        elif 'relic' in name.lower():
            log_file = LOG_DIR / 'relics.log'
        elif 'enemy' in name.lower():
            log_file = LOG_DIR / 'enemies.log'
        else:
            log_file = LOG_DIR / 'app.log'

        file_handler = _get_file_handler(log_file, level, formatter)
        logger.addHandler(file_handler)

    # Não propagar para o logger raiz
    logger.propagate = False

    # Cachear
    _loggers[name] = logger

    return logger


# Atalhos para módulos comuns
def get_battle_logger() -> logging.Logger:
    """Logger específico para sistema de batalha."""
    return get_logger('battle')


def get_relic_logger() -> logging.Logger:
    """Logger específico para sistema de relíquias."""
    return get_logger('relics')


def get_enemy_logger() -> logging.Logger:
    """Logger específico para sistema de inimigos."""
    return get_logger('enemies')
