import math
import os
import csv
import re
import random
import unicodedata
import html
import io
from datetime import datetime, timedelta, timezone
import json

# Configuração do Flask e SQLAlchemy
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text, or_, func
from database import db
from routes.cards import flash_gamification, get_exp_for_next_level
from routes.talents import talents_bp, initialize_player_talents_simple
from routes.talents import talents_data
from routes.cards import cards_bp
from routes.items import items_bp, refresh_shop, initialize_shop, refresh_shop_force
try:
    from routes.battle import battle_bp, check_login_rewards
    print("✅ Blueprint battle importado com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar battle blueprint: {e}")
    import traceback
    traceback.print_exc()
    battle_bp = None

# INSERIR essas linhas nas importações (junto com os outros imports de rotas)
from routes.sprite_organizer import sprite_organizer_bp

# Configuração do matplotlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Importar formulários e filtros
from filters import register_filters
from filters import get_cards_recursive, count_cards_recursive

# IMPORTANTE: Importe TODOS os modelos
from models import Deck, Card, Tag, Player, Talent, PlayerRunBuff
from models import Boss, DailyStats, PlayerTalent, AppliedTalentEffect
from models import Item, PlayerItem, Equipment, ShopQuote, BestiaryEntry, PlayerAchievement

# Importar funções de game
from game_formulas import (
    calculate_strength_damage,
    calculate_resistance_block,
    calculate_critical_chance,
    calculate_critical_bonus,
    calculate_dodge_chance
)

# Importar classes de jogo
from characters import (
    AttackSkill, SpecialSkill, PlayerSkill, ActiveBuff, CombatLog,
    use_attack_skill, use_special_skill,
    update_skill_charges, update_active_buffs,
    apply_time_based_effects, apply_daily_effects
)

from characters import choose_character, get_character_data, CHARACTERS
from skill_effects import apply_positive_effect, apply_negative_effect

# Criar e configurar a aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'sua_chave_secreta_aqui'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flashcards.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.permanent_session_lifetime = timedelta(days=7)

# Registrar filtros e inicializar o banco de dados
register_filters(app)
db.init_app(app)

app.jinja_env.globals.update(datetime=datetime)
app.jinja_env.globals.update(timezone=timezone)

with app.app_context():
    db.create_all()
    print("Tabelas criadas com sucesso")
    
    # Inicializar skills do Vlad
    from characters import init_vlad_skills
    # ✅ CORREÇÃO: Inicializar skills do Vlad de forma segura
    try:
        # Importar apenas quando necessário para evitar import circular
        from characters import init_vlad_skills
        
        # Chamar dentro do contexto da aplicação
        with app.app_context():
            success = init_vlad_skills()
            if success:
                print("✅ Skills do Vlad inicializadas com sucesso!")
            else:
                print("⚠️ Problema ao inicializar skills do Vlad")
    except Exception as e:
        print(f"❌ Erro ao inicializar skills do Vlad: {e}")
        # Não interromper a execução por causa disso
        pass

# Registrar blueprints APÓS inicializar o banco de dados

app.register_blueprint(cards_bp)
app.register_blueprint(talents_bp)
app.register_blueprint(items_bp)
# Registrar blueprints com verificação de erro
try:
    from routes.battle import battle_bp
    if battle_bp is not None:
        app.register_blueprint(battle_bp)
        print("✅ Battle blueprint registrado")
    else:
        print("❌ Battle blueprint é None - verificar imports")
except Exception as e:
    print(f"❌ Erro ao registrar battle blueprint: {e}")
app.register_blueprint(sprite_organizer_bp)

##############################################
#                 MODELOS
##############################################

# Adicione estas funções de cálculo no início do seu app.py, antes dos modelos
import math

def calculate_effective_resistance(player):
    """
    Calcula a resistência efetiva do jogador, incluindo bônus de equipamentos
    """
    base_resistance = player.resistance
    equip_resistance = 0
    
    # Adicionar bônus de resistência baseado nos equipamentos
    if player.equipped_helmet == 'open-helmet':
        equip_resistance += 5
    elif player.equipped_helmet == 'close-helmet':
        equip_resistance += 10
    elif player.equipped_helmet == 'touca':
        equip_resistance += 5
    
    # Adicionar mais equipamentos conforme necessário
    
    return base_resistance + equip_resistance

# Após definir todas as classes, adicione este relacionamento ao modelo Player
player_skills = db.relationship('PlayerSkill', backref='player', lazy=True)

import random
from game_formulas import calculate_dodge_chance
import math
import random
from datetime import datetime

# ----- FUNÇÕES DE CÁLCULO DO SISTEMA DE ATRIBUTOS -----

def calculate_vitality_regeneration(vitality):
    """Calcula a quantidade de revisões necessárias para regenerar 1 HP."""
    if vitality <= 0:
        return 500
    return max(20, 500 - (vitality - 1) * (480 / 99))

