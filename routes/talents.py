# routes/talents.py - NOVO SISTEMA DE TALENTOS

import json
from datetime import datetime, timezone
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from sqlalchemy import text

from database import db
from models import Player, Talent, PlayerTalent, AppliedTalentEffect
from routes.cards import flash_gamification, get_exp_for_next_level

# Criar o blueprint para as rotas de talentos
talents_bp = Blueprint('talents', __name__)

# ============================================================================
# NOVO SISTEMA DE TALENTOS - EFEITOS FLAT E DISCRETOS
# ============================================================================

talents_data = {
    "Ofensiva": {
        "id": "Draco",
        "name": "Draco",
        "oldName": "Ofensiva",
        "talents": [
            {
                "id": 1,
                "name": "Primeiro Golpe I",
                "description": "+1 dano no primeiro ataque de cada batalha",
                "effect_type": "first_attack_damage",
                "effect_value": "1",
                "cost": 350,
                "requires": None
            },
            {
                "id": 2,
                "name": "Ataque Básico I",
                "description": "+1 dano em ataques básicos",
                "effect_type": "basic_attack_damage",
                "effect_value": "1",
                "cost": 400,
                "requires": 1
            },
            {
                "id": 3,
                "name": "Ataque de Poder I",
                "description": "+1 dano em ataques de poder",
                "effect_type": "power_attack_damage",
                "effect_value": "1",
                "cost": 450,
                "requires": 2
            },
            {
                "id": 4,
                "name": "Ataque Especial I",
                "description": "+1 dano em ataques especiais",
                "effect_type": "special_attack_damage",
                "effect_value": "1",
                "cost": 500,
                "requires": 3
            },
            {
                "id": 5,
                "name": "Devastação",
                "description": "+1 dano em ultimates",
                "effect_type": "ultimate_damage",
                "effect_value": "1",
                "cost": 600,
                "requires": 4
            },
            {
                "id": 6,
                "name": "Primeiro Golpe II",
                "description": "+1 dano no primeiro ataque de cada batalha",
                "effect_type": "first_attack_damage",
                "effect_value": "1",
                "cost": 750,
                "requires": 5
            },
            {
                "id": 7,
                "name": "Ataque Básico II",
                "description": "+1 dano em ataques básicos",
                "effect_type": "basic_attack_damage",
                "effect_value": "1",
                "cost": 1000,
                "requires": 6
            },
            {
                "id": 8,
                "name": "Ataque de Poder II",
                "description": "+1 dano em ataques de poder",
                "effect_type": "power_attack_damage",
                "effect_value": "1",
                "cost": 1250,
                "requires": 7
            },
            {
                "id": 9,
                "name": "Ataque Especial II",
                "description": "+1 dano em ataques especiais",
                "effect_type": "special_attack_damage",
                "effect_value": "1",
                "cost": 1500,
                "requires": 8
            },
            {
                "id": 10,
                "name": "Caçador de Bosses",
                "description": "+2 dano a cada boss vencido na run",
                "effect_type": "damage_per_boss",
                "effect_value": "2",
                "cost": 2000,
                "requires": 9
            }
        ]
    },
    "Vitalidade": {
        "id": "Taurus",
        "name": "Taurus",
        "oldName": "Vitalidade",
        "talents": [
            {
                "id": 101,
                "name": "Vigor I",
                "description": "+5 HP máximo",
                "effect_type": "max_hp_flat",
                "effect_value": "5",
                "cost": 350,
                "requires": None
            },
            {
                "id": 102,
                "name": "Preparação I",
                "description": "+1 HP ao iniciar batalha",
                "effect_type": "start_battle_heal",
                "effect_value": "1",
                "cost": 400,
                "requires": 101
            },
            {
                "id": 103,
                "name": "Triunfo I",
                "description": "+1 HP ao vencer batalha",
                "effect_type": "heal_on_victory",
                "effect_value": "1",
                "cost": 450,
                "requires": 102
            },
            {
                "id": 104,
                "name": "Vigor II",
                "description": "+5 HP máximo",
                "effect_type": "max_hp_flat",
                "effect_value": "5",
                "cost": 500,
                "requires": 103
            },
            {
                "id": 105,
                "name": "Preparação II",
                "description": "+2 HP ao iniciar batalha",
                "effect_type": "start_battle_heal",
                "effect_value": "2",
                "cost": 600,
                "requires": 104
            },
            {
                "id": 106,
                "name": "Triunfo II",
                "description": "+1 HP ao vencer batalha",
                "effect_type": "heal_on_victory",
                "effect_value": "1",
                "cost": 750,
                "requires": 105
            },
            {
                "id": 107,
                "name": "Vigor III",
                "description": "+5 HP máximo",
                "effect_type": "max_hp_flat",
                "effect_value": "5",
                "cost": 1000,
                "requires": 106
            },
            {
                "id": 108,
                "name": "Triunfo III",
                "description": "+2 HP ao vencer batalha",
                "effect_type": "heal_on_victory",
                "effect_value": "2",
                "cost": 1250,
                "requires": 107
            },
            {
                "id": 109,
                "name": "Resistência",
                "description": "+10 HP máximo",
                "effect_type": "max_hp_flat",
                "effect_value": "10",
                "cost": 1500,
                "requires": 108
            },
            {
                "id": 110,
                "name": "Matador de Bosses",
                "description": "+3 HP ao derrotar boss",
                "effect_type": "heal_on_boss_kill",
                "effect_value": "3",
                "cost": 2000,
                "requires": 109
            }
        ]
    },
    "Proteção": {
        "id": "Aquarius",
        "name": "Aquarius",
        "oldName": "Proteção",
        "talents": [
            {
                "id": 201,
                "name": "Escudo Inicial I",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 350,
                "requires": None
            },
            {
                "id": 202,
                "name": "Força da Barreira I",
                "description": "Enquanto com barreira ativa, +1 dano",
                "effect_type": "damage_with_barrier",
                "effect_value": "1",
                "cost": 400,
                "requires": 201
            },
            {
                "id": 203,
                "name": "Escudo Inicial II",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 450,
                "requires": 202
            },
            {
                "id": 204,
                "name": "Vampirismo Protetor I",
                "description": "Enquanto com barreira ativa, +1 HP ao atacar",
                "effect_type": "heal_with_barrier",
                "effect_value": "1",
                "cost": 500,
                "requires": 203
            },
            {
                "id": 205,
                "name": "Escudo Inicial III",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 600,
                "requires": 204
            },
            {
                "id": 206,
                "name": "Força da Barreira II",
                "description": "Enquanto com barreira ativa, +1 dano",
                "effect_type": "damage_with_barrier",
                "effect_value": "1",
                "cost": 750,
                "requires": 205
            },
            {
                "id": 207,
                "name": "Escudo Inicial IV",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 1000,
                "requires": 206
            },
            {
                "id": 208,
                "name": "Vampirismo Protetor II",
                "description": "Enquanto com barreira ativa, +1 HP ao atacar",
                "effect_type": "heal_with_barrier",
                "effect_value": "1",
                "cost": 1250,
                "requires": 207
            },
            {
                "id": 209,
                "name": "Escudo Inicial V",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 1500,
                "requires": 208
            },
            {
                "id": 210,
                "name": "Escudo Inicial VI",
                "description": "Começa batalha com 1 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "1",
                "cost": 2000,
                "requires": 209
            }
        ]
    },
    "Economia": {
        "id": "Hercules",
        "name": "Hercules",
        "oldName": "Economia",
        "talents": [
            {
                "id": 301,
                "name": "Viajante do Tempo I",
                "description": "+1 Ampulheta ao iniciar run",
                "effect_type": "start_run_hourglasses",
                "effect_value": "1",
                "cost": 350,
                "requires": None
            },
            {
                "id": 302,
                "name": "Bolso Cheio I",
                "description": "+25 de ouro ao iniciar run",
                "effect_type": "start_run_gold",
                "effect_value": "25",
                "cost": 400,
                "requires": 301
            },
            {
                "id": 303,
                "name": "Viajante do Tempo II",
                "description": "+1 Ampulheta ao iniciar run",
                "effect_type": "start_run_hourglasses",
                "effect_value": "1",
                "cost": 450,
                "requires": 302
            },
            {
                "id": 304,
                "name": "Bolso Cheio II",
                "description": "+25 de ouro ao iniciar run",
                "effect_type": "start_run_gold",
                "effect_value": "25",
                "cost": 500,
                "requires": 303
            },
            {
                "id": 305,
                "name": "Caça-Recompensas I",
                "description": "+50 ouro ao derrotar boss",
                "effect_type": "gold_on_boss_kill",
                "effect_value": "50",
                "cost": 600,
                "requires": 304
            },
            {
                "id": 306,
                "name": "Viajante do Tempo III",
                "description": "+1 Ampulheta ao iniciar run",
                "effect_type": "start_run_hourglasses",
                "effect_value": "1",
                "cost": 750,
                "requires": 305
            },
            {
                "id": 307,
                "name": "Bolso Cheio III",
                "description": "+25 de ouro ao iniciar run",
                "effect_type": "start_run_gold",
                "effect_value": "25",
                "cost": 1000,
                "requires": 306
            },
            {
                "id": 308,
                "name": "Viajante do Tempo IV",
                "description": "+1 Ampulheta ao iniciar run",
                "effect_type": "start_run_hourglasses",
                "effect_value": "1",
                "cost": 1250,
                "requires": 307
            },
            {
                "id": 309,
                "name": "Bolso Cheio IV",
                "description": "+25 de ouro ao iniciar run",
                "effect_type": "start_run_gold",
                "effect_value": "25",
                "cost": 1500,
                "requires": 308
            },
            {
                "id": 310,
                "name": "Caça-Recompensas II",
                "description": "+50 ouro ao derrotar boss",
                "effect_type": "gold_on_boss_kill",
                "effect_value": "50",
                "cost": 2000,
                "requires": 309
            }
        ]
    },
    "Precisão": {
        "id": "Pegasus",
        "name": "Pegasus",
        "oldName": "Precisão",
        "talents": [
            {
                "id": 401,
                "name": "Golpe Certeiro I",
                "description": "+1 HP ao acertar crítico",
                "effect_type": "heal_on_crit",
                "effect_value": "1",
                "cost": 350,
                "requires": None
            },
            {
                "id": 402,
                "name": "Crítico Devastador I",
                "description": "+1 dano em ataques críticos",
                "effect_type": "crit_damage_flat",
                "effect_value": "1",
                "cost": 400,
                "requires": 401
            },
            {
                "id": 403,
                "name": "Ganância I",
                "description": "+10% ouro ganho em batalhas",
                "effect_type": "gold_bonus_percent",
                "effect_value": "10",
                "cost": 450,
                "requires": 402
            },
            {
                "id": 404,
                "name": "Golpe Certeiro II",
                "description": "+1 HP ao acertar crítico",
                "effect_type": "heal_on_crit",
                "effect_value": "1",
                "cost": 500,
                "requires": 403
            },
            {
                "id": 405,
                "name": "Crítico Devastador II",
                "description": "+1 dano em ataques críticos",
                "effect_type": "crit_damage_flat",
                "effect_value": "1",
                "cost": 600,
                "requires": 404
            },
            {
                "id": 406,
                "name": "Resistência Combativa I",
                "description": "+1 energia a cada 10 ataques realizados",
                "effect_type": "energy_per_attacks",
                "effect_value": "1",
                "cost": 750,
                "requires": 405
            },
            {
                "id": 407,
                "name": "Ganância II",
                "description": "+10% ouro ganho em batalhas",
                "effect_type": "gold_bonus_percent",
                "effect_value": "10",
                "cost": 1000,
                "requires": 406
            },
            {
                "id": 408,
                "name": "Desconto I",
                "description": "-5% custo na loja",
                "effect_type": "shop_discount_percent",
                "effect_value": "5",
                "cost": 1250,
                "requires": 407
            },
            {
                "id": 409,
                "name": "Resistência Combativa II",
                "description": "+1 energia a cada 10 ataques realizados",
                "effect_type": "energy_per_attacks",
                "effect_value": "1",
                "cost": 1500,
                "requires": 408
            },
            {
                "id": 410,
                "name": "Desconto II",
                "description": "-10% custo na loja",
                "effect_type": "shop_discount_percent",
                "effect_value": "10",
                "cost": 2000,
                "requires": 409
            }
        ]
    },
    "Constelação Secreta": {
        "id": "Phoenix",
        "name": "Phoenix",
        "oldName": "Constelação Secreta",
        "talents": [
            {
                "id": 501,
                "name": "Primeiro Golpe Supremo",
                "description": "+2 dano no primeiro ataque de cada batalha",
                "effect_type": "first_attack_damage",
                "effect_value": "2",
                "cost": 2500,
                "requires": None
            },
            {
                "id": 502,
                "name": "Escudo Supremo",
                "description": "Começa batalha com 4 de barreira",
                "effect_type": "start_barrier",
                "effect_value": "4",
                "cost": 2500,
                "requires": None
            },
            {
                "id": 503,
                "name": "Vigor Supremo",
                "description": "+15 HP máximo",
                "effect_type": "max_hp_flat",
                "effect_value": "15",
                "cost": 2500,
                "requires": None
            },
            {
                "id": 504,
                "name": "Fortuna Suprema",
                "description": "+150 de ouro ao iniciar run",
                "effect_type": "start_run_gold",
                "effect_value": "150",
                "cost": 2500,
                "requires": None
            },
            {
                "id": 505,
                "name": "Tempo Supremo",
                "description": "+2 Ampulhetas ao iniciar run",
                "effect_type": "start_run_hourglasses",
                "effect_value": "2",
                "cost": 2500,
                "requires": None
            },
            {
                "id": 506,
                "name": "Energia Suprema",
                "description": "+2 energia máxima",
                "effect_type": "max_energy_bonus",
                "effect_value": "2",
                "cost": 2500,
                "requires": None
            }
        ]
    }
}


