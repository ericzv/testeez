# routes/battle_modules/damage_calculations.py
# Funções auxiliares para cálculo de dano em batalha

import json
import random
import math
from database import db
from models import Player, PlayerProgress, PlayerRelic, GenericEnemy, LastBoss
from characters import ActiveBuff

from utils.logger import get_logger
logger = get_logger(__name__)


def get_attack_target(player_id):
    """
    Busca o alvo atual da batalha (boss ou inimigo genérico).

    Returns:
        tuple: (target, is_boss_fight, error_message)
        - target: LastBoss ou GenericEnemy
        - is_boss_fight: bool
        - error_message: str se houver erro, None caso contrário
    """
    progress = PlayerProgress.query.filter_by(player_id=player_id).first()
    current_enemy = None
    current_boss = None
    is_boss_fight = False

    # PRIORIDADE 1: Verificar se há boss selecionado
    if progress and progress.selected_boss_id:
        current_boss = LastBoss.query.get(progress.selected_boss_id)
        if current_boss and current_boss.is_active:
            is_boss_fight = True
            logger.debug(f"Atacando boss: {current_boss.name}")
        else:
            progress.selected_boss_id = None
            db.session.commit()

    # PRIORIDADE 2: Se não há boss, buscar inimigo genérico
    if not is_boss_fight and progress and progress.selected_enemy_id:
        current_enemy = GenericEnemy.query.get(progress.selected_enemy_id)
        if not current_enemy or not current_enemy.is_available:
            return None, False, 'Nenhum inimigo selecionado.'

    if not is_boss_fight and not current_enemy:
        return None, False, 'Nenhum inimigo ou boss selecionado.'

    target = current_boss if is_boss_fight else current_enemy
    return target, is_boss_fight, None


def apply_buff_modifiers(player_id, offensive_stats):
    """
    Aplica modificadores de buffs ativos aos stats ofensivos.

    Args:
        player_id: ID do jogador
        offensive_stats: dict com stats base

    Returns:
        tuple: (offensive_stats modificados, lista de buffs a decrementar)
    """
    from .battle_utils import apply_buffs_to_stats

    active_buffs = ActiveBuff.query.filter_by(player_id=player_id).all()
    offensive_stats = apply_buffs_to_stats(active_buffs, offensive_stats)

    return offensive_stats, active_buffs


def apply_debuff_modifiers(player_id, final_damage, final_crit_chance):
    """
    Aplica modificadores de debuffs do inimigo.

    Args:
        player_id: ID do jogador
        final_damage: dano atual
        final_crit_chance: chance de crítico atual

    Returns:
        tuple: (final_damage, final_crit_chance) modificados
    """
    try:
        from models import EnemySkillDebuff
        from routes.enemy_attacks import update_buff_debuff_durations

        enemy_debuffs = EnemySkillDebuff.query.filter_by(player_id=player_id).filter(
            EnemySkillDebuff.duration_remaining > 0
        ).all()

        debuff_damage_multiplier = 1.0
        debuff_crit_chance_reduction = 0.0

        for debuff in enemy_debuffs:
            if debuff.effect_type == 'decrease_damage':
                debuff_damage_multiplier *= (1 - debuff.effect_value)
                logger.debug(f"Debuff reduzindo dano em {debuff.effect_value*100:.1f}%")

            elif debuff.effect_type == 'decrease_crit':
                debuff_crit_chance_reduction += debuff.effect_value
                logger.debug(f"Debuff reduzindo crítico em {debuff.effect_value*100:.1f}%")

        # Aplicar redução de dano
        if debuff_damage_multiplier < 1.0:
            final_damage = int(final_damage * debuff_damage_multiplier)
            logger.debug(f"DANO APÓS DEBUFFS: {final_damage}")

        # Aplicar redução de crítico
        final_crit_chance -= debuff_crit_chance_reduction
        final_crit_chance = max(0.0, final_crit_chance)

        # Atualizar durações de debuffs
        update_buff_debuff_durations('player_attack', player_id=player_id)

    except Exception as e:
        logger.error(f"Erro ao aplicar debuffs: {e}")

    return final_damage, final_crit_chance


