# Exemplos de Eventos Atualizados

Este arquivo mostra como atualizar os eventos com:
- Condições (min_hp_percent, max_hp_percent, min_gold, etc)
- Ícones ao invés de emojis
- Raridades ajustadas
- Sons

Aplique este padrão aos 21 eventos em `routes/map_modules/events.py`.

---

## Exemplo 1: Evento COMMON com condição de HP baixo

```python
'camara_regeneracao': {
    'id': 'camara_regeneracao',
    'name': 'Câmara de Regeneração',
    'description': 'Uma sala preenchida com cristais brilhantes que emanam energia curativa.',
    'image': 'healing_chamber.png',  # Imagem ao invés de emoji no topo
    'sound': None,
    'rarity': 'common',
    'min_act': 1,
    # NOVO: Condições para aparecer
    'conditions': {
        'max_hp_percent': 0.6,  # Só aparece se HP <= 60%
        'boost_weight_if': {
            'hp_below': 0.4  # Dobra chance se HP < 40%
        }
    },
    'choices': [
        {
            'id': 'meditar',
            'text': 'Meditar nos cristais',
            'description': 'Cure 40% do HP máximo',
            'icon': 'choice-rest.png',  # Ícone de escolha ao invés de emoji
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [
                {'type': 'heal_percent', 'value': 0.40}
            ],
            'result_sound': 'hp-heal.mp3'  # Som quando o efeito é aplicado
        },
        {
            'id': 'absorver',
            'text': 'Absorver toda energia',
            'description': 'Cure 70% do HP máximo, mas destrua os cristais (50% chance de damage)',
            'icon': 'choice-accept.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [
                {'type': 'heal_percent', 'value': 0.70},
                {'type': 'random_damage', 'chance': 0.5, 'value': 15}
            ],
            'result_sound': 'event-positive.mp3'
        },
        {
            'id': 'sair',
            'text': 'Sair',
            'description': 'Melhor não arriscar',
            'icon': 'choice-run.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [],
            'result_sound': 'event-neutral.mp3'
        }
    ]
},
```

---

## Exemplo 2: Evento UNCOMMON com condição de gold

```python
'comerciante_sombrio': {
    'id': 'comerciante_sombrio',
    'name': 'Comerciante Sombrio',
    'description': 'Uma figura encapuzada emerge das sombras. Seus olhos brilham com ganância sobrenatural enquanto oferece uma troca.',
    'image': 'merchant.png',  # Ícone de evento
    'sound': 'event-rare.mp3',  # Som especial ao aparecer
    'rarity': 'uncommon',
    'min_act': 1,
    # NOVO: Boost se tiver muito gold
    'conditions': {
        'boost_weight_if': {
            'gold_above': 50  # Aumenta 50% a chance se gold > 50
        }
    },
    'choices': [
        {
            'id': 'trocar_reliquia',
            'text': 'Trocar Relíquia',
            'description': 'Entregue 1 relíquia sua e receba 2 relíquias comuns aleatórias',
            'icon': 'choice-trade.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_relics': 1},
            'effects': [
                {'type': 'remove_random_relic'},
                {'type': 'gain_relic', 'rarity': 'common'},
                {'type': 'gain_relic', 'rarity': 'common'}
            ],
            'result_sound': 'relic-discover.mp3'
        },
        {
            'id': 'pacto_sangue',
            'text': 'Pacto de Sangue',
            'description': 'Perca 10 HP Máximo permanentemente para ganhar uma Relíquia Épica',
            'icon': 'choice-attack.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_max_hp': 20},
            'effects': [
                {'type': 'lose_max_hp', 'value': 10},
                {'type': 'gain_relic', 'rarity': 'epic'}
            ],
            'result_sound': 'event-negative.mp3'  # Som negativo por perder HP max
        },
        {
            'id': 'comprar_segredo',
            'text': 'Comprar o segredo',
            'description': 'Pague 100 ouro para receber uma Relíquia Rara garantida',
            'icon': 'choice-trade.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_gold': 100},
            'effects': [
                {'type': 'lose_gold', 'value': 100},
                {'type': 'gain_relic', 'rarity': 'rare'}
            ],
            'result_sound': 'gold-loss.mp3'
        },
        {
            'id': 'recusar',
            'text': 'Recusar',
            'description': 'Nada de bom vem de negócios nas sombras',
            'icon': 'choice-refuse.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [],
            'result_sound': 'event-neutral.mp3'
        }
    ]
},
```

---

## Exemplo 3: Evento RARE único (one-time)

```python
'espelho_verdade': {
    'id': 'espelho_verdade',
    'name': 'Espelho da Verdade',
    'description': 'Um espelho antigo que reflete não sua aparência, mas sua essência. Você só pode olhar uma vez.',
    'image': 'mirror.png',
    'sound': 'event-rare.mp3',  # Som especial para evento raro
    'rarity': 'rare',
    'min_act': 2,
    # NOVO: Evento único - só aparece 1x por run
    'conditions': {
        'one_time': True,  # Só pode acontecer uma vez
        'min_relics': 1  # Precisa ter pelo menos 1 relíquia
    },
    'choices': [
        {
            'id': 'confrontar',
            'text': 'Confrontar a verdade',
            'description': 'Perca 20 HP máximo, mas ganhe 2 relíquias épicas',
            'icon': 'choice-accept.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_max_hp': 30},
            'effects': [
                {'type': 'lose_max_hp', 'value': 20},
                {'type': 'gain_relic', 'rarity': 'epic'},
                {'type': 'gain_relic', 'rarity': 'epic'}
            ],
            'result_sound': 'relic-discover.mp3'
        },
        {
            'id': 'aceitar',
            'text': 'Aceitar-se',
            'description': 'Cure completamente e ganhe 1 relíquia rara',
            'icon': 'choice-rest.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [
                {'type': 'heal_full'},
                {'type': 'gain_relic', 'rarity': 'rare'}
            ],
            'result_sound': 'event-positive.mp3'
        },
        {
            'id': 'fugir',
            'text': 'Fugir',
            'description': 'Alguns segredos são melhor deixados sem revelar',
            'icon': 'choice-run.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [],
            'result_sound': 'event-neutral.mp3'
        }
    ]
},
```

