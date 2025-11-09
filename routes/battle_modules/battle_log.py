"""
Funções auxiliares para log de batalha
"""
import json
from models import BattleLog
from database import db


def log_turn(player_id, enemy_id, enemy_name, is_boss, turn_number, turn_type, 
             actions, damage_dealt=0, damage_received=0, healing=0, 
             energy_consumed=0, mp_consumed=0, next_intentions=None):
    """
    Registra um turno no log de batalha
    
    Args:
        player_id: ID do jogador
        enemy_id: ID do inimigo
        enemy_name: Nome do inimigo
        is_boss: Se é boss
        turn_number: Número do turno
        turn_type: 'player' ou 'enemy'
        actions: Lista de ações [{type, description}]
        damage_dealt: Dano causado
        damage_received: Dano recebido
        healing: Cura recebida
        energy_consumed: Energia consumida
        mp_consumed: MP consumido
        next_intentions: Intenções do próximo turno
    """
    try:
        log = BattleLog(
            player_id=player_id,
            enemy_id=enemy_id,
            enemy_name=enemy_name,
            is_boss=is_boss,
            turn_number=turn_number,
            turn_type=turn_type,
            actions=json.dumps(actions),
            damage_dealt=damage_dealt,
            damage_received=damage_received,
            healing=healing,
            energy_consumed=energy_consumed,
            mp_consumed=mp_consumed,
            next_intentions=json.dumps(next_intentions) if next_intentions else '[]'
        )
        
        db.session.add(log)
        db.session.commit()
        
        print(f"📜 LOG: Turno {turn_number} ({turn_type}) registrado")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao registrar log: {e}")
        db.session.rollback()
        return False


def get_battle_log(player_id, limit=20):
    """
    Retorna os últimos turnos registrados
    """
    try:
        logs = BattleLog.query.filter_by(player_id=player_id)\
            .order_by(BattleLog.turn_number.desc())\
            .limit(limit)\
            .all()
        
        return [log.to_dict() for log in reversed(logs)]
    except Exception as e:
        print(f"❌ Erro ao buscar log: {e}")
        return []


def clear_battle_log(player_id):
    """
    Limpa o log de batalha do jogador
    """
    try:
        BattleLog.query.filter_by(player_id=player_id).delete()
        db.session.commit()
        print(f"🗑️ Log de batalha limpo para player {player_id}")
        return True
    except Exception as e:
        print(f"❌ Erro ao limpar log: {e}")
        db.session.rollback()
        return False