"""
Sistema de Efeitos dos Eventos Aleatórios
Processa cada tipo de efeito definido nos eventos
"""

import random
from database import db
from models import Player, PlayerRelic, PlayerRunBuff
from flask import session
from sqlalchemy.orm.attributes import flag_modified


def apply_event_effects(player, effects: list) -> list:
    """
    Aplica lista de efeitos ao jogador.

    Args:
        player: Instância do Player
        effects: Lista de dicionários de efeitos

    Returns:
        Lista de resultados com mensagens para mostrar ao jogador
    """
    results = []

    for effect in effects:
        result = apply_single_effect(player, effect)
        if result:
            results.append(result)

    db.session.commit()
    return results


def apply_single_effect(player, effect: dict) -> dict:
    """
    Aplica um único efeito ao jogador.

    Returns:
        Dicionário com resultado da aplicação
    """
    effect_type = effect.get('type', '')

    # ===== EFEITOS DE GOLD =====

    if effect_type == 'gain_gold':
        min_val = effect.get('min', 0)
        max_val = effect.get('max', min_val)
        amount = random.randint(min_val, max_val)
        player.run_gold += amount
        player.run_gold_gained += amount
        flag_modified(player, 'run_gold')
        flag_modified(player, 'run_gold_gained')
        return {
            'type': 'gold_gain',
            'value': amount,
            'message': f'+{amount} ouro',
            'icon': 'resources/gold-icon.png',
            'positive': True
        }

    elif effect_type == 'lose_gold':
        amount = effect.get('value', 0)
        player.run_gold = max(0, player.run_gold - amount)
        flag_modified(player, 'run_gold')
        return {
            'type': 'gold_loss',
            'value': amount,
            'message': f'-{amount} ouro',
            'icon': 'resources/gold-icon.png',
            'positive': False
        }

    elif effect_type == 'gamble_all_gold':
        current_gold = player.run_gold
        if random.random() < 0.5:
            # Ganhou - dobra
            player.run_gold = current_gold * 2
            player.run_gold_gained += current_gold
            flag_modified(player, 'run_gold')
            flag_modified(player, 'run_gold_gained')
            return {
                'type': 'gamble_win',
                'value': current_gold,
                'message': f'DOBROU! +{current_gold} ouro (total: {player.run_gold})',
                'icon': 'choices/choice-accept.png',
                'positive': True
            }
        else:
            # Perdeu - perde tudo
            player.run_gold = 0
            flag_modified(player, 'run_gold')
            return {
                'type': 'gamble_loss',
                'value': current_gold,
                'message': f'PERDEU TUDO! -{current_gold} ouro',
                'icon': 'choices/choice-curse.png',
                'positive': False
            }

    # ===== EFEITOS DE HP =====

    elif effect_type == 'lose_hp':
        damage = effect.get('value', 0)
        player.hp = max(1, player.hp - damage)
        flag_modified(player, 'hp')
        return {
            'type': 'hp_loss',
            'value': damage,
            'message': f'-{damage} HP',
            'icon': 'resources/hp-icon.png',
            'positive': False
        }

    elif effect_type == 'lose_hp_percent_current':
        percent = effect.get('value', 0)
        damage = int(player.hp * percent)
        player.hp = max(1, player.hp - damage)
        flag_modified(player, 'hp')
        return {
            'type': 'hp_loss',
            'value': damage,
            'message': f'-{damage} HP ({int(percent*100)}% do atual)',
            'icon': 'resources/hp-icon.png',
            'positive': False
        }

    elif effect_type == 'heal':
        amount = effect.get('value', 0)
        old_hp = player.hp
        player.hp = min(player.hp + amount, player.max_hp)
        healed = player.hp - old_hp
        flag_modified(player, 'hp')
        return {
            'type': 'heal',
            'value': healed,
            'message': f'+{healed} HP',
            'icon': 'choices/choice-heal.png',
            'positive': True
        }

    elif effect_type == 'heal_percent_max':
        percent = effect.get('value', 0)
        amount = int(player.max_hp * percent)
        old_hp = player.hp
        player.hp = min(player.hp + amount, player.max_hp)
        healed = player.hp - old_hp
        flag_modified(player, 'hp')
        return {
            'type': 'heal',
            'value': healed,
            'message': f'+{healed} HP ({int(percent*100)}% do máximo)',
            'icon': 'choices/choice-heal.png',
            'positive': True
        }

    elif effect_type == 'full_heal':
        old_hp = player.hp
        player.hp = player.max_hp
        healed = player.hp - old_hp
        flag_modified(player, 'hp')
        return {
            'type': 'full_heal',
            'value': healed,
            'message': f'HP totalmente restaurado (+{healed})',
            'icon': 'choices/choice-heal.png',
            'positive': True
        }

    # ===== EFEITOS DE MAX HP =====

    elif effect_type == 'gain_max_hp':
        amount = effect.get('value', 0)
        player.max_hp += amount
        player.hp += amount  # Também aumenta HP atual
        flag_modified(player, 'max_hp')
        flag_modified(player, 'hp')
        return {
            'type': 'max_hp_gain',
            'value': amount,
            'message': f'+{amount} HP Máximo permanente',
            'icon': 'resources/maxhp-icon.png',
            'positive': True
        }

    elif effect_type == 'lose_max_hp':
        amount = effect.get('value', 0)
        old_max_hp = player.max_hp
        old_hp = player.hp
        player.max_hp = max(10, player.max_hp - amount)  # Mínimo 10 de max HP
        player.hp = min(player.hp, player.max_hp)
        # Forçar SQLAlchemy a reconhecer as mudanças
        flag_modified(player, 'max_hp')
        flag_modified(player, 'hp')
        print(f"🩸 LOSE_MAX_HP: {old_max_hp} -> {player.max_hp} (perdeu {amount})")
        print(f"🩸 HP ajustado: {old_hp} -> {player.hp}")
        return {
            'type': 'max_hp_loss',
            'value': amount,
            'message': f'-{amount} HP Máximo permanente',
            'icon': 'choices/choice-curse.png',
            'positive': False
        }

    elif effect_type == 'lose_max_hp_percent':
        percent = effect.get('value', 0)
        amount = int(player.max_hp * percent)
        old_max_hp = player.max_hp
        old_hp = player.hp
        player.max_hp = max(10, player.max_hp - amount)
        player.hp = min(player.hp, player.max_hp)
        # Forçar SQLAlchemy a reconhecer as mudanças
        flag_modified(player, 'max_hp')
        flag_modified(player, 'hp')
        print(f"🩸 LOSE_MAX_HP_PERCENT: {old_max_hp} -> {player.max_hp} (perdeu {amount}, {int(percent*100)}%)")
        print(f"🩸 HP ajustado: {old_hp} -> {player.hp}")
        return {
            'type': 'max_hp_loss',
            'value': amount,
            'message': f'-{amount} HP Máximo ({int(percent*100)}%)',
            'icon': 'choices/choice-curse.png',
            'positive': False
        }

    # ===== EFEITOS DE RELÍQUIAS =====

    elif effect_type == 'gain_relic':
        rarity = effect.get('rarity', 'random')
        relic_id = effect.get('relic_id', None)

        if relic_id:
            # Relíquia específica
            result = _award_specific_relic(player, relic_id)
        else:
            # Relíquia aleatória por raridade
            result = _award_random_relic(player, rarity)

        return result

    elif effect_type == 'remove_random_relic':
        result = _remove_random_relic(player)
        return result

    elif effect_type == 'duplicate_random_relic':
        result = _duplicate_random_relic(player)
        return result

    elif effect_type == 'choose_relic':
        # Abre UI de seleção de relíquias (mesma que aparece ao derrotar boss)
        # count = quantas vezes o jogador vai escolher (não quantas opções ele vê)
        count = effect.get('count', 1)
        rarity = effect.get('rarity', 'random')

        # Salva na session para que a UI de seleção apareça
        from datetime import datetime
        session['pending_relic_selection'] = {
            'count': count,
            'context': 'event',
            'event_source': 'relicario_abandonado',
            'rarity_filter': rarity if rarity != 'random' else None,
            'timestamp': datetime.utcnow().isoformat()
        }
        session.modified = True

        # Mensagem mais clara
        if count == 1:
            message = 'Escolha 1 relíquia!'
        else:
            message = f'Escolha {count} relíquias!'

        return {
            'type': 'relic_selection_pending',
            'message': message,
            'icon': 'resources/relic-icon-rare.png',
            'positive': True,
            'requires_redirect': True,
            'redirect_url': '/gamification'  # Redireciona para hub onde está a UI de seleção
        }

    # ===== EFEITOS DE MEMÓRIAS (BUFFS) =====

    elif effect_type == 'gain_memory':
        memory_id = effect.get('memory_id', '')
        result = _add_memory_buff(player, memory_id)
        return result

    # ===== EFEITOS DE DANO/SKILLS =====

    elif effect_type == 'add_skill_damage':
        skill_type = effect.get('skill_type', 'ataque')
        value = effect.get('value', 0)
        result = _add_skill_damage_bonus(player, skill_type, value)
        return result

    elif effect_type == 'add_all_damage':
        value = effect.get('value', 0)
        # Adiciona dano a todos os tipos de ataque
        _add_skill_damage_bonus(player, 'ataque', value)
        _add_skill_damage_bonus(player, 'poder', value)
        _add_skill_damage_bonus(player, 'ataque_especial', value)
        return {
            'type': 'damage_bonus',
            'value': value,
            'message': f'+{value} dano em TODAS as habilidades',
            'icon': 'choices/choice-power.png',
            'positive': True
        }

    elif effect_type == 'add_barrier_bonus':
        value = effect.get('value', 0)
        # Adiciona bônus na geração de barreira (usa buff do player)
        player.barrier += value  # Dá barreira imediata também
        _add_memory_buff_direct(player, 'barrier_bonus', value)
        return {
            'type': 'barrier_bonus',
            'value': value,
            'message': f'+{value} bônus na geração de barreira',
            'icon': 'choices/choice-shield.png',
            'positive': True
        }

    # ===== EFEITOS ALEATÓRIOS =====

    elif effect_type == 'random_outcome':
        outcomes = effect.get('outcomes', [])
        if not outcomes:
            return None

        # Seleciona outcome baseado em chances
        roll = random.random()
        cumulative = 0
        selected_outcome = None

        for outcome in outcomes:
            cumulative += outcome['chance']
            if roll <= cumulative:
                selected_outcome = outcome
                break

        if not selected_outcome:
            selected_outcome = outcomes[-1]  # Fallback

        # Aplica efeitos do outcome selecionado
        if selected_outcome['effects']:
            sub_results = []
            for sub_effect in selected_outcome['effects']:
                sub_result = apply_single_effect(player, sub_effect)
                if sub_result:
                    sub_results.append(sub_result)

            # Combina resultados
            if sub_results:
                return {
                    'type': 'random_outcome',
                    'results': sub_results,
                    'message': ' | '.join([r.get('message', '') for r in sub_results]),
                    'icon': 'choices/choice-inspect.png',
                    'positive': any(r.get('positive', False) for r in sub_results)
                }

        return {
            'type': 'random_outcome',
            'results': [],
            'message': 'Nada aconteceu...',
            'icon': 'choices/choice-inspect.png',
            'positive': False
        }

    # ===== EFEITOS DE COMBATE/BUFFS TEMPORÁRIOS =====

    elif effect_type == 'apply_combat_debuff':
        debuff = effect.get('debuff', 'damage_penalty')
        value = effect.get('value', 0)
        duration = effect.get('duration', 1)

        # Salva na sessão para aplicar nos próximos combates
        if 'event_debuffs' not in session:
            session['event_debuffs'] = []

        session['event_debuffs'].append({
            'debuff': debuff,
            'value': value,
            'duration': duration
        })
        session.modified = True

        return {
            'type': 'debuff',
            'value': value,
            'message': f'{value} dano nos próximos {duration} combate(s)',
            'icon': 'choices/choice-curse.png',
            'positive': False
        }

    elif effect_type == 'apply_combat_bonus':
        bonus_gold = effect.get('bonus_gold', 0)
        duration = effect.get('duration', 1)

        if 'event_bonuses' not in session:
            session['event_bonuses'] = []

        session['event_bonuses'].append({
            'type': 'gold_bonus',
            'value': bonus_gold,
            'duration': duration
        })
        session.modified = True

        return {
            'type': 'combat_bonus',
            'value': bonus_gold,
            'message': f'+{bonus_gold} ouro nos próximos {duration} combate(s)',
            'icon': 'resources/gold-icon.png',
            'positive': True
        }

    elif effect_type == 'apply_next_elite_bonus':
        bonus_gold = effect.get('bonus_gold', 0)
        bonus_damage = effect.get('bonus_damage_percent', 0)

        if 'elite_bonuses' not in session:
            session['elite_bonuses'] = {}

        if bonus_gold:
            session['elite_bonuses']['gold'] = bonus_gold
        if bonus_damage:
            session['elite_bonuses']['damage_percent'] = bonus_damage

        session.modified = True

        msg_parts = []
        if bonus_gold:
            msg_parts.append(f'+{bonus_gold} ouro')
        if bonus_damage:
            msg_parts.append(f'+{int(bonus_damage*100)}% dano')

        return {
            'type': 'elite_bonus',
            'message': f'Próximo Elite: {", ".join(msg_parts)}',
            'icon': 'choices/choice-power.png',
            'positive': True
        }

    elif effect_type == 'apply_shop_discount':
        discount = effect.get('discount_percent', 0)
        session['shop_discount'] = discount
        session.modified = True

        return {
            'type': 'shop_discount',
            'value': discount,
            'message': f'{int(discount*100)}% desconto no próximo shop',
            'icon': 'choices/choice-gold.png',
            'positive': True
        }

    elif effect_type == 'apply_rest_bonus':
        bonus = effect.get('bonus_heal_percent', 0)
        session['rest_bonus'] = bonus
        session.modified = True

        return {
            'type': 'rest_bonus',
            'value': bonus,
            'message': f'+{int(bonus*100)}% cura no próximo descanso',
            'icon': 'choices/choice-rest.png',
            'positive': True
        }

    elif effect_type == 'apply_mission':
        mission = effect.get('mission', '')
        bonus_gold = effect.get('bonus_gold', 0)
        session['active_mission'] = {
            'type': mission,
            'bonus_gold': bonus_gold
        }
        session.modified = True

        return {
            'type': 'mission',
            'message': f'Missão: vença sem tomar dano para +{bonus_gold} ouro',
            'icon': 'choices/choice-study.png',
            'positive': True
        }

    # ===== EFEITOS DE COMBATE =====

    elif effect_type == 'start_elite_combat':
        rarity = effect.get('rarity', 'legendary')
        multiplier = effect.get('reward_multiplier', 1.0)

        # Salva na sessão para redirecionar
        session['pending_combat'] = {
            'type': 'elite',
            'rarity': rarity,
            'reward_multiplier': multiplier
        }
        session.modified = True

        return {
            'type': 'combat_start',
            'message': f'Prepare-se para enfrentar um Elite {rarity.upper()}!',
            'icon': 'choices/choice-attack.png',
            'positive': False,
            'requires_combat': True
        }

    elif effect_type == 'start_combat':
        difficulty = effect.get('difficulty', 'normal')

        # Selecionar um inimigo disponível automaticamente
        from models import GenericEnemy, PlayerProgress
        available_enemy = GenericEnemy.query.filter_by(is_available=True).first()

        if available_enemy:
            progress = PlayerProgress.query.filter_by(player_id=player.id).first()
            if progress:
                progress.selected_enemy_id = available_enemy.id
                progress.selected_boss_id = None  # Limpar boss
                # Resetar contador de turnos
                available_enemy.battle_turn_counter = 0
                db.session.commit()
                print(f"⚔️ Inimigo {available_enemy.name} selecionado automaticamente para combate do evento")

        return {
            'type': 'combat_start',
            'message': 'Um inimigo aparece!',
            'icon': 'choices/choice-attack.png',
            'positive': False,
            'requires_combat': True  # Frontend vai redirecionar para /gamification/battle
        }

    # ===== EFEITOS DE HP GAMBLING =====

    elif effect_type == 'gamble_hp':
        bet_percent = effect.get('bet_percent', 0.25)
        win_heal_percent = effect.get('win_heal_percent', 0.50)

        bet_hp = int(player.hp * bet_percent)

        if random.random() < 0.5:
            # Ganhou
            heal_amount = int(player.max_hp * win_heal_percent)
            old_hp = player.hp
            player.hp = min(player.hp + heal_amount, player.max_hp)
            healed = player.hp - old_hp

            return {
                'type': 'gamble_win',
                'value': healed,
                'message': f'GANHOU! +{healed} HP',
                'icon': 'choices/choice-accept.png',
                'positive': True
            }
        else:
            # Perdeu
            player.hp = max(1, player.hp - bet_hp)

            return {
                'type': 'gamble_loss',
                'value': bet_hp,
                'message': f'PERDEU! -{bet_hp} HP',
                'icon': 'choices/choice-curse.png',
                'positive': False
            }

    return None


