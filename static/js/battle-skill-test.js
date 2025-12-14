/**
 * BATTLE SKILL TEST SYSTEM
 * Sistema de skill test para o Power Attack do Vlad
 * Integrado com dificuldade progressiva e áudio sintetizado
 */

// ============================================
// ESTADO GLOBAL
// ============================================
window.skillTestSystem = {
    isActive: false,
    currentValue: 0,
    animationStartTime: null,
    animationFrameId: null,  // ID do requestAnimationFrame para cancelar
    lastPlayedBar: 0,
    usesThisTurn: 0,
    currentDifficulty: 1,
    audioContext: null,
    audioEnabled: false,
    pendingSkill: null,
    pendingCallback: null
};

// Constantes
const ANIMATION_DURATION = 1000; // 1 segundo
const SEGMENTS = 10;

// ============================================
// SISTEMA DE ÁUDIO
// ============================================
function initSkillTestAudio() {
    const st = window.skillTestSystem;
    if (!st.audioContext) {
        st.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        st.audioEnabled = true;
        console.log('🔊 Sistema de áudio do skill test inicializado');
    }
}

function playSkillTestBeep(barValue) {
    const st = window.skillTestSystem;
    if (!st.audioEnabled || !st.audioContext) return;

    const oscillator = st.audioContext.createOscillator();
    const gainNode = st.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(st.audioContext.destination);

    // Frequências crescentes: 220 Hz (A3) até 880 Hz (A5)
    const baseFreq = 220;
    const frequency = baseFreq + (barValue - 1) * 73.33;
    oscillator.frequency.value = frequency;

    oscillator.type = 'sine'; // Som suave

    // Envelope de volume
    gainNode.gain.setValueAtTime(0.2, st.audioContext.currentTime); // Volume mais baixo para não incomodar
    gainNode.gain.exponentialRampToValueAtTime(0.01, st.audioContext.currentTime + 0.05);

    oscillator.start(st.audioContext.currentTime);
    oscillator.stop(st.audioContext.currentTime + 0.05);
}

// Som de "lock" quando jogador clica (varia conforme o score)
function playLockSound(score) {
    let soundFile;

    if (score === 1) {
        soundFile = 'hit-dull1.mp3';
    } else if (score >= 2 && score <= 4) {
        soundFile = 'hit2.mp3';
    } else if (score >= 5 && score <= 6) {
        soundFile = 'hit3.mp3';
    } else if (score === 7) {
        soundFile = 'hit-magic2.mp3';
    } else if (score >= 8 && score <= 9) {
        soundFile = 'hit-magic4.mp3';
    } else if (score === 10) {
        soundFile = 'hit-magic3.mp3';
    }

    const audio = new Audio(`/static/game.data/sounds/${soundFile}`);
    audio.volume = 0.6;
    audio.play().catch(err => console.warn('Erro ao tocar som de lock:', err));
}

// ============================================
// FUNÇÕES DE EASING
// ============================================
function easeInScaled(t, difficulty) {
    const exponent = 2 + difficulty; // 3, 4, 5, 6...
    return Math.pow(t, exponent);
}

function easeOutScaled(t, difficulty) {
    const exponent = 2 + difficulty;
    return 1 - Math.pow(1 - t, exponent);
}

function calculateSkillTestValue(timestamp) {
    const st = window.skillTestSystem;
    if (!st.animationStartTime) st.animationStartTime = timestamp;

    const elapsed = (timestamp - st.animationStartTime) % ANIMATION_DURATION;
    const progress = elapsed / ANIMATION_DURATION;

    let value;
    if (progress < 0.5) {
        // 0 -> 10 (acelerando)
        const t = progress * 2;
        value = easeInScaled(t, st.currentDifficulty) * 10;
    } else {
        // 10 -> 0 (desacelerando)
        const t = (progress - 0.5) * 2;
        value = 10 - (easeOutScaled(t, st.currentDifficulty) * 10);
    }

    return value;
}

// ============================================
// ATUALIZAÇÃO DAS BARRINHAS DE LUZ
// ============================================
function updateSkillTestBars(value) {
    const st = window.skillTestSystem;
    const lightBars = document.querySelectorAll('.skill-test-light-bar');
    const activeLevel = Math.ceil(value);

    // Toca som quando mudar de barra
    if (activeLevel !== st.lastPlayedBar && activeLevel > 0 && activeLevel <= 10) {
        playSkillTestBeep(activeLevel);
        st.lastPlayedBar = activeLevel;
    }

    lightBars.forEach((bar, idx) => {
        const barValue = idx + 1;
        if (barValue <= activeLevel) {
            bar.classList.add('lit');
        } else {
            bar.classList.remove('lit');
        }
    });

    return activeLevel;
}

