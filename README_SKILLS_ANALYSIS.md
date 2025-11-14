# ANÁLISE COMPLETA DO SISTEMA DE SKILLS - Índice Geral

Este diretório contém documentação completa sobre o sistema de skills especiais e battaglia do projeto Testeez.

## Documentos Criados

1. **ANALISE_SKILLS.md** (Arquivo Principal)
   - Análise detalhada de todas as skills especiais (Autofagia, Aura Vampírica, Domínio Mental, Abraço Sanguíneo)
   - Estrutura completa de modelos de banco de dados
   - Sistema de chamada de skills (routes e front-end)
   - Implementação da lógica de skills
   - Aplicação de buffs e efeitos
   - Sistema de cargas e cooldown
   - Ataques do Vlad (Energia Escura, Garras Sangrentas, Abraço da Escuridão, Beijo da Morte)
   - Sistema de turnos na batalha
   - Banco de dados do jogador
   - Fluxo completo de skill especial
   - Resumo de arquivos principais

2. **SKILLS_QUICK_REFERENCE.md** (Referência Rápida)
   - Tabelas resumidas de skills e ataques
   - Localização dos arquivos principais
   - Fluxo de chamada simplificado
   - Sistema de cargas explicado brevemente
   - Aplicação de buffs resumida
   - Sistema de turnos do inimigo
   - Campos principais do banco
   - Rotas HTTP úteis
   - Instruções de debug e teste

3. **IMPLEMENTACAO_SANGUE.md** (Guia de Implementação)
   - Passo a passo para adicionar sistema de acúmulo de sangue
   - Mudanças necessárias em models.py
   - Modificações em characters.py
   - Atualização de rotas em routes/battle.py
   - Código JavaScript para front-end
   - Estilos CSS para visualização
   - Funções auxiliares em skill_effects.py
   - Instruções de testes e validação

4. **FILES_SUMMARY.md** (Resumo de Arquivos)
   - Estrutura completa de diretórios
   - Localização de cada arquivo importante
   - Linhas específicas de cada função
   - Diagrama de fluxo de dados
   - Tabelas de localização de skills e ataques
   - Estrutura de modelos de banco
   - Descrição de funções críticas
   - Rotas HTTP documentadas
   - Checklist de alterações necessárias
   - Comandos úteis para testing

5. **README_SKILLS_ANALYSIS.md** (Este Arquivo)
   - Índice geral da documentação

---

## Localização Rápida dos Arquivos do Projeto

### Código-Fonte Principal

| Tipo | Arquivo | Função Principal |
|------|---------|------------------|
| **Modelos** | `/home/user/testeez/models.py` | Define estrutura de banco (SpecialSkill, PlayerSkill, ActiveBuff, Player) |
| **Skills** | `/home/user/testeez/characters.py` | Definições e lógica de skills especiais e ataques |
| **Efeitos** | `/home/user/testeez/skill_effects.py` | Efeitos especiais de skills |
| **Rotas** | `/home/user/testeez/routes/battle.py` | Endpoints HTTP para ativar skills |
| **Turnos** | `/home/user/testeez/routes/battle_modules/battle_turns.py` | Sistema de ações do inimigo |
| **UI** | `/home/user/testeez/static/js/battle-skills-system.js` | Exibição de skills no front-end |
| **Dados** | `/home/user/testeez/static/game.data/enemy_skills_data.json` | Dados das skills dos inimigos |

---

## Estrutura das Skills Especiais do Vlad

```
Autofagia (ID 138)
├─ Cooldown: 10 horas
├─ Duração: 4 ataques
├─ Efeito: +25% crit chance, +50% crit damage
└─ Custo: 25% do max HP

Aura Vampírica (ID 139)
├─ Cooldown: 10 horas
├─ Duração: 4 horas (tempo real)
├─ Efeito: +15% lifesteal
└─ Custo: Nenhum

Domínio Mental (ID 140)
├─ Cooldown: 18 horas
├─ Duração: 1 ataque
├─ Efeito: 70% de controle
└─ Custo: 40% do max MP

Abraço Sanguíneo (ID 141)
├─ Cooldown: 48 horas
├─ Duração: 1 ataque
├─ Efeito: Dano máximo supremo
└─ Custo: Nenhum
```

---

## Fluxo de Execução de uma Skill

```
1. Front-end clica no botão de skill
   ↓
2. POST /gamification/use_special?skill_id=138
   ↓
3. Rota valida player, skill e cargas
   ↓
4. Chama use_special_skill(player_id, skill_id)
   ↓
5. Função aplica efeitos positivos (buffs)
   ↓
6. Função aplica efeitos negativos (hp/mp cost)
   ↓
7. Decrementa charges e registra log
   ↓
8. Retorna JSON com resultado
   ↓
9. Front-end exibe animação e atualiza UI
```

---

## Modelos de Banco de Dados

### Player
- HP e energia
- Personagem selecionado (character_id = "vlad")
- Acumuladores de bônus

