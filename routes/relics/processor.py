"""
Processador central de efeitos de relíquias.
Implementa TODOS os tipos de efeito.

IMPORTANTE - INTEGRAÇÃO COM CACHE:
================================
Sempre que uma relíquia modificar PERMANENTEMENTE:
- player.accumulated_attack_bonus (dano em Ataque)
- player.accumulated_power_bonus (dano em Poder)
- Qualquer outro atributo que afete cálculos de dano/defesa

VOCÊ DEVE recalcular o cache:
    from routes.battle_cache import calculate_attack_cache
    calculate_attack_cache(player.id)

Isso garante que os bônus apareçam no dano base das skills.

Relíquias que JÁ FAZEM ISSO:
- ID 20 (accumulating_damage): +dano no Ataque por uso
- ID 21 (paradox_power): +dano no Poder ao matar sem usar
- ID 26 (power_kill_bonus): +dano no Poder ao matar usando
- ID 50 (battle_accumulating_damage): +dano temporário por batalha

QUANDO CRIAR NOVAS RELÍQUIAS:
Se o efeito modificar accumulated_attack_bonus, accumulated_power_bonus,
ou qualquer atributo permanente do player que afete dano/defesa,
adicione a chamada de recálculo do cache.
"""

from database import db
from models import Player, PlayerRelic
from flask import session
import json
import random

