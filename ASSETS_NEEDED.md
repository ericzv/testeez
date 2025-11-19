# Assets Necessários - Sistema de Eventos

## 🎵 SONS NECESSÁRIOS

### Eventos - Escolhas e Resultados
Localização: `/static/game.data/sounds/events/`

1. **event-choice-hover.mp3**
   - Quando: Mouse passa por cima de uma opção de escolha
   - Como deve ser: Som sutil, curto (0.1s), tipo "tick" suave
   - Volume: Baixo, não intrusivo

2. **event-choice-select.mp3**
   - Quando: Clica em uma escolha
   - Como deve ser: Som de confirmação, tipo "click" satisfatório (0.2s)
   - Volume: Médio

3. **event-positive.mp3**
   - Quando: Resultado positivo (ganhou HP, gold, relíquia)
   - Como deve ser: Som alegre, ascendente, tipo "ding" brilhante (0.5s)
   - Volume: Médio-alto
   - Exemplos: ganhar moedas, curar HP, encontrar item

4. **event-negative.mp3**
   - Quando: Resultado negativo (perdeu HP, gold, debuff)
   - Como deve ser: Som pesado, descendente, tipo "thud" sombrio (0.5s)
   - Volume: Médio
   - Exemplos: perder recursos, tomar dano, falha

5. **event-neutral.mp3**
   - Quando: Resultado neutro (nada aconteceu, passou direto)
   - Como deve ser: Som suave de página virando (0.3s)
   - Volume: Baixo-médio

6. **event-combat-trigger.mp3**
   - Quando: Escolha que inicia combate
   - Como deve ser: Som de alerta tenso, tipo sino de batalha (0.8s)
   - Volume: Alto
   - Deve causar tensão, avisar perigo

7. **event-rare.mp3**
   - Quando: Encontra evento raro (5% chance)
   - Como deve ser: Som místico, especial, jingle curto (1s)
   - Volume: Médio-alto
   - Deve parecer "sorte", "descoberta especial"

### Mapa - Navegação
Localização: `/static/game.data/sounds/map/`

8. **map-node-available.mp3**
   - Quando: Nós do próximo nível ficam disponíveis
   - Como deve ser: Som sutil de "desbloqueio" (0.3s)
   - Volume: Baixo

9. **map-node-select.mp3**
   - Quando: Clica em um nó do mapa
   - Como deve ser: Som de seleção firme (0.2s)
   - Volume: Médio

10. **map-act-complete.mp3**
    - Quando: Derrota boss final e avança de ato
    - Como deve ser: Som épico de conquista, fanfarra curta (2s)
    - Volume: Alto
    - Deve transmitir sensação de progresso importante

### Recursos - Ganhos/Perdas
Localização: `/static/game.data/sounds/resources/`

11. **gold-gain.mp3**
    - Quando: Ganha gold (eventos, vitórias)
    - Como deve ser: Som de moedas tilintando (0.4s)
    - Volume: Médio
    - Já existe "currency-up.mp3" mas pode melhorar

12. **gold-loss.mp3**
    - Quando: Perde/gasta gold
    - Como deve ser: Som de moedas caindo/perdendo (0.3s)
    - Volume: Médio

13. **hp-heal.mp3**
    - Quando: Cura HP (eventos, descanso)
    - Como deve ser: Som suave de cura, tipo "restauração" (0.5s)
    - Volume: Médio

14. **hp-damage.mp3**
    - Quando: Toma dano de evento
    - Como deve ser: Som de impacto, dor (0.3s)
    - Volume: Médio-alto

15. **relic-discover.mp3**
    - Quando: Ganha relíquia de evento
    - Como deve ser: Som especial de descoberta, mágico (0.8s)
    - Volume: Alto
    - Deve parecer item raro e importante

---

## 🎨 ÍCONES NECESSÁRIOS (PNG, 64x64px)

### Eventos - Substituir Emojis
Localização: `/static/game.data/events/icons/`

Estilo: Dark fantasy, pixel art ou hand-drawn, tons escuros com detalhes coloridos

1. **shrine.png** (Santuário Antigo)
   - Substitui: 🏛️
   - Descrição: Ruínas de templo com aura brilhante

2. **chest.png** (Baú Abandonado)
   - Substitui: 📦
   - Descrição: Baú de madeira escura, trancado

3. **merchant.png** (Mercador Errante)
   - Substitui: 🎭
   - Descrição: Figura encapuzada com itens

4. **well.png** (Poço dos Desejos)
   - Substitui: 🌊
   - Descrição: Poço de pedra com água brilhante

5. **shrine-mysterious.png** (Altar Misterioso)
   - Substitui: 🗿
   - Descrição: Altar de pedra com símbolos místicos

6. **fountain.png** (Fonte Curativa)
   - Substitui: ⛲
   - Descrição: Fonte com água cristalina brilhando

7. **library.png** (Biblioteca Esquecida)
   - Substitui: 📚
   - Descrição: Estante com livros antigos, poeira

8. **campfire.png** (Fogueira Solitária)
   - Substitui: 🔥
   - Descrição: Fogueira acesa com cinzas ao redor

