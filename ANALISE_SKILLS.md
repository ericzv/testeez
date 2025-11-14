# Análise Completa do Sistema de Skills Especiais e Battaglia

## 1. SKILLS ESPECIAIS DEFINIDAS

Arquivo: `/home/user/testeez/characters.py` (linhas 271-344)

### Skills do Vlad (IDs 138-141):

#### 138 - **Autofagia**
- **Descrição**: Sacrifica sangue para aumentar poder de ataque
- **Max Cargas**: 1
- **Cooldown**: 600 minutos (10 horas)
- **Efeito Positivo**: `multi_boost` (JSON)
  - `crit_chance`: +0.25 (25%)
  - `crit_damage`: +0.5 (50%)
- **Efeito Negativo**: `hp_cost` de 0.25 (25% do max HP)
- **Duração**: 4 ataques

#### 139 - **Aura Vampírica**
- **Descrição**: Emana aura que drena vida com cada ataque
- **Max Cargas**: 1
- **Cooldown**: 600 minutos
- **Efeito Positivo**: `lifesteal` de 0.15 (15%)
- **Duração**: 240 minutos (4 horas de tempo real)

#### 140 - **Domínio Mental**
- **Descrição**: Controla mente do inimigo temporariamente
- **Max Cargas**: 1
- **Cooldown**: 1080 minutos (18 horas)
- **Efeito Positivo**: `mind_control` de 0.7 (70%)
- **Efeito Negativo**: `mp_cost` de 0.4 (40% do max MP)
- **Duração**: 1 ataque

#### 141 - **Abraço Sanguíneo**
- **Descrição**: Poder supremo que drena toda essência vital
- **Max Cargas**: 1
- **Cooldown**: 2880 minutos (48 horas / 2 dias)
- **Efeito Positivo**: `blood_embrace` de 1.0
- **Duração**: 1 ataque

---

## 2. MODELOS DE BANCO DE DADOS

Arquivo: `/home/user/testeez/models.py`

### Classes Principais:

#### `SpecialSkill` (linhas 51-75)
```python
- id: Identificador único
- name: Nome da skill
- description: Descrição
- max_charges: Máximo de cargas (padrão: 1)
- cooldown_minutes: Cooldown em minutos entre cargas
- positive_effect_type: Tipo de efeito positivo (multi_boost, lifesteal, etc)
- positive_effect_value: Valor do efeito (pode ser JSON)
- negative_effect_type: Tipo de efeito negativo (hp_cost, mp_cost)
- negative_effect_value: Valor do efeito negativo
- duration_type: "time" (minutos) ou "attacks" (quantidade de ataques)
- duration_value: Quantidade de minutos ou ataques
```

#### `PlayerSkill` (linhas 77-88)
```python
- player_id: Referência ao jogador
- skill_type: "attack" ou "special"
- skill_id: ID da skill
- current_charges: Cargas atuais disponíveis
- last_charge_time: Timestamp da última carga
```

#### `ActiveBuff` (linhas 107-131)
```python
- player_id: Jogador afetado
- source_skill_id: Skill que criou o buff
- effect_type: Tipo do efeito (crit_chance, lifesteal, etc)
- effect_value: Valor do efeito
- duration_type: "time" ou "attacks"
- duration_value: Minutos ou quantidade
- start_time: Quando foi aplicado
- attacks_remaining: Ataques restantes (se duration_type="attacks")
```

#### `Player` - Campos Relevantes (models.py)
```python
- hp: HP atual (padrão: 80)
- max_hp: HP máximo
- energy: Energia atual (padrão: 10)
- max_energy: Energia máxima
- character_id: "vlad" para personagem Vlad
```

---

## 3. SISTEMA DE CHAMADA DE SKILLS (Routes)

Arquivo: `/home/user/testeez/routes/battle.py`

### Rota Principal: `/gamification/use_special` (linhas 1422-1505)
```
Método: GET/POST
Parâmetros: skill_id (inteiro)
Retorno: JSON ou redirecionamento com mensagem flash
```

**Fluxo**:
1. Obtém jogador
2. Extrai skill_id da requisição
3. Chama `use_special_skill(player.id, skill_id)` do characters.py
4. Se AJAX: retorna JSON
5. Se não: flash + redirect

