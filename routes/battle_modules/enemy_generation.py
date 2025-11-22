# routes/battle/enemy_generation.py - Sistema de geração de inimigos e temas
import math
import random
from datetime import datetime, timedelta, timezone
import json
import os

from database import db
from models import Player, Boss, BestiaryEntry, PlayerTalent, EnemyTheme, GenericEnemy, PlayerProgress

# Cache para configuração dos temas
_enemy_themes_config = None
# Cache para configuração de nomes
_enemy_names_config = None
# Inicializar proporções vazias - serão carregadas do JSON
_theme_proportions = {}

# Mapeamento Raridade → Ranks Compatíveis
RARITY_COMPATIBLE_RANKS = {
    1: ["F", "E", "D", "C"],                    # Comum: 15-69%
    2: ["D", "C", "B", "A"],                   # Raro: 38-99%  
    3: ["B", "A", "S", "S+"],                   # Épico: 70-139%
    4: ["S", "S+", "S++", "S+++", "Supremo"]   # Lendário: 100%+
}

RANK_RANGES = {
    "F": (15, 29), "E": (30, 37), "D": (38, 54), "C": (55, 69),
    "B": (70, 84), "A": (85, 99), "S": (100, 119), 
    "S+": (120, 139), "S++": (140, 169), "S+++": (170, 199),
    "Supremo": (200, 999)
}

# Temas por força (para fallback inteligente)
STRONG_THEMES = ["Guerreiros grandes", "Guerreiros coloridos para acessorios genericos", "Guerreiro dark"]
WEAK_THEMES = ["Guerreiros pouca roupa", "Mages", "Guerreiro azul"]

# Variáveis globais simplificadas
EQUIPMENT_BY_TIER_AND_THEME = {}  # {"theme_name": {"weapon": {1: [...], 2: [...]}}}
TIER_RANGES = {1: (0, 10), 2: (10, 20), 3: (20, 30), 4: (30, 40), 5: (40, 50), 6: (50, 999)}

# Temas proibidos por raridade (baseado nas limitações de equipamentos)
FORBIDDEN_THEMES_BY_RARITY = {
    1: ["Guerreiros grandes", "Ninjas e samurais sem cores fortes", "Guerreiro dark"],  # Comum: temas muito fortes
    4: ["Guerreiros pouca roupa", "Mages"]  # Lendário: temas muito fracos
}

