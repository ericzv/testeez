"""Testes que travam bugs já corrigidos para não voltarem."""
from database import db
from models import BattleLog, PendingReward, Player, PlayerAttackCache, PlayerRelic, PlayerRunBuff


def _start_first_battle(game):
    node = next(n for n in game.available_nodes() if n['node_type'] == 'battle')
    game.select_node(node)
    game.prepare_battle(node)
    return node


def test_attack_cache_survives_crit_bonuses(game, flask_app):
    """Relíquia 'Coleção de Espinhos' e lembrança 'Fervor' quebravam o cálculo do cache de ataque
    (UnboundLocalError), e o jogo seguia usando valores antigos pelo resto da run."""
    from routes.battle_cache import calculate_attack_cache
    with flask_app.app_context():
        player = Player.query.first()
        db.session.add(PlayerRelic(player_id=player.id, relic_id='13', is_active=True))
        db.session.add(PlayerRunBuff(player_id=player.id, buff_type='crit_chance', total_value=6, count=1))
        db.session.commit()
        assert calculate_attack_cache(player.id) is True
        caches = PlayerAttackCache.query.filter_by(player_id=player.id).all()
        assert caches
        # 2 relíquias (a inicial + a 13) x 3% + 6% do Fervor
        for cache in caches:
            assert cache.base_crit_chance >= 0.06 + 0.06 - 1e-9, (cache.skill_name, cache.base_crit_chance)


def test_victory_completes_node_without_frontend(game):
    """Se o navegador não chamar /map/api/complete-node (erro de JS, aba fechada...),
    o jogador não pode ficar preso no nó: o servidor conclui o nó na vitória."""
    result = game.play_run(god_mode=True, simulate_frontend_complete=False)
    assert result == 'game_completed', game.summary()
    assert 'recompensa=FALTANDO' not in game.summary(), game.summary()


def test_complete_node_is_idempotent(game, flask_app):
    from models_map import PlayerMapProgress
    _start_first_battle(game)
    assert game.fight(god_mode=True) == 'victory'
    game.post('/map/api/complete-node')
    game.post('/map/api/complete-node')
    with flask_app.app_context():
        assert PlayerMapProgress.query.first().battles_won == 1


def test_uncollected_reward_is_not_lost_nor_stuck(game, flask_app):
    """Recompensa não coletada (popup não apareceu) não pode ficar presa reaparecendo
    nas batalhas seguintes: ela é creditada quando a próxima vitória acontece."""
    _start_first_battle(game)
    assert game.fight(god_mode=True) == 'victory'
    first = game.get('/gamification/check_pending_rewards')['reward_data']
    crystals_before = game.player_snapshot()['crystals']

    # Não coleta; vai para a próxima batalha
    game.go_to_next_battle()
    assert game.fight(god_mode=True) == 'victory'

    pending = game.get('/gamification/check_pending_rewards')
    second = pending['reward_data']
    assert second['enemyName'] != first['enemyName']
    game.post('/gamification/apply_victory_rewards')
    assert game.get('/gamification/check_pending_rewards')['has_pending_rewards'] is False
    gained = game.player_snapshot()['crystals'] - crystals_before
    assert gained >= first['crystalsGained'] + second['crystalsGained']


def test_new_run_clears_pending_rewards(game, flask_app):
    _start_first_battle(game)
    assert game.fight(god_mode=True) == 'victory'
    assert game.get('/gamification/check_pending_rewards')['has_pending_rewards'] is True
    game.new_run()
    assert game.get('/gamification/check_pending_rewards')['has_pending_rewards'] is False
    with flask_app.app_context():
        assert PendingReward.query.count() == 0


def test_enemy_turn_is_logged(game, flask_app):
    """log_turn passava 'mp_consumed' (campo removido) e o log de batalha nunca era salvo."""
    _start_first_battle(game)
    game.set_player(max_hp=5000, hp=5000)
    with flask_app.app_context():
        before = BattleLog.query.count()
    game.enemy_turn()
    with flask_app.app_context():
        assert BattleLog.query.count() > before


def test_enemy_potion_drop_goes_to_inventory(game, flask_app):
    """Poções derrubadas por inimigos só apareciam no popup antigo e nunca iam para o inventário."""
    from models import PlayerPotionSlot
    _start_first_battle(game)
    assert game.fight(god_mode=True) == 'victory'
    with flask_app.app_context():
        pending = PendingReward.query.first()
        pending.potion_drop = 'health_potion'
        db.session.commit()

    popup = game.get('/gamification/check_pending_rewards')['reward_data']
    assert popup['potion']['type'] == 'vital'
    result = game.post('/gamification/apply_victory_rewards')
    assert result['potions_added'] == ['Poção Vital']
    with flask_app.app_context():
        slot = PlayerPotionSlot.query.filter_by(potion_type='vital').first()
        assert slot is not None and slot.quantity >= 1


def test_common_enemy_does_not_count_as_boss(game, flask_app):
    """O talento 'Caçador de Bosses' (+2 dano por boss) contava todo inimigo comum como boss."""
    _start_first_battle(game)
    assert game.fight(god_mode=True) == 'victory'
    game.collect_rewards()
    with flask_app.app_context():
        assert Player.query.first().run_bosses_defeated == 0


def test_every_relic_can_be_acquired(game, flask_app):
    """A relíquia 27 'comentada' com ''' colava na chave da 28 ('Ritual de Sangue'),
    e escolher a 28 derrubava o servidor ('NoneType' object has no attribute 'get')."""
    from routes.relics.registry import RELIC_DEFINITIONS
    from routes.relics.selection import award_relic_to_player
    for key, definition in RELIC_DEFINITIONS.items():
        assert key == definition['id'], repr(key)[:80]

    with flask_app.app_context():
        player_id = Player.query.first().id
        for relic_id in RELIC_DEFINITIONS:
            PlayerRelic.query.filter_by(player_id=player_id).delete()
            db.session.commit()
            award_relic_to_player(player_id, relic_id)
            assert PlayerRelic.query.filter_by(player_id=player_id, relic_id=relic_id).count() == 1, relic_id


def test_read_only_requests_do_not_rewrite_session(game, flask_app):
    """Com SESSION_REFRESH_EACH_REQUEST=True toda requisição regravava a sessão inteira; com as
    requisições paralelas do jogo, uma leitura lenta apagava o que outra tinha acabado de salvar
    (ex.: a lembrança pendente após a vitória)."""
    import os
    session_dir = flask_app.config['SESSION_FILE_DIR']
    game.get('/gamification/check_relic_reward')  # garante que a sessão existe no disco

    def snapshot():
        return {name: os.path.getmtime(os.path.join(session_dir, name)) for name in os.listdir(session_dir)}

    before = snapshot()
    for url in ('/gamification/check_pending_rewards', '/map/api/current', '/gamification/get_player_currencies'):
        game.get(url)
    assert snapshot() == before
