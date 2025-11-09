// battle-combat-system.js - Sistema de Combate e Câmeras
// Versão 1.0

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar container do personagem quando a página carrega
    initializeCharacterContainer();
    
    console.log('Sistema de personagens inicializado');
});

// ===== SISTEMA DE CONFIGURAÇÃO DE PROJÉTEIS =====
const PROJECTILE_TYPES = {
    // Projéteis básicos
    "magic_missile": {
        size: { width: 20, height: 20 },
        visual: {
            background: "radial-gradient(circle, #00ffff 0%, #0088ff 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 25px #00ffff"
        },
        speed: 1.2,
        trail: false,
        sound: null
    },
    
    "fireball": {
        size: { width: 25, height: 25 },
        visual: {
            background: "radial-gradient(circle, #ff4500 0%, #ff0000 50%, #8b0000 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 30px #ff4500, 0 0 60px #ff0000"
        },
        speed: 1.0,
        trail: true,
        trailColor: "#ff4500",
        sound: "/static/game.data/sounds/fireball_whoosh.mp3"
    },
    "holy_light": {
        size: { width: 18, height: 18 },
        visual: {
            background: "radial-gradient(circle, #ffffff 0%, #ffd700 50%, #ffb347 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 50px #ffffff, 0 0 100px #ffd700"
        },
        speed: 1.3,
        trail: true,
        trailColor: "#ffd700",
        glow: true,
        sound: "/static/game.data/sounds/holy_light.mp3"
    },
    
    "wind_blade": {
        size: { width: 30, height: 8 },
        visual: {
            background: "linear-gradient(90deg, transparent 0%, #e0e0e0 20%, #ffffff 50%, #e0e0e0 80%, transparent 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 15px rgba(255,255,255,0.8)"
        },
        speed: 2.0,
        trail: true,
        trailColor: "#e0e0e0",
        spin: true,
        sound: "/static/game.data/sounds/wind_blade.mp3"
    }
};

// ===== SISTEMA DE CONFIGURAÇÃO DE BEAMS =====
const BEAM_TYPES = {
    // Beams elementais
    "fire_beam": {
        core: '#ff4500',
        bright: '#ffff00',
        halo: 'rgba(255, 69, 0, 0.6)',
        glow: 'rgba(255, 69, 0, 0.2)',
        thickness: { core: 8, halo: 16, glow: 24 },
        duration: 1500,
        pulseSpeed: 50
    },
    
    "ice_beam": {
        core: '#00bfff',
        bright: '#e0ffff',
        halo: 'rgba(0, 191, 255, 0.6)',
        glow: 'rgba(0, 191, 255, 0.2)',
        thickness: { core: 6, halo: 14, glow: 22 },
        duration: 1200,
        pulseSpeed: 70
    },
    
    "lightning_beam": {
        core: '#ffff00',
        bright: '#ffffff',
        halo: 'rgba(255, 255, 0, 0.8)',
        glow: 'rgba(255, 255, 0, 0.3)',
        thickness: { core: 4, halo: 12, glow: 20 },
        duration: 800,
        pulseSpeed: 30,
        zigzag: true
    },
    
    "dark_beam": {
        core: '#8b00ff',
        bright: '#dda0dd',
        halo: 'rgba(139, 0, 255, 0.6)',
        glow: 'rgba(139, 0, 255, 0.2)',
        thickness: { core: 10, halo: 18, glow: 26 },
        duration: 2000,
        pulseSpeed: 80
    },
    
    "holy_beam": {
        core: '#ffd700',
        bright: '#ffffff',
        halo: 'rgba(255, 215, 0, 0.8)',
        glow: 'rgba(255, 215, 0, 0.3)',
        thickness: { core: 12, halo: 20, glow: 28 },
        duration: 2200,
        pulseSpeed: 60
    },
    
    "energy_beam": {
        core: '#00ffff',
        bright: '#ffffff',
        halo: 'rgba(0, 255, 255, 0.6)',
        glow: 'rgba(0, 255, 255, 0.2)',
        thickness: { core: 8, halo: 16, glow: 24 },
        duration: 2200,
        pulseSpeed: 50
    },
    
    "void_beam": {
        core: '#000000',
        bright: '#4b0082',
        halo: 'rgba(75, 0, 130, 0.8)',
        glow: 'rgba(75, 0, 130, 0.4)',
        thickness: { core: 14, halo: 22, glow: 30 },
        duration: 2500,
        pulseSpeed: 90
    },
    
    "plasma_beam": {
        core: '#ff1493',
        bright: '#ffffff',
        halo: 'rgba(255, 20, 147, 0.7)',
        glow: 'rgba(255, 20, 147, 0.3)',
        thickness: { core: 6, halo: 14, glow: 22 },
        duration: 1000,
        pulseSpeed: 40
    }
};


// ========================================
// MAPEAMENTO DE ANIMAÇÕES PARA VLAD
// ========================================

// ADICIONAR mapeamento específico para ataques do Vlad
const VLAD_SKILL_ANIMATIONS = {
    // Skills de ataque do Vlad
    50: 'power',        // Energia Escura
    51: 'bloodattack',  // Garras Sangrentas  
    52: 'special',      // Abraço da Escuridão
    53: 'ultimate',     // Beijo da Morte
    
    // Skills especiais do Vlad
    138: 'autofagia',   // Autofagia
    139: 'special',     // Aura Vampírica
    140: 'ultimate',    // Domínio Mental
    141: 'ultimate'     // Abraço Sanguíneo
};

// FUNÇÃO para obter animação baseada na skill e personagem
function getSkillAnimation(skillId, defaultAnimation = 'melee_attack1') {
    const currentCharacter = getCurrentPlayerCharacter();
    
    if (currentCharacter === "Vlad" && VLAD_SKILL_ANIMATIONS[skillId]) {
        return VLAD_SKILL_ANIMATIONS[skillId];
    }
    
    // Fallback para outros personagens
    return defaultAnimation;
}

// ========================================
// 🎭 SISTEMA DE ESTADOS VISUAIS CENTRALIZADO
// ========================================

const VISUAL_STATES = {
    normal: {
        battleArena: { classes: [] },
        background: { transformOrigin: 'center center', transform: 'scale(1)', filter: 'none' },
        character: { transform: '', opacity: '1', visibility: 'visible' },
        boss: { /* SEM FORÇAR TRANSFORM - deixar CSS controlar */ opacity: '1', visibility: 'visible' },
        huds: { opacity: '1' }
    },
    
    focus_player: {
        battleArena: { classes: ['quick-cut-transition', 'quick-cut-player'] },
        background: { /* transformOrigin definido via setZoomFocus */ },
        character: { /* mantém posição do CSS quick-cut-player */ },
        boss: { /* escondido pelo CSS quick-cut-player */ },
        huds: { opacity: '0' }
    },
    
    focus_center: {
        battleArena: { classes: ['quick-cut-transition', 'quick-cut-player'] },
        background: { transformOrigin: 'center 85%' },
        character: { transform: 'scale(2.0) translate(-25%, -30%)' },
        boss: { classes: ['boss-focus-center'] },
        huds: { opacity: '0' }
    },
    
    focus_boss: {
        battleArena: { classes: ['quick-cut-transition', 'quick-cut-boss'] },
        background: { /* transformOrigin definido via setZoomFocus */ },
        character: { /* posição do CSS quick-cut-boss */ },
        boss: { /* mantém posição do CSS quick-cut-boss */ },
        huds: { opacity: '0' }
    },
    
    player_moving: {
        // Manter classes necessárias para o movimento funcionar
        battleArena: { classes: ['quick-cut-transition', 'quick-cut-player'] },
        background: { transformOrigin: 'center 85%' },
        character: { transform: 'scale(2.8) translate(-25%, -30%)' }, // Manter scale 2.8 consistente
        boss: { classes: ['boss-focus-center'] },
        huds: { opacity: '0' }
    }
};

// Sistema de aplicação de estados visuais
class VisualStateManager {
    constructor() {
        this.currentState = 'normal';
        this.elements = {
            battleArena: document.getElementById('battle-arena'),
            background: document.getElementById('background-default'),
            character: document.getElementById('character'),
            boss: document.getElementById('boss'),
            characterHud: document.querySelector('.character-hud'),
            bossHud: document.querySelector('.boss-hud')
        };
    }
    
    // Aplicar estado visual
    applyState(stateName, customConfig = {}) {
        console.log(`🎭 Aplicando estado visual: ${stateName}`);
        
        // Reset completo apenas se não for estado de movimento
        if (stateName !== 'player_moving') {
            this.forceReset();
        }
        
        const state = { ...VISUAL_STATES[stateName], ...customConfig };
        
        // Aplicar configurações do battleArena
        if (state.battleArena?.classes) {
            state.battleArena.classes.forEach(className => {
                this.elements.battleArena.classList.add(className);
            });
        }
        
        // Aplicar configurações do background
        if (state.background) {
            Object.entries(state.background).forEach(([prop, value]) => {
                if (value !== undefined) {
                    this.elements.background.style[prop] = value;
                }
            });
        }
        
        // Aplicar configurações do personagem
        if (state.character) {
            Object.entries(state.character).forEach(([prop, value]) => {
                if (value !== undefined) {
                    this.elements.character.style[prop] = value;
                }
            });
        }
        
        // Aplicar configurações do boss
        if (state.boss) {
            // Aplicar classes se existirem
            if (state.boss.classes) {
                state.boss.classes.forEach(className => {
                    this.elements.boss.classList.add(className);
                });
            }
            
            // Aplicar estilos inline
            Object.entries(state.boss).forEach(([prop, value]) => {
                if (prop !== 'classes' && value !== undefined) {
                    this.elements.boss.style[prop] = value;
                }
            });
        }
        
        // Aplicar configurações dos HUDs
        if (state.huds) {
            if (this.elements.characterHud) this.elements.characterHud.style.opacity = state.huds.opacity;
            if (this.elements.bossHud) this.elements.bossHud.style.opacity = state.huds.opacity;
        }
        
        this.currentState = stateName;
        console.log(`✅ Estado ${stateName} aplicado`);
    }
    
    // Reset forçado de todos os elementos
    forceReset() {
        // Remover todas as classes de quick-cut
        this.elements.battleArena.classList.remove('quick-cut-player', 'quick-cut-boss', 'quick-cut-transition', 'focus-center');
        // Remover classe e limpar estilos inline do boss
        this.elements.boss.classList.remove('boss-focus-center');
        this.elements.boss.style.cssText = '';
        this.elements.boss.removeAttribute('style');
        
        // Reset completo do background
        this.elements.background.style.cssText = '';
        this.elements.background.removeAttribute('style');
        
        // Reset completo dos personagens com transição sincronizada
        this.elements.character.style.cssText = '';
        this.elements.character.removeAttribute('style');
        
        // Forçar reflow
        void this.elements.battleArena.offsetWidth;
    }
    
    // Restaurar estado normal
    restoreNormal() {
        this.applyState('normal');
    }
}

// Instância global do gerenciador
window.visualStateManager = new VisualStateManager();

// ===== FUNÇÃO UTILITÁRIA PARA PARSING DE SPRITES =====
function parseSizeString(sizeString, frames) {
    if (!sizeString) return null;
    
    const [totalWidth, height] = sizeString.split('x').map(Number);
    
    // Se frames não fornecido, assumir que é quadrada (fallback)
    const width = frames ? (totalWidth / frames) : height;
    
    return {
        totalWidth: totalWidth,
        height: height,
        width: width
    };
}


