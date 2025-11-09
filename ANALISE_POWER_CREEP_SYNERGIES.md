# Análise Profunda: Power Creep e Synergies

**Data:** 09/11/2025
**Foco:** Problemas de balanceamento no sistema atual de relíquias e lembranças

---

## 1. Power Creep Descontrolado

### 1.1 O Que É Power Creep?

Power creep é quando o **poder do jogador escala mais rápido** que a dificuldade do jogo, tornando o desafio trivial após certo ponto.

### 1.2 Sistema de Dano Atual (battle_cache.py)

**Dano Base Fixo:**
```python
Ataque Básico:  6 de dano base
Poder:          12 de dano base
Especial:       18 de dano base
Suprema:        30 de dano base
```

**Modificadores Aplicados (ADITIVOS - flat):**
1. Talentos de dano (% multiplicativo)
2. Lembranças globais (+dano flat)
3. Lembranças específicas (+dano flat por tipo)
4. Bônus acumulado de relíquias (flat)
5. Petrus no Poder (+2 dano por relíquia)

### 1.3 Exemplo Real de Power Creep

**Cenário: Player com 10 relíquias após 20 inimigos derrotados**

#### Setup:
- **Relíquia ID 20 (Acumuladora):** +2 inicial + 10 usos = +7 dano no Ataque
- **Relíquia ID 26 (Báculo Carregado):** +4 inicial + 5 kills com Poder = +9 dano no Poder
- **Relíquia ID 22 (Petrus):** +2 dano/relíquia × 10 relíquias = +20 dano no Poder
- **Lembrança damage_power (raridade 4):** +7 dano
- **Lembrança damage_global (raridade 4):** +4 dano

#### Cálculo do Poder:
```
Dano Base Poder: 12
+ Báculo Carregado: +9 (acumulado)
+ Petrus: +20 (10 relíquias)
+ Lembrança específica: +7
+ Lembrança global: +4
= TOTAL: 52 de dano

Com Relíquia ID 24 (Última Graça): 52 × 2 = 104 dano
Com Relíquia ID 25 (Discipulato, 10º ataque): 52 × 2 = 104 dano
COM AMBAS: 52 × 2 × 2 = 208 dano (!!!)
```

#### Crítico:
```
Relíquia ID 13 (Coleção de Espinhos): +3% crit/relíquia × 10 = +30% crítico
Skill Abraço da Escuridão: +20% crítico
Relíquia ID 17 (Momentum): +20% se último foi crítico
= 70% chance de crítico

Crítico multiplica por 1.5x → 208 × 1.5 = 312 dano
```

#### Problema:
**Boss inicial tem ~300 HP**
**Boss final (milestone 20) tem ~1000 HP**

Com **312 de dano**, você mata o boss final em **3-4 turnos**, tornando o jogo trivial.

### 1.4 Fontes de Power Creep

#### A) Acúmulo Infinito (SEM CAPS)

| Relíquia | Efeito | Cap Atual | Problema |
|----------|--------|-----------|----------|
| ID 20 | +1 dano/2 usos (Ataque) | ∞ | Após 40 usos = +20 dano permanente |
| ID 21 | +1 dano/kill sem Poder | ∞ | Após 30 kills = +30 dano permanente |
| ID 26 | +1 dano/kill com Poder | ∞ | Após 30 kills = +30 dano permanente |
| ID 50 | +2 dano/uso por batalha | ∞ (reseta) | Em batalha longa = +50 dano temporário |

**Impacto:** Em runs longas (50+ inimigos), estes bônus sozinhos adicionam **+100 dano** ou mais.

#### B) Multiplicadores "per relic"

| Relíquia | Efeito Base | Com 5 Relíquias | Com 10 Relíquias | Com 15 Relíquias |
|----------|-------------|-----------------|------------------|------------------|
| ID 13 (Crit) | +3%/relíquia | +15% | +30% | +45% |
| ID 22 (Petrus) | +2 dano/relíquia | +10 | +20 | +30 |
| ID 43 (Bloqueio) | +1%/relíquia | +5% | +10% | +15% |
| ID 44 (Cura) | +1 HP/relíquia | +5 HP | +10 HP | +15 HP |