def calculate_luck_bonus(luck, rarity):
    """Calcula o bônus de probabilidade baseado na sorte e raridade do item."""
    if luck <= 0:
        return 0.0
        
    if rarity == "Raro":
        return luck * 0.15
    elif rarity == "Épico":
        return luck * 0.1
    elif rarity == "Lendário":
        return luck * 0.08
    elif rarity == "Heroico":
        return luck * 0.05
    else:  # Comum ou Especial
        return 0.0

def calculate_max_hp(vitality):
    return 80

def get_exp_for_next_level(level):
    """Calcula a experiência necessária para o próximo nível"""
    return int(100 * (level ** 1.5))

# ----- MODELOS DE BANCO DE DADOS -----

def add_attribute_point(self, attribute, points=1):
    """Adiciona pontos a um atributo específico"""
    if self.attribute_points < points:
        return False, "Pontos de atributo insuficientes."
    
    if attribute == "força" or attribute == "strength":
        if self.strength + points > 100:
            return False, "Não é possível exceder 100 pontos em um atributo."
        self.strength += points
    elif attribute == "vitalidade" or attribute == "vitality":
        if self.vitality + points > 100:
            return False, "Não é possível exceder 100 pontos em um atributo."
        self.vitality += points
    elif attribute == "resistência" or attribute == "resistance":
        if self.resistance + points > 100:
            return False, "Não é possível exceder 100 pontos em um atributo."
        self.resistance += points
    elif attribute == "sorte" or attribute == "luck":
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

# ----- ROTAS -----

@app.route('/gamification/attributes')
def attributes():
    player = Player.query.first()
    
    if not player:
        flash("Personagem não encontrado.", "danger")
        return redirect(url_for('battle.gamification'))
    
    # Buscar as habilidades do jogador ou criar uma lista vazia se não houver
    skills = {
        'attack_skills': [],
        'special_skills': []
    }
        
    return render_template(
        'gamification/attributes.html', 
        player=player, 
        skills=skills,
        calculate_strength_damage=calculate_strength_damage,
        calculate_vitality_regeneration=calculate_vitality_regeneration,
        calculate_resistance_block=calculate_resistance_block,
        calculate_max_hp=calculate_max_hp,
        get_exp_for_next_level=get_exp_for_next_level
    )

@app.route('/gamification/add_talent_points', methods=['POST'])
def add_talent_points():
    """Adiciona pontos de talento para testes."""
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})
    
    # Adicionar 5 pontos de talento (ou a quantidade desejada)
    points_to_add = 5
    player.talent_points += points_to_add
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': f'Adicionados {points_to_add} pontos de talento', 
        'total_points': player.talent_points
    })

