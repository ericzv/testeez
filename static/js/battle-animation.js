// battle-animation.js - Sistema de animações e combate (versão modular)
// Versão 1.0

// === CACHE GLOBAL DE SKILLS ===
// id → objeto   |   nome (lowercase) → objeto
window.SKILL_LOOKUP = {};

// Alinhar HUDs com os personagens
function alignHUDs() {
    const characterHud = document.querySelector('.character-hud');
    const bossHud = document.querySelector('.boss-hud');
    
    // Verificar se isMobile está definido, caso contrário, defini-lo
    if (typeof isMobile === 'undefined') {
        isMobile = window.innerWidth <= 768;
    }
    
    if (!characterHud || !bossHud) {
        console.error("HUDs não encontrados para alinhamento");
        return;
    }
    
    if (isMobile) {
        // Posicionamento fixo para mobile (não alterar)
        return;
    }
  
    // PRIMEIRO: Resetar todos os estilos de posicionamento para evitar conflitos
    characterHud.style.left = "";
    characterHud.style.right = "";
    characterHud.style.bottom = "";
    characterHud.style.top = "";
    characterHud.style.transform = "";
    characterHud.style.opacity = "";
    characterHud.style.visibility = "";
    
    bossHud.style.left = "";
    bossHud.style.right = "";
    bossHud.style.bottom = "";
    bossHud.style.top = "";
    bossHud.style.transform = "";
    bossHud.style.opacity = "";
    bossHud.style.visibility = "";
    
    // SEGUNDO: Aplicar posicionamento específico baseado na view atual
    if (gameState.zoomedView) {
        // Na zoom-view:
        // 1. Character HUD deve ser escondido
        characterHud.style.opacity = "0";
        characterHud.style.visibility = "hidden";
        
        // 2. Boss HUD deve aparecer acima do boss
        bossHud.style.right = "auto";
        bossHud.style.left = "50%";
        bossHud.style.bottom = "auto";
        bossHud.style.top = "20%";
        bossHud.style.transform = "translateX(-50%)";
        bossHud.style.opacity = "1";
        bossHud.style.visibility = "visible";
    }
    else if (gameState.characterView) {
        // Na character-view, ambos HUDs devem ser escondidos
        characterHud.style.opacity = "0";
        characterHud.style.visibility = "hidden";
        bossHud.style.opacity = "0";
        bossHud.style.visibility = "hidden";
    }
    else if (gameState.bossView) {
        // Na boss-view, ambos HUDs devem ser escondidos
        characterHud.style.opacity = "0";
        characterHud.style.visibility = "hidden";
        bossHud.style.opacity = "0";
        bossHud.style.visibility = "hidden";
    }
    else {
        // Na tela inicial:
        // Obter posições atuais dos personagens
        const characterRect = character.getBoundingClientRect();
        const bossRect = boss.getBoundingClientRect();
        
        // 1. Character HUD deve ficar embaixo do personagem
        if (characterRect) {
            const characterHudLeft = characterRect.left + (characterRect.width / 2);
            characterHud.style.left = `${characterHudLeft}px`;
            characterHud.style.bottom = '5%';
            characterHud.style.top = 'auto';
            characterHud.style.transform = 'translateX(-50%)';
            characterHud.style.opacity = '1';
            characterHud.style.visibility = 'visible';
        }
        
        // 2. Boss HUD deve ficar embaixo do boss
        if (bossRect) {
            const bossHudLeft = bossRect.left + (bossRect.width / 2);
            bossHud.style.left = `${bossHudLeft}px`;
            bossHud.style.right = 'auto';
            bossHud.style.bottom = '5%';
            bossHud.style.top = 'auto';
            bossHud.style.transform = 'translateX(-50%)';
            bossHud.style.opacity = '1';
            bossHud.style.visibility = 'visible';
        }
    }
}

