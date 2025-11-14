# characters.py - Sistema Completo de Personagens e Skills
"""
Sistema unificado que gerencia:
- Modelos SQLAlchemy para skills e buffs
- Definições de personagens
- Lógica de skills de ataque e especiais
- Gerenciamento de buffs e efeitos
"""

# ===== IMPORTS =====
from datetime import datetime, timedelta
import json
import random
from database import db

# =====================================
# MODELOS SQLALCHEMY
# =====================================

class AttackSkill(db.Model):
    """Modelo para habilidades de ataque"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    damage_modifier = db.Column(db.Float, default=1.0)
    mana_cost = db.Column(db.Integer, default=10)
    points_cost = db.Column(db.Integer, default=0)
    effect_type = db.Column(db.String(50))
    effect_value = db.Column(db.Float, nullable=True)
    
    # Caminhos de mídia
    attack_sequence = db.Column(db.String(100))
    animation_fx_a = db.Column(db.String(255))
    animation_fx_b = db.Column(db.String(255))
    animation_attack = db.Column(db.String(255))
    sound_activation = db.Column(db.String(255))
    vignette = db.Column(db.String(255))
    boss_damage_overlay = db.Column(db.String(255))
    icon = db.Column(db.String(255))
    sound_prep_1 = db.Column(db.String(255))
    sound_prep_2 = db.Column(db.String(255))
    sound_attack = db.Column(db.String(255))
    sound_effect_1 = db.Column(db.String(255))
    sound_effect_2 = db.Column(db.String(255))
    projectile_type = db.Column(db.String(50))
    beam_type = db.Column(db.String(50))
    
    def __repr__(self):
        return f"<AttackSkill {self.name}>"

class SpecialSkill(db.Model):
    """Modelo para habilidades especiais"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # Campos do sistema antigo (mantidos para compatibilidade)
    max_charges = db.Column(db.Integer, default=1, nullable=True)
    cooldown_minutes = db.Column(db.Integer, default=60, nullable=True)
    positive_effect_type = db.Column(db.String(50), nullable=True)
    positive_effect_value = db.Column(db.Text, nullable=True)  # JSON para efeitos complexos
    negative_effect_type = db.Column(db.String(50), nullable=True)
    negative_effect_value = db.Column(db.Float, nullable=True)
    duration_type = db.Column(db.String(20), nullable=True)
    duration_value = db.Column(db.Integer, default=60, nullable=True)

    # Campos do novo sistema de turnos e blood stacks
    energy_cost = db.Column(db.Integer, default=0, nullable=True)
    hp_cost = db.Column(db.Integer, default=0, nullable=True)
    blood_stacks_generated = db.Column(db.Integer, default=0, nullable=True)
    next_attack_bonus = db.Column(db.Integer, default=0, nullable=True)
    effect_type = db.Column(db.String(50), nullable=True)
    damage_per_blood_stack = db.Column(db.Integer, default=0, nullable=True)
    consumes_blood_stacks = db.Column(db.Boolean, default=False, nullable=True)
    barrier_per_blood_stack = db.Column(db.Integer, default=0, nullable=True)
    heal_per_blood_stack = db.Column(db.Integer, default=0, nullable=True)

    # Caminhos de mídia (sistema antigo)
    animation_activate_1 = db.Column(db.String(255), nullable=True)
    animation_activate_2 = db.Column(db.String(255), nullable=True)
    sound_prep_1 = db.Column(db.String(255), nullable=True)
    sound_prep_2 = db.Column(db.String(255), nullable=True)
    sound_effect_1 = db.Column(db.String(255), nullable=True)
    sound_effect_2 = db.Column(db.String(255), nullable=True)

    # Caminhos de mídia (novo sistema)
    animation_sprite = db.Column(db.String(255), nullable=True)
    animation_frames = db.Column(db.Integer, default=1, nullable=True)
    animation_target = db.Column(db.String(20), nullable=True)  # "self" ou "enemy"
    sound_effect = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<SpecialSkill {self.name}>"

class PlayerSkill(db.Model):
    """Modelo para skills associadas ao jogador"""
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    skill_type = db.Column(db.String(20))  # "attack" ou "special"
    skill_id = db.Column(db.Integer, nullable=False)
    current_charges = db.Column(db.Integer, default=0)
    last_charge_time = db.Column(db.DateTime, default=datetime.utcnow)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<PlayerSkill type={self.skill_type} id={self.skill_id}>"
    
    def get_time_until_next_charge(self):
        """Calcula o tempo restante para a próxima carga"""
        if self.skill_type != "special":
            return timedelta(0)
        
        special = SpecialSkill.query.get(self.skill_id)
        if not special:
            return timedelta(0)
        
        cooldown_minutes = special.cooldown_minutes
        next_charge_time = self.last_charge_time + timedelta(minutes=cooldown_minutes)
        
        now = datetime.utcnow()
        if next_charge_time <= now:
            return timedelta(0)
        return next_charge_time - now

class ActiveBuff(db.Model):
    """Modelo para buffs ativos do jogador"""
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    source_skill_id = db.Column(db.Integer, nullable=False)
    skill_type = db.Column(db.String(20))  # "attack" ou "special"
    effect_type = db.Column(db.String(50), nullable=False)
    effect_value = db.Column(db.Float, nullable=False)
    duration_type = db.Column(db.String(20))  # "time" ou "attacks"
    duration_value = db.Column(db.Integer)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    attacks_remaining = db.Column(db.Integer, nullable=True)
    icon = db.Column(db.String(255))
    
    def __repr__(self):
        return f"<ActiveBuff {self.effect_type}={self.effect_value}>"
    
    def is_expired(self):
        """Verifica se o buff expirou"""
        if self.duration_type == "time":
            expiry_time = self.start_time + timedelta(minutes=self.duration_value)
            return datetime.utcnow() >= expiry_time
        elif self.duration_type == "attacks":
            return self.attacks_remaining <= 0
        return True

class CombatLog(db.Model):
    """Modelo para log de combate"""
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    skill_id = db.Column(db.Integer, nullable=False)
    skill_type = db.Column(db.String(20), nullable=False)  # "attack" ou "special"
    points_used = db.Column(db.Integer, default=0)
    mana_used = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<CombatLog player_id={self.player_id} skill_id={self.skill_id}>"

class UnlockedRPGSkill(db.Model):
    """Armazena as habilidades de RPG desbloqueadas pelo jogador"""
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    skill_id = db.Column(db.Integer, nullable=False)
    skill_type = db.Column(db.String(20), nullable=False)  # "attack" ou "special"
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)
       
    def __repr__(self):
        return f"<UnlockedRPGSkill player_id={self.player_id} skill_id={self.skill_id}>"

# =====================================
# DEFINIÇÕES DE PERSONAGENS
# =====================================

CHARACTERS = {
    "vlad": {
        "id": "vlad",
        "name": "Vlad",
        "description": "Lorde de Sangue",
        "passive_effect_type": "blood_drain",
        "passive_effect_value": 0.0,
        "icon": "vlad_icon.png",
        "sprite_reference": "Vlad",
        "skills": {
            "ataque": 51,      # Garras Sangrentas
            "poder": 50,       # Energia Escura  
            "ataque_especial": 52,  # Abraço da Escuridão
            "ultimate": 53     # Beijo da Morte
        },
        "special_abilities": [138, 139, 140, 141]
    },
    "mago_teste": {
        "id": "mago_teste",
        "name": "Mago Teste",
        "description": "Mago para testes",
        "passive_effect_type": "mana_regen",
        "passive_effect_value": 0.20,
        "icon": "mago_icon.png", 
        "sprite_reference": "Mago",
        "skills": {
            "ataque": 1,
            "poder": 2,
            "ataque_especial": 10,
            "ultimate": 11
        },
        "special_abilities": [101, 110, 111, 112]
    }
}

