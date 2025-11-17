#!/usr/bin/env python3
"""
Script de migração para criar as tabelas do sistema de mapa procedural.
Execute este script uma vez para criar as tabelas necessárias.

Uso:
    python migrate_map.py
"""

import sys
import os

# Adicionar diretório do projeto ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from database import db, init_db
from models_map import ProceduralMap, MapNode, PlayerMapProgress

def migrate():
    """Cria as tabelas do sistema de mapa"""

    print("=" * 50)
    print("MIGRAÇÃO DO SISTEMA DE MAPA PROCEDURAL")
    print("=" * 50)

    # Criar app Flask temporário
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cards.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicializar banco
    init_db(app)

    with app.app_context():
        try:
            # Criar tabelas
            print("\n1. Criando tabelas...")

            # Verificar se as tabelas já existem
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()

            new_tables = []

            if 'procedural_map' not in existing_tables:
                ProceduralMap.__table__.create(db.engine)
                new_tables.append('procedural_map')
                print("   ✅ Tabela 'procedural_map' criada")
            else:
                print("   ⏭️ Tabela 'procedural_map' já existe")

            if 'map_node' not in existing_tables:
                MapNode.__table__.create(db.engine)
                new_tables.append('map_node')
                print("   ✅ Tabela 'map_node' criada")
            else:
                print("   ⏭️ Tabela 'map_node' já existe")

            if 'player_map_progress' not in existing_tables:
                PlayerMapProgress.__table__.create(db.engine)
                new_tables.append('player_map_progress')
                print("   ✅ Tabela 'player_map_progress' criada")
            else:
                print("   ⏭️ Tabela 'player_map_progress' já existe")

            db.session.commit()

            # Resumo
            print("\n2. Verificação final...")
            inspector = inspect(db.engine)
            final_tables = inspector.get_table_names()

            map_tables = ['procedural_map', 'map_node', 'player_map_progress']
            all_ok = True

            for table in map_tables:
                if table in final_tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} - NÃO ENCONTRADA")
                    all_ok = False

            if all_ok:
                print("\n" + "=" * 50)
                print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
                print("=" * 50)

                if new_tables:
                    print(f"\nNovas tabelas criadas: {', '.join(new_tables)}")
                else:
                    print("\nNenhuma nova tabela criada (todas já existiam)")

                print("\nPróximos passos:")
                print("1. Reinicie o servidor Flask")
                print("2. Acesse /map/ para ver o sistema de mapa")
                print("3. Adicione um botão no hub para acessar o mapa")
            else:
                print("\n" + "=" * 50)
                print("❌ MIGRAÇÃO INCOMPLETA")
                print("=" * 50)
                print("\nAlgumas tabelas não foram criadas corretamente.")
                print("Verifique os logs acima para mais detalhes.")

        except Exception as e:
            print(f"\n❌ ERRO na migração: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    migrate()
