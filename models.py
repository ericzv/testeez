from database import db
from datetime import datetime, timezone
import json

from game_formulas import (
    calculate_strength_damage,
    calculate_resistance_block,
    calculate_critical_chance,
    calculate_critical_bonus,
    calculate_dodge_chance,
    calculate_max_hp,
    calculate_vitality_regeneration,  # Para cálculo de regeneração de HP
)

# Associação Card ⇄ Tag
card_tags = db.Table(
    'card_tags',
    db.Column('card_id', db.Integer, db.ForeignKey('card.id'), primary_key=True),
    db.Column('tag_id',  db.Integer, db.ForeignKey('tag.id'),  primary_key=True)
)

class Deck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), default="Coleção completa")
    parent_id = db.Column(db.Integer, db.ForeignKey('deck.id'), nullable=True)
    # Relação recursiva para hierarquia de decks (temas e subtemas)
    children = db.relationship('Deck', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    
    def __repr__(self):
        return f"<Deck {self.name}>"
    
class DailyStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, unique=True, nullable=False)
    cards_studied = db.Column(db.Integer, default=0)
    correct_count = db.Column(db.Integer, default=0)
    new_cards = db.Column(db.Integer, default=0)
    revision_cards = db.Column(db.Integer, default=0)
    study_time = db.Column(db.Integer, default=0)  # Tempo em segundos


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.Float, default=3)
    interval = db.Column(db.Float, default=1.0)
    next_review = db.Column(db.DateTime, default=datetime.utcnow)
    review_count = db.Column(db.Integer, default=0)
    correct_count = db.Column(db.Integer, default=0)
    deck_id = db.Column(db.Integer, db.ForeignKey('deck.id'), nullable=False, default=1)
    deck = db.relationship('Deck', backref='cards')
    suspended = db.Column(db.Boolean, default=False)
    tags = db.relationship('Tag', secondary=card_tags, lazy='subquery',
                      backref=db.backref('cards', lazy=True))

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    
    def __repr__(self):
        return f"<Tag {self.name}>"