# Skills do Vlad para inserir no banco
VLAD_ATTACK_SKILLS_DATA = [
    {
        "id": 50,
        "name": "Energia Escura",
        "description": "Projétil de energia sombria que drena vida",
        "effect_type": "",
        "effect_value": 0.0,
        "animation_fx_a": "mordida_mortal_front",
        "animation_fx_b": "mordida_mortal_back",
        "animation_attack": "",
        "boss_damage_overlay": "necrotic_damage",
        "sound_activation": "/static/game.data/sounds/vamp-start.mp3",
        "icon": "/static/game.data/icons/icon2.png",
        "sound_prep_1": "/static/game.data/sounds/sfx1.mp3",
        "sound_prep_2": "",
        "sound_effect_1": "/static/game.data/sounds/sfx2.mp3",
        "sound_effect_2": "",
        "attack_sequence": "ranged_projectile",
        "projectile_type": "magic_missile"
    },
    {
        "id": 51,
        "name": "Garras Sangrentas",
        "description": "Ataque corpo a corpo com garras vampíricas",
        "effect_type": "lifesteal",
        "effect_value": 0.2,
        "animation_fx_a": "garras_sangrentas_front",
        "animation_fx_b": "garras_sangrentas_back",
        "animation_attack": "",
        "boss_damage_overlay": "feral_damage",
        "icon": "/static/game.data/icons/icon2.png",
        "sound_prep_1": "/static/game.data/sounds/sfx1.mp3",
        "sound_prep_2": "",
        "sound_effect_1": "/static/game.data/sounds/sfx2.mp3",
        "sound_effect_2": "",
        "attack_sequence": "melee_run_basic"
    },
    {
        "id": 52,
        "name": "Abraço da Escuridão",
        "description": "Feixe sombrio que envolve o inimigo",
        "effect_type": "crit_chance",
        "effect_value": 0.20,
        "animation_fx_a": "abraco_escuridao_front",
        "animation_fx_b": "abraco_escuridao_back",
        "animation_attack": "",
        "boss_damage_overlay": "darkness_embrace_distant",
        "icon": "/static/game.data/icons/icon2.png",
        "sound_prep_1": "/static/game.data/sounds/sfx1.mp3",
        "sound_prep_2": "",
        "sound_effect_1": "/static/game.data/sounds/sfx2.mp3",
        "sound_effect_2": "",
        "attack_sequence": "ranged_beam",
        "beam_type": "dark_beam"
    },
    {
        "id": 53,
        "name": "Beijo da Morte",
        "description": "O ultimate vampírico que drena toda essência vital",
        "effect_type": "",
        "effect_value": 0.0,
        "animation_fx_a": "beijo_morte_front",
        "animation_fx_b": "beijo_morte_back",
        "animation_attack": "",
        "icon": "/static/game.data/icons/icon2.png",
        "boss_damage_overlay": "blood_damage",
        "sound_prep_1": "/static/game.data/sounds/sfx1.mp3",
        "sound_prep_2": "",
        "sound_effect_1": "/static/game.data/sounds/sfx2.mp3",
        "sound_effect_2": "",
        "attack_sequence": "ranged_distant"
    }
]

VLAD_SPECIAL_SKILLS_DATA = [
    {
        "id": 138,
        "name": "Autofagia",
        "description": "Sacrifica HP para gerar Sangue Coagulado e fortalecer o próximo ataque.",
        "energy_cost": 0,  # Não custa energia, custa HP
        "hp_cost": 7,  # Custo base de HP (pode ser modificado por melhorias)
        "blood_stacks_generated": 3,  # Quantidade de acúmulos gerados
        "next_attack_bonus": 5,  # Bônus de dano no próximo ataque
        "effect_type": "autofagia",  # Identificador único
        "animation_sprite": "/static/game.data/fx/autofagia300-300-7f.png",  # Sprite 300x300, 7 frames
        "animation_frames": 7,
        "animation_target": "self",  # Anima sobre o próprio personagem
        "sound_effect": "/static/game.data/sounds/autofagia.mp3",
        "icon": "/static/game.data/icons/icon3.png"
    },
    {
        "id": 139,
        "name": "Lâmina de Sangue",
        "description": "Consome todo Sangue Coagulado para lançar uma lâmina carmesim que causa dano massivo.",
        "energy_cost": 2,
        "damage_per_blood_stack": 2,  # 2 de dano por acúmulo de sangue
        "consumes_blood_stacks": True,  # Consome todos os acúmulos
        "effect_type": "blood_blade",
        "animation_sprite": "/static/game.data/fx/blood_blade300-300-7f.png",  # Sprite 300x300, 7 frames
        "animation_frames": 7,
        "animation_target": "enemy",  # Anima sobre o inimigo (precisa de pendência se em character-view)
        "sound_effect": "/static/game.data/sounds/blood_blade.mp3",
        "icon": "/static/game.data/icons/icon3.png"
    },
    {
        "id": 140,
        "name": "Barreira de Sangue",
        "description": "Consome todo Sangue Coagulado para criar uma barreira protetora de sangue cristalizado.",
        "energy_cost": 3,
        "barrier_per_blood_stack": 2,  # 2 de barreira por acúmulo
        "consumes_blood_stacks": True,
        "effect_type": "blood_barrier",
        "animation_sprite": "/static/game.data/fx/blood_barrier.png",  # Sprite 128x128, 11 frames
        "animation_frames": 11,
        "animation_target": "self",
        "sound_effect": "/static/game.data/sounds/blood_barrier.mp3",
        "icon": "/static/game.data/icons/icon3.png"
    },
    {
        "id": 141,
        "name": "Regeneração",
        "description": "Consome todo Sangue Coagulado para regenerar a vitalidade perdida.",
        "energy_cost": 2,
        "heal_per_blood_stack": 1,  # 1 HP curado por acúmulo
        "consumes_blood_stacks": True,
        "effect_type": "blood_regeneration",
        "animation_sprite": "/static/game.data/fx/regen.png",  # Sprite 128x128, 11 frames
        "animation_frames": 11,
        "animation_target": "self",
        "sound_effect": "/static/game.data/sounds/regen.mp3",
        "icon": "/static/game.data/icons/icon3.png"
    }
]

# =====================================
# FUNÇÕES DE INICIALIZAÇÃO
# =====================================

