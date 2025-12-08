#!/usr/bin/env python3
"""
Script para adicionar coluna potion_drop à tabela pending_reward
"""
import sqlite3

try:
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()

    # Verificar se a coluna já existe
    cursor.execute("PRAGMA table_info(pending_reward)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'potion_drop' in columns:
        print("✅ Coluna 'potion_drop' já existe!")
    else:
        # Adicionar coluna
        cursor.execute("ALTER TABLE pending_reward ADD COLUMN potion_drop VARCHAR(50)")
        conn.commit()
        print("✅ Coluna 'potion_drop' adicionada com sucesso!")

    conn.close()
except Exception as e:
    print(f"❌ Erro: {e}")