# Modificar o modelo Player para suportar classe e sub-classe
class Player(db.Model):
    __tablename__ = 'player'  # Nome explícito da tabela

    # Identificação e login
    id                        = db.Column(db.Integer, primary_key=True)
    name                      = db.Column(db.String(100), nullable=False)
    email                     = db.Column(db.String(100), unique=True, nullable=False)
    password                  = db.Column(db.String(100), nullable=False)
    last_active               = db.Column(db.DateTime, default=datetime.utcnow)

    # Campos de streak e recursos
    days_streak               = db.Column(db.Integer, default=0)
    crystals                  = db.Column(db.Integer, default=100)
    eternal_hourglasses       = db.Column(db.Integer, default=0)  # Permanente entre runs
    run_gold                  = db.Column(db.Integer, default=0)  # Resetado ao morrer

    # ===============================================================================
    # CONTADORES DE RUN - SISTEMA DE RASTREAMENTO
    # ===============================================================================
    # Estes campos rastreiam o que foi GANHO durante a run atual.
    # São zerados a cada reset_player_run() e usados para estatísticas de morte.
    # 
    # OBRIGATÓRIO: Sempre que qualquer sistema adicionar recompensas ao jogador,
    # deve incrementar estes contadores correspondentes!
    # 
    # Exemplo: player.crystals += 100  →  player.run_crystals_gained += 100
    # ===============================================================================

    # Contadores específicos da run atual (zerados a cada reset)
    run_crystals_gained = db.Column(db.Integer, default=0)
    run_hourglasses_gained = db.Column(db.Integer, default=0)
    run_gold_gained = db.Column(db.Integer, default=0)  # Total ganho (diferente do saldo atual)
    run_bosses_defeated = db.Column(db.Integer, default=0)
    run_start_timestamp = db.Column(db.DateTime, nullable=True)

    # Contadores de reroll (zerados a cada reset)
    enemy_reroll_count = db.Column(db.Integer, default=0)
    memory_reroll_count = db.Column(db.Integer, default=0)
    relic_reroll_count = db.Column(db.Integer, default=0)
    
    study_time_total          = db.Column(db.Integer, default=0)
    talent_points             = db.Column(db.Integer, default=0)

    # Boss atual e sistema de recompensa
    current_boss_id           = db.Column(db.Integer, default=1)
    login_chest_chance        = db.Column(db.Float, default=0.0)

    # Sistema de classes
    skill_points              = db.Column(db.Integer, default=0)
    character_id = db.Column(db.String(20), nullable=True)
    subclass_available        = db.Column(db.Boolean, default=False)
    specialization            = db.Column(db.String(50), nullable=True)

    # Contadores globais de batalha (resetam ao vencer/morrer)
    attacks_this_battle = db.Column(db.Integer, default=0)
    kills_this_run = db.Column(db.Integer, default=0)
    last_three_skills = db.Column(db.Text, default='[]')  # JSON
    skills_used_this_battle = db.Column(db.Text, default='{}')  # JSON
    critical_hits_this_battle = db.Column(db.Integer, default=0)
    last_attack_was_critical = db.Column(db.Boolean, default=False)

    # Acumuladores permanentes da run (não resetam entre batalhas)
    accumulated_attack_bonus = db.Column(db.Integer, default=0)
    accumulated_power_bonus = db.Column(db.Integer, default=0)

    # Flags de primeira ação na batalha
    first_attack_done = db.Column(db.Boolean, default=False)
    first_power_or_special_done = db.Column(db.Boolean, default=False)
    enemy_first_attack_blocked = db.Column(db.Boolean, default=False)

    # Contadores cross-battle (persistem entre batalhas da mesma run)
    total_special_uses = db.Column(db.Integer, default=0)
    total_attacks_any_type = db.Column(db.Integer, default=0)

    # Campos para rastreamento de efeitos temporais
    last_time_check          = db.Column(db.DateTime, nullable=True)
    last_daily_effects       = db.Column(db.DateTime, nullable=True)

    # Atributos base
    level                     = db.Column(db.Integer, default=1)
    experience                = db.Column(db.Float, default=0.0)
    attribute_points          = db.Column(db.Integer, default=5)
    strength                  = db.Column(db.Integer, default=0)
    vitality                  = db.Column(db.Integer, default=0)
    resistance                = db.Column(db.Integer, default=0)
    luck                      = db.Column(db.Integer, default=0)
    damage_max_recorded = db.Column(db.Integer, default=0)

    # Recursos vida/energia
    hp                        = db.Column(db.Integer, default=80)
    max_hp                    = db.Column(db.Integer, default=80)
    barrier                   = db.Column(db.Integer, default=0, nullable=False)
    energy                    = db.Column(db.Integer, default=10)
    max_energy                = db.Column(db.Integer, default=10)

    # Contadores para regeneração
    hp_regen_counter          = db.Column(db.Integer, default=0)

    # ─── EFEITOS DE TALENTOS ─────────────────────────────────

    # Efeitos Básicos
    damage_bonus              = db.Column(db.Float, default=0.0)
    damage_multiplier         = db.Column(db.Float, default=1.0) 
    critical_chance_bonus     = db.Column(db.Float, default=0.0)
    critical_damage_bonus     = db.Column(db.Float, default=0.5)
    block_bonus               = db.Column(db.Float, default=0.0)
    vitality_bonus            = db.Column(db.Float, default=0.0)
    luck_bonus                = db.Column(db.Float, default=0.0)

    # Efeitos de HP/MP
    max_hp_bonus              = db.Column(db.Float, default=0.0)
    heal_on_damage_percent    = db.Column(db.Float, default=0.0)
    heal_on_victory           = db.Column(db.Float, default=0.0)
    morning_heal_amount       = db.Column(db.Float, default=0.0)

    # Efeitos Condicionais
    regen_boost_low_hp        = db.Column(db.Float, default=1.0)
    emergency_defense_bonus   = db.Column(db.Float, default=0.0)

    # Efeitos Econômicos / Progresso
    shop_discount             = db.Column(db.Float, default=0.0)
    crystal_double_chance     = db.Column(db.Float, default=0.0)
    exp_boost                 = db.Column(db.Float, default=0.0)
    bonus_attribute_per_10    = db.Column(db.Integer, default=0)

    # Efeitos Caóticos / Chance
    chaos_critical_chance     = db.Column(db.Float, default=0.0)
    chaos_heal_chance         = db.Column(db.Float, default=0.0)
    perfect_exp_bonus         = db.Column(db.Float, default=0.0)

    # Efeitos Especiais
    full_heal_on_victory      = db.Column(db.Boolean, default=False)
    reward_chest_chance       = db.Column(db.Float, default=0.0)
    double_attack_chance      = db.Column(db.Float, default=0.0)
    shield_on_full_hp         = db.Column(db.Float, default=0.0)
    regen_per_study_time      = db.Column(db.Float, default=0.0)

    # Esquiva — itens e talentos
    dodge_item_bonus          = db.Column(db.Float, default=0.0)
    dodge_talent_bonus        = db.Column(db.Float, default=0.0)

    # Campos para rastreamento de efeitos temporais
    last_time_check          = db.Column(db.DateTime, nullable=True)
    last_daily_effects       = db.Column(db.DateTime, nullable=True)

    # Campos de equipamento
    current_helmet_id         = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    current_eyes_id           = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    current_armor_id          = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    current_sword_id          = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    current_soulgem_id        = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    current_hair_id           = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)

    current_helmet            = db.relationship('Equipment', foreign_keys=[current_helmet_id])
    current_eyes              = db.relationship('Equipment', foreign_keys=[current_eyes_id])
    current_armor             = db.relationship('Equipment', foreign_keys=[current_armor_id])
    current_sword             = db.relationship('Equipment', foreign_keys=[current_sword_id])
    current_soulgem           = db.relationship('Equipment', foreign_keys=[current_soulgem_id])
    current_hair              = db.relationship('Equipment', foreign_keys=[current_hair_id])


    def recalculate_stats_enhanced(self):
        """Recalcula todas as estatísticas derivadas com base nos atributos e classe"""
        print(f"Recalculando estatísticas do jogador...")
        # Atualiza o dano base baseado na força e equipamentos
        base_damage = calculate_strength_damage(self.strength)
        print(f"Dano base atualizado: {base_damage + self.damage_bonus} (força={self.strength}, bônus={self.damage_bonus})")

        # HP/MP máximos
        self.max_hp = calculate_max_hp(self.vitality) + self.max_hp_bonus

        # ===== APLICAR BUFFS DE RUN (LEMBRANÇAS) =====
        if hasattr(self, 'id'):  # Verificar se o player tem ID (está salvo no banco)
            try:
                from routes.battle import get_run_buff_total
            except ImportError:
                # Fallback caso a função não esteja disponível ainda
                def get_run_buff_total(player_id, buff_type):
                    return 0.0
            
            # Aplicar bônus de HP/MP das lembranças
            hp_bonus = get_run_buff_total(self.id, 'maxhp')
            
            if hp_bonus > 0:
                self.max_hp += int(hp_bonus)
                print(f"🧠 LEMBRANÇAS: Bônus de HP aplicado: +{int(hp_bonus)}")

        print(f"HP máximo: {self.max_hp}")

        # Manter dentro do limite
        self.hp = min(self.hp, self.max_hp)

        # Resistência efetiva
        equip_res = ((self.current_helmet.defense_bonus if self.current_helmet else 0) +
                     (self.current_armor.defense_bonus if self.current_armor else 0))
        self.effective_resistance = self.resistance + equip_res + self.emergency_defense_bonus
        print(f"Resistência efetiva: {self.effective_resistance}")

    
    def add_attribute_point(self, attribute, points=1):
        """Adiciona pontos a um atributo específico"""
        if self.attribute_points < points:
            return False, "Pontos de atributo insuficientes."
        
        if attribute == "strength":
            if self.strength + points > 100:
                return False, "Não é possível exceder 100 pontos em um atributo."
            self.strength += points
        elif attribute == "vitality":
            if self.vitality + points > 100:
                return False, "Não é possível exceder 100 pontos em um atributo."
            self.vitality += points
        elif attribute == "resistance":
            if self.resistance + points > 100:
                return False, "Não é possível exceder 100 pontos em um atributo."
            self.resistance += points
        elif attribute == "luck":
            if self.luck + points > 100:
                return False, "Não é possível exceder 100 pontos em um atributo."
            self.luck += points
        else:
            return False, "Atributo desconhecido."
        
        self.attribute_points -= points
        if hasattr(self, 'recalculate_stats_enhanced'):
            self.recalculate_stats_enhanced()
        else:
            self.recalculate_stats()
        return True, f"{points} pontos adicionados a {attribute}."
    
    
    def level_up(self):
        """Processa a subida de nível do jogador"""
        self.level += 1
        self.attribute_points += 2  # Pontos de atributo
        self.skill_points += 1      # Ponto de habilidade
        
        # Recalcula estatísticas
        if hasattr(self, 'recalculate_stats_enhanced'):
            self.recalculate_stats_enhanced()
        else:
            self.recalculate_stats()
        return True, f"Subiu para o nível {self.level}! Ganhou 2 pontos de atributo e 1 ponto de habilidade."

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    equipment_type = db.Column(db.String(50), nullable=False)  # "helmet", "sword", etc.
    description = db.Column(db.Text)
    image = db.Column(db.String(255))  # Nome do arquivo da imagem
    rarity = db.Column(db.String(50), default="Common")  # "Common", "Rare", etc.
    
    # Atributos (bônus que o item fornece)
    defense_bonus = db.Column(db.Integer, default=0)
    damage_bonus = db.Column(db.Integer, default=0)
    luck_bonus = db.Column(db.Integer, default=0)
    # ... adicione outros atributos conforme necessário
    
    def __repr__(self):
        return f"<Equipment {self.name}>"
    