@app.route('/choose-character', methods=['GET', 'POST'])
def choose_character_route():
    """Tela de seleção de personagem"""
    if request.method == 'GET':
        # Verificar se veio da tela de morte
        from_death = request.args.get('from', '')
        return render_template('gamification/choose_character.html', 
                             characters=CHARACTERS, 
                             from_death=(from_death == 'death'))
    
    elif request.method == 'POST':
        character_id = request.form.get('character_id')
        from_death = request.form.get('from_death', 'false')
        
        if not character_id:
            flash("Personagem inválido.", "danger")
            return redirect(url_for('choose_character_route'))
        
        # Buscar ou criar jogador
        player = Player.query.first()
        if not player:
            # CRIAR JOGADOR COM CAMPOS CORRETOS
            player = Player(
                name="Jogador",
                email="jogador@exemplo.com",
                password="senha_hash",
                character_id=None,
                level=1,
                experience=0.0,
                hp=80,
                max_hp=80,
                energy=10,
                max_energy=10,
                strength=0,
                vitality=0,
                resistance=0,
                luck=0,
                attribute_points=0,
                skill_points=0,
                # NOVOS CAMPOS DE RUN
                run_crystals_gained=0,
                run_hourglasses_gained=0,
                run_gold_gained=0,
                run_bosses_defeated=0,
                run_start_timestamp=datetime.utcnow()
            )
            db.session.add(player)
            db.session.commit()

            # LIMPAR SESSÃO AO CRIAR NOVO PLAYER
            session.clear()
            print("🧹 Sessão limpa - novo player criado")
        
        # Se veio da morte, resetar a run ANTES de escolher personagem
        if from_death == 'true':
            # LIMPAR SESSÃO PRIMEIRO
            session.clear()
            print("🧹 Sessão limpa - veio da morte")
            
            # Garantir que player existe antes do reset
            if not player:
                flash("Erro: jogador não encontrado", "danger")
                return redirect(url_for('choose_character_route'))
            
            # Recarregar player para garantir dados atualizados
            db.session.refresh(player)

            from routes.battle import reset_player_run
            success, message = reset_player_run(player.id)
            if not success:
                flash(f'Erro ao resetar run: {message}', "danger")
                return redirect(url_for('choose_character_route'))

            # ===== CORREÇÃO: NÃO RESETAR COM player.max_hp =====
            # reset_player_run já força HP e energia para valores base (80/10)
            # Não devemos usar player.max_hp/player.max_energy aqui porque
            # podem conter valores modificados de relíquias desativadas
            # ====================================================

            # Recarregar player para garantir valores corretos após reset
            db.session.refresh(player)
            print(f"❤️ HP após reset: {player.hp}/{player.max_hp}")
            print(f"⚡ Energia após reset: {player.energy}/{player.max_energy}")
            
            # LIMPAR PROGRESSO E DESATIVAR INIMIGO/BOSS
            from models import PlayerProgress, GenericEnemy, LastBoss
            progress = PlayerProgress.query.filter_by(player_id=player.id).first()
            if progress:
                # DESATIVAR INIMIGO GENÉRICO antes de limpar referência
                if progress.selected_enemy_id:
                    enemy = GenericEnemy.query.get(progress.selected_enemy_id)
                    if enemy:
                        enemy.is_active = False
                        db.session.commit()
                        print(f"🗑️ Inimigo {enemy.name} desativado")
                
                # DESATIVAR BOSS antes de limpar referência
                if progress.selected_boss_id:
                    boss = LastBoss.query.get(progress.selected_boss_id)
                    if boss:
                        boss.is_active = False
                        boss.current_hp = boss.max_hp  # Resetar HP do boss
                        db.session.commit()
                        print(f"🗑️ Boss {boss.name} desativado e HP resetado")
                
                # Limpar referências
                progress.selected_enemy_id = None
                progress.selected_boss_id = None
                db.session.commit()
                print("🗑️ Referências de inimigo/boss limpas")
            
            # LIMPAR ESTADO DE BATALHA DO JOGADOR
            player.is_battling = False
            db.session.commit()
            print("🗑️ Estado is_battling limpo")
            
            # INVALIDAR CACHE
            from routes.battle_cache import invalidate_cache
            invalidate_cache(player.id)
            print("🗑️ Cache invalidado")
            
            print(f"🔄 Run resetada completamente para jogador {player.id}")
        
        # Usar a função existente para escolher personagem
        success, message = choose_character(player.id, character_id)
        if success:
            # ===== CORREÇÃO: FORÇAR HP/ENERGIA BASE =====
            # Garantir que usamos valores base corretos, não player.max_hp
            player = Player.query.get(player.id)
            if player:
                player.hp = 80  # Valor base fixo
                player.max_hp = 80  # Garantir que max_hp também está correto
                player.energy = 10  # Valor base fixo
                player.max_energy = 10  # Garantir que max_energy também está correto
                db.session.commit()
                print(f"❤️ HP forçado para valores base: {player.hp}/{player.max_hp}")
                print(f"⚡ Energia forçada para valores base: {player.energy}/{player.max_energy}")
            # ============================================
            # ===== ADICIONAR AQUI - MARCAR POP-UP DE RELÍQUIA =====
            session['pending_relic_selection'] = {
                'count': 1,
                'context': 'first_relic'
            }
            print("🗡️ Pop-up de primeira relíquia marcado na sessão")
            # ======================================================
            
            flash_gamification(message, notification_only=True)
            return redirect(url_for('battle.gamification'))
        else:
            flash(message, "warning")
            return redirect(url_for('choose_character_route'))

# ----- FUNÇÃO PARA INICIALIZAR HABILIDADES -----

def initialize_game_data():
    """Inicializa dados base do jogo"""
    
    # NÃO CRIAR JOGADOR AUTOMATICAMENTE
    # O jogador será criado apenas na escolha de personagem
    
    print("Dados do jogo inicializados com sucesso!")
    
    # Inicializar a loja
    refresh_shop()
    
    # Verificar se há itens na loja
    shop_items_count = Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).count()
    if shop_items_count == 0:
        print("Nenhum item encontrado na loja. Inicializando loja...")
        refresh_shop_force()

@app.before_request
def check_player_activity():
    """Check player activity and reduce HP if inactive."""
    # Skip for static files and non-GET requests
    if request.endpoint and (request.endpoint.startswith('static') or request.method != 'GET'):
        return
    
    # Skip for certain routes
    if request.endpoint in ['battle.gamification', 'battle.battle', 'shop', 'game_profile', 'bestiary', 'attributes', 'game_inventory']:
        return
    
    player = Player.query.first()
    if player:
        # Usar datetime sem timezone para manter consistência com o banco de dados
        now = datetime.utcnow()
        last_active = player.last_active or now
        
        # [código existente]
        
        # Verificar baú de recompensa (adicionado)
        # Apenas uma vez por dia
        today = datetime.now(timezone.utc).date()
        if session.get('last_reward_check') != today.isoformat():
            check_login_rewards(player)
            session['last_reward_check'] = today.isoformat()

