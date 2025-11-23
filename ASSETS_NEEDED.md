# Assets Necessários - Sistema Completo de Áudio

## 📋 ÍNDICE
1. [Tela de Derrota](#tela-de-derrota)
2. [Sistema de Descanso (Bonefire)](#sistema-de-descanso-bonefire)
3. [Sistema de Moedas](#sistema-de-moedas)
4. [Sistema de Eventos](#sistema-de-eventos)
5. [Sistema de Relíquias](#sistema-de-relíquias)
6. [Sistema de Lembranças (Memories)](#sistema-de-lembranças-memories)
7. [Seleção de Personagens](#seleção-de-personagens)
8. [Sistema de Talentos](#sistema-de-talentos)
9. [Sons Gerais](#sons-gerais)

---

## 🎵 SONS NECESSÁRIOS

### Tela de Derrota
📁 `/static/game.data/sounds/`

**defeat.wav** (1:34 - som longo)
- **Quando**: Tocar em loop na tela de estatísticas da run após ser derrotado
- **Onde**: Página de escolher novo personagem, enquanto pop-up de estatísticas estiver aberto
- **Status**: ❌ FALTANDO (existe defeat.mp3, mas precisa do .wav longo)

---

### Sistema de Descanso (Bonefire)
📁 `/static/game.data/sounds/`

**heal-on-bonefire.wav**
- **Quando**: Ao descansar em node de fogueira (bonefire/rest)
- **Efeito**: Som de cura/restauração
- **Status**: ❌ FALTANDO

---

### Sistema de Moedas
📁 `/static/game.data/sounds/`

#### Sons para GANHAR dinheiro (usar alternadamente/aleatoriamente):
1. **coin-use4.mp3** ❌ FALTANDO
2. **coin-use5.mp3** ❌ FALTANDO
3. **coin-use6.mp3** ❌ FALTANDO
4. **coin-use8.mp3** ❌ FALTANDO

- **Quando**: Recebe gold (eventos, vitórias, recompensas)
- **Comportamento**: Alternar entre os 4 sons ou escolher aleatoriamente

#### Sons para PERDER/GASTAR dinheiro (usar alternadamente/aleatoriamente):
1. **coin-use1.mp3** ❌ FALTANDO
2. **coin-use2.mp3** ❌ FALTANDO
3. **coin-use3.mp3** ❌ FALTANDO
4. **coin-use9.mp3** ❌ FALTANDO

- **Quando**: Gasta gold (shop, eventos)
- **Comportamento**: Alternar entre os 4 sons ou escolher aleatoriamente

---

### Sistema de Eventos
📁 `/static/game.data/sounds/`

#### Abertura de Eventos
**event-openning.mp3**
- **Quando**: Ao abrir pop-up de evento
- **Status**: ❌ FALTANDO

#### Encontro com Inimigos (alternados/aleatórios)
**enemy-found.mp3**
**enemy-found2.mp3**
- **Quando**: Em eventos onde TALVEZ se encontre inimigo (por azar/chance)
- **Comportamento**: Alternar entre os 2 sons
- **Status**: ❌ FALTANDO

#### Botões Indisponíveis
**unavailable.mp3**
- **Quando**: Tenta clicar em botões de evento sem requisitos cumpridos
- **Status**: ❌ FALTANDO

#### Escolhas - Tipos de Ações

**choice-damage.mp3**
- **Quando**: Escolheu opção que causa dano ao personagem
- **Status**: ❌ FALTANDO

**choice-damage1.mp3**
**choice-damage2.mp3**
- **Quando**: Escolheu algo que causou dano (tirou HP)
- **Comportamento**: Alternar entre os 2 sons
- **Status**: ❌ FALTANDO

**choice-heal.mp3**
- **Quando**: Escolheu opção que CURA
- **Status**: ❌ FALTANDO

**choice-maxhp.mp3**
- **Quando**: Escolheu opção que aumenta HP máximo
- **Status**: ❌ FALTANDO

**choice-ignore.mp3**
- **Quando**: Escolheu ignorar o evento
- **Status**: ❌ FALTANDO

#### Escolhas - Resultados Emocionais

**choice-negative.mp3**
- **Quando**: Escolha com resultado negativo
- **Status**: ❌ FALTANDO

**choice-positive.mp3**
- **Quando**: Escolha com resultado positivo
- **Status**: ❌ FALTANDO

**event-neutral.mp3**
- **Quando**: Escolha neutra (sem ganhos/perdas significativas)
- **Status**: ❌ FALTANDO

#### Escolhas de Tensão (Probabilidade)

**tension-probability-choice.mp3**
- **Quando**: Escolha que causa tensão (pode dar certo OU errado)
- **Momento**: Ao selecionar a escolha
- **Status**: ❌ FALTANDO

**lucky-choice.mp3**
- **Quando**: Escolha de tensão DEU CERTO
- **Momento**: Tocar no resultado (após processar)
- **Status**: ❌ FALTANDO

**bad-choice.mp3**
- **Quando**: Escolha "deu azar" (resultado ruim)
- **Momento**: Tocar no resultado (após processar)
- **Status**: ❌ FALTANDO

#### Relíquia Encontrada em Evento

**impressive-show.mp3**
- **Quando**: Relíquia encontrada em evento
- **Momento**: Tocar nos "resultados" do evento
- **Status**: ❌ FALTANDO

---

### Sistema de Relíquias
📁 `/static/game.data/sounds/`

**oh-options.mp3**
- **Quando**: Ao abrir pop-up de escolha de relíquias
- **Status**: ❌ FALTANDO

#### Hover em Relíquias (uma para cada opção)
**oh-hover1.mp3**
- **Quando**: Hover na 1ª opção de relíquia
- **Comportamento**: Sons podem se interpolar (não precisa cancelar um para tocar outro)
- **Status**: ❌ FALTANDO

**oh-hover2.mp3**
- **Quando**: Hover na 2ª opção de relíquia
- **Status**: ❌ FALTANDO

**oh-hover3.mp3**
- **Quando**: Hover na 3ª opção de relíquia
- **Status**: ❌ FALTANDO

**Nota**: Se houver 4ª opção, usar oh-hover1.mp3 novamente

**oh-selection.mp3**
- **Quando**: Ao SELECIONAR e confirmar a relíquia desejada
- **Status**: ❌ FALTANDO

---

### Sistema de Lembranças (Memories)
📁 `/static/game.data/sounds/`

**memory-reward-popup-openning.wav**
- **Quando**: Ao abrir pop-up de escolha de lembranças após derrotar inimigo
- **Status**: ❌ FALTANDO

**memory-hover.mp3**
- **Quando**: Hover nos botões de escolha de lembranças
- **Status**: ❌ FALTANDO

**memory-reward-popup-selection.wav**
- **Quando**: Ao selecionar a lembrança desejada
- **Status**: ❌ FALTANDO

**Nota**: Já existem `memoryoptions.mp3` e `memoryselection.mp3` - verificar se são os mesmos

---

### Seleção de Personagens
📁 `/static/game.data/sounds/`

**choose-character-openning.mp3**
- **Quando**: Ao abrir tela de seleção de personagens (tocar UMA VEZ)
- **Status**: ❌ FALTANDO

**choose-character-hover.mp3**
- **Quando**: Ao fazer hover em opção de personagem
- **Status**: ❌ FALTANDO

**choose-character-click.mp3**
- **Quando**: Ao clicar em um personagem
- **Status**: ❌ FALTANDO

**short-bell.mp3**
- **Quando**: No hub, quando o personagem COMEÇA a run (apenas na primeira vez)
- **Momento**: Logo após selecionar personagem e ser direcionado ao hub
- **Status**: ❌ FALTANDO

---

### Sistema de Talentos
📁 `/static/game.data/sounds/`

**talents-background-sound.wav**
- **Quando**: Tocar em LOOP de fundo na tela de talentos
- **Volume**: Baixo (música ambiente)
- **Status**: ❌ FALTANDO

#### Sons de Sino para Talentos Adquiridos (alternar sequencialmente)
**talentbell1.wav** ❌ FALTANDO
**talentbell2.wav** ❌ FALTANDO
**talentbell3.wav** ❌ FALTANDO
**talentbell4.wav** ❌ FALTANDO
**talentbell5.wav** ❌ FALTANDO
**talentbell6.wav** ❌ FALTANDO

- **Quando**: Ao adquirir um talento
- **Comportamento**: Ciclar entre os 6 sons (1→2→3→4→5→6→1...)
- **Referência**: `templates/gamification/talents.html:530`

**reveal-sound.wav**
- **Quando**: Revelação de constelação secreta de talentos
- **Referência**: `templates/gamification/talents.html:548`
- **Status**: ❌ FALTANDO

---

### Sons Gerais
📁 `/static/game.data/sounds/`

**action-denial-sound.wav**
- **Quando**: Negação de ação (tentativa de ação inválida)
- **Status**: ❌ FALTANDO

---

## 📊 RESUMO DE STATUS

### ✅ SONS QUE JÁ EXISTEM:
- `defeat.mp3` (mas precisa versão .wav de 1:34)
- `memoryoptions.mp3`
- `memoryselection.mp3`
- `rewardpopup.mp3`

### ❌ SONS FALTANDO:

#### Alta Prioridade (Gameplay Core):
- Sistema de Moedas: 8 sons (coin-use1-9)
- Escolhas de Eventos: 10 sons principais
- Sistema de Lembranças: 3 sons
- Sistema de Relíquias: 5 sons

#### Média Prioridade:
- Seleção de Personagens: 4 sons
- Sistema de Talentos: 7 sons (6 bells + reveal)
- Eventos Especiais: 5 sons

#### Baixa Prioridade:
- Sons de Ambiente: 2 sons
- Sons Gerais: 1 som

**TOTAL: ~45 arquivos de áudio faltando**

---

## 🎨 DIRETRIZES DE ESTILO

### Para Sons:
- **Formato**: MP3 (128kbps) ou WAV para loops/sons longos
- **Duração**: 0.1s a 2s para SFX (exceto músicas de fundo)
- **Mixagem**: Normalizar volume, sem clipping
- **Estilo**: Dark fantasy, medieval, místico

### Comportamento de Sons Múltiplos:
- Quando há múltiplas variações (ex: coin-use1-9), **alternar** entre elas ou escolher **aleatoriamente**
- Sons de hover podem se **interpolar** (tocar simultaneamente sem cancelar)
- Sons sequenciais (talentbell1-6) devem **ciclar** em ordem

---

## 📂 ESTRUTURA DE PASTAS ATUAL

```
/static/game.data/sounds/
├── defeat.wav (1:34 - loop para tela de derrota)
├── heal-on-bonefire.wav
├── coin-use1.mp3 até coin-use9.mp3 (exceto 7)
├── event-openning.mp3
├── enemy-found.mp3, enemy-found2.mp3
├── unavailable.mp3
├── choice-*.mp3 (damage, heal, maxhp, ignore, positive, negative)
├── choice-damage1.mp3, choice-damage2.mp3
├── tension-probability-choice.mp3
├── lucky-choice.mp3, bad-choice.mp3
├── event-neutral.mp3
├── impressive-show.mp3
├── oh-options.mp3, oh-selection.mp3
├── oh-hover1.mp3, oh-hover2.mp3, oh-hover3.mp3
├── memory-reward-popup-openning.wav
├── memory-hover.mp3
├── memory-reward-popup-selection.wav
├── choose-character-openning.mp3
├── choose-character-hover.mp3
├── choose-character-click.mp3
├── short-bell.mp3
├── talents-background-sound.wav (loop)
├── talentbell1.wav até talentbell6.wav
├── reveal-sound.wav
└── action-denial-sound.wav
```

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

### 🔴 CRÍTICA (implementar primeiro):
1. Sistema de Moedas (8 sons) - usado constantemente
2. Escolhas de Eventos principais (choice-damage, choice-heal, choice-positive, choice-negative)
3. Sistema de Lembranças (3 sons) - após cada batalha
4. Talentos básicos (6 talentbells + reveal)

### 🟡 ALTA:
5. Sistema de Relíquias (5 sons)
6. Seleção de Personagens (4 sons)
7. Descanso/Bonefire (1 som)

### 🟢 MÉDIA:
8. Eventos especiais (enemy-found, tension, lucky/bad choice)
9. Som de derrota longo (defeat.wav)
10. Sons de abertura (event-openning)

### ⚪ BAIXA (polimento):
11. Sons de negação (unavailable, action-denial)
12. Background de talentos (talents-background-sound)

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

### Sons com Variações:
- **Moedas**: Implementar sistema que escolhe aleatoriamente entre as variações
- **Talentos**: Implementar contador que cicla 1→6→1...
- **Dano de escolha**: Alternar entre choice-damage1 e choice-damage2
- **Encontro de inimigo**: Alternar entre enemy-found e enemy-found2

### Sons que Precisam de Loop:
- `defeat.wav` (1:34) - loop na tela de estatísticas
- `talents-background-sound.wav` - loop na tela de talentos

### Sons de Hover que se Interpolam:
- `oh-hover1.mp3`, `oh-hover2.mp3`, `oh-hover3.mp3` - não cancelar ao trocar

---

## ✅ CHECKLIST DE INTEGRAÇÃO

- [ ] Criar diretórios se necessário
- [ ] Adicionar todos os arquivos .mp3/.wav
- [ ] Implementar sistema de alternância de sons (moedas, dano)
- [ ] Implementar sistema de ciclo (talentbells)
- [ ] Configurar loops (defeat, talents-background)
- [ ] Testar volume de cada som
- [ ] Testar interpolação de hovers
- [ ] Documentar mapeamento som→evento no código
