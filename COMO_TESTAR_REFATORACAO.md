# Como Baixar e Testar a Versão Refatorada

## 📥 Método 1: Fazer Checkout do Branch (Recomendado)

### Passo 1: Verificar branches disponíveis
```bash
git branch -a
```

Você verá:
- `claude/game-balance-report-011CUxnHFhPRVHBwfgi4XsSL` ← Versão atual (original)
- `claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL` ← **Versão refatorada**

### Passo 2: Fazer checkout do branch refatorado
```bash
git checkout claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL
```

### Passo 3: Verificar que está no branch correto
```bash
git branch
# Deve mostrar * no branch refactor
```

### Passo 4: Ver os novos arquivos
```bash
ls -la core/
ls -la repositories/
ls -la services/
```

Você verá:
```
core/
├── constants/
│   └── game_constants.py      ← Todas as constantes
├── exceptions/
│   └── game_exceptions.py     ← 15 exceções específicas
├── formulas.py                ← XP unificado
├── logging_config.py          ← Sistema de logging
└── validators.py              ← Validação de inputs

repositories/
├── player_repository.py       ← Acesso ao banco de Players
└── enemy_repository.py        ← Acesso ao banco de Enemies

services/
└── battle_service.py          ← Lógica de batalha desacoplada

routes/
└── battle_refactored.py       ← Exemplo de rota refatorada
```

---

## 🧪 Método 2: Comparar Sem Fazer Checkout

Se quiser apenas **ver as diferenças** sem trocar de branch:

```bash
# Ver lista de arquivos novos
git diff --name-status claude/game-balance-report-011CUxnHFhPRVHBwfgi4XsSL..claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL

# Ver conteúdo de um arquivo específico
git show claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL:core/formulas.py

# Ver diff completo
git diff claude/game-balance-report-011CUxnHFhPRVHBwfgi4XsSL..claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL
```

---

## 🚀 Como Testar a Aplicação

### 1. Criar ambiente virtual (se ainda não tiver)
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate  # Windows
```

### 2. Instalar dependências
```bash
pip install -r requirements.txt
```

### 3. Rodar a aplicação
```bash
python app.py
```

### 4. Testar a nova API

A versão refatorada adiciona rotas em `/api/v2/*` (as antigas em `/api/*` continuam funcionando):

#### Teste 1: Atacar com nova API
```bash
curl -X POST http://localhost:5000/api/v2/damage_boss \
  -H "Content-Type: application/json" \
  -d '{"skill_id": 51}'
```

#### Teste 2: Selecionar inimigo
```bash
curl -X POST http://localhost:5000/api/v2/select_enemy \
  -H "Content-Type: application/json" \
  -d '{"enemy_id": 1}'
```

#### Teste 3: Regenerar energia
```bash
curl -X POST http://localhost:5000/api/v2/player/regenerate_energy
```

---

## 🔍 Explorar o Código Refatorado

### Ver constantes centralizadas
```bash
cat core/constants/game_constants.py
```

Você verá:
```python
DAMAGE_ATTACK_BASE = 6
DAMAGE_POWER_BASE = 12
CRITICAL_CAP = 0.60  # 60% máximo
LIFESTEAL_CAP = 0.40  # 40% máximo
# ...e muito mais
```

### Ver exceções customizadas
```bash
cat core/exceptions/game_exceptions.py
```

Você verá:
```python
class PlayerNotFoundException(GameException): ...
class InsufficientEnergyException(GameException): ...
class EnemyAlreadyDeadException(GameException): ...
# ...15 exceções específicas
```

### Ver fórmula de XP unificada
```bash
cat core/formulas.py
```

Você verá:
```python
def get_exp_for_next_level(level: int) -> int:
    """ÚNICA fonte de verdade para XP"""
    return int(100 * (level ** 1.5))
```

### Ver exemplo de service
```bash
cat services/battle_service.py
```

Você verá:
```python
class BattleService:
    def execute_attack(self, player_id, skill_id) -> AttackResult:
        """Lógica pura - SEM Flask"""
        # Código desacoplado e testável
```

### Ver exemplo de repository
```bash
cat repositories/player_repository.py
```

Você verá:
```python
class PlayerRepository:
    @staticmethod
    def get_by_id_or_fail(player_id: int) -> Player:
        """Busca player ou levanta exceção"""
```

---

## 📊 Comparar Visualmente

### Ver diferença de tamanho
```bash
# Versão antiga (battle.py original)
wc -l routes/battle.py
# 3185 linhas

# Versão refatorada (exemplo)
wc -l routes/battle_refactored.py
# 255 linhas (redução de 94%)
```

### Ver estrutura completa
```bash
tree -L 2 -I '__pycache__|*.pyc|node_modules'
```

---

## 🔄 Voltar para a Versão Original

Se quiser voltar para a versão original a qualquer momento:

```bash
git checkout claude/game-balance-report-011CUxnHFhPRVHBwfgi4XsSL
```

---

## 🧪 Testar Ambas as Versões

### Versão 1: Original
```bash
git checkout claude/game-balance-report-011CUxnHFhPRVHBwfgi4XsSL
python app.py
# Testar rotas em /api/*
```

### Versão 2: Refatorada
```bash
git checkout claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL
python app.py
# Testar rotas em /api/v2/*
```

---

## 📝 Ler a Documentação Completa

Depois de fazer checkout:

```bash
# Ler guia completo de refatoração
cat REFACTORING_GUIDE.md

# Ou abrir no editor
code REFACTORING_GUIDE.md
# OU
nano REFACTORING_GUIDE.md
```

---

## ❓ Troubleshooting

### Erro: "Already on branch"
Se já estiver no branch refatorado:
```bash
git status
# Confirma que está no branch correto
```

### Erro: "Uncommitted changes"
Se tiver mudanças não commitadas:
```bash
# Salvar mudanças temporariamente
git stash

# Fazer checkout
git checkout claude/refactor-code-modularization-011CUxnHFhPRVHBwfgi4XsSL

# Recuperar mudanças (se necessário)
git stash pop
```

### Erro ao importar módulos
Se Python reclamar de imports:
```bash
# Garantir que está no diretório correto
pwd

# Adicionar ao PYTHONPATH se necessário
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

## 🎯 Próximos Passos

1. **Explore os novos arquivos**
   - `core/`: Toda lógica central
   - `repositories/`: Acesso ao banco
   - `services/`: Lógica de negócio

2. **Compare com o código antigo**
   - Veja como foi separado
   - Entenda a nova arquitetura

3. **Teste as novas rotas**
   - `/api/v2/damage_boss`
   - `/api/v2/select_enemy`

4. **Decida a estratégia de migração**
   - Gradual (recomendado)
   - Ou tudo de uma vez

5. **Dê feedback**
   - O que achou?
   - Algo não ficou claro?
   - Sugestões de melhorias?

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas ou problemas:
1. Verifique o `REFACTORING_GUIDE.md`
2. Veja os exemplos nos arquivos criados
3. Pergunte!

Boa exploração! 🚀