def calculate_lifesteal(player, actual_damage, lifesteal_percent):
    """
    Calcula e aplica o vampirismo.

    Returns:
        int: quantidade de cura aplicada
    """
    if lifesteal_percent <= 0:
        return 0

    heal_amount = int(actual_damage * lifesteal_percent)
    player.hp = min(player.hp + heal_amount, player.max_hp)
    logger.debug(f"Vampirismo: +{heal_amount} HP")
    return heal_amount


def calculate_barrier_gain(cache, actual_damage):
    """
    Calcula ganho de barreira baseado no cache da skill.

    Returns:
        int: quantidade de barreira ganha
    """
    barrier_percent = 0.0
    barrier_bonus = 0

    if hasattr(cache, 'effect_type') and cache.effect_type == 'barrier':
        barrier_percent = cache.effect_value or 0.0
        bonus_from_cache = getattr(cache, 'effect_bonus', 0)
        barrier_bonus = bonus_from_cache if bonus_from_cache is not None else 0

    if barrier_percent > 0 or barrier_bonus > 0:
        return math.ceil((actual_damage * barrier_percent) + barrier_bonus)

    return 0


def apply_damage_to_target(target, damage, is_boss_fight):
    """
    Aplica dano ao alvo e retorna informações sobre o resultado.

    Returns:
        tuple: (actual_damage_applied, hp_before, hp_after)
    """
    hp_before = target.current_hp if is_boss_fight else target.hp
    actual_damage = min(damage, hp_before)

    if is_boss_fight:
        target.current_hp -= actual_damage
        hp_after = target.current_hp
    else:
        target.hp -= actual_damage
        hp_after = target.hp

    logger.debug(f"DANO APLICADO: {actual_damage}")
    logger.debug(f"HP antes: {hp_before} → HP após: {hp_after}")

    return actual_damage, hp_before, hp_after


def check_double_first_attack(player, target, final_damage, hp_after, is_boss_fight):
    """
    Verifica e aplica o efeito de dano duplo no primeiro ataque (Lança de Longino).

    Returns:
        tuple: (extra_damage, new_hp_after)
    """
    if player.first_attack_done:
        return 0, hp_after

    double_relic = PlayerRelic.query.filter_by(
        player_id=player.id,
        relic_id='15',
        is_active=True
    ).first()

    if not double_relic:
        return 0, hp_after

    second_damage = min(final_damage, hp_after)

    if is_boss_fight:
        target.current_hp -= second_damage
        new_hp_after = target.current_hp
    else:
        target.hp -= second_damage
        new_hp_after = target.hp

    logger.debug(f"Lança de Longino aplicou dano 2x! Dano adicional: {second_damage}")
    return second_damage, new_hp_after


