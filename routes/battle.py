# routes/battle.py - Sistema de batalha e combate (versão modularizada)

# ===== IMPORTS PADRÃO =====
import math
import random
import json
from datetime import datetime, timedelta, timezone

# ===== IMPORTS FLASK =====
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify


# ===== IMPORTS DATABASE E MODELS =====
from database import db
from models import (
    Player, Boss, BestiaryEntry, PlayerTalent, PlayerRunBuff,
    EnemyTheme, GenericEnemy, PlayerProgress, LastBoss
)

# ===== IMPORTS CLASSES =====
from characters import (
    ActiveBuff, PlayerSkill, SpecialSkill,
    get_player_attacks, get_player_specials, use_special_skill,
    update_skill_charges, update_active_buffs,
    apply_time_based_effects, apply_daily_effects,
    use_attack_skill
)

# ===== IMPORTS ROUTES =====
from routes.cards import flash_gamification, get_exp_for_next_level
from routes.talents import initialize_player_talents_simple
from routes.relics import hooks as relic_hooks
from routes.battle_modules.battle_log import get_battle_log, clear_battle_log

# ===== IMPORTS GAME FORMULAS =====
from game_formulas import (
    calculate_strength_damage,
    calculate_resistance_block,
    calculate_critical_chance,
    calculate_critical_bonus,
    calculate_dodge_chance
)

# ===== IMPORTS DAMAGE SYSTEM =====
from damage_system import calculate_total_damage, get_damage_breakdown_text

# ===== IMPORTS ENEMY ATTACKS =====
from .enemy_attacks import get_enemy_attack_status

# ===== IMPORTS BATTLE MODULES =====
from .battle_modules import (
    generate_enemy_by_theme, ensure_minimum_enemies, get_minimum_enemy_count, initialize_enemy_themes,
    calculate_enemy_base_stats, calculate_rarity_chances, apply_rarity_modifiers,
    check_and_create_boss_milestone, clean_expired_enemies, calculate_equipment_rank,
    load_enemy_themes_config, update_theme_proportions,
    determine_enemy_reward_type, calculate_gold_reward, calculate_hourglass_reward,
    get_player_run_buffs, get_run_buff_total, add_run_buff,
    format_buff_display_value, format_memory_value_display,
    register_memory_routes, REWARD_SYSTEM, MEMORY_TYPES,
    apply_damage_to_player, add_boss_to_bestiary, check_login_rewards,
    update_rounds_for_all_enemies, initialize_game_for_new_player,
    format_buff_duration
)
from .battle_modules.battle_turns import get_next_actions
from .battle_modules.battle_utils import apply_buffs_to_stats

# ===== IMPORTS BATTLE CACHE =====
from .battle_cache import get_cached_attack, get_cached_defense, calculate_attack_cache

# ===== BLUEPRINT =====
battle_bp = Blueprint('battle', __name__, url_prefix='/gamification')

# Registrar rotas de memórias
register_memory_routes(battle_bp)

def get_current_battle_enemy(player_id):
    """
    Retorna o inimigo atual da batalha (LastBoss OU GenericEnemy).
    CENTRALIZA toda lógica de 'qual inimigo está na batalha'.
    """
    from models import PlayerProgress, LastBoss, GenericEnemy
    
    progress = PlayerProgress.query.filter_by(player_id=player_id).first()
    if not progress:
        return None
    
    # PRIORIDADE 1: Boss selecionado
    if progress.selected_boss_id:
        boss = LastBoss.query.get(progress.selected_boss_id)
        if boss and boss.is_active:
            return boss
        else:
            # Boss não está mais ativo, limpar seleção
            progress.selected_boss_id = None
            db.session.commit()
    
    # PRIORIDADE 2: Inimigo genérico selecionado  
    if progress.selected_enemy_id:
        enemy = GenericEnemy.query.get(progress.selected_enemy_id)
        if enemy and enemy.is_available:
            return enemy
        else:
            # Inimigo não está mais disponível, limpar seleção
            progress.selected_enemy_id = None
            db.session.commit()
    
    return None

