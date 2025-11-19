# Assets Necessários - Sistema de SHOP

## ÍCONES OBRIGATÓRIOS

### Poções (Consumíveis)
Localização: `/static/game.data/resources/`

#### 1. potion-vital.png
- **Dimensões:** 100x100 pixels (ideal) ou maior (será redimensionado)
- **Formato:** PNG com transparência
- **Tema:** Vermelho/Rosa - representa cura de HP
- **Sugestão:** Frasco vermelho com líquido brilhante, cruz de cura ou coração
- **Efeito:** Cura 20 HP

#### 2. potion-protective.png
- **Dimensões:** 100x100 pixels (ideal) ou maior
- **Formato:** PNG com transparência
- **Tema:** Azul/Ciano - representa barreira/proteção
- **Sugestão:** Frasco azul com escudo, aura protetora ou cristais
- **Efeito:** Concede 16 de Barreira

#### 3. potion-energetic.png
- **Dimensões:** 100x100 pixels (ideal) ou maior
- **Formato:** PNG com transparência
- **Tema:** Amarelo/Dourado - representa energia/mana
- **Sugestão:** Frasco amarelo com raios, estrelas ou partículas douradas
- **Efeito:** Concede 5 de Energia

---

### Vouchers e Especiais

#### 4. memory-icon.png
- **Dimensões:** 100x100 pixels (ideal) ou maior
- **Formato:** PNG com transparência
- **Tema:** Roxo/Místico - representa lembrança/memória
- **Sugestão:** Pergaminho enrolado, livro mágico ou cristal de memória
- **Uso:** Ícone genérico para vouchers de lembrança (todos raridades)

---

### Ícones Auxiliares

#### 5. gold-icon.png
- **Status:** ✅ JÁ EXISTE
- **Localização:** `/static/game.data/resources/gold-icon.png`
- **Uso:** Exibir preço ao lado dos itens

#### 6. placeholder-item.png (Opcional mas Recomendado)
- **Dimensões:** 100x100 pixels
- **Formato:** PNG com transparência
- **Tema:** Cinza neutro - ícone genérico
- **Sugestão:** Caixa com interrogação ou silhueta de item
- **Uso:** Fallback quando ícone específico não for encontrado

---

## ÍCONES DE RELÍQUIAS

**Nota:** As relíquias já devem ter seus próprios ícones definidos no sistema de relíquias existente.
Localização esperada: `/static/game.data/relics/{relic_id}.png`

Se alguma relíquia não tiver ícone:
- **Criar ícones específicos** para cada relíquia disponível na loja
- **Dimensões:** 100x100 pixels (ideal)
- **Formato:** PNG com transparência
- **Estilo:** Consistente com o tema da relíquia (mágico, guerreiro, etc)

---

## SONS (OPCIONAL MAS RECOMENDADO)

### Sons da Loja
Localização: `/static/game.data/sounds/shop/`

#### 1. shop-open.mp3 / shop-open.wav
- **Duração:** 1-2 segundos
- **Tema:** Som de porta de loja abrindo, sino de entrada
- **Uso:** Quando popup do shop aparece

#### 2. shop-close.mp3 / shop-close.wav
- **Duração:** 0.5-1 segundo
- **Tema:** Som suave de fechamento, sino saindo
- **Uso:** Quando jogador fecha o shop

#### 3. item-hover.mp3 / item-hover.wav
- **Duração:** 0.2-0.3 segundos
- **Tema:** Som sutil de destaque (ding suave, brilho)
- **Uso:** Quando mouse passa sobre item (hover)

#### 4. purchase-success.mp3 / purchase-success.wav
- **Duração:** 1-1.5 segundos
- **Tema:** Som de moedas caindo, caixa registradora, cha-ching
- **Uso:** Quando compra é realizada com sucesso

#### 5. purchase-fail.mp3 / purchase-fail.wav
- **Duração:** 0.5-1 segundo
- **Tema:** Som de erro (buzzer, sino negativo)
- **Uso:** Quando jogador não tem ouro suficiente

---

### Sons de Poções (Batalha)
Localização: `/static/game.data/sounds/battle/`

#### 6. potion-use.mp3 / potion-use.wav
- **Duração:** 0.8-1.2 segundos
- **Tema:** Som de líquido (glug glug), vidro abrindo
- **Uso:** Quando jogador usa qualquer poção na batalha

#### 7. potion-vital.mp3 / potion-vital.wav (Específico)
- **Duração:** 1-1.5 segundos
- **Tema:** Som de cura (brilho mágico ascendente, harpa)
- **Uso:** Especificamente quando usa Poção Vital