# ===== FUNÇÕES AUXILIARES =====

def _award_random_relic(player, rarity: str) -> dict:
    """Dá uma relíquia aleatória ao jogador"""
    from routes.relics.registry import RELIC_DEFINITIONS
    from routes.relics.selection import award_relic_to_player

    # Filtra relíquias por raridade
    if rarity == 'random':
        available = list(RELIC_DEFINITIONS.values())
    else:
        available = [r for r in RELIC_DEFINITIONS.values() if r.get('rarity') == rarity]

    if not available:
        available = list(RELIC_DEFINITIONS.values())

    # Remove relíquias que o jogador já tem
    player_relic_ids = {pr.relic_id for pr in player.relics}
    available = [r for r in available if r['id'] not in player_relic_ids]

    if not available:
        return {
            'type': 'relic_fail',
            'message': 'Você já possui todas as relíquias disponíveis!',
            'icon': 'choices/choice-refuse.png',
            'positive': False
        }

    # Escolhe uma aleatória
    chosen = random.choice(available)

    # Adiciona ao jogador
    award_relic_to_player(player.id, chosen['id'])

    return {
        'type': 'relic_gain',
        'relic_id': chosen['id'],
        'relic_name': chosen['name'],
        'message': f'Ganhou: {chosen["name"]}',
        'icon': 'resources/relic-icon-rare.png',
        'positive': True
    }


