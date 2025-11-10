import re
import html
import unicodedata
from datetime import datetime, timezone

##############################################
#        DEFINIÇÃO DAS FUNÇÕES
##############################################

def process_front(text):
    """
    Processa o texto frontal do cartão, formatando elementos cloze para exibição
    na pergunta (substituindo pelo marcador [...] em negrito e azul escuro).
    """
    # Atualizar caminhos de imagem
    text = update_image_paths(text)
    
    # Processar formato Anki: {{c1::texto}}
    text = re.sub(r"\{\{c1::(.*?)\}\}",
                  r'<span style="font-weight: bold; color: #003366; padding: 2px 4px;">[...]</span>',
                  text)
    
    # Processar formato HTML com data-cloze: <span class="cloze" data-cloze="texto" ...>
    text = re.sub(r'<span class="cloze" data-cloze="(.*?)".*?>.*?</span>',
                  r'<span style="font-weight: bold; color: #003366; padding: 2px 4px;">[...]</span>',
                  text)
    
    # Processar formato HTML simples com class=cloze
    text = re.sub(r'<span class="cloze".*?>.*?</span>',
                  r'<span style="font-weight: bold; color: #003366; padding: 2px 4px;">[...]</span>',
                  text)
    
    # Processar outros formatos de cloze (c2, etc)
    text = re.sub(r"\{\{c2::(.*?)\}\}",
                  r'<span style="font-weight: bold; color: #003366;">\1</span>',
                  text)
    
    text = re.sub(r"\{\{c1::(.*?)\}\}",
              r'<span style="font-weight: bold; color: #003366; padding: 2px 4px;">[...]</span>',
              text)
    text = re.sub(r'<span class="cloze" data-cloze="(.*?)".*?>.*?</span>',
              r'<span style="font-weight: bold; color: #003366; padding: 2px 4px;">[...]</span>',
              text)
    
    return text


def process_answer(text):
    text = update_image_paths(text)
    
    # Processar formato Anki: {{c1::texto}}
    text = re.sub(r"\{\{c1::(.*?)\}\}",
                  r'<span style="font-weight: bold; color: #003366;">\1</span>',
                  text)
    
    # Processar formato HTML com data-cloze
    def replace_cloze_span(match):
        span_content = match.group(2).strip() if match.group(2) and match.group(2).strip() else match.group(1)
        return f'<span style="font-weight: bold; color: #003366;">{span_content}</span>'
    
    text = re.sub(r'<span class="cloze" data-cloze="(.*?)".*?>(.*?)</span>',
                  replace_cloze_span,
                  text)
    
    # Processar outros formatos de cloze, se necessário
    text = re.sub(r'<span class="cloze".*?>(.*?)</span>',
                  r'<span style="font-weight: bold; color: #003366;">\1</span>',
                  text)
    
    # Adicionar 3 quebras de linha antes das informações adicionais
    text = re.sub(r'(<div class="esquema">)', r'<br><br><br>\1', text)
    
    return text

# Outros filtros e funções...



##############################################
#        FUNÇÕES DE PROCESSAMENTO
##############################################

def update_image_paths(text):
    def replacer(match):
        src_value = match.group(1)
        if '/' not in src_value and '://' not in src_value:
            return f'<img src="/static/collection.media/{src_value}"'
        return match.group(0)
    pattern = r'<img\s+[^>]*src="([^"]+)"'
    return re.sub(pattern, replacer, text)


def panel_preview(html_content, max_len=120):
    def img_replacer(match):
        src = match.group(1)
        return f'<img src="{src}" class="thumbnail" />'
    pattern = r'<img\s+[^>]*src="([^"]+)"'
    text_with_thumbs = re.sub(pattern, img_replacer, html_content)
    # Remove as tags HTML e substitui quebras de linha por espaços
    plain_text = re.sub(r'<[^>]+>', '', text_with_thumbs).replace('\n',' ').replace('\r',' ').strip()
    if len(plain_text) > max_len:
        plain_text = plain_text[:max_len] + '...'
    return plain_text

def extract_images(text, max_images=3):
    text = update_image_paths(text)
    pattern = r'<img\s+[^>]*src="([^"]+)"'
    matches = re.findall(pattern, text)
    imgs = matches[:max_images]
    result = ""
    for img in imgs:
        result += f'<a href="{img}" target="_blank"><img src="{img}" class="thumbnail" loading="lazy" /></a> '
    return result

def get_cards_recursive(deck):
    """Retorna uma lista de todos os cartões pertencentes ao deck e a todos os seus sub-decks recursivamente."""
    cards = list(deck.cards)
    for child in deck.children:
        cards.extend(get_cards_recursive(child))
    return cards

import unicodedata

def normalize_text(text):
    # Remove acentuação e converte para minúsculas
    return unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8').lower()

def count_cards_recursive(deck):
    new = 0
    interval = 0
    revision = 0
    # Use timezone.utc para garantir que now é offset-aware
    now = datetime.now(timezone.utc)
    
    for card in deck.cards:
        if card.suspended:
            continue  # ignora cartões suspensos
        
        if card.review_count == 0:
            new += 1
        else:
            # Garantir que next_review seja offset-aware antes da comparação
            card_next_review = card.next_review
            
            # Se next_review não tiver timezone, adicione UTC
            if card_next_review.tzinfo is None:
                card_next_review = card_next_review.replace(tzinfo=timezone.utc)
                
            if card_next_review > now:
                interval += 1
            else:
                revision += 1
    
    for child in deck.children:
        c_new, c_interval, c_revision = count_cards_recursive(child)
        new += c_new
        interval += c_interval
        revision += c_revision
    
    return new, interval, revision