**Impacto:** Quanto mais relíquias você tem, mais forte cada nova relíquia "per relic" fica.

#### C) Multiplicadores Stackeáveis

**Dano pode ser multiplicado várias vezes:**
- Última Graça (ID 24): ×2
- Discipulado (ID 25): ×2 a cada 10 ataques
- Crítico: ×1.5
- Primeira Mão de Godofredo (ID 15): ×2 (primeiro ataque)

**Exemplo extremo:**
```
Dano base: 30 (Suprema)
× 2 (Última Graça)
× 2 (Discipulato)
× 1.5 (Crítico)
= 180 de dano

Com acúmulos de +50 dano de relíquias:
Base: 80
× 2 × 2 × 1.5 = 480 dano (!)
```

### 1.5 Curva de Poder vs Dificuldade

**Progressão do Jogador (estimativa):**
```
Inimigo 1:  Dano médio 10-15
Inimigo 10: Dano médio 30-40
Inimigo 20: Dano médio 60-80
Inimigo 30: Dano médio 100-150
Inimigo 50: Dano médio 200-300+
```

**Progressão do Inimigo (atual?):**
```
Inimigo 1:  HP 50-100
Inimigo 10: HP 150-250
Inimigo 20: HP 300-500
Inimigo 30: HP 500-800
Inimigo 50: HP 800-1500
```

**Resultado:** A partir do inimigo 20, o jogador já está MUITO mais forte que necessário.

---

## 2. Synergies Quebradas

### 2.1 O Que São Synergies Quebradas?

Combinações de relíquias/lembranças que criam loops ou multiplicadores exponenciais, tornando o jogador **invencível** ou capaz de **one-shot** bosses.

### 2.2 Synergy #1: "Imortalidade Vampírica"

**Componentes:**
1. **Pedra Bálsamo (ID 2):** Todas as curas curam +40%
2. **Óleos de Pantaleão (ID 3):** Todas as curas curam +25%
3. **Gema Vital (ID 45):** Toda cura +3 HP flat
4. **Presa Vampírica (ID 4):** Cura 3 HP por dano causado
5. **Cura de Longino (ID 14):** +10% lifesteal em críticos
6. **Coleção de Espinhos (ID 13):** +30% crítico (10 relíquias)
7. **Garras Sangrentas (Skill):** +20% lifesteal base

**Cálculo:**
```
Dano causado: 50
Lifesteal base (Garras): 20% = 10 HP
+ Cura de Longino (crítico): +10% = +5 HP
+ Presa Vampírica: +3 HP
= 18 HP total ANTES dos multiplicadores

Multiplicadores de cura (ADITIVOS conforme código):
Pedra Bálsamo: +40%
Óleos de Pantaleão: +25%
Total: +65% → ×1.65

18 HP × 1.65 = 29.7 HP
+ Gema Vital: +3 HP flat
= ~33 HP por ataque de 50 de dano
```

**Com 70% de chance de crítico, você cura ~33 HP a cada ataque.**

**Problema:** Se você tem 80 HP máximo e cura 33 HP por turno, você é **praticamente imortal** contra inimigos que causam <50 dano/turno.

### 2.3 Synergy #2: "Crítico Infinito"

**Componentes:**
1. **Coleção de Espinhos (ID 13):** +3% crit/relíquia
2. **Momentum Plagosus (ID 17):** Crítico dá +20% crit no próximo
3. **Pedra Angular (ID 16):** Primeiro Poder/Especial sempre crítico
4. **Abraço da Escuridão (Skill):** +20% crítico

