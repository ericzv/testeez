# Análise de Game Design — Testeez RPG Roguelike

## Contexto

Análise completa do estado atual do jogo com recomendações para melhorias em fluxo, profundidade, metaprogressão, lore dinâmica e novas mecânicas. O objetivo central é **aumentar a profundidade usando as mecânicas existentes**, priorizando sinergias em vez de variáveis soltas.

---

## 1. MELHORIAS NO FLUXO DO JOGO

### 1.1 Fluxo de Batalhas — Problemas Identificados

**Turno do inimigo muito passivo:**
O jogador assiste ao turno do inimigo sem nenhuma interação. Atualmente o turno do inimigo demora ~3.2s (300ms prep + 600ms smokeout + 1000ms transição + 500ms buff + 800ms entre ataques). Isso é tempo morto.

**Recomendações:**
- **Reação defensiva (Parry/Esquiva ativa):** Quando o inimigo atacar, dar ao jogador uma janela de 500ms para clicar num botão de "Reação" que aparece brevemente. Se acertar, reduz dano em 30% ou ganha 1 de energia. Isso transforma o turno do inimigo em momento ativo. É compatível com o skill test que já existe (mesma lógica de timing).
- **Reduzir transição do turno inimigo** de 1000ms para 600ms. A smokeout animation de 600ms pode rodar em paralelo com a transição de view (não sequencialmente).
- **Mostrar intenções DURANTE o turno do jogador** (já existe `next_intentions_cached`). Tornar isso visualmente mais claro — ícone grande sobre o inimigo mostrando "vai atacar", "vai bufar", "vai debuffar". Isso permite decisão tática.

**Intervalo entre ataques do inimigo:**
Os 800ms entre ataques múltiplos do inimigo são ok para ataques visuais, mas quando o inimigo só usa buff+ataque, os 800ms entre cada ação criam um delay perceptível.

**Recomendação:** Buffs do inimigo devem ter animação de 400ms (metade), ataques mantêm 800ms.

### 1.2 Responsividade dos Botões

**Problemas identificados:**
| Componente | Delay Atual | Recomendado |
|-----------|-------------|-------------|
| Lockout de skill especial | 3000ms | 1500ms |
| Lockout de poção | 1200ms | 600ms |
| Atualização HUD pós-ação | 3 updates (200/500/1000ms) | 1 fetch + callback |
| Victory banner wait | 5000ms | 3500ms (com skip button) |
| State watcher polling | 300ms interval | Event-driven |

**Recomendação crítica:** Adicionar **botão de "Skip"** na tela de vitória. O banner pode rodar por 5s, mas o jogador pode pular a qualquer momento após 1.5s.

### 1.3 Carregamento de Batalha

Atualmente 21 scripts JavaScript são carregados **sequencialmente** (`spa-navigation.js:259`). Scripts independentes (vignette-part1 a part4, preloader, class-animations) podem ser carregados em paralelo.

**Recomendação:** Agrupar scripts em 3-4 blocos paralelos. Estimativa de redução: 30-40% do tempo de carregamento.

### 1.4 Fluxo Pós-Batalha

Atualmente: Vitória → Espera banner → Hub → Escolha de memória → Próximo nó do mapa.

**Recomendação:** Vitória → Escolha de memória (overlay sobre o campo de batalha) → Mapa. Eliminar a volta ao hub entre cada batalha. A escolha de memória deveria ser integrada ao fluxo de recompensa, não uma tela separada.

---

## 2. O QUE CORTAR PARA TORNAR O JOGO MAIS FLUIDO

### 2.1 Delays para Eliminar/Reduzir

1. **setTimeout encadeados em battle-combat-system.js (linhas 509-611):** Três níveis de setTimeout aninhados (400ms → 500ms → 1000ms = 1.9s). Substituir por Promise chain flat com total de 800ms.

2. **Atualizações triplas do HUD (fast-battle-mode.js:900-908):** Três tentativas de sync a 200/500/1000ms. Substituir por um único fetch com retry automático.

3. **Delay de seleção de nó no mapa (500ms):** Reduzir para feedback visual instantâneo + processamento backend assíncrono.

4. **Animação de remoção pós-ação (battle-skills-system.js:711) - 800ms:** Reduzir para 400ms.

