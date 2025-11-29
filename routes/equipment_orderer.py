"""
Equipment Orderer - Ferramenta para organizar equipamentos por drag & drop
"""
from flask import Blueprint, render_template, jsonify, request
import json
import os

equipment_orderer_bp = Blueprint('equipment_orderer', __name__)

# Caminho para o arquivo de configuração
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'game.data', 'enemy_themes_config.json')

def load_config():
    """Carrega a configuração dos equipamentos"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar config: {e}")
        return None

def save_config(config):
    """Salva a configuração dos equipamentos"""
    try:
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar config: {e}")
        return False

@equipment_orderer_bp.route('/gamification/equipment_orderer')
def equipment_orderer_page():
    """Renderiza a página do Equipment Orderer"""
    return render_template('gamification/equipment_orderer.html')

@equipment_orderer_bp.route('/gamification/get_equipment_data')
def get_equipment_data():
    """Retorna os dados dos equipamentos organizados por categoria"""
    config = load_config()

    if not config or 'sprite_modifiers' not in config:
        return jsonify({'error': 'Configuração não encontrada'}), 404

    sprite_modifiers = config['sprite_modifiers']

    # Organizar por categoria
    equipment_by_category = {
        'weapon': [],
        'head': [],
        'body': [],
        'back': []
    }

    for filename, modifiers in sprite_modifiers.items():
        # Determinar categoria pelo prefixo do nome do arquivo
        if filename.startswith('weapon'):
            category = 'weapon'
        elif filename.startswith('head'):
            category = 'head'
        elif filename.startswith('body'):
            category = 'body'
        elif filename.startswith('back'):
            category = 'back'
        else:
            continue  # Ignorar arquivos que não se encaixam nas categorias

        equipment_by_category[category].append({
            'filename': filename,
            'tier': modifiers.get('tier', 1),
            'total_points': modifiers.get('total_points', 0),
            'hp': modifiers.get('hp', 0),
            'damage': modifiers.get('damage', 0),
            'armor': modifiers.get('armor', 0)
        })

    return jsonify(equipment_by_category)

@equipment_orderer_bp.route('/gamification/save_equipment_order', methods=['POST'])
def save_equipment_order():
    """Salva a nova ordem dos equipamentos"""
    try:
        updated_data = request.get_json()

        # Carregar configuração atual
        config = load_config()
        if not config or 'sprite_modifiers' not in config:
            return jsonify({'success': False, 'message': 'Configuração não encontrada'}), 404

        sprite_modifiers = config['sprite_modifiers']

        # Atualizar tiers e total_points baseado na nova ordem
        for category, items in updated_data.items():
            for item in items:
                filename = item['filename']
                if filename in sprite_modifiers:
                    # Atualizar tier e total_points
                    sprite_modifiers[filename]['tier'] = item['tier']
                    sprite_modifiers[filename]['total_points'] = item['total_points']

        # Salvar configuração atualizada
        config['sprite_modifiers'] = sprite_modifiers

        if save_config(config):
            return jsonify({
                'success': True,
                'message': 'Ordem salva com sucesso!'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Erro ao salvar arquivo'
            }), 500

    except Exception as e:
        print(f"Erro ao processar ordem: {e}")
        return jsonify({
            'success': False,
            'message': f'Erro: {str(e)}'
        }), 500
