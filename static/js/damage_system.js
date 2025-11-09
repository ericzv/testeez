// damage_system.js - Sistema Centralizado de Dano (JavaScript)
// Versão equivalente ao damage_system.py

// Função auxiliar para calcular dano de força (equivalente ao game_formulas.py)
function calculateStrengthDamage(strength) {
    if (strength <= 0) return 1.0;
    const normalized = Math.min(strength, 100) / 100.0;
    const exponent = Math.log(2/3) / Math.log(0.6);
    return 1.0 + 1.5 * Math.pow(normalized, exponent);
}

// Função auxiliar para calcular chance de crítico
function calculateCriticalChance(luck, critItemBonus = 0, critTalentBonus = 0) {
    const baseChance = 0.05;
    const luckBonus = luck * 0.001;
    const totalChance = baseChance + luckBonus + critItemBonus + critTalentBonus;
    return Math.min(totalChance, 0.75);
}

// Função auxiliar para calcular bônus de crítico
function calculateCriticalBonus(luck, critItemBonus = 0, critTalentBonus = 0) {
    const baseBonus = 0.05;
    const luckBonus = luck * 0.003;
    return baseBonus + luckBonus + critItemBonus + critTalentBonus;
}

/**
 * Sistema centralizado de cálculo de dano (JavaScript)
 * 
 * @param {Object} player - Objeto do jogador
 * @param {Object} skill - Objeto da skill usada
 * @param {number} damagePoints - Pontos de revisão gastos
 * @param {Array} activeBuffs - Lista de buffs ativos (opcional)
 * @param {Object} runBuffs - Bônus de lembranças (opcional)
 * @param {boolean} isCritical - Se deve ser crítico (null = calcular automaticamente)
 * @returns {Object} { damage, isCritical, breakdown }
 */