### 2.2 Transições para Simplificar

- **SPA view transition (0.4s):** Ok para navegação, mas entre batalha e mapa deveria ser 0.2s.
- **Boss animation idle (4s loop):** Ok, não cortar — é atmosférico.
- **Loading overlay hide (1000ms fade):** Reduzir para 500ms.

### 2.3 Polling para Eliminar

O state watcher roda a cada 300ms checando mudanças de energia/blood_stacks. Substituir por um sistema de eventos: quando o backend retorna o resultado de uma ação, o frontend já atualiza tudo de uma vez (event-driven em vez de polling).

### 2.4 Regra Geral

> Se o jogador não pode interagir durante um delay, e o delay não está mostrando informação nova, ele é desnecessário.

---

## 3. AUMENTAR PROFUNDIDADE SEM AUMENTAR COMPLEXIDADE

A filosofia correta para um roguelike com muitas sinergias: **poucas variáveis, muitas interações entre elas**. Aqui estão propostas que usam as mecânicas existentes:

### 3.1 Sistema de Condições Compostas nas Relíquias

Atualmente as relíquias ativam em hooks simples (on_crit, on_kill, after_attack). A proposta é criar **condições compostas**:

**Exemplos:**
- "Se você tem 3+ relíquias de cura: seus crits curam o dobro" (sinergia entre quantidade de relíquias + tipo)
- "Se sua energia está abaixo de 3: ataques básicos custam 0 de energia" (sinergia energia + ataque)
- "Se você tem uma relíquia lendária: relíquias comuns ganham +1 de efeito" (sinergia entre raridades)
- "Se você derrotou o inimigo sem usar especial: próximo especial causa dano duplo" (sinergia entre restrição + recompensa)

**Implementação:** Adicionar campo `synergy_condition` às relíquias existentes. O hook `processor.py` já verifica condições — basta expandir o dicionário de condições.

### 3.2 Lembranças com Efeitos Escaláveis (Threshold System)

Atualmente lembranças só dão bônus flat (+5 HP, +3 dano). Proposta: ao acumular N lembranças do mesmo tipo, um **efeito threshold** é ativado.

**Exemplos:**
| Lembrança | Quantidade | Threshold Effect |
|-----------|-----------|------------------|
| Arx (HP) | 3x | +5% de todo o heal recebido |
| Dominatio (ataque) | 3x | Ataques básicos têm 10% chance de atacar 2x |
| Tyrannitas (poder) | 3x | Skill test começa 1 nível mais fácil |
| Fervor (crit) | 2x | Crits concedem +1 energia |
| Robur (dodge) | 3x | Ao esquivar, contra-ataca por 3 de dano |

**Por que funciona:** O jogador agora tem uma razão para "buildar" um tipo específico de lembrança em vez de pegar o valor mais alto. Cria decisão estratégica com as mesmas mecânicas.

### 3.3 Relíquias com Anti-Sinergias (Trade-offs)

Algumas relíquias novas poderiam ter **efeitos negativos** que cancelam certas estratégias:

- "Lâmina Faminta: +5 dano em todos os ataques, MAS heal reduzido em 50%"
- "Escudo de Obsidiana: Bloqueio +15%, MAS velocidade de crit -50%"
- "Coração Voraz: Lifesteal dobrado, MAS max HP reduzido em 20"

Isso cria um "puzzle" de build: o jogador precisa pensar se a relíquia ajuda ou atrapalha sua build atual.

### 3.4 Combos de Tipos de Ataque