def _award_specific_relic(player, relic_id: str) -> dict:
    """Dá uma relíquia específica ao jogador"""
    from routes.relics.registry import RELIC_DEFINITIONS
    from routes.relics.selection import award_relic_to_player

    relic_def = RELIC_DEFINITIONS.get(relic_id)

    if not relic_def:
        # Relíquia especial não definida no registry - criar entry especial
        # Por exemplo: demonic_pact, death_favor
        if relic_id == 'demonic_pact':
            relic_name = 'Pacto Demoníaco'
            relic_desc = '+3 dano por ataque, -1 HP por turno'
        elif relic_id == 'death_favor':
            relic_name = 'Favor da Morte'
            relic_desc = 'Revive com 1 HP uma vez (consumível)'
        else:
            relic_name = relic_id
            relic_desc = 'Relíquia misteriosa'

        # TODO: Adicionar essas relíquias especiais ao registry
        return {
            'type': 'relic_gain',
            'relic_id': relic_id,
            'relic_name': relic_name,
            'message': f'Ganhou: {relic_name}',
            'icon': 'resources/relic-icon-rare.png',
            'positive': True
        }

    # Verifica se já tem
    player_relic_ids = {pr.relic_id for pr in player.relics}
    if relic_id in player_relic_ids:
        return {
            'type': 'relic_duplicate',
            'message': f'Você já possui {relic_def["name"]}',
            'icon': 'choices/choice-refuse.png',
            'positive': False
        }

    award_relic_to_player(player.id, relic_id)

    return {
        'type': 'relic_gain',
        'relic_id': relic_id,
        'relic_name': relic_def['name'],
        'message': f'Ganhou: {relic_def["name"]}',
        'icon': 'resources/relic-icon-rare.png',
        'positive': True
    }