// ============================================
// LOOP DE ANIMAÇÃO
// ============================================
function animateSkillTest(timestamp) {
    const st = window.skillTestSystem;
    if (st.isActive) {
        st.currentValue = calculateSkillTestValue(timestamp);
        updateSkillTestBars(st.currentValue);
        st.animationFrameId = requestAnimationFrame(animateSkillTest);
    }
}

// ============================================
// ATIVAÇÃO DO SKILL TEST
// ============================================
function activateSkillTest() {
    const st = window.skillTestSystem;
    if (!st.isActive) return;

    // PARA A ANIMAÇÃO IMEDIATAMENTE (elimina qualquer delay)
    st.isActive = false;
    if (st.animationFrameId) {
        cancelAnimationFrame(st.animationFrameId);
        st.animationFrameId = null;
    }

    // CAPTURA O VALOR IMEDIATAMENTE (anti-lag)
    // Usa o valor atual NO MOMENTO DO CLIQUE, não no próximo frame
    const capturedValue = st.currentValue;
    const value = Math.ceil(capturedValue);

    // Inicializa áudio no primeiro clique
    initSkillTestAudio();

    // Incrementa usos no turno
    st.usesThisTurn++;
    st.currentDifficulty = st.usesThisTurn;

    console.log(`⚔️ Skill Test ativado! Valor capturado: ${capturedValue.toFixed(2)} → ${value}, Dificuldade: ${st.currentDifficulty}`);

    // (1) TOCA SOM DE LOCK (varia conforme o score)
    playLockSound(value);

    // (2) ADICIONA CLASSE .locked NA BARRA ATIVA
    const lightBars = document.querySelectorAll('.skill-test-light-bar');
    lightBars.forEach((bar, idx) => {
        const barValue = idx + 1;
        if (barValue === value) {
            bar.classList.add('locked');
        }
    });

    // Calcula resultado
    const result = calculateSkillTestResult(value);

    // (3) MOSTRAR RESULTADO COM ÍCONE (200ms após lock)
    setTimeout(() => {
        showSkillTestResultDisplay(result);
    }, 200);

    // (4) AGUARDA 1500ms ANTES DE FECHAR O MODAL (dar tempo de ver o resultado)
    setTimeout(() => {
        closeSkillTestModal();

        // Remove classes .locked após fechar
        lightBars.forEach(bar => {
            bar.classList.remove('locked');
        });
    }, 1500);

    // Executa callback com resultado APÓS o delay visual
    setTimeout(() => {
        if (st.pendingCallback) {
            st.pendingCallback(result);
        }
    }, 1500);
}

// ============================================
// CÁLCULO DO RESULTADO
// ============================================
function calculateSkillTestResult(value) {
    let result = {
        value: value,
        damageModifier: 1.0,
        barrier: 0,
        forceCritical: false,
        text: '',
        description: '',
        cssClass: ''
    };

    if (value === 1) {
        result.damageModifier = 0; // MISS
        result.text = 'MISS!';
        result.description = 'O ataque falhou completamente!';
        result.cssClass = 'result-miss';
    } else if (value === 2) {
        result.damageModifier = 0.5; // -50%
        result.text = 'HORRÍVEL';
        result.description = '-50% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 3) {
        result.damageModifier = 0.6; // -40%
        result.text = 'PÉSSIMO';
        result.description = '-40% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 4) {
        result.damageModifier = 0.7; // -30%
        result.text = 'MUITO RUIM';
        result.description = '-30% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 5) {
        result.damageModifier = 0.8; // -20%
        result.text = 'RUIM';
        result.description = '-20% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 6) {
        result.damageModifier = 0.9; // -10%
        result.text = 'FRACO';
        result.description = '-10% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 7) {
        result.damageModifier = 1.0; // Normal
        result.text = 'NORMAL';
        result.description = 'Dano normal';
        result.cssClass = 'result-normal';
    } else if (value === 8) {
        result.damageModifier = 1.10; // +10%
        result.barrier = 0; // Sem barreira
        result.text = 'BOM!';
        result.description = '+10% de dano';
        result.cssClass = 'result-positive';
    } else if (value === 9) {
        result.damageModifier = 1.20; // +20%
        result.barrier = 2; // Reduzido de 4 para 2
        result.text = 'ÓTIMO!';
        result.description = '+20% de dano + 2 barreira';
        result.cssClass = 'result-positive';
    } else if (value === 10) {
        result.damageModifier = 1.0; // 100% (mas com crítico forçado = 150% total)
        result.barrier = 4; // Reduzido de 6 para 4
        result.forceCritical = true;
        result.text = 'PERFEITO!';
        result.description = 'Acerto crítico! + 4 barreira';
        result.cssClass = 'result-perfect';
    }

    console.log(`🎯 Resultado calculado: valor=${value}, modifier=${result.damageModifier}, barrier=${result.barrier}, critical=${result.forceCritical}`);

    return result;
}