O jogo já tem 4 tipos de ataque (básico, poder, especial, ultimate). A relíquia "Omni" (#12) já dá bônus por usar todos os 4. Expandir esse conceito:

- **Sequência Arcana:** Usar básico → poder → especial (nessa ordem em 3 turnos) dá +50% de dano no especial.
- **Fluxo de Batalha:** A cada 3 ataques diferentes consecutivos, ganhe 2 de energia.
- **Cadeia Perfeita:** Se acertar "Perfeito" no skill test e em seguida usar especial, o especial ignora defesa.

**Implementação:** Adicionar campo `last_attack_types` (array de últimos 3-5 tipos) ao estado de batalha. Verificar padrões no hook `after_attack`.

### 3.5 Energia como Recurso Tático (não só limitador)

Atualmente energia é só um custo. Propostas para torná-la tática:

- **Overcharge:** Quando a energia está cheia (10/10), o próximo ataque básico causa +3 de dano. Cria tensão: "guardo energia para o bônus ou gasto agora?"
- **Última Gota:** Quando a energia chega a 0, ganhe um buff temporário de +20% de dano por 2 turnos.
- **Eficiência:** Atacar com skill que custa ≤2 de energia tem 20% de chance de reembolsar o custo.

### 3.6 HP Positioning

Certas relíquias/lembranças já ativam em thresholds de HP (Rosarium a <20%). Expandir:

- **Zona de Perigo (< 25% HP):** +30% dano, -50% heal recebido. (Risk/reward)
- **Zona de Conforto (> 75% HP):** +2 energia por turno, mas -10% dano.
- **Equilíbrio (40-60% HP):** Crits curam 5 HP.

O jogador pode deliberadamente se manter numa "zona" de HP para maximizar sinergias.

---

## 4. OPÇÕES DE METAPROGRESSÃO

Atualmente só existem Talentos (6 constelações, 60 talentos). Propostas:

### 4.1 Bestiário Progressivo (com recompensas)

O bestiário já existe mas é puramente visual (mostra bosses derrotados). Proposta:

- **Derrotar X inimigos de um tema** desbloqueia um bônus permanente pequeno.
  - 10 Guerreiros Dark: +1% dodge permanente
  - 10 Magos: +1 dano especial permanente
  - 20 de qualquer tema: +5 max HP permanente
- **Derrotar cada boss pela primeira vez** desbloqueia uma "lembrança especial" (visível no bestiário) que dá uma descrição de lore + um bônus pequeno permanente.

**Por que funciona:** Incentiva o jogador a explorar diferentes caminhos no mapa e lutar contra inimigos variados. O bestiário vira uma progressão secundária natural.

### 4.2 Arquivo de Relíquias

Manter registro de todas as relíquias já encontradas (não só as atuais). Proposta:

- **Coleção:** Ao encontrar todas as relíquias de uma categoria (cura, dano, economia), desbloqueia um bônus passivo.
  - Coleção de Cura completa: Iniciar runs com +10 HP
  - Coleção de Dano completa: Iniciar com +2 dano global
- **Favoritas:** O jogador pode marcar 3 relíquias como "favoritas" — elas têm +10% chance de aparecer nas runs.

### 4.3 Títulos / Conquistas com Efeito

Rastrear conquistas específicas que dão bônus micro:

- "Perfeccionista" (10 Perfeitos no skill test): +5% dano em ataques de poder permanente
- "Mercador" (gastar 1000 gold em shops): -5% preço em lojas permanente
- "Sobrevivente" (vencer 5 runs com <10% HP no boss): +1 revive HP permanente
- "Combo Master" (executar 50 sequências arcanas): +1 dano em combos

### 4.4 Árvore de Classe

Os personagens já têm classes (Ronin, Vlad, etc.) com skills diferentes. Proposta:

- **Maestria de Classe:** Ao jogar X runs com uma classe, desbloqueia variantes das skills.
  - Vlad: Após 10 runs, "Energia Escura" pode escolher entre drenar HP ou drenar energia do inimigo.
  - Ronin: Após 10 runs, "Corte Preciso" pode ser carregado por 1 turno para causar 2x dano.

Isso conecta naturalmente com a ideia de **Técnicas** (ponto 5).

### 4.5 Ampulhetas Eternas — Uso Atual e Expansão

As ampulhetas já existem como moeda permanente mas parecem subutilizadas. Proposta:

- **Loja de Ampulhetas:** Uma loja permanente (no hub, fora da run) que vende:
  - Skins cosméticas para habilidades
  - Slots extras de relíquia (começa com 5, máx 8)
  - "Bênçãos de Run" — escolher um buff minor para início de run (ex: "começar com 1 relíquia aleatória comum")
  - Desbloqueio de Técnicas (ver seção 5)

---

## 5. TÉCNICAS — Nova Mecânica Proposta

### 5.1 Conceito

**Técnicas** são modificadores que **mudam o comportamento** de uma skill, não apenas seus números. O jogador adquire técnicas em pontos específicos da run (após elites, eventos especiais, ou como recompensa de boss).

### 5.2 Design Principles

1. **Mutuamente exclusivas por skill:** Cada skill pode ter apenas 1 técnica ativa por vez.
2. **Escolha significativa:** Cada técnica muda a identidade da skill.
3. **Sinergias com relíquias/lembranças:** A técnica escolhida deveria combinar melhor com certas builds.
4. **3 técnicas por skill:** Suficiente para variedade, pouco o bastante para memorizar.

### 5.3 Exemplos de Técnicas (Ataque Básico)

**Skill original:** Ataque Básico — causa dano base, custo 1 energia.

| Técnica | Efeito | Sinergia com... |
|---------|--------|------------------|
| **Golpe Múltiplo** | Causa 60% do dano, mas ataca 2 vezes. Cada hit ativa relíquias on_hit separadamente. | Presa Vampírica (heal 2x), Coleção de Espinhos (crit 2x), Sangue do Pelicano |
| **Golpe Concentrado** | Causa 150% do dano, mas custa 2 de energia. Ignora 50% da armadura. | Lembranças de dano flat, Overcharge, builds de energia |
| **Golpe Dreno** | Causa 80% do dano, mas rouba 1 de energia do inimigo (reduz ações dele no próximo turno). | Builds de controle, contra inimigos com múltiplas ações |

### 5.4 Exemplos de Técnicas (Ataque de Poder)

**Skill original:** Ataque de Poder — skill test determina dano.

| Técnica | Efeito | Sinergia com... |
|---------|--------|------------------|
| **Poder Crescente** | Cada uso consecutivo de poder aumenta o dano base em +2 (reseta se usar outro tipo). | Paradoxo da Liberdade, builds mono-skill |
| **Poder Explosivo** | Skill test tem só 3 zonas (Miss/Normal/Perfeito) mas Perfeito causa 2x dano + AoE (se houver múltiplos inimigos futuros). | Builds de all-in, skill test builds |
| **Poder Vampírico** | Dano reduzido em 30%, mas cura 50% do dano causado. | Builds de sustain, Pedra Bálsamo, Gema Vital |

### 5.5 Exemplos de Técnicas (Skill Especial)

**Skill original:** Varia por classe. Ex: Golpe das Sombras (Ronin).

| Técnica | Efeito | Sinergia com... |
|---------|--------|------------------|
| **Sombra Persistente** | Dano reduzido em 20%, mas aplica "Marca" no inimigo (próximos 3 ataques de qualquer tipo causam +3 dano). | Golpe Múltiplo, builds de combo |
| **Sombra Dupla** | Executa a skill 2x com 50% do dano cada, mas custa o dobro de energia. | Doxologia (reduz custo), builds de on-hit |
| **Sombra Evasiva** | Após usar, ganhe 100% dodge por 1 turno inimigo. Dano da skill reduzido em 40%. | Builds defensivas, Robur lembranças |

### 5.6 Aquisição de Técnicas

- **Ponto 1:** Após o primeiro elite de cada ato (3 técnicas no total por run).
- **Ponto 2:** Evento especial raro no mapa ("Mestre de Armas" — escolhe 1 skill e 1 de 3 técnicas).
- **Ponto 3:** Loja especial (por gold ou por sacrifício de relíquia).

### 5.7 Por que Técnicas > Novas Relíquias/Lembranças

**Relíquias novas** adicionam mais variáveis soltas. Cada nova relíquia é "mais uma coisa pra considerar" mas não muda fundamentalmente como você joga.

**Técnicas mudam a identidade das skills.** Um jogador com "Golpe Múltiplo" joga completamente diferente de um com "Golpe Concentrado", mesmo que ambos tenham as mesmas relíquias. Isso cria **runs com identidade**.

**Recomendação:** Implementar Técnicas como prioridade. Novas relíquias podem ser adicionadas depois, mas focadas em sinergizar com as técnicas (ex: "Quando usar uma skill modificada por técnica, +2 dano").

---

## 6. NOVOS SKILL TESTS

### 6.1 Requisitos

- Compatível com mobile, tablet e desktop
- Não exigir precisão extrema (internet fraca/dispositivo fraco não deve prejudicar)
- Cada skill test deve ter resultado variável (não binário)
- Manter a identidade do skill test existente (timing-based)

### 6.2 Propostas

#### A) Sequência de Símbolos (para Skill Especial)

**Mecânica:** 3-5 símbolos aparecem na tela (espada, escudo, poção, estrela). O jogador deve tocar na sequência correta dentro de 3 segundos. A sequência é mostrada por 1.5s antes de desaparecer.

**Escala de resultado:**
- 0 corretos: Miss
- 1-2 corretos: Fraco (70% dano)
- 3-4 corretos: Bom (100% dano)
- 5/5 corretos: Perfeito (120% dano + efeito bônus)

**Por que funciona:** Teste de memória de curto prazo, não de reflexo. Não é prejudicado por lag. Botões grandes são fáceis de acertar em mobile. Escala de dificuldade natural (3 símbolos no ato 1, 5 no ato 3).

**Compatibilidade:** Touch targets de 48px+ (WCAG compliant). Sem precisão de posição — só sequência.

#### B) Timing em Zonas (para Ataque Básico avançado)

**Mecânica:** Uma barra circular (como um relógio) com 3-4 zonas coloridas que rotam. O jogador toca quando o ponteiro está na zona dourada. Similar ao skill test atual mas com **zonas móveis** em vez de barra linear.

**Escala de resultado:**
- Zona vermelha: 50% dano
- Zona laranja: 80% dano
- Zona verde: 100% dano
- Zona dourada: 120% dano + buff

**Diferença do skill test atual:** A barra circular é mais visual e "justa" em mobile (área de toque não depende da largura da tela). As zonas se movem em velocidade constante — não há aceleração/desaceleração como no power bar atual (que pode confundir em dispositivos lentos).

#### C) Carregamento por Pressão (para Ultimate)

**Mecânica:** O jogador segura (hold) o botão. Uma barra enche continuamente. Soltar no momento certo maximiza o dano. Se segurar demais, a barra "estoura" e volta a 50%.

**Escala de resultado:**
- 0-30%: Fraco (60% dano)
- 30-60%: Normal (100% dano)
- 60-85%: Bom (120% dano)
- 85-95%: Excelente (140% dano)
- 95-100%: Perfeito (160% dano)
- >100% (estourou): Falha parcial (80% dano)

**Por que funciona:** Hold-and-release é natural em touch. Não exige precisão de pixel — é sobre "sentir" o timing. A penalidade por excesso cria tensão dramática. Funciona identicamente em mobile e desktop.

#### D) Escolha Rápida (para situações defensivas)

**Mecânica:** 3 opções aparecem brevemente (2 segundos). Uma é "correta" baseada no tipo de ataque do inimigo (ex: inimigo vai usar ataque físico → escolher escudo; mágico → escolher resistência; debuff → escolher purificação). A intenção do inimigo já é mostrada.

**Escala de resultado:**
- Correto: Reduz dano em 40% + contra-ataca
- Neutro: Reduz dano em 15%
- Errado: Sem redução

**Por que funciona:** Usa as intenções do inimigo que JÁ existem no jogo. Incentiva o jogador a ler as intenções. Decisão rápida, não reflexo. 3 botões grandes = fácil em mobile.

### 6.3 Integração com Técnicas

Cada técnica poderia modificar o skill test da skill:
- "Golpe Múltiplo" → skill test rápido 2x (dois taps rápidos)
- "Poder Explosivo" → skill test simplificado (3 zonas grandes)
- "Sombra Evasiva" → skill test substituído por Escolha Rápida

---

## 7. SISTEMA DE LORE DINÂMICA — "ECOS DE MEMÓRIA"

### 7.1 Conceito Geral

Em vez de um sistema de nemesis (patenteado pela WB), criar um sistema de **Ecos de Memória**: os inimigos "lembram" do jogador de formas que evoluem ao longo das runs, mas isso é tratado como **memórias fragmentadas do mundo**, não como inimigos individuais voltando.

### 7.2 Mecânica Core: Marcas de Destino

Quando o jogador interage com inimigos de formas notáveis, uma **Marca de Destino** é criada:

**Triggers para criar Marcas:**
- Derrotar um inimigo com dano crítico massivo (>50% do HP em 1 hit)
- Ser quase morto por um inimigo (chegar a <5% HP)
- Derrotar um inimigo sem receber dano (perfeito)
- Perder uma run para um tipo específico de inimigo
- Usar a mesma skill para matar 5+ inimigos do mesmo tema

**Cada Marca armazena:**
```
{
  enemy_theme: "Guerreiro dark",
  mark_type: "nemesis" | "rival" | "prey" | "feared",
  intensity: 1-5,
  player_id: FK,
  created_at: timestamp,
  last_triggered: timestamp,
  encounter_count: int
}
```

### 7.3 Como as Marcas Afetam o Jogo

**Tipo "prey" (presa)** — quando o jogador domina um tema:
- Inimigos desse tema têm fala especial: "Ouvi falar de você... o caçador de {tema}."
- Inimigos desse tema ficam com -10% HP (medo)
- MAS: a cada 5 mortes, um inimigo "Veterano" desse tema aparece (+30% stats, skill bônus)

**Tipo "nemesis"** — quando o jogador PERDE para um tema:
- Na próxima run, inimigos desse tema têm fala: "Outro como você? O último não durou muito."
- Inimigos desse tema ficam +10% mais fortes (primeiro encontro)
- Derrotá-los dá +50% recompensa
- Após derrotar 3 do tema, a marca muda para "rival"

**Tipo "rival"** — evolução natural:
- Inimigos desse tema têm falas de respeito: "Você de novo. Desta vez será diferente."
- Stats normais, mas ação extra 25% do tempo
- Recompensa +25% permanente contra esse tema

**Tipo "feared" (temido)** — quando o jogador é dominante demais:
- Inimigos fogem do combate se o jogador tem HP cheia (30% chance de render = vitória automática com 50% da recompensa)
- Inimigos desse tema podem dropar relíquias exclusivas
- Mantém a progressão interessante mesmo quando o jogador é forte

### 7.4 Modelo de Dados (para models.py)

```python
class DestinyMark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    enemy_theme = db.Column(db.String(100))
    mark_type = db.Column(db.String(20))  # nemesis, rival, prey, feared
    intensity = db.Column(db.Integer, default=1)
    encounter_count = db.Column(db.Integer, default=0)
    kills = db.Column(db.Integer, default=0)
    deaths = db.Column(db.Integer, default=0)
    perfect_kills = db.Column(db.Integer, default=0)
    last_triggered = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 7.5 Frases Dinâmicas

Expandir o sistema de `typical_phrase` para incluir frases condicionais:

```python
# enemy_generation.py - ao gerar inimigo
destiny_mark = DestinyMark.query.filter_by(
    player_id=player.id,
    enemy_theme=enemy.theme
).first()

if destiny_mark:
    if destiny_mark.mark_type == 'nemesis':
        phrases = NEMESIS_PHRASES[destiny_mark.intensity]
    elif destiny_mark.mark_type == 'prey':
        phrases = PREY_PHRASES[destiny_mark.intensity]
    # etc.
    enemy.typical_phrase = random.choice(phrases)
```

**Banco de frases exemplo:**

**Nemesis (intensidade 1-3):**
1. "Hmm... Você me lembra alguém. Alguém que fracassou."
2. "Os seus olhos... já vi esse medo antes."
3. "Os {tema} sussurram sobre um aventureiro tolo. Seria você?"

**Prey (intensidade 1-3):**
1. "E-espere... Você é o Caçador de {tema}?!"
2. "Os outros fugiram quando souberam que você viria."
3. "Eu não sou como os outros. Eu fiquei."

**Rival (intensidade 1-3):**
1. "Nos encontramos de novo. Que seja uma boa luta."
2. "Cada vez que nos enfrentamos, eu fico mais forte."
3. "Você é o único adversário digno que encontrei."

### 7.6 Visualização no Hub

Adicionar uma tela "Ecos de Memória" no hub:
- Mostra cada tema com a marca atual
- Ícone e cor diferente por tipo (nemesis=vermelho, prey=verde, rival=azul, feared=dourado)
- Contador de encontros e estatísticas
- Prévia das frases desbloqueadas (lore collection)

### 7.7 Evolução Permanente (Cross-Run)

As marcas persistem entre runs e evoluem:
- **Intensidade cresce** com o número de encontros (max 5)
- **Tipo pode mudar:** nemesis → rival → feared (por dominar)
- **Decai lentamente** se o jogador não encontra o tema por 5 runs (intensidade -1)
- **Eventos especiais:** Na intensidade 5, o tema pode gerar um mini-boss único com nome próprio e visual especial (usando o sistema de figures existente)

---

## 8. COMPARATIVO: RELÍQUIAS vs LEMBRANÇAS vs TÉCNICAS

| Aspecto | Novas Relíquias | Novas Lembranças | Técnicas |
|---------|-----------------|-------------------|----------|
| Impacto na gameplay | Passivo/reativo | Numérico | Transformativo |
| Decisão do jogador | "Qual pegar?" | "Qual valor é maior?" | "Como quero jogar?" |
| Replay value | Médio | Baixo | Alto |
| Sinergias | Com outras relíquias | Com thresholds | Com tudo |
| Esforço de implementação | Baixo | Baixo | Médio |
| Risco de power creep | Alto | Médio | Baixo (trade-offs) |

**Veredicto:** Técnicas > Relíquias > Lembranças para o objetivo de "experiência diferente a cada run".

---

## 9. PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### Fase 1 — Quick Wins (fluidez imediata)
- [ ] Reduzir delays desnecessários (seção 2)
- [ ] Botão de skip na tela de vitória
- [ ] Consolidar HUD updates
- [ ] Mostrar intenções do inimigo de forma mais clara

### Fase 2 — Profundidade com Mecânicas Existentes
- [ ] Sistema de threshold para lembranças (3.2)
- [ ] Condições compostas em relíquias (3.1)
- [ ] Combos de tipos de ataque (3.4)
- [ ] Energia como recurso tático (3.5)

### Fase 3 — Técnicas
- [ ] Implementar framework de técnicas
- [ ] 3 técnicas para Ataque Básico
- [ ] 3 técnicas para Ataque de Poder
- [ ] 3 técnicas por classe para Especial
- [ ] Pontos de aquisição (elite/evento/loja)

### Fase 4 — Metaprogressão
- [ ] Bestiário progressivo com recompensas (4.1)
- [ ] Arquivo de relíquias com coleções (4.2)
- [ ] Conquistas com efeito (4.3)
- [ ] Loja de ampulhetas (4.5)

### Fase 5 — Lore Dinâmica
- [ ] Modelo DestinyMark + migrations
- [ ] Sistema de Marcas de Destino
- [ ] Frases dinâmicas por tema/marca
- [ ] Tela de Ecos de Memória no hub
- [ ] Inimigos Veteranos (boss temático)

### Fase 6 — Skill Tests Adicionais
- [ ] Sequência de Símbolos (especial)
- [ ] Carregamento por Pressão (ultimate)
- [ ] Escolha Rápida (defensivo/reação)
- [ ] Integração com Técnicas

---

## 10. RESUMO EXECUTIVO

O jogo tem uma base sólida com 50 relíquias, 6 árvores de talento, 12 tipos de lembrança, sistema de mapa procedural, e um skill test funcional. Os principais gaps são:

1. **Fluidez:** Delays desnecessários acumulam ~2-3s por turno. Corrigível com otimizações pontuais.
2. **Profundidade:** As mecânicas existentes não interagem o suficiente entre si. Thresholds de lembranças e condições compostas de relíquias resolvem isso sem adicionar variáveis novas.
3. **Identidade de Run:** Cada run se sente similar porque as skills não mudam. Técnicas resolvem isso de forma elegante.
4. **Metaprogressão:** Só talentos. O bestiário, coleção de relíquias e conquistas com efeito criam 3 novas trilhas de progressão permanente.
5. **Lore:** O sistema de frases/figuras é bom mas estático. Ecos de Memória criam narrativa emergente sem necessidade de escrita de roteiro extenso.
6. **Skill Tests:** O power bar é bom mas solitário. 3 novos testes (símbolos, pressão, escolha) mantêm a variabilidade sem exigir precisão excessiva.

O jogo está a ~3 fases de implementação de se tornar um roguelike com profundidade comparável a jogos como Slay the Spire, mantendo a acessibilidade para jogadores casuais.
