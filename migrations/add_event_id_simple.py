"""
Migração simples: Adicionar campo event_id à map_node
"""

import sqlite3
import os

# Caminho do banco de dados
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'flashcards.db')

def run_migration():
    """Adiciona coluna event_id se não existir"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(map_node)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'event_id' in columns:
            print("✅ Campo 'event_id' já existe na tabela map_node")
            conn.close()
            return True

        # Adicionar a coluna
        print("📝 Adicionando campo 'event_id' à tabela map_node...")
        cursor.execute("ALTER TABLE map_node ADD COLUMN event_id VARCHAR(100)")

        conn.commit()
        conn.close()

        print("✅ Migração concluída com sucesso!")
        print("📌 IMPORTANTE: Eventos existentes nos nós serão regenerados na próxima vez que forem acessados.")
        return True

    except sqlite3.OperationalError as e:
        if 'no such table' in str(e):
            print("⚠️  Tabela map_node não existe ainda. A coluna será criada quando a tabela for criada.")
            return True
        print(f"❌ Erro na migração: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        return False

if __name__ == '__main__':
    import sys
    success = run_migration()
    sys.exit(0 if success else 1)
