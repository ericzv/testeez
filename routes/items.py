# INSERIR em routes/items.py
import math
import os
import random
from datetime import datetime, timezone, timedelta
import json

from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask import current_app as app
from sqlalchemy import text, or_, func

from database import db
from models import Player, Item, PlayerItem, Equipment, ShopQuote, BestiaryEntry
from routes.cards import flash_gamification, get_exp_for_next_level

# Criar Blueprint para itens e loja
items_bp = Blueprint('items', __name__)

# ----- FUNÇÕES AUXILIARES PARA GERENCIAMENTO DE ITENS -----

def add_time_traveler_fixed_items():
    """Adiciona os itens fixos do Viajante do Tempo"""
    # Frasco de memórias (1-3)
    quantity = random.randint(1, 3)
    item = Item(
        name="Frasco de memórias",
        description="Contém experiência pura. Consome para ganhar EXP.",
        cost=10,
        effect_type="exp",
        effect_value=20,
        rarity="Comum",
        vendor="time_traveler",
        quantity=quantity  # Definir quantidade aqui
    )
    db.session.add(item)
    
    # Poção de vida (2-5)
    quantity = random.randint(2, 5)
    item = Item(
        name="Poção de vida",
        description="Recupera uma pequena quantidade de HP.",
        cost=5,
        effect_type="heal",
        effect_value=20,
        rarity="Comum",
        vendor="time_traveler",
        quantity=quantity  # Definir quantidade aqui
    )
    db.session.add(item)
    
    # Poção de mana (2-3)
    quantity = random.randint(2, 3)
    item = Item(
        name="Poção de mana",
        description="Recupera uma pequena quantidade de MP.",
        cost=7,
        effect_type="mana",
        effect_value=15,
        rarity="Comum",
        vendor="time_traveler",
        quantity=quantity  # Definir quantidade aqui
    )
    db.session.add(item)