#### 8. potion-protective.mp3 / potion-protective.wav (Específico)
- **Duração:** 1-1.5 segundos
- **Tema:** Som de escudo/barreira (campo de força, cristal)
- **Uso:** Especificamente quando usa Poção Protetora

#### 9. potion-energetic.mp3 / potion-energetic.wav (Específico)
- **Duração:** 1-1.5 segundos
- **Tema:** Som de energia (zap elétrico, power-up)
- **Uso:** Especificamente quando usa Poção Energética

---

## RESUMO DE PRIORIDADES

### CRÍTICO (Sistema não funciona sem):
1. ✅ gold-icon.png (JÁ EXISTE)
2. ⚠️ **potion-vital.png**
3. ⚠️ **potion-protective.png**
4. ⚠️ **potion-energetic.png**
5. ⚠️ **memory-icon.png**

### ALTA PRIORIDADE (Experiência visual completa):
6. placeholder-item.png (fallback)
7. Ícones de todas as relíquias disponíveis

### MÉDIA PRIORIDADE (Feedback sonoro):
8. purchase-success.mp3
9. purchase-fail.mp3
10. potion-use.mp3

### BAIXA PRIORIDADE (Polimento):
11. shop-open.mp3
12. shop-close.mp3
13. item-hover.mp3
14. Sons específicos de cada poção

---

## ESPECIFICAÇÕES TÉCNICAS

### Formato de Imagens
- **Formato recomendado:** PNG-24 com canal alpha (transparência)
- **Resolução:** 100x100 pixels (ideal), aceita maior
- **Tamanho de arquivo:** < 100KB por ícone
- **Background:** Transparente
- **Estilo:** Consistente com arte do jogo (pixel art, cartoon, realista, etc)

### Formato de Áudio
- **Formatos aceitos:** MP3 (recomendado), WAV, OGG
- **Taxa de bits:** 128-192 kbps (MP3)
- **Taxa de amostragem:** 44.1 kHz
- **Canais:** Mono ou Stereo
- **Tamanho:** < 200KB por som

---

## LOCALIZAÇÃO DOS ARQUIVOS

```
/static/game.data/
├── resources/
│   ├── gold-icon.png (✅ JÁ EXISTE)
│   ├── potion-vital.png (⚠️ CRIAR)
│   ├── potion-protective.png (⚠️ CRIAR)
│   ├── potion-energetic.png (⚠️ CRIAR)
│   ├── memory-icon.png (⚠️ CRIAR)
│   └── placeholder-item.png (opcional)
├── relics/
│   └── {relic_id}.png (verificar quais faltam)
└── sounds/
    ├── shop/
    │   ├── shop-open.mp3
    │   ├── shop-close.mp3
    │   ├── item-hover.mp3
    │   ├── purchase-success.mp3
    │   └── purchase-fail.mp3
    └── battle/
        ├── potion-use.mp3
        ├── potion-vital.mp3
        ├── potion-protective.mp3
        └── potion-energetic.mp3
```

---

## FONTES GRATUITAS SUGERIDAS

### Ícones
- **OpenGameArt.org** - Arte de jogos open-source
- **Itch.io Assets** - Assets gratuitos para jogos
- **Kenney.nl** - Pacotes de assets gratuitos (recomendado!)
- **Game-icons.net** - Ícones SVG para jogos

### Sons
- **Freesound.org** - Efeitos sonoros gratuitos
- **OpenGameArt.org** - Áudio de jogos
- **Zapsplat.com** - Biblioteca de sons gratuitos
- **Mixkit.co** - Sons e música gratuitos

---

## PRÓXIMOS PASSOS

1. **Criar/Baixar os 4 ícones críticos** (potion-vital, potion-protective, potion-energetic, memory-icon)
2. **Colocar na pasta** `/static/game.data/resources/`
3. **Verificar ícones de relíquias** existentes
4. **Testar o shop** após adicionar os ícones
5. **Adicionar sons** conforme disponibilidade (opcional)

---

## NOTAS IMPORTANTES

- **Consistência visual**: Todos os ícones devem ter estilo similar
- **Tamanho uniforme**: Use sempre 100x100px ou múltiplos (200x200, 400x400)
- **Transparência**: Sempre use PNG com fundo transparente
- **Nomenclatura**: Use exatamente os nomes listados acima (case-sensitive)
- **Otimização**: Comprima imagens para web (TinyPNG, ImageOptim)

---

**Status Atual:** ⚠️ 4 ícones críticos precisam ser criados antes do sistema funcionar completamente.

**Tempo estimado:** 30-60 minutos para criar/baixar todos os assets críticos.