# ============================================================================
# CACHE DE TALENTOS OTIMIZADO
# ============================================================================

# Cache global para evitar recálculos frequentes
_talent_cache = {}


def get_player_talent_bonuses(player_id):
    """
    Retorna todos os bônus de talentos do jogador de forma otimizada.
    Usa cache para evitar consultas repetidas ao banco.
    """
    global _talent_cache

    cache_key = f"talents_{player_id}"

    # Verificar se temos cache válido (validade de 60 segundos)
    if cache_key in _talent_cache:
        cached_data, timestamp = _talent_cache[cache_key]
        if (datetime.utcnow() - timestamp).seconds < 60:
            return cached_data

    # Inicializar estrutura de bônus
    bonuses = {
        # Dano flat por tipo de ataque
        "first_attack_damage": 0,
        "basic_attack_damage": 0,
        "power_attack_damage": 0,
        "special_attack_damage": 0,
        "ultimate_damage": 0,
        "damage_per_boss": 0,

        # HP
        "max_hp_flat": 0,
        "start_battle_heal": 0,
        "heal_on_victory": 0,
        "heal_on_boss_kill": 0,

        # Barreira
        "start_barrier": 0,
        "damage_with_barrier": 0,
        "heal_with_barrier": 0,

        # Economia
        "start_run_hourglasses": 0,
        "start_run_gold": 0,
        "gold_on_boss_kill": 0,
        "gold_bonus_percent": 0,
        "shop_discount_percent": 0,

        # Crítico e Energia
        "heal_on_crit": 0,
        "crit_damage_flat": 0,
        "energy_per_attacks": 0,

        # Energia máxima
        "max_energy_bonus": 0
    }

    # Buscar todos os talentos do jogador de uma vez
    player_talents = PlayerTalent.query.filter_by(player_id=player_id).all()

    if not player_talents:
        _talent_cache[cache_key] = (bonuses, datetime.utcnow())
        return bonuses

    # Mapear IDs para acesso rápido
    talent_ids = {pt.talent_id for pt in player_talents}

    # Iterar sobre todas as constelações e acumular bônus
    for constellation in talents_data.values():
        for talent in constellation["talents"]:
            if talent["id"] in talent_ids:
                effect_type = talent["effect_type"]
                effect_value = int(talent["effect_value"])

                if effect_type in bonuses:
                    bonuses[effect_type] += effect_value

    # Armazenar no cache
    _talent_cache[cache_key] = (bonuses, datetime.utcnow())

    return bonuses