def load_enemy_skills_config():
    """Carrega configuração de skills dos inimigos"""
    try:
        skills_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_skills_data.json')
        with open(skills_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar skills data: {e}")
        return {}

def load_equipment_skills_config():
    """Carrega configuração de probabilidades e skills por equipamento"""
    try:
        equipment_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_equipment_skills.json')
        with open(equipment_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar equipment skills config: {e}")
        return {}

def calculate_skill_probability(enemy_number, rarity, equipment_file):
    """Calcula probabilidade total de ter skill para um equipamento específico"""
    # Probabilidade por enemy_number (+1% a cada 5 inimigos)
    number_prob = min(20, ((enemy_number - 1) // 5) + 1)  # Máximo 20%
    
    # Probabilidade por raridade
    rarity_probs = {1: 2, 2: 4, 3: 7, 4: 10}
    rarity_prob = rarity_probs.get(rarity, 2)
    
    # Probabilidade do equipamento
    equipment_config = load_equipment_skills_config()
    equipment_prob = equipment_config.get(equipment_file, {}).get('skill_probability', 0)
    
    # Somar probabilidades (cumulativa)
    total_prob = number_prob + rarity_prob + equipment_prob
    
    print(f"Probabilidade skill para {equipment_file}: {number_prob}% (number) + {rarity_prob}% (rarity) + {equipment_prob}% (equipment) = {total_prob}%")
    
    return total_prob

def generate_enemy_skills(enemy_number, rarity, selected_equipment):
    """Gera skills para o inimigo baseado nos equipamentos selecionados"""
    equipment_config = load_equipment_skills_config()
    selected_skills = {}
    skill_cooldown_reductions = {}
    
    # Debug: mostrar configuração carregada
    print(f"🎯 SKILLS DEBUG: Configuração carregada com {len(equipment_config)} equipamentos")
    
    # Verificar cada equipamento (head, body, weapon - ignorar back)
    equipment_types = ['head', 'body', 'weapon']
    
    for eq_type in equipment_types:
        equipment_file = selected_equipment.get(eq_type)
        if not equipment_file:
            print(f"⚠️ {eq_type}: Equipamento não encontrado")
            continue
            
        print(f"🔍 VERIFICANDO {eq_type}: {equipment_file}")
        
        # Verificar se equipamento existe na configuração
        if equipment_file not in equipment_config:
            print(f"❌ {eq_type} ({equipment_file}): NÃO tem skills disponíveis no JSON")
            continue
        
        # Mostrar skills possíveis
        possible_skills = equipment_config[equipment_file].get('possible_skills', [])
        skill_probability = equipment_config[equipment_file].get('skill_probability', 0)
        
        print(f"📋 {eq_type} ({equipment_file}):")
        print(f"   Skills possíveis: {possible_skills}")
        print(f"   Probabilidade base: {skill_probability}%")
        
        # Calcular probabilidade total
        total_prob = calculate_skill_probability(enemy_number, rarity, equipment_file)
        
        # Fazer rolagem
        roll = random.random() * 100
        print(f"🎲 Rolagem {eq_type} ({equipment_file}): {roll:.1f}% (precisa <= {total_prob}%)")
        
        if roll <= total_prob:
            # Tem skill! Escolher uma aleatória da lista
            if possible_skills:
                chosen_skill = random.choice(possible_skills)
                print(f"✅ Skill escolhida para {eq_type}: {chosen_skill}")
                
                # Verificar se já temos esta skill (duplicata)
                if chosen_skill in selected_skills:
                    print(f"⚡ Skill {chosen_skill} duplicada! Reduzindo tempo de recarga pela metade")
                    skill_cooldown_reductions[chosen_skill] = 0.5
                else:
                    selected_skills[chosen_skill] = eq_type
                    skill_cooldown_reductions[chosen_skill] = 1.0
        else:
            print(f"❌ Sem skill para {eq_type}")
    
    print(f"🎯 RESULTADO FINAL: {len(selected_skills)} skills selecionadas: {list(selected_skills.keys())}")
    return selected_skills, skill_cooldown_reductions

def load_enemy_themes_config():
    """Carrega configuração dos temas de inimigos do JSON"""
    global _enemy_themes_config
    if _enemy_themes_config is None:
        try:
            # Caminho correto: volta um diretório do routes/ para chegar na raiz
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_themes_config.json')
            print(f"🔍 Tentando carregar arquivo de: {config_path}")
            
            if not os.path.exists(config_path):
                print(f"❌ Arquivo não encontrado em: {config_path}")
                _enemy_themes_config = {}
                return _enemy_themes_config
                
            with open(config_path, 'r', encoding='utf-8') as f:
                _enemy_themes_config = json.load(f)
            print("✅ Configuração de temas carregada com sucesso")
            print(f"📊 Temas encontrados no JSON: {list(_enemy_themes_config.get('themes', {}).keys())}")
        except Exception as e:
            print(f"❌ Erro ao carregar configuração de temas: {e}")
            print(f"❌ Caminho tentado: {config_path}")
            _enemy_themes_config = {}
    return _enemy_themes_config

def load_action_patterns_config():
    """Carrega padrões de ações dos temas do JSON"""
    config = load_enemy_themes_config()
    if config and 'action_patterns' in config:
        return config['action_patterns']
    else:
        print("⚠️ Padrões de ação não encontrados no JSON, usando padrão genérico")
        return {
            "default": ["attack", "attack_skill", "attack", "buff", "attack", "debuff"]
        }
    
def calculate_actions_per_turn_probability(enemy_number):
    """
    Calcula probabilidades de 1, 2 ou 3 ações baseado no enemy_number
    Progressão gradual por faixas
    """
    if enemy_number <= 5:
        return {"1": 0.90, "2": 0.10, "3": 0.00}
    elif enemy_number <= 10:
        return {"1": 0.85, "2": 0.15, "3": 0.00}
    elif enemy_number <= 15:
        return {"1": 0.75, "2": 0.25, "3": 0.00}
    elif enemy_number <= 20:
        return {"1": 0.65, "2": 0.30, "3": 0.05}
    elif enemy_number <= 25:
        return {"1": 0.50, "2": 0.40, "3": 0.10}
    elif enemy_number <= 30:
        return {"1": 0.40, "2": 0.45, "3": 0.15}
    elif enemy_number <= 35:
        return {"1": 0.30, "2": 0.50, "3": 0.20}
    elif enemy_number <= 40:
        return {"1": 0.25, "2": 0.50, "3": 0.25}
    elif enemy_number <= 45:
        return {"1": 0.20, "2": 0.55, "3": 0.25}
    elif enemy_number <= 50:
        return {"1": 0.15, "2": 0.55, "3": 0.30}
    elif enemy_number <= 55:
        return {"1": 0.10, "2": 0.55, "3": 0.35}
    elif enemy_number <= 60:
        return {"1": 0.05, "2": 0.55, "3": 0.40}
    elif enemy_number <= 65:
        return {"1": 0.05, "2": 0.50, "3": 0.45}
    elif enemy_number <= 70:
        return {"1": 0.00, "2": 0.55, "3": 0.45}
    elif enemy_number <= 75:
        return {"1": 0.00, "2": 0.50, "3": 0.50}
    else:  # 76-100
        return {"1": 0.00, "2": 0.45, "3": 0.55}
    
def generate_action_pattern(theme_name, enemy_skills):
    """
    Gera o padrão de ações do inimigo baseado no tema e skills disponíveis
    OPÇÃO C - HÍBRIDO: usa padrão base do tema, ajusta se não tiver skill
    
    Args:
        theme_name: Nome do tema do inimigo
        enemy_skills: Lista de skills do inimigo (formato: [{"skill_id": 1, "type": "attack"}, ...])
    
    Returns:
        Lista com padrão de ações ajustado
    """
    # Carregar padrão base do tema
    patterns_config = load_action_patterns_config()
    base_pattern = patterns_config.get(theme_name, patterns_config.get("default", ["attack", "attack", "attack"]))
    
    print(f"🎯 Gerando padrão para tema '{theme_name}'")
    print(f"   Padrão base: {base_pattern}")
    
    # Analisar quais skills o inimigo TEM
    has_attack_skill = False
    has_buff = False
    has_debuff = False
    attack_skills_list = []
    
    if enemy_skills:
        skills_list = json.loads(enemy_skills) if isinstance(enemy_skills, str) else enemy_skills
        for skill in skills_list:
            skill_type = skill.get('type')
            if skill_type == 'attack':
                has_attack_skill = True
                attack_skills_list.append(skill['skill_id'])
            elif skill_type == 'buff':
                has_buff = True
            elif skill_type == 'debuff':
                has_debuff = True
    
    print(f"   Skills disponíveis: attack_skill={has_attack_skill}, buff={has_buff}, debuff={has_debuff}")
    
    # Ajustar padrão baseado nas skills disponíveis
    adjusted_pattern = []
    attack_skill_counter = 0  # Para alternar entre múltiplas attack skills
    
    for action in base_pattern:
        if action == "attack_skill":
            if has_attack_skill:
                # Se tem múltiplas attack skills, marcar para alternância
                if len(attack_skills_list) > 1:
                    adjusted_pattern.append(f"attack_skill_{attack_skill_counter % len(attack_skills_list)}")
                    attack_skill_counter += 1
                else:
                    adjusted_pattern.append("attack_skill")
            else:
                # NÃO TEM attack skill → substituir por ataque básico
                adjusted_pattern.append("attack")
                print(f"   ⚠️ Substituindo 'attack_skill' por 'attack' (inimigo não tem attack skill)")
        
        elif action == "buff_debuff":
            # Ação unificada: usa buff OU debuff (o que tiver disponível)
            if has_buff or has_debuff:
                adjusted_pattern.append("buff_debuff")
            else:
                # NÃO TEM nem buff nem debuff → PULAR
                print(f"   ⚠️ Pulando 'buff_debuff' (inimigo não tem buff nem debuff)")
                # Não adiciona nada ao pattern
        
        else:
            # Ação normal (attack), manter
            adjusted_pattern.append(action)
    
    # Garantir que sempre tenha pelo menos uma ação
    if not adjusted_pattern:
        adjusted_pattern = ["attack"]
        print(f"   ⚠️ Padrão vazio! Adicionando ataque básico como fallback")
    
    print(f"   ✅ Padrão final: {adjusted_pattern}")
    return adjusted_pattern

def load_enemy_names_config():
    """Carrega configuração de nomes dos inimigos do JSON"""
    global _enemy_names_config
    if _enemy_names_config is None:
        try:
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_names_config.json')
            print(f"🔍 Tentando carregar arquivo de nomes de: {config_path}")
            
            if not os.path.exists(config_path):
                print(f"❌ Arquivo de nomes não encontrado em: {config_path}")
                _enemy_names_config = {}
                return _enemy_names_config
                
            with open(config_path, 'r', encoding='utf-8') as f:
                _enemy_names_config = json.load(f)
            print("✅ Configuração de nomes carregada com sucesso")
        except Exception as e:
            print(f"❌ Erro ao carregar configuração de nomes: {e}")
            _enemy_names_config = {}
    return _enemy_names_config

def update_json_with_tiers():
    """EXECUTAR UMA VEZ para atualizar o JSON com tiers"""
    import json
    import os
    
    # Caminho do JSON
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'game.data', 'enemy_themes_config.json')
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # Adicionar tier e total_points
    for equipment_file, modifiers in config['sprite_modifiers'].items():
        total_points = sum(modifiers.values())
        
        # Calcular tier
        tier = 6  # Default
        for t, (min_val, max_val) in TIER_RANGES.items():
            if min_val <= total_points < max_val:
                tier = t
                break
        
        # Adicionar campos
        config['sprite_modifiers'][equipment_file]['total_points'] = total_points
        config['sprite_modifiers'][equipment_file]['tier'] = tier
    
    # Salvar JSON
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✅ JSON atualizado com tiers!")

def initialize_equipment_tiers_smart():
    """Initialize smart equipment tier system using actual point values"""
    global EQUIPMENT_BY_TIER_AND_THEME
    
    print("🔧 Initializing smart equipment tier system with CORRECT tier classification...")
    
    config = load_enemy_themes_config()
    if not config:
        print("❌ Failed to load config")
        return
    
    sprite_modifiers = config.get('sprite_modifiers', {})
    themes_data = config.get('themes', {})
    
    EQUIPMENT_BY_TIER_AND_THEME.clear()
    
    # Build theme-tier structure
    for theme_name, theme_config in themes_data.items():
        EQUIPMENT_BY_TIER_AND_THEME[theme_name] = {
            "back": {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
            "body": {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
            "head": {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
            "weapon": {1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
        }
        
        # Classify equipment by actual point values
        for equipment_type in ['back', 'body', 'head', 'weapon']:
            options_key = f'{equipment_type}_options'
            if options_key not in theme_config:
                continue
            
            for option in theme_config[options_key]:
                equipment_file = f"{equipment_type}{option}.png"
                
                if equipment_file in sprite_modifiers:
                    total_points = sprite_modifiers[equipment_file].get('total_points', 0)
                    
                    # Classify into correct tier based on actual points
                    correct_tier = calculate_tier_for_points(total_points)
                    
                    EQUIPMENT_BY_TIER_AND_THEME[theme_name][equipment_type][correct_tier].append(equipment_file)
                    
        # Debug: show tier distribution for first theme
        if theme_name == list(themes_data.keys())[0]:
            for eq_type in ['body', 'head', 'weapon']:
                for tier in range(1, 7):
                    items = EQUIPMENT_BY_TIER_AND_THEME[theme_name][eq_type][tier]
                    if items:
                        print(f"   DEBUG {theme_name} {eq_type} tier {tier}: {len(items)} items")
                        # Show point ranges for verification
                        points = [sprite_modifiers[item].get('total_points', 0) for item in items[:3]]
                        print(f"      Sample points: {points}")
    
    print("🔍 VERIFICAÇÃO DE CLASSIFICAÇÃO:")
    test_items = ["body3.png", "head22.png", "weapon58.png"]
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})

    for item in test_items:
        if item in sprite_modifiers:
            points = sprite_modifiers[item].get('total_points', 0)
            calculated_tier = calculate_tier_for_points(points)
            print(f"   {item}: {points} pontos → tier {calculated_tier}")
    print("✅ Smart equipment tier system initialized with CORRECT classification!")

def get_equipment_by_tier_direct(theme_name, equipment_type, target_tier, recent_equipment=None):
    """Get equipment directly by tier"""
    
    print(f"🔧 DEBUG SELECTION: Procurando {equipment_type} tier {target_tier} no tema {theme_name}")
    
    if theme_name not in EQUIPMENT_BY_TIER_AND_THEME:
        print(f"❌ Theme {theme_name} not found in EQUIPMENT_BY_TIER_AND_THEME")
        return None
    
    theme_data = EQUIPMENT_BY_TIER_AND_THEME[theme_name]
    if equipment_type not in theme_data:
        print(f"❌ Equipment type {equipment_type} not found")
        return None
    
    # Show what's available in target tier
    available_in_tier = theme_data[equipment_type][target_tier]
    print(f"🔧 DEBUG: Tier {target_tier} tem {len(available_in_tier)} items: {available_in_tier[:3]}")
    
    # Try exact tier first, then adjacent
    tiers_to_try = [target_tier]
    if target_tier > 1:
        tiers_to_try.append(target_tier - 1)
    if target_tier < 6:
        tiers_to_try.append(target_tier + 1)
    
    for tier in tiers_to_try:
        available = theme_data[equipment_type][tier].copy()
        original_count = len(available)  # ← ADICIONAR
        
        if recent_equipment:
                    before_filter = available.copy()
                    available = [eq for eq in available if eq not in recent_equipment]
                    
                    filtered_out = [eq for eq in before_filter if eq in recent_equipment]
                    
                    print(f"🔍 DEBUG FILTRO: {equipment_type} tier {tier}: {original_count}→{len(available)} itens após filtro")
                    print(f"    Recent equipment: {list(recent_equipment)}")
                    print(f"    Filtrados por repetição: {filtered_out}")
                    print(f"    Disponível após filtro: {available[:5]}")
        
        if available:
            selected = random.choice(available)
            print(f"🔧 DEBUG: SELECIONADO {selected} do tier {tier}")
            return selected
    
    print(f"❌ Tier {target_tier} não disponível, tentando fallback inteligente")
    
    # Fallback inteligente: tenta tiers adjacentes de forma sistemática
    fallback_tiers = []
    
    # Adicionar tiers em ordem de proximidade
    for distance in range(1, 7):
        # Tier abaixo
        lower_tier = target_tier - distance
        if lower_tier >= 1 and lower_tier not in [target_tier]:
            fallback_tiers.append(lower_tier)
        
        # Tier acima  
        higher_tier = target_tier + distance
        if higher_tier <= 6 and higher_tier not in [target_tier]:
            fallback_tiers.append(higher_tier)
    
    # Tentar cada tier de fallback
    for fallback_tier in fallback_tiers:
        available = theme_data[equipment_type][fallback_tier].copy()
        original_count = len(available)  # ← ADICIONAR
        
        if recent_equipment:
            available = [eq for eq in available if eq not in recent_equipment]
            print(f"🔍 DEBUG FILTRO FALLBACK: {equipment_type} tier {fallback_tier}: {original_count}→{len(available)} itens após filtro")  # ← ADICIONAR
            print(f"    Recent equipment: {recent_equipment}")
            print(f"    Disponível após filtro: {available[:3]}")
        
        if available:
            selected = random.choice(available)
            print(f"🔧 DEBUG: FALLBACK INTELIGENTE selecionou {selected} do tier {fallback_tier} (target era {target_tier})")
            return selected
        else:
            print(f"🔧 DEBUG: Fallback tier {fallback_tier} também vazia, continuando...")
    
    print(f"❌ ERRO: Nenhuma tier disponível para {equipment_type} no tema {theme_name}")
    return None

def calculate_tier_for_points(target_points):
    """Calculate tier needed for target points"""
    for tier, (min_val, max_val) in TIER_RANGES.items():
        if min_val <= target_points < max_val:
            return tier
    return 6

def get_equipment_points_from_json(equipment_file):
    """Get points from JSON"""
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})
    
    if equipment_file in sprite_modifiers:
        total_points = sprite_modifiers[equipment_file].get('total_points', 0)
        print(f"🔍 DEBUG POINTS: {equipment_file} → {total_points} pontos")
        return total_points
    return 0

def get_equipment_tier_from_json(equipment_file):
    """Get tier from JSON"""
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})
    
    if equipment_file in sprite_modifiers:
        return sprite_modifiers[equipment_file].get('tier', 3)
    return 3

def smart_fallback(target_rarity, current_total, target_range, enemy_number, player_id):
    """Intelligent fallback"""
    
    target_points = (target_range[0] + target_range[1]) // 2
    need_more_power = current_total < target_points
    
    if need_more_power:
        print(f"🔥 SMART FALLBACK: Need MORE power, using STRONG themes")
        fallback_themes = STRONG_THEMES
    else:
        print(f"🔥 SMART FALLBACK: Need LESS power, using WEAK themes")
        fallback_themes = WEAK_THEMES
    
    for theme_name in fallback_themes:
        theme = EnemyTheme.query.filter_by(name=theme_name).first()
        if theme:
            try:
                enemy = generate_enemy_by_theme(theme.id, enemy_number, player_id)
                if enemy:
                    print(f"✅ Smart fallback successful with {theme_name}")
                    return enemy
            except Exception as e:
                print(f"❌ Smart fallback failed for {theme_name}: {e}")
                continue
    
    print("❌ All smart fallback attempts failed!")
    return None

def calculate_total_modifiers(equipment_dict):
    """Calcula total de pontos dos modificadores usando total_points do JSON"""
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})
    
    total = 0
    print(f"🔍 DEBUG TOTAL CALCULATION (USANDO total_points):")
    for equipment_type, equipment_file in equipment_dict.items():
        if equipment_file and equipment_file in sprite_modifiers:
            # USAR total_points em vez de sum(modifiers.values())
            points = sprite_modifiers[equipment_file].get('total_points', 0)
            total += points
            print(f"   {equipment_type}: {equipment_file} = {points} points")
        elif equipment_file:
            print(f"   {equipment_type}: {equipment_file} = NOT FOUND IN MODIFIERS")
    print(f"   TOTAL: {total}")
    return total

