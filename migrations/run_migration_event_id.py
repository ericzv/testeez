"""
Migração: Adicionar campo event_id à map_node
Execute este script para adicionar o campo event_id ao banco de dados.
"""

import sys
import os

# Adicionar pasta raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db
from app import app

def run_migration():
    """Executa a migração para adicionar event_id"""
    with app.app_context():
        try:
            # Verificar se a coluna já existe
            result = db.session.execute(
                "PRAGMA table_info(map_node)"
            ).fetchall()

            columns = [row[1] for row in result]

            if 'event_id' in columns:
                print("✅ Campo 'event_id' já existe na tabela map_node")
                return True

            # Adicionar a coluna
            print("📝 Adicionando campo 'event_id' à tabela map_node...")
            db.session.execute(
                "ALTER TABLE map_node ADD COLUMN event_id VARCHAR(100)"
            )

            db.session.commit()
            print("✅ Migração concluída com sucesso!")
            print("📌 IMPORTANTE: Eventos existentes nos nós serão regenerados na próxima vez que forem acessados.")
            return True

        except Exception as e:
            print(f"❌ Erro na migração: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
