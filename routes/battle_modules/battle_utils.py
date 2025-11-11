# routes/battle/battle_utils.py - Funções auxiliares para batalha
import math
import random
from datetime import datetime, timedelta, timezone

from database import db
from models import Player, Boss, BestiaryEntry, PlayerTalent, EnemyTheme, GenericEnemy, PlayerProgress
from characters import ActiveBuff, PlayerSkill, SpecialSkill
from game_formulas import (
    calculate_strength_damage,
    calculate_resistance_block,
    calculate_critical_chance,
    calculate_critical_bonus,
    calculate_dodge_chance
)

def apply_damage_to_player(player, damage):
    """
    Aplica dano ao jogador considerando esquiva, redução baseada na resistência,
    bônus dos equipamentos e buffs ativos.
    """
    # Obter todos os buffs ativos que afetam a defesa
    active_buffs = ActiveBuff.query.filter_by(player_id=player.id).all()
    
    # Verificar buffs que concedem imunidade total
    for buff in active_buffs:
        if buff.is_expired():
            db.session.delete(buff)
            continue
            
        # Verificar imunidade total (divine_intervention, etc.)
        if buff.effect_type in ['divine_intervention', 'invulnerability']:
            print(f"Imunidade total ativada por {buff.effect_type}!")
            return 0  # Não sofre dano
    
    # ===== BUSCAR CACHE DE DEFESA =====
    from routes.battle_cache import get_cached_defense
    
    defense_cache = get_cached_defense(player.id)
    
    if defense_cache:
        # Usar valores do cache (já inclui força, talentos, equipamentos, lembranças)
        base_dodge = defense_cache.base_dodge_chance
        base_block = defense_cache.base_block_percent
        print(f"🛡️  Usando cache de defesa: {base_dodge*100:.1f}% esquiva, {base_block*100:.1f}% bloqueio")
    
    # ===== APLICAR BUFFS TEMPORÁRIOS DE DEFESA =====
    dodge_bonus_from_buffs = 0
    block_bonus_from_buffs = 0
    defense_reduction_from_buffs = 0
    damage_reduction_from_buffs = 0

    # Definir stats defensivos
    defensive_stats = {
        'dodge_bonus': 0,
        'block_bonus': 0,
        'defense_reduction': 0,
        'damage_reduction': 0
    }

    # Aplicar buffs
    defensive_stats = apply_buffs_to_stats(active_buffs, defensive_stats)

    # Usar valores
    dodge_bonus_from_buffs = defensive_stats['dodge_bonus']
    block_bonus_from_buffs = defensive_stats['block_bonus']
    defense_reduction_from_buffs = defensive_stats['defense_reduction']
    damage_reduction_from_buffs = defensive_stats['damage_reduction']
    
    # Aplicar bônus/debuffs temporários
    final_dodge = base_dodge + dodge_bonus_from_buffs
    final_block = base_block + block_bonus_from_buffs - defense_reduction_from_buffs + damage_reduction_from_buffs

    if random.random() < final_dodge:
        # Esquivou, não sofre dano
        return 0

    # Verificar se o jogador está com HP baixo para defesa emergencial
    emergency_bonus = 0
    if hasattr(player, 'emergency_defense_bonus') and player.emergency_defense_bonus > 0:
        if player.hp < (player.max_hp * 0.5):  # HP abaixo de 50%
            emergency_bonus = player.emergency_defense_bonus
            print(f"Defesa emergencial ativada: +{emergency_bonus}% de bloqueio")

    # ADICIONAR: Verificar debuffs de skills do inimigo
    try:
        from models import EnemySkillDebuff
        enemy_debuffs = EnemySkillDebuff.query.filter_by(player_id=player.id).filter(
            EnemySkillDebuff.duration_remaining > 0
        ).all()
        
        enemy_defense_reduction = 0
        
        for debuff in enemy_debuffs:
            if debuff.effect_type == 'decrease_defense':
                enemy_defense_reduction += debuff.effect_value
                print(f"Debuff do inimigo reduzindo defesa em {debuff.effect_value*100:.1f}%")
            elif debuff.effect_type == 'decrease_damage':
                # Nota: Este debuff afeta o dano causado pelo jogador, não o recebido
                # Será aplicado em outro local quando o jogador atacar
                pass
        
        # Aplicar redução de defesa por debuffs do inimigo
        defense_reduction_from_buffs += enemy_defense_reduction
        
    except Exception as e:
        print(f"Erro ao verificar debuffs do inimigo: {e}")
        # Continuar sem os debuffs em caso de erro

    # Aplicar emergência (HP baixo) ao bloqueio final
    if emergency_bonus > 0:
        final_block += emergency_bonus / 100.0
    
    # Aplicar debuffs do inimigo ao bloqueio final
    final_block -= enemy_defense_reduction
    
    # Limitar bloqueio máximo (já inclui cache + buffs + debuffs + emergência)
    total_reduction = min(final_block, 0.75)
    
    reduced_damage = int(damage * (1 - total_reduction))
    if reduced_damage < 1 and damage > 0: # Dano mínimo de 1 se o dano original for > 0
        reduced_damage = 1
    elif reduced_damage < 0: # Dano não pode ser negativo
        reduced_damage = 0

    damage_to_hp = reduced_damage
    damage_absorbed = 0

    # ===== LÓGICA DE ABSORÇÃO DA BARREIRA =====
    current_barrier = player.barrier or 0
    barrier_absorbed_all = False
    if current_barrier > 0:
        if current_barrier >= damage_to_hp:
            # Barreira absorve TUDO
            damage_absorbed = damage_to_hp
            player.barrier -= damage_to_hp
            damage_to_hp = 0
            barrier_absorbed_all = True
            print(f"🛡️ Barreira absorveu {damage_absorbed} de dano. Restante: {player.barrier}")
        else:
            # Barreira absorve PARCIALMENTE e quebra
            damage_absorbed = current_barrier
            damage_to_hp = damage_to_hp - current_barrier
            player.barrier = 0
            print(f"🛡️ Barreira quebrou! Absorveu {damage_absorbed}. {damage_to_hp} de dano foi para o HP.")
    # =========================================

    # Se a barreira absorveu todo o dano, podemos sair mais cedo.
    # Não há necessidade de verificar relíquias de "hit" ou "morte".
    if damage_to_hp <= 0:
        db.session.commit() # Salva a mudança na barreira
        # Retornar dict com dano absorvido
        return {
            'damage_to_hp': 0,
            'damage_absorbed': damage_absorbed
        }

    # ===== VERIFICAR BLOQUEIO DO PRIMEIRO ATAQUE (ID 7) =====
    # Esta lógica agora só roda se a Barreira não absorveu todo o dano
    if not player.enemy_first_attack_blocked:
        from models import PlayerRelic
        block_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='7',
            is_active=True
        ).first()
        
        if block_relic:
            player.enemy_first_attack_blocked = True
            db.session.commit()
            print(f"🛡️ Manto de Martinho bloqueou o primeiro ataque!")
            return 0  # Bloqueia completamente o dano restante

    # ===== VERIFICAR PREVENÇÃO DE MORTE (ID 5) =====
    # Agora verifica o dano que passou pela barreira (damage_to_hp)
    if damage_to_hp >= player.hp:
        from models import PlayerRelic
        death_prev_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='5',
            is_active=True
        ).first()
        
        if death_prev_relic:
            # Restaurar para 20% HP
            restore_hp = int(player.max_hp * 0.20)
            player.hp = restore_hp
            
            # Perder todo ouro
            player.run_gold = 0
            
            # Destruir relíquia
            death_prev_relic.is_active = False
            
            db.session.commit()
            print(f"🪞 Espelho de Lázaro ativado! Restaurado para {restore_hp} HP (perdeu todo ouro)")
            
            # Retornar dict especial
            return {
                'lazaro_activated': True,
                'damage_dealt': damage_to_hp,  # Dano que teria matado
                'hp_restored': restore_hp
            }

    # Verificar buffs que previnem morte (skills)
    if damage_to_hp >= player.hp:
        for buff in active_buffs:
            if buff.effect_type == 'death_prevention' and buff.source_type != 'relic':
                # Deixa com 1 HP em vez de morrer
                damage_applied = player.hp - 1 # O dano real é o HP - 1
                player.hp = 1
                
                # Consumir o buff
                db.session.delete(buff)
                db.session.commit()
                
                return damage_applied # Retorna o dano que foi realmente aplicado

    # Aplicar dano final ao HP
    player.hp -= damage_to_hp
    if player.hp < 0:
        player.hp = 0

    # Registrar dano máximo, se necessário
    if hasattr(player, 'damage_max_recorded') and damage_to_hp > player.damage_max_recorded:
        player.damage_max_recorded = damage_to_hp
        
    # Atualizar flag de dano recebido para a batalha atual
    if damage_to_hp > 0:
        from flask import session
        session['player_took_damage'] = True

    # ADICIONAR: Atualizar durações de debuffs baseados em dano recebido
    try:
        from routes.enemy_attacks import update_buff_debuff_durations
        update_buff_debuff_durations('player_damage_taken', player_id=player.id)
    except Exception as e:
        print(f"Erro ao atualizar durações de debuff: {e}")
    
    # Salvar o HP final e a barreira (se mudou)
    db.session.commit()

    # Retornar dict com dano ao HP e dano absorvido pela barreira
    return {
        'damage_to_hp': damage_to_hp,
        'damage_absorbed': damage_absorbed
    }