def _remove_random_relic(player) -> dict:
    """Remove uma relíquia aleatória do jogador"""
    from routes.relics.registry import RELIC_DEFINITIONS

    if not player.relics:
        return {
            'type': 'relic_remove_fail',
            'message': 'Você não possui relíquias para perder',
            'icon': 'choices/choice-refuse.png',
            'positive': False
        }

    # Escolhe uma aleatória
    relic_to_remove = random.choice(player.relics)
    relic_def = RELIC_DEFINITIONS.get(relic_to_remove.relic_id, {})
    relic_name = relic_def.get('name', 'Relíquia')

    # CRÍTICO: Reverter efeitos da relíquia antes de remover
    _revert_relic_effects(player, relic_def)

    # Remove
    db.session.delete(relic_to_remove)

    return {
        'type': 'relic_loss',
        'relic_name': relic_name,
        'message': f'Perdeu: {relic_name}',
        'icon': 'resources/relic-icon-rare.png',
        'positive': False
    }


def _revert_relic_effects(player, relic_def: dict):
    """
    Reverte os efeitos permanentes de uma relíquia antes de removê-la.
    CRÍTICO: Garante que stat boosts e outros efeitos permanentes sejam desfeitos.
    """
    effect = relic_def.get('effect', {})
    effect_type = effect.get('type')

    print(f"🔄 REVERTENDO EFEITOS: {relic_def.get('name', 'Relíquia')} ({effect_type})")

    if effect_type == 'stat_boost':
        stat = effect.get('stat')
        value = effect.get('value', 0)

        if stat == 'max_hp':
            # Reverter bônus de HP máximo
            current_bonus = getattr(player, 'max_hp_bonus', 0)
            player.max_hp_bonus = max(0, current_bonus - value)
            print(f"   ↳ max_hp_bonus: {current_bonus} → {player.max_hp_bonus}")

            # Recalcular cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)

        elif stat == 'max_energy':
            # Reverter energia máxima
            player.max_energy = max(1, player.max_energy - value)  # Mínimo 1
            print(f"   ↳ max_energy: {player.max_energy + value} → {player.max_energy}")

        elif stat == 'accumulated_attack_bonus':
            # Reverter dano acumulado no Ataque
            player.accumulated_attack_bonus = max(0, player.accumulated_attack_bonus - value)
            print(f"   ↳ accumulated_attack_bonus revertido em {value}")

            # Recalcular cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)

        elif stat == 'accumulated_power_bonus':
            # Reverter dano acumulado no Poder
            player.accumulated_power_bonus = max(0, player.accumulated_power_bonus - value)
            print(f"   ↳ accumulated_power_bonus revertido em {value}")

            # Recalcular cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)

    # Outros tipos de efeito que precisam reversão podem ser adicionados aqui
    # Por enquanto, stat_boost é o mais crítico


