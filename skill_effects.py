# skill_effects.py - Sistema Centralizado de Efeitos
from datetime import datetime, timedelta

def apply_positive_effect(player, effect_type, effect_value, duration_type=None, duration_value=None):
    """Aplica efeito positivo ao jogador"""
    
    if effect_type == "lifesteal":
        return apply_lifesteal_effect(player, effect_value, duration_type, duration_value)
    elif effect_type == "multi_boost":
        return apply_multi_boost_effect(player, effect_value, duration_type, duration_value)
    elif effect_type == "crit_damage":
        return apply_crit_damage_effect(player, effect_value, duration_type, duration_value)
    elif effect_type == "blood_embrace":
        return apply_blood_embrace_effect(player, effect_value)
    elif effect_type == "mind_control":
        return apply_mind_control_effect(player, effect_value)
    else:
        return False, f"Efeito desconhecido: {effect_type}"

def apply_lifesteal_effect(player, lifesteal_percent, duration_type, duration_value):
    """Aplica efeito de roubo de vida"""
    from app import ActiveBuff, db
    
    buff = ActiveBuff(
        player_id=player.id,
        source_skill_id=0,
        effect_type="lifesteal",
        effect_value=lifesteal_percent,
        duration_type=duration_type,
        duration_value=duration_value,
        start_time=datetime.utcnow(),
        attacks_remaining=duration_value if duration_type == "attacks" else None
    )
    db.session.add(buff)
    db.session.commit()
    
    return True, f"Roubo de vida de {lifesteal_percent*100}% ativado!"

def apply_multi_boost_effect(player, boost_values, duration_type, duration_value):
    """Aplica múltiplos efeitos de boost (para Autofagia)"""
    from app import ActiveBuff, db
    
    if "crit_chance" in boost_values:
        crit_buff = ActiveBuff(
            player_id=player.id,
            source_skill_id=138,
            effect_type="crit_chance",
            effect_value=boost_values["crit_chance"],
            duration_type=duration_type,
            duration_value=duration_value,
            start_time=datetime.utcnow(),
            attacks_remaining=duration_value if duration_type == "attacks" else None
        )
        db.session.add(crit_buff)
    
    db.session.commit()
    return True, "Autofagia ativada! Poder crítico aumentado!"

def apply_crit_damage_effect(player, crit_bonus, duration_type, duration_value):
    """Aplica efeito de dano crítico"""
    from app import ActiveBuff, db
    
    buff = ActiveBuff(
        player_id=player.id,
        source_skill_id=0,
        effect_type="crit_damage",
        effect_value=crit_bonus,
        duration_type=duration_type,
        duration_value=duration_value,
        start_time=datetime.utcnow(),
        attacks_remaining=duration_value if duration_type == "attacks" else None
    )
    db.session.add(buff)
    db.session.commit()
    
    return True, f"Dano crítico aumentado em {crit_bonus*100}%!"

def apply_negative_effect(player, effect_type, effect_value):
    """Aplica efeito negativo ao jogador"""
    
    if effect_type == "hp_cost":
        return apply_hp_cost_effect(player, effect_value)
    elif effect_type == "mp_cost":
        return apply_mp_cost_effect(player, effect_value)
    else:
        return False, f"Efeito negativo desconhecido: {effect_type}"

def apply_hp_cost_effect(player, hp_percent):
    """Aplica custo em HP"""
    from app import db
    
    max_hp = player.max_hp
    hp_cost = int(max_hp * hp_percent)
    
    if player.current_hp - hp_cost <= 0:
        player.current_hp = 1
    else:
        player.current_hp -= hp_cost
    
    db.session.commit()
    return True, f"Sacrificou {hp_cost} HP"

def apply_mp_cost_effect(player, mp_percent):
    """Aplica custo em MP"""
    from app import db
    
    max_mp = player.max_mp
    mp_cost = int(max_mp * mp_percent)
    
    if player.current_mp - mp_cost <= 0:
        player.current_mp = 0
    else:
        player.current_mp -= mp_cost
    
    db.session.commit()
    return True, f"Consumiu {mp_cost} MP"

def apply_blood_embrace_effect(player, effect_value):
    """Efeito especial do Abraço Sanguíneo"""
    return True, "Abraço Sanguíneo ativado! Poder vampírico supremo!"

def apply_mind_control_effect(player, control_strength):
    """Efeito de controle mental"""
    return True, f"Domínio Mental ativado! Controle de {control_strength*100}%"