def get_rank_from_total_modifiers(total_modifiers):
    """Get rank based on total modifier points"""
    for rank, (min_val, max_val) in RANK_RANGES.items():
        if min_val <= total_modifiers <= max_val:
            return rank
    return "Supremo" if total_modifiers > 200 else "F"

def is_rank_compatible_with_rarity(current_rank, rarity, tolerance=0.1):
    """Check if current rank is compatible with rarity (±10% tolerance)"""
    compatible_ranks = RARITY_COMPATIBLE_RANKS[rarity]
    
    # Direct compatibility check
    if current_rank in compatible_ranks:
        return True
    
    # Check with tolerance
    current_min, current_max = RANK_RANGES[current_rank]
    
    for comp_rank in compatible_ranks:
        comp_min, comp_max = RANK_RANGES[comp_rank]
        
        # Calculate tolerance range
        tolerance_range = (current_max - current_min) * tolerance
        
        # Check overlap with tolerance
        if (current_min - tolerance_range <= comp_max and 
            current_max + tolerance_range >= comp_min):
            return True
    
    return False

def get_target_range_for_rarity(rarity):
    """Get target modifier range for given rarity"""
    # Faixas corretas baseadas nos ranks compatíveis
    ranges = {
        1: (15, 70),   # Comum: F, E, D, C
        2: (30, 100),  # Raro: E, D, C, B, A
        3: (55, 120),  # Épico: C, B, A, S  
        4: (100, 999)  # Lendário: S+
    }
    return ranges.get(rarity, (15, 70))

def get_equipment_tier(equipment_file):
    """Get tier of equipment based on total modifier points (will be implemented later)"""
    # PLACEHOLDER - será implementado com estruturas de dados
    return 3  # Default tier

def get_theme_equipment_by_tier(theme_config, equipment_type, tier, recent_equipment=None):
    """Get equipment of specific tier from theme, avoiding recent ones"""
    # PLACEHOLDER - será implementado com estruturas de dados
    available_options = theme_config.get(f'{equipment_type}_options', [])
    
    # Filter out recent equipment
    if recent_equipment:
        available_options = [opt for opt in available_options 
                           if f"{equipment_type}{opt}.png" not in recent_equipment]
    
    if available_options:
        selected = random.choice(available_options)
        return f"{equipment_type}{selected}.png"
    
    # Fallback to any option if all are recent
    if theme_config.get(f'{equipment_type}_options'):
        selected = random.choice(theme_config[f'{equipment_type}_options'])
        return f"{equipment_type}{selected}.png"
    
    return None

def find_weakest_equipment_type(equipment_dict):
    """Find equipment type with lowest modifier points"""
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})
    
    min_points = float('inf')
    weakest_type = 'body'  # Default fallback
    
    for eq_type, eq_file in equipment_dict.items():
        if eq_file and eq_file in sprite_modifiers:
            points = sum(sprite_modifiers[eq_file].values())
            if points < min_points:
                min_points = points
                weakest_type = eq_type
    
    return weakest_type

def find_strongest_equipment_type(equipment_dict):
    """Find equipment type with highest modifier points"""
    config = load_enemy_themes_config()
    sprite_modifiers = config.get('sprite_modifiers', {})
    
    max_points = -1
    strongest_type = 'weapon'  # Default fallback
    
    for eq_type, eq_file in equipment_dict.items():
        if eq_file and eq_file in sprite_modifiers:
            points = sum(sprite_modifiers[eq_file].values())
            if points > max_points:
                max_points = points
                strongest_type = eq_type
    
    return strongest_type

def update_theme_proportions():
    """Atualiza as proporções dos temas baseado no JSON carregado"""
    global _theme_proportions
    _theme_proportions = get_theme_proportions()

def get_recent_equipment(player_id, limit=5):
    """Get recently used equipment"""
    if not player_id:
        print("⚠️ ANTI-REPETIÇÃO: player_id é None, retornando set vazio")
        return set()
        
    from models import EnemyEquipmentHistory
    recent = EnemyEquipmentHistory.query.filter_by(player_id=player_id)\
        .order_by(EnemyEquipmentHistory.created_at.desc())\
        .limit(limit).all()
    
    recent_equipment = set()
    for item in recent:
        recent_equipment.add(item.equipment_id)
    
    print(f"🔍 ANTI-REPETIÇÃO: Encontrados {len(recent)} registros no histórico para player {player_id}")
    print(f"   Equipment IDs: {list(recent_equipment)}")
    
    return recent_equipment

def add_equipment_to_history(player_id, equipment_type, equipment_id):
    """Adiciona equipamento ao histórico e mantém limite de 150 registros"""
    if not player_id:
        print("⚠️ HISTÓRICO: player_id é None, não salvando no histórico")
        return
        
    from models import EnemyEquipmentHistory
    
    print(f"💾 HISTÓRICO: Salvando {equipment_type}={equipment_id} para player {player_id}")
    
    # Adicionar novo registro
    history_entry = EnemyEquipmentHistory(
        player_id=player_id,
        equipment_type=equipment_type,
        equipment_id=equipment_id
    )
    db.session.add(history_entry)
    
    # Manter apenas os últimos 150 registros por player
    total_count = EnemyEquipmentHistory.query.filter_by(player_id=player_id).count()
    if total_count >= 150:
        oldest_entries = EnemyEquipmentHistory.query.filter_by(player_id=player_id)\
            .order_by(EnemyEquipmentHistory.created_at.asc())\
            .limit(total_count - 149).all()
        
        for entry in oldest_entries:
            db.session.delete(entry)
        
        print(f"🧹 HISTÓRICO: Removidos {len(oldest_entries)} registros antigos")

def select_theme_by_proportion(last_theme_used, allowed_themes=None):
    """Seleciona tema baseado nas proporções, evitando repetição consecutiva"""
    print(f"🔍 DEBUG: _theme_proportions = {_theme_proportions}")
    print(f"🔍 DEBUG: _theme_proportions.keys() = {list(_theme_proportions.keys())}")
    
    if allowed_themes is None:
        available_themes = list(_theme_proportions.keys())
    else:
        available_themes = [t for t in allowed_themes if t in _theme_proportions]
        print(f"🔍 DEBUG: Temas filtrados fornecidos: {allowed_themes}")
        print(f"🔍 DEBUG: Temas válidos após filtro: {available_themes}")
    
    print(f"🔍 DEBUG: available_themes inicial = {available_themes}")
    
    # Remover último tema usado para evitar consecutivos
    if last_theme_used and last_theme_used in available_themes:
        available_themes.remove(last_theme_used)
        print(f"🎲 Removendo tema '{last_theme_used}' para evitar repetição")
    
    # Se não sobrou nenhum tema, usar todos (fallback)
    if not available_themes:
        available_themes = list(_theme_proportions.keys())
        print("🔄 Todos os temas removidos, usando lista completa")
    
    # Criar lista ponderada baseada nas proporções
    weighted_themes = []
    for theme in available_themes:
        weight = _theme_proportions.get(theme, 1)  # Peso padrão 1 se não encontrado
        weighted_themes.extend([theme] * weight)
    
    selected = random.choice(weighted_themes)
    print(f"🎯 Tema selecionado: {selected}")
    return selected

def get_theme_proportions():
    """Retorna as proporções dos temas baseadas no JSON carregado"""
    config = load_enemy_themes_config()
    if config and 'themes' in config:
        # Se o JSON tem os temas, distribuir proporcionalmente
        themes = list(config['themes'].keys())
        total_themes = len(themes)
        
        # Distribuição mais equilibrada
        proportions = {}
        for theme in themes:
            if "coloridos" in theme:
                proportions[theme] = 23
            elif "dark" in theme or "Dark" in theme:
                proportions[theme] = 11
            elif "redish" in theme or "red" in theme:
                proportions[theme] = 13
            elif "branco" in theme or "neutro" in theme:
                proportions[theme] = 12
            elif "azul" in theme and "claro" in theme:
                proportions[theme] = 4
            elif "pouca roupa" in theme:
                proportions[theme] = 10
            elif "Ninja" in theme or "samurai" in theme:
                proportions[theme] = 10
            elif "grandes" in theme:
                proportions[theme] = 6
            elif "Mage" in theme:
                proportions[theme] = 4
            elif "only hat" in theme:
                proportions[theme] = 7
            else:
                proportions[theme] = 0  # Padrão para temas não mapeados
        
        return proportions
    else:
        # Fallback para proporções padrão
        return _theme_proportions

def calculate_enemy_base_stats(enemy_number):
    """Calcula estatísticas base do inimigo baseado no número"""
    base_hp = int(30 + (enemy_number ** 1.15) / 1.8)
    base_damage = int(8 + (enemy_number * 0.16))
    base_posture = 50 + (enemy_number * 7)
    base_block = min(25, 5 + (enemy_number * 0.2))
    
    return {
        'hp': base_hp,
        'damage': base_damage,
        'posture': base_posture,
        'block': base_block
    }

