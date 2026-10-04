"""Páginas principais abrem sem erro de servidor."""
import pytest

from database import db
from models import Deck, Note, Card


FLASHCARD_PAGES = ['/decks', '/panel', '/statistics', '/custom_study', '/import']
GAME_PAGES = ['/choose-character', '/gamification/spa', '/gamification/talents',
              '/gamification/profile', '/gamification/bestiary', '/map/']


@pytest.mark.parametrize('url', FLASHCARD_PAGES)
def test_flashcard_pages(flask_app, url):
    response = flask_app.test_client().get(url)
    assert response.status_code == 200, url


@pytest.mark.parametrize('url', GAME_PAGES)
def test_game_pages(game, url):
    response = game.client.get(url)
    assert response.status_code in (200, 302), (url, response.status_code)
    if response.status_code == 302:
        # Nada deveria mandar de volta para a escolha de personagem com uma run ativa
        assert 'choose-character' not in response.headers.get('Location', ''), url


def test_study_session_reviews_card(flask_app):
    """Fluxo de estudo estilo Anki: mostra o cartão, responde, registra a revisão."""
    with flask_app.app_context():
        deck = Deck(name='Deck de teste')
        db.session.add(deck)
        db.session.flush()
        note = Note(note_type='basic', content='Capital da França?', back='Paris', deck_id=deck.id)
        db.session.add(note)
        db.session.flush()
        card = Card(front=note.content, back=note.back, deck_id=deck.id, note_id=note.id, ordinal=1)
        db.session.add(card)
        db.session.commit()
        deck_id, card_id = deck.id, card.id

    client = flask_app.test_client()
    page = client.get(f'/study/{deck_id}')
    assert page.status_code == 200
    assert 'Capital da Fran' in page.get_data(as_text=True)

    response = client.post(f'/study/{deck_id}', data={'card_id': card_id, 'response': 'facil', 'time_spent': '5'})
    assert response.status_code == 302

    with flask_app.app_context():
        reviewed = db.session.get(Card, card_id)
        assert reviewed.review_count == 1
        assert reviewed.next_review is not None
