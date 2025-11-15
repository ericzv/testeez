"""
Hooks que outros arquivos chamam em momentos específicos.
Centraliza todos os pontos de integração do sistema de relíquias.
"""

from database import db
from models import Player, PlayerRelic
from .processor import apply_relic_effect
from .registry import get_relic_definition
import json


def trigger_relic_hooks(player, event_name, event_data=None):
    """
    Função genérica para disparar hooks de relíquias.

    Args:
        player: Objeto Player
        event_name: Nome do evento (ex: 'on_victory', 'on_rewards', 'before_attack')
        event_data: Dados adicionais para o evento (opcional)

    Returns:
        Resultado do hook (se houver)
    """
    if event_data is None:
        event_data = {}

    # Mapear nome do evento para a função correspondente
    hook_functions = {
        'on_combat_start': lambda: on_combat_start(player, event_data.get('enemy')),
        'before_attack': lambda: before_attack(player, event_data.get('skill_data', {}), event_data.get('attack_data', {})),
        'after_attack': lambda: after_attack(player, event_data.get('attack_result', {})),
        'on_kill': lambda: on_kill(player, event_data.get('enemy_data', {})),
        'on_rewards': lambda: on_rewards(player, event_data.get('rewards', {})),
        'on_victory': lambda: on_victory(player),
        'on_acquire': lambda: on_acquire(player.id, event_data.get('player_relic')),
        'reset_battle_counters': lambda: reset_battle_counters(player)
    }

    # Executar a função correspondente
    hook_func = hook_functions.get(event_name)
    if hook_func:
        return hook_func()
    else:
        print(f"⚠️ Hook '{event_name}' não encontrado")
        return None

def get_active_relics(player_id):
    """Retorna relíquias ativas do jogador"""
    return PlayerRelic.query.filter_by(
        player_id=player_id,
        is_active=True
    ).all()

def on_combat_start(player, enemy):
    """Chamado ao entrar na batalha"""
    active_relics = get_active_relics(player.id)
    
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_combat_start' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'combat_start',
                'enemy': enemy
            })
    
    # ===== CORREÇÃO: RESETAR ENERGIA PARA O MÁXIMO ATUAL =====
    # Isso garante que bônus de max_energy (como da Relíquia ID 42)
    # sejam aplicados corretamente no início do combate (ex: 12/12)
    player.energy = player.max_energy
    print(f"⚡ Energia resetada para o máximo no início do combate: {player.energy}/{player.max_energy}")
    
    # Aplicar energia do primeiro turno (ID 29)
    # Fazer DEPOIS de resetar a energia
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if definition and definition['effect']['type'] == 'gain_energy_first_turn':
            energy_bonus = definition['effect']['value']
            player.energy += energy_bonus # <-- Isso agora pode exceder o máximo
            print(f"✨ {definition['name']}: +{energy_bonus} energia no primeiro turno (Energia: {player.energy}/{player.max_energy})")
    
    db.session.commit()

def before_attack(player, skill_data, attack_data):
    """
    Chamado antes de calcular dano.
    Retorna attack_data modificado.
    """
    from routes.battle import get_current_battle_enemy

    active_relics = get_active_relics(player.id)

    # Adicionar campos necessários se não existirem
    if 'damage_multiplier' not in attack_data:
        attack_data['damage_multiplier'] = 1.0
    if 'lifesteal_bonus' not in attack_data:
        attack_data['lifesteal_bonus'] = 0.0

    # ===== SISTEMA DE BLOOD STACKS DO VLAD - ULTIMATE =====
    skill_id = skill_data.get('id')
    if skill_id == 53 and player.character_id == 'vlad':  # ID 53 = Beijo da Morte (Ultimate)
        current_enemy = get_current_battle_enemy(player.id)
        if current_enemy:
            blood_stacks = current_enemy.blood_stacks or 0
            if blood_stacks > 0:
                bonus_damage = blood_stacks * 2
                # Adicionar dano extra ao attack_data
                if 'flat_damage_bonus' not in attack_data:
                    attack_data['flat_damage_bonus'] = 0
                attack_data['flat_damage_bonus'] += bonus_damage
                print(f"🩸 Ultimate consumirá {blood_stacks} stacks | +{bonus_damage} dano extra")
    
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'before_attack' in definition['hooks']:
            result = apply_relic_effect(relic, player, {
                'event': 'before_attack',
                'skill': skill_data,
                'attack_data': attack_data,
                'skill_type': skill_data.get('type')
            })
            
            # Atualizar attack_data se retornou algo
            if result and isinstance(result, dict):
                attack_data.update(result)
    
    db.session.commit()
    return attack_data