@battle_bp.route("")
def gamification():
    """Main gamification hub page."""
    try:
        # Atualizar proporções dos temas
        update_theme_proportions()
        
        # Check if player exists, create if not
        player = Player.query.first()
        
        # NOVA VERIFICAÇÃO: Se não tem player ou não tem personagem escolhido
        if not player or not player.character_id:
            return redirect(url_for('choose_character_route'))
        
        # Verificar se existem bosses, se não, criar o primeiro
        boss_count = Boss.query.count()
        if boss_count == 0:
            # Criar o primeiro boss
            first_boss = Boss(
                name="Goblin da Confusão",
                hp=100,
                max_hp=100,
                description="Um pequeno goblin que causa confusão na mente dos estudiosos.",
                region=1,
                image='boss1.png'
            )
            db.session.add(first_boss)
            db.session.commit()
            
            # Atualizar o jogador para apontar para este boss
            player.current_boss_id = first_boss.id
            db.session.commit()
        
        # INSERIR AQUI: Inicializar temas de inimigos
        initialize_enemy_themes()

        # INSERIR AQUI: Verificar se o jogador tem progresso inicializado
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = initialize_game_for_new_player(player.id)
        
        # Obter o boss atual
        current_boss = db.session.get(Boss, player.current_boss_id)
        
        # Se ainda não houver boss, criar um padrão
        if not current_boss:
            current_boss = Boss(
                name="Goblin da Confusão",
                hp=100,
                max_hp=100,
                description="Um pequeno goblin que causa confusão na mente dos estudiosos.",
                region=1,
                image='boss1.png'
            )
            db.session.add(current_boss)
            db.session.commit()
            
            player.current_boss_id = current_boss.id
            db.session.commit()
        
        # Calculate time orb progress
        time_orb_minutes = (player.study_time_total % 1800) // 60
        time_orb_percent = (player.study_time_total % 1800) / 1800 * 100
        time_to_reward = 30 - time_orb_minutes
        
        # Calculate eras hourglass progress
        eras_total_hours = player.study_time_total // 3600
        next_milestone = 0
        if eras_total_hours < 20:
            next_milestone = 20
            eras_percent = (eras_total_hours / 20) * 100
        elif eras_total_hours < 50:
            next_milestone = 50
            eras_percent = ((eras_total_hours - 20) / 30) * 100
        elif eras_total_hours < 100:
            next_milestone = 100
            eras_percent = ((eras_total_hours - 50) / 50) * 100
        else:
            next_milestone = (eras_total_hours // 100 + 1) * 100
            eras_percent = ((eras_total_hours % 100) / 100) * 100
        
        return render_template('gamification/hub.html', 
                            player=player, 
                            boss=current_boss, 
                            get_exp_for_next_level=get_exp_for_next_level, 
                            time_orb_percent=time_orb_percent,
                            time_to_reward=time_to_reward,
                            eras_percent=eras_percent,
                            next_milestone=next_milestone,
                            eras_total_hours=eras_total_hours)
                            
    except Exception as e:
        # Em caso de erro, renderizar template de fallback com mensagem de erro
        print(f"Erro na inicialização da gamificação: {str(e)}")
        return render_template('gamification/hub_fallback.html', error=str(e))

@battle_bp.route('/battle')
def battle():
    """Rota da batalha - versão simplificada"""
    try:
        # Buscar jogador
        player = Player.query.first()
        if not player:
            flash('Jogador não encontrado.', 'error')
            return redirect(url_for('battle.gamification'))
        
        print(f"🎮 BATTLE: Player {player.id} acessando batalha")
        
        # Verificar personagem
        if not player.character_id:
            flash('Escolha um personagem primeiro!', 'warning')
            return redirect(url_for('choose_character_route'))
        
        # Buscar progresso (criar se não existir)
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(
                player_id=player.id,
                generic_enemies_defeated=0,
                current_boss_phase=1,
                selected_enemy_id=None
            )
            db.session.add(progress)
            db.session.commit()
        
        # Se não tem inimigo, criar um de teste
        if not progress.selected_enemy_id:
            available_enemy = GenericEnemy.query.filter_by(is_available=True).first()
            
            if not available_enemy:
                # Criar inimigo de teste
                available_enemy = GenericEnemy(
                    name="Goblin de Teste",
                    enemy_number=1,
                    rarity=1,
                    hp=100,
                    max_hp=100,
                    damage=15,
                    posture=50,
                    block_percentage=10,
                    theme_id=1,
                    rounds_remaining=3,
                    initial_rounds=3,
                    is_available=True,
                    is_new=False,
                    sprite_back=None,
                    sprite_body="body1.png",
                    sprite_head="head1.png", 
                    sprite_weapon="weapon1.png",
                    equipment_rank="D",
                    reward_type="crystals",
                    reward_icon="crystal.png"
                )
                db.session.add(available_enemy)
                db.session.commit()
            
            progress.selected_enemy_id = available_enemy.id

            # RESETAR CONTADOR DE TURNOS (primeira batalha)
            available_enemy.battle_turn_counter = 0

            db.session.commit()
        
        # Buscar inimigo atual (LastBoss OU GenericEnemy)
        current_enemy = get_current_battle_enemy(player.id)
        if not current_enemy:
            flash('Nenhum inimigo ou boss disponível!', 'error')
            return redirect(url_for('battle.gamification'))

        # Hooks de relíquias ao entrar na batalha
        relic_hooks.on_combat_start(player, current_enemy)
        
        # Carregar skills
        try:
            attack_skills = get_player_attacks(player.id) or []
            special_skills = get_player_specials(player.id) or []
        except:
            attack_skills = []
            special_skills = []
        
        # Renderizar template
        return render_template('gamification/battle.html',
            player=player,
            player_attack_skills=attack_skills[:4],
            player_special_skills=special_skills[:4],
            current_boss={
                'id': current_enemy.id,
                'name': current_enemy.name,
                'hp': current_enemy.hp,
                'max_hp': current_enemy.max_hp
            },
            player_hp=player.hp,
            player_max_hp=player.max_hp,
            session_points=session.get('session_revision_count', 0),
            boss_hp=current_enemy.hp,
            boss_max_hp=current_enemy.max_hp,
            player_strength=player.strength,
            player_damage_bonus=player.damage_bonus,
            player_luck=player.luck,
            player_crit_bonus=0.05,
            player_resistance=player.resistance,
            player_block_bonus=0,
            player_damage_multiplier=player.damage_multiplier,
            player_dodge_chance=0,
            player_class='Nenhuma',
            player_subclass='Nenhuma'
        )
        
    except Exception as e:
        print(f"❌ ERRO na batalha: {e}")
        flash(f'Erro: {str(e)}', 'error')
        return redirect(url_for('battle.gamification'))

@battle_bp.route('/generate_initial_enemies')
def generate_initial_enemies():
    """Gera inimigos iniciais para o jogador - APENAS PARA DESENVOLVIMENTO"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Limpar inimigos existentes
        GenericEnemy.query.delete()
        
        # Gerar 3 inimigos iniciais
        themes = EnemyTheme.query.all()
        if not themes:
            return jsonify({'success': False, 'message': 'Nenhum tema disponível'})
        
        enemies_created = []
        for i in range(3):
            theme = themes[i % len(themes)]
            new_enemy = generate_enemy_by_theme(theme.id, 1)
            if new_enemy:
                enemies_created.append(f"{new_enemy.name} (ID: {new_enemy.id})")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(enemies_created)} inimigos criados',
            'enemies': enemies_created
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/get_battle_data')
def get_battle_data():
    """API para obter dados de batalha do jogador e do boss atual."""
    try:
        # Obter o jogador
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Buscar progresso (criar se não existir)
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(
                player_id=player.id,
                generic_enemies_defeated=0,
                current_boss_phase=1,
                selected_enemy_id=None,
                selected_boss_id=None
            )
            db.session.add(progress)
            db.session.commit()

        # PRIORIDADE 1: Verificar se há boss selecionado
        current_enemy = None
        boss_data = None

        if progress.selected_boss_id:
            # Buscar boss selecionado
            from models import LastBoss
            current_boss = LastBoss.query.get(progress.selected_boss_id)
            
            if current_boss and current_boss.is_active:
                # Usar dados do boss
                boss_data = {
                    'id': current_boss.id,
                    'name': current_boss.name,
                    'hp': current_boss.current_hp,
                    'max_hp': current_boss.max_hp,
                    'description': f"Boss Especial - {current_boss.name}",
                    'sprite_idle': current_boss.sprite_idle,
                    'sprite_frames': current_boss.sprite_frames,
                    'sprite_size': current_boss.sprite_size,
                    'is_boss': True,
                    'boss_type': 'last_boss'
                }
                print(f"👑 Carregando boss: {current_boss.name}")
                print(f"👑 DEBUG BOSS DATA: {boss_data}")
            else:
                # Boss selecionado não está mais disponível
                progress.selected_boss_id = None
                db.session.commit()

        # PRIORIDADE 2: Se não há boss, buscar inimigo genérico
        if not boss_data and progress.selected_enemy_id:
            current_enemy = GenericEnemy.query.get(progress.selected_enemy_id)
            
            if current_enemy and current_enemy.is_available:
                # Usar dados do inimigo genérico (SEU CÓDIGO EXISTENTE)
                boss_data = {
                    'id': current_enemy.id,
                    'name': current_enemy.name,
                    'hp': current_enemy.hp,
                    'max_hp': current_enemy.max_hp,
                    'description': f"Inimigo do Tema {current_enemy.theme_id} - Nível {current_enemy.enemy_number}",
                    'sprite_layers': {
                        'back': current_enemy.sprite_back,
                        'body': current_enemy.sprite_body,
                        'head': current_enemy.sprite_head,
                        'weapon': current_enemy.sprite_weapon
                    },
                    'is_boss': False,
                    'boss_type': 'generic'
                }
                print(f"🎯 Carregando inimigo genérico: {current_enemy.name}")
            else:
                # Inimigo selecionado não está mais disponível
                progress.selected_enemy_id = None
                db.session.commit()

        # SISTEMA NOVO: ERRO se não houver nenhum inimigo
        if not boss_data:
            return jsonify({
                'success': False, 
                'message': 'Nenhum inimigo ou boss disponível. Gere inimigos primeiro!'
            })
        
        # Obter buffs ativos para calcular estatísticas temporárias
        active_buffs = ActiveBuff.query.filter_by(player_id=player.id).all()
        
        # Inicializar bônus de buffs
        crit_chance_buff = 0
        crit_damage_buff = 0
        dodge_buff = 0
        block_buff = 0
        damage_buff = 0
        luck_buff = 0
        
        # NOVO: Dicionário para agrupar buffs por skill de origem
        active_skills = {}
        
        # Processar buffs ativos
        for buff in active_buffs:
            if buff.is_expired():
                db.session.delete(buff)
                continue
                
            # Aplicar efeitos dos buffs aos atributos
            if buff.effect_type == 'crit_chance':
                crit_chance_buff += buff.effect_value
            elif buff.effect_type == 'crit_damage':
                crit_damage_buff += buff.effect_value
            elif buff.effect_type == 'dodge_bonus':
                dodge_buff += buff.effect_value
            elif buff.effect_type == 'block_bonus':
                block_buff += buff.effect_value
            elif buff.effect_type == 'damage':
                damage_buff += buff.effect_value
            elif buff.effect_type == 'luck_boost':
                luck_buff += buff.effect_value
            
            # NOVO: Agrupar por source_skill_id
            skill_id = buff.source_skill_id
            
            # Se ainda não temos esta skill no dicionário, adicioná-la
            if skill_id not in active_skills:
                # Buscar informações da skill original
                skill = SpecialSkill.query.get(skill_id)
                
                if skill:
                    # Se encontrou a skill original
                    active_skills[skill_id] = {
                        'id': skill_id,
                        'name': skill.name,
                        'icon': skill.icon,
                        'duration': format_buff_duration(buff),
                        'effects': []
                    }
                else:
                    # Fallback se não encontrar a skill original
                    active_skills[skill_id] = {
                        'id': skill_id,
                        'name': 'Skill ' + str(skill_id),
                        'icon': buff.icon,
                        'duration': format_buff_duration(buff),
                        'effects': []
                    }
            
            # Formatar o valor do efeito
            effect_value = ""
            if buff.effect_type in ['crit_chance', 'crit_damage', 'dodge_bonus', 'block_bonus', 'damage', 'lifesteal', 'damage_reduction']:
                effect_value = f"+{buff.effect_value*100:.0f}%"
            elif buff.effect_type == 'ignore_defense':
                effect_value = "Ativo"
            else:
                effect_value = f"+{buff.effect_value}"
            
            # Mapear o tipo de efeito para um nome legível
            effect_name = {
                'crit_chance': 'Chance Crítico',
                'crit_damage': 'Dano Crítico',
                'dodge_bonus': 'Esquiva',
                'block_bonus': 'Bloqueio',
                'damage': 'Dano',
                'lifesteal': 'Roubo de Vida',
                'damage_reduction': 'Redução de Dano Recebido',
                'ignore_defense': 'Penetração de Defesa',
                'luck_boost': 'Sorte'
            }.get(buff.effect_type, buff.effect_type)
            
            # Adicionar este efeito à skill correspondente
            active_skills[skill_id]['effects'].append({
                'type': effect_name,
                'value': effect_value
            })
        
        # Converter o dicionário de skills para uma lista
        active_skills_list = list(active_skills.values())
        
        # ===== CALCULAR CACHE AO ENTRAR NA BATALHA =====
        from .battle_cache import calculate_attack_cache, get_cached_defense
        
        # Recalcular cache (sempre que entrar na batalha)
        calculate_attack_cache(player.id)
        
        # Buscar cache de defesa
        defense_cache = get_cached_defense(player.id)
        
        if defense_cache:
            # Atualizar HP/MP máximos do player baseado no cache
            player.max_hp = defense_cache.max_hp
            
            # Garantir que HP/MP atuais não excedam os máximos
            if player.hp > player.max_hp:
                player.hp = player.max_hp
            
            db.session.commit()
            
            print(f"Cache aplicado: HP={player.max_hp}")

        # Calcular atributos derivados com bônus de buffs
        adjusted_luck = player.luck + luck_buff
        
        strength_damage = calculate_strength_damage(player.strength)
        critical_chance = calculate_critical_chance(
            adjusted_luck,
            getattr(player, 'critical_chance_item_bonus', 0), 
            getattr(player, 'critical_chance_bonus', 0)
        ) + crit_chance_buff
        
        critical_bonus = calculate_critical_bonus(
            adjusted_luck,
            getattr(player, 'critical_damage_item_bonus', 0),
            getattr(player, 'critical_damage_bonus', 0)
        ) + crit_damage_buff
        
        block = calculate_resistance_block(
            player.resistance,
            getattr(player, 'block_bonus', 0) + block_buff
        )
        
        dodge_chance = calculate_dodge_chance(
            adjusted_luck,
            getattr(player, 'dodge_item_bonus', 0),
            getattr(player, 'dodge_talent_bonus', 0)
        ) + dodge_buff
        
        # Obter talentos desbloqueados 
        player_talents = PlayerTalent.query.filter_by(player_id=player.id).all()
        talent_ids = [pt.talent_id for pt in player_talents]
        
        # Obter informações de todos os equipamentos
        equipment_data = {
            'helmet': getattr(player, 'current_helmet', None),
            'eyes': getattr(player, 'current_eyes', None),
            'armor': getattr(player, 'current_armor', None),
            'sword': getattr(player, 'current_sword', None),
            'soulgem': getattr(player, 'current_soulgem', None),
            'hair': getattr(player, 'current_hair', None)
        }
        
        # Converter equipamentos para formato serializado
        equipment_info = {}
        for slot, equip in equipment_data.items():
            if equip:
                equipment_info[slot] = {
                    'id': equip.id,
                    'name': equip.name,
                    'defense_bonus': getattr(equip, 'defense_bonus', 0),
                    'damage_bonus': getattr(equip, 'damage_bonus', 0)
                }
            else:
                equipment_info[slot] = None
        
        # Preparar dados para retornar
        player_data = {
            'hp': player.hp,
            'max_hp': player.max_hp,
            'barrier': player.barrier or 0,
            'energy': player.energy,
            'max_energy': player.max_energy,
            'level': player.level,
            'experience': player.experience,
            'next_level_exp': get_exp_for_next_level(player.level),
            'strength': player.strength,
            'vitality': player.vitality,
            'resistance': player.resistance,
            'luck': player.luck,
            'damage_bonus': player.damage_bonus + damage_buff,
            'damage_multiplier': player.damage_multiplier,
            'critical_chance': critical_chance,
            'critical_bonus': critical_bonus,
            'block': block,
            'dodge_chance': dodge_chance,
            'character_id': player.character_id,
            'equipment': equipment_info,
            'talents': talent_ids,
            'strength_damage': strength_damage,
            'total_damage': strength_damage * (1 + player.damage_bonus + damage_buff),
            'active_skills': active_skills_list,
            'has_cache': defense_cache is not None,
            'cached_block': defense_cache.base_block_percent * 100 if defense_cache else 0,
            'cached_dodge': defense_cache.base_dodge_chance * 100 if defense_cache else 0
        }
                
        # Obter pontos de revisão (damage) da sessão
        revision_points = session.get('session_revision_count', 0)
        
        # Obter status de ataques do inimigo
        from .enemy_attacks import get_enemy_attack_status
        enemy_attack_status = get_enemy_attack_status(player.id)

        # ===== CALCULAR CACHE AO ENTRAR NA BATALHA =====
        from .battle_cache import calculate_attack_cache, get_cached_defense
        
        # Recalcular cache (sempre que entrar na batalha)
        calculate_attack_cache(player.id)
        
        # Buscar cache de defesa para incluir na resposta
        defense_cache = get_cached_defense(player.id)
        
        if defense_cache:
            # Atualizar HP/MP máximos do player baseado no cache
            player.max_hp = defense_cache.max_hp
            
            # Garantir que HP/MP atuais não excedam os máximos
            if player.hp > player.max_hp:
                player.hp = player.max_hp
            
            db.session.commit()
            
            print(f"🎯 Cache aplicado: HP={player.max_hp}")

        return jsonify({
            'success': True,
            'player': player_data,
            'boss': boss_data,
            'revision_points': revision_points,
            'enemy_attack_status': enemy_attack_status,
        })
    except Exception as e:
        print(f"Erro ao obter dados de batalha: {str(e)}")
        return jsonify({'success': False, 'message': f'Erro ao processar requisição: {str(e)}'})

@battle_bp.route('/dev_check_vlad_skills')
def dev_check_vlad_skills():
    """DEV: Verificar e criar skills do Vlad"""
    try:
        from characters import AttackSkill, SpecialSkill
        from characters import init_vlad_skills
        
        attack_count = AttackSkill.query.count()
        special_count = SpecialSkill.query.count()
        
        result = {
            'attack_skills_count': attack_count,
            'special_skills_count': special_count,
            'vlad_skills_created': False
        }
        
        # Se não há skills, criar
        if attack_count == 0:
            success = init_vlad_skills()
            result['vlad_skills_created'] = success
            result['message'] = 'Skills criadas!' if success else 'Erro ao criar skills'
        else:
            result['message'] = 'Skills já existem'
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

@battle_bp.route('/dev_force_vlad_skills')
def dev_force_vlad_skills():
    """DEV: FORÇAR criação das skills do Vlad"""
    try:
        from characters import init_vlad_skills, VLAD_ATTACK_SKILLS_DATA, VLAD_SPECIAL_SKILLS_DATA
        from characters import AttackSkill, SpecialSkill
        
        # FORÇAR LIMPEZA E RECRIAÇÃO
        print("🗑️ Limpando skills antigas...")
        AttackSkill.query.delete()
        SpecialSkill.query.delete()
        db.session.commit()
        
        print("🔄 Criando skills do Vlad...")
        
        # Criar skills de ataque diretamente
        for skill_data in VLAD_ATTACK_SKILLS_DATA:
            skill = AttackSkill(**skill_data)
            db.session.add(skill)
            print(f"  ✅ Attack: {skill_data['name']}")
        
        # Criar skills especiais diretamente  
        for skill_data in VLAD_SPECIAL_SKILLS_DATA:
            skill = SpecialSkill(**skill_data)
            db.session.add(skill)
            print(f"  ✅ Special: {skill_data['name']}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Skills do Vlad criadas com força bruta!',
            'attack_skills': len(VLAD_ATTACK_SKILLS_DATA),
            'special_skills': len(VLAD_SPECIAL_SKILLS_DATA)
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        })

@battle_bp.route('/damage_boss', methods=['POST'])
def damage_boss():
    """
    Processa o dano ao boss atual usando sistema de cache.
    Dano fixo por skill + bônus permanentes (do cache) + buffs temporários (runtime).
    """
    # Obter dados do request
    data = request.get_json()
    skill_id = data.get('skill_id', 0)

    # Obter jogador
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado.'})
    
    # Import necessário para relíquias
    from models import PlayerRelic
    
    # ===== 1. BUSCAR CACHE DA SKILL =====
    from .battle_cache import get_cached_attack, calculate_attack_cache
    
    cache = get_cached_attack(player.id, skill_id)
    
    if not cache:
        # Cache não existe - recalcular
        print("⚠️  Cache não encontrado, recalculando...")
        calculate_attack_cache(player.id)
        cache = get_cached_attack(player.id, skill_id)
        
        if not cache:
            return jsonify({
                'success': False, 
                'message': 'Erro ao calcular cache de ataque. Tente novamente.'
            })
    
    print(f"\n🎯 USANDO CACHE: {cache.skill_name}")
    print(f"   Dano Base: {cache.base_damage}")
    print(f"   Custos: {cache.energy_cost} ENERGIA")
    print(f"   Crítico: {cache.base_crit_chance*100:.1f}% chance, {cache.base_crit_multiplier:.2f}x")
    
    # ===== HOOKS DE RELÍQUIAS - BEFORE ATTACK =====
    attack_data = {
        'base_damage': cache.base_damage,
        'damage_multiplier': 1.0,
        'lifesteal_bonus': 0.0,
        'force_critical': False,
        'skill_type': cache.skill_type
    }
    
    skill_data = {'type': cache.skill_type, 'name': cache.skill_name}
    attack_data = relic_hooks.before_attack(player, skill_data, attack_data)
    
    print(f"📊 APÓS RELÍQUIAS: multiplicador={attack_data['damage_multiplier']:.2f}, vampirismo extra={attack_data['lifesteal_bonus']*100:.1f}%")
    
    # ===== 2. VERIFICAR E CONSUMIR RECURSOS =====
    session_points = session.get('session_revision_count', 0)
        
    # Verificar energia
    if cache.energy_cost > player.energy:
        return jsonify({
            'success': False,
            'message': f'Energia insuficiente! Você precisa de {cache.energy_cost} energia, mas tem apenas {player.energy}.'
        })

    # Consumir recursos
    player.energy -= cache.energy_cost
    
    print(f"💰 Recursos consumidos: -{cache.energy_cost} ENERGIA")
    print(f"⚡ Energia restante: {player.energy}/{player.max_energy}")
    
    # ===== 3. BUSCAR TARGET (BOSS OU INIMIGO) =====
    progress = PlayerProgress.query.filter_by(player_id=player.id).first()
    current_enemy = None
    current_boss = None
    is_boss_fight = False

    # PRIORIDADE 1: Verificar se há boss selecionado
    if progress and progress.selected_boss_id:
        from models import LastBoss
        current_boss = LastBoss.query.get(progress.selected_boss_id)
        if current_boss and current_boss.is_active:
            is_boss_fight = True
            print(f"👑 Atacando boss: {current_boss.name}")
        else:
            progress.selected_boss_id = None
            db.session.commit()

    # PRIORIDADE 2: Se não há boss, buscar inimigo genérico
    if not is_boss_fight and progress and progress.selected_enemy_id:
        current_enemy = GenericEnemy.query.get(progress.selected_enemy_id)
        if not current_enemy or not current_enemy.is_available:
            return jsonify({'success': False, 'message': 'Nenhum inimigo selecionado.'})

    if not is_boss_fight and not current_enemy:
        return jsonify({'success': False, 'message': 'Nenhum inimigo ou boss selecionado.'})

    target = current_boss if is_boss_fight else current_enemy
    
    # ===== 4. COMEÇAR COM VALORES MODIFICADOS POR RELÍQUIAS =====
    final_damage = attack_data['base_damage']
    final_crit_chance = cache.base_crit_chance
    final_crit_multiplier = cache.base_crit_multiplier
    lifesteal_percent = cache.lifesteal_percent + attack_data.get('lifesteal_bonus', 0.0)  # ← ADICIONAR BÔNUS DAS RELÍQUIAS

    if attack_data.get('lifesteal_bonus', 0.0) > 0:
        print(f"⚔️ Vampirismo das relíquias: +{attack_data['lifesteal_bonus']*100:.1f}% (total: {lifesteal_percent*100:.1f}%)")

    if attack_data['base_damage'] != cache.base_damage:
        print(f"📊 DANO MODIFICADO POR RELÍQUIAS FLAT: {cache.base_damage} → {attack_data['base_damage']}")

    print(f"\n📊 DANO INICIAL (após relíquias flat): {final_damage}")

    # 4.1. APLICAR MULTIPLICADOR DE RELÍQUIAS
    damage_multiplier = attack_data.get('damage_multiplier', 1.0)
    if damage_multiplier != 1.0:
        damage_before_mult = final_damage  # 👈 SALVAR VALOR ANTES
        final_damage = int(final_damage * damage_multiplier)
        print(f"📊 DANO COM MULTIPLICADOR DE RELÍQUIAS: {damage_before_mult} x {damage_multiplier:.2f} = {final_damage}")

    # ===== 4.5. APLICAR BÔNUS DE BATALHA (ID 50) =====
    # Relíquia "Ataque Básico em Batalha" acumula durante a batalha mas reseta depois
    if cache.skill_type == 'attack':
        battle_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='50',
            is_active=True
        ).first()
        
        if battle_relic:
            state = json.loads(battle_relic.state_data or '{}')
            battle_stacks = state.get('battle_stacks', 0)
            if battle_stacks > 0:
                # Buscar stack_bonus da definição da relíquia
                from routes.relics.registry import get_relic_definition
                relic_def = get_relic_definition('50')
                stack_bonus = relic_def['effect'].get('stack_bonus', 2)

                bonus_damage = battle_stacks * stack_bonus
                attack_data['base_damage'] += bonus_damage
                final_damage = attack_data['base_damage']  # Sincronizar (não adicionar novamente)
                print(f"⚔️ Bônus de batalha (ID 50): +{bonus_damage} ({battle_stacks} stacks × {stack_bonus}) (reseta após combate)")

    # ===== 5. APLICAR BUFFS TEMPORÁRIOS (ActiveBuff) =====
    active_buffs = ActiveBuff.query.filter_by(player_id=player.id).all()
    
    buffs_damage_multiplier = 1.0
    buffs_crit_chance_bonus = 0.0
    buffs_crit_damage_bonus = 0.0
    buffs_lifesteal_bonus = 0.0
    special_effects = []

    # Definir stats ofensivos
    offensive_stats = {
        'damage': 0,
        'crit_chance': 0,
        'crit_damage': 0,
        'lifesteal': 0,
        'ignore_defense': 0
    }

    # Aplicar buffs
    offensive_stats = apply_buffs_to_stats(active_buffs, offensive_stats)

    # Usar valores
    buffs_damage_multiplier = 1.0 + offensive_stats['damage']
    buffs_crit_chance_bonus = offensive_stats['crit_chance']
    buffs_crit_damage_bonus = offensive_stats['crit_damage']
    buffs_lifesteal_bonus = offensive_stats['lifesteal']

    # Checar ignore_defense separadamente (comportamento especial)
    if offensive_stats['ignore_defense'] > 0:
        special_effects.append("Ignora Defesa")
        
        # Se o buff for por número de ataques, reduzir contador
        if buff.duration_type == "attacks":
            buff.attacks_remaining -= 1
            if buff.attacks_remaining <= 0:
                db.session.delete(buff)
    
    # Aplicar multiplicadores de buffs
    if buffs_damage_multiplier != 1.0:
        final_damage = int(final_damage * buffs_damage_multiplier)
        print(f"📊 DANO APÓS BUFFS: {final_damage}")
    
    final_crit_chance += buffs_crit_chance_bonus
    final_crit_multiplier += buffs_crit_damage_bonus
    lifesteal_percent += buffs_lifesteal_bonus
    
    # ===== 6. APLICAR DEBUFFS DO INIMIGO (EnemySkillDebuff) =====
    try:
        from models import EnemySkillDebuff
        from .enemy_attacks import update_buff_debuff_durations
        
        enemy_debuffs = EnemySkillDebuff.query.filter_by(player_id=player.id).filter(
            EnemySkillDebuff.duration_remaining > 0
        ).all()
        
        debuff_damage_multiplier = 1.0
        debuff_crit_chance_reduction = 0.0
        
        for debuff in enemy_debuffs:
            if debuff.effect_type == 'decrease_damage':
                debuff_damage_multiplier *= (1 - debuff.effect_value)
                print(f"   ⚠️ Debuff reduzindo dano em {debuff.effect_value*100:.1f}%")
            
            elif debuff.effect_type == 'decrease_crit':
                debuff_crit_chance_reduction += debuff.effect_value
                print(f"   ⚠️ Debuff reduzindo crítico em {debuff.effect_value*100:.1f}%")
        
        # Aplicar redução de dano
        if debuff_damage_multiplier < 1.0:
            final_damage = int(final_damage * debuff_damage_multiplier)
            print(f"📊 DANO APÓS DEBUFFS: {final_damage}")
        
        # Aplicar redução de crítico
        final_crit_chance -= debuff_crit_chance_reduction
        final_crit_chance = max(0.0, final_crit_chance)  # Não pode ser negativo
        
        # Atualizar durações de debuffs
        update_buff_debuff_durations('player_attack', player_id=player.id)
        
    except Exception as e:
        print(f"❌ Erro ao aplicar debuffs: {e}")

    # ===== 6.5. APLICAR BÔNUS TEMPORÁRIOS DE RELÍQUIAS =====
    
    # ID 17 - Momentum Plagosus: +20% crit se último ataque foi crítico
    momentum_relic = PlayerRelic.query.filter_by(
        player_id=player.id,
        relic_id='17',
        is_active=True
    ).first()
    
    if momentum_relic:
        state = json.loads(momentum_relic.state_data or '{}')
        momentum_bonus = state.get('bonus_crit_next', 0.0)
        if momentum_bonus > 0:
            final_crit_chance += momentum_bonus
            # Limpar o bônus após usar
            state['bonus_crit_next'] = 0.0
            momentum_relic.state_data = json.dumps(state)
            print(f"⚡ MOMENTUM PLAGOSUS: +{momentum_bonus*100:.0f}% crit aplicado (era {(final_crit_chance-momentum_bonus)*100:.1f}% → agora {final_crit_chance*100:.1f}%)")
    
    # ===== 7. ROLL DE CRÍTICO =====
    is_critical = attack_data.get('force_critical', False) or (random.random() < final_crit_chance)
    
    if is_critical:
        final_damage = int(final_damage * final_crit_multiplier)
        print(f"💥 CRÍTICO! {final_crit_multiplier:.2f}x → Dano final: {final_damage}")
    else:
        print(f"📊 DANO FINAL (sem crítico): {final_damage}")
    
    # ===== 8. APLICAR DANO AO TARGET =====
    damage_before = target.current_hp if is_boss_fight else target.hp
    actual_damage_applied = min(final_damage, damage_before)

    if is_boss_fight:
        target.current_hp -= actual_damage_applied
        target_hp_after = target.current_hp
    else:
        target.hp -= actual_damage_applied
        target_hp_after = target.hp

    print(f"🎯 DANO APLICADO: {actual_damage_applied}")
    print(f"   HP antes: {damage_before} → HP após: {target_hp_after}")

    # ===== 8.5. VERIFICAR DOUBLE FIRST ATTACK (ID 15) =====
    if not player.first_attack_done:
        double_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='15',
            is_active=True
        ).first()
        
        if double_relic:
            # Aplicar dano novamente (não precisa de flag, só verificar first_attack_done)
            second_damage = min(final_damage, target_hp_after)
            
            if is_boss_fight:
                target.current_hp -= second_damage
                target_hp_after = target.current_hp
            else:
                target.hp -= second_damage
                target_hp_after = target.hp
            
            actual_damage_applied += second_damage
            
            print(f"⚔️ Lança de Longino aplicou dano 2x! Dano adicional: {second_damage}")

    # ===== ADICIONAR AQUI - HOOK APÓS ATAQUE =====
    relic_hooks.after_attack(player, {
        'damage': actual_damage_applied,
        'is_critical': is_critical,
        'skill_type': cache.skill_type
    })
    
    # ===== 9. VAMPIRISMO (% do dano FINAL) =====
    heal_amount = 0
    if lifesteal_percent > 0:
        heal_amount = int(actual_damage_applied * lifesteal_percent)
        player.hp = min(player.hp + heal_amount, player.max_hp)
        special_effects.append(f"Roubo de Vida: +{heal_amount} HP")
        print(f"🩸 Vampirismo: +{heal_amount} HP")

    # ===== 9.5. LÓGICA DE BARREIRA (CONCESSÃO) =====
    barrier_percent = 0.0
    barrier_bonus = 0

    # Verifica se o cache tem os atributos antes de acessá-los
    if hasattr(cache, 'effect_type') and cache.effect_type == 'barrier':
        barrier_percent = cache.effect_value or 0.0

        # Correção: Garantir que barrier_bonus seja 0 se for None (caso a migração do DB tenha falhado)
        bonus_from_cache = getattr(cache, 'effect_bonus', 0)
        barrier_bonus = bonus_from_cache if bonus_from_cache is not None else 0

    barrier_gained = 0
    if barrier_percent > 0 or barrier_bonus > 0:
        # Calcular ganho: (dano * %) + bônus, arredondado para CIMA
        barrier_gained = math.ceil((actual_damage_applied * barrier_percent) + barrier_bonus)

        # A Barreira é CUMULATIVA (soma ao valor existente)
        player.barrier = (player.barrier or 0) + barrier_gained
        special_effects.append(f"Barreira: +{barrier_gained}")
        print(f"🛡️ Barreira Ganha: +{barrier_gained} (Total: {player.barrier})")
    # =========================================
    
    # Aplicar cura baseada no dano (talento adicional)
    if hasattr(player, 'heal_on_damage_percent') and player.heal_on_damage_percent > 0:
        talent_heal = int(actual_damage_applied * player.heal_on_damage_percent)
        if talent_heal > 0:
            player.hp = min(player.hp + talent_heal, player.max_hp)
            special_effects.append(f"Cura por Dano: +{talent_heal} HP")
    
    # ===== 10. REGISTRAR DANO MÁXIMO =====
    if actual_damage_applied > player.damage_max_recorded:
        player.damage_max_recorded = actual_damage_applied
    
    # ===== 11. VERIFICAR SE TARGET FOI DERROTADO =====
    target_defeated = target_hp_after <= 0
    
    # Inicializar variáveis de recompensa
    exp_reward = 0
    crystals_gained = 0
    gold_gained = 0
    hourglasses_gained = 0
    victory_heal_amount = 0
    reward_type = None
    
    if target_defeated:
        relic_bonus_messages = []
        if is_boss_fight:
            target.current_hp = 0
        else:
            target.hp = 0
        
        target_name = target.name
        print(f"\n{'='*60}")
        print(f"🎉 {'BOSS' if is_boss_fight else 'INIMIGO'} DERROTADO: {target_name}")
        
        # ===== ADICIONAR AQUI - HOOK AO MATAR =====
        relic_hooks.on_kill(player, {
            'enemy_name': target_name,
            'enemy_rarity': getattr(target, 'rarity', 1) if not is_boss_fight else 5
        })
        
        # Verificar se tomou dano
        took_damage = session.get('player_took_damage', False)
        
        # ===== CALCULAR RECOMPENSAS =====
        if is_boss_fight:
            # Recompensas de boss
            base_exp = target.reward_crystals // 4
            final_exp = base_exp
            
            if hasattr(player, 'exp_boost') and player.exp_boost > 0:
                exp_boost_bonus = int(base_exp * player.exp_boost)
                final_exp += exp_boost_bonus
            
            if not took_damage and hasattr(player, 'perfect_exp_bonus') and player.perfect_exp_bonus > 0:
                perfect_bonus = int(final_exp * (player.perfect_exp_bonus / 100))
                final_exp += perfect_bonus
            
            exp_reward = final_exp
            crystals_gained = target.reward_crystals
            reward_type = 'crystals'

            # ===== APLICAR MODIFICADORES DE RELÍQUIAS EM BOSSES TAMBÉM =====
            original_rewards = {
                'crystals': crystals_gained,
                'gold': 0,
                'hourglasses': 0
            }

            rewards = {
                'crystals': crystals_gained,
                'gold': 0,
                'hourglasses': 0
            }

            # ===== NÃO APLICAR AQUI - SÓ EM apply_victory_rewards =====
            # rewards = relic_hooks.on_rewards(player, rewards)

            # Atualizar valores modificados
            crystals_gained = rewards['crystals']

            print(f"🎁 RECOMPENSAS APÓS RELÍQUIAS (BOSS): {rewards}")

            # ===== GERAR MENSAGENS DE BÔNUS (BOSS) =====
            if rewards['crystals'] > original_rewards['crystals']:
                bonus = rewards['crystals'] - original_rewards['crystals']
                relic_bonus_messages.append(f"💎 Relíquias: +{bonus} cristais bônus")
            
            # Marcar boss como derrotado
            target.is_active = False
            progress.selected_boss_id = None
            player.run_bosses_defeated += 1
            
            # Gerar recompensa de relíquia após boss
            boss_number = player.run_bosses_defeated
            base_relic_count = min(boss_number, 5)  # Base: 1-5 relíquias
            
            # Verificar ID 48: +1 relíquia de boss
            bonus_boss_relic = PlayerRelic.query.filter_by(
                player_id=player.id,
                relic_id='48',
                is_active=True
            ).first()
            
            if bonus_boss_relic:
                base_relic_count += 1
                print(f"⚜️ Relicário de Helena: +1 relíquia de boss")
            
            session['pending_relic_selection'] = {
                'count': base_relic_count,
                'context': 'last_boss',
                'boss_number': boss_number,
                'timestamp': datetime.utcnow().isoformat()
            }
            print(f"👑 Boss #{boss_number} derrotado! {base_relic_count} relíquia(s) para escolher")

        else:
            # Recompensas de inimigo genérico (seu código existente)
            base_exp = random.randint(30 + (current_enemy.enemy_number * 10), 50 + (current_enemy.enemy_number * 20))
            rarity_multipliers = {1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0}
            rarity_multiplier = rarity_multipliers.get(current_enemy.rarity, 1.0)
            
            equipment_bonus_percent = current_enemy.reward_bonus_percentage or 0
            
            final_exp = int(base_exp * rarity_multiplier * (1 + equipment_bonus_percent / 100))
            
            if hasattr(player, 'exp_boost') and player.exp_boost > 0:
                final_exp += int(final_exp * player.exp_boost)
            
            if not took_damage and hasattr(player, 'perfect_exp_bonus') and player.perfect_exp_bonus > 0:
                final_exp += int(final_exp * (player.perfect_exp_bonus / 100))
            
            exp_reward = final_exp
            
            # Calcular recompensa específica
            reward_type = current_enemy.reward_type or 'crystals'
            
            if reward_type == 'crystals':
                base_crystals = random.randint(30 + (current_enemy.enemy_number * 5), 50 + (current_enemy.enemy_number * 8))
                crystals_gained = int(base_crystals * rarity_multiplier * (1 + equipment_bonus_percent / 100))
                
                if hasattr(player, 'crystal_double_chance') and player.crystal_double_chance > 0:
                    if random.random() < player.crystal_double_chance:
                        crystals_gained *= 2
            
            elif reward_type == 'gold':
                # Função já existente
                gold_gained = calculate_gold_reward(current_enemy.enemy_number, current_enemy.rarity, equipment_bonus_percent)
            
            elif reward_type == 'hourglasses':
                # Função já existente
                hourglasses_gained = calculate_hourglass_reward(current_enemy.rarity)
            
            # Marcar inimigo como derrotado
            current_enemy.is_available = False
            progress.selected_enemy_id = None

            # ===== MODIFICAR COM RELÍQUIAS =====
            original_rewards = {
                'crystals': crystals_gained,
                'gold': gold_gained,
                'hourglasses': hourglasses_gained
            }

            rewards = {
                'crystals': crystals_gained,
                'gold': gold_gained,
                'hourglasses': hourglasses_gained
            }

            # ===== SALVAR VALORES BASE =====
            original_rewards = rewards.copy()

            # Aplicar modificadores de relíquias
            rewards = relic_hooks.on_rewards(player, rewards)

            # Atualizar valores modificados
            crystals_gained = rewards['crystals']
            gold_gained = rewards['gold']
            hourglasses_gained = rewards['hourglasses']

            print(f"🎁 RECOMPENSAS APÓS RELÍQUIAS: {rewards}")

            # ===== GERAR MENSAGENS DE BÔNUS =====
            if rewards['gold'] > original_rewards['gold']:
                bonus = rewards['gold'] - original_rewards['gold']
                relic_bonus_messages.append(f"💰 +{bonus} Ouro")
            
            if rewards['crystals'] > original_rewards['crystals']:
                bonus = rewards['crystals'] - original_rewards['crystals']
                plural = "Cristais de Memória" if bonus != 1 else "Cristal de Memória"
                relic_bonus_messages.append(f"💎 +{bonus} {plural}")
            
            if rewards['hourglasses'] > original_rewards['hourglasses']:
                bonus = rewards['hourglasses'] - original_rewards['hourglasses']
                plural = "Ampulhetas Eternas" if bonus != 1 else "Ampulheta Eterna"
                relic_bonus_messages.append(f"⏳ +{bonus} {plural}")

        # ===== INCLUIR OURO DE RELÍQUIAS on_kill NO POPUP =====
        extra_gold_from_relics = 0
        
        # ID 33 - Olho de Midas (sempre dá ouro)
        midas_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='33',
            is_active=True
        ).first()
        if midas_relic:
            from routes.relics.registry import get_relic_definition
            definition = get_relic_definition('33')
            extra_gold_from_relics += definition['effect']['value']
        
        # ID 34 - Coroa do Rei Sol (se usou Suprema)
        skills_used = json.loads(player.skills_used_this_battle)
        if skills_used.get('ultimate', 0) > 0:
            rei_sol_relic = PlayerRelic.query.filter_by(
                player_id=player.id,
                relic_id='34',
                is_active=True
            ).first()
            if rei_sol_relic:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition('34')
                extra_gold_from_relics += definition['effect']['value']

        # ===== SALVAR RECOMPENSAS PENDENTES =====
        from models import PendingReward
        pending_reward = PendingReward(
            player_id=player.id,
            exp_reward=exp_reward,
            crystals_gained=crystals_gained,
            gold_gained=gold_gained + extra_gold_from_relics,
            hourglasses_gained=hourglasses_gained,
            reward_type=reward_type,
            reward_icon='...',
            victory_heal_amount=victory_heal_amount,
            enemy_name=target_name,
            damage_dealt=actual_damage_applied,
            damage_taken=0 if not took_damage else 1,
            relic_bonus_messages='\n'.join(relic_bonus_messages)  # ← ADICIONAR
        )
        db.session.add(pending_reward)
        
        # Se for recompensa de memória
        if not is_boss_fight and reward_type == 'memories':
            # ===== GERAR OPÇÕES DE LEMBRANÇAS AGORA =====
            from .battle_modules.reward_system import select_random_memory_options  # ✅ CORRETO
            
            memory_options = select_random_memory_options()
            print(f"🎲 Opções de lembranças GERADAS na vitória: {memory_options}")
            
            session['pending_memory_reward'] = {
                'enemy_rarity': current_enemy.rarity,
                'timestamp': datetime.utcnow().isoformat(),
                'memory_options': memory_options  # ← SALVAR AS OPÇÕES
            }
        
        # Resetar flags de batalha
        session['battle_started'] = False
        session['player_took_damage'] = False

        # ===== APLICAR EFEITOS DE VITÓRIA =====
        relic_hooks.on_victory(player)  # ← ADICIONAR ESTA LINHA

        # ===== RESETAR CONTADORES =====
        relic_hooks.reset_battle_counters(player)
        print("🔄 Contadores de batalha resetados")
        
        # Mensagem de sucesso
        if is_boss_fight:
            flash_message = f"Boss derrotado! Você ganhou {exp_reward} XP e {crystals_gained} Cristais!"
        else:
            flash_message = f"Inimigo derrotado! Você ganhou {exp_reward} XP"
            if crystals_gained > 0:
                flash_message += f" e {crystals_gained} Cristais!"
            elif gold_gained > 0:
                flash_message += f" e {gold_gained} Ouro!"
            elif hourglasses_gained > 0:
                flash_message += f" e {hourglasses_gained} Ampulhetas!"
        
        flash(flash_message, "battle.gamification")
    
    # ===== 12. SALVAR ALTERAÇÕES =====
    try:
        db.session.commit()
        print("💾 Alterações salvas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao salvar: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao salvar: {e}'})
    
    # ===== 13. RETORNAR RESULTADO =====
    return jsonify({
        'success': True,
        'damage': actual_damage_applied,
        'is_critical': is_critical,
        'boss_hp': target_hp_after,
        'boss_max_hp': target.max_hp,
        'boss_defeated': target_defeated,
        'player_hp': player.hp,
        'player_max_hp': player.max_hp,
        'player_energy': player.energy,
        'player_max_energy': player.max_energy,
        'player_barrier': player.barrier,
        'attack_type': cache.skill_type,
        'extra_messages': special_effects,
        'reward_type': reward_type if target_defeated else None,
        'reward_icon': (current_enemy.reward_icon if current_enemy else 'crystal.png') if target_defeated else None,
        'enemy_name': target.name if target_defeated else None,
        'damage_dealt': actual_damage_applied if target_defeated else 0,
        'crystals_gained': crystals_gained if target_defeated else 0,
        'crystals_base': original_rewards.get('crystals', 0) if target_defeated else 0,
        'gold_gained': gold_gained if target_defeated else 0,
        'gold_base': original_rewards.get('gold', 0) if target_defeated else 0,
        'hourglasses_gained': hourglasses_gained if target_defeated else 0,
        'hourglasses_base': original_rewards.get('hourglasses', 0) if target_defeated else 0,
        'heal_amount': heal_amount,
        'relic_bonus_messages': '\n'.join(relic_bonus_messages) if target_defeated else '',
        'should_refresh_skills': True
    })

@battle_bp.route('/get_player_specials_api')
def get_player_specials_api():
    """API para retornar as habilidades especiais do jogador em formato JSON"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter as habilidades especiais desbloqueadas
        specials = get_player_specials(player.id)
        
        return jsonify({
            'success': True,
            'specials': specials
        })
    except Exception as e:
        print(f"Erro na API de habilidades especiais: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Erro ao processar habilidades especiais: {str(e)}',
            'attacks': []
        })