// Toggle zoom view
function toggleZoomView() {
    console.log("toggleZoomView chamado, inAction:", gameState.inAction);
    
    // Atualizar dados no início da transição
    window.updateGameOnTransition().then(updated => {
        console.log("toggleZoomView: dados atualizados:", updated);
    });

    playSound('/static/game.data/sounds/camera_shift.mp3', 0.7); // Volume baixo-médio - AJUSTÁVEL AQUI

    // Verificar se os elementos necessários existem
    if (!window.battleArena || !window.actionMenu) {
        console.error("Elementos necessários para toggleZoomView não encontrados!");
        return;
    }
    
    // Sempre saímos de qualquer menu que possa estar aberto
    closeAllSubmenus();
    // Se estamos saindo da character-view para zoom-view
    if (!gameState.zoomedView && gameState.characterView) {
        // Forçar os botões a ficarem invisíveis antes da transição
        document.querySelectorAll('.skill-button').forEach(button => {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        });
        
        // Limpar completamente as propriedades de estilo dos botões do menu principal
        document.querySelectorAll('.action-button').forEach(button => {
            button.style = "";
        });
        
        // Resetar o menu principal
        actionMenu.style = "";
    }
    
    if (!gameState.inAction) {
        // Reset do menu - esconder primeiro
        actionMenu.classList.remove('visible');
        
        // Determinar se estamos indo ou voltando da zoom-view
        const goingToZoomView = !gameState.zoomedView;
        
        // Se vamos para zoom-view a partir da character-view
        if (goingToZoomView && gameState.characterView) {
            // Árvores da esquerda para a direita
            animateTrees('left-to-right');
        } 
        // Se vamos para zoom-view a partir da tela inicial
        else if (goingToZoomView && !gameState.characterView) {
            // Árvores da esquerda para a direita
            animateTrees('left-to-right');
        }
        // Se estamos saindo da zoom-view
        else if (!goingToZoomView) {
            // Árvores da direita para a esquerda
            animateTrees('right-to-left');
        }
        
        // Adicionar classes para indicar que estamos saindo da view atual
        if (gameState.zoomedView) {
            battleArena.classList.add('zoom-view-leaving');
        } else if (gameState.characterView) {
            battleArena.classList.add('character-view-leaving');
        }
        
        // Remover as classes de saída depois da transição
        setTimeout(() => {
            battleArena.classList.remove('zoom-view-leaving');
            battleArena.classList.remove('character-view-leaving');
        }, 400);

        // IMPORTANTE: Alterar estado ANTES de manipular classes
        // para evitar transições de estados intermediários
        gameState.zoomedView = goingToZoomView;
        gameState.characterView = false; // Saímos da character view
        
        console.log("Estados atualizados - zoomedView:", gameState.zoomedView, 
                    "characterView:", gameState.characterView);
        
        if (gameState.zoomedView) {
            // Primeiro adicionar a classe zoom-view para iniciar a transição
            battleArena.classList.add('zoom-view');
            battleArena.classList.remove('character-view');
            battleArena.classList.remove('boss-view'); // Remover boss-view se estiver ativa
            
            // Mostrar menu novamente após a transição, mas VERIFICAR SKILLS PRIMEIRO
            setTimeout(() => {
                // NOVA LÓGICA: Verificar se inimigo tem skills de buff/debuff antes de mostrar menu
                fetch('/gamification/enemy_attack_status')
                    .then(response => response.json())
                    .then(statusData => {
                        if (statusData.success && statusData.status.has_buff_debuff_charges) {
                            console.log("🔮 Skills de buff/debuff detectadas na zoom-view, executando sequência");
                            
                            // NÃO mostrar o menu ainda - executar skills primeiro
                            executeBuffDebuffSkillsSequence().then(() => {
                                console.log("🔮 Skills executadas, liberando menu");
                                
                                // DEPOIS de executar skills, mostrar o menu com delay de 1000ms
                                setTimeout(() => {
                                    actionMenu.classList.add('visible');
                                    
                                    // Limpar quaisquer estilos inline nos botões
                                    document.querySelectorAll('.skill-button').forEach(button => {
                                        button.style.removeProperty('opacity');
                                        button.style.removeProperty('visibility');
                                    });
                                }, 1000);
                            });
                        } else {
                            console.log("🔮 Sem skills de buff/debuff, mostrando menu normalmente");
                            
                            // Sem skills pendentes - mostrar menu normalmente
                            actionMenu.classList.add('visible');
                            
                            // Limpar quaisquer estilos inline nos botões
                            document.querySelectorAll('.skill-button').forEach(button => {
                                button.style.removeProperty('opacity');
                                button.style.removeProperty('visibility');
                            });
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao verificar skills de buff/debuff:", error);
                        
                        // Em caso de erro, mostrar menu normalmente
                        actionMenu.classList.add('visible');
                        
                        // Limpar quaisquer estilos inline nos botões
                        document.querySelectorAll('.skill-button').forEach(button => {
                            button.style.removeProperty('opacity');
                            button.style.removeProperty('visibility');
                        });
                    });
            }, 400);
            
            // Adicionar a vinheta apenas depois que a transição estiver completa
            setTimeout(() => {
                vignette.classList.add('visible');
                showBattleMessage();
            }, 300); // Reduzido para transição mais rápida
        } else {
            // Remover a vinheta primeiro
            vignette.classList.remove('visible');
            
            // Depois remover os outros elementos após um pequeno delay
            setTimeout(() => {
                battleArena.classList.remove('zoom-view');
                battleArena.classList.remove('zoom-view-attack');
                battleArena.classList.remove('boss-view'); // Remover boss-view se estiver ativa
                activeSubmenu = null; // Resetar submenu ativo ao sair do zoom
                
                // Garantir que todos os submenus estão fechados
                attackSubmenu.classList.remove('visible');
                specialSubmenu.classList.remove('visible');
                inventorySubmenu.classList.remove('visible');
            }, 150); // Reduzido para transição mais rápida
        }

        // Verificar cargas ao entrar na zoom view
        setTimeout(() => {
            fetch('/gamification/enemy_attack_status')
                .then(response => response.json())
                .then(statusData => {
                    if (statusData.success) {
                        updateAttackButtonsBasedOnCharges(statusData.status.has_charges);
                    }
                })
                .catch(error => console.error("Erro ao verificar cargas:", error));
        }, 1000);
        
        // Atualizar posicionamento dos HUDs após a transição
        setTimeout(alignHUDs, 500);

        // Garantir reset completo dos menus na transição
        if (gameState.zoomedView) {
            // Programar um reset completo dos botões após a transição
            setTimeout(() => {
                // Primeiro, limpar TODOS os estilos inline
                actionMenu.removeAttribute('style');
                attackButton.removeAttribute('style');
                specialButton.removeAttribute('style');
                inventoryButton.removeAttribute('style');
                
                // Forçar reflow para garantir que os navegadores apliquem as mudanças
                void actionMenu.offsetWidth;
                
                // Recriar a animação de entrada dos botões
                actionMenu.classList.remove('visible');
                
                // Aguardar um momento e reativar, MAS verificar skills primeiro
                setTimeout(() => {
                    // NOVA LÓGICA: Verificar skills antes do reset também
                    fetch('/gamification/enemy_attack_status')
                        .then(response => response.json())
                        .then(statusData => {
                            if (statusData.success && statusData.status.has_buff_debuff_charges) {
                                console.log("🔮 Skills de buff/debuff detectadas no reset, executando");
                                
                                executeBuffDebuffSkillsSequence().then(() => {
                                    setTimeout(() => {
                                        actionMenu.classList.add('visible');
                                        console.log("Reset completo dos botões após skills executadas");
                                    }, 1000);
                                });
                            } else {
                                actionMenu.classList.add('visible');
                                console.log("Reset completo dos botões de ação realizado");
                            }
                        })
                        .catch(error => {
                            console.error("Erro no reset:", error);
                            actionMenu.classList.add('visible');
                            console.log("Reset completo dos botões de ação realizado (fallback)");
                        });
                }, 50);
            }, 600);
        }
        
        // Garantir que os botões do menu principal estejam prontos para serem exibidos
        if (gameState.zoomedView) {
            setTimeout(() => {
                document.querySelectorAll('.action-button').forEach(button => {
                    // Remover quaisquer estilos inline que possam estar interferindo
                    button.style = "";
                });
                // Forçar uma atualização do menu
                void actionMenu.offsetWidth;
            }, 550);
        }
    }
}

// Toggle character view
function toggleCharacterView() {
    // Atualizar os dados no início da transição
    window.updateGameOnTransition().then(updated => {
        console.log("toggleCharacterView: dados atualizados:", updated);
    });

    // Som de transição
    playSound('/static/game.data/sounds/camera_shift.mp3', 0.7); // Volume baixo-médio - AJUSTÁVEL AQUI

    console.log("toggleCharacterView chamado, inAction:", gameState.inAction);
    
    // Não fazemos closeAllSubmenus() aqui porque queremos manter os submenus abertos
    
    if (!gameState.inAction) {
        // Reset do menu - esconder primeiro
        actionMenu.classList.remove('visible');
        
        // Determinar se estamos indo ou voltando da character-view
        const goingToCharacterView = !gameState.characterView;
        
        // Se vamos para character-view a partir da zoom-view
        if (goingToCharacterView && gameState.zoomedView) {
            // Árvores da direita para a esquerda
            animateTrees('right-to-left');
        } 
        // Se vamos para character-view a partir da tela inicial
        else if (goingToCharacterView && !gameState.zoomedView) {
            // Árvores da direita para a esquerda
            animateTrees('right-to-left');
        }
        // Se estamos saindo da character-view
        else if (!goingToCharacterView) {
            // Se estamos voltando para a zoom-view
            if (gameState.zoomedView) {
                // Árvores da esquerda para a direita
                animateTrees('left-to-right');
            } else {
                // Árvores da direita para a esquerda (para voltar à tela inicial)
                animateTrees('right-to-left');
            }
        }
        
        // Se estamos saindo da character-view para zoom-view
        if (!goingToCharacterView) {
            // Esconder imediatamente o menu e submenus
            actionMenu.style.transition = "none";
            actionMenu.style.opacity = "0";
            actionMenu.style.visibility = "hidden";
            
            // Também esconder todos os submenus imediatamente
            attackSubmenu.style.transition = "none";
            specialSubmenu.style.transition = "none";
            inventorySubmenu.style.transition = "none";
            attackSubmenu.style.opacity = "0";
            specialSubmenu.style.opacity = "0";
            inventorySubmenu.style.opacity = "0";
            attackSubmenu.style.visibility = "hidden";
            specialSubmenu.style.visibility = "hidden";
            inventorySubmenu.style.visibility = "hidden";
            
            // Restaurar transições após pequeno delay
            setTimeout(() => {
                actionMenu.style.transition = "";
                attackSubmenu.style.transition = "";
                specialSubmenu.style.transition = "";
                inventorySubmenu.style.transition = "";
            }, 50);
        }
        
        gameState.characterView = !gameState.characterView;
        gameState.zoomedView = false; // Saímos da zoom view
        gameState.bossView = false; // Saímos da boss view
        console.log("Alterando characterView para:", gameState.characterView);
        
        if (gameState.characterView) {
            // Primeiro adicionar a classe character-view para iniciar a transição
            battleArena.classList.add('character-view');
            battleArena.classList.remove('zoom-view');
            battleArena.classList.remove('zoom-view-attack');
            battleArena.classList.remove('boss-view'); // Remover boss-view se estiver ativa

            // Obter o elemento do painel de status
            const playerStatusPanel = document.getElementById('player-status-panel');
            if (playerStatusPanel) {
                // Tornar o painel visível
                playerStatusPanel.style.display = 'flex';
                playerStatusPanel.style.opacity = '1';
                playerStatusPanel.style.visibility = 'visible';
                playerStatusPanel.style.zIndex = '9500'; // Garantir que apareça acima de outros elementos
                
                // Atualizar os dados do painel
                setTimeout(() => {
                updatePlayerStatusCard();
                }, 100);
            }
            
            // Mostrar menu novamente após a transição para ter a animação
            setTimeout(() => {
                actionMenu.classList.add('visible');
            }, 400);
            
            // Adicionar a vinheta apenas depois que a transição estiver completa
            setTimeout(() => {
                vignette.classList.add('visible');
                showBattleMessage();
            }, 300); // Reduzido para transição mais rápida
        } else {
            // Remover a vinheta primeiro
            vignette.classList.remove('visible');

            // INSERIR: Esconder o painel de status quando sair da character-view
            const playerStatusPanel = document.getElementById('player-status-panel');
            if (playerStatusPanel) {
                playerStatusPanel.style.opacity = '0';
                playerStatusPanel.style.visibility = 'hidden';

                // Esconder completamente após a transição
                setTimeout(() => {
                playerStatusPanel.style.display = 'none';
                }, 400); // Combinar com a duração da transição
            }
            
            // Depois remover os outros elementos após um pequeno delay
            setTimeout(() => {
                battleArena.classList.remove('character-view');
                activeSubmenu = null; // Resetar submenu ativo ao sair do view
                
                // Garantir que todos os submenus estão fechados
                attackSubmenu.classList.remove('visible');
                specialSubmenu.classList.remove('visible');
                inventorySubmenu.classList.remove('visible');
            }, 150); // Reduzido para transição mais rápida
        }
        setTimeout(() => {
            if (gameState.characterView) {
                updatePlayerStatusCard();
            }
        }, 500);

        // Verificar cargas ao entrar na character view
        setTimeout(() => {
            fetch('/gamification/enemy_attack_status')
                .then(response => response.json())
                .then(statusData => {
                    if (statusData.success) {
                        updateAttackButtonsBasedOnCharges(statusData.status.has_charges);
                    }
                })
                .catch(error => console.error("Erro ao verificar cargas:", error));
        }, 1000);

        // Atualizar posicionamento dos HUDs após a transição
        setTimeout(alignHUDs, 500);
    }
}

// Toggle boss view
function toggleBossView() {
    // Atualizar os dados no início da transição
    window.updateGameOnTransition().then(updated => {
        console.log("toggleBossView: dados atualizados:", updated);
    });
    // Som de transição
    playSound('/static/game.data/sounds/camera_shift.mp3', 0.7); // Volume baixo-médio - AJUSTÁVEL AQUI
    console.log("toggleBossView chamado, inAction:", gameState.inAction);
    
    // Sempre saímos de qualquer menu que possa estar aberto
    closeAllSubmenus();
    
    if (!gameState.inAction) {
        // Reset do menu - esconder primeiro
        actionMenu.classList.remove('visible');
        
        // Determinar se estamos indo ou voltando da boss-view
        const goingToBossView = !gameState.bossView;
        
        if (goingToBossView) {
            // Salvar a view atual antes de mudar para boss-view
            if (gameState.zoomedView) {
                gameState.previousView = 'zoom';
                // CORREÇÃO: Não animar árvores ao ir de zoom-view para boss-view
                console.log("Transição de zoom-view para boss-view - sem animação de árvores");
            } else if (gameState.characterView) {
                gameState.previousView = 'character';
                // Árvores da esquerda para a direita
                animateTrees('left-to-right');
            } else {
                gameState.previousView = 'initial';
                // Árvores da esquerda para a direita
                animateTrees('left-to-right');
            }
        } else {
            // Árvores da direita para a esquerda (menos quando voltamos para zoom-view)
            if (gameState.previousView !== 'zoom') {
                animateTrees('right-to-left');
            }
        }
        
        // Atualizar estado
        gameState.bossView = goingToBossView;
        
        console.log("Estados atualizados - bossView:", gameState.bossView);
        
        if (gameState.bossView) {
            // Salvar estados atuais antes de desativá-los
            gameState.zoomedView = false;
            gameState.characterView = false;
            
            // Atualizar informações do boss no painel
            document.getElementById('boss-info-hp').textContent = `${gameState.boss.hp}/${gameState.boss.maxHp}`;
            
            // Adicionar classes para a transição
            battleArena.classList.add('boss-view');
            battleArena.classList.remove('zoom-view');
            battleArena.classList.remove('character-view');
            
            // Adicionar a vinheta depois da transição
            setTimeout(() => {
                vignette.classList.add('visible');
            }, 300);
        } else {
            // Remover a vinheta primeiro
            vignette.classList.remove('visible');
            
            // Depois remover os outros elementos após um pequeno delay
            setTimeout(() => {
                battleArena.classList.remove('boss-view');
                
                // Restaurar a view anterior com base no registro
                if (gameState.previousView === 'zoom') {
                    gameState.zoomedView = true;
                    gameState.characterView = false;
                    battleArena.classList.add('zoom-view');
                    setTimeout(() => {
                        actionMenu.classList.add('visible');
                    }, 200);
                } else if (gameState.previousView === 'character') {
                    gameState.characterView = true;
                    gameState.zoomedView = false;
                    battleArena.classList.add('character-view');
                    setTimeout(() => {
                        actionMenu.classList.add('visible');
                    }, 200);
                } else {
                    // Tela inicial
                    gameState.zoomedView = false;
                    gameState.characterView = false;
                }
            }, 150);
        }
        
        // Atualizar posicionamento dos HUDs após a transição
        setTimeout(alignHUDs, 500);
    }
}

function toggleEnemyAttackView() {
    // Atualizar os dados no início da transição
    window.updateGameOnTransition().then(updated => {
        console.log("toggleEnemyAttackView: dados atualizados:", updated);
    });

    // Som de transição
    playSound('/static/game.data/sounds/camera_shift.mp3', 0.7);
    console.log("toggleEnemyAttackView chamado, inAction:", gameState.inAction);
    
    // Sempre sair de qualquer menu que possa estar aberto
    closeAllSubmenus();
    
    if (!gameState.inAction) {
        // Reset do menu - esconder primeiro
        actionMenu.classList.remove('visible');
        
        // Determinar se estamos indo ou voltando da enemy-attack-view
        const goingToEnemyAttackView = !gameState.enemyAttackView;
        
        if (goingToEnemyAttackView) {
            // Salvar a view atual antes de mudar para enemy-attack-view
            if (gameState.zoomedView) {
                gameState.previousView = 'zoom';
            } else if (gameState.characterView) {
                gameState.previousView = 'character';
            } else {
                gameState.previousView = 'initial';
            }
        }
        
        // Atualizar estado
        gameState.enemyAttackView = goingToEnemyAttackView;
        
        console.log("Estados atualizados - enemyAttackView:", gameState.enemyAttackView);
        
        if (gameState.enemyAttackView) {
            // Salvar estados atuais antes de desativá-los
            gameState.zoomedView = false;
            gameState.characterView = false;
            gameState.bossView = false;
            
            // Adicionar classes para a transição
            battleArena.classList.add('enemy-attack-view');
            battleArena.classList.remove('zoom-view', 'character-view', 'boss-view');
            
            // Ativar vinheta mais forte
            const enemyAttackVignette = document.getElementById('enemy-attack-vignette');
            if (enemyAttackVignette) {
                enemyAttackVignette.classList.add('visible');
            }

            // Iniciar música de enemy attack
            if (typeof startEnemyAttackMusic === 'function') {
                startEnemyAttackMusic();
            }

            // Aplicar background específico da enemy-attack-view
            const bgDefault = document.getElementById('background-default');
            if (bgDefault) {
                bgDefault.style.backgroundImage = "url('/static/game.data/bgf.png')";
                bgDefault.style.backgroundSize = 'cover';
                bgDefault.style.backgroundPosition = 'center';
            }

            // Esconder o inimigo nesta view
            const bossEl = document.getElementById('boss');
            if (bossEl) {
                bossEl.style.opacity = '0';
            }

            // Iniciar sequência de ataques (ESTA É A LINHA QUE FALTAVA)
            if (!gameState.inAction) {
                gameState.inAction = true;
                setTimeout(() => {
                    executeEnemyAttackSequence();
                }, 1000);
            }
            
            // Esconder árvores e cenário
            const treeContainer = document.getElementById('tree-paralax-container');
            if (treeContainer) {
                treeContainer.style.opacity = '0';
            }
            
        } else {
            // Remover a vinheta primeiro
            const enemyAttackVignette = document.getElementById('enemy-attack-vignette');
            if (enemyAttackVignette) {
                enemyAttackVignette.classList.remove('visible');
            }

            // Parar música de enemy attack
            if (typeof stopEnemyAttackMusic === 'function') {
                stopEnemyAttackMusic();
            }

            // Restaurar background padrão
            const bgDefault = document.getElementById('background-default');
            if (bgDefault) {
                bgDefault.style.backgroundImage = '';
            }

            // Mostrar inimigo novamente
            const bossEl = document.getElementById('boss');
            if (bossEl) {
                bossEl.style.opacity = '1';
            }
            
            // Mostrar árvores e cenário novamente
            const treeContainer = document.getElementById('tree-paralax-container');
            if (treeContainer) {
                treeContainer.style.opacity = '1';
            }
            
            // Depois remover os outros elementos após um pequeno delay
            setTimeout(() => {
                battleArena.classList.remove('enemy-attack-view');
                
                // Restaurar a view anterior com base no registro
                if (gameState.previousView === 'zoom') {
                    gameState.zoomedView = true;
                    gameState.characterView = false;
                    battleArena.classList.add('zoom-view');
                    setTimeout(() => {
                        actionMenu.classList.add('visible');
                    }, 200);
                } else if (gameState.previousView === 'character') {
                    gameState.characterView = true;
                    gameState.zoomedView = false;
                    battleArena.classList.add('character-view');
                    setTimeout(() => {
                        actionMenu.classList.add('visible');
                    }, 200);
                } else {
                    // Tela inicial
                    gameState.zoomedView = false;
                    gameState.characterView = false;
                }
            }, 150);
        }
        
        // Atualizar posicionamento dos HUDs após a transição
        setTimeout(alignHUDs, 500);
    }
}

// Definir o foco do zoom do background
function setZoomFocus(focusElement, backgroundElement) {
    if (!focusElement || !backgroundElement) {
        console.warn("Elemento de foco ou background não encontrado para setZoomFocus");
        return;
    }

    const focusRect = focusElement.getBoundingClientRect();
    const bgRect = backgroundElement.getBoundingClientRect();

    // Calcula o centro do elemento de foco
    const focusCenterX = focusRect.left + focusRect.width / 2;
    const focusCenterY = focusRect.top + focusRect.height / 2;

    // Calcula a posição relativa do centro do foco dentro do elemento de background
    const relativeX = Math.max(0, focusCenterX - bgRect.left);
    const relativeY = Math.max(0, focusCenterY - bgRect.top);

    // Converte para porcentagem (limitando entre 0% e 100%)
    const originX = Math.min(100, Math.max(0, (relativeX / bgRect.width) * 100));
    const originY = Math.min(100, Math.max(0, (relativeY / bgRect.height) * 100));

    console.log(`Definindo transform-origin para: ${originX.toFixed(1)}% ${originY.toFixed(1)}% em`, backgroundElement.id);
    backgroundElement.style.transformOrigin = `${originX}% ${originY}%`;
}

// Realizar ataque
function performAttack(skill) {

    console.log("🔍 DEBUG - performAttack chamada com skill:", skill);
    console.log("🔍 DEBUG - skill.animation_attack:", skill.animation_attack);
    console.log("🔍 DEBUG - Todos os campos da skill:", Object.keys(skill));

    // Inicializar acumulador de dano se não existir
    if (!window.totalBattleDamage) {
        window.totalBattleDamage = 0;
    }

    // Define estado de ação
    gameState.inAction = true; // Bloqueia novas ações
    console.log("-> performAttack iniciado com: ", skill.name);

    // Reseta os efeitos FX, mas SEM REMOVER as imagens de fundo
    if (fxLayerA) {
        fxLayerA.style.opacity = '0';
        fxLayerA.classList.remove('animate-fx');
        console.log("FX Layer A reset (sem remover imagem)");
    }
    if (fxLayerB) {
        fxLayerB.style.opacity = '0';
        fxLayerB.classList.remove('animate-fx');
        console.log("FX Layer B reset (sem remover imagem)");
    }

    // Custos (MP e Pontos de Revisão)
    // Atualizar visualmente os custos imediatamente (se houver display deles)
    updateStats();

    closeAllSubmenus(); // Fecha submenus abertos
    activeSubmenu = null;

    // Parar som do coração ao executar ataque
    if (typeof stopHeartbeatMusic === 'function') {
        stopHeartbeatMusic();
    }

    // Determina os caminhos dos Fx e o delay
    let fxPaths = { a: null, b: null };
    let prepDelay = 1500; // Delay padrão

    // Registrar detalhes da skill antes da execução
    console.log("Detalhes da skill antes da execução:", {
        id: skill.id,
        name: skill.name,
        sounds: {
            prep1: skill.sound_prep_1,
            prep2: skill.sound_prep_2,
            attack: skill.sound_attack,
            effect1: skill.sound_effect_1,
            effect2: skill.sound_effect_2
        },
        fx: {
            a: skill.animation_fx_a || skill.fxA, // Tenta ambos os formatos
            b: skill.animation_fx_b || skill.fxB
        }
    });

    // Usar valores diretamente da skill
    if (skill.animation_fx_a || skill.fxA) {
        fxPaths.a = skill.animation_fx_a || skill.fxA;
    }
    if (skill.animation_fx_b || skill.fxB) {
        fxPaths.b = skill.animation_fx_b || skill.fxB;
    }

    // Fallback apenas se não vier da skill
    if (!fxPaths.a) {
        fxPaths.a = `/static/game.data/fx/fx1a.png`;
    }
    if (!fxPaths.b) {
        fxPaths.b = `/static/game.data/fx/fx1b.png`;
    }

    // Verifica se precisa voltar da Zoom View ou Character View
        let needsTransitionBack = gameState.zoomedView || gameState.characterView;
        if (needsTransitionBack) {
            console.log("... Detectada necessidade de voltar para Default View");
            // Animação das árvores para voltar
            animateTrees('right-to-left'); // Ou a direção apropriada

            // Remove classes de view e efeitos associados
            battleArena.classList.remove('zoom-view', 'zoom-view-attack', 'character-view', 'boss-view', 'menu-open');
            actionMenu.classList.remove('visible');
            vignette.classList.remove('visible');
            spotlight.classList.remove('visible');
            whitePulse.classList.remove('visible');
            document.getElementById('attack-vignette').classList.remove('visible');
            if (bossTargetGlow) bossTargetGlow.style.opacity = '0';

            gameState.zoomedView = false;
            gameState.characterView = false;
            gameState.bossView = false;

            // Delay para a transição de volta ocorrer ANTES de iniciar os quick cuts
            setTimeout(() => {
                console.log("... Transição de volta concluída, iniciando Quick Cuts.");
                alignHUDs(); // Garante que HUDs estejam posicionados corretamente (mas ainda ocultos)
                
                // Registrar detalhes da skill antes da execução
                console.log("Detalhes da skill antes da execução:", {
                    id: skill.id,
                    name: skill.name,
                    sounds: {
                        prep1: skill.sound_prep_1,
                        prep2: skill.sound_prep_2,
                        attack: skill.sound_attack,
                        effect1: skill.sound_effect_1,
                        effect2: skill.sound_effect_2
                    },
                    fx: fxPaths
                });

                // Certificar-se de que a skill tenha os caminhos de efeitos visuais
                if (!fxPaths.a && skill.animation_fx_a) {
                    fxPaths.a = skill.animation_fx_a;
                }
                if (!fxPaths.b && skill.animation_fx_b) {
                    fxPaths.b = skill.animation_fx_b;
                }
                
                runQuickCutSequence(skill, fxPaths, prepDelay);
            }, 500);
        } else {
            // Se já está na Default View, inicia a sequência imediatamente
            console.log("... Já na Default View, iniciando Quick Cuts diretamente.");
            
            // Registrar detalhes da skill antes da execução  
            console.log("Detalhes da skill antes da execução:", {
                id: skill.id,
                name: skill.name,
                sounds: {
                    prep1: skill.sound_prep_1,
                    prep2: skill.sound_prep_2,
                    attack: skill.sound_attack,
                    effect1: skill.sound_effect_1,
                    effect2: skill.sound_effect_2
                },
                fx: fxPaths
            });

            // Certificar-se de que a skill tenha os caminhos de efeitos visuais
            if (!fxPaths.a && skill.animation_fx_a) {
                fxPaths.a = skill.animation_fx_a;
            }
            if (!fxPaths.b && skill.animation_fx_b) {
                fxPaths.b = skill.animation_fx_b;
            }
            
            runQuickCutSequence(skill, fxPaths, prepDelay);
        }
    }

    // ===== SISTEMA MODULAR DE ANIMAÇÕES DE ATAQUE =====

    // Padrões pré-definidos de sequências de ataque
    const ATTACK_PATTERNS = {
        // Ataques corpo a corpo com teleporte
        melee_teleport_basic: ['focus_player', 'show_fx', 'player_teleport_advance', 'transition_delay', 'focus_boss', 'melee_strike_teleport', 'apply_damage', 'player_teleport_return', 'restore_complete'],
        melee_teleport_ultimate: ['focus_player', 'cast_preparation', 'show_fx', 'player_teleport_advance', 'transition_delay', 'focus_boss', 'ultimate_strike', 'apply_damage', 'player_teleport_return', 'restore_complete'],
        
        // Ataques corpo a corpo com corrida
        melee_run_basic: ['focus_center', 'show_fx', 'zoom_out_after_fx', 'transition_delay', 'player_run_advance', 'melee_strike', 'apply_damage', 'player_run_return_with_zoomout', 'restore_complete'],
        melee_run_ultimate: ['focus_player', 'show_fx', 'transition_delay', 'player_run_advance', 'ultimate_strike', 'apply_damage', 'player_run_return', 'restore_complete'],
        
        // Ataques à distância
        ranged_projectile: ['focus_player', 'show_fx', 'aim_stance', 'restore_normal_view', 'apply_damage', 'restore_complete'],
        ranged_beam: ['focus_player', 'show_fx', 'aim_stance', 'restore_normal_view', 'energy_beam',  'apply_damage', 'restore_complete'],
        ranged_distant: ['focus_player', 'show_fx', 'cast_preparation', 'restore_normal_view', 'distant_effect_normal', 'apply_damage', 'restore_complete'],
        
        // Ataques mágicos
        magic_basic: ['focus_player', 'cast_preparation', 'show_fx', 'focus_boss', 'magic_manifestation', 'apply_damage', 'zoom_out_final', 'restore_complete'],
        magic_area: ['focus_player', 'cast_preparation', 'show_fx', 'wide_focus', 'area_effect', 'apply_damage', 'zoom_out_final', 'restore_complete'],
        
        // Ataques com salto
        jump_attack: ['focus_player', 'jump_preparation', 'show_fx', 'aerial_advance', 'focus_boss', 'aerial_strike', 'apply_damage', 'land_return', 'restore_complete']
    };

    // Sistema de execução de fases modulares
    class AttackPhaseSystem {
        constructor() {
            this.currentSkill = null;
            this.currentSequence = [];
            this.currentPhaseIndex = 0;
            this.phaseData = {};
            // ✅ Não mexer no canvas das vinhetas - deixar para o sistema PixiJS
        }

        // Executar sequência de ataque
        executeAttackSequence(skill, fxPaths, prepDelay) {
            this.currentSkill = skill;
            this.phaseData = { fxPaths, prepDelay };
            
            // Determinar sequência: usar padrão pré-definido ou sequência customizada
            if (typeof skill.attack_sequence === 'string' && ATTACK_PATTERNS[skill.attack_sequence]) {
                this.currentSequence = [...ATTACK_PATTERNS[skill.attack_sequence]];
            } else if (Array.isArray(skill.attack_sequence)) {
                this.currentSequence = [...skill.attack_sequence];
            } else {
                // Fallback para o sistema antigo
                this.currentSequence = ATTACK_PATTERNS.melee_teleport_basic;
            }
            
            this.currentPhaseIndex = 0;
            this.executeNextPhase();
        }

        // Executar próxima fase
        executeNextPhase() {
            if (this.currentPhaseIndex >= this.currentSequence.length) {
                this.finishAttackSequence();
                return;
            }

            const phaseName = this.currentSequence[this.currentPhaseIndex];
            console.log(`Executando fase ${this.currentPhaseIndex + 1}/${this.currentSequence.length}: ${phaseName}`);
            
            // Executar a fase correspondente
            if (this[`executePhase_${phaseName}`]) {
                this[`executePhase_${phaseName}`]();
            } else {
                console.warn(`Fase não encontrada: ${phaseName}`);
                this.nextPhase();
            }
        }

        // Avançar para próxima fase
        nextPhase(delay = 0) {
            setTimeout(() => {
                this.currentPhaseIndex++;
                this.executeNextPhase();
            }, delay);
        }

        // Finalizar sequência de ataque
        finishAttackSequence() {
            console.log("Sequência de ataque finalizada");
            
            // Restaurar estado do jogo
            if (!gameState.boss.hp <= 0) {
                gameState.inAction = false;
            }
            
            // Reexibir HUDs
            setTimeout(() => {
                alignHUDs();
                const currentBossHud = document.querySelector('.boss-hud');
                const currentCharacterHud = document.querySelector('.character-hud');

                if (!gameState.bossView && !gameState.characterView) {
                    if (currentBossHud) currentBossHud.style.opacity = '1';
                    if (currentCharacterHud && !gameState.zoomedView) {
                        currentCharacterHud.style.opacity = '1';
                    }
                }
            }, 450);
        }

        // ===== FASES INDIVIDUAIS =====

        // Fase: Focar no jogador
        executePhase_focus_player() {
            console.log("QC Fase: Player Focus");
            
            // Aplicar estado visual focus_player
            window.visualStateManager.applyState('focus_player');
            
            // Aplicar zoom focus específico
            setTimeout(() => {
                setZoomFocus(character, window.visualStateManager.elements.background);
                
                // Tocar som de preparação 1
                playSound(this.currentSkill.sound_prep_1, 0.7);
                
                this.nextPhase(500);
            }, 50);
        }

        executePhase_zoom_out_after_fx() {
            console.log("QC Fase: Zoom Out After FX");
            
            // Restaurar estado visual normal (zoom out)
            window.visualStateManager.restoreNormal();
            
            // Pequeno delay para a transição do zoom-out ser visível
            this.nextPhase(400);
        }

        // Fase: Focar no centro da tela (para ataques melee_run)
        executePhase_focus_center() {
            console.log("QC Fase: Center Focus");
            
            // Aplicar estado visual focus_center
            window.visualStateManager.applyState('focus_center');
            
            setTimeout(() => {
                // Tocar som de preparação 1
                playSound(this.currentSkill.sound_prep_1, 0.7);
                
                this.nextPhase(500);
            }, 50);
        }

        // Fase: Retorno com zoom-out simultâneo
        executePhase_player_run_return_with_zoomout() {
            console.log("QC Fase: Player Run Return with Zoomout");
            
            let animConfig;
            
            // PARA VLAD: usar animação 'return' específica
            const currentCharacter = getCurrentPlayerCharacter();
            if (currentCharacter === 'Vlad' || currentCharacter === 'vlad') {
                animConfig = getCharacterAnimation('return');
                console.log(`🧛 Vlad run_return: usando animação 'return'`);
            } else {
                // Para outros personagens: usar 'run' normal
                animConfig = getCharacterAnimation('run');
            }
            
            if (animConfig) {
                // Para Vlad usar 'return', para outros usar 'run'
                const animationName = (currentCharacter === 'Vlad' || currentCharacter === 'vlad') 
                    ? 'return' 
                    : 'run';
                    
                // Aplicar animação (sem flip para Vlad pois 'return' já é direcionada)
                applyCharacterAnimation(animationName, 'player-return-anim');
                
                // Para outros personagens, aplicar flip (run invertida)
                if (currentCharacter !== 'Vlad' && currentCharacter !== 'vlad') {
                    character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                        layer.style.transform = 'scaleX(-1)';
                    });
                }
                
                // Remover classe de ida e aplicar classe de volta
                character.classList.remove('moving-to-boss');
                character.classList.add('moving-back');
                
                // RESTAURAR ESTADO NORMAL IMEDIATAMENTE (CORREÇÃO AQUI)
                window.visualStateManager.restoreNormal();
                
                const duration = parseFloat(animConfig.duration) * 1000;
                
                // Finalizar após movimento completo
                setTimeout(() => {
                    // Limpar classe de movimento
                    character.classList.remove('moving-back');
                    
                    // Remover flip e voltar para idle
                    character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                        layer.style.transform = '';
                    });
                    restoreCharacterIdle();
                    
                    this.nextPhase(100);
                }, duration * 0.8);
                
            } else {
                // Fallback: movimento simples sem animação
                console.log("Fallback: retorno sem animação específica");
                
                // Remover classe de ida
                character.classList.remove('moving-to-boss');
                
                // RESTAURAR ESTADO NORMAL (CORREÇÃO AQUI)
                window.visualStateManager.restoreNormal();
                
                setTimeout(() => {
                    restoreCharacterIdle();
                    this.nextPhase(100);
                }, 800);
            }
        }

        // Fase: Mostrar efeitos FX
        executePhase_show_fx() {
            console.log("QC Fase: Show FX");
            
            // Tocar som de preparação 2
            playSound(this.currentSkill.sound_prep_2, 0.7);

            // Configurar classes FX
            fxLayerA.classList.add('fx-layer-front');
            fxLayerB.classList.add('fx-layer-behind');

            // Ativar vinheta se existir
            if (this.currentSkill.vignette && this.currentSkill.vignette.trim() !== "") {
                console.log("🎭 VINHETA: Ativando", this.currentSkill.vignette);
                playAttackVignette(this.currentSkill.vignette);
            }
            
            // Ativar efeitos FX
            this.activateFXEffects();
            
            this.nextPhase(this.phaseData.prepDelay - 500);
        }

        // Fase: Preparação de conjuração com transição suave
        executePhase_cast_preparation() {
            console.log("QC Fase: Cast Preparation");
            
            let animConfig;
            
            // PARA VLAD: usar animação da skill atual ao invés de 'cast_preparation'
            const currentCharacter = getCurrentPlayerCharacter();
            if (currentCharacter === 'Vlad' || currentCharacter === 'vlad') {
                const skillId = this.currentSkill?.id;
                if (skillId) {
                    const skillAnimation = getSkillAnimation(skillId, 'ultimate');
                    animConfig = getCharacterAnimation(skillAnimation);
                    console.log(`🧛 Vlad cast_preparation: usando animação da skill '${skillAnimation}'`);
                }
            } else {
                // Para outros personagens: usar 'cast_preparation' normal
                animConfig = getCharacterAnimation('cast_preparation');
            }
            
            if (animConfig) {
                // Transição suave igual ao aim_stance
                const currentLayers = character.querySelectorAll('.character-sprite-layer');
                currentLayers.forEach(layer => {
                    layer.style.transition = 'opacity 0.2s ease-out';
                    layer.style.opacity = '0.3';
                });
                
                setTimeout(() => {
                    // Para Vlad, usar a animação da skill; para outros, usar 'cast_preparation'
                    const animationName = (currentCharacter === 'Vlad' || currentCharacter === 'vlad') 
                        ? getSkillAnimation(this.currentSkill?.id, 'ultimate')
                        : 'cast_preparation';
                        
                    applyCharacterAnimation(animationName, 'cast-preparation-anim');
                    
                    setTimeout(() => {
                        character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                            layer.style.transition = 'opacity 0.2s ease-in';
                            layer.style.opacity = '1';
                        });
                    }, 50);
                }, 100);
                
                const duration = parseFloat(animConfig.duration) * 1000;
                
                // Voltar para idle
                setTimeout(() => {
                    restoreCharacterIdle();
                }, duration + 200);
                
                this.nextPhase(duration + 0);
            } else {
                // Fallback com transição suave
                const currentLayers = character.querySelectorAll('.character-sprite-layer');
                currentLayers.forEach(layer => {
                    layer.style.transition = 'opacity 0.2s ease-out';
                    layer.style.opacity = '0.3';
                });
                
                setTimeout(() => {
                    applyCharacterAnimation('melee_attack1', 'cast-prep-fallback');
                    
                    setTimeout(() => {
                        character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                            layer.style.transition = 'opacity 0.2s ease-in';
                            layer.style.opacity = '1';
                        });
                    }, 50);
                }, 100);
                
                setTimeout(() => {
                    restoreCharacterIdle();
                }, 1100);
                
                this.nextPhase(1200);
            }
        }

        // Fase: Pose de mira com transição suave
        executePhase_aim_stance() {
            console.log("QC Fase: Aim Stance");
            
            // ===== VERIFICAR SE É SKILL DE PROJÉTIL =====
            const isProjectileSkill = this.currentSkill.attack_sequence === 'ranged_projectile';
            const isBeamSkill = this.currentSkill.attack_sequence === 'ranged_beam';
            console.log("🔍 DEBUG - É skill de projétil?", isProjectileSkill);
            console.log("🔍 DEBUG - É skill de beam?", isBeamSkill);
            
            let animConfig;
            
            // PARA VLAD: usar animação da skill atual ao invés de 'cast_preparation' ou 'aim_stance'
            const currentCharacter = getCurrentPlayerCharacter();
            if (currentCharacter === 'Vlad' || currentCharacter === 'vlad') {
                const skillId = this.currentSkill?.id;
                if (skillId) {
                    const skillAnimation = getSkillAnimation(skillId, 'power');
                    animConfig = getCharacterAnimation(skillAnimation);
                    console.log(`🧛 Vlad aim_stance: usando animação da skill '${skillAnimation}'`);
                }
            } else {
                // Para outros personagens: tentar cast_preparation primeiro, depois melee_attack1
                animConfig = getCharacterAnimation('cast_preparation');
            }
            
            if (animConfig) {
                console.log("Usando animação específica para aim_stance");
                
                // ===== TRANSIÇÃO DIRETA SEM FADE =====
                const animationName = (currentCharacter === 'Vlad' || currentCharacter === 'vlad') 
                    ? getSkillAnimation(this.currentSkill?.id, 'power')
                    : 'cast_preparation';
                    
                applyCharacterAnimation(animationName, 'aim-stance-anim');
                
                const duration = parseFloat(animConfig.duration) * 1000;
                
                // ===== APENAS PARA SKILLS DE PROJÉTIL =====
                if (isProjectileSkill) {
                    setTimeout(() => {
                        console.log("🎯 Criando projétil no final da animação de mira");
                        
                        // Tocar sons do ataque
                        playSound(this.currentSkill.sound_attack, 0.8);
                        playSound(this.currentSkill.sound_effect_1, 0.8);
                        
                        // Criar projétil
                        this.createTimedProjectile();
                        
                    }, duration - 200);
                }

                // ===== PARA SKILLS DE BEAM - APENAS ANIMAÇÃO SEM CRIAR O BEAM =====
                if (isBeamSkill) {
                    console.log("⚡ Preparando para beam (sem criar visual ainda)");
                    // NÃO criar o beam aqui - será criado na fase energy_beam
                }
                
                // VOLTAR PARA IDLE após a animação
                setTimeout(() => {
                    console.log("Voltando para idle após aim_stance");
                    restoreCharacterIdle();
                }, duration + 0);
                
                this.nextPhase(duration + 0);
                
            } else {
                // Fallback: usar melee_attack1 com transição direta
                console.log("Fallback: usando melee_attack1 para aim_stance");
                
                // Transição direta para fallback também
                applyCharacterAnimation('melee_attack1', 'aim-stance-fallback');
                
                // ===== APENAS PARA SKILLS DE PROJÉTIL =====
                if (isProjectileSkill) {
                    setTimeout(() => {
                        console.log("🎯 Criando projétil no fallback");
                        
                        // Tocar sons do ataque
                        playSound(this.currentSkill.sound_attack, 0.8);
                        playSound(this.currentSkill.sound_effect_1, 0.8);
                        
                        // Criar projétil
                        this.createTimedProjectile();
                        
                    }, 600);
                }

                // ===== PARA SKILLS DE BEAM =====
                if (isBeamSkill) {
                    console.log("⚡ Preparando para beam no fallback");
                }
                
                // VOLTAR PARA IDLE
                setTimeout(() => {
                    restoreCharacterIdle();
                }, 800);
                
                this.nextPhase(800);
            }
        }

        // ===== FUNÇÃO HELPER PARA CRIAR PROJÉTIL COM CONFIGURAÇÕES CUSTOMIZÁVEIS =====
        createTimedProjectile() {
            console.log("🎯 Criando projétil com timing correto");
            
            // Determinar tipo de projétil baseado na skill
            let projectileType = "magic_missile"; // Padrão
            
            // Debug da skill recebida
            console.log("🔍 DEBUG createTimedProjectile - currentSkill completa:", this.currentSkill);
            console.log("🔍 DEBUG - projectile_type na skill:", this.currentSkill.projectile_type);
            console.log("🔍 DEBUG - PROJECTILE_TYPES disponíveis:", Object.keys(PROJECTILE_TYPES));

            // Verificar se a skill tem um tipo de projétil específico
            if (this.currentSkill.projectile_type && PROJECTILE_TYPES[this.currentSkill.projectile_type]) {
                projectileType = this.currentSkill.projectile_type;
                console.log("✅ DEBUG - Tipo encontrado:", projectileType);
            } else {
                console.log("❌ DEBUG - Tipo não encontrado, usando padrão magic_missile");
                if (this.currentSkill.projectile_type) {
                    console.log("⚠️ DEBUG - Tipo definido mas não existe nos PROJECTILE_TYPES:", this.currentSkill.projectile_type);
                }
            }

            const config = PROJECTILE_TYPES[projectileType];
            console.log(`🎯 Usando projétil tipo: ${projectileType}`, config);
            
            // Pegar posições dos personagens na tela atual
            const characterRect = character.getBoundingClientRect();
            const bossRect = boss.getBoundingClientRect();
            
            const startX = characterRect.left + characterRect.width / 2;
            const startY = characterRect.top + characterRect.height / 2;
            const endX = bossRect.left + bossRect.width / 2;
            const endY = bossRect.top + bossRect.height / 2;
            
            // Criar projétil principal
            const projectile = document.createElement('div');
            projectile.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: ${config.size.width}px;
                height: ${config.size.height}px;
                background: ${config.visual.background};
                border-radius: ${config.visual.borderRadius};
                box-shadow: ${config.visual.boxShadow};
                z-index: 120;
                transition: all ${config.speed}s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                transform-origin: center center;
            `;
            
            document.body.appendChild(projectile);
            
            // ===== EFEITOS ESPECIAIS BASEADOS NA CONFIGURAÇÃO =====
            
            // Trail (rastro)
            let trailElements = [];
            if (config.trail) {
                this.createProjectileTrail(projectile, config, trailElements);
            }
            
            // Som específico
            if (config.sound) {
                playSound(config.sound, 0.6);
            }
            
            // ===== ANIMAÇÕES ESPECIAIS =====
            let animationInterval = null;
            
            if (config.pulse) {
                this.startPulseAnimation(projectile);
            }
            
            if (config.rotation) {
                this.startRotationAnimation(projectile);
            }
            
            if (config.spin) {
                this.startSpinAnimation(projectile);
            }
            
            if (config.glow) {
                this.startGlowAnimation(projectile);
            }
            
            // ===== MOVIMENTO DO PROJÉTIL =====
            
            setTimeout(() => {
                if (config.zigzag) {
                    this.animateZigzagProjectile(projectile, startX, startY, endX, endY, config);
                } else {
                    // Movimento linear normal
                    projectile.style.left = `${endX}px`;
                    projectile.style.top = `${endY}px`;
                    projectile.style.transform = 'scale(1.2)';
                }
            }, 50);
            
            // ===== APLICAR DANO E LIMPEZA =====
            
            const totalTime = config.speed * 1000;
            setTimeout(() => {
                this.applyBossDamageEffect();
                
                // Parar animações
                if (animationInterval) clearInterval(animationInterval);
                
                // Remover projétil com efeito
                if (projectile.parentNode) {
                    projectile.style.opacity = '0';
                    projectile.style.transform = projectile.style.transform + ' scale(0)';
                    setTimeout(() => projectile.remove(), 200);
                }
                
                // Limpar trail
                trailElements.forEach(trail => {
                    if (trail.parentNode) trail.remove();
                });
                
            }, totalTime + 50);
        }

        // ===== FUNÇÕES DE EFEITOS ESPECIAIS PARA PROJÉTEIS =====

        createProjectileTrail(projectile, config, trailElements) {
            const trailCount = 8;
            const trailDelay = 100; // ms entre cada elemento do trail
            
            for (let i = 0; i < trailCount; i++) {
                setTimeout(() => {
                    const trail = document.createElement('div');
                    const trailSize = config.size.width * (0.3 + (i / trailCount) * 0.4);
                    const trailOpacity = 0.8 - (i / trailCount) * 0.6;
                    
                    trail.style.cssText = `
                        position: fixed;
                        left: ${projectile.style.left};
                        top: ${projectile.style.top};
                        width: ${trailSize}px;
                        height: ${trailSize}px;
                        background: radial-gradient(circle, ${config.trailColor || '#ffffff'} 0%, transparent 70%);
                        border-radius: 50%;
                        z-index: 115;
                        opacity: ${trailOpacity};
                        pointer-events: none;
                        transition: opacity 0.5s ease-out;
                    `;
                    
                    document.body.appendChild(trail);
                    trailElements.push(trail);
                    
                    // Fade out do trail
                    setTimeout(() => {
                        trail.style.opacity = '0';
                        setTimeout(() => {
                            if (trail.parentNode) trail.remove();
                        }, 500);
                    }, 300);
                    
                }, i * trailDelay);
            }
        }

        startPulseAnimation(projectile) {
            let pulseDirection = 1;
            const pulseInterval = setInterval(() => {
                const currentScale = parseFloat(projectile.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1);
                const newScale = currentScale + (pulseDirection * 0.1);
                
                if (newScale >= 1.3) pulseDirection = -1;
                if (newScale <= 0.8) pulseDirection = 1;
                
                projectile.style.transform = projectile.style.transform.replace(/scale\([^)]+\)/, '') + ` scale(${newScale})`;
            }, 100);
            
            projectile._pulseInterval = pulseInterval;
        }

        startRotationAnimation(projectile) {
            let rotation = 0;
            const rotateInterval = setInterval(() => {
                rotation += 5;
                projectile.style.transform = projectile.style.transform.replace(/rotate\([^)]+\)/, '') + ` rotate(${rotation}deg)`;
            }, 50);
            
            projectile._rotateInterval = rotateInterval;
        }

        startSpinAnimation(projectile) {
            let spin = 0;
            const spinInterval = setInterval(() => {
                spin += 15;
                projectile.style.transform = projectile.style.transform.replace(/rotate\([^)]+\)/, '') + ` rotate(${spin}deg)`;
            }, 30);
            
            projectile._spinInterval = spinInterval;
        }

        startGlowAnimation(projectile) {
            let glowIntensity = 1;
            let glowDirection = 1;
            const glowInterval = setInterval(() => {
                glowIntensity += glowDirection * 0.1;
                if (glowIntensity >= 2) glowDirection = -1;
                if (glowIntensity <= 0.5) glowDirection = 1;
                
                projectile.style.filter = `brightness(${glowIntensity})`;
            }, 80);
            
            projectile._glowInterval = glowInterval;
        }

        animateZigzagProjectile(projectile, startX, startY, endX, endY, config) {
            const totalDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const steps = 20;
            const stepDistance = totalDistance / steps;
            const zigzagAmplitude = 30;
            
            let currentStep = 0;
            const zigzagInterval = setInterval(() => {
                if (currentStep >= steps) {
                    clearInterval(zigzagInterval);
                    return;
                }
                
                const progress = currentStep / steps;
                const baseX = startX + (endX - startX) * progress;
                const baseY = startY + (endY - startY) * progress;
                
                // Zigzag offset
                const zigzagOffset = Math.sin(progress * Math.PI * 4) * zigzagAmplitude * (1 - progress);
                const perpX = -(endY - startY) / totalDistance;
                const perpY = (endX - startX) / totalDistance;
                
                projectile.style.left = `${baseX + perpX * zigzagOffset}px`;
                projectile.style.top = `${baseY + perpY * zigzagOffset}px`;
                
                currentStep++;
            }, (config.speed * 1000) / steps);
        }

        // Fase: Preparação de salto
        executePhase_jump_preparation() {
            console.log("QC Fase: Jump Preparation");
            
            // Tentar usar cast_preparation como preparação, senão idle pausado
            const castConfig = getCharacterAnimation('cast_preparation');
            
            if (castConfig) {
                console.log("Usando cast_preparation para jump_preparation");
                applyCharacterAnimation('cast_preparation', 'jump-prep-anim');
                const duration = parseFloat(castConfig.duration) * 1000 * 0.5; // Metade da duração
                this.nextPhase(duration);
            } else {
                // Fallback: idle pausado
                console.log("Fallback: pausando idle para jump_preparation");
                character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                    layer.style.animationPlayState = 'paused';
                });
                this.nextPhase(500);
            }
        }

        // Fase: Teleporte do jogador (sistema atual)
        executePhase_player_teleport_advance() {
            console.log("QC Fase: Player Teleport Advance");
            
            // Aplicar animação de caminhada
            applyCharacterAnimation('walk_advance', 'walk-advance-anim');
            
            // Obter duração da animação
            const animConfig = getCharacterAnimation('walk_advance');
            const walkDuration = animConfig ? parseFloat(animConfig.duration) * 1000 : 300;
            
            // Fazer personagem sumir após animação
            setTimeout(() => {
                character.style.opacity = '0';
                
                // Remover foco do player
                battleArena.classList.remove('quick-cut-player');
                fxLayerA.classList.remove('animate-fx');
                fxLayerB.classList.remove('animate-fx');
                fxLayerA.style.opacity = 0;
                fxLayerB.style.opacity = 0;
                
                this.nextPhase(1300); // Delay de transição
            }, walkDuration);
        }

        // Nova fase: Delay de transição
        executePhase_transition_delay() {
            console.log("QC Fase: Transition Delay");
            
            // Apenas aguardar - momento de "suspense" entre player e boss
            this.nextPhase(900); // ← O delay original importante
        }

        // Fase: Corrida do jogador até o boss
        executePhase_player_run_advance() {
            console.log("QC Fase: Player Run Advance");
            
            // Calcular distância proporcional baseada no tamanho da tela
            const screenWidth = window.innerWidth;
            let movementDistance;
            
            if (screenWidth <= 1366) {
                movementDistance = '60%'; // Telas menores - menos movimento
            } else if (screenWidth <= 1920) {
                movementDistance = '70%'; // Telas médias
            } else {
                movementDistance = '80%'; // Telas grandes - mais movimento
            }
            
            // Definir variável CSS customizada
            character.style.setProperty('--movement-distance', movementDistance);
            console.log(`🎯 Distância de movimento definida: ${movementDistance} para tela ${screenWidth}px`);
            
            // Liberar movimento do personagem mantendo boss posicionado
            window.visualStateManager.applyState('player_moving');
            
            // Aplicar animação de corrida em loop
            applyCharacterAnimation('run', 'run-advance-anim');
            
            // Aplicar movimento via classe CSS
            character.classList.add('moving-to-boss');
            
            // Finalizar após movimento
            setTimeout(() => {
                fxLayerA.classList.remove('animate-fx');
                fxLayerB.classList.remove('animate-fx');
                fxLayerA.style.opacity = 0;
                fxLayerB.style.opacity = 0;
                
                this.nextPhase(0);
            }, 1200); 
        }

        // Fase: Avanço aéreo (para ataques com salto)
        executePhase_aerial_advance() {
            console.log("QC Fase: Aerial Advance");
            
            // Usar run com escala e movimento
            const runConfig = getCharacterAnimation('run');
            
            if (runConfig) {
                applyCharacterAnimation('run', 'aerial-advance-anim');
                
                // Aplicar transformação de "voo"
                character.style.transition = 'transform 1.0s ease-out';
                character.style.transform = 'translateY(-50px) translateX(200px) scale(1.1)';
                
                this.nextPhase(1000);
            } else {
                // Fallback: walk_advance com transformação
                applyCharacterAnimation('walk_advance', 'aerial-fallback');
                character.style.transition = 'transform 1.0s ease-out';
                character.style.transform = 'translateY(-50px) translateX(200px) scale(1.1)';
                this.nextPhase(1000);
            }
            
            // Remover foco do player após movimento
            setTimeout(() => {
                battleArena.classList.remove('quick-cut-player');
                fxLayerA.classList.remove('animate-fx');
                fxLayerB.classList.remove('animate-fx');
                fxLayerA.style.opacity = 0;
                fxLayerB.style.opacity = 0;
            }, 1000);
        }

        // Fase: Focar no boss
        executePhase_focus_boss() {
            console.log("QC Fase: Focus Boss");
            
            // Aplicar estado visual focus_boss
            window.visualStateManager.applyState('focus_boss');
            
            setTimeout(() => {
                setZoomFocus(boss, window.visualStateManager.elements.background);
                this.nextPhase(500);
            }, 50);
        }
        
        // Fase: Foco amplo (para ataques em área)
        executePhase_wide_focus() {
            console.log("QC Fase: Wide Focus");
            
            const activeBackground = document.getElementById('background-default');
            activeBackground.style.transformOrigin = 'center center';
            battleArena.classList.add('quick-cut-transition');
            
            this.nextPhase(500);
        }

        // Fase: Ataque corpo a corpo
        executePhase_melee_strike() {
            console.log("QC Fase: Melee Strike");
            
            let animConfig;
            
            // PARA VLAD: usar animação da skill atual (bloodattack para Garras Sangrentas)
            const currentCharacter = getCurrentPlayerCharacter();
            if (currentCharacter === 'Vlad' || currentCharacter === 'vlad') {
                const skillId = this.currentSkill?.id;
                if (skillId) {
                    const skillAnimation = getSkillAnimation(skillId, 'bloodattack');
                    animConfig = getCharacterAnimation(skillAnimation);
                    console.log(`🧛 Vlad melee_strike: usando animação da skill '${skillAnimation}'`);
                }
            } else {
                // Para outros personagens: usar 'melee_attack1' normal
                animConfig = getCharacterAnimation('melee_attack1');
            }
            
            if (animConfig) {
                // Aplicar animação específica
                const animationName = (currentCharacter === 'Vlad' || currentCharacter === 'vlad') 
                    ? getSkillAnimation(this.currentSkill?.id, 'bloodattack')
                    : 'melee_attack1';
                    
                applyCharacterAnimation(animationName, 'melee-strike-anim');
                
                // Tocar sons do ataque
                playSound(this.currentSkill.sound_attack, 0.8);
                playSound(this.currentSkill.sound_effect_1, 0.8);
                
                setTimeout(() => {
                    playSound(this.currentSkill.sound_effect_2, 0.8);
                }, 500);

                // Aplicar efeito de dano no boss
                this.applyBossDamageEffect();
                
                const duration = parseFloat(animConfig.duration) * 1000;
                this.nextPhase(duration);
                
            } else {
                // Fallback
                console.log("Fallback: usando animação padrão para melee_strike");
                applyCharacterAnimation('melee_attack1', 'melee-strike-fallback');
                
                // Tocar sons do ataque
                playSound(this.currentSkill.sound_attack, 0.8);
                playSound(this.currentSkill.sound_effect_1, 0.8);
                
                setTimeout(() => {
                    playSound(this.currentSkill.sound_effect_2, 0.8);
                }, 500);

                // Aplicar efeito de dano no boss
                this.applyBossDamageEffect();
                
                this.nextPhase(1000);
            }
        }

        // Fase: Ataque corpo a corpo com teleporte (inclui reposicionamento)
        executePhase_melee_strike_teleport() {
            console.log("QC Fase: Melee Strike Teleport");
            
            // REPOSICIONAR PERSONAGEM NA FRENTE DO BOSS
            const bossRect = boss.getBoundingClientRect();
            const battleArenaRect = battleArena.getBoundingClientRect();

            // Calcular posição na frente do boss (ajustado para boss mais à direita)
            const newLeft = ((bossRect.left - battleArenaRect.left) / battleArenaRect.width) * 100 - 5; // 5% à esquerda do boss (bem próximo)
            const newBottom = 15; // Mesma altura base do boss (15% do bottom)

            // Reposicionar, aplicar escala e tornar visível
            character.style.left = `${newLeft}%`;
            character.style.bottom = `${newBottom}%`;
            character.style.transform = 'scale(1.6)'; // Mesma escala do boss em quick-cut-boss
            character.style.opacity = '1';
            character.style.visibility = 'visible';
            
            // PARAR animação de corrida e aplicar animação de ataque
            applyCharacterAnimation('melee_attack1', 'melee-strike-anim');
            
            // APLICAR DANO SEM CRIAR ANIMATION_ATTACK (que está duplicando)
            this.applyBossDamageEffect();
            
            // Tocar sons
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            setTimeout(() => {
                playSound(this.currentSkill.sound_effect_2, 0.8);
            }, 500);
            
            this.nextPhase(800); // Tempo da animação de ataque
        }

        // Fase: Ataque supremo
        executePhase_ultimate_strike() {
            console.log("QC Fase: Ultimate Strike");
            this.executeGenericStrike(true);
        }

        // Fase: Ataque aéreo
        executePhase_aerial_strike() {
            console.log("QC Fase: Aerial Strike");
            this.executeGenericStrike();
        }

        // Fase: Lançamento de projétil -- backup, não é mais usada
        executePhase_projectile_launch() {
            console.log("QC Fase: Projectile Launch");
            
            // Tocar sons de ataque
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Criar projétil visual
            this.createVisualProjectile();
            
            // Aplicar efeito no boss após delay
            setTimeout(() => {
                this.applyBossDamageEffect();
                this.nextPhase(0);
            }, 1500); // Tempo para o projétil atingir o boss
        }

        // Fase: Lançamento de projétil COM seguimento de câmera
        executePhase_projectile_launch_and_follow() {
            console.log("QC Fase: Projectile Launch and Follow");
            
            // Tocar sons de ataque
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Pegar posições iniciais
            const characterRect = character.getBoundingClientRect();
            const bossRect = boss.getBoundingClientRect();
            
            const startX = characterRect.left + characterRect.width / 2;
            const startY = characterRect.top + characterRect.height / 2;
            const endX = bossRect.left + bossRect.width / 2;
            const endY = bossRect.top + bossRect.height / 2;
            
            // Criar projétil saindo DO PERSONAGEM
            const projectile = document.createElement('div');
            projectile.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: 25px;
                height: 25px;
                background: radial-gradient(circle, #00ffff 0%, #0088ff 100%);
                border-radius: 50%;
                z-index: 150;
                box-shadow: 0 0 30px #00ffff;
                transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            
            document.body.appendChild(projectile);
            
            // CÂMERA SEGUE O PROJÉTIL - transição gradual de focus
            const activeBackground = document.getElementById('background-default');
            
            // Iniciar movimento do projétil E transição da câmera
            setTimeout(() => {
                // Mover projétil
                projectile.style.left = `${endX}px`;
                projectile.style.top = `${endY}px`;
                projectile.style.transform = 'scale(1.5)';
                
                // CÂMERA: transição gradual do personagem para o boss
                if (activeBackground) {
                    // Calcular transform-origin que segue o projétil
                    const viewportWidth = window.innerWidth;
                    const progressX = (endX - startX) / viewportWidth;
                    const finalOriginX = 33 + (progressX * 30); // De ~33% (player) para ~63% (boss)
                    
                    activeBackground.style.transition = 'transform-origin 1.5s ease-out';
                    activeBackground.style.transformOrigin = `${finalOriginX}% 61%`;
                }
                
                // Remover classe de foco do player e adicionar do boss gradualmente
                setTimeout(() => {
                    battleArena.classList.remove('quick-cut-player');
                    battleArena.classList.add('quick-cut-boss');
                }, 750); // Meio do caminho
                
            }, 100);
            
            // Aplicar dano quando projétil atinge o boss
            setTimeout(() => {
                this.applyBossDamageEffect();
                
                // Remover projétil com efeito
                if (projectile.parentNode) {
                    projectile.style.opacity = '0';
                    projectile.style.transform = 'scale(3)';
                    setTimeout(() => projectile.remove(), 300);
                }
                
                this.nextPhase(300);
            }, 1600); // Tempo total do projétil
        }

        createVisualProjectile() {
            console.log("🎯 Criando projétil visual");
            
            // Pegar posição do boss como alvo
            const bossRect = boss.getBoundingClientRect();
            const endX = bossRect.left + bossRect.width / 2;
            const endY = bossRect.top + bossRect.height / 2;
            
            // Projétil sai da MARGEM ESQUERDA da tela
            const startX = -50; // Fora da tela à esquerda
            const startY = endY; // Mesma altura do boss
            
            // Criar elemento projétil
            const projectile = document.createElement('div');
            projectile.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: 25px;
                height: 25px;
                background: radial-gradient(circle, #00ffff 0%, #0088ff 100%);
                border-radius: 50%;
                z-index: 100;
                box-shadow: 0 0 30px #00ffff;
                transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            
            document.body.appendChild(projectile);
            
            // Animar projétil até o boss MAIS RÁPIDO
            setTimeout(() => {
                projectile.style.left = `${endX}px`;
                projectile.style.transform = 'scale(1.5)';
            }, 50);
            
            // Remover projétil MAIS RÁPIDO
            setTimeout(() => {
                if (projectile.parentNode) {
                    projectile.style.opacity = '0';
                    projectile.style.transform = 'scale(0)';
                    setTimeout(() => projectile.remove(), 200);
                }
            }, 900); // Reduzido de 1300 para 900
        }

        // ===== FUNÇÃO PARA CRIAR BEAM VISUAL IMPRESSIONANTE =====
        createEnergyBeamVisual() {
            console.log("⚡ Criando raio de energia visual ÉPICO");
            
            // Determinar tipo de beam baseado na skill
            let beamType = "energy_beam";
            if (this.currentSkill.beam_type && BEAM_TYPES[this.currentSkill.beam_type]) {
                beamType = this.currentSkill.beam_type;
            }
            
            const config = BEAM_TYPES[beamType];
            console.log(`⚡ Usando beam tipo: ${beamType}`, config);
            
            // Pegar posições atuais na tela
            const characterRect = character.getBoundingClientRect();
            const bossRect = boss.getBoundingClientRect();
            
            const startX = characterRect.left + characterRect.width / 2;
            const startY = characterRect.top + characterRect.height / 2;
            const endX = bossRect.left + bossRect.width / 2;
            const endY = bossRect.top + bossRect.height / 2;
            
            // Calcular ângulo e distância
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // ===== CONTAINER PRINCIPAL DO BEAM =====
            const beamContainer = document.createElement('div');
            beamContainer.id = 'energy-beam-container';
            beamContainer.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: ${distance}px;
                height: 0px;
                transform-origin: 0 0;
                transform: rotate(${angle}deg);
                z-index: 125;
                pointer-events: none;
            `;
            
            // ===== EFEITO DE CHARGE-UP NO PERSONAGEM =====
            this.createBeamChargeEffect(startX, startY, config);
            
            // ===== MÚLTIPLAS CAMADAS DO BEAM =====
            
            // Camada 1: Brilho externo massivo
            const outerGlow = document.createElement('div');
            outerGlow.style.cssText = `
                position: absolute;
                top: -${config.thickness.glow}px;
                left: 0;
                width: 100%;
                height: ${config.thickness.glow * 2}px;
                background: radial-gradient(ellipse closest-side, 
                    ${config.glow} 0%, 
                    transparent 70%);
                opacity: 0;
                filter: blur(8px);
                animation: beamPulse 0.3s infinite alternate;
            `;
            
            // Camada 2: Halo energético
            const energyHalo = document.createElement('div');
            energyHalo.style.cssText = `
                position: absolute;
                top: -${config.thickness.halo}px;
                left: 0;
                width: 100%;
                height: ${config.thickness.halo * 2}px;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    ${config.halo} 10%, 
                    ${config.bright} 50%, 
                    ${config.halo} 90%, 
                    transparent 100%);
                opacity: 0;
                filter: blur(3px);
                box-shadow: 0 0 40px ${config.core};
            `;
            
            // Camada 3: Núcleo principal
            const beamCore = document.createElement('div');
            beamCore.style.cssText = `
                position: absolute;
                top: -${config.thickness.core}px;
                left: 0;
                width: 100%;
                height: ${config.thickness.core * 2}px;
                background: linear-gradient(90deg, 
                    ${config.core} 0%, 
                    ${config.bright} 30%, 
                    ${config.bright} 70%, 
                    ${config.core} 100%);
                opacity: 0;
                box-shadow: 
                    0 0 20px ${config.core},
                    inset 0 0 10px ${config.bright};
            `;
            
            // Camada 4: Energia interna cintilante
            const innerEnergy = document.createElement('div');
            innerEnergy.style.cssText = `
                position: absolute;
                top: -${config.thickness.core / 2}px;
                left: 0;
                width: 100%;
                height: ${config.thickness.core}px;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    ${config.bright} 20%, 
                    ${config.bright} 80%, 
                    transparent 100%);
                opacity: 0;
                filter: brightness(1.5);
            `;
            
            // ===== EFEITOS DE IMPACTO NO BOSS =====
            const impactEffect = this.createBeamImpactEffect(endX, endY, config);
            
            // ===== PARTÍCULAS DE ENERGIA =====
            const particles = this.createBeamParticles(startX, startY, endX, endY, config);
            
            // Adicionar todas as camadas
            beamContainer.appendChild(outerGlow);
            beamContainer.appendChild(energyHalo);
            beamContainer.appendChild(beamCore);
            beamContainer.appendChild(innerEnergy);
            
            document.body.appendChild(beamContainer);
            document.body.appendChild(impactEffect);
            document.body.appendChild(particles);
            
            // ===== ADICIONAR ANIMAÇÕES CSS =====
            this.addBeamAnimations();
            
            // ===== SEQUÊNCIA DE ANIMAÇÃO =====
            
            // Fase 1: Charge-up (1000ms) - AUMENTADO
            setTimeout(() => {
                console.log("⚡ Fase 1: Charge-up");
                // As camadas aparecem gradualmente
                outerGlow.style.opacity = '0.8';
                outerGlow.style.transition = 'opacity 1.2s ease-out'; // AUMENTADO
            }, 100);

            // Fase 2: Beam aparece (300ms)
            setTimeout(() => {
                console.log("⚡ Fase 2: Beam ativo");
                energyHalo.style.opacity = '0.9';
                beamCore.style.opacity = '1.0';
                innerEnergy.style.opacity = '0.7';
                impactEffect.style.opacity = '1.0';
                particles.style.opacity = '1.0';
                
                energyHalo.style.transition = 'opacity 0.3s ease-out';
                beamCore.style.transition = 'opacity 0.3s ease-out';
                innerEnergy.style.transition = 'opacity 0.3s ease-out';
                impactEffect.style.transition = 'opacity 0.3s ease-out';
                particles.style.transition = 'opacity 0.3s ease-out';
            }, 1200);
            
            // Fase 3: Intensificação e pulsação
            let pulseInterval = null;
            setTimeout(() => {
                console.log("⚡ Fase 3: Intensificação");
                let intensity = 1;
                let direction = 1;
                
                pulseInterval = setInterval(() => {
                    intensity += direction * 0.15;
                    if (intensity >= 1.8) direction = -1;
                    if (intensity <= 0.8) direction = 1;
                    
                    beamCore.style.filter = `brightness(${intensity}) saturate(${intensity})`;
                    innerEnergy.style.filter = `brightness(${intensity * 1.5})`;
                    impactEffect.style.filter = `brightness(${intensity}) scale(${intensity})`;
                    
                    // Shake sutil no beam
                    const shake = (Math.random() - 0.3) * 2;
                    beamContainer.style.transform = `rotate(${angle + shake}deg)`;
                    
                }, config.pulseSpeed);
            }, 900);
            
            // Fase 4: Fade out
            setTimeout(() => {
                console.log("⚡ Fase 4: Desaparecendo");
                if (pulseInterval) clearInterval(pulseInterval);
                
                // Fade out de todas as camadas
                outerGlow.style.opacity = '0';
                energyHalo.style.opacity = '0';
                beamCore.style.opacity = '0';
                innerEnergy.style.opacity = '0';
                impactEffect.style.opacity = '0';
                particles.style.opacity = '0';
                
                outerGlow.style.transition = 'opacity 0.4s ease-in';
                energyHalo.style.transition = 'opacity 0.4s ease-in';
                beamCore.style.transition = 'opacity 0.4s ease-in';
                innerEnergy.style.transition = 'opacity 0.4s ease-in';
                impactEffect.style.transition = 'opacity 0.4s ease-in';
                particles.style.transition = 'opacity 0.4s ease-in';
                
                // Remover elementos
                setTimeout(() => {
                    if (beamContainer.parentNode) beamContainer.remove();
                    if (impactEffect.parentNode) impactEffect.remove();
                    if (particles.parentNode) particles.remove();
                }, 500);
                
            }, config.duration);
        }

        // ===== EFEITO DE CHARGE-UP NO PERSONAGEM =====
        createBeamChargeEffect(x, y, config) {
            const chargeEffect = document.createElement('div');
            chargeEffect.style.cssText = `
                position: fixed;
                left: ${x - 50}px;
                top: ${y - 50}px;
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: radial-gradient(circle, 
                    ${config.bright} 0%, 
                    ${config.core} 25%, 
                    rgba(255, 255, 255, 0.3) 45%, 
                    rgba(255, 255, 255, 0.1) 65%, 
                    transparent 85%);
                opacity: 0;
                z-index: 124;
                animation: chargeUp 1.6s ease-out forwards;
                pointer-events: none;
            `;
            
            document.body.appendChild(chargeEffect);
            
            // Auto-remover após animação
            setTimeout(() => {
                if (chargeEffect.parentNode) chargeEffect.remove();
            }, 1000);
        }

        // ===== EFEITO DE IMPACTO NO BOSS =====
        createBeamImpactEffect(x, y, config) {
            const impact = document.createElement('div');
            impact.style.cssText = `
                position: fixed;
                left: ${x - 60}px;
                top: ${y - 60}px;
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: radial-gradient(circle, 
                    ${config.bright} 0%, 
                    ${config.core} 20%, 
                    ${config.halo} 40%, 
                    rgba(255, 255, 255, 0.3) 60%, 
                    rgba(255, 255, 255, 0.1) 75%, 
                    transparent 90%);
                opacity: 0;
                z-index: 123;
                pointer-events: none;
                animation: impactBurst 0.2s infinite alternate;
            `;
            
            return impact;
        }

        // ===== PARTÍCULAS DE ENERGIA =====
        createBeamParticles(startX, startY, endX, endY, config) {
            const particleContainer = document.createElement('div');
            particleContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 122;
                opacity: 0;
            `;
            
            // Criar 10 partículas ao longo do beam
            for (let i = 0; i < 10; i++) {
                const progress = i / 9;
                const particleX = startX + (endX - startX) * progress;
                const particleY = startY + (endY - startY) * progress;
                
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    left: ${particleX}px;
                    top: ${particleY}px;
                    width: 6px;
                    height: 6px;
                    background: ${config.bright};
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${config.core};
                    animation: particleFloat 0.5s infinite alternate;
                    animation-delay: ${i * 0.1}s;
                `;
                
                particleContainer.appendChild(particle);
            }
            
            return particleContainer;
        }

        // ===== ADICIONAR ANIMAÇÕES CSS =====
        addBeamAnimations() {
            if (document.querySelector('#beam-animations')) return;
            
            const style = document.createElement('style');
            style.id = 'beam-animations';
            style.textContent = `
                @keyframes beamPulse {
                    0% { filter: blur(8px) brightness(1); }
                    100% { filter: blur(6px) brightness(1.3); }
                }
                
                @keyframes chargeUp {
                    0% { 
                        opacity: 0; 
                        transform: scale(0.3) rotate(0deg); 
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.2) rotate(180deg); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: scale(0.8) rotate(360deg); 
                    }
                }
                
                @keyframes impactBurst {
                    0% { transform: scale(1) rotate(0deg); }
                    100% { transform: scale(1.1) rotate(10deg); }
                }
                
                @keyframes particleFloat {
                    0% { transform: translateY(0px) scale(1); }
                    100% { transform: translateY(-10px) scale(1.2); }
                }
            `;
            
            document.head.appendChild(style);
        }

        // Fase: Efeito à distância normal (para ranged_distant)
        executePhase_distant_effect_normal() {
            console.log("QC Fase: Distant Effect Normal");
                       
            // Criar efeito à distância (raio do céu, etc.)
            this.createDistantEffect();

            // Sons: attack primeiro, depois effect_1, depois effect_2 com delay
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Effect_2 toca depois do effect_1
            setTimeout(() => {
                playSound(this.currentSkill.sound_effect_2, 0.8);
            }, 700);
            
            setTimeout(() => {
                // ✅ APLICAR BOSS DAMAGE OVERLAY AQUI - momento do dano
                this.applyBossDamageEffect();
                this.nextPhase(0);
            }, 200);
        }

        // Fase: Manifestação mágica
        executePhase_magic_manifestation() {
            console.log("QC Fase: Magic Manifestation");
            
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Efeito mágico similar ao melee mas com mais FX
            this.executeGenericStrike();
        }

        // Fase: Efeito em área
        executePhase_area_effect() {
            console.log("QC Fase: Area Effect");
            
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Criar efeito em área
            this.createAreaEffect();
            
            setTimeout(() => {
                this.applyBossDamageEffect();
                this.nextPhase(0);
            }, 1200);
        }

        // Fase: Aplicar dano
        executePhase_apply_damage() {
            console.log("QC Fase: Apply Damage");
            
            // Esconder container de ataque QC2
            qc2AttackContainer.style.opacity = '0';
            qc2AttackContainer.innerHTML = '';

            // Aplicar dano e efeitos visuais (código original)
            this.applyDamageAndEffects();
            
            this.nextPhase(800);
        }

        // Fase: Raio de energia
        executePhase_energy_beam() {
            console.log("🔥 QC Fase: Energy Beam");
            console.log("🔍 DEBUG - currentSkill na executePhase_energy_beam:", this.currentSkill);
            
            // Tocar sons
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Criar beam visual conectando personagem ao boss (NA TELA NORMAL)
            this.createEnergyBeamVisual();
            
            // Aplicar dano quando o beam terminar
            const config = BEAM_TYPES[this.currentSkill.beam_type] || BEAM_TYPES["energy_beam"];
            const beamDuration = config.duration;

            // ===== DEBUG DETALHADO PARA EFEITO PIXIJS =====
            console.log("🔍 DEBUG BEAM - currentSkill completa:", this.currentSkill);
            console.log("🔍 DEBUG BEAM - boss_damage_overlay:", this.currentSkill.boss_damage_overlay);
            console.log("🔍 DEBUG BEAM - window.pixieSystem existe?", !!window.pixieSystem);
            console.log("🔍 DEBUG BEAM - bossFrontApp existe?", !!(window.pixieSystem && window.pixieSystem.bossFrontApp));

            setTimeout(() => {
                // Tocar som do impacto no momento do dano
                playSound(this.currentSkill.sound_effect_2, 0.8);
                
                this.applyBossDamageEffect();
                
                // Restaurar idle do personagem após o beam
                setTimeout(() => {
                    restoreCharacterIdle();
                }, 300);
                
                this.nextPhase(500);
            }, beamDuration);
        }

        // Fase: Retorno por teleporte
        executePhase_player_teleport_return() {
            console.log("QC Fase: Player Teleport Return");
            
            // TELEPORTE INSTANTÂNEO: Desaparecer
            character.style.opacity = '0';
            
            // PRIMEIRO: Restaurar background e remover foco do boss
            setTimeout(() => {
                battleArena.classList.remove('quick-cut-boss');
                battleArena.classList.remove('quick-cut-transition');
                
                const activeBackground = document.getElementById('background-default');
                if (activeBackground) activeBackground.style.transformOrigin = 'center center';
                
            }, 200);
            
            // SEGUNDO: APÓS background restaurado, reaparecer personagem
            setTimeout(() => {
                // RESETAR posição para inicial instantaneamente
                character.style.left = '30%';
                character.style.bottom = '15%';
                character.style.transform = ''; // Remove escala
                
                // REAPARECER na posição inicial
                character.style.opacity = '1';
                
                // Aplicar animação de retorno
                applyCharacterAnimation('walk_return', 'walk-return-anim');
                
                this.nextPhase(400);
                
            }, 600); // 600ms total - background restaura primeiro, depois personagem aparece
        }
        
        executePhase_player_run_return() {
            console.log("QC Fase: Player Run Return");
            
            // Aplicar animação de corrida NORMAL (não walk_return que pode estar bugada)
            applyCharacterAnimation('run', 'run-return-anim');
            
            // Aplicar flip horizontal para simular corrida de volta
            const character = document.getElementById('character');
            character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                layer.style.transform = 'scaleX(-1)'; // Inverte horizontalmente
            });
            
            // Remover classe de ida e aplicar classe de volta
            character.classList.remove('moving-to-boss');
            character.classList.add('moving-back');
            
            // Finalizar após movimento completo
            setTimeout(() => {
                // Limpar classe de movimento
                character.classList.remove('moving-back');
                
                // Remover flip e voltar para idle
                character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                    layer.style.transform = ''; // Remove o flip
                });
                applyCharacterAnimation('idle');
                
                // Restauração limpa e gradual para evitar flicker
                battleArena.classList.remove('quick-cut-boss', 'quick-cut-player');
                                
                this.nextPhase(300);
            }, 1200);
        }

        // Fase: Retorno do salto
        executePhase_land_return() {
            console.log("QC Fase: Land Return");
            
            // Remover foco do boss
            battleArena.classList.remove('quick-cut-boss');
            
            setTimeout(() => {
                const activeBackground = document.getElementById('background-default');
                if (activeBackground) activeBackground.style.transformOrigin = 'center center';
                battleArena.classList.remove('quick-cut-transition');
                
                // Usar walk_return como aterrissagem
                const walkReturnConfig = getCharacterAnimation('walk_return');
                
                if (walkReturnConfig) {
                    console.log("Usando walk_return para land_return");
                    applyCharacterAnimation('walk_return', 'land-return-anim');
                    
                    // Animar volta à posição original
                    character.style.transition = 'transform 0.8s ease-out';
                    character.style.transform = 'translateX(0) translateY(0) scale(1)';
                    
                    const duration = parseFloat(walkReturnConfig.duration) * 1000;
                    this.nextPhase(duration);
                } else {
                    // Fallback: idle com transformação
                    console.log("Fallback: usando idle para land_return");
                    restoreCharacterIdle();
                    character.style.transition = 'transform 0.8s ease-out';
                    character.style.transform = 'translateX(0) translateY(0) scale(1)';
                    this.nextPhase(800);
                }
            }, 400);
        }

        // Fase: Zoom-out final - RESTAURAÇÃO COMPLETA para tela inicial
        executePhase_zoom_out_final() {
            console.log("QC Fase: Zoom Out Final - Restauração Completa");
            
            // 1. Remover TODOS os efeitos de quick-cut
            battleArena.classList.remove('quick-cut-boss');
            battleArena.classList.remove('quick-cut-player'); 
            battleArena.classList.remove('quick-cut-transition');
            
            // 2. Restaurar background para estado normal
            const activeBackground = document.getElementById('background-default');
            if (activeBackground) {
                activeBackground.style.transformOrigin = 'center center';
                activeBackground.style.transform = 'scale(1)';
                activeBackground.style.filter = 'none';
            }
            
            // 3. Garantir que personagem e boss estejam visíveis e normais
            character.style.opacity = '1';
            character.style.visibility = 'visible';
            character.style.transform = '';
            character.style.filter = '';
            
            boss.style.opacity = '1';
            boss.style.visibility = 'visible';
            boss.style.transform = '';
            boss.style.filter = '';
            
            // 4. Restaurar animação idle do personagem
            setTimeout(() => {
                restoreCharacterIdle();
                
                // 5. Limpar vinheta de ataque
                cleanupAttackVignette();
                if (this.currentSkill.vignette && this.currentSkill.vignette.trim() !== "") {
                    console.log("🎭 VINHETA: Limpeza completa para", this.currentSkill.vignette);
                }
                
                // 6. Reexibir HUDs após transição
                setTimeout(() => {
                    const currentBossHud = document.querySelector('.boss-hud');
                    const currentCharacterHud = document.querySelector('.character-hud');

                    if (!gameState.bossView && !gameState.characterView) {
                        if (currentBossHud) currentBossHud.style.opacity = '1';
                        if (currentCharacterHud && !gameState.zoomedView) {
                            currentCharacterHud.style.opacity = '1';
                        }
                    }
                }, 200);
                
                this.nextPhase(400);
            }, 300);
        }

        // Fase: Restauração completa - NOVA FASE UNIVERSAL
        executePhase_restore_complete() {
            console.log("QC Fase: Restore Complete - Restauração Universal");
            
            // ===== RESET COMPLETO DE TODOS OS ELEMENTOS =====
            
            // 1. Remover TODAS as classes de quick-cut
            battleArena.classList.remove('quick-cut-boss');
            battleArena.classList.remove('quick-cut-player'); 
            battleArena.classList.remove('quick-cut-transition');
            
            // 2. Restaurar background para estado normal COMPLETO
            const activeBackground = document.getElementById('background-default');
            if (activeBackground) {
                activeBackground.style.transformOrigin = 'center center';
                activeBackground.style.transform = 'scale(1)';
                activeBackground.style.filter = 'none';
                activeBackground.style.transition = '';
                activeBackground.style.left = '';
                activeBackground.style.right = '';
                activeBackground.style.top = '';
                activeBackground.style.bottom = '';
            }
            
            // 3. Reset completo do boss
            boss.style.opacity = '1';
            boss.style.visibility = 'visible';
            boss.style.transform = '';
            boss.style.filter = '';
            boss.style.transition = '';
            boss.style.left = '';
            boss.style.right = '';
            boss.style.top = '';
            boss.style.bottom = '';
            boss.classList.remove('screen-shake');
            
            // 4. Reset completo do personagem
            character.style.opacity = '1';
            character.style.visibility = 'visible';
            character.style.transform = '';
            character.style.filter = '';
            character.style.transition = '';
            character.style.left = '';
            character.style.right = '';
            character.style.top = '';
            character.style.bottom = '';
            character.classList.remove('moving-to-boss', 'moving-back');
            
            // 5. Restaurar animação idle do personagem
            restoreCharacterIdle();
            
            // 6. Limpar container de ataque QC2
            const qc2Container = document.getElementById('qc2-attack-animation-container');
            if (qc2Container) {
                qc2Container.style.opacity = '0';
                qc2Container.innerHTML = '';
            }
            
            // 7. Limpar vinheta de ataque
            cleanupAttackVignette();
            if (this.currentSkill.vignette && this.currentSkill.vignette.trim() !== "") {
                console.log("🎭 VINHETA: Limpeza completa para", this.currentSkill.vignette);
            }
            
            // 8. Reexibir HUDs após transição
            setTimeout(() => {
                const currentBossHud = document.querySelector('.boss-hud');
                const currentCharacterHud = document.querySelector('.character-hud');

                if (!gameState.bossView && !gameState.characterView) {
                    if (currentBossHud) currentBossHud.style.opacity = '1';
                    if (currentCharacterHud && !gameState.zoomedView) {
                        currentCharacterHud.style.opacity = '1';
                    }
                }
            }, 200);
            
            this.nextPhase(400);
        }

        // Fase: Restaurar visão normal (sem zoom-out final)
        executePhase_restore_normal_view() {
            console.log("QC Fase: Restore Normal View");
            
            // Remover efeitos de quick-cut
            battleArena.classList.remove('quick-cut-player');
            battleArena.classList.remove('quick-cut-transition');
            
            // Restaurar background
            const activeBackground = document.getElementById('background-default');
            if (activeBackground) {
                activeBackground.style.transformOrigin = 'center center';
                activeBackground.style.transform = 'scale(1)';
                activeBackground.style.filter = 'none';
            }
            
            // Garantir que personagem e boss estão visíveis e normais
            character.style.opacity = '1';
            character.style.visibility = 'visible';
            character.style.transform = '';
            
            boss.style.opacity = '1';
            boss.style.visibility = 'visible';
            boss.style.transform = '';
            
            // Reexibir HUDs
            setTimeout(() => {
                const currentBossHud = document.querySelector('.boss-hud');
                const currentCharacterHud = document.querySelector('.character-hud');

                if (!gameState.bossView && !gameState.characterView) {
                    if (currentBossHud) currentBossHud.style.opacity = '1';
                    if (currentCharacterHud && !gameState.zoomedView) {
                        currentCharacterHud.style.opacity = '1';
                    }
                }
            }, 100);
            
            this.nextPhase(400);
        }

        // Fase: Lançamento de projétil na tela normal
        executePhase_projectile_launch_normal() {
            console.log("QC Fase: Projectile Launch Normal");
            
            // Tocar sons
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            // Pegar posições na tela normal
            const characterRect = character.getBoundingClientRect();
            const bossRect = boss.getBoundingClientRect();
            
            const startX = characterRect.left + characterRect.width / 2;
            const startY = characterRect.top + characterRect.height / 2;
            const endX = bossRect.left + bossRect.width / 2;
            const endY = bossRect.top + bossRect.height / 2;
            
            // Criar projétil
            const projectile = document.createElement('div');
            projectile.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, #00ffff 0%, #0088ff 100%);
                border-radius: 50%;
                z-index: 100;
                box-shadow: 0 0 25px #00ffff;
                transition: all 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            
            document.body.appendChild(projectile);
            
            // Animar projétil
            setTimeout(() => {
                projectile.style.left = `${endX}px`;
                projectile.style.top = `${endY}px`;
                projectile.style.transform = 'scale(1.5)';
            }, 50);
            
            // Aplicar dano e remover projétil
            setTimeout(() => {
                this.applyBossDamageEffect();
                
                if (projectile.parentNode) {
                    projectile.style.opacity = '0';
                    projectile.style.transform = 'scale(0)';
                    setTimeout(() => projectile.remove(), 200);
                }
                
                // Restaurar idle do personagem
                setTimeout(() => {
                    restoreCharacterIdle();
                }, 300);
                
                this.nextPhase(500);
            }, 1100);
        }

        // ===== MÉTODOS AUXILIARES =====

        activateFXEffects() {
            const { fxPaths } = this.phaseData;
            
            // Ativar FX A
            if (fxPaths.a) {
                if (isPixiEffect(fxPaths.a)) {
                    playPixiEffect(fxPaths.a, 'character', 'front', 'AttackPhaseSystem_FX_A');
                    console.log("🎭 PixiJS A ativado:", fxPaths.a);
                } else {
                    fxLayerA.classList.remove('animate-fx');
                    void fxLayerA.offsetWidth;
                    fxLayerA.style.backgroundImage = `url('${fxPaths.a}')`;
                    fxLayerA.style.opacity = '1';
                    fxLayerA.classList.add('animate-fx');
                    console.log("🖼️ Sprite A ativado");
                }
            }
            
            // Ativar FX B
            if (fxPaths.b) {
                if (isPixiEffect(fxPaths.b)) {
                    playPixiEffect(fxPaths.b, 'character', 'back', 'AttackPhaseSystem_FX_B');
                    console.log("🎭 PixiJS B ativado:", fxPaths.b);
                } else {
                    fxLayerB.classList.remove('animate-fx');
                    void fxLayerB.offsetWidth;
                    fxLayerB.style.backgroundImage = `url('${fxPaths.b}')`;
                    fxLayerB.style.opacity = '1';
                    fxLayerB.classList.add('animate-fx');
                    console.log("🖼️ Sprite B ativado");
                }
            }
        }

        executeGenericStrike(isUltimate = false) {
            console.log(`QC Fase: ${isUltimate ? 'Ultimate' : 'Generic'} Strike`);
            
            // ===== LOGS DE DEBUG DETALHADOS =====
            console.log("🔍 DEBUG - Skill completa:", this.currentSkill);
            console.log("🔍 DEBUG - animation_attack:", this.currentSkill.animation_attack);
            console.log("🔍 DEBUG - Tipo de animation_attack:", typeof this.currentSkill.animation_attack);
            console.log("🔍 DEBUG - animation_attack está vazio?", !this.currentSkill.animation_attack || this.currentSkill.animation_attack.trim() === "");
            
            // ===== NOVO: SISTEMA DE PERSONAGENS =====
            const currentCharacter = getCurrentPlayerCharacter();
            console.log("🎭 Personagem atual:", currentCharacter);
            
            // Obter animação específica do personagem
            let characterAnimation = 'melee_attack1'; // fallback
            
            if (currentCharacter === "Vlad") {
                // Usar mapeamento específico do Vlad baseado na skill
                const skillId = this.currentSkill?.id;
                characterAnimation = getSkillAnimation(skillId, 'bloodattack');
                console.log(`🧛 Vlad usando animação: ${characterAnimation} para skill ${skillId}`);
            } else {
                // Para Mago e outros personagens, usar sistema original
                characterAnimation = 'melee_attack1';
                console.log(`🧙 ${currentCharacter} usando animação padrão: ${characterAnimation}`);
            }
            
            // Aplicar animação do personagem
            applyCharacterAnimation(characterAnimation, 'skill-attack-anim');
            
            // Tocar sons
            playSound(this.currentSkill.sound_attack, 0.8);
            playSound(this.currentSkill.sound_effect_1, 0.8);
            
            setTimeout(() => {
                playSound(this.currentSkill.sound_effect_2, 0.8);
            }, 500);

            // Aplicar efeito de dano no boss
            this.applyBossDamageEffect();

            // Verificar se a skill tem animation_attack definida
            if (this.currentSkill.animation_attack && this.currentSkill.animation_attack.trim() !== "") {
                console.log(`✅ USANDO animation_attack da skill: "${this.currentSkill.animation_attack}"`);
                
                // Mapeamento de nomes lógicos para arquivos
                const ATTACK_ANIMATIONS = {
                    // Série 1
                    "attack_basic": "attack1.png",
                    "attack_yellow1": "attack1amarelo.png", 
                    "attack_blue1": "attack1blue.png",
                    "attack_black1": "attack1black.png",
                    "attack_black_double": "attack1black-double.png",
                    "attack_pink1": "attack1rosa.png",
                    "attack_green1": "attack1verde.png", 
                    "attack_red1": "attack1vermelho.png",
                    // Série 2
                    "attack_black2": "attack2black.png",
                    "attack_blue2": "attack2blue.png",
                    "attack_red2": "attack2red.png",
                    "attack_yellow2": "attack2yellow.png"
                };
                
                // Verificar se o nome lógico existe no mapeamento
                const fileName = ATTACK_ANIMATIONS[this.currentSkill.animation_attack];
                
                console.log(`🔍 DEBUG - Mapeamento encontrado: "${this.currentSkill.animation_attack}" → "${fileName}"`);
                
                if (fileName) {
                    console.log(`🎯 CRIANDO animação: ${this.currentSkill.animation_attack} → ${fileName}`);
                    
                    // Criar elemento de animação de ataque da skill
                    const skillAttackElement = document.createElement('div');
                    skillAttackElement.className = `skill-attack-animation attack-animation-${this.currentSkill.animation_attack}`;
                    
                    // Definir o caminho da imagem usando o arquivo correto
                    const imagePath = `/static/game.data/attacks/${fileName}`;
                    skillAttackElement.style.backgroundImage = `url('${imagePath}')`;
                    
                    console.log(`📁 Caminho da imagem: ${imagePath}`);
                    console.log(`🎨 Classe CSS aplicada: attack-animation-${this.currentSkill.animation_attack}`);
                    
                    // Adicionar ao personagem
                    character.appendChild(skillAttackElement);
                    
                    // Ativar animação
                    setTimeout(() => {
                        skillAttackElement.classList.add('play-attack');
                        console.log(`🚀 Animação ativada para: ${this.currentSkill.animation_attack}`);
                    }, 50);
                    
                    // Remover elemento após animação
                    setTimeout(() => {
                        if (skillAttackElement.parentNode) {
                            skillAttackElement.parentNode.removeChild(skillAttackElement);
                            console.log(`🗑️ Elemento de animação removido: ${this.currentSkill.animation_attack}`);
                        }
                    }, 1000);
                    
                } else {
                    console.error(`❌ ERRO: Animação não encontrada no mapeamento: "${this.currentSkill.animation_attack}"`);
                    console.log("📋 Animações disponíveis:", Object.keys(ATTACK_ANIMATIONS));
                }
                
            } else {
                console.log("⚠️ FALLBACK: Skill sem animation_attack ou vazia - usando apenas animação do personagem");
                console.log("🔍 Motivos possíveis:");
                console.log("   - Campo animation_attack não foi enviado pela API");
                console.log("   - Campo está vazio ou null");
                console.log("   - Campo está undefined");
                console.log(`📺 Usando animação do ${currentCharacter}: ${characterAnimation}`);
            }
            
            this.nextPhase(600);

            // Criar animação de ataque em QC2 (mantém o sistema existente)
            const bossRect = boss.getBoundingClientRect();
            const attackX = bossRect.left + (bossRect.width * 0.30);
            const attackY = bossRect.top + (bossRect.height * 0.60);

            qc2AttackContainer.innerHTML = '';
            const attackAnimElement = document.createElement('div');
            attackAnimElement.className = 'p1-attack-qc2';
            attackAnimElement.style.left = `${attackX}px`;
            attackAnimElement.style.top = `${attackY}px`;
            attackAnimElement.style.transform = isUltimate ? 'scale(9.0)' : 'scale(7.2)';

            // Só definir imagem se a skill tiver animation_attack
            if (this.currentSkill.animation_attack && this.currentSkill.animation_attack.trim() !== "") {
                const ATTACK_ANIMATIONS = {
                    "attack_basic": "attack1.png",
                    "attack_yellow1": "attack1amarelo.png", 
                    "attack_blue1": "attack1blue.png",
                    "attack_black1": "attack1black.png",
                    "attack_black_double": "attack1black-double.png",
                    "attack_pink1": "attack1rosa.png",
                    "attack_green1": "attack1verde.png", 
                    "attack_red1": "attack1vermelho.png",
                    "attack_black2": "attack2black.png",
                    "attack_blue2": "attack2blue.png",
                    "attack_red2": "attack2red.png",
                    "attack_yellow2": "attack2yellow.png"
                };
                
                const fileName = ATTACK_ANIMATIONS[this.currentSkill.animation_attack];
                if (fileName) {
                    const imagePath = `/static/game.data/attacks/${fileName}`;
                    attackAnimElement.style.backgroundImage = `url('${imagePath}')`;
                    console.log(`🎯 QC2: Usando ${fileName} para animação no boss`);
                }
            } else {
                console.log("🎯 QC2: SEM animation_attack - sem imagem de fundo");
                // NÃO definir background-image - elemento fica transparente
            }

            qc2AttackContainer.appendChild(attackAnimElement);
            qc2AttackContainer.style.opacity = '1';

            void attackAnimElement.offsetWidth;
            attackAnimElement.classList.add('play-animation');
        }

        applyBossDamageEffect() {
            // Efeito de dano no boss
            if (this.currentSkill.boss_damage_overlay && this.currentSkill.boss_damage_overlay.trim() !== "") {
                console.log("🔍 DEBUG: boss_damage_overlay detectado:", this.currentSkill.boss_damage_overlay);
                console.log("🔍 DEBUG: Tipo do boss_damage_overlay:", typeof this.currentSkill.boss_damage_overlay);
                console.log("🔍 DEBUG: window.BOSS_DAMAGE_SHADERS disponível?", !!window.BOSS_DAMAGE_SHADERS);
                console.log("🔍 DEBUG: Lista de shaders disponíveis:", window.BOSS_DAMAGE_SHADERS ? Object.keys(window.BOSS_DAMAGE_SHADERS) : "Nenhum");
                
                if (window.BOSS_DAMAGE_SHADERS && window.BOSS_DAMAGE_SHADERS[this.currentSkill.boss_damage_overlay]) {
                    console.log("🎭 Aplicando shader de dano no boss:", this.currentSkill.boss_damage_overlay);
                    
                    if (window.pixieSystem && window.pixieSystem.bossFrontApp) {
                        const shaderEffect = window.applyBossDamageShader(this.currentSkill.boss_damage_overlay, window.pixieSystem.bossFrontApp);
                        if (shaderEffect) {
                            console.log("✅ Shader aplicado com sucesso no boss");
                        }
                    }
                } else if (isPixiEffect(this.currentSkill.boss_damage_overlay)) {
                    console.log("🎭 Aplicando efeito PixiJS no boss:", this.currentSkill.boss_damage_overlay);
                    playPixiEffect(this.currentSkill.boss_damage_overlay, 'boss', 'front', 'AttackPhaseSystem_BOSS_DAMAGE');
                }
            }
        }
        
        createProjectileEffect() {
            console.log("🎯 Criando efeito de projétil");
            // Implementação futura usando sistema PixiJS existente
            // Por enquanto, apenas placeholder
        }

        createEnergyBeamEffect() {
            console.log("⚡ Criando raio de energia");
            // Implementação futura usando sistema PixiJS existente
        }

        createDistantEffect() {
            console.log("🌩️ Criando efeito à distância");
            // Implementação futura usando sistema PixiJS existente
        }

        createAreaEffect() {
            console.log("💥 Criando efeito em área");
            // Implementação futura usando sistema PixiJS existente
        }

        applyDamageAndEffects() {
            // Aplicar transição temporária para o boss
            boss.style.transition = 'transform 0.3s ease-out, filter 0.3s ease-out';

            setTimeout(() => {
                // Resetar transição do boss
                boss.style.transition = 'transform 0.5s ease-out, opacity ease-out, filter 0.3s ease-out';
                
                setTimeout(() => {
                    const activeBackground = document.getElementById('background-default');
                    if (activeBackground) {
                        activeBackground.style.transformOrigin = 'center center';
                    }
                    battleArena.classList.remove('quick-cut-transition');
                }, 400);

                // Aplicar dano (reutilizar código original)
                this.calculateAndApplyDamage();

            }, 300);
        }

        calculateAndApplyDamage() {
            // Chama a função que contata o servidor. 
            // O servidor calculará o dano real e mostrará na tela.
            saveBossDamage(this.currentSkill, 0, false);

            // Aplica os efeitos visuais imediatos de impacto (shake/flash)
            boss.classList.add('screen-shake');

            const originalTransform = boss.style.transform;
            boss.style.transform = '';

            setTimeout(() => {
                boss.style.transform = originalTransform;
            }, 500);

            const smallBossHpBar = document.getElementById('small-boss-hp-bar');
            if (smallBossHpBar) {
                smallBossHpBar.classList.add('hp-damage');
                setTimeout(() => {
                    boss.classList.remove('screen-shake');
                    smallBossHpBar.classList.remove('hp-damage');
                    boss.style.transition = '';
                }, 500);
            } else {
                setTimeout(() => { 
                    boss.classList.remove('screen-shake'); 
                    boss.style.transition = '';
                }, 500);
            }
        }

        restorePlayerVisually() {
            // Garantir que o personagem seja visível novamente
            character.style.opacity = '1';
            
            // Aplicar animação de retorno
            applyCharacterAnimation('walk_return', 'walk-return-anim');
            
            // Obter duração da animação
            const animConfig = getCharacterAnimation('walk_return');
            const returnDuration = animConfig ? parseFloat(animConfig.duration) * 1000 : 300;
            
            // Restaurar estado original após animação
            setTimeout(() => {
                this.restorePlayerLayers();
                
                // Limpar vinheta
                cleanupAttackVignette();
                if (this.currentSkill.vignette && this.currentSkill.vignette.trim() !== "") {
                    console.log("🎭 VINHETA: Limpeza completa para", this.currentSkill.vignette);
                }
            }, returnDuration);
        }

        runPlayerReturn() {
            // Fazer personagem correr de volta
            character.style.opacity = '1';
            
            // Aplicar animação de corrida com flip horizontal
            applyCharacterAnimation('run', 'run-return-anim');
            
            // Aplicar flip horizontal a todas as camadas
            character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                layer.style.transform = 'scaleX(-1)';
            });
            
            // Animar volta à posição original
            character.style.transition = 'left 1.2s ease-out';
            character.style.left = '30%';
            
            setTimeout(() => {
                this.restorePlayerLayers();
            }, 1200);
        }

        landPlayerReturn() {
            // Animação de aterrissagem
            character.style.opacity = '1';
            
            const landElement = document.createElement('div');
            landElement.className = 'p1-land-return';
            landElement.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background-image: url('/static/game.data/p1/p1.land/p1.land.png');
                background-size: auto 100%;
                background-position: 0 0;
                animation: land-animation 0.8s steps(6) forwards;
                z-index: 26;
            `;
            
            // Adicionar animação se não existir
            if (!document.querySelector('#land-animation-style')) {
                const style = document.createElement('style');
                style.id = 'land-animation-style';
                style.textContent = `
                    @keyframes land-animation {
                        from { background-position: 0 0; }
                        to { background-position: -480px 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            character.appendChild(landElement);
            
            // Animar volta à posição original
            character.style.transition = 'transform 0.8s ease-out';
            character.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                this.restorePlayerLayers();
            }, 800);
        }

        restorePlayerLayers() {
            // Preservar canvas PixiJS
            const frontCanvas = character.querySelector('#character-fx-front');
            const backCanvas = character.querySelector('#character-fx-back');
            
            // Limpar todos os elementos exceto canvas
            character.querySelectorAll('*:not(#character-fx-front):not(#character-fx-back)').forEach(el => el.remove());
            
            // Aplicar animação idle
            restoreCharacterIdle();
            
            // Preservar canvas se existirem
            if (frontCanvas && !character.contains(frontCanvas)) character.appendChild(frontCanvas);
            if (backCanvas && !character.contains(backCanvas)) character.appendChild(backCanvas);
            
            // Atualizar referências globais dos FX layers
            const newFxLayerB = document.createElement('div');
            newFxLayerB.className = 'character-fx-layer fx-layer-behind';
            newFxLayerB.id = 'fx-layer-b';
            newFxLayerB.style.opacity = '0';
            
            const newFxLayerA = document.createElement('div');
            newFxLayerA.className = 'character-fx-layer fx-layer-front';
            newFxLayerA.id = 'fx-layer-a';
            newFxLayerA.style.opacity = '0';
            
            character.appendChild(newFxLayerB);
            character.appendChild(newFxLayerA);
            
            window.fxLayerA = newFxLayerA;
            window.fxLayerB = newFxLayerB;
            
            // Reset transitions
            character.style.transition = '';
            character.style.transform = '';
            
            console.log("Estado do personagem restaurado com sprites da classe");
        }
    }

    // Instância global do sistema de fases
    window.attackPhaseSystem = new AttackPhaseSystem();

