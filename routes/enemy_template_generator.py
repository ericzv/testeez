"""
Enemy Template Generator - Ferramenta para gerar e salvar templates de inimigos
"""
from flask import Blueprint, render_template, jsonify, request
import json
import os
import random
from routes.battle_modules.enemy_generation import generate_enemy_by_theme, initialize_equipment_tiers_smart

enemy_template_bp = Blueprint('enemy_template', __name__)

# Caminhos
TEMPLATES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'game.data', 'enemy_templates.json')
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'game.data', 'enemy_themes_config.json')

def load_templates():
    """Carrega templates salvos"""
    try:
        if os.path.exists(TEMPLATES_PATH):
            with open(TEMPLATES_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'templates': []}
    except Exception as e:
        print(f"Erro ao carregar templates: {e}")
        return {'templates': []}

def save_templates(templates_data):
    """Salva templates"""
    try:
        with open(TEMPLATES_PATH, 'w', encoding='utf-8') as f:
            json.dump(templates_data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar templates: {e}")
        return False

@enemy_template_bp.route('/gamification/enemy_template_generator')
def template_generator_page():
    """Renderiza a página do Enemy Template Generator"""
    return render_template('gamification/enemy_template_generator.html')

@enemy_template_bp.route('/gamification/get_themes')
def get_themes():
    """Retorna lista de temas disponíveis do JSON"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)

        themes = []
        for theme_name in config.get('themes', {}).keys():
            themes.append({'name': theme_name})

        return jsonify({'themes': themes})
    except Exception as e:
        print(f"Erro ao carregar temas: {e}")
        return jsonify({'themes': []})

@enemy_template_bp.route('/gamification/get_theme_equipment')
def get_theme_equipment():
    """Retorna equipamentos disponíveis de um tema com seus tiers"""
    try:
        theme_name = request.args.get('theme', '')

        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)

        theme_config = config.get('themes', {}).get(theme_name, {})
        sprite_modifiers = config.get('sprite_modifiers', {})

        # Formatar opções como arquivos e incluir tiers
        equipment_options = {}
        equipment_tiers = {}

        for eq_type in ['body', 'head', 'weapon', 'back']:
            options_key = f'{eq_type}_options'
            if options_key in theme_config:
                equipment_options[options_key] = [
                    f"{eq_type}{num}.png" for num in theme_config[options_key]
                ]

                # Mapear tier de cada equipamento
                for num in theme_config[options_key]:
                    eq_file = f"{eq_type}{num}.png"
                    if eq_file in sprite_modifiers:
                        equipment_tiers[eq_file] = sprite_modifiers[eq_file].get('tier', 1)
                    else:
                        equipment_tiers[eq_file] = 0 if eq_type == 'back' else 1

        return jsonify({
            **equipment_options,
            'equipment_tiers': equipment_tiers
        })
    except Exception as e:
        print(f"Erro ao carregar equipamentos: {e}")
        return jsonify({
            'body_options': [],
            'head_options': [],
            'weapon_options': [],
            'back_options': [],
            'equipment_tiers': {}
        })

@enemy_template_bp.route('/gamification/generate_enemy_preview', methods=['POST'])
def generate_enemy_preview():
    """Gera um inimigo procedural para preview"""
    try:
        # Inicializar sistema de equipamentos por tier
        initialize_equipment_tiers_smart()

        data = request.get_json()
        theme_name = data.get('theme_name', 'Guerreiro azul')
        enemy_number = data.get('enemy_number', random.randint(1, 50))
        seed = data.get('seed')

        # Usar seed se fornecida
        if seed:
            random.seed(seed)
        else:
            seed = random.randint(1, 999999)
            random.seed(seed)

        # Gerar inimigo usando sistema direto (sem depender do banco)
        from routes.battle_modules.enemy_generation import generate_enemy_direct_by_theme_name
        from database import db

        enemy = generate_enemy_direct_by_theme_name(theme_name, enemy_number, player_id=None)

        if not enemy:
            return jsonify({
                'success': False,
                'message': 'Erro ao gerar inimigo'
            }), 500

        # Carregar tiers dos equipamentos do JSON
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)

        sprite_modifiers = config.get('sprite_modifiers', {})

        # Obter tier de cada equipamento
        equipment_tiers = {}
        for eq_type in ['body', 'head', 'weapon', 'back']:
            eq_file = getattr(enemy, f'sprite_{eq_type}')
            if eq_file and eq_file in sprite_modifiers:
                equipment_tiers[eq_type] = sprite_modifiers[eq_file].get('tier', 1)
            else:
                equipment_tiers[eq_type] = 0 if eq_type == 'back' else 1

        # Calcular tier total de HP e Damage
        hp_tier = equipment_tiers['body'] + equipment_tiers['head'] + equipment_tiers['back']
        damage_tier = equipment_tiers['weapon']

        # Preparar dados para retorno
        enemy_data = {
            'id': enemy.id,
            'name': enemy.name,
            'theme_id': enemy.theme_id,
            'theme_name': theme_name,
            'enemy_number': enemy_number,
            'rarity': enemy.rarity,
            'rarity_name': ['', 'Comum', 'Raro', 'Épico', 'Lendário'][enemy.rarity],
            'hp_tier': hp_tier,
            'damage_tier': damage_tier,
            'equipment_tiers': equipment_tiers,
            'sprite_layers': {
                'weapon': enemy.sprite_weapon,
                'head': enemy.sprite_head,
                'body': enemy.sprite_body,
                'back': enemy.sprite_back
            },
            'seed': seed,
            'typical_phrase': '',
            'behavior_pattern': 'default'
        }

        # Limpar inimigo gerado do banco (não salvar ainda)
        db.session.delete(enemy)
        db.session.commit()

        return jsonify({
            'success': True,
            'enemy': enemy_data
        })

    except Exception as e:
        print(f"Erro ao gerar preview: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Erro: {str(e)}'
        }), 500

@enemy_template_bp.route('/gamification/save_enemy_template', methods=['POST'])
def save_enemy_template():
    """Salva um template de inimigo"""
    try:
        template_data = request.get_json()

        # Carregar templates existentes
        templates = load_templates()

        # Gerar ID único
        template_id = max([t.get('id', 0) for t in templates['templates']], default=0) + 1
        template_data['id'] = template_id

        # Adicionar à lista
        templates['templates'].append(template_data)

        # Salvar
        if save_templates(templates):
            return jsonify({
                'success': True,
                'message': 'Template salvo com sucesso!',
                'template_id': template_id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Erro ao salvar template'
            }), 500

    except Exception as e:
        print(f"Erro ao salvar template: {e}")
        return jsonify({
            'success': False,
            'message': f'Erro: {str(e)}'
        }), 500

@enemy_template_bp.route('/gamification/get_enemy_templates')
def get_enemy_templates():
    """Retorna todos os templates salvos"""
    templates = load_templates()
    return jsonify(templates)

@enemy_template_bp.route('/gamification/delete_enemy_template/<int:template_id>', methods=['DELETE'])
def delete_enemy_template(template_id):
    """Deleta um template"""
    try:
        templates = load_templates()
        templates['templates'] = [t for t in templates['templates'] if t.get('id') != template_id]

        if save_templates(templates):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Erro ao salvar'}), 500

    except Exception as e:
        print(f"Erro ao deletar template: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
