"""
Migração: Criar tabelas do sistema de SHOP
Execute este script para criar as tabelas shop_inventory e player_potion_slot
"""

import sys
import os

# Adicionar pasta raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db
from app import app

def run_migration():
    """Executa a migração para criar tabelas do sistema de shop"""
    with app.app_context():
        try:
            # Verificar se as tabelas já existem
            result = db.session.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()

            existing_tables = [row[0] for row in result]

            # 1. Criar tabela shop_inventory
            if 'shop_inventory' not in existing_tables:
                print("📝 Criando tabela 'shop_inventory'...")
                db.session.execute("""
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
                db.session.execute("""
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

            db.session.commit()
            print("\n🎉 Migração concluída com sucesso!")
            print("📌 Sistema de SHOP está pronto para uso!")
            return True

        except Exception as e:
            print(f"❌ Erro na migração: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