@battle_bp.route('/use_special', methods=['GET', 'POST'])
def use_special():
    print("==== INICIANDO /gamification/use_special ====")
    try:
        player = Player.query.first()
        print(f"Player encontrado: {player.id if player else None}")
        
        if not player:
            print("ERRO: Player não encontrado")
            if request.headers.get('Accept') == 'application/json':
                return jsonify({'success': False, 'message': 'Jogador não encontrado!'})
            flash("Jogador não encontrado!", "danger")
            return redirect(url_for('battle.battle'))
        
        # Log dos headers da requisição
        print(f"Headers: {dict(request.headers)}")
        print(f"Método da requisição: {request.method}")
        
        # Verificar se é GET ou POST e obter skill_id adequadamente
        if request.method == 'POST':
            print(f"POST data: {request.form}")
            skill_id = request.form.get('skill_id')
        else:
            print(f"GET params: {request.args}")
            skill_id = request.args.get('skill_id')
        
        print(f"skill_id extraído: '{skill_id}'")
        
        if not skill_id or not skill_id.isdigit():
            print(f"ERRO: skill_id inválido: {skill_id}")
            if request.headers.get('Accept') == 'application/json':
                return jsonify({'success': False, 'message': 'Habilidade inválida!'})
            flash("Habilidade inválida!", "danger")
            return redirect(url_for('battle.battle'))
        
        print(f"Chamando use_special_skill com player_id={player.id}, skill_id={int(skill_id)}")
        
        # Chamar a função dentro de um bloco try para capturar exceções específicas
        try:
            success, message, details = use_special_skill(player.id, int(skill_id))
            print(f"Resultado de use_special_skill: success={success}, message={message}")
            print(f"Details: {details}")
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"ERRO NA FUNÇÃO use_special_skill: {str(e)}")
            print(f"TRACEBACK:\n{error_traceback}")
            raise  # Re-lançar a exceção para ser capturada pelo bloco externo
        
        # Se for uma requisição AJAX, retornar JSON
        if request.headers.get('Accept') == 'application/json':
            response_data = {
                'success': success,
                'message': message,
                'details': details
            }
            print(f"Retornando resposta JSON: {response_data}")
            return jsonify(response_data)
        
        # Se for uma requisição normal, usar flash e redirecionar
        if success:
            flash_gamification(message, notification_only=True)
        else:
            flash(message, "warning")

        print("Redirecionando para battle")
        return redirect(url_for('battle.battle'))
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERRO GERAL EM /gamification/use_special: {str(e)}")
        print(f"TRACEBACK COMPLETO:\n{error_details}")
        
        if request.headers.get('Accept') == 'application/json':
            error_response = {
                'success': False,
                'message': f'Erro interno: {str(e)}',
                'error_details': str(e)
            }
            print(f"Retornando erro JSON: {error_response}")
            return jsonify(error_response), 500
        
        flash(f"Erro interno: {str(e)}", "danger")
        return redirect(url_for('battle.battle'))

