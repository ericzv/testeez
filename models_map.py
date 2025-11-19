"""
Modelos de dados para o sistema de mapa procedural.
Separado do models.py principal para manter organização.
"""

from database import db
from datetime import datetime
import json


class ProceduralMap(db.Model):
    """Representa um mapa completo de uma fase/ato"""
    __tablename__ = 'procedural_map'

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    act_number = db.Column(db.Integer, default=1)  # Fase 1, 2, 3
    seed = db.Column(db.String(50))  # Para reproduzir mapas
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)
    boss_defeated = db.Column(db.Boolean, default=False)

    # Relacionamentos
    nodes = db.relationship('MapNode', backref='map', lazy='dynamic', cascade='all, delete-orphan')
    player = db.relationship('Player', backref='procedural_maps')

    def __repr__(self):
        return f'<ProceduralMap id={self.id} act={self.act_number} player={self.player_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'act_number': self.act_number,
            'seed': self.seed,
            'is_completed': self.is_completed,
            'boss_defeated': self.boss_defeated
        }


class MapNode(db.Model):
    """Um ponto/nó no mapa procedural"""
    __tablename__ = 'map_node'

    id = db.Column(db.Integer, primary_key=True)
    map_id = db.Column(db.Integer, db.ForeignKey('procedural_map.id'), nullable=False)

    # Posição na grade (7 colunas x 16 níveis)
    x = db.Column(db.Integer, nullable=False)  # Coluna (0-6)
    y = db.Column(db.Integer, nullable=False)  # Nível/Andar (0-15, 15=boss)

    # Tipo do nó
    node_type = db.Column(db.String(20), nullable=False)
    # 'battle', 'elite', 'shop', 'event', 'rest', 'boss'

    # Estado do nó
    is_visited = db.Column(db.Boolean, default=False)
    is_available = db.Column(db.Boolean, default=False)
    is_current = db.Column(db.Boolean, default=False)
    is_completed = db.Column(db.Boolean, default=False)

    # Conexões (JSON: lista de coordenadas [(x,y), ...])
    connections_up = db.Column(db.Text, default='[]')  # Nós conectados acima
    connections_down = db.Column(db.Text, default='[]')  # Nós conectados abaixo

    # Dados específicos para batalhas
    enemy_id = db.Column(db.Integer, nullable=True)  # ID do GenericEnemy ou LastBoss
    boss_id = db.Column(db.Integer, nullable=True)   # Para Desafiante Infernal (sub-boss)
    difficulty_modifier = db.Column(db.Float, default=1.0)

    # Dados específicos para eventos (CRÍTICO: persistir evento associado ao nó)
    event_id = db.Column(db.String(100), nullable=True)  # ID do evento atribuído a este nó

    # Metadados
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    visited_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<MapNode id={self.id} ({self.x},{self.y}) type={self.node_type}>'

    def get_connections_up(self):
        """Retorna lista de coordenadas dos nós acima"""
        return json.loads(self.connections_up or '[]')

    def set_connections_up(self, connections):
        """Define conexões acima"""
        self.connections_up = json.dumps(connections)

    def get_connections_down(self):
        """Retorna lista de coordenadas dos nós abaixo"""
        return json.loads(self.connections_down or '[]')

    def set_connections_down(self, connections):
        """Define conexões abaixo"""
        self.connections_down = json.dumps(connections)

    def to_dict(self):
        return {
            'id': self.id,
            'map_id': self.map_id,
            'x': self.x,
            'y': self.y,
            'node_type': self.node_type,
            'is_visited': self.is_visited,
            'is_available': self.is_available,
            'is_current': self.is_current,
            'is_completed': self.is_completed,
            'connections_up': self.get_connections_up(),
            'connections_down': self.get_connections_down(),
            'enemy_id': self.enemy_id,
            'boss_id': self.boss_id,
            'difficulty_modifier': self.difficulty_modifier,
            'event_id': self.event_id
        }


class PlayerMapProgress(db.Model):
    """Progresso do jogador no sistema de mapas"""
    __tablename__ = 'player_map_progress'

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False, unique=True)

    # Mapa atual
    current_map_id = db.Column(db.Integer, db.ForeignKey('procedural_map.id'), nullable=True)
    current_node_id = db.Column(db.Integer, db.ForeignKey('map_node.id'), nullable=True)

    # Progresso
    nodes_visited = db.Column(db.Text, default='[]')  # JSON array de node_ids
    events_seen = db.Column(db.Text, default='[]')  # JSON array de event_ids vistos (para eventos únicos)
    current_act = db.Column(db.Integer, default=1)  # Ato atual (1, 2, 3)
    total_acts_completed = db.Column(db.Integer, default=0)

    # Estatísticas da run no mapa
    battles_won = db.Column(db.Integer, default=0)
    elites_defeated = db.Column(db.Integer, default=0)
    shops_visited = db.Column(db.Integer, default=0)
    events_completed = db.Column(db.Integer, default=0)

    # Relacionamentos
    player = db.relationship('Player', backref='map_progress', uselist=False)
    current_map = db.relationship('ProceduralMap', foreign_keys=[current_map_id])
    current_node = db.relationship('MapNode', foreign_keys=[current_node_id])

    def __repr__(self):
        return f'<PlayerMapProgress player={self.player_id} act={self.current_act}>'

    def get_nodes_visited(self):
        """Retorna lista de IDs dos nós visitados"""
        return json.loads(self.nodes_visited or '[]')

    def add_visited_node(self, node_id):
        """Adiciona nó à lista de visitados"""
        visited = self.get_nodes_visited()
        if node_id not in visited:
            visited.append(node_id)
            self.nodes_visited = json.dumps(visited)

    def get_events_seen(self):
        """Retorna lista de IDs dos eventos já vistos nesta run"""
        return json.loads(self.events_seen or '[]')

    def add_event_seen(self, event_id):
        """Adiciona evento à lista de eventos vistos (mais recente primeiro)"""
        seen = self.get_events_seen()

        # Se evento já está na lista, remove para reposicionar
        if event_id in seen:
            seen.remove(event_id)

        # Adiciona no INÍCIO da lista (mais recente)
        seen.insert(0, event_id)

        # Limita lista a 10 eventos mais recentes (evita crescimento infinito)
        if len(seen) > 10:
            seen = seen[:10]

        self.events_seen = json.dumps(seen)

    def reset_for_new_map(self):
        """Reseta progresso para novo mapa"""
        self.current_node_id = None
        self.nodes_visited = '[]'
        self.events_seen = '[]'  # Reset eventos vistos ao trocar de mapa
        self.battles_won = 0
        self.elites_defeated = 0
        self.shops_visited = 0
        self.events_completed = 0

    def to_dict(self):
        return {
            'player_id': self.player_id,
            'current_map_id': self.current_map_id,
            'current_node_id': self.current_node_id,
            'nodes_visited': self.get_nodes_visited(),
            'current_act': self.current_act,
            'total_acts_completed': self.total_acts_completed,
            'battles_won': self.battles_won,
            'elites_defeated': self.elites_defeated,
            'shops_visited': self.shops_visited,
            'events_completed': self.events_completed
        }