def _duplicate_random_relic(player) -> dict:
    """Duplica uma relíquia que o jogador já possui"""
    from routes.relics.registry import RELIC_DEFINITIONS
    from routes.relics.selection import award_relic_to_player

    if not player.relics:
        return {
            'type': 'relic_fail',
            'message': 'Você não possui relíquias para duplicar',
            'icon': 'choices/choice-refuse.png',
            'positive': False
        }

    # Escolhe uma aleatória para duplicar
    relic_to_duplicate = random.choice(player.relics)
    relic_def = RELIC_DEFINITIONS.get(relic_to_duplicate.relic_id, {})
    relic_name = relic_def.get('name', 'Relíquia')

    # Adiciona outra cópia
    award_relic_to_player(player.id, relic_to_duplicate.relic_id)

    return {
        'type': 'relic_duplicate',
        'relic_name': relic_name,
        'message': f'Duplicou: {relic_name}',
        'icon': 'resources/relic-icon-rare.png',
        'positive': True
    }


def _add_memory_buff(player, memory_id: str) -> dict:
    """Adiciona uma memória (buff permanente) ao jogador"""

    # Define as memórias disponíveis - USANDO TIPOS VÁLIDOS DO SISTEMA
    MEMORY_DEFINITIONS = {
        'sede_de_sangue': {
            'name': 'Sede de Sangue',
            'buff_type': 'damage_global',  # Usar tipo válido
            'value': 3,  # +3 dano global
            'description': '+3 dano em todos os ataques'
        },
        'pureza': {
            'name': 'Pureza',
            'buff_type': 'maxhp',  # Usar tipo válido
            'value': 5,  # +5 HP máximo
            'description': '+5 HP Máximo'
        },
        'sorte': {
            'name': 'Sorte',
            'buff_type': 'damage_special',  # Usar tipo válido
            'value': 3,  # +3 dano especial
            'description': '+3 dano no Especial'
        },
        'disciplina': {
            'name': 'Disciplina',
            'buff_type': 'damage_global',  # Usar tipo válido
            'value': 3,  # +3 dano flat
            'description': '+3 dano geral'
        },
        'amuleto': {
            'name': 'Amuleto',
            'buff_type': 'damage_attack',  # Usar tipo válido
            'value': 2,  # +2 dano ataque básico
            'description': '+2 dano no Ataque Básico'
        },
        'random': None  # Escolhe aleatório
    }

    if memory_id == 'random':
        # Escolhe aleatório (excluindo 'random')
        available = [k for k in MEMORY_DEFINITIONS.keys() if k != 'random']
        memory_id = random.choice(available)

    memory_def = MEMORY_DEFINITIONS.get(memory_id)

    if not memory_def:
        return {
            'type': 'memory_fail',
            'message': 'Memória desconhecida',
            'icon': 'choices/choice-refuse.png',
            'positive': False
        }

    # Adiciona ou incrementa o buff
    buff = PlayerRunBuff.query.filter_by(
        player_id=player.id,
        buff_type=memory_def['buff_type']
    ).first()

    if buff:
        buff.total_value += memory_def['value']
        buff.count += 1
    else:
        buff = PlayerRunBuff(
            player_id=player.id,
            buff_type=memory_def['buff_type'],
            total_value=memory_def['value'],
            count=1
        )
        db.session.add(buff)

    # Commit imediatamente para persistir
    db.session.commit()

    return {
        'type': 'memory_gain',
        'memory_name': memory_def['name'],
        'message': f'Memória: {memory_def["name"]} ({memory_def["description"]})',
        'icon': 'choices/choice-study.png',
        'positive': True
    }