**Setup com 10 relíquias:**
```
Base: 0%
+ Coleção de Espinhos: +30%
+ Abraço da Escuridão: +20%
= 50% chance de crítico

1º ataque (Especial): 100% crítico (Pedra Angular)
   → Ativa Momentum: +20% crit
2º ataque: 70% chance de crítico
   Se crítico → +20% crit
3º ataque: 90% chance de crítico
   Se crítico → +20% crit (mas cap em 100%)
4º ataque em diante: Sempre crítico
```

**Problema:** Após 3-4 ataques, você está com **crítico permanente**.

**Impacto no Dano:**
```
Dano sem crítico: 50
Dano com crítico: 50 × 1.5 = 75
Diferença: +50% dano permanente
```

### 2.4 Synergy #3: "Nuke Boss"

**Objetivo:** Matar boss em 1 turno

**Componentes:**
1. **Última Graça (ID 24):** Suprema ×2 dano
2. **Discipulado (ID 25):** 10º ataque ×2 dano
3. **Primum Nocere (ID 18):** Primeiro ataque +20% dano
4. **Mão de Godofredo (ID 15):** Primeiro ataque aplicado 2x
5. **Lembranças de Suprema:** +12 dano (raridade 4)
6. **Petrus (ID 22):** +20 dano (10 relíquias)

**Setup:**
```
Dano base Suprema: 30
+ Lembranças: +12
+ Petrus: +20
= 62 de dano base

1º ataque (timing no 10º total):
× 2 (Última Graça)
× 2 (Discipulado)
× 1.2 (Primum Nocere)
= 62 × 4.8 = 297 dano

Mão de Godofredo: Aplica DUAS VEZES
= 297 × 2 = 594 dano (!!!!)

Com crítico (×1.5):
= 594 × 1.5 = 891 dano
```

**Boss final tem ~1000 HP.**

Com setup acima, você dá **891 de dano** em um único ataque, **quase matando o boss**.

### 2.5 Synergy #4: "Barreira Infinita"

**Componentes:**
1. **Energia Escura (ID 50):** Dá 10% do dano + 3 de Barreira
2. **Lembranças de dano:** Aumentam dano → aumentam barreira
3. **Petrus:** +20 dano
4. **Alta frequência de uso** (custo: 4 energia, regenera 2/turno)

**Cálculo:**
```
Dano do Poder: 12 + 20 (Petrus) + 7 (Lembrança) = 39
Barreira: 39 × 10% + 3 = 6.9 ≈ 7 Barreira por uso

Se usar 2x por turno:
Barreira ganha: 7 × 2 = 14/turno
```

**Se inimigo causa 15 dano/turno, você está:**
- Ganhando: 14 barreira
- Perdendo: 15 HP
- **Líquido: -1 HP/turno** (quase imortal)

**Com lifesteal também ativo:** Você vira **IMORTAL** de verdade.

### 2.6 Synergy #5: "Energia Infinita"

**Componentes:**
1. **Dízimo (ID 32):** +5 energia a cada 10 ataques
2. **Corrente de Pedro (ID 30):** +4 energia ao usar 4 ataques diferentes
3. **Trinitas (ID 31):** +5 energia ao usar Poder 3x seguidas
4. **Escritos de Agostinho (ID 29):** +2 energia no 1º turno
5. **Exercícios Espirituais (ID 42):** +1 energia máxima permanente

**Cálculo (10 turnos):**
```
Energia base: 10
+ Exercícios Espirituais: +1 = 11 máximo

Regeneração: +2 energia/turno

Turno 1:
  + Escritos de Agostinho: +2 energia bônus
  Energia: 13

Turno 5:
  Se usou 4 ataques diferentes:
  + Corrente de Pedro: +4 energia
  Energia: 17

Turno 10:
  + Dízimo: +5 energia (10º ataque)
  Energia: 22

Gasto médio: 5 energia/turno (1 Ataque + 1 Poder)
Ganho médio: 2 + 0.5 (Dízimo) + 0.4 (Corrente) = ~3 energia/turno
```

**Problema:** Com todas essas fontes, você **nunca** fica sem energia. Pode spammar Suprema quase todo turno.

### 2.7 Tabela Resumo de Synergies Quebradas

