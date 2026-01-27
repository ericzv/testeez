# routes/battle_modules/player_state.py
# Funções de gerenciamento de estado do jogador

from datetime import datetime
from database import db
from models import (
    Player, PlayerProgress, PlayerRunBuff, GenericEnemy, LastBoss
)

from utils.logger import get_logger
logger = get_logger(__name__)


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

        # Resetar contadores de reroll
        player.enemy_reroll_count = 0
        player.memory_reroll_count = 0
        player.relic_reroll_count = 0

        # ===== RESETAR RECURSOS DE RUN =====
        player.run_gold = 50  # Começa com 50 de ouro a cada run

        # ===== RESETAR PROGRESSO =====
        player_progress = PlayerProgress.query.filter_by(player_id=player.id).first()
        if player_progress:
            player_progress.generic_enemies_defeated = 0
            player_progress.current_boss_phase = 1
            player_progress.available_enemies = '[]'  # Reset enemies disponíveis
            player_progress.selected_enemy_id = None
            player_progress.selected_boss_id = None  # Limpar boss selecionado também
            player_progress.last_theme_used = None

        # ===== RESETAR PROGRESSO DO MAPA =====
        from models_map import PlayerMapProgress, MapNode, ProceduralMap
        map_progress = PlayerMapProgress.query.filter_by(player_id=player.id).first()

        # Deletar TODOS os mapas do jogador (não apenas o atual)
        # Isso previne mapas órfãos de runs anteriores
        all_player_maps = ProceduralMap.query.filter_by(player_id=player.id).all()
        for old_map in all_player_maps:
            MapNode.query.filter_by(map_id=old_map.id).delete()
            db.session.delete(old_map)
        maps_deleted = len(all_player_maps)
        logger.debug(f"{maps_deleted} mapa(s) antigo(s) deletado(s)")

        if map_progress:
            # Resetar progresso do mapa
            map_progress.current_map_id = None
            map_progress.current_node_id = None
            map_progress.current_act = 1
            map_progress.nodes_visited = '[]'  # JSON array, não integer
            map_progress.events_seen = '[]'  # Reset eventos vistos
            map_progress.battles_won = 0
            map_progress.elites_defeated = 0
            map_progress.events_completed = 0
            map_progress.shops_visited = 0
            map_progress.rests_taken = 0
            logger.debug(f"Progresso do mapa resetado para ato 1")

        # ===== DELETAR RELÍQUIAS E LEMBRANÇAS =====
        from models import PlayerRelic, EnemySkillDebuff
        relics_deleted = PlayerRelic.query.filter_by(player_id=player_id).delete()
        logger.debug(f"{relics_deleted} relíquias deletadas")

        # ===== LIMPAR BUFFS TEMPORÁRIOS =====
        PlayerRunBuff.query.filter_by(player_id=player.id).delete()
        logger.debug(f"Buffs de run limpos")

        # ===== LIMPAR INVENTÁRIOS DE SHOP =====
        from models import ShopInventory
        shop_items_deleted = ShopInventory.query.filter_by(player_id=player.id).delete()
        logger.debug(f"{shop_items_deleted} itens de shop limpos")

        # ===== LIMPAR DEBUFFS DE INIMIGOS (como Nictalopia) =====
        EnemySkillDebuff.query.filter_by(player_id=player.id).delete()
        logger.debug(f"Debuffs de inimigos removidos")

        # ===== LIMPAR POÇÕES DO INVENTÁRIO =====
        from models import PlayerPotionSlot
        PlayerPotionSlot.query.filter_by(player_id=player.id).update(
            {
                'potion_type': None,
                'quantity': 0
            },
            synchronize_session=False
        )
        logger.debug(f"Poções do inventário resetadas")

        # ===== RESETAR ATRIBUTOS BASE =====
        player.vitality = 0
        player.strength = 0
        player.resistance = 0
        player.luck = 0
        logger.debug(f"Atributos resetados para valores base")

        # ===== RESTAURAR HP E ENERGIA =====
        if hasattr(player, 'recalculate_stats_enhanced'):
            player.recalculate_stats_enhanced()
        else:
            player.recalculate_stats()

        # ===== APLICAR BÔNUS DE TALENTOS PERMANENTES =====
        try:
            from routes.talents import apply_talent_to_player_stats, apply_start_run_bonuses
            apply_talent_to_player_stats(player)
        except ImportError:
            pass

        # Forçar HP e energia base corretos (com bônus de talentos)
        base_hp = 80 + int(getattr(player, 'max_hp_bonus', 0))
        player.max_hp = base_hp
        player.hp = base_hp
        player.max_energy = 10 + int(getattr(player, 'max_energy_bonus', 0))
        player.energy = player.max_energy
        logger.debug(f"HP resetado: {player.hp}/{player.max_hp}")
        logger.debug(f"Energia resetada: {player.energy}/{player.max_energy}")

        # ===== APLICAR BÔNUS DE INÍCIO DE RUN (TALENTOS) =====
        try:
            apply_start_run_bonuses(player)
            logger.debug(f"Bônus de início de run aplicados (talentos)")
        except Exception as e:
            logger.warning(f"Erro ao aplicar bônus de início de run: {e}")

        # ===== RESETAR SISTEMA DE INIMIGOS =====
        GenericEnemy.query.filter_by(is_available=True).update(
            {
                'is_available': False,
                'attack_charges_count': 0,
                'action_queue': '[]'
            },
            synchronize_session=False
        )

        # ===== DELETAR TODOS OS BOSSES (LastBoss) =====
        # CRÍTICO: Bosses devem ser deletados, não apenas desativados
        # Caso contrário, persisti entre runs com HP antigo
        bosses_deleted = LastBoss.query.delete()
        logger.debug(f"{bosses_deleted} bosses deletados")

        db.session.commit()
        logger.info(f"Run resetada com sucesso para player {player_id}")
        return True, "Run resetada com sucesso"

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao resetar run: {e}")
        return False, f"Erro ao resetar run: {str(e)}"


def reset_player_energy(player_id):
    """
    Reseta a energia do jogador ao valor máximo.
    Chamado no início de cada turno do jogador.
    """
    try:
        player = Player.query.get(player_id)
        if not player:
            return False

        # Resetar energia ao máximo
        player.energy = player.max_energy
        db.session.commit()

        logger.debug(f"Energia resetada: {player.energy}/{player.max_energy}")
        return True

    except Exception as e:
        logger.error(f"Erro ao resetar energia: {e}")
        db.session.rollback()
        return False
