"""
Exceções customizadas do jogo
Permite exception handling específico e mensagens claras
"""

class GameException(Exception):
    """Exceção base para todas as exceções do jogo"""
    def __init__(self, message, code=None):
        super().__init__(message)
        self.message = message
        self.code = code or 500


# ===== EXCEÇÕES DE PLAYER =====

class PlayerNotFoundException(GameException):
    """Player não encontrado no banco"""
    def __init__(self, player_id=None):
        message = f"Player {player_id} não encontrado" if player_id else "Player não encontrado"
        super().__init__(message, code=404)


class PlayerNotAuthenticatedException(GameException):
    """Player não está autenticado"""
    def __init__(self):
        super().__init__("Player não autenticado", code=401)


class InsufficientResourcesException(GameException):
    """Player não tem recursos suficientes"""
    def __init__(self, resource_type, required, available):
        message = f"{resource_type} insuficiente. Necessário: {required}, Disponível: {available}"
        super().__init__(message, code=400)


# ===== EXCEÇÕES DE SKILL =====

class SkillNotFoundException(GameException):
    """Skill não encontrada"""
    def __init__(self, skill_id):
        super().__init__(f"Skill {skill_id} não encontrada", code=404)


class SkillNotOwnedException(GameException):
    """Player não possui essa skill"""
    def __init__(self, skill_id):
        super().__init__(f"Player não possui skill {skill_id}", code=403)


class InsufficientEnergyException(InsufficientResourcesException):
    """Player não tem energia suficiente"""
    def __init__(self, required, available):
        super().__init__("Energia", required, available)


# ===== EXCEÇÕES DE INIMIGO =====

class EnemyNotFoundException(GameException):
    """Inimigo não encontrado"""
    def __init__(self, enemy_id):
        super().__init__(f"Inimigo {enemy_id} não encontrado", code=404)


class NoActiveEnemyException(GameException):
    """Nenhum inimigo ativo para batalha"""
    def __init__(self):
        super().__init__("Nenhum inimigo selecionado", code=400)


class EnemyAlreadyDeadException(GameException):
    """Tentando atacar inimigo morto"""
    def __init__(self):
        super().__init__("Inimigo já está morto", code=400)


# ===== EXCEÇÕES DE BATALHA =====

class BattleStateException(GameException):
    """Estado da batalha inválido"""
    def __init__(self, message):
        super().__init__(f"Estado de batalha inválido: {message}", code=400)


class InvalidTurnException(GameException):
    """Não é o turno do player"""
    def __init__(self):
        super().__init__("Não é seu turno", code=400)


# ===== EXCEÇÕES DE VALIDAÇÃO =====

class ValidationException(GameException):
    """Dados de entrada inválidos"""
    def __init__(self, field, message):
        super().__init__(f"Validação falhou em '{field}': {message}", code=400)


# ===== EXCEÇÕES DE BANCO DE DADOS =====

class DatabaseException(GameException):
    """Erro de banco de dados"""
    def __init__(self, message):
        super().__init__(f"Erro de banco: {message}", code=500)


class TransactionException(GameException):
    """Erro em transação do banco"""
    def __init__(self, message):
        super().__init__(f"Erro de transação: {message}", code=500)
