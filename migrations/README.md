# Migrações de Banco de Dados

## Como Executar Migrações

### Migração: add_events_seen_to_player_map_progress

**O que faz**: Adiciona o campo `events_seen` à tabela `player_map_progress` para rastrear eventos únicos por run.

**Quando executar**: Antes de usar o sistema de eventos atualizado.

**Opção 1 - Script Python** (Recomendado):
```bash
# No diretório raiz do projeto
python migrations/run_migration_events_seen.py
```

**Opção 2 - SQL Direto**:
```bash
# Se estiver usando SQLite
sqlite3 instance/game.db < migrations/add_events_seen_to_player_map_progress.sql
```

**Opção 3 - Automático** (Já implementado):
A migração será executada automaticamente ao iniciar o servidor pela primeira vez, pois o código já está preparado para lidar com o campo ausente.

## Verificar se Migração Foi Aplicada

```python
# Execute no console Python
from database import db
from app import app

with app.app_context():
    result = db.session.execute("PRAGMA table_info(player_map_progress)").fetchall()
    columns = [row[1] for row in result]
    print("events_seen presente:", 'events_seen' in columns)
```

## Próximas Migrações

Adicione novos arquivos SQL/Python nesta pasta conforme necessário.