### SpecialSkill
- Definição completa da skill
- Cooldown e cargas máximas
- Efeitos positivos e negativos
- Duração (em tempo ou ataques)

### PlayerSkill
- Associação jogador-skill
- Cargas atuais
- Último tempo de carga

### ActiveBuff
- Buff ativo no jogador
- Tipo e valor do efeito
- Duração restante

---

## Como Usar Esta Documentação

### Para Entender o Sistema Completo
1. Leia **ANALISE_SKILLS.md** seção por seção
2. Use **FILES_SUMMARY.md** para encontrar linhas específicas de código

### Para Implementar Sangue
1. Siga **IMPLEMENTACAO_SANGUE.md** na ordem apresentada
2. Use **SKILLS_QUICK_REFERENCE.md** como consulta rápida durante implementação

### Para Encontrar Algo Específico
1. Procure o nome do arquivo ou função em **FILES_SUMMARY.md**
2. Encontre a localização exata (arquivo e linhas)
3. Consulte **ANALISE_SKILLS.md** para explicação detalhada

### Para Debugar
1. Consulte "Debug & Teste" em **SKILLS_QUICK_REFERENCE.md**
2. Use os comandos em **FILES_SUMMARY.md** > "Comandos Úteis para Testing"

---

## Resumo das Mudanças Necessárias para Sangue

| Prioridade | Arquivo | O Quê | Onde |
|------------|---------|-------|------|
| 1 | models.py | Adicionar 4 colunas | Classe Player, ~linha 138 |
| 2 | characters.py | Modificar use_special_skill() | ~linha 1150 |
| 3 | routes/battle.py | Modificar player_specials() | ~linha 1654 |
| 4 | battle-skills-system.js | Adicionar updateBloodDisplay() | Final do arquivo |
| 5 | battle.css | Adicionar estilos de sangue | Final do arquivo |
| 6 | skill_effects.py | Adicionar apply_blood_effects() | Final do arquivo |

---

## Dicas Importantes

1. **Sempre fazer backup do banco antes de migrar**
   ```bash
   cp instance/app.db instance/app.db.backup
   ```

2. **Testar skills especiais**
   - Ir para `/gamification/fill_special_charges`
   - Voltar para battaglia
   - Verificar console do navegador para logs

3. **Sistema de Cargas**
   - Cargas recalculam automaticamente a cada hora de cooldown
   - Podem ter múltiplas cargas se cooldown >= 60 minutos

4. **Buffs são Temporários**
   - Podem durar em minutos (tempo real) ou em ataques
   - Expiram automaticamente após duração

5. **Sistema de Turnos**
   - Inimigo tem padrão de ações definido
   - Probabilidade de múltiplas ações por turno
   - Intenções são mostradas antes do turno do inimigo

---

## Estrutura de Arquivos Criados

```
/home/user/testeez/
├── ANALISE_SKILLS.md                    # Análise detalhada (1500+ linhas)
├── SKILLS_QUICK_REFERENCE.md            # Referência rápida (400+ linhas)
├── IMPLEMENTACAO_SANGUE.md              # Guia passo a passo (600+ linhas)
├── FILES_SUMMARY.md                     # Resumo de arquivos (400+ linhas)
└── README_SKILLS_ANALYSIS.md            # Este arquivo (índice)
```

Total: 3500+ linhas de documentação

---

## Links de Navegação Cruzada

- **Arquivo de Skills**: `/home/user/testeez/characters.py` (linhas 51-344)
- **Arquivo de Modelos**: `/home/user/testeez/models.py` (linhas 51-131)
- **Rota de Ativação**: `/home/user/testeez/routes/battle.py` (linhas 1422-1505)
- **Sistema de Turnos**: `/home/user/testeez/routes/battle_modules/battle_turns.py` (linhas 22-195)
- **UI de Skills**: `/home/user/testeez/static/js/battle-skills-system.js`
- **Dados de Skills**: `/home/user/testeez/static/game.data/enemy_skills_data.json`

---

## Próximos Passos

1. **Entender o Sistema Atual**
   - Leia ANALISE_SKILLS.md completamente
   - Explore os arquivos fonte mencionados
   - Execute testes com `/gamification/fill_special_charges`

2. **Implementar Sangue (Opcional)**
   - Siga IMPLEMENTACAO_SANGUE.md passo a passo
   - Faça migração do banco com flask db
   - Teste cada mudança incrementalmente

3. **Fazer Commits**
   - Commitar mudanças após cada seção concluída
   - Incluir referência aos documentos (ex: "feat: Add blood system per IMPLEMENTACAO_SANGUE.md")

---

## Contato / Dúvidas

Se tiver dúvidas:
1. Procure a função/arquivo em **FILES_SUMMARY.md**
2. Leia a explicação em **ANALISE_SKILLS.md**
3. Se for implementar sangue, consulte **IMPLEMENTACAO_SANGUE.md**
4. Use **SKILLS_QUICK_REFERENCE.md** para dicas rápidas

