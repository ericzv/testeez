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
        requestAnimationFrame(animateSkillTest);
    }
}

// ============================================
// ATIVAÇÃO DO SKILL TEST
// ============================================
function activateSkillTest() {
    const st = window.skillTestSystem;
    if (!st.isActive) return;

    // CAPTURA O VALOR IMEDIATAMENTE (anti-lag)
    // Usa o valor atual NO MOMENTO DO CLIQUE, não no próximo frame
    const capturedValue = st.currentValue;
    const value = Math.ceil(capturedValue);

    // Inicializa áudio no primeiro clique
    initSkillTestAudio();

    st.isActive = false;

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

    // (3) AGUARDA 500ms ANTES DE FECHAR O MODAL
    setTimeout(() => {
        closeSkillTestModal();

        // Remove classes .locked após fechar
        lightBars.forEach(bar => {
            bar.classList.remove('locked');
        });
    }, 500);

    // Calcula resultado
    const result = calculateSkillTestResult(value);

    // Executa callback com resultado APÓS o delay visual
    setTimeout(() => {
        if (st.pendingCallback) {
            st.pendingCallback(result);
        }
    }, 500);
}

// ============================================
// CÁLCULO DO RESULTADO
// ============================================
function calculateSkillTestResult(value) {
    let result = {
        value: value,
        damageModifier: 1.0,
        barrier: 0,
        text: '',
        description: '',
        cssClass: ''
    };

    if (value === 1) {
        result.damageModifier = 0; // MISS
        result.text = 'MISS!';
        result.description = 'O ataque falhou completamente!';
        result.cssClass = 'result-miss';
    } else if (value >= 2 && value <= 4) {
        result.damageModifier = 0.9; // -10%
        result.text = 'FRACO';
        result.description = '-10% de dano';
        result.cssClass = 'result-negative';
    } else if (value >= 5 && value <= 6) {
        result.damageModifier = 0.95; // -5%
        result.text = 'ABAIXO';
        result.description = '-5% de dano';
        result.cssClass = 'result-negative';
    } else if (value === 7) {
        result.damageModifier = 1.0; // Normal
        result.text = 'NORMAL';
        result.description = 'Dano normal';
        result.cssClass = 'result-normal';
    } else if (value === 8) {
        result.damageModifier = 1.05; // +5%
        result.text = 'BOM!';
        result.description = '+5% de dano';
        result.cssClass = 'result-positive';
    } else if (value === 9) {
        result.damageModifier = 1.10; // +10%
        result.barrier = 2;
        result.text = 'ÓTIMO!';
        result.description = '+10% de dano + 2 barreira';
        result.cssClass = 'result-positive';
    } else if (value === 10) {
        result.damageModifier = 1.10; // +10%
        result.barrier = 5;
        result.text = 'PERFEITO!';
        result.description = '+10% de dano + 5 barreira';
        result.cssClass = 'result-perfect';
    }

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

    modal.classList.add('active');

    // Reseta estado
    st.isActive = true;
    st.animationStartTime = null;
    st.currentValue = 0;
    st.lastPlayedBar = 0;

    // INICIALIZA ÁUDIO IMEDIATAMENTE (fix: som na primeira vez)
    initSkillTestAudio();

    // Atualiza UI de dificuldade
    updateSkillTestDifficultyDisplay();

    // Inicia animação
    requestAnimationFrame(animateSkillTest);

    console.log('⚔️ Skill Test Modal aberto - aguardando ativação');
}

function closeSkillTestModal() {
    const modal = document.getElementById('skill-test-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateSkillTestDifficultyDisplay() {
    const st = window.skillTestSystem;
    const difficultyEl = document.getElementById('skill-test-difficulty');

    if (!difficultyEl) return;

    let text = '';
    let colorClass = '';

    if (st.currentDifficulty === 1) {
        text = 'Dificuldade: Normal';
        colorClass = 'difficulty-1';
    } else if (st.currentDifficulty === 2) {
        text = 'Dificuldade: Médio';
        colorClass = 'difficulty-2';
    } else if (st.currentDifficulty === 3) {
        text = 'Dificuldade: Difícil';
        colorClass = 'difficulty-3';
    } else {
        text = 'Dificuldade: Muito Difícil';
        colorClass = 'difficulty-4';
    }

    difficultyEl.textContent = text;
    difficultyEl.className = 'skill-test-difficulty ' + colorClass;
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
