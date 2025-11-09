# routes/sprite_organizer.py - Interface para organizar sprites e temas
import json
import os
from flask import Blueprint, render_template, request, jsonify, flash
from database import db

sprite_organizer_bp = Blueprint('sprite_organizer', __name__, url_prefix='/admin')

# Caminho para o arquivo de configuração
CONFIG_FILE = 'data/enemy_themes_config.json'

def ensure_data_directory():
    """Garante que o diretório data/ existe"""
    os.makedirs('data', exist_ok=True)

def load_config():
    """Carrega a configuração atual ou cria uma nova"""
    ensure_data_directory()
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"⚠️ Erro ao carregar JSON: {e}")
        print("🔧 Criando configuração padrão...")
        # Configuração padrão vazia
        default_config = {
            'themes': {
                "Guerreiro azul": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                },
                "Guerreiro branco/cinza/neutro": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                },
                "Ninjas e samurais sem cores fortes": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                },
                "Guerreiro dark": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                },
                "Guerreiros coloridos para acessorios genericos": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                },
                "Guerreiros grandes": {
                    "body_options": [],
                    "head_options": [],
                    "weapon_options": [],
                    "back_options": [],
                    "name_pool": []
                }
            },
            'sprite_modifiers': {
                "back12.png": {"armor": 20, "damage": 0, "hp": 0, "posture": 0},
                "back13.png": {"armor": 22, "damage": 0, "hp": 0, "posture": 0},
                "back16.png": {"armor": 0, "damage": 16, "hp": 0, "posture": 0},
                "back18.png": {"armor": 5, "damage": 20, "hp": 0, "posture": 0},
                "back21.png": {"armor": 0, "damage": 0, "hp": 8, "posture": 8}
            },
            'version': '1.0'
        }
        save_config(default_config)
        return default_config

def save_config(config):
    """Salva a configuração no arquivo JSON"""
    ensure_data_directory()
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

@sprite_organizer_bp.route('/debug/sprites')
def debug_sprites():
    """Debug: mostra estrutura de diretórios de sprites"""
    import os
    from flask import current_app
    
    debug_info = {
        'static_folder': current_app.static_folder,
        'sprite_paths': {},
        'files_found': {},
        'errors': []
    }
    
    # CAMINHO CORRETO para as sprites
    base_path = os.path.join(current_app.static_folder, 'game.data', 'enemies')
    debug_info['sprite_base_path'] = base_path
    debug_info['base_path_exists'] = os.path.exists(base_path)
    
    categories = ['body', 'head', 'weapon', 'back']
    
    for category in categories:
        category_path = os.path.join(base_path, category)
        debug_info['sprite_paths'][category] = category_path
        debug_info['files_found'][category] = []
        
        if os.path.exists(category_path):
            try:
                files = os.listdir(category_path)
                png_files = [f for f in files if f.endswith('.png')]
                debug_info['files_found'][category] = sorted(png_files, key=lambda x: int(''.join(filter(str.isdigit, x))))
            except Exception as e:
                debug_info['errors'].append(f"Erro ao listar {category}: {str(e)}")
        else:
            debug_info['errors'].append(f"Diretório não existe: {category_path}")
    
    return f"<pre>{json.dumps(debug_info, indent=2, ensure_ascii=False)}</pre>"

def get_all_sprites():
    """Retorna lista apenas das sprites que realmente existem no diretório"""
    import os
    from flask import current_app
    
    sprites = {
        'body': [],
        'head': [],
        'weapon': [],
        'back': []
    }
    
    try:
        # CAMINHO CORRETO para as sprites
        base_path = os.path.join(current_app.static_folder, 'game.data', 'enemies')
        
        for category in sprites.keys():
            category_path = os.path.join(base_path, category)
            
            if os.path.exists(category_path):
                # Listar todos os arquivos .png na pasta
                files = [f for f in os.listdir(category_path) if f.endswith('.png')]
                # Filtrar apenas os que seguem o padrão correto (category+numero.png)
                for file in files:
                    if file.startswith(category):
                        sprites[category].append(file)
                
                # Ordenar numericamente
                sprites[category].sort(key=lambda x: int(''.join(filter(str.isdigit, x))))
                print(f"✅ {category}: {len(sprites[category])} sprites encontradas")
            else:
                print(f"⚠️ Diretório não encontrado: {category_path}")
        
        # Log do total
        total_sprites = sum(len(sprite_list) for sprite_list in sprites.values())
        print(f"📊 Total de sprites carregadas: {total_sprites}")
            
    except Exception as e:
        print(f"❌ Erro ao carregar sprites: {str(e)}")
        sprites = get_fallback_sprites()
    
    return sprites