def add_boss_to_bestiary(player_id, boss_id):
    """Adiciona um boss ao bestiário do jogador se ainda não estiver lá"""
    # Verificar se o jogador já derrotou este boss
    existing = BestiaryEntry.query.filter_by(player_id=player_id, boss_id=boss_id).first()
    
    if not existing:
        entry = BestiaryEntry(player_id=player_id, boss_id=boss_id)
        db.session.add(entry)
        db.session.commit()
        return True
    
    return False

def check_login_rewards(player):
    """
    Verifica e aplica recompensas de login, como o baú do talento Ladrão Mestre.
    """
    # Verificar se o jogador tem chance de baú de recompensa
    if hasattr(player, 'login_chest_chance') and player.login_chest_chance > 0:
        # Verificar se a sorte do jogador influencia
        base_chance = player.login_chest_chance
        luck_modifier = 1.0 + (player.luck / 200)  # Cada 100 de sorte aumenta a chance em 50%
        final_chance = base_chance * luck_modifier
        
        # Verificar streak de dias (necessário estar logado por 5 dias seguidos)
        if player.days_streak >= 5:
            # Rolar para ver se ganha o baú
            if random.random() < final_chance:
                # Recompensa fixa de 100 cristais
                reward_crystals = 100  # FIXADO EM 100 CRISTAIS
                
                # Adicionar recompensa
                player.crystals += reward_crystals
                
                # Notificar o jogador
                from routes.cards import flash_gamification
                flash_gamification(f"🎁 Baú de Recompensa encontrado! Você ganhou {reward_crystals} Cristais de Memória!")
                
                return True
    
    return False