// Executar sequência de QuickCut - NOVA VERSÃO MODULAR
function runQuickCutSequence(skill, fxPaths, prepDelay) {
    console.log(`Iniciando QuickCut Sequence MODULAR para Skill: ${skill.name}`);
    console.log("Sequência de ataque:", skill.attack_sequence);
    
    // Delegar para o sistema modular
    window.attackPhaseSystem.executeAttackSequence(skill, fxPaths, prepDelay);
}

// Calcular dano
function calculateDamage(skill) {
    return 0; // Não importa, backend calcula
}

function checkCritical(skill) {
    return false; // Não importa, backend calcula  
}

// Função para tratar animação de morte do boss
function handleBossDeathAnimation() {
    console.log("🎭 Iniciando animação de morte do boss");
    
    // Bloquear todas as ações
    gameState.inAction = true;
    
    // Obter nome do inimigo
    const enemyName = gameState.boss?.name || 'Inimigo Desconhecido';
    
    // Tocar áudio de vitória
    playSound('/static/game.data/sounds/chord.mp3', 0.8);
    
    // Criar animação de impacto de morte
    createDeathImpactAnimation();
    
    // Aplicar fade-out no boss
    applyBossFadeOut();
    
    // Criar e mostrar banner de vitória
    createVictoryBanner(enemyName);
    
    // Redirecionar após 4.5 segundos
    setTimeout(() => {
        console.log("🏠 Boss derrotado - indo para HUB");
        window.location.href = '/gamification';
    }, 4500);
}

