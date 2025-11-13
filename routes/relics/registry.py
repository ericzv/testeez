"""
Registry centralizado de todas as relíquias do jogo.
IDs numéricos para facilitar mudanças futuras de nomes.
"""

import json

RELIC_DEFINITIONS = {
    
    # ===== CURA E SOBREVIVÊNCIA =====
    
    '1': {
        'id': '1',
        'name': 'Sangue do Pelicano',
        'description': 'Se acerto crítico, cure 5% da sua vida máxima',
        'icon': 'relic_1.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_on_critical',
            'heal_percent': 0.05
        }
    },
    
    '2': {
        'id': '2',
        'name': 'Pedra Bálsamo',
        'description': 'Todas as curas curam 40% a mais',
        'icon': 'relic_2.png',
        'rarity': 'legendary',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_multiplier',
            'multiplier': 1.4
        }
    },
    
    '3': {
        'id': '3',
        'name': 'Óleos de Pantaleão',
        'description': 'Todas as curas curam 25% a mais',
        'icon': 'relic_3.png',
        'rarity': 'epic',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_multiplier',
            'multiplier': 1.25
        }
    },
    
    '4': {
        'id': '4',
        'name': 'Presa Vampírica',
        'description': 'Cura 3 HP cada vez que causar dano ao inimigo',
        'icon': 'relic_4.png',
        'rarity': 'common',
        'hooks': ['after_damage_dealt'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_on_damage',
            'value': 3
        }
    },
    
    '5': {
        'id': '5',
        'name': 'Espelho de Lázaro',
        'description': 'Se receber dano fatal, ao invés de morrer, fica com 20% HP máximo (perde esta relíquia e todo o ouro)',
        'icon': 'relic_5.png',
        'rarity': 'legendary',
        'hooks': ['before_death'],
        'requires_counter': False,
        'effect': {
            'type': 'death_prevention',
            'restore_percent': 0.20,
            'cost_all_gold': True,
            'destroy_self': True
        }
    },
    
    '6': {
        'id': '6',
        'name': 'Rosarium',
        'description': 'Se vencer um combate com menos de 20% HP, recupere até 20%',
        'icon': 'relic_6.png',
        'rarity': 'rare',
        'hooks': ['on_victory'],
        'requires_counter': False,
        'effect': {
            'type': 'low_hp_victory_heal',
            'threshold': 0.20,
            'restore_to': 0.20
        }
    },
    
    '7': {
        'id': '7',
        'name': 'Manto de Martinho',
        'description': 'Ignora o primeiro ataque inimigo em cada batalha',
        'icon': 'relic_7.png',
        'rarity': 'epic',
        'hooks': ['before_damage_taken'],
        'requires_counter': False,
        'effect': {
            'type': 'block_first_enemy_attack',
            'blocks': 1
        }
    },
    
    '8': {
        'id': '8',
        'name': 'Ante a Provação',
        'description': 'Se o inimigo for Boss, cura 100% do HP ao entrar na batalha',
        'icon': 'relic_8.png',
        'rarity': 'rare',
        'hooks': ['on_combat_start'],
        'requires_counter': False,
        'effect': {
            'type': 'full_heal_vs_boss',
            'boss_only': True
        }
    },
    
    '9': {
        'id': '9',
        'name': 'Água Benta',
        'description': 'Ao entrar em combate, cure 12% do HP máximo',
        'icon': 'relic_9.png',
        'rarity': 'rare',
        'hooks': ['on_combat_start'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_on_combat_start',
            'hp_percent': 0.12
        }
    },
    
    '10': {
        'id': '10',
        'name': 'Rascunho de Tagaste',
        'description': 'Para cada lembrança que tiver, recupere 3 HP no início de cada combate',
        'icon': 'relic_10.png',
        'rarity': 'rare',
        'hooks': ['on_combat_start'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_per_memory',
            'hp_per_memory': 3
        }
    },
    
    '11': {
        'id': '11',
        'name': 'Terceiro Suspiro',
        'description': 'Cada vez que usar 3x o Especial em um combate, cura 15 HP',
        'icon': 'relic_11.png',
        'rarity': 'rare',
        'hooks': ['after_special_use'],
        'requires_counter': True,
        'counter_type': 'special_uses_battle',
        'counter_threshold': 3,
        'counter_resets': False,
        'effect': {
            'type': 'heal_every_n_specials',
            'heal_amount': 15,
            'every_n': 3
        }
    },
    
    '12': {
        'id': '12',
        'name': 'Omni',
        'description': 'Cura 18 HP ao usar Ataque, Poder, Especial e Suprema no mesmo combate',
        'icon': 'relic_12.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_all_skills_used',
            'heal_amount': 18,
            'requires_all': ['attack', 'power', 'special', 'ultimate']
        }
    },
    
    # ===== DANO E CRÍTICO =====
    
    '13': {
        'id': '13',
        'name': 'Coleção de Espinhos',
        'description': '+3% chance de crítico para cada relíquia que possui',
        'icon': 'relic_13.png',
        'rarity': 'epic',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'crit_per_relic',
            'crit_percent': 0.03
        }
    },
    
    '14': {
        'id': '14',
        'name': 'Cura de Longino',
        'description': 'Ataques têm +10% vampirismo quando acertam crítico',
        'icon': 'relic_14.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'lifesteal_on_crit',
            'lifesteal_percent': 0.10
        }
    },
    
    '15': {
        'id': '15',
        'name': 'Mão de Godofredo',
        'description': 'O primeiro ataque da batalha será aplicado 2 vezes',
        'icon': 'relic_15.png',
        'rarity': 'epic',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'double_first_attack',
            'multiplier': 2
        }
    },
    
    '16': {
        'id': '16',
        'name': 'Pedra Angular',
        'description': 'Primeiro Poder ou Especial do combate sempre terá acerto crítico',
        'icon': 'relic_16.png',
        'rarity': 'rare',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'first_power_special_crit',
            'force_critical': True
        }
    },
    
    '17': {
        'id': '17',
        'name': 'Momentum Plagosus',
        'description': 'Se acerto crítico, +20% de chance de acerto crítico no próximo ataque',
        'icon': 'relic_17.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'crit_chain',
            'bonus_crit': 0.20,
            'duration': 1
        }
    },
    
    '18': {
        'id': '18',
        'name': 'Primum Nocere',
        'description': 'Primeiro ataque realizado no combate tem +20% dano base',
        'icon': 'relic_18.png',
        'rarity': 'rare',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'first_attack_bonus',
            'damage_bonus': 0.20
        }
    },
    
    '19': {
        'id': '19',
        'name': 'Primum Sumere',
        'description': 'Primeiro ataque realizado no combate tem +5% vampirismo',
        'icon': 'relic_19.png',
        'rarity': 'common',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'first_attack_lifesteal',
            'lifesteal_bonus': 0.05
        }
    },
    
    '20': {
        'id': '20',
        'name': 'Acumuladora',
        'description': '+2 dano no Ataque Básico. Acumula permanentemente +1 dano a cada 2 usos.',
        'icon': 'relic_20.png',
        'rarity': 'rare',
        'hooks': ['on_acquire', 'after_basic_attack'],
        'requires_counter': True,
        'counter_type': 'permanent_stacks_conditional',
        'counter_threshold': 2,
        'effect': {
            'type': 'accumulating_damage',
            'skill_type': 'attack',
            'initial_bonus': 2,
            'stack_bonus': 1
        }
    },
    
    '21': {
        'id': '21',
        'name': 'Paradoxo da Liberdade',
        'description': '+3 dano no Poder. Acumula permanentemente +1 sempre que derrotar inimigo SEM usar Poder',
        'icon': 'relic_21.png',
        'rarity': 'rare',
        'hooks': ['on_acquire', 'on_kill'],
        'requires_counter': True,
        'counter_type': 'permanent_stacks',
        'counter_threshold': None,
        'effect': {
            'type': 'paradox_power',
            'initial_bonus': 3,
            'stack_bonus': 1,
            'condition': 'kill_without_power'
        }
    },
    
    '22': {
        'id': '22',
        'name': 'Petrus',
        'description': 'Poder causa +2 dano para cada relíquia que possui',
        'icon': 'relic_22.png',
        'rarity': 'epic',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'damage_per_relic',
            'skill_type': 'power',
            'damage_per_relic': 2
        }
    },
    
    '23': {
        'id': '23',
        'name': 'Doxologia',
        'description': 'Especial custa 1 energia a menos',
        'icon': 'relic_23.png',
        'rarity': 'epic',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'special_energy_reduction',
            'energy_cost_reduction': 1
        }
    },
    
    '24': {
        'id': '24',
        'name': 'Última Graça',
        'description': 'Dobra o dano da Suprema, mas só pode ser utilizada 1x por combate',
        'icon': 'relic_24.png',
        'rarity': 'legendary',
        'hooks': ['before_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'ultimate_trade',
            'damage_multiplier': 2.0,
            'uses_per_battle': 1
        }
    },
    
    '25': {
        'id': '25',
        'name': 'Discipulato',
        'description': 'O 10º ataque de qualquer tipo sempre terá dano dobrado',
        'icon': 'relic_25.png',
        'rarity': 'rare',
        'hooks': ['before_attack', 'after_attack'],
        'requires_counter': True,
        'counter_type': 'total_attacks',
        'counter_threshold': 10,
        'counter_resets': True,
        'effect': {
            'type': 'damage_multiplier_on_threshold',
            'multiplier': 2.0,
            'condition': 'every_10th_attack'
        }
    },
    
    '26': {
        'id': '26',
        'name': 'Báculo Carregado',
        'description': '+4 dano no Poder, fixo. Acumula +1 dano para cada inimigo finalizado com Poder',
        'icon': 'relic_26.png',
        'rarity': 'rare',
        'hooks': ['on_acquire', 'on_kill'],
        'requires_counter': True,
        'counter_type': 'permanent_stacks',
        'counter_threshold': None,
        'effect': {
            'type': 'power_kill_bonus',
            'initial_bonus': 4,
            'stack_bonus': 1,
            'condition': 'kill_with_power'
        }
    },
    
    '''
    '27': {
        'id': '27',
        'name': 'Pedra Esmagadora',
        'description': 'Realizar o mesmo ataque 3x seguidas diminui a defesa do inimigo',
        'icon': 'relic_27.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'repetition_debuff',
            'required_repeats': 3,
            'defense_reduction': 0.15
        }
    },
    '''

    '28': {
        'id': '28',
        'name': 'Ritual de Sangue',
        'description': 'O 5º uso do Especial sempre terá +15% vampirismo (persiste entre batalhas)',
        'icon': 'relic_28.png',
        'rarity': 'rare',
        'hooks': ['before_attack', 'after_special_use'],
        'requires_counter': True,
        'counter_type': 'special_uses',
        'counter_threshold': 5,
        'counter_resets': False,
        'effect': {
            'type': 'lifesteal_on_threshold',
            'lifesteal_percent': 0.15,
            'condition': 'every_5th_special'
        }
    },
    
    # ===== RECURSOS E ECONOMIA =====
    
    '29': {
        'id': '29',
        'name': 'Escritos de Agostinho',
        'description': 'Ganha +2 energia no primeiro turno de cada batalha',
        'icon': 'relic_29.png',
        'rarity': 'rare',
        'hooks': ['on_combat_start'],
        'requires_counter': False,
        'effect': {
            'type': 'gain_energy_first_turn',
            'value': 2
        }
    },
    
    '30': {
        'id': '30',
        'name': 'Corrente de Pedro',
        'description': 'Ao usar seus 4 ataques diferentes no inimigo, ganhe +4 energia',
        'icon': 'relic_30.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'all_attacks_reward',
            'energy_reward': 4,
            'requires_all': ['attack', 'power', 'special', 'ultimate']
        }
    },
    
    '31': {
        'id': '31',
        'name': 'Trinitas',
        'description': 'Cada vez que usar 3x Especial em um combate, ganha +5 energia',
        'icon': 'relic_31.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'special_every_n_in_battle',
            'energy_reward': 5,
            'required_skill': 'special',
            'every_n': 3
        }
    },
    
    '32': {
        'id': '32',
        'name': 'Dízimo',
        'description': 'A cada 10 ataques realizados de qualquer tipo, ganhe +5 energia',
        'icon': 'relic_32.png',
        'rarity': 'epic',
        'hooks': ['after_attack'],
        'requires_counter': True,
        'counter_type': 'total_attacks',
        'counter_threshold': 10,
        'counter_resets': True,
        'effect': {
            'type': 'energy_every_n_attacks',
            'energy_reward': 5,
            'every_n': 10
        }
    },
    
    '33': {
        'id': '33',
        'name': 'Olho de Midas',
        'description': 'Ganha +5 de ouro sempre que derrotar um inimigo',
        'icon': 'relic_33.png',
        'rarity': 'common',
        'hooks': ['on_kill'],
        'requires_counter': False,
        'effect': {
            'type': 'gold_on_kill',
            'value': 5
        }
    },
    
    '34': {
        'id': '34',
        'name': 'Coroa do Rei Sol',
        'description': 'Ganha 12 de ouro se finalizar inimigo com Suprema',
        'icon': 'relic_34.png',
        'rarity': 'rare',
        'hooks': ['on_kill'],
        'requires_counter': False,
        'effect': {
            'type': 'gold_on_ultimate_kill',
            'value': 12
        }
    },
    
    '35': {
        'id': '35',
        'name': 'Generosidade de Francisco',
        'description': 'Ao receber ouro, receba 25% a mais (de qualquer fonte)',
        'icon': 'relic_35.png',
        'rarity': 'rare',
        'hooks': ['on_rewards'],
        'requires_counter': False,
        'effect': {
            'type': 'reward_multiplier',
            'reward_type': 'gold',
            'multiplier': 1.25
        }
    },
    
    '36': {
        'id': '36',
        'name': 'Tesouro de Lourenço',
        'description': '+180 ouro',
        'icon': 'relic_36.png',
        'rarity': 'rare',
        'hooks': ['on_acquire'],
        'requires_counter': False,
        'effect': {
            'type': 'instant_gold',
            'value': 180
        }
    },
    
    '37': {
        'id': '37',
        'name': 'Sacrifício de Abraão',
        'description': 'Perca 1 relíquia aleatória → receba 300 de ouro',
        'icon': 'relic_37.png',
        'rarity': 'epic',
        'hooks': ['on_acquire'],
        'requires_counter': False,
        'effect': {
            'type': 'sacrifice_relic',
            'gold_reward': 300
        }
    },
    
    '38': {
        'id': '38',
        'name': 'Ampulheta de Bento',
        'description': 'Inimigos dropam o dobro de ampulhetas',
        'icon': 'relic_38.png',
        'rarity': 'rare',
        'hooks': ['on_rewards'],
        'requires_counter': False,
        'effect': {
            'type': 'reward_multiplier',
            'reward_type': 'hourglasses',
            'multiplier': 2.0
        }
    },
    
    '39': {
        'id': '39',
        'name': 'Moedas de Mateus',
        'description': 'Quando ganhar ampulheta, ganhe 5 de ouro por cada ampulheta recebida',
        'icon': 'relic_39.png',
        'rarity': 'rare',
        'hooks': ['on_rewards'],
        'requires_counter': False,
        'effect': {
            'type': 'hourglass_to_gold',
            'gold_per_hourglass': 5
        }
    },
    
    '40': {
        'id': '40',
        'name': 'Hora Extra',
        'description': 'Sempre que receber Ampulhetas Eternas, receba +1',
        'icon': 'relic_40.png',
        'rarity': 'rare',
        'hooks': ['on_rewards'],
        'requires_counter': False,
        'effect': {
            'type': 'hourglass_bonus',
            'bonus_amount': 1
        }
    },
    
    # ===== STATS E PASSIVOS =====
    
    '41': {
        'id': '41',
        'name': 'Coração Robusto',
        'description': '+18 HP máximo',
        'icon': 'relic_41.png',
        'rarity': 'common',
        'hooks': ['on_acquire'],
        'requires_counter': False,
        'effect': {
            'type': 'stat_boost',
            'stat': 'max_hp',
            'value': 18
        }
    },
    
    '42': {
        'id': '42',
        'name': 'Exercícios Espirituais',
        'description': '+1 Energia máxima',
        'icon': 'relic_42.png',
        'rarity': 'common',
        'hooks': ['on_acquire'],
        'requires_counter': False,
        'effect': {
            'type': 'stat_boost',
            'stat': 'max_energy',
            'value': 1
        }
    },
    
    '43': {
        'id': '43',
        'name': 'Muralha de Constantino',
        'description': '+1% de bloqueio para cada relíquia que possui',
        'icon': 'relic_43.png',
        'rarity': 'rare',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'block_per_relic',
            'block_percent': 0.01
        }
    },
    
    '44': {
        'id': '44',
        'name': 'Amuleto Sedento',
        'description': 'Ataque Básico cura 1 HP para cada relíquia que possui',
        'icon': 'relic_44.png',
        'rarity': 'rare',
        'hooks': ['after_attack'],
        'requires_counter': False,
        'effect': {
            'type': 'heal_per_relic_on_attack',
            'skill_type': 'attack',
            'hp_per_relic': 1
        }
    },
    
    # ===== META E ESPECIAIS =====
    
    '45': {
        'id': '45',
        'name': 'Gema Vital',
        'description': 'Toda cura restaura 3 HP a mais',
        'icon': 'relic_45.png',
        'rarity': 'rare',
        'hooks': ['passive'],
        'requires_counter': False,
        'effect': {
            'type': 'flat_heal_bonus',
            'value': 3
        }
    },
    
    '46': {
        'id': '46',
        'name': 'Diário Antigo',
        'description': '+1 opção de lembrança quando receber recompensa de Lembranças',
        'icon': 'relic_46.png',
        'rarity': 'rare',
        'hooks': ['on_memory_reward'],
        'requires_counter': False,
        'effect': {
            'type': 'extra_memory_option',
            'bonus_options': 1
        }
    },
    
    '47': {
        'id': '47',
        'name': 'Guia de Contemplação',
        'description': '+1 opção de escolha de inimigo (1 inimigo a mais é gerado)',
        'icon': 'relic_47.png',
        'rarity': 'rare',
        'hooks': ['on_enemy_generation'],
        'requires_counter': False,
        'effect': {
            'type': 'extra_enemy_option',
            'bonus_enemies': 1
        }
    },
    
    '48': {
        'id': '48',
        'name': 'Relicário de Helena',
        'description': 'Bosses agora deixam uma relíquia a mais',
        'icon': 'relic_48.png',
        'rarity': 'legendary',
        'hooks': ['on_boss_rewards'],
        'requires_counter': False,
        'effect': {
            'type': 'bonus_boss_relics',
            'bonus_amount': 1
        }
    },
    
    '49': {
        'id': '49',
        'name': 'Coleção de Tecla',
        'description': '+1 opção ao escolher Relíquias',
        'icon': 'relic_49.png',
        'rarity': 'epic',
        'hooks': ['on_relic_reward'],
        'requires_counter': False,
        'effect': {
            'type': 'extra_relic_option',
            'bonus_options': 1
        }
    },
    
    '50': {
        'id': '50',
        'name': 'Sangue Coagulado',
        'description': '+4 dano no Ataque básico, fixo. Acumula +2 cada vez que usar Ataque Básico nesse combate',
        'icon': 'relic_50.png',
        'rarity': 'rare',
        'hooks': ['on_acquire', 'after_basic_attack'],
        'requires_counter': True,
        'counter_type': 'battle_stacks',
        'counter_threshold': None,
        'counter_resets': True,
        'effect': {
            'type': 'battle_accumulating_damage',
            'skill_type': 'attack',
            'initial_bonus': 4,
            'stack_bonus': 2
        }
    },
}

def get_relic_definition(relic_id):
    """Retorna a definição de uma relíquia"""
    return RELIC_DEFINITIONS.get(relic_id)

def get_all_relic_ids():
    """Retorna lista de IDs de todas as relíquias"""
    return list(RELIC_DEFINITIONS.keys())

RARITY_WEIGHTS = {
    'first_relic': {
        'common': 50,
        'rare': 35,
        'rare': 10,
        'epic': 5,
        'legendary': 0
    },
    'last_boss': {
        'common': 20,
        'rare': 35,
        'rare': 25,
        'epic': 15,
        'legendary': 5
    }
}

def get_rarity_weights(context):
    """Retorna pesos de raridade para um contexto"""
    return RARITY_WEIGHTS.get(context, RARITY_WEIGHTS['first_relic'])