import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def update_card_review(card, response):
    # Salvar se o cartão era novo ANTES de atualizar o review_count
    was_new = (card.review_count == 0)
    
    now = datetime.now(timezone.utc)
    card.review_count += 1
    
    # Normaliza a resposta: remove acentos, converte para minúsculas e substitui espaços por underline
    normalized_response = remove_accents(response.strip().lower()).replace(" ", "_")
    print("DEBUG: normalized_response =", normalized_response)  # Para debug
    
    # Incrementa o contador de acertos se a resposta for considerada correta
    if normalized_response in ['dificil', 'facil', 'muito_facil']:
        card.correct_count += 1

    sequence = [10/1440.0, 1, 3, 7, 21, 45, 90, 180, 360]
    current_step = get_current_step(card.interval)
    if normalized_response == 'errei':
        card.interval = sequence[0]
        card.difficulty = 10
    elif current_step == 0:
        if normalized_response in ['dificil', 'facil']:
            if was_new and normalized_response == 'dificil':
                card.interval = 2
            else:
                card.interval = sequence[1]
            if normalized_response == 'dificil':
                card.difficulty = min(card.difficulty + 0.1, 10)
            else:
                card.difficulty = max(card.difficulty - 0.1, 1)
        elif normalized_response == 'muito_facil':
            card.interval = sequence[2]
            card.difficulty = max(card.difficulty - 0.3, 1)
        else:
            card.interval = sequence[1]
            card.difficulty = min(card.difficulty + 0.1, 10)
    else:
        new_step = min(current_step + 1, len(sequence) - 1)
        if normalized_response == 'dificil':
            card.difficulty = min(card.difficulty + 0.1, 10)
        elif normalized_response == 'facil':
            card.difficulty = max(card.difficulty - 0.1, 1)
        elif normalized_response == 'muito_facil':
            new_step = min(current_step + 2, len(sequence) - 1)
            card.difficulty = max(card.difficulty - 0.3, 1)
        else:
            card.difficulty = min(card.difficulty + 0.1, 10)
        card.interval = sequence[new_step]
    modifier = 2 - ((card.difficulty - 1) * 1.5 / 9)
    card.next_review = now + timedelta(days=card.interval * modifier)
    
    update_daily_stats(response, was_new)
    db.session.commit()
    
    # Retorna was_new para o caller saber se era um cartão novo
    return was_new


# DEPRECATED: Sistema de níveis/XP será removido
def get_exp_for_next_level(current_level):
    """DEPRECATED: Esta função será removida. Sistema de níveis não é mais usado."""
    import warnings
    warnings.warn("get_exp_for_next_level está deprecated e será removido", DeprecationWarning)
    from core.formulas import get_exp_for_next_level as new_func
    return new_func(current_level)


def days_until_review(next_review):
    if not next_review:
        return "N/A"
    now = datetime.now(timezone.utc)
    delta = next_review - now
    days = delta.total_seconds() / 86400
    if days < 0:
        return "Atrasado"
    elif days < 1:
        total_minutes = int(days * 1440)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        return f"{hours}h {minutes}min"
    else:
        return f"{days:.1f} dias"

def format_damage(value):
    return "{:.2f}".format(float(value))

def next_review_status(card):
    now = datetime.now(timezone.utc)
    nr = card.next_review
    if nr and nr.tzinfo is None:
        nr = nr.replace(tzinfo=timezone.utc)
    if card.suspended:
        return "Suspenso"
    if card.interval == 1.0:
        return "Não estudado"
    if nr and nr <= now:
        return nr.strftime('%d/%m/%Y')
    if nr:
        delta = nr - now
        days = delta.total_seconds() / 86400
        if days < 1:
            total_minutes = int(days * 1440)
            return f"{total_minutes//60}h {total_minutes%60}min"
        return f"{days:.1f} dias"
    return "N/A"

def make_aware(dt):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def normalize_str(s):
    return ''.join(
        c for c in unicodedata.normalize('NFD', s or '')
        if unicodedata.category(c) != 'Mn'
    ).lower()


def register_filters(app):
    # filtros de cloze e preview (já existentes)
    app.jinja_env.filters['process_front']     = process_front
    app.jinja_env.filters['process_answer']    = process_answer
    app.jinja_env.filters['panel_preview']     = panel_preview
    app.jinja_env.filters['extract_images']    = extract_images

    # seus novos filtros
    app.jinja_env.filters['days_until_review']   = days_until_review
    app.jinja_env.filters['format_damage']       = format_damage
    app.jinja_env.filters['next_review_status']  = next_review_status
    app.jinja_env.filters['make_aware']          = make_aware
    app.jinja_env.filters['normalize_str']       = normalize_str
    app.jinja_env.globals.update(
        get_cards_recursive=get_cards_recursive,
        count_cards_recursive=count_cards_recursive
    )