// Criar animação de impacto de morte
function createDeathImpactAnimation() {
    console.log("💥 Criando animação de impacto de morte");
    
    // Obter posição do boss
    const bossRect = boss.getBoundingClientRect();
    const centerX = bossRect.left + (bossRect.width / 2);
    const centerY = bossRect.top + (bossRect.height / 2);
    
    // Criar elemento da animação
    const deathImpact = document.createElement('div');
    deathImpact.className = 'death-impact-animation';
    deathImpact.style.cssText = `
        position: fixed;
        left: ${centerX - 45}px;
        top: ${bossRect.bottom - 94.5}px;
        width: 90px;
        height: 94.5px;
        background-image: url('/static/game.data/fx/death-impact.png');
        background-size: 5400px 94.5px;
        background-position: 0 0;
        background-repeat: no-repeat;
        z-index: 9001;
        pointer-events: none;
        transform: scale(1.5);
        transform-origin: center bottom;
        animation: death-impact-frames-scaled 1.2s steps(60) forwards;
    `;
    
    document.body.appendChild(deathImpact);
    
    // Remover elemento após animação
    setTimeout(() => {
        if (deathImpact.parentNode) {
            deathImpact.remove();
        }
    }, 1200);
}

// Aplicar fade-out no boss
function applyBossFadeOut() {
    console.log("👻 Aplicando fade-out no boss");
    
    // Forçar boss invisível imediatamente e prevenir restauração
    boss.style.setProperty('opacity', '0', 'important');
    boss.style.setProperty('transition', 'opacity 1.2s ease-out', 'important');
    boss.classList.add('boss-defeated');
    
    // Garantir que permaneça invisível
    boss.style.visibility = 'hidden';
    
    console.log("Boss opacity após fade-out:", boss.style.opacity);
}

