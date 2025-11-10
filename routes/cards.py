from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, current_app, send_file
from filters import get_cards_recursive, count_cards_recursive
from models import Deck, Card, Tag, db, DailyStats, Player
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, text, or_
import math
import os
import csv
import random
import json

# Criar o objeto Blueprint
cards_bp = Blueprint('cards', __name__)

@cards_bp.app_template_global()
def datetime_module():
    return datetime

@cards_bp.app_template_global()
def timezone_module():
    return timezone

##############################################
#         ALGORITMO DE REVISÃO
##############################################
# DEPRECATED: Sistema de níveis/XP será removido
def get_exp_for_next_level(level):
    """DEPRECATED: Esta função será removida. Sistema de níveis não é mais usado."""
    import warnings
    warnings.warn("get_exp_for_next_level está deprecated e será removido", DeprecationWarning)
    from core.formulas import get_exp_for_next_level as new_func
    return new_func(level)

@cards_bp.app_template_global()
def datetime_module():
    return datetime
    
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
            db.session.commit()  # você pode acumular e commitar no final, se preferir
        parent = deck  # para o próximo nível, o atual será o pai
    return parent

# This function will be called from the existing study_session route
def process_gamification(card, response, time_spent, was_new):
    """Process gamification logic for studying cards."""
    print(f"=== PROCESSANDO GAMIFICAÇÃO PARA CARTÃO #{card.id} ===")
    print(f"Estado do cartão: review_count={card.review_count}, era novo? {was_new}")
    
    player = Player.query.first()
    if not player:
        print("ERRO: Jogador não encontrado!")
        return
    
    print(f"Jogador antes: level={player.level}, XP={player.experience}/{get_exp_for_next_level(player.level)}")
    
    # Update last active time
    player.last_active = datetime.now(timezone.utc)
    
    # Add study time to player's total
    if time_spent < 60:
        player.study_time_total += time_spent
        print(f"Tempo de estudo atualizado: {player.study_time_total}s")
        
        # Check for 30-minute milestone
        if player.study_time_total >= 1800 and (player.study_time_total - time_spent) < 1800:
            crystals_earned = 1
            player.crystals += crystals_earned
            print(f"MARCO: 30 minutos de estudo atingidos! +{crystals_earned} cristal")
            flash_gamification(f"Você estudou por 30 minutos e ganhou {crystals_earned} Cristal de Memória!")
    
    # Check for hour milestones
    hours_studied = player.study_time_total // 3600
    hours_before = (player.study_time_total - time_spent) // 3600
    
    if hours_studied != hours_before:
        if hours_studied == 20 or hours_studied == 50 or hours_studied == 100 or (hours_studied > 100 and hours_studied % 100 == 0):
            crystals_earned = 5
            player.crystals += crystals_earned
            print(f"MARCO: {hours_studied} horas de estudo atingidas! +{crystals_earned} cristais")
            flash_gamification(f"Parabéns! Você atingiu {hours_studied} horas de estudo e ganhou {crystals_earned} Cristais de Memória!")
    
    # IMPORTANTE: Usamos o parâmetro was_new em vez de verificar card.review_count
    print(f"O cartão era novo? {was_new}")
    
    # Para cartões novos: ganhe XP e suba de nível
    if was_new:
        base_xp = 2  # XP base por cartão novo
        
        # Aplicar bônus de XP de talentos (se existir)
        xp_bonus_multiplier = 1.0
        if hasattr(player, 'exp_boost') and player.exp_boost > 0:
            xp_bonus_multiplier = 1.0 + player.exp_boost
            print(f"Bônus de XP aplicado: multiplicador {xp_bonus_multiplier}")
        
        xp_gained = base_xp * xp_bonus_multiplier  # remover int() para permitir decimais
        print(f"CARTÃO NOVO! Concedendo {xp_gained:.1f} XP (base: {base_xp}, multiplicador: {xp_bonus_multiplier})")
        
        # Adicionar XP
        player.experience += xp_gained
        print(f"Experiência após ganho: {player.experience}/{get_exp_for_next_level(player.level)}")
        
        # Check for level up
        level_before = player.level
        while player.experience >= get_exp_for_next_level(player.level):
            xp_needed = get_exp_for_next_level(player.level)
            player.experience -= xp_needed
            player.level += 1

            # Award attribute point on level up
            player.attribute_points += 1
            # Award HP on level up
            player.max_hp += 1
            player.hp = min(player.hp + 1, player.max_hp)
            
            print(f"LEVEL UP! Subiu para nível {player.level}. XP restante: {player.experience}")
        
        if player.level > level_before:
            flash_gamification(f"Parabéns! Você subiu para o nível {player.level} e ganhou 1 ponto de atributo!")
    else:
        print("Este não é um cartão novo, nenhum XP concedido.")
    
    print(f"Jogador depois: level={player.level}, XP={player.experience}/{get_exp_for_next_level(player.level)}")
    
    try:
        db.session.commit()
        print("Gamificação processada e salva com sucesso")
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao salvar mudanças no banco de dados: {e}")
    
    print("=== FIM DO PROCESSAMENTO DE GAMIFICAÇÃO ===")