def apply_relic_effect(player_relic, player, context):
    """
    Aplica o efeito de uma relíquia baseado no contexto.
    
    Args:
        player_relic: Instância de PlayerRelic
        player: Instância de Player
        context: Dict com dados do evento
    
    Returns:
        Modified context ou None
    """
    from .registry import get_relic_definition
    
    definition = get_relic_definition(player_relic.relic_id)
    if not definition:
        return context
    
    effect = definition['effect']
    effect_type = effect['type']
    
    # Log de ativação
    print(f"🗡️ RELÍQUIA: {definition['name']} ({effect_type})")
    
    # Aplicar efeito baseado no tipo
    result = None
    
    # ===== CURA =====
    
    if effect_type == 'heal_on_damage':
        result = _apply_heal(player, effect['value'])
        if result:
            print(f"   ↳ Curou {result} HP")
            
    elif effect_type == 'heal_on_critical':
        if context.get('is_critical'):
            heal_amount = int(player.max_hp * effect['heal_percent'])
            result = _apply_heal(player, heal_amount)
            if result:
                print(f"   ↳ Crítico curou {result} HP")
                
    elif effect_type == 'heal_on_combat_start':
        # Verificar se já curou nesta batalha
        enemy = context.get('enemy')
        if not enemy:
            return None
        
        state_data = json.loads(player_relic.state_data or '{}')
        battle_key = f'healed_battle_{enemy.id}'
        
        if state_data.get(battle_key):
            # Já curou nesta batalha
            return None
        
        # Aplicar cura APENAS DE HP
        hp_heal = int(player.max_hp * effect['hp_percent'])
        player.hp = min(player.hp + hp_heal, player.max_hp)
        
        # Marcar como usado nesta batalha
        state_data[battle_key] = True
        player_relic.state_data = json.dumps(state_data)
        
        result = {'hp_healed': hp_heal}
        print(f"   ↳ Curou {hp_heal} HP (1ª vez nesta batalha)")
        
    elif effect_type == 'full_heal_vs_boss':
        enemy = context.get('enemy')
        if not enemy:
            return None
        
        # Verificar se já curou nesta batalha
        state_data = json.loads(player_relic.state_data or '{}')
        battle_key = f'healed_battle_{enemy.id}'
        
        if state_data.get(battle_key):
            return None
        
        # Verificar se é LastBoss
        from models import LastBoss
        if isinstance(enemy, LastBoss):
            # Aplicar cura HP
            player.hp = player.max_hp
            
            # Marcar como usado nesta batalha
            state_data[battle_key] = True
            player_relic.state_data = json.dumps(state_data)
            
            result = {'full_heal': True}
            print(f"   ↳ Cura completa de HP vs Boss! (HP: {player.hp}/{player.max_hp})")
        else:
            print(f"   ↳ Não é boss, não curou")
            result = None
            
    elif effect_type == 'heal_per_memory':
        # Verificar se já curou nesta batalha
        enemy = context.get('enemy')
        if not enemy:
            return None
        
        state_data = json.loads(player_relic.state_data or '{}')
        battle_key = f'healed_battle_{enemy.id}'
        
        if state_data.get(battle_key):
            # Já curou nesta batalha
            return None
        
        # Aplicar cura
        from models import PlayerRunBuff
        memory_count = PlayerRunBuff.query.filter_by(player_id=player.id).count()
        heal_amount = memory_count * effect['hp_per_memory']
        
        if heal_amount > 0:
            result = _apply_heal(player, heal_amount)
            
            # Marcar como usado nesta batalha
            state_data[battle_key] = True
            player_relic.state_data = json.dumps(state_data)
            
            print(f"   ↳ {memory_count} lembranças = {heal_amount} HP (1ª vez nesta batalha)")
        else:
            result = None
            
    elif effect_type == 'heal_every_n_specials':
        # Usar contador GLOBAL que persiste entre batalhas
        special_count = player.total_special_uses
        
        if special_count > 0 and special_count % effect['every_n'] == 0:
            result = _apply_heal(player, effect['heal_amount'])
            print(f"   ↳ {special_count}º especial, curou {effect['heal_amount']} HP")
            
    elif effect_type == 'heal_all_skills_used':
        skills_used = json.loads(player.skills_used_this_battle)
        required = effect['requires_all']
        
        if all(skills_used.get(skill, 0) > 0 for skill in required):
            # Marca que já curou para não curar múltiplas vezes
            state = json.loads(player_relic.state_data or '{}')
            if not state.get('healed_this_battle'):
                result = _apply_heal(player, effect['heal_amount'])
                state['healed_this_battle'] = True
                player_relic.state_data = json.dumps(state)
                print(f"   ↳ Usou todos os ataques, curou {effect['heal_amount']} HP")
                
    elif effect_type == 'low_hp_victory_heal':
        # Chamado em on_victory
        if context.get('event') == 'victory':
            hp_percent = player.hp / player.max_hp
            if hp_percent < effect['threshold']:
                heal_to = int(player.max_hp * effect['restore_to'])
                if player.hp < heal_to:
                    player.hp = heal_to
                    result = heal_to
                    print(f"   ↳ HP baixo na vitória, restaurou para {effect['restore_to']*100}%")
    
    # ===== MULTIPLICADORES DE CURA (PASSIVO) =====
    # Estes são aplicados em _apply_heal, não aqui
    
    # ===== DANO E CRÍTICO =====
    
    elif effect_type == 'first_attack_bonus':
        if not player.first_attack_done:
            if context.get('attack_data'):
                context['attack_data']['damage_multiplier'] *= (1 + effect['damage_bonus'])
                result = context['attack_data']
                print(f"   ↳ Primeiro ataque +{effect['damage_bonus']*100}% dano")
                
    elif effect_type == 'first_attack_lifesteal':
        if not player.first_attack_done:
            if context.get('attack_data'):
                context['attack_data']['lifesteal_bonus'] += effect['lifesteal_bonus']
                result = context['attack_data']
                print(f"   ↳ Primeiro ataque +{effect['lifesteal_bonus']*100:.1f}% vampirismo (qualquer tipo)")
                
    elif effect_type == 'first_power_special_crit':
        print(f"   🔍 PEDRA ANGULAR: Verificando... first_power_or_special_done={player.first_power_or_special_done}")
        if not player.first_power_or_special_done:
            skill_type = context.get('skill_type')
            print(f"   🔍 PEDRA ANGULAR: skill_type={skill_type}")
            if skill_type in ['power', 'special']:
                if context.get('attack_data'):
                    context['attack_data']['force_critical'] = True
                    result = context['attack_data']
                    print(f"   ✅ PEDRA ANGULAR: Primeiro {skill_type} forçou crítico!")
                else:
                    print(f"   ⚠️ PEDRA ANGULAR: attack_data não encontrado no context")
            else:
                print(f"   ⚠️ PEDRA ANGULAR: skill_type '{skill_type}' não é power/special")
        else:
            print(f"   ⚠️ PEDRA ANGULAR: Já foi usado (flag=True)")
                    
    elif effect_type == 'double_first_attack':
        if not player.first_attack_done:
            if context.get('attack_data'):
                # Marcar state para aplicar em battle.py
                state = json.loads(player_relic.state_data or '{}')
                state['should_double'] = True
                player_relic.state_data = json.dumps(state)
                result = True
                print(f"   ↳ Primeiro ataque será aplicado 2x")
            
    elif effect_type == 'damage_multiplier_on_threshold':
        counter_type = definition.get('counter_type')
        threshold = definition.get('counter_threshold')
        
        # Verificar se o PRÓXIMO ataque será o threshold
        if counter_type == 'total_attacks':
            next_count = player.total_attacks_any_type + 1
            if next_count % threshold == 0:
                if context.get('attack_data'):
                    context['attack_data']['damage_multiplier'] *= effect['multiplier']
                    result = context['attack_data']
                    print(f"   ↳ {next_count}º ataque, dano x{effect['multiplier']}")
                
    elif effect_type == 'accumulating_damage':
        result = _apply_accumulating_damage(player_relic, player, effect, context)
        
    elif effect_type == 'battle_accumulating_damage':
        # Similar mas reseta entre batalhas
        result = _apply_battle_accumulating_damage(player_relic, player, effect, context)
        
    elif effect_type == 'paradox_power':
        if context.get('event') == 'acquire':
            player.accumulated_power_bonus += effect['initial_bonus']
            
            # Recalcular cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)
            
            result = effect['initial_bonus']
            print(f"   ↳ Bônus inicial de {effect['initial_bonus']} no Poder")
        elif context.get('event') == 'kill':
            # Só acumula se NÃO usou poder
            skills_used = json.loads(player.skills_used_this_battle)
            if skills_used.get('power', 0) == 0:
                player.accumulated_power_bonus += effect['stack_bonus']
                player_relic.counter_value += 1
                
                # Recalcular cache
                from routes.battle_cache import calculate_attack_cache
                calculate_attack_cache(player.id)
                
                result = effect['stack_bonus']
                print(f"   ↳ Matou sem Poder, acumulou +{effect['stack_bonus']}")
                
    elif effect_type == 'power_kill_bonus':
        if context.get('event') == 'acquire':
            player.accumulated_power_bonus += effect['initial_bonus']
            
            # Recalcular cache para incluir bônus inicial
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)
            
            result = effect['initial_bonus']
            print(f"   ↳ Bônus inicial de {effect['initial_bonus']} no Poder")
        elif context.get('event') == 'kill':
            # Só acumula se USOU poder
            skills_used = json.loads(player.skills_used_this_battle)
            if skills_used.get('power', 0) > 0:
                player.accumulated_power_bonus += effect['stack_bonus']
                player_relic.counter_value += 1
                
                # Recalcular cache para incluir novo bônus
                from routes.battle_cache import calculate_attack_cache
                calculate_attack_cache(player.id)
                
                result = effect['stack_bonus']
                print(f"   ↳ Matou com Poder, acumulou +{effect['stack_bonus']}")
                
    elif effect_type == 'special_trade':
        # Modificador passivo aplicado no cache
        pass
        
    elif effect_type == 'ultimate_trade':
        skill_type = context.get('skill_type')
        if skill_type == 'ultimate':
            state = json.loads(player_relic.state_data or '{}')
            used_this_battle = state.get('used_this_battle', False)
            
            if not used_this_battle:
                if context.get('attack_data'):
                    context['attack_data']['damage_multiplier'] *= effect['damage_multiplier']
                    result = context['attack_data']
                    state['used_this_battle'] = True
                    player_relic.state_data = json.dumps(state)
                    db.session.commit()
                    print(f"   ↳ Suprema x{effect['damage_multiplier']} (1x por batalha)")
            else:
                print(f"   ↳ Suprema já usada nesta batalha")
                
                # Sinalizar para o frontend que skill está desabilitada
                if context.get('attack_data'):
                    context['attack_data']['skill_disabled'] = True
                
    elif effect_type == 'repetition_debuff':
        last_three = json.loads(player.last_three_skills)
        if len(last_three) >= 3 and len(set(last_three[-3:])) == 1:
            # Últimos 3 ataques foram iguais - aplica debuff
            # TODO: aplicar debuff ao inimigo
            print(f"   ↳ 3x seguidas, inimigo debuffado")
            
    elif effect_type == 'crit_chain':
        if context.get('is_critical'):
            # Aplica bônus de crítico no próximo ataque
            state = json.loads(player_relic.state_data or '{}')
            state['bonus_crit_next'] = effect['bonus_crit']
            player_relic.state_data = json.dumps(state)
            result = True
            print(f"   ↳ Crítico dá +{effect['bonus_crit']*100}% crit no próximo")
        else:
            # Verifica se tem bônus acumulado
            state = json.loads(player_relic.state_data or '{}')
            bonus = state.get('bonus_crit_next', 0)
            if bonus > 0 and context.get('attack_data'):
                # Aplica no cache (ou adiciona temporariamente)
                # TODO: implementar bônus temporário
                state['bonus_crit_next'] = 0
                player_relic.state_data = json.dumps(state)
                
    elif effect_type == 'lifesteal_on_crit':
        if context.get('is_critical'):
            if context.get('attack_data'):
                context['attack_data']['lifesteal_bonus'] += effect['lifesteal_percent']
                result = context['attack_data']
                print(f"   ↳ Crítico +{effect['lifesteal_percent']*100}% vampirismo")
                
    elif effect_type == 'lifesteal_on_threshold':
        counter_type = definition.get('counter_type')
        threshold = definition.get('counter_threshold')
        
        # Verificar se o PRÓXIMO especial será o threshold
        if counter_type == 'special_uses' and context.get('skill_type') == 'special':
            next_count = player.total_special_uses + 1
            if next_count % threshold == 0:
                if context.get('attack_data'):
                    context['attack_data']['lifesteal_bonus'] += effect['lifesteal_percent']
                    result = context['attack_data']
                    print(f"   ↳ {next_count}º especial, +{effect['lifesteal_percent']*100}% vampirismo")
    
    # ===== ENERGIA =====
    
    elif effect_type == 'gain_energy_first_turn':
        # ID 29 - Dar energia no primeiro turno
        # Implementado em hooks.py no on_combat_start
        pass
        
    elif effect_type == 'all_attacks_reward':
        # ID 30 - Dar energia ao usar 4 ataques diferentes
        skills_used = json.loads(player.skills_used_this_battle)
        required = effect['requires_all']
        
        if all(skills_used.get(skill, 0) > 0 for skill in required):
            # Marca que já deu energia para não dar múltiplas vezes
            state = json.loads(player_relic.state_data or '{}')
            if not state.get('energy_given_this_battle'):
                energy_reward = effect['energy_reward']
                player.energy += energy_reward
                state['energy_given_this_battle'] = True
                player_relic.state_data = json.dumps(state)
                result = energy_reward
                print(f"   ↳ Usou todos os ataques, ganhou {energy_reward} energia (Energia: {player.energy}/{player.max_energy})")
                
    elif effect_type in ['power_every_n_in_battle', 'special_every_n_in_battle']:
        # ID 31 (Trinitas) - Dar energia a cada N usos de uma skill no combate (não consecutivo)
        required_skill = effect['required_skill']
        current_skill = context.get('skill_type')

        # Só contar se for o tipo de skill requerido
        if current_skill == required_skill:
            state = json.loads(player_relic.state_data or '{}')
            skill_count = state.get('skill_count_battle', 0)
            skill_count += 1

            # A cada N usos, dar recompensa
            if skill_count % effect['every_n'] == 0:
                energy_reward = effect['energy_reward']
                player.energy += energy_reward
                result = energy_reward
                skill_name = 'Poder' if required_skill == 'power' else 'Especial' if required_skill == 'special' else required_skill.title()
                print(f"   ↳ {skill_count}º {skill_name} no combate, ganhou {energy_reward} energia (Energia: {player.energy}/{player.max_energy})")
            else:
                skill_name = 'Poder' if required_skill == 'power' else 'Especial' if required_skill == 'special' else required_skill.title()
                print(f"   ↳ {skill_name} usado no combate: {skill_count}/{effect['every_n']}")

            # Atualizar contador
            state['skill_count_battle'] = skill_count
            player_relic.state_data = json.dumps(state)
                
    elif effect_type == 'energy_every_n_attacks':
        # ID 32 - Dar energia a cada N ataques
        if player.total_attacks_any_type % effect['every_n'] == 0:
            energy_reward = effect['energy_reward']
            player.energy += energy_reward
            result = energy_reward
            print(f"   ↳ {effect['every_n']}º ataque, ganhou {energy_reward} energia (Energia: {player.energy}/{player.max_energy})")
    
    elif effect_type == 'heal_per_relic_on_attack':
        # ID 44 - Curar 1HP por relíquia ao usar Ataque Básico
        skill_type = context.get('skill_type')
        if skill_type == 'attack':
            # Contar relíquias ativas
            relic_count = PlayerRelic.query.filter_by(
                player_id=player.id,
                is_active=True
            ).count()
            
            heal_amount = relic_count * effect['hp_per_relic']
            if heal_amount > 0:
                result = _apply_heal(player, heal_amount)
                print(f"   ↳ {relic_count} relíquias: curou {result} HP")

    # ===== RECURSOS (PD, OURO, ETC) =====
            
    elif effect_type == 'gold_on_kill':
    #    player.run_gold += effect['value']
    #    player.run_gold_gained += effect['value']
        result = effect['value']
        print(f"   ↳ Ganhou {effect['value']} ouro")
        
    elif effect_type == 'gold_on_ultimate_kill':
        skills_used = json.loads(player.skills_used_this_battle)
        if skills_used.get('ultimate', 0) > 0:
    #        player.run_gold += effect['value']
    #        player.run_gold_gained += effect['value']
            result = effect['value']
            print(f"   ↳ Matou com Suprema, ganhou {effect['value']} ouro")
            
    elif effect_type == 'instant_gold':
        player.run_gold += effect['value']
        player.run_gold_gained += effect['value']
        result = effect['value']
        print(f"   ↳ Ganhou {effect['value']} ouro instantâneo")
        
    elif effect_type == 'sacrifice_relic':
        # Escolher relíquia aleatória para sacrificar (exceto a si mesma)
        other_relics = PlayerRelic.query.filter(
            PlayerRelic.player_id == player.id,
            PlayerRelic.is_active == True,
            PlayerRelic.id != player_relic.id
        ).all()
        
        # SEMPRE dá o ouro, independente de ter relíquia para sacrificar
        player.run_gold += effect['gold_reward']
        player.run_gold_gained += effect['gold_reward']
        result = effect['gold_reward']
        
        if other_relics:
            sacrificed = random.choice(other_relics)
            sacrificed.is_active = False
            print(f"   ↳ Sacrificou {len(other_relics)} relíquia(s), ganhou {effect['gold_reward']} ouro")
        else:
            print(f"   ↳ Nenhuma relíquia para sacrificar, mas ganhou {effect['gold_reward']} ouro")
            
    elif effect_type == 'stat_boost':
        stat = effect['stat']
        value = effect['value']
        
        if stat == 'max_hp':
            # Adicionar ao bônus permanente (o cache vai recalcular)
            current_bonus = getattr(player, 'max_hp_bonus', 0)
            player.max_hp_bonus = current_bonus + value
            print(f"   ↳ max_hp_bonus: {current_bonus} → {player.max_hp_bonus}")
            
            # Forçar recálculo do cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)
        
        elif stat == 'max_energy':
            # Adicionar diretamente à energia máxima
            player.max_energy += value
            print(f"   ↳ max_energy aumentada para {player.max_energy}")
            
            # Forçar recálculo do cache
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)
        
        result = {'stat': stat, 'value': value}
    
    # ===== RECOMPENSAS =====
    
    elif effect_type == 'reward_multiplier':
        if context.get('event') == 'rewards':
            reward_type = effect['reward_type']
            if reward_type in context['rewards']:
                old_value = context['rewards'][reward_type]
                context['rewards'][reward_type] = int(old_value * effect['multiplier'])
                result = context['rewards']
                print(f"   ↳ {reward_type} x{effect['multiplier']}")
                
    elif effect_type == 'hourglass_to_gold':
        if context.get('event') == 'rewards':
            hourglasses = context['rewards'].get('hourglasses', 0)
            if hourglasses > 0:
                bonus_gold = hourglasses * effect['gold_per_hourglass']
                context['rewards']['gold'] = context['rewards'].get('gold', 0) + bonus_gold
                result = context['rewards']
                print(f"   ↳ {hourglasses} ampulhetas viraram {bonus_gold} ouro")
                
    elif effect_type == 'hourglass_bonus':
        # SÓ adicionar se o inimigo JÁ dropa ampulhetas (> 0)
        if context['rewards'].get('hourglasses', 0) > 0:
            context['rewards']['hourglasses'] += effect['bonus_amount']
            result = context['rewards']
            print(f"   ↳ +{effect['bonus_amount']} Ampulheta Eterna extra")
    
    # ===== ESPECIAIS E META =====
    
    elif effect_type == 'death_prevention':
        # Será implementado em apply_damage_to_player
        # TODO: Adicionar mensagem visual "Espelho de Lázaro ativado!"
        # TODO: Adicionar animação de ressurreição (partículas douradas?)
        pass
        
    elif effect_type == 'block_first_enemy_attack':
        # Será implementado em apply_damage_to_player
        pass
        
    elif effect_type == 'flat_heal_bonus':
        # Aplicado em _apply_heal
        pass
        
    elif effect_type == 'extra_memory_option':
        # Será usado em select_random_memory_options
        pass
        
    elif effect_type == 'extra_enemy_option':
        # Será usado em ensure_minimum_enemies
        pass
        
    elif effect_type == 'bonus_boss_relics':
        # Será usado em generate_relic_options após boss
        pass
        
    elif effect_type == 'extra_relic_option':
        # Será usado em generate_relic_options
        pass
    
    # ===== PASSIVOS (SEM AÇÃO DIRETA) =====
    # Estes são calculados no cache ou verificados em outras funções
    elif effect_type in ['heal_multiplier', 'crit_per_relic', 'block_per_relic', 
                        'special_trade']:
        pass

    elif effect_type == 'special_energy_reduction':
        # ID 23 - Reduz custo de energia do Especial
        # Implementado no battle_cache.py
        pass

    elif effect_type == 'lifesteal_per_relic':
        # Aplicar vampirismo APENAS no ataque básico
        skill_type = context.get('skill_type') or context.get('skill', {}).get('type')
        if skill_type == 'attack' and context.get('attack_data'):
            # Contar relíquias ativas
            relic_count = PlayerRelic.query.filter_by(
                player_id=player.id,
                is_active=True
            ).count()
            
            lifesteal_bonus = relic_count * effect['lifesteal_percent']
            context['attack_data']['lifesteal_bonus'] += lifesteal_bonus
            result = context['attack_data']
            print(f"   ↳ {relic_count} relíquias: +{lifesteal_bonus*100:.1f}% vampirismo")
    
    # Incrementar contador de ativações se teve resultado
    if result is not None:
        player_relic.times_triggered += 1
    
    return result