| Synergy | Relíquias Necessárias | Resultado | Gravidade |
|---------|----------------------|-----------|-----------|
| **Imortalidade** | 7 relíquias de cura | Impossível morrer | CRÍTICA |
| **Crítico Infinito** | 4 relíquias de crítico | 100% crit após 3 ataques | ALTA |
| **Nuke Boss** | 6 relíquias de dano | 800+ dano em 1 hit | CRÍTICA |
| **Barreira Infinita** | Skill ID 50 + Petrus | Tank infinito | ALTA |
| **Energia Infinita** | 5 relíquias de energia | Spam de Suprema | MÉDIA |

---

## 3. Trade-offs em Relíquias Fortes

### 3.1 Por Que Trade-offs São Importantes?

Trade-offs criam **escolhas significativas**. Se toda relíquia só tem **benefícios**, não há decisão real — você sempre pega.

**Exemplo de jogo bem balanceado:**
- **Binding of Isaac:** Itens podem aumentar dano mas reduzir velocidade
- **Slay the Spire:** Cartas fortes aumentam custo de energia ou têm drawbacks
- **Hades:** Bênçãos de deuses conflitam entre si

### 3.2 Sistema Atual vs Sistema com Trade-offs

#### Relíquia ID 24 - Última Graça

**ATUAL:**
```
Efeito: Dobra dano da Suprema
Custo: Só pode usar 1x por batalha
```

**PROBLEMA:** "Custo" não é real. Você normalmente só usa Suprema 1-2x por batalha mesmo (custo alto de energia).

**COM TRADE-OFF:**
```
✅ Efeito: Dobra dano da Suprema
❌ Custo: -20% HP máximo permanente
```

**OU:**
```
✅ Efeito: Dobra dano da Suprema
❌ Custo: Custo de energia da Suprema aumenta de 8 → 12
```

**OU:**
```
✅ Efeito: Dobra dano da Suprema
❌ Custo: Suprema não pode causar crítico
```

#### Relíquia ID 2 - Pedra Bálsamo

**ATUAL:**
```
Efeito: Todas as curas curam +40%
Custo: Nenhum
```

**COM TRADE-OFF:**
```
✅ Efeito: Todas as curas curam +40%
❌ Custo: Dano causado reduzido em 15%
```

**Justificativa:** Você fica mais tanky mas menos agressivo. Escolha entre "tank healer" ou "glass cannon".

#### Relíquia ID 13 - Coleção de Espinhos

**ATUAL:**
```
Efeito: +3% crítico por relíquia
Custo: Nenhum
```

**PROBLEMA:** Escala MUITO com quantidade de relíquias (15 relíquias = +45% crit).

**COM TRADE-OFF:**
```
✅ Efeito: +3% crítico por relíquia
❌ Custo: Dano base de todas as skills -10%
```

**OU (mais interessante):**
```
✅ Efeito: +5% crítico por relíquia
❌ Custo: Sempre que NÃO criticar, perde 2 HP
```

**Justificativa:** High risk, high reward. Você aposta no crítico.

#### Relíquia ID 22 - Petrus

**ATUAL:**
```
Efeito: Poder causa +2 dano por relíquia
Custo: Nenhum
```

**COM TRADE-OFF:**
```
✅ Efeito: Poder causa +2 dano por relíquia
❌ Custo: Custo de energia do Poder aumenta em +1
```

**OU:**
```
✅ Efeito: Poder causa +2 dano por relíquia
❌ Custo: Outros ataques (Ataque/Especial/Suprema) causam -10% dano
```

**Justificativa:** Você se especializa em Poder, mas sacrifica versatilidade.

### 3.3 Categorias de Trade-offs

#### A) Custo de Recursos
- **Aumentar custo de energia**
- **Consumir HP ao usar skill**
- **Reduzir HP/Energia máxima**

#### B) Penalidades de Combate
- **Reduzir dano de outras skills**
- **Aumentar dano recebido**
- **Reduzir bloqueio/esquiva**

