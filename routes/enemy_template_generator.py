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

@enemy_template_bp.route('/gamification/get_all_equipment')
def get_all_equipment():
    """Retorna TODOS os equipamentos disponíveis com seus tiers"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)

        sprite_modifiers = config.get('sprite_modifiers', {})

        # Organizar equipamentos por tipo
        equipment_by_type = {
            'body_options': [],
            'head_options': [],
            'weapon_options': [],
            'back_options': []
        }
        equipment_tiers = {}

        # Percorrer todos os sprite_modifiers e categorizar
        for sprite_file, modifiers in sprite_modifiers.items():
            tier = modifiers.get('tier', 1)
            equipment_tiers[sprite_file] = tier

            # Determinar tipo baseado no nome do arquivo
            if sprite_file.startswith('body'):
                equipment_by_type['body_options'].append(sprite_file)
            elif sprite_file.startswith('head'):
                equipment_by_type['head_options'].append(sprite_file)
            elif sprite_file.startswith('weapon'):
                equipment_by_type['weapon_options'].append(sprite_file)
            elif sprite_file.startswith('back'):
                equipment_by_type['back_options'].append(sprite_file)

        # Ordenar para ficar mais organizado
        for key in equipment_by_type:
            equipment_by_type[key].sort()

        return jsonify({
            **equipment_by_type,
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
    """Gera um inimigo aleatório combinando equipamentos de qualquer fonte"""
    try:
        data = request.get_json()
        seed = data.get('seed')

        # Usar seed se fornecida
        if seed:
            random.seed(seed)
        else:
            seed = random.randint(1, 999999)
            random.seed(seed)

        # Carregar todos os equipamentos disponíveis
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)

        sprite_modifiers = config.get('sprite_modifiers', {})

        # Organizar equipamentos por tipo
        equipment_by_type = {'body': [], 'head': [], 'weapon': [], 'back': []}

        for sprite_file in sprite_modifiers.keys():
            if sprite_file.startswith('body'):
                equipment_by_type['body'].append(sprite_file)
            elif sprite_file.startswith('head'):
                equipment_by_type['head'].append(sprite_file)
            elif sprite_file.startswith('weapon'):
                equipment_by_type['weapon'].append(sprite_file)
            elif sprite_file.startswith('back'):
                equipment_by_type['back'].append(sprite_file)

        # Selecionar equipamentos aleatórios
        selected_body = random.choice(equipment_by_type['body']) if equipment_by_type['body'] else 'body1.png'
        selected_head = random.choice(equipment_by_type['head']) if equipment_by_type['head'] else 'head1.png'
        selected_weapon = random.choice(equipment_by_type['weapon']) if equipment_by_type['weapon'] else 'weapon1.png'
        selected_back = random.choice(equipment_by_type['back']) if equipment_by_type['back'] and random.random() > 0.5 else None

        # Obter tiers
        body_tier = sprite_modifiers.get(selected_body, {}).get('tier', 1)
        head_tier = sprite_modifiers.get(selected_head, {}).get('tier', 1)
        weapon_tier = sprite_modifiers.get(selected_weapon, {}).get('tier', 1)
        back_tier = sprite_modifiers.get(selected_back, {}).get('tier', 0) if selected_back else 0

        equipment_tiers = {
            'body': body_tier,
            'head': head_tier,
            'weapon': weapon_tier,
            'back': back_tier
        }

        # Calcular tier total
        hp_tier = body_tier + head_tier + back_tier
        damage_tier = weapon_tier

        # Gerar raridade aleatória (1-4)
        rarity = random.randint(1, 4)
        rarity_names = ['', 'Comum', 'Raro', 'Épico', 'Lendário']

        # Gerar nome aleatório
        prefixes = ['Guerreiro', 'Mago', 'Ladino', 'Cavaleiro', 'Arqueiro', 'Bárbaro', 'Paladino', 'Necromante']
        suffixes = ['Sombrio', 'Dourado', 'Sangrento', 'Místico', 'Corrupto', 'Sagrado', 'Maldito', 'Ancestral']
        name = f"{random.choice(prefixes)} {random.choice(suffixes)}"

        # Preparar dados para retorno
        enemy_data = {
            'name': name,
            'rarity': rarity,
            'rarity_name': rarity_names[rarity],
            'hp_tier': hp_tier,
            'damage_tier': damage_tier,
            'equipment_tiers': equipment_tiers,
            'sprite_layers': {
                'weapon': selected_weapon,
                'head': selected_head,
                'body': selected_body,
                'back': selected_back
            },
            'seed': seed,
            'typical_phrase': '',
            'behavior_pattern': 'default'
        }

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
