# Sistema de Mapa Procedural

Sistema de geração procedural de mapas baseado no Slay the Spire para o jogo Retina Cards RPG.

## Estrutura do Sistema

### Arquivos Criados

```
testeez/
├── models_map.py                           # Modelos de dados do mapa
├── migrate_map.py                          # Script de migração do banco
├── routes/
│   ├── map.py                              # Rotas principais da API do mapa
│   ├── map_battle.py                       # Integração mapa-batalha
│   └── map_modules/
│       ├── __init__.py                     # Exports do módulo
│       ├── generation.py                   # Algoritmo de geração procedural
│       └── node_types.py                   # Definições de tipos de nós
├── static/
│   ├── js/
│   │   └── map-system.js                   # Frontend Pixi.js
│   └── css/
│       └── map-system.css                  # Estilos do mapa
├── templates/gamification/
│   ├── map.html                            # Página principal do mapa
│   ├── map_shop.html                       # Loja (placeholder)
│   ├── map_event.html                      # Eventos (placeholder)
│   └── map_rest.html                       # Área de descanso
└── docs/
    └── MAP_SYSTEM.md                       # Esta documentação
```

## Instalação

### 1. Migrar Banco de Dados

Execute o script de migração para criar as tabelas:

```bash
python migrate_map.py
```

Isso criará as tabelas:
- `procedural_map` - Mapas gerados
- `map_node` - Nós do mapa
- `player_map_progress` - Progresso do jogador

### 2. Reiniciar Servidor

Após a migração, reinicie o servidor Flask:

```bash
python app.py
```

### 3. Acessar o Mapa

- Via Hub: Clique no botão "🗺️ Mapa"
- URL direta: `http://localhost:5000/map/`

## Estrutura do Mapa

### Grade
- **7 colunas** (largura)
- **16 níveis** (15 níveis + boss final)
- **6 caminhos** principais que se entrelaçam

### Tipos de Nós

| Tipo | Emoji | Porcentagem | Descrição |
|------|-------|-------------|-----------|
| Batalha | ⚔️ | 53% | Inimigo genérico procedural |
| Evento | ❓ | 22% | Evento aleatório |
| Descanso | 🏕️ | 12% | Recuperar 30% do HP |
| Elite | 🔥 | 8% | Desafiante Infernal (Heresiarca/Alma Negra) |
| Loja | 🛒 | 5% | Comprar itens |
| Boss | 💀 | 1 por mapa | Boss final do ato |

### Restrições

1. **Primeiro andar** (nível 0): Sempre batalha
2. **Andar 9** (índice 8): Sempre descanso/tesouro
3. **Último andar** (nível 14): Sempre descanso
4. **Elite/Rest**: Não aparecem antes do nível 6
5. **Adjacência**: Elite, Shop e Rest não podem ser consecutivos
6. **Divergência**: Nós vindos do mesmo pai não podem ser do mesmo tipo especial

## Bosses

### Desafiantes Infernais (Elites)
- **Heresiarca** (ID: 2) - 500 HP, 35 DMG
- **Alma Negra** (ID: 3) - 450 HP, 40 DMG

### Bosses Finais
- **Ato 1**: Purassombra (800 HP, 45 DMG)
- **Ato 2**: Formofagus (1200 HP, 55 DMG)
- **Ato 3**: Nefasto (1600 HP, 70 DMG)

## API Endpoints

### Páginas (GET)
- `/map/` - Página principal do mapa
- `/map/shop` - Loja (placeholder)
- `/map/event` - Evento aleatório (placeholder)
- `/map/rest` - Área de descanso

### API JSON
- `POST /map/api/generate` - Gerar novo mapa
- `GET /map/api/current` - Obter mapa atual
- `POST /map/api/select-node/<id>` - Selecionar nó
- `POST /map/api/complete-node` - Completar nó atual
- `POST /map/api/advance-act` - Avançar para próximo ato
- `POST /map/api/reset` - Resetar progresso (morte)
- `POST /map/api/rest/heal` - Descansar e curar

### Batalhas
- `GET /map/battle/start` - Iniciar batalha comum
- `GET /map/battle/elite/<boss_id>` - Iniciar batalha elite
- `GET /map/battle/boss/<boss_id>` - Iniciar batalha de boss
- `POST /map/battle/victory` - Registrar vitória
- `POST /map/battle/defeat` - Registrar derrota