def init_vlad_skills():
    """Inicializa as skills do Vlad no banco - SEM IMPORT CIRCULAR"""
    try:
        print("🔄 Inicializando skills do Vlad...")
        
        # Adicionar skills de ataque do Vlad
        for skill_data in VLAD_ATTACK_SKILLS_DATA:
            existing = AttackSkill.query.get(skill_data["id"])
            if not existing:
                skill = AttackSkill(**skill_data)
                db.session.add(skill)
                print(f"  ✅ Skill de ataque criada: {skill_data['name']} (ID: {skill_data['id']})")
            else:
                print(f"  ⏭️ Skill de ataque já existe: {skill_data['name']} (ID: {skill_data['id']})")
        
        # Adicionar skills especiais do Vlad
        for skill_data in VLAD_SPECIAL_SKILLS_DATA:
            existing = SpecialSkill.query.get(skill_data["id"])
            if not existing:
                skill = SpecialSkill(**skill_data)
                db.session.add(skill)
                print(f"  ✅ Skill especial criada: {skill_data['name']} (ID: {skill_data['id']})")
            else:
                print(f"  ⏭️ Skill especial já existe: {skill_data['name']} (ID: {skill_data['id']})")
        
        db.session.commit()
        print("✅ Skills do Vlad inicializadas com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao inicializar skills do Vlad: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return False

def init_skills():
    """Inicializa as habilidades no banco de dados"""
    # Usar função específica do personagem
    success = init_vlad_skills()
    if success:
        print("Habilidades inicializadas com sucesso via personagens!")
        return
    
    print("❌ Falha ao inicializar habilidades")

# =====================================
# FUNÇÕES DE PERSONAGENS
# =====================================

def choose_character(player_id, character_id):
    """Escolhe um personagem e configura suas skills"""
    try:
        from models import Player
        
        player = Player.query.get(player_id)
        if not player:
            return False, "Jogador não encontrado."
            
        character = CHARACTERS.get(character_id)
        if not character:
            return False, "Personagem inválido."
        
        print(f"🎭 Configurando personagem {character['name']} para player {player_id}")
        
        # Definir personagem
        player.character_id = character_id
        
        # Limpar skills antigas
        PlayerSkill.query.filter_by(player_id=player_id).delete()
        
        # Adicionar as 4 skills de ataque do personagem
        for skill_type, skill_id in character["skills"].items():
            player_skill = PlayerSkill(
                player_id=player_id,
                skill_id=skill_id,
                skill_type="attack"
            )
            db.session.add(player_skill)
            print(f"  ➕ Skill de ataque adicionada: {skill_type} (ID: {skill_id})")
        
        # Adicionar as habilidades especiais
        for skill_id in character["special_abilities"]:
            player_skill = PlayerSkill(
                player_id=player_id,
                skill_id=skill_id,
                skill_type="special",
                current_charges=0,
                last_charge_time=datetime.utcnow()
            )
            db.session.add(player_skill)
            print(f"  ⭐ Skill especial adicionada: ID {skill_id}")
        
        db.session.commit()
        print(f"✅ Personagem {character['name']} configurado com sucesso!")
        return True, f"Você escolheu {character['name']}!"
        
    except Exception as e:
        print(f"❌ Erro ao escolher personagem: {e}")
        return False, f"Erro interno: {str(e)}"

def get_character_data(character_id):
    """Retorna dados completos do personagem"""
    return CHARACTERS.get(character_id)

def get_attack_type_by_skill_id(skill_id, character_id):
    """
    Identifica o tipo de ataque baseado no skill_id e personagem.
    
    Args:
        skill_id: ID da skill usada
        character_id: ID do personagem (ex: "vlad")
    
    Returns:
        str: Tipo do ataque ("ataque", "poder", "ataque_especial", "ultimate") ou None
    """
    if not character_id or character_id not in CHARACTERS:
        return None
    
    character_skills = CHARACTERS[character_id]["skills"]
    
    # Procurar qual tipo de ataque corresponde ao skill_id
    for attack_type, mapped_skill_id in character_skills.items():
        if mapped_skill_id == skill_id:
            return attack_type
    
    return None

def get_memory_buff_type_by_attack_type(attack_type):
    """
    Converte tipo de ataque para tipo de buff de memória.
    
    Args:
        attack_type: Tipo do ataque ("ataque", "poder", "ataque_especial", "ultimate")
    
    Returns:
        str: Tipo de buff correspondente ou None
    """
    mapping = {
        "ataque": "damage_attack",
        "poder": "damage_power", 
        "ataque_especial": "damage_special",
        "ultimate": "damage_ultimate"
    }
    
    return mapping.get(attack_type)

# =====================================
# FUNÇÕES DE MANIPULAÇÃO DE SKILLS
# =====================================

def get_player_attacks(player_id):
    """Retorna as habilidades de ataque que o jogador já desbloqueou"""
    player_skills = PlayerSkill.query.filter_by(
        player_id=player_id,
        skill_type="attack"
    ).all()
    
    result = []
    for ps in player_skills:
        skill = AttackSkill.query.get(ps.skill_id)
        if skill:
            try:
                skill_data = {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "level": 1,
                    "damage_modifier": skill.damage_modifier,
                    "mana_cost": skill.mana_cost,
                    "effect_type": skill.effect_type,
                    "effect_value": skill.effect_value,
                    "skill_type": None,  # Será preenchido do cache abaixo
                    # Caminhos de mídia
                    "icon": skill.icon or "",
                    "sound_prep_1": skill.sound_prep_1 or "",
                    "sound_prep_2": skill.sound_prep_2 or "",
                    "sound_attack": skill.sound_attack or "",
                    "sound_effect_1": skill.sound_effect_1 or "",
                    "sound_effect_2": skill.sound_effect_2 or "",
                    "animation_fx_a": skill.animation_fx_a or "",
                    "animation_fx_b": skill.animation_fx_b or "",
                    "animation_attack": skill.animation_attack or "",
                    "sound_activation": skill.sound_activation or "",
                    "vignette": skill.vignette or "",
                    "boss_damage_overlay": skill.boss_damage_overlay or "",
                    "projectile_type": skill.projectile_type or "",
                    "beam_type": skill.beam_type or "",
                    "attack_sequence": skill.attack_sequence or "melee_teleport_basic"
                }
                
                result.append(skill_data)
            except Exception as e:
                print(f"Erro ao processar skill {skill.id}: {str(e)}")
                result.append({
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "level": 1,
                    "damage_modifier": 1.0,
                    "mana_cost": skill.mana_cost,
                    "icon": "/static/game.data/icons/icon1.png",
                    "effect_type": None,
                    "effect_value": None,
                    "attack_sequence": "melee_teleport_basic"
                })
    
    # Buscar skill_type e energy_cost do cache para cada skill
    from models import PlayerAttackCache, PlayerRelic
    import json

    # Buscar relíquias ativas para identificar modificadores
    active_relics = PlayerRelic.query.filter_by(player_id=player_id, is_active=True).all()
    relic_info_by_id = {}

    for relic in active_relics:
        from routes.relics.registry import get_relic_definition
        definition = get_relic_definition(relic.relic_id)
        if definition:
            relic_info_by_id[relic.relic_id] = {
                'name': definition.get('name', ''),
                'icon': definition.get('icon', ''),
                'effect': definition['effect']
            }

    for skill in result:
        cache = PlayerAttackCache.query.filter_by(
            player_id=player_id,
            skill_id=skill['id']
        ).first()
        if cache:
            skill['skill_type'] = cache.skill_type
            skill['energy_cost'] = cache.energy_cost

            from models import Player
            player = Player.query.get(player_id)

            # Calcular dano total incluindo bônus acumulados
            # O cache JÁ inclui accumulated_attack_bonus e accumulated_power_bonus
            total_damage = cache.base_damage

            # Adicionar APENAS bônus de batalha (battle_stacks) que NÃO estão no cache
            for relic in active_relics:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition(relic.relic_id)
                if definition:
                    effect = definition.get('effect', {})
                    effect_type = effect.get('type')

                    # ID 50 - Sangue Coagulado: adicionar APENAS os stacks da batalha
                    # O initial_bonus JÁ está incluído no cache.base_damage
                    if effect_type == 'battle_accumulating_damage' and effect.get('skill_type') == cache.skill_type:
                        state = json.loads(relic.state_data or '{}')
                        stacks = state.get('battle_stacks', 0)
                        stack_bonus = effect.get('stack_bonus', 2)
                        total_damage += stacks * stack_bonus  # APENAS os stacks, não o initial

            # Adicionar dados do cache para exibição no frontend
            skill['cache_data'] = {
                'base_damage': total_damage,  # Agora inclui todos os bônus
                'base_crit_chance': cache.base_crit_chance,
                'base_crit_multiplier': cache.base_crit_multiplier,
                'lifesteal_percent': cache.lifesteal_percent,
                'effect_type': cache.effect_type,
                'effect_value': cache.effect_value,
                'effect_bonus': cache.effect_bonus
            }

            # Identificar relíquias aplicáveis a este ataque
            applicable_relics = []

            for relic in active_relics:
                relic_id = relic.relic_id
                if relic_id not in relic_info_by_id:
                    continue

                definition = relic_info_by_id[relic_id]
                effect = definition['effect']
                effect_type = effect['type']
                state = json.loads(relic.state_data or '{}')

                applies_to_this_skill = False
                modifier_info = {}

                # ID 24 - Última Graça: x2 dano na Suprema (1x por batalha)
                if effect_type == 'ultimate_trade' and cache.skill_type == 'ultimate':
                    used_this_battle = state.get('used_this_battle', False)
                    if not used_this_battle:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'damage_multiplier',
                            'value': effect['damage_multiplier'],
                            'description': f"Dano x{effect['damage_multiplier']} (1x esta batalha)"
                        }

                # ID 25 - Discipulado: x2 dano no 10º, 20º, 30º... ataque
                elif effect_type == 'damage_multiplier_on_threshold':
                    threshold = effect.get('counter_threshold', 10)
                    next_attack = player.total_attacks_any_type + 1
                    if next_attack % threshold == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'damage_multiplier',
                            'value': effect['multiplier'],
                            'description': f"Dano x{effect['multiplier']} (próximo = {next_attack}º ataque)"
                        }

                # ID 17 - Momentum Plagosus: +20% crit no próximo ataque
                elif effect_type == 'crit_chain':
                    bonus_crit = state.get('bonus_crit_next', 0.0)
                    if bonus_crit > 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'crit_bonus',
                            'value': bonus_crit,
                            'description': f"+{bonus_crit*100:.0f}% crítico no próximo"
                        }

                # ID 16 - Pedra Angular: 100% crit no primeiro Poder/Especial
                elif effect_type == 'first_power_special_crit':
                    if not player.first_power_or_special_done and cache.skill_type in ['power', 'special']:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'force_crit',
                            'value': 1.0,
                            'description': f"Crítico garantido (primeiro {cache.skill_type})"
                        }

                # ID 28 - Ritual de Sangue: +15% vampirismo no 5º, 10º, 15º... Especial
                elif effect_type == 'lifesteal_on_threshold' and cache.skill_type == 'special':
                    threshold = effect.get('counter_threshold', 5)
                    next_special = player.total_special_uses + 1
                    if next_special % threshold == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'lifesteal_bonus',
                            'value': effect['lifesteal_percent'],
                            'description': f"+{effect['lifesteal_percent']*100:.0f}% vampirismo (próximo = {next_special}º especial)"
                        }

                # ID 22 - Petrus: +10 dano no Poder por relíquia
                elif effect_type == 'damage_per_relic' and effect.get('skill_type') == 'power' and cache.skill_type == 'power':
                    applies_to_this_skill = True
                    relic_count = len(active_relics)
                    bonus = relic_count * effect['damage_per_relic']
                    modifier_info = {
                        'type': 'damage_bonus',
                        'value': bonus,
                        'description': f"+{bonus} dano ({relic_count} relíquias)"
                    }

                # ID 23 - Doxologia: -1 energia no Especial
                elif effect_type == 'special_energy_reduction' and cache.skill_type == 'special':
                    applies_to_this_skill = True
                    modifier_info = {
                        'type': 'energy_reduction',
                        'value': effect['energy_cost_reduction'],
                        'description': f"-{effect['energy_cost_reduction']} energia"
                    }

                # ID 13 - Crit per relic (passiva global)
                elif effect_type == 'crit_per_relic':
                    applies_to_this_skill = True
                    relic_count = len(active_relics)
                    bonus = relic_count * effect['crit_percent']
                    modifier_info = {
                        'type': 'crit_passive',
                        'value': bonus,
                        'description': f"+{bonus*100:.0f}% crítico passivo ({relic_count} relíquias)"
                    }

                # ID 43 - Block per relic (passiva de defesa, mostrar apenas para info)
                elif effect_type == 'block_per_relic':
                    # Não mostrar no ataque, só afeta defesa
                    pass

                # ID 20, 21, 26 - Damage acumulado (passivas específicas)
                elif effect_type == 'damage_accumulation':
                    target_skill = effect.get('skill_type')
                    if target_skill == cache.skill_type:
                        applies_to_this_skill = True
                        accumulated = 0
                        if cache.skill_type == 'attack':
                            accumulated = player.accumulated_attack_bonus
                        elif cache.skill_type == 'power':
                            accumulated = player.accumulated_power_bonus

                        modifier_info = {
                            'type': 'damage_accumulated',
                            'value': accumulated,
                            'description': f"+{accumulated} dano acumulado"
                        }

                # ==== RELÍQUIAS QUE APLICAM A TODOS OS ATAQUES ====

                # ID 4 - Presa Vampírica: Cura 3 HP cada vez que causar dano
                elif effect_type == 'heal_on_damage':
                    applies_to_this_skill = True
                    heal_value = effect.get('value', 3)
                    modifier_info = {
                        'type': 'heal_on_damage',
                        'value': heal_value,
                        'description': f"+{heal_value} HP ao causar dano"
                    }

                # ID 44 - Vampirismo por relíquia (global, não só ataque básico)
                elif effect_type == 'lifesteal_per_relic':
                    applies_to_this_skill = True
                    relic_count = len(active_relics)
                    bonus = relic_count * effect['lifesteal_percent']
                    modifier_info = {
                        'type': 'lifesteal_passive',
                        'value': bonus,
                        'description': f"+{bonus*100:.0f}% vampirismo passivo"
                    }

                # ==== PRIMEIRO ATAQUE DA BATALHA ====

                # ID 15 - Mão de Godofredo: Aplica ataque 2x
                elif effect_type == 'double_first_attack':
                    if player.total_attacks_any_type == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'double_attack',
                            'value': effect['multiplier'],
                            'description': f"Ataque x{effect['multiplier']} (primeiro)"
                        }

                # ID 18 - Primum Nocere: +20% dano no primeiro ataque
                elif effect_type == 'first_attack_bonus':
                    if player.total_attacks_any_type == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'damage_bonus',
                            'value': effect['damage_bonus'],
                            'description': f"+{effect['damage_bonus']*100:.0f}% dano (primeiro)"
                        }

                # ID 19 - Primum Sumere: +5% vampirismo no primeiro ataque
                elif effect_type == 'first_attack_lifesteal':
                    if player.total_attacks_any_type == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'lifesteal_bonus',
                            'value': effect['lifesteal_bonus'],
                            'description': f"+{effect['lifesteal_bonus']*100:.0f}% vampirismo (primeiro)"
                        }

                # ==== TERCEIRO USO / CONSECUTIVO ====

                # ID 11 - Terceiro Suspiro: Cura no 3º Especial
                elif effect_type == 'heal_every_n_specials' and cache.skill_type == 'special':
                    every_n = effect.get('every_n', 3)
                    next_special = player.total_special_uses + 1
                    if next_special % every_n == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'heal_bonus',
                            'value': effect['heal_amount'],
                            'description': f"+{effect['heal_amount']} HP (próximo = {next_special}º especial)"
                        }

                # ID 31 - Trinitas: 3º Poder consecutivo dá energia
                elif effect_type == 'triple_power_reward' and cache.skill_type == 'power':
                    consecutive_count = state.get('consecutive_power_count', 0)
                    required = effect.get('consecutive', 3)
                    if consecutive_count == required - 1:  # próximo completa
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'energy_reward',
                            'value': effect['energy_reward'],
                            'description': f"+{effect['energy_reward']} energia ({consecutive_count+1}º poder consecutivo)"
                        }

                # ==== TODOS OS 4 TIPOS DE ATAQUE ====

                # ID 12 - Omni: Cura quando falta apenas 1 tipo
                elif effect_type == 'heal_all_skills_used':
                    used_in_battle = state.get('used_skills_in_battle', [])
                    required = effect.get('requires_all', [])
                    missing = [skill for skill in required if skill not in used_in_battle]
                    if len(missing) == 1 and missing[0] == cache.skill_type:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'heal_reward',
                            'value': effect['heal_amount'],
                            'description': f"+{effect['heal_amount']} HP (completa 4 tipos)"
                        }

                # ID 30 - Corrente de Pedro: Energia quando falta 1 tipo
                elif effect_type == 'all_attacks_reward':
                    used_in_battle = state.get('used_skills_in_battle', [])
                    required = effect.get('requires_all', [])
                    missing = [skill for skill in required if skill not in used_in_battle]
                    if len(missing) == 1 and missing[0] == cache.skill_type:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'energy_reward',
                            'value': effect['energy_reward'],
                            'description': f"+{effect['energy_reward']} energia (completa 4 tipos)"
                        }

                # ==== A CADA N ATAQUES ====

                # ID 32 - Dízimo: +5 energia no 10º ataque de qualquer tipo
                elif effect_type == 'energy_every_n_attacks':
                    every_n = effect.get('every_n', 10)
                    next_attack = player.total_attacks_any_type + 1
                    if next_attack % every_n == 0:
                        applies_to_this_skill = True
                        modifier_info = {
                            'type': 'energy_reward',
                            'value': effect['energy_reward'],
                            'description': f"+{effect['energy_reward']} energia (próximo = {next_attack}º ataque)"
                        }

                # ID 31 - Trinitas: +5 energia a cada 3 especiais (mostrar quando 2/3)
                elif effect_type in ['special_every_n_in_battle', 'power_every_n_in_battle']:
                    required_skill = effect.get('required_skill')
                    if required_skill == cache.skill_type:
                        every_n = effect.get('every_n', 3)
                        skill_count = state.get('skill_count_battle', 0)
                        next_count = skill_count + 1

                        # Mostrar ícone quando o próximo uso ativar
                        if next_count % every_n == 0:
                            applies_to_this_skill = True
                            skill_name = 'Poder' if required_skill == 'power' else 'Especial'
                            modifier_info = {
                                'type': 'energy_reward',
                                'value': effect['energy_reward'],
                                'description': f"+{effect['energy_reward']} energia (próximo = {next_count}º {skill_name})"
                            }

                # ==== ESPECÍFICAS POR TIPO ====

                # ID 34 - Coroa do Rei Sol: Ouro ao matar com Suprema (sempre mostrar na Suprema)
                elif effect_type == 'gold_on_ultimate_kill' and cache.skill_type == 'ultimate':
                    applies_to_this_skill = True
                    modifier_info = {
                        'type': 'gold_reward',
                        'value': effect['value'],
                        'description': f"+{effect['value']} ouro (ao matar)"
                    }

                # ID 44 - Amuleto Sedento: Cura 1 HP por relíquia no Ataque Básico
                elif effect_type == 'heal_per_relic_on_attack' and cache.skill_type == 'attack':
                    relic_count = len(active_relics)
                    heal_amount = relic_count * effect.get('hp_per_relic', 1)
                    applies_to_this_skill = True
                    modifier_info = {
                        'type': 'heal_per_relic',
                        'value': heal_amount,
                        'description': f"+{heal_amount} HP ({relic_count} relíquias)"
                    }

                # ID 50 - Sangue Coagulado: Dano acumulado no Ataque Básico (por batalha)
                elif effect_type == 'battle_accumulating_damage' and cache.skill_type == 'attack':
                    applies_to_this_skill = True
                    stacks = state.get('battle_stacks', 0)
                    initial = effect.get('initial_bonus', 4)
                    stack_bonus = effect.get('stack_bonus', 2)
                    total_bonus = initial + (stacks * stack_bonus)
                    modifier_info = {
                        'type': 'damage_accumulated',
                        'value': total_bonus,
                        'description': f"+{total_bonus} dano ({initial} + {stacks}x{stack_bonus})"
                    }

                # Outras relíquias que ativam com qualquer ataque
                elif effect_type in ['damage_boost', 'global_lifesteal', 'heal_on_hit']:
                    applies_to_this_skill = True
                    modifier_info = {
                        'type': effect_type,
                        'value': effect.get('value', 0),
                        'description': f"Efeito global: {effect_type}"
                    }

                # Adicionar à lista se aplicável
                if applies_to_this_skill:
                    applicable_relics.append({
                        'relic_id': relic_id,
                        'name': definition['name'],
                        'icon': definition['icon'],
                        'modifier': modifier_info
                    })

            # DEBUG: Log das relíquias aplicáveis para este ataque
            if applicable_relics:
                print(f"   [DEBUG] Skill {skill['name']} ({cache.skill_type}) tem {len(applicable_relics)} relíquias aplicáveis:")
                for rel in applicable_relics:
                    print(f"      - {rel['name']}: {rel['modifier']['description']}")

            skill['applicable_relics'] = applicable_relics

    return result