### Rota de Leitura: `/gamification/player/specials` (linhas 1654-1675)
```
Retorna: JSON com lista de skills especiais do jogador
```

---

## 4. IMPLEMENTAÇÃO DO SISTEMA (characters.py)

### Função `use_special_skill()` (linhas 1129-1283)

**Processo Completo**:

1. **Validação**
   - Verifica se jogador existe
   - Verifica se tem a skill desbloqueada
   - Verifica se tem cargas disponíveis

2. **Efeitos Positivos** (linhas 1172-1198)
   - Para `multi_boost`: cria buff para cada efeito (ex: crit_chance + crit_damage)
   - Para `lifesteal`, `crit_chance`, etc: cria buff simples
   - Usa função `extend_or_create_buff()`

3. **Efeitos Negativos** (linhas 1200-1214)
   - `hp_cost`: reduz HP do jogador (mínimo 1)
   - `mp_cost`: reduz MP do jogador (mínimo 0)

4. **Consumo de Carga** (linhas 1216-1220)
   - Decrementa `current_charges`
   - Se chegar a 0, registra `last_charge_time = now`

5. **Log de Combate** (linhas 1222-1231)
   - Cria entrada em `CombatLog`

6. **Resposta** (linhas 1265-1276)
   - Retorna: `(success, message, animation_data)`

### Função `extend_or_create_buff()` (linhas 1067-1127)
- Estende buff existente OU cria novo
- Para `duration_type="time"`: soma minutos
- Para `duration_type="attacks"`: soma ataques restantes
- Retorna objeto ActiveBuff

### Função `update_skill_charges()` (linhas 1285-1328)
- Recalcula cargas baseado em `cooldown_minutes`
- `elapsed_minutes / cooldown_minutes = charges_to_add`
- Atualiza `current_charges` (máximo = max_charges)

---

## 5. APLICAÇÃO DOS BUFFS

Arquivo: `/home/user/testeez/characters.py` (função `use_attack_skill`, linhas 983-1065)

**Sistema Atual**:
```
Quando usa ataque:
1. Obtém buffs ativos do jogador
2. Para cada buff não-expirado:
   - crit_chance: incrementa bonus
   - crit_damage: incrementa bonus
   - damage: incrementa bonus
   - lifesteal: incrementa bonus
3. Se duration="attacks": decrementa attacks_remaining
4. Aplica todos os bônus no cálculo do dano
```

**Campos de Buff Reconhecidos**:
- `effect_type`: crit_chance, crit_damage, damage, lifesteal
- `effect_value`: valor float (0.25 = 25%)
- `duration_remaining`: número de ataques

---

## 6. SISTEMA DE CARGAS E COOLDOWN

### Modelo PlayerSkill:
```python
current_charges: int (0 a max_charges)
last_charge_time: datetime (última vez que foi gerada carga)
get_time_until_next_charge(): calcula tempo restante
```

### Cálculo do Cooldown:
```
next_charge_time = last_charge_time + timedelta(minutes=cooldown_minutes)
time_remaining = next_charge_time - now
```

### Atualização Automática:
- Chamada em `update_skill_charges(player_id)`
- Recalcula a cada 1 hora de cooldown completada

---

## 7. ATAQUES DO VLAD

Arquivo: `/home/user/testeez/characters.py` (linhas 197-269)

### Skill IDs 50-53:

#### 50 - **Energia Escura** (Poder)
- Dano: 1.0x
- Tipo: Projétil mágico
- Efeito: Nenhum
- Animação: `mordida_mortal_front/back`

#### 51 - **Garras Sangrentas** (Ataque Básico)
- Dano: 1.0x
- Tipo: Melee
- Efeito: `lifesteal` 0.2 (20%)
- Animação: `garras_sangrentas_front/back`

#### 52 - **Abraço da Escuridão** (Ataque Especial)
- Dano: 1.0x
- Tipo: Beam escuro
- Efeito: `crit_chance` 0.20 (20%)
- Animação: `abraco_escuridao_front/back`

#### 53 - **Beijo da Morte** (Suprema/Ultimate)
- Dano: 1.0x
- Tipo: Ataque à distância
- Efeito: Nenhum
- Animação: `beijo_morte_front/back`

---

## 8. SISTEMA DE TURNOS NA BATALHA