# Add this to the end of your app.py file to initialize the game data
@app.before_request
def check_player_activity():
    """Check player activity and reduce HP if inactive."""
    # Skip for static files and non-GET requests
    if request.endpoint and (request.endpoint.startswith('static') or request.method != 'GET'):
        return
    
    # Skip for certain routes
    if request.endpoint in ['battle.gamification', 'battle.battle', 'shop', 'game_profile', 'bestiary', 'attributes', 'game_inventory']:
        return
    
    player = Player.query.first()
    if player:
        # Usar datetime sem timezone para manter consistência com o banco de dados
        now = datetime.utcnow()
        last_active = player.last_active or now
        
        # Verificar se last_active tem timezone e now não (ou vice-versa)
        now_has_tz = hasattr(now, 'tzinfo') and now.tzinfo is not None
        last_active_has_tz = hasattr(last_active, 'tzinfo') and last_active.tzinfo is not None
        
        # Se houver inconsistência, converter para o mesmo tipo
        if now_has_tz and not last_active_has_tz:
            # Converter last_active para ter timezone
            from datetime import timezone
            last_active = last_active.replace(tzinfo=timezone.utc)
        elif not now_has_tz and last_active_has_tz:
            # Remover timezone info de last_active
            last_active = last_active.replace(tzinfo=None)
        
        try:
            # Calculate days since last activity
            days_inactive = (now - last_active).days
            
            if days_inactive > 0:
                # Reduce HP for each day inactive, but never below 1
                hp_reduction = min(days_inactive, player.hp - 1)
                if hp_reduction > 0:
                    player.hp -= hp_reduction
                    flash(f"Você perdeu {hp_reduction} pontos de HP por ficar {days_inactive} dias sem estudar!", "warning")
                
                # Update last active time
                player.last_active = now
                
                db.session.commit()
        except TypeError as e:
            # Se ainda houver erro, registrar para depuração mas não interromper a execução
            print(f"Erro ao calcular inatividade: {e}")
            print(f"now: {now}, tipo: {type(now)}, tzinfo: {getattr(now, 'tzinfo', None)}")
            print(f"last_active: {last_active}, tipo: {type(last_active)}, tzinfo: {getattr(last_active, 'tzinfo', None)}")

@app.before_request
def check_shop_refresh_hook():
    """Hook para verificar se a loja precisa ser atualizada"""
    from routes.items import check_shop_refresh
    check_shop_refresh()


@app.route('/reset_player_attributes')
def reset_player_attributes():
    """Reinicia os atributos do personagem para poder testar os talentos novamente"""
    try:
        player = Player.query.first()
        if not player:
            return "Jogador não encontrado!"
        
        # Salvar estado anterior
        old_level = player.level
        old_xp = player.experience
        old_crystals = player.crystals
        
        # Reiniciar atributos básicos
        player.strength = 0
        player.vitality = 0
        player.resistance = 0
        player.luck = 0
        
        # Reiniciar valores derivados
        player.max_hp = 100
        player.hp = 100
        player.damage_bonus = 0.0
        player.damage_multiplier = 1.0
        
        # Reiniciar bônus de crítico
        if hasattr(player, 'critical_chance_bonus'):
            player.critical_chance_bonus = 0
        if hasattr(player, 'critical_damage_bonus'):
            player.critical_damage_bonus = 0
        
        # Adicionar alguns pontos de talento para testar
        player.talent_points = 20
        
        # Remover todos os talentos do jogador
        PlayerTalent.query.filter_by(player_id=player.id).delete()
        
        # Manter classe, nível e outros progressos
        player.level = old_level
        player.experience = old_xp
        player.crystals = old_crystals
        
        db.session.commit()
        
        return """
        <html>
        <head>
            <title>Atributos Reiniciados</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .box { background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px auto; max-width: 600px; }
                .success { color: #28a745; font-weight: bold; }
                .button { background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2 class="success">Atributos do personagem reiniciados!</h2>
                <p>Todos os atributos foram zerados e os talentos foram removidos.</p>
                <p>Você recebeu 20 pontos de talento para testar os efeitos novamente.</p>
                <p>O nível, classe e outras progressões foram mantidos.</p>
                <a href="/gamification/talents" class="button">Ir para Talentos</a>
            </div>
        </body>
        </html>
        """
    except Exception as e:
        db.session.rollback()
        return f"Erro ao reiniciar atributos: {str(e)}"

@app.route('/dev_level_up/<int:levels>', methods=['POST'])
def dev_level_up(levels):
    """
    ROTA TEMPORÁRIA PARA DESENVOLVIMENTO.
    Aumenta o nível do jogador artificialmente para testes.
    REMOVER EM PRODUÇÃO.
    """
    if levels <= 0 or levels > 50:
        flash("Número de níveis inválido", "danger")
        return redirect(request.referrer or url_for('battle.gamification'))
        
    player = Player.query.first()
    if not player:
        flash("Jogador não encontrado", "danger")
        return redirect(request.referrer or url_for('battle.gamification'))
    
    # Atualizar o nível e atributos
    old_level = player.level
    player.level += levels
    player.attribute_points += (levels * 2)  # 2 pontos por nível
    player.skill_points += levels  # Adicionar pontos de habilidade diretamente
    
    # Zerar experiência atual
    player.experience = 0
    
    db.session.commit()
    
    flash(f"[DEV MODE] Nível aumentado de {old_level} para {player.level}. Adicionados {levels * 2} pontos de atributo e {levels} pontos de habilidade.", "warning")
    return redirect(request.referrer or url_for('attributes'))