// Criar banner de vitória
function createVictoryBanner(enemyName) {
    console.log("🏆 Criando banner de vitória para:", enemyName);
    
    // Criar container do banner
    const bannerContainer = document.createElement('div');
    bannerContainer.className = 'victory-banner-container';
    bannerContainer.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9000;
        pointer-events: none;
        animation: victory-banner-scale 4.5s ease-out forwards;
    `;
    
    // Criar elemento do banner
    const banner = document.createElement('div');
    banner.className = 'victory-banner';
    banner.style.cssText = `
        width: 1800px;
        height: 450px;
        background-image: url('/static/game.data/win-banner.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: banner-glow-pulse 2s ease-in-out infinite;
    `;
    
    // Criar texto do banner (duas linhas)
    const bannerText = document.createElement('div');
    bannerText.className = 'victory-banner-text';
    bannerText.innerHTML = `${enemyName.toUpperCase()}<br>DERROTADO!`;
    
    // Calcular tamanho da fonte baseado no comprimento do nome
    const maxWidth = 350;
    let fontSize = 30;
    
    // Estimar largura do texto (aproximadamente 0.6 * fontSize * número de caracteres)
    const textWidth = enemyName.length * fontSize * 0.6;
    
    if (textWidth > maxWidth) {
        fontSize = Math.floor(maxWidth / (enemyName.length * 0.6));
        fontSize = Math.max(fontSize, 16); // Fonte mínima de 16px
    }
    
    bannerText.style.cssText = `
        font-family: 'Cinzel', serif;
        font-size: ${fontSize}px;
        font-weight: bold;
        color: #FFD700;
        text-shadow: 
            0 0 15px #FFD700,
            0 0 30px #FFD700,
            0 0 45px #FFD700,
            3px 3px 6px rgba(0, 0, 0, 0.8);
        text-align: center;
        line-height: 1.3;
        letter-spacing: 2px;
        max-width: ${maxWidth}px;
        position: relative;
        top: 25px;
    `;
    
    banner.appendChild(bannerText);
    bannerContainer.appendChild(banner);
    document.body.appendChild(bannerContainer);
    
    // Remover banner após 4.5 segundos
    setTimeout(() => {
        if (bannerContainer.parentNode) {
            bannerContainer.remove();
        }
    }, 4500);
}

// Função para testar animação de morte (apenas para desenvolvimento)
function testBossDeathAnimation() {
    console.log("🧪 TESTE: Executando animação de morte do boss");
    
    // Simular nome de inimigo para teste
    if (!gameState.boss) {
        gameState.boss = {};
    }
    gameState.boss.name = "Boss de Teste";
    
    // Executar animação
    handleBossDeathAnimation();
}

// Expor função de teste globalmente
window.testBossDeathAnimation = testBossDeathAnimation;

// FUNÇÕES para debug e desenvolvimento
function debugCharacterSystem() {
    const character = getCurrentPlayerCharacter();
    const container = document.getElementById('character');
    
    console.log('=== DEBUG SISTEMA DE PERSONAGENS ===');
    console.log('Personagem atual:', character);
    console.log('Data-character:', container?.getAttribute('data-character'));
    console.log('Data-animation:', container?.getAttribute('data-animation'));
    console.log('Camadas presentes:', container?.querySelectorAll('.character-sprite-layer').length);
    console.log('Animações disponíveis:', Object.keys(CHARACTER_ANIMATIONS[character] || {}));
    console.log('=====================================');
}

function testVladAnimations() {
    const animations = ['idle', 'run', 'bloodattack', 'power', 'special', 'ultimate'];
    let index = 0;
    
    function nextAnimation() {
        if (index < animations.length) {
            const anim = animations[index];
            console.log(`Testando animação: ${anim}`);
            applyCharacterAnimation(anim);
            index++;
            setTimeout(nextAnimation, 2000);
        } else {
            console.log('Teste concluído - voltando para idle');
            applyCharacterAnimation('idle');
        }
    }
    
    nextAnimation();
}

function updateDamageDisplay(correctDamage, isCritical) {
    // Remover marcador antigo se existir
    const oldDamageNumber = document.querySelector('.damage-number');
    if (oldDamageNumber) {
        oldDamageNumber.remove();
    }
    
    // Criar novo marcador com valor correto
    const damageNumber = document.createElement('div');
    damageNumber.classList.add('damage-number');
    if (isCritical) {
        damageNumber.classList.add('critical-hit');
        damageNumber.textContent = '❗' + correctDamage;
    } else {
        damageNumber.textContent = '-' + correctDamage;
    }
    
    // Posicionar sobre o boss
    const boss = document.getElementById('boss');
    const battleArena = document.getElementById('battle-arena');
    damageNumber.style.left = `${boss.offsetLeft + boss.offsetWidth / 2}px`;
    damageNumber.style.top = `${boss.offsetTop + boss.offsetHeight / 3}px`;
    damageNumber.style.zIndex = '60';
    battleArena.appendChild(damageNumber);

    // Remover após animação
    setTimeout(() => { damageNumber.remove(); }, 2000);
}

function saveBossDamage(skill, damage, isCritical) {
    console.log(`Enviando dano de ${damage} para o servidor...`);
    
    // Logar detalhes do ataque antes de enviar ao servidor
    logAttackDetails(skill, damage, isCritical);
    
    // Garantir que todos os valores são do tipo correto
    const skillId = parseInt(skill.id) || 1;
    const pointsCost = parseInt(skill.points_cost) || parseInt(skill.pointsCost) || 1;
    // Garantir que o damage_modifier é sempre um número válido
    let damageModifier = 1.0;
    if (skill.damageModifier && !isNaN(parseFloat(skill.damageModifier))) {
        damageModifier = parseFloat(skill.damageModifier);
    }
    
    // Preparar os dados para enviar ao servidor - CORRIGIDO para enviar valores reais
    const requestData = {
        attack_type: 'basic',
        skill_id: skillId,
        damage_modifier: damageModifier,
    };
    
    console.log("🔍 DADOS ENVIADOS PARA API:", requestData)
    console.log("Enviando dados para o servidor:", requestData);
    
    // Fazer chamada AJAX para salvar o dano
    fetch('/gamification/damage_boss', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error("Resposta de erro do servidor:", text);
                throw new Error(`Erro na resposta do servidor: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Resposta do servidor após aplicar dano:", data);
        console.log("🔍 DANO RETORNADO PELA API:", data.damage);
        
        if (data.success) {
            // ===== INÍCIO DA MODIFICAÇÃO =====

            // 1. MOVIDO: Disparar efeitos de crítico SOMENTE se o servidor confirmar
            if (data.is_critical) {
                triggerCriticalEffects();
            }

            // 2. Esta função já existia e mostra o dano correto
            updateDamageDisplay(data.damage, data.is_critical);
            
            // ===== FIM DA MODIFICAÇÃO =====

            // Acumular dano total da batalha
            window.totalBattleDamage += data.damage;
            console.log("🔍 DANO TOTAL ACUMULADO:", window.totalBattleDamage);
            // Atualizar o gameState diretamente da resposta em vez de fazer nova chamada
            gameState.boss.hp = data.boss_hp;
            gameState.boss.maxHp = data.boss_max_hp;
            gameState.player.hp = data.player_hp;
            gameState.player.maxHp = data.player_max_hp;
            gameState.player.barrier = data.player_barrier;

            // Atualizar energia do jogador
            if (data.player_energy !== undefined) {
                gameState.player.energy = data.player_energy;
                gameState.player.maxEnergy = data.player_max_energy || 10;
                
                // Animar consumo de energia
                if (typeof animateEnergyConsumption === 'function') {
                    animateEnergyConsumption();
                }
                
                console.log(`⚡ Energia consumida! Restante: ${data.player_energy}/${data.player_max_energy}`);

                // Atualizar disponibilidade dos botões após consumo
                if (typeof updateAttackButtonsEnergyAvailability === 'function') {
                    updateAttackButtonsEnergyAvailability();
                }
            }
            
            // Atualizar elementos ocultos no DOM
            document.getElementById('boss_hp').innerText = gameState.boss.hp;
            document.getElementById('boss_max_hp').innerText = gameState.boss.max_hp;
            document.getElementById('player_hp').innerText = gameState.player.hp;
            document.getElementById('player_max_hp').innerText = gameState.player.maxHp;
            
            // Atualizar as estatísticas visuais sem fazer nova chamada ao servidor
            updateStats();

            // ===== INÍCIO DA MODIFICAÇÃO =====

            // 3. MOVIDO: Mostrar mensagem de resultado com dados reais do servidor
            showAttackResultMessage(skill, data.damage, data.is_critical);

            // ===== FIM DA MODIFICAÇÃO =====
            
            // ===== REPOPULAR SKILLS PARA ATUALIZAR DISPONIBILIDADE =====
            if (data.should_refresh_skills && typeof populateAttackOptions === 'function') {
                populateAttackOptions();
                console.log('🔄 Skills repopuladas após ataque');
            }

            // Processar mensagens extras (como buffs ativados)
            if (data.extra_messages && data.extra_messages.length > 0) {
                showExtraEffectsMessages(data.extra_messages);
            }
            
            // Verificar se o boss foi derrotado
            if (data.boss_defeated) {
                // ✅ DEBUG e dados completos
                console.log("📊 BATTLE DEBUG - gameState.boss:", gameState.boss);
                console.log("📊 BATTLE DEBUG - damage:", damage);
                console.log("📊 BATTLE DEBUG - data.player_hp:", data.player_hp);
                console.log("📊 BATTLE DEBUG - gameState.player.maxHp:", gameState.player.maxHp);
                
                // ✅ Marcar vitória no localStorage para o hub processar
                localStorage.setItem('lastVictoryTime', Date.now());
                localStorage.setItem('victoryData', JSON.stringify({
                    bossDefeated: true,
                    damageDealt: window.totalBattleDamage || 0,
                    enemyName: gameState.boss?.name || 'Inimigo Desconhecido',
                    expGained: data.exp_reward || 25,
                    crystalsGained: data.crystals_gained || 0,
                    goldGained: data.gold_gained || 0,
                    hourglassesGained: data.hourglasses_gained || 0,
                    rewardType: data.reward_type || 'crystals',
                    rewardIcon: data.reward_icon || 'crystal.png',
                    playerDamageTaken: gameState.player.maxHp - data.player_hp,
                    relic_bonus_messages: data.relic_bonus_messages || '',  // ← ADICIONAR ESTA LINHA
                    timestamp: Date.now()
                }));

                // Animar restauração de energia após vitória
                if (typeof animateEnergyRestoration === 'function') {
                    animateEnergyRestoration();
                }
                
                console.log("📊 BATTLE DEBUG - Dados salvos:", JSON.parse(localStorage.getItem('victoryData')));
                console.log("🎉 Vitória registrada no localStorage!");
                
                // Esconder mensagem de batalha atual
                if (typeof battleMessage !== 'undefined') {
                    battleMessage.classList.remove('visible');
                }
                
                // Chamar animação de morte do boss
                handleBossDeathAnimation();
            }
        } else {
            console.error("Erro ao aplicar dano:", data.message);
            showBattleMessage(data.message || "Erro ao aplicar dano");
        }
    })
    .catch(error => {
        console.error("Erro ao salvar dano do boss:", error);
        showBattleMessage("Erro de comunicação com o servidor. Tente novamente.");
        
        // Criar um fallback para continuar o jogo em caso de erro
        console.log("Aplicando dano localmente como fallback");
        gameState.boss.hp = Math.max(0, gameState.boss.hp - damage);
        
        // Atualizar elementos ocultos no DOM
        document.getElementById('boss_hp').innerText = gameState.boss.hp;
        
        // Atualizar interface
        updateStats();
        
        // Liberar o estado de ação em caso de erro
        gameState.inAction = false;
    });
}