#### C) Limitações Mecânicas
- **Limitar usos por batalha**
- **Impedir críticos**
- **Impedir uso de certas skills**

#### D) Risk/Reward
- **Bônus alto se condição atendida, penalidade se falhar**
- Exemplo: "+50% dano mas se errar crítico, perde 10 HP"

### 3.4 Matriz de Relíquias com Trade-offs Sugeridos

| Relíquia | Poder Atual | Trade-off Sugerido |
|----------|-------------|-------------------|
| **ID 2** (Pedra Bálsamo) | ⭐⭐⭐⭐⭐ | -15% dano OU -10% energia máx |
| **ID 5** (Espelho Lázaro) | ⭐⭐⭐⭐⭐ | Já tem (perde ouro + relíquia) ✅ |
| **ID 13** (Coleção Espinhos) | ⭐⭐⭐⭐ | -10% dano base OU perde HP se não crita |
| **ID 22** (Petrus) | ⭐⭐⭐⭐ | +1 custo energia Poder OU -10% outros ataques |
| **ID 24** (Última Graça) | ⭐⭐⭐⭐⭐ | -20% HP max OU +4 custo energia Suprema |
| **ID 43** (Muralha Constantino) | ⭐⭐⭐ | -5% esquiva OU -1 energia máxima |
| **ID 48** (Relicário Helena) | ⭐⭐⭐⭐⭐ | Bosses ficam +30% mais fortes |

### 3.5 Benefícios dos Trade-offs

1. **Escolhas significativas:** Jogador pensa "Vale a pena?"
2. **Builds diversificados:** Diferentes trade-offs favorecem diferentes estilos
3. **Impede synergies quebradas:** Penalidades stackeiam também
4. **Aumenta skill ceiling:** Jogadores bons minimizam penalidades
5. **Narrativa:** Relíquias têm "maldições" ou "peso" temático

---

## 4. Soft Caps e Diminishing Returns

### 4.1 Diferença entre Soft Cap e Diminishing Returns

**Soft Cap:**
- Valor continua aumentando, mas **menos eficiente** após certo ponto
- Exemplo: De 0-50, cada ponto dá +2% dano. De 51-100, cada ponto dá +1% dano

**Diminishing Returns:**
- Cada **instância adicional** do mesmo tipo dá menos benefício
- Exemplo: 1ª relíquia de cura: +40%. 2ª relíquia de cura: +25%. 3ª: +15%

### 4.2 Por Que NÃO Usar Diminishing Returns em Relíquias?

Você disse **"NÃO"** para diminishing returns. Vou explicar por que concordo:

#### Problema 1: Complexidade Desnecessária
```
Player pega Pedra Bálsamo: +40% cura
Player pega Óleos de Pantaleão: +25% cura (ao invés de +25%)
Player pega terceira relíquia de cura: +15% cura
```

**Confuso para o jogador:** "Por que esta relíquia dá menos que a descrição diz?"

#### Problema 2: Punição Injusta
Se você já tem 2 relíquias de cura e aparece uma terceira, você é **punido** por escolhas passadas que não controlou (RNG).

#### Problema 3: Mataria Diversão
Parte da graça é **stackear** efeitos similares para criar builds especializados.

**MELHOR SOLUÇÃO:** Em vez de diminishing returns, usar **CAPS ABSOLUTOS** ou **TRADE-OFFS**.

### 4.3 Soft Caps em Atributos (Válido!)

Você mencionou:
> Soft caps em atributos acima de 60

**Isso faz sentido** se você decidir MANTER o sistema de atributos (mas você disse que vai extinguir).

**Como funcionaria:**
```python
def calculate_effective_attribute(attribute_value):
    if attribute_value <= 60:
        return attribute_value  # Eficiência 100%
    else:
        excess = attribute_value - 60
        return 60 + (excess * 0.5)  # Eficiência 50% acima de 60

# Exemplo:
Força 50: Efetivo 50
Força 60: Efetivo 60
Força 80: Efetivo 60 + (20 × 0.5) = 70
Força 100: Efetivo 60 + (40 × 0.5) = 80
```

