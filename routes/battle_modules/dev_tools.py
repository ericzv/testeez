# routes/battle_modules/dev_tools.py - Rotas de desenvolvimento e debug
"""
Rotas de desenvolvimento para testes e debug do sistema de batalha.
Essas rotas NÃO devem ser expostas em produção.

Para desabilitar em produção, não registre este blueprint ou use um decorator.
"""

import json
from flask import Blueprint, request, jsonify, session

from database import db
from models import Player, PlayerProgress, GenericEnemy, LastBoss, EnemyEquipmentHistory

# Logging
from utils.logger import get_logger
logger = get_logger(__name__)

# Blueprint separado para rotas de dev
dev_bp = Blueprint('dev', __name__, url_prefix='/gamification')


def init_dev_routes(battle_bp):
    """
    Registra as rotas de dev no blueprint de batalha.
    Chame esta função apenas em ambiente de desenvolvimento.
    """

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
            logger.debug("Limpando skills antigas...")
            AttackSkill.query.delete()
            SpecialSkill.query.delete()
            db.session.commit()

            logger.debug("Criando skills do Vlad...")

            # Criar skills de ataque diretamente
            for skill_data in VLAD_ATTACK_SKILLS_DATA:
                skill = AttackSkill(**skill_data)
                db.session.add(skill)
                logger.debug(f"Attack: {skill_data['name']}")

            # Criar skills especiais diretamente
            for skill_data in VLAD_SPECIAL_SKILLS_DATA:
                skill = SpecialSkill(**skill_data)
                db.session.add(skill)
                logger.debug(f"Special: {skill_data['name']}")

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

    @battle_bp.route('/dev_add_enemy_charges')
    def dev_add_enemy_charges():
        """Rota DEV para adicionar cargas de ataque ao inimigo"""
        from routes.battle import get_current_battle_enemy

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
        from routes.battle import get_current_battle_enemy
        from .battle_utils import load_enemy_skills_data

        skill_id = request.args.get('skill_id')
        charges = int(request.args.get('charges', 1))

        if not skill_id:
            return jsonify({'success': False, 'message': 'skill_id é obrigatório. Use: ?skill_id=1&charges=1'})

        try:
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
            from routes.battle_modules.enemy_generation import update_json_with_tiers
            update_json_with_tiers()
            return jsonify({'success': True, 'message': 'JSON atualizado com tiers!'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Erro: {str(e)}'})

    @battle_bp.route('/dev_check_json')
    def dev_check_json():
        """Verificar se JSON tem tiers"""
        from routes.battle_modules.enemy_generation import load_enemy_themes_config
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
            from routes.battle_modules.enemy_generation import analyze_theme_equipment_ranges
            analyze_theme_equipment_ranges()
            return jsonify({'success': True, 'message': 'Análise completa no console!'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Erro: {str(e)}'})

    @battle_bp.route('/dev_test_anti_repetition')
    def dev_test_anti_repetition():
        """Rota DEV para testar sistema anti-repetição"""
        try:
            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})

            # Gerar 10 inimigos consecutivos e verificar repetições
            from routes.battle_modules.enemy_generation import ensure_minimum_enemies

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
            EnemyEquipmentHistory.query.filter_by(player_id=player.id).delete()

            # Reset progress
            progress = PlayerProgress.query.filter_by(player_id=player.id).first()
            if progress:
                progress.generic_enemies_defeated = 0
                progress.selected_enemy_id = None

            db.session.commit()

            # Gerar 3 novos
            from routes.battle_modules.enemy_generation import ensure_minimum_enemies
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
            LastBoss.query.update({'is_active': False})
            logger.debug(f"Todos os bosses antigos desativados")

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
            logger.debug(f"Criando boss: {boss_name} para milestone {milestone}")

            # Forçar criação do boss
            from routes.battle_modules.enemy_generation import create_boss_by_name
            boss = create_boss_by_name(boss_name)

            db.session.commit()
            db.session.refresh(progress)

            logger.debug(f"DEBUG APÓS MILESTONE {milestone}:")
            logger.debug(f"Boss criado: {boss.name if boss else 'FALHOU'}")
            logger.debug(f"enemies_defeated: {progress.generic_enemies_defeated}")

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

    @battle_bp.route('/dev_add_relic/<relic_id>')
    def dev_add_relic(relic_id):
        """DEV: Adiciona uma relíquia ao jogador para testes"""
        try:
            player = Player.query.first()
            if not player:
                return jsonify({'success': False, 'message': 'Jogador não encontrado'})

            from routes.relics import add_relic_for_testing, get_relic_definition
            from routes.relics.registry import get_all_relic_ids
            from routes.battle import format_relic_for_display

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

    logger.info("Rotas de desenvolvimento registradas")
