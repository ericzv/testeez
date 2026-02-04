# routes/battle/reward_system.py - Sistema de recompensas e lembranças
import random
from datetime import datetime
from flask import Blueprint, request, redirect, url_for, flash, session, jsonify

from database import db
from models import Player, PlayerRunBuff

# Logging
from utils.logger import get_logger
logger = get_logger(__name__)


# ===============================================================================
# IMPORTANTE: SISTEMA DE CONTADORES DE RUN
# ===============================================================================
# 
# Sempre que QUALQUER função neste arquivo ou em outro lugar adicionar recompensas
# ao jogador (crystals, gold, hourglasses), é OBRIGATÓRIO também incrementar 
# os contadores de run correspondentes:
#
# player.crystals += amount           →  player.run_crystals_gained += amount
# player.run_gold += amount           →  player.run_gold_gained += amount  
# player.eternal_hourglasses += amount →  player.run_hourglasses_gained += amount
#
# ESTES CONTADORES SÃO USADOS PARA:
# - Estatísticas da run na tela de morte
# - Tracking de progresso do jogador
# - Possíveis achievements futuros
#
# LOCAIS ATUAIS QUE APLICAM RECOMPENSAS:
# - battle.py: apply_victory_rewards() 
#
# LOCAIS FUTUROS QUE PODEM APLICAR RECOMPENSAS:
# - Sistema de baús/tesouros
# - Achievements que dão recompensas
# - Eventos especiais
# - Daily rewards
# - Quest rewards
# - Shop purchases que incluem bônus
# - Qualquer outro sistema de recompensa
#
# ⚠️  SEMPRE ATUALIZAR ESTA LISTA QUANDO ADICIONAR NOVA FONTE DE RECOMPENSAS!
# ===============================================================================

# Sistema modular de recompensas
# NOTA: 'memories' foi removido pois agora TODOS os inimigos dão lembrança
REWARD_SYSTEM = {
    'crystals': {
        'weight': 33,
        'icon': 'crystal.png',
        'name': 'Cristais de Memória',
        'permanent': True,
        'color': '#00bfff'
    },
    'gold': {
        'weight': 33,
        'icon': 'gold.png',
        'name': 'Ouro',
        'permanent': False,
        'color': '#ffd700'
    },
    'hourglasses': {
        'weight': 34,
        'icon': 'hourglass.png',
        'name': 'Ampulhetas Eternas',
        'permanent': True,
        'color': '#9b59b6'
    }
}