// ============================================
// CONTROLE DO MODAL
// ============================================
function showSkillTestModal(skill, callback) {
    const st = window.skillTestSystem;
    st.pendingSkill = skill;
    st.pendingCallback = callback;

    // Mostra o modal
    const modal = document.getElementById('skill-test-modal');
    if (!modal) {
        console.error('❌ Modal de skill test não encontrado!');
        // Fallback: executa sem skill test
        callback({ value: 7, damageModifier: 1.0, barrier: 0 });
        return;
    }

    // Esconder resultado anterior (se houver)
    const resultDisplay = document.getElementById('skill-test-result-display');
    if (resultDisplay) {
        resultDisplay.style.display = 'none';
    }

    modal.classList.add('active');

    // Reseta estado
    st.isActive = true;
    st.animationStartTime = null;
    st.currentValue = 0;
    st.lastPlayedBar = 0;

    // INICIALIZA ÁUDIO IMEDIATAMENTE (fix: som na primeira vez)
    initSkillTestAudio();

    // Atualiza UI de dificuldade (gem)
    updateSkillTestDifficultyDisplay();

    // Atualiza tooltip com simulação de dano
    updateTooltipWithDamageSimulation();

    // Inicia animação
    requestAnimationFrame(animateSkillTest);

    console.log('⚔️ Skill Test Modal aberto - aguardando ativação');
}