---

## Exemplo 4: Evento que inicia combate

```python
'poco_desejos': {
    'id': 'poco_desejos',
    'name': 'Poço dos Desejos',
    'description': 'Um poço antigo. Moedas brilham no fundo da água escura.',
    'image': 'well.png',
    'sound': None,
    'rarity': 'common',
    'min_act': 1,
    # NOVO: Condição de gold mínimo
    'conditions': {
        'min_gold': 15
    },
    'choices': [
        {
            'id': 'fazer_pedido',
            'text': 'Jogar 15 moedas',
            'description': 'Faça um pedido e jogue 15 moedas',
            'icon': 'choice-trade.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_gold': 15},
            'effects': [
                {'type': 'lose_gold', 'value': 15},
                {'type': 'random_outcome', 'outcomes': [
                    {'weight': 0.40, 'effects': [{'type': 'gain_gold', 'min': 40, 'max': 60}]},
                    {'weight': 0.30, 'effects': [{'type': 'gain_relic', 'rarity': 'common'}]},
                    {'weight': 0.20, 'effects': [{'type': 'heal_percent', 'value': 0.30}]},
                    {'weight': 0.10, 'effects': [{'type': 'start_combat'}]}  # Combate!
                ]}
            ],
            'result_sound': 'event-positive.mp3'
        },
        {
            'id': 'arriscar',
            'text': 'Mergulhar no poço',
            'description': 'MUITO arriscado, mas as recompensas podem ser grandes...',
            'icon': 'choice-attack.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {'min_hp_percent': 0.5},
            'effects': [
                {'type': 'random_outcome', 'outcomes': [
                    {'weight': 0.50, 'effects': [
                        {'type': 'start_combat'}  # Inicia combate
                    ]},
                    {'weight': 0.30, 'effects': [
                        {'type': 'gain_gold', 'min': 80, 'max': 120},
                        {'type': 'gain_relic', 'rarity': 'rare'}
                    ]},
                    {'weight': 0.20, 'effects': [
                        {'type': 'lose_hp_percent_current', 'value': 0.50}
                    ]}
                ]}
            ],
            'result_sound': 'event-combat-trigger.mp3'  # Som de combate
        },
        {
            'id': 'ignorar',
            'text': 'Ignorar o poço',
            'description': 'Melhor não mexer com o desconhecido',
            'icon': 'choice-refuse.png',
            'sound': 'event-choice-select.mp3',
            'requirements': {},
            'effects': [],
            'result_sound': 'event-neutral.mp3'
        }
    ]
},
```

---

## Resumo das Mudanças

### Campos Novos:
1. **'conditions'**: Dicionário com condições para o evento aparecer
   - `min_hp_percent`: HP mínimo (0.0 a 1.0)
   - `max_hp_percent`: HP máximo (0.0 a 1.0)
   - `min_gold`: Gold mínimo necessário
   - `min_relics`: Número mínimo de relíquias
   - `one_time`: true/false - evento único por run
   - `boost_weight_if`: Condições para aumentar chance
     - `hp_below`: Dobra chance se HP < X
     - `gold_above`: Aumenta 50% se gold > X

2. **Substituir emojis por ícones**:
   - `'icon': '💰'` → `'icon': 'choice-trade.png'`
   - Usar ícones da pasta `/static/game.data/events/choices/`

3. **Sons**:
   - `'sound'` no evento: Som ao aparecer
   - `'sound'` na escolha: Som ao clicar
   - `'result_sound'` na escolha: Som ao aplicar efeito

### Raridades Sugeridas:

**COMMON (14 eventos)**:
- tumulo_profanado, relicario_abandonado, fonte_de_sangue
- camara_regeneracao, tesouro_amaldicoado, cacador_recompensas
- forja_sombria, biblioteca_proibida, mestre_armas
- goblin_vendedor, poco_desejos, fantasma_heroi
- encruzilhada_mistica, espelho_dimensional

**UNCOMMON (6 eventos)**:
- comerciante_sombrio, altar_sangue_antigo, vampiro_anciao
- roda_fortuna, demonio_tentador, aposta_morte

**RARE (1 evento)**:
- espelho_verdade (one-time)

---

## Como Aplicar

1. Abra `routes/map_modules/events.py`
2. Para cada um dos 21 eventos:
   - Adicione campo 'conditions' se aplicável
   - Troque emojis por paths de ícones
   - Adicione sons
   - Ajuste raridade conforme categorização
3. Salve e teste!

Os ícones e sons serão adicionados posteriormente conforme você for criando os assets.