// ===== SISTEMA DE ANIMAÇÕES DE INIMIGOS =====

function playHitAnimation(hitType, callback) {
    console.log(`🎯 INICIANDO playHitAnimation: ${hitType}`);
    
    // Criar elemento de animação
    const hitElement = document.createElement('div');
    hitElement.className = `hit-animation ${hitType}`;
    
    console.log(`🎯 Elemento criado com classes: ${hitElement.className}`);
    
    // Posicionar sobre o personagem
    const character = document.getElementById('character');
    if (character) {
        console.log(`🎯 Character encontrado, adicionando hit element`);
        character.appendChild(hitElement);
        
        // DEBUG: Verificar se elemento foi adicionado
        const addedElement = character.querySelector(`.hit-animation.${hitType}`);
        console.log(`🎯 Elemento adicionado?`, !!addedElement);
        
        // Iniciar animação
        setTimeout(() => {
            console.log(`🎯 Adicionando classe 'playing' ao hit element`);
            hitElement.classList.add('playing');
            
            // DEBUG: Verificar classes finais
            console.log(`🎯 Classes finais do elemento:`, hitElement.className);
            console.log(`🎯 Estilos computados:`, window.getComputedStyle(hitElement).opacity);
        }, 50);
        
        // Remover elemento após animação (1 segundo)
        setTimeout(() => {
            if (hitElement.parentNode) {
                hitElement.parentNode.removeChild(hitElement);
            }
            if (callback) callback();
        }, 1000);
    } else {
        console.error("Elemento character não encontrado para hit animation");
        if (callback) callback();
    }
}

function playSmokeoutAnimation(callback) {
    console.log("Tocando animação de smokeout");
    
    const boss = document.getElementById('boss');
    if (!boss) {
        console.error("Elemento boss não encontrado para smokeout animation");
        if (callback) callback();
        return;
    }
    
    // Criar elemento de animação smokeout
    const smokeoutElement = document.createElement('div');
    smokeoutElement.className = 'smokeout-animation';
    
    // Adicionar ao boss
    boss.appendChild(smokeoutElement);
    
    // Iniciar animação
    setTimeout(() => {
        smokeoutElement.classList.add('playing');
    }, 50);
    
    // Esconder boss gradualmente durante a animação
    setTimeout(() => {
        boss.style.opacity = '0.5';
    }, 200);
    
    setTimeout(() => {
        boss.style.opacity = '0.1';
    }, 400);
    
    // Boss desaparece completamente e remove smokeout
    setTimeout(() => {
        boss.style.opacity = '0';
        if (smokeoutElement.parentNode) {
            smokeoutElement.parentNode.removeChild(smokeoutElement);
        }
        if (callback) callback();
    }, 450);
}

function restoreBossVisibility() {
    console.log("Restaurando visibilidade do boss");
    
    const boss = document.getElementById('boss');
    if (boss) {
        boss.style.transition = 'opacity 0.5s ease-in-out';
        boss.style.opacity = '1';
        
        // Remover transition após restauração
        setTimeout(() => {
            boss.style.transition = '';
        }, 500);
    }
}

