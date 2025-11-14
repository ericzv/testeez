# routes/battle/reward_system.py - Sistema de recompensas e lembranças
import random
from datetime import datetime
from flask import Blueprint, request, redirect, url_for, flash, session, jsonify

from database import db
from models import Player, PlayerRunBuff

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
MEMORY_TYPES = {
    'maxhp': {
        'name': 'Arx',
        'description': 'Aumento do HP Máximo',
        'icon': 'maxhp.png',
        'values': {1: 4, 2: 8, 3: 12, 4: 16}
    },
    'maxmp': {
        'name': 'Empyreum',
        'description': 'Aumento da Energia Máxima',
        'icon': 'maxmp.png',
        'values': {3: 1, 4: 2}
    },
    'heal': {
        'name': 'Recuperatio',
        'description': 'Cura Instantânea',
        'icon': 'heal.png', 
        'values': {1: 40, 2: 80, 3: 120, 4: 160}
    },
    'damage_global': {
        'name': 'Ferocitas',
        'description': 'Aumenta o dano de todos os ataques',
        'icon': 'damage.png',
        'values': {3: 2, 4: 4}
    },
    'damage_attack': {
        'name': 'Dominatio',
        'description': 'Aumenta dano do Ataque Básico',
        'icon': 'damageattack.png',
        'values': {1: 2, 2: 3, 3: 4, 4: 6}
    },
    'damage_special': {
        'name': 'Regalitas',
        'description': 'Aumenta dano do Especial',
        'icon': 'damagespecial.png',
        'values': {1: 2, 2: 4, 3: 5, 4: 7}
    },
    'damage_power': {
        'name': 'Tyrannitas',
        'description': 'Aumenta dano do Poder',
        'icon': 'damagepower.png',
        'values': {1: 2, 2: 4, 3: 5, 4: 7}
    },
    'damage_ultimate': {
        'name': 'Suprematia',
        'description': 'Aumenta dano da Suprema',
        'icon': 'damageultimate.png', 
        'values': {1: 4, 2: 6, 3: 8, 4: 12}
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

def calculate_gold_reward(enemy_number, rarity, equipment_bonus_percent):
    """Calcula recompensa de ouro baseado no número do inimigo e modificadores"""
    # Base: 3-6 ouro, aumentando +1 a cada 5 inimigos
    tier_bonus = enemy_number // 5
    base_gold = random.randint(3 + tier_bonus, 6 + tier_bonus)
    
    # Modificador de raridade
    rarity_multipliers = {1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0}
    rarity_multiplier = rarity_multipliers.get(rarity, 1.0)
    
    # Aplicar modificadores
    gold_with_rarity = int(base_gold * rarity_multiplier)
    gold_with_equipment = int(gold_with_rarity * (1 + equipment_bonus_percent / 100))
    
    return gold_with_equipment

def calculate_hourglass_reward(rarity):
    """Calcula recompensa de ampulhetas baseado apenas na raridade"""
    hourglass_by_rarity = {
        1: 1,  # Comum
        2: 2,  # Raro
        3: 3,  # Épico
        4: 4   # Lendário
    }
    return hourglass_by_rarity.get(rarity, 1)

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
    """
    from models import Player, PlayerRelic
    
    count = 3
    
    # OBTER RARIDADE DO INIMIGO DA SESSÃO
    pending_memory = session.get('pending_memory_reward', {})
    enemy_rarity = pending_memory.get('enemy_rarity', 1)
    print(f"🎲 Raridade do inimigo: {enemy_rarity}")
    
    # Verificar relíquia de opção extra
    player = Player.query.first()
    if player:
        print(f"🔍 DEBUG: Verificando relíquias do player {player.id}")
        
        # Buscar TODAS as relíquias ativas para debug
        all_relics = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).all()
        
        print(f"🔍 DEBUG: Relíquias ativas: {[r.relic_id for r in all_relics]}")
        
        # Tentar buscar ID 46 como string E como int
        extra_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).filter(
            (PlayerRelic.relic_id == '46') | (PlayerRelic.relic_id == 46)
        ).first()
        
        if extra_relic:
            count += 1
            print(f"🔮 Rosário de Dominic encontrado! +1 opção ({count} opções)")
        else:
            print(f"❌ Rosário de Dominic NÃO encontrado")
    else:
        print("❌ DEBUG: Player não encontrado!")
    
    # FILTRAR tipos de memória baseado na raridade
    available_types = []
    for memory_type, config in MEMORY_TYPES.items():
        # Verificar se esta lembrança está disponível para a raridade atual
        if enemy_rarity in config['values']:
            available_types.append(memory_type)
        else:
            print(f"⚠️ {memory_type} não disponível para raridade {enemy_rarity}")
    
    # Selecionar tipos aleatórios (sem repetição)
    if len(available_types) == 0:
        print("❌ ERRO: Nenhum tipo de memória disponível!")
        return ['maxhp', 'heal', 'damage_attack']  # Fallback seguro
    
    selected = random.sample(available_types, min(count, len(available_types)))
    print(f"🎲 DEBUG: {count} opções selecionadas: {selected}")
    
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
            enemy_rarity = data.get('enemy_rarity', 1)
            
            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})
            
            if memory_type not in MEMORY_TYPES:
                return jsonify({'success': False, 'message': 'Tipo de memória inválido'})
            
            # Obter valor baseado na raridade do inimigo
            memory_config = MEMORY_TYPES[memory_type]
            
            # VALIDAR se raridade existe
            if enemy_rarity not in memory_config['values']:
                return jsonify({
                    'success': False, 
                    'message': f'Raridade {enemy_rarity} inválida para {memory_type}'
                })
            
            value = memory_config['values'][enemy_rarity]
            
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
                print(f"🔄 CACHE RECALCULADO - Lembrança {memory_config['name']} ({memory_type}) aplicada")
            
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
                print(f"⚡ Empyreum aplicado! Energia máxima: {old_max_energy} → {player.max_energy}")

            elif memory_type == 'heal':
                # Curar instantaneamente
                player.hp = min(player.hp + value, player.max_hp)

            # ===== RESETAR CONTADOR DE REROLL DE MEMÓRIAS =====
            player.memory_reroll_count = 0
            print("🔄 Contador de reroll de memórias resetado")

            db.session.commit()

            # ===== LIMPAR RECOMPENSA E OPÇÕES DA SESSÃO =====
            session.pop('pending_memory_reward', None)
            print("✅ Recompensa de memória e opções REMOVIDAS da sessão")
            
            return jsonify({
                'success': True,
                'message': f'{memory_config["name"]} adquirida!',
                'buff_type': memory_type,
                'value': value,
                'total_count': buff.count,
                'total_value': buff.total_value
            })
            
        except Exception as e:
            print(f"Erro ao selecionar memória: {str(e)}")
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
                print(f"🎲 Usando opções SALVAS da sessão: {selected_types}")
            else:
                # Gerar novas opções apenas se não existirem
                selected_types = select_random_memory_options()
                
                # Salvar as opções geradas na sessão
                pending_memory['memory_options'] = selected_types
                session['pending_memory_reward'] = pending_memory
                session.modified = True
                print(f"🎲 Novas opções GERADAS e SALVAS: {selected_types}")
            
            # Obter buffs atuais do jogador
            current_buffs = get_player_run_buffs(player.id)
            buff_counts = {buff.buff_type: buff.count for buff in current_buffs}
            
            # Obter rarity do inimigo derrotado
            enemy_rarity = pending_memory.get('enemy_rarity', 1)

            # Preparar dados para retorno
            options = []
            for memory_type in selected_types:
                config = MEMORY_TYPES[memory_type]
                value = config['values'][enemy_rarity]
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
            print(f"Erro ao obter opções de memória: {str(e)}")
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
            print(f"Erro ao obter buffs ativos: {str(e)}")
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
                    'enemy_rarity': pending_memory['enemy_rarity']
                })
            else:
                return jsonify({
                    'success': True,
                    'has_memory_reward': False
                })
                
        except Exception as e:
            print(f"Erro ao verificar recompensa de memória: {str(e)}")
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