def invalidate_talent_cache(player_id):
    """Invalida o cache de talentos do jogador."""
    global _talent_cache
    cache_key = f"talents_{player_id}"
    if cache_key in _talent_cache:
        del _talent_cache[cache_key]


def apply_talent_to_player_stats(player):
    """
    Aplica os bônus permanentes de talentos ao jogador (HP máximo, energia máxima).
    Deve ser chamado quando o jogador carrega ou quando talentos mudam.
    """
    bonuses = get_player_talent_bonuses(player.id)

    # Aplicar HP máximo (flat)
    player.max_hp_bonus = bonuses["max_hp_flat"]

    # Aplicar energia máxima (flat)
    player.max_energy = 10 + bonuses["max_energy_bonus"]

    # Atualizar HP se necessário
    if player.hp > player.max_hp + player.max_hp_bonus:
        player.hp = player.max_hp + player.max_hp_bonus


def apply_start_run_bonuses(player):
    """
    Aplica bônus ao iniciar uma nova run (ampulhetas, ouro inicial).
    Deve ser chamado UMA VEZ quando a run começa.
    """
    bonuses = get_player_talent_bonuses(player.id)

    # Ampulhetas
    hourglasses = bonuses["start_run_hourglasses"]
    if hourglasses > 0:
        player.eternal_hourglasses += hourglasses
        player.run_hourglasses_gained += hourglasses
        print(f"🕐 Talentos: +{hourglasses} ampulhetas ao iniciar run")

    # Ouro inicial
    gold = bonuses["start_run_gold"]
    if gold > 0:
        player.run_gold += gold
        player.run_gold_gained += gold
        print(f"💰 Talentos: +{gold} ouro ao iniciar run")