from flask import request, redirect, url_for, flash
# — verifique se você já importou Player, CharacterClass e sua função choose_class acima —

@app.route('/gamification/update_attribute', methods=['POST'])
def update_attribute():
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'})
    
    data = request.json
    attribute = data.get('attribute')
    value = data.get('value')
    
    if not attribute:
        return jsonify({'success': False, 'message': 'Atributo não especificado'})
    
    # Calcular quantos pontos adicionar
    current_value = 0
    if attribute == 'strength':
        current_value = player.strength
    elif attribute == 'vitality':
        current_value = player.vitality
    elif attribute == 'resistance':
        current_value = player.resistance
    elif attribute == 'luck':
        current_value = player.luck
    else:
        return jsonify({'success': False, 'message': 'Atributo inválido'})
    
    # Verificar que estamos adicionando apenas 1 ponto
    points_to_add = 1
    if value and current_value + points_to_add != value:
        return jsonify({'success': False, 'message': 'Incremento inválido'})
    
    # Utilizar o método já existente para adicionar pontos
    success, message = player.add_attribute_point(attribute, points_to_add)
    
    # ADICIONAR AQUI: Retornar resultado em formato JSON
    if success:
        db.session.commit()
        # ─── notificar hub sobre o upgrade de atributo ───
        flash_gamification(message, notification_only=True)
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'message': message})

@app.route('/gamification/profile')
def game_profile():
    """Player profile with achievements and stats."""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))
    
    achievements = PlayerAchievement.query.filter_by(player_id=player.id).all()
    
    # Get player's inventory
    inventory = PlayerItem.query.filter_by(player_id=player.id).all()
    
    # Get current boss for profile display
    current_boss = db.session.get(Boss, player.current_boss_id)
    
    return render_template('gamification/profile.html', 
                          player=player,
                          calculate_strength_damage=calculate_strength_damage,
                          calculate_resistance_block=calculate_resistance_block,
                          calculate_critical_chance=calculate_critical_chance,
                          calculate_critical_bonus=calculate_critical_bonus,
                          calculate_dodge_chance=calculate_dodge_chance, 
                          achievements=achievements,
                          inventory=inventory,
                          boss=current_boss,
                          get_exp_for_next_level=get_exp_for_next_level)


# Rota para adicionar pontos de atributo
@app.route('/gamification/add_attribute', methods=['POST'])
def add_attribute():
    # Obter o jogador atual
    player = Player.query.first()

    if not player:
        flash("Personagem não encontrado.", "danger")
        return redirect(url_for('battle.gamification'))

    # Obter atributo e quantidade de pontos
    attribute = request.form.get('attribute')
    points = int(request.form.get('points', 1))

    # Validar pontos
    if points < 1 or points > player.attribute_points:
        flash("Quantidade de pontos inválida.", "danger")
        return redirect(url_for('attributes'))

    # Adicionar pontos ao atributo
    success, message = player.add_attribute_point(attribute, points)

    if success:
        # ADICIONAR ESTE BLOCO para enviar para o sistema de notificações do Hub
        if 'pending_notifications' not in session:
            session['pending_notifications'] = []
        session['pending_notifications'].append(message)
        session.modified = True # Marcar sessão como modificada para garantir que seja salva

        # REMOVER ou COMENTAR a linha abaixo (flash tradicional para sucesso):
        # flash(message, "success") # <--- REMOVER/COMENTAR ESTA LINHA

    else:
        # Manter flash tradicional para mensagens de erro
        flash(message, "danger")

    # Salvar alterações
    db.session.commit()

    # Adicionar no final da função, antes do return
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('Content-Type') == 'application/x-www-form-urlencoded':
        return jsonify({'success': True})

    return redirect(url_for('attributes'))

# === DEBUG ONLY — lista completa de skills =========================
@app.route("/gamification/debug/all_skills")
def debug_all_skills():
    """
    Devolve todas as AttackSkill em formato simplificado.
    ⚠️  Mantenha este endpoint apenas em ambiente de desenvolvimento!
    """
    from characters import AttackSkill
    import json

    skills = AttackSkill.query.all()

    def to_client(skill):
        return {
            "id":           skill.id,
            "name":         skill.name,
            "points_cost":  skill.points_cost,
            "damage_modifier": (
                json.loads(skill.damage_modifier)
                if isinstance(skill.damage_modifier, str) else
                skill.damage_modifier or 1
            ),
            "animation_fx_a": skill.animation_fx_a,
            "animation_fx_b": skill.animation_fx_b,
        }

    return {"skills": [to_client(s) for s in skills]}, 200


