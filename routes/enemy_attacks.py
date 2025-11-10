# routes/enemy_attacks.py - Sistema de ataques de inimigos
from datetime import datetime, timedelta, timezone
import json
import random

from database import db
from models import Player, GenericEnemy
from routes.battle_modules.battle_utils import apply_damage_to_player

def load_enemy_skills_data():
    """Carrega dados das skills dos inimigos"""
    import os
    try:
        skills_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'game.data', 'enemy_skills_data.json')
        with open(skills_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar enemy skills data: {e}")
        return {}

def get_enemy_attack_status(player_id):
    """
    Retorna status completo das cargas de ataque do inimigo/boss atual.
    """
    try:
        # Encontrar inimigo/boss atual disponível
        from models import PlayerProgress, LastBoss
        player = Player.query.get(player_id)
        if not player:
            return {
                'has_charges': False,
                'charges_count': 0,
                'time_to_next': None,
                'action_queue': [],
                'skill_timers': {},
                'buff_debuff_queue': [],
                'has_buff_debuff_charges': False,
                'next_intentions': []
            }

        progress = PlayerProgress.query.filter_by(player_id=player_id).first()

        # ========== PRIORIDADE 1: BOSS ==========
        if progress and progress.selected_boss_id:
            boss = LastBoss.query.get(progress.selected_boss_id)
            if boss and boss.is_active:
                
                # Obter filas
                action_queue = json.loads(boss.action_queue) if boss.action_queue else []
                buff_debuff_queue = json.loads(boss.buff_debuff_queue) if boss.buff_debuff_queue else []
                
                # Verificar se tem cargas de ataque
                has_attack_charges = boss.attack_charges_count > 0 or any(item['type'] == 'skill_attack' for item in action_queue)
                
                # Calcular próximas intenções (BOSS)
                next_intentions = []
                # NOVO CÓDIGO PARA O BLOCO DO BOSS
                if hasattr(boss, 'next_intentions_cached') and boss.next_intentions_cached:
                    try:
                        next_intentions = json.loads(boss.next_intentions_cached)
                        print(f"📖 Usando intenções do cache (BOSS): {next_intentions}")
                    except Exception as e:
                        print(f"⚠️ Erro ao carregar cache de intenções: {e}")
                        next_intentions = [] # Adicionado fallback em caso de erro
                else:
                    # Se não houver cache (batalha acabou de começar), apenas retorne uma lista vazia.
                    print(f"📖 Cache de intenções (BOSS) vazio. Retornando [].")
                    next_intentions = [] # NÃO RECALCULAR AQUI!
                
                return {
                    'has_charges': has_attack_charges,
                    'charges_count': boss.attack_charges_count,
                    'action_queue': action_queue,
                    'buff_debuff_queue': buff_debuff_queue,
                    'has_buff_debuff_charges': len(buff_debuff_queue) > 0,
                    'enemy_name': boss.name,
                    'enemy_id': boss.id,
                    'is_boss': True,
                    'enemy_skills': json.loads(boss.skills) if boss.skills else [],
                    'next_intentions': next_intentions
                }

        # ========== PRIORIDADE 2: INIMIGO GENÉRICO ==========
        enemy = None
        if progress and progress.selected_enemy_id:
            enemy = GenericEnemy.query.get(progress.selected_enemy_id)
        
        if not enemy:
            return {
                'has_charges': False,
                'charges_count': 0,
                'time_to_next': None,
                'action_queue': [],
                'skill_timers': {},
                'buff_debuff_queue': [],
                'has_buff_debuff_charges': False,
                'next_intentions': []
            }
        
        # Obter filas
        action_queue = json.loads(enemy.action_queue) if enemy.action_queue else []
        buff_debuff_queue = json.loads(enemy.buff_debuff_queue) if enemy.buff_debuff_queue else []
        
        # Verificar se tem cargas de ataque
        has_attack_charges = enemy.attack_charges_count > 0 or any(item['type'] == 'skill_attack' for item in action_queue)
        
        # Calcular próximas intenções (ENEMY)
        next_intentions = []
        
        #INIMIGO GENÉRICO
        if hasattr(enemy, 'next_intentions_cached') and enemy.next_intentions_cached:
            try:
                next_intentions = json.loads(enemy.next_intentions_cached)
                print(f"📖 Usando intenções do cache (ENEMY): {next_intentions}")
            except Exception as e:
                print(f"⚠️ Erro ao carregar cache de intenções: {e}")
                next_intentions = [] # Adicionado fallback em caso de erro
        else:
            # Se não houver cache, apenas retorne uma lista vazia.
            print(f"📖 Cache de intenções (ENEMY) vazio. Retornando [].")
            next_intentions = [] # NÃO RECALCULAR AQUI!
        
        return {
            'has_charges': has_attack_charges,
            'charges_count': enemy.attack_charges_count,
            'action_queue': action_queue,
            'buff_debuff_queue': buff_debuff_queue,
            'has_buff_debuff_charges': len(buff_debuff_queue) > 0,
            'enemy_name': enemy.name,
            'enemy_id': enemy.id,
            'enemy_skills': json.loads(enemy.enemy_skills) if enemy.enemy_skills else [],
            'next_intentions': next_intentions
        }
        
    except Exception as e:
        print(f"Erro ao obter status de ataque do inimigo: {e}")
        import traceback
        traceback.print_exc()
        return {
            'has_charges': False,
            'charges_count': 0,
            'time_to_next': None,
            'action_queue': [],
            'skill_timers': {},
            'buff_debuff_queue': [],
            'has_buff_debuff_charges': False,
            'next_intentions': []
        }
    
def execute_enemy_skill_attack(player, enemy, skill_data):
    """
    Executa um ataque de skill do inimigo no jogador.
    Similar ao execute_enemy_attack mas para skills.
    """
    try:
        # Calcular dano da skill
        damage_range = skill_data['data'].get('damage_range', '1.0-1.0')
        min_mult, max_mult = map(float, damage_range.split('-'))
        damage_multiplier = random.uniform(min_mult, max_mult)
        skill_damage = int(enemy.damage * damage_multiplier)
        
        # Aplicar dano ao jogador
        damage_result = apply_damage_to_player(player, skill_damage)

        # Atualizar durações após ataque do inimigo
        try:
            update_buff_debuff_durations('enemy_attack', enemy_id=enemy.id)
        except Exception as e:
            print(f"Erro ao atualizar durações após ataque: {e}")
        
        # ← NOVA LÓGICA: Detectar se Lázaro ativou
        if isinstance(damage_result, dict) and damage_result.get('lazaro_activated'):
            return {
                'success': True,
                'attack_result': 'lazaro_activated',  # ← Frontend detecta isso
                'damage_dealt': damage_result['damage_dealt'],
                'player_hp': player.hp,
                'player_max_hp': player.max_hp,
                'player_barrier': player.barrier,
                'player_died': False,
                'lazaro_revived': True,
                'skill_id': skill_data.get('skill_id'),
                'activation_sound': skill_data['data'].get('activation_sound'),
                'execution_sound': skill_data['data'].get('execution_sound'),
                'player_fx_layer_a': skill_data['data'].get('player_fx_layer_a'),
                'player_fx_layer_b': skill_data['data'].get('player_fx_layer_b'),
                'player_fx_layer_a_frames': skill_data['data'].get('player_fx_layer_a_frames'),
                'player_fx_layer_b_frames': skill_data['data'].get('player_fx_layer_b_frames'),
                'action_consumed': skill_data
            }
        else:
            # Lógica normal (damage_result é int)
            damage_dealt = damage_result
            
            # Verificar se jogador morreu
            player_died = player.hp <= 0
            
            # Determinar resultado
            if damage_dealt == 0:
                attack_result = 'dodged'
            elif player_died:
                attack_result = 'death'
            else:
                attack_result = 'damage'
            
            return {
                'success': True,
                'attack_result': attack_result,
                'damage_dealt': damage_dealt,
                'player_hp': player.hp,
                'player_max_hp': player.max_hp,
                'player_barrier': player.barrier,
                'player_died': player_died,
                'skill_id': skill_data.get('skill_id'),
                'activation_sound': skill_data['data'].get('activation_sound'),
                'execution_sound': skill_data['data'].get('execution_sound'),
                'player_fx_layer_a': skill_data['data'].get('player_fx_layer_a'),
                'player_fx_layer_b': skill_data['data'].get('player_fx_layer_b'),
                'player_fx_layer_a_frames': skill_data['data'].get('player_fx_layer_a_frames'),
                'player_fx_layer_b_frames': skill_data['data'].get('player_fx_layer_b_frames'),
                'action_consumed': skill_data
            }
        
    except Exception as e:
        print(f"Erro ao executar skill attack: {e}")
        return {'success': False, 'message': str(e)}

def execute_enemy_attack(player, enemy):
    """
    Executa um único ataque do inimigo no jogador (normal ou skill).
    Retorna resultado do ataque.
    """
    action_queue = json.loads(enemy.action_queue) if enemy.action_queue else []
    
    if not action_queue:
        return {
            'success': False,
            'message': 'Nenhuma ação na fila'
        }
    
    # Pegar primeira ação da fila
    consumed_action = action_queue.pop(0)
    enemy.action_queue = json.dumps(action_queue)
    
    # Verificar tipo de ação
    if consumed_action.get('type') == 'attack_skill':
        # É uma skill de ataque
        result = execute_enemy_skill_attack(player, enemy, consumed_action)
        result['is_skill_attack'] = True
        
        # CORREÇÃO: Decrementar charges também para attack_skill
        enemy.attack_charges_count = max(0, enemy.attack_charges_count - 1)
        print(f"⚡ Attack skill consumida. Cargas restantes: {enemy.attack_charges_count}")
    else:       
        # Consumir uma carga normal
        enemy.attack_charges_count -= 1
        print(f"⚡ Ataque básico consumido. Cargas restantes: {enemy.attack_charges_count}")
        
        # Aplicar dano ao jogador usando sistema existente
        damage_result = apply_damage_to_player(player, enemy.damage)

        # ← NOVA LÓGICA: Detectar se Lázaro ativou
        if isinstance(damage_result, dict) and damage_result.get('lazaro_activated'):
            result = {
                'success': True,
                'attack_result': 'lazaro_activated',  # ← Frontend detecta isso
                'damage_dealt': damage_result['damage_dealt'],
                'player_hp': player.hp,
                'player_max_hp': player.max_hp,
                'player_barrier': player.barrier,
                'player_died': False,
                'lazaro_revived': True,
                'charges_remaining': enemy.attack_charges_count,
                'hit_animation': consumed_action['data']['hit_animation'],
                'attack_sfx': consumed_action['data'].get('attack_sfx') or consumed_action['data'].get('hit_sound'),
                'action_consumed': consumed_action,
                'is_skill_attack': False
            }
        # ===== CORREÇÃO: Detectar se barreira absorveu =====
        elif isinstance(damage_result, dict) and damage_result.get('barrier_absorbed'):
            result = {
                'success': True,
                'attack_result': 'barrier_absorbed',  # ← Novo tipo de resultado
                'damage_dealt': 0,
                'damage_blocked': damage_result['damage_blocked'],
                'player_hp': player.hp,
                'player_max_hp': player.max_hp,
                'player_barrier': player.barrier,
                'player_died': False,
                'charges_remaining': enemy.attack_charges_count,
                'hit_animation': consumed_action['data']['hit_animation'],
                'attack_sfx': consumed_action['data'].get('attack_sfx') or consumed_action['data'].get('hit_sound'),
                'action_consumed': consumed_action,
                'is_skill_attack': False
            }
        # ===================================================
        else:
            # Lógica normal (damage_result é int)
            damage_dealt = damage_result

            # Verificar se jogador morreu
            player_died = player.hp <= 0

            if player_died:
                # Limpar todas as cargas restantes se jogador morreu
                enemy.attack_charges_count = 0
                enemy.action_queue = '[]'
                if hasattr(enemy, 'buff_debuff_queue'):
                    enemy.buff_debuff_queue = '[]'

            # Determinar tipo de resultado
            if damage_dealt == 0:
                attack_result = 'dodged'
            elif player_died:
                attack_result = 'death'
            else:
                attack_result = 'damage'

            result = {
                'success': True,
                'attack_result': attack_result,
                'damage_dealt': damage_dealt,
                'player_hp': player.hp,
                'player_max_hp': player.max_hp,
                'player_barrier': player.barrier,
                'player_died': player_died,
                'charges_remaining': enemy.attack_charges_count,
                'hit_animation': consumed_action['data']['hit_animation'],
                'attack_sfx': consumed_action['data'].get('attack_sfx') or consumed_action['data'].get('hit_sound'),
                'action_consumed': consumed_action,
                'is_skill_attack': False
            }
    
    db.session.commit()
    return result

def execute_buff_debuff_skills_sequence(player, enemy):
    """
    Executa sequência completa de skills de buff/debuff do inimigo.
    """
    try:
        buff_debuff_queue = json.loads(enemy.buff_debuff_queue) if enemy.buff_debuff_queue else []
        
        if not buff_debuff_queue:
            return {
                'success': True,
                'skills_executed': 0,
                'message': 'Nenhuma skill pendente'
            }
        
        executed_skills = []
        
        # Executar cada skill na fila
        for skill_action in buff_debuff_queue:
            skill_type = skill_action['type']
            skill_id = skill_action['skill_id']
            skill_data = skill_action['data']
            
            if skill_type == 'buff':
                result = execute_buff_skill(enemy, skill_id, skill_data)
            elif skill_type == 'debuff':
                result = execute_debuff_skill(player, enemy, skill_id, skill_data)
            else:
                continue
            
            if result['success']:
                executed_skills.append({
                    'skill_id': skill_id,
                    'type': skill_type,
                    'icon': skill_data.get('icon'),
                    'activation_sound': skill_data.get('activation_sound'),
                    'execution_sound': skill_data.get('execution_sound'),
                    'enemy_skill_fx': skill_data.get('enemy_skill_fx'),
                    'enemy_skill_fx_frames': skill_data.get('enemy_skill_fx_frames'),
                    'player_fx_layer_a': skill_data.get('player_fx_layer_a') if skill_type == 'debuff' else None,
                    'player_fx_layer_b': skill_data.get('player_fx_layer_b') if skill_type == 'debuff' else None,
                    'result': result
                })
        
        # Limpar fila após execução
        enemy.buff_debuff_queue = '[]'
        db.session.commit()
        
        return {
            'success': True,
            'skills_executed': len(executed_skills),
            'executed_skills': executed_skills,
            'message': f'{len(executed_skills)} skills executadas'
        }
        
    except Exception as e:
        print(f"Erro ao executar sequência de buff/debuff: {e}")
        return {'success': False, 'message': str(e)}

def execute_buff_skill(enemy, skill_id, skill_data):
    """Executa uma skill de buff no inimigo"""
    try:
        from models import EnemySkillBuff
        
        print(f"🩹 === INÍCIO EXECUTE_BUFF_SKILL ===")
        print(f"🩹 Enemy ID: {enemy.id}, Name: {enemy.name}")
        print(f"🩹 Skill ID: {skill_id}")
        print(f"🩹 Skill Data: {skill_data}")
        print(f"🩹 HP ANTES: {enemy.hp}/{enemy.max_hp}")
        
        effect_type = skill_data.get('effect_type')
        effect_value = skill_data.get('effect_value')
        duration_type = skill_data.get('duration_type', 'immediate')
        duration_value = skill_data.get('duration_value', 1)
        
        print(f"🩹 Effect Type: {effect_type}")
        print(f"🩹 Effect Value: {effect_value}")
        print(f"🩹 Duration Type: {duration_type}")
        print(f"🩹 Duration Value: {duration_value}")
        
        if duration_type == 'immediate':
            print(f"🩹 ENTRANDO NO BLOCO IMMEDIATE")
            # Efeito imediato (como cura)
            if effect_type == 'heal':
                print(f"🩹 ENTRANDO NO BLOCO HEAL")
                healing = int(effect_value)
                hp_antes = enemy.hp
                enemy.hp = min(enemy.hp + healing, enemy.max_hp)
                hp_depois = enemy.hp
                print(f"🩹 Healing calculado: {healing}")
                print(f"🩹 HP ANTES da cura: {hp_antes}")
                print(f"🩹 HP DEPOIS da cura: {hp_depois}")
                print(f"🩹 Diferença aplicada: {hp_depois - hp_antes}")
                print(f"🩹 TENTANDO COMMIT...")
                db.session.commit()
                print(f"🩹 COMMIT REALIZADO COM SUCESSO!")
                
                # Verificar se persistiu
                db.session.refresh(enemy)
                print(f"🩹 HP APÓS REFRESH: {enemy.hp}/{enemy.max_hp}")
            else:
                print(f"🩹 Effect type não é 'heal': {effect_type}")
        else:
            print(f"🩹 ENTRANDO NO BLOCO DE DURAÇÃO")
            # Efeito com duração - verificar se já existe
            existing_buff = EnemySkillBuff.query.filter_by(
                enemy_id=enemy.id,
                skill_id=skill_id,
                effect_type=effect_type
            ).first()
            
            if existing_buff:
                # Buff já existe - aumentar duração (cumulativo)
                existing_buff.duration_remaining += duration_value
                print(f"🩹 Buff {effect_type} renovado - nova duração: {existing_buff.duration_remaining}")
            else:
                # Criar novo buff
                new_buff = EnemySkillBuff(
                    enemy_id=enemy.id,
                    skill_id=skill_id,
                    effect_type=effect_type,
                    effect_value=effect_value,
                    duration_type=duration_type,
                    duration_remaining=duration_value
                )
                db.session.add(new_buff)
                print(f"🩹 Novo buff {effect_type} aplicado por {duration_value} {duration_type}")
            
            db.session.commit()
        
        print(f"🩹 === FIM EXECUTE_BUFF_SKILL ===")
        
        return {
            'success': True,
            'effect_applied': effect_type,
            'value': effect_value
        }
        
    except Exception as e:
        print(f"🩹 ERRO ao executar buff skill: {e}")
        import traceback
        print(f"🩹 TRACEBACK: {traceback.format_exc()}")
        return {'success': False, 'message': str(e)}

def execute_debuff_skill(player, enemy, skill_id, skill_data):
    """Executa uma skill de debuff no jogador"""
    try:
        from models import EnemySkillDebuff
        
        effect_type = skill_data.get('effect_type')
        effect_value = skill_data.get('effect_value')
        duration_type = skill_data.get('duration_type', 'player_attacks')
        duration_value = skill_data.get('duration_value', 2)
        
        # Verificar se já existe este debuff
        existing_debuff = EnemySkillDebuff.query.filter_by(
            player_id=player.id,
            effect_type=effect_type
        ).first()
        
        if existing_debuff:
            # Debuff já existe - aumentar duração (cumulativo)
            existing_debuff.duration_remaining += duration_value
            print(f"Debuff {effect_type} renovado - nova duração: {existing_debuff.duration_remaining}")
        else:
            # Criar novo debuff
            new_debuff = EnemySkillDebuff(
                player_id=player.id,
                enemy_id=enemy.id,
                skill_id=skill_id,
                effect_type=effect_type,
                effect_value=effect_value,
                duration_type=duration_type,
                duration_remaining=duration_value
            )
            db.session.add(new_debuff)
            print(f"Novo debuff {effect_type} aplicado por {duration_value} {duration_type}")
        
        db.session.commit()
        
        return {
            'success': True,
            'effect_applied': effect_type,
            'value': effect_value,
            'duration': duration_value
        }
        
    except Exception as e:
        print(f"Erro ao executar debuff skill: {e}")
        return {'success': False, 'message': str(e)}

def clean_expired_buffs_debuffs():
    """Remove buffs e debuffs expirados"""
    try:
        from models import EnemySkillBuff, EnemySkillDebuff
        
        # Remover buffs com duração 0
        expired_buffs = EnemySkillBuff.query.filter(EnemySkillBuff.duration_remaining <= 0).all()
        for buff in expired_buffs:
            db.session.delete(buff)
        
        # Remover debuffs com duração 0
        expired_debuffs = EnemySkillDebuff.query.filter(EnemySkillDebuff.duration_remaining <= 0).all()
        for debuff in expired_debuffs:
            db.session.delete(debuff)
        
        if expired_buffs or expired_debuffs:
            db.session.commit()
            print(f"Removidos {len(expired_buffs)} buffs e {len(expired_debuffs)} debuffs expirados")
            
    except Exception as e:
        print(f"Erro ao limpar buffs/debuffs expirados: {e}")

def update_buff_debuff_durations(trigger_type, player_id=None, enemy_id=None):
    """
    Atualiza durações de buffs/debuffs baseado no tipo de trigger.
    trigger_type: 'player_attack', 'enemy_attack', 'player_damage_taken'
    """
    try:
        from models import EnemySkillBuff, EnemySkillDebuff
        
        updated = False
        
        if trigger_type == 'player_attack' and player_id:
            # Reduzir durações de debuffs que dependem de ataques do jogador
            debuffs = EnemySkillDebuff.query.filter_by(
                player_id=player_id,
                duration_type='player_attacks'
            ).filter(EnemySkillDebuff.duration_remaining > 0).all()
            
            for debuff in debuffs:
                debuff.duration_remaining -= 1
                updated = True
                if debuff.duration_remaining <= 0:
                    print(f"Debuff {debuff.effect_type} expirou")
        
        elif trigger_type == 'enemy_attack' and enemy_id:
            # Reduzir durações de buffs que dependem de ataques do inimigo
            buffs = EnemySkillBuff.query.filter_by(
                enemy_id=enemy_id,
                duration_type='enemy_attacks'
            ).filter(EnemySkillBuff.duration_remaining > 0).all()
            
            for buff in buffs:
                buff.duration_remaining -= 1
                updated = True
                if buff.duration_remaining <= 0:
                    print(f"Buff {buff.effect_type} expirou")
        
        if updated:
            db.session.commit()
            clean_expired_buffs_debuffs()
        
    except Exception as e:
        print(f"Erro ao atualizar durações de buff/debuff: {e}")

def process_all_enemy_attacks(player_id):
    """
    Processa TODOS os ataques pendentes do inimigo de uma vez.
    Usado quando jogador escolhe receber todos os ataques.
    """
    try:
        player = Player.query.get(player_id)
        enemy = GenericEnemy.query.filter_by(is_available=True).first()
        
        if not player or not enemy:
            return {'success': False, 'message': 'Jogador ou inimigo não encontrado'}
        
        # Atualizar cargas primeiro
        update_enemy_charges(enemy)
        
        if enemy.attack_charges_count <= 0:
            return {'success': False, 'message': 'Nenhuma carga de ataque disponível'}
        
        attacks_results = []
        
        # Executar todos os ataques
        while enemy.attack_charges_count > 0 and player.hp > 0:
            attack_result = execute_enemy_attack(player, enemy)
            attacks_results.append(attack_result)
            
            # Se jogador morreu, parar
            if attack_result['player_died']:
                break
        
        return {
            'success': True,
            'attacks_executed': len(attacks_results),
            'attacks_results': attacks_results,
            'player_final_hp': player.hp,
            'player_died': player.hp <= 0
        }
        
    except Exception as e:
        print(f"Erro ao processar ataques do inimigo: {e}")
        return {'success': False, 'message': str(e)}