def after_attack(player, attack_result):
    """Chamado após aplicar dano"""
    from routes.battle import get_current_battle_enemy

    active_relics = get_active_relics(player.id)

    # Incrementar contadores globais
    player.attacks_this_battle += 1
    player.total_attacks_any_type += 1

    # ===== SISTEMA DE BLOOD STACKS DO VLAD =====
    skill_id = attack_result.get('skill_id')
    if skill_id and player.character_id == 'vlad':
        current_enemy = get_current_battle_enemy(player.id)
        if current_enemy:
            # ID 51 (Garras Sangrentas - Ataque Básico) = +2 Blood Stacks
            if skill_id == 51:
                current_enemy.blood_stacks = (current_enemy.blood_stacks or 0) + 2
                print(f"🩸 Blood Stacks: +2 (Ataque Básico) | Total: {current_enemy.blood_stacks}")

            # ID 50 (Energia Escura - Poder) ou ID 52 (Abraço da Escuridão - Especial) = +1 Blood Stack
            elif skill_id in [50, 52]:
                current_enemy.blood_stacks = (current_enemy.blood_stacks or 0) + 1
                print(f"🩸 Blood Stacks: +1 (Poder/Especial) | Total: {current_enemy.blood_stacks}")

            # ID 53 (Beijo da Morte - Ultimate) = CONSOME todos e adiciona +2 dano por stack
            elif skill_id == 53:
                blood_stacks = current_enemy.blood_stacks or 0
                if blood_stacks > 0:
                    bonus_damage = blood_stacks * 2
                    # O dano bonus já deve ter sido aplicado, mas registramos aqui
                    print(f"🩸 Blood Stacks: CONSUMIU {blood_stacks} stacks (+{bonus_damage} dano)")
                    current_enemy.blood_stacks = 0

    # Rastrear skill usada
    skill_type = attack_result.get('skill_type')
    if skill_type:
        skills_used = json.loads(player.skills_used_this_battle)
        skills_used[skill_type] = skills_used.get(skill_type, 0) + 1
        player.skills_used_this_battle = json.dumps(skills_used)
        
        # Rastrear últimas 3
        last_three = json.loads(player.last_three_skills)
        last_three.append(skill_type)
        if len(last_three) > 3:
            last_three.pop(0)
        player.last_three_skills = json.dumps(last_three)
    
    # Rastrear críticos
    if attack_result.get('is_critical'):
        player.critical_hits_this_battle += 1
        player.last_attack_was_critical = True
    else:
        player.last_attack_was_critical = False
    
    # Marcar primeira ação (QUALQUER ataque)
    if not player.first_attack_done:
        player.first_attack_done = True
        print(f"✅ Marcada flag: first_attack_done = True")

    # Marcar primeira ação de Poder/Especial
    if skill_type in ['power', 'special']:
        if not player.first_power_or_special_done:
            player.first_power_or_special_done = True
            print(f"✅ Marcada flag: first_power_or_special_done = True")
    
    # Aplicar efeitos de relíquias
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        
        # Hooks genéricos
        if 'after_attack' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'after_attack',
                'damage': attack_result.get('damage'),
                'is_critical': attack_result.get('is_critical'),
                'skill_type': skill_type
            })
        
        # Hooks específicos
        if skill_type == 'attack' and 'after_basic_attack' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'after_attack',
                'skill_type': 'attack'
            })
        
        if skill_type == 'special' and 'after_special_use' in definition['hooks']:
            player.total_special_uses += 1
            apply_relic_effect(relic, player, {
                'event': 'after_attack',
                'skill_type': 'special'
            })
        
        if 'after_damage_dealt' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'after_damage_dealt',
                'damage': attack_result.get('damage')
            })
    
    db.session.commit()

def on_kill(player, enemy_data):
    """Chamado ao derrotar inimigo"""
    player.kills_this_run += 1
    
    active_relics = get_active_relics(player.id)
    
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_kill' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'kill',
                'enemy': enemy_data
            })
    
    db.session.commit()

