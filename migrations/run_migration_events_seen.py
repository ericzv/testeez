"""
Migração: Adicionar campo events_seen à player_map_progress
Execute este script para adicionar o campo events_seen ao banco de dados.
"""

import sys
import os

# Adicionar pasta raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db
from app import app

def run_migration():
    """Executa a migração para adicionar events_seen"""
    with app.app_context():
        try:
            # Verificar se a coluna já existe
            result = db.session.execute(
                "PRAGMA table_info(player_map_progress)"
            ).fetchall()

            columns = [row[1] for row in result]

            if 'events_seen' in columns:
                print("✅ Campo 'events_seen' já existe na tabela player_map_progress")
                return True

            # Adicionar a coluna
            print("📝 Adicionando campo 'events_seen' à tabela player_map_progress...")
            db.session.execute(
                "ALTER TABLE player_map_progress ADD COLUMN events_seen TEXT DEFAULT '[]'"
            )

            # Atualizar registros existentes
            print("🔄 Atualizando registros existentes...")
            db.session.execute(
                "UPDATE player_map_progress SET events_seen = '[]' WHERE events_seen IS NULL"
            )

            db.session.commit()
            print("✅ Migração concluída com sucesso!")
            return True

        except Exception as e:
            print(f"❌ Erro na migração: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