def get_next_base_interval(current_interval):
    sequence = [10/1440.0, 1, 3, 7, 21, 45, 90, 180, 360]
    for base in sequence:
        if current_interval < base:
            return base
    return sequence[-1]

def get_current_step(interval):
    sequence = [10/1440.0, 1, 3, 7, 21, 45, 90, 180, 360]
    for i, base in enumerate(sequence):
        if abs(interval - base) < 1e-6:
            return i
        if interval < base:
            return i
    return len(sequence) - 1

def update_daily_stats(response, was_new):
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
    if response in ['facil', 'difícil', 'muito_facil']:
        stats.correct_count += 1

def update_card_review(card, response):
    now = datetime.now(timezone.utc)
    was_new = (card.review_count == 0)
    card.review_count += 1
    sequence = [10/1440.0, 1, 3, 7, 21, 45, 90, 180, 360]
    current_step = get_current_step(card.interval)
    if response == 'errei':
        card.interval = sequence[0]
        card.difficulty = 10
    elif current_step == 0:
        if response in ['difícil', 'facil']:
            if was_new and response == 'difícil':
                card.interval = 2
            else:
                card.interval = sequence[1]
            if response == 'difícil':
                card.difficulty = min(card.difficulty + 0.1, 10)
            else:
                card.difficulty = max(card.difficulty - 0.1, 1)
        elif response == 'muito_facil':
            card.interval = sequence[2]
            card.difficulty = max(card.difficulty - 0.3, 1)
        else:
            card.interval = sequence[1]
            card.difficulty = min(card.difficulty + 0.1, 10)
    else:
        new_step = min(current_step + 1, len(sequence) - 1)
        if response == 'difícil':
            card.difficulty = min(card.difficulty + 0.1, 10)
        elif response == 'facil':
            card.difficulty = max(card.difficulty - 0.1, 1)
        elif response == 'muito_facil':
            new_step = min(current_step + 2, len(sequence) - 1)
            card.difficulty = max(card.difficulty - 0.3, 1)
        else:
            card.difficulty = min(card.difficulty + 0.1, 10)
        card.interval = sequence[new_step]
    modifier = 2 - ((card.difficulty - 1) * 1.5 / 9)
    card.next_review = now + timedelta(days=card.interval * modifier)
    update_daily_stats(response, was_new)
    db.session.commit()