function playCharacterDamageAnimation(damageType, callback) {
    console.log(`Tocando animação de dano do personagem: ${damageType}`);

    // DEBUG: Ver configuração sendo usada
    const currentCharacter = getCurrentPlayerCharacter();
    const config = CHARACTER_ANIMATIONS[currentCharacter.toLowerCase()];
    if (config && config[damageType]) {
        console.log(`🔍 Configuração encontrada:`, config[damageType]);
        console.log(`🔍 Duração: ${config[damageType].duration}s`);
        console.log(`🔍 Frames: ${config[damageType].frames}`);
    } else {
        console.log(`🔍 PROBLEMA: Configuração não encontrada para ${currentCharacter}.${damageType}`);
    }
    
    // Usar sistema existente de animações de personagem
    if (typeof applyCharacterAnimation === 'function') {
        applyCharacterAnimation(damageType, `character-${damageType}-anim`);
        
        // Obter duração da animação baseada no tipo
        let duration = 1100; // damage padrão
        if (damageType === 'deathdamage') {
            duration = 4200;
        } else if (damageType === 'dodge') {
            duration = 1300;
        }
        
        // Callback após duração da animação
        setTimeout(() => {
            if (damageType !== 'deathdamage') {
                // Voltar para idle (exceto se morreu)
                if (typeof restoreCharacterIdle === 'function') {
                    restoreCharacterIdle();
                }
            }
            if (callback) callback();
        }, duration);
        
    } else {
        console.error("Sistema de animações de personagem não encontrado");
        if (callback) callback();
    }
}

// ===== FLUXO COMPLETO DE ATAQUES DO INIMIGO =====

async function executeEnemyAttackSequence() {
    console.log("Iniciando sequência de ataques do inimigo (smokeout já foi feito)");
    
    try {
        // Smokeout já foi executado na view anterior, pular direto para configuração da enemy-attack-view
        console.log("1. Configurando enemy-attack-view (smokeout já executado)");
        gameState.enemyAttackView = true;
        gameState.zoomedView = false;
        gameState.characterView = false;
        gameState.bossView = false;
        
        // Aplicar a enemy-attack-view corretamente
        battleArena.classList.add('enemy-attack-view');
        battleArena.classList.remove('zoom-view', 'character-view', 'boss-view');
        
        // Ativar vinheta mais forte
        const enemyAttackVignette = document.getElementById('enemy-attack-vignette');
        if (enemyAttackVignette) {
            enemyAttackVignette.classList.add('visible');
        }

        // Iniciar música de enemy attack
        if (typeof startEnemyAttackMusic === 'function') {
            startEnemyAttackMusic();
        }
        
        // Esconder árvores e cenário
        const treeContainer = document.getElementById('tree-paralax-container');
        if (treeContainer) {
            treeContainer.style.opacity = '0';
        }

        // Aplicar background específico da enemy-attack-view
        const bgDefault = document.getElementById('background-default');
        if (bgDefault) {
            bgDefault.style.backgroundImage = "url('/static/game.data/bgf.png')";
            bgDefault.style.backgroundSize = 'cover';
            bgDefault.style.backgroundPosition = 'center';
        }

        // Esconder o inimigo nesta view
        const bossEl = document.getElementById('boss');
        if (bossEl) {
            bossEl.style.opacity = '0';
        }
        
        // Centralizar personagem e resetar orientação
        const character = document.getElementById('character');
        if (character) {
            character.style.transform = 'scaleX(1)'; // Reset flip horizontal
            character.querySelectorAll('.character-sprite-layer').forEach(layer => {
                layer.style.transform = 'scaleX(1)'; // Reset flip em todas as camadas
            });
        }
        
        // Aguardar estabilização da nova view
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("3. Iniciando loop de ataques");
        // Loop de ataques
        await executeAttackLoop();
        
        console.log("4. Finalizando sequência");
        // CORREÇÃO: Restaurar estado SEM loop
        await handleSequenceEnd();
        
    } catch (error) {
        console.error("Erro na sequência de ataques:", error);
        // Restaurar estado em caso de erro
        gameState.inAction = false;
        restoreToInitialState();
    }
}

async function executeAttackLoop() {
    console.log("Iniciando loop de ataques");
    
    while (true) {
        // Obter status atual
        const response = await fetch('/gamification/enemy_attack_status');
        const statusData = await response.json();
        
        const hasAnyCharges = statusData.status.charges_count > 0 || 
                            (statusData.status.action_queue && statusData.status.action_queue.length > 0);

        if (!statusData.success || !hasAnyCharges) {
            console.log("Sem mais cargas de ataque, finalizando loop");
            
            // 🔄 REABILITAR BOTÃO DE TERMINAR TURNO
            if (typeof enableEndTurnButton === 'function') {
                enableEndTurnButton();
                console.log("✅ Botão de terminar turno reabilitado após fim das ações do inimigo");
            }
            
            break;
        }
        
        console.log(`Executando ataque. Cargas restantes: ${statusData.status.charges_count}`);
        
        // Intervalo de 2s antes do ataque
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Executar um ataque
        const attackResult = await executeSingleEnemyAttack();
        
        // Se jogador morreu, parar loop
        if (attackResult && attackResult.player_died) {
            console.log("Jogador morreu, parando loop de ataques");
            await handlePlayerDeath();
            return;
        }
        
        // Intervalo de 2s após o ataque
        await new Promise(resolve => setTimeout(resolve, 1200));
    }
}

async function executeSingleEnemyAttack() {
    console.log("Executando ataque individual");
    // 🔍 DEBUG: Antes da chamada para o backend
    console.log("🔍 DEBUG: Fazendo chamada para /gamification/execute_enemy_attack");
    
    try {
        // Fazer chamada para backend
        const response = await fetch('/gamification/execute_enemy_attack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        // 🔍 DEBUG: Resposta do backend
        console.log("🔍 DEBUG: Resposta do execute_enemy_attack:", JSON.stringify(result, null, 2));
        
        if (result.success) {
            // Remover carga do HUD visualmente
            removeChargeFromHUD();

            // NOVA LÓGICA: Verificar se é qualquer tipo de skill ou ataque normal
            if (result.skill_id && (result.is_skill_attack || result.is_buff_skill || result.is_debuff_skill)) {
                console.log(`Executando skill ID ${result.skill_id} - Tipo: ${result.is_skill_attack ? 'attack' : result.is_buff_skill ? 'buff' : 'debuff'}`);
                
                // SKILLS DE ATAQUE: afetam o personagem
                if (result.is_skill_attack) {
                    // Determinar animação do personagem baseada no resultado
                    let characterAnimation = 'damage';
                    if (result.attack_result === 'dodged') {
                        characterAnimation = 'dodge';
                        playDodgeSound();
                    } else if (result.attack_result === 'death') {
                        characterAnimation = 'deathdamage';
                    }
                    
                    // Aplicar animação do personagem
                    playCharacterDamageAnimation(characterAnimation);
                    
                    // Sons da skill
                    if (result.activation_sound) {
                        playSound(result.activation_sound, 0.6);
                    }
                    
                    setTimeout(() => {
                        if (result.execution_sound) {
                            playSound(result.execution_sound, 0.7);
                        }
                        
                        // Aplicar efeitos visuais da skill no personagem
                        if (result.player_fx_layer_a) {
                            const sizeData = result.action_consumed?.data?.player_fx_layer_a_size || result.player_fx_layer_a_size;
                            playSkillAttackAnimationOnPlayer('fx-layer-a', result.player_fx_layer_a, result.player_fx_layer_a_frames || 30, sizeData);
                        }
                        if (result.player_fx_layer_b) {
                            const sizeData = result.action_consumed?.data?.player_fx_layer_b_size || result.player_fx_layer_b_size;
                            playSkillAttackAnimationOnPlayer('fx-layer-b', result.player_fx_layer_b, result.player_fx_layer_b_frames || 30, sizeData);
                        }
                    }, 300);
                }
                // SKILLS DE BUFF: afetam o inimigo
                else if (result.is_buff_skill) {
                    console.log(`Executando skill de buff ID ${result.skill_id}`);
                    
                    // Sons da skill
                    if (result.activation_sound) {
                        playSound(result.activation_sound, 0.6);
                    }
                    
                    setTimeout(() => {
                        if (result.execution_sound) {
                            playSound(result.execution_sound, 0.7);
                        }
                        
                        // Aplicar efeito visual no inimigo
                        if (result.enemy_skill_fx) {
                            playEnemySkillFX(result.enemy_skill_fx, result.enemy_skill_fx_frames || 12, result.enemy_skill_fx_size);
                        }
                    }, 300);
                }
                // SKILLS DE DEBUFF: afetam o inimigo E o personagem
                else if (result.is_debuff_skill) {
                    console.log(`Executando skill de debuff ID ${result.skill_id}`);
                    
                    // Sons da skill
                    if (result.activation_sound) {
                        playSound(result.activation_sound, 0.6);
                    }
                    
                    setTimeout(() => {
                        if (result.execution_sound) {
                            playSound(result.execution_sound, 0.7);
                        }
                        
                        // Aplicar efeito visual no inimigo (cast)
                        if (result.enemy_skill_fx) {
                            playEnemySkillFX(result.enemy_skill_fx, result.enemy_skill_fx_frames || 12, result.enemy_skill_fx_size);
                        }
                        
                        // Aplicar efeito visual no personagem (debuff)
                        if (result.player_fx_layer_a) {
                            const sizeData = result.action_consumed?.data?.player_fx_layer_a_size || result.player_fx_layer_a_size;
                            playPlayerSkillFX('fx-layer-a', result.player_fx_layer_a, result.player_fx_layer_a_frames || 12, sizeData);
                        }
                        if (result.player_fx_layer_b) {
                            const sizeData = result.action_consumed?.data?.player_fx_layer_b_size || result.player_fx_layer_b_size;
                            playPlayerSkillFX('fx-layer-b', result.player_fx_layer_b, result.player_fx_layer_b_frames || 12, sizeData);
                        }
                    }, 300);
                }
                
            } else {
                // LÓGICA ORIGINAL: Ataque normal
                // Determinar animação do personagem baseada no resultado
                let characterAnimation = 'damage';
                if (result.attack_result === 'dodged') {
                    characterAnimation = 'dodge';
                    playDodgeSound();
                } else if (result.attack_result === 'death') {
                    characterAnimation = 'deathdamage';
                }

                // Aplicar animação do personagem
                playCharacterDamageAnimation(characterAnimation);

                // Tocar som do ataque normal (APENAS se não foi esquiva)
                if (result.attack_sfx && result.attack_result !== 'dodged') {
                    const soundPath = result.attack_sfx.startsWith('/static/') ? result.attack_sfx : `/static/game.data/sounds/${result.attack_sfx}`;
                    playSound(soundPath, 0.8);
                }

                // Aguardar um frame para o personagem ser recriado, então adicionar hit
                setTimeout(() => {
                    const hitAnimation = result.hit_animation || 'hit1';
                    playHitAnimation(hitAnimation, () => {
                        console.log("Animação de hit concluída");
                    });
                }, 100);
            }

            // Aguardar tempo suficiente para ambas as animações
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            // Atualizar HP na interface e mostrar marcador (COMUM PARA AMBOS)
            if (result.player_hp !== undefined) {
                const oldHp = gameState.player.hp;
                gameState.player.hp = result.player_hp;
                
                // <-- MUDANÇA AQUI: Atualizar o gameState da barreira
                if (result.player_barrier !== undefined) {
                    gameState.player.barrier = result.player_barrier;
                }
                
                if (result.attack_result === 'dodged') {
                    showPlayerDamageMarker(0, true);
                } else if (result.damage_dealt > 0) {
                    showPlayerDamageMarker(result.damage_dealt, false);
                }
                
                updateStats(); // <-- Isso agora vai ler a barreira = 0 e corrigir o CSS
            }
            
            return result;
        } else {
            console.error("🔍 DEBUG: ERRO do backend - result.success = false");
            console.error("🔍 DEBUG: Mensagem de erro:", result.message);
            console.error("🔍 DEBUG: Resultado completo:", JSON.stringify(result, null, 2));
            return null;
        }
        
    } catch (error) {
        console.error("Erro na comunicação do ataque:", error);
        return null;
    }
}

function playPlayerSkillAttackFX(layerId, fxImagePath, frames) {
    console.log(`Tocando efeito de skill de ataque: ${layerId} - ${fxImagePath}`);
    
    const layer = document.getElementById(layerId);
    if (!layer) return;
    
    // Criar elemento de efeito
    const fxElement = document.createElement('div');
    fxElement.className = 'skill-attack-fx thunderbolt';
    fxElement.style.backgroundImage = `url('${fxImagePath}')`;
    
    // Adicionar à layer
    layer.appendChild(fxElement);
    
    // Iniciar animação
    setTimeout(() => {
        fxElement.classList.add('playing');
    }, 10);
    
    // Remover após animação
    setTimeout(() => {
        if (fxElement.parentNode) {
            fxElement.parentNode.removeChild(fxElement);
        }
    }, 1000);
}

function removeChargeFromHUD() {
    console.log("Removendo carga do HUD com animação");
    
    const containerElement = document.getElementById('charges-container');
    if (!containerElement) return;
    
    // Encontrar PRIMEIRO ícone da fila (seja attack ou skill)
    const firstIcon = containerElement.querySelector('.attack-charge-icon, .skill-charge-icon');
    if (firstIcon) {
        // Animação de remoção
        firstIcon.style.transition = 'all 0.5s ease-out';
        firstIcon.style.transform = 'scale(0) rotate(180deg)';
        firstIcon.style.opacity = '0';
        
        // Remover elemento após animação
        setTimeout(() => {
            if (firstIcon.parentNode) {
                firstIcon.parentNode.removeChild(firstIcon);
            }
        }, 500);
    }
}

function showPlayerDamageMarker(damage, isDodge = false) {
    const character = document.getElementById('character');
    if (!character) return;
    
    // Criar elemento do marcador
    const damageMarker = document.createElement('div');
    damageMarker.className = 'player-damage-marker';
    
    if (isDodge) {
        damageMarker.textContent = 'Esquiva!';
        damageMarker.style.color = '#00ff00';
        damageMarker.style.textShadow = '0 0 10px #00ff00, 2px 2px 4px rgba(0,0,0,0.8)';
    } else {
        damageMarker.textContent = `-${damage}`;
        damageMarker.style.color = '#ff4444';
        damageMarker.style.textShadow = '0 0 10px #ff4444, 2px 2px 4px rgba(0,0,0,0.8)';
    }
    
    // Posicionamento
    const characterRect = character.getBoundingClientRect();
    damageMarker.style.cssText += `
        position: fixed;
        left: ${characterRect.left + characterRect.width / 2}px;
        top: ${characterRect.top}px;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 24px;
        font-weight: bold;
        z-index: 200;
        pointer-events: none;
        animation: player-damage-float 2s ease-out forwards;
    `;
    
    document.body.appendChild(damageMarker);
    
    // Remover após animação
    setTimeout(() => {
        if (damageMarker.parentNode) {
            damageMarker.remove();
        }
    }, 2000);
}

async function handlePlayerDeath() {
    console.log("Processando morte do jogador");
    
    // Aguardar animação de morte terminar (3.4 segundos)
    await new Promise(resolve => setTimeout(resolve, 3400));
    
    // Personagem desaparece
    const character = document.getElementById('character');
    if (character) {
        character.style.opacity = '0';
    }
    
    // Mostrar tela de derrota COM BOTÃO
    showDefeatScreen();
    
    // Tocar som de derrota
    playDefeatSound();
}

function showDefeatScreen() {
    console.log("Mostrando tela de derrota com botão");
    
    const defeatOverlay = document.getElementById('defeat-overlay');
    if (defeatOverlay) {
        // Remover qualquer botão existente
        const existingButton = defeatOverlay.querySelector('.continue-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Criar botão de continuar
        const continueButton = document.createElement('button');
        continueButton.className = 'continue-button';
        continueButton.textContent = 'Continuar';
        continueButton.style.cssText = `
            background: linear-gradient(145deg, #8b0000, #660000);
            border: 2px solid #ff6b6b;
            color: white;
            padding: 15px 30px;
            font-size: 1.2em;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.3s ease;
        `;
        
        // Event listener para o botão
        continueButton.addEventListener('click', function() {
            console.log("Botão continuar clicado - redirecionando para escolha de personagem");
            window.location.href = '/choose-character?from=death';
        });
        
        // Efeito hover no botão
        continueButton.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(145deg, #a00000, #8b0000)';
            this.style.boxShadow = '0 0 20px rgba(255,107,107,0.6)';
            this.style.transform = 'translateY(-2px)';
        });
        
        continueButton.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(145deg, #8b0000, #660000)';
            this.style.boxShadow = 'none';
            this.style.transform = 'translateY(0)';
        });
        
        // Adicionar botão ao overlay
        defeatOverlay.appendChild(continueButton);
        
        // Mostrar overlay
        defeatOverlay.classList.add('visible');
    }
}

async function handleSequenceEnd() {
    console.log("Finalizando sequência de ataques");
    
    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // CORREÇÃO: Não usar toggleEnemyAttackView() - fazer restauração manual
    console.log("Restaurando para tela inicial...");
    
    // Parar música de enemy attack
    if (typeof stopEnemyAttackMusic === 'function') {
        stopEnemyAttackMusic();
    }
    
    // Remover a vinheta
    const enemyAttackVignette = document.getElementById('enemy-attack-vignette');
    if (enemyAttackVignette) {
        enemyAttackVignette.classList.remove('visible');
    }
    
    // Mostrar árvores e cenário novamente
    const treeContainer = document.getElementById('tree-paralax-container');
    if (treeContainer) {
        treeContainer.style.opacity = '1';
    }
    
    // CORREÇÃO: Restauração completa para tela inicial
    await restoreToInitialState();
}

// ===== SISTEMA DE EXECUÇÃO DE SKILLS =====

