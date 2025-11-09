# damage_system.py - Sistema Centralizado de Cálculo de Dano
# VERSÃO ÚNICA - APENAS BACKEND
# Coloque este arquivo na pasta raiz do projeto (mesmo nível que battle.py)

import math
import random
from game_formulas import calculate_strength_damage, calculate_critical_chance, calculate_critical_bonus

def calculate_total_damage(player, skill, damage_points, active_buffs=None, run_buffs=None, is_critical=None):
    """
    Sistema centralizado de cálculo de dano.
    
    Fórmula: DANO_FINAL = damage_points × (1 + total_bonus_percentage) × critical_multiplier
    
    Args:
        player: Objeto do jogador
        skill: Objeto da skill usada ou dict com damage_modifier
        damage_points: Pontos de revisão gastos
        active_buffs: Lista de buffs ativos (opcional)
        run_buffs: Dict com bônus de lembranças (opcional)
        is_critical: Se deve ser crítico (None = calcular automaticamente)
    
    Returns:
        dict: {
            'damage': int,
            'is_critical': bool,
            'breakdown': dict  # Detalhamento dos bônus
        }
    """
    
    # 1. DANO BASE = 1 por ponto de dano
    base_damage = damage_points
    
    # 2. CALCULAR TODOS OS BÔNUS ADITIVOS (em %)
    total_bonus = 0.0
    breakdown = {
        'base_damage': damage_points,
        'strength_bonus': 0.0,
        'skill_bonus': 0.0,
        'player_base_bonus': 0.0,  # RENOMEADO para ser mais claro
        'talent_bonus': 0.0,
        'buffs_bonus': 0.0,
        'memory_bonus': 0.0,
        'total_bonus_percentage': 0.0,
        'damage_before_crit': 0,
        # NOVOS CAMPOS PARA CRÍTICO
        'critical_chance': 0.0,
        'critical_chance_breakdown': {},
        'critical_roll': 0.0,
        'critical_hit': False,
        'critical_multiplier': 1.0,
        'critical_damage_breakdown': {},
        'final_damage': 0
    }
    
    # BÔNUS DE FORÇA (sempre aplicado)
    strength_multiplier = calculate_strength_damage(player.strength)
    strength_bonus = strength_multiplier - 1.0  # Converter para % (ex: 1.24 vira 0.24 = 24%)
    total_bonus += strength_bonus
    breakdown['strength_bonus'] = strength_bonus
    
    # BÔNUS DA SKILL
    skill_bonus = 0.0
    if hasattr(skill, 'damage_modifier'):
        skill_modifier = skill.damage_modifier
    elif isinstance(skill, dict):
        skill_modifier = skill.get('damage_modifier', 0.0)
    else:
        skill_modifier = 0.0
    
    # Se skill_modifier é 1.2, converter para 0.2 (20% de bônus)
    if skill_modifier > 1.0:
        skill_bonus = skill_modifier - 1.0
    elif skill_modifier > 0.0 and skill_modifier <= 1.0:
        skill_bonus = skill_modifier - 1.0 if skill_modifier > 0.0 else 0.0
    
    total_bonus += skill_bonus
    breakdown['skill_bonus'] = skill_bonus
    
    # BÔNUS BASE DO PLAYER (sem talentos - apenas equipamentos e outros)
    player_base_bonus = getattr(player, 'damage_multiplier', 1.0) - 1.0
    total_bonus += player_base_bonus
    breakdown['player_base_bonus'] = player_base_bonus
    
    # BÔNUS DE TALENTOS (SEPARADO E CLARO)
    talent_bonus = getattr(player, 'damage_bonus', 0.0)  # Este campo contém os talentos aplicados
    # Bônus condicional quando HP baixo
    if hasattr(player, 'low_hp_damage_bonus') and player.hp < player.max_hp * 0.3:
        talent_bonus += player.low_hp_damage_bonus
    
    total_bonus += talent_bonus
    breakdown['talent_bonus'] = talent_bonus
    
    # BÔNUS DE BUFFS ATIVOS
    buffs_bonus = 0.0
    if active_buffs:
        for buff in active_buffs:
            # Verificar se o buff ainda é válido
            if hasattr(buff, 'is_expired') and callable(buff.is_expired):
                if buff.is_expired():
                    continue
            
            if getattr(buff, 'effect_type', '') == 'damage':
                buffs_bonus += getattr(buff, 'effect_value', 0.0)
    
    total_bonus += buffs_bonus
    breakdown['buffs_bonus'] = buffs_bonus
    
    # BÔNUS DE LEMBRANÇAS (RUN BUFFS)
    memory_bonus = 0.0
    if run_buffs:
        memory_bonus = run_buffs.get('damage_global', 0.0)
        
        # ADICIONAR BÔNUS ESPECÍFICOS POR TIPO DE ATAQUE
        for buff_type in ['damage_attack', 'damage_power', 'damage_special', 'damage_ultimate']:
            specific_bonus = run_buffs.get(buff_type, 0.0)
            if specific_bonus > 0:
                memory_bonus += specific_bonus
                print(f"  📈 Bônus {buff_type}: +{specific_bonus*100:.0f}%")
    
    total_bonus += memory_bonus
    breakdown['memory_bonus'] = memory_bonus
    
    # 3. CALCULAR DANO ANTES DO CRÍTICO
    breakdown['total_bonus_percentage'] = total_bonus
    damage_before_crit = int(base_damage * (1.0 + total_bonus))
    breakdown['damage_before_crit'] = damage_before_crit
    
    # 4. CALCULAR SISTEMA DE CRÍTICO DETALHADO
    if is_critical is None:
        # CALCULAR CADA FONTE DE CHANCE DE CRÍTICO SEPARADAMENTE
        
        # 4.1 CHANCE BASE (só da sorte, sem bônus)
        from game_formulas import calculate_critical_chance
        luck_only_crit = calculate_critical_chance(player.luck, 0, 0)
        
        # 4.2 BÔNUS DE ITENS
        crit_chance_from_items = getattr(player, 'critical_chance_item_bonus', 0)
        
        # 4.3 BÔNUS DE TALENTOS 
        crit_chance_from_talents = getattr(player, 'critical_chance_bonus', 0)
        
        # 4.4 BÔNUS DA SKILL ATUAL (se a skill tiver efeito de crítico)
        crit_chance_from_skill = 0.0
        if hasattr(skill, 'effect_type') and getattr(skill, 'effect_type', '') == 'crit_chance':
            crit_chance_from_skill = getattr(skill, 'effect_value', 0.0)
        elif isinstance(skill, dict) and skill.get('effect_type') == 'crit_chance':
            crit_chance_from_skill = skill.get('effect_value', 0.0)
        
        # 4.5 BÔNUS DE BUFFS ATIVOS (skills especiais)
        crit_chance_from_buffs = 0.0
        if active_buffs:
            for buff in active_buffs:
                if hasattr(buff, 'is_expired') and callable(buff.is_expired):
                    if buff.is_expired():
                        continue
                if getattr(buff, 'effect_type', '') == 'crit_chance':
                    crit_chance_from_buffs += getattr(buff, 'effect_value', 0.0)
        
        # 4.6 BÔNUS DE LEMBRANÇAS
        crit_chance_from_memories = 0.0
        if run_buffs:
            crit_chance_from_memories = run_buffs.get('crit_chance', 0.0)
        
        # 4.7 SOMAR TUDO
        final_crit_chance = (luck_only_crit + 
                            crit_chance_from_items + 
                            crit_chance_from_talents + 
                            crit_chance_from_skill + 
                            crit_chance_from_buffs + 
                            crit_chance_from_memories)
        
        # DETALHAR CHANCES DE CRÍTICO COM TODAS AS FONTES
        breakdown['critical_chance'] = final_crit_chance
        breakdown['critical_chance_breakdown'] = {
            'base_from_luck': luck_only_crit,
            'from_items': crit_chance_from_items,
            'from_talents': crit_chance_from_talents,
            'from_current_skill': crit_chance_from_skill,
            'from_active_buffs': crit_chance_from_buffs,
            'from_memories': crit_chance_from_memories,
            'total': final_crit_chance
        }
        
        # ROLAR CRÍTICO
        critical_roll = random.random()
        is_critical = critical_roll < final_crit_chance
        
        breakdown['critical_roll'] = critical_roll
        breakdown['critical_hit'] = is_critical
    else:
        # Se crítico foi forçado, ainda calcular a chance para logs
        final_crit_chance = calculate_critical_chance(
            player.luck,
            getattr(player, 'critical_chance_item_bonus', 0),
            getattr(player, 'critical_chance_bonus', 0)
        )
        breakdown['critical_chance'] = final_crit_chance
        breakdown['critical_roll'] = 1.0 if is_critical else 0.0
        breakdown['critical_hit'] = is_critical
        breakdown['critical_chance_breakdown'] = {
            'base_from_luck': final_crit_chance,  # Simplificado para crítico forçado
            'from_items': 0,
            'from_talents': 0,
            'from_current_skill': 0,
            'from_active_buffs': 0,
            'from_memories': 0,
            'total': final_crit_chance
        }
    
    # 5. APLICAR MULTIPLICADOR DE CRÍTICO
    critical_multiplier = 1.0
    if is_critical:
        # Calcular bônus de crítico
        base_crit_damage = calculate_critical_bonus(
            player.luck,
            getattr(player, 'critical_damage_item_bonus', 0),
            getattr(player, 'critical_damage_bonus', 0)
        )
        
        # Adicionar bônus de crítico de buffs
        crit_damage_from_buffs = 0.0
        if active_buffs:
            for buff in active_buffs:
                if hasattr(buff, 'is_expired') and callable(buff.is_expired):
                    if buff.is_expired():
                        continue
                if getattr(buff, 'effect_type', '') == 'crit_damage':
                    crit_damage_from_buffs += getattr(buff, 'effect_value', 0.0)
        
        critical_multiplier = 1.5 + base_crit_damage + crit_damage_from_buffs
        
        # DETALHAR DANO CRÍTICO
        breakdown['critical_damage_breakdown'] = {
            'base_multiplier': 1.5,
            'from_luck': base_crit_damage - getattr(player, 'critical_damage_item_bonus', 0) - getattr(player, 'critical_damage_bonus', 0),
            'from_items': getattr(player, 'critical_damage_item_bonus', 0),
            'from_talents': getattr(player, 'critical_damage_bonus', 0),
            'from_buffs': crit_damage_from_buffs,
            'final_multiplier': critical_multiplier
        }
    
    breakdown['critical_multiplier'] = critical_multiplier
    
    # 6. DANO FINAL
    final_damage = int(damage_before_crit * critical_multiplier)
    breakdown['final_damage'] = final_damage
    
    return {
        'damage': final_damage,
        'is_critical': is_critical,
        'breakdown': breakdown
    }