def calculate_rarity_chances(enemy_number):
    """Calcula as chances de raridade baseado no número do inimigo - INTERPOLAÇÃO LINEAR"""
    
    # Pontos de controle da progressão desejada
    control_points = {
        1:   {'comum': 80.2, 'raro': 15.8, 'epico': 3.8,  'lendario': 0.2},
        5:   {'comum': 67.1, 'raro': 25.4, 'epico': 6.5,  'lendario': 1.0},
        9:   {'comum': 54.8, 'raro': 32.1, 'epico': 11.3, 'lendario': 1.8},
        15:  {'comum': 41.2, 'raro': 38.6, 'epico': 17.2, 'lendario': 3.0},
        25:  {'comum': 22.1, 'raro': 43.2, 'epico': 29.7, 'lendario': 5.0},
        35:  {'comum': 12.5, 'raro': 35.8, 'epico': 44.7, 'lendario': 7.0},
        50:  {'comum': 6.8,  'raro': 22.4, 'epico': 60.8, 'lendario': 10.0},
        75:  {'comum': 3.2,  'raro': 10.1, 'epico': 71.7, 'lendario': 15.0},
        100: {'comum': 1.8,  'raro': 4.2,  'epico': 74.0, 'lendario': 20.0}
    }
    
    # Encontrar os dois pontos mais próximos para interpolação
    enemy_numbers = sorted(control_points.keys())
    
    # Se for exato, usar valor direto
    if enemy_number in control_points:
        values = control_points[enemy_number]
        return {
            1: values['comum'],
            2: values['raro'], 
            3: values['epico'],
            4: values['lendario']
        }
    
    # Interpolação linear entre dois pontos
    if enemy_number <= 1:
        values = control_points[1]
    elif enemy_number >= 100:
        values = control_points[100]
    else:
        # Encontrar pontos anterior e posterior
        lower = max([x for x in enemy_numbers if x <= enemy_number])
        upper = min([x for x in enemy_numbers if x >= enemy_number])
        
        # Calcular fator de interpolação
        factor = (enemy_number - lower) / (upper - lower)
        
        # Interpolar cada raridade
        values = {}
        for rarity in ['comum', 'raro', 'epico', 'lendario']:
            lower_val = control_points[lower][rarity]
            upper_val = control_points[upper][rarity]
            values[rarity] = lower_val + factor * (upper_val - lower_val)
    
    return {
        1: values['comum'],
        2: values['raro'], 
        3: values['epico'],
        4: values['lendario']
    }

def apply_rarity_modifiers(base_stats, rarity):
    """Aplica modificadores de raridade às estatísticas"""
    modifiers = {
        1: {'hp': 1.0, 'damage': 1.0, 'posture': 1.0},     # Comum
        2: {'hp': 1.1, 'damage': 1.1, 'posture': 1.05},    # Raro
        3: {'hp': 1.25, 'damage': 1.2, 'posture': 1.15},   # Épico
        4: {'hp': 1.5, 'damage': 1.4, 'posture': 1.25}     # Lendário
    }
    
    mod = modifiers[rarity]
    return {
        'hp': int(base_stats['hp'] * mod['hp']),
        'damage': int(base_stats['damage'] * mod['damage']),
        'posture': int(base_stats['posture'] * mod['posture']),
        'block': base_stats['block']  # Bloqueio não é afetado por raridade
    }

def check_and_create_boss_milestone(progress):
    """Verifica e cria boss especial para milestone (múltiplos de 20)"""
    if progress.generic_enemies_defeated % 20 != 0:
        return None
    
    boss_number = progress.generic_enemies_defeated // 20
    
    # Verificar se o boss já existe
    existing_boss = Boss.query.filter_by(region=boss_number).first()
    if existing_boss:
        return existing_boss
    
    # Criar novo boss especial
    boss_names = [
        "Guardião das Trevas",
        "Senhor da Ignorância", 
        "Arcano Corrompido",
        "Tirano do Esquecimento",
        "Imperador das Sombras"
    ]
    
    boss_descriptions = [
        "Um guardião antigo que protege os segredos perdidos.",
        "Senhor supremo que se alimenta da ignorância alheia.",
        "Mago corrompido pelos poderes das trevas.",
        "Tirano que faz as pessoas esquecerem seus sonhos.",
        "Imperador que governa sobre as sombras da mente."
    ]
    
    name_index = (boss_number - 1) % len(boss_names)
    
    base_hp = 150 + (boss_number * 100)  # HP escalável
    
    new_boss = Boss(
        name=boss_names[name_index],
        hp=base_hp,
        max_hp=base_hp,
        description=boss_descriptions[name_index],
        region=boss_number,
        image=f'boss{((boss_number - 1) % 5) + 1}.png'  # Rotacionar entre boss1-boss5.png
    )
    
    db.session.add(new_boss)
    db.session.commit()
    
    print(f"👑 Boss milestone criado: {new_boss.name} (Região {boss_number})")
    return new_boss

def clean_expired_enemies():
    """Remove inimigos expirados do banco de dados (limpeza de manutenção)"""
    expired_enemies = GenericEnemy.query.filter_by(is_available=False).all()
    
    # Manter últimos 50 inimigos derrotados para histórico
    if len(expired_enemies) > 50:
        oldest_expired = expired_enemies[:-50]  # Todos exceto os últimos 50
        for enemy in oldest_expired:
            db.session.delete(enemy)
        
        db.session.commit()
        print(f"🧹 Limpeza: {len(oldest_expired)} inimigos antigos removidos")
        
    return len(expired_enemies)