# Sistema de Lembranças
# Chave 'values': {grupo: bônus} — Grupos 1-6 para lembranças padrão, Grupo 7 para especiais
MEMORY_TYPES = {
    # === GRUPOS 1-6 (todas) ===
    'maxhp': {
        'name': 'Arx',
        'description': 'Aumento do HP Máximo',
        'icon': 'maxhp.png',
        'values': {1: 5, 2: 8, 3: 12, 4: 15, 5: 18, 6: 20}
    },
    'heal': {
        'name': 'Recuperatio',
        'description': 'Cura Instantânea',
        'icon': 'heal.png',
        'values': {1: 20, 2: 35, 3: 55, 4: 70, 5: 90, 6: 120}
    },
    'damage_attack': {
        'name': 'Dominatio',
        'description': 'Aumenta dano do Ataque Básico',
        'icon': 'damageattack.png',
        'values': {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 7}
    },
    'damage_special': {
        'name': 'Regalitas',
        'description': 'Aumenta dano do Especial',
        'icon': 'damagespecial.png',
        'values': {1: 1, 2: 2, 3: 3, 4: 5, 5: 6, 6: 8}
    },
    'damage_power': {
        'name': 'Tyrannitas',
        'description': 'Aumenta dano do Poder',
        'icon': 'damagepower.png',
        'values': {1: 1, 2: 2, 3: 3, 4: 5, 5: 6, 6: 8}
    },
    'damage_ultimate': {
        'name': 'Suprematia',
        'description': 'Aumenta dano da Suprema',
        'icon': 'damageultimate.png',
        'values': {1: 3, 2: 5, 3: 7, 4: 9, 5: 11, 6: 14}
    },
    'dodge_chance': {
        'name': 'Robur',
        'description': 'Aumenta chance de esquiva',
        'icon': 'robur.png',
        'values': {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 7}
    },
    # === GRUPOS 4-6 (apenas) ===
    'crit_chance': {
        'name': 'Fervor',
        'description': 'Aumenta chance de acerto crítico',
        'icon': 'fervor.png',
        'values': {4: 4, 5: 6, 6: 8}
    },
    'crit_damage': {
        'name': 'Furia',
        'description': 'Aumenta dano de acertos críticos',
        'icon': 'furia.png',
        'values': {4: 12, 5: 18, 6: 25}
    },
    'damage_flat': {
        'name': 'Constantia',
        'description': 'Aumenta dano fixo de todos os ataques',
        'icon': 'constantia.png',
        'values': {4: 2, 5: 3, 6: 4}
    },
    'hp_regen': {
        'name': 'Perseverantia',
        'description': 'Regenera HP a cada turno',
        'icon': 'perserverantia.png',
        'values': {4: 2, 5: 4, 6: 6}
    },
    # === GRUPO 7 (especiais) ===
    'maxmp': {
        'name': 'Empyreum',
        'description': 'Aumento da Energia Máxima',
        'icon': 'empyreum.png',
        'values': {7: 2}
    },
    'damage_global': {
        'name': 'Ferocitas',
        'description': 'Aumenta o dano de todos os ataques',
        'icon': 'ferocitas.png',
        'values': {7: 7}
    }
}

def determine_enemy_reward_type():
    """Determina o tipo de recompensa do inimigo baseado em probabilidades"""
    import random
    
    # Criar lista ponderada
    weighted_rewards = []
    for reward_type, config in REWARD_SYSTEM.items():
        weight = int(config['weight'] * 100)  # Converter para inteiro
        weighted_rewards.extend([reward_type] * weight)
    
    return random.choice(weighted_rewards)

def calculate_gold_reward(enemy_number, enemy_group, equipment_bonus_percent):
    """Calcula recompensa de ouro baseado no número do inimigo e grupo"""
    # Base: 3-6 ouro, aumentando +1 a cada 5 inimigos
    tier_bonus = enemy_number // 5
    base_gold = random.randint(3 + tier_bonus, 6 + tier_bonus)

    # Modificador por grupo do inimigo
    group_multipliers = {1: 1.0, 2: 1.1, 3: 1.2, 4: 1.4, 5: 1.6, 6: 1.8, 7: 2.0}
    group_multiplier = group_multipliers.get(enemy_group, 1.0)

    # Aplicar modificadores
    gold_with_group = int(base_gold * group_multiplier)
    gold_with_equipment = int(gold_with_group * (1 + equipment_bonus_percent / 100))

    return gold_with_equipment

def calculate_hourglass_reward(enemy_group):
    """Calcula recompensa de ampulhetas baseado no grupo do inimigo"""
    hourglass_by_group = {
        1: 1,  # Grupo 1
        2: 1,  # Grupo 2
        3: 2,  # Grupo 3
        4: 2,  # Grupo 4
        5: 3,  # Grupo 5
        6: 3,  # Grupo 6
        7: 4   # Grupo 7
    }
    return hourglass_by_group.get(enemy_group, 1)

def get_player_run_buffs(player_id):
    """Retorna todos os buffs de run do jogador"""
    return PlayerRunBuff.query.filter_by(player_id=player_id).all()

def get_run_buff_total(player_id, buff_type):
    """Retorna o valor total de um tipo específico de buff"""
    buff = PlayerRunBuff.query.filter_by(player_id=player_id, buff_type=buff_type).first()
    return buff.total_value if buff else 0.0

