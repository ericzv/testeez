"""
Script de migração para adicionar o sistema de Sangue Coagulado e Skills Especiais baseadas em turnos
"""
import sqlite3
import os

DB_PATH = './instance/flashcards.db'

def migrate():
    """Adiciona novas colunas ao banco de dados"""

    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado: {DB_PATH}")
        return False

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    migrations = []

    # ===== PLAYER: Campos de skills especiais baseadas em turnos =====
    migrations.append(("player", "special_skills_used_this_turn", "TEXT DEFAULT '[]'",
                      "Rastreamento de skills especiais usadas no turno atual"))
    migrations.append(("player", "next_attack_bonus_damage", "INTEGER DEFAULT 0",
                      "Bônus temporário de dano para o próximo ataque"))
    migrations.append(("player", "pending_special_skill_animation", "TEXT",
                      "Skill especial pendente para animação"))

    # ===== GENERIC_ENEMY: Acúmulos de sangue =====
    migrations.append(("generic_enemy", "blood_stacks", "INTEGER DEFAULT 0",
                      "Acúmulos de sangue no inimigo"))

    # ===== LAST_BOSS: Acúmulos de sangue =====
    migrations.append(("last_bosses", "blood_stacks", "INTEGER DEFAULT 0",
                      "Acúmulos de sangue no boss"))

    # Executar migrations
    for table, column, sql_type, description in migrations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}")
            print(f"✅ Adicionado: {table}.{column} - {description}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"⚠️  Já existe: {table}.{column}")
            else:
                print(f"❌ Erro em {table}.{column}: {e}")

    conn.commit()
    conn.close()
    print("\n✅ Migração concluída com sucesso!")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRAÇÃO: Sistema de Sangue Coagulado + Skills por Turnos")
    print("=" * 60)
    migrate()
