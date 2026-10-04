# Testeez

App de estudo com **flashcards estilo Anki** (repetição espaçada SM-2, importação de `.apkg`,
estatísticas) integrado a um **RPG roguelike** (mapa procedural estilo Slay the Spire,
batalhas por turnos, relíquias, lembranças, talentos). Feito em Flask + SQLite, roda
localmente e pode ser acessado pelo celular/tablet na mesma rede.

> Planejamento e estado atual do projeto: **[ROADMAP.md](ROADMAP.md)**

## Como rodar

Requer Python 3.11+.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
python app.py
```

Abra <http://localhost:5000>. Para acessar de outro aparelho, veja [ACESSO_REMOTO.md](ACESSO_REMOTO.md).

**Seus dados ficam em `instance/flashcards.db`.** Faça cópia desse arquivo antes de
atualizar o código ou mexer no banco.

## Testes

```bash
python -m pytest
```

Os testes sobem o app com um banco temporário (não tocam no seu `instance/flashcards.db`)
e jogam pelo servidor, chamando as mesmas rotas que o navegador chama:

| Arquivo | O que cobre |
|---|---|
| `tests/test_smoke.py` | Páginas principais abrem; sessão de estudo registra a revisão |
| `tests/test_run_flow.py` | Run completa dos 3 atos até a vitória final; morte e nova run |
| `tests/test_regressions.py` | Bugs já corrigidos (para não voltarem) |
| `tests/helpers.py` | `GameDriver`: robô que joga pelas rotas — útil também para depurar |

## Estrutura

```
app.py                  Configuração do Flask, escolha de personagem, rotas antigas de perfil
models.py               Modelos principais (cartões, jogador, inimigos, relíquias, recompensas)
models_map.py           Mapa procedural (mapa, nós, progresso)
srs_engine.py           Algoritmo SM-2 e registro de revisões
characters.py           Personagens (Vlad) e skills
routes/
  cards.py              Flashcards: estudo, painel, importação .apkg, estatísticas
  battle.py             Batalha: dano, especiais, turnos, recompensas, relíquias
  battle_cache.py       Cache de ataque/defesa (bônus permanentes pré-calculados)
  battle_modules/       Geração de inimigos, turnos, recompensas, lembranças, poções, reset de run
  map.py, map_battle.py Mapa: gerar, escolher nó, loja, eventos, descanso, preparar batalha
  map_modules/          Geração do mapa, eventos (90+), efeitos, conclusão de nós
  relics/               Registro das 50 relíquias, hooks e processamento
  talents.py            Árvore de talentos (metaprogressão com cristais)
templates/gamification/gamification-spa.html   Hub + batalha (SPA)
static/js/battle-*.js   Sistema de batalha no navegador
```

Ferramentas de desenvolvimento: `/admin/...` (organizador de sprites), `/dev_*`
(rotas de teste em `routes/battle_modules/dev_tools.py`).

## Outros documentos

- [ROADMAP.md](ROADMAP.md) — o que já existe, bugs conhecidos e próximos passos
- [GAME_DESIGN_ANALYSIS.md](GAME_DESIGN_ANALYSIS.md) — análise de design e propostas (Técnicas, metaprogressão...)
- [docs/MAP_SYSTEM.md](docs/MAP_SYSTEM.md) — sistema de mapa procedural
- [CLAUDE.md](CLAUDE.md) — guia técnico para sessões com o Claude Code