def apply_start_battle_bonuses(player):
    """
    Aplica bônus ao iniciar uma batalha (barreira, heal).
    Deve ser chamado no início de cada batalha.
    """
    bonuses = get_player_talent_bonuses(player.id)

    # Barreira inicial
    barrier = bonuses["start_barrier"]
    if barrier > 0:
        player.barrier += barrier
        print(f"🛡️ Talentos: +{barrier} barreira ao iniciar batalha")

    # Cura inicial
    heal = bonuses["start_battle_heal"]
    if heal > 0:
        old_hp = player.hp
        max_hp = player.max_hp + bonuses["max_hp_flat"]
        player.hp = min(player.hp + heal, max_hp)
        actual_heal = player.hp - old_hp
        if actual_heal > 0:
            print(f"❤️ Talentos: +{actual_heal} HP ao iniciar batalha")


def calculate_talent_damage_bonus(player, attack_type, is_first_attack=False, is_critical=False):
    """
    Calcula o bônus de dano flat dos talentos para um ataque específico.

    Args:
        player: Objeto do jogador
        attack_type: "basic", "power", "special", "ultimate"
        is_first_attack: Se é o primeiro ataque da batalha
        is_critical: Se o ataque é crítico

    Returns:
        int: Bônus de dano flat
    """
    bonuses = get_player_talent_bonuses(player.id)
    total_bonus = 0

    # Bônus por tipo de ataque
    if attack_type == "basic":
        total_bonus += bonuses["basic_attack_damage"]
    elif attack_type == "power":
        total_bonus += bonuses["power_attack_damage"]
    elif attack_type == "special":
        total_bonus += bonuses["special_attack_damage"]
    elif attack_type == "ultimate":
        total_bonus += bonuses["ultimate_damage"]

    # Bônus de primeiro ataque
    if is_first_attack:
        total_bonus += bonuses["first_attack_damage"]

    # Bônus de crítico
    if is_critical:
        total_bonus += bonuses["crit_damage_flat"]

    # Bônus por barreira ativa
    if player.barrier > 0:
        total_bonus += bonuses["damage_with_barrier"]

    # Bônus por bosses derrotados na run
    total_bonus += bonuses["damage_per_boss"] * player.run_bosses_defeated

    return total_bonus


