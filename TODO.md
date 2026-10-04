# TODO - Bugs Pendentes

## Bugs Conhecidos (Para Corrigir Depois)

Nenhum bug conhecido em aberto. Planejamento e próximos passos: ver [ROADMAP.md](ROADMAP.md).

---

## Bugs Corrigidos Recentemente

### ✅ Recompensa não aparecia após derrotar inimigo (às vezes) e o jogador ficava preso no nó
**Corrigido em**: 2026-10-04
**Solução**:
- Sessão só é gravada quando muda (`SESSION_REFRESH_EACH_REQUEST = False`): requisições paralelas
  sobrescreviam a sessão umas das outras e a lembrança/relíquia pendente sumia
- O servidor conclui o nó de batalha/elite quando o inimigo morre (`routes/map_modules/progress.py`);
  `/map/api/complete-node` ficou idempotente; saves já travados são destravados ao abrir o mapa
- O hub sempre verifica recompensa pendente ao abrir; recompensas antigas não coletadas são somadas
  na próxima coleta e apagadas ao iniciar nova run
- Erros de JS na atualização visual pós-ataque não impedem mais o fluxo de vitória
- Testes: `tests/test_regressions.py`

### ✅ Shop não atualizava itens entre diferentes nodes do mapa
**Corrigido em**: 2026-01-21 (PR #47) — inventário da loja é por nó e é limpo ao resetar a run

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