function calculateTotalDamage(player, skill, damagePoints, activeBuffs = null, runBuffs = null, isCritical = null) {
    // 1. DANO BASE = 1 por ponto de dano
    const baseDamage = damagePoints;
    
    // 2. CALCULAR TODOS OS BÔNUS ADITIVOS (em %)
    let totalBonus = 0.0;
    const breakdown = {
        baseDamage: damagePoints,
        strengthBonus: 0.0,
        skillBonus: 0.0,
        playerBonus: 0.0,
        buffsBonus: 0.0,
        memoryBonus: 0.0,
        talentBonus: 0.0,
        totalBonusPercentage: 0.0,
        damageBeforeCrit: 0,
        criticalMultiplier: 1.0,
        finalDamage: 0
    };
    
    // BÔNUS DE FORÇA
    const strengthMultiplier = calculateStrengthDamage(player.strength);
    const strengthBonus = strengthMultiplier - 1.0; // Converter para % (ex: 1.24 vira 0.24 = 24%)
    totalBonus += strengthBonus;
    breakdown.strengthBonus = strengthBonus;
    
    // BÔNUS DA SKILL
    let skillBonus = skill.damageModifier || 0.0;
    // Se skill.damageModifier é 1.2, converter para 0.2 (20% de bônus)
    if (skillBonus > 1.0) {
        skillBonus = skillBonus - 1.0;
    }
    totalBonus += skillBonus;
    breakdown.skillBonus = skillBonus;
    
    // BÔNUS GERAL DO PLAYER
    const playerBonus = player.damageBonus || 0.0;
    totalBonus += playerBonus;
    breakdown.playerBonus = playerBonus;
    
    // BÔNUS DE BUFFS ATIVOS
    let buffsBonus = 0.0;
    if (activeBuffs) {
        activeBuffs.forEach(buff => {
            if (!buff.is_expired && buff.effect_type === 'damage') {
                buffsBonus += buff.effect_value;
            }
        });
    }
    totalBonus += buffsBonus;
    breakdown.buffsBonus = buffsBonus;
    
    // BÔNUS DE LEMBRANÇAS (RUN BUFFS)
    let memoryBonus = 0.0;
    if (runBuffs) {
        memoryBonus = runBuffs.damage_global || 0.0;
        // Adicionar bônus específicos por tipo de skill se implementado futuramente
    }
    totalBonus += memoryBonus;
    breakdown.memoryBonus = memoryBonus;
    
    // BÔNUS DE TALENTOS
    let talentBonus = 0.0;
    // Bônus quando HP baixo
    if (player.lowHpDamageBonus && player.hp < player.maxHp * 0.3) {
        talentBonus += player.lowHpDamageBonus;
    }
    totalBonus += talentBonus;
    breakdown.talentBonus = talentBonus;
    
    // 3. CALCULAR DANO ANTES DO CRÍTICO
    breakdown.totalBonusPercentage = totalBonus;
    const damageBeforeCrit = Math.floor(baseDamage * (1.0 + totalBonus));
    breakdown.damageBeforeCrit = damageBeforeCrit;
    
    // 4. VERIFICAR CRÍTICO
    if (isCritical === null) {
        // Calcular chance de crítico automaticamente
        const critChance = calculateCriticalChance(
            player.luck,
            player.critical_chance_item_bonus || 0,
            player.critical_chance_bonus || 0
        );
        
        // Adicionar bônus de crítico de buffs
        let critChanceBonus = 0.0;
        if (activeBuffs) {
            activeBuffs.forEach(buff => {
                if (!buff.is_expired && buff.effect_type === 'crit_chance') {
                    critChanceBonus += buff.effect_value;
                }
            });
        }
        
        const totalCritChance = critChance + critChanceBonus;
        isCritical = Math.random() < totalCritChance;
    }
    
    // 5. APLICAR MULTIPLICADOR DE CRÍTICO
    let criticalMultiplier = 1.0;
    if (isCritical) {
        // Calcular bônus de crítico
        const critBonus = calculateCriticalBonus(
            player.luck,
            player.critical_damage_item_bonus || 0,
            player.critical_damage_bonus || 0
        );
        
        // Adicionar bônus de crítico de buffs
        let critDamageBonus = 0.0;
        if (activeBuffs) {
            activeBuffs.forEach(buff => {
                if (!buff.is_expired && buff.effect_type === 'crit_damage') {
                    critDamageBonus += buff.effect_value;
                }
            });
        }
        
        criticalMultiplier = 1.5 + critBonus + critDamageBonus;
    }
    
    breakdown.criticalMultiplier = criticalMultiplier;
    
    // 6. DANO FINAL
    const finalDamage = Math.floor(damageBeforeCrit * criticalMultiplier);
    breakdown.finalDamage = finalDamage;
    
    return {
        damage: finalDamage,
        isCritical: isCritical,
        breakdown: breakdown
    };
}

/**
 * Gera texto legível do detalhamento do dano para logs/debug
 */
function getDamageBreakdownText(breakdown) {
    return `
=== CÁLCULO DE DANO CENTRALIZADO ===
Dano Base: ${breakdown.baseDamage} pontos
Bônus de Força: +${(breakdown.strengthBonus * 100).toFixed(1)}%
Bônus da Skill: +${(breakdown.skillBonus * 100).toFixed(1)}%
Bônus do Player: +${(breakdown.playerBonus * 100).toFixed(1)}%
Bônus de Buffs: +${(breakdown.buffsBonus * 100).toFixed(1)}%
Bônus de Lembranças: +${(breakdown.memoryBonus * 100).toFixed(1)}%
Bônus de Talentos: +${(breakdown.talentBonus * 100).toFixed(1)}%
----------------------------------------
Total de Bônus: +${(breakdown.totalBonusPercentage * 100).toFixed(1)}%
Dano antes do Crítico: ${breakdown.damageBeforeCrit}
Multiplicador Crítico: ${breakdown.criticalMultiplier.toFixed(2)}x
----------------------------------------
DANO FINAL: ${breakdown.finalDamage}
====================================`.trim();
}