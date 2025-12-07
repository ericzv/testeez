# Instruções para Atualizar Imagens dos Eventos

## ✅ O que foi feito

1. **Estrutura de eventos atualizada** ✅
   - Cada evento agora tem dois campos: `image` (imagem principal) e `icon` (ícone pequeno)
   - Os ícones antigos foram preservados e serão exibidos ao lado do título

2. **Frontend atualizado** ✅
   - Template modificado para mostrar:
     - Ícone ao lado do título do evento
     - Imagem principal grande no card do evento
   - Suporte a WebP para melhor performance

3. **Scripts criados** ✅
   - `update_event_images.py`: Já executado, atualizou os eventos com os novos caminhos
   - `optimize_event_images.py`: Pronto para otimizar as imagens quando você copiá-las

## 📝 O que VOCÊ precisa fazer agora

### Passo 1: Copiar as imagens

Copie suas 21 imagens para o diretório:
```
static/game.data/events/images/
```

As imagens devem ter **exatamente** estes nomes:

| Evento | Nome do arquivo |
|--------|----------------|
| Túmulo Profanado | `tomb.png` |
| Comerciante Sombrio | `dark_merchant.png` |
| Altar do Sangue Antigo | `blood_altar.png` |
| Relicário Abandonado | `reliquary.png` |
| Fonte de Sangue | `blood_fountain.png` |
| Vampiro Ancião | `ancient_vampire.png` |
| Câmara de Regeneração | `regen_chamber.png` |
| Tesouro Amaldiçoado | `cursed_treasure.png` |
| Caçador de Recompensas | `bounty_hunter.png` |
| Roda da Fortuna | `fortune_wheel.png` |
| Forja Sombria | `shadow_forge.png` |
| Biblioteca Proibida | `forbidden_library.png` |
| Mestre de Armas Aposentado | `weapon_master.png` |
| Espelho da Verdade | `truth_mirror.png` |
| Demônio Tentador | `tempter_demon.png` |
| Poço dos Desejos | `wishing_well.png` |
| Fantasma do Herói Caído | `ghost_hero.png` |
| Encruzilhada Mística | `mystic_crossroads.png` |
| Goblin Vendedor | `goblin_merchant.png` |
| Aposta com a Morte | `death_gamble.png` |
| Espelho Dimensional | `dimensional_mirror.png` |

### Passo 2: Otimizar as imagens

Depois de copiar todas as imagens, execute:

```bash
python3 optimize_event_images.py
```

Este script irá:
- ✅ Criar backup das originais em `_originals/`
- ✅ Redimensionar se necessário (máx 800x800px)
- ✅ Otimizar os PNGs
- ✅ Gerar versões WebP (muito menores, melhor performance)
- ✅ Mostrar estatísticas de redução de tamanho

### Passo 3: Testar

Após otimizar, teste um evento no jogo para verificar se:
- O ícone aparece ao lado do título ✓
- A imagem principal grande aparece corretamente ✓
- As imagens carregam rápido (graças ao WebP) ✓

## 📊 Resultado esperado

Antes:
```
┌─────────────────────┐
│   Túmulo Profanado  │  ← Só título
├─────────────────────┤
│                     │
│   [ícone pequeno]   │  ← Ícone sendo usado como imagem principal
│                     │
└─────────────────────┘
```

Depois:
```
┌─────────────────────┐
│ 🏺 Túmulo Profanado │  ← Título + ícone
├─────────────────────┤
│                     │
│  [IMAGEM GRANDE]    │  ← Nova imagem específica do evento
│   tomb.png          │
│                     │
└─────────────────────┘
```

## 🎯 Benefícios

1. **Imagens específicas**: Cada evento tem sua própria imagem única
2. **Ícones preservados**: Os ícones antigos são mostrados no título
3. **Performance**: WebP reduz tamanho em ~70%
4. **Backups**: Originais preservados em `_originals/`

## ❓ Dúvidas

- **Posso usar JPG?** Não, apenas PNG. O script converte para WebP automaticamente.
- **E se eu não tiver todas as 21 imagens?** O evento sem imagem mostrará um placeholder "❓"
- **Posso mudar os nomes?** Não, use exatamente os nomes listados acima.
- **E se der erro?** Verifique se as imagens estão no diretório correto e rode o script novamente.

## 🚀 Pronto!

Depois de copiar e otimizar, faça commit das mudanças e teste! 🎉
