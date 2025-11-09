# routes/talents.py

import math
import json
import random
from datetime import datetime, timezone
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from sqlalchemy import text

from database import db
from models import Player, Talent, PlayerTalent, AppliedTalentEffect
from game_formulas import calculate_strength_damage, calculate_resistance_block
from routes.cards import flash_gamification, get_exp_for_next_level

# Criar o blueprint para as rotas de talentos
talents_bp = Blueprint('talents', __name__)

# Dicionário completo de talentos
talents_data = {
    "Ofensiva Brutal": {
        "id": "Draco",
        "name": "Draco",
        "oldName": "Ofensiva Brutal",
        "talents": [
            {"id": 1, "name": "Ataque Pesado I", "description": "Aumenta dano base em +0.2x (20%)",
             "effect_type": "damage", "effect_value": "0.2", "requires": None},
            {"id": 2, "name": "Golpe Crítico I", "description": "+2% chance de acerto crítico",
             "effect_type": "critical_chance", "effect_value": "2", "requires": 1},
            {"id": 3, "name": "Dano Crítico I", "description": "Aumenta o dano do acerto crítico em 10%",
             "effect_type": "critical_damage", "effect_value": "10", "requires": 2},
            {"id": 4, "name": "Bloqueio Ofensivo", "description": "Aumenta o bloqueio em 2%",
             "effect_type": "resistance", "effect_value": "2", "requires": 3},
            {"id": 5, "name": "Vampirismo I", "description": "Cura 0,5% do HP ao causar dano",
             "effect_type": "heal_on_damage", "effect_value": "0.005", "requires": 4},
            {"id": 6, "name": "Ataque Pesado II", "description": "Aumenta dano base em +0.2x (20%)",
             "effect_type": "damage", "effect_value": "0.2", "requires": 5},
            {"id": 7, "name": "Golpe Crítico II", "description": "+2% chance de acerto crítico",
             "effect_type": "critical_chance", "effect_value": "2", "requires": 6},
            {"id": 8, "name": "Dano Crítico II", "description": "Aumenta o dano do acerto crítico em 10%",
             "effect_type": "critical_damage", "effect_value": "10", "requires": 7},
            {"id": 9, "name": "Vampirismo II", "description": "Cura 0,5% do HP ao causar dano",
             "effect_type": "heal_on_damage", "effect_value": "0.005", "requires": 8},
            {"id": 10, "name": "Ataque Pesado III", "description": "Aumenta dano base em +0.2x (20%)",
             "effect_type": "damage", "effect_value": "0.2", "requires": 9},
            {"id": 11, "name": "Golpe Crítico III", "description": "+2% chance de acerto crítico",
             "effect_type": "critical_chance", "effect_value": "2", "requires": 10},
            {"id": 12, "name": "Dano Crítico III", "description": "Aumenta o dano do acerto crítico em 10%",
             "effect_type": "critical_damage", "effect_value": "10", "requires": 11},
            {"id": 13, "name": "Ataque Pesado IV", "description": "Aumenta dano base em +0.2x (20%)",
             "effect_type": "damage", "effect_value": "0.2", "requires": 12},
            {"id": 14, "name": "Golpe Crítico IV", "description": "+2% chance de acerto crítico",
             "effect_type": "critical_chance", "effect_value": "2", "requires": 13},
            {"id": 15, "name": "Dano Crítico IV", "description": "Aumenta o dano do acerto crítico em 10%",
             "effect_type": "critical_damage", "effect_value": "10", "requires": 14},
            {"id": 16, "name": "Bloqueio Ofensivo II", "description": "Aumenta o bloqueio em 2%",
             "effect_type": "resistance", "effect_value": "2", "requires": 15},
            {"id": 17, "name": "Vampirismo III", "description": "Cura 0,5% do HP ao causar dano",
             "effect_type": "heal_on_damage", "effect_value": "0.005", "requires": 16},
            {"id": 18, "name": "Ataque Pesado V", "description": "Aumenta dano base em +0.2x (20%)",
             "effect_type": "damage", "effect_value": "0.2", "requires": 17},
            {"id": 19, "name": "Golpe Crítico V", "description": "+2% chance de acerto crítico",
             "effect_type": "critical_chance", "effect_value": "2", "requires": 18},
            {"id": 20, "name": "Vampirismo Supremo", "description": "Ao causar dano, cura 3% do HP com base no dano causado e aumenta o dano em 0.5x",
             "effect_type": "special", "effect_value": "heal_percent:3,damage_boost:0.5", "requires": 19}
        ]
    },
    "Defesa e Sobrevivência": {
        "id": "Taurus",
        "name": "Taurus",
        "oldName": "Defesa e Sobrevivência",
        "talents": [
            {"id": 101, "name": "Bloqueio I", "description": "Aumenta 2% bloqueio", 
            "effect_type": "resistance", "effect_value": "2", "requires": None},
            {"id": 106, "name": "+HP Máximo I", "description": "+15 HP máximo", 
            "effect_type": "max_hp", "effect_value": "15", "requires": 101},
            {"id": 109, "name": "Vitalidade I", "description": "+2 Vitalidade", 
            "effect_type": "vitality", "effect_value": "2", "requires": 106},
            {"id": 114, "name": "Cura de Batalha I", "description": "Cura 20HP após derrotar um inimigo", 
            "effect_type": "heal_on_victory", "effect_value": "20", "requires": 109},
            {"id": 102, "name": "Bloqueio II", "description": "Aumenta 2% bloqueio", 
            "effect_type": "resistance", "effect_value": "2", "requires": 114},
            {"id": 110, "name": "Vitalidade II", "description": "+2 Vitalidade", 
            "effect_type": "vitality", "effect_value": "2", "requires": 102},
            {"id": 117, "name": "Cura Matinal I", "description": "Cura 10HP todo início do dia", 
            "effect_type": "morning_heal", "effect_value": "10", "requires": 110},
            {"id": 107, "name": "+HP Máximo II", "description": "+15 HP máximo", 
            "effect_type": "max_hp", "effect_value": "15", "requires": 117},
            {"id": 116, "name": "Regeneração Dupla", "description": "Duplica a regeneração de HP se o HP atual for <30%", 
            "effect_type": "regen_boost_low_hp", "effect_value": "2.0", "requires": 107},
            {"id": 103, "name": "Bloqueio III", "description": "Aumenta 2% bloqueio", 
            "effect_type": "resistance", "effect_value": "2", "requires": 116},
            {"id": 111, "name": "Vitalidade III", "description": "+2 Vitalidade", 
            "effect_type": "vitality", "effect_value": "2", "requires": 103},
            {"id": 118, "name": "Cura Matinal II", "description": "Cura 10HP todo início do dia", 
            "effect_type": "morning_heal", "effect_value": "10", "requires": 111},
            {"id": 104, "name": "Bloqueio IV", "description": "Aumenta 2% bloqueio", 
            "effect_type": "resistance", "effect_value": "2", "requires": 118},
            {"id": 112, "name": "Vitalidade IV", "description": "+2 Vitalidade", 
            "effect_type": "vitality", "effect_value": "2", "requires": 104},
            {"id": 105, "name": "Bloqueio V", "description": "Aumenta 2% bloqueio", 
            "effect_type": "resistance", "effect_value": "2", "requires": 112},
            {"id": 115, "name": "Cura de Batalha II", "description": "Cura 20HP após derrotar um inimigo", 
            "effect_type": "heal_on_victory", "effect_value": "20", "requires": 105},
            {"id": 108, "name": "+HP Máximo III", "description": "+15 HP máximo", 
            "effect_type": "max_hp", "effect_value": "15", "requires": 115},
            {"id": 119, "name": "Cura Matinal III", "description": "Cura 10HP todo início do dia", 
            "effect_type": "morning_heal", "effect_value": "10", "requires": 108},
            {"id": 113, "name": "Vitalidade V", "description": "+2 Vitalidade", 
            "effect_type": "vitality", "effect_value": "2", "requires": 119},
            {"id": 120, "name": "Renovação Total", "description": "Após derrotar um inimigo, cura completamente o HP", 
            "effect_type": "special", "effect_value": "full_heal_on_victory", "requires": 113}
        ]
    },
    "Artes Arcanas": {
        "id": "Aquarius",
        "name": "Aquarius",
        "oldName": "Artes Arcanas",
        "talents": [
            {"id": 201, "name": "MP Máximo I", "description": "+15 MP máximo", 
            "effect_type": "max_mp", "effect_value": "15", "requires": None},
            {"id": 210, "name": "Escudo de Mana I", "description": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", 
            "effect_type": "mana_shield", "effect_value": "1", "requires": 201},
            {"id": 206, "name": "Concentração I", "description": "+2 Concentração", 
            "effect_type": "concentration", "effect_value": "2", "requires": 210},
            {"id": 202, "name": "MP Máximo II", "description": "+15 MP máximo", 
            "effect_type": "max_mp", "effect_value": "15", "requires": 206},
            {"id": 204, "name": "Regeneração Mágica", "description": "Regenera 20 MP no início do dia", 
            "effect_type": "morning_mana", "effect_value": "20", "requires": 202},
            {"id": 211, "name": "Escudo de Mana II", "description": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", 
            "effect_type": "mana_shield", "effect_value": "1", "requires": 204},
            {"id": 207, "name": "Concentração II", "description": "+2 Concentração", 
            "effect_type": "concentration", "effect_value": "2", "requires": 211},
            {"id": 209, "name": "Recuperação Arcana", "description": "Recupera 25MP após derrotar um inimigo", 
            "effect_type": "mana_on_victory", "effect_value": "25", "requires": 207},
            {"id": 218, "name": "Recuperação Mística", "description": "Recupera 25MP após derrotar um inimigo", 
            "effect_type": "mana_on_victory", "effect_value": "25", "requires": 209},
            {"id": 212, "name": "Escudo de Mana III", "description": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", 
            "effect_type": "mana_shield", "effect_value": "1", "requires": 218},
            {"id": 205, "name": "Regeneração Dobrada", "description": "Duplica a regeneração de MP se MP for <30%", 
            "effect_type": "regen_boost_low_mp", "effect_value": "2.0", "requires": 212},
            {"id": 208, "name": "Concentração III", "description": "+2 Concentração", 
            "effect_type": "concentration", "effect_value": "2", "requires": 205},
            {"id": 213, "name": "Escudo de Mana IV", "description": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", 
            "effect_type": "mana_shield", "effect_value": "1", "requires": 208},
            {"id": 215, "name": "Regeneração Menor", "description": "Regenera 5 MP no início do dia", 
            "effect_type": "morning_mana", "effect_value": "5", "requires": 213},
            {"id": 216, "name": "Concentração IV", "description": "+2 Concentração", 
            "effect_type": "concentration", "effect_value": "2", "requires": 215},
            {"id": 203, "name": "MP Máximo III", "description": "+15 MP máximo", 
            "effect_type": "max_mp", "effect_value": "15", "requires": 216},
            {"id": 214, "name": "Escudo de Mana V", "description": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", 
            "effect_type": "mana_shield", "effect_value": "1", "requires": 203},
            {"id": 217, "name": "Concentração V", "description": "+2 Concentração", 
            "effect_type": "concentration", "effect_value": "2", "requires": 214},
            {"id": 219, "name": "Regeneração Superior", "description": "Regenera 15 MP no início do dia", 
            "effect_type": "morning_mana", "effect_value": "15", "requires": 217},
            {"id": 220, "name": "Conversão de Mana", "description": "Cura 10% de HP de todo MP consumido em habilidades", 
            "effect_type": "hp_to_mana_conversion", "effect_value": "10", "requires": 219}
        ]
    },
    "Sorte e Caos": {
        "id": "Hercules",
        "name": "Hercules", 
        "oldName": "Sorte e Caos",
        "talents": [
            {"id": 301, "name": "Sorte I", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": None},
            {"id": 307, "name": "Desconto I", "description": "10% desconto na loja", 
            "effect_type": "shop_discount", "effect_value": "10", "requires": 301},
            {"id": 310, "name": "Crítico Caótico I", "description": "+5% chance de acerto crítico", 
            "effect_type": "chaos_critical", "effect_value": "5", "requires": 307},
            {"id": 313, "name": "Cura Caótica I", "description": "5% de chance de curar totalmente HP e MP no início do dia", 
            "effect_type": "chaos_heal", "effect_value": "5", "requires": 310},
            {"id": 302, "name": "Sorte II", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": 313},
            {"id": 315, "name": "Cristais Dobrados I", "description": "10% de chance de duplicar a quantidade de cristais recebidos", 
            "effect_type": "crystal_double", "effect_value": "10", "requires": 302},
            {"id": 318, "name": "EXP Turbinada I", "description": "Aumenta EXP recebido em 5%", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": 315},
            {"id": 303, "name": "Sorte III", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": 318},
            {"id": 311, "name": "Crítico Caótico II", "description": "+5% chance de acerto crítico", 
            "effect_type": "chaos_critical", "effect_value": "5", "requires": 303},
            {"id": 316, "name": "Cristais Dobrados II", "description": "10% de chance de duplicar a quantidade de cristais recebidos", 
            "effect_type": "crystal_double", "effect_value": "10", "requires": 311},
            {"id": 304, "name": "Sorte IV", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": 316},
            {"id": 314, "name": "Cura Caótica II", "description": "5% de chance de curar totalmente HP e MP no início do dia", 
            "effect_type": "chaos_heal", "effect_value": "5", "requires": 304},
            {"id": 308, "name": "Desconto II", "description": "10% desconto na loja", 
            "effect_type": "shop_discount", "effect_value": "10", "requires": 314},
            {"id": 305, "name": "Sorte V", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": 308},
            {"id": 319, "name": "EXP Turbinada II", "description": "Aumenta EXP recebido em 5%", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": 305},
            {"id": 312, "name": "Crítico Caótico III", "description": "+5% chance de acerto crítico", 
            "effect_type": "chaos_critical", "effect_value": "5", "requires": 319},
            {"id": 306, "name": "Sorte VI", "description": "+2 Sorte", 
            "effect_type": "luck", "effect_value": "2", "requires": 312},
            {"id": 309, "name": "Desconto III", "description": "10% desconto na loja", 
            "effect_type": "shop_discount", "effect_value": "10", "requires": 306},
            {"id": 317, "name": "Cristais Dobrados III", "description": "10% de chance de duplicar a quantidade de cristais recebidos", 
            "effect_type": "crystal_double", "effect_value": "10", "requires": 309},
            {"id": 320, "name": "Ladrão Mestre", "description": "20% de chance de conseguir um baú de recompensa ao logar, tendo logado diariamente nos últimos 5 dias", 
            "effect_type": "special", "effect_value": "reward_chest:20", "requires": 317}
        ]
    },
    "Mente Estratégica": {
        "id": "Pegasus",
        "name": "Pegasus",
        "oldName": "Mente Estratégica",
        "talents": [
            {"id": 401, "name": "EXP Estratégico I", "description": "+5% EXP recebido", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": None},
            {"id": 413, "name": "Vitória Pós-Batalha", "description": "Cura 15 HP ao derrotar um inimigo", 
            "effect_type": "heal_on_victory", "effect_value": "15", "requires": 401},
            {"id": 412, "name": "Início Revitalizante", "description": "Recupera 20MP se começar o dia com HP cheio", 
            "effect_type": "morning_mana_if_full_hp", "effect_value": "20", "requires": 413},
            {"id": 418, "name": "EXP Impecável I", "description": "Recebe 10% a mais de EXP ao derrotar um inimigo sem sofrer dano", 
            "effect_type": "perfect_exp", "effect_value": "10", "requires": 412},
            {"id": 407, "name": "Recuperação Matinal I", "description": "Recupera +5 MP todo início de dia", 
            "effect_type": "morning_mana", "effect_value": "5", "requires": 418},
            {"id": 402, "name": "EXP Estratégico II", "description": "+5% EXP recebido", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": 407},
            {"id": 405, "name": "Cura Matinal I", "description": "Cura +5 HP todo início de dia", 
            "effect_type": "morning_heal", "effect_value": "5", "requires": 402},
            {"id": 409, "name": "Atributo Adicional I", "description": "Recebe 1 ponto de atributo adicional a cada 10 níveis", 
            "effect_type": "bonus_attribute", "effect_value": "1", "requires": 405},
            {"id": 414, "name": "Recuperação Pós-Batalha", "description": "Recupera 10 MP ao derrotar um inimigo", 
            "effect_type": "mana_on_victory", "effect_value": "10", "requires": 409},
            {"id": 415, "name": "Defesa Emergencial I", "description": "Aumenta o bloqueio em 5% se HP atual estiver abaixo de 50% do HP máximo", 
            "effect_type": "emergency_defense", "effect_value": "5", "requires": 414},
            {"id": 403, "name": "EXP Estratégico III", "description": "+5% EXP recebido", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": 415},
            {"id": 406, "name": "Cura Matinal II", "description": "Cura +5 HP todo início de dia", 
            "effect_type": "morning_heal", "effect_value": "5", "requires": 403},
            {"id": 408, "name": "Recuperação Matinal II", "description": "Recupera +5 MP todo início de dia", 
            "effect_type": "morning_mana", "effect_value": "5", "requires": 406},
            {"id": 410, "name": "Atributo Adicional II", "description": "Recebe 1 ponto de atributo adicional a cada 10 níveis", 
            "effect_type": "bonus_attribute", "effect_value": "1", "requires": 408},
            {"id": 411, "name": "Manhã Potente", "description": "Cura 20HP se começar o dia com MP cheio", 
            "effect_type": "morning_heal_if_full_mp", "effect_value": "20", "requires": 410},
            {"id": 404, "name": "EXP Estratégico IV", "description": "+5% EXP recebido", 
            "effect_type": "exp_boost", "effect_value": "5", "requires": 411},
            {"id": 416, "name": "Defesa Emergencial II", "description": "Aumenta o bloqueio em 5% se HP atual estiver abaixo de 50% do HP máximo", 
            "effect_type": "emergency_defense", "effect_value": "5", "requires": 404},
            {"id": 419, "name": "EXP Impecável II", "description": "Recebe 10% a mais de EXP ao derrotar um inimigo sem sofrer dano", 
            "effect_type": "perfect_exp", "effect_value": "10", "requires": 416},
            {"id": 417, "name": "Dano Retaliatório", "description": "+0.5x dano se o dano causado aos inimigos no dia anterior foi 500 ou mais", 
            "effect_type": "retaliatory_damage", "effect_value": "0.5", "requires": 419},
            {"id": 420, "name": "Privança do Mestre", "description": "+20 Sorte, +15 Vitalidade, +15 Concentração", 
            "effect_type": "multi_attribute_boost", "effect_value": "sorte:20,vitalidade:15,concentracao:15", "requires": 417}
        ]
    },
    "Constelação Oculta": {
        "id": "Phoenix",
        "name": "Phoenix",
        "oldName": "Constelação Oculta",
        "talents": [
            {"id": 501, "name": "Espada do Verbo", "description": "Aumenta o dano base em +1.0x",
             "effect_type": "damage", "effect_value": "1.0", "requires": None},
            {"id": 502, "name": "Juízo Final", "description": "Aumenta a chance de crítico em 5%",
             "effect_type": "global_critical_chance", "effect_value": "5", "requires": None},
            {"id": 503, "name": "Selo de Luz", "description": "Concede +7 HP e +7 MP por golpe carregado",
             "effect_type": "charged_attack_bonus", "effect_value": "hp:7,mp:7", "requires": None},
            {"id": 504, "name": "Graça", "description": "Aumenta a chance de esquiva em 5%",
            "effect_type": "dodge", "effect_value": "5", "requires": None},
            {"id": 505, "name": "Guardião Silencioso", "description": "Ao iniciar o dia com HP cheio, concede um escudo de 25 HP",
             "effect_type": "special", "effect_value": "shield_on_full_hp:25", "requires": None},
            {"id": 506, "name": "Inspiração Sagrada", "description": "Regenera 3% do HP e 3% do MP a cada 10 minutos de estudo",
             "effect_type": "special", "effect_value": "regeneration:3", "requires": None}
        ]
    }
}

# Importando SimpleNamespace para criar objetos temporários
from types import SimpleNamespace

def parse_talent_effect(effect_description):
    """
    Extrai o tipo e valor do efeito a partir da descrição do talento.
    """
    print(f"Analisando efeito: '{effect_description}'")
    effect_description = effect_description.lower()
    
    # Mapeamento de padrões para tipos de efeito
    effect_patterns = {
        "dano em": "damage",
        "dano base em": "damage",
        "aumenta o dano em": "damage",
        "chance de acerto crítico": "critical_chance",
        "chance crítico": "critical_chance",
        "dano do acerto crítico": "critical_damage",
        "bloqueio": "block",  # Alterado para 'block' em vez de 'resistance'
        "hp máximo": "max_hp",
        "vitalidade": "vitality",
        "sorte": "luck",
        "resistência": "resistance",  # Para aumentos diretos de resistência
        "cura": "heal",
        "recupera": "heal",
        "regenera": "regen",
        "exp recebido": "bonus_xp",
        "desconto": "shop_discount",
        "duplicar": "double_chance",
        "chance de duplicar": "double_chance",
        "atributo adicional": "bonus_attribute",
    }
    
    # Identificar o tipo de efeito
    effect_type = None
    for pattern, type_id in effect_patterns.items():
        if pattern in effect_description:
            effect_type = type_id
            print(f"Padrão '{pattern}' encontrado -> tipo: {type_id}")
            break
    
    # Tratamentos especiais
    if "cura" in effect_description and "ao causar dano" in effect_description:
        effect_type = "heal_on_damage"
        print("Efeito especial detectado: heal_on_damage")
    
    # Extrair valor numérico
    import re
    numeric_values = re.findall(r'(\d+(?:\.\d+)?)', effect_description)
    effect_value = float(numeric_values[0]) if numeric_values else 0
    print(f"Valor numérico extraído: {effect_value}")
    
    if not effect_type:
        effect_type = "special"
        print("Nenhum tipo específico identificado, usando 'special'")
        
    return effect_type, effect_value

def initialize_player_attributes(player_id):
    """Inicializa os atributos necessários para os talentos no jogador."""
    player = Player.query.get(player_id)
    if not player:
        print("Jogador não encontrado para inicialização de atributos")
        return False
    
    # Configurar atributos para efeitos de talentos se não existirem
    if not hasattr(player, 'damage_bonus'):
        player.damage_bonus = 0.0
    
    if not hasattr(player, 'critical_chance_bonus'):
        player.critical_chance_bonus = 0.0
    
    if not hasattr(player, 'critical_damage_bonus'):
        player.critical_damage_bonus = 0.0
    
    if not hasattr(player, 'heal_on_damage_percent'):
        player.heal_on_damage_percent = 0.0
    
    if not hasattr(player, 'heal_on_victory'):
        player.heal_on_victory = 0
    
    if not hasattr(player, 'exp_boost'):
        player.exp_bonus = 0.0
    
    if not hasattr(player, 'block_bonus'):
        player.block_bonus = 0.0
    
    if not hasattr(player, 'max_hp_bonus'):
        player.max_hp_bonus = 0
    
    
    # Salvar no banco de dados
    db.session.commit()
    print(f"Atributos do jogador {player.id} inicializados com sucesso")
    return True


@talents_bp.before_app_request
def apply_daily_talent_effects():
    """Aplica efeitos diários dos talentos, como cura matinal."""
    # Pular para arquivos estáticos e solicitações não-GET
    if request.endpoint and (request.endpoint.startswith('static') or request.method != 'GET'):
        return
    
    # Verificar se estamos na página principal de gamificação ou em uma página de batalha
    if request.endpoint in ['gamification', 'battle']:
        player = Player.query.first()
        if not player:
            return
        
        # Obter a data atual
        today = datetime.now(timezone.utc).date()
        
        # Verificar se já aplicamos efeitos hoje (armazenado na sessão)
        last_effects_date = session.get('last_daily_effects_date')
        
        if not last_effects_date or last_effects_date != today.isoformat():
            print("Aplicando efeitos diários de talentos...")
            
            # Aplicar cura matinal
            if hasattr(player, 'morning_heal_amount') and player.morning_heal_amount > 0:
                heal_amount = player.morning_heal_amount
                old_hp = player.hp
                player.hp = min(player.hp + heal_amount, player.max_hp)
                actual_heal = player.hp - old_hp
                
                if actual_heal > 0:
                    flash_gamification(f"Cura Matinal: Recuperou {actual_heal} HP!")
                    print(f"Aplicada cura matinal: +{actual_heal} HP")
            
            # Verificar efeitos de cura caótica (chance de cura total)
            if hasattr(player, 'chaos_heal_chance') and player.chaos_heal_chance > 0:
                # Valor base de chance (ajustado pela sorte)
                base_chance = player.chaos_heal_chance
                luck_bonus = player.luck / 1000  # Cada 100 de sorte adiciona 10% à chance base
                final_chance = min(base_chance * (1 + luck_bonus), 0.50)  # Máximo de 50%
                
                if random.random() < final_chance:
                    old_hp = player.hp
                    player.hp = player.max_hp
                    
                    flash_gamification("✨ Cura Caótica ativada! HP totalmente recuperado!")
                    print(f"Cura caótica ativada: HP {old_hp}->{player.hp}")
            
            # Verificar escudo se HP estiver cheio
            if hasattr(player, 'shield_on_full_hp') and player.shield_on_full_hp > 0:
                if player.hp >= player.max_hp:  # HP está cheio
                    # Escudo é implementado como um bônus temporário de HP
                    # Aqui precisaríamos criar um sistema de buff temporário
                    # Por enquanto, apenas notificamos o jogador
                    shield_amount = player.shield_on_full_hp
                    flash_gamification(f"🛡️ Guardião Silencioso: Obteve escudo de {shield_amount} HP!")
                    print(f"Escudo ativado: +{shield_amount} HP de proteção")
            
            if getattr(player, 'retaliatory_damage', 0) > 0:
                yesterday = today - timedelta(days=1)
                # supondo que você armazene em DailyStats o total de dano; adapte conforme seu esquema
                stats_yesterday = DailyStats.query.filter_by(date=yesterday).first()
                damage_yesterday = stats_yesterday.cards_studied_damage if stats_yesterday else 0
                if damage_yesterday >= 500:
                    player.damage_multiplier += player.retaliatory_damage
                    flash(f"Dano Retaliatório ativado: +{player.retaliatory_damage:.1f}× de dano hoje!", "gamification")
            
            # Salvar mudanças
            db.session.commit()
            
            # Marcar que já aplicamos efeitos hoje
            session['last_daily_effects_date'] = today.isoformat()

def apply_talent_effects(player, talent):
    """
    Aplica os efeitos do talento ao jogador.
    Manipula todos os tipos de efeitos e salva diretamente nos atributos do jogador.
    """
    # Verifica se já foi aplicado antes - NÃO removerá talentos diários! É só pra permanentes
    exists = AppliedTalentEffect.query.filter_by(
        player_id=player.id,
        talent_id=talent.id
    ).first()
    if exists:
        return  # já aplicado, não faz nada
    
    print(f"\n===== APLICANDO EFEITO DO TALENTO =====")
    print(f"Talento: {talent.id} - {talent.name}")
    print(f"Descrição: {talent.description}")
    
    # Estado antes da aplicação
    print(f"ANTES - HP Máx: {player.max_hp}")
    print(f"ANTES - Vitality: {player.vitality}")
    print(f"ANTES - Resistência: {player.resistance}, Sorte: {player.luck}")
    print(f"ANTES - Dano base: {calculate_strength_damage(player.strength) + player.damage_bonus:.2f}")
    
    effect_type = talent.effect_type
    effect_value = talent.effect_value
    
    # Converter effect_value para float se possível
    try:
        effect_value = float(effect_value)
    except (ValueError, TypeError):
        # Se não puder ser convertido, manter como string
        pass
    
    # Aplicar efeito baseado no tipo
    if effect_type == 'damage':
        player.damage_bonus += effect_value
        novo = calculate_strength_damage(player.strength) + player.damage_bonus
        print(f"✅ Dano base aumentado em {effect_value} → Novo dano base: {novo:.2f}")
    
    elif effect_type == 'critical_chance' or effect_type == 'chaos_critical':
        # Converter porcentagem para decimal (ex: 3% → 0.03)
        chance_value = effect_value / 100 if effect_value > 1 else effect_value
        player.critical_chance_bonus += chance_value
        print(f"✅ Chance crítica aumentada em {effect_value}% → Total: {player.critical_chance_bonus*100:.1f}%")
    
    elif effect_type == 'critical_damage':
        # Converter porcentagem para decimal (ex: 15% → 0.15)
        damage_value = effect_value / 100 if effect_value > 1 else effect_value
        player.critical_damage_bonus += damage_value
        print(f"✅ Dano crítico aumentado em {effect_value}% → Total: {player.critical_damage_bonus*100:.1f}%")

    elif effect_type == 'resistance':
        # Verificar se o efeito é de um talento de Bloqueio
        if "Bloqueio" in talent.name:
            player.block_bonus += effect_value
            print(f"✅ Bloqueio aumentado em {effect_value}% → Total: {player.block_bonus}%")
        else:
            # Aumentar o atributo resistência diretamente
            player.resistance += effect_value
            print(f"✅ Resistência aumentada em {effect_value} → Novo valor: {player.resistance}")
    
    elif effect_type == 'vitality':
        player.vitality += effect_value
        print(f"✅ Vitalidade aumentada em {effect_value} → Novo valor: {player.vitality}")

    elif effect_type == 'max_hp':
        # Bônus de HP máximo de talentos
        player.max_hp_bonus = getattr(player, 'max_hp_bonus', 0) + effect_value
        print(f"✅ Bônus de HP Máximo aumentado em {effect_value} → total max_hp_bonus: {player.max_hp_bonus}")

    elif effect_type == 'luck':
        player.luck += effect_value
        print(f"✅ Sorte aumentada em {effect_value} → Novo valor: {player.luck}")
    
    elif effect_type == 'heal_on_damage':
        player.heal_on_damage_percent += effect_value
        print(f"✅ Cura ao Causar Dano: {effect_value*100}% do dano → Total: {player.heal_on_damage_percent*100:.1f}%")
    
    elif effect_type == 'heal_on_victory':
        player.heal_on_victory += int(effect_value)
        print(f"✅ Cura ao Vencer: +{effect_value} HP → Total: {player.heal_on_victory}")
    
    elif effect_type == 'morning_heal':
        player.morning_heal_amount += int(effect_value)
        print(f"✅ Cura Matinal: +{effect_value} HP → Total: {player.morning_heal_amount}")
    
    elif effect_type == 'regen_boost_low_hp':
        player.hp_regen_low_hp_multiplier = float(effect_value)
        print(f"✅ Multiplicador de Regeneração HP: x{effect_value} quando HP < 30%")
    
    elif effect_type == 'emergency_defense':
        player.emergency_defense_bonus += float(effect_value)
        print(f"✅ Defesa Emergencial: +{effect_value}% quando HP < 50% → Total: {player.emergency_defense_bonus}%")
    
    elif effect_type == 'exp_boost':
        # Converter porcentagem para decimal (ex: 10% → 0.1)
        exp_boost = effect_value / 100 if effect_value > 1 else effect_value
        player.exp_boost += exp_boost
        print(f"✅ Bônus de EXP: +{effect_value}% → Total: {player.exp_boost*100:.1f}%")
    
    elif effect_type == 'shop_discount':
        # Converter porcentagem para decimal (ex: 10% → 0.1)
        discount = effect_value / 100 if effect_value > 1 else effect_value
        player.shop_discount += discount
        print(f"✅ Desconto na Loja: +{effect_value}% → Total: {player.shop_discount*100:.1f}%")
    
    elif effect_type == 'perfect_exp':
        # Bônus de XP para vitória sem dano
        bonus = effect_value / 100 if effect_value > 1 else effect_value
        player.perfect_exp_bonus += bonus
        print(f"✅ EXP por Vitória Perfeita: +{effect_value}% → Total: {player.perfect_exp_bonus*100:.1f}%")
    
    elif effect_type == 'bonus_attribute':
        player.bonus_attribute_per_10 += int(effect_value)
        print(f"✅ +{effect_value} ponto(s) de atributo a cada 10 níveis → Total: {player.bonus_attribute_per_10}")
    
    elif effect_type == 'chaos_heal':
        # Chance de cura total aleatória
        chance = effect_value / 100 if effect_value > 1 else effect_value
        player.chaos_heal_chance += chance
        print(f"✅ Chance de Cura Caótica: +{effect_value}% → Total: {player.chaos_heal_chance*100:.1f}%")
    
    elif effect_type == 'crystal_double':
        # Chance de cristais duplos
        chance = effect_value / 100 if effect_value > 1 else effect_value
        player.crystal_double_chance += chance
        print(f"✅ Chance de Cristais Dobrados: +{effect_value}% → Total: {player.crystal_double_chance*100:.1f}%")

    elif effect_type == 'multi_attribute_boost':
        # Mapeamento de nomes em português para inglês
        attr_mapping = {
            'sorte': 'luck',
            'vitalidade': 'vitality', 
            'concentracao': 'concentration',
            'resistencia': 'resistance',
            'forca': 'strength'
        }
        
        for part in effect_value.split(','):
            attr, val = part.split(':')
            val = int(val)
            
            # Usar o mapeamento para obter o nome correto do atributo
            attr_name = attr_mapping.get(attr, attr)
            
            setattr(player, attr_name, getattr(player, attr_name) + val)
            print(f"✅ {attr.capitalize()} aumentada em {val} → Novo valor: {getattr(player, attr_name)}")

    elif effect_type == 'regeneration':
        # effect_value = 5 → 5%
        regen_pct = effect_value / 100
        player.regen_per_study_time = regen_pct
        print(f"✅ Regeneração periódica: {effect_value}% do HP/MP máximo a cada 10 min")

    elif effect_type == 'retaliatory_damage':
        # effect_value vem como string, ex: "0.5"
        bonus = float(effect_value)
        # Armazena na instância do jogador
        player.retaliatory_damage_bonus = bonus
        print(f"✅ Dano Retaliatório: +{effect_value}× dano se ontem ≥ 500")

    elif effect_type == 'dodge':
        # Adicionar bônus de esquiva
        player.dodge_talent_bonus += float(effect_value) / 100
        print(f"✅ Chance de Esquiva aumentada em {effect_value}% → Total: {player.dodge_talent_bonus*100:.1f}%")

    elif effect_type == 'special':
        # Efeitos especiais - processar caso a caso
        if effect_value == 'full_heal_on_victory':
            player.full_heal_on_victory = True
            print("✅ Efeito Especial: Cura completa após vitória ativada")
        
        elif isinstance(effect_value, str) and 'reward_chest' in effect_value:
            # Formato: "reward_chest:20" (20% de chance)
            parts = effect_value.split(':')
            if len(parts) > 1:
                chance = float(parts[1]) / 100
                player.login_chest_chance = chance
                print(f"✅ Efeito Especial: {parts[1]}% chance de baú de recompensa ao fazer login")
        
        elif isinstance(effect_value, str) and 'double_attack_chance' in effect_value:
            # Formato: "double_attack_chance:10" (10% de chance)
            parts = effect_value.split(':')
            if len(parts) > 1:
                chance = float(parts[1]) / 100
                player.double_attack_chance = chance
                print(f"✅ Efeito Especial: {parts[1]}% chance de ataque duplo")
        
        elif isinstance(effect_value, str) and 'shield_on_full_hp' in effect_value:
            # Formato: "shield_on_full_hp:25" (25 pontos de escudo)
            parts = effect_value.split(':')
            if len(parts) > 1:
                shield = int(parts[1])
                player.shield_on_full_hp = shield
                print(f"✅ Efeito Especial: Escudo de {shield} HP ao iniciar com HP cheio")
        
        elif isinstance(effect_value, str) and 'regeneration' in effect_value:
            # Formato: "regeneration:5" (5% de regeneração)
            parts = effect_value.split(':')
            if len(parts) > 1:
                regen = float(parts[1]) / 100
                player.regen_per_study_time = regen
                print(f"✅ Efeito Especial: {parts[1]}% regeneração a cada 10 minutos de estudo")
        
        elif isinstance(effect_value, str) and 'heal_percent' in effect_value:
            # Formato complexo: "heal_percent:3,damage_boost:0.5"
            parts = effect_value.split(',')
            for part in parts:
                if ':' in part:
                    key, val = part.split(':')
                    if key == 'heal_percent':
                        player.heal_on_damage_percent += float(val) / 100
                        print(f"✅ Efeito Especial: Cura {val}% do dano causado")
                    elif key == 'damage_boost':
                        player.damage_bonus += float(val)
                        print(f"✅ Efeito Especial: +{val} de dano base")
        
        elif isinstance(effect_value, str) and 'multi_attribute_boost' in effect_value:
            # Formato: "sorte:20,vitalidade:15,concentracao:15"
            parts = effect_value.split(',')
            for part in parts:
                if ':' in part:
                    key, val = part.split(':')
                    if key == 'sorte':
                        player.luck += int(val)
                        print(f"✅ Efeito Especial: +{val} Sorte")
                    elif key == 'vitalidade':
                        player.vitality += int(val)
                        print(f"✅ Efeito Especial: +{val} Vitalidade")
    
    # Registrar que o efeito foi aplicado
    new_effect = AppliedTalentEffect(
        player_id=player.id,
        talent_id=talent.id,
        effect_type=talent.effect_type,
        effect_value=talent.effect_value
    )
    db.session.add(new_effect)
    
    # Imprimir estado após a aplicação
    print(f"DEPOIS - HP Máx: {player.max_hp}")
    print(f"DEPOIS - Vitality: {player.vitality}")
    print(f"DEPOIS - Resistência: {player.resistance}, Sorte: {player.luck}")
    print(f"DEPOIS - Dano base: {1.0 + player.damage_bonus:.2f}")
    print("========================================\n")

    # Recalcular cache quando talentos afetam dano/defesa
    cache_affecting_talents = [
        'damage', 'damage_bonus', 'critical_chance', 'critical_damage', 'lifesteal',
        'vitality', 'luck', 'resistance', 'block_bonus',
        'dodge_bonus', 'strength', 'max_hp_bonus'
    ]
    
    if talent.effect_type in cache_affecting_talents:
        from .battle_cache import calculate_attack_cache
        calculate_attack_cache(player.id)
        print(f"Cache recalculado - talento {talent.name} aplicado")

    db.session.commit()

def initialize_player_talents_simple(player_id):
    """
    Zera todos os bônus de talentos e reaplica todos os talentos desbloqueados pelo jogador.
    """
    player = Player.query.get(player_id)
    if not player:
        print("Jogador não encontrado")
        return
    
    # Limpar todas as aplicações anteriores para este jogador,
    # forçando o apply_talent_effects a ser executado de novo em cada talento.
    AppliedTalentEffect.query.filter_by(player_id=player.id).delete()
    db.session.commit()

    print(f"==== INICIALIZANDO TALENTOS DO JOGADOR {player.id} ====")

    # Zerar todos os bônus de talentos
    player.damage_bonus              = 0.0
    player.critical_chance_bonus     = 0.0
    player.critical_damage_bonus     = 0.0
    player.heal_on_damage_percent    = 0.0
    player.heal_on_victory           = 0.0
    player.morning_heal_amount       = 0.0
    player.regen_boost_low_hp        = 1.0
    player.block_bonus               = 0.0
    player.emergency_defense_bonus   = 0.0
    player.exp_boost                 = 0.0
    player.bonus_attribute_per_10    = 0
    player.chaos_critical_chance     = 0.0
    player.chaos_heal_chance         = 0.0
    player.perfect_exp_bonus         = 0.0
    player.full_heal_on_victory      = False
    player.reward_chest_chance       = 0.0
    player.double_attack_chance      = 0.0
    player.shield_on_full_hp         = 0.0
    player.regen_per_study_time      = 0.0
    player.max_hp_bonus              = 0.0
    player.shop_discount             = 0.0
    player.dodge_talent_bonus        = 0.0

    print("Bônus zerados com sucesso")

    # Reaplicar todos os talentos desbloqueados (exceto atributos)
    player_talents = PlayerTalent.query.filter_by(player_id=player.id).all()
    for pt in player_talents:
        talent = Talent.query.get(pt.talent_id)
        if not talent:
            continue

        # Pula talentos de atributo para não duplicar bônus
        if talent.effect_type in ['vitality', 'luck']:
            continue

        apply_talent_effects(player, talent)

    # Recalcular estatísticas
    if hasattr(player, 'recalculate_stats_enhanced'):
        player.recalculate_stats_enhanced()
    else:
        player.recalculate_stats()
    db.session.commit()
    print("==== INICIALIZAÇÃO DE TALENTOS CONCLUÍDA ====")

# Rotas do Blueprint

@talents_bp.route('/gamification/talents')
def talents():
    """Página da árvore de talentos."""
    player = Player.query.first()
    if not player:
        return redirect(url_for('gamification'))
    
    # Obter talentos desbloqueados pelo jogador
    player_talents = PlayerTalent.query.filter_by(player_id=player.id).all()
    
    return render_template('gamification/talents.html', 
                          player=player, 
                          player_talents=player_talents,
                          get_exp_for_next_level=get_exp_for_next_level)

@talents_bp.route('/gamification/get_player_talents')
def get_player_talents():
    """API para obter talentos desbloqueados pelo jogador."""
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})
    
    # Obter talentos desbloqueados pelo jogador
    player_talents = PlayerTalent.query.filter_by(player_id=player.id).all()
    
    # Converter para formato JSON
    talents = [
        {
            'id': pt.talent_id,
            'level': pt.level,  # Incluir o nível
            'unlocked_at': pt.unlocked_at.isoformat() if pt.unlocked_at else None
        }
        for pt in player_talents
    ]
    
    return jsonify({
        'success': True, 
        'talents': talents,
        'talent_points': player.talent_points
    })

@talents_bp.route('/gamification/get_talent_data')
def get_talent_data():
    """Retorna o dicionário completo de talentos em JSON."""
    return jsonify(talents_data)

@talents_bp.route('/gamification/unlock_talent', methods=['POST'])
def unlock_talent():
    data = request.get_json()
    try:
        talent_id = int(data.get("talent_id"))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': "ID de talento inválido"}), 400

    # 1) Obter jogador
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404

    # 2) Verificar pontos
    if player.talent_points <= 0:
        return jsonify({'success': False, 'message': "Pontos de talento insuficientes"}), 400

    # 3) Checar se já desbloqueado
    if PlayerTalent.query.filter_by(player_id=player.id, talent_id=talent_id).first():
        return jsonify({'success': False, 'message': "Talento já desbloqueado"}), 400

    # 4) Localizar no talents_data e verificar pré-requisito
    talent_data = None
    for branch in talents_data.values():
        for t in branch["talents"]:
            if t["id"] == talent_id:
                talent_data = t
                break
        if talent_data:
            break
    if not talent_data:
        return jsonify({'success': False, 'message': "Talento não encontrado"}), 404

    required = talent_data.get("requires")
    if required:
        if not PlayerTalent.query.filter_by(player_id=player.id, talent_id=required).first():
            return jsonify({'success': False, 'message': "Pré‑requisito não atendido"}), 400

    # 5) Obter objeto Talent do DB ou, se não existir, criar um temporário a partir de talents_data
    talent_obj = Talent.query.get(talent_id)
    if talent_obj is None:
        # cria um objeto simples com os mesmos atributos que apply_talent_effects usa
        d = talent_data
        talent_obj = SimpleNamespace(
            id=d['id'],
            name=d['name'],
            description=d['description'],
            effect_type=d['effect_type'],
            effect_value=d['effect_value']
        )

    # 6) Aplicar o efeito via função centralizada
    try:
        apply_talent_effects(player, talent_obj)
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Erro ao aplicar talento: {e}"}), 500

    # 7) Deduzir ponto e registrar desbloqueio
    player.talent_points -= 1
    new_unlock = PlayerTalent(player_id=player.id, talent_id=talent_id)
    db.session.add(new_unlock)

    # 8) Recalcular estatísticas completas
    if hasattr(player, 'recalculate_stats_enhanced'):
        player.recalculate_stats_enhanced()
    else:
        player.recalculate_stats()

    # 9) Persistir tudo
    db.session.commit()
    return jsonify({'success': True, 'new_points': player.talent_points})


@talents_bp.route('/gamification/add_talent_points', methods=['POST'])
def add_talent_points():
    """Adiciona pontos de talento para testes."""
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})
    
    # Adicionar 5 pontos de talento (ou a quantidade desejada)
    points_to_add = 5
    player.talent_points += points_to_add
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': f'Adicionados {points_to_add} pontos de talento', 
        'total_points': player.talent_points
    })