def generate_enemy_by_theme(theme_id, enemy_number, player_id=None, temp_recent_equipment=None):
    """Generate enemy with smart rarity-compatible equipment system"""
    
    print(f"🔍 Generating enemy #{enemy_number} with theme {theme_id}")
    
    # Load configuration
    config = load_enemy_themes_config()
    if not config or 'themes' not in config or 'sprite_modifiers' not in config:
        print("❌ Error: Theme configuration not found")
        return None
    
    theme = EnemyTheme.query.get(theme_id)
    if not theme:
        print(f"❌ Error: Theme {theme_id} not found")
        return None
    
    theme_name = theme.name
    if theme_name not in config['themes']:
        print(f"❌ Error: Theme '{theme_name}' not found in configuration")
        return None
    
    theme_config = config['themes'][theme_name]
    sprite_modifiers = config['sprite_modifiers']
    
    # Calculate rarity
    rarity_chances = calculate_rarity_chances(enemy_number)
    print(f"🎲 Rarity chances: {rarity_chances}")

    rand = random.random() * 100
    print(f"🎲 Valor sorteado: {rand:.2f}%")

    cumulative = 0
    rarity = 1
    for r, chance in rarity_chances.items():
        cumulative += chance
        print(f"   Verificando raridade {r}: {cumulative:.1f}% (sorteado: {rand:.2f}%)")
        if rand <= cumulative:
            rarity = r
            print(f"   ✅ MATCH! Raridade {r} selecionada")
            break

    print(f"🎯 Selected rarity: {rarity} ({['', 'Comum', 'Raro', 'Épico', 'Lendário'][rarity]})")
    
    # Get recent equipment for anti-repetition
    recent_equipment = get_recent_equipment(player_id, 5) if player_id else set()

    # ADICIONAR cache temporário se fornecido
    if temp_recent_equipment:
        historic_count = len(recent_equipment)
        recent_equipment.update(temp_recent_equipment)
        print(f"🔍 DEBUG ANTI-REPETIÇÃO: Histórico banco={historic_count}, Cache temporário={len(temp_recent_equipment)}, Total filtros={len(recent_equipment)}")
    else:
        print(f"🔍 DEBUG ANTI-REPETIÇÃO: Histórico banco={len(recent_equipment)}, Cache temporário=0 (CHAMADA ISOLADA)")
    
    # Select initial equipment using smart system
    selected_equipment = {}
    
    # Calculate smart tier distribution for rarity
    tier_distribution = calculate_tier_distribution_for_rarity(rarity)

    selected_equipment = {}
    equipment_types = ['body', 'head', 'weapon']

    for equipment_type in equipment_types:
        target_tier = tier_distribution[equipment_type]
        
        print(f"🎯 DEBUG: {equipment_type} → Target tier {target_tier}")
        
        equipment = get_equipment_by_tier_direct(theme_name, equipment_type, target_tier, recent_equipment)
        if equipment:
            selected_equipment[equipment_type] = equipment
            points = get_equipment_points_from_json(equipment)
            print(f"🎯 DEBUG: Selected {equipment} with {points} points")
        else:
            print(f"❌ Could not select {equipment_type} for theme {theme_name}")
            return None

    print(f"🔍 Equipment selected so far: {selected_equipment}")

    # Check if total points are within rarity range and adjust if needed
    total_modifiers = calculate_total_modifiers(selected_equipment)
    target_range = get_target_range_for_rarity(rarity)

    print(f"🎯 Initial total: {total_modifiers}, target range: {target_range}")

    # If below minimum, upgrade weakest equipment
    while total_modifiers < target_range[0]:
        # Set final equipment after adjustments
        final_equipment = selected_equipment
        # Find weakest equipment
        weakest_type = None
        weakest_points = float('inf')
        
        for eq_type, eq_file in selected_equipment.items():
            points = get_equipment_points_from_json(eq_file)
            if points < weakest_points:
                weakest_points = points
                weakest_type = eq_type
        
        if weakest_type:
            current_tier = tier_distribution[weakest_type]
            if current_tier < 6:
                new_tier = current_tier + 1
                new_equipment = get_equipment_by_tier_direct(theme_name, weakest_type, new_tier, recent_equipment)
                if new_equipment:
                    selected_equipment[weakest_type] = new_equipment
                    tier_distribution[weakest_type] = new_tier
                    total_modifiers = calculate_total_modifiers(selected_equipment)
                    print(f"🔧 Upgraded {weakest_type} to tier {new_tier}, new total: {total_modifiers}")
                else:
                    break
            else:
                break
        else:
            break
    # Set final equipment after adjustments
    final_equipment = selected_equipment    

    # If above maximum, downgrade strongest equipment intelligently
    adjustment_attempts = 0
    max_attempts = 15

    # Verificar se precisa ajustar (pontos OU rank)
    current_rank = get_rank_from_total_modifiers(total_modifiers)
    compatible_ranks = RARITY_COMPATIBLE_RANKS[rarity]
    needs_rank_adjustment = current_rank not in compatible_ranks

    while (total_modifiers > target_range[1] or needs_rank_adjustment) and adjustment_attempts < max_attempts:
        adjustment_attempts += 1
        print(f"🔧 AJUSTE #{adjustment_attempts}: Total {total_modifiers} > Máximo {target_range[1]}")
        
        # Create list of all equipment sorted by points (highest first)
        equipment_by_points = []
        for eq_type, eq_file in selected_equipment.items():
            points = get_equipment_points_from_json(eq_file)
            current_tier = tier_distribution.get(eq_type, 1)
            equipment_by_points.append((eq_type, eq_file, points, current_tier))
        
        # Sort by points (descending)
        equipment_by_points.sort(key=lambda x: x[2], reverse=True)
        
        adjustment_made = False
        
        # Try to downgrade each equipment (starting from strongest)
        for eq_type, eq_file, current_points, current_tier in equipment_by_points:
            if current_tier > 1:
                new_tier = current_tier - 1
                print(f"🔧 Tentando {eq_type} tier {current_tier}→{new_tier} ({current_points} pontos)")
                
                new_equipment = get_equipment_by_tier_direct(theme_name, eq_type, new_tier, recent_equipment)
                if new_equipment:
                    new_points = get_equipment_points_from_json(new_equipment)
                    
                    # Only proceed if it ACTUALLY reduces points
                    if new_points < current_points:
                        selected_equipment[eq_type] = new_equipment
                        tier_distribution[eq_type] = new_tier
                        old_total = total_modifiers
                        total_modifiers = calculate_total_modifiers(selected_equipment)
                        
                        print(f"✅ {eq_type} ajustado: {current_points}→{new_points} pontos")
                        print(f"   Total: {old_total}→{total_modifiers}")
                        adjustment_made = True
                        # Recalcular rank após ajuste
                        current_rank = get_rank_from_total_modifiers(total_modifiers)
                        needs_rank_adjustment = current_rank not in compatible_ranks
                        break
                    else:
                        print(f"❌ {eq_type} tier {new_tier} tem {new_points} pontos (não reduz de {current_points})")
                else:
                    print(f"❌ Não encontrou equipamento tier {new_tier} para {eq_type}")
        
        # If no adjustment was possible, break
        if not adjustment_made:
            print(f"❌ FALHA: Nenhum ajuste eficaz possível após {adjustment_attempts} tentativas")
            print(f"   Equipamentos atuais:")
            for eq_type, eq_file in selected_equipment.items():
                points = get_equipment_points_from_json(eq_file)
                tier = tier_distribution.get(eq_type, 1)
                print(f"     {eq_type}: {eq_file} (tier {tier}, {points} pontos)")
            break

    if total_modifiers > target_range[1]:
        print(f"⚠️ AVISO CRÍTICO: Não foi possível ajustar equipamentos!")
        print(f"   Total final: {total_modifiers} (máximo permitido: {target_range[1]})")
    
    # Set final equipment after all adjustments
    final_equipment = selected_equipment
    
    # Optional back equipment with intelligent tier selection
    sprite_back = None
    if theme_config.get('back_options'):
        back_chance = 0.80 if theme_name in ["Guerreiros pouca roupa", "Guerreiros grandes"] else 0.10
        if random.random() < back_chance:
            # NOVA LÓGICA: Calcular margem disponível na faixa da raridade
            current_total = calculate_total_modifiers(selected_equipment)
            available_margin = target_range[1] - current_total
            
            print(f"🎒 BACK SELECTION: Total atual = {current_total}, margem disponível = {available_margin}")
            
            # Definir tiers permitidos baseado na margem disponível
            allowed_tiers = []
            if available_margin >= 0:   # 0-10 pontos disponíveis
                allowed_tiers.append(1)
            if available_margin >= 10:  # 10-20 pontos disponíveis  
                allowed_tiers.append(2)
            if available_margin >= 20:  # 20-30 pontos disponíveis
                allowed_tiers.append(3)
            if available_margin >= 30:  # 30-40 pontos disponíveis
                allowed_tiers.append(4)
            if available_margin >= 40:  # 40-50 pontos disponíveis
                allowed_tiers.append(5)
            if available_margin >= 50:  # 50+ pontos disponíveis
                allowed_tiers.append(6)
            
            print(f"🎒 Tiers permitidos para back: {allowed_tiers}")
            
            # Tentar cada tier permitido aleatoriamente
            random.shuffle(allowed_tiers)  # Embaralhar para aleatoriedade
            
            back_equipment = None
            for back_tier in allowed_tiers:
                back_equipment = get_equipment_by_tier_direct(theme_name, 'back', back_tier, recent_equipment)
                if back_equipment:
                    back_points = get_equipment_points_from_json(back_equipment)
                    print(f"🎒 Back selecionado: {back_equipment} (tier {back_tier}, {back_points} pontos)")
                    break
            
            # Adicionar o back se encontrado
            if back_equipment:
                selected_equipment['back'] = back_equipment
                sprite_back = back_equipment
                
                # REAJUSTAR APÓS ADICIONAR BACK
                print(f"🔧 REAJUSTE PÓS-BACK: Verificando compatibilidade...")
                total_with_back = calculate_total_modifiers(selected_equipment)
                
                # Se passou do máximo após adicionar back, fazer ajustes
                while total_with_back > target_range[1]:
                    print(f"🔧 REAJUSTE: Total {total_with_back} > Máximo {target_range[1]} após adicionar back")
                    
                    # Encontrar equipamento mais forte (incluindo o back agora)
                    strongest_type = None
                    strongest_points = -1
                    
                    for eq_type, eq_file in selected_equipment.items():
                        points = get_equipment_points_from_json(eq_file)
                        if points > strongest_points:
                            strongest_points = points
                            strongest_type = eq_type
                    
                    if strongest_type and strongest_type != 'back':  # Não mexer no back recém-adicionado
                        current_tier = tier_distribution.get(strongest_type, 1)
                        if current_tier > 1:
                            new_tier = current_tier - 1
                            new_equipment = get_equipment_by_tier_direct(theme_name, strongest_type, new_tier, recent_equipment)
                            if new_equipment:
                                old_points = get_equipment_points_from_json(selected_equipment[strongest_type])
                                selected_equipment[strongest_type] = new_equipment
                                tier_distribution[strongest_type] = new_tier
                                total_with_back = calculate_total_modifiers(selected_equipment)
                                new_points = get_equipment_points_from_json(new_equipment)
                                print(f"🔧 Reajustado {strongest_type}: tier {current_tier}→{new_tier} ({old_points}→{new_points} pts), novo total: {total_with_back}")
                            else:
                                print(f"❌ Não conseguiu reajustar {strongest_type}, removendo back")
                                del selected_equipment['back']
                                sprite_back = None
                                break
                        else:
                            print(f"❌ {strongest_type} já está na tier mínima, removendo back")
                            del selected_equipment['back'] 
                            sprite_back = None
                            break
                    else:
                        # Se só sobrou o back como mais forte, remover o back
                        print(f"❌ Só restou o back como ajustável, removendo back")
                        del selected_equipment['back']
                        sprite_back = None
                        break
                
                print(f"🎒 BACK FINAL: {'Adicionado' if sprite_back else 'Removido'}")
            else:
                print(f"🎒 Nenhum back encontrado nos tiers permitidos: {allowed_tiers}")
    
    # Verificação final após todas as modificações (incluindo back)
    final_total = calculate_total_modifiers(selected_equipment)
    print(f"🔍 TOTAL APÓS BACK: {final_total} (faixa: {target_range})")
    
    if final_total < target_range[0] or final_total > target_range[1]:
        print(f"❌ AVISO: Total final {final_total} fora da faixa {target_range}!")
    else:
        print(f"✅ Total final dentro da faixa da raridade")

    # Calculate final stats
    base_stats = calculate_enemy_base_stats(enemy_number)
    final_stats = apply_rarity_modifiers(base_stats, rarity)
    
    # Apply equipment modifiers
    equipment_modifiers = {}
    total_modifier_sum = 0
    
    for equipment_type, equipment_file in final_equipment.items():
        if equipment_file and equipment_file in sprite_modifiers:
            modifiers = sprite_modifiers[equipment_file]
            equipment_modifiers[equipment_type] = modifiers
            
            # Apply modifiers to stats
            if modifiers.get('hp', 0) > 0:
                final_stats['hp'] = int(final_stats['hp'] * (1 + modifiers['hp'] / 100))
            if modifiers.get('damage', 0) > 0:
                final_stats['damage'] = int(final_stats['damage'] * (1 + modifiers['damage'] / 100))
            if modifiers.get('armor', 0) > 0:
                final_stats['block'] = min(75, final_stats['block'] + modifiers['armor'])
            if modifiers.get('posture', 0) > 0:
                final_stats['posture'] = int(final_stats['posture'] * (1 + modifiers['posture'] / 100))
            
            total_modifier_sum += sum(modifiers.values())
    
    # Generate enemy name
    names_config = load_enemy_names_config()
    name = generate_enemy_name(names_config, theme_name, final_equipment)
    
    # Determine rounds
    rand_rounds = random.random()
    if rand_rounds < 0.8:
        initial_rounds = 3
    elif rand_rounds < 0.9:
        initial_rounds = 2
    else:
        initial_rounds = 4
    
    # Calcular rank do equipamento - USAR VALOR CONSISTENTE
    total_modifier_sum = 0
    for equipment_type, equipment_file in final_equipment.items():
        if equipment_file and equipment_file in sprite_modifiers:
            modifiers = sprite_modifiers[equipment_file]
            equipment_modifiers[equipment_type] = modifiers
            
            # USAR total_points do JSON em vez de sum(modifiers.values())
            equipment_points = modifiers.get('total_points', 0)
            total_modifier_sum += equipment_points
            
            # Aplicar modificadores às estatísticas (usando valores individuais)
            if modifiers.get('hp', 0) > 0:
                final_stats['hp'] = int(final_stats['hp'] * (1 + modifiers['hp'] / 100))
            if modifiers.get('damage', 0) > 0:
                final_stats['damage'] = int(final_stats['damage'] * (1 + modifiers['damage'] / 100))
            if modifiers.get('armor', 0) > 0:
                final_stats['block'] = min(75, final_stats['block'] + modifiers['armor'])
            if modifiers.get('posture', 0) > 0:
                final_stats['posture'] = int(final_stats['posture'] * (1 + modifiers['posture'] / 100))

    print(f"🔍 PONTOS FINAIS PARA RANK: {total_modifier_sum}")

    # Calcular rank REAL baseado apenas nos pontos (SEM limitação por raridade)
    if total_modifier_sum >= 200:
        equipment_rank = "Supremo"
    elif total_modifier_sum >= 170:
        equipment_rank = "S+++"
    elif total_modifier_sum >= 140:
        equipment_rank = "S++"
    elif total_modifier_sum >= 120:
        equipment_rank = "S+"
    elif total_modifier_sum >= 100:
        equipment_rank = "S"
    elif total_modifier_sum >= 85:
        equipment_rank = "A"
    elif total_modifier_sum >= 70:
        equipment_rank = "B"
    elif total_modifier_sum >= 55:
        equipment_rank = "C"
    elif total_modifier_sum >= 38:
        equipment_rank = "D"
    elif total_modifier_sum >= 30:
        equipment_rank = "E"
    else:
        equipment_rank = "F"

    print(f"🏷️ RANK REAL: {equipment_rank} (baseado em {total_modifier_sum} pontos)")

    # Verificar se rank é compatível com raridade (mas NÃO alterar)
    compatible_ranks = RARITY_COMPATIBLE_RANKS[rarity]
    if equipment_rank not in compatible_ranks:
        print(f"⚠️ INCOMPATIBILIDADE: Rank {equipment_rank} incompatível com raridade {rarity}")
        print(f"   Ranks permitidos para raridade {rarity}: {compatible_ranks}")
        print(f"   MANTENDO RANK REAL: {equipment_rank} (não mentiremos!)")
    
    # Determinar tipo de recompensa
    from .reward_system import determine_enemy_reward_type, REWARD_SYSTEM
    reward_type = determine_enemy_reward_type()
    reward_icon = REWARD_SYSTEM[reward_type]['icon']
    
    print(f"🎁 Recompensa definida: {reward_type} ({reward_icon})")

    # Determinar animação de hit baseado no tier da weapon
    weapon_file = final_equipment.get('weapon', '')
    if weapon_file:
        weapon_tier = get_equipment_tier_from_json(weapon_file)
        if weapon_tier <= 2:
            hit_animation = 'hit1'
        elif weapon_tier <= 4:
            hit_animation = 'hit2'
        else:
            hit_animation = 'hit3'
    else:
        hit_animation = 'hit1'  # fallback
    
    print(f"🎯 Hit animation definida: {hit_animation} (weapon tier: {weapon_tier if weapon_file else 'N/A'})")

    # ===== GERAR SKILLS DO INIMIGO =====
    # SEMPRE inicializar as variáveis primeiro (mesmo vazias)
    enemy_skills_json = '[]'
    enemy_skills_list = []
    
    try:
        selected_skills, cooldown_reductions = generate_enemy_skills(enemy_number, rarity, selected_equipment)
        
        # Converter skills para formato JSON
        
        if selected_skills:
            skills_config = load_enemy_skills_config()
            
            for skill_id, equipment_type in selected_skills.items():
                skill_id_str = str(skill_id)
                
                # Determinar tipo de skill
                skill_type = None
                skill_data = None
                
                if skill_id_str in skills_config.get('attack_skills', {}):
                    skill_type = 'attack'
                    skill_data = skills_config['attack_skills'][skill_id_str]
                elif skill_id_str in skills_config.get('buff_skills', {}):
                    skill_type = 'buff'
                    skill_data = skills_config['buff_skills'][skill_id_str]
                elif skill_id_str in skills_config.get('debuff_skills', {}):
                    skill_type = 'debuff'
                    skill_data = skills_config['debuff_skills'][skill_id_str]
                
                if skill_type and skill_data:
                    # Adicionar à lista de skills
                    enemy_skills_list.append({
                        'skill_id': skill_id,
                        'type': skill_type,
                        'equipment_source': equipment_type
                    })
                    
                    # Configurar cronômetro (aplicar redução se duplicada)
                    base_interval = skill_data.get('charge_interval', 8)
                    final_interval = int(base_interval * cooldown_reductions[skill_id])
                    
                    print(f"🎯 Skill {skill_id} ({skill_type}) configurada com intervalo {final_interval}h")
        
        # Converter para JSON
        enemy_skills_json = json.dumps(enemy_skills_list)
        
    except Exception as e:
        print(f"Erro ao gerar skills do inimigo: {e}")
        # Manter valores padrão vazios se houver erro
        enemy_skills_json = '[]'
        skill_charges_json = '{}'
        skill_intervals_json = '{}'

    # ===== GERAR PADRÃO DE AÇÕES E PROBABILIDADES (NOVO SISTEMA DE TURNOS) =====
    print(f"\n🎲 Gerando sistema de turnos para inimigo #{enemy_number}")
    
    # Gerar padrão de ações baseado no tema e skills
    action_pattern = generate_action_pattern(theme.name, enemy_skills_json)
    action_pattern_json = json.dumps(action_pattern)
    
    # Calcular probabilidades de ações por turno
    actions_probability = calculate_actions_per_turn_probability(enemy_number)
    actions_probability_json = json.dumps(actions_probability)
    
    print(f"📊 Probabilidades de ações: {actions_probability}")
    print(f"🎯 Padrão de ações: {action_pattern}")

    # Create enemy
    enemy = GenericEnemy(
        enemy_number=enemy_number,
        name=name,
        theme_id=theme_id,
        rarity=rarity,
        hp=final_stats['hp'],
        max_hp=final_stats['hp'],
        damage=final_stats['damage'],
        posture=final_stats['posture'],
        block_percentage=final_stats['block'],
        rounds_remaining=initial_rounds,
        initial_rounds=initial_rounds,
        sprite_back=sprite_back,
        sprite_body=final_equipment['body'],
        sprite_head=final_equipment['head'],
        sprite_weapon=final_equipment['weapon'],
        equipment_modifiers_applied=json.dumps(equipment_modifiers),
        reward_bonus_percentage=total_modifier_sum,
        equipment_rank=equipment_rank,
        is_new=True,
        reward_type=reward_type,
        reward_icon=reward_icon,
        hit_animation=hit_animation,
        attack_sfx=None,  # Por enquanto vazio
        attack_charges_count=0,  # Inicia sem cargas
        action_queue='[]',
        enemy_skills=enemy_skills_json,
        buff_debuff_queue='[]',
        # Sistema de turnos:
        action_pattern=action_pattern_json,
        current_action_index=0,
        actions_per_turn_probability=actions_probability_json,
        attack_skill_rotation_index=0
    )
    

    # VERIFICAÇÃO EXTRA: Debug de repetições
    if temp_recent_equipment:
        repeated_items = []
        if final_equipment.get('body') in temp_recent_equipment:
            repeated_items.append(f"body: {final_equipment['body']}")
        if final_equipment.get('head') in temp_recent_equipment:
            repeated_items.append(f"head: {final_equipment['head']}")  
        if final_equipment.get('weapon') in temp_recent_equipment:
            repeated_items.append(f"weapon: {final_equipment['weapon']}")
        if final_equipment.get('back') and final_equipment.get('back') in temp_recent_equipment:
            repeated_items.append(f"back: {final_equipment['back']}")
        
        if repeated_items:
            print(f"⚠️ REPETIÇÃO DETECTADA: {', '.join(repeated_items)}")
            print(f"   Cache atual: {temp_recent_equipment}")
            print(f"   Equipamentos finais: {final_equipment}")
    else:
        # Verificar histórico persistente quando não há cache temporário
        persistent_equipment = get_recent_equipment(player_id, 5) if player_id else set()
        repeated_items = []
        if final_equipment.get('body') in persistent_equipment:
            repeated_items.append(f"body: {final_equipment['body']}")
        if final_equipment.get('head') in persistent_equipment:
            repeated_items.append(f"head: {final_equipment['head']}")  
        if final_equipment.get('weapon') in persistent_equipment:
            repeated_items.append(f"weapon: {final_equipment['weapon']}")
        if final_equipment.get('back') and final_equipment.get('back') in persistent_equipment:
            repeated_items.append(f"back: {final_equipment['back']}")
        
        if repeated_items:
            print(f"⚠️ REPETIÇÃO NO HISTÓRICO PERSISTENTE: {', '.join(repeated_items)}")
            print(f"   Histórico persistente: {persistent_equipment}")
            print(f"   Equipamentos finais: {final_equipment}")

    # VERIFICAÇÃO FINAL: Se ainda incompatível, FALHAR em vez de criar inimigo ruim
    final_total = calculate_total_modifiers(selected_equipment)
    current_rank = get_rank_from_total_modifiers(final_total)
    compatible_ranks = RARITY_COMPATIBLE_RANKS[rarity]
    
    if current_rank not in compatible_ranks or final_total < target_range[0] or final_total > target_range[1]:
        print(f"❌ FALHA CRÍTICA: Impossível criar inimigo compatível com este tema")
        print(f"   Tema: {theme_name}")
        print(f"   Raridade: {rarity} (ranks permitidos: {compatible_ranks})")
        print(f"   Total pontos: {final_total} (faixa: {target_range})")
        print(f"   Rank resultante: {current_rank}")
        print(f"   ABORTANDO criação deste inimigo")
        return None  # RETORNAR None EM VEZ DE CRIAR INIMIGO INCOMPATÍVEL

    db.session.add(enemy)
    
    # Add equipment to history
    if player_id:
        for equipment_type, equipment_file in final_equipment.items():
            if equipment_file:
                add_equipment_to_history(player_id, equipment_type, equipment_file)
    
    db.session.commit()
    
    # Verificação final de compatibilidade
    print(f"🔍 VERIFICAÇÃO FINAL:")
    print(f"   Raridade: {rarity} ({'Comum' if rarity==1 else 'Raro' if rarity==2 else 'Épico' if rarity==3 else 'Lendário'})")
    print(f"   Target range: {target_range}")
    print(f"   Total pontos: {total_modifier_sum}")
    print(f"   Rank calculado: {equipment_rank}")
    
    # Verificar se está dentro da faixa
    if target_range[0] <= total_modifier_sum <= target_range[1]:
        print(f"   ✅ COMPATÍVEL: Pontos dentro da faixa da raridade")
    else:
        print(f"   ❌ INCOMPATÍVEL: Pontos fora da faixa da raridade!")
    
    # Verificar se rank está correto para a raridade
    compatible_ranks = RARITY_COMPATIBLE_RANKS[rarity]
    if equipment_rank in compatible_ranks:
        print(f"   ✅ RANK COMPATÍVEL: {equipment_rank} permitido para raridade {rarity}")
    else:
        print(f"   ❌ RANK INCOMPATÍVEL: {equipment_rank} NÃO permitido para raridade {rarity}")
        print(f"   Ranks permitidos: {compatible_ranks}")
    print(f"✅ Enemy created: {name} (Rarity: {rarity}, Rank: {equipment_rank}, Modifiers: +{total_modifier_sum}%)")
    return enemy

