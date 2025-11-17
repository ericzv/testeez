"""
Gerador procedural de mapas estilo Slay the Spire.
Baseado no algoritmo original do jogo com adaptações.
"""

import random
from typing import List, Dict, Tuple, Optional


class MapGenerator:
    """
    Gera mapas procedurais com caminhos ramificados.

    Estrutura:
    - 7 colunas (largura)
    - 15 níveis + 1 nível de boss (altura)
    - 6 caminhos principais que se entrelaçam
    """

    # Configuração da grade
    WIDTH = 7       # Colunas
    HEIGHT = 15     # Níveis (sem contar o boss)
    NUM_PATHS = 6   # Número de caminhos a gerar

    # Probabilidades de tipos de nó (%)
    # Ajustadas para serem similares ao Slay the Spire
    NODE_PROBABILITIES = {
        'battle': 53,    # Batalha comum
        'elite': 8,      # Desafiante Infernal
        'shop': 5,       # Loja
        'event': 22,     # Evento Aleatório (?)
        'rest': 12       # Descanso/Tesouro
    }

    # Restrições de posicionamento
    ELITE_MIN_FLOOR = 5      # Elite só aparece do andar 6+ (índice 5+)
    REST_MIN_FLOOR = 5       # Rest só aparece do andar 6+
    REST_FORBIDDEN_FLOOR = 14  # Rest não pode no andar 14 (antes do boss)
    TREASURE_FLOOR = 8       # Andar 9 sempre é tesouro/rest

    def __init__(self, seed: Optional[str] = None):
        """
        Inicializa o gerador.

        Args:
            seed: Seed para reproduzir mapas. Se None, gera aleatoriamente.
        """
        self.seed = seed or str(random.randint(10000, 99999))
        self.rng = random.Random(self.seed)
        self.nodes: Dict[Tuple[int, int], Dict] = {}  # (x, y) -> node_data
        self.paths: List[List[Tuple[int, int]]] = []

    def generate_map(self) -> Dict:
        """
        Gera o mapa completo.

        Returns:
            Dict contendo seed, nodes e paths.
        """
        # Limpar estado anterior
        self.nodes = {}
        self.paths = []

        # 1. Gerar os caminhos principais
        self._generate_paths()

        # 2. Atribuir tipos aos nós
        self._assign_node_types()

        # 3. Adicionar o boss no topo
        self._add_boss_node()

        # 4. Marcar nós iniciais como disponíveis
        self._mark_initial_nodes()

        return {
            'seed': self.seed,
            'nodes': self.nodes,
            'paths': self.paths,
            'width': self.WIDTH,
            'height': self.HEIGHT + 1  # +1 para o boss
        }

    def _generate_paths(self):
        """
        Gera 6 caminhos da base ao topo.
        Evita cruzamentos e garante variedade.
        """
        first_nodes = []

        for path_index in range(self.NUM_PATHS):
            path = []

            # Escolher nó inicial
            if path_index < 2:
                # Primeiros 2 caminhos devem começar em colunas diferentes
                while True:
                    x = self.rng.randint(0, self.WIDTH - 1)
                    if x not in first_nodes:
                        first_nodes.append(x)
                        break
            else:
                x = self.rng.randint(0, self.WIDTH - 1)

            # Adicionar nó inicial (nível 0)
            path.append((x, 0))
            self._ensure_node_exists(x, 0)

            # Construir caminho subindo nível por nível
            for y in range(1, self.HEIGHT):
                # Determinar próximas posições possíveis
                possible_next = self._get_possible_next_positions(x, y)

                if not possible_next:
                    # Fallback: ir direto para cima
                    possible_next = [x] if 0 <= x < self.WIDTH else [self.WIDTH // 2]

                # Escolher próxima posição
                next_x = self.rng.choice(possible_next)
                path.append((next_x, y))

                # Criar nó e conexão
                self._ensure_node_exists(next_x, y)
                self._connect_nodes(x, y - 1, next_x, y)

                x = next_x

            self.paths.append(path)

    def _get_possible_next_positions(self, current_x: int, next_y: int) -> List[int]:
        """
        Retorna posições X válidas para o próximo nível.

        Args:
            current_x: Posição X atual
            next_y: Próximo nível Y

        Returns:
            Lista de posições X válidas
        """
        possible = []

        # Tentar esquerda-cima, cima, direita-cima
        for dx in [-1, 0, 1]:
            next_x = current_x + dx

            # Verificar limites
            if not (0 <= next_x < self.WIDTH):
                continue

            # Verificar se não cruza caminhos existentes
            if not self._would_cross_path(current_x, next_y - 1, next_x, next_y):
                possible.append(next_x)

        return possible

    def _would_cross_path(self, x1: int, y1: int, x2: int, y2: int) -> bool:
        """
        Verifica se uma conexão cruzaria um caminho existente.

        Cruzamento ocorre quando duas linhas diagonais se interceptam no mesmo espaço.

        Args:
            x1, y1: Posição de origem
            x2, y2: Posição de destino

        Returns:
            True se cruzaria, False caso contrário
        """
        # Verificar cada caminho existente
        for existing_path in self.paths:
            for i in range(len(existing_path) - 1):
                ex1, ey1 = existing_path[i]
                ex2, ey2 = existing_path[i + 1]

                # Verificar se estão no mesmo intervalo de níveis
                if ey1 == y1 and ey2 == y2:
                    # Verificar cruzamento de diagonais
                    # Cruza se um vai da esquerda pra direita e outro da direita pra esquerda
                    if (x1 < ex1 and x2 > ex2) or (x1 > ex1 and x2 < ex2):
                        return True

        return False

    def _ensure_node_exists(self, x: int, y: int):
        """
        Garante que um nó existe na posição especificada.

        Args:
            x: Coluna
            y: Nível
        """
        if (x, y) not in self.nodes:
            self.nodes[(x, y)] = {
                'x': x,
                'y': y,
                'type': None,
                'connections_up': [],
                'connections_down': [],
                'is_available': False,
                'is_visited': False
            }

    def _connect_nodes(self, x1: int, y1: int, x2: int, y2: int):
        """
        Conecta dois nós adjacentes (bidirecional).

        Args:
            x1, y1: Nó inferior
            x2, y2: Nó superior
        """
        # Adicionar conexão para cima (se não existir)
        if (x2, y2) not in self.nodes[(x1, y1)]['connections_up']:
            self.nodes[(x1, y1)]['connections_up'].append((x2, y2))

        # Adicionar conexão para baixo (se não existir)
        if (x1, y1) not in self.nodes[(x2, y2)]['connections_down']:
            self.nodes[(x2, y2)]['connections_down'].append((x1, y1))

    def _assign_node_types(self):
        """
        Atribui tipos aos nós baseado nas regras e probabilidades.
        """
        # Ordenar nós por nível (de baixo para cima)
        sorted_coords = sorted(self.nodes.keys(), key=lambda c: (c[1], c[0]))

        for (x, y) in sorted_coords:
            node = self.nodes[(x, y)]
            node['type'] = self._determine_node_type(x, y, node)

    def _determine_node_type(self, x: int, y: int, node: Dict) -> str:
        """
        Determina o tipo de um nó específico.

        Args:
            x: Coluna
            y: Nível
            node: Dados do nó

        Returns:
            String com o tipo do nó
        """
        # === REGRAS FIXAS ===

        # 1. Primeiro andar sempre é batalha
        if y == 0:
            return 'battle'

        # 2. Último andar (14) sempre é descanso (antes do boss)
        if y == self.HEIGHT - 1:
            return 'rest'

        # 3. Andar 9 (índice 8) sempre é tesouro/descanso
        if y == self.TREASURE_FLOOR:
            return 'rest'

        # === REGRAS PROBABILÍSTICAS COM RESTRIÇÕES ===

        # Construir lista ponderada de tipos válidos
        valid_types = []

        for node_type, weight in self.NODE_PROBABILITIES.items():
            if self._can_place_type(x, y, node, node_type):
                valid_types.extend([node_type] * weight)

        # Se nenhum tipo válido, usar batalha como fallback
        if not valid_types:
            return 'battle'

        return self.rng.choice(valid_types)

    def _can_place_type(self, x: int, y: int, node: Dict, node_type: str) -> bool:
        """
        Verifica se um tipo de nó pode ser colocado nesta posição.

        Args:
            x: Coluna
            y: Nível
            node: Dados do nó
            node_type: Tipo a verificar

        Returns:
            True se pode colocar, False caso contrário
        """
        # === RESTRIÇÕES DE ANDAR ===

        # Elite e Rest não podem antes do andar 6 (índice 5)
        if y < self.ELITE_MIN_FLOOR and node_type in ['elite', 'rest']:
            return False

        # Rest não pode no andar 14 (antes do boss)
        if y == 14 and node_type == 'rest':
            return False

        # === RESTRIÇÕES DE ADJACÊNCIA ===

        # Elite, Shop e Rest não podem ser consecutivos verticalmente
        if node_type in ['elite', 'shop', 'rest']:
            # Verificar nós abaixo
            for down_coord in node.get('connections_down', []):
                down_node = self.nodes.get(down_coord)
                if down_node and down_node.get('type') == node_type:
                    return False

        # === RESTRIÇÃO DE DIVERGÊNCIA ===
        # Se um nó tem múltiplas conexões saindo, os destinos não podem ser do mesmo tipo especial
        if node_type in ['elite', 'shop', 'rest']:
            for down_coord in node.get('connections_down', []):
                down_node = self.nodes.get(down_coord)
                if down_node:
                    # Contar quantos nós acima do mesmo tipo já existem
                    same_type_count = 0
                    for up_coord in down_node.get('connections_up', []):
                        up_node = self.nodes.get(up_coord)
                        if up_node and up_node.get('type') == node_type:
                            same_type_count += 1
                    # Se já tem um do mesmo tipo, não pode ter outro
                    if same_type_count > 0:
                        return False

        return True

    def _add_boss_node(self):
        """
        Adiciona o nó do boss no topo do mapa.
        Conecta todos os nós do último nível ao boss.
        """
        boss_y = self.HEIGHT  # Nível 15 (índice)
        boss_x = self.WIDTH // 2  # Centro (coluna 3)

        self.nodes[(boss_x, boss_y)] = {
            'x': boss_x,
            'y': boss_y,
            'type': 'boss',
            'connections_up': [],
            'connections_down': [],
            'is_available': False,
            'is_visited': False
        }

        # Conectar todos os nós do último nível (14) ao boss
        for (x, y) in list(self.nodes.keys()):
            if y == self.HEIGHT - 1:
                self._connect_nodes(x, y, boss_x, boss_y)

    def _mark_initial_nodes(self):
        """
        Marca nós do primeiro nível como disponíveis para o jogador começar.
        """
        for (x, y), node in self.nodes.items():
            if y == 0:
                node['is_available'] = True

    def get_statistics(self) -> Dict:
        """
        Retorna estatísticas do mapa gerado.

        Returns:
            Dict com contagens de cada tipo de nó
        """
        stats = {
            'total_nodes': len(self.nodes),
            'battle': 0,
            'elite': 0,
            'shop': 0,
            'event': 0,
            'rest': 0,
            'boss': 0
        }

        for node in self.nodes.values():
            node_type = node.get('type')
            if node_type in stats:
                stats[node_type] += 1

        return stats
