"""
srs_engine.py — SM-2 Spaced Repetition Engine (centralizado)

Implementação do algoritmo SM-2 (SuperMemo 2) adaptado.
Toda a lógica de repetição espaçada fica neste módulo.
"""

from datetime import datetime, timedelta, timezone
import unicodedata

# ──────────────────────────────────────────────
# Mapeamento de respostas → qualidade SM-2 (0-5)
# ──────────────────────────────────────────────

QUALITY_MAP = {
    'errei': 0,
    'dificil': 3,
    'facil': 4,
    'muito_facil': 5,
}


def normalize_response(response: str) -> str:
    """Remove acentos, converte para minúsculas e substitui espaços por underline."""
    nfkd = unicodedata.normalize('NFKD', response.strip().lower())
    without_accents = ''.join(c for c in nfkd if not unicodedata.combining(c))
    return without_accents.replace(' ', '_')


def response_to_quality(response: str) -> int:
    """Converte string de resposta para qualidade SM-2 (0-5)."""
    normalized = normalize_response(response)
    return QUALITY_MAP.get(normalized, 0)


# ──────────────────────────────────────────────
# Algoritmo SM-2
# ──────────────────────────────────────────────

def sm2_review(card, response: str):
    """
    Aplica o algoritmo SM-2 ao cartão.
    Modifica card in-place (NÃO faz commit).
    Retorna (was_new, quality, interval_before, ef_before).
    """
    quality = response_to_quality(response)
    was_new = card.review_count == 0
    now = datetime.now(timezone.utc)

    # Salvar estado anterior
    interval_before = card.interval
    ef_before = card.easiness_factor

    card.review_count += 1

    # Contabilizar acerto
    if quality >= 3:
        card.correct_count += 1

    if quality < 3:
        # Errou: reiniciar repetições, intervalo curto (10 minutos)
        card.repetition = 0
        card.interval = 10.0 / 1440  # ~10 min em dias
    else:
        # Acertou: progressão SM-2 com intervalos diferenciados por qualidade
        if card.repetition == 0:
            card.interval = {3: 1.0, 4: 2.0, 5: 4.0}[quality]
        elif card.repetition == 1:
            card.interval = {3: 3.0, 4: 6.0, 5: 8.0}[quality]
        else:
            card.interval = card.interval * card.easiness_factor
            if quality == 5:
                card.interval *= 1.3  # bônus "muito fácil"
        card.repetition += 1

    # Atualizar Easiness Factor (EF)
    card.easiness_factor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    card.easiness_factor = max(1.3, card.easiness_factor)

    # Sincronizar campo 'difficulty' para compatibilidade com UI existente
    # EF 1.3 → difficulty 10,  EF ~3.5 → difficulty 1
    card.difficulty = max(1, min(10, round(10 - (card.easiness_factor - 1.3) * 9 / 2.2)))

    card.next_review = now + timedelta(days=card.interval)

    return was_new, quality, interval_before, ef_before


def compute_sm2_preview(card, response: str):
    """
    Calcula o intervalo que resultaria se o cartão recebesse essa resposta.
    NÃO modifica o cartão.
    Retorna (next_interval_days, new_ef).
    """
    quality = response_to_quality(response)
    ef = card.easiness_factor
    rep = card.repetition
    interval = card.interval

    if quality < 3:
        interval = 10.0 / 1440  # ~10 min
    else:
        if rep == 0:
            interval = {3: 1.0, 4: 2.0, 5: 4.0}[quality]
        elif rep == 1:
            interval = {3: 3.0, 4: 6.0, 5: 8.0}[quality]
        else:
            interval = interval * ef
            if quality == 5:
                interval *= 1.3  # bônus "muito fácil"

    ef += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, ef)

    return interval, ef


# ──────────────────────────────────────────────
# Formatação de intervalos
# ──────────────────────────────────────────────