9. **statue.png** (Estátua Guardiã)
   - Substitui: 🗿
   - Descrição: Estátua de guerreiro com olhos brilhantes

10. **treasure.png** (Tesouro Escondido)
    - Substitui: 💎
    - Descrição: Pilha de moedas e gemas

11. **mirror.png** (Espelho Sombrio)
    - Substitui: 🪞
    - Descrição: Espelho ornamentado com reflexo distorcido

12. **goblin.png** (Goblin Vendedor)
    - Substitui: 👺
    - Descrição: Goblin com mercadorias

13. **portal.png** (Portal Instável)
    - Substitui: 🌀
    - Descrição: Portal mágico com energia instável

14. **offering.png** (Oferenda Profana)
    - Substitui: 🕯️
    - Descrição: Altar com velas e símbolos

15. **trap.png** (Armadilha Antiga)
    - Substitui: ⚠️
    - Descrição: Mecanismo de armadilha visível

16. **garden.png** (Jardim Venenoso)
    - Substitui: 🌿
    - Descrição: Plantas tóxicas com névoa verde

17. **crossroads.png** (Encruzilhada do Destino)
    - Substitui: ⚔️
    - Descrição: Três caminhos divergentes com placas

18. **forge.png** (Forja Abandonada)
    - Substitui: 🔨
    - Descrição: Bigorna e fogo aceso

19. **cards.png** (Jogo de Cartas Sombrio)
    - Substitui: 🎴
    - Descrição: Cartas místicas espalhadas

20. **tree.png** (Árvore Ancestral)
    - Substitui: 🌳
    - Descrição: Árvore antiga com rosto

21. **cage.png** (Gaiola Esquecida)
    - Substitui: 🗝️
    - Descrição: Gaiola com correntes quebradas

### Escolhas - Ícones de Ação
Localização: `/static/game.data/events/choices/`

22. **choice-accept.png**
    - Descrição: Mão aceitando/pegando

23. **choice-refuse.png**
    - Descrição: Mão recusando/empurrando

24. **choice-attack.png**
    - Descrição: Espada em posição de ataque

25. **choice-pray.png**
    - Descrição: Mãos em oração

26. **choice-inspect.png**
    - Descrição: Lupa ou olho investigando

27. **choice-rest.png**
    - Descrição: Figura descansando

28. **choice-run.png**
    - Descrição: Pés correndo/fugindo

29. **choice-trade.png**
    - Descrição: Moedas sendo trocadas

30. **choice-destroy.png**
    - Descrição: Martelo destruindo

### Recursos - Indicadores
Localização: `/static/game.data/resources/`

31. **hp-icon.png**
    - Descrição: Coração com cruz vermelha

32. **maxhp-icon.png**
    - Descrição: Coração com seta para cima/baixo

33. **gold-icon.png**
    - Descrição: Pilha de moedas douradas
    - (Já existe gold.png, mas pode melhorar)

34. **relic-icon-rare.png**
    - Descrição: Ícone de relíquia com brilho especial
    - (Para eventos raros que dão relíquias)

---

## 📋 PRIORIDADE DE IMPLEMENTAÇÃO

### ALTA (fazer primeiro):
- Sons: event-positive, event-negative, event-choice-select
- Ícones: Todos os 21 eventos principais (shrine.png até cage.png)

### MÉDIA:
- Sons: event-rare, event-combat-trigger, map-act-complete
- Ícones: Escolhas (choice-*.png)

### BAIXA (polimento):
- Sons: event-choice-hover, map-node-available
- Ícones: Recursos extras

---

## 🎨 DIRETRIZES DE ESTILO

### Para Sons:
- Formato: MP3, 128kbps
- Duração: 0.1s a 2s (sons curtos, sem música longa)
- Mixagem: Normalizar volume, sem clipping
- Estilo: Dark fantasy, medieval, místico

### Para Ícones:
- Tamanho: 64x64 pixels
- Formato: PNG com transparência
- Estilo: Pixel art ou hand-drawn, consistente
- Paleta: Tons escuros (cinza, marrom, preto) com detalhes coloridos
- Consistência: Todos devem parecer do mesmo jogo
- Referência visual: Similar ao estilo de Slay the Spire, Darkest Dungeon

---

## 📂 ESTRUTURA DE PASTAS

```
/static/game.data/
├── sounds/
│   ├── events/
│   │   ├── event-choice-hover.mp3
│   │   ├── event-choice-select.mp3
│   │   ├── event-positive.mp3
│   │   ├── event-negative.mp3
│   │   ├── event-neutral.mp3
│   │   ├── event-combat-trigger.mp3
│   │   └── event-rare.mp3
│   ├── map/
│   │   ├── map-node-available.mp3
│   │   ├── map-node-select.mp3
│   │   └── map-act-complete.mp3
│   └── resources/
│       ├── gold-gain.mp3
│       ├── gold-loss.mp3
│       ├── hp-heal.mp3
│       ├── hp-damage.mp3
│       └── relic-discover.mp3
└── events/
    ├── icons/
    │   ├── shrine.png
    │   ├── chest.png
    │   └── ... (21 eventos)
    └── choices/
        ├── choice-accept.png
        ├── choice-refuse.png
        └── ... (9 escolhas)
```