@battle_bp.route('/skills')
def skills():
    """Página para habilidades do jogador."""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))
    
    # Se não tem personagem escolhido, redirecionar para escolha
    if not player.character_id:
        return redirect(url_for('choose_character_route'))
    
    # Obter habilidades de ataque desbloqueadas
    attack_skills = get_player_attacks(player.id)
    
    # ADICIONAR DADOS DO CACHE PARA CADA SKILL DE ATAQUE
    from models import PlayerAttackCache
    from routes.battle_cache import calculate_attack_cache
    
    # Garantir que cache existe
    calculate_attack_cache(player.id)
    
    # Enriquecer cada skill com dados do cache
    for skill in attack_skills:
        cache = PlayerAttackCache.query.filter_by(
            player_id=player.id,
            skill_id=skill['id']
        ).first()
        
        if cache:
            skill['cache'] = {
                'base_damage': cache.base_damage,
                'crit_chance': cache.base_crit_chance * 100,
                'crit_multiplier': cache.base_crit_multiplier,
                'lifesteal_percent': cache.lifesteal_percent * 100,
                'skill_type': cache.skill_type.upper()
            }
    
    # Obter habilidades especiais desbloqueadas
    special_skills = get_player_specials(player.id)
    
    # No novo sistema, não há habilidades para desbloquear
    available_attacks = []
    available_specials = []
    
    return render_template('gamification/skills.html', 
                           player=player, 
                           attack_skills=attack_skills,
                           special_skills=special_skills,
                           available_attacks=available_attacks,
                           available_specials=available_specials)