class PlayerEquipment(db.Model):
    __tablename__ = 'player_equipment'  # Nome explícito da tabela (opcional, mas recomendado)
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)  # Quantidade do item (útil para consumíveis)
    
    # Relacionamentos
    player = db.relationship('Player', backref='player_equipments')
    equipment = db.relationship('Equipment')
    
    def __repr__(self):
        return f"<PlayerEquipment player_id={self.player_id} equipment_id={self.equipment_id} quantity={self.quantity}>"

class Boss(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    hp = db.Column(db.Integer, nullable=False)
    max_hp = db.Column(db.Integer, nullable=False)
    region = db.Column(db.Integer, default=1)
    image = db.Column(db.String(255), default="boss1.png")
    description = db.Column(db.Text)
    defeated = db.Column(db.Boolean, default=False)

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    cost = db.Column(db.Integer, nullable=False)
    effect_type = db.Column(db.String(50))  # Type of effect: damage, hp, etc.
    effect_value = db.Column(db.Float)  # Value of the effect
    image = db.Column(db.String(255))
    rarity = db.Column(db.String(50), default="Common")  # Common, Rare, Epic, Legendary, Heroic, Special
    quantity = db.Column(db.Integer, default=1)  # Quantidade disponível na loja
    vendor = db.Column(db.String(50))  # "time_traveler" or "archmage"
    duration = db.Column(db.Integer, default=0)  # Duração do efeito em dias (0 = permanente)

class PlayerItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'))
    quantity = db.Column(db.Integer, default=1)
    
    player = db.relationship('Player', backref='inventory')
    item = db.relationship('Item')
    

class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(255))
    
class PlayerAchievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievement.id'))
    date_achieved = db.Column(db.DateTime, default=datetime.utcnow)
    
    player = db.relationship('Player', backref='achievements')
    achievement = db.relationship('Achievement')

class GameHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    event_type = db.Column(db.String(50))  # boss_defeated, level_up, etc.
    event_data = db.Column(db.Text)  # JSON data with specific event details
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    player = db.relationship('Player', backref='history')

class ShopQuote(db.Model):
    """Armazena os diálogos dos NPCs da loja"""
    id = db.Column(db.Integer, primary_key=True)
    vendor = db.Column(db.String(50), nullable=False)  # "time_traveler" ou "archmage"
    quote = db.Column(db.Text, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.now(timezone.utc).date)

class Talent(db.Model):
    __tablename__ = 'talent'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    constellation = db.Column(db.String(50), nullable=False)  # Nome da constelação
    position = db.Column(db.Integer)  # Posição na constelação (para pré-requisitos)
    x_coord = db.Column(db.Integer)  # Coordenada X no grid visual
    y_coord = db.Column(db.Integer)  # Coordenada Y no grid visual
    effect_type = db.Column(db.String(50))  # Tipo de efeito (dano, defesa, etc.)
    effect_value = db.Column(db.String(100))  # ALTERADO: agora é String em vez de Float
    is_secret = db.Column(db.Boolean, default=False)  # Se é um talento secreto
    requires_talent_id = db.Column(db.Integer, db.ForeignKey('talent.id'), nullable=True)
    
    # Relacionamento para pré-requisitos
    prerequisites = db.relationship('Talent', remote_side=[id], backref='unlocks')
    
    def __repr__(self):
        return f"<Talent {self.name}>"

class PlayerTalent(db.Model):
    __tablename__ = 'player_talent'
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    talent_id = db.Column(db.Integer, db.ForeignKey('talent.id'), nullable=False)
    level = db.Column(db.Integer, default=1)  # Adicionado campo de nível
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    player = db.relationship('Player', backref='talents')
    talent = db.relationship('Talent')
    
    def __repr__(self):
        return f"<PlayerTalent player_id={self.player_id} talent_id={self.talent_id} level={self.level}>"

