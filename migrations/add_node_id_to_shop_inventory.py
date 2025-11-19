"""
Migration: Adicionar node_id ao ShopInventory para vincular inventory a nós específicos

PROBLEMA:
- ShopInventory só tinha player_id
- Todos os shops usavam o mesmo inventory
- Shops diferentes mostravam mesmos itens

SOLUÇÃO:
- Adicionar coluna node_id
- Cada shop tem seu próprio inventory
- Shops em nós diferentes têm itens diferentes
"""

import sys
import os

# Adicionar diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import ShopInventory

def run_migration():
    """Adiciona coluna node_id à tabela shop_inventory"""
    with app.app_context():
        try:
            # Verificar se coluna já existe
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('shop_inventory')]

            if 'node_id' in columns:
                print("✅ Coluna 'node_id' já existe em shop_inventory")
                return True

            # Adicionar coluna node_id
            print("📝 Adicionando coluna 'node_id' à tabela shop_inventory...")
            with db.engine.connect() as conn:
                conn.execute(db.text("""
                    ALTER TABLE shop_inventory
                    ADD COLUMN node_id INTEGER
                """))
                conn.commit()

            print("✅ Coluna 'node_id' adicionada com sucesso!")

            # Limpar inventory antigo (não tem node_id válido)
            print("🧹 Limpando inventory antigo...")
            ShopInventory.query.delete()
            db.session.commit()
            print("✅ Inventory antigo limpo!")

            return True

        except Exception as e:
            print(f"❌ Erro na migration: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = run_migration()
    if success:
        print("\n🎉 Migration concluída com sucesso!")
    else:
        print("\n❌ Migration falhou!")