def get_player_specials(player_id):
    """Retorna as habilidades especiais que o jogador já desbloqueou"""
    player_skills = PlayerSkill.query.filter_by(
        player_id=player_id,
        skill_type="special"
    ).all()
    
    result = []
    for ps in player_skills:
        skill = SpecialSkill.query.get(ps.skill_id)
        if skill:
            time_until_next = ps.get_time_until_next_charge()
            
            result.append({
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "level": 1,
                "current_charges": ps.current_charges,
                "max_charges": skill.max_charges,
                "cooldown_minutes": skill.cooldown_minutes,
                "time_until_next": time_until_next.total_seconds() if time_until_next else None,
                "positive_effect": {
                    "type": skill.positive_effect_type,
                    "value": skill.positive_effect_value
                },
                "negative_effect": {
                    "type": skill.negative_effect_type,
                    "value": skill.negative_effect_value
                } if skill.negative_effect_type else None,
                "duration": {
                    "type": skill.duration_type,
                    "value": skill.duration_value
                },
                "icon": skill.icon
            })
    
    return result

def use_attack_skill(player_id, skill_id, session_points=0):
    """Executa um ataque com a habilidade especificada"""
    from models import Player
    
    player = Player.query.get(player_id)
    if not player:
        return False, "Jogador não encontrado.", {}
    
    player_skill = PlayerSkill.query.filter_by(
        player_id=player_id,
        skill_id=skill_id,
        skill_type="attack"
    ).first()
    
    if not player_skill:
        return False, "Você não possui esta habilidade.", {}
    
    skill = AttackSkill.query.get(skill_id)
    if not skill:
        return False, "Habilidade não encontrada.", {}
    
    if player.mp < skill.mana_cost:
        return False, f"Mana insuficiente. Necessário: {skill.mana_cost}", {}
    
    damage_modifier = skill.damage_modifier
    applied_buffs = []
    
    active_buffs = ActiveBuff.query.filter_by(player_id=player_id).all()
    
    crit_chance_bonus = 0
    crit_damage_bonus = 0
    damage_bonus = 0
    lifesteal_bonus = 0
    
    for buff in active_buffs:
        if buff.is_expired():
            db.session.delete(buff)
            continue
        
        if buff.effect_type == "crit_chance":
            crit_chance_bonus += buff.effect_value
            applied_buffs.append(f"+{buff.effect_value*100:.0f}% Chance de Crítico")
        elif buff.effect_type == "crit_damage":
            crit_damage_bonus += buff.effect_value
            applied_buffs.append(f"+{buff.effect_value*100:.0f}% Dano Crítico")
        elif buff.effect_type == "damage":
            damage_bonus += buff.effect_value
            applied_buffs.append(f"+{buff.effect_value*100:.0f}% Dano")
        elif buff.effect_type == "lifesteal":
            lifesteal_bonus += buff.effect_value
            applied_buffs.append(f"+{buff.effect_value*100:.0f}% Roubo de Vida")
        
        if buff.duration_type == "attacks":
            buff.attacks_remaining -= 1
            if buff.attacks_remaining <= 0:
                db.session.delete(buff)
    
    base_damage = 1.0 + player.damage_bonus
    total_damage_modifier = damage_modifier + damage_bonus
    
    player.mp -= skill.mana_cost
    
    combat_log = CombatLog(
        player_id=player_id,
        skill_id=skill_id,
        skill_type="attack",
        points_used=0,
        mana_used=skill.mana_cost,
        timestamp=datetime.utcnow()
    )
    db.session.add(combat_log)
    db.session.commit()
    
    return True, f"Habilidade {skill.name} utilizada com sucesso!", {
        "damage_modifier": damage_modifier,
        "total_damage_modifier": total_damage_modifier,
        "base_damage": base_damage,
        "crit_chance_bonus": crit_chance_bonus,
        "crit_damage_bonus": crit_damage_bonus,
        "lifesteal_bonus": lifesteal_bonus,
        "mana_used": skill.mana_cost,
        "applied_buffs": applied_buffs
    }

