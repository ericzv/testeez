"""
Migração para adicionar blood_stacks ao Player
Corrige erro de implementação - acúmulos devem estar no Vlad, não no inimigo
"""
import sqlite3
import os

DB_PATH = "instance/flashcards.db"

def migrate():
    """Adiciona blood_stacks ao Player"""
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado: {DB_PATH}")
        return False

    print("🔄 Adicionando blood_stacks ao Player...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(player)")
        columns = [row[1] for row in cursor.fetchall()]

        if "blood_stacks" in columns:
            print("  ⏭️  Coluna 'blood_stacks' já existe em 'player'")
        else:
            # Adicionar a coluna
            cursor.execute("ALTER TABLE player ADD COLUMN blood_stacks INTEGER DEFAULT 0")
            print("  ✅ Coluna 'blood_stacks' adicionada em 'player'")

        conn.commit()
        print("\n✅ Migração concluída!")
        return True

    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = migrate()
    if success:
        print("\n🎉 Banco de dados atualizado!")
    else:
        print("\n❌ Falha na migração.")