def get_fallback_sprites():
    """Sprites de fallback baseadas nos temas atuais que sabemos que existem"""
    return {
        'body': [
            'body1.png', 'body2.png', 'body3.png', 'body5.png', 'body7.png', 'body8.png',
            'body10.png', 'body12.png', 'body13.png', 'body15.png', 'body18.png', 'body19.png',
            'body20.png', 'body24.png', 'body25.png', 'body26.png', 'body28.png', 'body30.png',
            'body31.png', 'body35.png', 'body38.png'
        ],
        'head': [
            'head1.png', 'head2.png', 'head3.png', 'head8.png', 'head9.png', 'head10.png',
            'head15.png', 'head16.png', 'head17.png', 'head22.png', 'head25.png', 'head26.png',
            'head30.png', 'head32.png', 'head33.png', 'head35.png', 'head38.png', 'head39.png',
            'head40.png', 'head45.png', 'head48.png'
        ],
        'weapon': [
            'weapon1.png', 'weapon2.png', 'weapon3.png', 'weapon5.png', 'weapon8.png', 'weapon9.png',
            'weapon10.png', 'weapon12.png', 'weapon15.png', 'weapon18.png', 'weapon20.png', 'weapon22.png',
            'weapon25.png', 'weapon28.png', 'weapon30.png', 'weapon32.png', 'weapon35.png', 'weapon40.png',
            'weapon42.png', 'weapon45.png', 'weapon50.png'
        ],
        'back': [
            'back1.png', 'back2.png', 'back3.png', 'back4.png', 'back5.png', 'back6.png',
            'back7.png', 'back8.png', 'back9.png', 'back10.png', 'back11.png', 'back12.png',
            'back14.png', 'back16.png'
        ]
    }

@sprite_organizer_bp.route('/sprite-organizer')
def sprite_organizer():
    """Página principal do organizador de sprites"""
    config = load_config()
    sprites = get_all_sprites()
    
    return render_template('gamification/sprite_organizer.html', 
                         config=config, 
                         sprites=sprites)

