"""
Script de migração para adicionar novos campos ao modelo SpecialSkill
Adiciona campos para o sistema de turnos e blood stacks
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = "instance/flashcards.db"

def add_column_if_not_exists(cursor, table, column, column_type, default_value):
    """Adiciona uma coluna se ela não existir"""
    try:
        # Verificar se a coluna já existe
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]

        if column in columns:
            print(f"  ⏭️  Coluna '{column}' já existe em '{table}'")
            return False

        # Adicionar a coluna
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type} {default_value}")
        print(f"  ✅ Coluna '{column}' adicionada em '{table}'")
        return True
    except Exception as e:
        print(f"  ❌ Erro ao adicionar coluna '{column}' em '{table}': {e}")
        return False

def migrate():
    """Executa a migração"""
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado: {DB_PATH}")
        return False

    print("🔄 Iniciando migração de SpecialSkill...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Lista de colunas a adicionar: (tabela, coluna, tipo, default)
    migrations = [
        # Campos do novo sistema de turnos e blood stacks
        ("special_skill", "energy_cost", "INTEGER", "DEFAULT 0"),
        ("special_skill", "hp_cost", "INTEGER", "DEFAULT 0"),
        ("special_skill", "blood_stacks_generated", "INTEGER", "DEFAULT 0"),
        ("special_skill", "next_attack_bonus", "INTEGER", "DEFAULT 0"),
        ("special_skill", "effect_type", "VARCHAR(50)", ""),
        ("special_skill", "damage_per_blood_stack", "INTEGER", "DEFAULT 0"),
        ("special_skill", "consumes_blood_stacks", "BOOLEAN", "DEFAULT 0"),
        ("special_skill", "barrier_per_blood_stack", "INTEGER", "DEFAULT 0"),
        ("special_skill", "heal_per_blood_stack", "INTEGER", "DEFAULT 0"),

        # Caminhos de mídia do novo sistema
        ("special_skill", "animation_sprite", "VARCHAR(255)", ""),
        ("special_skill", "animation_frames", "INTEGER", "DEFAULT 1"),
        ("special_skill", "animation_target", "VARCHAR(20)", ""),
        ("special_skill", "sound_effect", "VARCHAR(255)", ""),
    ]

    added_count = 0
    for table, column, col_type, default in migrations:
        if add_column_if_not_exists(cursor, table, column, col_type, default):
            added_count += 1

    conn.commit()
    conn.close()

    print(f"\n✅ Migração concluída! {added_count} colunas adicionadas.")
    return True

if __name__ == "__main__":
    success = migrate()
    if success:
        print("\n🎉 Banco de dados atualizado com sucesso!")
        print("⚠️  Reinicie o servidor para aplicar as mudanças.")
    else:
        print("\n❌ Falha na migração.")