def format_interval(interval_days: float) -> str:
    """Formata intervalo em dias para string legível."""
    if interval_days < 1:
        total_minutes = interval_days * 1440
        if total_minutes < 60:
            return f"{int(total_minutes)} min"
        hours = int(total_minutes // 60)
        minutes = int(total_minutes % 60)
        return f"{hours}h {minutes}min"
    return f"{interval_days:.1f} dias"


# ──────────────────────────────────────────────
# Queries otimizadas com CTE recursivo
# ──────────────────────────────────────────────

def get_subdeck_ids(deck_id):
    """
    Retorna todos os IDs de decks filhos recursivamente via CTE SQL.
    Inclui o próprio deck_id.
    """
    from database import db
    from sqlalchemy import text

    result = db.session.execute(text("""
        WITH RECURSIVE subdeck AS (
            SELECT id FROM deck WHERE id = :deck_id
            UNION ALL
            SELECT d.id FROM deck d JOIN subdeck s ON d.parent_id = s.id
        )
        SELECT id FROM subdeck
    """), {'deck_id': deck_id}).fetchall()
    return [r[0] for r in result]


def get_cards_in_decks(deck_ids, new_only=False, due_only=False, not_suspended=True):
    """
    Retorna query de cartões de uma lista de deck IDs.
    Permite filtrar por novo, pendente, e não-suspenso.
    """
    from models import Card

    query = Card.query.filter(Card.deck_id.in_(deck_ids))
    if not_suspended:
        query = query.filter(Card.suspended == False)
    if new_only:
        query = query.filter(Card.review_count == 0)
    if due_only:
        now = datetime.now(timezone.utc)
        query = query.filter(Card.review_count > 0, Card.next_review <= now)
    return query


def count_cards_for_deck(deck_id):
    """
    Conta cartões (new, in_interval, due) para um deck e todos os subdecks.
    Uma única query SQL otimizada em vez de recursão Python.
    """
    from database import db
    from sqlalchemy import text

    now = datetime.now(timezone.utc)

    result = db.session.execute(text("""
        WITH RECURSIVE subdeck AS (
            SELECT id FROM deck WHERE id = :deck_id
            UNION ALL
            SELECT d.id FROM deck d JOIN subdeck s ON d.parent_id = s.id
        )
        SELECT
            COALESCE(SUM(CASE WHEN c.review_count = 0 AND c.suspended = 0 THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN c.review_count > 0 AND c.next_review > :now AND c.suspended = 0 THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN c.review_count > 0 AND c.next_review <= :now AND c.suspended = 0 THEN 1 ELSE 0 END), 0)
        FROM card c
        WHERE c.deck_id IN (SELECT id FROM subdeck)
    """), {'deck_id': deck_id, 'now': now}).fetchone()

    return result[0], result[1], result[2]


# ──────────────────────────────────────────────
# Estatísticas diárias
# ──────────────────────────────────────────────

def update_daily_stats(response: str, was_new: bool):
    """Atualiza estatísticas do dia. NÃO faz commit."""
    from models import DailyStats
    from database import db

    normalized = normalize_response(response)
    today = datetime.now(timezone.utc).date()
    stats = DailyStats.query.filter_by(date=today).first()
    if not stats:
        stats = DailyStats(date=today, cards_studied=0, correct_count=0, new_cards=0, revision_cards=0)
        db.session.add(stats)
    stats.cards_studied += 1
    if was_new:
        stats.new_cards += 1
    else:
        stats.revision_cards += 1
    if normalized in ('dificil', 'facil', 'muito_facil'):
        stats.correct_count += 1


# ──────────────────────────────────────────────
# ReviewLog
# ──────────────────────────────────────────────

def log_review(card, response: str, was_new: bool, quality: int,
               time_spent: int = 0, interval_before: float = 0, ef_before: float = 0):
    """Cria um registro de ReviewLog. NÃO faz commit."""
    from models import ReviewLog
    from database import db

    log = ReviewLog(
        card_id=card.id,
        response=normalize_response(response),
        quality=quality,
        was_new=was_new,
        interval_before=interval_before,
        interval_after=card.interval,
        ef_before=ef_before,
        ef_after=card.easiness_factor,
        time_spent=time_spent,
    )
    db.session.add(log)