def apply_talent_on_attack(player, is_critical=False):
    """
    Aplica efeitos de talentos após um ataque (heal com barreira, heal no crit).

    Args:
        player: Objeto do jogador
        is_critical: Se o ataque foi crítico

    Returns:
        int: Total de HP curado
    """
    bonuses = get_player_talent_bonuses(player.id)
    total_heal = 0

    # Heal com barreira ativa
    if player.barrier > 0:
        total_heal += bonuses["heal_with_barrier"]

    # Heal em crítico
    if is_critical:
        total_heal += bonuses["heal_on_crit"]

    if total_heal > 0:
        max_hp = player.max_hp + bonuses["max_hp_flat"]
        old_hp = player.hp
        player.hp = min(player.hp + total_heal, max_hp)
        actual_heal = player.hp - old_hp
        if actual_heal > 0:
            print(f"❤️ Talentos: +{actual_heal} HP após ataque")
        return actual_heal

    return 0


def apply_talent_on_victory(player, is_boss=False):
    """
    Aplica efeitos de talentos após vencer uma batalha.

    Args:
        player: Objeto do jogador
        is_boss: Se o inimigo derrotado era um boss

    Returns:
        tuple: (hp_healed, gold_bonus)
    """
    bonuses = get_player_talent_bonuses(player.id)

    # Heal ao vencer
    heal = bonuses["heal_on_victory"]

    # Bônus extra se for boss
    if is_boss:
        heal += bonuses["heal_on_boss_kill"]

    hp_healed = 0
    if heal > 0:
        max_hp = player.max_hp + bonuses["max_hp_flat"]
        old_hp = player.hp
        player.hp = min(player.hp + heal, max_hp)
        hp_healed = player.hp - old_hp
        if hp_healed > 0:
            print(f"❤️ Talentos: +{hp_healed} HP ao vencer batalha")

    # Ouro ao derrotar boss
    gold_bonus = 0
    if is_boss:
        gold_bonus = bonuses["gold_on_boss_kill"]
        if gold_bonus > 0:
            player.run_gold += gold_bonus
            player.run_gold_gained += gold_bonus
            print(f"💰 Talentos: +{gold_bonus} ouro ao derrotar boss")

    return hp_healed, gold_bonus