@battle_bp.route('/fill_special_charges')
def fill_special_charges():
    """Endpoint para preencher todas as cargas das habilidades especiais (para testes)"""
    from characters import fill_all_special_charges
    
    player = Player.query.first()
    if not player:
        flash("Jogador não encontrado!", "danger")
        return redirect(url_for('battle.gamification'))
    
    filled_skills = fill_all_special_charges(player.id)
    
    if filled_skills:
        flash(f"Cargas de {len(filled_skills)} habilidades especiais preenchidas!", "success")
    else:
        flash("Nenhuma habilidade especial encontrada para preencher.", "warning")
    
    # Redirecionar de volta para onde veio ou para a página de batalha
    return redirect(request.referrer or url_for('battle.battle'))

@battle_bp.route('/finish_study', methods=['POST'])
def finish_study():
    player = Player.query.first()
    start_iso = session.pop('study_start_time', None)
    if start_iso and hasattr(player, 'regen_per_study_time'):
        # calcula quantos intervalos de 10min
        start = datetime.fromisoformat(start_iso)
        elapsed = datetime.utcnow() - start
        intervals = int(elapsed.total_seconds() // 600)
        regen_pct = player.regen_per_study_time
        if regen_pct > 0 and intervals > 0:
            hp_regen = int(player.max_hp * regen_pct * intervals)
            player.hp = min(player.hp + hp_regen, player.max_hp)
            db.session.commit()
    return jsonify({'success': True})

@battle_bp.route('/player/attacks')
def player_attacks():
    """API simplificada para retornar as habilidades de ataque do jogador"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter as habilidades de ataque desbloqueadas
        attacks = get_player_attacks(player.id)
        
        # ===== ADICIONAR DEBUG =====
        print(f"📋 Total de attacks retornados: {len(attacks)}")
        for attack in attacks:
            print(f"   - ID: {attack.get('id')}, Nome: {attack.get('name')}, Tipo: {attack.get('skill_type')}")
        
        # ===== VERIFICAR RELÍQUIA ID 24 (ÚLTIMA GRAÇA) =====
        from models import PlayerRelic
        import json
        
        ultima_graca = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id='24',
            is_active=True
        ).first()
        
        if ultima_graca:
            state_data = json.loads(ultima_graca.state_data or '{}')
            suprema_used = state_data.get('used_this_battle', False)
            
            print(f"🔍 Relíquia Última Graça encontrada. Já usada? {suprema_used}")
            
            if suprema_used:
                # Marcar skill Suprema como desabilitada
                for attack in attacks:
                    # ===== VERIFICAR POR ID, TIPO E NOME =====
                    is_ultimate = (
                        attack.get('skill_type') == 'ultimate' or
                        attack.get('id') == 53 or  # ID específico da Suprema do Vlad
                        'suprema' in attack.get('name', '').lower() or
                        'beijo da morte' in attack.get('name', '').lower()
                    )
                    
                    if is_ultimate:
                        attack['is_disabled'] = True
                        attack['disabled_reason'] = 'Última Graça já foi usada nesta batalha'
                        print(f"🔒 Suprema (ID {attack['id']}, Nome: {attack['name']}) DESABILITADA por Última Graça")
        
        return jsonify({
            'success': True,
            'attacks': attacks
        })
    except Exception as e:
        print(f"Erro na API de ataques: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao processar habilidades: {str(e)}',
            'attacks': []
        })

@battle_bp.route('/player/specials')
def player_specials():
    """API simplificada para retornar as habilidades especiais do jogador"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter as habilidades especiais desbloqueadas
        specials = get_player_specials(player.id)
        
        return jsonify({
            'success': True,
            'specials': specials
        })
    except Exception as e:
        print(f"Erro na API de habilidades especiais: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Erro ao processar habilidades especiais: {str(e)}',
            'specials': []
        })
    