// Atualizar card de status do jogador
function updatePlayerStatusCard() {
    console.log("Atualizando card de status do jogador");
    
    // Verificar se o gameState está disponível
    if (!window.gameState || !window.gameState.player) {
        console.error("gameState não disponível para atualizar o card de status");
        return;
    }
    
    // Referências aos elementos do card
    const pointsEl = document.getElementById('player-status-points');
    const hpEl = document.getElementById('player-status-hp');
    const mpEl = document.getElementById('player-status-mp');
    const damageEl = document.getElementById('player-status-damage');
    const critChanceEl = document.getElementById('player-status-crit-chance');
    const critBonusEl = document.getElementById('player-status-crit-bonus');
    const blockEl = document.getElementById('player-status-block');
    const dodgeEl = document.getElementById('player-status-dodge');
    const lifestealEl = document.getElementById('player-status-lifesteal');
    const lifestealContainer = document.getElementById('player-status-lifesteal-container');
    const buffsContainer = document.getElementById('player-buffs-container');
    
    if (!pointsEl || !hpEl || !damageEl || !critChanceEl || !critBonusEl || 
        !blockEl || !dodgeEl || !lifestealEl || !lifestealContainer || !buffsContainer) {
        console.error("Elementos do card de status não encontrados");
        return;
    }
    
    // Valores base do jogador
    const player = window.gameState.player;
    
    // Buscar valores atuais
    const points = window.gameState.revisionPoints || 0;
    const hp = player.hp || 0;
    const maxHp = player.maxHp || 100;
    const mp = player.mp || 0;
    const maxMp = player.maxMp || 50;
    const baseDamage = player.strengthDamage || 1.0;
    const damageBonus = player.damageBonus || 0;
    const damageMultiplier = player.damageMultiplier || 1.0;
    
    // Valores base para crítico e esquiva
    const luck = parseInt(document.getElementById('player_luck')?.innerText || '0');
    const critChanceBase = 0.05 + (luck * 0.001); // 5% base + 0.1% por ponto de sorte
    const critBonusBase = 0.50 + (luck * 0.003);  // 50% base + 0.3% por ponto de sorte
    
    // Bônus de talentos e equipamentos (valores ocultos no DOM)
    const critBonusItem = parseFloat(document.getElementById('player_crit_bonus')?.innerText || '0');
    const dodgeChance = parseFloat(document.getElementById('player_dodge_chance')?.innerText || '0');
    const blockBonus = parseFloat(document.getElementById('player_block_bonus')?.innerText || '0');
    
    // Variáveis para rastrear bônus exclusivamente de buffs ativos
    let damageBuffValue = 0;
    let critChanceBuffValue = 0;
    let critBonusBuffValue = 0;
    let dodgeBuffValue = 0;
    let blockBuffValue = 0;
    let lifestealBuffValue = 0;

    // Função auxiliar para extrair valor numérico de uma string
    function extractBuffValue(valueStr) {
        if (typeof valueStr !== 'string') return 0;
        const match = valueStr.match(/([+-]?\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
    }

    // Processar skills ativas para extrair os valores de buff
    if (player.active_skills && player.active_skills.length > 0) {
        player.active_skills.forEach(skill => {
            if (skill.effects && skill.effects.length > 0) {
                skill.effects.forEach(effect => {
                    const effectValue = extractBuffValue(effect.value);
                    const effectTypeLower = effect.type.toLowerCase(); // Converter para minúsculas para facilitar a comparação

                    // Condição mais específica para bônus de dano ofensivo
                    if ((effectTypeLower.includes('dano') || effectTypeLower.includes('damage')) && // Contém "dano" ou "damage"
                        !effectTypeLower.includes('crítico') && !effectTypeLower.includes('critico') && // E NÃO é sobre dano crítico
                        !effectTypeLower.includes('redução') && !effectTypeLower.includes('reduction') && // E NÃO é sobre redução de dano
                        !effectTypeLower.includes('recebido') && !effectTypeLower.includes('taken') && // E NÃO é sobre dano recebido/sofrido
                        !effectTypeLower.includes('lifesteal') && !effectTypeLower.includes('roubo de vida') && // E NÃO é sobre roubo de vida
                        !effectTypeLower.includes('ao longo do tempo') && !effectTypeLower.includes('over time') // E NÃO é dano ao longo do tempo (DoT)
                    ) {
                        damageBuffValue += effectValue;
                    } else if (effectTypeLower.includes('chance crítico') || effectTypeLower.includes('crit chance')) {
                        critChanceBuffValue += effectValue / 100; // Convertendo % para decimal
                    } else if (effectTypeLower.includes('dano crítico') || effectTypeLower.includes('crit damage')) {
                        critBonusBuffValue += effectValue / 100; // Convertendo % para decimal
                    } else if (effectTypeLower.includes('esquiva') || effectTypeLower.includes('dodge')) {
                        dodgeBuffValue += effectValue / 100; // Convertendo % para decimal
                    } else if (effectTypeLower.includes('bloqueio') || effectTypeLower.includes('block')) {
                        // Supondo que blockBuffValue já esteja em formato decimal ou será tratado como percentual
                        blockBuffValue += effectTypeLower.includes('%') ? effectValue / 100 : effectValue;
                    } else if (effectTypeLower.includes('roubo de vida') || effectTypeLower.includes('lifesteal')) {
                        lifestealBuffValue += effectValue / 100; // Convertendo % para decimal
                    }
                });
            }
        });
    }

    // Flag para indicar se há roubo de vida
    let hasLifesteal = false;

    // Inicializar valores modificados com os valores base
    let modifiedDamage = baseDamage + damageBonus;
    let modifiedCritChance = critChanceBase + critBonusItem;
    let modifiedCritBonus = critBonusBase;
    let modifiedDodge = dodgeChance;
    let modifiedBlock = blockBonus;
    let lifestealValue = player.heal_on_damage_percent || 0;

    // Adicionar os bônus de buffs
    modifiedDamage += damageBuffValue;
    modifiedCritChance += critChanceBuffValue;
    modifiedCritBonus += critBonusBuffValue;
    modifiedDodge += dodgeBuffValue;
    modifiedBlock += blockBuffValue;
    lifestealValue += lifestealBuffValue;
    
    // Flags para indicar quais status estão com buff/debuff - APENAS baseado em buffs ativos
    const statModifiers = {
        damage: damageBuffValue > 0,
        critChance: critChanceBuffValue > 0,
        critBonus: critBonusBuffValue > 0,
        dodge: dodgeBuffValue > 0,
        block: blockBuffValue > 0,
        lifesteal: lifestealBuffValue > 0
    };
    
    // Limpar container de buffs
    buffsContainer.innerHTML = '';
    
    // Verificar e renderizar buffs ativos
    const activeBuffs = player.active_skills || [];
    
    if (activeBuffs.length === 0) {
        // Se não há buffs ativos, mostrar mensagem
        const noBuff = document.createElement('div');
        noBuff.textContent = "Nenhum buff ativo";
        noBuff.style.color = "#aaa";
        noBuff.style.fontSize = "12px";
        noBuff.style.padding = "5px 0";
        buffsContainer.appendChild(noBuff);
    } else {
        // Renderizar cada buff ativo
        activeBuffs.forEach(buff => {
            // Criar elemento de buff
            const buffEl = document.createElement('div');
            buffEl.className = 'player-buff';
            
            // Adicionar ícone do buff
            if (buff.icon) {
                // Criar elemento de imagem
                const iconImg = document.createElement('img');
                iconImg.src = buff.icon;
                iconImg.alt = buff.name || 'Buff';
                iconImg.draggable = false; // Evita comportamento de arrastar
                
                // Tratar erro de carregamento de imagem
                iconImg.onerror = function() {
                    console.error("Erro ao carregar ícone:", buff.icon);
                    this.remove();
                    buffEl.textContent = (buff.name || 'B').charAt(0).toUpperCase();
                    buffEl.style.fontSize = "22px";
                    buffEl.style.fontWeight = "bold";
                    buffEl.style.backgroundColor = "#6a2080";
                };
                
                // Adicionar a imagem ao buff
                buffEl.appendChild(iconImg);
            } else {
                // Se não tiver ícone, mostrar a primeira letra do nome
                buffEl.textContent = (buff.name || 'B').charAt(0).toUpperCase();
                buffEl.style.fontSize = "22px";
                buffEl.style.fontWeight = "bold";
                buffEl.style.backgroundColor = "#6a2080";
            }
            
            // Adicionar contador de duração
            const durationEl = document.createElement('div');
            durationEl.className = 'buff-duration';
            
            if (buff.duration) {
                durationEl.textContent = buff.duration;
            }
            
            buffEl.appendChild(durationEl);
            
            // Adicionar tooltip com o nome da skill e seus efeitos
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'buff-tooltip';
            
            // Criar conteúdo do tooltip: nome da skill seguido dos efeitos
            let tooltipContent = `<strong>${buff.name || 'Buff'}</strong><br>`;
            
            // Adicionar cada efeito da skill
            if (buff.effects && buff.effects.length > 0) {
                buff.effects.forEach(effect => {
                    tooltipContent += `${effect.type}: ${effect.value}<br>`;
                    
                    // Verificar se há lifesteal entre os efeitos
                    if (effect.type && effect.type.toLowerCase().includes('roubo de vida')) {
                        hasLifesteal = true;
                        const valueMatch = String(effect.value).match(/([+-]?\d+(\.\d+)?)%?/);
                        if (valueMatch) {
                            let effectValue = parseFloat(valueMatch[1]);
                            if (String(effect.value).includes('%') && Math.abs(effectValue) > 1) {
                                effectValue = effectValue / 100;
                            }
                            lifestealValue += effectValue;
                            statModifiers.lifesteal = true;
                        }
                    }
                });
            }
            
            tooltipEl.innerHTML = tooltipContent.trim();
            buffEl.appendChild(tooltipEl);
            
            // Adicionar ao container
            buffsContainer.appendChild(buffEl);
        });
    }
    
    // Verificar se existe talento de roubo de vida (heal_on_damage_percent)
    if (player.heal_on_damage_percent > 0) {
        lifestealValue += player.heal_on_damage_percent;
        hasLifesteal = true;
    }
    
    // Atualizar os valores no card
    pointsEl.textContent = points;
    hpEl.textContent = `${hp}/${maxHp}`;
    mpEl.textContent = `${mp}/${maxMp}`;
    
    // Aplicar classe de modificação (buff/debuff) nos valores alterados
    damageEl.textContent = `${modifiedDamage.toFixed(1)}`;
    damageEl.className = statModifiers.damage ? 'stat-value buffed' : 'stat-value';
    
    critChanceEl.textContent = `${(modifiedCritChance * 100).toFixed(1)}%`;
    critChanceEl.className = statModifiers.critChance ? 'stat-value buffed' : 'stat-value';
    
    critBonusEl.textContent = `${(modifiedCritBonus * 100).toFixed(1)}%`;
    critBonusEl.className = statModifiers.critBonus ? 'stat-value buffed' : 'stat-value';
    
    blockEl.textContent = `${(modifiedBlock).toFixed(1)}%`;
    blockEl.className = statModifiers.block ? 'stat-value buffed' : 'stat-value';
    
    dodgeEl.textContent = `${(modifiedDodge * 100).toFixed(1)}%`;
    dodgeEl.className = statModifiers.dodge ? 'stat-value buffed' : 'stat-value';
    
    // Sempre mostrar o roubo de vida, independente do valor
    lifestealContainer.style.display = 'flex'; // Sempre visível

    // Se tiver roubo de vida, exibe o valor real, senão exibe 0%
    if (hasLifesteal) {
        lifestealEl.textContent = `${(lifestealValue * 100).toFixed(1)}%`;
        lifestealEl.className = statModifiers.lifesteal ? 'stat-value buffed' : 'stat-value';
    } else {
        lifestealEl.textContent = '0.0%';
        lifestealEl.className = 'stat-value'; // Sem classe buffed quando for 0
    }
    
    console.log("Card de status atualizado com sucesso");
}

    /**
     * triggerAttack(idOuNome)
     * Ex.: triggerAttack(13)  ou  triggerAttack('Martelo Divino')
     */
    window.triggerAttack = function (idOrName) {

        // Normaliza a chave de busca (ID numérico ou nome em minúsculas)
        const key = (typeof idOrName === 'number')
            ? idOrName
            : idOrName.toString().toLowerCase();

        // Pega a skill no cache criado em SKILL_LOOKUP
        const raw = window.SKILL_LOOKUP[key];
        if (!raw) {
            console.error(`❌ Skill não encontrada: ${idOrName}`);
            return;
        }

        // Ajusta campos para o formato esperado pelo performAttack
        const skill = {
            ...raw,
            manaCost: raw.manaCost ?? raw.mana_cost ?? 0,
            pointsCost: raw.pointsCost ?? raw.points_cost ?? 0,
            damageModifier: raw.damageModifier ?? raw.damage_modifier ?? 1,
            animation_fx_a: raw.animation_fx_a ?? raw.fxA,
            animation_fx_b: raw.animation_fx_b ?? raw.fxB
        };

        // Dispara o ataque
        performAttack(skill);
    };

    console.log(
        '%ctriggerAttack(idOuNome) pronto!  ➜  triggerAttack(1)  ou  triggerAttack("Ataque Básico")',
        'color:#4CAF50;font-weight:bold'
    );

    /**
     * Carrega TODAS as skills no cache para testes manuais.
     * Uso:
     *   await loadAllSkillsForTesting();      // popula o cache
     *   triggerAttack('explosão arcana');     // funciona mesmo se o player não tem a skill
     */
    window.loadAllSkillsForTesting = async function () {
        if (window.SKILL_LOOKUP.__allLoaded) {
            console.warn('⚠️ Todas as skills já estão no cache.');
            return;
        }
        try {
            const res = await fetch('/gamification/debug/all_skills');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { skills } = await res.json();

            skills.forEach(skill => {
                window.SKILL_LOOKUP[skill.id] = skill;
                window.SKILL_LOOKUP[skill.name.toLowerCase()] = skill;
            });

            window.SKILL_LOOKUP.__allLoaded = true;
            console.log(`✅ ${skills.length} skills carregadas para testes.`);
        } catch (err) {
            console.error('❌ Falha ao carregar habilidades de debug:', err);
        }
    };

// Mostrar número de dano
function showDamageNumber(damage, isCritical) {
    // Log dos pontos de dano após o ataque
    //console.log("%c=== PONTOS DE DANO APÓS O ATAQUE ===", "background: #333; color: #bada55; font-size: 14px");
    //console.log(`Dano causado: ${damage}${isCritical ? ' (CRÍTICO!)' : ''}`);
    //console.log(`Pontos de dano restantes: ${gameState.revisionPoints}`);
    //console.log(`HP atual do boss: ${gameState.boss.hp}/${gameState.boss.maxHp}`);
    //console.log("%c====================================", "background: #333; color: #bada55; font-size: 14px");
    
    const damageNumber = document.createElement('div');
    damageNumber.classList.add('damage-number');
    if (isCritical) {
        damageNumber.classList.add('critical-hit');
        damageNumber.textContent = '❗' + damage;
    } else {
        damageNumber.textContent = '-' + damage;
    }
    // Posicionamento (ajuste conforme necessário)
    damageNumber.style.left = `${boss.offsetLeft + boss.offsetWidth / 2}px`;
    damageNumber.style.top = `${boss.offsetTop + boss.offsetHeight / 3}px`;
    damageNumber.style.zIndex = '60';
    battleArena.appendChild(damageNumber);

    // Remover após animação
    setTimeout(() => { damageNumber.remove(); }, 2000); // Tempo da animação damageFloat
}

// Exibir mensagem de resultado de ataque
function showAttackResultMessage(skill, damage, isCritical) {
    if (isCritical) {
        battleMessage.textContent = `CRÍTICO! Você causou ${damage} pontos de dano com ${skill.name}!`;
    } else {
        battleMessage.textContent = `Você causou ${damage} pontos de dano com ${skill.name}!`;
    }
    battleMessage.classList.add('visible');
    setTimeout(() => { battleMessage.classList.remove('visible'); }, 3000); // Duração da mensagem
}

// Efeitos de acerto crítico
function triggerCriticalEffects() {
    // Som genérico de crítico
    playSound('/static/game.data/sounds/critical.mp3', 0.7);
    
    const flashDiv = document.getElementById("critical-flash");
    flashDiv.style.opacity = 0.8;
    battleArena.classList.add('screen-shake');
    
    setTimeout(() => {
        flashDiv.style.opacity = 0;
        battleArena.classList.remove('screen-shake');
    }, 150);
}

// Mostrar mensagens de efeitos especiais
function showExtraEffectsMessages(messages) {
    if (!messages || messages.length === 0) return;
    
    // Juntar todas as mensagens em uma única string
    const combinedMessage = messages.join(" • ");
    
    // Criar um elemento de mensagem especial
    const effectsEl = document.createElement('div');
    effectsEl.className = 'battle-effects-message';
    effectsEl.textContent = combinedMessage;
    effectsEl.style.cssText = `
        position: fixed;
        bottom: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(60, 20, 120, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 0 15px rgba(120,60,255,0.5);
        animation: effectsMessageFade 3s forwards;
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(effectsEl);
    
    // Remover após 3 segundos
    setTimeout(() => {
        effectsEl.remove();
    }, 3000);
}

function logAttackDetails(skill, damage, isCritical) {
    console.group(`🔥 Log de Ataque: ${skill.name}`);
    console.log('⚔️ Informações do Ataque:', {
        skill: skill.name,
        id: skill.id,
        pontosDeRevisãoGastos: skill.pointsCost,
        custoMana: skill.manaCost
    });
    console.log('🎮 Resultado Final:', {
        danoReal: damage, // Vai vir do servidor
        crítico: isCritical,
        observação: 'Valores corretos do backend'
    });
    console.groupEnd();
}

// Integração com sistema de limpeza existente - Atenção! Funções de limpeza podem ser responsáveis por remover efeitos visuais
function cleanupAllEffects(callerFunction = 'cleanupAllEffects') {
    console.log("🧹 Limpando todos os efeitos visuais - Função:", callerFunction);
    
    // Limpar efeitos PixiJS
    if (typeof cleanupAllPixiEffects === 'function') {
        cleanupAllPixiEffects(callerFunction);
    }

    // Reset completo do sistema PixiJS para evitar problemas de reutilização
    if (typeof resetPixiSystem === 'function') {
        resetPixiSystem();
    }
    
    // Limpar sprites existentes (código atual)
    if (fxLayerA) {
        fxLayerA.style.opacity = '0';
        fxLayerA.classList.remove('animate-fx');
    }
    if (fxLayerB) {
        fxLayerB.style.opacity = '0';
        fxLayerB.classList.remove('animate-fx');
    }
    
    // Limpar sprites de skills especiais
    document.querySelectorAll('.skill-fx-layer').forEach(el => el.remove());
    
    console.log("🧹 Limpeza de efeitos concluída");
}

// Expor função globalmente
// Sistema de vinhetas de ataque
window.attackVignetteSystem = {
    canvas: null,
    app: null,
    currentVignette: null,
    isActive: false
};

// Inicializar sistema de vinhetas
function initializeAttackVignetteSystem() {
    console.log("🎬 Inicializando sistema de vinhetas de ataque");
    
    const canvas = document.getElementById('attack-vignette-canvas');
    if (!canvas) {
        console.error("❌ Canvas de vinheta não encontrado!");
        return false;
    }
    
    // Configurar canvas para tela cheia
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Criar aplicação PixiJS para vinhetas
    window.attackVignetteSystem.canvas = canvas;
    window.attackVignetteSystem.app = new PIXI.Application({
        view: canvas,
        width: canvas.width,
        height: canvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    
    console.log("✅ Sistema de vinhetas inicializado");
    return true;
}

// Tocar vinheta de ataque
function playAttackVignette(vignetteName) {
    if (!vignetteName || !window.ATTACK_VIGNETTES || !window.ATTACK_VIGNETTES[vignetteName]) {
        console.log("⚠️ Vinheta não encontrada:", vignetteName);
        return false;
    }
    
    const vignetteData = window.ATTACK_VIGNETTES[vignetteName];
    console.log("🎬 Iniciando vinheta:", vignetteName);
    
    // Limpar vinheta anterior se existir
    cleanupAttackVignette();
    
    const app = window.attackVignetteSystem.app;
    if (!app) {
        console.error("❌ Sistema de vinhetas não inicializado!");
        return false;
    }
    
    // Garantir que canvas esteja sempre visível
    console.log("Garantindo visibilidade do canvas da vinheta");
    window.attackVignetteSystem.canvas.style.opacity = '1';
    window.attackVignetteSystem.isActive = true;
    
    // Container principal da vinheta
    const vignetteContainer = new PIXI.Container();
    app.stage.addChild(vignetteContainer);
    window.attackVignetteSystem.currentVignette = vignetteContainer;
    
    // Criar partículas se especificadas
    if (vignetteData.particles) {
        const particlesTop = createVignetteParticles(vignetteData.particles, 'top');
        const particlesBottom = createVignetteParticles(vignetteData.particles, 'bottom');
        
        if (particlesTop) vignetteContainer.addChild(particlesTop);
        if (particlesBottom) vignetteContainer.addChild(particlesBottom);
    }
    
    // Criar vinheta horizontal
    if (vignetteData.vignette) {
        console.log("🔍 DEBUG: vignetteData.vignette =", vignetteData.vignette);
        const horizontalVignette = createHorizontalVignette(vignetteData.vignette);
        console.log("🔍 DEBUG: horizontalVignette criado =", horizontalVignette);
        if (horizontalVignette) {
            vignetteContainer.addChild(horizontalVignette);
            console.log("✅ DEBUG: Vinheta horizontal ADICIONADA ao container");
            console.log("🔍 DEBUG: horizontalVignette.alpha =", horizontalVignette.alpha);
            console.log("🔍 DEBUG: horizontalVignette.visible =", horizontalVignette.visible);
        } else {
            console.log("❌ DEBUG: horizontalVignette é NULL!");
        }
    }
    
    // Aplicar filtros se especificados
    if (vignetteData.filters) {
        console.log("🔍 DEBUG: vignetteData.filters =", vignetteData.filters);
        const filters = createVignetteFilters(vignetteData.filters);
        console.log("🔍 DEBUG: filters criados =", filters);
        if (filters.length > 0) {
            vignetteContainer.filters = filters;
            console.log("✅ DEBUG: Filtros APLICADOS ao container");
            console.log("🔍 DEBUG: vignetteContainer.filters =", vignetteContainer.filters);
        } else {
            console.log("❌ DEBUG: Nenhum filtro para aplicar!");
        }
    }

    // ========== CRIAR ELEMENTOS GRÁFICOS VETORIAIS ==========
    if (vignetteData.graphicElements && vignetteData.graphicElements.enabled) {
        console.log("🎨 Criando elementos gráficos para vinheta:", vignetteName);
        try {
            const graphicsContainer = createGraphicElements(vignetteData, app);
            if (graphicsContainer) {
                vignetteContainer.addChild(graphicsContainer);
                console.log("✅ Elementos gráficos adicionados à vinheta");
            }
        } catch (error) {
            console.error("❌ Erro ao criar elementos gráficos:", error);
        }
    }

    // ========== APLICAR SHADER CUSTOMIZADO ==========
    if (vignetteData.customShader && vignetteData.customShader.enabled) {
        try {
            applyCustomShader(vignetteData, vignetteContainer, app);
            console.log("✅ Shader customizado aplicado à vinheta");
        } catch (error) {
            console.error("❌ Erro ao aplicar shader customizado:", error);
        }
    }
    
    return true;
}

// Criar partículas para as vinhetas
function createVignetteParticles(particleConfig, position) {
    try {
        const particleContainer = new PIXI.Container();
        const particles = [];
        
        // Posicionamento atualizado para as novas proporções
        const isTop = position === 'top';
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Definir área de spawn baseada nas novas proporções
        let spawnAreaY, spawnAreaHeight;
        if (isTop) {
            // Área superior: 0% até 45% da tela
            spawnAreaY = 0;
            spawnAreaHeight = screenHeight * 0.45;
        } else {
            // Área inferior: 75% até 100% da tela
            spawnAreaY = screenHeight * 0.75;
            spawnAreaHeight = screenHeight * 0.25;
        }
        
        // Container sem posição fixa - as partículas vão nascer espalhadas
        particleContainer.x = 0;
        particleContainer.y = 0;
        
        // Criar partículas individuais
        for (let i = 0; i < particleConfig.count; i++) {
            const particle = new PIXI.Graphics();
            
            // Tipo de partícula baseado na configuração
            if (particleConfig.sparkle) {
                // Partícula estrelinha
                particle.beginFill(0xffffff);
                const radius = Math.random() * 2 + 2;
                const spikes = 5;
                const outerRadius = radius;
                const innerRadius = radius * 0.5;
                
                for (let j = 0; j < spikes * 2; j++) {
                    const angle = (j * Math.PI) / spikes;
                    const r = j % 2 === 0 ? outerRadius : innerRadius;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    
                    if (j === 0) {
                        particle.moveTo(x, y);
                    } else {
                        particle.lineTo(x, y);
                    }
                }
                particle.closePath();
                particle.endFill();
            } else if (particleConfig.fiery) {
                // Partícula de fogo
                particle.beginFill(0xffffff);
                for (let flame = 0; flame < 3; flame++) {
                    const flameRadius = (3 - flame) * 0.8;
                    const flameY = -flame * 1.5;
                    particle.drawCircle(Math.random() * 0.5 - 0.25, flameY, flameRadius);
                }
                particle.endFill();
            } else if (particleConfig.icy) {
                // Partícula de gelo
                particle.beginFill(0xffffff);
                const hexPoints = [];
                for (let h = 0; h < 6; h++) {
                    const angle = (h / 6) * Math.PI * 2;
                    const radius = 2 + Math.random() * 1;
                    hexPoints.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                particle.drawPolygon(hexPoints);
                particle.endFill();
            } else if (particleConfig.magical) {
                // Partícula mágica
                particle.beginFill(0xffffff);
                particle.drawCircle(0, 0, Math.random() * 1.5 + 1);
                particle.endFill();
                particle.lineStyle(0.5, 0xffffff, 0.8);
                particle.drawCircle(0, 0, Math.random() * 3 + 2);
            } else if (particleConfig.explosive) {
                // Partícula explosiva
                particle.beginFill(0xffffff);
                const points = [];
                for (let e = 0; e < 8; e++) {
                    const angle = (e / 8) * Math.PI * 2;
                    const radius = 2 + Math.random() * 2;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                particle.drawPolygon(points);
                particle.endFill();
            } else {
                // Partícula circular padrão
                particle.beginFill(0xffffff);
                particle.drawCircle(0, 0, Math.random() * 2 + 1.5);
                particle.endFill();
            }
            
            // POSIÇÃO INICIAL: Distribuída por toda a largura da margem
            particle.x = Math.random() * screenWidth; // Largura completa da tela
            particle.y = spawnAreaY + Math.random() * spawnAreaHeight; // Dentro da área definida
            
            // PROPRIEDADES DA PARTÍCULA - FIX DO LIFETIME
            // Converter milissegundos para segundos
            const lifetimeMin = particleConfig.lifetime.min / 1000; // ms → s
            const lifetimeMax = particleConfig.lifetime.max / 1000; // ms → s
            particle.life = Math.random() * (lifetimeMax - lifetimeMin) + lifetimeMin;
            particle.maxLife = particle.life;
            particle.age = 0;
            
            // VELOCIDADE INICIAL
            const baseSpeed = Math.random() * (particleConfig.speed.max - particleConfig.speed.min) + particleConfig.speed.min;
            
            // Definir direção baseada no emitterType e posição
            if (particleConfig.emitterType === "burst") {
                // Explosão: direção radial a partir de um ponto central da área
                const centerX = screenWidth / 2;
                const centerY = spawnAreaY + spawnAreaHeight / 2;
                const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
                particle.vx = Math.cos(angle) * baseSpeed;
                particle.vy = Math.sin(angle) * baseSpeed;
            } else {
                // Movimento mais suave ou direcionado
                const angle = Math.random() * Math.PI * 2;
                particle.vx = Math.cos(angle) * baseSpeed * 0.3;
                particle.vy = Math.sin(angle) * baseSpeed * 0.3;
            }
            
            // Gravidade
            particle.gravity = particleConfig.gravity || { x: 0, y: 0 };
            
            // Cor
            const startColor = parseInt(particleConfig.startColor.replace('#', ''), 16);
            const endColor = parseInt(particleConfig.endColor.replace('#', ''), 16);
            particle.tint = startColor;
            particle.startColor = startColor;
            particle.endColor = endColor;
            
            // Escala
            const startScale = Math.random() * (particleConfig.startScale.max - particleConfig.startScale.min) + particleConfig.startScale.min;
            const endScale = Math.random() * (particleConfig.endScale.max - particleConfig.endScale.min) + particleConfig.endScale.min;
            particle.scale.set(startScale);
            particle.startScale = startScale;
            particle.endScale = endScale;
            
            // Alpha
            particle.alpha = particleConfig.startAlpha;
            particle.startAlpha = particleConfig.startAlpha;
            particle.endAlpha = particleConfig.endAlpha;
            
            particleContainer.addChild(particle);
            particles.push(particle);
        }
        
        // Sistema de atualização das partículas (mantém o deltaTime em segundos)
        let animationActive = true;
        const updateParticles = () => {
            if (!animationActive) return;
            
            const deltaTime = 0.016; // 60fps em segundos
            let aliveCount = 0;
            
            particles.forEach(particle => {
                if (particle && particle.parent && particle.age < particle.maxLife) {
                    particle.age += deltaTime; // Agora o lifetime está correto
                    const lifePercent = particle.age / particle.maxLife;
                    
                    // Aplicar gravidade
                    if (particle.gravity) {
                        particle.vx += particle.gravity.x * deltaTime;
                        particle.vy += particle.gravity.y * deltaTime;
                    }
                    
                    // Atualizar posição
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                    
                    // Atualizar alpha
                    particle.alpha = particle.startAlpha * (1 - lifePercent) + particle.endAlpha * lifePercent;
                    
                    // Atualizar escala
                    const scale = particle.startScale + (particle.endScale - particle.startScale) * lifePercent;
                    particle.scale.set(scale);
                    
                    // Interpolar cor
                    if (lifePercent > 0.3) {
                        const colorProgress = (lifePercent - 0.3) / 0.7;
                        if (colorProgress > 0.5) {
                            particle.tint = particle.endColor;
                        }
                    }
                    
                    aliveCount++;
                } else if (particle) {
                    particle.visible = false;
                }
            });
            
            if (aliveCount > 0) {
                requestAnimationFrame(updateParticles);
            } else {
                animationActive = false;
                console.log("🎨 Partículas de vinheta finalizadas");
            }
        };
        
        updateParticles();
        particleContainer.stopAnimation = () => { animationActive = false; };
        
        return particleContainer;
        
    } catch (error) {
        console.error("❌ Erro ao criar partículas de vinheta:", error);
        return null;
    }
}

// Criar vinheta horizontal
function createHorizontalVignette(vignetteConfig) {
    try {
        const vignetteContainer = new PIXI.Container();
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Novas proporções: 45% superior + 30% livre + 25% inferior
        const upperVignetteHeight = screenHeight * 0.45; // 45% da tela
        const lowerVignetteHeight = screenHeight * 0.25; // 25% da tela
        const lowerVignetteStart = screenHeight * 0.75;  // Começa em 75%
        
        // Converter cor hex para número
        const color = parseInt(vignetteConfig.color.replace('#', ''), 16);
        
        // === VINHETA SUPERIOR ===
        // Gradiente suave: opaco no topo → transparente no centro
        const upperVignette = new PIXI.Graphics();

        // Proporcional ao tamanho: 45% da tela = mais linhas
        const upperSteps = 900; // 45% da tela merece mais detalhamento
        for (let i = 0; i < upperSteps; i++) {
            const progress = i / upperSteps;
            // Curva mais suave usando função exponencial
            const smoothProgress = 1 - Math.pow(progress, 1.5);
            const alpha = vignetteConfig.intensity * smoothProgress;
            const y = progress * upperVignetteHeight;
            const height = upperVignetteHeight / upperSteps;
            
            upperVignette.beginFill(color, alpha);
            upperVignette.drawRect(0, y, screenWidth, height);
            upperVignette.endFill();
        }
        
        vignetteContainer.addChild(upperVignette);
        
        // === VINHETA INFERIOR ===
        // Gradiente suave: transparente no centro → opaco na borda inferior
        const lowerVignette = new PIXI.Graphics();

        // Proporcional ao tamanho: 25% da tela = menos linhas que a superior
        const lowerSteps = 500; // 25% da tela, proporcionalmente menor
        for (let i = 0; i < lowerSteps; i++) {
            const progress = i / lowerSteps;
            // Curva mais suave usando função exponencial
            const smoothProgress = Math.pow(progress, 1.5);
            const alpha = vignetteConfig.intensity * smoothProgress;
            const y = lowerVignetteStart + (progress * lowerVignetteHeight);
            const height = lowerVignetteHeight / lowerSteps;
            
            lowerVignette.beginFill(color, alpha);
            lowerVignette.drawRect(0, y, screenWidth, height);
            lowerVignette.endFill();
        }
        
        vignetteContainer.addChild(lowerVignette);
        
        // ANIMAÇÃO: Fade in -> visível -> fade out lento
        vignetteContainer.alpha = 0;
        console.log("🔍 DEBUG: Vinheta iniciada com alpha = 0");

        let animationActive = true;
        const startTime = Date.now();
        const STAY_VISIBLE_TIME = 4000; // 4 segundos fixos
        const SLOW_FADE_OUT_TIME = 2000; // 2 segundos para fade out lento

        const animateVignette = () => {
            if (!animationActive || !vignetteContainer.parent) {
                console.log("🔍 DEBUG: Animação da vinheta parada");
                return;
            }
            
            const elapsed = Date.now() - startTime;
            
            if (elapsed < vignetteConfig.fadeInDuration) {
                // FASE 1: Fade In
                const fadeInProgress = elapsed / vignetteConfig.fadeInDuration;
                vignetteContainer.alpha = fadeInProgress;
                console.log("🔍 DEBUG: Fade in - alpha =", vignetteContainer.alpha.toFixed(2));
                
            } else if (elapsed < vignetteConfig.fadeInDuration + STAY_VISIBLE_TIME) {
                // FASE 2: Ficar visível por 4 segundos
                vignetteContainer.alpha = 1;
                
            } else if (elapsed < vignetteConfig.fadeInDuration + STAY_VISIBLE_TIME + SLOW_FADE_OUT_TIME) {
                // FASE 3: Fade Out lento (2 segundos)
                const fadeOutStart = vignetteConfig.fadeInDuration + STAY_VISIBLE_TIME;
                const fadeOutProgress = (elapsed - fadeOutStart) / SLOW_FADE_OUT_TIME;
                vignetteContainer.alpha = 1 - fadeOutProgress;
                
            } else {
                // FASE 4: Animação completa
                vignetteContainer.alpha = 0;
                animationActive = false;
                console.log("🔍 DEBUG: Animação da vinheta completa");
                return;
            }
            
            requestAnimationFrame(animateVignette);
        };

        // Iniciar animação
        requestAnimationFrame(animateVignette);

        // Função para parar animação (cleanup)
        vignetteContainer.stopAnimation = () => { 
            animationActive = false; 
            console.log("🔍 DEBUG: Animação da vinheta parada manualmente");
        };
        
        return vignetteContainer;
        
    } catch (error) {
        console.error("❌ Erro ao criar vinheta horizontal:", error);
        return null;
    }
}

// Criar filtros para vinhetas
function createVignetteFilters(filterConfig) {
    const filters = [];
    
    try {
        if (filterConfig.colorMatrix) {
            const colorMatrix = new PIXI.ColorMatrixFilter();
            
            if (filterConfig.colorMatrix.brightness !== undefined) {
                colorMatrix.brightness(filterConfig.colorMatrix.brightness, false);
            }
            if (filterConfig.colorMatrix.saturation !== undefined) {
                colorMatrix.saturate(filterConfig.colorMatrix.saturation, false);
            }
            
            filters.push(colorMatrix);
        }
        
        if (filterConfig.brightness) {
            const brightnessMatrix = new PIXI.ColorMatrixFilter();
            brightnessMatrix.brightness(filterConfig.brightness, false);
            filters.push(brightnessMatrix);
        }
        
        if (filterConfig.contrast) {
            const contrastMatrix = new PIXI.ColorMatrixFilter();
            contrastMatrix.contrast(filterConfig.contrast, false);
            filters.push(contrastMatrix);
        }
        
    } catch (error) {
        console.error("❌ Erro ao criar filtros de vinheta:", error);
    }
    
    return filters;
}

// Limpar vinheta de ataque
function cleanupAttackVignette() {
    if (!window.attackVignetteSystem.isActive) return;
    
    console.log("🎬 Limpando vinheta de ataque");
    
    const app = window.attackVignetteSystem.app;
    if (app && app.stage) {
        // Parar animações
        if (window.attackVignetteSystem.currentVignette) {
            const container = window.attackVignetteSystem.currentVignette;
            if (container.children) {
                container.children.forEach(child => {
                    if (child.stopAnimation) {
                        child.stopAnimation();
                    }
                });
            }
            
            app.stage.removeChild(container);
            container.destroy({ children: true, texture: true, baseTexture: true });
        }
        
        // Limpar stage completo
        app.stage.removeChildren();
    }
    
    // Manter canvas visível para próximas vinhetas
    if (window.attackVignetteSystem.canvas) {
        // NÃO esconder o canvas - manter opacity = 1
        console.log("Canvas da vinheta mantido visível");
    }
    
    window.attackVignetteSystem.currentVignette = null;
    window.attackVignetteSystem.isActive = false;
}

// Aplicar shader customizado
function applyCustomShader(vignetteData, vignetteContainer, app) {
    if (!vignetteData.customShader || !vignetteData.customShader.enabled) {
        return;
    }
    
    console.log("🎨 Aplicando shader customizado:", vignetteData.customShader.type);
    
    try {
        const shaderConfig = vignetteData.customShader;
        
        // Criar filter customizado
        const customFilter = new PIXI.Filter(
            shaderConfig.vertex,
            shaderConfig.fragment,
            {
                ...shaderConfig.uniforms,
                resolution: [app.view.width, app.view.height]
            }
        );
        
        // Criar background para o shader
        const shaderBackground = new PIXI.Graphics();
        shaderBackground.beginFill(0x000000, 0.1);
        shaderBackground.drawRect(0, 0, app.view.width, app.view.height);
        shaderBackground.endFill();
        shaderBackground.filters = [customFilter];
        
        vignetteContainer.addChild(shaderBackground);
        
        // Sistema de animação temporal para o shader
        let animationActive = true;
        const startTime = Date.now();
        const duration = vignetteData.duration;
        
        const animateShader = () => {
            if (!animationActive) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const time = elapsed / 1000;
            
            // Atualizar uniforms
            customFilter.uniforms.time = time;
            
            // Crescimento inicial (0 - 30%)
            if (progress <= 0.3) {
                const growthProgress = progress / 0.3;
                customFilter.uniforms.intensity = growthProgress;
            }
            // Intensidade máxima (30% - 70%)
            else if (progress <= 0.7) {
                customFilter.uniforms.intensity = 1.0;
            }
            // Fade-out (70% - 100%)
            else {
                const fadeProgress = (progress - 0.7) / 0.3;
                customFilter.uniforms.intensity = 1.0 - fadeProgress;
            }
            
            customFilter.uniforms.fadeProgress = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animateShader);
            } else {
                animationActive = false;
                console.log("🎨 Shader customizado finalizado");
            }
        };
        
        requestAnimationFrame(animateShader);
        
        // Função de limpeza
        vignetteContainer.stopShaderAnimation = () => { animationActive = false; };
        
    } catch (error) {
        console.error("❌ Erro ao aplicar shader customizado:", error);
    }
}

// ========================================
// 🎨 SISTEMA DE ELEMENTOS GRÁFICOS VETORIAIS
// ========================================

function createGraphicElements(vignetteConfig, app) {
    if (!vignetteConfig.graphicElements || !vignetteConfig.graphicElements.enabled) {
        return null;
    }
    
    const config = vignetteConfig.graphicElements;
    const container = new PIXI.Container();
    const elements = [];
    
    console.log(`🎨 Criando elementos gráficos: ${config.count} elementos`);
    
    config.elements.forEach(elementConfig => {
        // BYPASS ESPECIAL para divine_ornaments
        if (elementConfig.type === "divine_ornaments") {
            console.log("🎨 BYPASS: Criando divine_ornaments sem loop");
            const divineContainer = createDivineOrnamentsComplete(elementConfig, app, parseInt(elementConfig.color.replace('#', ''), 16));
            if (divineContainer) {
                container.addChild(divineContainer);
                console.log("🎨 BYPASS: Divine ornaments adicionado diretamente");
            }
            return; // Pular o resto do loop
        }
        
        // Sistema normal para outros elementos
        for (let i = 0; i < config.count; i++) {
            const element = createSingleGraphicElement(elementConfig, i, config.count, app);
            if (element) {
                elements.push(element);
                container.addChild(element);
            }
        }
    });
    
    // Aplicar animação temporal APENAS para elementos normais
    if (elements.length > 0) {
        animateGraphicElements(container, elements, config);
    } else {
        console.log("🎨 BYPASS: Sem animação temporal para divine_ornaments");
    }
    
    return container;
}

// Função para criar um único elemento gráfico
function createSingleGraphicElement(elementConfig, index, totalCount, app) {
    const element = new PIXI.Graphics();
    const canvasWidth = app.view.width;
    const canvasHeight = app.view.height;
    
    // Converter cor hex para number
    const color = parseInt(elementConfig.color.replace('#', ''), 16);
    element.alpha = elementConfig.alpha;
    
    // Posicionar elemento baseado na configuração
    const position = getElementPosition(elementConfig.positions, index, totalCount, canvasWidth, canvasHeight);
    element.x = position.x;
    element.y = position.y;
    
    // Criar o gráfico baseado no tipo
    switch (elementConfig.type) {
        case "crossing_lines":
            createCrossingLines(element, color, canvasWidth, canvasHeight);
            break;
        case "energy_circuits":
            createEnergyCircuits(element, color, index);
            break;
        case "crossing_lines":
            createCrossingLines(element, color, canvasWidth, canvasHeight);
            break;
        case "energy_circuits":
            createEnergyCircuits(element, color, index);
            break;
        case "mystical_runes":
            createMysticalRunes(element, color, index);
            break;
        case "magic_fragments":
            createMagicFragments(element, color, index);
            break;
        case "elemental_crystals":
            createElementalCrystals(element, color, index);
            break;
        case "divine_symbols":
            createDivineSymbols(element, color, index);
            break;
        case "divine_rays":
            createDivineRays(element, color, canvasHeight);
            break;
        case "sacred_flames":
            createSacredFlames(element, color, index);
            break;
        case "celestial_complex":
            createCelestialComplex(element, color, index, canvasWidth, canvasHeight);
            break;
        case "reality_cracks":
            createRealityCracks(element, color, canvasWidth, canvasHeight);
            break;
        case "concentric_rings":
            createConcentricRings(element, color, index);
            break;
        case "chaotic_elements":
            createChaoticElements(element, color, index);
            break;
        case "gravitational_distortion":
            createGravitationalDistortion(element, color, index, canvasWidth);
            break;
        default:
            console.warn(`Tipo de elemento gráfico desconhecido: ${elementConfig.type}`);
            return null;
    }
    
    // Armazenar configurações para animação
    element.animationType = elementConfig.animation;
    element.elementIndex = index;
    element.totalElements = totalCount;
    element.originalAlpha = elementConfig.alpha;
    element.originalScaleX = element.scale.x;
    element.originalScaleY = element.scale.y;
    
    return element;
}

// Função para determinar posição do elemento
function getElementPosition(positionType, index, totalCount, canvasWidth, canvasHeight) {
    const position = { x: 0, y: 0 };
    
    switch (positionType) {
        case "margins":
            // Distribuir nas margens superior (40%) e inferior (20%)
            const marginIndex = index % 2;
            if (marginIndex === 0) {
                // Margem superior (0% a 40%)
                position.x = (index / totalCount) * canvasWidth;
                position.y = Math.random() * (canvasHeight * 0.4);
            } else {
                // Margem inferior (80% a 100%)
                position.x = (index / totalCount) * canvasWidth;
                position.y = canvasHeight * 0.8 + Math.random() * (canvasHeight * 0.2);
            }
            break;
            
        case "margins_and_center":
            // Margens + alguns elementos centrais
            if (index < totalCount * 0.3) {
                // Centro (para efeitos transitórios)
                position.x = canvasWidth * 0.3 + Math.random() * (canvasWidth * 0.4);
                position.y = canvasHeight * 0.3 + Math.random() * (canvasHeight * 0.4);
            } else {
                // Margens
                const marginIndex = index % 2;
                if (marginIndex === 0) {
                    position.x = (index / totalCount) * canvasWidth;
                    position.y = Math.random() * (canvasHeight * 0.4);
                } else {
                    position.x = (index / totalCount) * canvasWidth;
                    position.y = canvasHeight * 0.8 + Math.random() * (canvasHeight * 0.2);
                }
            }
            break;
            
        case "center_margins":
            // Principalmente centro com algumas margens
            if (index < totalCount * 0.6) {
                // Centro
                position.x = canvasWidth * 0.25 + Math.random() * (canvasWidth * 0.5);
                position.y = canvasHeight * 0.25 + Math.random() * (canvasHeight * 0.5);
            } else {
                // Margens
                const marginIndex = index % 2;
                if (marginIndex === 0) {
                    position.x = (index / totalCount) * canvasWidth;
                    position.y = Math.random() * (canvasHeight * 0.4);
                } else {
                    position.x = (index / totalCount) * canvasWidth;
                    position.y = canvasHeight * 0.8 + Math.random() * (canvasHeight * 0.2);
                }
            }
            break;
            
        case "full_screen":
            // Toda a tela (para efeitos especiais como rachaduras)
            position.x = Math.random() * canvasWidth;
            position.y = Math.random() * canvasHeight;
            break;
            
        default:
            position.x = (index / totalCount) * canvasWidth;
            position.y = Math.random() * canvasHeight;
    }
    
    return position;
}

// ========================================
// 🎨 FUNÇÕES DE CRIAÇÃO DE ELEMENTOS ESPECÍFICOS
// ========================================

// Linhas cruzadas para ataque básico
function createCrossingLines(element, color, canvasWidth, canvasHeight) {
    element.lineStyle(2, color, 0.7);
    
    const lineLength = 60 + Math.random() * 40;
    const angle = Math.random() * Math.PI * 2;
    
    // Linha principal
    element.moveTo(-lineLength/2, 0);
    element.lineTo(lineLength/2, 0);
    
    // Linha cruzada
    element.moveTo(0, -lineLength/2);
    element.lineTo(0, lineLength/2);
    
    element.rotation = angle;
}

// Circuitos de energia
function createEnergyCircuits(element, color, index) {
    element.lineStyle(1.5, color, 0.6);
    
    const size = 40 + Math.random() * 30;
    const segments = 4 + Math.floor(Math.random() * 4);
    
    // Circuito base
    element.drawRect(-size/2, -size/2, size, size);
    
    // Linhas internas
    for (let i = 0; i < segments; i++) {
        const startX = -size/2 + (i / segments) * size;
        element.moveTo(startX, -size/2);
        element.lineTo(startX, size/2);
    }
    
    // Nós de conexão
    element.beginFill(color, 0.8);
    for (let i = 0; i < 3; i++) {
        const x = -size/3 + (i / 2) * (size * 2/3);
        element.drawCircle(x, 0, 2);
    }
    element.endFill();
}

// Runas místicas
function createMysticalRunes(element, color, index) {
    element.lineStyle(2, color, 0.65);
    
    const runeTypes = ['circle_rune', 'triangle_rune', 'hex_rune'];
    const runeType = runeTypes[index % runeTypes.length];
    
    switch (runeType) {
        case 'circle_rune':
            element.drawCircle(0, 0, 15);
            element.moveTo(-10, 0);
            element.lineTo(10, 0);
            element.moveTo(0, -10);
            element.lineTo(0, 10);
            break;
            
        case 'triangle_rune':
            element.drawPolygon([-12, 10, 0, -12, 12, 10]);
            element.moveTo(0, -4);
            element.lineTo(0, 4);
            break;
            
        case 'hex_rune':
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                points.push(Math.cos(angle) * 12, Math.sin(angle) * 12);
            }
            element.drawPolygon(points);
            element.drawCircle(0, 0, 6);
            break;
    }
}

// Fragmentos mágicos
function createMagicFragments(element, color, index) {
    element.beginFill(color, 0.7);
    
    const fragmentSize = 8 + Math.random() * 12;
    const sides = 3 + Math.floor(Math.random() * 4);
    const points = [];
    
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const radius = fragmentSize * (0.7 + Math.random() * 0.6);
        points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    
    element.drawPolygon(points);
    element.endFill();
    
    // Brilho interno
    element.lineStyle(1, color, 0.4);
    element.drawPolygon(points.map(p => p * 0.6));
}

// Cristais elementais hexagonais
function createElementalCrystals(element, color, index) {
    element.beginFill(color, 0.6);
    
    const size = 12 + Math.random() * 8;
    const points = [];
    
    // Hexágono
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        points.push(Math.cos(angle) * size, Math.sin(angle) * size);
    }
    
    element.drawPolygon(points);
    element.endFill();
    
    // Linhas internas do cristal
    element.lineStyle(1, color, 0.8);
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        element.moveTo(0, 0);
        element.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8);
    }
}

// Símbolos divinos
function createDivineSymbols(element, color, index) {
    element.lineStyle(2.5, color, 0.65);
    
    const symbolTypes = ['cross', 'hammer', 'star'];
    const symbolType = symbolTypes[index % symbolTypes.length];
    
    switch (symbolType) {
        case 'cross':
            // Cruz
            element.moveTo(-12, 0);
            element.lineTo(12, 0);
            element.moveTo(0, -12);
            element.lineTo(0, 12);
            
            // Detalhes ornamentais
            element.drawCircle(0, 0, 3);
            break;
            
        case 'hammer':
            // Martelo simplificado
            element.drawRect(-8, -4, 16, 8);
            element.moveTo(0, 4);
            element.lineTo(0, 15);
            element.drawRect(-2, 15, 4, 6);
            break;
            
        case 'star':
            // Estrela de 6 pontas
            const starPoints = [];
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const radius = i % 2 === 0 ? 12 : 6;
                starPoints.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            element.drawPolygon(starPoints);
            break;
    }
}

// Raios divinos
function createDivineRays(element, color, canvasHeight) {
    element.lineStyle(3, color, 0.5);
    
    const rayLength = canvasHeight * 0.15 + Math.random() * (canvasHeight * 0.1);
    const rayWidth = 2 + Math.random() * 3;
    
    // Raio principal
    element.moveTo(0, 0);
    element.lineTo(0, rayLength);
    
    // Brilho lateral
    element.lineStyle(rayWidth + 2, color, 0.2);
    element.moveTo(0, 0);
    element.lineTo(0, rayLength);
    
    // Ponta do raio
    element.beginFill(color, 0.8);
    element.drawCircle(0, rayLength, 4);
    element.endFill();
}

// Chamas sagradas
function createSacredFlames(element, color, index) {
    element.beginFill(color, 0.6);
    
    const flameHeight = 20 + Math.random() * 15;
    const flameWidth = 8 + Math.random() * 6;
    
    // Forma de chama ondulada
    const points = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.sin(t * Math.PI) * flameWidth * (1 - t * 0.5);
        const y = t * flameHeight;
        const wave = Math.sin(t * Math.PI * 3) * flameWidth * 0.3;
        
        points.push(x + wave, -y);
    }
    
    // Completar a forma
    for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const x = -Math.sin(t * Math.PI) * flameWidth * (1 - t * 0.5);
        const y = t * flameHeight;
        const wave = Math.sin(t * Math.PI * 3) * flameWidth * 0.3;
        
        points.push(x - wave, -y);
    }
    
    element.drawPolygon(points);
    element.endFill();
}

// Elementos celestiais complexos
function createCelestialComplex(element, color, index, canvasWidth, canvasHeight) {
    element.lineStyle(1.5, color, 0.7);
    
    const complexTypes = ['mandala', 'constellation', 'halo'];
    const complexType = complexTypes[index % complexTypes.length];
    
    switch (complexType) {
        case 'mandala':
            // Padrão mandala simplificado
            const rings = 3;
            for (let ring = 1; ring <= rings; ring++) {
                const radius = ring * 8;
                element.drawCircle(0, 0, radius);
                
                // Pontos no anel
                for (let i = 0; i < ring * 6; i++) {
                    const angle = (i / (ring * 6)) * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    element.beginFill(color, 0.8);
                    element.drawCircle(x, y, 1);
                    element.endFill();
                }
            }
            break;
            
        case 'constellation':
            // Constelação com linhas conectoras
            const stars = 5 + Math.floor(Math.random() * 3);
            const starPositions = [];
            
            for (let i = 0; i < stars; i++) {
                const angle = (i / stars) * Math.PI * 2 + Math.random() * 0.5;
                const radius = 15 + Math.random() * 10;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                starPositions.push({ x, y });
                
                // Estrela
                element.beginFill(color, 0.9);
                element.drawCircle(x, y, 2);
                element.endFill();
            }
            
            // Conectar estrelas
            for (let i = 0; i < starPositions.length - 1; i++) {
                element.moveTo(starPositions[i].x, starPositions[i].y);
                element.lineTo(starPositions[i + 1].x, starPositions[i + 1].y);
            }
            break;
            
        case 'halo':
            // Halo com brilho
            element.drawCircle(0, 0, 20);
            element.lineStyle(3, color, 0.3);
            element.drawCircle(0, 0, 22);
            element.lineStyle(5, color, 0.1);
            element.drawCircle(0, 0, 25);
            break;
    }
}

// Rachaduras na realidade
function createRealityCracks(element, color, canvasWidth, canvasHeight) {
    element.lineStyle(2 + Math.random() * 3, color, 0.8);
    
    const crackLength = canvasHeight * 0.6 + Math.random() * (canvasHeight * 0.4);
    const segments = 8 + Math.floor(Math.random() * 6);
    
    let currentX = 0;
    let currentY = 0;
    
    element.moveTo(currentX, currentY);
    
    for (let i = 0; i < segments; i++) {
        const segmentLength = crackLength / segments;
        const deviation = (Math.random() - 0.5) * 30;
        
        currentY += segmentLength;
        currentX += deviation;
        
        element.lineTo(currentX, currentY);
        
        // Ramificações ocasionais
        if (Math.random() < 0.3) {
            const branchLength = segmentLength * 0.5;
            const branchAngle = (Math.random() - 0.5) * Math.PI * 0.5;
            const branchX = currentX + Math.cos(branchAngle) * branchLength;
            const branchY = currentY + Math.sin(branchAngle) * branchLength;
            
            element.moveTo(currentX, currentY);
            element.lineTo(branchX, branchY);
            element.moveTo(currentX, currentY);
        }
    }
}

// Anéis concêntricos
function createConcentricRings(element, color, index) {
    element.lineStyle(1.5, color, 0.65);
    
    const ringCount = 3 + Math.floor(Math.random() * 3);
    const baseRadius = 10;
    
    for (let i = 0; i < ringCount; i++) {
        const radius = baseRadius + i * 8;
        element.drawCircle(0, 0, radius);
    }
    
    // Conectores radiais
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        element.moveTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
        element.lineTo(Math.cos(angle) * (baseRadius + (ringCount - 1) * 8), Math.sin(angle) * (baseRadius + (ringCount - 1) * 8));
    }
}

// Elementos caóticos
function createChaoticElements(element, color, index) {
    const elementTypes = ['chaos_spiral', 'chaos_burst', 'chaos_web'];
    const elementType = elementTypes[index % elementTypes.length];
    
    element.lineStyle(1.5, color, 0.7);
    
    switch (elementType) {
        case 'chaos_spiral':
            // Espiral caótica
            let angle = 0;
            let radius = 2;
            element.moveTo(radius, 0);
            
            for (let i = 0; i < 50; i++) {
                angle += 0.3 + Math.random() * 0.2;
                radius += 0.5 + Math.random() * 0.5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                element.lineTo(x, y);
            }
            break;
            
        case 'chaos_burst':
            // Explosão de linhas
            const lines = 8 + Math.floor(Math.random() * 4);
            for (let i = 0; i < lines; i++) {
                const lineAngle = (i / lines) * Math.PI * 2 + Math.random() * 0.5;
                const lineLength = 10 + Math.random() * 15;
                
                element.moveTo(0, 0);
                element.lineTo(Math.cos(lineAngle) * lineLength, Math.sin(lineAngle) * lineLength);
            }
            break;
            
        case 'chaos_web':
            // Teia caótica
            const points = [];
            for (let i = 0; i < 6; i++) {
                const webAngle = (i / 6) * Math.PI * 2;
                const webRadius = 15 + Math.random() * 10;
                points.push({
                    x: Math.cos(webAngle) * webRadius,
                    y: Math.sin(webAngle) * webRadius
                });
            }
            
            // Conectar pontos aleatoriamente
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    if (Math.random() < 0.4) {
                        element.moveTo(points[i].x, points[i].y);
                        element.lineTo(points[j].x, points[j].y);
                    }
                }
            }
            break;
    }
}

// Distorção gravitacional
function createGravitationalDistortion(element, color, index, canvasWidth) {
    element.lineStyle(1, color, 0.75);
    
    const waveLength = canvasWidth * 0.1;
    const amplitude = 15 + Math.random() * 10;
    const segments = 20;
    
    // Onda distorcida
    element.moveTo(-waveLength/2, 0);
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -waveLength/2 + t * waveLength;
        const y = Math.sin(t * Math.PI * 4) * amplitude * (1 - Math.abs(t - 0.5) * 2);
        
        element.lineTo(x, y);
    }
    
    // Círculos de distorção
    for (let i = 0; i < 3; i++) {
        const circleRadius = 5 + i * 3;
        const circleAlpha = 0.5 - i * 0.1;
        element.lineStyle(1, color, circleAlpha);
        element.drawCircle(0, 0, circleRadius);
    }
}

// ========================================
// 🎨 ORNAMENTOS DIVINOS COMPLEXOS
// ========================================

function createDivineOrnamentsComplete(elementConfig, app, baseColor) {
    console.log("🎨 Criando ornamentos divinos COMPLETOS");
    
    const masterContainer = new PIXI.Container();
    const canvasWidth = app.view.width;
    const canvasHeight = app.view.height;
    
    // ========================================
    // 1. ARABESCOS PRINCIPAIS CURVOS
    // ========================================
    
    // Arabesco Superior (das margens para o centro)
    const topArabesque = createComplexArabesque({
        startX: canvasWidth * 0.05,
        startY: canvasHeight * 0.15,
        endX: canvasWidth * 0.95,
        endY: canvasHeight * 0.45,
        color: baseColor,
        direction: "converging_top",
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
    });
    
    // Arabesco Inferior (das margens para o centro)
    const bottomArabesque = createComplexArabesque({
        startX: canvasWidth * 0.05,
        startY: canvasHeight * 0.85,
        endX: canvasWidth * 0.95,
        endY: canvasHeight * 0.55,
        color: baseColor,
        direction: "converging_bottom",
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
    });
    
    masterContainer.addChild(topArabesque);
    masterContainer.addChild(bottomArabesque);
    
    // ========================================
    // 2. PONTOS LUMINOSOS BRILHANTES
    // ========================================
    
    const lightPoints = createAdvancedLightPoints({
        count: 30,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        color: baseColor
    });
    
    masterContainer.addChild(lightPoints);
    
    // ========================================
    // 3. NUVENS SEMITRANSPARENTES FLUTUANTES
    // ========================================
    
    const divineClouds = createFloatingClouds({
        count: 12,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        color: baseColor
    });
    
    masterContainer.addChild(divineClouds);
    
    // ========================================
    // 4. ANIMAÇÃO TEMPORAL EM FASES
    // ========================================
    
    startAdvancedDivineAnimation(masterContainer, 3200);
    
    console.log("🎨 Ornamentos divinos completos criados com", masterContainer.children.length, "elementos");
    
    return masterContainer;
}

// Criar arabescos complexos e ornamentais
function createComplexArabesque(config) {
    const container = new PIXI.Container();
    const totalWidth = config.endX - config.startX;
    const totalHeight = Math.abs(config.endY - config.startY);
    
    // ========================================
    // MÚLTIPLAS CAMADAS COM ESPESSURAS DIFERENTES
    // ========================================
    
    for (let layer = 0; layer < 6; layer++) {
        const arabesque = new PIXI.Graphics();
        
        // Variação de cor e espessura por camada
        const brightness = 0.8 + (layer * 0.05);
        const layerColor = adjustColorBrightness(config.color, brightness);
        const thickness = 12 - (layer * 1.8);
        const alpha = 0.95 - (layer * 0.12);
        
        arabesque.lineStyle(thickness, layerColor, alpha);
        
        // ========================================
        // CRIAR CURVAS ORGÂNICAS COMPLEXAS
        // ========================================
        
        if (config.direction === "converging_top") {
            // Superior: duas curvas que convergem para o centro
            createConvergingCurves(arabesque, config, "top");
        } else {
            // Inferior: duas curvas que convergem para o centro
            createConvergingCurves(arabesque, config, "bottom");
        }
        
        container.addChild(arabesque);
    }
    
    // ========================================
    // ORNAMENTOS DECORATIVOS
    // ========================================
    
    const ornaments = createArabesqueOrnaments(config, totalWidth);
    container.addChild(ornaments);
    
    return container;
}

// Criar curvas que convergem para o centro
function createConvergingCurves(graphics, config, position) {
    const centerX = (config.startX + config.endX) / 2;
    const centerY = (config.startY + config.endY) / 2;
    
    // ========================================
    // CURVA ESQUERDA → CENTRO
    // ========================================
    
    graphics.moveTo(config.startX, config.startY);
    
    // Pontos de controle para curva suave e orgânica
    const leftCP1X = config.startX + (centerX - config.startX) * 0.3;
    const leftCP1Y = config.startY + (position === "top" ? 50 : -50);
    const leftCP2X = config.startX + (centerX - config.startX) * 0.7;
    const leftCP2Y = centerY + (position === "top" ? -30 : 30);
    
    graphics.bezierCurveTo(leftCP1X, leftCP1Y, leftCP2X, leftCP2Y, centerX, centerY);
    
    // ========================================
    // CURVA DIREITA → CENTRO
    // ========================================
    
    graphics.moveTo(config.endX, config.startY);
    
    const rightCP1X = config.endX - (config.endX - centerX) * 0.3;
    const rightCP1Y = config.startY + (position === "top" ? 50 : -50);
    const rightCP2X = config.endX - (config.endX - centerX) * 0.7;
    const rightCP2Y = centerY + (position === "top" ? -30 : 30);
    
    graphics.bezierCurveTo(rightCP1X, rightCP1Y, rightCP2X, rightCP2Y, centerX, centerY);
    
    // ========================================
    // ONDULAÇÕES DECORATIVAS
    // ========================================
    
    // Adicionar ondulações menores ao longo das curvas
    addCurveOndulations(graphics, config, position);
}

// Adicionar ondulações decorativas às curvas
function addCurveOndulations(graphics, config, position) {
    const segments = 15;
    const amplitude = 8;
    
    for (let side = 0; side < 2; side++) { // 0 = esquerda, 1 = direita
        const startX = side === 0 ? config.startX : config.endX;
        const endX = (config.startX + config.endX) / 2;
        
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const baseX = startX + (endX - startX) * progress;
            const baseY = config.startY + ((config.startY + config.endY) / 2 - config.startY) * progress;
            
            // Ondulação perpendicular à curva
            const wave = Math.sin(progress * Math.PI * 4) * amplitude * (1 - progress);
            const perpX = baseX + wave * Math.cos(progress * Math.PI);
            const perpY = baseY + wave * Math.sin(progress * Math.PI) * (position === "top" ? 1 : -1);
            
            // Pequenas linhas decorativas
            graphics.lineStyle(2, config.color, 0.4);
            graphics.moveTo(baseX, baseY);
            graphics.lineTo(perpX, perpY);
        }
    }
}

// Criar ornamentos decorativos para os arabescos
function createArabesqueOrnaments(config, totalWidth) {
    const ornaments = new PIXI.Graphics();
    const ornamentCount = Math.floor(totalWidth / 80); // Proporção baseada na largura
    
    for (let i = 0; i < ornamentCount; i++) {
        const progress = i / (ornamentCount - 1);
        const x = config.startX + totalWidth * progress;
        const y = (config.startY + config.endY) / 2;
        
        // ========================================
        // FOLHAS DECORATIVAS
        // ========================================
        
        ornaments.beginFill(config.color, 0.6);
        
        // Folha superior
        const leafPoints = [
            x, y - 15,           // Topo
            x - 8, y - 5,        // Esquerda
            x, y,                // Centro
            x + 8, y - 5         // Direita
        ];
        ornaments.drawPolygon(leafPoints);
        
        // Folha inferior
        const leafPoints2 = [
            x, y,                // Centro
            x - 8, y + 5,        // Esquerda
            x, y + 15,           // Baixo
            x + 8, y + 5         // Direita
        ];
        ornaments.drawPolygon(leafPoints2);
        
        ornaments.endFill();
        
        // ========================================
        // CÍRCULOS CENTRAIS DECORATIVOS
        // ========================================
        
        ornaments.beginFill(adjustColorBrightness(config.color, 1.3), 0.8);
        ornaments.drawCircle(x, y, 4);
        ornaments.endFill();
        
        // Anel externo
        ornaments.lineStyle(1, config.color, 0.5);
        ornaments.drawCircle(x, y, 8);
    }
    
    return ornaments;
}

// Criar pontos luminosos avançados
function createAdvancedLightPoints(config) {
    const container = new PIXI.Container();
    
    for (let i = 0; i < config.count; i++) {
        const lightPoint = new PIXI.Graphics();
        
        // Posição aleatória
        const x = Math.random() * config.canvasWidth;
        const y = Math.random() * config.canvasHeight;
        
        // Tamanhos variados
        const coreSize = 2 + Math.random() * 3;
        const haloSize = coreSize * (2 + Math.random() * 2);
        const outerSize = haloSize * 1.5;
        
        // Cor com variação
        const pointColor = adjustColorBrightness(config.color, 0.9 + Math.random() * 0.3);
        
        // ========================================
        // ESTRUTURA EM CAMADAS
        // ========================================
        
        // Halo externo (mais fraco)
        lightPoint.beginFill(pointColor, 0.15);
        lightPoint.drawCircle(x, y, outerSize);
        lightPoint.endFill();
        
        // Halo médio
        lightPoint.beginFill(pointColor, 0.4);
        lightPoint.drawCircle(x, y, haloSize);
        lightPoint.endFill();
        
        // Núcleo brilhante
        lightPoint.beginFill(pointColor, 0.9);
        lightPoint.drawCircle(x, y, coreSize);
        lightPoint.endFill();
        
        // Propriedades para animação
        lightPoint.blinkDelay = Math.random() * 2000;
        lightPoint.blinkDuration = 150 + Math.random() * 200;
        lightPoint.originalAlpha = 1.0;
        lightPoint.pulseSpeed = 2 + Math.random() * 4;
        
        container.addChild(lightPoint);
    }
    
    return container;
}

// Criar nuvens flutuantes
function createFloatingClouds(config) {
    const container = new PIXI.Container();
    
    for (let i = 0; i < config.count; i++) {
        const cloud = new PIXI.Graphics();
        
        // Posição e tamanho
        const x = Math.random() * config.canvasWidth;
        const y = Math.random() * config.canvasHeight;
        const baseRadius = 25 + Math.random() * 40;
        
        // Cor suave
        const cloudColor = adjustColorBrightness(config.color, 0.95);
        const alpha = 0.12 + Math.random() * 0.08;
        
        cloud.beginFill(cloudColor, alpha);
        
        // ========================================
        // FORMA ORGÂNICA DA NUVEM
        // ========================================
        
        const blobCount = 6 + Math.floor(Math.random() * 4);
        for (let blob = 0; blob < blobCount; blob++) {
            const blobAngle = (blob / blobCount) * Math.PI * 2 + Math.random() * 0.5;
            const blobDistance = baseRadius * (0.2 + Math.random() * 0.5);
            const blobX = x + Math.cos(blobAngle) * blobDistance;
            const blobY = y + Math.sin(blobAngle) * blobDistance;
            const blobRadius = baseRadius * (0.5 + Math.random() * 0.5);
            
            cloud.drawCircle(blobX, blobY, blobRadius);
        }
        
        cloud.endFill();
        
        // Propriedades para movimento suave
        cloud.driftSpeed = 0.3 + Math.random() * 0.8;
        cloud.driftDirection = Math.random() * Math.PI * 2;
        cloud.breatheSpeed = 1 + Math.random() * 2;
        
        container.addChild(cloud);
    }
    
    return container;
}

// Animação avançada em fases
function startAdvancedDivineAnimation(container, duration) {
    let animationActive = true;
    const startTime = Date.now();
    
    const animate = () => {
        if (!animationActive) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const time = elapsed / 1000;
        
        // ========================================
        // FASE 1: CRESCIMENTO DOS ARABESCOS (0 - 0.3)
        // ========================================
        if (progress <= 0.3) {
            const growthProgress = progress / 0.3;
            
            // Arabescos crescem gradualmente
            container.children.forEach((child, index) => {
                if (index < 2) { // Arabescos
                    child.alpha = growthProgress;
                    child.scale.x = 0.5 + (growthProgress * 0.5);
                    child.scale.y = growthProgress;
                }
            });
        }
        
        // ========================================
        // FASE 2: BRILHO E MOVIMENTO (0.3 - 0.7)
        // ========================================
        else if (progress <= 0.7) {
            // Pontos luminosos com animação complexa
            if (container.children[2]) {
                container.children[2].children.forEach((point, index) => {
                    // Pulsação individual
                    const pulse = 1 + Math.sin(time * point.pulseSpeed + index) * 0.3;
                    point.scale.set(pulse);
                    
                    // Brilho intermitente
                    const blinkCycle = (elapsed + point.blinkDelay) % (point.blinkDelay + point.blinkDuration);
                    if (blinkCycle < point.blinkDuration) {
                        point.alpha = point.originalAlpha * (1.5 + Math.sin(time * 8) * 0.5);
                    } else {
                        point.alpha = point.originalAlpha;
                    }
                });
            }
            
            // Nuvens com movimento suave e respiração
            if (container.children[3]) {
                container.children[3].children.forEach(cloud => {
                    // Movimento de deriva
                    cloud.x += Math.cos(cloud.driftDirection) * cloud.driftSpeed * 0.4;
                    cloud.y += Math.sin(cloud.driftDirection) * cloud.driftSpeed * 0.4;
                    
                    // Respiração (expand/contract)
                    const breathe = 1 + Math.sin(time * cloud.breatheSpeed) * 0.1;
                    cloud.scale.set(breathe);
                });
            }
        }
        
        // ========================================
        // FASE 3: FADE OUT GRADUAL (0.7 - 1.0)
        // ========================================
        else {
            const fadeProgress = (progress - 0.7) / 0.3;
            const fadeAlpha = 1 - (fadeProgress * 0.7); // Fade para 30%
            
            container.alpha = fadeAlpha;
            
            // Efeito de "ascensão" nos arabescos
            container.children.forEach((child, index) => {
                if (index < 2) {
                    child.y -= fadeProgress * 2; // Movimento sutil para cima
                }
            });
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            animationActive = false;
            console.log("🎨 Animação divina completa finalizada");
        }
    };
    
    requestAnimationFrame(animate);
    container.stopAnimation = () => { animationActive = false; };
}

function adjustColorBrightness(color, factor) {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xFF) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xFF) * factor));
    const b = Math.min(255, Math.floor((color & 0xFF) * factor));
    return (r << 16) | (g << 8) | b;
}

function startDivineOrnamentsAnimation(container, duration) {
    let animationActive = true;
    const startTime = Date.now();
    
    const animate = () => {
        if (!animationActive) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress <= 0.4) {
            // Crescimento dos arabescos
            const growthProgress = progress / 0.4;
            container.children.forEach((child, index) => {
                if (index < 2) {
                    child.alpha = growthProgress;
                    child.scale.x = growthProgress;
                }
            });
        } else if (progress <= 0.7) {
            // Pontos piscando e nuvens se movendo
            if (container.children[2]) {
                container.children[2].children.forEach(point => {
                    const blinkCycle = (elapsed + point.blinkDelay) % (point.blinkDelay + point.blinkDuration);
                    if (blinkCycle < point.blinkDuration) {
                        point.alpha = point.originalAlpha * 2;
                    } else {
                        point.alpha = point.originalAlpha;
                    }
                });
            }
            
            if (container.children[3]) {
                container.children[3].children.forEach(cloud => {
                    cloud.x += Math.cos(cloud.driftDirection) * cloud.driftSpeed * 0.5;
                    cloud.y += Math.sin(cloud.driftDirection) * cloud.driftSpeed * 0.5;
                });
            }
        } else {
            // Fade out
            const fadeProgress = (progress - 0.7) / 0.3;
            container.alpha = 1 - fadeProgress;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            animationActive = false;
        }
    };
    
    requestAnimationFrame(animate);
    container.stopAnimation = () => { animationActive = false; };
}

// ========================================
// 🎬 SISTEMA DE ANIMAÇÃO DOS ELEMENTOS GRÁFICOS
// ========================================

function animateGraphicElements(container, elements, config) {
    let startTime = Date.now();
    let animationActive = true;
    
    // Configurações de timing
    const totalDuration = config.effectDuration;
    const fadeInDuration = config.fadeInDuration;
    const fadeOutDuration = config.fadeOutDuration;
    const startDelay = config.startDelay;
    
    function animate() {
        if (!animationActive) return;
        
        const elapsed = Date.now() - startTime;
        const adjustedElapsed = elapsed - startDelay;
        
        if (adjustedElapsed < 0) {
            // Ainda no delay inicial - elementos invisíveis
            elements.forEach(element => {
                element.alpha = 0;
            });
        } else if (adjustedElapsed < fadeInDuration) {
            // Fase de fade-in
            const fadeProgress = adjustedElapsed / fadeInDuration;
            elements.forEach(element => {
                element.alpha = element.originalAlpha * fadeProgress;
                applyElementAnimation(element, adjustedElapsed);
            });
        } else if (adjustedElapsed < totalDuration - fadeOutDuration) {
            // Fase principal (efeito ativo)
            elements.forEach(element => {
                element.alpha = element.originalAlpha;
                applyElementAnimation(element, adjustedElapsed);
            });
        } else if (adjustedElapsed < totalDuration) {
            // Fase de fade-out
            const fadeOutProgress = (adjustedElapsed - (totalDuration - fadeOutDuration)) / fadeOutDuration;
            elements.forEach(element => {
                element.alpha = element.originalAlpha * (1 - fadeOutProgress);
                element.scale.x = element.originalScaleX * (1 - fadeOutProgress * 0.3);
                element.scale.y = element.originalScaleY * (1 - fadeOutProgress * 0.3);
                applyElementAnimation(element, adjustedElapsed);
            });
        } else {
            // Animação concluída
            animationActive = false;
            container.destroy({ children: true });
            return;
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function applyElementAnimation(element, elapsed) {
    const time = elapsed / 1000; // Converter para segundos
    
    switch (element.animationType) {
        case "subtle_pulse":
            element.scale.x = element.originalScaleX * (1 + Math.sin(time * 3) * 0.1);
            element.scale.y = element.originalScaleY * (1 + Math.sin(time * 3) * 0.1);
            break;
            
        case "electric_pulse":
            element.scale.x = element.originalScaleX * (1 + Math.sin(time * 8) * 0.15);
            element.scale.y = element.originalScaleY * (1 + Math.sin(time * 8) * 0.15);
            element.alpha *= (0.8 + Math.sin(time * 12) * 0.2);
            break;
            
        case "floating_rotation":
            element.rotation += 0.02;
            element.y += Math.sin(time * 2 + element.elementIndex) * 0.5;
            break;
            
        case "radiant_burst":
            const burstScale = 1 + Math.sin(time * 4) * 0.2;
            element.scale.x = element.originalScaleX * burstScale;
            element.scale.y = element.originalScaleY * burstScale;
            element.rotation += 0.03;
            break;
            
        case "crystal_shimmer":
            element.alpha *= (0.7 + Math.sin(time * 6 + element.elementIndex * 2) * 0.3);
            element.rotation += 0.01;
            break;
            
        case "holy_glow":
            const glowIntensity = 0.9 + Math.sin(time * 3) * 0.1;
            element.scale.x = element.originalScaleX * glowIntensity;
            element.scale.y = element.originalScaleY * glowIntensity;
            element.alpha *= glowIntensity;
            break;
            
        case "celestial_beam":
            element.alpha *= (0.6 + Math.sin(time * 4) * 0.4);
            element.scale.y = element.originalScaleY * (1 + Math.sin(time * 2) * 0.1);
            break;
            
        case "flame_dance":
            element.scale.x = element.originalScaleX * (1 + Math.sin(time * 5 + element.elementIndex) * 0.15);
            element.scale.y = element.originalScaleY * (1 + Math.cos(time * 4 + element.elementIndex) * 0.2);
            element.rotation += Math.sin(time * 3) * 0.02;
            break;
            
        case "divine_ascension":
            element.y -= 0.2; // Movimento ascendente lento
            element.alpha *= (0.8 + Math.sin(time * 2) * 0.2);
            element.rotation += 0.005;
            break;
            
        case "dimensional_tear":
            // Animação específica para rachaduras - tremulação sutil
            element.x += (Math.random() - 0.5) * 0.5;
            element.alpha *= (0.9 + Math.sin(time * 10) * 0.1);
            break;
            
        case "implosion_contraction":
            const contractionFactor = 1 - Math.sin(time * 2) * 0.1;
            element.scale.x = element.originalScaleX * contractionFactor;
            element.scale.y = element.originalScaleY * contractionFactor;
            break;
            
        case "elemental_chaos":
            element.rotation += (Math.sin(time * 4) * 0.02);
            element.scale.x = element.originalScaleX * (1 + Math.sin(time * 6 + element.elementIndex) * 0.2);
            element.scale.y = element.originalScaleY * (1 + Math.cos(time * 5 + element.elementIndex) * 0.2);
            break;
            
        case "singularity_pull":
            // Efeito de atração gravitacional
            const pullIntensity = Math.sin(time * 3) * 0.1;
            element.scale.x = element.originalScaleX * (1 - pullIntensity);
            element.scale.y = element.originalScaleY * (1 - pullIntensity);
            element.alpha *= (0.7 + Math.sin(time * 8) * 0.3);
            break;
            
        default:
            // Animação padrão - pulsação suave
            element.scale.x = element.originalScaleX * (1 + Math.sin(time * 2) * 0.05);
            element.scale.y = element.originalScaleY * (1 + Math.sin(time * 2) * 0.05);
    }
}

// Expor funções globalmente
window.initializeAttackVignetteSystem = initializeAttackVignetteSystem;
window.playAttackVignette = playAttackVignette;
window.cleanupAttackVignette = cleanupAttackVignette;
window.cleanupAllEffects = cleanupAllEffects;

// Inicialização do sistema de animação
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando sistema de animação...");
    
    // Evento de clique no personagem
    window.character.addEventListener('click', function(e) {
        console.log("Personagem clicado!");
        
        // Verificar estado atual do jogo
        if (window.gameState.inAction) {
            console.log("Ação em andamento, ignorando clique.");
            return;
        }
        
        // Agir conforme o estado atual
        if (window.gameState.characterView) {
            closeAllSubmenus();
            // Parar som do coração se estiver ativo
            if (typeof stopHeartbeatMusic === 'function') {
                stopHeartbeatMusic();
            }
            toggleCharacterView();
        }
        else if (window.gameState.zoomedView) {
            closeAllSubmenus();
            // Parar som do coração se estiver ativo
            if (typeof stopHeartbeatMusic === 'function') {
                stopHeartbeatMusic();
            }
            toggleZoomView();
            
            // Reset dos estilos dos botões após a transição
            setTimeout(() => {
                if (window.actionMenu) window.actionMenu.removeAttribute('style');
                if (window.attackButton) window.attackButton.removeAttribute('style');
                if (window.specialButton) window.specialButton.removeAttribute('style');
                if (window.inventoryButton) window.inventoryButton.removeAttribute('style');
            }, 500);
        }
        else {
            toggleZoomView();
        }
    });
    
    // Evento de clique no boss
    window.boss.addEventListener('click', function(e) {
        console.log("Boss clicado!", "bossView:", window.gameState.bossView, 
                "zoomedView:", window.gameState.zoomedView,
                "characterView:", window.gameState.characterView);
        
        // Na zoom-view, ignorar o clique no boss
        if (window.gameState.zoomedView) {
            console.log("Ignorando clique no boss na zoom-view");
            return;
        }
        
        // Verificar estado atual do jogo
        if (window.gameState.inAction) {
            console.log("Ação em andamento, ignorando clique.");
            return;
        }
        
        // Se já estamos na boss-view, voltar para a view anterior
        if (window.gameState.bossView) {
            toggleBossView();
        }
        // Se estamos na tela inicial, ir para boss-view
        else if (!window.gameState.zoomedView && !window.gameState.characterView) {
            toggleBossView();
        }
    });
    
    console.log("Sistema de animação inicializado com sucesso");
    // Inicializar sistema de vinhetas
    setTimeout(() => {
        if (typeof PIXI !== 'undefined') {
            initializeAttackVignetteSystem();
        } else {
            console.warn("⚠️ PixiJS não disponível para sistema de vinhetas");
        }
    }, 1000);
});