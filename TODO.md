# TODO - Bugs Pendentes

## Bugs Conhecidos (Para Corrigir Depois)

### 1. Shop não atualiza itens entre diferentes nodes do mapa
**Descrição**: Quando o jogador muda de node no mapa procedural, a loja deveria mostrar itens diferentes, mas está mantendo os mesmos itens do shop anterior.

**Status**: Pendente
**Prioridade**: Alta
**Localização**: Sistema de shop/loja - routes relacionadas ao mapa e shop

**Notas**:
- Cada node do tipo "shop" deve ter sua própria seleção de itens aleatórios
- Ao visitar um novo shop node, os itens devem ser regenerados/diferentes
- Possível causa: cache dos itens não está sendo limpo entre nodes
- Possível causa: seed/random dos itens não está sendo recalculado por node
- Verificar se items estão sendo carregados de forma estática ao invés de dinâmica
- Arquivos relacionados: routes/map*.py, routes/items.py ou routes/shop.py

**Data de identificação**: 2025-11-22

---

### 2. Recompensa não aparece após derrotar inimigo (às vezes)
**Descrição**: Às vezes, após derrotar um inimigo, o jogador volta para o hub mas a recompensa não aparece. Quando isso acontece, o jogador também não consegue avançar de node e precisa começar outra batalha no mesmo node.

**Status**: Pendente
**Prioridade**: CRÍTICA
**Localização**: Sistema de recompensas pós-batalha - routes/battle.py, hub.html

**Notas**:
- Bug intermitente (nem sempre acontece)
- Quando ocorre, bloqueia progresso do jogador
- Possível causa: pending_rewards não está sendo salvo corretamente na session
- Possível causa: redirecionamento para hub acontece antes de salvar recompensas
- Possível causa: localStorage de vitória recente não está sendo setado
- Verificar fluxo: damage_boss() → session['pending_rewards'] → hub checkForRecentVictory()
- Arquivos relacionados: routes/battle.py (damage_boss), templates/gamification/hub.html

**Data de identificação**: 2025-11-22

---

## Bugs Corrigidos Recentemente

### ✅ Lâmina de Sangue não funcionava contra LastBoss
**Corrigido em**: 2025-11-24
**Solução**:
- Corrigido detecção de tipo de inimigo (LastBoss vs GenericEnemy)
- Usar `is_active` ao invés de `is_available` para bosses
- Limpar `selected_boss_id` ao invés de `selected_enemy_id`
- Buscar e calcular recompensas corretas para cada tipo
- **Nota**: A skill não tem lifesteal por design, o problema real era o dano não matar o boss corretamente

### ✅ Autofagia - Bônus de dano persistia indefinidamente
**Corrigido em**: 2025-11-24
**Solução**:
- Movido lógica de decremento de buffs para fora do `if ignore_defense`
- Agora TODOS os buffs com `duration_type == "attacks"` são decrementados corretamente
- Bônus de +5 de dano agora é consumido após 1 ataque

### ✅ HP máximo não persistia entre eventos e batalhas
**Corrigido em**: 2025-11-17
**Solução**: Removido overwrite do cache de defesa que estava sobrescrevendo max_hp

### ✅ Boss final node não funcionava
**Corrigido em**: 2025-11-17
**Solução**: Implementado sistema de criação automática de bosses usando definições do BOSS_DATA

### ✅ Elite nodes usando inimigo genérico ao invés de boss
**Corrigido em**: 2025-11-17
**Solução**: Adicionado verificação para selected_boss_id na lógica de fallback

### ✅ Goblin Vendedor causava softlock sem gold
**Corrigido em**: 2025-11-17
**Solução**: Adicionada opção "Ir embora" sem requisitos

### ✅ Mapa não resetava ao morrer
**Corrigido em**: 2025-11-17
**Solução**: Implementado reset completo de MapNode, ProceduralMap e PlayerMapProgress

### ✅ Eventos de combate não iniciavam batalha
**Corrigido em**: 2025-11-17
**Solução**: Implementado sistema de requires_combat flag e redirecionamento automático

### ✅ Ato 2 não gerava após derrotar boss do Ato 1
**Corrigido em**: 2025-11-17
**Solução**: Implementado avanço automático de ato ao completar node de boss

### ✅ Batalha contra elite retornava 302 redirect
**Corrigido em**: 2025-11-17
**Solução**: Criado route handler `/map/battle/elite/<boss_id>` que estava faltando

### ✅ AttributeError ao resetar run após morte
**Corrigido em**: 2025-11-18
**Solução**: Corrigido `map_id` para `current_map_id` em reset_player_run(), relíquias agora são deletadas (não apenas desativadas), nodes_visited corrigido para '[]' (JSON array)

### ✅ AttributeError ao avançar de ato
**Corrigido em**: 2025-11-18
**Solução**: Corrigido `progress.map_id` para `progress.current_map_id` em complete_current_node()

### ✅ Elite/Boss battles não abriam (302 redirect loop)
**Corrigido em**: 2025-11-18
**Solução**:
- Frontend (hub.html) estava chamando selectBoss() diretamente ao invés de usar routes corretos
- Criado route /map/battle/boss/<boss_id> para bosses finais
- Ambos elite e boss agora redirecionam para routes que criam/ativam/selecionam o boss corretamente
