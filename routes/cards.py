from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, current_app, send_file
from models import Deck, Card, Tag, db, DailyStats, Player, ReviewLog, Note, note_tags
from srs_engine import (
    sm2_review, compute_sm2_preview, format_interval, log_review,
    update_daily_stats, normalize_response,
    get_subdeck_ids, get_cards_in_decks, count_cards_for_deck,
)
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, text, or_
import math
import os
import random
import json
import re
import zipfile
import sqlite3
import tempfile
import shutil
from html import unescape

# Criar o objeto Blueprint
cards_bp = Blueprint('cards', __name__)


def detect_anki_cloze_html(text):
    """Detecta se o texto contém HTML de cloze exportado pelo Anki."""
    if not text:
        return False
    return bool(re.search(r'<span[^>]*class=["\']?cloze["\']?[^>]*data-ordinal=', text))


def convert_anki_cloze_html(front_html, back_html=''):
    """Converte HTML de cloze exportado pelo Anki para o formato {{cN::text}}.

    O Anki exporta cloze assim:
    - Front: <span class="cloze" data-cloze="resposta" data-ordinal="1">[...]</span>
    - Back:  <span class="cloze" data-ordinal="1">resposta</span>

    Reconstrói o texto limpo com marcadores {{cN::resposta}}.
    """
    # Estratégia 1: usar o front que tem data-cloze com a resposta embutida
    def replace_front_cloze(match):
        span = match.group(0)
        cloze_m = re.search(r'data-cloze="([^"]*)"', span)
        ord_m = re.search(r'data-ordinal="(\d+)"', span)
        if cloze_m and ord_m:
            answer = unescape(cloze_m.group(1))
            ordinal = ord_m.group(1)
            return '{{' + f'c{ordinal}::{answer}' + '}}'
        return match.group(0)

    result = front_html
    # Tentar reconstruir do front (tem data-cloze="resposta" e [...]  no conteúdo)
    front_pattern = r'<span[^>]*class=["\']?cloze["\']?[^>]*>\[(?:\.{3}|…)\]</span>'
    converted = re.sub(front_pattern, replace_front_cloze, result)

    # Se não encontrou no front, tentar do back (tem a resposta como texto do span)
    if converted == result and back_html:
        def replace_back_cloze(match):
            span = match.group(0)
            ord_m = re.search(r'data-ordinal="(\d+)"', span)
            # Extrair o texto entre > e </span>
            text_m = re.search(r'>([^<]+)</span>', span)
            if ord_m and text_m:
                answer = unescape(text_m.group(1))
                ordinal = ord_m.group(1)
                return '{{' + f'c{ordinal}::{answer}' + '}}'
            return match.group(0)

        back_pattern = r'<span[^>]*class=["\']?cloze["\']?[^>]*>[^<]+</span>'
        converted = re.sub(back_pattern, replace_back_cloze, back_html)

    # Remover comentários HTML
    converted = re.sub(r'<!--.*?-->', '', converted, flags=re.DOTALL)
    # Remover tags HTML
    converted = re.sub(r'<[^>]+>', '', converted)
    # Decodificar entidades HTML
    converted = unescape(converted)
    # Limpar espaços extras
    converted = re.sub(r'\s+', ' ', converted).strip()

    return converted

@cards_bp.app_template_global()
def datetime_module():
    return datetime

@cards_bp.app_template_global()
def timezone_module():
    return timezone

##############################################
#         FUNÇÕES AUXILIARES
##############################################

def get_or_create_deck(hierarchy_str):
    """
    Recebe uma string com os nomes dos baralhos separados por "__" e cria (ou recupera)
    a hierarquia de baralhos. Retorna o baralho de nível mais baixo.
    Exemplo:
      "Minha Vaga - Residência Médica__CLÍNICA MÉDICA__CARDIOLOGIA__ECG"
      -> cria (se necessário) os baralhos "Minha Vaga - Residência Médica" > "CLÍNICA MÉDICA" > "CARDIOLOGIA" > "ECG"
    """
    # Dividir a string usando "__" como separador:
    hierarchy = hierarchy_str.split('__')
    parent = None
    for deck_name in hierarchy:
        # Remove espaços extras, se houver
        deck_name = deck_name.strip()
        # Procura um baralho com esse nome que seja filho do "parent" (se existir)
        deck = Deck.query.filter_by(name=deck_name, parent_id=(parent.id if parent else None)).first()
        if not deck:
            deck = Deck(name=deck_name, parent=parent)
            db.session.add(deck)
            db.session.flush()  # Garante ID sem commit separado
        parent = deck
    return parent