def add_time_traveler_variable_items():
    """Adiciona os itens variáveis do Viajante do Tempo com base em probabilidades"""
    try:
        print("Adicionando itens variáveis do Viajante do Tempo...")
        # Poção da plenitude [Raro] (15% de chance)
        if random.random() < 0.15:
            item = Item(
                name="Poção da plenitude",
                description="Recupera todo o HP.",
                cost=30,
                effect_type="full_heal",
                effect_value=100,
                rarity="Raro",
                vendor="time_traveler",
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Poção da plenitude")
        
        # Fragmento de Estrela Cadente [Raro] (12% de chance)
        if random.random() < 0.12:
            item = Item(
                name="Fragmento de Estrela Cadente",
                description="Aumenta +15 o atributo Sorte por 3 dias.",
                cost=50,
                effect_type="luck_boost",
                effect_value=15,
                rarity="Raro", 
                vendor="time_traveler",
                duration=3,
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Fragmento de Estrela Cadente")
        
        # Elixir da Opressão [Épico] (7% de chance)
        if random.random() < 0.07:
            item = Item(
                name="Elixir da Opressão",
                description="Aumenta 50% do valor da armadura por 3 dias.",
                cost=75,
                effect_type="armor_boost",
                effect_value=50,
                rarity="Épico",
                vendor="time_traveler",
                duration=3,
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Elixir da Opressão")
        
        # Elixir da Vituperação [Épico] (5% de chance)
        if random.random() < 0.05:
            item = Item(
                name="Elixir da Vituperação",
                description="Aumenta 50% do valor do dano base por 3 dias.",
                cost=100,
                effect_type="damage_boost",
                effect_value=50,
                rarity="Épico",
                vendor="time_traveler",
                duration=3,
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Elixir da Vituperação")
        
        # Elixir da Concentração [Épico] (5% de chance)
        if random.random() < 0.05:
            item = Item(
                name="Elixir da Concentração",
                description="Ganha o dobro da EXP por cartões novos estudados por 3 dias.",
                cost=100,
                effect_type="exp_boost",
                effect_value=100,
                rarity="Épico",
                vendor="time_traveler",
                duration=3,
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Elixir da Concentração")
        
        # Manto Imaculado [Lendário] (2% de chance)
        if random.random() < 0.02:
            item = Item(
                name="Manto Imaculado",
                description="Não sofre dano por 2 dias.",
                cost=200,
                effect_type="invulnerability",
                effect_value=100,
                rarity="Lendário",
                vendor="time_traveler",
                duration=2,
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Manto Imaculado")
        
        # Cálice do Cordeiro [Heroico] (1% de chance)
        if random.random() < 0.01:
            item = Item(
                name="Cálice do Cordeiro",
                description="Concede 1 carga de ressurreição. Se você perder todo o HP, será ressuscitado com 100% de vida.",
                cost=350,
                effect_type="resurrection",
                effect_value=1,
                rarity="Heroico",
                vendor="time_traveler",
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Cálice do Cordeiro")
        
        db.session.flush()
    except Exception as e:
        print(f"ERRO ao adicionar itens variáveis do Viajante do Tempo: {e}")
        db.session.rollback()

def add_archmage_fixed_items():
    """Adiciona os itens fixos do Mestre dos Arquimagos baseado no nível do jogador"""
    print("Adicionando itens fixos do Arquimago...")
    
    # Espelho Túrbido do Esquecimento [Especial]
    # Este item sempre está disponível, independente do nível
    item = Item(
        name="Espelho Túrbido do Esquecimento",
        description="Reseta todos os pontos de atributos (os pontos podem ser redistribuidos).",
        cost=100,
        effect_type="reset_attributes",
        effect_value=1,
        rarity="Especial",
        vendor="archmage",
        quantity=1
    )
    db.session.add(item)
    
    # Obter o jogador para verificar o nível
    player = Player.query.first()
    if not player:
        print("Jogador não encontrado, pulando itens baseados em nível.")
        return
    
    # Poeira do Chapéu do Arquimago [Raro]
    # Disponível a partir do nível 7, depois a cada 7 níveis (14, 21, 28...)
    if player.level >= 7:
        # Calcular quantas unidades deve ter baseado no nível
        # Fórmula: floor(level / 7)
        quantity = player.level // 7
        if quantity > 0:
            item = Item(
                name="Poeira do Chapéu do Arquimago",
                description="Aumenta o Dano em +2 permanentemente.",
                cost=70,
                effect_type="damage_permanent",
                effect_value=2,
                rarity="Raro",
                vendor="archmage",
                quantity=quantity
            )
            db.session.add(item)
            print(f"Adicionado: Poeira do Chapéu ({quantity} unidades)")
    
    # Perfume da Tramela da Porta [Raro]
    # Disponível a partir do nível 5, depois a cada 5 níveis (10, 15, 20...)
    if player.level >= 5:
        # Calcular quantas unidades deve ter baseado no nível
        # Fórmula: floor(level / 5)
        quantity = player.level // 5
        if quantity > 0:
            item = Item(
                name="Perfume da Tramela da Porta",
                description="Aumenta a Sorte em +1 permanentemente.",
                cost=50,
                effect_type="luck_permanent",
                effect_value=1,
                rarity="Raro",
                vendor="archmage",
                quantity=quantity
            )
            db.session.add(item)
            print(f"Adicionado: Perfume da Tramela ({quantity} unidades)")
    
    # Turíbulo do Arcanjo [Raro]
    # Disponível a partir do nível 7, depois a cada 7 níveis (14, 21, 28...)
    if player.level >= 7:
        # Calcular quantas unidades deve ter baseado no nível
        # Fórmula: floor(level / 7)
        quantity = player.level // 7
        if quantity > 0:
            item = Item(
                name="Turíbulo do Arcanjo",
                description="Aumenta a Resistência em +2 permanentemente.",
                cost=70,
                effect_type="resistance_permanent",
                effect_value=2,
                rarity="Raro",
                vendor="archmage",
                quantity=quantity
            )
            db.session.add(item)
            print(f"Adicionado: Turíbulo do Arcanjo ({quantity} unidades)")
    
    try:
        db.session.flush()  # Tenta realizar um commit parcial para identificar erros
        print("Itens fixos do Arquimago adicionados com sucesso!")
    except Exception as e:
        print(f"ERRO ao adicionar itens fixos do Arquimago: {e}")
        db.session.rollback()

def add_archmage_variable_items():
    """Adiciona os itens variáveis do Mestre dos Arquimagos com base em probabilidades"""
    try:
        print("Adicionando itens variáveis do Arquimago...")
        
        # Óbice da Impiedade [Lendário] (5% de probabilidade)
        if random.random() < 0.05:
            item = Item(
                name="Óbice da Impiedade",
                description="Aumenta definitivamente a Resistência em +5.",
                cost=300,
                effect_type="resistance_permanent",
                effect_value=5,
                rarity="Lendário",
                vendor="archmage",
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Óbice da Impiedade")
        
        # Óbice da Fraqueza [Lendário] (5% de probabilidade)
        if random.random() < 0.05:
            item = Item(
                name="Óbice da Fraqueza",
                description="Aumenta definitivamente o Dano em +5.",
                cost=300,
                effect_type="damage_permanent",
                effect_value=5,
                rarity="Lendário",
                vendor="archmage",
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Óbice da Fraqueza")
        
        # Óbice da Pequenez [Lendário] (5% de probabilidade)
        if random.random() < 0.05:
            item = Item(
                name="Óbice da Pequenez",
                description="Aumenta definitivamente a Concentração em +5.",
                cost=300,
                effect_type="concentration_permanent",
                effect_value=5,
                rarity="Lendário",
                vendor="archmage",
                quantity=1
            )
            db.session.add(item)
            print("Adicionado: Óbice da Pequenez")
        
        # Óbice da Obliteração [Heroico] (1% de probabilidade)
        # Verificar primeiro se o jogador já não tem este item
        player = Player.query.first()
        if player:
            item_exists = PlayerItem.query.join(Item).filter(
                PlayerItem.player_id == player.id,
                Item.name == "Óbice da Obliteração"
            ).first()
            
            if not item_exists and random.random() < 0.01:
                item = Item(
                    name="Óbice da Obliteração",
                    description="Ao sofrer um dano que resultaria em morte (0 HP), você fica com 1 HP. Esse efeito só pode ser utilizado 1 vez a cada 7 dias.",
                    cost=500,
                    effect_type="death_prevention",
                    effect_value=1,
                    rarity="Heroico",
                    vendor="archmage",
                    quantity=1
                )
                db.session.add(item)
                print("Adicionado: Óbice da Obliteração")
        
        db.session.flush()
    except Exception as e:
        print(f"ERRO ao adicionar itens variáveis do Arquimago: {e}")
        db.session.rollback()

def refresh_shop():
    """Atualiza a loja diariamente com novos itens"""
    # Verifica se estamos em um contexto de requisição
    from flask import has_request_context
    
    # Se não estamos em um contexto de requisição, use a inicialização direta
    if not has_request_context():
        print("Inicializando loja fora do contexto de requisição...")
        return initialize_shop()
    
    today = datetime.now(timezone.utc).date()
    
    # Verificar se a loja já foi atualizada hoje
    last_refresh = session.get('shop_last_refresh')
    if last_refresh == today.isoformat():
        return  # Loja já foi atualizada hoje
    
    try:
        # Remover itens existentes da loja
        Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).delete()
        
        # Adicionar novos itens
        add_time_traveler_fixed_items()
        add_time_traveler_variable_items()
        add_archmage_fixed_items()
        add_archmage_variable_items()
        
        # Marcar que a loja foi atualizada hoje
        session['shop_last_refresh'] = today.isoformat()
        
        # Verificar quantos itens foram adicionados (para debug)
        time_items = Item.query.filter_by(vendor="time_traveler").count()
        archmage_items = Item.query.filter_by(vendor="archmage").count()
        print(f"Loja atualizada: {time_items} itens do Viajante do Tempo, {archmage_items} itens do Arquimago")
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar a loja: {e}")

def initialize_shop():
    """Inicializa a loja sem depender da sessão (para uso durante a inicialização)"""
    try:
        # Remover itens existentes da loja
        Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).delete()
        
        # Adicionar novos itens
        add_time_traveler_fixed_items()
        add_time_traveler_variable_items()
        add_archmage_fixed_items()
        add_archmage_variable_items()
        
        # Verificar quantos itens foram adicionados (para debug)
        time_items = Item.query.filter_by(vendor="time_traveler").count()
        archmage_items = Item.query.filter_by(vendor="archmage").count()
        print(f"Loja inicializada: {time_items} itens do Viajante do Tempo, {archmage_items} itens do Arquimago")
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inicializar a loja: {e}")

def refresh_shop_force():
    """Atualiza a loja forçadamente, ignorando a verificação de data"""
    print("Atualizando loja forçadamente...")
    try:
        # Remover itens existentes da loja
        Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).delete()
        
        # Adicionar novos itens
        add_time_traveler_fixed_items()
        add_time_traveler_variable_items()
        add_archmage_fixed_items()
        add_archmage_variable_items()
        
        # Marcar que a loja foi atualizada hoje
        today = datetime.now(timezone.utc).date().isoformat()
        session['shop_last_refresh'] = today
        
        # Verificar quantos itens foram adicionados (para debug)
        time_items = Item.query.filter_by(vendor="time_traveler").count()
        archmage_items = Item.query.filter_by(vendor="archmage").count()
        print(f"Loja inicializada: {time_items} itens do Viajante do Tempo, {archmage_items} itens do Arquimago")
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inicializar a loja: {e}")

def get_time_traveler_quote():
    """Retorna uma frase do Viajante do Tempo, atualizada diariamente"""
    today = datetime.now(timezone.utc).date()
    
    # Verificar se já existe uma citação para hoje
    quote_record = ShopQuote.query.filter_by(
        vendor="time_traveler", 
        date=today
    ).first()
    
    if quote_record:
        return quote_record.quote
    
    # Se não existe, gerar uma nova
    quotes = [
        "Olá, ... Esqueci seu nome. Enfim, eis o que eu trouxe hoje das minhas viagens:",
        "Esses itens? Nem te conto. Vieram direto do futuro que tu nunca verás.",
        "Teu nome é... ah, não importa. Leva isso antes que eu volte para o futuro.",
        "Não pergunte de onde tirei isso. Não lembro."
    ]
    new_quote = random.choice(quotes)
    
    # Salvar a nova citação
    quote_record = ShopQuote(
        vendor="time_traveler",
        quote=new_quote,
        date=today
    )
    db.session.add(quote_record)
    db.session.commit()
    
    return new_quote

def get_archmage_quote(player):
    """Retorna uma frase do Mestre dos Arquimagos, atualizada diariamente"""
    today = datetime.now(timezone.utc).date()
    
    # Verificar se já existe uma citação para hoje
    quote_record = ShopQuote.query.filter_by(
        vendor="archmage", 
        date=today
    ).first()
    
    if quote_record:
        return quote_record.quote
    
    # Se não existe, gerar uma nova
    possible_quotes = [
        "Bem-vindo à minha loja arcana. Encontrará aqui artigos de grande poder.",
        "Ah, mais um buscador de conhecimento! Veja meus artefatos mágicos.",
        "O tempo é uma ilusão, mas estas mercadorias são bem reais.",
        "Apenas os verdadeiros estudiosos reconhecem o valor destes itens.",
        "Conhecimento é poder, e meus itens contêm ambos.",
        "As páginas do destino estão sendo escritas. Compre enquanto pode.",
        "Meus itens são raros como o conhecimento verdadeiro.",
        "Até o Arquimago mais poderoso começou como aprendiz. Escolha sabiamente."
    ]
    
    # Escolher uma frase aleatória
    new_quote = random.choice(possible_quotes)
    
    # Salvar a nova citação
    quote_record = ShopQuote(
        vendor="archmage",
        quote=new_quote,
        date=today
    )
    db.session.add(quote_record)
    db.session.commit()
    
    return new_quote

# ----- ROTAS DE ITENS E LOJA -----

@items_bp.route('/gamification/shop')
def shop():
    """Loja principal com verificação de itens."""
    # Check if player exists, create if not
    player = Player.query.first()
    if not player:
        return redirect(url_for('gamification'))
    
    # Obter itens do Viajante do Tempo
    time_traveler_items = Item.query.filter_by(vendor="time_traveler").all()
    
    # Obter itens do Mestre dos Arquimagos
    archmage_items = Item.query.filter_by(vendor="archmage").all()
    
    # Obter frases dos NPCs
    time_traveler_quote = get_time_traveler_quote()
    archmage_quote = get_archmage_quote(player)
    
    return render_template('gamification/shop_new.html', 
                          player=player,
                          time_traveler_items=time_traveler_items,
                          archmage_items=archmage_items,
                          time_traveler_quote=time_traveler_quote,
                          archmage_quote=archmage_quote,
                          get_exp_for_next_level=get_exp_for_next_level)

@items_bp.route('/gamification/buy_item/<int:item_id>', methods=['POST'])
def buy_item(item_id):
    """API endpoint para comprar um item da loja."""
    try:
        # 1) Verificar se o jogador existe
        player = Player.query.first()
        if not player:
            flash("Jogador não encontrado!", "danger")
            return redirect(url_for('items.shop'))
        
        # 2) Verificar se o item existe
        item = Item.query.get(item_id)
        if not item:
            flash("Item não encontrado!", "danger")
            return redirect(url_for('items.shop'))
        
        # 3) Calcular custo com desconto
        discount = player.shop_discount if hasattr(player, 'shop_discount') else 0
        final_cost = int(item.cost * (1 - discount))
        
        # 4) Verificar se o jogador tem cristais suficientes
        if player.crystals < final_cost:
            flash(f"Cristais insuficientes! Você precisa de {final_cost} cristais.", "warning")
            return redirect(url_for('items.shop'))
        
        # 5) Deduzir cristais
        player.crystals -= final_cost
        
        # 6) Atualizar inventário do jogador
        player_item = PlayerItem.query.filter_by(player_id=player.id, item_id=item.id).first()
        if player_item:
            player_item.quantity += 1
        else:
            try:
                player_item = PlayerItem(player_id=player.id, item_id=item.id, quantity=1)
                db.session.add(player_item)
                db.session.flush()
            except Exception as inner_e:
                db.session.rollback()
                print(f"ERRO AO CRIAR PLAYERITEM: {inner_e}")
                flash(f"Erro ao adicionar item ao inventário: {inner_e}", "danger")
                return redirect(url_for('items.shop'))
        
        # 7) Atualizar estoque da loja
        if item.quantity > 1:
            item.quantity -= 1
        else:
            db.session.delete(item)
        
        # 8) Commit de todas as alterações
        db.session.commit()
        
        # 9) Mensagem de sucesso
        flash(f"Você comprou {item.name} por {final_cost} Cristais!", "success")
        
        # 10) Se for AJAX, retorna JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'success': True,
                'message': f'Você comprou {item.name}!',
                'crystals': player.crystals,
                'quantity': getattr(item, 'quantity', 0)
            })
        
        # 11) Caso contrário, redireciona
        return redirect(url_for('items.shop'))
        
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO PROCESSAR COMPRA: {e}")
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'success': False,
                'message': f'Erro ao processar a compra: {e}'
            })
        
        flash(f"Erro ao processar a compra: {e}", "danger")
        return redirect(url_for('items.shop'))

@items_bp.route('/gamification/use_item/<int:player_item_id>', methods=['POST'])
def use_item(player_item_id):
    """Rota para usar um item do inventário."""
    try:
        # Obter o jogador
        player = Player.query.first()
        if not player:
            flash("Jogador não encontrado!", "danger")
            return redirect(url_for('game_inventory'))
        
        # Obter o item do jogador
        player_item = PlayerItem.query.get(player_item_id)
        if not player_item or player_item.player_id != player.id:
            flash("Item não encontrado no seu inventário!", "danger")
            return redirect(url_for('game_inventory'))
        
        # Obter o item base
        item = Item.query.get(player_item.item_id)
        if not item:
            flash("Item desconhecido!", "danger")
            return redirect(url_for('game_inventory'))
        
        # Aplicar o efeito do item
        message = f"Você usou {item.name}!"
        
        if item.effect_type == 'heal':
            # Cura HP
            hp_antes = player.hp
            player.hp = min(player.hp + item.effect_value, player.max_hp)
            hp_recuperado = player.hp - hp_antes
            message = f"Você usou {item.name} e recuperou {hp_recuperado} pontos de HP!"
        
        elif item.effect_type == 'mana':
            # Restaura MP
            mp_antes = player.mp
            player.mp = min(player.mp + item.effect_value, player.max_mp)
            mp_recuperado = player.mp - mp_antes
            message = f"Você usou {item.name} e recuperou {mp_recuperado} pontos de MP!"
        
        elif item.effect_type == 'full_heal':
            # Cura completa
            hp_antes = player.hp
            player.hp = player.max_hp
            hp_recuperado = player.hp - hp_antes
            message = f"Você usou {item.name} e recuperou completamente seu HP ({hp_recuperado} pontos)!"
        
        elif item.effect_type == 'exp':
            # Adicionar XP
            player.experience += item.effect_value
            
            # Verificar se subiu de nível
            level_antes = player.level
            while player.experience >= get_exp_for_next_level(player.level):
                xp_needed = get_exp_for_next_level(player.level)
                player.experience -= xp_needed
                player.level += 1
                # Dar 2 pontos de atributo por nível
                player.attribute_points += 2
            
            if player.level > level_antes:
                message = f"Você usou {item.name} e ganhou {item.effect_value} pontos de experiência! Subiu para o nível {player.level}!"
            else:
                message = f"Você usou {item.name} e ganhou {item.effect_value} pontos de experiência!"
        
        elif item.effect_type == 'resistance_permanent':
            # Aumenta resistência permanentemente
            player.resistance += item.effect_value
            message = f"Você usou {item.name} e aumentou sua Resistência em {item.effect_value} pontos!"
        
        elif item.effect_type == 'damage_permanent':
            # Aumenta dano permanentemente
            player.damage_bonus += (item.effect_value / 100.0)
            message = f"Você usou {item.name} e aumentou seu Dano em {item.effect_value}!"
            
        elif item.effect_type == 'luck_permanent':
            # Aumenta sorte permanentemente
            player.luck += item.effect_value
            message = f"Você usou {item.name} e aumentou sua Sorte em {item.effect_value}!"
            
        elif item.effect_type == 'concentration_permanent':
            # Aumenta concentração permanentemente
            player.concentration += item.effect_value
            message = f"Você usou {item.name} e aumentou sua Concentração em {item.effect_value}!"
        
        elif item.effect_type in ['damage_boost', 'armor_boost', 'exp_boost']:
            # Itens com duração (implementação básica - pode expandir depois)
            message = f"Você usou {item.name}! O efeito durará por {item.duration} dias."
        
        elif item.effect_type in ['invulnerability', 'resurrection', 'death_prevention']:
            # Itens especiais
            message = f"Você usou {item.name}! O efeito especial foi ativado."
        
        elif item.effect_type == 'reset_attributes':
            # Reseta todos os pontos de atributo
            # Armazenar pontos atuais
            total_points = player.attribute_points
            
            # Adicionar pontos dos atributos atuais
            total_points += player.strength
            total_points += player.vitality
            total_points += player.resistance
            total_points += player.luck
            total_points += player.concentration
            
            # Zerar atributos
            player.strength = 0
            player.vitality = 0
            player.resistance = 0
            player.luck = 0
            player.concentration = 0
            
            # Definir pontos disponíveis
            player.attribute_points = total_points
            
            message = f"Você usou {item.name}! Todos os seus pontos de atributo foram resetados."
        
        # Atualizar quantidade ou remover do inventário
        if player_item.quantity > 1:
            player_item.quantity -= 1
        else:
            db.session.delete(player_item)
        
        # Recalcular estatísticas do personagem se necessário
        if hasattr(player, 'recalculate_stats'):
            player.recalculate_stats()
        
        db.session.commit()
        flash(message, "success")
        
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO USAR ITEM: {str(e)}")
        flash(f"Erro ao usar item: {str(e)}", "danger")
    
    return redirect(url_for('game_inventory'))

@items_bp.route('/gamification/refresh_shop_now')
def refresh_shop_now():
    """Rota para forçar a atualização da loja com base no sistema normal de probabilidade."""
    try:
        # Remover itens existentes da loja
        Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).delete()
        
        # Adicionar novos itens usando o sistema normal baseado em probabilidade
        add_time_traveler_fixed_items()
        add_time_traveler_variable_items()
        add_archmage_fixed_items()
        add_archmage_variable_items()
        
        # Marcar que a loja foi atualizada hoje
        today = datetime.now(timezone.utc).date().isoformat()
        session['shop_last_refresh'] = today
        
        # Verificar quantos itens foram adicionados
        time_items = Item.query.filter_by(vendor="time_traveler").count()
        archmage_items = Item.query.filter_by(vendor="archmage").count()
        
        db.session.commit()
        
        flash(f"Loja atualizada com sucesso! Gerados {time_items} itens do Viajante do Tempo e {archmage_items} itens do Arquimago.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Erro ao atualizar a loja: {str(e)}", "danger")
    
    return redirect(url_for('items.shop'))

@items_bp.route('/gamification/refresh_shop_manually')
def refresh_shop_manually():
    """Rota para forçar a atualização da loja manualmente."""
    try:
        # Remover itens existentes da loja
        Item.query.filter(Item.vendor.in_(["time_traveler", "archmage"])).delete()
        
        # Adicionar novos itens
        add_time_traveler_fixed_items()
        add_time_traveler_variable_items()
        add_archmage_fixed_items()
        add_archmage_variable_items()
        
        # Marcar que a loja foi atualizada hoje
        today = datetime.now(timezone.utc).date().isoformat()
        session['last_shop_refresh'] = today
        
        db.session.commit()
        flash("Loja atualizada com sucesso!", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Erro ao atualizar a loja: {str(e)}", "danger")
        print(f"Erro ao atualizar loja manualmente: {e}")
    
    return redirect(url_for('items.shop'))

@items_bp.route('/definir_cristais/<int:quantidade>')
def definir_cristais(quantidade):
    """Rota para definir manualmente a quantidade de cristais do jogador."""
    try:
        # Verificar se o jogador existe
        player = Player.query.first()
        
        if player:
            # Atualizar cristais do jogador existente
            player.crystals = quantidade
            db.session.commit()
            mensagem = f"Jogador existente atualizado para {quantidade} cristais!"
        else:
            # Criar um novo jogador com os cristais especificados
            novo_player = Player(
                name="Jogador",
                email="jogador@exemplo.com",
                password="senhahash",
                last_active=datetime.now(timezone.utc),
                character_class=None,
                experience=0,
                attribute_points=5,
                strength=0,
                vitality=0,
                resistance=0,
                luck=0,
                concentration=0,
                hp=100,
                max_hp=100,
                mp=50,
                max_mp=50,
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
            <a href="{url_for('gamification')}" class="btn">Voltar para o Hub</a>
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
            <a href="{url_for('gamification')}" class="btn">Voltar para o Hub</a>
        </body>
        </html>
        """

def initialize_items_data():
    """Inicializa itens básicos se não existirem"""
    # Create initial items if none exist
    if Item.query.count() == 0:
        items = [
            {
                'name': 'Espada da Memória',
                'description': 'Uma espada mágica que causa 1 ponto de dano adicional em todos os ataques.',
                'cost': 5,
                'effect_type': 'damage',
                'effect_value': 1
            },
            {
                'name': 'Armadura do Conhecimento',
                'description': 'Uma armadura que aumenta seu HP máximo em 2 pontos.',
                'cost': 5,
                'effect_type': 'hp',
                'effect_value': 2
            },
            {
                'name': 'Cajado da Sabedoria',
                'description': 'Um cajado mágico que aumenta seu dano em 2 pontos.',
                'cost': 10,
                'effect_type': 'damage',
                'effect_value': 2
            },
            {
                'name': 'Amuleto da Vitalidade',
                'description': 'Um amuleto antigo que aumenta seu HP máximo em 3 pontos.',
                'cost': 10,
                'effect_type': 'hp',
                'effect_value': 3
            },
            {
                'name': 'Grimório dos Esquecidos',
                'description': 'Um livro mágico que aumenta seu dano em 5 pontos.',
                'cost': 25,
                'effect_type': 'damage',
                'effect_value': 5
            },
            {
                'name': 'Poção da Cura',
                'description': 'Uma poção que restaura 3 pontos de HP.',
                'cost': 3,
                'effect_type': 'heal',
                'effect_value': 3
            }
        ]
        
        for item_data in items:
            item = Item(
                name=item_data['name'],
                description=item_data['description'],
                cost=item_data['cost'],
                effect_type=item_data['effect_type'],
                effect_value=item_data['effect_value']
            )
            db.session.add(item)
        db.session.commit()
        print("Itens básicos inicializados com sucesso!")
        
        # Inicializar a loja também
        refresh_shop_force()

def check_shop_refresh():
    """Verificar se a loja precisa ser atualizada (uma vez por dia)"""
    if request.endpoint and (request.endpoint.startswith('static') or request.method != 'GET'):
        return
        
    # Obter a data da última atualização da loja da sessão
    last_shop_refresh = session.get('last_shop_refresh')
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Se não houver data de atualização ou for um dia diferente, atualize a loja
    if not last_shop_refresh or last_shop_refresh != today:
        with app.app_context():
            refresh_shop()
        session['last_shop_refresh'] = today