def extend_or_create_buff(player_id, source_skill_id, effect_type, effect_value, duration_type, duration_value, icon=None):
    """
    Estende a duração de um buff existente ou cria um novo buff.
    """
    try:
        print(f"Tentando criar/estender buff: {effect_type} para player {player_id}")
        
        existing_buff = ActiveBuff.query.filter_by(
            player_id=player_id,
            source_skill_id=source_skill_id,
            effect_type=effect_type
        ).first()
        
        if existing_buff:
            print("Atualizando buff existente")
            if duration_type == "time":
                current_end_time = existing_buff.start_time + timedelta(minutes=existing_buff.duration_value)
                now = datetime.utcnow()
                
                if current_end_time > now:
                    new_duration = (current_end_time - now).total_seconds() / 60 + duration_value
                else:
                    new_duration = duration_value
                
                existing_buff.duration_value = int(new_duration)
                existing_buff.start_time = now
                
            elif duration_type == "attacks":
                current_attacks = existing_buff.attacks_remaining or 0
                existing_buff.attacks_remaining = current_attacks + duration_value
            
            if icon is not None:
                existing_buff.icon = icon
            
            return existing_buff
        else:
            print("Criando novo buff")
            buff_data = {
                'player_id': player_id,
                'source_skill_id': source_skill_id,
                'effect_type': effect_type,
                'effect_value': effect_value,
                'duration_type': duration_type,
                'duration_value': duration_value,
                'skill_type': "special",
                'start_time': datetime.utcnow()
            }
            
            if duration_type == "attacks":
                buff_data['attacks_remaining'] = duration_value
            
            if icon is not None:
                buff_data['icon'] = icon
            
            new_buff = ActiveBuff(**buff_data)
            db.session.add(new_buff)
            return new_buff
            
    except Exception as e:
        print(f"ERRO em extend_or_create_buff: {str(e)}")
        return None