class AppliedTalentEffect(db.Model):
    """Registra quais efeitos de talentos já foram aplicados ao jogador."""
    __tablename__ = 'applied_talent_effect'
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    talent_id = db.Column(db.Integer, nullable=False)
    effect_type = db.Column(db.String(50), nullable=False)
    effect_value = db.Column(db.String(100), nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AppliedTalentEffect player_id={self.player_id} talent_id={self.talent_id} type={self.effect_type}>"
    
    # 1) Cria as colunas de talentos (migrações):
    for sql in [
        "ALTER TABLE player ADD COLUMN damage_bonus FLOAT DEFAULT 0;",
        # … todas as outras ALTER TABLE …
        "ALTER TABLE player ADD COLUMN regen_per_study_time FLOAT DEFAULT 0;"
    ]:
        try:
            db.session.execute(text(sql))
        except Exception:
            pass
    print("Colunas de talentos verificadas/criadas com sucesso.")    


class BestiaryEntry(db.Model):
    """Registra quais bosses o jogador já derrotou"""
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    boss_id = db.Column(db.Integer, db.ForeignKey('boss.id'), nullable=False)
    date_defeated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Referências
    boss = db.relationship('Boss')
    
    def __repr__(self):
        return f'<BestiaryEntry player_id={self.player_id} boss_id={self.boss_id}>'
    
class EnemyTheme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # "Guerreiro Pesado", "Assassino", etc.
    body_options = db.Column(db.Text, nullable=False)     # JSON: [1,2,3,7,15]
    head_options = db.Column(db.Text, nullable=False)     # JSON: [5,8,10,21]
    weapon_options = db.Column(db.Text, nullable=False)   # JSON: [1,2,3,4,7,9]
    back_options = db.Column(db.Text, nullable=False)     # JSON: [1,2,3,5,9]
    name_pool = db.Column(db.Text, nullable=False)        # JSON: ["Nome1", "Nome2"]
    equipment_rules = db.Column(db.Text)                  # JSON: regras específicas
    
    # Modificadores de equipamentos
    equipment_modifiers = db.Column(db.Text)  # JSON: modificadores por peça

class GenericEnemy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    enemy_number = db.Column(db.Integer, nullable=False)  # 1-99 para progressão
    name = db.Column(db.String(100), nullable=False)
    theme_id = db.Column(db.Integer, db.ForeignKey('enemy_theme.id'), nullable=False)
    rarity = db.Column(db.Integer, nullable=False)  # 1=comum, 2=raro, 3=épico, 4=lendário
    hp = db.Column(db.Integer, nullable=False)
    max_hp = db.Column(db.Integer, nullable=False)
    damage = db.Column(db.Integer, nullable=False)
    posture = db.Column(db.Integer, nullable=False)
    block_percentage = db.Column(db.Float, nullable=False)
    special_skill = db.Column(db.Text)  # JSON: {type, chance, cooldown}
    powerful_attack = db.Column(db.Text)  # JSON: para implementação futura
    rounds_remaining = db.Column(db.Integer, nullable=False)  # 2, 3 ou 4
    initial_rounds = db.Column(db.Integer, nullable=False, default=3)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_available = db.Column(db.Boolean, default=True)
    
    # Sprites das camadas
    sprite_back = db.Column(db.String(50))    # back1.png, back2.png, etc.
    sprite_body = db.Column(db.String(50), nullable=False)    # body1.png, etc.
    sprite_head = db.Column(db.String(50), nullable=False)    # head1.png, etc.
    sprite_weapon = db.Column(db.String(50), nullable=False)  # weapon1.png, etc.
    # Modificadores e recompensas
    equipment_modifiers_applied = db.Column(db.Text)  # JSON: modificadores aplicados
    reward_bonus_percentage = db.Column(db.Float, default=0.0)  # Bônus de recompensa por equipamentos
    
    # Rank do equipamento baseado nos modificadores
    equipment_rank = db.Column(db.String(10), nullable=True)

    # Sistema de recompensas
    reward_type = db.Column(db.String(50), default='crystals')  # 'crystals', 'gold', 'hourglasses'
    reward_icon = db.Column(db.String(100), default='crystal.png')  # Nome do arquivo do ícone

    is_new = db.Column(db.Boolean, default=True)

    # Sistema de hits visuais e sonoros
    hit_animation = db.Column(db.String(10), nullable=False, default='hit1')  # hit1, hit2, hit3
    attack_sfx = db.Column(db.String(100), nullable=True)  # caminho do som (vazio por ora)
    
    # Sistema de cargas de ataque
    attack_charges_count = db.Column(db.Integer, nullable=False, default=0)  # cargas disponíveis

    # Sistema de Blood Stacks (acúmulos de sangue) - Específico para Vlad
    blood_stacks = db.Column(db.Integer, nullable=False, default=0)  # Acúmulos de sangue coagulado

    # Sistema modular de fila de ações (para futuras expansões)
    action_queue = db.Column(db.Text, nullable=False, default='[]')  # JSON array de ações

    # Sistema de skills do inimigo
    enemy_skills = db.Column(db.Text, default='[]')  # JSON: [{"type": "attack", "skill_id": 1}, ...]

    # Fila de ações de skills de buff/debuff (separada da action_queue normal)
    buff_debuff_queue = db.Column(db.Text, default='[]')  # JSON: [{"type": "buff", "skill_id": 50}, ...]

    # Sistema de turnos e intenções (novo)
    action_pattern = db.Column(db.Text, default='[]')  # JSON: ["attack", "buff", "attack_skill", ...]
    current_action_index = db.Column(db.Integer, default=0)  # Índice da próxima ação
    actions_per_turn_probability = db.Column(db.Text, default='{}')  # JSON: {"1": 0.90, "2": 0.10, "3": 0.00}
    next_intentions_cached = db.Column(db.Text, default='[]')  # Intenções pré-calculadas do próximo turno
    
    # Controle de alternância de attack skills (para quando tem múltiplas)
    attack_skill_rotation_index = db.Column(db.Integer, default=0)
    # Controle de alternância entre buff e debuff
    buff_debuff_rotation_index = db.Column(db.Integer, default=0)

    # Sistema de contagem de turnos para logs
    battle_turn_counter = db.Column(db.Integer, default=0)

    # Relacionamento com tema
    theme = db.relationship('EnemyTheme', backref='enemies')

class PlayerProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    generic_enemies_defeated = db.Column(db.Integer, default=0)  # Contador total
    current_boss_phase = db.Column(db.Integer, default=1)        # 1-20 dentro da fase
    available_enemies = db.Column(db.Text)                       # JSON: IDs disponíveis
    selected_enemy_id = db.Column(db.Integer, db.ForeignKey('generic_enemy.id'))
    last_theme_used = db.Column(db.String(100))  # Anti-repetição de temas consecutivos
    selected_boss_id = db.Column(db.Integer, db.ForeignKey('last_bosses.id'), nullable=True)
    
    # Relacionamentos
    player = db.relationship('Player', backref='progress')
    selected_enemy = db.relationship('GenericEnemy')

class PlayerRunBuff(db.Model):
    __tablename__ = 'player_run_buff'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    buff_type = db.Column(db.String(50), nullable=False)  # 'maxhp', 'maxmp', 'heal', 'damage_global', etc.
    total_value = db.Column(db.Float, default=0.0)  # Valor acumulado
    count = db.Column(db.Integer, default=0)  # Quantas vezes foi adquirido
    
    # Relacionamento
    player = db.relationship('Player', backref='run_buffs')

class EnemyEquipmentHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    equipment_type = db.Column(db.String(20), nullable=False)  # 'back', 'body', 'head', 'weapon'
    equipment_id = db.Column(db.String(20), nullable=False)    # 'back1.png', 'body5.png', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    player = db.relationship('Player', backref='equipment_history')
    
    def __repr__(self):
        return f'<EnemyEquipmentHistory {self.equipment_type}:{self.equipment_id}>'
    
class PendingReward(db.Model):
    """Armazena recompensas pendentes para aplicação no hub"""
    __tablename__ = 'pending_reward'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    exp_reward = db.Column(db.Integer, default=0)
    crystals_gained = db.Column(db.Integer, default=0)
    gold_gained = db.Column(db.Integer, default=0)
    hourglasses_gained = db.Column(db.Integer, default=0)
    victory_heal_amount = db.Column(db.Integer, default=0)
    reward_type = db.Column(db.String(50))
    reward_icon = db.Column(db.String(100))
    enemy_name = db.Column(db.String(100))
    damage_dealt = db.Column(db.Integer, default=0)
    damage_taken = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    relic_bonus_messages = db.Column(db.Text, nullable=True, default='')
    
    # Relacionamento
    player = db.relationship('Player', backref='pending_rewards')
    
    def to_dict(self):
        return {
            'exp_reward': self.exp_reward,
            'crystals_gained': self.crystals_gained,
            'gold_gained': self.gold_gained,
            'hourglasses_gained': self.hourglasses_gained,
            'victory_heal_amount': self.victory_heal_amount,
            'reward_type': self.reward_type,
            'reward_icon': self.reward_icon,
            'enemy_name': self.enemy_name,
            'damage_dealt': self.damage_dealt,
            'damage_taken': self.damage_taken,
            'relic_bonus_messages': self.relic_bonus_messages
        }
    
class PlayerAttackCache(db.Model):
    """
    Cache permanente de cálculos de ataque.
    Uma linha por skill do personagem.
    Recalculado quando: talentos/equipamentos/lembranças mudam.
    """
    __tablename__ = 'player_attack_cache'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    skill_id = db.Column(db.Integer, nullable=False)
    
    # Dados da skill
    skill_name = db.Column(db.String(100), nullable=False)
    skill_type = db.Column(db.String(20), nullable=False)  # 'attack', 'power', 'special', 'ultimate'
    
    # Custos fixos
    energy_cost = db.Column(db.Integer, nullable=False, default=2)  # Custo em energia por turno
    
    # Dano base fixo (já com todos os bônus permanentes aplicados)
    base_damage = db.Column(db.Integer, nullable=False)
    
    # Estatísticas de crítico
    base_crit_chance = db.Column(db.Float, nullable=False)
    base_crit_multiplier = db.Column(db.Float, nullable=False)  # 1.5 + bônus
    
    # Efeitos especiais da skill
    lifesteal_percent = db.Column(db.Float, default=0.0)
    effect_type = db.Column(db.String(50))
    effect_value = db.Column(db.Float)
    effect_bonus = db.Column(db.Integer, default=0) # Para bônus flat (ex: +3 Barreira)
    
    # Timestamp
    last_calculated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    player = db.relationship('Player', backref='attack_cache')
    
    __table_args__ = (
        db.UniqueConstraint('player_id', 'skill_id', name='unique_player_skill_cache'),
    )
    
    def __repr__(self):
        return f'<PlayerAttackCache player={self.player_id} skill={self.skill_id} damage={self.base_damage}>'

class PlayerDefenseCache(db.Model):
    """
    Cache de valores de defesa do jogador.
    UMA linha por player (defesa é igual para todas as skills).
    Recalculado junto com PlayerAttackCache.
    """
    __tablename__ = 'player_defense_cache'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False, unique=True)
    
    # Defesa
    base_block_percent = db.Column(db.Float, nullable=False)  # % de bloqueio
    base_dodge_chance = db.Column(db.Float, nullable=False)   # % de esquiva
    
    # HP/MP atuais (para referência rápida)
    max_hp = db.Column(db.Integer, nullable=False)
    
    last_calculated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    player = db.relationship('Player', backref='defense_cache', uselist=False)
    
    def __repr__(self):
        return f'<PlayerDefenseCache player={self.player_id} block={self.base_block_percent:.1%} dodge={self.base_dodge_chance:.1%}>'

