"""
migrate_sm2.py — Migração para o sistema SM-2

Adiciona colunas SM-2 ao Card e cria a tabela ReviewLog.
Converte cartões existentes do algoritmo antigo para SM-2.

Executar UMA VEZ:
    python migrate_sm2.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Card, ReviewLog
from sqlalchemy import text, inspect


def migrate():
    with app.app_context():
        inspector = inspect(db.engine)
        card_columns = [col['name'] for col in inspector.get_columns('card')]

        # 1. Adicionar colunas SM-2 se não existirem
        new_columns = [
            ("easiness_factor", "FLOAT DEFAULT 2.5"),
            ("repetition", "INTEGER DEFAULT 0"),
        ]

        for col_name, col_type in new_columns:
            if col_name not in card_columns:
                try:
                    db.session.execute(text(f"ALTER TABLE card ADD COLUMN {col_name} {col_type}"))
                    db.session.commit()
                    print(f"  + Coluna '{col_name}' adicionada à tabela card")
                except Exception as e:
                    db.session.rollback()
                    print(f"  ! Erro ao adicionar '{col_name}': {e}")
            else:
                print(f"  = Coluna '{col_name}' já existe")

        # 2. Criar tabela review_log se não existir
        if 'review_log' not in inspector.get_table_names():
            ReviewLog.__table__.create(db.engine)
            print("  + Tabela 'review_log' criada")
        else:
            print("  = Tabela 'review_log' já existe")

        # 3. Converter cartões existentes para SM-2
        cards = Card.query.all()
        converted = 0

        for card in cards:
            # Só converter se EF ainda está no default (não foi migrado antes)
            if card.easiness_factor == 2.5 and card.repetition == 0 and card.review_count > 0:
                # Converter difficulty (1-10) → easiness_factor (1.3-3.7)
                # difficulty=1 (fácil) → EF alto, difficulty=10 (difícil) → EF baixo
                old_diff = card.difficulty if card.difficulty else 5
                card.easiness_factor = max(1.3, 2.5 + (5 - old_diff) * 0.25)

                # Estimar repetition com base no intervalo atual
                if card.interval >= 6:
                    card.repetition = 2
                elif card.interval >= 1:
                    card.repetition = 1
                else:
                    card.repetition = 0

                # Sincronizar difficulty de volta a partir do novo EF
                card.difficulty = max(1, min(10, round(10 - (card.easiness_factor - 1.3) * 9 / 2.2)))

                converted += 1

        if converted > 0:
            db.session.commit()

        print(f"\n  Migração concluída: {converted} cartões convertidos para SM-2")
        print(f"  Total de cartões: {len(cards)}")


if __name__ == '__main__':
    print("=== Migração SM-2 ===\n")
    migrate()
    print("\n=== Pronto! ===")