def use_special_skill(player_id, skill_id):
    """Ativa uma habilidade especial"""
    print(f"==== INICIANDO use_special_skill(player_id={player_id}, skill_id={skill_id}) ====")
    try:
        from models import Player
        
        player = Player.query.get(player_id)
        if not player:
            return False, "Jogador não encontrado.", {}
        
        player_skill = PlayerSkill.query.filter_by(
            player_id=player_id,
            skill_id=skill_id,
            skill_type="special"
        ).first()
        
        if not player_skill:
            return False, "Você não possui esta habilidade.", {}
        
        skill = SpecialSkill.query.get(skill_id)
        if not skill:
            return False, "Habilidade não encontrada.", {}
        
        if player_skill.current_charges <= 0:
            time_until_next = player_skill.get_time_until_next_charge()
            hours, remainder = divmod(time_until_next.total_seconds(), 3600)
            minutes, seconds = divmod(remainder, 60)
            time_str = ""
            if hours > 0:
                time_str += f"{int(hours)}h "
            if minutes > 0:
                time_str += f"{int(minutes)}min "
            time_str += f"{int(seconds)}s"
            
            return False, f"Sem cargas disponíveis. Próxima carga em: {time_str}", {}
        
        positive_type = skill.positive_effect_type
        positive_value = skill.positive_effect_value
        duration_type = skill.duration_type
        duration_value = skill.duration_value
        skill_icon = skill.icon if hasattr(skill, 'icon') else None
        
        # Processar efeitos comuns
        if positive_type in ["crit_chance", "crit_damage", "damage", "lifesteal", "block_bonus", "damage_reduction"]:
            extend_or_create_buff(
                player_id=player_id,
                source_skill_id=skill_id,
                effect_type=positive_type,
                effect_value=positive_value,
                duration_type=duration_type,
                duration_value=duration_value,
                icon=skill_icon
            )
        
        # Processar efeitos especiais complexos
        elif positive_type == "multi_boost":
            if isinstance(positive_value, str):
                positive_value = json.loads(positive_value)
            
            if isinstance(positive_value, dict):
                for effect_type, effect_value in positive_value.items():
                    extend_or_create_buff(
                        player_id=player_id,
                        source_skill_id=skill_id,
                        effect_type=effect_type,
                        effect_value=effect_value,
                        duration_type=duration_type,
                        duration_value=duration_value,
                        icon=skill_icon
                    )
        
        # Aplicar efeitos negativos
        negative_effects = {}
        if skill.negative_effect_type:
            negative_type = skill.negative_effect_type
            negative_value = skill.negative_effect_value
            
            if negative_type == "hp_cost":
                hp_cost = int(player.max_hp * negative_value)
                player.hp = max(1, player.hp - hp_cost)
                negative_effects["hp_loss"] = hp_cost
            
            elif negative_type == "mp_cost":
                mp_cost = int(player.max_mp * negative_value)
                player.mp = max(0, player.mp - mp_cost)
                negative_effects["mp_loss"] = mp_cost
        
        # Consumir carga
        player_skill.current_charges -= 1
        
        if player_skill.current_charges == 0:
            player_skill.last_charge_time = datetime.utcnow()
        
        # Log de combate
        combat_log = CombatLog(
            player_id=player_id,
            skill_id=skill_id,
            skill_type="special",
            points_used=0,
            mana_used=0,
            timestamp=datetime.utcnow()
        )
        db.session.add(combat_log)
        db.session.commit()
        
        # Formatar mensagem
        duration_msg = ""
        if duration_type == "attacks":
            duration_msg = f"por {duration_value} ataques"
        else:
            if duration_value < 60:
                duration_msg = f"por {duration_value} minutos"
            else:
                hours = duration_value // 60
                minutes = duration_value % 60
                duration_msg = f"por {hours}h{minutes}min"
        
        effect_msg = ""
        if positive_type == "crit_chance":
            effect_msg = f"+{float(positive_value)*100:.0f}% Chance de Crítico"
        elif positive_type == "crit_damage":
            effect_msg = f"+{float(positive_value)*100:.0f}% Dano Crítico"
        elif positive_type == "damage":
            effect_msg = f"+{float(positive_value)*100:.0f}% Dano"
        elif positive_type == "lifesteal":
            effect_msg = f"+{float(positive_value)*100:.0f}% Roubo de Vida"
        
        animation_data = {
            "animation_activate_1": getattr(skill, 'animation_activate_1', None),
            "animation_activate_2": getattr(skill, 'animation_activate_2', None),
            "sound_prep_1": getattr(skill, 'sound_prep_1', None),
            "sound_prep_2": getattr(skill, 'sound_prep_2', None),
            "sound_effect_1": getattr(skill, 'sound_effect_1', None),
            "sound_effect_2": getattr(skill, 'sound_effect_2', None)
        }
        
        return True, f"Habilidade {skill.name} ativada! {effect_msg} {duration_msg}", {
            "positive_effect": {
                "type": positive_type,
                "value": positive_value,
                "icon": skill_icon
            },
            "negative_effects": negative_effects,
            "duration": {
                "type": duration_type,
                "value": duration_value
            },
            "animation": animation_data
        }
    
    except Exception as e:
        print(f"ERRO em use_special_skill: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False, f"Erro interno: {str(e)}", {}

def use_special_skill_turn_based(player_id, skill_id, enemy=None):
    """
    Sistema novo de skills especiais baseado em turnos (para Vlad e futuros personagens)
    Substitui o sistema antigo de cargas e cooldown por tempo

    Args:
        player_id: ID do jogador
        skill_id: ID da skill especial (138-141 para Vlad)
        enemy: Objeto do inimigo (GenericEnemy ou LastBoss) - necessário para skills que afetam o inimigo

    Returns:
        (success: bool, message: str, data: dict)
    """
    print(f"==== use_special_skill_turn_based: player_id={player_id}, skill_id={skill_id} ====")

    try:
        from models import Player, GenericEnemy, LastBoss, PlayerProgress

        player = Player.query.get(player_id)
        if not player:
            return False, "Jogador não encontrado.", {}

        # Obter dados da skill do VLAD_SPECIAL_SKILLS_DATA
        skill_data = next((s for s in VLAD_SPECIAL_SKILLS_DATA if s["id"] == skill_id), None)
        if not skill_data:
            return False, "Skill não encontrada.", {}

        # Verificar se a skill já foi usada no turno atual
        skills_used_this_turn = json.loads(player.special_skills_used_this_turn or '[]')
        if skill_id in skills_used_this_turn:
            return False, f"{skill_data['name']} já foi usada neste turno!", {}

        # Verificar custo de energia
        energy_cost = skill_data.get("energy_cost", 0)
        if player.energy < energy_cost:
            return False, f"Energia insuficiente! (Necessário: {energy_cost}, Disponível: {player.energy})", {}

        # Verificar custo de HP (para Autofagia)
        hp_cost = skill_data.get("hp_cost", 0)
        if hp_cost > 0 and player.hp <= hp_cost:
            return False, f"HP insuficiente! Você precisa de pelo menos {hp_cost + 1} HP.", {}

        # Obter o inimigo atual se não foi passado
        if enemy is None:
            progress = PlayerProgress.query.filter_by(player_id=player_id).first()
            if progress:
                if progress.selected_boss_id:
                    enemy = LastBoss.query.get(progress.selected_boss_id)
                elif progress.selected_enemy_id:
                    enemy = GenericEnemy.query.get(progress.selected_enemy_id)

        # Verificar se precisa de acúmulos de sangue
        if skill_data.get("consumes_blood_stacks", False):
            if player.blood_stacks <= 0:
                return False, f"Não há Sangue Coagulado suficiente!", {}

        # Executar efeitos baseado no tipo de skill
        effect_type = skill_data.get("effect_type")
        result_data = {
            "skill_name": skill_data["name"],
            "skill_id": skill_id,
            "animation_sprite": skill_data.get("animation_sprite"),
            "animation_frames": skill_data.get("animation_frames"),
            "animation_target": skill_data.get("animation_target"),
            "sound_effect": skill_data.get("sound_effect"),
            "effects": []
        }

        # === AUTOFAGIA ===
        if effect_type == "autofagia":
            # Consumir HP
            player.hp -= hp_cost
            result_data["effects"].append(f"Consumiu {hp_cost} HP")

            # Gerar acúmulos de sangue NO PRÓPRIO VLAD
            blood_generated = skill_data.get("blood_stacks_generated", 3)
            player.blood_stacks += blood_generated
            result_data["effects"].append(f"Gerou {blood_generated} Sangue Coagulado")
            result_data["blood_stacks_added"] = blood_generated

            # Adicionar bônus de dano no próximo ataque
            bonus_damage = skill_data.get("next_attack_bonus", 5)
            player.next_attack_bonus_damage += bonus_damage
            result_data["effects"].append(f"+{bonus_damage} de dano no próximo ataque")
            result_data["next_attack_bonus"] = bonus_damage

        # === LÂMINA DE SANGUE ===
        elif effect_type == "blood_blade":
            # Calcular dano baseado nos acúmulos DO VLAD
            damage_per_stack = skill_data.get("damage_per_blood_stack", 2)
            total_damage = player.blood_stacks * damage_per_stack

            # Aplicar dano ao inimigo (se existir)
            if enemy:
                enemy.hp -= total_damage
                enemy.hp = max(0, enemy.hp)

            stacks_consumed = player.blood_stacks
            player.blood_stacks = 0  # Consumir todos os acúmulos DO VLAD

            result_data["effects"].append(f"Causou {total_damage} de dano")
            result_data["effects"].append(f"Consumiu {stacks_consumed} Sangue Coagulado")
            result_data["damage_dealt"] = total_damage
            result_data["blood_stacks_consumed"] = stacks_consumed

            # Se estiver em character-view, criar pendência
            result_data["needs_pending_animation"] = True

        # === BARREIRA DE SANGUE ===
        elif effect_type == "blood_barrier":
            # Calcular barreira baseada nos acúmulos DO VLAD
            barrier_per_stack = skill_data.get("barrier_per_blood_stack", 2)
            total_barrier = player.blood_stacks * barrier_per_stack

            # Adicionar barreira ao jogador
            player.barrier += total_barrier

            stacks_consumed = player.blood_stacks
            player.blood_stacks = 0  # Consumir todos os acúmulos DO VLAD

            result_data["effects"].append(f"Ganhou {total_barrier} de Barreira")
            result_data["effects"].append(f"Consumiu {stacks_consumed} Sangue Coagulado")
            result_data["barrier_gained"] = total_barrier
            result_data["blood_stacks_consumed"] = stacks_consumed

        # === REGENERAÇÃO ===
        elif effect_type == "blood_regeneration":
            # Calcular cura baseada nos acúmulos DO VLAD
            heal_per_stack = skill_data.get("heal_per_blood_stack", 1)
            total_heal = player.blood_stacks * heal_per_stack

            # Curar jogador
            player.hp += total_heal
            player.hp = min(player.hp, player.max_hp)  # Não ultrapassar HP máximo

            stacks_consumed = player.blood_stacks
            player.blood_stacks = 0  # Consumir todos os acúmulos DO VLAD

            result_data["effects"].append(f"Curou {total_heal} HP")
            result_data["effects"].append(f"Consumiu {stacks_consumed} Sangue Coagulado")
            result_data["heal_amount"] = total_heal
            result_data["blood_stacks_consumed"] = stacks_consumed

        # Consumir energia
        player.energy -= energy_cost
        player.energy = max(0, player.energy)

        # Marcar skill como usada no turno atual
        skills_used_this_turn.append(skill_id)
        player.special_skills_used_this_turn = json.dumps(skills_used_this_turn)

        # Salvar alterações
        db.session.commit()

        message = f"{skill_data['name']} ativada! " + " | ".join(result_data["effects"])
        return True, message, result_data

    except Exception as e:
        print(f"ERRO em use_special_skill_turn_based: {str(e)}")
        import traceback
        print(traceback.format_exc())
        db.session.rollback()
        return False, f"Erro interno: {str(e)}", {}

def add_blood_stacks_from_attack(player, enemy, skill_id):
    """
    Adiciona acúmulos de Sangue Coagulado NO PRÓPRIO VLAD quando ele ataca.

    SISTEMA DE ACÚMULOS:
    - Ataque Básico (ID 51 - Garras Sangrentas): +2 acúmulos no Vlad
    - Poder (ID 50 - Energia Escura): +1 acúmulo no Vlad
    - Especial (ID 52 - Abraço da Escuridão): +1 acúmulo no Vlad
    - Suprema (ID 53 - Beijo da Morte): CONSOME todos os acúmulos do Vlad, +2 dano por acúmulo

    Args:
        player: Objeto do jogador (Vlad)
        enemy: Objeto do inimigo (não usado para acúmulos)
        skill_id: ID da skill usada

    Returns:
        dict: Informações sobre os acúmulos (adicionados, consumidos, dano_extra)
    """
    # Só funciona para o Vlad
    if player.character_id != "vlad":
        return {"stacks_added": 0, "stacks_consumed": 0, "extra_damage": 0}

    result = {
        "stacks_added": 0,
        "stacks_consumed": 0,
        "extra_damage": 0
    }

    # ID 51 - Garras Sangrentas (Ataque Básico): +2 acúmulos
    if skill_id == 51:
        player.blood_stacks += 2
        result["stacks_added"] = 2
        print(f"🩸 Garras Sangrentas: +2 Sangue Coagulado (Total: {player.blood_stacks})")

    # ID 50 - Energia Escura (Poder): +1 acúmulo
    elif skill_id == 50:
        player.blood_stacks += 1
        result["stacks_added"] = 1
        print(f"🩸 Energia Escura: +1 Sangue Coagulado (Total: {player.blood_stacks})")

    # ID 52 - Abraço da Escuridão (Especial): +1 acúmulo
    elif skill_id == 52:
        player.blood_stacks += 1
        result["stacks_added"] = 1
        print(f"🩸 Abraço da Escuridão: +1 Sangue Coagulado (Total: {player.blood_stacks})")

    # ID 53 - Beijo da Morte (Suprema): CONSOME todos os acúmulos
    elif skill_id == 53:
        if player.blood_stacks > 0:
            extra_damage = player.blood_stacks * 2  # +2 dano por acúmulo
            result["stacks_consumed"] = player.blood_stacks
            result["extra_damage"] = extra_damage
            print(f"💀 Beijo da Morte: Consumiu {player.blood_stacks} acúmulos → +{extra_damage} de dano!")
            player.blood_stacks = 0

    # Salvar mudanças
    db.session.commit()

    return result

def reset_special_skills_turn(player_id):
    """
    Reseta a lista de skills especiais usadas no turno atual.
    Deve ser chamado ao final do turno do jogador.

    Args:
        player_id: ID do jogador
    """
    from models import Player

    player = Player.query.get(player_id)
    if player:
        player.special_skills_used_this_turn = '[]'
        db.session.commit()
        print(f"✅ Skills especiais resetadas para o próximo turno")

def update_skill_charges(player_id, specific_skill_id=None):
    """Atualiza as cargas das habilidades especiais"""
    query = PlayerSkill.query.filter_by(player_id=player_id, skill_type="special")
    
    if specific_skill_id:
        query = query.filter_by(skill_id=specific_skill_id)
    
    player_skills = query.all()
    now = datetime.utcnow()
    updated_skills = []
    
    for ps in player_skills:
        skill = SpecialSkill.query.get(ps.skill_id)
        if not skill:
            continue
        
        max_charges = skill.max_charges
        
        if ps.current_charges >= max_charges:
            continue
        
        cooldown_minutes = skill.cooldown_minutes
        elapsed = now - ps.last_charge_time
        elapsed_minutes = elapsed.total_seconds() / 60
        charges_to_add = int(elapsed_minutes / cooldown_minutes)
        
        if charges_to_add > 0:
            old_charges = ps.current_charges
            ps.current_charges = min(ps.current_charges + charges_to_add, max_charges)
            
            time_used = timedelta(minutes=charges_to_add * cooldown_minutes)
            ps.last_charge_time += time_used
            
            updated_skills.append({
                "skill_id": ps.skill_id,
                "skill_name": skill.name,
                "old_charges": old_charges,
                "new_charges": ps.current_charges
            })
    
    if updated_skills:
        db.session.commit()
    
    return updated_skills

def update_active_buffs(player_id):
    """Atualiza buffs ativos e remove os expirados"""
    active_buffs = ActiveBuff.query.filter_by(player_id=player_id).all()
    removed_buffs = []
    
    for buff in active_buffs:
        if buff.is_expired():
            removed_buffs.append({
                "effect_type": buff.effect_type,
                "effect_value": buff.effect_value
            })
            db.session.delete(buff)
    
    if removed_buffs:
        db.session.commit()
    
    return removed_buffs

def apply_time_based_effects(player_id):
    """Aplica efeitos baseados na hora do dia"""
    from models import Player
    
    player = Player.query.get(player_id)
    if not player:
        return []
    
    current_hour = datetime.now().hour
    applied_effects = []
    
    last_check = getattr(player, 'last_time_check', None)
    today = datetime.now().date()
    
    if not last_check or last_check.date() < today:
        last_check = datetime.combine(today, datetime.min.time())
    
    # Futuro: adicionar efeitos específicos de personagens aqui
    
    player.last_time_check = datetime.now()
    db.session.commit()
    
    return applied_effects

def apply_daily_effects(player_id):
    """Aplica efeitos diários"""
    from models import Player
    
    player = Player.query.get(player_id)
    if not player:
        return []
    
    today = datetime.now().date()
    last_daily = getattr(player, 'last_daily_effects', None)
    
    if last_daily and last_daily.date() == today:
        return []
    
    applied_effects = []
    
    player.last_daily_effects = datetime.now()
    db.session.commit()
    
    return applied_effects

def fill_all_special_charges(player_id):
    """Preenche todas as cargas de habilidades especiais do jogador"""
    player_skills = PlayerSkill.query.filter_by(
        player_id=player_id,
        skill_type="special"
    ).all()
    
    filled_skills = []
    
    for ps in player_skills:
        skill = SpecialSkill.query.get(ps.skill_id)
        if not skill:
            continue
        
        max_charges = skill.max_charges
        old_charges = ps.current_charges
        ps.current_charges = max_charges
        
        filled_skills.append({
            "skill_id": ps.skill_id,
            "skill_name": skill.name,
            "old_charges": old_charges,
            "new_charges": ps.current_charges
        })
    
    if filled_skills:
        db.session.commit()
    
    return filled_skills

# =====================================
# FUNÇÕES AUXILIARES
# =====================================

def get_max_charges(skill_id):
    """Retorna o número máximo de cargas para uma habilidade especial"""
    skill = SpecialSkill.query.get(skill_id)
    if not skill:
        return 1
    return skill.max_charges

def format_time_remaining(target_time):
    """Formata o tempo restante até um momento específico"""
    now = datetime.utcnow()
    
    if target_time <= now:
        return "Pronto"
    
    delta = target_time - now
    hours, remainder = divmod(delta.total_seconds(), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    if hours > 0:
        return f"{int(hours)}h {int(minutes)}min"
    elif minutes > 0:
        return f"{int(minutes)}min {int(seconds)}s"
    else:
        return f"{int(seconds)}s"

# Funções process_skills não são mais usadas no novo sistema
# Mas mantidas para compatibilidade se necessário
def process_skills(skills):
    """DEPRECATED - Mantido para compatibilidade"""
    return skills

def process_special_skills(skills):
    """DEPRECATED - Mantido para compatibilidade"""
    return skills