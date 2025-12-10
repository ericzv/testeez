/**
 * BATTLE SKILL TEST INTEGRATION
 * Integração do skill test com o sistema de batalha
 * Intercepta performAttack para detectar Power Attack do Vlad
 */

(function() {
    console.log('🎯 Carregando integração de Skill Test...');

    // Verifica se o modal existe
    setTimeout(() => {
        const modal = document.getElementById('skill-test-modal');
        console.log('🔍 Modal de skill test encontrado:', modal ? 'SIM' : 'NÃO');
        if (modal) {
            console.log('✅ Modal HTML presente no DOM');
        } else {
            console.error('❌ ERRO: Modal não encontrado no DOM!');
        }
    }, 1000);

    // Aguarda o DOM estar pronto e o performAttack estar disponível
    function initSkillTestIntegration() {
        if (typeof window.performAttack !== 'function') {
            console.log('⏳ performAttack ainda não disponível, aguardando...');
            setTimeout(initSkillTestIntegration, 100);
            return;
        }

        // Salva a função original
        const originalPerformAttack = window.performAttack;

        // Wrappeia a função performAttack
        window.performAttack = function(skill) {
            console.log('🔍 ========================================');
            console.log('🔍 performAttack CHAMADO!');
            console.log('🔍 ========================================');
            console.log('🔍 Skill object:', skill);
            console.log('🔍 skill.id:', skill?.id);
            console.log('🔍 skill.skill_id:', skill?.skill_id);
            console.log('🔍 skill.name:', skill?.name);
            console.log('🔍 skill.skill_type:', skill?.skill_type);
            console.log('🔍 ========================================');
            console.log('🔍 CHECANDO VARIÁVEIS GLOBAIS:');
            console.log('🔍 window.currentCharacterId:', window.currentCharacterId);
            console.log('🔍 window.gameState:', window.gameState);
            console.log('🔍 window.gameState?.player:', window.gameState?.player);
            console.log('🔍 window.gameState?.player?.character_id:', window.gameState?.player?.character_id);
            console.log('🔍 window.gameState?.player?.characterId:', window.gameState?.player?.characterId);
            console.log('🔍 window.playerData:', window.playerData);
            console.log('🔍 ========================================');

            // Verifica se é o Power Attack (skill_id 50 - "Energia Escura")
            const isPowerAttack = skill && (
                skill.id === 50 ||
                skill.skill_id === 50 ||
                (skill.name && skill.name.toLowerCase().includes('energia escura')) ||
                (skill.skill_type === 'power')
            );

            console.log('🔍 isPowerAttack:', isPowerAttack);

            // ============================================
            // MODO DEBUG: FORÇA SKILL TEST PARA POWER
            // Remove isso depois de funcionar!
            // ============================================
            if (isPowerAttack) {
                console.log('⚔️ ========================================');
                console.log('⚔️ POWER ATTACK DETECTADO!');
                console.log('⚔️ FORÇANDO SKILL TEST (MODO DEBUG)');
                console.log('⚔️ ========================================');

                // Armazena a skill para uso posterior
                window.skillTestSystem.pendingSkill = skill;

                // PAUSA ANIMAÇÃO E FAZ LOOP DOS FRAMES 4-16
                pauseVladPowerAnimation();

                // Mostra o modal de skill test
                window.showSkillTestModal(skill, function(result) {
                    console.log('✅ Skill Test completado:', result);

                    // APLICA O MODIFICADOR DE DANO NA SKILL
                    // O backend vai usar isso no calculate_total_damage
                    skill.skill_test_modifier = result.damageModifier;
                    skill.skillTestResult = result;
                    skill.skillTestBarrier = result.barrier;

                    console.log(`💥 Skill test modifier aplicado: ${result.damageModifier} (${(result.damageModifier * 100).toFixed(0)}%)`);

                    // Aplica barreira ao jogador se houver
                    if (result.barrier > 0) {
                        applySkillTestBarrier(result.barrier);
                    }

                    // Exibe feedback visual
                    showSkillTestFeedback(result);

                    // RESUME ANIMAÇÃO DO VLAD (continua do frame 16 até 27)
                    resumeVladPowerAnimation();

                    // Aguarda um pouco antes de executar o ataque
                    setTimeout(() => {
                        // Executa o ataque original COM O MODIFICADOR
                        originalPerformAttack.call(this, skill);
                    }, 800);
                });
            } else {
                // Não é Power Attack do Vlad, executa normalmente
                originalPerformAttack.call(this, skill);
            }
        };

        console.log('✅ Skill Test Integration ativada!');
    }

    // Função para aplicar barreira ao jogador
    function applySkillTestBarrier(barrierAmount) {
        // Busca o elemento de barreira do jogador
        const playerBarrierEl = document.querySelector('.player-barrier-value');
        if (playerBarrierEl) {
            const currentBarrier = parseInt(playerBarrierEl.textContent) || 0;
            const newBarrier = currentBarrier + barrierAmount;
            playerBarrierEl.textContent = newBarrier;

            // Anima o elemento
            const barrierContainer = playerBarrierEl.closest('.stat-item');
            if (barrierContainer) {
                barrierContainer.classList.add('stat-changed');
                setTimeout(() => {
                    barrierContainer.classList.remove('stat-changed');
                }, 600);
            }

            console.log(`🛡️ Barreira aplicada: +${barrierAmount} (total: ${newBarrier})`);
        }

        // Também atualiza no backend via AJAX
        fetch('/battle/apply_barrier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                barrier_amount: barrierAmount
            })
        }).catch(err => {
            console.error('Erro ao aplicar barreira no servidor:', err);
        });
    }

    // Função para mostrar feedback visual do resultado
    function showSkillTestFeedback(result) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 25px 50px;
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            font-size: 32px;
            font-weight: bold;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(233, 69, 96, 0.8);
            z-index: 10001;
            animation: skillTestFeedback 0.8s ease-out;
            text-shadow: 0 0 10px currentColor;
            border: 3px solid ${getFeedbackColor(result.cssClass)};
        `;

        let emoji = '';
        if (result.cssClass === 'result-miss') emoji = '❌';
        else if (result.cssClass === 'result-negative') emoji = '⚠️';
        else if (result.cssClass === 'result-normal') emoji = '⚔️';
        else if (result.cssClass === 'result-positive') emoji = '✨';
        else if (result.cssClass === 'result-perfect') emoji = '🌟';

        feedback.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
                <div style="color: ${getFeedbackColor(result.cssClass)};">${result.text}</div>
                <div style="font-size: 18px; margin-top: 10px; opacity: 0.9;">${result.description}</div>
            </div>
        `;

        // Adiciona animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes skillTestFeedback {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.15);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(feedback);

        // Remove após 1.5 segundos
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                feedback.remove();
                style.remove();
            }, 300);
        }, 1500);
    }

    function getFeedbackColor(cssClass) {
        switch(cssClass) {
            case 'result-miss': return '#ff1744';
            case 'result-negative': return '#ff6f00';
            case 'result-normal': return '#9e9e9e';
            case 'result-positive': return '#00e676';
            case 'result-perfect': return '#e040fb';
            default: return '#fff';
        }
    }

    // Listener para reset de turno (quando turno do inimigo termina)
    // Podemos resetar a dificuldade aqui
    window.addEventListener('enemy-turn-end', () => {
        if (typeof window.resetSkillTestTurn === 'function') {
            window.resetSkillTestTurn();
        }
    });

    // ============================================
    // CONTROLE DE ANIMAÇÃO DO VLAD
    // ============================================

    // Estado da animação
    let animationState = {
        paused: false,
        originalAnimations: new Map(),
        loopIntervalId: null
    };

    // Faz loop da animação do Vlad enquanto canaliza o poder
    function pauseVladPowerAnimation() {
        console.log('🎬 Iniciando loop da animação do Vlad Power...');

        // Busca o sprite do personagem jogador (Vlad)
        const playerSprite = document.querySelector('.character-sprite.player');

        if (!playerSprite) {
            console.warn('⚠️ Sprite do jogador não encontrado!');
            return;
        }

        console.log('🎯 Sprite do jogador encontrado:', playerSprite);

        // Salva a animação atual
        const computedStyle = window.getComputedStyle(playerSprite);
        const currentAnimation = computedStyle.animation;

        animationState.originalAnimations.set(playerSprite, {
            animation: playerSprite.style.animation,
            iterationCount: playerSprite.style.animationIterationCount
        });

        // Força a animação atual a loopear infinitamente
        // Mantém a animação atual, só muda o iteration-count
        playerSprite.style.animationIterationCount = 'infinite';

        console.log('🔄 Animação do Vlad agora em loop infinito');
        animationState.paused = true;
    }

    // Resume a animação do Vlad (deixa terminar normalmente)
    function resumeVladPowerAnimation() {
        console.log('▶️ Finalizando animação do Vlad Power...');

        // Busca o sprite do jogador
        const playerSprite = document.querySelector('.character-sprite.player');

        if (!playerSprite) {
            console.warn('⚠️ Sprite do jogador não encontrado para resumir!');
            return;
        }

        // Restaura iteration count original (geralmente 1 ou não definido)
        // A animação vai continuar até o final e parar com forwards
        const original = animationState.originalAnimations.get(playerSprite);
        if (original) {
            if (original.iterationCount) {
                playerSprite.style.animationIterationCount = original.iterationCount;
            } else {
                playerSprite.style.animationIterationCount = '1';
            }
            console.log('✅ Animação restaurada para terminar normalmente (forwards)');
        }

        animationState.paused = false;
        animationState.originalAnimations.clear();
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSkillTestIntegration);
    } else {
        initSkillTestIntegration();
    }

})();

console.log('✅ Battle Skill Test Integration loaded');