def _add_memory_buff_direct(player, buff_type: str, value: float) -> None:
    """Adiciona um buff direto sem definição de memória"""
    buff = PlayerRunBuff.query.filter_by(
        player_id=player.id,
        buff_type=buff_type
    ).first()

    if buff:
        buff.total_value += value
        buff.count += 1
    else:
        buff = PlayerRunBuff(
            player_id=player.id,
            buff_type=buff_type,
            total_value=value,
            count=1
        )
        db.session.add(buff)


def _add_skill_damage_bonus(player, skill_type: str, value: int) -> dict:
    """Adiciona bônus de dano a uma habilidade específica"""

    # Mapeia tipos para os tipos válidos do sistema MEMORY_TYPES
    skill_to_buff_type = {
        'ataque': 'damage_attack',
        'poder': 'damage_power',
        'ataque_especial': 'damage_special'
    }

    buff_type = skill_to_buff_type.get(skill_type, 'damage_global')

    buff = PlayerRunBuff.query.filter_by(
        player_id=player.id,
        buff_type=buff_type
    ).first()

    if buff:
        buff.total_value += value
        buff.count += 1
    else:
        buff = PlayerRunBuff(
            player_id=player.id,
            buff_type=buff_type,
            total_value=value,
            count=1
        )
        db.session.add(buff)

    # Commit para persistir
    db.session.commit()

    skill_names = {
        'ataque': 'Ataque Básico',
        'poder': 'Ataque de Poder',
        'ataque_especial': 'Ataque Especial'
    }

    return {
        'type': 'skill_damage_bonus',
        'skill_type': skill_type,
        'value': value,
        'message': f'+{value} dano no {skill_names.get(skill_type, skill_type)}',
        'icon': 'choices/choice-power.png',
        'positive': True
    }


def check_event_requirements(event: dict, player) -> bool:
    """Verifica se o jogador atende aos requisitos do evento"""
    # Evento em si não tem requisitos, apenas as escolhas
    return True


def check_choice_requirements(choice: dict, player) -> bool:
    """Verifica se o jogador pode selecionar esta escolha"""
    reqs = choice.get('requirements', {})

    if not reqs:
        return True

    # Verifica cada requisito
    if 'min_hp' in reqs:
        if player.hp < reqs['min_hp']:
            return False

    if 'min_hp_percent' in reqs:
        if (player.hp / player.max_hp) < reqs['min_hp_percent']:
            return False

    if 'min_max_hp' in reqs:
        if player.max_hp < reqs['min_max_hp']:
            return False

    if 'min_gold' in reqs:
        if player.run_gold < reqs['min_gold']:
            return False

    if 'min_relics' in reqs:
        if len(player.relics) < reqs['min_relics']:
            return False

    return True