def _apply_heal(player, amount):
    """
    Aplica cura ao jogador, considerando multiplicadores de relíquias.
    
    IMPORTANTE: Multiplicadores são ADITIVOS, não multiplicativos!
    Exemplo: ID 2 (+100%) + ID 3 (+50%) = +150% total (×2.5)
    """
    # Buscar multiplicadores de cura (ADITIVO)
    heal_bonus_total = 0.0  # Começa em 0, não em 1
    
    heal_mult_relics = PlayerRelic.query.filter_by(
        player_id=player.id,
        is_active=True
    ).all()
    
    from .registry import get_relic_definition
    
    for relic in heal_mult_relics:
        definition = get_relic_definition(relic.relic_id)
        if definition and definition['effect']['type'] == 'heal_multiplier':
            # Somar o BÔNUS, não multiplicar
            # Se multiplier = 2.0 → bônus = +1.0 (100%)
            # Se multiplier = 1.5 → bônus = +0.5 (50%)
            bonus = definition['effect']['multiplier'] - 1.0
            heal_bonus_total += bonus
            print(f"   ↳ {definition['name']}: +{bonus*100:.0f}% bônus de cura")
    
    # Calcular multiplicador final
    heal_multiplier = 1.0 + heal_bonus_total
    
    # Aplicar multiplicador
    final_heal = int(amount * heal_multiplier)
    
    # Aplicar bônus flat (ID 45)
    flat_bonus = 0
    flat_heal_relics = PlayerRelic.query.filter_by(
        player_id=player.id,
        is_active=True
    ).all()
    
    flat_bonus_sources = []  # Para rastrear quais relíquias deram bônus

    for relic in flat_heal_relics:
        definition = get_relic_definition(relic.relic_id)
        if definition and definition['effect']['type'] == 'flat_heal_bonus':
            bonus_value = definition['effect']['value']
            flat_bonus += bonus_value
            flat_bonus_sources.append(f"{definition['name']} (+{bonus_value} HP)")

    if flat_bonus > 0:
        final_heal += flat_bonus
        for source in flat_bonus_sources:
            print(f"   ↳ {source} bônus flat")
    
    old_hp = player.hp
    player.hp = min(player.hp + final_heal, player.max_hp)
    actual_heal = player.hp - old_hp
    
    if heal_multiplier > 1.0:
        print(f"   ↳ Cura multiplicada: {amount} × {heal_multiplier:.1f} = {final_heal}")
    
    return actual_heal

