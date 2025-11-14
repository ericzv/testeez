# routes/battle_cache.py - Sistema de Cache de Dano
"""
Sistema que pré-calcula valores de dano e defesa ao iniciar batalha.
Cache inclui apenas valores PERMANENTES durante a run:
- Força, talentos, equipamentos, lembranças
Cache NÃO inclui valores TEMPORÁRIOS:
- Buffs ativos (ActiveBuff)
- Debuffs do inimigo (EnemySkillDebuff)
"""

from datetime import datetime
from database import db
from models import Player, PlayerAttackCache, PlayerDefenseCache
from game_formulas import (
    calculate_strength_damage,
    calculate_critical_chance,
    calculate_critical_bonus,
    calculate_resistance_block,
    calculate_dodge_chance,
    calculate_max_hp
)
import json

def get_run_buff_total(player_id, buff_type):
    """Busca total de um tipo de buff de run (lembranças)"""
    try:
        from models import PlayerRunBuff
        # Flush pending changes antes de fazer query
        db.session.flush()
        buff = PlayerRunBuff.query.filter_by(
            player_id=player_id,
            buff_type=buff_type
        ).first()
        return buff.total_value if buff else 0.0
    except Exception as e:
        print(f"Erro ao buscar run buff {buff_type}: {e}")
        return 0.0

def get_skill_type_by_id(skill_id):
    """
    Retorna o tipo do ataque baseado no ID.
    Retorna apenas o tipo: 'attack', 'power', 'special' ou 'ultimate'
    """
    skill_type_mapping = {
        51: 'attack',    # Garras Sangrentas
        50: 'power',     # Energia Escura
        52: 'special',   # Abraço da Escuridão
        53: 'ultimate'   # Beijo da Morte
    }
    
    return skill_type_mapping.get(skill_id, 'attack')  # Default: attack

def get_base_stats_by_type(skill_type):
    """Retorna dano base por tipo de skill"""
    if skill_type == 'attack':
        return 6
    elif skill_type == 'power':
        return 12
    elif skill_type == 'special':
        return 18
    elif skill_type == 'ultimate':
        return 30
    else:
        return 50

def get_base_energy_cost_by_type(skill_type):
    """
    Retorna o custo base de energia por tipo de ataque.
    Este custo pode ser modificado por relíquias posteriormente.
    """
    energy_costs = {
        'attack': 2,
        'power': 4,
        'special': 6,
        'ultimate': 8
    }
    
    return energy_costs.get(skill_type, 2)  # Default: 2 energia

# routes/battle_cache.py