class EnemySkillBuff(db.Model):
    """Buffs ativos aplicados pelo inimigo em si mesmo"""
    __tablename__ = 'enemy_skill_buff'
    
    id = db.Column(db.Integer, primary_key=True)
    enemy_id = db.Column(db.Integer, db.ForeignKey('generic_enemy.id'), nullable=False)
    skill_id = db.Column(db.Integer, nullable=False)
    effect_type = db.Column(db.String(50), nullable=False)  # 'heal', 'increase_damage', etc.
    effect_value = db.Column(db.Float, nullable=False)
    duration_type = db.Column(db.String(20), nullable=False)  # 'immediate', 'enemy_attacks', 'player_attacks', 'hours'
    duration_remaining = db.Column(db.Integer, nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    enemy = db.relationship('GenericEnemy', backref='active_buffs')

class EnemySkillDebuff(db.Model):
    """Debuffs aplicados pelo inimigo no jogador"""
    __tablename__ = 'enemy_skill_debuff'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    enemy_id = db.Column(db.Integer, db.ForeignKey('generic_enemy.id'), nullable=False)
    skill_id = db.Column(db.Integer, nullable=False)
    effect_type = db.Column(db.String(50), nullable=False)  # 'decrease_damage', 'decrease_crit', etc.
    effect_value = db.Column(db.Float, nullable=False)
    duration_type = db.Column(db.String(20), nullable=False)  # 'player_attacks', 'enemy_attacks', 'hours'
    duration_remaining = db.Column(db.Integer, nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    player = db.relationship('Player', backref='enemy_debuffs')
    enemy = db.relationship('GenericEnemy', backref='applied_debuffs')

class LastBoss(db.Model):
    """Modelo para bosses especiais que aparecem em milestones"""
    
    __tablename__ = 'last_bosses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Estatísticas base
    hp = db.Column(db.Integer, default=1000)
    max_hp = db.Column(db.Integer, default=1000)
    damage = db.Column(db.Integer, default=30)
    posture = db.Column(db.Integer, default=500)
    block_percentage = db.Column(db.Float, default=0.0)
    
    # Sistema de sprites
    sprite_idle = db.Column(db.String(200))  # Caminho para sprite idle
    sprite_frames = db.Column(db.Integer, default=1)  # Quantidade de frames
    sprite_size = db.Column(db.String(20), default="128x128")  # Tamanho em pixels
    
    # Sistema de ataques
    hit_animation = db.Column(db.String(50), default="hit1")
    hit_sound = db.Column(db.String(200))
    charge_generation_interval = db.Column(db.Integer, default=8)  # Horas entre cargas
    
    # Sistema de skills
    skills = db.Column(db.Text)  # JSON com skills disponíveis
    
    # Sistema de recompensas
    reward_crystals = db.Column(db.Integer, default=500)
    
    # Estado atual
    is_active = db.Column(db.Boolean, default=False)  # Se está disponível para batalha
    current_hp = db.Column(db.Integer)  # HP atual (para persistir entre sessões)
    
    # Sistema de cargas (similar ao GenericEnemy)
    attack_charges_count = db.Column(db.Integer, default=0)
    last_charge_generated = db.Column(db.DateTime)
    next_charge_at = db.Column(db.DateTime)
    action_queue = db.Column(db.Text, default='[]')

    # Sistema de Blood Stacks (acúmulos de sangue) - Específico para Vlad
    blood_stacks = db.Column(db.Integer, nullable=False, default=0)  # Acúmulos de sangue coagulado
    
    # Sistema de skills (similar ao GenericEnemy) 
    skill_charges = db.Column(db.Text, default='{}')
    skill_charge_intervals = db.Column(db.Text, default='{}')
    skill_last_charge_generated = db.Column(db.Text, default='{}')
    skill_next_charge_at = db.Column(db.Text, default='{}')
    buff_debuff_queue = db.Column(db.Text, default='[]')

    # Sistema de turnos e intenções (novo)
    action_pattern = db.Column(db.Text, default='[]')  # JSON: ["attack", "buff", "attack_skill", ...]
    current_action_index = db.Column(db.Integer, default=0)  # Índice da próxima ação
    actions_per_turn_probability = db.Column(db.Text, default='{}')  # JSON: {"1": 0.90, "2": 0.10, "3": 0.00}
    next_intentions_cached = db.Column(db.Text, default='[]')  # Intenções pré-calculadas do próximo turno
    
    # Controle de alternância de attack skills (para quando tem múltiplas)
    attack_skill_rotation_index = db.Column(db.Integer, default=0)
    # Controle de alternância entre buff e debuff
    buff_debuff_rotation_index = db.Column(db.Integer, default=0)

    # Sistema de contagem de turnos para logs
    battle_turn_counter = db.Column(db.Integer, default=0)
    
    def __init__(self, **kwargs):
        super(LastBoss, self).__init__(**kwargs)
        if not self.current_hp:
            self.current_hp = self.hp

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'hp': self.current_hp,
            'max_hp': self.max_hp,
            'damage': self.damage,
            'posture': self.posture,
            'block_percentage': self.block_percentage,
            'sprite_idle': self.sprite_idle,
            'sprite_frames': self.sprite_frames,
            'sprite_size': self.sprite_size,
            'hit_animation': self.hit_animation,
            'blood_stacks': self.blood_stacks,
            'hit_sound': self.hit_sound,
            'reward_crystals': self.reward_crystals,
            'is_active': self.is_active,
            'attack_charges_count': self.attack_charges_count
        }

    def reset_to_full_health(self):
        """Restaura boss para HP máximo"""
        self.current_hp = self.max_hp
        self.attack_charges_count = 0
        self.action_queue = '[]'
        self.skill_charges = '{}'
        self.buff_debuff_queue = '[]'

class RelicDefinition(db.Model):
    """Catálogo estático de todas as relíquias do jogo"""
    __tablename__ = 'relic_definition'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100), nullable=False)
    rarity = db.Column(db.String(20), nullable=False)  # common, uncommon, rare, epic, legendary
    
    # Metadados de funcionamento
    hooks = db.Column(db.Text, nullable=False)  # JSON: ['on_combat_start', 'after_attack']
    requires_counter = db.Column(db.Boolean, default=False)
    counter_type = db.Column(db.String(50))  # 'attacks', 'kills', 'skill_uses', etc
    counter_threshold = db.Column(db.Integer)  # Ex: 10 para "a cada 10 ataques"
    counter_resets = db.Column(db.Boolean, default=False)
    
    # Configuração do efeito (JSON para flexibilidade)
    effect_data = db.Column(db.Text, nullable=False)  # JSON completo do efeito
    
    def __repr__(self):
        return f'<RelicDefinition {self.id}>'

