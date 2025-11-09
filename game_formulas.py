import math

def calculate_strength_damage(strength):
    """
    Calcula o dano base baseado no nível de força,
    com teto 2.50, alcançando 2.00 em strength=60 e 2.50 em strength=100.
    """
    if strength <= 0:
        return 1.0
    # Normaliza strength de 0 a 1
    normalized = min(strength, 100) / 100.0
    # Expoente definido para f(60)=2.0 e f(100)=2.5
    exponent = math.log(2/3) / math.log(0.6)
    return 1.0 + 1.5 * (normalized ** exponent)

def calculate_vitality_regeneration(vitality):
    """
    Calcula a quantidade de revisões necessárias para regenerar 1 HP.
    
    Progressão:
      Vitality 1: 1 HP a cada 500 revisões
      Vitality 100: 1 HP a cada 20 revisões
    """
    if vitality <= 0:
        return 500
    return max(20, 500 - (vitality - 1) * (480 / 99))

def calculate_resistance_block(resistance, block_bonus=0.0):
    """
    Bloqueio (%) = curva customizada com teto 20%:
      - ~10% em resistance=30
      - ~15% em resistance=60
      - 20% em resistance=100
    + bônus de talentos (block_bonus).
    """
    if resistance <= 0:
        base = 0.0
    else:
        normalized = min(resistance, 100) / 100.0
        exponent = math.log(0.75) / math.log(0.6)
        base = 20.0 * (normalized ** exponent)
    return base + block_bonus

def calculate_luck_bonus(luck, rarity):
    """
    Calcula o bônus de probabilidade baseado na sorte e raridade do item.
    
    Progressão por raridade:
      - Raro: +0.1% por ponto de sorte
      - Épico: +0.075% por ponto de sorte
      - Lendário: +0.05% por ponto de sorte
      - Heroico: +0.02% por ponto de sorte
      - Especial: Não influenciado pela sorte
    """
    if luck <= 0:
        return 0.0        
    if rarity == "Raro":
        return luck * 0.1
    elif rarity == "Épico":
        return luck * 0.075
    elif rarity == "Lendário":
        return luck * 0.05
    elif rarity == "Heroico":
        return luck * 0.02
    else:  # Comum ou Especial
        return 0.0

def calculate_concentration_regeneration(concentration):
    """
    Calcula a quantidade de revisões necessárias para regenerar 1 MP.
    Usa a mesma fórmula da vitalidade.
    
    Progressão:
      Concentration 1: 1 MP a cada 500 revisões
      Concentration 100: 1 MP a cada 20 revisões
    """
    return calculate_vitality_regeneration(concentration)

def calculate_max_hp(vitality):
    """Calcula o HP máximo baseado na vitalidade."""
    return 80

def calculate_critical_chance(luck, crit_item_bonus=0, crit_talent_bonus=0):
    """
    Calcula a chance crítica total.
    
    - Base: 5% (0.05)
    - Cada ponto de Sorte aumenta a chance de crítico em 0,1% (luck * 0.001)
    - Bônus adicionais (de itens/talentos) podem ser informados.
    """
    base_chance = 0.05
    luck_bonus = luck * 0.001  # 0,2% por ponto de sorte
    total_chance = base_chance + luck_bonus + crit_item_bonus + crit_talent_bonus
    # Limitar a chance crítica máxima a 75%
    return min(total_chance, 0.75)

def calculate_critical_bonus(luck, crit_item_bonus=0, crit_talent_bonus=0):
    """
    Calcula o bônus de dano crítico.
    
    - Base: 50% de bônus (0.50)
    - Cada ponto de Sorte aumenta o bônus crítico em 0,2% (luck * 0.002)
    - Bônus adicionais de itens/talentos podem ser informados.
    """
    base_bonus = 0.05
    luck_bonus = luck * 0.003  # 0,5% por ponto de sorte
    return base_bonus + luck_bonus + crit_item_bonus + crit_talent_bonus

def calculate_dodge_chance(luck, dodge_item_bonus=0, dodge_talent_bonus=0):
    """
    Calcula a chance de esquiva do personagem.
    
    - Base: 5% (0.05)
    - Cada ponto de Sorte aumenta a chance de esquiva em 0,1% (luck * 0.001)
    - Bônus adicionais de itens/talentos podem ser informados.
    """
    base_dodge = 0.05
    luck_bonus = luck * 0.001  # 0,10% por ponto de sorte
    return base_dodge + luck_bonus + dodge_item_bonus + dodge_talent_bonus

if __name__ == "__main__":
    # Testar fórmulas
    for strength in [0, 10, 30, 70, 100]:
        print(f"Força {strength}: Dano base {calculate_strength_damage(strength):.2f}")
    
    for vitality in [1, 25, 50, 75, 100]:
        print(f"Vitalidade {vitality}: 1 HP a cada {calculate_vitality_regeneration(vitality):.0f} revisões")
    
    for resistance in [1, 10, 50, 100]:
        print(f"Resistência {resistance}: {calculate_resistance_block(resistance):.1f}% de bloqueio")
    
    luck = 50
    print("Chance Crítica:", calculate_critical_chance(luck))
    print("Bônus Crítico:", calculate_critical_bonus(luck))
    print("Chance de Esquiva:", calculate_dodge_chance(luck))