def _check_threshold(player_relic, player, definition):
    """Verifica se contador atingiu threshold"""
    if not definition.get('requires_counter'):
        return True
    
    counter_type = definition['counter_type']
    threshold = definition['counter_threshold']
    
    if counter_type == 'total_attacks':
        return player.total_attacks_any_type % threshold == 0
    
    elif counter_type == 'special_uses':
        return player.total_special_uses % threshold == 0
    
    return False

def _apply_accumulating_damage(player_relic, player, effect, context):
    """Aplica dano acumulativo permanente"""
    skill_type = effect['skill_type']
    
    if context.get('event') == 'acquire':
        if skill_type == 'attack':
            player.accumulated_attack_bonus += effect['initial_bonus']
        elif skill_type == 'power':
            player.accumulated_power_bonus += effect['initial_bonus']
        
        # Recalcular cache para incluir novo bônus
        from routes.battle_cache import calculate_attack_cache
        calculate_attack_cache(player.id)
        
        return effect['initial_bonus']
    
    if context.get('event') == 'after_attack':
        if context.get('skill_type') == skill_type:
            if skill_type == 'attack':
                player.accumulated_attack_bonus += effect['stack_bonus']
                player_relic.counter_value += 1
            elif skill_type == 'power':
                player.accumulated_power_bonus += effect['stack_bonus']
                player_relic.counter_value += 1
            
            # Recalcular cache para incluir novo bônus
            from routes.battle_cache import calculate_attack_cache
            calculate_attack_cache(player.id)
            
            return effect['stack_bonus']
    
    return None