class PlayerRelic(db.Model):
    """Relíquias que o jogador possui na run atual"""
    __tablename__ = 'player_relic'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    relic_id = db.Column(db.String(50), db.ForeignKey('relic_definition.id'), nullable=False)
    acquired_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Estado mutável (contadores)
    counter_value = db.Column(db.Integer, default=0)
    times_triggered = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Estado JSON para casos complexos
    state_data = db.Column(db.Text, default='{}')
    
    # Relacionamentos
    player = db.relationship('Player', backref='relics')
    definition = db.relationship('RelicDefinition')
    
    def __repr__(self):
        return f'<PlayerRelic player={self.player_id} relic={self.relic_id}>'
    
class BattleLog(db.Model):
    """Log de turnos de batalha"""
    __tablename__ = 'battle_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    enemy_id = db.Column(db.Integer, nullable=True)
    enemy_name = db.Column(db.String(100))
    is_boss = db.Column(db.Boolean, default=False)
    
    turn_number = db.Column(db.Integer, default=1)
    turn_type = db.Column(db.String(20))  # 'player' ou 'enemy'
    
    actions = db.Column(db.Text)  # JSON
    damage_dealt = db.Column(db.Integer, default=0)
    damage_received = db.Column(db.Integer, default=0)
    healing = db.Column(db.Integer, default=0)
    energy_consumed = db.Column(db.Integer, default=0)
    next_intentions = db.Column(db.Text)  # JSON
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'turn_number': self.turn_number,
            'turn_type': self.turn_type,
            'actions': json.loads(self.actions) if self.actions else [],
            'damage_dealt': self.damage_dealt,
            'damage_received': self.damage_received,
            'healing': self.healing,
            'energy_consumed': self.energy_consumed,
            'next_intentions': json.loads(self.next_intentions) if self.next_intentions else [],
            'timestamp': self.timestamp.isoformat()
        }