@sprite_organizer_bp.route('/api/save-modifier', methods=['POST'])
def save_modifier():
    """Salva modificadores para uma sprite específica"""
    try:
        data = request.get_json()
        sprite_name = data.get('sprite')
        modifiers = data.get('modifiers', {})
        
        config = load_config()
        config['sprite_modifiers'][sprite_name] = modifiers
        save_config(config)
        
        return jsonify({'success': True, 'message': f'Modificadores salvos para {sprite_name}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/create-theme', methods=['POST'])
def create_theme():
    """Cria um novo tema"""
    try:
        data = request.get_json()
        theme_name = data.get('name', '').strip()
        
        if not theme_name:
            return jsonify({'success': False, 'message': 'Nome do tema é obrigatório'})
        
        config = load_config()
        
        if theme_name in config['themes']:
            return jsonify({'success': False, 'message': 'Tema já existe'})
        
        config['themes'][theme_name] = {
            'body_options': [],
            'head_options': [],
            'weapon_options': [],
            'back_options': [],
            'name_pool': []
        }
        
        save_config(config)
        return jsonify({'success': True, 'message': f'Tema "{theme_name}" criado'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/rename-theme', methods=['POST'])
def rename_theme():
    """Renomeia um tema existente"""
    try:
        data = request.get_json()
        old_name = data.get('old_name')
        new_name = data.get('new_name', '').strip()
        
        if not new_name:
            return jsonify({'success': False, 'message': 'Novo nome é obrigatório'})
        
        config = load_config()
        
        if old_name not in config['themes']:
            return jsonify({'success': False, 'message': 'Tema não encontrado'})
        
        if new_name in config['themes'] and new_name != old_name:
            return jsonify({'success': False, 'message': 'Nome já existe'})
        
        config['themes'][new_name] = config['themes'].pop(old_name)
        save_config(config)
        
        return jsonify({'success': True, 'message': f'Tema renomeado para "{new_name}"'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/delete-theme', methods=['POST'])
def delete_theme():
    """Deleta um tema"""
    try:
        data = request.get_json()
        theme_name = data.get('name')
        
        config = load_config()
        
        if theme_name not in config['themes']:
            return jsonify({'success': False, 'message': 'Tema não encontrado'})
        
        del config['themes'][theme_name]
        save_config(config)
        
        return jsonify({'success': True, 'message': f'Tema "{theme_name}" deletado'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/add-sprites-to-theme', methods=['POST'])
def add_sprites_to_theme():
    """Adiciona sprites selecionadas a um tema"""
    try:
        data = request.get_json()
        theme_name = data.get('theme')
        sprites = data.get('sprites', [])
        
        config = load_config()
        
        if theme_name not in config['themes']:
            return jsonify({'success': False, 'message': 'Tema não encontrado'})
        
        theme = config['themes'][theme_name]
        
        for sprite in sprites:
            # Determinar categoria da sprite
            if sprite.startswith('body'):
                category = 'body_options'
            elif sprite.startswith('head'):
                category = 'head_options'
            elif sprite.startswith('weapon'):
                category = 'weapon_options'
            elif sprite.startswith('back'):
                category = 'back_options'
            else:
                continue
            
            # Extrair número da sprite (ex: body5.png -> 5)
            sprite_number = int(sprite.split('.')[0][4:]) if sprite.startswith('body') else \
                           int(sprite.split('.')[0][4:]) if sprite.startswith('head') else \
                           int(sprite.split('.')[0][6:]) if sprite.startswith('weapon') else \
                           int(sprite.split('.')[0][4:]) if sprite.startswith('back') else 0
            
            # Adicionar se não estiver já presente
            if sprite_number not in theme[category]:
                theme[category].append(sprite_number)
        
        save_config(config)
        return jsonify({'success': True, 'message': f'{len(sprites)} sprites adicionadas ao tema "{theme_name}"'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/remove-sprite-from-theme', methods=['POST'])
def remove_sprite_from_theme():
    """Remove uma sprite específica de um tema"""
    try:
        data = request.get_json()
        theme_name = data.get('theme')
        sprite = data.get('sprite')
        
        config = load_config()
        
        if theme_name not in config['themes']:
            return jsonify({'success': False, 'message': 'Tema não encontrado'})
        
        theme = config['themes'][theme_name]
        
        # Determinar categoria e número da sprite
        if sprite.startswith('body'):
            category = 'body_options'
            sprite_number = int(sprite.split('.')[0][4:])
        elif sprite.startswith('head'):
            category = 'head_options'
            sprite_number = int(sprite.split('.')[0][4:])
        elif sprite.startswith('weapon'):
            category = 'weapon_options'
            sprite_number = int(sprite.split('.')[0][6:])
        elif sprite.startswith('back'):
            category = 'back_options'
            sprite_number = int(sprite.split('.')[0][4:])
        else:
            return jsonify({'success': False, 'message': 'Sprite inválida'})
        
        # Remover se estiver presente
        if sprite_number in theme[category]:
            theme[category].remove(sprite_number)
            save_config(config)
            return jsonify({'success': True, 'message': f'Sprite {sprite} removida do tema "{theme_name}"'})
        else:
            return jsonify({'success': False, 'message': 'Sprite não encontrada no tema'})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/get-config')
def get_config():
    """Retorna a configuração atual"""
    try:
        config = load_config()
        return jsonify({'success': True, 'config': config})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/import-config', methods=['POST'])
def import_config():
    """Importa uma configuração completa"""
    try:
        data = request.get_json()
        imported_config = data.get('config', {})
        
        # Validar estrutura
        if 'themes' not in imported_config or 'sprite_modifiers' not in imported_config:
            return jsonify({'success': False, 'message': 'Configuração inválida - faltam campos obrigatórios'})
        
        # Limpar campos backup_info se existir (não é necessário)
        if 'backup_info' in imported_config:
            del imported_config['backup_info']
        
        # Garantir versão
        imported_config['version'] = '1.0'
        
        # Substituir configuração atual COMPLETAMENTE
        save_config(imported_config)
        
        # Contar elementos importados
        theme_count = len(imported_config['themes'])
        modifier_count = len(imported_config['sprite_modifiers'])
        
        print(f"✅ Configuração importada: {theme_count} temas, {modifier_count} modificadores")
        
        return jsonify({
            'success': True, 
            'message': f'Configuração importada com sucesso: {theme_count} temas e {modifier_count} modificadores!',
            'theme_count': theme_count,
            'modifier_count': modifier_count
        })
        
    except Exception as e:
        print(f"❌ Erro na importação: {str(e)}")
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})

@sprite_organizer_bp.route('/api/backup-config')
def backup_config():
    """Cria backup da configuração atual com timestamp"""
    try:
        from datetime import datetime
        config = load_config()
        
        # Adicionar metadata do backup
        config['backup_info'] = {
            'created_at': datetime.now().isoformat(),
            'theme_count': len(config['themes']),
            'modifier_count': len(config['sprite_modifiers']),
            'version': config.get('version', '1.0')
        }
        
        # Nome do arquivo com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'backup_temas_{timestamp}.json'
        
        return jsonify({
            'success': True,
            'config': config,
            'suggested_filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

def export_config():
    """Exporta a configuração atual"""
    try:
        config = load_config()
        
        # Gerar código Python para o battle.py
        python_code = generate_python_code(config)
        
        return jsonify({
            'success': True, 
            'config': config,
            'python_code': python_code,
            'file_path': CONFIG_FILE
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
# 👇 INSERIR AQUI 👇
@sprite_organizer_bp.route('/api/preview-themes')
def preview_themes():
    """Gera preview visual dos temas com combinações de sprites"""
    try:
        config = load_config()
        
        if not config['themes']:
            return jsonify({'success': False, 'message': 'Nenhum tema encontrado'})
        
        preview_data = []
        
        for theme_name, theme_data in config['themes'].items():
            # Verificar se o tema tem sprites suficientes
            body_count = len(theme_data.get('body_options', []))
            head_count = len(theme_data.get('head_options', []))
            weapon_count = len(theme_data.get('weapon_options', []))
            back_count = len(theme_data.get('back_options', []))
            
            if body_count == 0 or head_count == 0 or weapon_count == 0:
                continue  # Pular temas incompletos
            
            # Gerar 3 combinações aleatórias para cada tema
            import random
            combinations = []
            
            for i in range(min(3, body_count * head_count)):  # Máximo 3 combinações
                body_num = random.choice(theme_data['body_options'])
                head_num = random.choice(theme_data['head_options'])
                weapon_num = random.choice(theme_data['weapon_options'])
                back_num = random.choice(theme_data['back_options']) if back_count > 0 else None
                
                combination = {
                    'body': f'body{body_num}.png',
                    'head': f'head{head_num}.png',
                    'weapon': f'weapon{weapon_num}.png',
                    'back': f'back{back_num}.png' if back_num else None
                }
                
                combinations.append(combination)
            
            preview_data.append({
                'theme_name': theme_name,
                'combinations': combinations,
                'stats': {
                    'bodies': body_count,
                    'heads': head_count,
                    'weapons': weapon_count,
                    'backs': back_count,
                    'total_combinations': body_count * head_count * weapon_count * (back_count or 1)
                }
            })
        
        return jsonify({
            'success': True,
            'themes': preview_data,
            'total_themes': len(preview_data)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    

@sprite_organizer_bp.route('/api/unused-sprites')
def get_unused_sprites():
    """Retorna sprites que não estão sendo usadas em nenhum tema"""
    try:
        config = load_config()
        all_sprites = get_all_sprites()
        
        # Coletar todas as sprites usadas nos temas
        used_sprites = set()
        
        for theme_name, theme_data in config['themes'].items():
            # Bodies
            for body_num in theme_data.get('body_options', []):
                used_sprites.add(f'body{body_num}.png')
            
            # Heads  
            for head_num in theme_data.get('head_options', []):
                used_sprites.add(f'head{head_num}.png')
                
            # Weapons
            for weapon_num in theme_data.get('weapon_options', []):
                used_sprites.add(f'weapon{weapon_num}.png')
                
            # Backs
            for back_num in theme_data.get('back_options', []):
                used_sprites.add(f'back{back_num}.png')
        
        # Encontrar sprites não utilizadas
        unused_sprites = {
            'body': [],
            'head': [],
            'weapon': [],
            'back': []
        }
        
        for category, sprite_list in all_sprites.items():
            for sprite in sprite_list:
                if sprite not in used_sprites:
                    unused_sprites[category].append(sprite)
        
        # Calcular estatísticas
        total_unused = sum(len(sprites) for sprites in unused_sprites.values())
        total_available = sum(len(sprites) for sprites in all_sprites.values())
        
        return jsonify({
            'success': True,
            'unused_sprites': unused_sprites,
            'stats': {
                'total_unused': total_unused,
                'total_available': total_available,
                'usage_percentage': round((total_available - total_unused) / total_available * 100, 1) if total_available > 0 else 0
            },
            'themes': list(config['themes'].keys())  # Para dropdown de adição
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@sprite_organizer_bp.route('/api/add-sprite-to-theme', methods=['POST'])
def add_sprite_to_theme():
    """Adiciona uma sprite específica a um tema"""
    try:
        data = request.get_json()
        theme_name = data.get('theme')
        sprite = data.get('sprite')
        
        config = load_config()
        
        if theme_name not in config['themes']:
            return jsonify({'success': False, 'message': 'Tema não encontrado'})
        
        theme = config['themes'][theme_name]
        
        # Determinar categoria e número da sprite
        if sprite.startswith('body'):
            category = 'body_options'
            sprite_number = int(sprite.replace('body', '').replace('.png', ''))
        elif sprite.startswith('head'):
            category = 'head_options'
            sprite_number = int(sprite.replace('head', '').replace('.png', ''))
        elif sprite.startswith('weapon'):
            category = 'weapon_options'
            sprite_number = int(sprite.replace('weapon', '').replace('.png', ''))
        elif sprite.startswith('back'):
            category = 'back_options'
            sprite_number = int(sprite.replace('back', '').replace('.png', ''))
        else:
            return jsonify({'success': False, 'message': 'Sprite inválida'})
        
        # Adicionar se não estiver presente
        if sprite_number not in theme[category]:
            theme[category].append(sprite_number)
            save_config(config)
            return jsonify({
                'success': True, 
                'message': f'Sprite {sprite} adicionada ao tema "{theme_name}"',
                'new_count': len(theme[category])
            })
        else:
            return jsonify({'success': False, 'message': 'Sprite já está no tema'})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@sprite_organizer_bp.route('/api/clean-json')
def clean_json():
    """Limpa e valida o JSON corrompido"""
    try:
        import os
        
        # Ler arquivo como texto bruto
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fazer backup
        backup_file = CONFIG_FILE + '.backup'
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Tentar corrigir problemas comuns
        lines = content.split('\n')
        
        # Mostrar linha 58 para debug
        if len(lines) >= 58:
            line_58 = lines[57]  # Array é 0-based
            print(f"Linha 58: {line_58}")
        
        # Tentar carregar e recriar JSON limpo
        try:
            # Forçar parsing até onde conseguir
            import json
            valid_json = json.loads(content)
            
            # Recriar JSON limpo
            clean_config = {
                'themes': valid_json.get('themes', {}),
                'sprite_modifiers': valid_json.get('sprite_modifiers', {}),
                'version': '1.0'
            }
            
            save_config(clean_config)
            
            return jsonify({
                'success': True,
                'message': 'JSON limpo com sucesso!',
                'backup': backup_file,
                'line_58': lines[57] if len(lines) >= 58 else 'N/A'
            })
            
        except json.JSONDecodeError as e:
            return jsonify({
                'success': False,
                'message': f'Erro na linha {e.lineno}: {e.msg}',
                'char_position': e.pos,
                'line_58': lines[57] if len(lines) >= 58 else 'N/A'
            })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@sprite_organizer_bp.route('/api/emergency-reset')
def emergency_reset():
    """Reset completo em caso de JSON corrompido"""
    try:
        import os
        from datetime import datetime
        
        # Fazer backup do arquivo corrompido
        if os.path.exists(CONFIG_FILE):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = f'{CONFIG_FILE}.corrupted_{timestamp}.bak'
            os.rename(CONFIG_FILE, backup_file)
            print(f"📁 Backup do arquivo corrompido: {backup_file}")
        
        # Criar configuração limpa
        clean_config = {
            'themes': {
                "Guerreiro azul": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []},
                "Guerreiro branco/cinza/neutro": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []},
                "Ninjas e samurais sem cores fortes": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []},
                "Guerreiro dark": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []},
                "Guerreiros coloridos para acessorios genericos": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []},
                "Guerreiros grandes": {"body_options": [], "head_options": [], "weapon_options": [], "back_options": [], "name_pool": []}
            },
            'sprite_modifiers': {
                "back12.png": {"armor": 20, "damage": 0, "hp": 0, "posture": 0},
                "back13.png": {"armor": 22, "damage": 0, "hp": 0, "posture": 0},
                "back16.png": {"armor": 0, "damage": 16, "hp": 0, "posture": 0},
                "back18.png": {"armor": 5, "damage": 20, "hp": 0, "posture": 0},
                "back21.png": {"armor": 0, "damage": 0, "hp": 8, "posture": 8}
            },
            'version': '1.0'
        }
        
        save_config(clean_config)
        
        return jsonify({
            'success': True,
            'message': f'🔧 Reset completo realizado! Backup salvo como: {backup_file if "backup_file" in locals() else "N/A"}',
            'themes_restored': len(clean_config['themes']),
            'modifiers_restored': len(clean_config['sprite_modifiers'])
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro no reset: {str(e)}'})

def generate_python_code(config):
    """Gera código Python para implementar os temas"""
    themes_code = []
    
    for theme_name, theme_data in config['themes'].items():
        theme_code = f'''
    # Tema: {theme_name}
    {{
        "name": "{theme_name}",
        "body_options": {theme_data['body_options']},
        "head_options": {theme_data['head_options']}, 
        "weapon_options": {theme_data['weapon_options']},
        "back_options": {theme_data['back_options']},
        "name_pool": {theme_data['name_pool'] if theme_data['name_pool'] else [f'Guerreiro {theme_name}', f'Defensor {theme_name}', f'Campeão {theme_name}']}
    }}'''
        themes_code.append(theme_code)
    
    full_code = f'''
def initialize_enemy_themes():
    """Inicializa os temas de inimigos"""
    if EnemyTheme.query.count() > 0:
        return  # Já inicializado
    
    themes = [{','.join(themes_code)}]
    
    # Criar todos os temas
    for theme_data in themes:
        theme = EnemyTheme(
            name=theme_data["name"],
            body_options=json.dumps(theme_data["body_options"]),
            head_options=json.dumps(theme_data["head_options"]),
            weapon_options=json.dumps(theme_data["weapon_options"]),
            back_options=json.dumps(theme_data["back_options"]),
            name_pool=json.dumps(theme_data["name_pool"])
        )
        db.session.add(theme)
    
    db.session.commit()
    print(f"{{len(themes)}} temas de inimigos inicializados!")

def get_equipment_modifiers():
    """Retorna modificadores dos equipamentos configurados"""
    # Você deve copiar os modificadores do arquivo JSON gerado
    return {{}}  # Placeholder - adicione seus modificadores aqui
'''
    
    return full_code