def calculate_tier_distribution_for_rarity(rarity):
    """Calculate tier distribution with smart compensation for empty tiers"""
    
    # Define tier sum ranges for each rarity
    tier_ranges = {
        1: (1, 7),   # Comum: 15-70 pontos
        2: (3, 10),  # Raro: 30-100 pontos  
        3: (5, 12),  # Épico: 55-120 pontos
        4: (10, 18)  # Lendário: 100+ pontos
    }
    
    min_sum, max_sum = tier_ranges[rarity]
    target_tier_sum = random.randint(min_sum, max_sum)
    
    # Generate combinations that work with available equipment
    # If a tier is empty, compensate by increasing other tiers
    possible_combinations = []
    
    for tier1 in range(1, 7):  # body tier
        for tier2 in range(1, 7):  # head tier  
            for tier3 in range(1, 7):  # weapon tier
                if tier1 + tier2 + tier3 == target_tier_sum:
                    possible_combinations.append((tier1, tier2, tier3))
    
    # If no exact combinations, try adjacent sums
    if not possible_combinations:
        for adjacent_sum in [target_tier_sum - 1, target_tier_sum + 1, target_tier_sum - 2, target_tier_sum + 2]:
            for tier1 in range(1, 7):
                for tier2 in range(1, 7):
                    for tier3 in range(1, 7):
                        if tier1 + tier2 + tier3 == adjacent_sum:
                            possible_combinations.append((tier1, tier2, tier3))
            if possible_combinations:
                break
    
    # Choose random combination
    if possible_combinations:
        chosen_combination = random.choice(possible_combinations)
    else:
        # Ultimate fallback based on rarity
        if rarity == 1:
            chosen_combination = (2, 2, 1)
        elif rarity == 2:
            chosen_combination = (3, 2, 2)
        elif rarity == 3:
            chosen_combination = (4, 3, 3)
        else:
            chosen_combination = (5, 4, 4)
    
    print(f"🎯 Rarity {rarity}: Target tier sum {target_tier_sum}, chosen tiers: {chosen_combination}")
    
    return {
        'body': chosen_combination[0],
        'head': chosen_combination[1], 
        'weapon': chosen_combination[2],
        'target_sum': target_tier_sum
    }

