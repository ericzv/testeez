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
        'description': 'Um túmulo antigo coberto de marcas de <span class="txt-red">sangue seco</span>. Algo <span class="txt-glow">brilha</span> entre os ossos, mas o ar está carregado de <span class="txt-dark">maldição</span>.',
        'image': 'shire.png',
        'sound': None,  # Campo para som do evento
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'profanar',
                'text': 'Profanar o túmulo',
                'description': '<span class="txt-danger"><span class="txt-danger">Perca 20% do HP</span> atual</span> para ganhar uma <span class="txt-green">Relíquia Rara</span>',
                'icon': 'choice-attack.png',
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
                'description': '<span class="txt-danger">Perca 5 HP</span> mas colete <span class="txt-green">50-70 de ouro</span> dos pertences',
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {'min_hp': 6},
                'effects': [
                    {'type': 'lose_hp', 'value': 5},
                    {'type': 'gain_gold', 'min': 50, 'max': 70}
                ]
            },
            {
                'id': 'deixar',
                'text': 'Deixar em paz',
                'description': 'Respeitar os mortos e seguir em frente',
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'comerciante_sombrio': {
        'id': 'comerciante_sombrio',
        'name': 'Comerciante Sombrio',
        'description': 'Uma figura encapuzada emerge das <span class="txt-shadow">sombras</span>. <span class="txt-eyes-glow">Seus olhos brilham</span> com ganância sobrenatural enquanto oferece uma troca.',
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
                'description': '<span class="txt-danger">Entregue 1 relíquia</span> sua e receba <span class="txt-green">2 relíquias comuns</span> aleatórias',
                'icon': 'choice-trade.png',
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
                'description': '<span class="txt-danger">Perca 10 HP Máximo permanentemente</span> para ganhar uma <span class="txt-green">Relíquia Épica</span>',
                'icon': 'choice-rest.png',
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
                'description': '<span class="txt-danger">Pague 100 ouro</span> para receber uma <span class="txt-green">Relíquia Rara</span> garantida',
                'icon': 'choice-trade.png',
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
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'altar_sangue_antigo': {
        'id': 'altar_sangue_antigo',
        'name': 'Altar do Sangue Antigo',
        'description': 'Um altar cerimonial coberto de <span class="txt-blood">sangue seco pulsa</span> com <span class="txt-blood">energia carmesim</span>. <span class="txt-glow">Runas ancestrais brilham</span> fracamente.',
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
                'description': '<span class="txt-danger">Perca 25 HP</span> para ganhar <span class="txt-green">+3 de dano</span> base no Ataque Básico',
                'icon': 'choice-power.png',
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
                'description': '<span class="txt-danger">Perca 8 HP Máximo permanentemente</span> para ganhar uma <span class="txt-green">Relíquia Lendária</span>',
                'icon': 'choice-attack.png',
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
                'description': '50% de chance de nada acontecer, 50% de receber <span class="txt-danger">-2 de dano</span> no próximo combate',
                'icon': 'choice-curse.png',
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
        'description': 'Uma <span class="txt-glow">caixa de vidro empoeirada</span> contém três relíquias antigas. O vidro parece frágil, mas <span class="txt-danger">cortante</span>.',
        'image': 'chest.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'escolher_cegas',
                'text': 'Escolher às cegas',
                'description': 'Ganhe 1 <span class="txt-green">relíquia aleatória</span> das três disponíveis',
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'rarity': 'random'}
                ]
            },
            {
                'id': 'quebrar_vidro',
                'text': 'Quebrar o vidro',
                'description': '<span class="txt-danger">Perca 10 HP</span> pelos estilhaços, mas <span class="txt-green">escolha 1 entre as 3 relíquias</span>',
                'icon': 'choice-destroy.png',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'choose_relic', 'count': 1}
                ]
            },
            {
                'id': 'deixar_relicario',
                'text': 'Deixar o relicário',
                'description': 'Alguém pagará por isso - <span class="txt-green">ganhe 20 ouro</span>',
                'icon': 'choice-refuse.png',
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
        'description': 'Uma fonte antiga jorra um <span class="txt-red">líquido carmesim</span> brilhante. O aroma é intoxicante e promete <span class="txt-green">cura</span>.',
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
                'description': '<span class="txt-danger">Pague 20 ouro</span> para curar <span class="txt-green">30% do seu HP Máximo</span>',
                'icon': 'choice-heal.png',
                'sound': None,
                'requirements': {'min_gold': 20},
                'effects': [
                    {'type': 'lose_gold', 'value': 20},
                    {'type': 'heal_percent_max', 'value': 0.30}
                ]
            },
            {
                'id': 'banhar',
                'text': 'Banhar-se na fonte',
                'description': '<span class="txt-green">Cure 15% do HP Máximo</span> E ganhe <span class="txt-green">+5 HP Máximo permanente</span>, mas <span class="txt-danger">pague 30 ouro</span>',
                'icon': 'choice-heal.png',
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
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'vampiro_anciao': {
        'id': 'vampiro_anciao',
        'name': 'Vampiro Ancião',
        'description': 'Um <span class="txt-dark">vampiro milenar</span> descansa em seu <span class="txt-death">trono de ossos</span>. <span class="txt-blood">Seus olhos carmesim</span> te avaliam com curiosidade.',
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
                'description': '<span class="txt-green">Ganhe a Memória</span> "Sede de Sangue" (<span class="txt-green">+5% lifesteal</span>)',
                'icon': 'choice-study.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'sede_de_sangue'}
                ]
            },
            {
                'id': 'ritual_fortalecimento',
                'text': 'Ritual de fortalecimento',
                'description': '<span class="txt-danger">Perca 15 HP</span> para ganhar <span class="txt-green">+10 HP Máximo permanente</span>',
                'icon': 'choice-rest.png',
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
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 50, 'max': 50}
                ]
            },
            {
                'id': 'desafiar',
                'text': 'Desafiá-lo para combate',
                'description': 'Enfrente um Elite Lendário com <span class="txt-green">recompensa dobrada</span>',
                'icon': 'choice-attack.png',
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
        'description': 'Cápsulas misteriosas emitem uma <span class="txt-fire">luz avermelhada pulsante</span>. A tecnologia parece <span class="txt-dark">antiga</span>, mas funcional.',
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
                'description': '<span class="txt-green">Cure TODO o seu HP</span>, mas <span class="txt-danger">perca <span class="txt-green">1 Relíquia</span></span> aleatória',
                'icon': 'choice-rest.png',
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
                'description': '<span class="txt-green">Ganhe +3 HP Máximo permanente</span>',
                'icon': 'choice-inspect.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_max_hp', 'value': 3}
                ]
            },
            {
                'id': 'sair_correndo',
                'text': 'Sair correndo',
                'description': 'Pegue algumas peças soltas - <span class="txt-green">ganhe 15 ouro</span>',
                'icon': 'choice-run.png',
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
        'description': 'Um baú transbordando <span class="txt-gold">ouro</span> emana uma <span class="txt-cursed">aura sinistra</span>. O <span class="txt-glow">brilho</span> é <span class="txt-cursed">hipnotizante</span>, mas algo está errado.',
        'image': 'treasure.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'pegar_tudo',
                'text': 'Pegar tudo',
                'description': 'Ganhe <span class="txt-green">100-120 ouro</span>, mas <span class="txt-danger"><span class="txt-danger">perca 10% do HP</span> </span>Máximo permanentemente',
                'icon': 'choice-curse.png',
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
                'description': 'Ganhe <span class="txt-green">40-60 ouro</span> <span class="txt-green">com segurança</span>',
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 40, 'max': 60}
                ]
            },
            {
                'id': 'purificar',
                'text': 'Purificar o tesouro',
                'description': '<span class="txt-danger">Pague 30 HP</span> para ganhar 70 ouro limpo + Memória: Pureza',
                'icon': 'choice-destroy.png',
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
        'description': 'Um <span class="txt-danger">caçador experiente</span> oferece <span class="txt-glow">informações valiosas</span> sobre seu próximo alvo. O preço? <span class="txt-gold">Depende de você.</span>',
        'image': 'trap.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'pagar_informacao',
                'text': 'Comprar técnicas de combate',
                'description': '<span class="txt-danger">Pague 80 ouro</span> para ganhar <span class="txt-green">+4 dano</span> no Ataque de Poder',
                'icon': 'choice-trade.png',
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
                'description': '<span class="txt-danger">Perca 20 HP</span> no treino, ganhe <span class="txt-green">+3 dano</span> geral (Memória)',
                'icon': 'choice-attack.png',
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
                'description': '<span class="txt-green">Receba 25 ouro</span> agora',
                'icon': 'choice-trade.png',
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
        'description': 'Uma <span class="txt-glow">roda mística</span> gira sozinha, emanando <span class="txt-chaos">energia caótica</span>. Os símbolos <span class="txt-chaos">mudam</span> a cada rotação.',
        'image': 'cards.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'girar_roda',
                'text': 'Girar a roda (50 ouro)',
                'description': '25%: 150 ouro / 50%: 60 ouro / 25%: <span class="txt-danger">perde tudo</span> apostado',
                'icon': 'choice-trade.png',
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
                'description': '50% chance de <span class="txt-green">dobrar todo seu ouro</span>, 50% de perder tudo',
                'icon': 'choice-accept.png',
                'sound': None,
                'requirements': {'min_gold': 10},
                'effects': [
                    {'type': 'gamble_all_gold'}
                ]
            },
            {
                'id': 'observar',
                'text': 'Apenas observar',
                'description': '<span class="txt-green">Ganhe a Memória</span> "Sorte" (<span class="txt-green">+3% chance crítica</span>)',
                'icon': 'choice-inspect.png',
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
        'description': 'Uma <span class="txt-red">forja</span> consome almas ao invés de carvão. As <span class="txt-dark-pulse">chamas negras dançam</span> com fome insaciável.',
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
                'description': '<span class="txt-danger">Pague 10 HP</span> para ganhar <span class="txt-green">+2 de dano</span> base no Ataque Básico',
                'icon': 'choice-attack.png',
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
                'description': '<span class="txt-danger">Pague 10 HP</span> para ganhar <span class="txt-green">+3 de dano</span> base no Poder',
                'icon': 'choice-power.png',
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
                'description': '<span class="txt-danger">Pague 15 HP</span> para ganhar <span class="txt-green">+4 de dano</span> base no Especial',
                'icon': 'choice-accept.png',
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
                'description': '<span class="txt-danger">Pague 12 HP</span> para ganhar <span class="txt-green">+10 HP Máximo permanente</span>',
                'icon': 'choice-vitality.png',
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
        'description': 'Tomos antigos <span class="txt-whisper">sussurram segredos proibidos</span>. O conhecimento aqui é <span class="txt-cursed">perigoso</span>, mas <span class="txt-glow">poderoso</span>.',
        'image': 'library.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'estudar_ofensiva',
                'text': 'Estudar magia ofensiva',
                'description': '<span class="txt-danger">Perca 10 HP</span> (esforço mental) para ganhar <span class="txt-green">+2 de dano</span> em TODAS as habilidades',
                'icon': 'choice-power.png',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'add_all_damage', 'value': 2}
                ]
            },
            {
                'id': 'estudar_vitalidade',
                'text': 'Estudar vitalidade',
                'description': '<span class="txt-danger">Perca 10 HP</span> (esforço mental) para <span class="txt-green">ganhar +8 HP Máximo</span> permanente',
                'icon': 'choice-vitality.png',
                'sound': None,
                'requirements': {'min_hp': 15},
                'effects': [
                    {'type': 'lose_hp', 'value': 10},
                    {'type': 'gain_max_hp', 'value': 8}
                ]
            },
            {
                'id': 'ler_tudo',
                'text': 'Ler tudo (perigoso)',
                'description': '<span class="txt-danger">Perca 20 HP</span> (dano mental intenso), mas ganhe <span class="txt-green">AMBOS os bônus</span>',
                'icon': 'choice-study.png',
                'sound': None,
                'requirements': {'min_hp': 25},
                'effects': [
                    {'type': 'lose_hp', 'value': 20},
                    {'type': 'add_all_damage', 'value': 2},
                    {'type': 'gain_max_hp', 'value': 8}
                ]
            },
            {
                'id': 'ir_embora',
                'text': 'Ir embora',
                'description': 'Estou com preguiça de ler',
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'mestre_armas': {
        'id': 'mestre_armas',
        'name': 'Mestre de Armas Aposentado',
        'description': 'Um <span class="txt-glow">guerreiro lendário</span> medita em silêncio. <span class="txt-red">Cicatrizes</span> cobrem seu corpo, <span class="txt-death">testemunhas de mil batalhas</span>.',
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
                'description': '<span class="txt-danger">Perca 25 HP</span> (treino intenso), ganhe <span class="txt-green">+6 dano</span> no Ataque de Poder',
                'icon': 'choice-inspect.png',
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
                'description': '<span class="txt-green">Ganhe a Memória</span> "Disciplina" (<span class="txt-green">+3 dano</span> geral)',
                'icon': 'choice-pray.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            },
            {
                'id': 'pagar_treinamento',
                'text': 'Pagar pelo treinamento completo',
                'description': '<span class="txt-danger">Pague 70 ouro</span> para ganhar <span class="txt-green">+6 dano</span> no Poder E a Memória Disciplina',
                'icon': 'choice-trade.png',
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
        'description': 'Um <span class="txt-glow">espelho ornamentado</span> mostra seu reflexo... mas algo está <span class="txt-cursed">diferente</span>. <span class="txt-ethereal">Ele se move</span> quando você fica parado.',
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
                'icon': 'choice-inspect.png',
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
                'description': '<span class="txt-danger">Perca 15 HP</span> (estilhaços) e receba -3 dano nos próximos 3 combates',
                'icon': 'choice-destroy.png',
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
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'demonio_tentador': {
        'id': 'demonio_tentador',
        'name': 'Demônio Tentador',
        'description': 'Uma entidade de <span class="txt-chaos">puro caos</span> materializa-se diante de você. <span class="txt-cursed">Seu sorriso</span> promete <span class="txt-glow">poder</span>... por um preço.',
        'image': 'portal.png',
        'sound': None,
        'rarity': 'uncommon',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'aceitar_pacto',
                'text': 'Aceitar o pacto',
                'description': 'Cada ataque causa <span class="txt-green">+3 de dano</span>, mas <span class="txt-danger">perde 1 HP</span> ao final de cada turno seu',
                'icon': 'choice-attack.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'relic_id': 'demonic_pact'}
                ]
            },
            {
                'id': 'exigir_ouro',
                'text': 'Exigir ouro',
                'description': '<span class="txt-green">Ganhe 120 ouro</span>, mas <span class="txt-danger">perca 1 Relíquia</span>',
                'icon': 'choice-trade.png',
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
                'icon': 'choice-attack.png',
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
        'description': '<span class="txt-gold">Moedas brilham</span> no fundo de um <span class="txt-shadow">poço escuro e profundo</span>. A água está <span class="txt-cursed">turva</span>, impossível ver o fundo.',
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
                'description': '33% cada: +15 HP Máximo / <span class="txt-green">Relíquia Comum</span> / Nada',
                'icon': 'choice-accept.png',
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
                'description': 'Pegue <span class="txt-green">60-80 ouro</span>, mas 40% de chance de combate',
                'icon': 'choice-rest.png',
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
                'description': 'Ganhe <span class="txt-green">25-35 ouro</span> <span class="txt-green">com segurança</span>',
                'icon': 'choice-rest.png',
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
        'description': 'O <span class="txt-ethereal">espírito translúcido</span> de um <span class="txt-death">aventureiro falecido</span> aparece. Seus olhos carregam <span class="txt-glow">sabedoria</span> e <span class="txt-death">arrependimento</span>.',
        'image': 'tree.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'ouvir_historia',
                'text': 'Ouvir sua história',
                'description': '<span class="txt-green">Ganhe a Memória</span> "Disciplina" (<span class="txt-green">+3 dano</span> geral)',
                'icon': 'choice-accept.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_memory', 'memory_id': 'disciplina'}
                ]
            },
            {
                'id': 'aceitar_heranca',
                'text': 'Aceitar sua herança',
                'description': 'Ganhe 1 <span class="txt-green">Relíquia Comum</span> do herói',
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_relic', 'rarity': 'common'}
                ]
            },
            {
                'id': 'ajudar_passar',
                'text': 'Ajudá-lo a partir',
                'description': '<span class="txt-green">Cure 20 HP</span> (gratidão) e <span class="txt-green">ganhe 10 ouro</span>',
                'icon': 'choice-accept.png',
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
                'description': '<span class="txt-danger">Perca 10 HP</span> para ganhar <span class="txt-green">+15 HP Máximo permanente</span>',
                'icon': 'choice-attack.png',
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
        'description': '<span class="txt-glow">Três caminhos</span> se abrem à sua frente. Cada um emana uma <span class="txt-ethereal">aura diferente</span>, prometendo <span class="txt-glow">bênçãos distintas</span>.',
        'image': 'crossroads.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 1,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'caminho_vermelho',
                'text': 'Caminho Vermelho (Sangue)',
                'description': 'Ganhe <span class="txt-green">+3 dano</span> no Ataque Básico',
                'icon': 'choice-attack.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'add_skill_damage', 'skill_type': 'ataque', 'value': 3}
                ]
            },
            {
                'id': 'caminho_dourado',
                'text': 'Caminho Dourado (Riqueza)',
                'description': '<span class="txt-green">Ganhe 60 ouro</span> imediatamente',
                'icon': 'choice-trade.png',
                'sound': None,
                'requirements': {},
                'effects': [
                    {'type': 'gain_gold', 'min': 60, 'max': 60}
                ]
            },
            {
                'id': 'caminho_azul',
                'text': 'Caminho Azul (Vitalidade)',
                'description': '<span class="txt-green">Ganhe +8 HP Máximo permanente</span>',
                'icon': 'choice-rest.png',
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
        'description': '"<span class="txt-gold">OFERTAS! OFERTAS! TUDO BARATO, CHEFE!</span>" Um goblin <span class="txt-chaos">hiperativo</span> balança <span class="txt-cursed">bugigangas duvidosas</span>.',
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
                'icon': 'choice-trade.png',
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
                'description': '<span class="txt-danger">Pague 10 ouro</span> para ganhar a Memória "Amuleto" (<span class="txt-green">+2 dano no Ataque Básico</span>)',
                'icon': 'choice-accept.png',
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
                'description': '50% chance <span class="txt-green">Relíquia Épica</span> / 50% chance é lixo',
                'icon': 'choice-trade.png',
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
                'icon': 'choice-refuse.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'aposta_morte': {
        'id': 'aposta_morte',
        'name': 'Aposta com a Morte',
        'description': 'A própria <span class="txt-death">Morte</span> aparece com um <span class="txt-shadow">baralho de cartas gastas</span>. <span class="txt-whisper">"Uma partida?"</span>, ela sussurra.',
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
                'description': 'Aposte 25% do HP atual. Ganhe: <span class="txt-green">cure 50% </span>do Max HP. Perca: perde os 25% apostados',
                'icon': 'choice-trade.png',
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
                'icon': 'choice-attack.png',
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
                'icon': 'choice-run.png',
                'sound': None,
                'requirements': {},
                'effects': []
            }
        ]
    },

    'espelho_dimensional': {
        'id': 'espelho_dimensional',
        'name': 'Espelho Dimensional',
        'description': 'Seu <span class="txt-ethereal">reflexo acena</span> para você... e então <span class="txt-glow">sai do espelho</span>. É você, mas <span class="txt-chaos">não é você</span>.',
        'image': 'garden.png',
        'sound': None,
        'rarity': 'common',
        'min_act': 2,
        'conditions': {},  # Sem condições especiais
        'choices': [
            {
                'id': 'cumprimentar',
                'text': 'Cumprimentar o clone',
                'description': 'Ele te dá cópia de <span class="txt-green">1 Relíquia</span> que você já possui',
                'icon': 'choice-trade.png',
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
                'icon': 'choice-refuse.png',
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
                'icon': 'choice-accept.png',
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