# Função para processar a derrota de um boss
def process_boss_defeat(player, boss):
    """
    Processa a derrota de um boss, dando recompensas ao jogador
    """
    # Adicionar o boss ao bestiário (se ainda não estiver)
    add_boss_to_bestiary(player.id, boss.id)
    
    # Incrementar o boss atual do jogador
    player.current_boss_id += 1
    
    # Recompensas básicas
    min_xp = 20 + (boss.id * 5)
    max_xp = 25 + (boss.id * 5)
    exp_reward = random.randint(min_xp, max_xp)

    if not took_damage and player.perfect_exp_bonus > 0:
        bonus = int(exp_reward * (player.perfect_exp_bonus/100))
        exp_reward += bonus
        flash(f"✅ EXP Impecável: +{player.perfect_exp_bonus:.0f}% → Total: {exp_reward} XP", "battle.gamification")
    
    min_crystals = 20 + (boss.id * 5) 
    max_crystals = 25 + (boss.id * 5)
    crystal_reward = random.randint(min_crystals, max_crystals)
    
    # Aplicar recompensas
    player.experience += exp_reward
    player.crystals += crystal_reward

    # Adicionar ponto de talento
    player.talent_points += 1
    
    # Flash message para mostrar ao jogador
    flash(f"Boss derrotado! Você ganhou {exp_reward} XP, {crystal_reward} Cristais de Memória e 1 Ponto de Talento!", "battle.gamification")
    
    # Verificar se o jogador subiu de nível
    check_level_up(player)
    
    # Salvar no banco de dados
    db.session.commit()
    
    return {
        'exp_reward': exp_reward,
        'crystal_reward': crystal_reward
    }

@app.route('/gamification/inventory')
def game_inventory():
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))
    
    # Obter os equipamentos do jogador
    inventory = PlayerItem.query.filter_by(player_id=player.id).all()
    print(f"game_inventory: Inventário do jogador: {inventory}")  # DEBUG
    
    # Obter todos os equipamentos do banco de dados
    equipments = Equipment.query.all()
    print(f"game_inventory: Todos os equipamentos: {equipments}")  # DEBUG
    
    # Obter boss atual para exibição no layout
    current_boss = db.session.get(Boss, player.current_boss_id)
    
    return render_template('gamification/inventory.html', 
                          player=player, 
                          inventory=inventory,
                          boss=current_boss,
                          equipments=equipments,
                          calculate_resistance_block=calculate_resistance_block,
                          calculate_effective_resistance=calculate_effective_resistance,
                          get_exp_for_next_level=get_exp_for_next_level)


@app.route('/store_notification', methods=['POST'])
def store_notification():
    """Armazena uma notificação na sessão para ser exibida no hub"""
    data = request.get_json()
    message = data.get('message')
    
    if message:
        print(f"Armazenando notificação na sessão: {message}")
        if 'pending_notifications' not in session:
            session['pending_notifications'] = []
        session['pending_notifications'].append(message)
        # Forçar sessão a salvar mudanças
        session.modified = True
    
    return jsonify({'success': True, 'message': 'Notificação armazenada com sucesso'})


@app.route('/gamification/bestiary')
def bestiary():
    """Bestiary of defeated bosses."""
    player = Player.query.first()
    if not player:
        return redirect(url_for('battle.gamification'))
    
    defeated_bosses = Boss.query.filter_by(defeated=True).all()
    
    return render_template('gamification/bestiary.html', 
                          player=player, 
                          bosses=defeated_bosses,
                          get_exp_for_next_level=get_exp_for_next_level)

# Adicionar rota para equipar/desequipar itens
@app.route('/gamification/equip_item', methods=['POST'])
def equip_item_route():
    player = Player.query.first()
    if not player:
        return jsonify({'success': False, 'message': 'Jogador não encontrado'}), 404
        
    item_type = request.form.get('type')
    item_id = request.form.get('item')
    
    print(f"equip_item_route: item_type={item_type}, item_id={item_id}")  # DEBUG
    
    equipment = None  # Inicialize equipment como None
    if item_id != '0':  # Verifique se item_id não é '0'
        equipment = Equipment.query.get(item_id)
        if not equipment:
            print(f"equip_item_route: Equipamento com id={item_id} NÃO encontrado!")
            return jsonify({'success': False, 'message': 'Equipamento não encontrado'}), 404
        print(f"equip_item_route: Equipamento encontrado: {equipment.name}")
    else:
        print("equip_item_route: Nenhum equipamento selecionado.")  # DEBUG
    
    print(f"equip_item_route: Equipamento encontrado: {equipment.name}")  # DEBUG
    
    # Desequipar o item atual (se houver) -  IMPORTANTE para evitar inconsistências
    if item_type == 'helmet':
        player.current_helmet_id = None
    elif item_type == 'eyes':
        player.current_eyes_id = None
    elif item_type == 'armor':
        player.current_armor_id = None
    elif item_type == 'sword':
        player.current_sword_id = None
    elif item_type == 'soulgem':
        player.current_soulgem_id = None
    elif item_type == 'hair':
        player.current_hair_id = None
    else:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Tipo de equipamento inválido'}), 400
        else:
            flash('Tipo de equipamento inválido', 'error')
            return redirect(url_for('game_inventory'))
    
