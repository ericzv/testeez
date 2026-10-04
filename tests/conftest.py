"""
Configuração dos testes.

Os testes sobem o app Flask com um banco SQLite TEMPORÁRIO (nunca tocam no
instance/flashcards.db de verdade) e jogam pelo test client, chamando as
mesmas rotas que o navegador chama.

Rodar:  python -m pytest tests -q
"""
import os
import sys
import tempfile

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_TMP = tempfile.mkdtemp(prefix='testeez-tests-')

# Precisa vir ANTES de importar o app: a configuração é lida no import.
os.environ['TESTEEZ_DATABASE_URI'] = 'sqlite:///' + os.path.join(_TMP, 'test.db')
os.environ['TESTEEZ_SESSION_DIR'] = os.path.join(_TMP, 'flask_session')
os.environ.setdefault('LOG_TO_FILE', 'false')
os.environ.setdefault('LOG_LEVEL', 'WARNING')

if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
os.chdir(ROOT)


@pytest.fixture(scope='session')
def flask_app():
    import app as app_module
    app_module.app.config['TESTING'] = True
    return app_module.app


@pytest.fixture()
def game(flask_app):
    """Um jogador começando uma run nova, com o test client já logado na sessão."""
    from tests.helpers import GameDriver
    driver = GameDriver(flask_app)
    driver.new_run()
    return driver
