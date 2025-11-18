"""
Sistema de Eventos Aleatórios - Definições
Inspirado no sistema de "?" do Slay the Spire
"""

import random

# Definições de todos os eventos disponíveis
EVENT_DEFINITIONS = {

    # ========== EVENTOS DE RELÍQUIAS ==========

    'tumulo_profanado': {
        'id': 'tumulo_profanado',
        'name': 'Túmulo Profanado',
        'description': 'Um túmulo antigo coberto de marcas de sangue seco. Algo brilha entre os ossos, mas o ar está carregado de maldição.',
        'image': 'shire.png',
        'sound': None,  # Campo para som do evento
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'profanar',
                'text': 'Profanar o túmulo',
                'description': 'Perca 20% do HP atual para ganhar uma Relíquia Rara',
                'icon': '🗡️',
                'sound': None,  # Som da escolha
                'requirements': {'min_hp_percent': 0.25},
                'effects': [
                    {'type': 'lose_hp_percent_current', 'value': 0.20},
                    {'type': 'gain_relic', 'rarity': 'rare'}
                ]
            },
            {
                'id': 'saquear',
                'text': 'Saquear os tesouros',
                'description': 'Colete 50-70 de ouro dos pertences',
                'icon': '💰',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 50, 'max': 70}
                ]
            },
            {
                'id': 'deixar',
                'text': 'Deixar em paz',
                'description': 'Respeitar os mortos e seguir em frente',
                'icon': '🚶',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'comerciante_sombrio': {
        'id': 'comerciante_sombrio',
        'name': 'Comerciante Sombrio',
        'description': 'Uma figura encapuzada emerge das sombras. Seus olhos brilham com ganância sobrenatural enquanto oferece uma troca.',
        'image': 'merchant.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 1,
        'conditions': {
            'boost_weight_if': {
                'gold_above': 50  # Aumenta 50% chance se gold > 50
            }
        },
        'choices': [
            {
                'id': 'trocar_reliquia',
                'text': 'Trocar Relíquia',
                'description': 'Entregue 1 relíquia sua e receba 2 relíquias comuns aleatórias',
                'icon': '🔄',
                'sound': None,
                'requirements': {'min_relics': 1},
                'effects': [
                    {'type': 'remove_random_relic'},
                    {'type': 'gain_relic', 'rarity': 'common'},
                    {'type': 'gain_relic', 'rarity': 'common'}
                ]
            },
            {
                'id': 'pacto_sangue',
                'text': 'Pacto de Sangue',
                'description': 'Perca 10 HP Máximo permanentemente para ganhar uma Relíquia Épica',
                'icon': '🩸',
                'sound': None,
                'requirements': {'min_max_hp': 20},
                'effects': [
                    {'type': 'lose_max_hp', 'value': 10},
                    {'type': 'gain_relic', 'rarity': 'epic'}
                ]
            },
            {
                'id': 'comprar_segredo',
                'text': 'Comprar o segredo',
                'description': 'Pague 100 ouro para receber uma Relíquia Rara garantida',
                'icon': '💎',
                'sound': None,
                'requirements': {'min_gold': 100},
                'effects': [
                    {'type': 'lose_gold', 'value': 100},
                    {'type': 'gain_relic', 'rarity': 'rare'}
                ]
            },
            {
                'id': 'recusar',
                'text': 'Recusar a oferta',
                'description': 'Melhor não confiar nesse tipo',
                'icon': '🚶',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'altar_sangue_antigo': {
        'id': 'altar_sangue_antigo',
        'name': 'Altar do Sangue Antigo',
        'description': 'Um altar cerimonial coberto de sangue seco pulsa com energia carmesim. Runas ancestrais brilham fracamente.',
        'image': 'offering.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 2,
        'conditions': {
            'boost_weight_if': {
                'hp_below': 0.5  # Dobra chance se HP < 50%
            }
        },
        'choices': [
            {
                'id': 'oferecer_sangue',
                'text': 'Oferecer sangue',
                'description': 'Perca 25 HP para ganhar +3 de dano base no Ataque Básico',
                'icon': '🩸',
                'sound': None,
                'requirements': {'min_hp': 30},
                'effects': [
                    {'type': 'lose_hp', 'value': 25},
                    {'type': 'add_skill_damage', 'skill_type': 'ataque', 'value': 3}
                ]
            },
            {
                'id': 'sacrificar_vitalidade',
                'text': 'Sacrificar vitalidade',
                'description': 'Perca 8 HP Máximo permanentemente para ganhar uma Relíquia Lendária',
                'icon': '💀',
                'sound': None,
                'requirements': {'min_max_hp': 15},
                'effects': [
                    {'type': 'lose_max_hp', 'value': 8},
                    {'type': 'gain_relic', 'rarity': 'legendary'}
                ]
            },
            {
                'id': 'destruir_altar',
                'text': 'Destruir o altar',
                'description': '50% de chance de nada acontecer, 50% de receber -2 de dano no próximo combate',
                'icon': '🔥',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.5, 'effects': []},
                        {'chance': 0.5, 'effects': [
                            {'type': 'apply_combat_debuff', 'debuff': 'altar_curse', 'value': -2, 'duration': 1}
                        ]}
                    ]}
                ]
            }
        ]
    },

    'relicario_abandonado': {
        'id': 'relicario_abandonado',
        'name': 'Relicário Abandonado',
        'description': 'Uma caixa de vidro empoeirada contém três relíquias antigas. O vidro parece frágil, mas cortante.',
        'image': 'chest.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'escolher_cegas',
                'text': 'Escolher às cegas',
                'description': 'Ganhe 1 relíquia aleatória das três disponíveis',
                'icon': '🎲',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'rarity': 'random'}
                ]
            },
            {
                'id': 'quebrar_vidro',
                'text': 'Quebrar o vidro',
                'description': 'Perca 10 HP pelos estilhaços, mas escolha entre as 3 relíquias',
                'icon': '🔨',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'choose_relic', 'count': 3}
                ]
            },
            {
                'id': 'deixar_relicario',
                'text': 'Deixar o relicário',
                'description': 'Alguém pagará por isso - ganhe 20 ouro',
                'icon': '❌',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 20, 'max': 20}
                ]
            }
        ]
    },

    # ========== EVENTOS DE CURA/HP ==========

    'fonte_de_sangue': {
        'id': 'fonte_de_sangue',
        'name': 'Fonte de Sangue',
        'description': 'Uma fonte antiga jorra um líquido carmesim brilhante. O aroma é intoxicante e promete cura.',
        'image': 'fountain.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {
            'boost_weight_if': {
                'hp_below': 0.7  # Aumenta chance se HP < 70%
            }
        },
        'choices': [
            {
                'id': 'beber',
                'text': 'Beber da fonte',
                'description': 'Cure 30% do seu HP Máximo',
                'icon': '🩹',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'heal_percent_max', 'value': 0.30}
                ]
            },
            {
                'id': 'banhar',
                'text': 'Banhar-se na fonte',
                'description': 'Cure 15% do HP Máximo E ganhe +5 HP Máximo permanente, mas pague 30 ouro',
                'icon': '❤️',
                'sound': None,
                'requirements': {'min_gold': 30},
                'effects': [
                    {'type': 'lose_gold', 'value': 30},
                    {'type': 'heal_percent_max', 'value': 0.15},
                    {'type': 'gain_max_hp', 'value': 5}
                ]
            },
            {
                'id': 'ignorar',
                'text': 'Ignorar a fonte',
                'description': 'Melhor não arriscar',
                'icon': '🚶',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'vampiro_anciao': {
        'id': 'vampiro_anciao',
        'name': 'Vampiro Ancião',
        'description': 'Um vampiro milenar descansa em seu trono de ossos. Seus olhos carmesim te avaliam com curiosidade.',
        'image': 'statue.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 2,
        'conditions': {
            'min_hp_percent': 0.4  # Só aparece se HP >= 40%
        },
        'choices': [
            {
                'id': 'aprender_tecnica',
                'text': 'Aprender técnica',
                'description': 'Ganhe a Memória "Sede de Sangue" (+5% lifesteal)',
                'icon': '📚',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'sede_de_sangue'}
                ]
            },
            {
                'id': 'ritual_fortalecimento',
                'text': 'Ritual de fortalecimento',
                'description': 'Perca 15 HP para ganhar +10 HP Máximo permanente',
                'icon': '🩸',
                'sound': None,
                'requirements': {'min_hp': 20},
                'effects': [
                    {'type': 'lose_hp', 'value': 15},
                    {'type': 'gain_max_hp', 'value': 10}
                ]
            },
            {
                'id': 'pedir_ouro',
                'text': 'Pedir ouro',
                'description': 'O ancião te dá 50 ouro por respeito',
                'icon': '💰',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 50, 'max': 50}
                ]
            },
            {
                'id': 'desafiar',
                'text': 'Desafiá-lo para combate',
                'description': 'Enfrente um Elite Lendário com recompensa dobrada',
                'icon': '⚔️',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'start_elite_combat', 'rarity': 'legendary', 'reward_multiplier': 2.0}
                ]
            }
        ]
    },

    'camara_regeneracao': {
        'id': 'camara_regeneracao',
        'name': 'Câmara de Regeneração',
        'description': 'Cápsulas misteriosas emitem uma luz avermelhada pulsante. A tecnologia parece antiga, mas funcional.',
        'image': 'campfire.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {
            'max_hp_percent': 0.6,  # Só aparece se HP <= 60%
            'boost_weight_if': {
                'hp_below': 0.4  # Dobra chance se HP < 40%
            }
        },
        'choices': [
            {
                'id': 'entrar_capsula',
                'text': 'Entrar na cápsula',
                'description': 'Cure TODO o seu HP, mas perca 1 Relíquia aleatória',
                'icon': '💉',
                'sound': None,
                'requirements': {'min_relics': 1},
                'effects': [
                    {'type': 'full_heal'},
                    {'type': 'remove_random_relic'}
                ]
            },
            {
                'id': 'estudar_tecnologia',
                'text': 'Estudar a tecnologia',
                'description': 'Ganhe +3 HP Máximo permanente',
                'icon': '🔬',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_max_hp', 'value': 3}
                ]
            },
            {
                'id': 'sair_correndo',
                'text': 'Sair correndo',
                'description': 'Pegue algumas peças soltas - ganhe 15 ouro',
                'icon': '🏃',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 15, 'max': 15}
                ]
            }
        ]
    },

    # ========== EVENTOS DE GOLD ==========

    'tesouro_amaldicoado': {
        'id': 'tesouro_amaldicoado',
        'name': 'Tesouro Amaldiçoado',
        'description': 'Um baú transbordando ouro emana uma aura sinistra. O brilho é hipnotizante, mas algo está errado.',
        'image': 'treasure.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'pegar_tudo',
                'text': 'Pegar tudo',
                'description': 'Ganhe 100-120 ouro, mas perca 10% do HP Máximo permanentemente',
                'icon': '💰',
                'sound': None,
                'requirements': {'min_max_hp': 15},
                'effects': [
                    {'type': 'gain_gold', 'min': 100, 'max': 120},
                    {'type': 'lose_max_hp_percent', 'value': 0.10}
                ]
            },
            {
                'id': 'pegar_pouco',
                'text': 'Pegar um pouco',
                'description': 'Ganhe 40-60 ouro com segurança',
                'icon': '🪙',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 40, 'max': 60}
                ]
            },
            {
                'id': 'purificar',
                'text': 'Purificar o tesouro',
                'description': 'Pague 30 HP para ganhar 70 ouro limpo + Memória: Pureza',
                'icon': '🧹',
                'sound': None,
                'requirements': {'min_hp': 35},
                'effects': [
                    {'type': 'lose_hp', 'value': 30},
                    {'type': 'gain_gold', 'min': 70, 'max': 70},
                    {'type': 'gain_memory', 'memory_id': 'pureza'}
                ]
            }
        ]
    },

    'cacador_recompensas': {
        'id': 'cacador_recompensas',
        'name': 'Caçador de Recompensas',
        'description': 'Um caçador experiente oferece informações valiosas sobre seu próximo alvo. O preço? Depende de você.',
        'image': 'trap.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'pagar_informacao',
                'text': 'Comprar técnicas de combate',
                'description': 'Pague 80 ouro para ganhar +4 dano no Ataque de Poder',
                'icon': '💎',
                'sound': None,
                'requirements': {'min_gold': 80},
                'effects': [
                    {'type': 'lose_gold', 'value': 80},
                    {'type': 'add_skill_damage', 'skill_type': 'poder', 'value': 4}
                ]
            },
            {
                'id': 'aceitar_missao',
                'text': 'Treinar com ele',
                'description': 'Perca 20 HP no treino, ganhe +3 dano geral (Memória)',
                'icon': '⚔️',
                'sound': None,
                'requirements': {'min_hp': 25},
                'effects': [
                    {'type': 'lose_hp', 'value': 20},
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            },
            {
                'id': 'negociar',
                'text': 'Pedir ouro emprestado',
                'description': 'Receba 25 ouro agora',
                'icon': '🤝',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 25, 'max': 25}
                ]
            }
        ]
    },

    'roda_fortuna': {
        'id': 'roda_fortuna',
        'name': 'Roda da Fortuna',
        'description': 'Uma roda mística gira sozinha, emanando energia caótica. Os símbolos mudam a cada rotação.',
        'image': 'cards.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'girar_roda',
                'text': 'Girar a roda (50 ouro)',
                'description': '25%: 150 ouro / 50%: 60 ouro / 25%: perde tudo apostado',
                'icon': '🎰',
                'sound': None,
                'requirements': {'min_gold': 50},
                'effects': [
                    {'type': 'lose_gold', 'value': 50},
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.25, 'effects': [{'type': 'gain_gold', 'min': 150, 'max': 150}]},
                        {'chance': 0.50, 'effects': [{'type': 'gain_gold', 'min': 60, 'max': 60}]},
                        {'chance': 0.25, 'effects': []}
                    ]}
                ]
            },
            {
                'id': 'apostar_tudo',
                'text': 'Apostar TUDO',
                'description': '50% chance de dobrar todo seu ouro, 50% de perder tudo',
                'icon': '🎯',
                'sound': None,
                'requirements': {'min_gold': 10},
                'effects': [
                    {'type': 'gamble_all_gold'}
                ]
            },
            {
                'id': 'observar',
                'text': 'Apenas observar',
                'description': 'Ganhe a Memória "Sorte" (+3% chance crítica)',
                'icon': '👀',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'sorte'}
                ]
            }
        ]
    },

    # ========== EVENTOS DE UPGRADE/MELHORIA ==========

    'forja_sombria': {
        'id': 'forja_sombria',
        'name': 'Forja Sombria',
        'description': 'Uma forja consome almas ao invés de carvão. As chamas negras dançam com fome insaciável.',
        'image': 'forge.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {
            'min_gold': 30  # Só aparece se gold >= 30
        },
        'choices': [
            {
                'id': 'fortalecer_ataque',
                'text': 'Fortalecer ataque básico',
                'description': 'Pague 10 HP para ganhar +2 de dano base no Ataque Básico',
                'icon': '⚔️',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'add_skill_damage', 'skill_type': 'ataque', 'value': 2}
                ]
            },
            {
                'id': 'fortalecer_poder',
                'text': 'Fortalecer ataque de poder',
                'description': 'Pague 10 HP para ganhar +3 de dano base no Poder',
                'icon': '💪',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'add_skill_damage', 'skill_type': 'poder', 'value': 3}
                ]
            },
            {
                'id': 'fortalecer_especial',
                'text': 'Fortalecer ataque especial',
                'description': 'Pague 15 HP para ganhar +4 de dano base no Especial',
                'icon': '✨',
                'sound': None,
                'requirements': {'min_hp': 20},
                'effects': [
                    {'type': 'lose_hp', 'value': 15},
                    {'type': 'add_skill_damage', 'skill_type': 'ataque_especial', 'value': 4}
                ]
            },
            {
                'id': 'reforcar_barreira',
                'text': 'Aumentar vitalidade',
                'description': 'Pague 12 HP para ganhar +10 HP Máximo permanente',
                'icon': '🛡️',
                'sound': None,
                'requirements': {'min_hp': 17},
                'effects': [
                    {'type': 'lose_hp', 'value': 12},
                    {'type': 'gain_max_hp', 'value': 10}
                ]
            }
        ]
    },

    'biblioteca_proibida': {
        'id': 'biblioteca_proibida',
        'name': 'Biblioteca Proibida',
        'description': 'Tomos antigos sussurram segredos proibidos. O conhecimento aqui é perigoso, mas poderoso.',
        'image': 'library.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'estudar_ofensiva',
                'text': 'Estudar magia ofensiva',
                'description': 'Ganhe +5 de dano em TODAS as habilidades de ataque',
                'icon': '📖',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'add_all_damage', 'value': 5}
                ]
            },
            {
                'id': 'estudar_vitalidade',
                'text': 'Estudar vitalidade',
                'description': 'Ganhe +8 HP Máximo permanente',
                'icon': '📕',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_max_hp', 'value': 8}
                ]
            },
            {
                'id': 'ler_tudo',
                'text': 'Ler tudo (perigoso)',
                'description': 'Perca 20 HP (dano mental), mas ganhe AMBOS os bônus',
                'icon': '📚',
                'sound': None,
                'requirements': {'min_hp': 25},
                'effects': [
                    {'type': 'lose_hp', 'value': 20},
                    {'type': 'add_all_damage', 'value': 5},
                    {'type': 'gain_max_hp', 'value': 8}
                ]
            }
        ]
    },

    'mestre_armas': {
        'id': 'mestre_armas',
        'name': 'Mestre de Armas Aposentado',
        'description': 'Um guerreiro lendário medita em silêncio. Cicatrizes cobrem seu corpo, testemunhas de mil batalhas.',
        'image': 'shrine-mysterious.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 2,
        'conditions': {
            'min_gold': 50  # Só aparece se gold >= 50
        },
        'choices': [
            {
                'id': 'treinar_poder',
                'text': 'Treinar técnica de poder',
                'description': 'Perca 25 HP (treino intenso), ganhe +6 dano no Ataque de Poder',
                'icon': '🎓',
                'sound': None,
                'requirements': {'min_hp': 30},
                'effects': [
                    {'type': 'lose_hp', 'value': 25},
                    {'type': 'add_skill_damage', 'skill_type': 'poder', 'value': 6}
                ]
            },
            {
                'id': 'pedir_bencao',
                'text': 'Pedir benção',
                'description': 'Ganhe a Memória "Disciplina" (+3 dano geral)',
                'icon': '🙏',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            },
            {
                'id': 'pagar_treinamento',
                'text': 'Pagar pelo treinamento completo',
                'description': 'Pague 70 ouro para ganhar +6 dano no Poder E a Memória Disciplina',
                'icon': '💰',
                'sound': None,
                'requirements': {'min_gold': 70},
                'effects': [
                    {'type': 'lose_gold', 'value': 70},
                    {'type': 'add_skill_damage', 'skill_type': 'poder', 'value': 6},
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            }
        ]
    },

    # ========== EVENTOS DE RISCO/MALDIÇÃO ==========

    'espelho_verdade': {
        'id': 'espelho_verdade',
        'name': 'Espelho da Verdade',
        'description': 'Um espelho ornamentado mostra seu reflexo... mas algo está diferente. Ele se move quando você fica parado.',
        'image': 'mirror.png',
        'sound': None,
        'rarity': 'rare',
        'min_act': 2,
        'conditions': {
            'one_time': True,  # Só pode acontecer 1x por run
            'min_relics': 1  # Precisa ter pelo menos 1 relíquia
        },
        'choices': [
            {
                'id': 'olhar_profundamente',
                'text': 'Olhar profundamente',
                'description': '50% chance: +20 HP Máximo / 50% chance: -10 HP Máximo',
                'icon': '👁️',
                'sound': None,
                'requirements': {'min_max_hp': 15},
                'effects': [
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.5, 'effects': [{'type': 'gain_max_hp', 'value': 20}]},
                        {'chance': 0.5, 'effects': [{'type': 'lose_max_hp', 'value': 10}]}
                    ]}
                ]
            },
            {
                'id': 'quebrar_espelho',
                'text': 'Quebrar o espelho',
                'description': 'Perca 15 HP (estilhaços) e receba -3 dano nos próximos 3 combates',
                'icon': '🔨',
                'sound': None,
                'requirements': {'min_hp': 20},
                'effects': [
                    {'type': 'lose_hp', 'value': 15},
                    {'type': 'apply_combat_debuff', 'debuff': 'bad_luck', 'value': -3, 'duration': 3}
                ]
            },
            {
                'id': 'ignorar_espelho',
                'text': 'Ignorar e seguir em frente',
                'description': 'Melhor não arriscar',
                'icon': '🚶',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'demonio_tentador': {
        'id': 'demonio_tentador',
        'name': 'Demônio Tentador',
        'description': 'Uma entidade de puro caos materializa-se diante de você. Seu sorriso promete poder... por um preço.',
        'image': 'portal.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'aceitar_pacto',
                'text': 'Aceitar o pacto',
                'description': 'Cada ataque causa +3 de dano, mas perde 1 HP ao final de cada turno seu',
                'icon': '😈',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'relic_id': 'demonic_pact'}
                ]
            },
            {
                'id': 'exigir_ouro',
                'text': 'Exigir ouro',
                'description': 'Ganhe 120 ouro, mas perca 1 Relíquia',
                'icon': '💰',
                'sound': None,
                'requirements': {'min_relics': 1},
                'effects': [
                    {'type': 'gain_gold', 'min': 120, 'max': 120},
                    {'type': 'remove_random_relic'}
                ]
            },
            {
                'id': 'banir_demonio',
                'text': 'Banir o demônio',
                'description': 'Enfrente um combate Lendário difícil',
                'icon': '⚔️',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'start_elite_combat', 'rarity': 'legendary', 'reward_multiplier': 1.5}
                ]
            }
        ]
    },

    'poco_desejos': {
        'id': 'poco_desejos',
        'name': 'Poço dos Desejos',
        'description': 'Moedas brilham no fundo de um poço escuro e profundo. A água está turva, impossível ver o fundo.',
        'image': 'well.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {
            'min_gold': 15  # Só aparece se gold >= 15
        },
        'choices': [
            {
                'id': 'jogar_moeda',
                'text': 'Jogar moeda (40 ouro)',
                'description': '33% cada: +15 HP Máximo / Relíquia Comum / Nada',
                'icon': '🌟',
                'sound': None,
                'requirements': {'min_gold': 40},
                'effects': [
                    {'type': 'lose_gold', 'value': 40},
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.33, 'effects': [{'type': 'gain_max_hp', 'value': 15}]},
                        {'chance': 0.33, 'effects': [{'type': 'gain_relic', 'rarity': 'common'}]},
                        {'chance': 0.34, 'effects': []}
                    ]}
                ]
            },
            {
                'id': 'mergulhar',
                'text': 'Mergulhar no poço',
                'description': 'Pegue 60-80 ouro, mas 40% de chance de combate',
                'icon': '🏊',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 60, 'max': 80},
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.4, 'effects': [{'type': 'start_combat', 'difficulty': 'normal'}]},
                        {'chance': 0.6, 'effects': []}
                    ]}
                ]
            },
            {
                'id': 'usar_balde',
                'text': 'Usar um balde',
                'description': 'Ganhe 25-35 ouro com segurança',
                'icon': '🪣',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 25, 'max': 35}
                ]
            }
        ]
    },

    # ========== EVENTOS NARRATIVOS/ESPECIAIS ==========

    'fantasma_heroi': {
        'id': 'fantasma_heroi',
        'name': 'Fantasma do Herói Caído',
        'description': 'O espírito translúcido de um aventureiro falecido aparece. Seus olhos carregam sabedoria e arrependimento.',
        'image': 'tree.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'ouvir_historia',
                'text': 'Ouvir sua história',
                'description': 'Ganhe a Memória "Disciplina" (+3 dano geral)',
                'icon': '👻',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            },
            {
                'id': 'aceitar_heranca',
                'text': 'Aceitar sua herança',
                'description': 'Ganhe 1 Relíquia Comum do herói',
                'icon': '🎁',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'rarity': 'common'}
                ]
            },
            {
                'id': 'ajudar_passar',
                'text': 'Ajudá-lo a partir',
                'description': 'Cure 20 HP (gratidão) e ganhe 10 ouro',
                'icon': '⚰️',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'heal', 'value': 20},
                    {'type': 'gain_gold', 'min': 10, 'max': 10}
                ]
            },
            {
                'id': 'absorver_essencia',
                'text': 'Absorver sua essência',
                'description': 'Perca 10 HP para ganhar +15 HP Máximo permanente',
                'icon': '🤺',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'gain_max_hp', 'value': 15}
                ]
            }
        ]
    },

    'encruzilhada_mistica': {
        'id': 'encruzilhada_mistica',
        'name': 'Encruzilhada Mística',
        'description': 'Três caminhos se abrem à sua frente. Cada um emana uma aura diferente, prometendo bênçãos distintas.',
        'image': 'crossroads.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'caminho_vermelho',
                'text': 'Caminho Vermelho (Sangue)',
                'description': 'Ganhe +3 dano no Ataque Básico',
                'icon': '🔴',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'add_skill_damage', 'skill_type': 'ataque', 'value': 3}
                ]
            },
            {
                'id': 'caminho_dourado',
                'text': 'Caminho Dourado (Riqueza)',
                'description': 'Ganhe 60 ouro imediatamente',
                'icon': '🟡',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 60, 'max': 60}
                ]
            },
            {
                'id': 'caminho_azul',
                'text': 'Caminho Azul (Vitalidade)',
                'description': 'Ganhe +8 HP Máximo permanente',
                'icon': '🔵',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_max_hp', 'value': 8}
                ]
            }
        ]
    },

    # ========== EVENTOS HUMORÍSTICOS/IMPREVISÍVEIS ==========

    'goblin_vendedor': {
        'id': 'goblin_vendedor',
        'name': 'Goblin Vendedor',
        'description': '"OFERTAS! OFERTAS! TUDO BARATO, CHEFE!" Um goblin hiperativo balança bugigangas duvidosas.',
        'image': 'goblin.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'caixa_misteriosa',
                'text': 'Caixa misteriosa (25 ouro)',
                'description': 'Pode ser: Relíquia / 50 ouro / Nada / Debuff temporário',
                'icon': '🎲',
                'sound': None,
                'requirements': {'min_gold': 25},
                'effects': [
                    {'type': 'lose_gold', 'value': 25},
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.25, 'effects': [{'type': 'gain_relic', 'rarity': 'random'}]},
                        {'chance': 0.25, 'effects': [{'type': 'gain_gold', 'min': 50, 'max': 50}]},
                        {'chance': 0.25, 'effects': []},
                        {'chance': 0.25, 'effects': [
                            {'type': 'apply_combat_debuff', 'debuff': 'goblin_trick', 'value': -2, 'duration': 2}
                        ]}
                    ]}
                ]
            },
            {
                'id': 'osso_sorte',
                'text': '"Osso da sorte" (10 ouro)',
                'description': 'Ganhe a Memória "Amuleto" (+2% chance crítica)',
                'icon': '🦴',
                'sound': None,
                'requirements': {'min_gold': 10},
                'effects': [
                    {'type': 'lose_gold', 'value': 10},
                    {'type': 'gain_memory', 'memory_id': 'amuleto'}
                ]
            },
            {
                'id': 'pedra_brilhante',
                'text': '"Pedra MUITO brilhante" (80 ouro)',
                'description': '50% chance Relíquia Épica / 50% chance é lixo',
                'icon': '💎',
                'sound': None,
                'requirements': {'min_gold': 80},
                'effects': [
                    {'type': 'lose_gold', 'value': 80},
                    {'type': 'random_outcome', 'outcomes': [
                        {'chance': 0.5, 'effects': [{'type': 'gain_relic', 'rarity': 'epic'}]},
                        {'chance': 0.5, 'effects': []}
                    ]}
                ]
            },
            {
                'id': 'ir_embora',
                'text': 'Ir embora',
                'description': 'Não confio nesse goblin',
                'icon': '🚶',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'aposta_morte': {
        'id': 'aposta_morte',
        'name': 'Aposta com a Morte',
        'description': 'A própria Morte aparece com um baralho de cartas gastas. "Uma partida?", ela sussurra.',
        'image': 'cage.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 3,
        'conditions': {
            'min_gold': 50  # Só aparece se gold >= 50
        },
        'choices': [
            {
                'id': 'jogar_cartas',
                'text': 'Jogar uma partida',
                'description': 'Aposte 25% do HP atual. Ganhe: cure 50% do Max HP. Perca: perde os 25% apostados',
                'icon': '🃏',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gamble_hp', 'bet_percent': 0.25, 'win_heal_percent': 0.50}
                ]
            },
            {
                'id': 'recusar_respeitosamente',
                'text': 'Recusar respeitosamente',
                'description': 'Ganhe a Relíquia "Favor da Morte" (revive com 1 HP uma vez)',
                'icon': '💀',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'relic_id': 'death_favor'}
                ]
            },
            {
                'id': 'fugir',
                'text': 'Fugir rapidamente',
                'description': 'Escape sem consequências',
                'icon': '🏃',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'espelho_dimensional': {
        'id': 'espelho_dimensional',
        'name': 'Espelho Dimensional',
        'description': 'Seu reflexo acena para você... e então sai do espelho. É você, mas não é você.',
        'image': 'garden.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'cumprimentar',
                'text': 'Cumprimentar o clone',
                'description': 'Ele te dá cópia de 1 Relíquia que você já possui',
                'icon': '🤝',
                'sound': None,
                'requirements': {'min_relics': 1},
                'effects': [
                    {'type': 'duplicate_random_relic'}
                ]
            },
            {
                'id': 'fazer_sinal',
                'text': 'Fazer sinal de paz',
                'description': 'Ganhe 2 Memórias aleatórias',
                'icon': '✌️',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'random'},
                    {'type': 'gain_memory', 'memory_id': 'random'}
                ]
            },
            {
                'id': 'estender_mao',
                'text': 'Estender a mão',
                'description': 'Ele te dá 80 ouro e desaparece',
                'icon': '🤚',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 80, 'max': 80}
                ]
            }
        ]
    }
}


def get_events_by_rarity(rarity: str) -> list:
    """Retorna lista de eventos filtrados por raridade"""
    return [e for e in EVENT_DEFINITIONS.values() if e['rarity'] == rarity]


def get_events_for_act(act_number: int) -> list:
    """Retorna eventos disponíveis para um ato específico"""
    return [e for e in EVENT_DEFINITIONS.values() if e['min_act'] <= act_number]


def get_event_by_id(event_id: str) -> dict:
    """Retorna evento pelo ID"""
    return EVENT_DEFINITIONS.get(event_id)
