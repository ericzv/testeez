"""
Script para atualizar eventos com condições
"""

# Mapeamento de eventos para suas condições
EVENTS_CONDITIONS = {
    # COMMON - sem condições
    'tumulo_profanado': {},
    'relicario_abandonado': {},
    'tesouro_amaldicoado': {},
    'cacador_recompensas': {},
    'biblioteca_proibida': {},
    'goblin_vendedor': {},
    'encruzilhada_mistica': {},

    # COMMON - com condições
    'fonte_de_sangue': {
        'boost_weight_if': {
            'hp_below': 0.7  # Aumenta chance se HP < 70%
        }
    },
    'camara_regeneracao': {
        'max_hp_percent': 0.6,  # Só aparece se HP <= 60%
        'boost_weight_if': {
            'hp_below': 0.4  # Dobra chance se HP < 40%
        }
    },
    'forja_sombria': {
        'min_gold': 30
    },
    'mestre_armas': {
        'min_gold': 50
    },
    'poco_desejos': {
        'min_gold': 15
    },
    'fantasma_heroi': {},
    'espelho_dimensional': {},

    # UNCOMMON
    'comerciante_sombrio': {
        'boost_weight_if': {
            'gold_above': 50
        }
    },
    'altar_sangue_antigo': {
        'boost_weight_if': {
            'hp_below': 0.5
        }
    },
    'vampiro_anciao': {
        'min_hp_percent': 0.4  # Só aparece se HP >= 40%
    },
    'roda_fortuna': {},
    'demonio_tentador': {},
    'aposta_morte': {
        'min_gold': 50
    },

    # RARE
    'espelho_verdade': {
        'one_time': True,  # Só pode acontecer 1x por run
        'min_relics': 1
    }
}

# Mapeamento de min_act para eventos
EVENTS_MIN_ACT = {
    # Ato 2+
    'altar_sangue_antigo': 2,
    'vampiro_anciao': 2,
    'demonio_tentador': 2,
    'mestre_armas': 2,
    'fantasma_heroi': 2,
    'espelho_dimensional': 2,
    'espelho_verdade': 2,

    # Ato 3+
    'aposta_morte': 3,

    # Resto é Ato 1+ (já configurado)
}

print("Configurações de condições dos eventos:")
print("\nEVENTOS COMMON (14):")
common = ['tumulo_profanado', 'relicario_abandonado', 'fonte_de_sangue', 'camara_regeneracao',
          'tesouro_amaldicoado', 'cacador_recompensas', 'forja_sombria', 'biblioteca_proibida',
          'mestre_armas', 'goblin_vendedor', 'poco_desejos', 'fantasma_heroi',
          'encruzilhada_mistica', 'espelho_dimensional']

for ev in common:
    cond = EVENTS_CONDITIONS.get(ev, {})
    act = EVENTS_MIN_ACT.get(ev, 1)
    print(f"  - {ev}: Ato {act}+ | Condições: {cond if cond else 'Nenhuma'}")

print("\nEVENTOS UNCOMMON (6):")
uncommon = ['comerciante_sombrio', 'altar_sangue_antigo', 'vampiro_anciao',
            'roda_fortuna', 'demonio_tentador', 'aposta_morte']

for ev in uncommon:
    cond = EVENTS_CONDITIONS.get(ev, {})
    act = EVENTS_MIN_ACT.get(ev, 1)
    print(f"  - {ev}: Ato {act}+ | Condições: {cond if cond else 'Nenhuma'}")

print("\nEVENTOS RARE (1):")
rare = ['espelho_verdade']

for ev in rare:
    cond = EVENTS_CONDITIONS.get(ev, {})
    act = EVENTS_MIN_ACT.get(ev, 1)
    print(f"  - {ev}: Ato {act}+ | Condições: {cond}")
