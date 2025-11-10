"""
Configuração de logging para o jogo
Substitui os prints espalhados por logging adequado
"""

import logging
import sys
from pathlib import Path

# Criar diretório de logs se não existir
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)


def setup_logging(level=logging.INFO):
    """
    Configura logging para toda a aplicação.

    Args:
        level: Nível de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """

    # Formato detalhado
    detailed_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Formato simples para console
    simple_format = logging.Formatter(
        '%(levelname)s - %(name)s - %(message)s'
    )

    # Handler para arquivo (detalhado)
    file_handler = logging.FileHandler(
        LOG_DIR / 'game.log',
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_format)

    # Handler para console (simples)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(simple_format)

    # Handler para erros (arquivo separado)
    error_handler = logging.FileHandler(
        LOG_DIR / 'errors.log',
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_format)

    # Configurar root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(error_handler)

    # Silenciar logs verbosos de bibliotecas
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Obtém logger para um módulo específico.

    Args:
        name: Nome do módulo (use __name__)

    Returns:
        Logger configurado

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Mensagem informativa")
        >>> logger.error("Erro ocorreu", exc_info=True)
    """
    return logging.getLogger(name)


# Configurar logging ao importar
setup_logging()