**Benefício:**
- Incentiva **diversificar** atributos
- Evita "one-stat wonder" (tudo em Força)
- Mantém progressão, mas desacelera no late game

**MAS:** Se você vai extinguir atributos, isso é irrelevante.

### 4.4 Soft Caps em Relíquias (Alternativa a Diminishing Returns)

Em vez de diminishing returns **por tipo**, usar **caps absolutos por efeito**:

#### Exemplo 1: Cap em Crítico
```
Total de Crítico não pode passar de 75%
```

**Impacto:**
- Coleção de Espinhos (ID 13): Contribui até o cap
- Momentum (ID 17): Contribui até o cap
- Abraço da Escuridão: Contribui até o cap

**Se você bater o cap:** Pegar mais relíquias de crítico vira **escolha ruim** (incentiva diversificar).

#### Exemplo 2: Cap em Lifesteal
```
Total de Lifesteal não pode passar de 50%
```

**Benefício:** Impede "imortalidade vampírica" mas permite builds de lifesteal viáveis.

#### Exemplo 3: Cap em Multiplicadores
```
Multiplicadores de dano não podem exceder ×4 total
```

**Exemplo:**
- Última Graça: ×2
- Discipulado: ×2
- **Total seria ×4, já bate o cap**
- Primeira Mão não aplicaria

**Benefício:** Limite no "nuke boss" mas ainda permite combos fortes.

### 4.5 Tabela de Soft Caps Sugeridos

| Stat | Cap Atual | Soft Cap Sugerido | Justificativa |
|------|-----------|-------------------|---------------|
| **Crítico** | 75% (código) | 60% | Crítico demais trivializa |
| **Lifesteal** | Infinito | 40% | Impede imortalidade |
| **Bloqueio** | 20% (fórmula) | 20% ✅ | Já tem cap |
| **Multiplicador Dano** | Infinito | ×4 total | Impede one-shots |
| **Cura (multiplicador)** | Infinito | +100% | 3x cura já é muito |
| **Dano Acumulado** | Infinito | +50 por skill | Limita IDs 20/21/26 |

---

## 5. Soluções Práticas

### 5.1 Prioridade 1: Caps em Relíquias de Acúmulo

**Implementação:**
```python
# No processor.py, ao aplicar accumulating_damage:

MAX_ACCUMULATED_DAMAGE = 50  # Cap

if skill_type == 'attack':
    if player.accumulated_attack_bonus < MAX_ACCUMULATED_DAMAGE:
        player.accumulated_attack_bonus += effect['stack_bonus']
        # Garantir que não ultrapassa
        player.accumulated_attack_bonus = min(
            player.accumulated_attack_bonus,
            MAX_ACCUMULATED_DAMAGE
        )
```

**Afeta:** IDs 20, 21, 26, 50

### 5.2 Prioridade 2: Nerfar Petrus (ID 22)

**Mudança:**
```python
# De: +2 dano/relíquia
# Para: +1 dano/relíquia

# Impacto com 10 relíquias:
Antes: +20 dano
Depois: +10 dano
Redução: 50%
```

**OU adicionar trade-off:**
```python
# +2 dano/relíquia no Poder
# MAS: Custo de energia do Poder +1
```

### 5.3 Prioridade 3: Cap em Crítico Total

**Implementação no battle_cache.py:**
```python
CRITICAL_CAP = 0.60  # 60% máximo

# Após calcular todos os bônus:
final_crit_chance = min(base_crit_chance, CRITICAL_CAP)
```

**Afeta:** ID 13 (Coleção), ID 17 (Momentum), Skills

### 5.4 Prioridade 4: Cap em Lifesteal

**Implementação:**
```python
LIFESTEAL_CAP = 0.40  # 40% máximo

# Ao aplicar lifesteal no damage_boss():
total_lifesteal = min(
    lifesteal_from_skill + lifesteal_from_relics + lifesteal_from_buffs,
    LIFESTEAL_CAP
)
```