def generate_enemy_name(names_config, theme_name, final_equipment):
    """Generate enemy name using existing logic"""
    if names_config and 'theme_first_names' in names_config and 'equipment_second_names' in names_config:
        theme_first_names = names_config['theme_first_names'].get(theme_name, [])
        
        if theme_first_names:
            first_name = random.choice(theme_first_names)
            
            equipment_options = []
            for eq_type, eq_file in final_equipment.items():
                if eq_file and eq_type in ['head', 'body', 'weapon']:
                    equipment_options.append(eq_file)
            
            if equipment_options:
                chosen_equipment = random.choice(equipment_options)
                equipment_second_names = names_config['equipment_second_names'].get(chosen_equipment, [])
                
                if equipment_second_names:
                    second_name = random.choice(equipment_second_names)
                    return f"{first_name} {second_name}"
            
            return first_name
    
    # Fallback to generic name
    fallback_names = [
        "Guerreiro Perdido", "Guardião Antigo", "Defensor Sombrio",
        "Lâmina Errante", "Protetor Caído", "Sentinela Corrompida"
    ]
    return random.choice(fallback_names)

def get_minimum_enemy_count(player_id):
    """
    Retorna quantidade mínima de inimigos baseado em relíquias ativas.
    Base: 3 inimigos
    +1 se tiver relíquia ID 47 (Guia de Contemplação)
    """
    from models import PlayerRelic
    
    base_count = 3
    
    # ID 47: Guia de Contemplação (+1 opção de inimigo)
    extra_enemy_relic = PlayerRelic.query.filter_by(
        player_id=player_id,
        relic_id='47',
        is_active=True
    ).first()
    
    if extra_enemy_relic:
        base_count += 1
        print(f"🪞 Guia de Contemplação ativo: mínimo = {base_count} inimigos")
    
    return base_count


def ensure_minimum_enemies(progress, minimum=None):
    """
    Garante que sempre haja pelo menos N inimigos disponíveis.
    minimum: Se None, calcula automaticamente baseado em relíquias
    """
    from models import Player, PlayerRelic

    # Se minimum não foi fornecido, calcular dinamicamente
    if minimum is None:
        minimum = get_minimum_enemy_count(progress.player_id)

    # LÓGICA NORMAL: Gerar inimigos genéricos
    available_count = GenericEnemy.query.filter_by(is_available=True).count()
    
    if available_count >= minimum:
        return 0  # Já temos suficientes
    
    needed = minimum - available_count
    generated = 0
    
    # Calcular próximo enemy_number baseado no progresso
    next_enemy_number = progress.generic_enemies_defeated + 1
    
    # Obter temas disponíveis
    themes = EnemyTheme.query.all()
    if not themes:
        print("❌ Nenhum tema de inimigo encontrado!")
        return 0
    
    print(f"📊 Gerando {needed} inimigos (enemy_number: {next_enemy_number})")
    print(f"🔍 DEBUG: Temas encontrados: {len(themes)}")
    for theme in themes:
        print(f"   - {theme.name}")
    print(f"🔍 DEBUG: _theme_proportions = {_theme_proportions}")
    
    # 🔧 NOVO: Cache temporário para evitar repetições durante esta sessão de geração
    temp_recent_equipment = set()

    # Adicionar equipamentos dos últimos inimigos DISPONÍVEIS ao cache temporário
    recent_available_enemies = GenericEnemy.query.filter_by(is_available=True).order_by(GenericEnemy.id.desc()).limit(3).all()
    for enemy in recent_available_enemies:
        if enemy.sprite_body:
            temp_recent_equipment.add(enemy.sprite_body)
        if enemy.sprite_head:
            temp_recent_equipment.add(enemy.sprite_head)
        if enemy.sprite_weapon:
            temp_recent_equipment.add(enemy.sprite_weapon)
        if enemy.sprite_back:
            temp_recent_equipment.add(enemy.sprite_back)

    print(f"🔧 Cache inicial populado com {len(temp_recent_equipment)} equipamentos dos inimigos disponíveis")
    print(f"   Equipamentos no cache inicial: {list(temp_recent_equipment)}")
    
    # Obter último tema usado para evitar repetição
    last_enemy = GenericEnemy.query.order_by(GenericEnemy.id.desc()).first()
    last_theme_used = None
    if last_enemy:
        last_theme = EnemyTheme.query.get(last_enemy.theme_id)
        last_theme_used = last_theme.name if last_theme else None
    
    # Gerar inimigos necessários com fallback inteligente
    for i in range(needed):
        max_theme_attempts = 5  # Máximo 5 tentativas de tema
        enemy_created = False
        
        # Calcular raridade para este inimigo
        enemy_rarity_chances = calculate_rarity_chances(next_enemy_number)
        rand = random.random() * 100
        cumulative = 0
        current_rarity = 1
        for r, chance in enemy_rarity_chances.items():
            cumulative += chance
            if rand <= cumulative:
                current_rarity = r
                break
        
        print(f"🎯 Inimigo #{i+1}: Raridade {current_rarity} sorteada")
        
        for attempt in range(max_theme_attempts):
            # Filtrar temas proibidos para esta raridade
            forbidden_themes = FORBIDDEN_THEMES_BY_RARITY.get(current_rarity, [])
            allowed_theme_names = [theme.name for theme in themes if theme.name not in forbidden_themes]
            
            if not allowed_theme_names:
                print(f"⚠️ Nenhum tema disponível para raridade {current_rarity}, usando fallback")
                allowed_theme_names = [theme.name for theme in themes]  # Usar todos como fallback
            
            print(f"🎯 Tentativa {attempt + 1}/5: Raridade {current_rarity}")
            print(f"   Temas proibidos: {forbidden_themes}")
            print(f"   Temas permitidos: {allowed_theme_names}")
            
            # Escolher tema baseado nas proporções e anti-repetição
            selected_theme_name = select_theme_by_proportion(last_theme_used, allowed_theme_names)
            selected_theme = None
            
            # Encontrar o tema por nome
            for theme in themes:
                if theme.name == selected_theme_name:
                    selected_theme = theme
                    break
            
            if not selected_theme:
                selected_theme = themes[i % len(themes)]
                print(f"⚠️ Tema '{selected_theme_name}' não encontrado, usando fallback: {selected_theme.name}")
            
            try:
                print(f"🎯 Gerando com tema: {selected_theme.name}")
                
                new_enemy = generate_enemy_by_theme(selected_theme.id, next_enemy_number, progress.player_id, temp_recent_equipment)
                
                if new_enemy:  # SUCESSO: Inimigo compatível criado
                    generated += 1
                    enemy_created = True
                    print(f"   ✅ {new_enemy.name} (Tema: {selected_theme.name}, Raridade: {new_enemy.rarity})")
                    
                    # Adicionar equipamentos ao cache e atualizar tema usado
                    if new_enemy.sprite_body:
                        temp_recent_equipment.add(new_enemy.sprite_body)
                    if new_enemy.sprite_head:
                        temp_recent_equipment.add(new_enemy.sprite_head)
                    if new_enemy.sprite_weapon:
                        temp_recent_equipment.add(new_enemy.sprite_weapon)
                    if new_enemy.sprite_back:
                        temp_recent_equipment.add(new_enemy.sprite_back)
                    
                    last_theme_used = selected_theme.name
                    break  # Sair do loop de tentativas de tema
                    
                else:  # FALHA: Tema incompatível com raridade
                    print(f"   ❌ Tema {selected_theme.name} incompatível com raridade {current_rarity}")
                    # Remover tema da lista para próxima tentativa
                    if selected_theme.name in allowed_theme_names:
                        allowed_theme_names.remove(selected_theme.name)
                    
            except Exception as e:
                print(f"   ❌ Erro ao gerar inimigo com tema {selected_theme.name}: {str(e)}")
                continue
        
        if not enemy_created:
            print(f"❌ FALHA TOTAL: Não foi possível criar inimigo compatível após {max_theme_attempts} tentativas de tema")
            print(f"   Última raridade tentada: {current_rarity}")
            print(f"   Tentando com raridade mais flexível...")
            
            # Fallback: tentar com raridade 2 (Raro) que tem mais opções
            try:
                fallback_theme = themes[0]  # Primeiro tema como fallback
                new_enemy = generate_enemy_by_theme(fallback_theme.id, next_enemy_number, progress.player_id, temp_recent_equipment)
                if new_enemy:
                    generated += 1
                    print(f"   🔄 FALLBACK: {new_enemy.name} criado com tema {fallback_theme.name}")
                else:
                    print(f"   ❌ Até o fallback falhou!")
            except Exception as e:
                print(f"   ❌ Erro no fallback: {str(e)}")
    
    if generated > 0:
        db.session.commit()
        print(f"📊 Total gerado: {generated}/{needed} inimigos")
        print(f"🔍 Equipamentos únicos usados nesta sessão: {len(temp_recent_equipment)}")
    
    return generated

def get_boss_for_milestone(boss_number):
    """Retorna o nome do boss para um milestone específico"""
    boss_progression = {
        1: "purassombra",    # 1º boss (após 20 inimigos)
        2: "heresiarca",     # 2º boss (após 40 inimigos)
        3: "alma_negra",     # 3º boss (após 60 inimigos)
        4: "formofagus",     # 4º boss (após 80 inimigos)
        5: "nefasto"         # 5º boss (após 100 inimigos)
    }
    
    return boss_progression.get(boss_number, "nefasto")  # Fallback para último boss

