# Resumo de Arquivos - Sistema de Skills

## Localização dos Arquivos Principais

```
/home/user/testeez/
│
├── ANÁLISE COMPLETA
│   ├── ANALISE_SKILLS.md                      # Documentação detalhada do sistema
│   ├── SKILLS_QUICK_REFERENCE.md              # Referência rápida
│   ├── IMPLEMENTACAO_SANGUE.md                # Guia para adicionar acúmulo de sangue
│   └── FILES_SUMMARY.md                       # Este arquivo
│
├── MODELOS E DEFINIÇÕES
│   ├── models.py                              # SQLAlchemy models (linhas 51-131)
│   │   ├── SpecialSkill (51-75)
│   │   ├── PlayerSkill (77-88)
│   │   ├── ActiveBuff (107-131)
│   │   └── Player (65-225)
│   │
│   ├── characters.py                          # Sistema completo de skills
│   │   ├── VLAD_SPECIAL_SKILLS_DATA (271-344)
│   │   ├── VLAD_ATTACK_SKILLS_DATA (197-269)
│   │   ├── use_special_skill() (1129-1283)
│   │   ├── extend_or_create_buff() (1067-1127)
│   │   ├── update_skill_charges() (1285-1328)
│   │   └── get_player_specials() (944-981)
│   │
│   └── skill_effects.py                       # Efeitos especiais
│       ├── apply_positive_effect() (4-18)
│       ├── apply_lifesteal_effect() (20-37)
│       ├── apply_multi_boost_effect() (39-57)
│       └── apply_blood_embrace_effect() (118-120)
│
├── ROTAS E CONTROLLERS
│   └── routes/battle.py
│       ├── use_special() (1422-1505)          # Ativa skill especial
│       ├── player_specials() (1654-1675)      # API de skills especiais
│       ├── player_attacks() (1594-1652)       # API de ataques
│       └── get_player_specials_api() (1399-1420)
│
├── SISTEMA DE TURNOS
│   └── routes/battle_modules/battle_turns.py
│       ├── get_next_actions() (22-195)        # Determina ações do inimigo
│       ├── load_enemy_skills_data() (10-19)   # Carrega skills do JSON
│       └── [423 linhas totais]
│
├── FRONT-END - JavaScript
│   ├── static/js/battle-skills-system.js      # UI de skills
│   │   ├── populateAttackOptions()
│   │   └── populateSpecialOptions()
│   │
│   ├── static/js/battle-turns.js              # Sistema de turnos
│   │   ├── endPlayerTurn()
│   │   ├── updateEnemyIntentions()
│   │   └── [100+ linhas]
│   │
│   └── static/js/battle-combat-system.js      # Sistema de combate
│       ├── PROJECTILE_TYPES (12-65)
│       └── BEAM_TYPES (68-150)
│
├── FRONT-END - CSS
│   ├── static/css/battle.css
│   ├── static/css/hub.css
│   └── static/css/enemy-skills.css
│
├── DADOS (JSON)
│   └── static/game.data/
│       ├── enemy_skills_data.json             # Skills dos inimigos
│       ├── enemy_themes_config.json           # Temas de inimigos
│       ├── enemy_names_config.json            # Nomes de inimigos
│       └── enemy_equipment_skills.json        # Skills de equipamentos
│
└── BANCO DE DADOS
    └── instance/app.db                        # SQLite database
```

---

## Fluxo de Dados - Diagrama

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONT-END (HTML/JS)                      │
│  battle-skills-system.js + battle.css                       │
└─────────────┬───────────────────────────────────────────────┘
              │ fetch('/gamification/use_special?skill_id=X')
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  FLASK ROUTE (routes/battle.py)             │
│  /gamification/use_special (linhas 1422-1505)               │
└─────────────┬───────────────────────────────────────────────┘
              │ use_special_skill(player_id, skill_id)
              ▼
┌─────────────────────────────────────────────────────────────┐
│          LOGIC (characters.py)                              │
│  use_special_skill() (linhas 1129-1283)                     │
│  ├─ Validação                                               │
│  ├─ Aplicar Efeitos Positivos → extend_or_create_buff()     │
│  ├─ Aplicar Efeitos Negativos                               │
│  ├─ Consumir Carga                                          │
│  └─ Retornar Resultado                                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│       DATABASE (models.py)                                  │
│  ├─ Update Player.hp, Player.mp, Player.energy              │
│  ├─ Update/Insert ActiveBuff                                │
│  ├─ Update PlayerSkill.current_charges                      │
│  ├─ Insert CombatLog                                        │
│  └─ Commit changes                                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│             RESPONSE (JSON)                                 │
│  {success, message, details, animation_data}                │
└─────────────┬───────────────────────────────────────────────┘
              │ JSON response
              ▼
┌─────────────────────────────────────────────────────────────┐
│          FRONT-END (atualizar UI)                           │
│  battle-skills-system.js                                    │
│  ├─ Animar skill                                            │
│  ├─ Mostrar mensagem                                        │
│  ├─ Atualizar cargas                                        │
│  └─ Atualizar buffs ativos                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Skills Especiais - Localização Completa