# Atribuir o novo equipamento
    if item_type == 'helmet':
        player.current_helmet_id = equipment.id if equipment else None  # Usar None se equipment for None
    elif item_type == 'eyes':
        player.current_eyes_id = equipment.id if equipment else None
    elif item_type == 'armor':
        player.current_armor_id = equipment.id if equipment else None
    elif item_type == 'sword':
        player.current_sword_id = equipment.id if equipment else None
    elif item_type == 'soulgem':
        player.current_soulgem_id = equipment.id if equipment else None
    elif item_type == 'hair':
        player.current_hair_id = equipment.id if equipment else None
    
    # Salvar as alterações
    try:
        db.session.commit()
        
        # Verificar se é uma requisição AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'success': True,
                'message': 'Item equipado com sucesso!',
                'item_type': item_type,
                'item_id': item_id
            })
        else:
            # Para requisições normais, redirecionar com mensagem flash
            flash('Item equipado com sucesso!', 'success')
            return redirect(url_for('game_inventory'))
            
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao equipar item: {e}")
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': f'Erro ao equipar item: {str(e)}'}), 500
        else:
            flash(f'Erro ao equipar item: {str(e)}', 'error')
            return redirect(url_for('game_inventory'))


@app.route('/definir_cristais/<int:quantidade>')
def definir_cristais(quantidade):
    """Rota para definir manualmente a quantidade de cristais do jogador."""
    try:
        # Verificar se o jogador existe
        player = Player.query.first()
        
        if player:
            # Atualizar cristais do jogador existente
            player.crystais = quantidade
            db.session.commit()
            mensagem = f"Jogador existente atualizado para {quantidade} cristais!"
        else:
            # Criar um novo jogador com os cristais especificados
            novo_player = Player(
                name="Jogador",
                email="jogador@exemplo.com",
                password="senhahash",
                last_active=datetime.utcnow(),
                character_id=None,
                experience=0,
                attribute_points=5,
                strength=0,
                vitality=0,
                resistance=0,
                luck=0,
                hp=80,
                max_hp=80,
                damage_bonus=0.0,
                damage_multiplier=1.0,
                days_streak=0,
                crystals=quantidade,
                current_boss_id=1,
                study_time_total=0
            )
            db.session.add(novo_player)
            db.session.commit()
            mensagem = f"Novo jogador criado com {quantidade} cristais!"
        
        # Forçar atualização da loja
        refresh_shop_force()
        
        return f"""
        <html>
        <head>
            <title>Cristais Definidos</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }}
                .message {{ background-color: #dff0d8; padding: 15px; border-radius: 5px; margin: 20px auto; max-width: 500px; }}
                .btn {{ display: inline-block; padding: 10px 15px; background-color: #337ab7; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <h2>Ajuste de Cristais</h2>
            <div class="message">
                <p><strong>Sucesso!</strong> {mensagem}</p>
            </div>
            <a href="{url_for('battle.gamification')}" class="btn">Voltar para o Hub</a>
            <a href="{url_for('items.shop')}" class="btn">Ir para a Loja</a>
        </body>
        </html>
        """
    except Exception as e:
        return f"""
        <html>
        <head>
            <title>Erro</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }}
                .error {{ background-color: #f2dede; padding: 15px; border-radius: 5px; margin: 20px auto; max-width: 500px; }}
                .btn {{ display: inline-block; padding: 10px 15px; background-color: #337ab7; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <h2>Erro ao Definir Cristais</h2>
            <div class="error">
                <p><strong>Erro:</strong> {str(e)}</p>
            </div>
            <a href="{url_for('battle.gamification')}" class="btn">Voltar para o Hub</a>
        </body>
        </html>
        """

@app.route('/check_template')
def check_template():
    import os
    file_path = os.path.join(app.template_folder, 'battle.gamification', 'base.html')
    with open(file_path, 'r') as f:
        content = f.read()
    return f"<pre>{content}</pre>"    