Arquivo: `/home/user/testeez/routes/battle_modules/battle_turns.py`

### Função `get_next_actions()` (linhas 22-195)

**Processo**:

1. **Carregar Padrão**: `enemy.action_pattern` (JSON)
   ```json
   ["attack", "buff_debuff", "attack_skill", "attack"]
   ```

2. **Determinar Quantas Ações**: Baseado em `actions_per_turn_probability`
   ```json
   {"1": 0.90, "2": 0.10, "3": 0.00}
   ```

3. **Resolver Cada Ação**:
   - `"attack"`: ataque básico (damage do inimigo)
   - `"buff_debuff"`: alterna entre buff/debuff
   - `"attack_skill"`: skill de ataque especial

4. **Retornar Intenções Ricas**:
   ```python
   [
       {'type': 'attack', 'name': 'Ataque Básico', 'icon': '...', 'damage': 33},
       {'type': 'debuff', 'name': 'Nictalopia', 'icon': '...', 'skill_id': 101}
   ]
   ```

### Front-end (battle-turns.js):
- `endPlayerTurn()`: termina turno do jogador
- `updateEnemyIntentions()`: atualiza visualização das próximas ações
- Exibe intenções para o jogador saber o que o inimigo vai fazer

---

## 9. BANCO DE DADOS DO JOGADOR

Arquivo: `/home/user/testeez/models.py` (classe `Player`)

### Campos para Acúmulo de Sangue (Não Implementado):
```
SUGESTÃO DE ADIÇÃO:
accumulated_blood: db.Column(db.Integer, default=0)
blood_threshold: db.Column(db.Integer, default=100)
blood_stacks: db.Column(db.Integer, default=0)
```

### Campos Existentes Relacionados:
```python
hp: HP atual
max_hp: HP máximo
barrier: Barreira (shield)
accumulated_attack_bonus: Bônus acumulado de Ataque
accumulated_power_bonus: Bônus acumulado de Poder
```

---

## 10. FLUXO COMPLETO DE SKILL ESPECIAL

```
┌─────────────────────────────────────────┐
│  Jogador clica em Skill Especial        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  /gamification/use_special (POST/GET)   │
│  Parâmetro: skill_id                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  use_special_skill(player_id, skill_id) │
│  characters.py                          │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────────┐
       ▼                    ▼
   ┌────────┐          ┌──────────────┐
   │Validar │          │Aplicar Efeitos│
   │Cargas  │          │Positivos      │
   └────────┘          └──────────────┘
       │                    │
       └────────┬───────────┘
                │
                ▼
        ┌──────────────┐
        │Aplicar Efeitos│
        │Negativos      │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │Consumir Carga│
        │Registrar Log │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │Retornar JSON │
        │Success + MSG │
        └──────────────┘
```

---

## RESUMO DE ARQUIVOS PRINCIPAIS

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `/home/user/testeez/characters.py` | 51-344 | Definição de skills e modelos |
| `/home/user/testeez/characters.py` | 1129-1283 | Executar skill especial |
| `/home/user/testeez/characters.py` | 1067-1127 | Criar/estender buffs |
| `/home/user/testeez/models.py` | 51-131 | Modelos SQLAlchemy |
| `/home/user/testeez/routes/battle.py` | 1422-1505 | Rota de ativação |
| `/home/user/testeez/routes/battle.py` | 1654-1675 | API de leitura |
| `/home/user/testeez/routes/battle_modules/battle_turns.py` | 22-195 | Sistema de turnos |
| `/home/user/testeez/skill_effects.py` | 1-124 | Efeitos especiais |

---

## PRÓXIMOS PASSOS PARA IMPLEMENTAR ACÚMULO DE SANGUE

1. **Adicionar campos ao Player**:
   - `blood_accumulated`: quantidade de sangue
   - `blood_max`: limite máximo

2. **Modificar `use_special_skill()`**:
   - Adicionar evento de "gasto de sangue" em Autofagia
   - Registrar sangue gasto em `accumulated_blood`

3. **Criar sistema de threshold**:
   - Quando `accumulated_blood >= blood_threshold`
   - Desbloquear/amplificar efeitos

4. **Integrar com UI**:
   - Mostrar barra de acúmulo de sangue
   - Animar quando threshold é atingido