@battle_bp.route('/boss_defeated', methods=['POST'])
def boss_defeated():
    """Processa a derrota de um boss/inimigo genérico com sistema automático completo"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter progresso do jogador
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)

        # NOVO: Gerar inimigos iniciais se a tabela estiver vazia
        if GenericEnemy.query.filter_by(is_available=True).count() == 0:
            print("📊 Gerando inimigos iniciais...")
            
            # Gerar 3 inimigos iniciais (enemy_number = 1)
            themes = EnemyTheme.query.all()
            if themes:
                for i in range(3):
                    theme = themes[i % len(themes)]  # Rotacionar entre temas
                    new_enemy = generate_enemy_by_theme(theme.id, 1)
                    if new_enemy:
                        print(f"   ✅ Inimigo criado: {new_enemy.name}")
            
            print("📊 Inimigos iniciais gerados!")
        
        # Incrementar contador de inimigos genéricos derrotados
        progress.generic_enemies_defeated += 1
        progress.current_boss_phase += 1
        
        # NOVO: Verificar se chegou ao boss milestone (múltiplos de 20)
        is_boss_milestone = progress.generic_enemies_defeated % 20 == 0
        
        # Verificar se chegou ao boss fixo (múltiplos de 20)
        if progress.current_boss_phase > 20:
            progress.current_boss_phase = 1  # Reiniciar fase
        
        # Atualizar rodadas de todos os inimigos disponíveis
        expired_count = update_rounds_for_all_enemies()
        
        # NOVO: Garantir que sempre hajam pelo menos N inimigos disponíveis (exceto em boss milestone)
        if not is_boss_milestone:
            available_count = GenericEnemy.query.filter_by(is_available=True).count()
            minimum_required = get_minimum_enemy_count(player.id)
            
            if available_count < minimum_required:
                generated_count = ensure_minimum_enemies(progress)
                print(f"📊 Gerados {generated_count} novos inimigos (total disponível: {available_count + generated_count})")
        
        # Se o inimigo selecionado expirou ou foi derrotado, limpar seleção
        if progress.selected_enemy_id:
            selected = GenericEnemy.query.get(progress.selected_enemy_id)
            if not selected or not selected.is_available:
                progress.selected_enemy_id = None
        
        # NOVO: Limpar seleção em boss milestone
        if is_boss_milestone:
            progress.selected_enemy_id = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'enemies_defeated': progress.generic_enemies_defeated,
            'current_phase': progress.current_boss_phase,
            'expired_enemies': expired_count,
            'is_boss_milestone': is_boss_milestone,
            'available_enemies': GenericEnemy.query.filter_by(is_available=True).count(),
            'message': 'Boss milestone atingido!' if is_boss_milestone else 'Inimigo derrotado!',
            'next_is_boss_fight': progress.current_boss_phase == 20
        })
    except Exception as e:
        print(f"❌ Erro em boss_defeated: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/get_run_statistics', methods=['GET'])
def get_run_statistics():
    """Retorna estatísticas da run atual para a tela de morte"""
    try:
        # Obter jogador atual (ajuste conforme seu sistema de autenticação)
        player = Player.query.first()  # ou seu método de obter player logado
        
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter progresso do jogador
        player_progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not player_progress:
            enemies_defeated = 0
        else:
            enemies_defeated = player_progress.generic_enemies_defeated
        
        # Montar estatísticas
        stats = {
            'success': True,
            'gold_gained': player.run_gold_gained,
            'crystals_gained': player.run_crystals_gained,
            'hourglasses_gained': player.run_hourglasses_gained,
            'enemies_defeated': enemies_defeated,
            'bosses_defeated': player.run_bosses_defeated
        }
        
        return jsonify(stats)
        
    except Exception as e:
        print(f"Erro ao obter estatísticas da run: {e}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'})
    
def reset_player_run(player_id):
    """
    Reseta a run do jogador, mantendo apenas progressão permanente
    
    IMPORTANTE: Esta função zera todos os contadores de run.
    Se você adicionar novos contadores de run no futuro, 
    lembrar de resetá-los aqui também!
    """
    try:
        player = Player.query.get(player_id)
        if not player:
            return False, "Jogador não encontrado"
        
        # ===== RESETAR CONTADORES DE RUN =====
        player.run_crystals_gained = 0
        player.run_hourglasses_gained = 0  
        player.run_gold_gained = 0
        player.run_bosses_defeated = 0
        player.run_start_timestamp = datetime.utcnow()
        
        # ===== RESETAR RECURSOS DE RUN =====
        player.run_gold = 0
        
        # ===== RESETAR PROGRESSO =====
        player_progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if player_progress:
            player_progress.generic_enemies_defeated = 0
            player_progress.current_boss_phase = 1
            player_progress.available_enemies = '[]'  # Reset enemies disponíveis
            player_progress.selected_enemy_id = None
            player_progress.last_theme_used = None
        
        # ===== DESATIVAR RELÍQUIAS PRIMEIRO (ANTES DE RECALCULAR) =====
        from models import PlayerRelic, EnemySkillDebuff
        PlayerRelic.query.filter_by(player_id=player_id).update({'is_active': False})
        print(f"🗡️ Relíquias desativadas (não deletadas)")
        
        # ===== LIMPAR BUFFS TEMPORÁRIOS =====
        PlayerRunBuff.query.filter_by(player_id=player.id).delete()
        print(f"🧠 Buffs de run limpos")
        
        # ===== LIMPAR DEBUFFS DE INIMIGOS (como Nictalopia) =====
        EnemySkillDebuff.query.filter_by(player_id=player.id).delete()
        print(f"⚔️ Debuffs de inimigos removidos")
        
        # ===== RESETAR ATRIBUTOS BASE =====
        player.vitality = 0
        player.strength = 0  
        player.resistance = 0
        player.luck = 0
        print(f"🔄 Atributos resetados para valores base")
        
        # ===== RESTAURAR HP E ENERGIA =====
        if hasattr(player, 'recalculate_stats_enhanced'):
            player.recalculate_stats_enhanced()
        else:
            player.recalculate_stats()
        
        # Forçar HP e energia base corretos
        player.max_hp = 80
        player.hp = 80
        player.max_energy = 10
        player.energy = 10
        print(f"❤️ HP resetado: {player.hp}/{player.max_hp}")
        print(f"⚡ Energia resetada: {player.energy}/{player.max_energy}")
        
        # ===== RESETAR SISTEMA DE INIMIGOS =====
        GenericEnemy.query.filter_by(is_available=True).update(
            {
                'is_available': False,
                'attack_charges_count': 0,
                'action_queue': '[]'
            },
            synchronize_session=False
        )
        
        db.session.commit()
        print(f"✅ Run resetada com sucesso para player {player_id}")
        return True, "Run resetada com sucesso"
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao resetar run: {e}")
        return False, f"Erro ao resetar run: {str(e)}"

def reset_player_energy(player_id):
    """
    Reseta a energia do jogador ao valor máximo.
    Chamado no início de cada turno do jogador.
    """
    try:
        from models import Player
        player = Player.query.get(player_id)
        if not player:
            return False
        
        # Resetar energia ao máximo
        player.energy = player.max_energy
        db.session.commit()
        
        print(f"⚡ Energia resetada: {player.energy}/{player.max_energy}")
        return True
        
    except Exception as e:
        print(f"Erro ao resetar energia: {e}")
        db.session.rollback()
        return False

@battle_bp.route('/select_boss', methods=['POST'])
def select_boss():
    """Seleciona um boss para batalha"""
    try:
        data = request.get_json()
        boss_id = data.get('boss_id')
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Verificar se o boss existe e está ativo
        from models import LastBoss
        boss = LastBoss.query.get(boss_id)
        if not boss or not boss.is_active:
            return jsonify({'success': False, 'message': 'Boss não disponível'})
        
        # Atualizar progresso do jogador para apontar para o boss
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)
        
        # Limpar seleção de inimigo genérico e definir boss
        progress.selected_enemy_id = None
        progress.selected_boss_id = boss_id
        
        # RESETAR CONTADOR DE TURNOS DO BOSS
        boss.battle_turn_counter = 0
        # Pré-calcular intenções do Turno 1
        next_turn_data = get_next_actions(boss)
        next_intentions = next_turn_data['actions']
        boss.next_intentions_cached = json.dumps(next_intentions)
        print(f"🔮 Intenções do Turno 1 (Boss) pré-calculadas: {[a.get('type') for a in next_intentions]}")
        print(f"🔄 Contador de turnos resetado para boss {boss.name}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Boss {boss.name} selecionado!',
            'boss': {
                'id': boss.id,
                'name': boss.name,
                'hp': boss.current_hp,
                'max_hp': boss.max_hp
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/get_available_enemies')
def get_available_enemies():
    """Retorna inimigos disponíveis OU boss se for milestone"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter progresso
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)
            db.session.commit()
        
        # VERIFICAR SE É MILESTONE DE BOSS (próximo seria o 20º inimigo)
        next_enemy_number = progress.generic_enemies_defeated + 1
        if next_enemy_number % 20 == 0:
            print(f"👑 MILESTONE DE BOSS DETECTADO: Próximo seria #{next_enemy_number}")
            
            from models import LastBoss
            active_boss = LastBoss.query.filter_by(is_active=True).first()
            
            if active_boss:
                print(f"👑 Boss ativo encontrado: {active_boss.name}")
                return jsonify({
                    'success': True,
                    'enemies': [],
                    'boss': {
                        'id': active_boss.id,
                        'name': active_boss.name,
                        'hp': active_boss.current_hp,
                        'max_hp': active_boss.max_hp,
                        'damage': active_boss.damage,
                        'posture': active_boss.posture,
                        'block_percentage': active_boss.block_percentage,
                        'sprite_idle': active_boss.sprite_idle,
                        'sprite_frames': active_boss.sprite_frames,
                        'sprite_size': active_boss.sprite_size,
                        'reward_crystals': active_boss.reward_crystals,
                        'is_boss': True,
                        'rarity': 'boss'
                    },
                    'is_boss_fight': True,
                    'selected_enemy_id': None
                })
            else:
                print(f"👑 Boss não encontrado! Tentando criar...")
                # Tentar criar boss baseado no milestone atual
                from .battle_modules.enemy_generation import create_boss_by_name, get_boss_for_milestone
                boss_number = next_enemy_number // 20
                boss_name = get_boss_for_milestone(boss_number)
                print(f"👑 Criando boss para milestone {boss_number}: {boss_name}")
                boss = create_boss_by_name(boss_name)
                if boss:
                    print(f"👑 Boss {boss.name} criado!")
                    return jsonify({
                        'success': True,
                        'enemies': [],
                        'boss': {
                            'id': boss.id,
                            'name': boss.name,
                            'hp': boss.current_hp,
                            'max_hp': boss.max_hp,
                            'damage': boss.damage,
                            'posture': boss.posture,
                            'block_percentage': boss.block_percentage,
                            'sprite_idle': boss.sprite_idle,
                            'sprite_frames': boss.sprite_frames,
                            'sprite_size': boss.sprite_size,
                            'reward_crystals': boss.reward_crystals,
                            'is_boss': True,
                            'rarity': 'boss'
                        },
                        'is_boss_fight': True,
                        'selected_enemy_id': None
                    })
                else:
                    print(f"❌ Falha ao criar boss!")
        
        # LÓGICA NORMAL: Inimigos genéricos (resto da função permanece igual)
        available = GenericEnemy.query.filter_by(is_available=True).all()

        # Calcular mínimo dinâmico baseado em relíquias
        minimum_required = get_minimum_enemy_count(player.id)

        if len(available) < minimum_required:
            print(f"📊 Inimigos disponíveis: {len(available)}, mínimo requerido: {minimum_required}, gerando mais...")
            generated = ensure_minimum_enemies(progress)
            
            # Recarregar a lista de inimigos disponíveis
            available = GenericEnemy.query.filter_by(is_available=True).all()
            print(f"📊 Total inimigos após geração: {len(available)}")
            print(f"📊 Inimigos gerados: {generated}")
            
            # Recarregar a lista de inimigos disponíveis
            available = GenericEnemy.query.filter_by(is_available=True).all()
            print(f"📊 Total inimigos após geração: {len(available)}")
        
        # Converter para formato JSON
        enemies_data = []
        for enemy in available:
            enemies_data.append({
                'id': enemy.id,
                'name': enemy.name,
                'enemy_number': enemy.enemy_number,
                'rarity': enemy.rarity,
                'hp': enemy.hp,
                'max_hp': enemy.max_hp,
                'damage': enemy.damage,
                'posture': enemy.posture,
                'block_percentage': enemy.block_percentage,
                'rounds_remaining': enemy.rounds_remaining,
                'initial_rounds': enemy.initial_rounds,
                'sprite_back': enemy.sprite_back,
                'sprite_body': enemy.sprite_body,
                'sprite_head': enemy.sprite_head,
                'sprite_weapon': enemy.sprite_weapon,
                'rarity_name': ['', 'Comum', 'Raro', 'Épico', 'Lendário'][enemy.rarity],
                'equipment_rank': enemy.equipment_rank,
                'is_new': enemy.is_new,
                'reward_type': enemy.reward_type or 'crystals',
                'reward_icon': enemy.reward_icon or 'crystal.png',
                'is_boss': False
            })

        return jsonify({
            'success': True,
            'enemies': enemies_data,
            'boss': None,
            'is_boss_fight': False,
            'selected_enemy_id': progress.selected_enemy_id
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/select_enemy', methods=['POST'])
def select_enemy():
    """Seleciona um inimigo para batalha"""
    try:
        data = request.get_json()
        enemy_id = data.get('enemy_id')
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Verificar se o inimigo existe e está disponível
        enemy = GenericEnemy.query.get(enemy_id)
        if not enemy or not enemy.is_available:
            return jsonify({'success': False, 'message': 'Inimigo não disponível'})
        
        # Atualizar progresso do jogador
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)
        
        progress.selected_enemy_id = enemy_id

        # RESETAR CONTADOR DE TURNOS
        enemy.battle_turn_counter = 0
        print(f"🔄 Contador de turnos resetado para {enemy.name}")

        # Pré-calcular intenções do Turno 1
        next_turn_data = get_next_actions(enemy)
        next_intentions = next_turn_data['actions']
        enemy.next_intentions_cached = json.dumps(next_intentions)
        print(f"🔮 Intenções do Turno 1 (Enemy) pré-calculadas: {[a.get('type') for a in next_intentions]}")

        # Marcar TODOS os inimigos disponíveis como vistos ao selecionar um
        available_enemies = GenericEnemy.query.filter_by(is_available=True).all()
        for available_enemy in available_enemies:
            available_enemy.is_new = False

        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Inimigo {enemy.name} selecionado!',
            'enemy': {
                'id': enemy.id,
                'name': enemy.name,
                'hp': enemy.hp,
                'max_hp': enemy.max_hp
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/get_player_currencies')
def get_player_currencies():
    """API para obter as currencies atualizadas do jogador"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        return jsonify({
            'success': True,
            'crystals': player.crystals,
            'gold': getattr(player, 'run_gold', 0),
            'hourglasses': getattr(player, 'eternal_hourglasses', 0)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@battle_bp.route('/apply_victory_rewards', methods=['POST'])
def apply_victory_rewards():
    """Aplica as recompensas de vitória armazenadas na sessão"""
    try:        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter recompensas pendentes do banco
        from models import PendingReward
        pending_reward = PendingReward.query.filter_by(player_id=player.id).order_by(PendingReward.created_at.desc()).first()
        if not pending_reward:
            print(f"❌ DEBUG: Nenhuma recompensa pendente encontrada no banco!")
            return jsonify({'success': False, 'message': 'Nenhuma recompensa pendente'})

        # Converter para formato esperado
        pending_rewards = pending_reward.to_dict()
        
        # Aplicar as recompensas
        exp_reward = pending_rewards.get('exp_reward', 0)
        crystals_gained = pending_rewards.get('crystals_gained', 0)
        gold_gained = pending_rewards.get('gold_gained', 0)
        hourglasses_gained = pending_rewards.get('hourglasses_gained', 0)
        victory_heal_amount = pending_rewards.get('victory_heal_amount', 0)
        
        # Aplicar EXP
        old_level = player.level
        player.experience += exp_reward

        # Aplicar currencies E incrementar contadores de run
        if crystals_gained > 0:
            player.crystals += crystals_gained
            player.run_crystals_gained += crystals_gained
            
        if gold_gained > 0:
            player.run_gold += gold_gained
            player.run_gold_gained += gold_gained
            
        if hourglasses_gained > 0:
            player.eternal_hourglasses += hourglasses_gained
            player.run_hourglasses_gained += hourglasses_gained

        # Incrementar contador de bosses derrotados
        player.run_bosses_defeated += 1
        
        # Aplicar cura de vitória se houver
        if victory_heal_amount > 0:
            player.hp = min(player.hp + victory_heal_amount, player.max_hp)
        
        # Restaurar energia ao máximo após vitória
        player.energy = player.max_energy
        print(f"⚡ Energia restaurada ao máximo: {player.energy}/{player.max_energy}")

        # <-- MUDANÇA AQUI: Resetar a barreira ao final da batalha
        player.barrier = 0
        print(f"🛡️ Barreira resetada para 0 após a vitória.")
        # <-- FIM DA MUDANÇA

        # Verificar level up
        level_up = False
        while player.experience >= get_exp_for_next_level(player.level):
            player.level += 1
            player.attribute_points += 2
            level_up = True
        
        db.session.commit()
        
        # Limpar recompensas do banco
        db.session.delete(pending_reward)
        db.session.commit()
        
        print(f"🎉 RECOMPENSAS APLICADAS:")
        print(f"   EXP: {exp_reward}")
        if crystals_gained > 0:
            print(f"   Cristais: {crystals_gained}")
        if gold_gained > 0:
            print(f"   Ouro: {gold_gained}")
        if hourglasses_gained > 0:
            print(f"   Ampulhetas: {hourglasses_gained}")
        if level_up:
            print(f"   Level up: {old_level} → {player.level}")
        
        return jsonify({
            'success': True,
            'message': 'Recompensas recebidas!',
            'level_up': level_up,
            'new_level': player.level if level_up else None,
            'rewards_applied': {
                'exp': exp_reward,
                'crystals': crystals_gained,
                'gold': gold_gained,
                'hourglasses': hourglasses_gained,
                'heal': victory_heal_amount
            }
        })
        
    except Exception as e:
        print(f"Erro ao aplicar recompensas: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

# ----- ROTAS DE DESENVOLVIMENTO -----

@battle_bp.route('/dev_add_enemy_charges')
def dev_add_enemy_charges():
    """Rota DEV para adicionar cargas de ataque ao inimigo"""
    charges = int(request.args.get('charges', 5))
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Buscar inimigo atual da batalha (LastBoss OU GenericEnemy)
        enemy = get_current_battle_enemy(player.id)
        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo selecionado'})
        
        # Adicionar cargas (funciona para ambos os tipos)
        enemy.attack_charges_count += charges
        
        action_queue = json.loads(enemy.action_queue) if enemy.action_queue else []
        for _ in range(charges):
            # Determinar campo de som baseado no tipo
            attack_sound = getattr(enemy, 'hit_sound', None) or getattr(enemy, 'attack_sfx', None)
            
            action_queue.append({
                "type": "attack",
                "icon": "attackcharge.png",
                "data": {
                    "damage": enemy.damage,
                    "hit_animation": enemy.hit_animation,
                    "attack_sfx": attack_sound
                }
            })
        
        enemy.action_queue = json.dumps(action_queue)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{charges} cargas adicionadas ao {enemy.name} (ID: {enemy.id})',
            'total_charges': enemy.attack_charges_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/dev_add_skill_charges')
def dev_add_skill_charges():
    """Rota DEV para adicionar cargas de skills específicas ao inimigo"""
    skill_id = request.args.get('skill_id')
    charges = int(request.args.get('charges', 1))
    
    if not skill_id:
        return jsonify({'success': False, 'message': 'skill_id é obrigatório. Use: ?skill_id=1&charges=1'})
    
    try:
        from .enemy_attacks import load_enemy_skills_data
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Buscar inimigo atual da batalha (LastBoss OU GenericEnemy)
        enemy = get_current_battle_enemy(player.id)
        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo selecionado'})
        
        # Carregar dados das skills
        skills_data = load_enemy_skills_data()
        if not skills_data:
            return jsonify({'success': False, 'message': 'Erro ao carregar dados das skills'})
        
        # Determinar tipo da skill
        skill_type = None
        skill_data = None
        
        if skill_id in skills_data.get('attack_skills', {}):
            skill_type = 'attack'
            skill_data = skills_data['attack_skills'][skill_id]
        elif skill_id in skills_data.get('buff_skills', {}):
            skill_type = 'buff'
            skill_data = skills_data['buff_skills'][skill_id]
        elif skill_id in skills_data.get('debuff_skills', {}):
            skill_type = 'debuff'
            skill_data = skills_data['debuff_skills'][skill_id]
        else:
            return jsonify({'success': False, 'message': f'{enemy.name} não possui skill {skill_id}'})
        
        # Adicionar cargas baseado no tipo de skill
        if skill_type == 'attack':
            # Skills de ataque vão para action_queue
            action_queue = json.loads(enemy.action_queue) if enemy.action_queue else []
            for _ in range(charges):
                action_queue.append({
                    "type": "skill_attack",
                    "skill_id": int(skill_id),
                    "icon": skill_data.get('icon', f'skill{skill_id}.png'),
                    "data": skill_data
                })
            enemy.action_queue = json.dumps(action_queue)
        else:
            # Skills de buff/debuff vão para buff_debuff_queue
            buff_debuff_queue = json.loads(enemy.buff_debuff_queue) if enemy.buff_debuff_queue else []
            for _ in range(charges):
                buff_debuff_queue.append({
                    "type": skill_type,
                    "skill_id": int(skill_id),
                    "icon": skill_data.get('icon', f'skill{skill_id}.png'),
                    "data": skill_data
                })
            enemy.buff_debuff_queue = json.dumps(buff_debuff_queue)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{charges} cargas da skill {skill_id} ({skill_type}) adicionadas ao {enemy.name}',
            'enemy_name': enemy.name,
            'enemy_id': enemy.id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/dev_add_damage')
def dev_add_damage():
    """Rota DEV para adicionar pontos de dano"""
    amount = int(request.args.get('amount', 10))
    try:
        # Incrementar a variável de sessão para pontos de revisão
        current_points = session.get('session_revision_count', 0)
        session['session_revision_count'] = current_points + amount
        
        return jsonify({
            'success': True, 
            'message': f'Adicionados {amount} pontos de dano',
            'new_total': session['session_revision_count']
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@battle_bp.route('/dev_update_json_tiers')
def dev_update_json_tiers():
    """Rota DEV para atualizar JSON com tiers - EXECUTAR UMA VEZ"""
    try:
        from .battle.enemy_generation import update_json_with_tiers
        update_json_with_tiers()
        return jsonify({'success': True, 'message': '✅ JSON atualizado com tiers!'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'❌ Erro: {str(e)}'})
    
@battle_bp.route('/dev_check_json')
def dev_check_json():
    """Verificar se JSON tem tiers"""
    config = load_enemy_themes_config()
    
    # Verificar alguns equipamentos
    test_equipment = ['weapon1.png', 'body1.png', 'head1.png']
    results = {}
    
    for eq in test_equipment:
        if eq in config['sprite_modifiers']:
            modifiers = config['sprite_modifiers'][eq]
            results[eq] = {
                'has_tier': 'tier' in modifiers,
                'has_total_points': 'total_points' in modifiers,
                'tier_value': modifiers.get('tier', 'NOT_FOUND'),
                'total_points_value': modifiers.get('total_points', 'NOT_FOUND')
            }
    
    return jsonify(results)

@battle_bp.route('/dev_analyze_themes')
def dev_analyze_themes():
    """Rota DEV para analisar faixas dos temas"""
    try:
        from .battle.enemy_generation import analyze_theme_equipment_ranges
        analyze_theme_equipment_ranges()
        return jsonify({'success': True, 'message': '✅ Análise completa no console!'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'❌ Erro: {str(e)}'})
    
@battle_bp.route('/end_player_turn', methods=['POST'])
def end_player_turn():
    """
    Jogador terminou o turno → processar turno do inimigo
    Gera as próximas ações do inimigo baseado no sistema de turnos
    """
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404
        
        # CORREÇÃO: Não precisa importar, a função já está neste arquivo
        from .battle_modules.battle_turns import process_enemy_turn
        
        # Buscar inimigo atual
        enemy = get_current_battle_enemy(player.id)
        
        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo em combate'}), 404
        
        print(f"\n🎮 JOGADOR TERMINOU O TURNO")
        print(f"⚔️ Processando turno de: {enemy.name}")
        
        # Processar turno do inimigo
        result = process_enemy_turn(enemy, player_id=player.id)
        
        # Retornar status das ações geradas
        return jsonify({
            'success': True,
            'message': f'Turno do inimigo processado: {result["num_actions"]} ação(ões)',
            'enemy_name': enemy.name,
            'num_actions': result['num_actions'],
            'actions': result['actions'],
            'action_queue_size': result['action_queue_size'],
            'buff_debuff_queue_size': result['buff_debuff_queue_size'],
            'has_actions': result['action_queue_size'] > 0 or result['buff_debuff_queue_size'] > 0
        })
        
    except Exception as e:
        print(f"❌ Erro ao processar turno do inimigo: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@battle_bp.route('/enemy_attack_status', methods=['GET'])
def enemy_attack_status_route():
    """Retorna status das cargas de ataque do inimigo"""
    try:
        # Obter o jogador
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter o inimigo atual
        enemy = get_current_battle_enemy(player.id)
        
        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo em combate'})
        
        # 1. Obter o status (que JÁ CONTÉM as 'next_intentions' corretas do cache)
        #    Esta função vem de 'enemy_attacks.py' e lê o cache corretamente.
        status = get_enemy_attack_status(player.id)
        
        # 2. Adicionar metadados (pattern completo, índice) se o frontend precisar
        import json
        status['action_pattern'] = json.loads(enemy.action_pattern) if enemy.action_pattern else []
        status['current_action_index'] = enemy.current_action_index
        
        # Apenas para seu log, confirme que está enviando o valor do cache
        print(f"✅ Enviando intenções do cache para o frontend: {status.get('next_intentions')}")
        
        return jsonify({
            'success': True,
            'status': status
        })
        
    except Exception as e:
        print(f"Erro ao obter status de ataque: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@battle_bp.route('/execute_enemy_attack', methods=['POST'])
def execute_enemy_attack_route():
    """Executa um único ataque do inimigo"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404
        
        from .enemy_attacks import execute_enemy_attack
        from models import GenericEnemy, PlayerProgress
        
        # Buscar inimigo atual da batalha (LastBoss OU GenericEnemy)
        enemy = get_current_battle_enemy(player.id)

        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo selecionado'}), 404
        
        result = execute_enemy_attack(player, enemy)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Erro ao executar ataque do inimigo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    
@battle_bp.route('/execute_buff_debuff_skills', methods=['POST'])
def execute_buff_debuff_skills_route():
    """Executa todas as skills de buff/debuff pendentes do inimigo"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404
        
        from .enemy_attacks import execute_buff_debuff_skills_sequence
        
        # Buscar inimigo atual da batalha (LastBoss OU GenericEnemy)
        enemy = get_current_battle_enemy(player.id)

        if not enemy:
            return jsonify({'success': False, 'message': 'Nenhum inimigo selecionado'}), 404
        
        # DEBUG: Verificar se encontrou o inimigo correto
        print(f"🔍 DEBUG BUFF: Inimigo encontrado - ID: {enemy.id}, Nome: {enemy.name}")
        print(f"🔍 DEBUG BUFF: Fila buff_debuff_queue: {enemy.buff_debuff_queue}")
        
        result = execute_buff_debuff_skills_sequence(player, enemy)
        
        print(f"🔍 DEBUG BUFF: Resultado: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Erro ao executar skills de buff/debuff: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@battle_bp.route('/check_relic_state/<int:relic_id>')
def check_relic_state(relic_id):
    """Verifica o estado de uma relíquia específica"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Buscar a relíquia específica
        from models import PlayerRelic
        player_relic = PlayerRelic.query.filter_by(
            player_id=player.id,
            relic_id=relic_id,
            is_active=True
        ).first()
        
        if not player_relic:
            return jsonify({
                'success': True,
                'has_relic': False,
                'state_data': {}
            })
        
        # Retornar o estado da relíquia
        import json
        state_data = json.loads(player_relic.state_data or '{}')
        
        return jsonify({
            'success': True,
            'has_relic': True,
            'state_data': state_data,
            'used_this_battle': state_data.get('used_this_battle', False)
        })
        
    except Exception as e:
        print(f"Erro ao verificar estado da relíquia: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})
    
@battle_bp.route('/get_enemy_active_buffs', methods=['GET'])
def get_enemy_active_buffs():
    """Retorna buffs ativos do inimigo atual"""
    try:
        from models import GenericEnemy, EnemySkillBuff, PlayerProgress
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'buffs': []})
        
        # Buscar inimigo atual da batalha (LastBoss OU GenericEnemy)
        enemy = get_current_battle_enemy(player.id)

        if not enemy:
            return jsonify({'success': False, 'buffs': []})
        
        # Limpar buffs expirados primeiro
        from .enemy_attacks import clean_expired_buffs_debuffs
        clean_expired_buffs_debuffs()
        
        # Obter buffs ativos
        active_buffs = EnemySkillBuff.query.filter_by(enemy_id=enemy.id).all()
        
        buffs_data = []
        for buff in active_buffs:
            skills_data = load_enemy_skills_data()
            skill_data = skills_data.get('buff_skills', {}).get(str(buff.skill_id), {})
            
            buffs_data.append({
                'skill_id': buff.skill_id,
                'icon': skill_data.get('icon', '/static/game.data/icons/skill_default.png'),
                'effect_type': buff.effect_type,
                'duration_remaining': buff.duration_remaining,
                'duration_type': buff.duration_type
            })
        
        return jsonify({
            'success': True,
            'buffs': buffs_data
        })
        
    except Exception as e:
        print(f"Erro ao obter buffs ativos: {e}")
        return jsonify({'success': False, 'buffs': []})
    
@battle_bp.route('/dev_test_anti_repetition')
def dev_test_anti_repetition():
    """Rota DEV para testar sistema anti-repetição"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Gerar 10 inimigos consecutivos e verificar repetições
        from .battle_modules.enemy_generation import ensure_minimum_enemies
        from models import GenericEnemy, PlayerProgress
        
        # Limpar inimigos existentes
        GenericEnemy.query.delete()
        
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id, generic_enemies_defeated=0)
            db.session.add(progress)
            db.session.commit()
        
        # Gerar 10 inimigos
        generated = ensure_minimum_enemies(progress, minimum=10)
        
        # Analisar repetições
        enemies = GenericEnemy.query.filter_by(is_available=True).all()
        
        equipment_usage = {}
        repetition_report = []
        
        for enemy in enemies:
            equipments = [enemy.sprite_body, enemy.sprite_head, enemy.sprite_weapon]
            if enemy.sprite_back:
                equipments.append(enemy.sprite_back)
                
            for eq in equipments:
                if eq:
                    equipment_usage[eq] = equipment_usage.get(eq, 0) + 1
                    if equipment_usage[eq] > 1:
                        repetition_report.append(f"{eq}: usado {equipment_usage[eq]} vezes")
        
        return jsonify({
            'success': True,
            'enemies_generated': generated,
            'total_enemies': len(enemies),
            'equipment_usage': equipment_usage,
            'repetitions_found': repetition_report,
            'enemies_summary': [
                {
                    'name': e.name,
                    'rarity': e.rarity,
                    'equipment': {
                        'body': e.sprite_body,
                        'head': e.sprite_head,
                        'weapon': e.sprite_weapon,
                        'back': e.sprite_back
                    }
                } for e in enemies
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/dev_clear_and_regenerate')
def dev_clear_and_regenerate():
    """DEV: Limpa todos os inimigos e gera novos"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Limpar inimigos
        GenericEnemy.query.delete()
        
        # Limpar histórico de equipamentos para teste limpo
        from models import EnemyEquipmentHistory
        EnemyEquipmentHistory.query.filter_by(player_id=player.id).delete()
        
        # Reset progress
        from models import PlayerProgress
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if progress:
            progress.generic_enemies_defeated = 0
            progress.selected_enemy_id = None
        
        db.session.commit()
        
        # Gerar 3 novos
        from .battle_modules.enemy_generation import ensure_minimum_enemies
        generated = ensure_minimum_enemies(progress, minimum=3)
        
        return jsonify({
            'success': True,
            'message': f'Limpo e gerados {generated} novos inimigos'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@battle_bp.route('/dev_force_boss_milestone')
def dev_force_boss_milestone():
    """DEV: Força milestone de boss específico (aceita parâmetro ?milestone=1-5)"""
    try:
        # Obter parâmetro milestone (padrão = 1)
        milestone = int(request.args.get('milestone', 1))
        
        # Validar milestone
        if milestone < 1 or milestone > 5:
            return jsonify({
                'success': False, 
                'message': f'Milestone inválido: {milestone}. Use valores entre 1-5.'
            })
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # NOVO: Limpar todos os bosses antigos primeiro
        from models import LastBoss
        LastBoss.query.update({'is_active': False})
        print(f"🧹 Todos os bosses antigos desativados")
        
        # Obter ou criar progresso
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if not progress:
            progress = PlayerProgress(player_id=player.id)
            db.session.add(progress)
        
        # Calcular inimigos derrotados baseado no milestone
        enemies_defeated = (milestone * 20) - 1
        
        # Configurar progresso
        progress.generic_enemies_defeated = enemies_defeated
        progress.current_boss_phase = milestone * 20
        progress.selected_enemy_id = None
        progress.selected_boss_id = None
        
        # Limpar todos os inimigos genéricos disponíveis
        GenericEnemy.query.filter_by(is_available=True).update({'is_available': False})
        
        # Mapear milestone para nome do boss
        boss_names = {
            1: "purassombra",
            2: "heresiarca", 
            3: "alma_negra",
            4: "formofagus",
            5: "nefasto"
        }
        
        boss_name = boss_names[milestone]
        print(f"👑 Criando boss: {boss_name} para milestone {milestone}")
        
        # Forçar criação do boss
        from .battle_modules.enemy_generation import create_boss_by_name
        boss = create_boss_by_name(boss_name)
        
        db.session.commit()
        db.session.refresh(progress)
        
        print(f"🔍 DEBUG APÓS MILESTONE {milestone}:")
        print(f"   Boss criado: {boss.name if boss else 'FALHOU'}")
        print(f"   enemies_defeated: {progress.generic_enemies_defeated}")
        
        if boss:
            return jsonify({
                'success': True,
                'message': f'Boss {boss.name} ativado! Milestone {milestone} forçado ({enemies_defeated}/20)',
                'boss_created': boss.name,
                'milestone': milestone,
                'enemies_defeated': progress.generic_enemies_defeated
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Falha ao criar boss {boss_name} para milestone {milestone}'
            })
        
    except ValueError:
        return jsonify({
            'success': False, 
            'message': 'Parâmetro milestone deve ser um número entre 1-5'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
@battle_bp.route('/dev_check_boss_status')
def dev_check_boss_status():
    """DEV: Verificar status atual do boss"""
    try:
        from models import LastBoss
        player = Player.query.first()
        progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        
        all_bosses = LastBoss.query.all()
        active_bosses = LastBoss.query.filter_by(is_active=True).all()
        
        return jsonify({
            'success': True,
            'enemies_defeated': progress.generic_enemies_defeated if progress else 0,
            'next_enemy_number': (progress.generic_enemies_defeated + 1) if progress else 1,
            'is_milestone': ((progress.generic_enemies_defeated + 1) % 20 == 0) if progress else False,
            'total_bosses': len(all_bosses),
            'active_bosses': len(active_bosses),
            'bosses_data': [{'id': b.id, 'name': b.name, 'is_active': b.is_active} for b in all_bosses]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.before_request
def update_player_skills():
    """Atualiza cargas de habilidades especiais e verifica efeitos baseados no tempo"""
    
    # ADICIONAR: Ensure equipment tier system is initialized
    from .battle_modules.enemy_generation import EQUIPMENT_BY_TIER_AND_THEME, initialize_equipment_tiers_smart
    if not EQUIPMENT_BY_TIER_AND_THEME:
        print("⚠️ Equipment tier system not initialized, initializing now...")
        initialize_equipment_tiers_smart()
    
    # Existing player skills update logic
    if request.endpoint in ['battle.gamification', 'battle.battle', 'battle.skills']:
        player = Player.query.first()
        if player:
            # Atualizar cargas de habilidades especiais
            updated_skills = update_skill_charges(player.id)
            if updated_skills:
                for skill in updated_skills:
                    flash_gamification(f"Habilidade {skill['skill_name']} carregada: {skill['new_charges']} cargas!")
            
            # Atualizar buffs ativos
            removed_buffs = update_active_buffs(player.id)
            if removed_buffs:
                for buff in removed_buffs:
                    flash_gamification(f"Efeito {buff['effect_type']} expirou!")
            
            # Aplicar efeitos baseados na hora do dia
            time_effects = apply_time_based_effects(player.id)
            if time_effects:
                for effect in time_effects:
                    flash_gamification(effect['message'])
            
            # Aplicar efeitos diários
            daily_effects = apply_daily_effects(player.id)
            if daily_effects:
                for effect in daily_effects:
                    flash_gamification(effect['message'])

# ===== ROTAS DE RELÍQUIAS =====

from routes.relics import (
    generate_relic_options,
    award_relic_to_player,
    format_relic_for_display,
    format_relic_with_counter,
    get_all_relic_ids
)
from routes.relics.registry import get_relic_definition  # ← ADICIONAR ESTA LINHA
from models import PlayerRelic

@battle_bp.route('/get_relic_options')
def get_relic_options():
    """Retorna opções de relíquias para escolha"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        pending = session.get('pending_relic_selection')
        if not pending:
            return jsonify({'success': False, 'message': 'Nenhuma seleção pendente'})
        
        context = pending.get('context', 'first_relic')
        
        # Verificar se já tem opções salvas
        if 'options' in pending and pending['options']:
            option_ids = pending['options']
            print(f"🔄 Usando opções SALVAS: {option_ids}")
        else:
            # Gerar novas opções apenas se não existirem
            options = generate_relic_options(player.id, context)
            option_ids = [opt['id'] for opt in options]
            
            # Salvar na session
            pending['options'] = option_ids
            session['pending_relic_selection'] = pending
            session.modified = True
            print(f"✨ Novas opções GERADAS e SALVAS: {option_ids}")
        
        options = [get_relic_definition(rid) for rid in option_ids]
        
        return jsonify({
            'success': True,
            'options': [format_relic_for_display(opt) for opt in options],
            'context': context
        })
        
    except Exception as e:
        print(f"Erro ao obter opções de relíquias: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/select_relic', methods=['POST'])
def select_relic():
    """Seleciona uma relíquia"""
    try:
        data = request.get_json()
        relic_id = data.get('relic_id')
        
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        if not relic_id:
            return jsonify({'success': False, 'message': 'ID de relíquia não fornecido'})
        
        # Verificar se relíquia existe
        definition = get_relic_definition(relic_id)
        if not definition:
            return jsonify({'success': False, 'message': 'Relíquia inválida'})
        
        # Adicionar ao jogador
        award_relic_to_player(player.id, relic_id)
        
        # Verificar se há mais relíquias pendentes
        pending = session.get('pending_relic_selection')
        has_more = False
        remaining_count = 0
        
        if pending:
            pending['count'] -= 1
            pending.pop('options', None)  # ← ADICIONAR: Limpar opções para gerar novas
            remaining_count = pending['count']
            
            if pending['count'] > 0:
                session['pending_relic_selection'] = pending
                session.modified = True
                has_more = True
                print(f"🔄 Relíquia escolhida. Restam {pending['count']} para escolher")
            else:
                session.pop('pending_relic_selection', None)
                print(f"✅ Todas as relíquias escolhidas!")
        else:
            session.pop('pending_relic_selection', None)
        
        return jsonify({
            'success': True,
            'message': f'Relíquia {definition["name"]} adquirida!',
            'relic': format_relic_for_display(definition),
            'has_more_relics': has_more,
            'remaining_count': remaining_count
        })
        
    except Exception as e:
        print(f"Erro ao selecionar relíquia: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/check_relic_reward')
def check_relic_reward():
    """Verifica se há recompensa de relíquia pendente"""
    try:
        player = Player.query.first()
        if not player:
            session.pop('pending_relic_selection', None)
            return jsonify({
                'success': True,
                'has_relic_reward': False
            })
        
        pending = session.get('pending_relic_selection')
        
        if pending:
            return jsonify({
                'success': True,
                'has_relic_reward': True,
                'count': pending['count'],
                'context': pending['context']
            })
        else:
            return jsonify({
                'success': True,
                'has_relic_reward': False
            })
            
    except Exception as e:
        print(f"Erro ao verificar recompensa de relíquia: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@battle_bp.route('/get_player_relics')
def get_player_relics():
    """Retorna todas as relíquias do jogador com contadores"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        relics = PlayerRelic.query.filter_by(
            player_id=player.id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'relics': [format_relic_with_counter(r) for r in relics]
        })
        
    except Exception as e:
        print(f"Erro ao obter relíquias: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})
    

# ===== ROTA DE TESTE PARA ADICIONAR RELÍQUIAS =====

@battle_bp.route('/dev_add_relic/<relic_id>')
def dev_add_relic(relic_id):
    """DEV: Adiciona uma relíquia ao jogador para testes"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        from routes.relics import add_relic_for_testing, get_relic_definition
        
        definition = get_relic_definition(relic_id)
        if not definition:
            available = get_all_relic_ids()
            return jsonify({
                'success': False,
                'message': f'Relíquia {relic_id} não existe',
                'available_relics': available
            })
        
        add_relic_for_testing(player.id, relic_id)
        
        return jsonify({
            'success': True,
            'message': f'Relíquia {definition["name"]} adicionada!',
            'relic': format_relic_for_display(definition)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@battle_bp.route('/restore_energy', methods=['POST'])
def restore_energy():
    """
    Restaura energia do jogador ao máximo
    Chamado no início do turno do jogador
    """
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404
        
        # ===== RESETAR BARREIRA NO INÍCIO DO TURNO =====
        old_barrier = player.barrier or 0
        barrier_was_reset = False
        if old_barrier > 0:
            player.barrier = 0
            barrier_was_reset = True
            print(f"🛡️ Barreira de {old_barrier} resetada no início do turno.")
        # ===============================================

        # Restaurar energia ao máximo
        old_energy = player.energy
        player.energy = player.max_energy
        
        db.session.commit()
        
        print(f"⚡ Energia restaurada: {old_energy} → {player.energy}/{player.max_energy}")
        
        return jsonify({
            'success': True,
            'message': 'Energia restaurada',
            'barrier_reset': barrier_was_reset,
            'current_energy': player.energy,
            'max_energy': player.max_energy,
            'restored_amount': player.max_energy - old_energy
        })
        
    except Exception as e:
        print(f"❌ Erro ao restaurar energia: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
    
@battle_bp.route('/debug_enemy_skills')
def debug_enemy_skills():
    """Rota DEBUG para ver skills do inimigo"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'error': 'Jogador não encontrado'})
        
        enemy = get_current_battle_enemy(player.id)
        if not enemy:
            return jsonify({'error': 'Nenhum inimigo em combate'})
        
        import json
        
        return jsonify({
            'enemy_name': enemy.name,
            'enemy_number': enemy.enemy_number,
            'enemy_skills': json.loads(enemy.enemy_skills) if enemy.enemy_skills else [],
            'action_pattern': json.loads(enemy.action_pattern) if enemy.action_pattern else [],
            'theme': enemy.theme.name if hasattr(enemy, 'theme') else 'N/A'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})
    
@battle_bp.route('/battle_log')
def view_battle_log():
    """Retorna o log de batalha do jogador"""
    
    player = Player.query.first() 
    
    if not player:
        return jsonify({'success': False, 'logs': [], 'message': 'Jogador não encontrado'})
        
    player_id = player.id # Usar o ID real do jogador
    
    logs = get_battle_log(player_id, limit=50)
    return jsonify({'success': True, 'logs': logs})


@battle_bp.route('/clear_battle_log', methods=['POST'])
def clear_log():
    """Limpa o log de batalha"""
    
    player = Player.query.first()
    
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
    player_id = player.id # Usar o ID real do jogador
    
    success = clear_battle_log(player_id)
    return jsonify({'success': success})