def add_run_buff(player_id, buff_type, value):
    """Adiciona ou incrementa um buff de run"""
    buff = PlayerRunBuff.query.filter_by(player_id=player_id, buff_type=buff_type).first()
    
    if buff:
        buff.total_value += value
        buff.count += 1
    else:
        buff = PlayerRunBuff(
            player_id=player_id,
            buff_type=buff_type, 
            total_value=value,
            count=1
        )
        db.session.add(buff)
    
    db.session.commit()
    return buff

def select_random_memory_options():
    """
    Seleciona tipos aleatórios de memória para o jogador escolher.
    Base: 3 opções
    +1 se tiver relíquia ID 46 (Rosário de Dominic)
    Filtra lembranças disponíveis pelo grupo do inimigo (1-7).
    """
    from models import Player, PlayerRelic

    count = 3

    # OBTER GRUPO DO INIMIGO DA SESSÃO
    pending_memory = session.get('pending_memory_reward', {})
    enemy_group = pending_memory.get('enemy_group', 1)
    logger.debug(f"Grupo do inimigo: {enemy_group}")

    # Verificar relíquia de opção extra
    player = Player.query.first()
    if player:
        logger.debug(f"DEBUG: Verificando relíquias do player {player.id}")

        # Buscar TODAS as relíquias ativas para debug
        all_relics = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).all()

        logger.debug(f"DEBUG: Relíquias ativas: {[r.relic_id for r in all_relics]}")

        # Tentar buscar ID 46 como string E como int
        extra_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).filter(
            (PlayerRelic.relic_id == '46') | (PlayerRelic.relic_id == 46)
        ).first()

        if extra_relic:
            count += 1
            logger.debug(f"Rosário de Dominic encontrado! +1 opção ({count} opções)")
        else:
            logger.error(f"Rosário de Dominic NÃO encontrado")
    else:
        logger.error("DEBUG: Player não encontrado!")

    # FILTRAR tipos de memória baseado no grupo do inimigo
    available_types = []
    for memory_type, config in MEMORY_TYPES.items():
        # Verificar se esta lembrança está disponível para o grupo atual
        if enemy_group in config['values']:
            available_types.append(memory_type)
        else:
            logger.debug(f"{memory_type} não disponível para grupo {enemy_group}")

    # Selecionar tipos aleatórios (sem repetição)
    if len(available_types) == 0:
        logger.error("ERRO: Nenhum tipo de memória disponível!")
        return ['maxhp', 'heal', 'damage_attack']  # Fallback seguro

    selected = random.sample(available_types, min(count, len(available_types)))
    logger.debug(f"DEBUG: {count} opções selecionadas: {selected}")

    return selected

def format_buff_display_value(buff_type, total_value):
    """Formata o valor do buff para exibição"""
    if buff_type == 'maxhp':
        return f"+{int(total_value)} ↑HP"
    elif buff_type == 'maxenergy':
        return f"+{int(total_value)} Energia"
    elif buff_type == 'heal':
        return f"{int(total_value)} HP"
    else:  # Buffs de dano (agora FLAT, não porcentagem)
        return f"+{int(total_value)} Dano"

def format_memory_value_display(memory_type, value):
    """Formata o valor da memória para exibição no pop-up"""
    if memory_type == 'maxhp':
        return f"+{int(value)} HP Máximo"
    elif memory_type == 'maxenergy':
        return f"+{int(value)} Energia Máxima"
    elif memory_type == 'heal':
        return f"Cura {int(value)} HP"
    elif memory_type == 'damage_global':
        return f"+{int(value)} de Qualquer Dano"
    elif memory_type == 'damage_attack':
        return f"+{int(value)} de Dano com Ataque"
    elif memory_type == 'damage_special':
        return f"+{int(value)} de Dano com Especial"
    elif memory_type == 'damage_power':
        return f"+{int(value)} de Dano com Poder"
    elif memory_type == 'damage_ultimate':
        return f"+{int(value)} de Dano com Suprema"
    else:
        return f"+{value}"