def get_player_title(level):
    """Retorna o título e descrição do jogador com base no nível."""
    titles = {
        1: ("Aprendiz", "Inicia sua jornada com uma lâmina e uma mente ansiosa por conhecimento."),
        5: ("Guardião das Primeiras Lições", "Começa a absorver os fundamentos da técnica e do pensamento estratégico."),
        10: ("Portador das Recordações", "Seus golpes carregam a lembrança dos mestres que vieram antes."),
        15: ("Discípulo da Lâmina Memória", "Sua espada já não é apenas aço, mas um reflexo das lições que aprendeu."),
        20: ("Lâmina da Recordação", "Seus cortes deixam marcas não apenas na carne, mas na história."),
        25: ("Observador das Marcas do Passado", "Cada batalha ensina algo novo, e você registra cada detalhe em sua mente."),
        30: ("Aquele Que Nunca Esquece", "Nenhum golpe, nenhuma estratégia, nenhuma fraqueza passa despercebida por sua mente afiada."),
        35: ("Forjador de Memórias", "Cada batalha se torna um registro, cada luta uma lição eterna."),
        40: ("Guardião das Crônicas Perdidas", "Você busca resgatar o conhecimento que muitos já esqueceram."),
        45: ("Arma Viva do Conhecimento", "Seu domínio da espada e da memória fazem de você um verdadeiro mestre."),
        50: ("Lâmina da Sabedoria Antiga", "Seu estilo de luta reflete o conhecimento acumulado por gerações."),
        60: ("Despertador de Verdades Ocultas", "Sua presença e sua lâmina fazem até os esquecidos lembrarem quem são."),
        65: ("Arcanista das Lembranças Perdidas", "Sua espada brilha com o poder das memórias ancestrais."),
        70: ("Espadachim das Escrituras Vivas", "Seu nome começa a ser registrado entre aqueles que moldaram a história."),
        85: ("Portador da Memória Eterna", "Você se torna um guardião dos conhecimentos que jamais podem ser esquecidos."),
        90: ("Guardião do Arquivo Infinito", "Dentro de sua mente e lâmina residem os registros de eras inteiras."),
        100: ("Filho do Crepúsculo da Memória", "Você se torna um elo entre o que foi, o que é e o que poderia ter sido."),
        120: ("Mestre dos Segredos Gravados", "Seu conhecimento vai além do que pode ser lido ou ensinado."),
        150: ("Visionário da Eternidade", "Seu domínio da memória e do combate ultrapassa a compreensão dos mortais."),
        200: ("Aquele Que Nunca Será Esquecido", "Seu nome e feitos transcendem o tempo, gravados para sempre na existência."),
        250: ("Mestre das Artes da Memória", "Você alcança o auge do conhecimento, da técnica e da fusão entre mente e lâmina.")
    }
        # Encontrar o maior nível que é menor ou igual ao nível do jogador
    current_title = titles[1]  # Título padrão (nível 1)
    for key in sorted(titles.keys()):
        if key <= level:
            current_title = titles[key]
        else:
            break
    
    return current_title

app.jinja_env.globals.update(
    get_player_title=get_player_title,
    calculate_resistance_block=calculate_resistance_block,
    calculate_effective_resistance=calculate_effective_resistance,
    get_exp_for_next_level=get_exp_for_next_level,
    calculate_strength_damage=calculate_strength_damage,
    calculate_vitality_regeneration=calculate_vitality_regeneration,
    calculate_max_hp=calculate_max_hp,
)

# Adicione esta função às globals do template
app.jinja_env.globals.update(get_player_title=get_player_title)    

if __name__ == "__main__":
    with app.app_context():
        # 1) Cria todas as tabelas
        db.create_all()
        
        # 2) POPULAÇÃO DE TALENTOS NO BANCO (se vazio)
        if Talent.query.count() == 0:
            print("Populando tabela Talent a partir de talents_data…")
            for branch in talents_data.values():
                for t in branch["talents"]:
                    if not Talent.query.get(t["id"]):
                        db.session.add(Talent(
                            id                = t["id"],
                            name              = t["name"],
                            description       = t["description"],
                            constellation     = branch["name"],   # ou branch["oldName"]
                            position          = t["id"] % 100,
                            effect_type       = t["effect_type"],
                            effect_value      = str(t["effect_value"]),
                            requires_talent_id= t["requires"]
                        ))
            db.session.commit()

        print("Tabela Talent populada com sucesso!")
        # (antes você tinha isso dentro do model — agora faz aqui)
        print("Populando tabela de talentos…")
        # ex: initialize_talent_table()  ← sua função de povoar
        db.session.commit()
        print("Tabela de talentos populada com sucesso!")
        
        # 3) Inicializar talentos do jogador (caso já haja um jogador)
        player = Player.query.first()  
        if player:
            print("Inicializando talentos do jogador...")
            from routes.talents import initialize_player_talents_simple  # Importa aqui se não tiver no topo
            initialize_player_talents_simple(player.id)
            print("Talentos inicializados com sucesso!")
        
        # 4) Inicializar dados gerais do jogo
        print("Inicializando dados do jogo...")
        initialize_game_data()
        
        # 5) Migrar jogadores existentes para o novo sistema
        try:
            players = Player.query.all()
            for player in players:
                if not hasattr(player, 'skill_points') or player.skill_points is None:
                    player.skill_points = player.level * 2
            db.session.commit()
            print("Migração de jogadores para novo sistema concluída!")
        except Exception as e:
            print(f"Erro ao migrar jogadores: {e}")
            db.session.rollback()
    
    # Inicia o servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=True)