def calculate_gold_bonus_percent(player_id):
    """Retorna o bônus percentual de ouro dos talentos."""
    bonuses = get_player_talent_bonuses(player_id)
    return bonuses["gold_bonus_percent"] / 100  # Converter para decimal


def calculate_shop_discount(player_id):
    """Retorna o desconto percentual da loja dos talentos."""
    bonuses = get_player_talent_bonuses(player_id)
    return bonuses["shop_discount_percent"] / 100  # Converter para decimal


def check_energy_per_attacks(player):
    """
    Verifica se o jogador deve ganhar energia por ataques realizados.
    Deve ser chamado após cada ataque.

    Returns:
        int: Energia ganha (0 se nenhuma)
    """
    bonuses = get_player_talent_bonuses(player.id)
    energy_per_10 = bonuses["energy_per_attacks"]

    if energy_per_10 <= 0:
        return 0

    # Verificar se atingiu múltiplo de 10
    if player.total_attacks_any_type > 0 and player.total_attacks_any_type % 10 == 0:
        energy_gained = energy_per_10
        player.energy = min(player.energy + energy_gained, player.max_energy)
        print(f"⚡ Talentos: +{energy_gained} energia (total de {player.total_attacks_any_type} ataques)")
        return energy_gained

    return 0


# ============================================================================
# ROTAS DO BLUEPRINT
# ============================================================================

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
            'level': pt.level,
            'unlocked_at': pt.unlocked_at.isoformat() if pt.unlocked_at else None
        }
        for pt in player_talents
    ]

    return jsonify({
        'success': True,
        'talents': talents,
        'crystals': player.crystals
    })