def _apply_battle_accumulating_damage(player_relic, player, effect, context):
    """
    Aplica dano acumulativo que reseta entre batalhas.
    
    IMPORTANTE: Este tipo NÃO modifica o cache permanentemente!
    O bônus inicial vai pro cache, mas os stacks de batalha são aplicados
    transitoriamente em damage_boss() via attack_data['base_damage'].
    """
    skill_type = effect['skill_type']
    
    if context.get('event') == 'acquire':
        if skill_type == 'attack':
            player.accumulated_attack_bonus += effect['initial_bonus']
        
        # Recalcular cache APENAS para o bônus inicial (permanente)
        from routes.battle_cache import calculate_attack_cache
        calculate_attack_cache(player.id)
        
        return effect['initial_bonus']
    
    if context.get('event') == 'after_attack':
        if context.get('skill_type') == skill_type:
            # Usar state_data para rastrear acúmulo de batalha (NÃO vai pro cache)
            state = json.loads(player_relic.state_data or '{}')
            battle_stacks = state.get('battle_stacks', 0)
            battle_stacks += effect['stack_bonus']
            state['battle_stacks'] = battle_stacks
            player_relic.state_data = json.dumps(state)
            player_relic.counter_value = battle_stacks
            
            # NÃO adicionar ao accumulated_attack_bonus
            # NÃO recalcular cache
            # O bônus será aplicado transitoriamente em damage_boss()
            
            return effect['stack_bonus']
    
    return None