"""
Constantes de jogo - Valores fixos usados em cálculos
Centraliza todos os "magic numbers" para facilitar balanceamento
"""

# ===== DANO BASE POR TIPO DE SKILL =====
DAMAGE_ATTACK_BASE = 6
DAMAGE_POWER_BASE = 12      # 2x do ataque
DAMAGE_SPECIAL_BASE = 18     # 3x do ataque
DAMAGE_ULTIMATE_BASE = 30    # 5x do ataque

# ===== CUSTOS DE ENERGIA =====
ENERGY_COST_ATTACK = 2
ENERGY_COST_POWER = 4
ENERGY_COST_SPECIAL = 6
ENERGY_COST_ULTIMATE = 8

# ===== SISTEMA DE CRÍTICO =====
CRITICAL_BASE_MULTIPLIER = 1.5
CRITICAL_CAP = 0.60  # 60% máximo de chance de crítico

# ===== SISTEMA DE LIFESTEAL =====
LIFESTEAL_CAP = 0.40  # 40% máximo de vampirismo

# ===== CAPS DE ACÚMULO DE RELÍQUIAS =====
MAX_ACCUMULATED_DAMAGE_PER_SKILL = 50  # +50 dano máximo de acúmulo

# ===== MULTIPLICADORES =====
DAMAGE_MULTIPLIER_CAP = 4.0  # Dano máximo pode ser multiplicado por 4x

# ===== REGENERAÇÃO =====
ENERGY_REGEN_PER_TURN = 2

# ===== ESTATÍSTICAS BASE =====
PLAYER_BASE_HP = 80
PLAYER_BASE_ENERGY = 10

# ===== BLOQUEIO E ESQUIVA =====
BLOCK_CAP = 0.20  # 20% máximo de bloqueio
DODGE_BASE = 0.05  # 5% base de esquiva

# ===== EXPERIÊNCIA E NÍVEIS =====
XP_BASE = 100
XP_LEVEL_EXPONENT = 1.5

# ===== RECOMPENSAS =====
ATTRIBUTE_POINTS_PER_LEVEL = 2
SKILL_POINTS_PER_LEVEL = 1

# ===== BOSS E INIMIGOS =====
BOSS_HP_BASE = 300
BOSS_DAMAGE_BASE = 15
ENEMY_HP_SCALING = 1.2  # 20% por nível
ENEMY_DAMAGE_SCALING = 1.15  # 15% por nível