async function executeBuffDebuffSkillsSequence() {
    console.log("🔮 Iniciando sequência de skills de buff/debuff");
    
    try {
        // Mostrar indicador visual
        showSkillExecutionIndicator("O inimigo está executando uma habilidade...");
        
        // Desabilitar cliques durante execução
        disableUserInput(true);
        
        // Fazer requisição para executar skills
        const response = await fetch('/gamification/execute_buff_debuff_skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.executed_skills && data.executed_skills.length > 0) {
            // Executar cada skill com intervalo
            for (let i = 0; i < data.executed_skills.length; i++) {
                const skill = data.executed_skills[i];
                await executeSkillAnimation(skill);
                
                // Aguardar intervalo entre skills (exceto na última)
                if (i < data.executed_skills.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Atualizar buffs ativos do inimigo
            updateEnemyActiveBuffs();
        }
        
        // Esconder indicador
        hideSkillExecutionIndicator();
        
        // Reabilitar input após delay
        setTimeout(() => {
            disableUserInput(false);
        }, 1000);

        // Atualizar HUD de cargas após executar buff/debuff
        if (typeof updateChargesHUD === 'function') {
            setTimeout(() => {
                updateChargesHUD();
            }, 800);
        }
        
        // ===== VERIFICAR SE TURNO DO INIMIGO ACABOU =====
        console.log('🔍 Verificando se há mais ações do inimigo neste turno...');
        
        // Aguardar um pouco para garantir que HUD atualizou
        setTimeout(async () => {
            if (typeof checkAndEndEnemyTurnIfComplete === 'function') {
                const turnEnded = await checkAndEndEnemyTurnIfComplete();
                if (turnEnded) {
                    console.log('✅ Turno do inimigo encerrado automaticamente (sem ataques restantes)');
                } else {
                    console.log('⚔️ Inimigo ainda tem ataques neste turno');
                }
            }
        }, 1500);
        
        return data.success;
        
    } catch (error) {
        console.error("Erro ao executar skills de buff/debuff:", error);
        hideSkillExecutionIndicator();
        disableUserInput(false);
        return false;
    }
}

async function executeSkillAnimation(skill) {
    console.log(`🎭 Executando animação da skill ${skill.skill_id} (${skill.type})`);
    console.log("🔍 SKILL DEBUG - skill completa:", skill);
    console.log("🔍 SKILL DEBUG - enemy_skill_fx_size:", skill.enemy_skill_fx_size);
    console.log("🔍 SKILL DEBUG - player_fx_layer_a_size:", skill.player_fx_layer_a_size);
    console.log("🔍 SKILL DEBUG - player_fx_layer_a_frames:", skill.player_fx_layer_a_frames);
    
    // SISTEMA MODULAR: Carregamento dinâmico dos dados do JSON
    console.log("🔧 Sistema modular - carregando dados do JSON...");

    // Tentar carregar dados do JSON se backend não enviou
    if ((!skill.enemy_skill_fx_size && skill.enemy_skill_fx) || 
        (!skill.player_fx_layer_a_size && skill.player_fx_layer_a) ||
        (!skill.enemy_skill_fx_frames && skill.enemy_skill_fx) ||
        (!skill.player_fx_layer_a_frames && skill.player_fx_layer_a)) {
        
        console.log(`📚 Backend não enviou dados completos para skill ${skill.skill_id}, carregando do JSON...`);
        
        try {
            // Carregar dados do JSON dinamicamente
            const response = await fetch('/static/game.data/enemy_skills_data.json');
            const skillsData = await response.json();
            
            // Procurar skill em todas as categorias
            let jsonSkillData = null;
            
            // Verificar em attack_skills
            if (skillsData.attack_skills && skillsData.attack_skills[skill.skill_id]) {
                jsonSkillData = skillsData.attack_skills[skill.skill_id];
                console.log(`📖 Skill ${skill.skill_id} encontrada em attack_skills`);
            }
            // Verificar em buff_skills
            else if (skillsData.buff_skills && skillsData.buff_skills[skill.skill_id]) {
                jsonSkillData = skillsData.buff_skills[skill.skill_id];
                console.log(`📖 Skill ${skill.skill_id} encontrada em buff_skills`);
            }
            // Verificar em debuff_skills
            else if (skillsData.debuff_skills && skillsData.debuff_skills[skill.skill_id]) {
                jsonSkillData = skillsData.debuff_skills[skill.skill_id];
                console.log(`📖 Skill ${skill.skill_id} encontrada em debuff_skills`);
            }
            
            if (jsonSkillData) {
                // Aplicar dados do JSON que estão faltando
                if (!skill.enemy_skill_fx_size && jsonSkillData.enemy_skill_fx_size) {
                    skill.enemy_skill_fx_size = jsonSkillData.enemy_skill_fx_size;
                    console.log(`🔧 JSON aplicado - enemy_skill_fx_size: ${skill.enemy_skill_fx_size}`);
                }
                if (!skill.enemy_skill_fx_frames && jsonSkillData.enemy_skill_fx_frames) {
                    skill.enemy_skill_fx_frames = jsonSkillData.enemy_skill_fx_frames;
                    console.log(`🔧 JSON aplicado - enemy_skill_fx_frames: ${skill.enemy_skill_fx_frames}`);
                }
                if (!skill.player_fx_layer_a_size && jsonSkillData.player_fx_layer_a_size) {
                    skill.player_fx_layer_a_size = jsonSkillData.player_fx_layer_a_size;
                    console.log(`🔧 JSON aplicado - player_fx_layer_a_size: ${skill.player_fx_layer_a_size}`);
                }
                if (!skill.player_fx_layer_a_frames && jsonSkillData.player_fx_layer_a_frames) {
                    skill.player_fx_layer_a_frames = jsonSkillData.player_fx_layer_a_frames;
                    console.log(`🔧 JSON aplicado - player_fx_layer_a_frames: ${skill.player_fx_layer_a_frames}`);
                }
                if (!skill.player_fx_layer_b_size && jsonSkillData.player_fx_layer_b_size) {
                    skill.player_fx_layer_b_size = jsonSkillData.player_fx_layer_b_size;
                    console.log(`🔧 JSON aplicado - player_fx_layer_b_size: ${skill.player_fx_layer_b_size}`);
                }
                if (!skill.player_fx_layer_b_frames && jsonSkillData.player_fx_layer_b_frames) {
                    skill.player_fx_layer_b_frames = jsonSkillData.player_fx_layer_b_frames;
                    console.log(`🔧 JSON aplicado - player_fx_layer_b_frames: ${skill.player_fx_layer_b_frames}`);
                }
                
                console.log(`✅ Dados carregados do JSON para skill ${skill.skill_id}`);
            } else {
                console.warn(`⚠️ Skill ${skill.skill_id} não encontrada no JSON - usando apenas dados do backend`);
            }
            
        } catch (error) {
            console.error("❌ Erro ao carregar enemy_skills_data.json:", error);
            console.log("⚠️ Usando apenas dados do backend");
        }
    } else {
        console.log(`✅ Backend enviou todos os dados para skill ${skill.skill_id}`);
    }

    // Validação final
    if (skill.enemy_skill_fx && (!skill.enemy_skill_fx_size || !skill.enemy_skill_fx_frames)) {
        console.error(`❌ ERRO CRÍTICO: Skill ${skill.skill_id} ainda não tem dados completos para enemy_skill_fx`);
        console.error("Dados faltando:", {
            enemy_skill_fx_size: skill.enemy_skill_fx_size,
            enemy_skill_fx_frames: skill.enemy_skill_fx_frames
        });
        return;
    }

    if (skill.player_fx_layer_a && (!skill.player_fx_layer_a_size || !skill.player_fx_layer_a_frames)) {
        console.error(`❌ ERRO CRÍTICO: Skill ${skill.skill_id} ainda não tem dados completos para player_fx_layer_a`);
        console.error("Dados faltando:", {
            player_fx_layer_a_size: skill.player_fx_layer_a_size,
            player_fx_layer_a_frames: skill.player_fx_layer_a_frames
        });
        return;
    }

    console.log("✅ Sistema modular - todos os dados validados e prontos");
    
    return new Promise((resolve) => {
        // 1. Tocar som de ativação
        if (skill.activation_sound) {
            playSound(skill.activation_sound, 0.6);
        }
        
        // 2. Para BUFF/DEBUFF: Mostrar efeito no inimigo IMEDIATAMENTE
        let enemyAnimationDuration = 0;
        if ((skill.type === 'buff' || skill.type === 'debuff') && skill.enemy_skill_fx) {
            const frames = skill.enemy_skill_fx_frames || 12;
            const size = skill.enemy_skill_fx_size;
            enemyAnimationDuration = frames * 100; // Para calcular timing do personagem
            console.log(`🔍 DEBUG playEnemySkillFX ${skill.type.toUpperCase()} - frames: ${frames}, size: ${size}`);
            console.log(`⏱️ Efeito no inimigo iniciado imediatamente, durará: ${enemyAnimationDuration}ms`);
            playEnemySkillFX(skill.enemy_skill_fx, frames, size);
        }
        
        // 3. Para DEBUFF: Programar efeito no personagem + som de execução após inimigo terminar
        if (skill.type === 'debuff' && skill.player_fx_layer_a) {
            console.log(`⏱️ Efeito no personagem + som de execução será aplicado em ${enemyAnimationDuration}ms`);
            
            setTimeout(() => {
                // Som de execução junto com efeito no personagem
                if (skill.execution_sound) {
                    playSound(skill.execution_sound, 0.7);
                }
                
                console.log(`✨ Aplicando efeito de debuff no personagem`);
                
                if (skill.player_fx_layer_a) {
                    const playerFrames = skill.player_fx_layer_a_frames || 12;
                    const playerSize = skill.player_fx_layer_a_size;
                    console.log(`🔍 DEBUG playPlayerSkillFX - frames: ${playerFrames}, size: ${playerSize}`);
                    playPlayerSkillFX('fx-layer-a', skill.player_fx_layer_a, playerFrames, playerSize);
                }
                if (skill.player_fx_layer_b) {
                    const playerFrames = skill.player_fx_layer_b_frames || 12;
                    const playerSize = skill.player_fx_layer_b_size;
                    playPlayerSkillFX('fx-layer-b', skill.player_fx_layer_b, playerFrames, playerSize);
                }
            }, enemyAnimationDuration);
        }
        
        // 4. Para BUFF: Som de execução no timing original (800ms)
        if (skill.type === 'buff') {
            setTimeout(() => {
                if (skill.execution_sound) {
                    playSound(skill.execution_sound, 0.7);
                }
            }, 800);
        }
        
        setTimeout(() => {
            // 5. ATTACK SKILLS: Efeito de ataque no personagem (timing original)
            if (skill.type === 'attack') {
                if (skill.execution_sound) {
                    playSound(skill.execution_sound, 0.7);
                }
                
                if (skill.player_fx_layer_a) {
                    playSkillAttackAnimationOnPlayer('fx-layer-a', skill.player_fx_layer_a, skill.player_fx_layer_a_frames, skill.player_fx_layer_a_size);
                }
                if (skill.player_fx_layer_b) {
                    playSkillAttackAnimationOnPlayer('fx-layer-b', skill.player_fx_layer_b, skill.player_fx_layer_b_frames, skill.player_fx_layer_b_size);
                }
            }
            
            // 6. Remover carga visual
            if (skill.type === 'attack') {
                removeAttackChargeFromHUD();
            } else {
                removeBuffDebuffChargeFromHUD();
            }
            
            // 7. Resolver após tempo total da animação
            if (skill.type === 'debuff' && skill.enemy_skill_fx && skill.player_fx_layer_a) {
                // Para debuff: aguardar sequência completa
                const playerTime = (skill.player_fx_layer_a_frames || 12) * 80;
                const totalTime = enemyAnimationDuration + playerTime + 200; // enemy + player + buffer
                console.log(`⏱️ Tempo total da sequência de debuff: ${totalTime}ms`);
                setTimeout(resolve, totalTime);
            } else {
                setTimeout(resolve, 1200);
            }
            
        }, 800); // Delay apenas para attack skills
    });
}

function removeBuffDebuffChargeFromHUD() {
    console.log("Removendo carga de buff/debuff do HUD com animação");
    
    const buffDebuffContainer = document.getElementById('buff-debuff-container');
    if (!buffDebuffContainer) return;
    
    // Encontrar PRIMEIRO ícone da fila de buff/debuff (pode ser buff-skill-icon ou debuff-skill-icon)
    const firstIcon = buffDebuffContainer.querySelector('.buff-skill-icon, .debuff-skill-icon');
    if (firstIcon) {
        // Animação de remoção
        firstIcon.style.transition = 'all 0.5s ease-out';
        firstIcon.style.transform = 'scale(0) rotate(180deg)';
        firstIcon.style.opacity = '0';
        
        // Remover elemento após animação
        setTimeout(() => {
            if (firstIcon.parentNode) {
                firstIcon.parentNode.removeChild(firstIcon);
            }
        }, 500);
    }
}

function removeAttackChargeFromHUD() {
    console.log("Removendo carga de ataque do HUD com animação");
    
    const attackContainer = document.getElementById('charges-container');
    if (!attackContainer) return;
    
    // Encontrar PRIMEIRO ícone de ataque
    const firstIcon = attackContainer.querySelector('.attack-charge-icon');
    if (firstIcon) {
        // Animação de remoção
        firstIcon.style.transition = 'all 0.5s ease-out';
        firstIcon.style.transform = 'scale(0) rotate(180deg)';
        firstIcon.style.opacity = '0';
        
        // Remover elemento após animação
        setTimeout(() => {
            if (firstIcon.parentNode) {
                firstIcon.parentNode.removeChild(firstIcon);
            }
        }, 500);
    }
}

function playEnemySkillFX(fxImagePath, frames, sizeString) {
    console.log(`🌟 Tocando efeito no inimigo: ${fxImagePath} (${frames} frames, ${sizeString})`);
    
    const bossContainer = document.getElementById('boss');
    if (!bossContainer) return;
    
    // Parse das dimensões
    const dimensions = parseSizeString(sizeString, frames);
    if (!dimensions) {
        console.error('Tamanho inválido para enemy skill fx:', sizeString);
        return;
    }

    // Criar elemento de efeito
    const fxElement = document.createElement('div');
    fxElement.className = 'enemy-skill-fx';
    
    // Configurar dimensões e animação dinamicamente
    fxElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(2);
        width: ${dimensions.width}px;
        height: ${dimensions.height}px;
        background-image: url('${fxImagePath}');
        background-size: ${dimensions.totalWidth}px ${dimensions.height}px;
        background-repeat: no-repeat;
        background-position: 0 0;
        z-index: 200;
        pointer-events: none;
        opacity: 0;
        overflow: hidden;
    `;
    
    // Adicionar ao boss container
    bossContainer.appendChild(fxElement);

    // Criar keyframe CSS dinâmica
    const animationName = `enemy-fx-${frames}frames-${Date.now()}`;
    const keyframes = `
        @keyframes ${animationName} {
            from { background-position: 0px 0; }
            to { background-position: -${dimensions.totalWidth}px 0; }
        }
    `;
    
    // Inserir CSS
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    // Aplicar animação
    fxElement.style.opacity = '1';
    fxElement.style.animation = `${animationName} ${frames * 0.1}s steps(${frames}) forwards`;

    // Remover após animação
    setTimeout(() => {
        if (fxElement.parentNode) {
            fxElement.parentNode.removeChild(fxElement);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, frames * 100);
}

function playPlayerSkillFX(layerId, fxImagePath, frames, sizeString) {
    console.log(`Tocando efeito de skill no personagem: ${fxImagePath} (${frames} frames, ${sizeString})`);
    
    // Encontrar container do personagem
    const characterContainer = document.getElementById('character') || document.querySelector('.character-container') || document.querySelector('#player');
    
    if (!characterContainer) {
        console.warn('Container do personagem não encontrado');
        return;
    }
    
    // Parse das dimensões
    const dimensions = parseSizeString(sizeString, frames);
    if (!dimensions) {
        console.error('Tamanho inválido para player skill fx:', sizeString);
        return;
    }
    
    // Criar elemento de efeito
    const fxElement = document.createElement('div');
    fxElement.className = 'player-skill-fx';
    fxElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1.5);
        width: ${dimensions.width}px;
        height: ${dimensions.height}px;
        background-image: url('${fxImagePath}');
        background-size: ${dimensions.totalWidth}px ${dimensions.height}px;
        background-repeat: no-repeat;
        background-position: 0 0;
        z-index: 200;
        pointer-events: none;
        opacity: 0;
    `;
    
    // Adicionar ao container do personagem
    characterContainer.appendChild(fxElement);
    
    // Criar keyframe CSS dinâmica
    const animationName = `player-debuff-fx-${frames}frames-${Date.now()}`;
    const keyframes = `
        @keyframes ${animationName} {
            from { background-position: 0px 0; }
            to { background-position: -${dimensions.totalWidth}px 0; }
        }
    `;
    
    // Inserir CSS
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    // DEBUG HEAL: Verificar se keyframes foram criados
    if (fxImagePath.includes('heal.png')) {
        console.log("🔍 HEAL KEYFRAMES DEBUG:");
        console.log("  - Keyframes criados:", keyframes);
        console.log("  - Style element:", style);
        console.log("  - Style adicionado ao head?", document.head.contains(style));
        
        // Verificar se a animação existe no CSS
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(fxElement);
            console.log("💫 HEAL ANIMATION STATUS:");
            console.log("  - Animation name computed:", computedStyle.animationName);
            console.log("  - Animation duration computed:", computedStyle.animationDuration);
            console.log("  - Animation play state:", computedStyle.animationPlayState);
            console.log("  - Background position atual:", computedStyle.backgroundPosition);
            
            // Testar se podemos encontrar a regra CSS
            let foundRule = false;
            for (let i = 0; i < document.styleSheets.length; i++) {
                try {
                    const sheet = document.styleSheets[i];
                    for (let j = 0; j < sheet.cssRules.length; j++) {
                        const rule = sheet.cssRules[j];
                        if (rule.name && rule.name === animationName) {
                            foundRule = true;
                            console.log("✅ KEYFRAME ENCONTRADO:", rule);
                            break;
                        }
                    }
                } catch(e) {
                    // Cross-origin stylesheet, ignorar
                }
            }
            if (!foundRule) {
                console.error("❌ KEYFRAME NÃO ENCONTRADO NO CSS!");
            }
        }, 200);
    }
    
    // Mostrar animação
    fxElement.style.opacity = '1';
    fxElement.style.animation = `${animationName} ${frames * 0.08}s steps(${frames}) forwards`;
    
    // Remover após animação
    setTimeout(() => {
        if (fxElement.parentNode) {
            fxElement.parentNode.removeChild(fxElement);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, frames * 100);
}

function showSkillExecutionIndicator(message) {
    // Criar ou atualizar indicador
    let indicator = document.getElementById('skill-execution-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'skill-execution-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 20px 40px;
            border-radius: 15px;
            font-family: 'Cinzel', serif;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            border: 2px solid #9b59b6;
            box-shadow: 0 0 30px rgba(155, 89, 182, 0.5);
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = message;
    indicator.style.opacity = '1';
}

function hideSkillExecutionIndicator() {
    const indicator = document.getElementById('skill-execution-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}

function disableUserInput(disable) {
    // Desabilitar/habilitar cliques na interface
    const overlay = document.getElementById('input-disable-overlay');
    
    if (disable) {
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.id = 'input-disable-overlay';
            newOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                pointer-events: all;
                background: transparent;
            `;
            document.body.appendChild(newOverlay);
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

function playSkillAttackAnimationOnPlayer(layerId, fxImagePath, frames, sizeString) {
    console.log(`Tocando efeito de skill de ataque no personagem: ${fxImagePath} (${frames} frames, ${sizeString})`);
    
    // Encontrar container do personagem
    const characterContainer = document.getElementById('character') || document.querySelector('.character-container') || document.querySelector('#player');
    
    if (!characterContainer) {
        console.warn('Container do personagem não encontrado');
        return;
    }
    
    // Parse das dimensões
    const dimensions = parseSizeString(sizeString, frames);
    if (!dimensions) {
        console.error('Tamanho inválido para attack skill fx:', sizeString);
        return;
    }
    
    // Criar elemento de efeito
    const fxElement = document.createElement('div');
    fxElement.className = 'player-attack-skill-fx';
    fxElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${dimensions.width}px;
        height: ${dimensions.height}px;
        background-image: url('${fxImagePath}');
        background-size: ${dimensions.totalWidth}px ${dimensions.height}px;
        background-repeat: no-repeat;
        background-position: 0 0;
        z-index: 150;
        pointer-events: none;
        opacity: 0;
        overflow: hidden;
    `;
    
    // Adicionar ao container do personagem
    characterContainer.appendChild(fxElement);
    
    // Criar keyframe CSS dinâmica
    const animationName = `player-attack-fx-${frames}frames-${Date.now()}`;
    const keyframes = `
        @keyframes ${animationName} {
            from { background-position: 0px 0; }
            to { background-position: -${dimensions.totalWidth}px 0; }
        }
    `;
    
    // Inserir CSS
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    // DEBUG HEAL: Verificar se keyframes foram criados
    if (fxImagePath.includes('heal.png')) {
        console.log("🔍 HEAL KEYFRAMES DEBUG:");
        console.log("  - Keyframes criados:", keyframes);
        console.log("  - Style element:", style);
        console.log("  - Style adicionado ao head?", document.head.contains(style));
        
        // Verificar se a animação existe no CSS
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(fxElement);
            console.log("💫 HEAL ANIMATION STATUS:");
            console.log("  - Animation name computed:", computedStyle.animationName);
            console.log("  - Animation duration computed:", computedStyle.animationDuration);
            console.log("  - Animation play state:", computedStyle.animationPlayState);
            console.log("  - Background position atual:", computedStyle.backgroundPosition);
            
            // Testar se podemos encontrar a regra CSS
            let foundRule = false;
            for (let i = 0; i < document.styleSheets.length; i++) {
                try {
                    const sheet = document.styleSheets[i];
                    if (sheet.cssRules) {
                        for (let j = 0; j < sheet.cssRules.length; j++) {
                            const rule = sheet.cssRules[j];
                            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === animationName) {
                                foundRule = true;
                                console.log("✅ KEYFRAME ENCONTRADO:", rule);
                                break;
                            }
                        }
                    }
                } catch(e) {
                    // Cross-origin stylesheet ou erro de acesso, ignorar
                }
            }
            if (!foundRule) {
                console.error("❌ KEYFRAME NÃO ENCONTRADO NO CSS!");
            }
        }, 200);
    }
    
    // Mostrar animação
    fxElement.style.opacity = '1';
    fxElement.style.animation = `${animationName} ${frames * 0.08}s steps(${frames}) forwards`;
    
    // Remover após animação
    setTimeout(() => {
        if (fxElement.parentNode) {
            fxElement.parentNode.removeChild(fxElement);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, frames * 100);
}

async function updateEnemyActiveBuffs() {
    try {
        const response = await fetch('/gamification/get_enemy_active_buffs');
        const data = await response.json();
        
        const buffsContainer = document.getElementById('enemy-active-buffs');
        if (!buffsContainer) return;
        
        // Limpar buffs antigos
        buffsContainer.innerHTML = '';
        
        if (data.success && data.buffs.length > 0) {
            data.buffs.forEach(buff => {
                const buffIcon = document.createElement('div');
                buffIcon.className = 'enemy-buff-icon';
                buffIcon.style.backgroundImage = `url('${buff.icon}')`;
                buffIcon.title = `${buff.effect_type}: ${buff.duration_remaining} ${buff.duration_type}`;
                buffsContainer.appendChild(buffIcon);
            });
        }
        
    } catch (error) {
        console.error("Erro ao atualizar buffs ativos:", error);
    }
}

async function restoreToInitialState() {
    console.log("Executando restauração completa para tela inicial");
    
    // Reset de todos os estados
    gameState.enemyAttackView = false;
    gameState.zoomedView = false;
    gameState.characterView = false;
    gameState.bossView = false;
    gameState.inAction = false;
    
    // Remover TODAS as classes de view
    battleArena.classList.remove('enemy-attack-view', 'zoom-view', 'character-view', 'boss-view');
    
    // Reset mais completo do background
    const activeBackground = document.getElementById('background-default');
    if (activeBackground) {
        activeBackground.style.cssText = ''; // Remove TODOS os estilos inline
        activeBackground.removeAttribute('style'); // Remove atributo style completamente
        
        // Forçar reflow
        void activeBackground.offsetWidth;
        
        // Aplicar apenas os estilos essenciais
        activeBackground.style.transformOrigin = 'center center';
        activeBackground.style.transform = 'scale(1)';
    }
    
    // Reset completo do personagem
    const character = document.getElementById('character');
    if (character) {
        character.style.opacity = '1';
        character.style.visibility = 'visible';
        character.style.transform = '';
        character.style.filter = '';
        character.style.transition = '';
        character.style.left = '';
        character.style.right = '';
        character.style.top = '';
        character.style.bottom = '';
        character.classList.remove('moving-to-boss', 'moving-back');
        
        // Reset flip horizontal em todas as camadas
        character.querySelectorAll('.character-sprite-layer').forEach(layer => {
            layer.style.transform = '';
        });
    }
    
    // Restaurar boss para estado normal
    const boss = document.getElementById('boss');
    if (boss) {
        boss.style.opacity = '1';
        boss.style.visibility = 'visible';
        boss.style.transition = 'opacity 0.5s ease-in-out';
        boss.classList.remove('screen-shake');
    }
    
    // CORREÇÃO: Restaurar música de fundo
    if (typeof initializeBackgroundMusic === 'function') {
        // Só reiniicializar se não estiver tocando
        if (!backgroundMusic1 || backgroundMusic1.paused) {
            initializeBackgroundMusic();
        }
    }
    
    // Restaurar idle do personagem
    if (typeof restoreCharacterIdle === 'function') {
        restoreCharacterIdle();
    }
    
    // Reset da vinheta padrão
    const vignette = document.getElementById('vignette');
    if (vignette) {
        vignette.classList.remove('visible');
    }
    
    // Reset dos HUDs
    setTimeout(() => {
        const currentBossHud = document.querySelector('.boss-hud');
        const currentCharacterHud = document.querySelector('.character-hud');

        if (currentBossHud) currentBossHud.style.opacity = '1';
        if (currentCharacterHud) currentCharacterHud.style.opacity = '1';
        
        // Realinhar HUDs
        if (typeof alignHUDs === 'function') {
            alignHUDs();
        }
    }, 500);
    
    console.log("✅ Restauração para tela inicial concluída");
}

// Expor funções globalmente
window.toggleZoomView = toggleZoomView;
window.toggleCharacterView = toggleCharacterView;
window.toggleBossView = toggleBossView;
window.setZoomFocus = setZoomFocus;
window.performAttack = performAttack;
window.runQuickCutSequence = runQuickCutSequence;
window.calculateDamage = calculateDamage;
window.checkCritical = checkCritical;
window.saveBossDamage = saveBossDamage;
window.handleBossDeathAnimation = handleBossDeathAnimation;
window.toggleEnemyAttackView = toggleEnemyAttackView;
window.playHitAnimation = playHitAnimation;
window.playSmokeoutAnimation = playSmokeoutAnimation;
window.restoreBossVisibility = restoreBossVisibility;
window.playCharacterDamageAnimation = playCharacterDamageAnimation;
window.executeEnemyAttackSequence = executeEnemyAttackSequence;