def import_apkg(filepath):
    """Importa um arquivo .apkg (pacote Anki) completo.

    O .apkg é um ZIP contendo:
    - collection.anki2 (ou .anki21): banco SQLite com notas, cartões, revisões
    - media: JSON mapeando números para nomes de arquivos de mídia
    - Arquivos de mídia nomeados como números (0, 1, 2...)

    Retorna dict com estatísticas ou {'error': mensagem}.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # 1. Extrair ZIP
        try:
            with zipfile.ZipFile(filepath, 'r') as z:
                z.extractall(tmpdir)
        except zipfile.BadZipFile:
            return {'error': 'Arquivo inválido. Não é um .apkg válido.'}

        # 2. Encontrar o banco SQLite
        db_path = None
        for name in ['collection.anki2', 'collection.anki21']:
            candidate = os.path.join(tmpdir, name)
            if os.path.exists(candidate):
                db_path = candidate
                break

        if not db_path:
            return {'error': 'Formato .apkg não suportado. Verifique se o arquivo foi exportado corretamente pelo Anki.'}

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.text_factory = lambda b: b.decode('utf-8', errors='replace')

        # 3. Ler metadados da coleção
        col_row = conn.execute('SELECT * FROM col').fetchone()
        col_crt = col_row['crt']  # timestamp de criação da coleção
        models = json.loads(col_row['models'])
        decks_meta = json.loads(col_row['decks'])

        # 4. Mapear tipos de modelo: model_id → 'basic' ou 'cloze'
        model_type_map = {}
        for mid_str, model in models.items():
            model_type_map[int(mid_str)] = 'cloze' if model.get('type') == 1 else 'basic'

        # 5. Criar hierarquia de baralhos: anki_deck_id → nosso Deck
        deck_map = {}
        for anki_deck_id_str, deck_info in decks_meta.items():
            deck_name = deck_info['name']
            # Anki usa "::" como separador de hierarquia
            parts = deck_name.split('::')
            parent = None
            for part in parts:
                part = part.strip()
                existing = Deck.query.filter_by(
                    name=part, parent_id=(parent.id if parent else None)
                ).first()
                if existing:
                    parent = existing
                else:
                    new_deck = Deck(name=part, parent_id=(parent.id if parent else None))
                    db.session.add(new_deck)
                    db.session.flush()
                    parent = new_deck
            deck_map[int(anki_deck_id_str)] = parent

        # 6. Ler todas as notas do Anki
        anki_notes = {}
        for row in conn.execute('SELECT * FROM notes'):
            anki_notes[row['id']] = row

        # 7. Ler todos os cartões e agrupar por nota
        note_cards = {}
        for row in conn.execute('SELECT * FROM cards'):
            nid = row['nid']
            if nid not in note_cards:
                note_cards[nid] = []
            note_cards[nid].append(row)

        # 8. Pré-carregar todo o histórico de revisões agrupado por cartão Anki
        revlog_by_card = {}
        for row in conn.execute('SELECT * FROM revlog ORDER BY id'):
            cid = row['cid']
            if cid not in revlog_by_card:
                revlog_by_card[cid] = []
            revlog_by_card[cid].append(row)

        # 9. Processar notas e criar objetos
        notes_created = 0
        cards_created = 0
        revlogs_created = 0
        duplicates = 0

        for anki_note_id, anki_note in anki_notes.items():
            fields = anki_note['flds'].split('\x1f')
            mid = anki_note['mid']
            note_type = model_type_map.get(mid, 'basic')
            tags_str = anki_note['tags'].strip()

            # Conteúdo dos campos
            front = fields[0] if len(fields) > 0 else ''
            back = fields[1] if len(fields) > 1 else ''
            extra = fields[2] if len(fields) > 2 else None

            if note_type == 'cloze':
                content = front  # Texto cloze com {{c1::}} direto do Anki
                note_back = None
            else:
                content = front
                note_back = back

            # Determinar baralho pela primeiro cartão da nota
            cards_for_note = note_cards.get(anki_note_id, [])
            if not cards_for_note:
                continue

            first_card = cards_for_note[0]
            deck = deck_map.get(first_card['did'])
            if not deck:
                deck = Deck.query.first() or Deck(name='Importado')
                if not deck.id:
                    db.session.add(deck)
                    db.session.flush()

            # Verificar duplicata pelo conteúdo
            existing = Note.query.filter_by(content=content, deck_id=deck.id).first()
            if existing:
                duplicates += 1
                continue

            # Criar Nota
            note = Note(
                note_type=note_type,
                content=content,
                back=note_back,
                extra=extra if extra else None,
                deck_id=deck.id
            )
            db.session.add(note)
            db.session.flush()
            notes_created += 1

            # Tags
            if tags_str:
                for tag_name in tags_str.split():
                    tag_name = tag_name.strip()
                    if not tag_name:
                        continue
                    tag = Tag.query.filter_by(name=tag_name).first()
                    if not tag:
                        tag = Tag(name=tag_name)
                        db.session.add(tag)
                        db.session.flush()
                    if tag not in note.tags:
                        note.tags.append(tag)

            # Criar Cartões com dados de agendamento do Anki
            for anki_card in cards_for_note:
                ordinal = anki_card['ord'] + 1  # Anki é 0-indexed, nós somos 1-indexed
                card_deck = deck_map.get(anki_card['did'], deck)

                # Dados SM-2 do Anki
                anki_ivl = anki_card['ivl']
                anki_factor = anki_card['factor']
                anki_reps = anki_card['reps']
                anki_lapses = anki_card['lapses']
                anki_type = anki_card['type']    # 0=new, 1=learning, 2=review
                anki_queue = anki_card['queue']  # -1=suspended
                anki_due = anki_card['due']

                # Converter intervalo (positivo=dias, negativo=segundos)
                if anki_ivl < 0:
                    interval = abs(anki_ivl) / 86400.0
                else:
                    interval = float(anki_ivl)

                # Converter fator de facilidade (Anki armazena * 1000)
                if anki_factor > 0:
                    easiness_factor = anki_factor / 1000.0
                else:
                    easiness_factor = 2.5
                easiness_factor = max(1.3, easiness_factor)

                # Converter data de revisão
                if anki_type == 2:  # Review: due = dias desde criação da coleção
                    next_review = datetime.utcfromtimestamp(col_crt + anki_due * 86400)
                elif anki_type == 1:  # Learning: due = timestamp Unix
                    next_review = datetime.utcfromtimestamp(anki_due)
                else:  # Novo: revisar agora
                    next_review = datetime.utcnow()

                # Repetição consecutiva (para SM-2)
                if anki_type == 2 and anki_reps > 0:
                    repetition = max(2, anki_reps - anki_lapses)
                else:
                    repetition = 0

                # Dificuldade derivada do EF (mesma fórmula do srs_engine)
                difficulty = max(1, min(10, round(10 - (easiness_factor - 1.3) * 9 / 2.2)))

                card = Card(
                    note_id=note.id,
                    ordinal=ordinal,
                    deck_id=card_deck.id,
                    front=content,
                    back=note_back or '',
                    interval=interval,
                    easiness_factor=easiness_factor,
                    repetition=repetition,
                    review_count=anki_reps,
                    correct_count=max(0, anki_reps - anki_lapses),
                    difficulty=difficulty,
                    next_review=next_review,
                    suspended=(anki_queue == -1),
                )
                db.session.add(card)
                db.session.flush()
                cards_created += 1

                # Copiar tags da nota para o cartão (UI usa card.tags)
                for tag in note.tags:
                    if tag not in card.tags:
                        card.tags.append(tag)

                # Importar histórico de revisões deste cartão
                anki_card_id = anki_card['id']
                for rev in revlog_by_card.get(anki_card_id, []):
                    ease = rev['ease']
                    if ease == 1:
                        quality, response = 0, 'errei'
                    elif ease == 2:
                        quality, response = 3, 'dificil'
                    elif ease == 3:
                        quality, response = 4, 'facil'
                    else:
                        quality, response = 5, 'muito_facil'

                    rev_ivl = rev['ivl']
                    rev_last = rev['lastIvl']
                    interval_after = abs(rev_ivl) / 86400.0 if rev_ivl < 0 else float(rev_ivl)
                    interval_before = abs(rev_last) / 86400.0 if rev_last < 0 else float(rev_last)

                    rev_factor = rev['factor']
                    ef_val = rev_factor / 1000.0 if rev_factor > 0 else easiness_factor

                    review_log = ReviewLog(
                        card_id=card.id,
                        response=response,
                        quality=quality,
                        was_new=(rev['type'] == 0),
                        interval_before=interval_before,
                        interval_after=interval_after,
                        ef_before=ef_val,
                        ef_after=ef_val,
                        time_spent=rev['time'] // 1000,
                        timestamp=datetime.utcfromtimestamp(rev['id'] / 1000.0),
                    )
                    db.session.add(review_log)
                    revlogs_created += 1

        # 10. Extrair mídia para static/collection.media/
        media_count = 0
        media_json_path = os.path.join(tmpdir, 'media')
        if os.path.exists(media_json_path):
            with open(media_json_path, 'r', encoding='utf-8') as f:
                media_map = json.loads(f.read())

            media_dest = os.path.join(current_app.root_path, 'static', 'collection.media')
            os.makedirs(media_dest, exist_ok=True)

            for num_str, original_name in media_map.items():
                src = os.path.join(tmpdir, num_str)
                if os.path.exists(src):
                    dst = os.path.join(media_dest, original_name)
                    if not os.path.exists(dst):
                        shutil.copy2(src, dst)
                        media_count += 1

        db.session.commit()
        conn.close()

        return {
            'notes': notes_created,
            'cards': cards_created,
            'revlogs': revlogs_created,
            'media': media_count,
            'duplicates': duplicates,
        }

    except Exception as e:
        db.session.rollback()
        return {'error': f'Erro ao importar: {str(e)}'}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def process_gamification(card, response, time_spent, was_new):
    """Process gamification logic for studying cards. NÃO faz commit."""
    player = Player.query.first()
    if not player:
        return

    player.last_active = datetime.now(timezone.utc)

    # Rastreamento de tempo de estudo + marcos de cristais
    if time_spent < 60:
        player.study_time_total += time_spent

        if player.study_time_total >= 1800 and (player.study_time_total - time_spent) < 1800:
            player.crystals += 1
            flash_gamification("Você estudou por 30 minutos e ganhou 1 Cristal de Memória!")

    hours_studied = player.study_time_total // 3600
    hours_before = (player.study_time_total - time_spent) // 3600

    if hours_studied != hours_before:
        if hours_studied in (20, 50, 100) or (hours_studied > 100 and hours_studied % 100 == 0):
            player.crystals += 5
            flash_gamification(f"Parabéns! Você atingiu {hours_studied} horas de estudo e ganhou 5 Cristais de Memória!")


## Algoritmo antigo removido — agora centralizado em srs_engine.py

# Substitua as chamadas de flash() para mensagens de gamificação com esta função

def flash_gamification(message, notification_only=False):
    """
    Exibe uma mensagem de gamificação com estilo especial.

    Args:
        message: A mensagem a ser exibida
        notification_only: Se True, a mensagem só será mostrada no sininho de notificações
    """
    # Verifica se é uma mensagem relacionada a atributos
    # A condição 'or "pontos adicionados a" in message' foi removida pois notification_only já controla isso
    if notification_only:
        # Adiciona um marcador especial para notificações
        session.setdefault('pending_notifications', []).append(message)
        # Usamos uma categoria específica que o JS em hub.html procura
        flash(message, "gamification-notification")
    else:
        # Mensagens normais de gamificação mostradas como de costume
        flash(message, "gamification")


##############################################
#         MIGRAÇÃO Note/Card
##############################################

def migrate_cards_to_notes():
    """Migra cartões existentes para o sistema Note/Card.
    Adiciona colunas note_id e ordinal se necessário, cria notas para cada cartão."""
    # 1) Adicionar colunas se não existem
    for sql in [
        "ALTER TABLE card ADD COLUMN note_id INTEGER REFERENCES note(id)",
        "ALTER TABLE card ADD COLUMN ordinal INTEGER DEFAULT 1",
    ]:
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # 2) Verificar se já foi migrado
    orphan_count = Card.query.filter(Card.note_id == None).count()
    if orphan_count == 0:
        return

    print(f"Migrando {orphan_count} cartões para o sistema Note/Card...")

    cards = Card.query.filter(Card.note_id == None).all()
    for card in cards:
        raw_cloze = bool(re.search(r'\{\{c\d+::', card.front or '')) or \
                    bool(re.search(r'\{\{c\d+::', card.back or ''))
        anki_html = detect_anki_cloze_html(card.front) or detect_anki_cloze_html(card.back)
        has_cloze = raw_cloze or anki_html

        if has_cloze:
            if anki_html:
                cloze_content = convert_anki_cloze_html(card.front or '', card.back or '')
            elif bool(re.search(r'\{\{c\d+::', card.front or '')):
                cloze_content = card.front
            else:
                cloze_content = card.back
            note = Note(
                note_type='cloze',
                content=cloze_content,
                back=None,
                extra=None,
                deck_id=card.deck_id
            )
        else:
            note = Note(
                note_type='basic',
                content=card.front,
                back=card.back,
                extra=None,
                deck_id=card.deck_id
            )

        db.session.add(note)
        db.session.flush()

        # Copiar tags do cartão para a nota
        for tag in card.tags:
            note.tags.append(tag)

        # Vincular cartão existente à nota
        card.note_id = note.id
        card.ordinal = 1

        # Para cloze com múltiplos ordinais, criar cartões extras
        if has_cloze:
            ordinals = note.get_cloze_ordinals()
            for ordinal in ordinals:
                if ordinal != 1:
                    new_card = Card(
                        note_id=note.id,
                        ordinal=ordinal,
                        deck_id=card.deck_id,
                        front=card.front,
                        back=card.back or ''
                    )
                    # Copiar tags
                    for tag in card.tags:
                        new_card.tags.append(tag)
                    db.session.add(new_card)

    db.session.commit()
    print(f"Migração concluída: {orphan_count} cartões migrados para notas.")

    # 4) Corrigir notas que foram criadas como 'basic' mas contêm cloze
    mistyped = Note.query.filter(Note.note_type == 'basic').all()
    fixed = 0
    for note in mistyped:
        raw_content = bool(re.search(r'\{\{c\d+::', note.content or ''))
        raw_back = bool(re.search(r'\{\{c\d+::', note.back or ''))
        anki_content = detect_anki_cloze_html(note.content)
        anki_back = detect_anki_cloze_html(note.back)

        if raw_content or raw_back or anki_content or anki_back:
            if anki_content or anki_back:
                note.content = convert_anki_cloze_html(note.content or '', note.back or '')
            elif raw_back and not raw_content:
                note.content = note.back
            note.note_type = 'cloze'
            note.back = None
            note.sync_cards()
            fixed += 1
    if fixed:
        db.session.commit()
        print(f"Corrigidas {fixed} notas de 'basic' para 'cloze'.")


##############################################
#                ROTAS
##############################################
@cards_bp.route('/')
def index():
    return redirect(url_for('cards.decks'))

@cards_bp.route('/import', methods=['GET', 'POST'])
def import_cards():
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            flash('Por favor, selecione um arquivo.', 'danger')
            return render_template('import.html')

        ext = os.path.splitext(file.filename)[1].lower()
        if ext != '.apkg':
            flash('Formato não suportado. Exporte sua coleção do Anki como .apkg.', 'danger')
            return render_template('import.html')

        # Salvar arquivo temporariamente
        if not os.path.exists(current_app.config['UPLOAD_FOLDER']):
            os.makedirs(current_app.config['UPLOAD_FOLDER'])
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        result = import_apkg(filepath)

        # Limpar arquivo temporário
        try:
            os.remove(filepath)
        except OSError:
            pass

        if 'error' in result:
            flash(result['error'], 'danger')
            return render_template('import.html')

        parts = []
        parts.append(f'{result["notes"]} notas')
        parts.append(f'{result["cards"]} cartões')
        if result.get('revlogs', 0) > 0:
            parts.append(f'{result["revlogs"]} revisões no histórico')
        if result.get('media', 0) > 0:
            parts.append(f'{result["media"]} arquivos de mídia')

        msg = f'Importação concluída! {", ".join(parts)}.'
        if result.get('duplicates', 0) > 0:
            msg += f' ({result["duplicates"]} duplicados ignorados)'
        flash(msg, 'success')
        return redirect(url_for('cards.decks'))

    return render_template('import.html')

##############################################
#         ESTUDO DINÂMICO (Anki-style)
##############################################

def get_next_study_card(deck_ids):
    """Busca o próximo cartão para estudo por prioridade.
    Prioridade: 1) Aprendendo (errados) → 2) Revisão (vencidos) → 3) Novos
    Retorna (card, card_type) ou (None, None).
    """
    now = datetime.now(timezone.utc)

    # 1. Aprendendo: repetition=0, review_count>0 (erraram, precisam reaprender)
    card = Card.query.filter(
        Card.deck_id.in_(deck_ids),
        Card.suspended == False,
        Card.review_count > 0,
        Card.repetition == 0,
        Card.next_review <= now,
    ).order_by(Card.next_review.asc()).first()
    if card:
        return card, 'learning'

    # 2. Revisão: repetition>0, next_review<=now (graduados e vencidos)
    card = Card.query.filter(
        Card.deck_id.in_(deck_ids),
        Card.suspended == False,
        Card.review_count > 0,
        Card.repetition > 0,
        Card.next_review <= now,
    ).order_by(Card.next_review.asc()).first()
    if card:
        return card, 'review'

    # 3. Novos: review_count=0
    card = Card.query.filter(
        Card.deck_id.in_(deck_ids),
        Card.suspended == False,
        Card.review_count == 0,
    ).order_by(Card.id.asc()).first()
    if card:
        return card, 'new'

    return None, None


def get_waiting_learning_card(deck_ids):
    """Verifica se há cartões de aprendizado pendentes (com next_review no futuro)."""
    now = datetime.now(timezone.utc)
    card = Card.query.filter(
        Card.deck_id.in_(deck_ids),
        Card.suspended == False,
        Card.review_count > 0,
        Card.repetition == 0,
        Card.next_review > now,
    ).order_by(Card.next_review.asc()).first()
    return card


def count_study_queue(deck_ids):
    """Conta cartões em cada fila de estudo para o counter bar."""
    now = datetime.now(timezone.utc)
    new_count = Card.query.filter(
        Card.deck_id.in_(deck_ids), Card.suspended == False,
        Card.review_count == 0,
    ).count()
    learning_count = Card.query.filter(
        Card.deck_id.in_(deck_ids), Card.suspended == False,
        Card.review_count > 0, Card.repetition == 0,
    ).count()
    review_count = Card.query.filter(
        Card.deck_id.in_(deck_ids), Card.suspended == False,
        Card.review_count > 0, Card.repetition > 0,
        Card.next_review <= now,
    ).count()
    return new_count, learning_count, review_count


@cards_bp.route('/study/<int:deck_id>', methods=['GET', 'POST'])
def study(deck_id):
    """Sessão de estudo dinâmico estilo Anki."""
    deck = Deck.query.get_or_404(deck_id)
    deck_ids = get_subdeck_ids(deck_id)

    # Inicializar histórico de undo na sessão
    if 'study_undo_history' not in session:
        session['study_undo_history'] = []
    if 'study_time_total' not in session:
        session['study_time_total'] = 0

    if request.method == 'POST':
        card_id = request.form.get('card_id', type=int)
        response = request.form.get('response')
        time_spent = request.form.get('time_spent', '0')

        try:
            time_spent = int(time_spent)
        except ValueError:
            time_spent = 0

        # Acumular tempo de estudo (apenas se < 60s)
        if time_spent < 60:
            session['study_time_total'] = session.get('study_time_total', 0) + time_spent

        card = Card.query.get(card_id)
        if not card:
            flash('Cartão não encontrado.', 'warning')
            return redirect(url_for('cards.study', deck_id=deck_id))

        # Salvar estado pré-revisão para undo
        prev_state = {
            'card_id': card.id,
            'interval': card.interval,
            'difficulty': card.difficulty,
            'easiness_factor': card.easiness_factor,
            'repetition': card.repetition,
            'next_review': card.next_review.isoformat() if card.next_review else None,
            'review_count': card.review_count,
            'correct_count': card.correct_count,
        }
        history = session.get('study_undo_history', [])
        history.append(prev_state)
        # Manter apenas últimos 50 undos
        if len(history) > 50:
            history = history[-50:]
        session['study_undo_history'] = history

        # SM-2: atualizar cartão + registrar log + estatísticas
        was_new, quality, interval_before, ef_before = sm2_review(card, response)
        log_review(card, response, was_new, quality, time_spent, interval_before, ef_before)
        update_daily_stats(response, was_new)
        process_gamification(card, response, time_spent, was_new)

        # Contagem de revisões para gamificação
        if not was_new:
            session['session_revision_count'] = session.get('session_revision_count', 0) + 1

        db.session.commit()
        return redirect(url_for('cards.study', deck_id=deck_id))

    # GET: buscar próximo cartão
    card, card_type = get_next_study_card(deck_ids)
    new_count, learning_count, review_count = count_study_queue(deck_ids)

    if not card:
        # Verificar se há cartões de aprendizado esperando
        waiting_card = get_waiting_learning_card(deck_ids)
        if waiting_card:
            wait_seconds = (waiting_card.next_review - datetime.now(timezone.utc)).total_seconds()
            wait_seconds = max(0, int(wait_seconds))
            return render_template('study.html',
                                   deck=deck,
                                   card=None,
                                   waiting=True,
                                   wait_seconds=wait_seconds,
                                   new_count=new_count,
                                   learning_count=learning_count,
                                   review_count=review_count,
                                   card_type=None,
                                   active_type='learning')

        # Salvar tempo de estudo acumulado nas estatísticas
        if session.get('study_time_total', 0) > 0:
            today = datetime.now(timezone.utc).date()
            today_stats = DailyStats.query.filter_by(date=today).first()
            if not today_stats:
                today_stats = DailyStats(date=today, cards_studied=0, correct_count=0, new_cards=0, revision_cards=0)
                db.session.add(today_stats)
            current_time = getattr(today_stats, 'study_time', 0) or 0
            today_stats.study_time = current_time + session.get('study_time_total', 0)
            db.session.commit()
            session['study_time_total'] = 0

        # Nenhum cartão disponível
        return render_template('study.html',
                               deck=deck,
                               card=None,
                               waiting=False,
                               new_count=new_count,
                               learning_count=learning_count,
                               review_count=review_count,
                               card_type=None,
                               active_type=None)

    # Determinar qual fila está ativa (para o counter bar)
    active_type = card_type

    # Calcular previews SM-2
    next_errei, _ = compute_sm2_preview(card, 'errei')
    next_dificil, _ = compute_sm2_preview(card, 'difícil')
    next_facil, _ = compute_sm2_preview(card, 'facil')
    next_muitofacil, _ = compute_sm2_preview(card, 'muito_facil')

    is_cloze = card.note and card.note.note_type == 'cloze'

    return render_template('study.html',
                           deck=deck,
                           card=card,
                           waiting=False,
                           card_type=card_type,
                           active_type=active_type,
                           new_count=new_count,
                           learning_count=learning_count,
                           review_count=review_count,
                           next_errei=format_interval(next_errei),
                           next_dificil=format_interval(next_dificil),
                           next_facil=format_interval(next_facil),
                           next_muitofacil=format_interval(next_muitofacil),
                           is_cloze=is_cloze,
                           datetime=datetime)


@cards_bp.route('/study/<int:deck_id>/undo')
def study_undo(deck_id):
    """Desfaz a última revisão na sessão de estudo dinâmico."""
    history = session.get('study_undo_history', [])
    if not history:
        flash('Nenhuma ação para desfazer.', 'warning')
        return redirect(url_for('cards.study', deck_id=deck_id))

    last_state = history.pop()
    session['study_undo_history'] = history

    card = Card.query.get(last_state['card_id'])
    if not card:
        flash('Cartão não encontrado.', 'warning')
        return redirect(url_for('cards.study', deck_id=deck_id))

    was_new = (last_state['review_count'] == 0)

    # Reverter estado do cartão
    card.interval = last_state['interval']
    card.difficulty = last_state['difficulty']
    card.easiness_factor = last_state.get('easiness_factor', 2.5)
    card.repetition = last_state.get('repetition', 0)
    card.next_review = datetime.fromisoformat(last_state['next_review']) if last_state['next_review'] else None
    card.review_count = last_state['review_count']
    card.correct_count = last_state['correct_count']

    # Remover último ReviewLog
    last_log = ReviewLog.query.filter_by(card_id=card.id).order_by(ReviewLog.id.desc()).first()
    if last_log:
        db.session.delete(last_log)

    # Reverter contagem de revisão para gamificação
    if not was_new:
        revision_count = session.get('session_revision_count', 0)
        if revision_count > 0:
            session['session_revision_count'] = revision_count - 1

    db.session.commit()
    flash('Cartão anterior restaurado.', 'info')
    return redirect(url_for('cards.study', deck_id=deck_id))


@cards_bp.route('/panel')
def panel():
    query = request.args.get('q', '').strip()
    deck_id = request.args.get('deck_id', type=int)
    tags_param = request.args.get('tags', '')
    
    # Removi o parâmetro show_suspended já que agora sempre incluiremos cartões suspensos
    
    # Obter todas as tags independentemente da consulta
    all_tags = Tag.query.order_by(Tag.name).all()
    
    # Lista vazia de cartões por padrão
    cards = []
    
    # Processar parâmetros de tag se fornecidos
    tag_ids = []
    if tags_param:
        tag_ids = [int(tag_id) for tag_id in tags_param.split(',') if tag_id.isdigit()]
        
        # Se temos tags para filtrar, busque os cartões com essas tags
        if tag_ids:
            from sqlalchemy import or_
            base_query = Card.query
                
            # Filtrar por tags
            tag_conditions = [Card.tags.any(Tag.id == tag_id) for tag_id in tag_ids]
            cards = base_query.filter(or_(*tag_conditions)).all()
    
    # Se uma consulta foi fornecida, busque os cartões correspondentes
    elif query:
        base_query = Card.query
            
        if query.startswith('#'):
            try:
                card_id = int(query[1:])
                cards = base_query.filter(Card.id == card_id).all()
            except ValueError:
                cards = []
        else:
            from sqlalchemy import or_
            cards = base_query.filter(
                or_(
                    Card.front.ilike(f'%{query}%'),
                    Card.back.ilike(f'%{query}%')
                )
            ).all()
    
    # Se um deck_id foi fornecido, filtre os cartões por esse deck (CTE)
    elif deck_id:
        all_ids = get_subdeck_ids(deck_id)
        if all_ids:
            cards = Card.query.filter(Card.deck_id.in_(all_ids)).all()
    
    # Se nenhum dos filtros acima foi aplicado, não carregue nenhum cartão
    
    diff_expl = {
        1: "Muito fácil", 2: "Muito fácil",
        3: "Fácil", 4: "Fácil",
        5: "Médio", 6: "Médio",
        7: "Difícil", 8: "Difícil",
        9: "Muito difícil", 10: "Muito difícil"
    }
    
    root_decks = Deck.query.filter(Deck.parent_id == None).all()
    return render_template('panel.html', cards=cards, query=query, diff_expl=diff_expl,
                          decks=Deck.query.all(), deck_id=deck_id, all_tags=all_tags,
                          selected_tag_ids=tag_ids, root_decks=root_decks)



@cards_bp.route('/show_all')
def show_all():
    cards = Card.query.all()
    diff_expl = {
        1: "Muito fácil", 2: "Muito fácil",
        3: "Fácil", 4: "Fácil",
        5: "Médio", 6: "Médio",
        7: "Difícil", 8: "Difícil",
        9: "Muito difícil", 10: "Muito difícil"
    }
    decks = Deck.query.all()
    # Obter todas as tags
    all_tags = Tag.query.order_by(Tag.name).all()
    root_decks = Deck.query.filter(Deck.parent_id == None).all()
    # Passar show_all=True para o template saber que estamos mostrando todos os cartões
    return render_template('panel.html', cards=cards, query="", diff_expl=diff_expl,
                           decks=decks, all_tags=all_tags, show_all=True, root_decks=root_decks)

@cards_bp.route('/rename_deck/<int:deck_id>', methods=['GET', 'POST'])
def rename_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    if request.method == 'POST':
        new_name = request.form.get('new_name', '').strip()
        if not new_name:
            flash("O nome não pode ser vazio.", "warning")
            return redirect(url_for('cards.rename_deck', deck_id=deck_id))
        deck.name = new_name
        db.session.commit()
        flash("Baralho renomeado com sucesso.", "success")
        return redirect(url_for('cards.decks'))
    return render_template('rename_deck.html', deck=deck)

@cards_bp.route('/card/<int:card_id>')
def card_detail(card_id):
    card = Card.query.get_or_404(card_id)
    if card.review_count > 0:
        accuracy = (card.correct_count / card.review_count * 100)
        details_info = {
            'review_count': card.review_count,
            'interval': format_interval(card.interval),
            'accuracy': f"{accuracy:.1f}%",
            'easiness_factor': f"{card.easiness_factor:.2f}",
            'repetition': card.repetition,
        }
    else:
        details_info = {
            'review_count': 0,
            'interval': format_interval(card.interval),
            'accuracy': "N/A",
            'easiness_factor': f"{card.easiness_factor:.2f}",
            'repetition': card.repetition,
        }
    review_logs = ReviewLog.query.filter_by(card_id=card.id).order_by(ReviewLog.timestamp.desc()).limit(50).all()
    # Info sobre nota e cartões-irmãos
    sibling_cards = []
    if card.note:
        sibling_cards = Card.query.filter_by(note_id=card.note.id).order_by(Card.ordinal).all()
    return render_template('card_detail.html', card=card, details=details_info,
                           review_logs=review_logs, sibling_cards=sibling_cards)

@cards_bp.route('/card/<int:card_id>/edit', methods=['GET', 'POST'])
def edit_card(card_id):
    card = Card.query.get_or_404(card_id)
    # Se o cartão tem nota, redirecionar para edit_note
    if card.note:
        return redirect(url_for('cards.edit_note', note_id=card.note.id))
    # Fallback legado para cartões sem nota
    if request.method == 'POST':
        new_front = request.form.get('front', '')
        new_back = request.form.get('back', '')
        card.front = new_front
        card.back = new_back
        db.session.commit()
        flash("Cartão atualizado com sucesso!", "success")
        return redirect(url_for('cards.card_detail', card_id=card_id))
    return render_template('edit_card.html', card=card)


@cards_bp.route('/note/<int:note_id>/edit', methods=['GET', 'POST'])
def edit_note(note_id):
    note = Note.query.get_or_404(note_id)
    if request.method == 'POST':
        new_type = request.form.get('note_type', note.note_type)
        note.note_type = new_type

        if new_type == 'cloze':
            note.content = request.form.get('content', '')
            note.back = None
            note.extra = request.form.get('extra', '') or None
        else:
            note.content = request.form.get('front', '')
            note.back = request.form.get('back', '')
            note.extra = request.form.get('extra', '') or None

        # Sincronizar cartões-filho
        note.sync_cards()
        db.session.commit()

        flash("Nota atualizada com sucesso!", "success")
        # Redirecionar para o primeiro cartão da nota
        first_card = Card.query.filter_by(note_id=note.id).order_by(Card.ordinal).first()
        if first_card:
            return redirect(url_for('cards.card_detail', card_id=first_card.id))
        return redirect(url_for('cards.panel'))

    return render_template('edit_note.html', note=note)

@cards_bp.route('/decks', methods=['GET', 'POST'])
def decks():
    if request.method == 'POST':
        deck_name = request.form.get('deck_name')
        parent_id = request.form.get('parent_id')
        if not deck_name:
            flash("O nome do baralho é obrigatório.", "warning")
            return redirect(url_for('cards.decks'))
        new_deck = Deck(name=deck_name)
        if parent_id and parent_id.isdigit():
            new_deck.parent_id = int(parent_id)
        db.session.add(new_deck)
        db.session.commit()
        flash("Baralho criado com sucesso.", "success")
        return redirect(url_for('cards.decks'))

    # Resumo do estudo do dia
    today = datetime.now(timezone.utc).date()
    stats = DailyStats.query.filter_by(date=today).first()
    total_study_time = 0
    if stats:
        accuracy = (stats.correct_count / stats.cards_studied * 100) if stats.cards_studied > 0 else 0
        db_study_time = getattr(stats, 'study_time', 0) or 0
        total_study_time += db_study_time
        cards_studied = stats.cards_studied
    else:
        accuracy = 0
        cards_studied = 0
    if 'study_time_total' in session and session.get('study_time_total', 0) > 0:
        total_study_time += session.get('study_time_total', 0)
    study_time_minutes = total_study_time // 60

    all_decks = Deck.query.filter(Deck.parent_id == None).all()
    return render_template('decks.html', decks=all_decks,
                           cards_studied=cards_studied,
                           accuracy=accuracy,
                           study_time_minutes=study_time_minutes)


@cards_bp.route('/api/deck/move', methods=['POST'])
def api_move_deck():
    """API para mover baralho via drag-and-drop."""
    data = request.get_json()
    deck_id = data.get('deck_id')
    new_parent_id = data.get('parent_id')  # None para mover para raiz

    deck = Deck.query.get(deck_id)
    if not deck:
        return jsonify({'error': 'Baralho não encontrado'}), 404

    # Prevenir referência circular: não pode ser filho de si mesmo ou de um descendente
    if new_parent_id:
        target = Deck.query.get(new_parent_id)
        if not target:
            return jsonify({'error': 'Baralho destino não encontrado'}), 404
        if target.id == deck.id:
            return jsonify({'error': 'Não pode ser pai de si mesmo'}), 400
        # Verificar se target é descendente de deck
        check = target
        while check.parent_id:
            if check.parent_id == deck.id:
                return jsonify({'error': 'Referência circular'}), 400
            check = Deck.query.get(check.parent_id)

    deck.parent_id = new_parent_id
    db.session.commit()
    return jsonify({'success': True})


@cards_bp.route('/api/card/<int:card_id>')
def api_card_detail(card_id):
    """API que retorna detalhes do cartao em JSON para o split panel."""
    card = Card.query.get(card_id)
    if not card:
        return jsonify({'error': 'Cartao nao encontrado'}), 404

    # Dados SM-2
    if card.review_count > 0:
        accuracy = f"{(card.correct_count / card.review_count * 100):.1f}%"
    else:
        accuracy = "N/A"

    # Fase
    now = datetime.now(timezone.utc)
    if card.suspended:
        phase = 'Suspenso'
        phase_color = 'orange'
    elif card.review_count == 0:
        phase = 'Novo'
        phase_color = '#2196F3'
    else:
        nr = card.next_review
        if nr and nr.tzinfo is None:
            nr = nr.replace(tzinfo=timezone.utc)
        if nr and nr <= now:
            phase = 'A revisar'
            phase_color = '#27ae60'
        else:
            phase = 'Intervalo'
            phase_color = '#888'

    # Renderizar conteudo
    front_html = card.render_front()
    back_html = card.render_back()

    # Tags
    tags = [{'id': t.id, 'name': t.name} for t in card.tags]

    # Info da nota e irmaos
    note_info = None
    siblings = []
    if card.note:
        note_info = {
            'id': card.note.id,
            'type': 'Omissao' if card.note.note_type == 'cloze' else 'Basico',
            'ordinal': card.ordinal,
            'edit_url': url_for('cards.edit_note', note_id=card.note.id),
        }
        for sc in Card.query.filter_by(note_id=card.note.id).order_by(Card.ordinal).all():
            siblings.append({'id': sc.id, 'ordinal': sc.ordinal, 'current': sc.id == card.id})
    else:
        note_info = {
            'edit_url': url_for('cards.edit_card', card_id=card.id),
        }

    # Historico de revisoes (ultimas 20)
    logs = []
    for log in ReviewLog.query.filter_by(card_id=card.id).order_by(ReviewLog.timestamp.desc()).limit(20).all():
        logs.append({
            'date': log.timestamp.strftime('%d/%m/%Y %H:%M'),
            'response': log.response,
            'interval_before': f"{log.interval_before:.2f}" if log.interval_before is not None else '-',
            'interval_after': f"{log.interval_after:.2f}" if log.interval_after is not None else '-',
            'ef_before': f"{log.ef_before:.2f}" if log.ef_before is not None else '-',
            'ef_after': f"{log.ef_after:.2f}" if log.ef_after is not None else '-',
            'time_spent': log.time_spent,
        })

    is_cloze = card.note is not None and card.note.note_type == 'cloze'

    return jsonify({
        'id': card.id,
        'front': front_html,
        'back': back_html,
        'is_cloze': is_cloze,
        'deck_name': card.deck.name,
        'deck_id': card.deck_id,
        'phase': phase,
        'phase_color': phase_color,
        'review_count': card.review_count,
        'accuracy': accuracy,
        'interval': format_interval(card.interval),
        'easiness_factor': f"{card.easiness_factor:.2f}",
        'repetition': card.repetition,
        'suspended': card.suspended,
        'tags': tags,
        'note_info': note_info,
        'siblings': siblings,
        'review_logs': logs,
    })

@cards_bp.route('/delete_deck/<int:deck_id>', methods=['POST'])
def delete_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    # Exclui todos os cartões deste deck (se desejar, ou pode somente excluir o deck)
    for card in deck.cards:
        db.session.delete(card)
    db.session.delete(deck)
    db.session.commit()
    flash("Baralho excluído com sucesso.", "success")
    return redirect(url_for('cards.decks'))


@cards_bp.route('/batch_change_deck', methods=['POST'])
def batch_change_deck():
    # Obtém o ID do novo baralho enviado pelo formulário
    new_deck_id = request.form.get('new_deck_id')
    if not new_deck_id:
        flash("Selecione um baralho para mudar.", "warning")
        return redirect(url_for('cards.panel'))
    
    # Obtém a lista de IDs dos cartões selecionados
    selected_cards = request.form.getlist('selected_cards')
    if not selected_cards:
        flash("Nenhum cartão selecionado.", "warning")
        return redirect(url_for('cards.panel'))
    
    # Atualiza o deck de cada cartão selecionado
    for card_id in selected_cards:
        card = Card.query.get(card_id)
        if card:
            card.deck_id = new_deck_id
    db.session.commit()
    flash("Baralho alterado com sucesso para os cartões selecionados.", "success")
    return redirect(url_for('cards.panel'))

@cards_bp.route('/batch_reset_cards', methods=['POST'])
def batch_reset_cards():
    # Obtém a lista de IDs dos cartões selecionados
    selected_cards = request.form.getlist('selected_cards')
    if not selected_cards:
        flash("Nenhum cartão selecionado para resetar.", "warning")
        return redirect(url_for('cards.panel'))
    
    cards = Card.query.filter(Card.id.in_(selected_cards)).all()
    now = datetime.now(timezone.utc)
    for card in cards:
        card.review_count = 0
        card.interval = 0.0
        card.difficulty = 5
        card.easiness_factor = 2.5
        card.repetition = 0
        card.next_review = now
        card.correct_count = 0
        if card.suspended:
            card.suspended = False

    db.session.commit()
    flash("Cartões resetados com sucesso.", "success")
    return redirect(url_for('cards.panel'))

@cards_bp.route('/batch_suspend_cards', methods=['POST'])
def batch_suspend_cards():
    selected_cards = request.form.getlist('selected_cards')
    if not selected_cards:
        flash("Nenhum cartão selecionado para operação.", "warning")
        return redirect(url_for('cards.panel'))
    
    # Verificar se todos os cartões selecionados estão suspensos
    all_suspended = True
    for card_id in selected_cards:
        card = Card.query.get(card_id)
        if card and not card.suspended:
            all_suspended = False
            break
    
    # Alternar o status de suspensão com base na verificação
    action_taken = "suspensos" if not all_suspended else "reativados"
    
    for card_id in selected_cards:
        card = Card.query.get(card_id)
        if card:
            # Se todos estão suspensos, reativar todos; caso contrário, suspender todos
            card.suspended = not all_suspended
    
    db.session.commit()
    flash(f"Cartões {action_taken} com sucesso.", "success")
    return redirect(url_for('cards.panel'))

@cards_bp.route('/change_deck/<int:card_id>', methods=['GET', 'POST'])
def change_deck(card_id):
    card = Card.query.get_or_404(card_id)
    decks = Deck.query.all()
    if request.method == 'POST':
        new_deck_id = request.form.get('new_deck_id')
        if new_deck_id:
            card.deck_id = new_deck_id
            db.session.commit()
            flash("Baralho alterado com sucesso.", "success")
            return redirect(url_for('cards.card_detail', card_id=card.id))
        else:
            flash("Selecione um baralho.", "warning")
    return render_template('change_deck.html', card=card, decks=decks)

@cards_bp.route('/change_deck_parent/<int:deck_id>', methods=['GET', 'POST'])
def change_deck_parent(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    all_decks = Deck.query.filter(Deck.id != deck_id).all()  # Exclua o próprio deck
    if request.method == 'POST':
        new_parent_id = request.form.get('new_parent_id')
        if new_parent_id and new_parent_id.isdigit():
            deck.parent_id = int(new_parent_id)
        else:
            deck.parent_id = None
        db.session.commit()
        flash("Baralho atualizado com sucesso!", "success")
        return redirect(url_for('cards.decks'))
    return render_template('change_deck_parent.html', deck=deck, all_decks=all_decks)

import json

@cards_bp.route('/statistics')
def statistics():
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # Estatísticas diárias
    today_stats = DailyStats.query.filter_by(date=today).first()
    if today_stats:
        daily_cards = today_stats.cards_studied
        daily_accuracy = (today_stats.correct_count / today_stats.cards_studied * 100) if today_stats.cards_studied > 0 else 0
    else:
        daily_cards = 0
        daily_accuracy = 0
    
    # Contagem de cartões - corrigido para usar os mesmos critérios em todo o aplicativo
    total_cards = Card.query.count()
    new_cards = Card.query.filter(Card.review_count == 0, Card.suspended == False).count()
    in_date = Card.query.filter(Card.review_count > 0, Card.next_review > now, Card.suspended == False).count()
    
    # Importante: esta linha precisa usar datetime.now(timezone.utc) diretamente, não a variável 'now'
    # para garantir consistência com o resto do aplicativo
    due_cards = Card.query.filter(Card.review_count > 0, Card.next_review <= now, Card.suspended == False).count()
    
    suspended_cards = Card.query.filter_by(suspended=True).count()
    
    # Calcular o streak atual
    current_streak = 0
    d = today
    while True:
        stats = DailyStats.query.filter_by(date=d).first()
        if stats and stats.cards_studied > 0:
            current_streak += 1
            d -= timedelta(days=1)
        else:
            break
    
    # Obter todas as estatísticas para o log de revisões
    all_stats = DailyStats.query.order_by(DailyStats.date.desc()).all()
    
    return render_template(
        'statistics.html',
        daily_cards=daily_cards,
        daily_accuracy=round(daily_accuracy, 1),
        total_cards=total_cards,
        new_cards=new_cards,
        in_date=in_date,
        due_cards=due_cards,  # Agora corrigido
        suspended_cards=suspended_cards,
        all_stats=all_stats,
        current_streak=current_streak
    )


@cards_bp.route('/statistics_heatmap')
def statistics_heatmap():
    import pandas as pd
    import numpy as np
    import matplotlib.pyplot as plt
    import seaborn as sns
    import io
    from datetime import datetime, timedelta
    from matplotlib.colors import LinearSegmentedColormap, BoundaryNorm

    # Período dinâmico baseado no ano atual
    current_year = datetime.now(timezone.utc).year
    start_date = datetime(current_year, 1, 1).date()
    end_date = datetime(current_year, 12, 31).date()

    # Obter os registros do DailyStats para 2025
    daily_stats = DailyStats.query.filter(
        DailyStats.date >= start_date,
        DailyStats.date <= end_date
    ).order_by(DailyStats.date).all()

    # Dicionário: data -> cartões estudados
    stats_dict = {ds.date: ds.cards_studied for ds in daily_stats}

    # Calcular o recorde de dias consecutivos (streak máximo)
    record_streak = 0
    current_temp = 0
    d = start_date
    while d <= end_date:
        cards = stats_dict.get(d, 0)
        if cards > 0:
            current_temp += 1
            record_streak = max(record_streak, current_temp)
        else:
            current_temp = 0
        d += timedelta(days=1)

    # Calcular o streak atual: contar a partir do dia de hoje (se estiver em 2025; senão, usar end_date)
    today_actual = datetime.now(timezone.utc).date()
    base_date = today_actual if start_date <= today_actual <= end_date else end_date
    current_streak_value = 0
    d = base_date
    while d >= start_date:
        cards = stats_dict.get(d, 0)
        if cards > 0:
            current_streak_value += 1
            d -= timedelta(days=1)
        else:
            break

    # Calcular o recorde de cartões estudados em um dia
    max_cards = max(stats_dict.values()) if stats_dict else 0

    # Criar grid com 12 linhas (meses: 1 a 12) e 31 colunas (dias: 1 a 31)
    grid = pd.DataFrame(0, index=range(1, 13), columns=range(1, 32))
    current_date = start_date
    while current_date <= end_date:
        month = current_date.month
        day = current_date.day
        cards = stats_dict.get(current_date, 0)
        grid.at[month, day] += cards
        current_date += timedelta(days=1)

    # Criar colormap customizado: de branco a darkgreen com intervalos de 10 até 800
    custom_cmap = LinearSegmentedColormap.from_list('custom_green', ['white', 'darkgreen'])
    bounds = np.arange(0, 810, 10)
    norm = BoundaryNorm(bounds, custom_cmap.N, clip=True)

    # Configurar a figura
    fig, ax = plt.subplots(figsize=(12, 8))
    sns.heatmap(
        grid,
        cmap=custom_cmap,
        norm=norm,
        linewidths=0.3,
        linecolor='#e0e0e0',
        square=True,
        cbar=False,
        ax=ax
    )

    # Anotar cada célula com o número de cartões, em fonte pequena, cor branca e 85% de transparência
    for i, month in enumerate(grid.index):  # i de 0 a 11
        for j, day in enumerate(grid.columns):  # j de 0 a 30
            val = grid.at[month, day]
            ax.text(j+0.5, i+0.5, f"{val}", ha="center", va="center", color="white", fontsize=6, alpha=0.85)

    # Configurar os rótulos dos eixos
    ax.set_xticklabels(grid.columns, rotation=0)
    ax.set_xlabel("Dias do mês")
    month_labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    ax.set_yticklabels([month_labels[i-1] for i in grid.index], rotation=0)
    ax.set_ylabel("Mês")
    ax.set_title(f"Estudo diário em {current_year}", fontsize=12)

    # Adicionar as informações de recorde e streak abaixo do heatmap (nova ordem)
    # Esquerda: Recorde de cartões estudados
    ax.text(0.05, -0.15, f"Recorde de cartões estudados: {max_cards}", 
            transform=ax.transAxes, ha="left", va="top", fontsize=10, fontweight="bold", color="olivedrab")
    # Centro: Dias consecutivos
    ax.text(0.5, -0.15, f"Dias consecutivos: {current_streak_value}", 
            transform=ax.transAxes, ha="center", va="top", fontsize=10, fontweight="bold", color="darkgreen")
    # Direita: Recorde de dias consecutivos
    ax.text(0.95, -0.15, f"Recorde de dias consecutivos: {record_streak}", 
            transform=ax.transAxes, ha="right", va="top", fontsize=10, fontweight="bold", color="forestgreen")

    # Ajustar layout para reduzir margens
    plt.tight_layout(pad=0.1)
    fig.subplots_adjust(top=0.85, bottom=0.10)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype='image/png')


@cards_bp.route('/forecast_chart')
def forecast_chart():
    import io
    import matplotlib.pyplot as plt
    import numpy as np
    from datetime import datetime, timedelta
    
    # Obter o período solicitado (padrão: 30 dias)
    period = request.args.get('period', '30days')
    
    today = datetime.now(timezone.utc).date()
    
    # Definir o número de dias com base no período selecionado
    if period == '1year':
        forecast_days = 365  # 1 ano
        # Para períodos longos, agruparemos por mês
        group_by = 'month'
    else:  # padrão: 30 dias
        forecast_days = 30
        group_by = 'day'
    
    # Contar cartões por dia/mês de vencimento
    forecast = {}
    
    if group_by == 'day':
        # Contagem diária
        for i in range(forecast_days):
            target_date = today + timedelta(days=i)
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            count = Card.query.filter(
                Card.next_review >= start_datetime,
                Card.next_review <= end_datetime,
                Card.suspended == False
            ).count()
            
            # Para visualização diária, usar formato dd/mm
            forecast[target_date.strftime('%d/%m')] = count
    
    else:  # group_by == 'month'
        # Agrupar por mês
        current_month = today.month
        current_year = today.year
        
        for i in range(12):  # 12 meses
            month = ((current_month - 1 + i) % 12) + 1
            year = current_year + ((current_month + i - 1) // 12)
            
            # Primeiro dia do mês
            if i == 0:
                # Para o mês atual, começar do dia atual
                start_date = today
            else:
                start_date = datetime(year, month, 1).date()
            
            # Último dia do mês
            if month == 12:
                end_date = datetime(year, 12, 31).date()
            else:
                end_date = (datetime(year, month+1, 1) - timedelta(days=1)).date()
            
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            
            count = Card.query.filter(
                Card.next_review >= start_datetime,
                Card.next_review <= end_datetime,
                Card.suspended == False
            ).count()
            
            # Para visualização mensal, usar formato "Mmm/aa"
            forecast[start_date.strftime('%b/%y')] = count
    
    # Criar gráfico
    fig, ax = plt.subplots(figsize=(10, 4))
    
    x = list(forecast.keys())
    y = list(forecast.values())
    
    # Usar cor azul para ambos os períodos
    color = '#3f51b5'  # Azul
    
    ax.plot(x, y, marker='o', linestyle='-', color=color)
    ax.fill_between(x, y, alpha=0.2, color=color)
    
    # Girar rótulos do eixo x para períodos longos
    if group_by == 'month':
        plt.xticks(rotation=45)
    
    # Para períodos longos, mostrar apenas alguns rótulos para evitar sobreposição
    if len(x) > 10:
        for i, label in enumerate(ax.get_xticklabels()):
            if group_by == 'day' and i % 3 != 0:
                label.set_visible(False)
    
    ax.set_ylabel('Cartões para Revisão')
    
    # Título baseado no período
    if period == '1year':
        title = 'Previsão de Carga de Revisão (12 meses)'
    else:
        title = 'Previsão de Carga de Revisão (30 dias)'
    
    ax.set_title(title)
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # Salvar a figura em um objeto BytesIO e retornar como arquivo PNG
    buffer = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    plt.close(fig)
    
    return send_file(buffer, mimetype='image/png')

@cards_bp.route('/revision_history_chart')
def revision_history_chart():
    import io
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    from datetime import datetime, timedelta
    
    # Obter o período solicitado (padrão: 1 mês)
    period = request.args.get('period', '1month')
    
    today = datetime.now(timezone.utc).date()
    
    # Definir o período com base na seleção
    if period == '12months':
        start_date = today - timedelta(days=365)
        date_format = '%b'
        # Tradução dos meses para português
        month_translator = {
            'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr', 
            'May': 'Mai', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago', 
            'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'
        }
    else:  # '1month'
        start_date = today - timedelta(days=30)
        date_format = '%d/%m'
    
    # Consultar os dados
    stats = DailyStats.query.filter(
        DailyStats.date >= start_date,
        DailyStats.date <= today
    ).order_by(DailyStats.date).all()
    
    # Preparar os dados para o gráfico
    dates = []
    cards_studied = []
    
    # Preencher todas as datas no intervalo (incluindo datas sem estudos)
    current = start_date
    while current <= today:
        dates.append(current)
        # Procurar se há estatísticas para esta data
        stat = next((s for s in stats if s.date == current), None)
        if stat:
            cards_studied.append(stat.cards_studied)
        else:
            cards_studied.append(0)
        current += timedelta(days=1)
    
    # Para o período de 12 meses, agrupar por mês
    if period == '12months':
        monthly_data = {}
        for i, date in enumerate(dates):
            month_key = date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = 0
            monthly_data[month_key] += cards_studied[i]
        
        # Converter dados mensais de volta para listas
        dates = []
        cards_studied = []
        for month_key in sorted(monthly_data.keys()):
            year, month = map(int, month_key.split('-'))
            dates.append(datetime(year, month, 15).date())  # meio do mês
            cards_studied.append(monthly_data[month_key])
    
    # Criar o gráfico
    fig, ax = plt.subplots(figsize=(10, 4))
    
    # Plotar com cor verde
    ax.plot(dates, cards_studied, marker='o', linestyle='-', color='#28a745', linewidth=2)
    ax.fill_between(dates, cards_studied, alpha=0.2, color='#28a745')
    
    # Configurar o eixo X com formatação de data
    if period == '12months':
        # Configurar formatação para meses em português
        ax.xaxis.set_major_formatter(mdates.DateFormatter(date_format))
        plt.xticks(dates)
        # Traduzir nomes dos meses
        if hasattr(ax, 'get_xticklabels'):
            labels = ax.get_xticklabels()
            for label in labels:
                for eng, pt in month_translator.items():
                    if eng in label.get_text():
                        label.set_text(pt)
    else:
        # Configurar formatação para todos os dias do mês
        ax.xaxis.set_major_formatter(mdates.DateFormatter(date_format))
        plt.xticks(dates, fontsize=8)
        plt.xticks(rotation=45)
    
    # Configurar título e rótulos
    if period == '12months':
        ax.set_title('Histórico de Revisões (12 meses)')
    else:
        ax.set_title('Histórico de Revisões (1 mês)')
    
    ax.set_ylabel('Cartões Revisados')
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # Ajustar layout e limites
    ax.set_ylim(bottom=0)  # Começa do zero
    
    # Salvar a figura
    buffer = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    plt.close(fig)
    
    return send_file(buffer, mimetype='image/png')

@cards_bp.route('/tags')
def tags():
    """Lista todas as tags existentes."""
    all_tags = Tag.query.order_by(Tag.name).all()
    return render_template('tags.html', tags=all_tags)

@cards_bp.route('/tag/<int:tag_id>')
def tag_detail(tag_id):
    """Mostra cartões com uma tag específica."""
    tag = Tag.query.get_or_404(tag_id)
    cards = tag.cards
    return render_template('tag_detail.html', tag=tag, cards=cards)

@cards_bp.route('/add_tag', methods=['POST'])
def add_tag():
    """Adiciona uma nova tag."""
    tag_name = request.form.get('tag_name', '').strip()
    if not tag_name:
        flash('O nome da tag não pode ser vazio.', 'warning')
        return redirect(url_for('cards.tags'))
    
    existing_tag = Tag.query.filter(func.lower(Tag.name) == func.lower(tag_name)).first()
    if existing_tag:
        flash(f'A tag "{tag_name}" já existe.', 'warning')
        return redirect(url_for('cards.tags'))
    
    new_tag = Tag(name=tag_name)
    db.session.add(new_tag)
    db.session.commit()
    flash(f'Tag "{tag_name}" criada com sucesso.', 'success')
    return redirect(url_for('cards.tags'))

@cards_bp.route('/delete_tag/<int:tag_id>', methods=['POST'])
def delete_tag(tag_id):
    """Remove uma tag."""
    tag = Tag.query.get_or_404(tag_id)
    db.session.delete(tag)
    db.session.commit()
    flash(f'Tag "{tag.name}" removida com sucesso.', 'success')
    return redirect(url_for('cards.tags'))

@cards_bp.route('/tag/<int:tag_id>/rename', methods=['GET', 'POST'])
def rename_tag(tag_id):
    """Renomeia uma tag."""
    tag = Tag.query.get_or_404(tag_id)
    
    if request.method == 'POST':
        new_name = request.form.get('new_name', '').strip()
        if not new_name:
            flash('O nome da tag não pode ser vazio.', 'warning')
            return redirect(url_for('cards.rename_tag', tag_id=tag_id))
        
        # Verificar se já existe uma tag com esse nome
        existing_tag = Tag.query.filter(func.lower(Tag.name) == func.lower(new_name)).first()
        if existing_tag and existing_tag.id != tag.id:
            flash(f'A tag "{new_name}" já existe.', 'warning')
            return redirect(url_for('cards.rename_tag', tag_id=tag_id))
        
        tag.name = new_name
        db.session.commit()
        flash(f'Tag renomeada com sucesso para "{new_name}".', 'success')
        return redirect(url_for('cards.tags'))
    
    return render_template('rename_tag.html', tag=tag)

@cards_bp.route('/card/<int:card_id>/tags', methods=['GET', 'POST'])
def manage_card_tags(card_id):
    """Gerencia as tags de um cartão."""
    card = Card.query.get_or_404(card_id)
    all_tags = Tag.query.order_by(Tag.name).all()
    
    if request.method == 'POST':
        # Limpar todas as tags do cartão
        card.tags.clear()
        
        # Adicionar as tags selecionadas
        selected_tags = request.form.getlist('tags')
        for tag_id in selected_tags:
            tag = Tag.query.get(tag_id)
            if tag:
                card.tags.append(tag)
        
        db.session.commit()
        flash('Tags atualizadas com sucesso.', 'success')
        return redirect(url_for('cards.card_detail', card_id=card.id))
    
    return render_template('manage_card_tags.html', card=card, all_tags=all_tags)

@cards_bp.route('/batch_manage_tags', methods=['POST'])
def batch_manage_tags():
    """Gerencia tags para vários cartões de uma vez."""
    selected_cards = request.form.getlist('selected_cards')
    selected_tags = request.form.getlist('tags')
    
    if not selected_cards:
        flash('Nenhum cartão selecionado.', 'warning')
        return redirect(url_for('cards.panel'))
    
    action = request.form.get('tag_action')
    
    for card_id in selected_cards:
        card = Card.query.get(card_id)
        if card:
            if action == 'add':
                # Adicionar tags selecionadas
                for tag_id in selected_tags:
                    tag = Tag.query.get(tag_id)
                    if tag and tag not in card.tags:
                        card.tags.append(tag)
            elif action == 'remove':
                # Remover tags selecionadas
                for tag_id in selected_tags:
                    tag = Tag.query.get(tag_id)
                    if tag and tag in card.tags:
                        card.tags.remove(tag)
            elif action == 'set':
                # Substituir todas as tags
                card.tags.clear()
                for tag_id in selected_tags:
                    tag = Tag.query.get(tag_id)
                    if tag:
                        card.tags.append(tag)
    
    db.session.commit()
    flash('Tags atualizadas com sucesso para os cartões selecionados.', 'success')
    return redirect(url_for('cards.panel'))

# MODIFICAR na rota custom_study, remover a limitação de cartões
@cards_bp.route('/custom_study', methods=['GET', 'POST'])
def custom_study():
    """Configuração para sessão de estudo personalizado."""
    decks = Deck.query.all()
    tags = Tag.query.order_by(Tag.name).all()  # Já ordenado alfabeticamente
    
    if request.method == 'POST':
        # Limpar qualquer sessão de estudo existente
        session.pop('session_cards', None)
        session.pop('current_index', None)
        session.pop('cards_reviewed', None)
        session.pop('review_history', None)
        session.pop('custom_study', None)
        
        deck_ids = request.form.getlist('deck_ids')
        tag_ids = request.form.getlist('tag_ids')
        
        # Construir a consulta base
        query = Card.query.filter(Card.suspended == False)
        
        # Filtrar por baralhos, se especificados (CTE recursivo)
        if deck_ids:
            deck_ids = [int(d_id) for d_id in deck_ids if d_id.isdigit()]
            if deck_ids:
                all_deck_ids = []
                for d_id in deck_ids:
                    all_deck_ids.extend(get_subdeck_ids(d_id))
                all_deck_ids = list(set(all_deck_ids))
                query = query.filter(Card.deck_id.in_(all_deck_ids))
        
        # Filtrar por tags, se especificadas
        if tag_ids:
            tag_ids = [int(t_id) for t_id in tag_ids if t_id.isdigit()]
            if tag_ids:
                # Criar uma condição OR para incluir cartões com qualquer uma das tags selecionadas
                tag_condition = False
                for tag_id in tag_ids:
                    tag_condition = or_(tag_condition, Card.tags.any(Tag.id == tag_id))
                query = query.filter(tag_condition)
        
        # Ordenar aleatoriamente (sem limite)
        cards = query.order_by(func.random()).all()
        
        if not cards:
            flash('Nenhum cartão encontrado com os critérios especificados.', 'warning')
            return redirect(url_for('cards.custom_study'))
        
        # Configurar a sessão para o estudo personalizado
        session.permanent = True
        session['session_cards'] = [c.id for c in cards]
        session['current_index'] = 0
        session['cards_reviewed'] = 0
        session['review_history'] = []
        session['custom_study'] = True  # Marcar como estudo personalizado
        
        return redirect(url_for('cards.custom_study_session'))
    
    return render_template('custom_study.html', decks=decks, tags=tags)

@cards_bp.route('/custom_study_session', methods=['GET', 'POST'])
def custom_study_session():
    """Sessão de estudo personalizado."""
    if 'session_cards' not in session or session.get('custom_study') != True:
        flash('Sessão de estudo personalizado não iniciada.', 'warning')
        return redirect(url_for('cards.custom_study'))
    
    session_cards = session['session_cards']
    current_index = session.get('current_index', 0)
    total_cards = len(session_cards)
    
    if total_cards == 0 or current_index >= total_cards:
        # Salvar resultados da sessão
        review_history = session.get('review_history', [])
        
        # Limpar a sessão
        session.pop('session_cards', None)
        session.pop('current_index', None)
        session.pop('cards_reviewed', None)
        session.pop('custom_study', None)
        
        # Redirecionar para a página de resultados
        return redirect(url_for('cards.custom_study_results', history=json.dumps(review_history)))
    
    if request.method == 'POST':
        response = request.form.get('response')
        card_id = session_cards[current_index]
        card = Card.query.get(card_id)
        
        if "review_history" not in session:
            session["review_history"] = []
        
        # Registrar a resposta no histórico
        history_entry = {
            "card_id": card_id,
            "front": card.render_front() if card.note else card.front,
            "back": card.render_back() if card.note else card.back,
            "response": response
        }
        
        history = session["review_history"]
        history.append(history_entry)
        session["review_history"] = history
        
        # Atualizar estatísticas diárias
        today = datetime.now(timezone.utc).date()
        stats = DailyStats.query.filter_by(date=today).first()
        if not stats:
            stats = DailyStats(date=today, cards_studied=0, correct_count=0, new_cards=0, revision_cards=0)
            db.session.add(stats)
        
        stats.cards_studied += 1
        if response in ['facil', 'difícil', 'muito_facil']:
            stats.correct_count += 1
        
        db.session.commit()
        
        # Avançar para o próximo cartão
        session['current_index'] = current_index + 1
        session['cards_reviewed'] = session.get('cards_reviewed', 0) + 1
        
        return redirect(url_for('cards.custom_study_session'))
    
    # Se chegou aqui, é uma requisição GET
    card = Card.query.get(session_cards[current_index])
    progress_percent = int((session.get('cards_reviewed', 0) / total_cards) * 100) if total_cards else 0
    
    return render_template('custom_study_session.html',
                          card=card,
                          current_index=current_index,
                          total=total_cards,
                          cards_reviewed=session.get('cards_reviewed', 0),
                          progress_percent=progress_percent)

@cards_bp.route('/custom_study_results')
def custom_study_results():
    """Mostra os resultados do estudo personalizado."""
    history_json = request.args.get('history', '[]')
    try:
        history = json.loads(history_json)
    except json.JSONDecodeError:
        history = []
    
    # Agrupar por resposta
    results = {
        'errei': [],
        'difícil': [],
        'facil': [],
        'muito_facil': []
    }
    
    for entry in history:
        response = entry.get('response')
        if response in results:
            card = Card.query.get(entry.get('card_id'))
            if card:
                results[response].append(card)
    
    return render_template('custom_study_results.html', results=results)