def get_damage_breakdown_text(breakdown):
    """
    Gera texto legível do detalhamento do dano para logs/debug.
    """
    # Preparar texto de crítico DETALHADO
    crit_info = ""
    if breakdown['critical_hit']:
        # CRÍTICO ATIVADO - Mostrar detalhes do multiplicador
        crit_details = breakdown.get('critical_damage_breakdown', {})
        crit_chance_details = breakdown.get('critical_chance_breakdown', {})
        
        # Montar detalhes da chance
        chance_breakdown = f"""
   🎯 CHANCE DETALHADA:
      Chance Base (Sorte): {crit_chance_details.get('base_from_luck', 0)*100:.1f}%
      Bônus de Itens: {crit_chance_details.get('from_items', 0)*100:.1f}%
      Bônus de Talentos: {crit_chance_details.get('from_talents', 0)*100:.1f}%
      Bônus da Skill Atual: {crit_chance_details.get('from_current_skill', 0)*100:.1f}%
      Bônus de Skills Especiais: {crit_chance_details.get('from_active_buffs', 0)*100:.1f}%
      Bônus de Lembranças: {crit_chance_details.get('from_memories', 0)*100:.1f}%
      = TOTAL: {crit_chance_details.get('total', 0)*100:.1f}%"""
        
        crit_info = f"""
💥 CRÍTICO ATIVADO!{chance_breakdown}
   🎲 Rolagem: {breakdown['critical_roll']:.3f} ✅
   
   ⚡ MULTIPLICADOR DETALHADO:
      Multiplicador Base: {crit_details.get('base_multiplier', 1.5):.1f}x
      Bônus de Sorte: +{crit_details.get('from_luck', 0)*100:.1f}%
      Bônus de Itens: +{crit_details.get('from_items', 0)*100:.1f}%
      Bônus de Talentos: +{crit_details.get('from_talents', 0)*100:.1f}%
      Bônus de Skills Especiais: +{crit_details.get('from_buffs', 0)*100:.1f}%
      = Multiplicador Final: {crit_details.get('final_multiplier', 1.0):.2f}x"""
    else:
        # CRÍTICO FALHOU - Mostrar só os detalhes da chance
        crit_chance_details = breakdown.get('critical_chance_breakdown', {})
        crit_info = f"""
🎯 CHANCE DE CRÍTICO DETALHADA:
   Chance Base (Sorte): {crit_chance_details.get('base_from_luck', 0)*100:.1f}%
   Bônus de Itens: {crit_chance_details.get('from_items', 0)*100:.1f}%
   Bônus de Talentos: {crit_chance_details.get('from_talents', 0)*100:.1f}%
   Bônus da Skill Atual: {crit_chance_details.get('from_current_skill', 0)*100:.1f}%
   Bônus de Skills Especiais: {crit_chance_details.get('from_active_buffs', 0)*100:.1f}%
   Bônus de Lembranças: {crit_chance_details.get('from_memories', 0)*100:.1f}%
   = TOTAL: {crit_chance_details.get('total', 0)*100:.1f}%
🎲 Rolagem: {breakdown['critical_roll']:.3f} ❌"""

    text = f"""
=== CÁLCULO DE DANO CENTRALIZADO ===
Dano Base: {breakdown['base_damage']} pontos
Bônus de Força: +{breakdown['strength_bonus']:.1%}
Bônus da Skill: +{breakdown['skill_bonus']:.1%}
Bônus Base do Player: +{breakdown['player_base_bonus']:.1%}
Bônus de Talentos: +{breakdown['talent_bonus']:.1%}
Bônus de Buffs: +{breakdown['buffs_bonus']:.1%}
Bônus de Lembranças: +{breakdown['memory_bonus']:.1%}
----------------------------------------
Total de Bônus: +{breakdown['total_bonus_percentage']:.1%}
Dano antes do Crítico: {breakdown['damage_before_crit']}{crit_info}
----------------------------------------
DANO FINAL: {breakdown['final_damage']}
====================================
    """
    return text.strip()