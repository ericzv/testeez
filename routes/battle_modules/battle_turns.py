# routes/battle_modules/battle_turns.py - Sistema de turnos do inimigo
import json
import random
from datetime import datetime

from database import db
from models import GenericEnemy, LastBoss
from .battle_log import log_turn, get_battle_log, clear_battle_log

def load_enemy_skills_data():
    """Carrega dados das skills dos inimigos"""
    import os
    try:
        skills_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_skills_data.json')
        with open(skills_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar enemy skills data: {e}")
        return {}


def get_next_actions(enemy):
    """
    Retorna as próximas ações que o inimigo executará neste turno
    Baseado na probabilidade de ações por turno
    
    Retorna uma lista de OBJETOS DE INTENÇÃO RICOS.
    Ex: [{'type': 'attack', 'name': 'Ataque', 'icon': '...', 'damage': 33},
         {'type': 'debuff', 'name': 'Nictalopia', 'icon': '...', 'skill_id': 101}]
    """
    if not enemy.action_pattern:
        print("⚠️ Inimigo sem action_pattern definido")
        return {'actions': [{'type': 'attack', 'name': 'Ataque Básico', 'icon': '/static/game.data/icons/attackcharge.png', 'damage': enemy.damage}], 'num_actions': 1}
    
    # Carregar padrão de ações
    action_pattern = json.loads(enemy.action_pattern)
    
    # Carregar probabilidades
    probabilities = json.loads(enemy.actions_per_turn_probability) if enemy.actions_per_turn_probability else {"1": 1.0}
    
    # Determinar quantas ações o inimigo fará neste turno
    rand = random.random()
    cumulative = 0
    num_actions = 1
    
    for actions_count, probability in sorted(probabilities.items()):
        cumulative += probability
        if rand <= cumulative:
            num_actions = int(actions_count)
            break
    
    print(f"🎲 Rolagem de ações: {rand:.2f} → {num_actions} ação(ões) neste turno")
    
    # Pegar as próximas N ações do padrão
    current_index = enemy.current_action_index
    
    # --- INÍCIO DA LÓGICA DE RESOLUÇÃO COM OBJETOS RICOS ---
    
    # Carregar dados das skills (NECESSÁRIO AQUI AGORA)
    skills_data = load_enemy_skills_data()
    
    # Precisamos saber quais skills o inimigo tem
    if hasattr(enemy, 'enemy_skills') and enemy.enemy_skills:
        enemy_skills = json.loads(enemy.enemy_skills)
    elif hasattr(enemy, 'skills') and enemy.skills:
        enemy_skills = json.loads(enemy.skills)
    else:
        enemy_skills = []

    attack_skills = [s for s in enemy_skills if s['type'] == 'attack']
    buff_skills = [s for s in enemy_skills if s['type'] == 'buff']
    debuff_skills = [s for s in enemy_skills if s['type'] == 'debuff']
    has_buff = len(buff_skills) > 0
    has_debuff = len(debuff_skills) > 0
    
    resolved_actions = []
    
    # Criar/obter índice de rotação (garantir que existe)
    if not hasattr(enemy, 'buff_debuff_rotation_index'):
        enemy.buff_debuff_rotation_index = 0
    
    current_rotation_index = enemy.buff_debuff_rotation_index
    
    for i in range(num_actions):
        action_index = (current_index + i) % len(action_pattern)
        action = action_pattern[action_index]
        
        if action == 'buff_debuff':
            skill_to_use = None
            skill_type = None
            
            if has_buff and has_debuff:
                if current_rotation_index % 2 == 0:
                    skill_to_use = buff_skills[0]
                    skill_type = 'buff'
                else:
                    skill_to_use = debuff_skills[0]
                    skill_type = 'debuff'
                current_rotation_index += 1
            elif has_buff:
                skill_to_use = buff_skills[0]
                skill_type = 'buff'
            elif has_debuff:
                skill_to_use = debuff_skills[0]
                skill_type = 'debuff'
            
            if skill_to_use:
                skill_id = skill_to_use['skill_id']
                skill_id_str = str(skill_id)
                skill_info = skills_data.get(f'{skill_type}_skills', {}).get(skill_id_str)
                
                if skill_info:
                    resolved_actions.append({
                        'type': skill_type,
                        'name': skill_info.get('name', 'Efeito'),
                        'icon': skill_info.get('icon', '/static/game.data/icons/skill_default.png'),
                        'skill_id': skill_id,
                        'data': skill_info # Enviar todos os dados da skill
                    })
                else:
                    # Fallback se a skill não for encontrada nos dados
                    resolved_actions.append({'type': 'attack', 'name': 'Ataque Básico', 'icon': '/static/game.data/icons/attackcharge.png', 'damage': enemy.damage})
            else:
                print(f"⚠️ Padrão pede 'buff_debuff', mas inimigo não tem. Trocando por 'attack'.")
                resolved_actions.append({'type': 'attack', 'name': 'Ataque Básico', 'icon': '/static/game.data/icons/attackcharge.png', 'damage': enemy.damage})
        
        elif action.startswith('attack_skill'):
            if not attack_skills:
                print(f"⚠️ Padrão pede 'attack_skill', mas inimigo não tem. Trocando por 'attack'.")
                resolved_actions.append({'type': 'attack', 'name': 'Ataque Básico', 'icon': '/static/game.data/icons/attackcharge.png', 'damage': enemy.damage})
                continue

            if '_' in action and len(action.split('_')) > 2:
                rotation_index = int(action.split('_')[2])
                skill_index = rotation_index % len(attack_skills)
            else:
                skill_index = enemy.attack_skill_rotation_index % len(attack_skills)
                enemy.attack_skill_rotation_index += 1
            
            selected_skill = attack_skills[skill_index]
            skill_id = selected_skill['skill_id']
            skill_id_str = str(skill_id)
            skill_info = skills_data.get('attack_skills', {}).get(skill_id_str)
            
            if skill_info:
                # Calcular dano esperado
                damage_range = skill_info.get('damage_range', '1.0-1.0')
                min_mult, max_mult = map(float, damage_range.split('-'))
                avg_damage = int(enemy.damage * ((min_mult + max_mult) / 2))
                
                resolved_actions.append({
                    'type': 'attack_skill',
                    'name': skill_info.get('name', 'Skill de Ataque'),
                    'icon': skill_info.get('icon', '/static/game.data/icons/skill_default.png'),
                    'damage': avg_damage,
                    'skill_id': skill_id,
                    'data': skill_info # Enviar todos os dados da skill
                })
            else:
                resolved_actions.append({'type': 'attack', 'name': 'Ataque Básico', 'icon': '/static/game.data/icons/attackcharge.png', 'damage': enemy.damage})
        
        elif action == 'attack':
            resolved_actions.append({
                'type': 'attack',
                'name': 'Ataque Básico',
                'icon': '/static/game.data/icons/attackcharge.png',
                'damage': enemy.damage
            })
        
    # Atualizar índices para o próximo turno
    enemy.current_action_index = (current_index + num_actions) % len(action_pattern)
    enemy.buff_debuff_rotation_index = current_rotation_index
    
    print(f"🎯 Ações RESOLVIDAS (objetos ricos): {[a['type'] for a in resolved_actions]}")
    print(f"📍 Próximo índice de ação: {enemy.current_action_index}")
    print(f"📍 Próximo índice de buff/debuff: {enemy.buff_debuff_rotation_index}")
    
    return {
        'actions': resolved_actions,
        'num_actions': len(resolved_actions)
    }


def reorganize_actions_buffs_first(actions):
    """
    Reorganiza ações para que buff/debuff sempre venham primeiro
    
    Args:
        actions: lista de ações
    
    Returns:
        lista reorganizada
    """
    buffs_debuffs = [a for a in actions if a in ['buff', 'debuff']]
    attacks = [a for a in actions if a not in ['buff', 'debuff']]
    
    reorganized = buffs_debuffs + attacks
    
    if buffs_debuffs:
        print(f"🔄 Ações reorganizadas: {actions} → {reorganized}")
    
    return reorganized


def process_enemy_turn(enemy, player_id=None):
    """
    Processa o turno completo do inimigo
    Adiciona as ações à action_queue e buff_debuff_queue
    
    Returns:
        dict com status das ações geradas
    """
    print(f"\n{'='*60}")
    print(f"🎮 PROCESSANDO TURNO DO INIMIGO: {enemy.name}")
    print(f"{'='*60}")

    actions = []
    num_actions = 0
    
    # Tentar carregar ações do cache.
    # Graças às mudanças no battle.py, o cache deve estar populado desde o Turno 1.
    if hasattr(enemy, 'next_intentions_cached') and enemy.next_intentions_cached:
        try:
            actions = json.loads(enemy.next_intentions_cached)
            num_actions = len(actions)
            # Log melhorado para mostrar os tipos de ação dos objetos
            print(f"✅ Usando intenções do CACHE: {[a.get('type') for a in actions]} ({num_actions} ação(ões))")
        except Exception as e:
            # Cache corrompido ou formato antigo
            print(f"⚠️ Erro ao carregar cache (formato inválido?), pulando turno: {e}")
            actions = [] # Garante que nada seja executado se o cache falhar
            num_actions = 0
    else:
        # Se o cache estiver vazio (None ou '[]'), o inimigo não fará nada.
        # Isso não deve mais acontecer no Turno 1, mas é um fallback seguro.
        print(f"⚠️ Cache vazio. Inimigo não executará ações neste turno.")
        
    # ===== LIMPAR FILAS ANTIGAS (CRÍTICO!) =====
    action_queue = []
    buff_debuff_queue = []
    print(f"🗑️ Filas antigas limpas")
    
    # Carregar skills do inimigo (compatível com GenericEnemy e LastBoss)
    # GenericEnemy usa 'enemy_skills', LastBoss usa 'skills'
    if hasattr(enemy, 'enemy_skills') and enemy.enemy_skills:
        enemy_skills = json.loads(enemy.enemy_skills)
    elif hasattr(enemy, 'skills') and enemy.skills:
        enemy_skills = json.loads(enemy.skills)
    else:
        enemy_skills = []
    
    print(f"📋 Skills carregadas: {len(enemy_skills)} encontrada(s)")
    
    # Separar skills por tipo
    attack_skills = [s for s in enemy_skills if s['type'] == 'attack']
    buff_skills = [s for s in enemy_skills if s['type'] == 'buff']
    debuff_skills = [s for s in enemy_skills if s['type'] == 'debuff']
    
    print(f"📋 Skills disponíveis:")
    print(f"   Attack skills: {[s['skill_id'] for s in attack_skills]}")
    print(f"   Buff skills: {[s['skill_id'] for s in buff_skills]}")
    print(f"   Debuff skills: {[s['skill_id'] for s in debuff_skills]}")
    
    # Carregar dados das skills
    skills_data = load_enemy_skills_data()
    
    # Processar cada objeto de intenção
    for intention_object in actions:
        
        action_type = intention_object.get('type')
        print(f"\n🔹 Processando ação: {action_type}")
        
        if action_type == 'attack':
            # Ataque básico
            action_queue.append({
                "type": "attack",
                "icon": intention_object.get('icon', '/static/game.data/icons/attackcharge.png'),
                "data": {
                    "damage": intention_object.get('damage', enemy.damage),
                    "hit_animation": enemy.hit_animation,
                    "attack_sfx": getattr(enemy, 'hit_sound', None) or getattr(enemy, 'attack_sfx', None)
                }
            })
            print(f"   ✅ Ataque básico adicionado (dano: {intention_object.get('damage', enemy.damage)})")
        
        elif action_type == 'attack_skill':
            # Attack skill
            skill_info = intention_object.get('data')
            if skill_info:
                
                # ADICIONE ESTA LINHA (FEATURE 2)
                # Adiciona o dano (que veio da intenção) dentro do objeto de dados
                skill_info['calculated_damage'] = intention_object.get('damage', 0) 
                
                action_queue.append({
                    "type": "attack_skill",
                    "icon": skill_info.get('icon', '/static/game.data/icons/skill_default.png'),
                    "skill_id": intention_object.get('skill_id'),
                    "data": skill_info # Agora 'skill_info' contém o 'calculated_damage'
                })
                print(f"   ✅ Attack skill {intention_object.get('skill_id')} adicionada (skill: {skill_info.get('name')}, Dano: {skill_info['calculated_damage']})")
            else:
                print(f"   ⚠️ Objeto de intenção 'attack_skill' não continha dados da skill.")
        
        elif action_type in ('buff', 'debuff'):
            # Buff ou Debuff
            skill_info = intention_object.get('data')
            if skill_info:
                buff_debuff_queue.append({
                    "type": action_type,
                    "icon": skill_info.get('icon', '/static/game.data/icons/skill_default.png'),
                    "skill_id": intention_object.get('skill_id'),
                    "data": skill_info # Passar o objeto de dados da skill completo
                })
                print(f"   ✅ {action_type.capitalize()} skill {intention_object.get('skill_id')} adicionada (skill: {skill_info.get('name')})")
            else:
                 print(f"   ⚠️ Objeto de intenção '{action_type}' não continha dados da skill.")
        
        else:
            print(f"   ❌ Tipo de ação desconhecido: {action_type}")
    
    # Salvar filas atualizadas
    enemy.action_queue = json.dumps(action_queue)
    enemy.buff_debuff_queue = json.dumps(buff_debuff_queue)
    
    # Atualizar contadores (compatibilidade com sistema antigo)
    enemy.attack_charges_count = len(action_queue)
    
    db.session.commit()
    
    print(f"\n✅ Turno processado:")
    print(f"   Action queue: {len(action_queue)} ação(ões)")
    print(f"   Buff/Debuff queue: {len(buff_debuff_queue)} skill(s)")
    print(f"{'='*60}\n")
    
    # ===== INCREMENTAR CONTADOR DE TURNOS =====
    enemy.battle_turn_counter = getattr(enemy, 'battle_turn_counter', 0) + 1
    print(f"📊 Turno do inimigo #{enemy.battle_turn_counter}")

    # ===== CALCULAR E SALVAR PRÓXIMAS INTENÇÕES =====
    next_turn_data = get_next_actions(enemy)
    next_intentions = next_turn_data['actions']
    enemy.next_intentions_cached = json.dumps(next_intentions)
    
    print(f"💾 Próximas intenções salvas (cache): {next_intentions}")
    print(f"🚨🚨🚨 TESTE: CHEGOU AQUI!")  # ← ADICIONE ESTA LINHA
    print(f"📊 Verificação antes do commit: {enemy.next_intentions_cached}")
    
    db.session.commit()
    
    # VERIFICAR SE O COMMIT FUNCIONOU
    db.session.refresh(enemy)
    cached_after = json.loads(enemy.next_intentions_cached) if enemy.next_intentions_cached else []
    print(f"✅ Verificação APÓS commit: {cached_after}")
    
    if cached_after != next_intentions:
        print(f"⚠️ AVISO: Cache foi modificado após commit!")
        print(f"   Esperado: {next_intentions}")
        print(f"   Obtido: {cached_after}")

    # ===== REGISTRAR NO LOG =====
    print(f"🔍 DEBUG LOG: player_id recebido = {player_id}")

    # Validação crítica: garantir que player_id existe
    if player_id is None:
        print(f"⚠️ AVISO CRÍTICO: player_id está None! Tentando obter do sistema...")
        # Fallback: buscar player atual
        try:
            from models import Player
            player = Player.query.first()
            if player:
                player_id = player.id
                print(f"✅ Player_id recuperado: {player_id}")
            else:
                print(f"❌ ERRO: Nenhum player encontrado no banco!")
        except Exception as e:
            print(f"❌ ERRO ao recuperar player_id: {e}")

    if player_id:
        turn_number = getattr(enemy, 'battle_turn_counter', 1)
        print(f"🔍 DEBUG LOG: turn_number = {turn_number}")
        
        # Formatar ações para o log (lendo objetos ricos)
        actions_log = []
        for intention_object in actions: # Mudado 'action' para 'intention_object'
            action_type = intention_object.get('type')
            action_name = intention_object.get('name', 'Ação')
            
            if action_type == 'attack':
                actions_log.append({'type': 'attack', 'description': action_name})
            elif action_type == 'attack_skill':
                actions_log.append({'type': 'attack_skill', 'description': action_name})
            elif action_type in ('buff', 'debuff'):
                actions_log.append({'type': action_type, 'description': action_name})
        
        print(f"🔍 DEBUG LOG: actions_log = {actions_log}")
        print(f"🔍 DEBUG LOG: next_intentions = {next_intentions}")
        
        try:
            log_turn(
                player_id=player_id,
                enemy_id=enemy.id,
                enemy_name=enemy.name,
                is_boss=hasattr(enemy, 'boss_type'),
                turn_number=turn_number,
                turn_type='enemy',
                actions=actions_log,
                next_intentions=next_intentions
            )
            print(f"✅ LOG REGISTRADO COM SUCESSO!")
        except Exception as e:
            print(f"❌ ERRO AO REGISTRAR LOG: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️ DEBUG LOG: player_id não foi passado!")

    return {
        'success': True,
        'num_actions': num_actions,
        'actions': actions,
        'action_queue_size': len(action_queue),
        'buff_debuff_queue_size': len(buff_debuff_queue)
    }