def compute_next_interval(card, response):
    sequence = [10/1440.0, 1, 3, 7, 21, 45, 90, 180, 360]
    current_step = get_current_step(card.interval)
    new_interval = card.interval
    new_difficulty = card.difficulty
    if response == 'errei':
        new_step = 0
        new_difficulty = 10
    elif current_step == 0:
        if response in ['difícil', 'facil']:
            new_step = 1
            if response == 'difícil':
                new_difficulty = min(new_difficulty + 0.1, 10)
            else:
                new_difficulty = max(new_difficulty - 0.1, 1)
        elif response == 'muito_facil':
            new_step = 2
            new_difficulty = max(new_difficulty - 0.3, 1)
        else:
            new_step = 1
            new_difficulty = min(new_difficulty + 0.1, 10)
    else:
        new_step = min(current_step + 1, len(sequence) - 1)
        if response == 'difícil':
            new_difficulty = min(new_difficulty + 0.1, 10)
        elif response == 'facil':
            new_difficulty = max(new_difficulty - 0.1, 1)
        elif response == 'muito_facil':
            new_step = min(current_step + 2, len(sequence) - 1)
            new_difficulty = max(new_difficulty - 0.3, 1)
        else:
            new_difficulty = min(new_difficulty + 0.1, 10)
    new_interval = sequence[new_step]
    modifier = 2 - ((new_difficulty - 1) * 1.5 / 9)
    next_interval = new_interval * modifier
    return next_interval, new_difficulty

