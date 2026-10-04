"""
GameDriver: joga o jogo pelo test client, chamando as rotas na mesma ordem
que o frontend (SPA + popup do mapa + sistema de turnos).

Serve tanto para os testes automáticos quanto para depurar à mão:

    from tests.helpers import GameDriver
    g = GameDriver(app); g.new_run(); g.play_run(god_mode=True)
"""
import json

from database import db
from models import Player
from models_map import MapNode
from routes.map_modules.events import get_event_by_id
from routes.map_modules.event_effects import check_choice_requirements

# Ordem de preferência ao escolher o próximo nó do mapa
NODE_PREFERENCE = {'battle': 0, 'event': 1, 'rest': 2, 'shop': 3, 'elite': 4, 'boss': 5}


class GameDriver:
    def __init__(self, app):
        self.app = app
        self.client = app.test_client()
        self.server_errors = []   # respostas 5xx
        self.log = []             # resumo legível do que aconteceu

    # ------------------------------------------------------------------ HTTP
    def get(self, url):
        return self._call('get', url)

    def post(self, url, **kwargs):
        return self._call('post', url, **kwargs)

    def _call(self, method, url, **kwargs):
        response = getattr(self.client, method)(url, **kwargs)
        if response.status_code >= 500:
            self.server_errors.append((method.upper(), url, response.status_code, response.data[:300]))
        try:
            return response.get_json(silent=True)
        except Exception:
            return None

    # ------------------------------------------------------------- Estado
    def player_snapshot(self):
        with self.app.app_context():
            p = Player.query.first()
            return {'hp': p.hp, 'max_hp': p.max_hp, 'energy': p.energy,
                    'gold': p.run_gold, 'crystals': p.crystals}

    def set_player(self, **fields):
        with self.app.app_context():
            p = Player.query.first()
            for key, value in fields.items():
                setattr(p, key, value)
            db.session.commit()

    def set_current_enemy_hp(self, hp):
        """Ajusta o HP do inimigo genérico em combate (útil para forçar vitória/derrota)."""
        from models import GenericEnemy, PlayerProgress
        with self.app.app_context():
            progress = PlayerProgress.query.first()
            enemy = db.session.get(GenericEnemy, progress.selected_enemy_id)
            enemy.hp = hp
            enemy.max_hp = max(enemy.max_hp, hp)
            db.session.commit()

    def remove_relics(self):
        from models import PlayerRelic
        with self.app.app_context():
            PlayerRelic.query.delete()
            db.session.commit()

    # --------------------------------------------------------------- Run
    def new_run(self, character_id='vlad', pick_first_relic=True):
        """Escolhe o personagem. Se já existe jogador, reseta a run (igual vir da tela de morte)."""
        with self.app.app_context():
            has_player = Player.query.first() is not None
        data = {'character_id': character_id}
        if has_player:
            data['from_death'] = 'true'
        response = self.client.post('/choose-character', data=data)
        assert response.status_code == 302, response.status_code
        if pick_first_relic:
            self.pick_relics()

    def pick_relics(self):
        """Resolve qualquer escolha de relíquia pendente pegando sempre a primeira opção."""
        for _ in range(5):
            options = self.get('/gamification/get_relic_options')
            if not options or not options.get('options'):
                return
            chosen = self.post('/gamification/select_relic', json={'relic_id': options['options'][0]['id']})
            if not chosen or not chosen.get('has_more_relics'):
                return

    def current_map(self):
        data = self.get('/map/api/current')
        if not data or not data.get('map_data'):
            # Depois do boss o mapa é apagado; o frontend gera o próximo
            self.post('/map/api/generate')
            data = self.get('/map/api/current')
        return data['map_data']

    def available_nodes(self):
        return [n for n in self.current_map()['nodes'] if n['is_available']]

    def select_node(self, node):
        """Mesma sequência do popup do mapa (hub-map-popup.html: handleMapNodeClick)."""
        map_data = self.current_map()
        current = next((n for n in map_data['nodes'] if n['id'] == map_data.get('current_node_id')), None)
        if current and current['node_type'] in ('shop', 'event', 'rest'):
            self.post('/map/api/complete-node')
        return self.post(f"/map/api/select-node/{node['id']}")

    def prepare_battle(self, node):
        url = {
            'battle': '/map/battle/api/prepare',
            'elite': f"/map/battle/api/prepare-elite/{node.get('boss_id') or 2}",
            'boss': f"/map/battle/api/prepare-boss/{node.get('boss_id') or 1}",
        }[node['node_type']]
        return self.post(url)

    # ------------------------------------------------------------ Batalha
    def attack_skills(self):
        data = self.get('/gamification/player/attacks')
        skills = data.get('attacks') if isinstance(data, dict) else data
        skills = [s for s in (skills or []) if s.get('skill_type') != 'ultimate']
        # Mais caro primeiro (mais dano por turno)
        return sorted(skills, key=lambda s: -(s.get('energy_cost') or 1))

    def attack(self, skill_id):
        return self.post('/gamification/damage_boss', json={'skill_id': skill_id})

    def enemy_turn(self):
        """Mesma sequência do battle-turns.js."""
        self.post('/gamification/end_player_turn')
        self.post('/gamification/execute_buff_debuff_skills')
        for _ in range(10):
            status = self.get('/gamification/enemy_attack_status')
            if not status or not status.get('success') or not status['status'].get('has_charges'):
                break
            result = self.post('/gamification/execute_enemy_attack')
            if not result or not result.get('success'):
                break
        if self.player_snapshot()['hp'] > 0:
            self.post('/gamification/restore_energy')

    def fight(self, god_mode=False, max_turns=60):
        """Luta até vencer ou morrer. Retorna 'victory', 'defeat' ou 'timeout'."""
        if god_mode:
            self.set_player(max_hp=5000, hp=5000)
        battle = self.get('/gamification/get_battle_data')
        assert battle and battle.get('success'), battle
        skills = self.attack_skills()
        for _ in range(max_turns):
            for _ in range(10):
                energy = self.player_snapshot()['energy']
                usable = [s for s in skills if (s.get('energy_cost') or 1) <= energy]
                if not usable:
                    break
                result = self.attack(usable[0]['id'])
                if not result or not result.get('success'):
                    break
                if result.get('boss_defeated'):
                    return 'victory'
            self.enemy_turn()
            if self.player_snapshot()['hp'] <= 0:
                return 'defeat'
        return 'timeout'

    def collect_rewards(self):
        """Popup de vitória -> lembrança -> relíquias. Retorna True se havia recompensa."""
        pending = self.get('/gamification/check_pending_rewards')
        had_reward = bool(pending and pending.get('has_pending_rewards'))
        if had_reward:
            self.post('/gamification/apply_victory_rewards')
        memory = self.get('/gamification/check_memory_reward')
        if memory and memory.get('has_memory_reward'):
            options = self.get('/gamification/get_memory_options')
            if options and options.get('options'):
                self.post('/gamification/select_memory', json={
                    'memory_type': options['options'][0]['type'],
                    'enemy_group': memory.get('enemy_group', 1),
                })
        self.pick_relics()
        return had_reward

    # --------------------------------------------------- Nós não-combate
    def visit_event(self, node):
        self.client.get('/map/event')
        with self.app.app_context():
            event = get_event_by_id(db.session.get(MapNode, node['id']).event_id)
            player = Player.query.first()
            choices = [c for c in event['choices'] if check_choice_requirements(c, player)]
        if not choices:
            self.post('/map/api/event/skip')
            return f"{event['id']} (pulado)"
        result = self.post('/map/api/event/choose', json={'event_id': event['id'], 'choice_id': choices[0]['id']})
        summary = f"{event['id']}/{choices[0]['id']}"
        if result and result.get('requires_combat'):
            outcome = self.fight(god_mode=self._god_mode)
            summary += f" combate={outcome}"
            if outcome == 'victory':
                self.collect_rewards()
        return summary

    def go_to_next_battle(self, max_steps=10):
        """Passa por nós sem combate (descanso/loja/evento) até entrar numa batalha comum ou elite."""
        self._god_mode = True
        for _ in range(max_steps):
            nodes = self.available_nodes()
            combat = [n for n in nodes if n['node_type'] in ('battle', 'elite')]
            if combat:
                node = sorted(combat, key=lambda n: NODE_PREFERENCE[n['node_type']])[0]
                self.select_node(node)
                self.prepare_battle(node)
                return node
            node = sorted(nodes, key=lambda n: NODE_PREFERENCE.get(n['node_type'], 9))[0]
            self.select_node(node)
            if node['node_type'] == 'event':
                self.visit_event(node)
            elif node['node_type'] == 'rest':
                self.post('/map/api/rest/heal')
        raise AssertionError('nenhuma batalha alcançável: ' + str([n['node_type'] for n in nodes]))

    # ------------------------------------------------------ Run completa
    def play_run(self, god_mode=False, max_steps=80, simulate_frontend_complete=True):
        """
        Joga até o fim (vitória final), morte ou travamento.
        Retorna 'game_completed', 'defeat', 'stuck' ou 'max_steps'.

        simulate_frontend_complete=False NÃO chama /map/api/complete-node depois
        das vitórias (simula o navegador falhando na animação de morte).
        """
        self._god_mode = god_mode
        for _ in range(max_steps):
            map_data = self.current_map()
            nodes = [n for n in map_data['nodes'] if n['is_available']]
            if not nodes:
                self.log.append(f"TRAVADO no ato {map_data['act_number']}")
                return 'stuck'
            node = sorted(nodes, key=lambda n: (NODE_PREFERENCE.get(n['node_type'], 9), n['x']))[0]
            self.select_node(node)
            kind = node['node_type']
            entry = f"ato {map_data['act_number']} y{node['y']} {kind}"

            if kind in ('battle', 'elite', 'boss'):
                self.prepare_battle(node)
                outcome = self.fight(god_mode=god_mode)
                entry += f" -> {outcome}"
                if outcome != 'victory':
                    self.log.append(entry)
                    return 'defeat' if outcome == 'defeat' else 'stuck'
                completed = None
                if simulate_frontend_complete or kind == 'boss':
                    completed = self.post('/map/api/complete-node')
                had_reward = self.collect_rewards()
                entry += ' recompensa=ok' if had_reward else ' recompensa=FALTANDO'
                if completed and completed.get('game_completed'):
                    self.log.append(entry)
                    return 'game_completed'
            elif kind == 'rest':
                self.post('/map/api/rest/heal')
            elif kind == 'shop':
                self.post('/map/api/shop/generate')
                inventory = self.get('/map/api/shop/get-inventory') or {}
                entry += f" itens={len(inventory.get('items') or [])}"
                self.post('/map/api/shop/close')
            elif kind == 'event':
                entry += ' ' + self.visit_event(node)
            self.log.append(entry)
        return 'max_steps'

    def summary(self):
        return '\n'.join(self.log) + ('\nERROS 5xx:\n' + json.dumps(self.server_errors, default=str)[:2000]
                                     if self.server_errors else '')
