# Guia técnico (para sessões do Claude Code)

Projeto em português: UI, comentários, commits e documentos em pt-BR.
Leia o [ROADMAP.md](ROADMAP.md) antes de começar: ele diz o que existe e o que vem a seguir.

## Rodar e verificar

```bash
pip install -r requirements.txt
python -m pytest            # ~30s, banco temporário; rode antes de qualquer push
python app.py               # http://localhost:5000 (usa instance/flashcards.db)
```

- `tests/helpers.py` tem o `GameDriver`, que joga pelas rotas na mesma ordem do frontend
  (escolher personagem → mapa → batalha → turno inimigo → recompensas). Para reproduzir
  um bug de jogo, escreva primeiro um teste com ele.
- Configuração por ambiente: `TESTEEZ_DATABASE_URI`, `TESTEEZ_SESSION_DIR`,
  `TESTEEZ_SECRET_KEY`, `LOG_LEVEL`, `LOG_TO_FILE`.
- Para ver o jogo no navegador (Playwright): os templates carregam particles.js, jQuery,
  Bootstrap e Chart.js de CDN. Sem internet o `particlesJS` não existe; o hub já se protege
  disso, mas outras páginas podem não se proteger.
- **Nunca** commitar `instance/flashcards.db` com dados novos nem apagá-lo do git: está
  versionado (antigo) e o usuário usa o arquivo local de verdade; um `git rm` apagaria os
  dados dele no próximo `git pull`.

## Arquitetura em 1 minuto

- Flask monolítico, SQLite via Flask-SQLAlchemy, sessão server-side (Flask-Session, filesystem).
- **Um único jogador**: o código usa `Player.query.first()` em todo lugar. Não há login.
- Migrações: não há Alembic. Colunas novas são adicionadas com `ALTER TABLE` dentro de
  `try/except` na inicialização (ver `app.py`, `routes/cards.py:migrate_cards_to_notes`).
  `db.create_all()` cria tabelas novas, mas **não** adiciona colunas em tabelas existentes.
- Flashcards: `routes/cards.py` + `srs_engine.py` (SM-2, filas novo/aprendizado/revisão).
- Jogo: hub + batalha numa SPA (`templates/gamification/gamification-spa.html`,
  `static/js/battle-*.js`). O mapa abre como popup (`partials/hub-map-popup.html`).

### Fluxo de uma batalha (servidor)

1. `POST /map/api/select-node/<id>` → `POST /map/battle/api/prepare[-elite|-boss]`
2. `POST /gamification/damage_boss {skill_id}` — usa o **cache de ataque**
   (`battle_cache.calculate_attack_cache`), aplica buffs/relíquias em runtime, e na morte do
   inimigo cria `PendingReward`, opções de lembrança na sessão e **conclui o nó**
   (`map_modules/progress.complete_current_combat_node`). Mortes por skill especial passam por
   `POST /gamification/process_skill_kill`, que faz o mesmo.
3. Turno inimigo: `end_player_turn` → `execute_buff_debuff_skills` → `execute_enemy_attack`
   (repetir enquanto `enemy_attack_status.has_charges`) → `restore_energy`.
4. Hub: `check_pending_rewards` → `apply_victory_rewards` (soma todas as pendentes, entrega
   poções) → `check_memory_reward`/`select_memory` → `get_relic_options`/`select_relic`.
5. Nó de **boss** é concluído pelo frontend via `POST /map/api/complete-node`, porque ele avança
   o ato (apaga o mapa) ou encerra o jogo no ato 3. `complete-node` é idempotente.

### Armadilhas conhecidas

- Sessão server-side com `SESSION_REFRESH_EACH_REQUEST = False`: **não** volte para `True`.
  O frontend faz requisições em paralelo; com `True` cada requisição regrava a sessão inteira e
  uma sobrescreve a outra. Estado importante de jogo deve ir para o banco (como `PendingReward`),
  não para a sessão.

- O cache de ataque guarda bônus permanentes (talentos, lembranças, relíquias passivas). Se
  você adicionar um bônus permanente, inclua-o em `calculate_attack_cache` e confira que o
  cache é recalculado quando o bônus muda. Se o cálculo levantar exceção, ele faz rollback e
  o jogo continua com o cache **antigo** em silêncio — por isso existe teste para isso.
- Relíquias: `routes/relics/registry.py` (definições), `hooks.py` (quando disparam),
  `processor.py` (efeitos). Para desativar uma relíquia comente com `#`, **nunca** com `'''`
  (strings adjacentes se concatenam e corrompem a chave seguinte).
- `run_bosses_defeated` conta só bosses/elites (talento "Caçador de Bosses" depende disso).
- O frontend tem muito `setTimeout` encadeado; erros de JS no meio de um `.then` costumavam
  pular o fluxo de vitória. Proteja atualizações visuais com `try/catch` e deixe a lógica de
  estado no servidor.
- Páginas antigas pré-SPA (`/gamification/hub-legacy`, `profile`, `attributes`, `inventory`,
  `templates/gamification/hub.html`, `static/js/spa-navigation.js`) estão sem uso; candidatas
  a remoção (ver ROADMAP).