def format_interval(interval):
    if interval < 1:
        total_minutes = interval * 1440
        if total_minutes < 60:
            return f"{int(total_minutes)} min"
        else:
            hours = int(total_minutes // 60)
            minutes = int(total_minutes % 60)
            return f"{hours}h {minutes}min"
    else:
        return f"{interval:.1f} dias"

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
#                ROTAS
##############################################
@cards_bp.route('/')
def index():
    today = datetime.now(timezone.utc).date()
    stats = DailyStats.query.filter_by(date=today).first()
    
    # Inicializar o tempo de estudo
    total_study_time = 0
    
    # Obter o tempo do banco de dados
    if stats:
        accuracy = (stats.correct_count / stats.cards_studied * 100) if stats.cards_studied > 0 else 0
        # Obter o tempo salvo no banco de dados
        db_study_time = getattr(stats, 'study_time', 0) or 0
        total_study_time += db_study_time
    else:
        stats = {'cards_studied': 0, 'new_cards': 0, 'revision_cards': 0, 'study_time': 0}
        accuracy = 0
    
    # Adicionar o tempo da sessão ativa (se existir)
    if 'study_time_total' in session and session.get('study_time_total', 0) > 0:
        session_time = session.get('study_time_total', 0)
        total_study_time += session_time
        print(f"Sessão ativa: {session_time}s adicionados temporariamente ao tempo total.")
    
    # Converter para minutos
    study_time_minutes = total_study_time // 60
    
    due_count = Card.query.filter(Card.next_review <= datetime.now(timezone.utc)).count()
    new_total = Card.query.filter(Card.review_count == 0).count()
    in_date = Card.query.filter(Card.review_count > 0, Card.next_review > datetime.now(timezone.utc)).count()
    due_total = Card.query.filter(Card.review_count > 0, Card.next_review <= datetime.now(timezone.utc)).count()
    circumference = 2 * math.pi * 16
    pie_dash = (accuracy / 100.0) * circumference
    pie_gap = circumference - pie_dash
    
    return render_template('index.html',
                           stats=stats,
                           accuracy=accuracy,
                           due_count=due_count,
                           new_total=new_total,
                           in_date=in_date,
                           due_total=due_total,
                           pie_dash=pie_dash,
                           pie_gap=pie_gap,
                           study_time_minutes=study_time_minutes)

@cards_bp.route('/study_lobby')
def study_lobby():
    # Verificar se os dados da sessão estão consistentes
    session_cards = session.get('session_cards', None)
    current_index = session.get('current_index', 0)
    is_custom_study = session.get('custom_study', False)
    
    # Verificar se a sessão é válida
    session_exists = False
    if session_cards and isinstance(session_cards, list) and len(session_cards) > 0:
        if current_index < len(session_cards):
            session_exists = True
        else:
            # Sessão inconsistente - limpar
            session.pop('session_cards', None)
            session.pop('current_index', None)
            session.pop('cards_reviewed', None)
            session.pop('review_history', None)
            session.pop('study_time_total', None)
            session.pop('total_session', None)
            session.pop('reviewed_session', None)
            session.pop('active_deck', None)
            session.pop('custom_study', None)
    
    new_count = 0
    revision_count = 0
    reviewed_session = 0
    total_session = 0
    active_deck = session.get('active_deck', 0)
    
    if session_exists:
        now = datetime.now(timezone.utc)
        total_session = len(session_cards)
        reviewed_session = session.get('cards_reviewed', 0)
        for card_id in session_cards:
            card = Card.query.get(card_id)
            if card:
                if card.review_count == 0:
                    new_count += 1
                else:
                    revision_count += 1
    
    global_new = Card.query.filter(Card.review_count == 0, Card.suspended == False).count()
    global_in_date = Card.query.filter(Card.review_count > 0, Card.next_review > datetime.now(timezone.utc), Card.suspended == False).count()
    global_due = Card.query.filter(Card.review_count > 0, Card.next_review <= datetime.now(timezone.utc), Card.suspended == False).count()
    decks = Deck.query.all()
    session['study_start_time'] = datetime.utcnow().isoformat()
    
    return render_template('study_lobby.html',
                           session_exists=session_exists,
                           is_custom_study=is_custom_study,
                           new_count=new_count,
                           revision_count=revision_count,
                           reviewed_session=reviewed_session,
                           total_session=total_session,
                           global_new=global_new,
                           global_in_date=global_in_date,
                           global_due=global_due,
                           decks=decks,
                           active_deck=active_deck)

@cards_bp.route('/import', methods=['GET', 'POST'])
def import_cards():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            # Cria a pasta de uploads, se não existir
            if not os.path.exists(current_app.config['UPLOAD_FOLDER']):
                os.makedirs(current_app.config['UPLOAD_FOLDER'])
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            
            # Extrai o nome do arquivo sem a extensão para definir a hierarquia dos baralhos
            deck_name_str = os.path.splitext(file.filename)[0]
            
            # Cria ou recupera a hierarquia de baralhos com base no nome do arquivo
            final_deck = get_or_create_deck(deck_name_str)
            
            # Lê o arquivo CSV (supondo que o delimitador seja tabulação)
            with open(filepath, newline='', encoding='utf-8-sig') as txtfile:
                csv_reader = csv.reader(txtfile, delimiter='\t')
                cards_added = 0
                for row in csv_reader:
                    if len(row) >= 2:
                        front = row[0].strip()
                        back = row[1].strip()
                        # Cria o cartão associado ao baralho final da hierarquia
                        db.session.add(Card(front=front, back=back, deck_id=final_deck.id))
                        cards_added += 1    
                db.session.commit()
            flash(f'Importação concluída! {cards_added} cartões adicionados ao baralho "{final_deck.name}"', 'success')
            return redirect(url_for('cards.decks'))
        else:
            flash('Por favor, selecione um arquivo.', 'danger')
    return render_template('import.html')

@cards_bp.route('/start_session_new')
def start_session_new():
    session.clear()
    # Seleciona apenas os cartões novos, não suspensos, limitando a 50
    cards = Card.query.filter(Card.review_count == 0, Card.suspended == False).order_by(Card.id.asc()).limit(50).all()
    if not cards:
        flash('Nenhum cartão novo disponível.', 'warning')
        return redirect(url_for('cards.study_lobby'))
    session.permanent = True
    session['session_cards'] = [c.id for c in cards]
    session['current_index'] = 0
    session['cards_reviewed'] = 0
    session['review_history'] = []
    session['active_deck'] = 0
    return redirect(url_for('cards.study_session'))

@cards_bp.route('/start_session_revisions')
def start_session_revisions():
    now = datetime.now(timezone.utc)
    cards = Card.query.filter(Card.review_count > 0, Card.next_review <= now, Card.suspended == False).order_by(Card.next_review.asc()).all()
    if cards:
        cards = cards[:50]
    if not cards:
        flash('Nenhum cartão de revisão disponível.', 'warning')
        return redirect(url_for('cards.study_lobby'))
    session.permanent = True
    session['session_cards'] = [c.id for c in cards]
    session['current_index'] = 0
    session['cards_reviewed'] = 0
    session['review_history'] = []
    session['active_deck'] = 0
    return redirect(url_for('cards.study_session'))

@cards_bp.route('/study_session', methods=['GET', 'POST'])
def study_session():
    session.permanent = True
    if 'session_cards' not in session:
        flash('Sessão não iniciada.', 'warning')
        return redirect(url_for('cards.index'))
    
    session_cards = session['session_cards']
    current_index = session.get('current_index', 0)
    total_cards = len(session_cards)
    
    # Inicializar o contador de tempo na sessão se não existir
    if 'study_time_total' not in session:
        session['study_time_total'] = 0
    
    # Inicializar contador de revisões se não existir
    if 'session_revision_count' not in session:
        session['session_revision_count'] = 0
    
    if total_cards == 0 or current_index >= total_cards:
        # Transferir o tempo total estudado para a estatística diária
        if 'study_time_total' in session and session['study_time_total'] > 0:
            today = datetime.now(timezone.utc).date()
            today_stats = DailyStats.query.filter_by(date=today).first()
            if not today_stats:
                today_stats = DailyStats(date=today, cards_studied=0, correct_count=0, new_cards=0, revision_cards=0)
                db.session.add(today_stats)
            
            # Adicionar o tempo estudado às estatísticas diárias
            try:
                current_time = getattr(today_stats, 'study_time', 0) or 0
                today_stats.study_time = current_time + session.get('study_time_total', 0)
                db.session.commit()
            except Exception as e:
                print(f"Erro ao salvar tempo de estudo: {e}")
                db.session.rollback()
        
        # Mantemos o contador de revisões para a tela de batalha
        # Mas limpamos os outros dados da sessão
        session.pop('session_cards', None)
        session.pop('current_index', None)
        session.pop('cards_reviewed', None)
        session.pop('review_history', None)
        session.pop('study_time_total', None)
        session.pop('total_session', None)
        session.pop('reviewed_session', None)
        session.pop('active_deck', None)
        
        flash('Sessão finalizada! Todos os cartões foram estudados.', 'success')
        return redirect(url_for('cards.study_lobby'))
    
    if request.method == 'POST':
        response = request.form.get('response')
        time_spent = request.form.get('time_spent', '0')
        
        try:
            time_spent = int(time_spent)
        except ValueError:
            time_spent = 0
        
        # Adicionar o tempo gasto (somente se < 60 segundos)
        if time_spent < 60:
            current_total = session.get('study_time_total', 0)
            session['study_time_total'] = current_total + time_spent
            print(f"Tempo registrado para este cartão: {time_spent}s, total acumulado: {session['study_time_total']}s")
        
        if "review_history" not in session:
            session["review_history"] = []
        
        card = Card.query.get(session_cards[current_index])
        
        # IMPORTANTE: Verificar se o cartão é novo ANTES de qualquer atualização
        was_new = (card.review_count == 0)
        print(f"CARTÃO #{card.id} - Review count antes: {card.review_count}, é novo? {was_new}")
        
        prev_state = {
            "card_id": card.id,
            "interval": card.interval,
            "difficulty": card.difficulty,
            "next_review": card.next_review.isoformat() if card.next_review else None,
            "review_count": card.review_count,
            "correct_count": card.correct_count
        }
        
        history = session["review_history"]
        history.append(prev_state)
        session["review_history"] = history
        
        # Atualizar o cartão com o algoritmo de espaçamento
        update_card_review(card, response)
        
        # Process gamification - agora passamos was_new como parâmetro
        process_gamification(card, response, time_spent, was_new)
        
        # Verificar novamente para depuração
        print(f"CARTÃO #{card.id} - Review count depois: {card.review_count}")
        
        # Contar revisões para dano ao boss apenas para cartões que JÁ ERAM de revisão
        if not was_new:  # Se era um cartão de revisão ANTES da atualização
            # Incrementar contador de revisões para dano ao boss (1 ponto por revisão)
            # Independente da resposta, todos os cartões de revisão valem 1 ponto
            revision_count = session.get('session_revision_count', 0)
            session['session_revision_count'] = revision_count + 1
            print(f"REVISÃO CONTABILIZADA: Total para dano ao boss: {session['session_revision_count']}")
        else:
            print("CARTÃO NOVO - Não contabilizado para dano, apenas para XP")
        
        session['current_index'] = current_index + 1
        session['cards_reviewed'] = session.get('cards_reviewed', 0) + 1
        return redirect(url_for('cards.study_session'))
    
    # Se chegou aqui, é uma requisição GET
    card = Card.query.get(session_cards[current_index])
    progress_percent = int((session.get('cards_reviewed', 0) / total_cards) * 100) if total_cards else 0
    next_errei, _ = compute_next_interval(card, 'errei')
    next_dificil, _ = compute_next_interval(card, 'difícil')
    next_facil, _ = compute_next_interval(card, 'facil')
    next_muitofacil, _ = compute_next_interval(card, 'muito_facil')
    
    return render_template('study_session.html',
                           card=card,
                           current_index=current_index,
                           total=total_cards,
                           cards_reviewed=session.get('cards_reviewed', 0),
                           next_errei=format_interval(next_errei),
                           next_dificil=format_interval(next_dificil),
                           next_facil=format_interval(next_facil),
                           next_muitofacil=format_interval(next_muitofacil),
                           progress_percent=progress_percent,
                           datetime=datetime)


@cards_bp.route('/undo_review')
def undo_review():
    """Undo the last review and revert any gamification rewards."""
    if "review_history" in session and session["review_history"]:
        # Obter o último estado do cartão
        last_state = session["review_history"].pop()
        
        # Obter o cartão atual
        card = Card.query.get(last_state["card_id"])
        if not card:
            flash("Cartão não encontrado.", "warning")
            return redirect(url_for("study_session"))
        
        # Verificar se o cartão era novo quando foi estudado (before_review_count == 0)
        was_new = (last_state["review_count"] == 0)
        
        # 1. Reverter os dados do cartão
        card.interval = last_state["interval"]
        card.difficulty = last_state["difficulty"]
        card.next_review = datetime.fromisoformat(last_state["next_review"]) if last_state["next_review"] else None
        card.review_count = last_state["review_count"]
        card.correct_count = last_state["correct_count"]
        
        # 2. Reverter a gamificação
        player = Player.query.first()
        if player:
            # Reverter XP se o cartão era novo
            if was_new:
                print(f"Revertendo 2 XP porque o cartão #{card.id} era novo")
                player.experience = max(0, player.experience - 2)  # 2 XP por cartão novo
                flash_gamification("2 pontos de XP foram revertidos.")
            
            # Reverter pontos de dano se não era novo (cartão de revisão)
            else:
                # Reverter contador de revisões para dano
                revision_count = session.get('session_revision_count', 0)
                if revision_count > 0:
                    session['session_revision_count'] = revision_count - 1
                    print(f"Revertendo 1 ponto de dano. Novo total: {session['session_revision_count']}")
                    flash_gamification("1 ponto de dano foi revertido.")
        
        # Decrementar o contador de cartões revisados
        session["current_index"] = max(session.get("current_index", 1) - 1, 0)
        session["cards_reviewed"] = max(session.get("cards_reviewed", 1) - 1, 0)
        
        # Salvar alterações
        db.session.commit()
        
        flash("Cartão anterior restaurado.", "info")
    else:
        flash("Nenhuma ação para desfazer.", "warning")
    
    return redirect(url_for("study_session"))

@cards_bp.route('/end_session')
def end_session():
    # Salvar o tempo de estudo nas estatísticas do dia
    if 'study_time_total' in session and session['study_time_total'] > 0:
        today = datetime.now(timezone.utc).date()
        today_stats = DailyStats.query.filter_by(date=today).first()
        if not today_stats:
            today_stats = DailyStats(date=today, cards_studied=0, correct_count=0, new_cards=0, revision_cards=0)
            db.session.add(today_stats)
        
        # Verificar se a coluna existe
        if not hasattr(today_stats, 'study_time'):
            try:
                db.session.execute(text('ALTER TABLE daily_stats ADD COLUMN study_time INTEGER DEFAULT 0'))
                db.session.commit()
            except:
                db.session.rollback()
        
        # Adicionar o tempo estudado às estatísticas diárias
        try:
            current_time = getattr(today_stats, 'study_time', 0) or 0
            study_time_to_add = session.get('study_time_total', 0)
            today_stats.study_time = current_time + study_time_to_add
            db.session.commit()
            print(f"Sessão encerrada: {study_time_to_add}s adicionados, total: {today_stats.study_time}s")
        except Exception as e:
            print(f"Erro ao salvar tempo na finalização da sessão: {e}")
            db.session.rollback()
    
    # Verificar se é uma sessão de estudo personalizado
    is_custom_study = session.get('custom_study', False)
    review_history = session.get('review_history', [])
    
    # Limpar a sessão
    session.pop('session_cards', None)
    session.pop('current_index', None)
    session.pop('cards_reviewed', None)
    session.pop('study_time_total', None)
    session.pop('custom_study', None)
    
    # Se for estudo personalizado, redirecionar para a página de resultados
    if is_custom_study and review_history:
        # Manter o histórico de revisão temporariamente para passar para a página de resultados
        session.pop('review_history', None)
        return redirect(url_for('cards.custom_study_results', history=json.dumps(review_history)))
    
    # Caso contrário, limpar tudo e voltar para o lobby
    flash("Sessão de estudo encerrada.", "success")
    return redirect(url_for('cards.study_lobby'))

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
    
    # Se um deck_id foi fornecido, filtre os cartões por esse deck
    elif deck_id:
        deck = Deck.query.get(deck_id)
        if deck:
            cards = get_cards_recursive(deck)
    
    # Se nenhum dos filtros acima foi aplicado, não carregue nenhum cartão
    
    diff_expl = {
        1: "Muito fácil", 2: "Muito fácil",
        3: "Fácil", 4: "Fácil",
        5: "Médio", 6: "Médio",
        7: "Difícil", 8: "Difícil",
        9: "Muito difícil", 10: "Muito difícil"
    }
    
    return render_template('panel.html', cards=cards, query=query, diff_expl=diff_expl,
                          decks=Deck.query.all(), deck_id=deck_id, all_tags=all_tags, 
                          selected_tag_ids=tag_ids)



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
    # Passar show_all=True para o template saber que estamos mostrando todos os cartões
    return render_template('panel.html', cards=cards, query="", diff_expl=diff_expl, 
                           decks=decks, all_tags=all_tags, show_all=True)

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
    diff_expl = {
        1: "Muito fácil", 2: "Muito fácil",
        3: "Fácil", 4: "Fácil",
        5: "Médio", 6: "Médio",
        7: "Difícil", 8: "Difícil",
        9: "Muito difícil", 10: "Muito difícil"
    }
    if card.review_count > 0:
        accuracy = (card.correct_count / card.review_count * 100)
        details_info = {
            'review_count': card.review_count,
            'interval': format_interval(card.interval),
            'accuracy': f"{accuracy:.1f}%"
        }
    else:
        details_info = {
            'review_count': 0,
            'interval': format_interval(card.interval),
            'accuracy': "N/A"
        }
    return render_template('card_detail.html', card=card, details=details_info, diff_expl=diff_expl)

@cards_bp.route('/card/<int:card_id>/edit', methods=['GET', 'POST'])
def edit_card(card_id):
    card = Card.query.get_or_404(card_id)
    if request.method == 'POST':
        new_front = request.form.get('front', '')
        new_back = request.form.get('back', '')
        card.front = new_front
        card.back = new_back
        db.session.commit()
        flash("Cartão atualizado com sucesso!", "success")
        return redirect(url_for('cards.card_detail', card_id=card_id))
    return render_template('edit_card.html', card=card)

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
    # Lista os decks de nível superior (você pode ajustar para mostrar todos, se desejar)
    decks = Deck.query.filter(Deck.parent_id == None).all()
    return render_template('decks.html', decks=decks)

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


@cards_bp.route('/select_deck')
def select_deck():
    decks = Deck.query.all()
    return render_template('select_deck.html', decks=decks)

@cards_bp.route('/start_deck_session/<int:deck_id>')
def start_deck_session(deck_id):
    deck = Deck.query.get(deck_id)
    if deck:
        # Coleta recursivamente todos os cartões do deck e de seus sub-decks,
        # filtrando apenas os cartões novos e não suspensos
        cards = [card for card in get_cards_recursive(deck) if card.review_count == 0 and not card.suspended]
    else:
        cards = []
    # Limita a sessão para os primeiros 50 cartões, se houver muitos
    if cards:
        cards = cards[:50]
    if not cards:
        flash("Nenhum cartão novo disponível para esse baralho.", "warning")
        return redirect(url_for('cards.study_lobby'))
    session.permanent = True
    session['session_cards'] = [c.id for c in cards]
    session['current_index'] = 0
    session['cards_reviewed'] = 0
    session['review_history'] = []
    session['active_deck'] = deck_id
    return redirect(url_for('cards.study_session'))


@cards_bp.route('/start_deck_session_revisions/<int:deck_id>')
def start_deck_session_revisions(deck_id):
    now = datetime.now(timezone.utc)
    deck = Deck.query.get(deck_id)
    if deck:
        # Seleciona apenas os cartões de revisão que estejam prontos (next_review <= agora) e não suspensos
        cards = [card for card in get_cards_recursive(deck) if card.review_count > 0 and card.next_review <= now and not card.suspended]
    else:
        cards = []
    if not cards:
        flash("Nenhum cartão de revisão disponível para esse baralho.", "warning")
        return redirect(url_for('cards.study_lobby'))
    session.permanent = True
    session['session_cards'] = [c.id for c in cards]
    session['current_index'] = 0
    session['cards_reviewed'] = 0
    session['review_history'] = []
    session['active_deck'] = deck_id
    return redirect(url_for('cards.study_session'))

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
    
    for card_id in selected_cards:
        card = Card.query.get(card_id)
        if card:
            # Exemplo de reset: zerar o número de revisões, definir o intervalo inicial e resetar a dificuldade
            card.review_count = 0
            card.interval = 1.0
            card.difficulty = 3  # ou outro valor padrão
            # Atualiza a próxima revisão para o instante atual
            card.next_review = datetime.now(timezone.utc)
            # Também reativa o cartão se estiver suspenso
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

    # Período fixo para 2025
    start_date = datetime(2025, 1, 1).date()
    end_date = datetime(2025, 12, 31).date()

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
    ax.set_title("Estudo diário em 2025", fontsize=12)

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
        
        # Filtrar por baralhos, se especificados
        if deck_ids:
            deck_ids = [int(d_id) for d_id in deck_ids if d_id.isdigit()]
            if deck_ids:
                deck_condition = False
                for deck_id in deck_ids:
                    deck = Deck.query.get(deck_id)
                    if deck:
                        # Obter todos os cartões deste deck e seus subdecks
                        deck_cards = get_cards_recursive(deck)
                        deck_card_ids = [c.id for c in deck_cards]
                        deck_condition = or_(deck_condition, Card.id.in_(deck_card_ids))
                if deck_condition:
                    query = query.filter(deck_condition)
        
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
            "front": card.front,
            "back": card.back,
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