**Afeta:** Synergy "Imortalidade Vampírica"

### 5.5 Prioridade 5: Trade-offs em Relíquias Tier S

**Editar registry.py:**

```python
# ID 24 - Última Graça
{
    'id': '24',
    'name': 'Última Graça',
    'description': 'Dobra o dano da Suprema, mas reduz HP máximo em 15%',
    'effect': {
        'type': 'ultimate_trade',
        'damage_multiplier': 2.0,
        'max_hp_penalty': -0.15  # NOVO
    }
}

# ID 2 - Pedra Bálsamo
{
    'id': '2',
    'name': 'Pedra Bálsamo',
    'description': 'Todas as curas curam 40% a mais, mas você causa 10% menos dano',
    'effect': {
        'type': 'heal_multiplier',
        'multiplier': 1.4,
        'damage_penalty': -0.10  # NOVO
    }
}
```

### 5.6 Prioridade 6: Rebalancear Lembranças

**Arquivo reward_system.py:**

```python
# ANTES:
'damage_global': {
    'values': {3: 2, 4: 4}
}

# DEPOIS:
'damage_global': {
    'values': {1: 1, 2: 2, 3: 3, 4: 5}
}

# ANTES:
'heal': {
    'values': {1: 40, 2: 80, 3: 120, 4: 160}
}

# DEPOIS:
'heal': {
    'values': {1: 15, 2: 25, 3: 35, 4: 50}
}
```

**Justificativa:** HP máximo é 80, então cura de 160 é absurda.

---

## 6. Checklist de Implementação

### Mudanças de Código

- [ ] **Adicionar caps em accumulated_attack_bonus e accumulated_power_bonus** (50 cada)
- [ ] **Adicionar CRITICAL_CAP = 0.60** no battle_cache.py
- [ ] **Adicionar LIFESTEAL_CAP = 0.40** onde lifesteal é aplicado
- [ ] **Nerfar Petrus:** +2 → +1 dano/relíquia
- [ ] **Nerfar Coleção de Espinhos:** +3% → +2% crit/relíquia
- [ ] **Adicionar trade-offs** em relíquias Tier S (IDs 2, 24, 13, 22)
- [ ] **Rebalancear lembranças** (especialmente heal e damage_global)
- [ ] **Adicionar multiplicador cap** (×4 total) para combos de dano

### Testes Necessários

- [ ] Testar run com build de crítico (atingir cap de 60%)
- [ ] Testar run com build de lifesteal (atingir cap de 40%)
- [ ] Testar run longa (50+ inimigos) para ver acúmulos
- [ ] Testar synergies anteriormente quebradas
- [ ] Verificar se trade-offs aparecem na UI corretamente

### Métricas para Monitorar

- [ ] **Tempo médio de kill** por tipo de inimigo
- [ ] **Taxa de vitória** antes vs depois das mudanças
- [ ] **Distribuição de relíquias** escolhidas (se algumas viram "trap choices")
- [ ] **Curva de poder** (dano médio por inimigo derrotado)

---

## Conclusão

### Power Creep

**Causa raiz:** Acúmulos infinitos + multiplicadores stackeáveis + falta de trade-offs

**Solução:** Caps, nerfs em "per relic", trade-offs

### Synergies Quebradas

**Causa raiz:** Efeitos puramente positivos que se multiplicam

**Solução:** Caps absolutos em lifesteal/crítico, limitar multiplicadores

### Trade-offs

**Implementação:** Adicionar penalidades a relíquias fortes para criar escolhas

**Não fazer:** Diminishing returns (pune demais e confunde)

### Resultado Esperado

Com estas mudanças:
- **Curva de poder mais suave**
- **Synergies ainda possíveis, mas não quebradas**
- **Escolhas mais significativas** (trade-offs)
- **Late game ainda desafiador** (caps impedem trivializar)

