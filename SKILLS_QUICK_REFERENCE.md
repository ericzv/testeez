# Quick Reference - Sistema de Skills

## Caminho dos Arquivos Principais

```
FRONT-END:
  /static/js/battle-skills-system.js     - Exibição e chamada de skills
  /static/js/battle-turns.js             - Sistema de turnos na batalha

BACK-END:
  /characters.py                         - Definições e lógica de skills
  /models.py                             - Modelos de banco de dados
  /routes/battle.py                      - Rotas HTTP para skills
  /routes/battle_modules/battle_turns.py - Sistema de ações do inimigo
  /skill_effects.py                      - Efeitos especiais
  
BANCO DE DADOS:
  SpecialSkill                           - Definição de skills especiais
  PlayerSkill                            - Associação jogador-skill
  ActiveBuff                             - Buffs ativos do jogador
```

---

## Skills Especiais do Vlad (138-141)

| ID | Nome | Cooldown | Duração | Efeito Positivo | Efeito Negativo |
|----|------|----------|---------|-----------------|-----------------|
| 138 | Autofagia | 10h | 4 ataques | +25% crit, +50% crit_dmg | -25% max HP |
| 139 | Aura Vampírica | 10h | 4 horas | +15% lifesteal | - |
| 140 | Domínio Mental | 18h | 1 ataque | 70% controle | -40% max MP |
| 141 | Abraço Sanguíneo | 48h | 1 ataque | blood_embrace | - |

---

## Ataques do Vlad (50-53)

| ID | Nome | Tipo | Efeito |
|----|------|------|--------|
| 50 | Energia Escura | Projétil | - |
| 51 | Garras Sangrentas | Melee | +20% lifesteal |
| 52 | Abraço da Escuridão | Beam | +20% crit_chance |
| 53 | Beijo da Morte | Ranged | - |

---

## Fluxo de Chamada

```
POST /gamification/use_special?skill_id=138
    │
    └─> use_special_skill(player_id, skill_id)
        │
        ├─> validate: player, skill, charges
        ├─> apply: positive effects (buffs)
        ├─> apply: negative effects (hp/mp cost)
        ├─> consume: 1 charge
        └─> return: {success, message, animation_data}
```

---

## Sistema de Cargas

**Modelo**: `PlayerSkill.current_charges` (0 a max_charges)

**Recalcular Cargas**:
```
time_elapsed = now - last_charge_time
new_charges = min(old_charges + (elapsed_minutes / cooldown_minutes), max_charges)
```

**Atualização**: Automática via `update_skill_charges(player_id)`

---

## Aplicação de Buffs

**Quando ataque é usado**:
1. Obter todos buffs ativos
2. Para cada buff não-expirado:
   - Se `crit_chance`: +value
   - Se `lifesteal`: +value
   - Se `crit_damage`: +value
3. Se `duration_type="attacks"`: decrementa `attacks_remaining`

**Campos Importantes**:
- `effect_type`: tipo do efeito
- `effect_value`: valor (ex: 0.25 = 25%)
- `attacks_remaining`: ataques até expirar

---

## Sistema de Turnos (Inimigo)

**Padrão de Ações**:
```json
"action_pattern": ["attack", "buff_debuff", "attack_skill"]
```

**Probabilidade de Ações por Turno**:
```json
"actions_per_turn_probability": {"1": 0.90, "2": 0.10}
```

**Intenções Retornadas**:
```python
[
  {'type': 'attack', 'name': '...', 'icon': '...', 'damage': 33},
  {'type': 'debuff', 'name': '...', 'icon': '...', 'skill_id': 101}
]
```

---

## Banco de Dados - Campos Principais

### Player
- `hp`, `max_hp`: Vida
- `energy`, `max_energy`: Energia
- `character_id`: "vlad"
- `barrier`: Shield/Barreira
- `accumulated_attack_bonus`: Bônus acumulado de Ataque
- `accumulated_power_bonus`: Bônus acumulado de Poder

### SpecialSkill
- `cooldown_minutes`: Cooldown entre cargas
- `positive_effect_type`: Tipo de buff (multi_boost, lifesteal, etc)
- `positive_effect_value`: Valor do buff (JSON se multi)
- `duration_type`: "time" ou "attacks"
- `duration_value`: Minutos ou número de ataques

### ActiveBuff
- `effect_type`: Tipo do efeito
- `effect_value`: Valor numérico
- `attacks_remaining`: Ataques até expirar
- `start_time`: Quando foi aplicado

---

## Acúmulo de Sangue (IMPLEMENTAR)

**Locais para Adicionar**:

1. **models.py** - Classe `Player`
   ```python
   accumulated_blood = db.Column(db.Integer, default=0)
   blood_threshold = db.Column(db.Integer, default=100)
   ```

2. **characters.py** - Função `use_special_skill()`
   ```python
   if skill_id == 138:  # Autofagia
       player.accumulated_blood += 25  # Exemplo
       if player.accumulated_blood >= player.blood_threshold:
           # Trigger efeito especial
   ```

3. **Exibição no Front-end**
   ```javascript
   // Mostrar barra de acúmulo de sangue
   // Animar quando threshold é atingido
   ```

---

## Rotas HTTP Úteis

```
GET/POST /gamification/use_special?skill_id=138
  Ativa uma skill especial

GET /gamification/player/specials
  Retorna lista de skills especiais do jogador (JSON)

GET /gamification/player/attacks
  Retorna lista de ataques do jogador (JSON)

POST /gamification/fill_special_charges
  Preenche todas as cargas (DEBUG)
```

---

## Debug & Teste

**Para testar skills**:
1. Ir para `/gamification/fill_special_charges`
2. Voltar para battleground
3. Clicar em skill especial

**Verificar no console**:
- Logs de validação
- Confirmação de aplicação de buffs
- Mensagem de sucesso