@talents_bp.route('/gamification/get_talent_data')
def get_talent_data():
    """Retorna o dicionário completo de talentos em JSON."""
    return jsonify(talents_data)


@talents_bp.route('/gamification/unlock_talent', methods=['POST'])
def unlock_talent():
    """Desbloqueia um talento usando cristais de memória."""
    data = request.get_json()
    try:
        talent_id = int(data.get("talent_id"))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': "ID de talento inválido"}), 400

    # 1) Obter jogador
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404

    # 2) Localizar talento no talents_data
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

    # 3) Verificar se já desbloqueado
    if PlayerTalent.query.filter_by(player_id=player.id, talent_id=talent_id).first():
        return jsonify({'success': False, 'message': "Talento já desbloqueado"}), 400

    # 4) Verificar pré-requisito
    required = talent_data.get("requires")
    if required:
        if not PlayerTalent.query.filter_by(player_id=player.id, talent_id=required).first():
            return jsonify({'success': False, 'message': "Pré-requisito não atendido"}), 400

    # 5) Verificar cristais suficientes
    cost = talent_data.get("cost", 0)
    if player.crystals < cost:
        return jsonify({'success': False, 'message': f"Cristais insuficientes. Necessário: {cost}, Disponível: {player.crystals}"}), 400

    # 6) Deduzir cristais e registrar desbloqueio
    player.crystals -= cost
    new_unlock = PlayerTalent(player_id=player.id, talent_id=talent_id)
    db.session.add(new_unlock)

    # 7) Invalidar cache
    invalidate_talent_cache(player.id)

    # 8) Aplicar efeitos permanentes (HP máximo, energia máxima)
    apply_talent_to_player_stats(player)

    # 9) Recalcular estatísticas
    if hasattr(player, 'recalculate_stats_enhanced'):
        player.recalculate_stats_enhanced()

    # 10) Persistir tudo
    db.session.commit()

    return jsonify({
        'success': True,
        'new_crystals': player.crystals,
        'talent_name': talent_data["name"],
        'message': f"Talento '{talent_data['name']}' desbloqueado!"
    })


@talents_bp.route('/gamification/add_crystals', methods=['POST'])
def add_crystals():
    """Adiciona cristais para testes."""
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})

    # Adicionar cristais (padrão 1000)
    crystals_to_add = request.json.get('amount', 1000)
    player.crystals += crystals_to_add
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Adicionados {crystals_to_add} cristais',
        'total_crystals': player.crystals
    })


@talents_bp.route('/gamification/reset_talents', methods=['POST'])
def reset_talents():
    """Reseta todos os talentos do jogador (para testes)."""
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})

    # Remover todos os talentos do jogador
    PlayerTalent.query.filter_by(player_id=player.id).delete()
    AppliedTalentEffect.query.filter_by(player_id=player.id).delete()

    # Invalidar cache
    invalidate_talent_cache(player.id)

    # Resetar stats relacionados
    player.max_hp_bonus = 0
    player.max_energy = 10

    if hasattr(player, 'recalculate_stats_enhanced'):
        player.recalculate_stats_enhanced()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Todos os talentos foram resetados'
    })


# ============================================================================
# FUNÇÃO DE INICIALIZAÇÃO PARA COMPATIBILIDADE COM APP.PY
# ============================================================================

def initialize_player_talents_simple(player_id):
    """
    Função de compatibilidade - garante que o sistema de talentos está pronto.
    No novo sistema, não é necessário inicializar talentos individuais.
    Apenas aplica os bônus permanentes se o jogador já tiver talentos.
    """
    player = Player.query.get(player_id)
    if not player:
        return

    # Aplicar bônus permanentes de talentos existentes
    apply_talent_to_player_stats(player)

    # Commit se houver mudanças
    db.session.commit()
    print(f"✅ Sistema de talentos inicializado para jogador {player_id}")
