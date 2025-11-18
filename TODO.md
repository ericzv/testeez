# TODO - Bugs Pendentes

## Bugs Conhecidos (Para Corrigir Depois)

### 1. Lâmina de Sangue não funciona no LastBoss
**Descrição**: O lifesteal da skill "Lâmina de Sangue" não está funcionando quando usado contra bosses (LastBoss).

**Status**: Pendente
**Prioridade**: Média
**Localização**: Sistema de lifesteal em `routes/battle_modules/` ou processamento de skills

**Notas**:
- Funciona corretamente contra inimigos genéricos
- Parece ser um problema específico da classe LastBoss
- Verificar se o cálculo de lifesteal está sendo aplicado corretamente para bosses

---

### 2. Autofagia - Bonus de dano persiste por muito tempo
**Descrição**: O bônus de dano da skill "Autofagia" está ficando ativo por mais tempo do que deveria.

**Status**: Pendente
**Prioridade**: Média
**Localização**: Sistema de buffs/debuffs ou processamento da skill Autofagia

**Notas**:
- O buff de dano deve durar apenas por um turno ou por uma ação específica
- Atualmente persiste por múltiplos turnos
- Verificar sistema de duração de buffs e limpeza de efeitos temporários

---

## Bugs Corrigidos Recentemente

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