function closeSkillTestModal() {
    const modal = document.getElementById('skill-test-modal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Iniciar fade-out do resultado 1000ms após modal fechar
    setTimeout(() => {
        const resultDisplay = document.getElementById('skill-test-result-display');
        if (resultDisplay && resultDisplay.style.display !== 'none') {
            // Adicionar classe de fade-out
            resultDisplay.classList.add('fade-out');

            // Esconder completamente após animação terminar (500ms)
            setTimeout(() => {
                resultDisplay.style.display = 'none';
                resultDisplay.classList.remove('fade-out');
            }, 500);
        }
    }, 1000);
}

function updateSkillTestDifficultyDisplay() {
    const st = window.skillTestSystem;
    const gemImg = document.getElementById('skill-test-gem');

    if (!gemImg) return;

    let gemFile = '';

    if (st.currentDifficulty === 1) {
        gemFile = 'easy.png';
    } else if (st.currentDifficulty === 2) {
        gemFile = 'medium.png';
    } else if (st.currentDifficulty === 3) {
        gemFile = 'hard.png';
    } else {
        gemFile = 'veryhard.png';
    }

    gemImg.src = `/static/game.data/skilltests/${gemFile}`;
    console.log(`💎 Gem atualizada: ${gemFile}`);
}

// ============================================
// SIMULAÇÃO DE DANO NO TOOLTIP
// ============================================
function updateTooltipWithDamageSimulation() {
    // Verificar se temos dados necessários
    if (!window.gameState || !window.gameState.player) {
        console.warn('⚠️ gameState.player não disponível para simulação');
        return;
    }

    if (!window.skillTestSystem || !window.skillTestSystem.pendingSkill) {
        console.warn('⚠️ pendingSkill não disponível para simulação');
        return;
    }

    const player = window.gameState.player;
    const skill = window.skillTestSystem.pendingSkill;

    // Calcular dano base (10 pontos para o Power do Vlad - skill ID 50)
    const damagePoints = 10; // Dano base do poder

    // Calcular dano usando o sistema de dano (sem skill test modifier)
    let baseDamage = damagePoints;

    // Aplicar multiplicador da skill
    if (skill.damageModifier && !isNaN(parseFloat(skill.damageModifier))) {
        baseDamage = Math.floor(baseDamage * parseFloat(skill.damageModifier));
    }

    // Aplicar bônus de força (usando calculateStrengthDamage se disponível)
    if (typeof calculateStrengthDamage === 'function' && player.strength) {
        const strengthMult = calculateStrengthDamage(player.strength);
        baseDamage = Math.floor(baseDamage * strengthMult);
    }

    // Aplicar bônus de dano do player
    if (player.damageBonus) {
        baseDamage = Math.floor(baseDamage * (1 + player.damageBonus));
    }

    console.log(`💥 Dano base calculado: ${baseDamage}`);

    // Atualizar cada linha da legenda com simulação
    const scores = [
        { value: 1, modifier: 0, crit: false },      // MISS
        { value: 2, modifier: 0.5, crit: false },    // -50%
        { value: 3, modifier: 0.6, crit: false },    // -40%
        { value: 4, modifier: 0.7, crit: false },    // -30%
        { value: 5, modifier: 0.8, crit: false },    // -20%
        { value: 6, modifier: 0.9, crit: false },    // -10%
        { value: 7, modifier: 1.0, crit: false },    // Normal
        { value: 8, modifier: 1.10, crit: false },   // +10%
        { value: 9, modifier: 1.20, crit: false },   // +20%
        { value: 10, modifier: 1.0, crit: true }     // Crítico
    ];

    scores.forEach(score => {
        const legendItem = document.querySelector(`.tooltip-legend .legend-item:nth-child(${score.value + 1})`); // +1 por causa do legend-title
        if (legendItem) {
            let simulatedDamage = Math.floor(baseDamage * score.modifier);

            // Aplicar crítico (1.5x) para score 10
            if (score.crit) {
                simulatedDamage = Math.floor(simulatedDamage * 1.5);
            }

            // Pegar texto atual e adicionar simulação
            const currentText = legendItem.textContent.trim();
            const textWithoutSimulation = currentText.replace(/\s*\(\d+\)/, ''); // Remove simulação anterior

            legendItem.textContent = `${textWithoutSimulation} (${simulatedDamage})`;
        }
    });

    console.log('✅ Tooltip atualizado com simulação de dano');
}

// ============================================
// EXIBIR RESULTADO COM ÍCONE
// ============================================
function showSkillTestResultDisplay(result) {
    const resultDisplay = document.getElementById('skill-test-result-display');
    const resultIcon = document.getElementById('result-icon');
    const resultName = document.getElementById('result-name');
    const resultDescription = document.getElementById('result-description');

    if (!resultDisplay || !resultIcon || !resultName || !resultDescription) return;

    // Mapear cssClass para nome do arquivo de ícone
    let iconFile = '';
    let displayClass = '';

    if (result.cssClass === 'result-miss') {
        iconFile = 'result-verybad.png';
        displayClass = 'result-display-miss';
    } else if (result.cssClass === 'result-negative') {
        // Scores 2-6 usam result-bad
        iconFile = 'result-bad.png';
        displayClass = 'result-display-negative';
    } else if (result.cssClass === 'result-normal') {
        iconFile = 'result-normal.png';
        displayClass = 'result-display-normal';
    } else if (result.cssClass === 'result-positive') {
        iconFile = 'result-good.png';
        displayClass = 'result-display-positive';
    } else if (result.cssClass === 'result-perfect') {
        iconFile = 'result-perfect.png';
        displayClass = 'result-display-perfect';
    }

    // Atualizar conteúdo
    resultIcon.src = `/static/game.data/skilltests/${iconFile}`;
    resultName.textContent = result.text;
    resultDescription.textContent = result.description;

    // Atualizar classes
    resultDisplay.className = 'skill-test-result-display ' + displayClass;

    // Mostrar o display
    resultDisplay.style.display = 'flex';

    console.log(`📊 Resultado exibido: ${result.text} (${iconFile})`);
}

// ============================================
// RESET DO TURNO
// ============================================
function resetSkillTestTurn() {
    const st = window.skillTestSystem;
    st.usesThisTurn = 0;
    st.currentDifficulty = 1;
    console.log('🔄 Skill Test - turno resetado (dificuldade volta ao normal)');
}

// Listener para reset automático quando o turno do player começar
// Isso é chamado quando o turno do inimigo termina
function setupTurnResetListeners() {
    // Detecta quando o turno do jogador começa (após turno do inimigo)
    const originalUpdateTurnUI = window.updateTurnUI;
    if (originalUpdateTurnUI) {
        window.updateTurnUI = function(...args) {
            // Chama a função original
            const result = originalUpdateTurnUI.apply(this, args);

            // Reseta dificuldade do skill test
            resetSkillTestTurn();

            return result;
        };
        console.log('✅ Listener de reset de turno instalado');
    }

    // Alternativa: listener via gameState
    if (window.gameState) {
        const checkTurnChange = setInterval(() => {
            if (window.gameState.playerTurn && !window.skillTestSystem.lastKnownTurn) {
                // Turno do jogador começou
                resetSkillTestTurn();
            }
            window.skillTestSystem.lastKnownTurn = window.gameState.playerTurn;
        }, 1000);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚔️ Skill Test System carregado');

    // Listener para ativação (click na barra ou espaço/enter)
    const powerBar = document.getElementById('skill-test-power-bar');
    if (powerBar) {
        powerBar.addEventListener('click', activateSkillTest);
    }

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('skill-test-modal');
        if (modal && modal.classList.contains('active')) {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                activateSkillTest();
            }
        }
    });

    // Instala listeners para reset de turno
    setTimeout(setupTurnResetListeners, 2000); // Aguarda o jogo carregar
});

// ============================================
// EXPORTS
// ============================================
window.showSkillTestModal = showSkillTestModal;
window.closeSkillTestModal = closeSkillTestModal;
window.resetSkillTestTurn = resetSkillTestTurn;
window.skillTestSystem = window.skillTestSystem;

console.log('✅ Battle Skill Test System loaded');
