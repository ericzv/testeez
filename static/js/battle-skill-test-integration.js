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

                // PAUSA A ANIMAÇÃO NO FRAME 4 E FAZ LOOP ATÉ FRAME 16
                pauseVladPowerAnimation();

                // Mostra o modal de skill test
                window.showSkillTestModal(skill, function(result) {
                    console.log('✅ Skill Test completado:', result);

                    // CONTINUA A ANIMAÇÃO DE ONDE PAROU
                    resumeVladPowerAnimation();

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

    // Pausa a animação do Vlad no frame 4 e faz loop até frame 16
    function pauseVladPowerAnimation() {
        console.log('🎬 Pausando animação do Vlad Power no frame 4...');

        // Busca todas as layers da animação do Vlad
        const layers = document.querySelectorAll('[class*="character-sprite"]');

        layers.forEach(layer => {
            // Salva estilo original
            const computedStyle = window.getComputedStyle(layer);
            animationState.originalAnimations.set(layer, {
                animation: layer.style.animation,
                animationPlayState: layer.style.animationPlayState
            });

            // Aguarda a animação chegar no frame 4 (~222ms = 3 frames * 74ms)
            setTimeout(() => {
                // Pausa a animação
                layer.style.animationPlayState = 'paused';

                // Cria CSS keyframes para loop dos frames 4-16
                const styleSheet = document.createElement('style');
                styleSheet.id = 'vlad-power-loop-keyframes';
                styleSheet.textContent = `
                    @keyframes vladPowerLoop {
                        0% { background-position-x: calc(-176px * 4); }
                        100% { background-position-x: calc(-176px * 16); }
                    }
                `;
                document.head.appendChild(styleSheet);

                // Aplica a nova animação de loop
                const duration = (16 - 4) * 74; // 12 frames * 74ms = ~888ms
                layer.style.animation = `vladPowerLoop ${duration}ms steps(12) infinite`;

                console.log(`🔄 Layer ${layer.className} agora em loop (frames 4-16)`);
            }, 222); // Tempo para chegar ao frame 4
        });

        animationState.paused = true;
    }

    // Resume a animação do Vlad de onde parou
    function resumeVladPowerAnimation() {
        console.log('▶️ Resumindo animação do Vlad Power...');

        // Remove o style de loop
        const loopStyle = document.getElementById('vlad-power-loop-keyframes');
        if (loopStyle) {
            loopStyle.remove();
        }

        // Busca todas as layers
        const layers = document.querySelectorAll('[class*="character-sprite"]');

        layers.forEach(layer => {
            // Restaura animação original
            const original = animationState.originalAnimations.get(layer);
            if (original) {
                // Calcula em qual frame estamos (aproximadamente frame 4-16)
                // E ajusta para continuar dali até o frame 27
                const remainingFrames = 27 - 16; // 11 frames restantes
                const remainingDuration = remainingFrames * 74; // ~814ms

                // Remove a animação de loop
                layer.style.animation = '';

                // Aplica animação dos frames 16-27 (resto da animação)
                const styleSheet = document.createElement('style');
                styleSheet.id = 'vlad-power-finish';
                styleSheet.textContent = `
                    @keyframes vladPowerFinish {
                        0% { background-position-x: calc(-176px * 16); }
                        100% { background-position-x: calc(-176px * 27); }
                    }
                `;
                document.head.appendChild(styleSheet);

                layer.style.animation = `vladPowerFinish ${remainingDuration}ms steps(${remainingFrames}) forwards`;

                // Remove o style temporário após a animação
                setTimeout(() => {
                    const finishStyle = document.getElementById('vlad-power-finish');
                    if (finishStyle) {
                        finishStyle.remove();
                    }
                }, remainingDuration + 100);

                console.log(`▶️ Layer ${layer.className} continuando frames 16-27`);
            }
        });

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
