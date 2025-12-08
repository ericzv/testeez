#!/usr/bin/env python3
"""
Script para listar todas as tabelas do banco de dados
"""
import sqlite3

try:
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()

    # Listar todas as tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()

    print("📋 Tabelas no banco de dados:")
    for table in tables:
        print(f"   - {table[0]}")

    conn.close()
except Exception as e:
    print(f"❌ Erro: {e}")
