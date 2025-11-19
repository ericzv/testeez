"""
Migração standalone: Criar tabelas do sistema de SHOP
Este script usa apenas sqlite3 padrão do Python
"""

import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance', 'flashcards.db')

def run_migration():
    """Executa a migração para criar tabelas do sistema de shop"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Verificar tabelas existentes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]

        # 1. Criar tabela shop_inventory
        if 'shop_inventory' not in existing_tables:
            print("📝 Criando tabela 'shop_inventory'...")
            cursor.execute("""
                CREATE TABLE shop_inventory (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    player_id INTEGER NOT NULL,
                    item_type VARCHAR(20) NOT NULL,
                    item_id VARCHAR(50) NOT NULL,
                    price INTEGER NOT NULL,
                    rarity VARCHAR(20),
                    is_purchased BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (player_id) REFERENCES player(id)
                )
            """)
            print("✅ Tabela 'shop_inventory' criada com sucesso!")
        else:
            print("✅ Tabela 'shop_inventory' já existe")

        # 2. Criar tabela player_potion_slot
        if 'player_potion_slot' not in existing_tables:
            print("📝 Criando tabela 'player_potion_slot'...")
            cursor.execute("""
                CREATE TABLE player_potion_slot (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    player_id INTEGER NOT NULL,
                    slot_number INTEGER NOT NULL,
                    potion_type VARCHAR(20),
                    quantity INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (player_id) REFERENCES player(id),
                    UNIQUE (player_id, slot_number)
                )
            """)
            print("✅ Tabela 'player_potion_slot' criada com sucesso!")
        else:
            print("✅ Tabela 'player_potion_slot' já existe")

        conn.commit()
        conn.close()

        print("\n🎉 Migração concluída com sucesso!")
        print("📌 Sistema de SHOP está pronto para uso!")
        return True

    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    import sys
    success = run_migration()
    sys.exit(0 if success else 1)