def calculate_generic_enemy_rewards(player, enemy, took_damage):
    """
    Calcula recompensas para inimigo genérico derrotado.

    Returns:
        dict com exp_reward, crystals_gained, gold_gained, hourglasses_gained,
        reward_type, potion_drop
    """
    # Calcular EXP base
    base_exp = random.randint(
        30 + (enemy.enemy_number * 10),
        50 + (enemy.enemy_number * 20)
    )
    rarity_multipliers = {1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0}
    rarity_multiplier = rarity_multipliers.get(enemy.rarity, 1.0)

    equipment_bonus_percent = enemy.reward_bonus_percentage or 0

    final_exp = int(base_exp * rarity_multiplier * (1 + equipment_bonus_percent / 100))

    # Aplicar bônus de EXP do jogador
    if hasattr(player, 'exp_boost') and player.exp_boost > 0:
        final_exp += int(final_exp * player.exp_boost)

    # Bônus de perfect (sem tomar dano)
    if not took_damage and hasattr(player, 'perfect_exp_bonus') and player.perfect_exp_bonus > 0:
        final_exp += int(final_exp * (player.perfect_exp_bonus / 100))

    # Recompensas fixas do template
    rewards = {
        'exp_reward': final_exp,
        'crystals_gained': 10,
        'gold_gained': 5,
        'hourglasses_gained': 0,
        'reward_type': 'mixed',
        'potion_drop': None
    }

    try:
        equipment_modifiers = json.loads(enemy.equipment_modifiers_applied or '{}')
        fixed_rewards = equipment_modifiers.get('_rewards', {})

        rewards['crystals_gained'] = fixed_rewards.get('memory_crystals', 10)
        rewards['gold_gained'] = fixed_rewards.get('gold', 5)
        rewards['potion_drop'] = fixed_rewards.get('potion', None)

        logger.debug(f"RECOMPENSAS FIXAS DO TEMPLATE:")
        logger.debug(f"Cristais base: {rewards['crystals_gained']}")
        logger.debug(f"Ouro base: {rewards['gold_gained']}")
        logger.debug(f"Poção: {rewards['potion_drop']}")

        # Aplicar chance de dobrar cristais
        if hasattr(player, 'crystal_double_chance') and player.crystal_double_chance > 0:
            if random.random() < player.crystal_double_chance:
                rewards['crystals_gained'] *= 2
                logger.debug(f"Cristais dobrados!")

        # Aplicar bônus de ouro de talentos
        try:
            from routes.talents import calculate_gold_bonus_percent
            gold_bonus_percent = calculate_gold_bonus_percent(player.id)
            if gold_bonus_percent > 0:
                bonus_gold = int(rewards['gold_gained'] * gold_bonus_percent)
                rewards['gold_gained'] += bonus_gold
                logger.debug(f"Bônus de ouro de talentos: +{bonus_gold}")
        except Exception as e:
            logger.warning(f"Erro ao calcular bônus de ouro: {e}")

    except Exception as e:
        logger.warning(f"Erro ao ler recompensas fixas: {e}")
        # Fallback
        rewards['reward_type'] = enemy.reward_type or 'crystals'
        base_crystals = random.randint(
            30 + (enemy.enemy_number * 5),
            50 + (enemy.enemy_number * 8)
        )
        rewards['crystals_gained'] = int(base_crystals * rarity_multiplier * (1 + equipment_bonus_percent / 100))

    return rewards


def calculate_boss_rewards(player, boss, took_damage):
    """
    Calcula recompensas para boss derrotado.

    Returns:
        dict com exp_reward, crystals_gained, gold_gained, hourglasses_gained, reward_type
    """
    base_exp = boss.reward_crystals // 4
    final_exp = base_exp

    if hasattr(player, 'exp_boost') and player.exp_boost > 0:
        exp_boost_bonus = int(base_exp * player.exp_boost)
        final_exp += exp_boost_bonus

    if not took_damage and hasattr(player, 'perfect_exp_bonus') and player.perfect_exp_bonus > 0:
        perfect_bonus = int(final_exp * (player.perfect_exp_bonus / 100))
        final_exp += perfect_bonus

    return {
        'exp_reward': final_exp,
        'crystals_gained': boss.reward_crystals,
        'gold_gained': 0,
        'hourglasses_gained': 0,
        'reward_type': 'crystals'
    }


def get_extra_gold_from_kill_relics(player):
    """
    Calcula ouro extra de relíquias ao matar inimigo.

    Returns:
        int: ouro extra
    """
    extra_gold = 0

    # ID 33 - Olho de Midas (sempre dá ouro)
    midas_relic = PlayerRelic.query.filter_by(
        player_id=player.id,
        relic_id='33',
        is_active=True
    ).first()
    if midas_relic:
        from routes.relics.registry import get_relic_definition
        definition = get_relic_definition('33')
        extra_gold += definition['effect']['value']

    # ID 34 - Coroa do Rei Sol (se usou Suprema)
    skills_used = json.loads(player.skills_used_this_battle or '{}')
    if skills_used.get('ultimate', 0) > 0:
        rei_sol_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='34',
            is_active=True
        ).first()
        if rei_sol_relic:
            from routes.relics.registry import get_relic_definition
            definition = get_relic_definition('34')
            extra_gold += definition['effect']['value']

    return extra_gold