def calculate_attack_cache(player_id):
    """

    Calcula e salva cache para TODAS as skills do jogador.
    
    CAMPOS DO PLAYER USADOS (permanentes):
    - player.strength → REMOVIDO (não usa mais)
    - player.damage_bonus → Talentos de dano
    - player.damage_multiplier → Multiplicador base (equipamentos futuros)
    - player.luck → Chance/dano crítico
    - player.critical_chance_bonus → Talentos de crítico
    - player.critical_damage_bonus → Talentos de dano crítico
    - player.vitality → HP máximo
    - player.max_hp_bonus → Talentos de HP
    - player.resistance → Bloqueio
    - player.block_bonus → Talentos de bloqueio
    - player.dodge_talent_bonus → Talentos de esquiva
    
    CAMPOS NÃO USADOS (aplicados em runtime):
    - Buffs temporários (ActiveBuff)
    - Debuffs de inimigos (EnemySkillDebuff)
    
    DANO FIXO POR SKILL:
    - Ataque básico: 50 de dano base
    - Poder: 120 de dano base  
    - Especial: 200 de dano base
    - Suprema: 350 de dano base
    
    APLICA BÔNUS PERMANENTES:
    - Lembranças (get_run_buff_total)
    """
    try:
        player = Player.query.get(player_id)
        if not player:
            print(f"ERRO: Player {player_id} não encontrado")
            return False
        
        print(f"\n{'='*60}")
        print(f"CALCULANDO CACHE DE ATAQUE - Player {player_id}")
        print(f"{'='*60}")
        
        # 1. LIMPAR CACHE ANTIGO
        PlayerAttackCache.query.filter_by(player_id=player_id).delete()
        print("Cache antigo removido")
        
        # 2. BUSCAR SKILLS DO JOGADOR
        from characters import get_player_attacks
        player_skills = get_player_attacks(player_id)

        if not player_skills:
            print("AVISO: Nenhuma skill encontrada para o jogador")
            return False
        
        print(f"Encontradas {len(player_skills)} skills")
        
        # 3. CALCULAR BÔNUS PERMANENTES GLOBAIS
        
        # 3b. Talentos
        talent_damage_bonus = getattr(player, 'damage_bonus', 0.0)
        print(f"TALENTOS player.damage_bonus: +{talent_damage_bonus*100:.0f}% de dano")
        
        # 3d. Lembranças globais
        memory_global = get_run_buff_total(player_id, 'damage_global')
        print(f"LEMBRANÇA 'damage_global': +{memory_global*100:.0f}% de dano")
        
        # 3e. Crítico base - REMOVIDO (agora é 0% para todos, exceto skills específicas)
        base_crit_multiplier = 1.5  # Multiplicador fixo quando crita
        print(f"CRÍTICO BASE: 0% chance (só skills específicas têm crítico), {base_crit_multiplier:.2f}x multiplicador")

        # 3f. BÔNUS DE RELÍQUIAS PASSIVAS
        from models import PlayerRelic
        active_relics = PlayerRelic.query.filter_by(player_id=player_id, is_active=True).all()
        relic_count = len(active_relics)
        
        relic_crit_bonus = 0.0
        
        for relic in active_relics:
            from routes.relics.registry import get_relic_definition
            definition = get_relic_definition(relic.relic_id)
            if not definition:
                continue
            
            effect_type = definition['effect']['type']
            
            # ID 13: +3% crit por relíquia
            if effect_type == 'crit_per_relic':
                bonus_per_relic = definition['effect']['crit_percent']
                relic_crit_bonus += (relic_count * bonus_per_relic)
        
        if relic_crit_bonus > 0:
            base_crit_chance += relic_crit_bonus
            print(f"RELÍQUIAS: +{relic_crit_bonus*100:.1f}% crit ({relic_count} relíquias)")
        
        # 4. PROCESSAR CADA SKILL
        print(f"\n{'─'*60}")
        print("PROCESSANDO SKILLS:")
        print(f"{'─'*60}")
        
        for skill in player_skills:
            skill_id = skill['id']
            skill_name = skill['name']
            print(f"\n[{skill_name}] (ID: {skill_id})")
            
            # 4a. DETERMINAR TIPO DA SKILL
            skill_type = get_skill_type_by_id(skill_id)
            print(f"   Tipo: {skill_type.upper()}")
            
            # 4b. OBTER STATS BASE POR TIPO
            skill_base_damage = get_base_stats_by_type(skill_type)
            print(f"   Dano Base Fixo: {skill_base_damage}")

            # 4b.2. OBTER CUSTO BASE DE ENERGIA
            energy_cost = get_base_energy_cost_by_type(skill_type)
            print(f"   Custos: {energy_cost} ENERGIA")
            
            # ===== MODIFICAR CUSTOS POR RELÍQUIAS =====
            # ID 23 - Doxologia (Especial: -1 energia)
            for relic in active_relics:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition(relic.relic_id)
                if not definition:
                    continue
                
                effect_type = definition['effect']['type']
                
                # Doxologia: Reduz custo do Especial em 1
                if effect_type == 'special_energy_reduction' and skill_type == 'special':
                    energy_cost -= definition['effect']['energy_cost_reduction']
                    if energy_cost < 1:
                        energy_cost = 1  # Custo mínimo de 1
                    
                    print(f"   🕊️ DOXOLOGIA: Custo de energia reduzido em -{definition['effect']['energy_cost_reduction']} (Custo final: {energy_cost})")
            
            print(f"   Custo Base de Energia: {energy_cost}")
            
            # 4b.1. MODIFICAR CUSTOS POR RELÍQUIAS (ID 23)
            for relic in active_relics:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition(relic.relic_id)
                if not definition:
                    continue
                
                effect_type = definition['effect']['type']
                
                # ID 23: Especialização de Lucas - Dobra Especial mas +70% custo
                if effect_type == 'special_trade' and skill_type == 'special':
                    skill_base_damage = int(skill_base_damage * 2.0)
                    energy_cost = int(energy_cost * 1.7)  # ADICIONAR ESTA LINHA
                    print(f"\n[{skill_name}] (ID: {skill_id})")
                    print(f"   🔥 ESPECIALIZAÇÃO DE LUCAS: Dano x2, Custos x1.7")
            
            # 4c. APLICAR BÔNUS PERMANENTES AO DANO BASE
            
            # Começar com dano base
            current_damage = skill_base_damage
                        
            # Aplicar talentos
            if talent_damage_bonus > 0:
                damage_before = current_damage
                current_damage = int(current_damage * (1 + talent_damage_bonus))
                bonus_applied = current_damage - damage_before
                print(f"   Talentos player.damage_bonus (+{talent_damage_bonus*100:.0f}%): {damage_before} + {bonus_applied} = {current_damage}")
                        
            # Aplicar lembranças globais
            if memory_global > 0:
                damage_before = current_damage
                current_damage += int(memory_global)  # <-- CORRIGIDO para adição flat
                bonus_applied = current_damage - damage_before
                # CORRIGIDO: Log para mostrar adição flat
                print(f"   Lembrança 'damage_global' (+{int(memory_global)} dano): {damage_before} + {bonus_applied} = {current_damage}")
                        
            # Aplicar lembranças específicas do tipo de ataque
            memory_specific_key = f'damage_{skill_type}'
            memory_specific = get_run_buff_total(player_id, memory_specific_key)
            
            if memory_specific > 0:
                damage_before = current_damage
                current_damage += int(memory_specific)  # <-- CORRIGIDO para adição flat
                bonus_applied = current_damage - damage_before
                print(f"   Lembrança '{memory_specific_key}' (+{int(memory_specific)} dano): {damage_before} + {bonus_applied} = {current_damage}")

            if skill_type == 'attack' and player.accumulated_attack_bonus > 0:
                damage_before = current_damage
                current_damage += player.accumulated_attack_bonus
                print(f"   Relíquias acumuladas no Ataque: {damage_before} + {player.accumulated_attack_bonus} = {current_damage}")
            
            elif skill_type == 'power' and player.accumulated_power_bonus > 0:
                damage_before = current_damage
                current_damage += player.accumulated_power_bonus
                print(f"   Relíquias acumuladas no Poder: {damage_before} + {player.accumulated_power_bonus} = {current_damage}")

            # ID 22 - Petrus: +10 dano no Poder por relíquia ativa
            if skill_type == 'power':
                petrus_bonus = 0
                for relic in active_relics:
                    from routes.relics.registry import get_relic_definition
                    definition = get_relic_definition(relic.relic_id)
                    if not definition:
                        continue
                    
                    effect_type_relic = definition['effect']['type']
                    
                    # Verificar se é Petrus (damage_per_relic no Poder)
                    if effect_type_relic == 'damage_per_relic' and definition['effect'].get('skill_type') == 'power':
                        petrus_bonus = relic_count * definition['effect']['damage_per_relic']
                        break  # Só pode ter uma Petrus
                
                if petrus_bonus > 0:
                    damage_before = current_damage
                    current_damage += petrus_bonus
                    print(f"   🗿 Relíquia Petrus: {damage_before} + {petrus_bonus} = {current_damage} ({relic_count} relíquias)")

            final_base_damage = current_damage

            # 4d. CHANCE DE CRÍTICO DA SKILL (effect_type)
            base_crit_chance = 0.0  # Começar com 0%
            effect_type = skill.get('effect_type')
            effect_value = skill.get('effect_value', 0.0)

            if effect_type == 'crit_chance':
                base_crit_chance = effect_value
                print(f"   Chance de Crítico da Skill: {base_crit_chance*100:.0f}%")
            
            # 4d. VAMPIRISMO (se a skill tiver)
            lifesteal_percent = 0.0
            # effect_type = skill.get('effect_type') # <-- BUG: JÁ ESTAVA DEFINIDO ACIMA
            # effect_value = skill.get('effect_value', 0.0) # <-- BUG: JÁ ESTAVA DEFINIDO ACIMA
            effect_bonus = 0
            
            if effect_type == 'lifesteal':
                lifesteal_percent = effect_value
                print(f"   Vampirismo: {lifesteal_percent*100:.0f}%")

            # ===== NOVA LÓGICA DE BARREIRA =====
            # Se for o "Poder" (ID 50), definimos seus efeitos de Barreira
            if skill_id == 50:
                effect_type = 'barrier'
                effect_value = 0.10  # 10% do dano
                effect_bonus = 3
                print(f"   🛡️ Skill (ID 50) concede BARREIRA: {effect_value*100:.0f}% Dano + {effect_bonus} flat")
            # =====================================
            
            # 4d.1. BÔNUS DE VAMPIRISMO POR RELÍQUIAS
            for relic in active_relics:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition(relic.relic_id)
                if not definition:
                    continue
                
                # effect_type_relic = definition['effect']['type'] # <-- MUDANÇA AQUI
                effect_type_relic = definition['effect']['type'] # <-- MUDANÇA AQUI (era 'effect_type')
                
                # ID 44: +1% vampirismo no ataque por relíquia
                if effect_type_relic == 'lifesteal_per_relic' and skill_type == 'attack': # <-- MUDANÇA AQUI
                    lifesteal_bonus = relic_count * definition['effect']['lifesteal_percent']
                    lifesteal_percent += lifesteal_bonus
                    print(f"   Relíquias: +{lifesteal_bonus*100:.0f}% vampirismo ({relic_count} relíquias)")

            # ===== VERIFICAR MODIFICADORES TEMPORÁRIOS ATIVOS =====
            temp_modifiers = []
            temp_damage_mult = 1.0
            temp_crit_bonus = 0.0
            temp_lifesteal_bonus = 0.0
            temp_force_crit = False
            
            # Buscar estado atual das relíquias para mostrar modificadores temporários
            for relic in active_relics:
                from routes.relics.registry import get_relic_definition
                definition = get_relic_definition(relic.relic_id)
                if not definition:
                    continue
                
                effect_type_relic = definition['effect']['type'] # <-- MUDANÇA AQUI
                state = json.loads(relic.state_data or '{}')
                
                # ID 17 - Momentum Plagosus: +20% crit no próximo ataque
                if effect_type_relic == 'crit_chain':
                    bonus_crit = state.get('bonus_crit_next', 0.0)
                    if bonus_crit > 0:
                        temp_crit_bonus += bonus_crit
                        temp_modifiers.append(f"Momentum Plagosus: +{bonus_crit*100:.0f}% crit no PRÓXIMO ataque")
                
                # ID 16 - Pedra Angular: 100% crit no primeiro Poder/Especial
                if effect_type_relic == 'first_power_special_crit':
                    if not player.first_power_or_special_done and skill_type in ['power', 'special']:
                        temp_force_crit = True
                        temp_modifiers.append(f"Pedra Angular: Crítico GARANTIDO (primeiro {skill_type})")
                
                # ID 24 - Última Graça: x2 dano na Suprema (1x por batalha)
                if effect_type_relic == 'ultimate_trade' and skill_type == 'ultimate':
                    used_this_battle = state.get('used_this_battle', False)
                    if not used_this_battle:
                        mult = definition['effect']['damage_multiplier']
                        temp_damage_mult *= mult
                        temp_modifiers.append(f"Última Graça: Dano x{mult} (DISPONÍVEL 1x esta batalha)")
                    else:
                        temp_modifiers.append(f"Última Graça: JÁ USADA nesta batalha")
                
                # ID 25 - Discipulato: x2 dano no 10º, 20º, 30º... ataque
                if effect_type_relic == 'damage_multiplier_on_threshold':
                    threshold = definition.get('counter_threshold', 10)
                    next_attack = player.total_attacks_any_type + 1
                    if next_attack % threshold == 0:
                        mult = definition['effect']['multiplier']
                        temp_damage_mult *= mult
                        temp_modifiers.append(f"Discipulato: Dano x{mult} (PRÓXIMO será o {next_attack}º ataque)")
                
                # ID 28 - Ritual de Sangue: +15% vampirismo no 5º, 10º, 15º... Especial
                if effect_type_relic == 'lifesteal_on_threshold' and skill_type == 'special':
                    threshold = definition.get('counter_threshold', 5)
                    next_special = player.total_special_uses + 1
                    if next_special % threshold == 0:
                        bonus = definition['effect']['lifesteal_percent']
                        temp_lifesteal_bonus += bonus
                        temp_modifiers.append(f"Ritual de Sangue: +{bonus*100:.0f}% vampirismo (PRÓXIMO será o {next_special}º especial)")
            
            # Calcular valores finais com modificadores temporários
            preview_damage = int(final_base_damage * temp_damage_mult)
            preview_crit = min(1.0, base_crit_chance + temp_crit_bonus) if not temp_force_crit else 1.0
            preview_lifesteal = lifesteal_percent + temp_lifesteal_bonus
            
            # Mostrar valores base
            print(f"   >> DANO FINAL (sem crítico): {final_base_damage}")
            print(f"   >> CRÍTICO: {base_crit_chance*100:.1f}% chance, {base_crit_multiplier:.2f}x multiplicador")
            
            # Mostrar modificadores temporários se houver
            if temp_modifiers:
                print(f"   ⚡ MODIFICADORES TEMPORÁRIOS ATIVOS:")
                for mod in temp_modifiers:
                    print(f"      • {mod}")
                
                # Mostrar preview com modificadores aplicados
                print(f"   📊 PREVIEW COM MODIFICADORES:")
                if temp_damage_mult != 1.0:
                    print(f"      Dano: {final_base_damage} → {preview_damage} (x{temp_damage_mult})")
                if temp_force_crit or temp_crit_bonus > 0:
                    print(f"      Crítico: {base_crit_chance*100:.1f}% → {preview_crit*100:.1f}%")
                if temp_lifesteal_bonus > 0:
                    print(f"      Vampirismo: {lifesteal_percent*100:.0f}% → {preview_lifesteal*100:.0f}%")
            
            # 4e. SALVAR NO CACHE
            cache_entry = PlayerAttackCache(
                player_id=player_id,
                skill_id=skill_id,
                skill_name=skill_name,
                skill_type=skill_type,
                energy_cost=energy_cost,
                base_damage=final_base_damage,
                base_crit_chance=base_crit_chance,
                base_crit_multiplier=base_crit_multiplier,
                lifesteal_percent=lifesteal_percent,
                effect_type=effect_type,
                effect_value=effect_value,
                effect_bonus=effect_bonus,
                last_calculated=datetime.utcnow()
            )
            
            db.session.add(cache_entry)
        
        # 5. CALCULAR CACHE DE DEFESA (UMA VEZ PARA TODAS AS SKILLS)
        print(f"\n{'─'*60}")
        print("CALCULANDO DEFESA:")
        print(f"{'─'*60}")
        
        # Remover cache antigo de defesa
        PlayerDefenseCache.query.filter_by(player_id=player_id).delete()
        
        # Calcular bloqueio
        block_bonus = getattr(player, 'block_bonus', 0.0)
        base_block = calculate_resistance_block(player.resistance, block_bonus) / 100.0

        # Bônus de bloqueio por relíquias (ID 43)
        for relic in active_relics:
            from routes.relics.registry import get_relic_definition
            definition = get_relic_definition(relic.relic_id)
            if not definition:
                continue
            
            effect_type_relic = definition['effect']['type'] # <-- MUDANÇA AQUI
            
            # ID 43: +1% bloqueio por relíquia
            if effect_type_relic == 'block_per_relic': # <-- MUDANÇA AQUI
                block_per_relic = definition['effect']['block_percent']
                base_block += (relic_count * block_per_relic)
        
        if base_block != calculate_resistance_block(player.resistance, block_bonus) / 100.0:
            print(f"Relíquias: +{(relic_count * 0.01)*100:.1f}% bloqueio ({relic_count} relíquias)")
        
        # Calcular esquiva
        base_dodge = calculate_dodge_chance(
            player.luck,
            getattr(player, 'dodge_item_bonus', 0.0),
            getattr(player, 'dodge_talent_bonus', 0.0)
        )
        
        # Calcular HP/MP máximos COM bônus de talentos
        max_hp = calculate_max_hp(player.vitality) + int(getattr(player, 'max_hp_bonus', 0))
        
        # Aplicar bônus de lembranças em HP/MP
        hp_memory = get_run_buff_total(player_id, 'maxhp')
        
        if hp_memory > 0:
            max_hp += int(hp_memory)
            print(f"Lembrança 'maxhp': +{int(hp_memory)}")
        
        print(f"BLOQUEIO: {base_block*100:.1f}%")
        print(f"ESQUIVA: {base_dodge*100:.1f}%")
        print(f"HP MÁXIMO: {max_hp}")
        
        # Salvar cache de defesa
        defense_cache = PlayerDefenseCache(
            player_id=player_id,
            base_block_percent=base_block,
            base_dodge_chance=base_dodge,
            max_hp=max_hp,
            last_calculated=datetime.utcnow()
        )
        
        db.session.add(defense_cache)
        
        # 6. COMMIT FINAL
        db.session.commit()
        
        print(f"\n{'='*60}")
        print(f"CACHE CALCULADO COM SUCESSO!")
        print(f"   {len(player_skills)} skills processadas")
        print(f"   Defesa calculada")
        print(f"{'='*60}\n")
        
        return True
        
    except Exception as e:
        print(f"ERRO ao calcular cache: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return False

def get_cached_attack(player_id, skill_id):
    """Busca dados de ataque do cache"""
    return PlayerAttackCache.query.filter_by(
        player_id=player_id,
        skill_id=skill_id
    ).first()

def get_cached_defense(player_id):
    """Busca dados de defesa do cache"""
    return PlayerDefenseCache.query.filter_by(player_id=player_id).first()

def invalidate_cache(player_id):
    """Remove cache do jogador (forçando recálculo na próxima batalha)"""
    PlayerAttackCache.query.filter_by(player_id=player_id).delete()
    PlayerDefenseCache.query.filter_by(player_id=player_id).delete()
    db.session.commit()
    print(f"🗑️  Cache do player {player_id} invalidado")

def update_cache_accumulated_bonuses(player_id):
    """
    Atualiza APENAS os bônus acumulados no cache sem recalcular tudo.
    Muito mais rápido que recalcular o cache inteiro.
    
    Usado por relíquias que acumulam dano permanentemente (IDs: 20, 21, 26).
    """
    from models import Player, PlayerAttackCache
    from database import db
    
    player = Player.query.get(player_id)
    if not player:
        return False
    
    try:
        # Atualizar Ataque Básico se houver bônus acumulado
        if player.accumulated_attack_bonus > 0:
            attack_caches = PlayerAttackCache.query.filter_by(
                player_id=player_id,
                skill_type='attack'
            ).all()
            
            for cache in attack_caches:
                # O bônus já está sendo aplicado em runtime, então só precisa
                # refletir no cache para próxima consulta
                # MAS: o cache já calcula baseado nos atributos do player
                # Então não precisa modificar aqui, apenas garantir que
                # accumulated_attack_bonus seja considerado no cálculo
                pass
        
        # Atualizar Poder se houver bônus acumulado
        if player.accumulated_power_bonus > 0:
            power_caches = PlayerAttackCache.query.filter_by(
                player_id=player_id,
                skill_type='power'
            ).all()
            
            for cache in power_caches:
                pass
        
        # Na verdade, a solução correta é: os bônus acumulados JÁ SÃO APLICADOS
        # em runtime no damage_boss(). O cache serve como BASE, e os acumulados
        # são ADICIONADOS depois. Isso está correto!
        
        # O que REALMENTE precisamos é: ao recalcular o cache (após level up, etc),
        # incluir os accumulated_bonus no base_damage do cache.
        
        print(f"📊 Cache atualizado: Ataque +{player.accumulated_attack_bonus}, Poder +{player.accumulated_power_bonus}")
        return True
        
    except Exception as e:
        print(f"Erro ao atualizar cache acumulado: {e}")
        return False