"""
Serviço de recompensas - Gerencia aplicação de recompensas de vitória
"""
from database import db
from models import Player, PlayerProgress

def apply_victory_rewards(player_id, enemy_data):
    """
    Aplica recompensas de vitória ao jogador

    Args:
        player_id: ID do jogador
        enemy_data: Dados do inimigo derrotado (dict ou objeto)

    Returns:
        dict: Dicionário com as recompensas aplicadas
    """
    try:
        player = Player.query.get(player_id)
        if not player:
            raise ValueError(f"Jogador {player_id} não encontrado")

        # Obter número do inimigo - CORREÇÃO: usar PlayerProgress ao invés de player.enemies_defeated
        progress = PlayerProgress.query.filter_by(player_id=player_id).first()
        if not progress:
            # Se não existe progress, criar um novo
            progress = PlayerProgress(player_id=player_id, generic_enemies_defeated=0)
            db.session.add(progress)
            db.session.commit()

        # Obter número do inimigo dos dados ou do progress
        if isinstance(enemy_data, dict):
            enemy_number = enemy_data.get('number', progress.generic_enemies_defeated)
            enemy_rarity = enemy_data.get('rarity', 1)
        else:
            enemy_number = getattr(enemy_data, 'number', progress.generic_enemies_defeated)
            enemy_rarity = getattr(enemy_data, 'rarity', 1)

        # Calcular recompensas baseadas no número e raridade do inimigo
        rewards = {
            'exp_reward': calculate_exp_reward(enemy_number, enemy_rarity),
            'gold_gained': calculate_gold_reward(enemy_number, enemy_rarity),
            'crystals_gained': calculate_crystal_reward(enemy_rarity),
            'hourglasses_gained': calculate_hourglass_reward(enemy_rarity)
        }

        # Aplicar experiência
        player.experience += rewards['exp_reward']

        # Aplicar moedas E atualizar contadores de run
        if rewards['crystals_gained'] > 0:
            player.crystals += rewards['crystals_gained']
            player.run_crystals_gained += rewards['crystals_gained']

        if rewards['gold_gained'] > 0:
            player.run_gold += rewards['gold_gained']
            player.run_gold_gained += rewards['gold_gained']

        if rewards['hourglasses_gained'] > 0:
            player.eternal_hourglasses += rewards['hourglasses_gained']
            player.run_hourglasses_gained += rewards['hourglasses_gained']

        # Verificar level up
        from routes.battle import get_exp_for_next_level
        level_up = False
        while player.experience >= get_exp_for_next_level(player.level):
            player.level += 1
            player.attribute_points += 2
            level_up = True

        # ===== CORREÇÃO: IMPORTAÇÃO CORRETA =====
        # Importar funções de hooks ao invés de trigger_relic_hooks
        from routes.relics.hooks import on_victory, on_rewards

        # Chamar hook de vitória
        on_victory(player)

        # Chamar hook de recompensas (permite relíquias modificarem valores)
        rewards = on_rewards(player, rewards)
        # =========================================

        db.session.commit()

        return {
            'success': True,
            'rewards': rewards,
            'level_up': level_up,
            'new_level': player.level if level_up else None
        }

    except Exception as e:
        db.session.rollback()
        raise e


def calculate_exp_reward(enemy_number, rarity):
    """Calcula recompensa de experiência"""
    base_exp = 10 + (enemy_number // 5) * 2
    rarity_multiplier = {1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0}.get(rarity, 1.0)
    return int(base_exp * rarity_multiplier)


def calculate_gold_reward(enemy_number, rarity):
    """Calcula recompensa de ouro"""
    import random
    base_gold = random.randint(3 + enemy_number // 5, 6 + enemy_number // 5)
    rarity_multiplier = {1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0}.get(rarity, 1.0)
    return int(base_gold * rarity_multiplier)


def calculate_crystal_reward(rarity):
    """Calcula recompensa de cristais"""
    crystal_by_rarity = {1: 1, 2: 2, 3: 3, 4: 5}
    return crystal_by_rarity.get(rarity, 1)


def calculate_hourglass_reward(rarity):
    """Calcula recompensa de ampulhetas"""
    hourglass_by_rarity = {1: 1, 2: 2, 3: 3, 4: 4}
    return hourglass_by_rarity.get(rarity, 1)