| Skill | ID | Arquivo | Linhas | Modelo |
|-------|----|---------|---------|----|
| **Autofagia** | 138 | characters.py | 273-289 | VLAD_SPECIAL_SKILLS_DATA[0] |
| **Aura Vampírica** | 139 | characters.py | 291-307 | VLAD_SPECIAL_SKILLS_DATA[1] |
| **Domínio Mental** | 140 | characters.py | 309-325 | VLAD_SPECIAL_SKILLS_DATA[2] |
| **Abraço Sanguíneo** | 141 | characters.py | 327-343 | VLAD_SPECIAL_SKILLS_DATA[3] |

---

## Ataques do Vlad - Localização Completa

| Ataque | ID | Tipo | Arquivo | Linhas |
|--------|----|----|---------|--------|
| **Energia Escura** | 50 | Poder | characters.py | 199-216 |
| **Garras Sangrentas** | 51 | Ataque | characters.py | 218-233 |
| **Abraço da Escuridão** | 52 | Especial | characters.py | 235-251 |
| **Beijo da Morte** | 53 | Suprema | characters.py | 253-268 |

---

## Modelos de Banco de Dados - Estrutura

### SpecialSkill (characters.py:51-75)
```
id (PK)
name
description
max_charges
cooldown_minutes
positive_effect_type
positive_effect_value (TEXT - pode ser JSON)
negative_effect_type
negative_effect_value
duration_type ("time" ou "attacks")
duration_value
animation_activate_1
animation_activate_2
icon
sound_prep_1
sound_prep_2
sound_effect_1
sound_effect_2
```

### PlayerSkill (characters.py:77-88)
```
id (PK)
player_id (FK → Player)
skill_type ("attack" ou "special")
skill_id (ID da skill)
current_charges
last_charge_time
unlocked_at
```

### ActiveBuff (characters.py:107-131)
```
id (PK)
player_id (FK → Player)
source_skill_id
skill_type ("attack" ou "special")
effect_type
effect_value
duration_type ("time" ou "attacks")
duration_value
start_time
attacks_remaining
icon
```

---

## Funções Críticas

### characters.py

| Função | Linhas | Descrição |
|--------|--------|-----------|
| `use_special_skill()` | 1129-1283 | Ativa skill especial completa |
| `extend_or_create_buff()` | 1067-1127 | Cria ou estende buff ativo |
| `update_skill_charges()` | 1285-1328 | Recalcula cargas |
| `get_player_specials()` | 944-981 | Retorna skills especiais do jogador |
| `use_attack_skill()` | 983-1065 | Usa ataque com aplicação de buffs |
| `apply_positive_effect()` | skill_effects.py:4-18 | Aplica efeito positivo |
| `choose_character()` | 397-446 | Configura personagem e skills |
| `init_vlad_skills()` | 350-381 | Inicializa skills no banco |

---

## Rotas HTTP

### Ativação de Skills
```
POST /gamification/use_special?skill_id=138
Parâmetros: skill_id (int)
Retorno: {success, message, details}
```

### Leitura de Skills
```
GET /gamification/player/specials
Retorno: {success, specials: [...]}

GET /gamification/player/attacks
Retorno: {success, attacks: [...]}
```

### Debug
```
POST /gamification/fill_special_charges
Função: Preenche todas as cargas de todas as skills (TESTE APENAS)
```

---

## Dados JSON Configuráveis

### enemy_skills_data.json
```json
{
  "attack_skills": {
    "1": {id, name, icon, damage_range, charge_interval, ...}
  },
  "buff_skills": {
    "50": {id, name, effect_type, effect_value, ...}
  },
  "debuff_skills": {
    "100": {id, name, effect_type, effect_value, ...}
  }
}
```

---

## Alterações Necessárias para Sangue

1. **models.py** (após linha 138)
   - `blood_accumulated: int`
   - `blood_threshold: int`
   - `blood_max: int`
   - `blood_stacks: int`

2. **characters.py** (modificar use_special_skill)
   - Adicionar bloco de sangue (linhas ~1170)
   - Registrar gasto de sangue
   - Verificar stacks

3. **routes/battle.py** (modificar player_specials)
   - Incluir dados de sangue no JSON
   - Marcar skills que usam sangue

4. **static/js/battle-skills-system.js** (adicionar ao final)
   - `updateBloodDisplay()`
   - `updateSpecialSkillCosts()`

5. **static/css/battle.css** (adicionar ao final)
   - Estilos de barra de sangue
   - Animações

6. **skill_effects.py** (adicionar ao final)
   - `apply_blood_effects()`
   - `reset_blood_on_run_end()`

---

## Comandos Úteis para Testing

```bash
# Migração de banco após adicionar campos
flask db migrate -m "Add blood system"
flask db upgrade

# Verificar se skill foi criada
python3
>>> from models import SpecialSkill
>>> SpecialSkill.query.get(138).name

# Teste de API
curl http://localhost:5000/gamification/player/specials

# Preencher cargas para teste
http://localhost:5000/gamification/fill_special_charges
```