## Fluxo de Jogo

```
1. Jogador acessa /map/
   ↓
2. Se não tem mapa → Gerar novo mapa
   ↓
3. Nós do primeiro nível ficam disponíveis
   ↓
4. Jogador clica em nó disponível
   ↓
5. Baseado no tipo:
   - Batalha → /map/battle/start → Sistema de combate existente
   - Elite → /map/battle/elite/X → Batalha contra sub-boss
   - Shop → /map/shop → Loja (placeholder)
   - Evento → /map/event → Evento (placeholder)
   - Descanso → /map/rest → Recuperar HP
   - Boss → /map/battle/boss/X → Batalha final
   ↓
6. Após completar nó → Nós acima ficam disponíveis
   ↓
7. Continuar até derrotar Boss
   ↓
8. Boss derrotado → Opção de avançar para próximo Ato
   ↓
9. Após Ato 3 → Vitória completa (fim da run)

Se morrer em qualquer batalha:
   ↓
Progresso resetado → Voltar ao Ato 1
```

## Customização

### Ajustar Probabilidades

Em `routes/map_modules/generation.py`:

```python
NODE_PROBABILITIES = {
    'battle': 53,    # Batalha comum
    'elite': 8,      # Desafiante Infernal
    'shop': 5,       # Loja
    'event': 22,     # Evento Aleatório
    'rest': 12       # Descanso
}
```

### Adicionar Novos Sub-Bosses

Em `routes/map_modules/node_types.py`:

```python
ELITE_BOSSES = [
    {'id': 2, 'name': 'Heresiarca', 'description': '...'},
    {'id': 3, 'name': 'Alma Negra', 'description': '...'},
    # Adicionar novos aqui:
    {'id': 6, 'name': 'Novo Boss', 'description': '...'},
]
```

E criar o boss em `routes/map_battle.py` na função `_create_elite_boss()`.

### Mudar Tamanho do Mapa

Em `routes/map_modules/generation.py`:

```python
WIDTH = 7       # Número de colunas
HEIGHT = 15     # Número de níveis
NUM_PATHS = 6   # Número de caminhos
```

## Integração com Sistema Existente

O sistema de mapa integra com:

1. **Sistema de Batalha**: Usa rotas existentes em `routes/battle.py`
2. **Sistema de Inimigos**: Usa `generate_enemy_by_theme()` para criar inimigos
3. **Sistema de Bosses**: Usa modelo `LastBoss` para elites e bosses finais
4. **Sistema de Recompensas**: Mantém compatibilidade com sistema de rewards

## Próximos Passos

### Implementações Pendentes

1. **Sistema de Loja** (`/map/shop`)
   - Vender itens por ouro
   - Remover cartas
   - Melhorar equipamentos

2. **Sistema de Eventos** (`/map/event`)
   - Encontros aleatórios
   - Escolhas com consequências
   - Recompensas únicas

3. **Mais Sub-Bosses**
   - Criar sprites para Heresiarca e Alma Negra
   - Adicionar padrões de ataque únicos
   - Implementar skills especiais

4. **Bosses Finais**
   - Criar sprites para Purassombra, Formofagus e Nefasto
   - Implementar fases de boss
   - Adicionar mecânicas especiais

5. **Fog of War**
   - Esconder tipos de nós não adjacentes
   - Revelar progressivamente

6. **Seeds Compartilháveis**
   - Permitir jogar mapas específicos
   - Modo competitivo com seeds

## Troubleshooting

### Erro: "Tabela não encontrada"
Execute `python migrate_map.py` para criar as tabelas.

### Erro: "Blueprint não registrado"
Verifique se `map_bp` foi importado corretamente em `app.py`.

### Mapa não carrega
Verifique console do navegador para erros JavaScript.
Certifique-se que Pixi.js está carregando corretamente.

### Nós não são clicáveis
Apenas nós com `is_available = True` são interativos.
Verifique se completou o nó anterior corretamente.

## Referências

- [Slay the Spire Map Generation](https://steamcommunity.com/sharedfiles/filedetails/?id=1465338573)
- [Pixi.js Documentation](https://pixijs.download/dev/docs/index.html)
- [Flask Blueprints](https://flask.palletsprojects.com/en/2.0.x/blueprints/)
