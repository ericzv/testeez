# Relatório de Balanceamento - Sistema de Jogo

**Data:** 09/11/2025
**Escopo:** Análise completa do balanceamento de sistemas de combate, progressão e recompensas

---

## Índice

1. [Skills de Ataque](#1-skills-de-ataque)
2. [Sistema de Progressão](#2-sistema-de-progressão)
3. [Lembranças (Buffs de Run)](#3-lembranças-buffs-de-run)
4. [Relíquias](#4-relíquias)
5. [Análise Crítica e Recomendações](#5-análise-crítica-e-recomendações)

---

## 1. Skills de Ataque

### 1.1 Visão Geral

O jogo possui um sistema de skills baseado em personagens. Atualmente implementado:

- **Personagem:** Vlad (Lorde de Sangue)
- **Skills de Ataque:** 4 tipos (Ataque, Poder, Especial, Ultimate)
- **Skills Especiais:** 4 habilidades com cooldown

### 1.2 Skills de Ataque do Vlad

| Skill ID | Nome | Tipo | Damage Modifier | Efeito | Valor do Efeito |
|----------|------|------|-----------------|--------|-----------------|
| 51 | Garras Sangrentas | Ataque | N/A | lifesteal | 20% |
| 50 | Energia Escura | Poder | N/A | Nenhum | - |
| 52 | Abraço da Escuridão | Especial | N/A | crit_chance | 20% |
| 53 | Beijo da Morte | Ultimate | N/A | Nenhum | - |

### 1.3 Skills Especiais

| Skill ID | Nome | Cooldown | Efeito Positivo | Efeito Negativo | Duração |
|----------|------|----------|-----------------|-----------------|---------|
| 138 | Autofagia | 600 min | +25% crit chance<br>+50% crit damage | -25% HP | 4 ataques |
| 139 | Aura Vampírica | 600 min | +15% lifesteal | Nenhum | 240 min |
| 140 | Domínio Mental | 1080 min | 70% mind control | -40% MP | 1 ataque |
| 141 | Abraço Sanguíneo | 2880 min | 100% blood embrace | Nenhum | 1 ataque |

### 1.4 Sistema de Dano (damage_system.py)

**Fórmula de Dano:**
```
DANO_FINAL = damage_points × (1 + total_bonus_percentage) × critical_multiplier
```

**Componentes de Bônus (Aditivos):**
1. **Força (Strength):** Base de dano calculado por `calculate_strength_damage()`
   - Força 0: 1.0x
   - Força 60: 2.0x
   - Força 100: 2.5x (cap)

2. **Skill Modifier:** Bônus da habilidade usada
3. **Player Base Bonus:** Multiplicador base do jogador
4. **Talent Bonus:** Bônus de talentos desbloqueados
5. **Buffs Bonus:** Buffs ativos temporários
6. **Memory Bonus:** Bônus de Lembranças (buffs de run)

**Sistema de Crítico:**
- **Chance Base:** 5% + (Sorte × 0.1%)
- **Fontes de Crítico:**
  - Sorte base
  - Bônus de itens
  - Bônus de talentos
  - Bônus da skill atual
  - Buffs ativos
  - Lembranças

- **Multiplicador Crítico:** 1.5 + bônus
  - Base: 1.5x
  - Sorte: +0.3% por ponto
  - Itens e talentos podem aumentar

### 1.5 ⚠️ Problemas Identificados

1. **Damage Modifiers ausentes:** Algumas skills não têm `damage_modifier` definido
2. **Custos de Mana:** Skills de ataque não têm custos de mana definidos (default: 10)
3. **Balanceamento de Cooldowns:** Skills especiais têm cooldowns muito longos:
   - Autofagia: 10 horas
   - Abraço Sanguíneo: 48 horas (!)
4. **Lifesteal Stackeável:** Múltiplas fontes de lifesteal podem se acumular sem limite
5. **Crítico potencialmente desbalanceado:** Com alta sorte + buffs, chance de crítico pode chegar a 75%

---

## 2. Sistema de Progressão

### 2.1 Níveis e Experiência

**Fórmula de XP (routes/cards.py e filters.py):**
- **Versão 1 (cards.py):** `100 × (level ^ 1.5)`
- **Versão 2 (filters.py):** `50 + (level - 1) × 5`

⚠️ **PROBLEMA CRÍTICO:** Duas fórmulas diferentes de XP no código!

**Tabela de XP Necessário:**

| Nível | XP (Fórmula 1) | XP (Fórmula 2) |
|-------|----------------|----------------|
| 1→2 | 100 | 50 |
| 2→3 | 283 | 55 |
| 5→6 | 1,118 | 70 |
| 10→11 | 3,162 | 95 |
| 20→21 | 8,944 | 145 |
| 50→51 | 35,355 | 295 |

**Recompensas por Nível:**
- **+2 Pontos de Atributo**
- **+1 Ponto de Habilidade**

### 2.2 Atributos

| Atributo | Função | Cap | Notas |
|----------|--------|-----|-------|
| **Strength (Força)** | Dano base | 100 | Escala exponencial até 2.5x |
| **Vitality (Vitalidade)** | HP máximo e regeneração | 100 | HP fixo em 80 (!) |
| **Resistance (Resistência)** | Bloqueio | 100 | Cap de 20% bloqueio |
| **Luck (Sorte)** | Crítico, esquiva, drops | 100 | Múltiplos benefícios |

**Fórmulas de Game Balance:**

```python
# Força → Dano
damage = 1.0 + 1.5 × (normalized_strength ^ exponent)
# Atinge 2.0x em strength=60, 2.5x em strength=100

# Resistência → Bloqueio
block% = 20% × (normalized_resistance ^ exponent) + block_bonus
# ~10% em resistance=30, ~15% em resistance=60, 20% em resistance=100

# Sorte → Crítico
crit_chance = 5% + (luck × 0.1%)
crit_damage = 5% + (luck × 0.3%)
dodge_chance = 5% + (luck × 0.1%)
```

**Regeneração:**
- **HP:** 1 HP a cada 500 revisões (Vitalidade 1) → 1 HP a cada 20 revisões (Vitalidade 100)
- **MP/Energia:** Mesma fórmula de Vitalidade

### 2.3 ⚠️ Problemas Identificados

1. **HP fixo em 80:** `calculate_max_hp(vitality)` retorna sempre 80, tornando Vitalidade inútil para HP máximo
2. **Duas fórmulas de XP:** Inconsistência crítica no código
3. **Sorte muito vantajosa:** Afeta crítico, esquiva E drops (melhor atributo?)
4. **Regeneração lenta demais:** Mesmo com Vitalidade 100, precisa de 20 revisões por 1 HP
5. **Caps de atributos muito altos:** Difícil atingir 100 em um atributo (seria necessário 50 níveis investindo tudo)

---

## 3. Lembranças (Buffs de Run)

### 3.1 Sistema de Lembranças

**Localização:** `routes/battle_modules/reward_system.py`

Lembranças são buffs temporários que duram apenas durante uma run (resetam ao morrer).

### 3.2 Tipos de Lembranças

| Tipo | Nome | Descrição | Valores por Raridade |
|------|------|-----------|----------------------|
| `maxhp` | Arx | HP Máximo | 1:+4, 2:+8, 3:+12, 4:+16 |
| `maxmp` | Empyreum | Energia Máxima | 3:+1, 4:+2 |
| `heal` | Recuperatio | Cura Instantânea | 1:+40, 2:+80, 3:+120, 4:+160 |
| `damage_global` | Ferocitas | Dano Global | 3:+2, 4:+4 |
| `damage_attack` | Dominatio | Dano do Ataque | 1:+2, 2:+3, 3:+4, 4:+6 |
| `damage_power` | Tyrannitas | Dano do Poder | 1:+2, 2:+4, 3:+5, 4:+7 |
| `damage_special` | Regalitas | Dano do Especial | 1:+2, 2:+4, 3:+5, 4:+7 |
| `damage_ultimate` | Suprematia | Dano da Suprema | 1:+4, 2:+6, 3:+8, 4:+12 |

**Raridades:** 1=Comum, 2=Raro, 3=Épico, 4=Lendário

### 3.3 Sistema de Recompensas

**Probabilidades de Drop:**
- Cristais: 25%
- Ouro: 25%
- Ampulhetas: 25%
- Lembranças: 25%

**Seleção de Lembranças:**
- Base: 3 opções aleatórias
- +1 opção com Relíquia ID 46 (Diário Antigo)

### 3.4 ⚠️ Problemas Identificados

1. **Escalamento irregular:** Valores não seguem padrão consistente entre raridades
2. **Algumas lembranças só existem em raridades altas:**
   - `maxmp` só existe em raridade 3 e 4
   - `damage_global` só existe em raridade 3 e 4
3. **Bônus de dano muito baixos:** +2 dano global (raridade 3) é muito pouco comparado a +4 dano específico
4. **Cura instantânea OP:** Heal de 160 HP (raridade 4) quando HP máximo base é 80
5. **Sem limite de stacking:** Jogador pode acumular infinitas lembranças do mesmo tipo

---

## 4. Relíquias

### 4.1 Visão Geral

**Total de Relíquias:** 50 definidas
**Localização:** `routes/relics/registry.py`

### 4.2 Distribuição por Categoria

| Categoria | Quantidade | IDs |
|-----------|-----------|-----|
| Cura e Sobrevivência | 12 | 1-12 |
| Dano e Crítico | 16 | 13-28 |
| Recursos e Economia | 12 | 29-40 |
| Stats e Passivos | 5 | 41-45 |
| Meta e Especiais | 5 | 46-50 |

### 4.3 Distribuição por Raridade

| Raridade | Quantidade | % | Exemplos |
|----------|-----------|---|----------|
| Common | 5 | 10% | Presa Vampírica, Olho de Midas |
| Rare | 30 | 60% | Sangue do Pelicano, Rosarium |
| Epic | 8 | 16% | Mão de Godofredo, Petrus |
| Legendary | 5 | 10% | Pedra Bálsamo, Espelho de Lázaro |

### 4.4 Relíquias por Poder

#### 4.4.1 Relíquias Tier S (Game-changing)

**ID 5 - Espelho de Lázaro (Legendary)**
- Evita morte, restaura 20% HP
- Custo: Todo o ouro + perde a relíquia
- ⚠️ Pode criar estratégias de "farming de morte"

**ID 24 - Última Graça (Legendary)**
- Dobra dano da Suprema
- Limitação: 1x por combate
- ⚠️ Combinado com outras relíquias pode one-shot bosses

**ID 48 - Relicário de Helena (Legendary)**
- Bosses dão +1 relíquia extra
- ⚠️ Acelera muito a aquisição de poder

**ID 2 - Pedra Bálsamo (Legendary)**
- Todas as curas curam +40%
- ⚠️ Synergy extrema com builds de cura

#### 4.4.2 Relíquias Tier A (Muito Fortes)

**ID 13 - Coleção de Espinhos (Epic)**
- +3% crítico por relíquia
- ⚠️ Com 10 relíquias = +30% crítico!

**ID 22 - Petrus (Epic)**
- Poder causa +2 dano por relíquia
- ⚠️ Com 10 relíquias = +20 dano

**ID 43 - Muralha de Constantino (Rare)**
- +1% bloqueio por relíquia
- ⚠️ Com 10 relíquias = +10% bloqueio

**ID 25 - Discipulato (Rare)**
- 10º ataque dobra dano
- Consistente e previsível

#### 4.4.3 Relíquias com Acúmulo Permanente

**ID 20 - Acumuladora (Rare)**
- +2 dano no Ataque
- +1 permanente a cada 2 usos
- ⚠️ Sem limite superior → pode ficar OP

**ID 21 - Paradoxo da Liberdade (Rare)**
- +3 dano no Poder
- +1 ao matar SEM usar Poder
- ⚠️ Incentiva gameplay estranho

**ID 26 - Báculo Carregado (Rare)**
- +4 dano no Poder
- +1 ao matar COM Poder
- ⚠️ Synergy com ID 21?

**ID 50 - Sangue Coagulado (Rare)**
- +4 dano no Ataque
- +2 por cada Ataque no combate (reseta)
- ⚠️ No final da batalha pode ter +50 dano

### 4.5 Synergies Problemáticas

#### Synergy 1: Crítico Infinito
- **Coleção de Espinhos** (ID 13): +3% crit/relíquia
- **Momentum Plagosus** (ID 17): Crítico dá +20% crit no próximo
- **Pedra Angular** (ID 16): Primeiro Poder/Especial sempre crítico
- **Autofagia** (Skill): +25% crit + 50% crit damage

**Resultado:** Chance de crítico pode passar de 100% facilmente

#### Synergy 2: Cura Infinita
- **Pedra Bálsamo** (ID 2): +40% cura
- **Óleos de Pantaleão** (ID 3): +25% cura
- **Gema Vital** (ID 45): +3 HP flat em toda cura
- **Presa Vampírica** (ID 4): +3 HP por dano
- **Cura de Longino** (ID 14): +10% vampirismo em crítico
- **Aura Vampírica** (Skill): +15% lifesteal global

**Resultado:** Com crítico alto + lifesteal stackeado, impossível morrer

#### Synergy 3: Dano Explosivo
- **Última Graça** (ID 24): Suprema x2
- **Petrus** (ID 22): +2 dano/relíquia no Poder
- **Discipulado** (ID 25): 10º ataque x2
- **Acumuladora** (ID 20): Dano acumulativo
- **Lembranças de dano:** +12 dano na Suprema (raridade 4)

**Resultado:** Suprema pode dar 500+ dano facilmente

### 4.6 Pesos de Raridade

```python
RARITY_WEIGHTS = {
    'first_relic': {
        'common': 50%,
        'rare': 35%,
        'epic': 10%,
        'legendary': 5%
    },
    'last_boss': {
        'common': 20%,
        'rare': 35%,
        'epic': 25%,
        'legendary': 15%
    }
}
```

⚠️ **PROBLEMA:** Código tem `'rare': 35%` duas vezes em 'first_relic'

### 4.7 ⚠️ Problemas Identificados

1. **Synergies desbalanceadas:** Combinações quebram o jogo
2. **Escalamento infinito:** IDs 20, 21, 26 não têm cap
3. **Raridades inconsistentes:** Algumas relíquias "Rare" são melhores que "Epic"
4. **Pesos duplicados:** Bug no código de raridade
5. **Falta de trade-offs:** Poucas relíquias têm desvantagens reais
6. **Power creep:** Com muitas relíquias, jogador fica invencível
7. **ID 37 (Sacrifício de Abraão):** Pode ser abusado se tiver muitas relíquias ruins
8. **Relíquias "per relic":** Escalam demais (IDs 13, 22, 43, 44)

---

## 5. Análise Crítica e Recomendações

### 5.1 Problemas Críticos

#### 5.1.1 Código
1. ✅ **URGENTE:** Duas fórmulas de XP diferentes
2. ✅ **URGENTE:** HP máximo fixo em 80 (Vitalidade inútil)
3. ✅ **BUG:** Raridade 'rare' duplicada em pesos
4. ✅ **INCONSISTÊNCIA:** Damage modifiers ausentes em skills

#### 5.1.2 Balanceamento
1. **Power Creep:** Sistema favorece acúmulo de poder sem limite
2. **Atributos desbalanceados:** Sorte >> outros atributos
3. **Synergies quebradas:** Combinações específicas de relíquias são muito fortes
4. **Cooldowns irreais:** Skills com 48 horas de cooldown
5. **Escalamento exponencial:** Dano pode chegar a valores absurdos

### 5.2 Recomendações de Balanceamento

#### 5.2.1 Curto Prazo (Fixes Urgentes)

1. **Unificar fórmula de XP:**
   ```python
   # Proposta: Progressão suave mas não trivial
   def get_exp_for_next_level(level):
       return int(80 + (level - 1) * 12)
   # Level 1→2: 80 XP
   # Level 10→11: 188 XP
   # Level 50→51: 668 XP
   ```

2. **Corrigir HP máximo:**
   ```python
   def calculate_max_hp(vitality):
       return 80 + (vitality * 2)  # 80 base + 2/ponto
   # Vit 0: 80 HP
   # Vit 50: 180 HP
   # Vit 100: 280 HP
   ```

3. **Adicionar damage modifiers às skills:**
   ```python
   # Proposta:
   'Garras Sangrentas': 1.0  # Ataque básico
   'Energia Escura': 1.3      # Poder
   'Abraço da Escuridão': 1.5 # Especial
   'Beijo da Morte': 2.5      # Ultimate
   ```

4. **Reduzir cooldowns de skills especiais:**
   ```python
   Autofagia: 600 → 120 min (2 horas)
   Aura Vampírica: 600 → 180 min (3 horas)
   Domínio Mental: 1080 → 360 min (6 horas)
   Abraço Sanguíneo: 2880 → 720 min (12 horas)
   ```

5. **Corrigir bug de raridade:**
   ```python
   'first_relic': {
       'common': 50,
       'uncommon': 30,  # Adicionar raridade intermediária
       'rare': 15,
       'epic': 4,
       'legendary': 1
   }
   ```

#### 5.2.2 Médio Prazo (Rebalanceamento)

1. **Adicionar caps às relíquias de acúmulo:**
   - ID 20 (Acumuladora): Cap de +20 dano
   - ID 21 (Paradoxo): Cap de +15 stacks
   - ID 26 (Báculo): Cap de +15 stacks
   - ID 50 (Sangue Coagulado): Cap de +30 dano por batalha

2. **Nerfar relíquias "per relic":**
   - ID 13: +3% → +2% crit/relíquia
   - ID 22: +2 → +1.5 dano/relíquia
   - ID 43: +1% → +0.5% bloqueio/relíquia

3. **Rebalancear lembranças:**
   ```python
   'damage_global': {3: 2, 4: 4} → {1: 1, 2: 2, 3: 3, 4: 5}
   'damage_attack': {1: 2, 2: 3, 3: 4, 4: 6} → {1: 1, 2: 2, 3: 3, 4: 5}
   'heal': {1: 40, 2: 80, 3: 120, 4: 160} → {1: 20, 2: 35, 3: 50, 4: 70}
   ```

4. **Adicionar custo de mana às skills:**
   ```python
   Ataque Básico: 5 mana
   Poder: 10 mana
   Especial: 15 mana
   Ultimate: 25 mana
   ```

5. **Limitar stacking de lifesteal:**
   ```python
   # Cap em 50% lifesteal total
   total_lifesteal = min(0.5, sum_all_lifesteal_sources)
   ```

#### 5.2.3 Longo Prazo (Redesign)

1. **Sistema de Trade-offs:**
   - Relíquias fortes devem ter desvantagens
   - Exemplo: ID 24 (Última Graça) poderia reduzir HP máximo em 20%

2. **Soft Caps em Atributos:**
   ```python
   # Eficiência reduzida acima de 60
   if attribute > 60:
       effective = 60 + (attribute - 60) * 0.5
   ```

3. **Sistema de Diminishing Returns:**
   - Cada relíquia do mesmo tipo dá menos benefício
   - Primeira cura +40%, segunda +25%, terceira +15%

4. **Balanceamento de Sorte:**
   - Reduzir benefícios múltiplos
   - Ou distribuir benefícios entre outros atributos

5. **Sistema de Energia mais complexo:**
   - Diferentes custos de energia por skill
   - Regeneração de energia baseada em mecânicas

### 5.3 Matriz de Prioridades

| Mudança | Prioridade | Impacto | Dificuldade |
|---------|-----------|---------|-------------|
| Unificar fórmula XP | CRÍTICA | Alto | Baixa |
| Corrigir HP máximo | CRÍTICA | Alto | Baixa |
| Corrigir bug raridade | CRÍTICA | Médio | Baixa |
| Adicionar damage modifiers | ALTA | Alto | Baixa |
| Reduzir cooldowns | ALTA | Alto | Baixa |
| Caps em relíquias | ALTA | Alto | Média |
| Rebalancear lembranças | MÉDIA | Médio | Média |
| Nerfar "per relic" | MÉDIA | Médio | Baixa |
| Sistema de trade-offs | BAIXA | Alto | Alta |
| Soft caps atributos | BAIXA | Médio | Média |

### 5.4 Métricas Sugeridas para Acompanhamento

1. **Taxa de Vitória:** % de runs completadas vs mortes
2. **Tempo Médio de Run:** Quantas horas para completar
3. **Relíquias mais usadas:** Top 10 relíquias
4. **Synergies dominantes:** Combinações que aparecem em 80%+ das vitórias
5. **Distribuição de Atributos:** Qual atributo os jogadores mais investem
6. **Skills mais usadas:** Frequência de uso de cada skill
7. **Dano médio por nível:** Curva de progressão de poder

---

## Conclusão

O jogo apresenta uma base sólida com sistemas interessantes e variados, mas sofre de **power creep severo** e **falta de trade-offs**. Os principais problemas são:

1. **Escalamento infinito** sem caps
2. **Synergies multiplicativas** não controladas
3. **Bugs críticos** de implementação (XP, HP)
4. **Atributos desbalanceados** (Sorte muito forte)
5. **Cooldowns irreais** (48 horas)

As recomendações focam em:
1. ✅ **Corrigir bugs críticos** primeiro
2. ⚖️ **Adicionar caps e limites** para controlar poder
3. 🔄 **Implementar trade-offs** em escolhas fortes
4. 📊 **Monitorar métricas** para ajustes iterativos

Com estas mudanças, o jogo terá **progressão mais suave**, **escolhas mais significativas** e **longevidade maior** sem trivializar o desafio.

---

**Próximos Passos:**
1. Implementar fixes críticos (XP, HP, raridade)
2. Testar balanceamento com caps
3. Coletar dados de playtest
4. Iterar baseado em feedback