def on_rewards(player, rewards):
    """
    Chamado ao receber recompensas.
    Retorna rewards modificado.
    
    ORDEM DE PROCESSAMENTO:
    1. Multiplicadores (ID 35, 38) - multiplicam valores base
    2. Bônus fixos (ID 40) - adicionam valores
    3. Conversões (ID 39) - convertem um recurso em outro
    """
    active_relics = get_active_relics(player.id)
    
    # FASE 1: Multiplicadores (processar primeiro)
    multiplier_types = ['reward_multiplier']
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_rewards' not in definition['hooks']:
            continue
        
        effect_type = definition['effect']['type']
        if effect_type in multiplier_types:
            result = apply_relic_effect(relic, player, {
                'event': 'rewards',
                'rewards': rewards
            })
            
            if result and isinstance(result, dict):
                rewards.update(result)
    
    # FASE 2: Bônus fixos (processar segundo)
    bonus_types = ['hourglass_bonus']
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_rewards' not in definition['hooks']:
            continue
        
        effect_type = definition['effect']['type']
        if effect_type in bonus_types:
            result = apply_relic_effect(relic, player, {
                'event': 'rewards',
                'rewards': rewards
            })
            
            if result and isinstance(result, dict):
                rewards.update(result)
    
    # FASE 3: Conversões (processar por último)
    conversion_types = ['hourglass_to_gold']
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_rewards' not in definition['hooks']:
            continue
        
        effect_type = definition['effect']['type']
        if effect_type in conversion_types:
            result = apply_relic_effect(relic, player, {
                'event': 'rewards',
                'rewards': rewards
            })
            
            if result and isinstance(result, dict):
                rewards.update(result)
    
    db.session.commit()
    return rewards

def on_victory(player):
    """Chamado ao vencer um combate (antes de aplicar recompensas)"""
    active_relics = get_active_relics(player.id)
    
    for relic in active_relics:
        definition = get_relic_definition(relic.relic_id)
        if 'on_victory' in definition['hooks']:
            apply_relic_effect(relic, player, {
                'event': 'victory'
            })
    
    db.session.commit()

def on_acquire(player_id, player_relic):
    """Chamado quando adquire uma relíquia"""
    player = Player.query.get(player_id)
    definition = get_relic_definition(player_relic.relic_id)
    
    if 'on_acquire' in definition['hooks']:
        apply_relic_effect(player_relic, player, {
            'event': 'acquire'
        })
    
    db.session.commit()

def reset_battle_counters(player):
    """Reseta contadores ao finalizar batalha"""
    player.attacks_this_battle = 0
    player.skills_used_this_battle = '{}'
    player.last_three_skills = '[]'
    player.critical_hits_this_battle = 0
    player.last_attack_was_critical = False
    player.first_attack_done = False
    player.first_power_or_special_done = False
    player.enemy_first_attack_blocked = False
    # accumulated_* NÃO reseta
    # total_* NÃO reseta

    # ===== RESETAR SKILLS ESPECIAIS PARA PRÓXIMA BATALHA =====
    from characters import PlayerSkill
    special_skills = PlayerSkill.query.filter_by(
        player_id=player.id,
        skill_type="special"
    ).all()
    for skill in special_skills:
        skill.last_used_at_enemy_turn = None
    print(f"♻️ Skills especiais resetadas após vitória ({len(special_skills)} skills)")

    # ===== LIMPAR STATE_DATA DAS RELÍQUIAS ENTRE BATALHAS =====
    battle_relics = PlayerRelic.query.filter_by(player_id=player.id, is_active=True).all()
    for relic in battle_relics:
        state = json.loads(relic.state_data or '{}')

        # Limpar flags de batalha (mas manter stacks permanentes)
        state.pop('healed_this_battle', None)
        state.pop('pd_given_this_battle', None)
        state.pop('used_this_battle', None)
        state.pop('battle_stacks', None)
        state.pop('should_double', None)
        state.pop('skill_count_battle', None)  # Contador da Trinitas (ID 31) e similares

        relic.state_data = json.dumps(state)

    # NÃO precisa recalcular cache aqui (battle_stacks não está no cache)

    db.session.commit()