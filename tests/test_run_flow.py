"""Runs completas do roguelike, jogadas pelas rotas que o frontend usa."""


def test_full_run_until_final_victory(game):
    """Atravessa os 3 atos (modo invencível) até a vitória final, sem erros de servidor."""
    result = game.play_run(god_mode=True)
    assert result == 'game_completed', game.summary()
    assert 'recompensa=FALTANDO' not in game.summary(), game.summary()
    assert not game.server_errors, game.summary()
    for act in (1, 2, 3):
        assert any(line.startswith(f'ato {act} ') and 'boss -> victory' in line for line in game.log), game.summary()


def test_death_resets_run(game):
    """Morrer e começar de novo zera o mapa, HP e ouro da run."""
    map_data = game.current_map()
    node = next(n for n in map_data['nodes'] if n['is_available'] and n['node_type'] == 'battle')
    game.select_node(node)
    game.prepare_battle(node)
    game.remove_relics()  # Espelho de Lázaro / curas poderiam evitar a morte
    game.get('/gamification/get_battle_data')
    game.set_player(hp=1, max_hp=1)
    for _ in range(30):  # só turnos do inimigo, sem barreira, até morrer
        game.set_player(barrier=0)
        game.enemy_turn()
        if game.player_snapshot()['hp'] <= 0:
            break
    assert game.player_snapshot()['hp'] <= 0

    game.new_run(pick_first_relic=False)  # algumas relíquias iniciais dão ouro na hora
    snapshot = game.player_snapshot()
    assert snapshot['hp'] == snapshot['max_hp'] == 80
    assert snapshot['gold'] == 50
    fresh_map = game.current_map()
    assert fresh_map['act_number'] == 1
    assert not any(n['is_visited'] for n in fresh_map['nodes'])
    assert not game.server_errors, game.summary()