# ----- ROTAS PARA SISTEMA DE MEMÓRIAS -----

def register_memory_routes(bp):
    """Registra as rotas de memória no blueprint fornecido"""
    
    @bp.route('/select_memory', methods=['POST'])
    def select_memory():
        """Rota para selecionar uma memória específica"""
        try:
            data = request.get_json()
            memory_type = data.get('memory_type')
            enemy_group = data.get('enemy_group', 1)

            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})

            if memory_type not in MEMORY_TYPES:
                return jsonify({'success': False, 'message': 'Tipo de memória inválido'})

            # Obter valor baseado no grupo do inimigo
            memory_config = MEMORY_TYPES[memory_type]

            # VALIDAR se o grupo existe para esta lembrança
            if enemy_group not in memory_config['values']:
                return jsonify({
                    'success': False,
                    'message': f'Grupo {enemy_group} inválido para {memory_type}'
                })

            value = memory_config['values'][enemy_group]
            
            # Aplicar o buff
            buff = add_run_buff(player.id, memory_type, value)

            # ===== RECALCULAR CACHE SE LEMBRANÇA AFETA DANO/DEFESA =====
            cache_affecting_types = [
                'damage_global', 'damage_attack', 'damage_power', 'damage_special', 'damage_ultimate',
                'maxhp', 'maxmp', 'maxenergy', 'crit_chance', 'crit_damage'
            ]
            
            if memory_type in cache_affecting_types:
                from ..battle_cache import calculate_attack_cache
                calculate_attack_cache(player.id)
                logger.debug(f"CACHE RECALCULADO - Lembrança {memory_config['name']} ({memory_type}) aplicada")
            
            # Aplicar efeitos imediatos
            if memory_type == 'maxhp':
                # Aumentar HP máximo e atual
                old_max_hp = player.max_hp
                player.max_hp += value
                player.hp += value  # Também aumenta HP atual

            elif memory_type == 'maxmp' or memory_type == 'maxenergy':
                # Aumentar Energia máxima e atual (maxmp = Empyreum)
                old_max_energy = player.max_energy
                player.max_energy += value
                player.energy += value  # Também aumenta Energia atual
                logger.debug(f"Empyreum aplicado! Energia máxima: {old_max_energy} → {player.max_energy}")

            elif memory_type == 'heal':
                # Curar instantaneamente
                player.hp = min(player.hp + value, player.max_hp)

            # ===== RESETAR CONTADOR DE REROLL DE MEMÓRIAS =====
            player.memory_reroll_count = 0
            logger.debug("🔄 Contador de reroll de memórias resetado")

            db.session.commit()

            # ===== LIMPAR RECOMPENSA E OPÇÕES DA SESSÃO =====
            session.pop('pending_memory_reward', None)
            logger.info("Recompensa de memória e opções REMOVIDAS da sessão")
            
            return jsonify({
                'success': True,
                'message': f'{memory_config["name"]} adquirida!',
                'buff_type': memory_type,
                'value': value,
                'total_count': buff.count,
                'total_value': buff.total_value
            })
            
        except Exception as e:
            logger.error(f"Erro ao selecionar memória: {str(e)}")
            return jsonify({'success': False, 'message': str(e)})

    @bp.route('/get_memory_options')
    def get_memory_options():
        """Retorna as opções de memória disponíveis para escolha"""
        try:
            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})
            
            # ===== VERIFICAR SE JÁ EXISTEM OPÇÕES SALVAS NA SESSÃO =====
            pending_memory = session.get('pending_memory_reward', {})
            
            if 'memory_options' in pending_memory and pending_memory['memory_options']:
                # Usar opções já geradas
                selected_types = pending_memory['memory_options']
                logger.debug(f"Usando opções SALVAS da sessão: {selected_types}")
            else:
                # Gerar novas opções apenas se não existirem
                selected_types = select_random_memory_options()
                
                # Salvar as opções geradas na sessão
                pending_memory['memory_options'] = selected_types
                session['pending_memory_reward'] = pending_memory
                session.modified = True
                logger.debug(f"Novas opções GERADAS e SALVAS: {selected_types}")
            
            # Obter buffs atuais do jogador
            current_buffs = get_player_run_buffs(player.id)
            buff_counts = {buff.buff_type: buff.count for buff in current_buffs}
            
            # Obter grupo do inimigo derrotado
            enemy_group = pending_memory.get('enemy_group', 1)

            # Preparar dados para retorno
            options = []
            for memory_type in selected_types:
                config = MEMORY_TYPES[memory_type]
                value = config['values'][enemy_group]
                formatted_value = format_memory_value_display(memory_type, value)
                
                options.append({
                    'type': memory_type,
                    'name': config['name'],
                    'description': config['description'],
                    'icon': config['icon'],
                    'current_count': buff_counts.get(memory_type, 0),
                    'value': value,
                    'formatted_value': formatted_value
                })
            
            return jsonify({
                'success': True,
                'options': options
            })
            
        except Exception as e:
            logger.error(f"Erro ao obter opções de memória: {str(e)}")
            return jsonify({'success': False, 'message': str(e)})
        
    @bp.route('/get_active_run_buffs')
    def get_active_run_buffs():
        """Retorna todos os buffs de run ativos do jogador"""
        try:
            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})
            
            buffs = get_player_run_buffs(player.id)
            
            active_buffs = []
            for buff in buffs:
                if buff.count > 0:
                    config = MEMORY_TYPES[buff.buff_type]
                    active_buffs.append({
                        'type': buff.buff_type,
                        'name': config['name'],
                        'description': config['description'],
                        'icon': config['icon'],
                        'total_value': buff.total_value,
                        'count': buff.count,
                        'display_value': format_buff_display_value(buff.buff_type, buff.total_value)
                    })
            
            return jsonify({
                'success': True,
                'buffs': active_buffs
            })
            
        except Exception as e:
            logger.error(f"Erro ao obter buffs ativos: {str(e)}")
            return jsonify({'success': False, 'message': str(e)})

    @bp.route('/check_memory_reward')
    def check_memory_reward():
        """Verifica se há recompensa de memória pendente"""
        try:
            player = Player.query.first()
            if not player:
                # Se não há player, limpar session
                session.pop('pending_memory_reward', None)
                return jsonify({
                    'success': True,
                    'has_memory_reward': False
                })
            
            pending_memory = session.get('pending_memory_reward')
            
            if pending_memory:
                return jsonify({
                    'success': True,
                    'has_memory_reward': True,
                    'enemy_group': pending_memory['enemy_group']
                })
            else:
                return jsonify({
                    'success': True,
                    'has_memory_reward': False
                })
                
        except Exception as e:
            logger.error(f"Erro ao verificar recompensa de memória: {str(e)}")
            return jsonify({'success': False, 'message': str(e)})
        
# ===============================================================================
# TEMPLATE PARA FUTURAS FUNÇÕES DE RECOMPENSA
# ===============================================================================
# 
# def nova_funcao_que_da_recompensas(player, amount, reward_type):
#     """Template para novas funções que dão recompensas"""
#     
#     if reward_type == 'crystals':
#         player.crystals += amount
#         player.run_crystals_gained += amount  # ← NÃO ESQUECER!
#         
#     elif reward_type == 'gold':
#         player.run_gold += amount
#         player.run_gold_gained += amount  # ← NÃO ESQUECER!
#         
#     elif reward_type == 'hourglasses':
#         player.eternal_hourglasses += amount
#         player.run_hourglasses_gained += amount  # ← NÃO ESQUECER!
#     
#     db.session.commit()
#     return True
#
# ===============================================================================