def update_rounds_for_all_enemies():
    """Reduz 1 rodada de todos os inimigos disponíveis"""
    available_enemies = GenericEnemy.query.filter_by(is_available=True).all()
    
    for enemy in available_enemies:
        enemy.rounds_remaining -= 1
        if enemy.rounds_remaining <= 0:
            enemy.is_available = False
    
    db.session.commit()
    
    # Remover inimigos expirados das listas de disponíveis
    expired_count = sum(1 for e in available_enemies if e.rounds_remaining <= 0)
    return expired_count

def initialize_game_for_new_player(player_id):
    """Inicializa o jogo para um novo jogador com inimigos iniciais"""
    progress = PlayerProgress.query.filter_by(player_id=player_id).first()
    if not progress:
        progress = PlayerProgress(player_id=player_id)
        db.session.add(progress)
        db.session.commit()
    
    # Verificar se já tem inimigos disponíveis
    available_count = GenericEnemy.query.filter_by(is_available=True).count()
    if available_count == 0:
        print(f"🎮 Inicializando jogo para novo jogador (ID: {player_id})")
        from .enemy_generation import ensure_minimum_enemies
        generated = ensure_minimum_enemies(progress, minimum=3)
        print(f"🎮 {generated} inimigos iniciais criados")
    
    return progress

def format_buff_duration(buff):
    """Função auxiliar para formatar a duração dos buffs"""
    if buff.duration_type == "attacks":
        return f"{buff.attacks_remaining} ataques"
    else:  # time
        now = datetime.utcnow()
        end_time = buff.start_time + timedelta(minutes=buff.duration_value)
        if end_time <= now:
            return "Expirado"
            
        remaining = end_time - now
        minutes = remaining.seconds // 60
        hours = minutes // 60
        minutes %= 60
        
        if hours > 0:
            return f"{hours}h {minutes}min"
        else:
            return f"{minutes}min"
        
def apply_buffs_to_stats(buffs, stats_dict):
    """Aplica buffs a um dicionário de stats."""
    from database import db
    
    for buff in buffs:
        if hasattr(buff, 'is_expired') and buff.is_expired():
            db.session.delete(buff)
            continue
        
        if buff.effect_type in stats_dict:
            stats_dict[buff.effect_type] += buff.effect_value
    
    return stats_dict