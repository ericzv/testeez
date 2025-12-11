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

                // DISPARA A ANIMAÇÃO DO PODER IMEDIATAMENTE
                startVladPowerAnimation();

                // Mostra o modal de skill test (animação já está rodando)
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

                    // FINALIZA A ANIMAÇÃO (muda para 1 iteração forwards)
                    stopVladPowerAnimation();

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

    // Inicia a animação do poder com loop infinito
    function startVladPowerAnimation() {
        console.log('🎬 Iniciando animação do Vlad Power com loop...');

        // Tenta múltiplos seletores para encontrar o sprite
        let playerSprite = document.querySelector('.character-sprite.player');

        if (!playerSprite) {
            console.log('⚠️ Tentando seletores alternativos...');
            playerSprite = document.querySelector('.player-character-sprite');

            if (!playerSprite) {
                playerSprite = document.querySelector('[class*="player"][class*="sprite"]');
            }

            if (!playerSprite) {
                playerSprite = document.querySelector('#player-sprite');
            }

            if (!playerSprite) {
                // Lista todos os possíveis sprites na página
                console.log('🔍 Elementos com "sprite" no nome:');
                document.querySelectorAll('[class*="sprite"]').forEach(el => {
                    console.log('  -', el.className, el);
                });

                console.log('🔍 Elementos com "player" no nome:');
                document.querySelectorAll('[class*="player"]').forEach(el => {
                    console.log('  -', el.className, el);
                });

                console.error('❌ Sprite do jogador não encontrado com nenhum seletor!');
                return;
            }
        }

        console.log('🎯 Sprite do jogador encontrado:', playerSprite);
        console.log('   Classes:', playerSprite.className);
        console.log('   ID:', playerSprite.id);

        // Salva a animação atual
        const computedStyle = window.getComputedStyle(playerSprite);

        console.log('📊 Estado atual do sprite:');
        console.log('   animation:', computedStyle.animation);
        console.log('   background:', computedStyle.background);
        console.log('   backgroundImage:', computedStyle.backgroundImage);
        console.log('   backgroundPosition:', computedStyle.backgroundPosition);

        animationState.originalAnimations.set(playerSprite, {
            animation: playerSprite.style.animation,
            backgroundPosition: playerSprite.style.backgroundPosition
        });

        // Remove styles de loop anteriores se existirem
        const oldStyle = document.getElementById('vlad-power-loop-style');
        if (oldStyle) {
            console.log('🗑️ Removendo style de loop anterior');
            oldStyle.remove();
        }

        // Cria animação de poder com 27 frames (spritesheet horizontal)
        const styleSheet = document.createElement('style');
        styleSheet.id = 'vlad-power-loop-style';
        styleSheet.textContent = `
            @keyframes vladPowerLoop {
                from { background-position-x: 0px; }
                to { background-position-x: calc(-176px * 27); }
            }
        `;
        document.head.appendChild(styleSheet);
        console.log('✅ Keyframe vladPowerLoop criado');

        // Aplica a animação com loop infinito
        // 27 frames × 74ms = ~2000ms por ciclo
        playerSprite.style.animation = 'vladPowerLoop 2s steps(27) infinite';

        console.log('🔄 Animação aplicada ao sprite:', playerSprite.style.animation);
        console.log('   Verificando depois de aplicar:', window.getComputedStyle(playerSprite).animation);

        animationState.paused = false;
    }

    // Para a animação (deixa terminar normalmente)
    function stopVladPowerAnimation() {
        console.log('▶️ Finalizando loop da animação do Vlad Power...');

        // Usa os mesmos seletores alternativos
        let playerSprite = document.querySelector('.character-sprite.player');
        if (!playerSprite) {
            playerSprite = document.querySelector('.player-character-sprite') ||
                          document.querySelector('[class*="player"][class*="sprite"]') ||
                          document.querySelector('#player-sprite');
        }

        if (!playerSprite) {
            console.warn('⚠️ Sprite do jogador não encontrado para parar!');
            return;
        }

        console.log('🎯 Parando animação do sprite:', playerSprite.className);
        console.log('   Animação atual:', playerSprite.style.animation);

        // Muda para 1 iteração e forwards (termina a animação atual e para)
        playerSprite.style.animationIterationCount = '1';
        playerSprite.style.animationFillMode = 'forwards';

        console.log('✅ Animação mudada para terminar');
        console.log('   iteration-count:', playerSprite.style.animationIterationCount);
        console.log('   fill-mode:', playerSprite.style.animationFillMode);

        // Limpa após a animação terminar
        setTimeout(() => {
            const styleToRemove = document.getElementById('vlad-power-loop-style');
            if (styleToRemove) {
                console.log('🗑️ Removendo keyframe de loop');
                styleToRemove.remove();
            }
            animationState.originalAnimations.clear();
            console.log('✅ Limpeza concluída');
        }, 2000); // Aguarda a duração da animação
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSkillTestIntegration);
    } else {
        initSkillTestIntegration();
    }

})();

console.log('✅ Battle Skill Test Integration loaded');