def initialize_enemy_themes():
    """Initialize enemy themes and equipment tier system"""
    
    # Verificar se temas já existem no banco
    if EnemyTheme.query.count() > 0:
        print("📊 Themes already exist in database, skipping theme creation")
    else:
        print("🏗️ Initializing enemy themes from JSON...")
        
        # Carregar configuração do JSON
        config = load_enemy_themes_config()
        if not config or 'themes' not in config:
            print("❌ Configuração de temas não carregada, criando temas padrão")
            # Fallback para temas hardcoded
            create_default_themes()
        else:
            themes_data = config['themes']
            nomes_genericos = [
                "Guerreiro Sombrio", "Guardião Feroz", "Lâmina Perdida", "Protetor Antigo",
                "Defensor Implacável", "Cavaleiro Errante", "Assassino Silencioso", "Espião Noturno",
                "Conjurador Arcano", "Mestre Elemental", "Feiticeiro Corrupto", "Sábio das Trevas",
                "Andarilho Misterioso", "Caçador Solitário", "Vigilante Eterno", "Sentinela Perdida"
            ]
            
            try:
                themes_created = 0
                for theme_name, theme_config in themes_data.items():
                    # Usar nomes do pool se existirem, senão usar nomes genéricos
                    name_pool = theme_config.get('name_pool', [])
                    if not name_pool:
                        name_pool = nomes_genericos
                    
                    new_theme = EnemyTheme(
                        name=theme_name,
                        body_options=json.dumps(theme_config.get('body_options', [1, 2, 3])),
                        head_options=json.dumps(theme_config.get('head_options', [1, 2, 3])),
                        weapon_options=json.dumps(theme_config.get('weapon_options', [1, 2, 3])),
                        back_options=json.dumps(theme_config.get('back_options', [])),
                        name_pool=json.dumps(name_pool)
                    )
                    
                    db.session.add(new_theme)
                    themes_created += 1
                    print(f"   ✅ Tema criado: {theme_name}")
                
                db.session.commit()
                print(f"🎉 {themes_created} temas de inimigos inicializados com sucesso!")
                
            except Exception as e:
                print(f"❌ Erro ao criar temas do JSON: {e}")
                db.session.rollback()
                create_default_themes()
    
    # SEMPRE executar essas inicializações (independente de temas já existirem)
    
    initialize_equipment_tiers_smart()  # ← Nova função
    
    # ADICIONAR: Update theme proportions
    update_theme_proportions()

def create_default_themes():
    """Cria temas padrão caso o JSON falhe"""
    print("🔧 Criando temas padrão (fallback)")
    
    # Tema padrão simples
    default_theme = EnemyTheme(
        name="Guerreiros Básicos",
        body_options=json.dumps([1, 2, 3, 4, 5]),
        head_options=json.dumps([1, 2, 3, 4, 5]),
        weapon_options=json.dumps([1, 2, 3, 4, 5]),
        back_options=json.dumps([1, 2, 3]),
        name_pool=json.dumps([
            "Guerreiro Perdido", "Guardião Antigo", "Defensor Sombrio",
            "Lâmina Errante", "Protetor Caído", "Sentinela Corrompida"
        ])
    )
    
    db.session.add(default_theme)
    db.session.commit()
    print("✅ Tema padrão criado")

def calculate_equipment_rank(bonus_percentage, rarity):
    """Calcula o rank do equipamento baseado no bônus total E raridade"""
    
    # Definir ranks máximos por raridade
    max_ranks_by_rarity = {
        1: "C",      # Comum: F, E, D, C (máximo C)
        2: "A",      # Raro: E, D, C, B, A (máximo A) 
        3: "S",      # Épico: C, B, A, S (máximo S)
        4: "Supremo" # Lendário: S, S+, S++, S+++, Supremo
    }
    
    # Calcular rank baseado nos pontos
    if bonus_percentage > 200:
        calculated_rank = "Supremo"
    elif bonus_percentage >= 180:
        calculated_rank = "S+++"
    elif bonus_percentage >= 150:
        calculated_rank = "S++"
    elif bonus_percentage >= 135:
        calculated_rank = "S+"
    elif bonus_percentage >= 120:
        calculated_rank = "S"
    elif bonus_percentage >= 95:
        calculated_rank = "A"
    elif bonus_percentage >= 80:
        calculated_rank = "B"
    elif bonus_percentage >= 60:
        calculated_rank = "C"
    elif bonus_percentage >= 45:
        calculated_rank = "D"
    elif bonus_percentage >= 25:
        calculated_rank = "E"
    else:
        calculated_rank = "F"
    
    # Limitar rank pela raridade
    max_allowed = max_ranks_by_rarity.get(rarity, "F")
    
    # Lista de ranks em ordem crescente
    rank_order = ["F", "E", "D", "C", "B", "A", "S", "S+", "S++", "S+++", "Supremo"]
    
    calculated_index = rank_order.index(calculated_rank)
    max_index = rank_order.index(max_allowed)
    
    # Se o rank calculado excede o máximo permitido, usar o máximo
    if calculated_index > max_index:
        final_rank = max_allowed
        print(f"🔒 Rank limitado pela raridade: {calculated_rank} → {final_rank} (raridade {rarity})")
    else:
        final_rank = calculated_rank
    
    return final_rank

# Sistema de dados fixos para bosses
# Sistema de dados fixos para bosses
BOSS_DATA = {
    "purassombra": {
        "name": "Purassombra",
        "hp": 200,
        "max_hp": 200,
        "damage": 16,
        "posture": 777,
        "block_percentage": 44.0,
        "sprite_idle": "bosses/purassombra/purassombra-idle-128x128-9f.png",
        "sprite_frames": 9,
        "sprite_size": "128x128",
        "hit_animation": "blackhit-32-32-5f-160x32",
        "attack_sfx": "/static/game.data/sounds/purassombrahit.wav",
        "charge_generation_interval": 6,  # 6 horas
        "skills": [2, 101],  # Skills: Explosão Sombria (ataque) + Nictalopia (debuff)
        "reward_crystals": 1000
    },
    "heresiarca": {
        "name": "Heresiarca",
        "hp": 350,
        "max_hp": 350,
        "damage": 20,
        "posture": 1020,
        "block_percentage": 36.0,
        "sprite_idle": "bosses/heresiarca/heresiarca-idle-256x128px-27f-6912x128.png",
        "sprite_frames": 27,
        "sprite_size": "256x128",
        "hit_animation": "yellowhit-32-32-5f-160x32",
        "attack_sfx": "/static/game.data/sounds/heresiarcahit.mp3",
        "charge_generation_interval": 6,  # 6 horas
        "skills": [1, 50],  # Placeholder, mudarei depois
        "reward_crystals": 1500
    },
    "alma_negra": {
        "name": "Alma Negra",
        "hp": 500,
        "max_hp": 500,
        "damage": 22,
        "posture": 1520,
        "block_percentage": 44.0,
        "sprite_idle": "bosses/almanegra/almanegra-idle-256x128px-8f-2048x128.png",
        "sprite_frames": 8,
        "sprite_size": "256x128",
        "hit_animation": "greenhit-32-32-5f-160x32",
        "attack_sfx": "/static/game.data/sounds/almanegrahit.mp3",
        "charge_generation_interval": 6,  # 6 horas
        "skills": [1, 50],  # Placeholder, mudarei depois
        "reward_crystals": 2000
    },
    "formofagus": {
        "name": "Formofagus",
        "hp": 700,
        "max_hp": 700,
        "damage": 24,
        "posture": 2220,
        "block_percentage": 51.0,
        "sprite_idle": "bosses/formofagus/formofagus-idle-256x256-15f-3584x256.png",
        "sprite_frames": 15,
        "sprite_size": "256x256",
        "hit_animation": "purplehit-32-32-5f-160x32",
        "attack_sfx": "/static/game.data/sounds/formofagushit.mp3",
        "charge_generation_interval": 6,  # 6 horas
        "skills": [1, 50],  # Placeholder, mudarei depois
        "reward_crystals": 2500
    },
    "nefasto": {
        "name": "Nefasto",
        "hp": 1000,
        "max_hp": 1000,
        "damage": 26,
        "posture": 666,
        "block_percentage": 66.0,
        "sprite_idle": "bosses/nefasto/nefasto-128x128-9f-1152x128.png",
        "sprite_frames": 9,
        "sprite_size": "128x128",
        "hit_animation": "redhit-32-32-5f-160x32",
        "attack_sfx": "/static/game.data/sounds/nefastohit.mp3",
        "charge_generation_interval": 6,  # 6 horas
        "skills": [1, 50],  # Placeholder, mudarei depois
        "reward_crystals": 2500
    }
}

def create_boss_by_name(boss_name):
    """Cria ou ativa um boss específico"""
    from models import LastBoss
    
    if boss_name not in BOSS_DATA:
        print(f"❌ Boss '{boss_name}' não encontrado nos dados!")
        return None
    
    boss_data = BOSS_DATA[boss_name]
    
    # Verificar se boss já existe
    existing_boss = LastBoss.query.filter_by(name=boss_data["name"]).first()
    
    if existing_boss:
        # Boss já existe, apenas ativar
        existing_boss.is_active = True
        existing_boss.reset_to_full_health()
        print(f"👑 Boss {existing_boss.name} reativado!")
        return existing_boss
    
    # Criar novo boss com skills configuradas
    enemy_skills_list = []
    
    for skill_id in boss_data["skills"]:
        # Determinar tipo baseado no ID da skill
        if skill_id == 2:
            skill_type = 'attack'
        elif skill_id == 101:
            skill_type = 'debuff' 
        else:
            skill_type = 'buff'  # fallback
            
        enemy_skills_list.append({
            'skill_id': skill_id,
            'type': skill_type,
            'equipment_source': 'boss_innate'
        })
    
    skills_json = json.dumps(enemy_skills_list)

    # ===== GERAR PADRÃO DE AÇÕES PARA BOSS (SISTEMA DE TURNOS) =====
    print(f"\n🎲 Gerando sistema de turnos para boss: {boss_data['name']}")
    
    # Padrão de ações customizado para bosses
    # Bosses são mais agressivos e variam mais as skills
    boss_action_pattern = ["attack", "attack_skill", "buff_debuff", "attack", "attack_skill", "buff_debuff", "attack"]
    
    # Bosses sempre têm pelo menos 2 ações por turno
    boss_actions_probability = {
        "1": 0.0,   # Boss nunca faz apenas 1 ação
        "2": 0.60,  # 60% de chance de 2 ações
        "3": 0.40   # 40% de chance de 3 ações
    }
    
    action_pattern_json = json.dumps(boss_action_pattern)
    actions_probability_json = json.dumps(boss_actions_probability)
    
    print(f"📊 Probabilidades de ações: {boss_actions_probability}")
    print(f"🎯 Padrão de ações: {boss_action_pattern}")
    
    new_boss = LastBoss(
        name=boss_data["name"],
        hp=boss_data["hp"],
        max_hp=boss_data["max_hp"],
        damage=boss_data["damage"],
        posture=boss_data["posture"],
        block_percentage=boss_data["block_percentage"],
        sprite_idle=boss_data["sprite_idle"],
        sprite_frames=boss_data["sprite_frames"],
        sprite_size=boss_data["sprite_size"],
        hit_animation=boss_data["hit_animation"],
        hit_sound=boss_data["attack_sfx"],
        charge_generation_interval=boss_data["charge_generation_interval"],
        skills=skills_json,
        reward_crystals=boss_data["reward_crystals"],
        is_active=True,
        action_pattern=action_pattern_json,
        current_action_index=0,
        actions_per_turn_probability=actions_probability_json,
        attack_skill_rotation_index=0,
        buff_debuff_rotation_index=0,
        action_queue='[]',
        buff_debuff_queue='[]'
    )
    
    db.session.add(new_boss)
    db.session.commit()
    
    print(f"👑 Boss {new_boss.name} criado com sucesso!")
    return new_boss