# Associação de Novos Ícones aos Eventos

Este documento lista quais eventos devem usar os novos ícones quando estiverem disponíveis.

## Ícones Novos Esperados

1. **choice-power.png** - Ataques mágicos/poder/energia
2. **choice-vitality.png** ou **choice-shield.png** - HP/defesa/escudo
3. **choice-study.png** - Aprendizado/estudo/livros
4. **choice-curse.png** - Perigo/maldição/risco
5. **choice-heal.png** - Cura/poções
6. **choice-gold.png** - Ganhar ouro especificamente

---

## Eventos que Precisam dos Novos Ícones

### 🔮 choice-power.png (Poder/Magia)

**Forja Sombria** (forja_sombria):
- `fortalecer_poder` - "Fortalecer ataque de poder"
  - **Atual**: choice-rest.png ❌
  - **Novo**: choice-power.png ✅

**Altar do Sangue Antigo** (altar_sangue_antigo):
- `oferecer_sangue` - "Oferecer sangue" (ganhar dano)
  - **Atual**: choice-rest.png ❌
  - **Novo**: choice-power.png ✅

**Biblioteca Proibida** (biblioteca_proibida):
- `estudar_ofensiva` - "Estudar magia ofensiva"
  - **Atual**: choice-inspect.png ⚠️
  - **Novo**: choice-power.png ✅

**Poço dos Desejos** (poco_desejos):
- `desejo_poder` - "Desejar poder supremo"
  - **Atual**: choice-attack.png ⚠️
  - **Novo**: choice-power.png ✅

---

### 🛡️ choice-vitality.png / choice-shield.png (HP/Defesa)

**Forja Sombria** (forja_sombria):
- `reforcar_barreira` - "Aumentar vitalidade"
  - **Atual**: choice-rest.png ❌
  - **Novo**: choice-vitality.png ✅

**Câmara de Regeneração** (camara_regeneracao):
- `banho_regenerador` - "Banho regenerador" (+8 HP Max)
  - **Atual**: choice-rest.png ⚠️
  - **Novo**: choice-vitality.png ✅

**Poço dos Desejos** (poco_desejos):
- `desejo_saude` - "Desejar saúde eterna" (+15 HP Max)
  - **Atual**: choice-rest.png ⚠️
  - **Novo**: choice-vitality.png ✅

---

### 📚 choice-study.png (Aprendizado/Estudo)

**Biblioteca Proibida** (biblioteca_proibida):
- `estudar_ofensiva` - "Estudar magia ofensiva"
  - **Atual**: choice-inspect.png ⚠️
  - **Alternativa**: choice-study.png ✅
- `estudar_defensiva` - "Estudar técnicas defensivas"
  - **Atual**: choice-inspect.png ⚠️
  - **Alternativa**: choice-study.png ✅

**Vampiro Ancião** (vampiro_anciao):
- `aprender_tecnica` - "Aprender técnica"
  - **Atual**: choice-inspect.png ⚠️
  - **Novo**: choice-study.png ✅

---

### ☠️ choice-curse.png (Perigo/Maldição)

**Altar do Sangue Antigo** (altar_sangue_antigo):
- `destruir_altar` - "Destruir o altar" (chance de debuff)
  - **Atual**: choice-attack.png ⚠️
  - **Novo**: choice-curse.png ✅

**Tesouro Amaldiçoado** (tesouro_amaldicoado):
- `pegar_tudo` - "Pegar tudo do baú" (ouro + perde relíquia)
  - **Atual**: choice-trade.png ❌
  - **Novo**: choice-curse.png ✅

**Goblin Vendedor** (goblin_vendedor):
- `aceitar_misterio` - "Aceitar pacote misterioso" (33% chance cada)
  - **Atual**: choice-trade.png ⚠️
  - **Novo**: choice-curse.png ✅

---

### 💊 choice-heal.png (Cura/Poções)

**Fonte de Sangue** (fonte_de_sangue):
- `beber` - "Beber da fonte" (curar 30%)
  - **Atual**: choice-rest.png ⚠️
  - **Novo**: choice-heal.png ✅
- `banhar` - "Banhar-se na fonte" (curar 15% + HP Max)
  - **Atual**: choice-rest.png ⚠️
  - **Novo**: choice-heal.png ✅

**Câmara de Regeneração** (camara_regeneracao):
- `usar_capsula` - "Usar cápsula avançada" (curar todo HP)
  - **Atual**: choice-rest.png ⚠️
  - **Novo**: choice-heal.png ✅

**Herói Ferido** (heroi_ferido):
- `ajudar_curar` - "Ajudar e curar" (curar 20 HP + ouro)
  - **Atual**: choice-accept.png ⚠️
  - **Novo**: choice-heal.png ✅

---

### 💰 choice-gold.png (Ganhar Ouro)

**Comerciante Sombrio** (comerciante_sombrio):
- `comprar_segredo` - "Comprar o segredo"
  - **Atual**: choice-trade.png ⚠️
  - **Novo**: choice-gold.png ou manter trade ✅

**Caçador de Recompensas** (cacador_recompensas):
- `vender_info` - "Vender informação sobre o alvo"
  - **Atual**: choice-trade.png ⚠️
  - **Novo**: choice-gold.png ✅

**Herói Ferido** (heroi_ferido):
- `roubar` - "Roubar o ferido" (60 ouro)
  - **Atual**: choice-attack.png ⚠️
  - **Novo**: choice-gold.png ✅

**Goblin Vendedor** (goblin_vendedor):
- `vender_lixo` - "Vender itens inúteis" (40-60 ouro)
  - **Atual**: choice-trade.png ⚠️
  - **Novo**: choice-gold.png ✅

---

## Como Aplicar os Novos Ícones

Quando os ícones estiverem disponíveis em `static/game.data/events/choices/`:

1. Execute o script de otimização:
   ```bash
   python scripts/optimize_choice_icons.py
   ```

2. Atualize o arquivo `routes/map_modules/events.py` conforme indicado acima

3. Ou use este script para fazer as substituições automaticamente:
   ```python
   # TODO: Criar script de associação automática
   ```

---

## Resumo de Mudanças Necessárias

- **choice-power.png**: 4 substituições
- **choice-vitality.png**: 3 substituições
- **choice-study.png**: 3 substituições
- **choice-curse.png**: 3 substituições
- **choice-heal.png**: 5 substituições
- **choice-gold.png**: 4 substituições

**Total**: 22 escolhas que se beneficiariam dos novos ícones
