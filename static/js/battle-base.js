// battle-base.js - Funções fundamentais do sistema de batalha
// Versão 1.0

// Inicializar gameState global
window.gameState = {
    player: {
        level: 1,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        experience: 0,
        nextLevelExp: 100,
        equippedHelmet: null,
        equippedEyes: null,
        damageBonus: 0,
        strengthDamage: 1.0,
        totalDamage: 1.0,
        dodgeChance: 0,
        damageMultiplier: 1.0,
        characterClass: null,
        characterSubclass: null,
        equipment: {},
        talents: []
    },
    boss: {
        name: "Carregando...",
        hp: 100,
        maxHp: 100,
        description: "Carregando informações do boss..."
    },
    revisionPoints: 0,
    inAction: false,
    zoomedView: false,
    characterView: false,
    bossView: false,
    previousView: null,
    enemyAttackView: false,
    isInitialized: false

};

// Inicializar variáveis para controle de rate limiting
window.isLoadingBattleData = false;
window.lastBattleDataUpdate = null;
window.isMobile = window.innerWidth <= 768;

// ===== CONTROLE DA ÚLTIMA GRAÇA (RELÍQUIA ID 24) =====
window.ultimateGraceControl = {
    relicId: 24,
    isUsed: false,
    hasRelic: false,
    
    // Verificar estado da relíquia ao carregar a batalha
    checkRelicState: async function() {
        try {
            const response = await fetch(`/gamification/check_relic_state/${this.relicId}`);
            const data = await response.json();
            
            if (data.success) {
                this.hasRelic = data.has_relic;
                this.isUsed = data.used_this_battle || false;
                
                console.log(`🔮 Última Graça - Tem relíquia: ${this.hasRelic}, Já usada: ${this.isUsed}`);
                
                // Atualizar interface
                this.updateUltimateButton();
            }
        } catch (error) {
            console.error('Erro ao verificar estado da relíquia:', error);
        }
    },
    
    // Atualizar o visual do botão da Suprema
    updateUltimateButton: function() {
        if (!this.hasRelic) return;
        
        // Procurar o botão da Suprema no menu de especiais
        const specialButtons = document.querySelectorAll('#special-skills-menu .skill-button');
        let ultimateButton = null;
        
        specialButtons.forEach(button => {
            const nameEl = button.querySelector('.skill-name') || button.querySelector('span');
            if (nameEl && nameEl.textContent.includes('Suprema')) {
                ultimateButton = button;
            }
        });
        
        if (!ultimateButton) {
            console.log('Botão da Suprema não encontrado');
            return;
        }
        
        if (this.isUsed) {
            // Bloquear o botão
            ultimateButton.classList.add('disabled', 'used-once');
            ultimateButton.style.opacity = '0.4';
            ultimateButton.style.filter = 'grayscale(100%)';
            ultimateButton.style.pointerEvents = 'none';
            ultimateButton.style.cursor = 'not-allowed';
            
            // Adicionar indicador "USADA"
            let usedIndicator = ultimateButton.querySelector('.used-indicator');
            if (!usedIndicator) {
                usedIndicator = document.createElement('div');
                usedIndicator.className = 'used-indicator';
                usedIndicator.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.9);
                    color: #ff4444;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 100;
                    text-shadow: 0 0 4px rgba(0,0,0,0.8);
                `;
                usedIndicator.textContent = 'USADA';
                ultimateButton.style.position = 'relative';
                ultimateButton.appendChild(usedIndicator);
            }
        } else {
            // Desbloquear o botão
            ultimateButton.classList.remove('disabled', 'used-once');
            ultimateButton.style.opacity = '';
            ultimateButton.style.filter = '';
            ultimateButton.style.pointerEvents = '';
            ultimateButton.style.cursor = '';
            
            const usedIndicator = ultimateButton.querySelector('.used-indicator');
            if (usedIndicator) {
                usedIndicator.remove();
            }
        }
    },
    
    // Marcar como usada após usar
    markAsUsed: function() {
        if (this.hasRelic && !this.isUsed) {
            this.isUsed = true;
            this.updateUltimateButton();
        }
    },
    
    // Reset ao trocar de inimigo
    reset: function() {
        this.isUsed = false;
        this.updateUltimateButton();
    }
};

// Função para popular opções de habilidades especiais
window.populateSpecialOptions = function() {
    console.log("🎯 Populando opções de habilidades especiais...");
    
    const specialOptionsContainer = document.getElementById('special-skills-menu');
    if (!specialOptionsContainer) {
        console.error("Container de habilidades especiais não encontrado!");
        return;
    }
    
    // Limpar container
    specialOptionsContainer.innerHTML = '';
    
    // Verificar se existem habilidades especiais
    if (!window.gameState || !window.gameState.player || !window.gameState.player.specials) {
        console.log("Nenhuma habilidade especial disponível");
        return;
    }
    
    const specials = window.gameState.player.specials;
    
    specials.forEach(skill => {
        const button = document.createElement('button');
        button.className = 'skill-button special-skill-button';
        button.dataset.skillId = skill.id;
        button.dataset.skillType = skill.type || 'special';
        
        // Container para o conteúdo do botão
        const content = document.createElement('div');
        content.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
        
        // Nome da skill
        const nameSpan = document.createElement('span');
        nameSpan.className = 'skill-name';
        nameSpan.textContent = skill.name;
        content.appendChild(nameSpan);

        button.appendChild(content);

        // Event listeners para tooltip
        button.addEventListener('mouseenter', function(e) {
            if (window.specialSkillTooltip) {
                window.specialSkillTooltip.show(button, skill);
            }
        });

        button.addEventListener('mouseleave', function(e) {
            if (window.specialSkillTooltip) {
                window.specialSkillTooltip.hide();
            }
        });

        // Event listener para click
        button.addEventListener('click', function() {
            // Verificar se é Suprema com relíquia bloqueadora
            if (skill.name.includes('Suprema') && window.ultimateGraceControl.hasRelic && window.ultimateGraceControl.isUsed) {
                console.log("❌ Suprema já usada!");
                if (typeof showTempMessage === 'function') {
                    showTempMessage("Suprema já foi usada nesta batalha!", "#ff4444");
                }
                return;
            }
            
            // Usar habilidade especial
            console.log(`Usando habilidade especial: ${skill.name}`);
            
            fetch('/gamification/use_special', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ skill_id: skill.id })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Habilidade usada com sucesso!');

                    // Tocar som da skill
                    if (data.details && data.details.sound_effect) {
                        console.log(`🔊 Tocando som da skill: ${data.details.sound_effect}`);
                        if (typeof playSound === 'function') {
                            playSound(data.details.sound_effect, 0.6);
                        }
                    }

                    // Executar animação da skill
                    if (data.details && data.details.animation_sprite && data.details.animation_frames) {
                        console.log(`🎬 Executando animação: ${data.details.animation_sprite}`);
                        playSpecialSkillAnimation(
                            data.details.animation_sprite,
                            data.details.animation_frames,
                            data.details.animation_target || 'player'
                        );
                    }

                    // Atualizar blood stacks se a skill retornou
                    if (data.details && data.details.player_blood_stacks !== undefined) {
                        gameState.player.blood_stacks = data.details.player_blood_stacks;

                        if (window.bloodStacksDisplay) {
                            window.bloodStacksDisplay.update(gameState.player.blood_stacks);

                            // Animar consumo se consumiu stacks
                            if (data.details.blood_stacks_consumed && data.details.blood_stacks_consumed > 0) {
                                window.bloodStacksDisplay.animateConsume(data.details.blood_stacks_consumed);
                                console.log(`🩸 Consumiu ${data.details.blood_stacks_consumed} Blood Stacks (Restante: ${gameState.player.blood_stacks})`);
                            }
                        }
                    }

                    // Se foi a Suprema, marcar como usada
                    if (skill.name.includes('Suprema')) {
                        window.ultimateGraceControl.markAsUsed();
                    }

                    // Atualizar interface
                    if (typeof updateStats === 'function') {
                        updateStats();
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao usar habilidade:', error);
            });
        });
        
        specialOptionsContainer.appendChild(button);
    });
    
    // Verificar estado da relíquia após criar os botões
    setTimeout(() => {
        window.ultimateGraceControl.checkRelicState();
    }, 100);
};

// Função para inicializar todas as referências DOM de forma centralizada
function initializeDOMReferences() {
    console.log("Inicializando referências DOM...");
    
    // Elementos principais da arena
    window.battleArena = document.getElementById('battle-arena');
    window.character = document.getElementById('character');
    window.boss = document.getElementById('boss');
    
    // Elementos de estatísticas do jogador
    window.playerHpTextEl = document.getElementById('player-hp-text');
    window.smallPlayerHpTextEl = document.getElementById('small-player-hp-text');
    window.playerHpBarEl = document.getElementById('player-hp-bar');
    window.smallPlayerHpBarEl = document.getElementById('small-player-hp-bar');
    
    // Elementos de estatísticas do boss
    window.bossHpTextEl = document.getElementById('boss-hp-text');
    window.smallBossHpTextEl = document.getElementById('small-boss-hp-text');
    window.bossHpBarEl = document.getElementById('boss-hp-bar');
    window.smallBossHpBarEl = document.getElementById('small-boss-hp-bar');
    
    // Elementos de efeitos especiais
    window.fxLayerA = document.getElementById('fx-layer-a');
    window.fxLayerB = document.getElementById('fx-layer-b');
    
    // Elementos de menu
    window.actionMenu = document.getElementById('action-menu');
    window.attackButton = document.getElementById('attack-button');
    window.specialButton = document.getElementById('special-button');
    window.inventoryButton = document.getElementById('inventory-button');
    window.attackSubmenu = document.getElementById('attack-submenu');
    window.specialSubmenu = document.getElementById('special-submenu');
    window.inventorySubmenu = document.getElementById('inventory-submenu');
    window.attackOptions = document.getElementById('attack-skills-menu');
    
    // Elementos de efeitos visuais
    window.battleMessage = document.getElementById('battle-message');
    window.vignette = document.getElementById('vignette');
    window.spotlight = document.getElementById('spotlight');
    window.whitePulse = document.getElementById('white-pulse');
    window.attackVignette = document.getElementById('attack-vignette');
    window.horizontalVignette = document.getElementById('horizontal-vignette');
    window.qc2AttackContainer = document.getElementById('qc2-attack-animation-container');
    window.loadingScreen = document.getElementById('loading-screen');
    
    // Brilho do boss target
    window.bossTargetGlow = document.querySelector('.boss-target-glow');
    
    // Estado de submenu ativo
    window.activeSubmenu = null;

    // Valores padrão para animações
    window.defaultAttackAnimDuration = 600; // Duração da animação de ataque em ms
    window.characterWalkDuration = 600; // Duração da caminhada de avanço/retorno

    console.log("✅ Referências DOM inicializadas");
    
    // Inicializar personagem com sprites da classe após DOM estar pronto
    setTimeout(() => {
        console.log("Inicializando personagem com sprites da classe...");
        
        // Verificar se as funções do sistema de animações estão disponíveis
        if (typeof window.restoreCharacterIdle === 'function') {
            try {
                window.restoreCharacterIdle();
                console.log("✅ Personagem inicializado com sprites da classe");
            } catch (error) {
                console.error("❌ Erro ao inicializar sprites da classe:", error);
                console.log("Mantendo sprites padrão do CSS como fallback");
            }
        } else {
            console.warn("⚠️ Sistema de animações por classe ainda não carregado, mantendo sprites padrão");
            
            // Tentar novamente após 2 segundos
            setTimeout(() => {
                if (typeof window.restoreCharacterIdle === 'function') {
                    try {
                        window.restoreCharacterIdle();
                        console.log("✅ Personagem inicializado com sprites da classe (segunda tentativa)");
                    } catch (error) {
                        console.error("❌ Erro na segunda tentativa:", error);
                    }
                }
            }, 2000);
        }
    }, 500); // 500ms de delay para garantir que tudo esteja carregado

    setupMenuButtonListeners(); // Chamar imediatamente após inicializar as referências
    setupGlobalHoverSounds(); // Configurar sons de hover

    console.log("DOM Elements check:", {
        attackButton: document.getElementById('attack-button'),
        specialButton: document.getElementById('special-button'),
        inventoryButton: document.getElementById('inventory-button'),
        attackSubmenu: document.getElementById('attack-submenu'),
        specialSubmenu: document.getElementById('special-submenu'),
        inventorySubmenu: document.getElementById('inventory-submenu')
    });

    // Verificar estado da Última Graça ao inicializar
    if (window.ultimateGraceControl) {
        console.log("🔮 Verificando estado da Última Graça...");
        window.ultimateGraceControl.checkRelicState();
    }
}

// Função para configurar event listeners dos botões de menu
function setupMenuButtonListeners() {
    console.log("Configurando event listeners dos botões de menu...");
    
    // Verificar se as referências existem
    if (!window.attackButton || !window.specialButton || !window.inventoryButton) {
        console.error("Referências dos botões de menu não encontradas!");
        return;
    }
    
    // Remover event listeners anteriores (por precaução)
    window.attackButton.replaceWith(window.attackButton.cloneNode(true));
    window.attackButton = document.getElementById('attack-button');
    
    window.specialButton.replaceWith(window.specialButton.cloneNode(true));
    window.specialButton = document.getElementById('special-button');
    
    window.inventoryButton.replaceWith(window.inventoryButton.cloneNode(true));
    window.inventoryButton = document.getElementById('inventory-button');
    
    // Adicionar novos event listeners
    window.attackButton.addEventListener('click', function() {
        console.log("🔴 CLIQUE NO BOTÃO DE ATAQUE DETECTADO");
        
        // NOVA LÓGICA: Verificar se há cargas de ataque pendentes
        fetch('/gamification/enemy_attack_status')
            .then(response => response.json())
            .then(statusData => {
                if (statusData.success && statusData.status.has_charges) {
                    // INSERIR AQUI: Esconder menu imediatamente
                    window.actionMenu.classList.remove('visible');
                    console.log("📱 Menu escondido imediatamente após detectar cargas");
                    
                    // Há cargas pendentes - fazer smokeout ANTES da transição
                    console.log("⚡️ Cargas de ataque pendentes detectadas, iniciando smokeout na view atual");
                    
                    // 1. Smokeout na view atual (zoom-view)
                    playSmokeoutAnimation(() => {
                        console.log("Smokeout concluído na zoom-view");
                        
                        // 2. Aguardar 1000ms antes da transição
                        setTimeout(() => {
                            console.log("Iniciando transição para enemy-attack-view");
                            
                            // 3. Transição normal para enemy-attack-view
                            toggleEnemyAttackView();
                        }, 1000);
                    });
                } else {
                    // Sem cargas pendentes - comportamento normal de ataque
                    console.log("⚡️ Sem cargas pendentes, comportamento normal de ataque");
                    executeNormalAttackFlow();
                }
            })
            .catch(error => {
                console.error("Erro ao verificar status de ataque:", error);
                // Em caso de erro, seguir comportamento normal
                executeNormalAttackFlow();
            });
        
        // FUNÇÃO COM SUA LÓGICA ORIGINAL PRESERVADA
        function executeNormalAttackFlow() {
            // Remover classes 'selected' e 'faded' de todos os botões primeiro
            window.attackButton.classList.remove('selected', 'faded');
            window.specialButton.classList.remove('selected', 'faded');
            window.inventoryButton.classList.remove('selected', 'faded');
            
            if (window.activeSubmenu === 'attack') {
                // Fechar o submenu se já estiver aberto
                window.battleArena.classList.add('leaving-attack-mode');
                window.battleArena.classList.remove('zoom-view-attack');
                closeAllSubmenus();
                window.activeSubmenu = null;
                document.getElementById('attack-vignette').classList.remove('visible');

                // Parar som do coração
                if (typeof stopHeartbeatMusic === 'function') {
                    stopHeartbeatMusic();
                }
                
                if (window.bossTargetGlow) {
                    window.bossTargetGlow.style.opacity = '0';
                }
                
                setTimeout(() => {
                    window.battleArena.classList.remove('leaving-attack-mode');
                }, 750);
            } else {
                // Fechar apenas outros submenus, não o que estamos abrindo
                if (window.activeSubmenu === 'special') {
                    window.specialSubmenu.classList.remove('visible');
                    window.whitePulse.classList.remove('visible');
                } else if (window.activeSubmenu === 'inventory') {
                    window.inventorySubmenu.classList.remove('visible');
                    window.spotlight.classList.remove('visible');
                }
                
                // Remover efeitos dos outros botões
                window.specialButton.classList.add('faded');
                window.inventoryButton.classList.add('faded');
                
                // captura se veio da character-view
                const fromCharacter = window.gameState.characterView;

                // Se estamos na character-view, transição para zoom-view
                if (window.gameState.characterView) {
                    window.gameState.characterView = false;
                    window.gameState.zoomedView = true;
                    window.battleArena.classList.remove('character-view');
                    window.battleArena.classList.add('zoom-view');
                    animateTrees('left-to-right');
                }
                
                const openDelay = fromCharacter ? 1000 : 50;

                setTimeout(() => {
                    window.attackSubmenu.classList.add('visible');
                    window.activeSubmenu = 'attack';
                    window.battleArena.classList.add('menu-open');
                    window.battleArena.classList.add('zoom-view-attack');
                    document.getElementById('attack-vignette').classList.add('visible');

                    // Iniciar som do coração
                    if (typeof startHeartbeatMusic === 'function') {
                        startHeartbeatMusic();
                    }
                    
                    if (window.bossTargetGlow) {
                        window.bossTargetGlow.style.opacity = '1';
                    }
                    
                    if (window.isMobile) {
                        window.actionMenu.classList.add('submenu-open');
                    }
                    
                    window.attackButton.classList.add('selected');
                    window.specialButton.classList.add('faded');
                    window.inventoryButton.classList.add('faded');
                }, openDelay);
            }
        }
    });
    
    window.specialButton.addEventListener('click', function() {
        console.log("🔵 CLIQUE NO BOTÃO DE ESPECIAIS DETECTADO");
        
        // Remover classes 'selected' e 'faded' de todos os botões primeiro
        window.attackButton.classList.remove('selected', 'faded');
        window.specialButton.classList.remove('selected', 'faded');
        window.inventoryButton.classList.remove('selected', 'faded');
        
        if (window.activeSubmenu === 'special') {
            // Se o submenu especial já está aberto, feche-o
            window.specialSubmenu.classList.remove('visible');
            window.whitePulse.classList.remove('visible');
            window.activeSubmenu = null;
            window.battleArena.classList.remove('menu-open');
            
            if (window.isMobile) {
                window.actionMenu.classList.remove('submenu-open');
            }
        } else {
            // Caso contrário, abra o submenu especial e character-view
            window.attackSubmenu.classList.remove('visible');
            window.inventorySubmenu.classList.remove('visible');
            window.spotlight.classList.remove('visible');
            document.getElementById('attack-vignette').classList.remove('visible');
            window.battleArena.classList.remove('zoom-view-attack');
            
            // Activate character-view if we're not already in it
            if (!window.gameState.characterView) {
                toggleCharacterView();
            }
            
            // Carregar habilidades especiais antes de mostrar
            populateSpecialOptions();
            
            // Mostrar submenu e efeitos
            window.specialSubmenu.classList.add('visible');
            window.whitePulse.classList.add('visible');
            window.activeSubmenu = 'special';
            window.battleArena.classList.add('menu-open');
            
            // Destacar botão selecionado
            window.specialButton.classList.add('selected');
            window.attackButton.classList.add('faded');
            window.inventoryButton.classList.add('faded');
            
            if (window.isMobile) {
                window.actionMenu.classList.add('submenu-open');
            }
        }
    });
    
    window.inventoryButton.addEventListener('click', function() {
        console.log("🟢 CLIQUE NO BOTÃO DE INVENTÁRIO DETECTADO");
        
        // Remover classes 'selected' e 'faded' de todos os botões primeiro
        window.attackButton.classList.remove('selected', 'faded');
        window.specialButton.classList.remove('selected', 'faded');
        window.inventoryButton.classList.remove('selected', 'faded');
        
        if (window.activeSubmenu === 'inventory') {
            // Se o submenu de inventário já está aberto, feche-o
            window.inventorySubmenu.classList.remove('visible');
            window.spotlight.classList.remove('visible');
            window.activeSubmenu = null;
            window.battleArena.classList.remove('menu-open');
            
            if (window.isMobile) {
                window.actionMenu.classList.remove('submenu-open');
            }
        } else {
            // Caso contrário, abra o submenu de inventário e character-view
            window.attackSubmenu.classList.remove('visible');
            window.specialSubmenu.classList.remove('visible');
            window.whitePulse.classList.remove('visible');
            document.getElementById('attack-vignette').classList.remove('visible');
            window.battleArena.classList.remove('zoom-view-attack');
            
            // Activate character-view if we're not already in it
            if (!window.gameState.characterView) {
                toggleCharacterView();
            }
            
            // Mostrar submenu e efeitos
            window.inventorySubmenu.classList.add('visible');
            window.spotlight.classList.add('visible');
            window.activeSubmenu = 'inventory';
            window.battleArena.classList.add('menu-open');
            
            // Destacar botão selecionado
            window.inventoryButton.classList.add('selected');
            window.attackButton.classList.add('faded');
            window.specialButton.classList.add('faded');
            
            if (window.isMobile) {
                window.actionMenu.classList.add('submenu-open');
            }
        }
    });
    
    console.log("✅ Event listeners dos botões de menu configurados com sucesso");
}

// Sistema de animação de skills especiais
function playSpecialSkillAnimation(animationSprite, animationFrames, animationTarget) {
    console.log(`🎬 playSpecialSkillAnimation: sprite=${animationSprite}, frames=${animationFrames}, target=${animationTarget}`);

    // Determinar o elemento alvo
    let targetElement;
    if (animationTarget === 'boss' || animationTarget === 'enemy') {
        targetElement = document.getElementById('boss');
    } else {
        targetElement = document.getElementById('character');
    }

    if (!targetElement) {
        console.error('❌ Elemento alvo não encontrado para animação');
        return;
    }

    // Criar elemento de animação
    const animElement = document.createElement('div');
    animElement.className = 'special-skill-animation';
    animElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 256px;
        height: 256px;
        background-image: url('/static/game.data/${animationSprite}');
        background-size: ${256 * animationFrames}px 256px;
        background-repeat: no-repeat;
        background-position: 0 0;
        pointer-events: none;
        z-index: 1000;
        animation: special-skill-frames ${animationFrames * 0.1}s steps(${animationFrames}) forwards;
    `;

    // Adicionar CSS de animação dinamicamente se não existir
    if (!document.getElementById('special-skill-animation-keyframes')) {
        const style = document.createElement('style');
        style.id = 'special-skill-animation-keyframes';
        style.textContent = `
            @keyframes special-skill-frames {
                0% { background-position: 0 0; }
                100% { background-position: -${256 * (animationFrames - 1)}px 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Adicionar ao container do alvo
    const container = targetElement.parentElement;
    if (container) {
        container.style.position = 'relative';
        container.appendChild(animElement);

        // Remover após animação terminar
        setTimeout(() => {
            animElement.remove();
        }, animationFrames * 100 + 200);
    }
}

// Sistema de som de hover global
function setupGlobalHoverSounds() {
    console.log("Configurando sons de hover globais...");
    
    // Seletor para todos os botões relevantes
    const buttonSelectors = [
        '.action-button',        // Botões principais (Attack, Special, Inventory)
        '.skill-button',         // Botões de skills de ataque
        '.special-skill-icon',   // Ícones de habilidades especiais
        'button',                // Botões genéricos
        '.clickable'             // Classe adicional para elementos clicáveis
    ];
    
    function playHoverSound() {
        const sound = new Audio('/static/game.data/sounds/hover.mp3');
        sound.volume = 0.11; // Volume baixo-médio - AJUSTÁVEL AQUI
        
        // Variação aleatória de pitch ±5%
        const pitchVariation = 1.00 + (Math.random() * 0.20); // 0.9 a 1.1 - AJUSTÁVEL AQUI
        sound.playbackRate = pitchVariation;
        
        sound.play().catch(error => {
            // Ignorar erros silenciosamente para não poluir o console
        });
    }
    
    function matchesAnySelector(element, selectors) {
        // Verificar se o elemento existe e tem o método matches
        if (!element || typeof element.matches !== 'function') {
            return false;
        }
        
        // Testar cada seletor
        for (let selector of selectors) {
            try {
                if (element.matches(selector)) {
                    return true;
                }
            } catch (e) {
                // Ignorar erros de seletor inválido
                continue;
            }
        }
        
        return false;
    }
    
    function findMatchingParent(element, selectors) {
        let current = element;
        while (current && current !== document) {
            if (matchesAnySelector(current, selectors)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }
    
    // Adicionar event listeners usando delegação de eventos
    document.addEventListener('mouseenter', function(e) {
        // Verificar se o elemento ou seus pais correspondem aos seletores
        const target = e.target;
        const matchingElement = matchesAnySelector(target, buttonSelectors) ? target : findMatchingParent(target, buttonSelectors);
        
        if (matchingElement) {
            // Verificar se não está desabilitado
            if (!matchingElement.disabled && !matchingElement.classList.contains('disabled')) {
                playHoverSound();
            }
        }
    }, true);
    
    console.log("✅ Sons de hover configurados para todos os botões");
}

// Função para carregar dados da batalha a partir do servidor
// Função para carregar dados da batalha a partir do servidor
function loadBattleData() {
    // Verificar se já há uma atualização em andamento
    if (window.isLoadingBattleData) {
        return Promise.resolve({ success: false, message: "Atualização já em andamento" });
    }
    
    // Verificar intervalo mínimo entre atualizações (exceto para a primeira chamada)
    const now = Date.now();
    if (window.lastBattleDataUpdate && now - window.lastBattleDataUpdate < 2000) {
        return Promise.resolve({ success: false, message: "Atualização muito frequente" });
    }
    
    window.isLoadingBattleData = true;
    
    return new Promise((resolve, reject) => {
        fetch('/gamification/get_battle_data')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar dados da batalha. Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                window.isLoadingBattleData = false;
                window.lastBattleDataUpdate = Date.now();
                
                if (data.success) {
                    // Atualizar o gameState com os dados recebidos
                    if (data.player) {
                        // Atualizar informações do jogador
                        gameState.player.hp = data.player.hp;
                        gameState.player.maxHp = data.player.max_hp;
                        gameState.player.level = data.player.level;
                        gameState.player.experience = data.player.experience;
                        gameState.player.nextLevelExp = data.player.next_level_exp;
                        gameState.player.damageBonus = data.player.damage_bonus;
                        gameState.player.damageMultiplier = data.player.damage_multiplier;
                        gameState.player.equippedHelmet = data.player.equipment?.helmet?.name || 'open-helmet';
                        gameState.player.equippedEyes = data.player.equipment?.eyes?.name || 'fire';
                        gameState.player.equipment = data.player.equipment;
                        gameState.player.talents = data.player.talents;
                        gameState.player.dodgeChance = data.player.dodge_chance;
                        gameState.player.strengthDamage = data.player.strength_damage;
                        gameState.player.totalDamage = data.player.total_damage;

                        // Carregar acúmulos de sangue coagulado
                        if (data.player.blood_stacks !== undefined) {
                            gameState.player.blood_stacks = data.player.blood_stacks;
                            console.log(`🩸 Blood Stacks carregados: ${gameState.player.blood_stacks}`);

                            // Atualizar display de blood stacks
                            if (window.bloodStacksDisplay) {
                                window.bloodStacksDisplay.update(gameState.player.blood_stacks);
                            }
                        }

                        // Carregar energia do jogador
                        console.log("🔍 DEBUG ENERGIA - data.player.energy:", data.player.energy);
                        console.log("🔍 DEBUG ENERGIA - data.player.max_energy:", data.player.max_energy);

                        if (data.player.energy !== undefined) {
                            gameState.player.energy = data.player.energy;
                            gameState.player.maxEnergy = data.player.max_energy || 10;
                            gameState.player.barrier = data.player.barrier || 0; // <-- MUDANÇA AQUI
                            console.log(`⚡ Energia carregada: ${gameState.player.energy}/${gameState.player.maxEnergy}`);
                        } else {
                            // Fallback: Se backend não enviar energia, inicializar com máximo
                            gameState.player.energy = data.player.max_energy || 10;
                            gameState.player.maxEnergy = data.player.max_energy || 10;
                            console.warn(`⚠️ Backend não enviou energia! Inicializando com: ${gameState.player.energy}/${gameState.player.maxEnergy}`);
                        }
                        
                        // Atualizar elementos ocultos com atributos do jogador
                        document.getElementById('player_strength').innerText = data.player.strength || 0;
                        document.getElementById('player_damage_bonus').innerText = data.player.damage_bonus || 0;
                        document.getElementById('player_luck').innerText = data.player.luck || 0;
                        document.getElementById('player_crit_bonus').innerText = data.player.critical_bonus || 0;
                        document.getElementById('player_resistance').innerText = data.player.resistance || 0;
                        document.getElementById('player_block_bonus').innerText = data.player.block || 0;
                        document.getElementById('player_damage_multiplier').innerText = data.player.damage_multiplier || 1.0;
                        document.getElementById('player_dodge_chance').innerText = data.player.dodge_chance || 0;
                        document.getElementById('player_hp').innerText = data.player.hp;
                        document.getElementById('player_max_hp').innerText = data.player.max_hp;
                    }
                    
                    // NOVO: Suporte para inimigos genéricos
                    if (data.boss) {
                        console.log("🔍 SPRITE DEBUG - data.boss completo:", data.boss);
                        console.log("🔍 SPRITE DEBUG - data.boss.is_boss:", data.boss.is_boss);
                        console.log("🔍 SPRITE DEBUG - Vai chamar updateBossSprites");
                        // Atualizar informações do boss/inimigo
                        gameState.boss.name = data.boss.name;
                        gameState.boss.hp = data.boss.hp;
                        gameState.boss.maxHp = data.boss.max_hp;
                        gameState.boss.description = data.boss.description;
                        document.getElementById('boss_hp').innerText = data.boss.hp;
                        document.getElementById('boss_max_hp').innerText = data.boss.max_hp;
                        
                        // NOVO: Suporte para sprites de inimigos genéricos E bosses
                        if (data.boss.is_boss) {
                            updateBossSprites(data.boss);  // Passar objeto completo para boss
                        } else if (data.boss.sprite_layers) {
                            updateBossSprites(data.boss.sprite_layers);  // Manter sprite_layers para inimigos
                        } else {
                            console.error("❌ Erro: Tipo de sprite não reconhecido:", data.boss);
                        }
                        
                        // Atualizar informações no painel do boss
                        const bossName = document.querySelector('.boss-name');
                        const bossQuote = document.querySelector('.boss-quote');
                        const bossInfoHp = document.getElementById('boss-info-hp');
                        
                        if (bossName) bossName.textContent = data.boss.name;
                        if (bossQuote) bossQuote.textContent = data.boss.description;
                        if (bossInfoHp) bossInfoHp.textContent = `${data.boss.hp}/${data.boss.max_hp}`;
                    }
                                        
                    // Armazenar as SKILLS ativas no gameState
                    if (data.player.active_skills) {
                        gameState.player.active_skills = data.player.active_skills;
                        console.log("SKILLS ativas carregadas:", gameState.player.active_skills);
                    }
                    
                    // Armazenar os BUFFS ativos no gameState
                    if (data.player.active_buffs && data.player.active_buffs.length > 0) {
                        console.log("IMPORTANTE: Buffs carregados da API:", data.player.active_buffs);
                        
                        gameState.player.active_buffs = data.player.active_buffs.map(buff => {
                            // Garantir que cada buff tenha as propriedades mínimas
                            return {
                                type: buff.type || 'Desconhecido',
                                value: buff.value || '0%',
                                duration: buff.duration || '?',
                                icon: buff.icon || null // Importante!
                            };
                        });
                        
                        // Log detalhado para verificar se os ícones estão vindo na resposta
                        console.log("Detalhes de ícones nos buffs:", data.player.active_buffs.map(buff => {
                            return {
                                type: buff.type, 
                                icon: buff.icon || "(sem ícone)"
                            };
                        }));
                    }
                    
                    // Após atualizar todos os dados, verificar se é a primeira inicialização
                    if (!gameState.isInitialized && data.player && data.boss) {
                        gameState.isInitialized = true;
                        
                        // Adicionar delay para esconder a tela de carregamento
                        setTimeout(() => {
                            const loadingScreen = document.getElementById('loading-screen');
                            if (loadingScreen) {
                                loadingScreen.style.opacity = '0';
                                setTimeout(() => {
                                    loadingScreen.style.display = 'none';
                                }, 1000);
                            }
                            
                            // Mostrar mensagem de batalha
                            if (typeof showBattleMessage === 'function') {
                                showBattleMessage();
                            }
                            
                            // Mostrar HUDs com fade-in
                            setTimeout(() => {
                                const characterHud = document.querySelector('.character-hud');
                                const bossHud = document.querySelector('.boss-hud');
                                if (characterHud) characterHud.style.opacity = '1';
                                if (bossHud) bossHud.style.opacity = '1';
                            }, 500);
                        }, 1000);
                    }
                    // Atualizar HUD de cargas de ataque
                    if (data.enemy_attack_status) {
                        updateEnemyChargesHUD(data.enemy_attack_status);
                    }

                    // Após atualizar todos os dados, resolver a promessa
                    resolve(data);
                } else {
                    console.error("Erro nos dados de batalha:", data.message);
                    reject(new Error(data.message));
                }
            })
            .catch(error => {
                console.error("Erro ao buscar dados de batalha:", error);
                window.isLoadingBattleData = false;
                reject(error);
            });
    });
}

function updateBossSprites(spriteLayers) {
    console.log("🔍 DEBUG updateBossSprites recebeu:", spriteLayers);
    const bossContainer = document.querySelector('.boss-container');
    if (!bossContainer) return;

    // Limpar conteúdo anterior
    const existingLayers = bossContainer.querySelectorAll('.boss-sprite-layer, .boss-sprite-idle');
    existingLayers.forEach(layer => layer.remove());

    // Verificar se é dados de boss ou sprite layers diretamente
    let isDirectSpriteLayers = spriteLayers && (spriteLayers.body || spriteLayers.back || spriteLayers.head || spriteLayers.weapon);
    let isBossData = spriteLayers && (spriteLayers.is_boss !== undefined || spriteLayers.sprite_idle);

    if (isBossData && spriteLayers.is_boss) {
        // ===== RENDERIZAR BOSS (SPRITE IDLE ANIMADA) =====
        console.log("👑 Renderizando boss:", spriteLayers.name);

        // Adicionar classes específicas para boss
        bossContainer.classList.add('last-boss');
        
        // CORRIGIR: Aplicar classe CSS específica baseada no nome
        const bossName = spriteLayers.name.toLowerCase().replace(/\s+/g, '_');
        bossContainer.classList.add(`boss-${bossName}`);

        // Configurar sprite
        const bossSprite = document.createElement('div');
        bossSprite.className = 'boss-sprite-idle';
        bossSprite.style.backgroundImage = `url('/static/game.data/${spriteLayers.sprite_idle}')`;

        // REMOVER configuração dinâmica - usar CSS estático
        console.log(`👑 Usando CSS estático para boss: ${bossName}`);

        bossContainer.appendChild(bossSprite);
        console.log("👑 Boss sprite renderizado:", spriteLayers.sprite_idle);

    } else {
        // ===== RENDERIZAR INIMIGO GENÉRICO (código existente mantido) =====
        
        // Remover classe de boss se existir
        bossContainer.classList.remove('last-boss');
        // Remover todas as classes de boss específico
        const bossClasses = ['boss-purassombra', 'boss-heresiarca', 'boss-alma_negra', 'boss-formofagus', 'boss-nefasto'];
        bossClasses.forEach(cls => bossContainer.classList.remove(cls));

        // Código existente para inimigos genéricos...
        let actualSpriteLayers;
        if (isDirectSpriteLayers) {
            actualSpriteLayers = spriteLayers;
        } else if (isBossData && spriteLayers.sprite_layers) {
            actualSpriteLayers = spriteLayers.sprite_layers;
        } else {
            console.error("Dados de sprite inválidos:", spriteLayers);
            return;
        }

        console.log("🎯 Renderizando inimigo genérico com layers:", actualSpriteLayers);

        let zIndex = 1;
        
        // Adicionar camada back (se existir)
        if (actualSpriteLayers.back) {
            const backLayer = document.createElement('div');
            backLayer.className = 'boss-sprite-layer boss-layer-back';
            backLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/static/game.data/enemies/back/${actualSpriteLayers.back}');
                background-repeat: no-repeat;
                background-position: 0 0;
                background-size: 1408px 128px;
                animation: boss-animation 0.8s steps(11) infinite;
                z-index: ${zIndex++};
                transform: scaleX(-2) scaleY(2);
            `;
            bossContainer.appendChild(backLayer);
        }
        
        // Adicionar camada body
        if (actualSpriteLayers.body) {
            const bodyLayer = document.createElement('div');
            bodyLayer.className = 'boss-sprite-layer boss-layer-body';
            bodyLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/static/game.data/enemies/body/${actualSpriteLayers.body}');
                background-repeat: no-repeat;
                background-position: 0 0;
                background-size: 1408px 128px;
                animation: boss-animation 0.8s steps(11) infinite;
                z-index: ${zIndex++};
                transform: scaleX(-2) scaleY(2);
            `;
            bossContainer.appendChild(bodyLayer);
        }
        
        // Adicionar camada head
        if (actualSpriteLayers.head) {
            const headLayer = document.createElement('div');
            headLayer.className = 'boss-sprite-layer boss-layer-head';
            headLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/static/game.data/enemies/head/${actualSpriteLayers.head}');
                background-repeat: no-repeat;
                background-position: 0 0;
                background-size: 1408px 128px;
                animation: boss-animation 0.8s steps(11) infinite;
                z-index: ${zIndex++};
                transform: scaleX(-2) scaleY(2);
            `;
            bossContainer.appendChild(headLayer);
        }
        
        // Adicionar camada weapon
        if (actualSpriteLayers.weapon) {
            const weaponLayer = document.createElement('div');
            weaponLayer.className = 'boss-sprite-layer boss-layer-weapon';
            weaponLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/static/game.data/enemies/weapon/${actualSpriteLayers.weapon}');
                background-repeat: no-repeat;
                background-position: 0 0;
                background-size: 1408px 128px;
                animation: boss-animation 0.8s steps(11) infinite;
                z-index: ${zIndex++};
                transform: scaleX(-2) scaleY(2);
            `;
            bossContainer.appendChild(weaponLayer);
        }
        
        console.log("🎯 Inimigo genérico renderizado");
    }
}

// Função atualizada para atualizar estatísticas na interface
function updateStats() {
    // Verificar se gameState existe
    if (!window.gameState) {
        return;
    }
    
    try {
        // Atualizar estatísticas do jogador - interface principal
        if (window.playerHpTextEl) {
            window.playerHpTextEl.textContent = `${window.gameState.player.hp}/${window.gameState.player.maxHp}`;
        }
        
        if (window.playerHpBarEl) {
            const hpPercentage = (window.gameState.player.hp / window.gameState.player.maxHp) * 100;
            window.playerHpBarEl.style.width = `${hpPercentage}%`;
        }
        
        // Atualizar estatísticas do jogador - interface pequena
        if (window.smallPlayerHpTextEl) {
            window.smallPlayerHpTextEl.textContent = `${window.gameState.player.hp}/${window.gameState.player.maxHp}`;
        }
        
        if (window.smallPlayerHpBarEl) {
            const hpPercentage = (window.gameState.player.hp / window.gameState.player.maxHp) * 100;
            window.smallPlayerHpBarEl.style.width = `${hpPercentage}%`;
        }

        // ===== NOVA LÓGICA DA BARREIRA (UI) =====
        const smallHpContainer = document.querySelector('.character-hud .small-bar-container');
        
        if (smallHpContainer) {
            let barrierDisplay = smallHpContainer.querySelector('.barrier-display');
            
            if (window.gameState.player.barrier > 0) {
                // 1. Adicionar classe para estilização (outline + cor)
                smallHpContainer.classList.add('has-barrier');
                
                // 2. Criar ou atualizar o display da barreira
                if (!barrierDisplay) {
                    barrierDisplay = document.createElement('div');
                    barrierDisplay.className = 'barrier-display';
                    // Inserir *dentro* do container, para ficar junto da barra
                    smallHpContainer.appendChild(barrierDisplay); 
                }
                
                // 3. Atualizar ícone e valor (SVG inline por enquanto)
                barrierDisplay.innerHTML = `
                    <svg class="barrier-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #77ccff; margin-right: 3px;">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path>
                    </svg>
                    <span class="barrier-value" style="font-size: 0.8rem; font-weight: bold; color: #77ccff; text-shadow: 0 0 3px #000; line-height: 1;">
                        ${window.gameState.player.barrier}
                    </span>
                `;
            } else {
                // 4. Remover estilos e display se a barreira for 0
                smallHpContainer.classList.remove('has-barrier');
                if (barrierDisplay) {
                    barrierDisplay.remove();
                }
            }
        }
        // =======================================
        
        // Atualizar estatísticas do boss
        if (window.bossHpTextEl) {
            window.bossHpTextEl.textContent = `${window.gameState.boss.hp}/${window.gameState.boss.maxHp}`;
        }
        
        if (window.bossHpBarEl) {
            const bossHpPercentage = (window.gameState.boss.hp / window.gameState.boss.maxHp) * 100;
            window.bossHpBarEl.style.width = `${bossHpPercentage}%`;
        }
        
        if (window.smallBossHpTextEl) {
            window.smallBossHpTextEl.textContent = `${window.gameState.boss.hp}/${window.gameState.boss.maxHp}`;
        }
        
        if (window.smallBossHpBarEl) {
            const bossHpPercentage = (window.gameState.boss.hp / window.gameState.boss.maxHp) * 100;
            window.smallBossHpBarEl.style.width = `${bossHpPercentage}%`;
        }
        
        // Atualizar também campos ocultos
        const playerHpEl = document.getElementById('player_hp');
        const playerMaxHpEl = document.getElementById('player_max_hp');
        const sessionPointsEl = document.getElementById('session_points');
        const bossHpEl = document.getElementById('boss_hp');
        const bossMaxHpEl = document.getElementById('boss_max_hp');
        
        if (playerHpEl) playerHpEl.innerText = window.gameState.player.hp;
        if (playerMaxHpEl) playerMaxHpEl.innerText = window.gameState.player.maxHp;
        if (bossHpEl) bossHpEl.innerText = window.gameState.boss.hp;
        if (bossMaxHpEl) bossMaxHpEl.innerText = window.gameState.boss.maxHp;
        
        // Atualizar painel de informações do boss
        updateBossInfoPanel();
    } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
    }

    // Atualizar indicador de energia
    updateEnergyIndicator();

    // Atualizar disponibilidade dos botões de ataque baseado na energia
    updateAttackButtonsEnergyAvailability();
}

// ===== SISTEMA DE ENERGIA =====

/**
 * Atualiza o marcador visual de energia
 */
function updateEnergyIndicator() {
    const energyIndicator = document.getElementById('energy-indicator');
    const energyText = document.getElementById('energy-text');
    
    if (!energyIndicator || !energyText || !gameState.player) {
        return;
    }
    
    const currentEnergy = gameState.player.energy || 0;
    const maxEnergy = gameState.player.maxEnergy || 10;
    
    // Atualizar texto
    energyText.textContent = `${currentEnergy}/${maxEnergy}`;
    
    // Calcular porcentagem e definir data-attribute para animações
    const energyPercent = (currentEnergy / maxEnergy) * 100;
    
    if (energyPercent >= 70) {
        energyIndicator.setAttribute('data-energy-percent', 'high');
    } else if (energyPercent >= 30) {
        energyIndicator.setAttribute('data-energy-percent', 'medium');
    } else {
        energyIndicator.setAttribute('data-energy-percent', 'low');
    }
    
    console.log(`⚡ Energia atualizada: ${currentEnergy}/${maxEnergy} (${energyPercent.toFixed(1)}%)`);
}

//Anima o consumo de energia

function animateEnergyConsumption() {
    const energyIndicator = document.getElementById('energy-indicator');
    if (!energyIndicator) return;
    
    energyIndicator.classList.add('consuming');
    setTimeout(() => {
        energyIndicator.classList.remove('consuming');
    }, 300);
}

//Anima a restauração de energia

function animateEnergyRestoration() {
    const energyIndicator = document.getElementById('energy-indicator');
    if (!energyIndicator) return;
    
    energyIndicator.classList.add('restoring');
    setTimeout(() => {
        energyIndicator.classList.remove('restoring');
    }, 500);
}

//Atualiza a disponibilidade de todos os botões de ataque baseado na energia atual
function updateAttackButtonsEnergyAvailability() {
    const attackButtons = document.querySelectorAll('#attack-skills-menu .skill-button');
    
    if (!gameState.player || gameState.player.energy === undefined) {
        return;
    }
    
    const currentEnergy = gameState.player.energy;
    
    attackButtons.forEach(button => {
        const energyCost = parseInt(button.dataset.energyCost);
        
        if (isNaN(energyCost)) {
            return;
        }
        
        if (currentEnergy < energyCost) {
            button.classList.add('insufficient-energy');
            button.disabled = true;
        } else {
            button.classList.remove('insufficient-energy');
            const otherDisableReason = button.classList.contains('disabled') || 
                                       button.classList.contains('relic-disabled');
            if (!otherDisableReason) {
                button.disabled = false;
            }
        }
    });
}

// Função para atualizar o painel de informações do boss
function updateBossInfoPanel() {
    const bossName = document.querySelector('.boss-name');
    const bossQuote = document.querySelector('.boss-quote');
    const bossInfoHp = document.getElementById('boss-info-hp');
    
    if (bossName) bossName.textContent = gameState.boss.name;
    if (bossQuote) bossQuote.textContent = gameState.boss.description;
    if (bossInfoHp) bossInfoHp.textContent = `${gameState.boss.hp}/${gameState.boss.maxHp}`;
}

// Função para atualizar campos ocultos do jogador
function updateHiddenPlayerFields() {
    document.getElementById('player_hp').innerText = gameState.player.hp;
    document.getElementById('player_max_hp').innerText = gameState.player.maxHp;
    document.getElementById('player_strength').innerText = gameState.player.strength || 0;
    document.getElementById('player_damage_bonus').innerText = gameState.player.damageBonus || 0;
    document.getElementById('player_luck').innerText = gameState.player.luck || 0;
    document.getElementById('player_crit_bonus').innerText = gameState.player.criticalBonus || 0.05;
    document.getElementById('player_resistance').innerText = gameState.player.resistance || 0;
    document.getElementById('player_block_bonus').innerText = gameState.player.block || 0;
    document.getElementById('player_damage_multiplier').innerText = gameState.player.damageMultiplier || 1.0;
    document.getElementById('player_dodge_chance').innerText = gameState.player.dodgeChance || 0;
}

// Função para mostrar mensagem na interface
function showBattleMessage(message) {
    battleMessage.textContent = message || "Use suas habilidades para derrotar o boss!";
}

// Função para mostrar mensagens temporárias
function showTempMessage(message, color = "#28a745") {
    // Criar o elemento de mensagem
    const messageEl = document.createElement('div');
    messageEl.innerText = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${color};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        transition: opacity 0.5s ease-out;
    `;
    document.body.appendChild(messageEl);
    
    // Animar desaparecimento
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => messageEl.remove(), 500);
    }, 1500);
}

// Função auxiliar para tocar sons
function playSound(soundPath, volume = 0.5) {
    console.log("DEBUG playSound - Caminho original:", soundPath);
    
    // Verificar se o caminho foi fornecido e não é vazio
    if (!soundPath || soundPath === "null" || soundPath === "undefined") {
        console.warn("⚠️ Caminho de áudio não fornecido ou inválido, ignorando");
        return null;
    }
    
    // Remover barras duplas no caminho se existirem
    const cleanPath = soundPath.replace(/\/\//g, '/');
    console.log(`🔊 Tocando som: ${cleanPath}`);
    
    // Verificar se o navegador suporta áudio
    if (typeof Audio === 'undefined') {
        console.error("❌ API de áudio não suportada neste navegador");
        return null;
    }
    
    // Adicionar prefixo de caminho estático se não existir
    let finalPath = cleanPath;
    if (!finalPath.startsWith('/static/') && !finalPath.startsWith('http')) {
        finalPath = '/static/game.data/sounds/' + finalPath;
    }
    
    // Criar elemento de áudio
    const sound = new Audio(finalPath);
    sound.volume = volume;
    
    // Adicionar tratamento de eventos
    sound.addEventListener('canplaythrough', function() {
        console.log(`✅ Áudio carregado com sucesso: ${finalPath}`);
    });
    
    sound.addEventListener('play', function() {
        console.log(`✅ Iniciando reprodução: ${finalPath}`);
    });
    
    sound.addEventListener('ended', function() {
        console.log(`✅ Reprodução concluída: ${finalPath}`);
        this.remove();
    });
    
    sound.addEventListener('error', function(e) {
        console.error(`❌ Erro ao carregar ou reproduzir áudio: ${finalPath}`, e);
        
        // Tentar rota alternativa se o caminho original falhar
        if (!finalPath.includes('/static/game.data/sounds/')) {
            const alternativePath = '/static/game.data/sounds/' + finalPath.split('/').pop();
            console.log(`⚠️ Tentando caminho alternativo: ${alternativePath}`);
            playSound(alternativePath, volume);
        }
    });
    
    // Tentar reproduzir o som
    try {
        const playPromise = sound.play();
        
        // Lidar com possíveis erros de reprodução
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`❌ Erro ao tocar áudio (${finalPath}): ${error}`);
                
                // Se for erro de interação do usuário (primeiro carregamento da página)
                if (error.name === 'NotAllowedError') {
                    console.warn("⚠️ O navegador bloqueou a reprodução automática. Clique em algum lugar da página para permitir áudio.");
                }
            });
        }
        
        return sound;
    } catch (error) {
        console.error(`❌ Erro ao tentar reproduzir áudio (${finalPath}): ${error}`);
        return null;
    }
}

// Função para verificar se devemos fazer uma nova atualização
function shouldUpdateGameData() {
    const now = Date.now();
    const minUpdateInterval = 2000; // Mínimo de 2 segundos entre atualizações
    
    return !window.isUpdating && 
           (now - window.lastDataUpdate > minUpdateInterval);
}

// Função centralizada para gerenciar atualizações
function setupUpdateSystem() {
    console.log("Configurando sistema de atualização...");
    
    // Inicializar variáveis de controle
    window.lastDataUpdate = Date.now();
    window.isUpdating = false;
    window.updateInterval = null;
    
    // Limpar qualquer intervalo existente
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
    
    // Configurar nova atualização periódica a cada 60 segundos
    window.updateInterval = setInterval(() => {
        console.log("Verificando necessidade de atualização periódica...");
        
        // Só atualizar se não estiver em ação ou com submenus abertos
        if (!gameState.inAction && !window.activeSubmenu) {
            console.log("Executando atualização periódica (60s)");
            loadBattleData()
                .then(() => {
                    console.log("Atualização periódica concluída");
                    updateStats();
                })
                .catch(error => {
                    console.error("Erro na atualização periódica:", error);
                });
        }
    }, 60000); // 60 segundos
    
    // Adicionar listeners para eventos importantes
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && !gameState.inAction) {
            console.log("Página voltou a ficar visível, atualizando dados...");
            const now = Date.now();
            if (now - window.lastDataUpdate > 10000) { // 10 segundos
                loadBattleData().then(() => updateStats());
                window.lastDataUpdate = now;
            }
        }
    });
    
    console.log("Sistema de atualização configurado!");
}

// Função para atualização durante transições de view
function updateGameOnTransition() {
    console.log("Atualizando dados na transição de view");
    
    // Verificar se o jogo não está em ação
    if (typeof gameState !== 'undefined' && !gameState.inAction) {
        // Verificar tempo desde a última atualização
        const now = Date.now();
        if (!window.lastDataUpdate || (now - window.lastDataUpdate > 3000)) {
            console.log("Tempo suficiente desde a última atualização, atualizando dados...");
            window.lastDataUpdate = now;
            
            return loadBattleData()
                .then(() => {
                    console.log("✅ Dados atualizados com sucesso na transição");
                    updateStats();
                    return true;
                })
                .catch(error => {
                    console.error("❌ Erro ao atualizar dados na transição:", error);
                    return false;
                });
        } else {
            console.log("Ignorando atualização, última atualização foi muito recente");
            return Promise.resolve(false);
        }
    } else {
        console.log("❌ Jogo em ação, atualizações ignoradas");
        return Promise.resolve(false);
    }
}

// Fechar todos os submenus
function closeAllSubmenus() {
    console.log("Fechando todos os submenus...");
    
    try {
        // Verificar se os elementos necessários existem
        if (!window.attackSubmenu || !window.specialSubmenu || !window.inventorySubmenu || !window.battleArena) {
            console.error("❌ Elementos necessários para closeAllSubmenus não encontrados!");
            return;
        }
        
        // Desativar transições temporariamente para fechamento imediato
        window.attackSubmenu.style.transition = "none";
        window.specialSubmenu.style.transition = "none";
        window.inventorySubmenu.style.transition = "none";
        
        // Forçar reflow para aplicar mudanças de estilo
        void window.battleArena.offsetWidth;
        
        // Fechar os submenus
        window.attackSubmenu.classList.remove('visible');
        window.specialSubmenu.classList.remove('visible');
        window.inventorySubmenu.classList.remove('visible');
        
        if (window.spotlight) window.spotlight.classList.remove('visible');
        if (window.whitePulse) window.whitePulse.classList.remove('visible');
        if (window.attackVignette) window.attackVignette.classList.remove('visible');
        
        window.battleArena.classList.remove('menu-open');
        window.battleArena.classList.remove('zoom-view-attack');
        
        // Remover o brilho do boss target
        if (window.bossTargetGlow) {
            window.bossTargetGlow.style.opacity = '0';
        }
        
        // Remover destaques e efeitos de botões
        if (window.attackButton) window.attackButton.classList.remove('selected', 'faded');
        if (window.specialButton) window.specialButton.classList.remove('selected', 'faded');
        if (window.inventoryButton) window.inventoryButton.classList.remove('selected', 'faded');
        
        // Remover efeitos de área
        const particlesLayer1 = document.getElementById('particles-layer1');
        const particlesLayer2 = document.getElementById('particles-layer2');
        if (particlesLayer1) particlesLayer1.classList.remove('battle-area-dynamic');
        if (particlesLayer2) particlesLayer2.classList.remove('battle-area-dynamic');
        
        // Remover efeitos dos botões de habilidade - SEM MANIPULAR VISIBILIDADE
        const skillButtons = document.querySelectorAll('.skill-button');
        skillButtons.forEach(button => {
            button.classList.remove('battle-dynamic');
        });
        
        // Remover classe submenu-open do menu de ação no mobile
        if (window.actionMenu) {
            window.actionMenu.classList.remove('submenu-open');
        }
        
        // Desativar a vinheta horizontal
        const horizontalVignette = document.getElementById('horizontal-vignette');
        if (horizontalVignette) {
            horizontalVignette.style.opacity = '0';
        }
        
        // Restaurar transições após um pequeno delay
        setTimeout(() => {
            window.attackSubmenu.style.transition = "";
            window.specialSubmenu.style.transition = "";
            window.inventorySubmenu.style.transition = "";
        }, 50);
        
        console.log("✅ Todos os submenus fechados com sucesso");
    } catch (error) {
        console.error("❌ Erro ao fechar submenus:", error);
    }
}

// Função para melhor tratamento de erros global
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Erro global detectado:", error);
    
    // Registrar detalhes no console
    console.error({
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        stack: error?.stack
    });
    
    // Se o jogo estiver travado em estado de ação, liberar
    if (typeof gameState !== 'undefined' && gameState.inAction) {
        console.warn("Liberando estado de ação travado devido a erro...");
        gameState.inAction = false;
        
        // Tentar restaurar a interface
        try {
            // Fechar submenus
            if (typeof closeAllSubmenus === 'function') {
                closeAllSubmenus();
            }
            
            // Atualizar estatísticas
            if (typeof updateStats === 'function') {
                updateStats();
            }
            
            // Reativar menu
            const actionMenu = document.getElementById('action-menu');
            if (actionMenu) {
                actionMenu.classList.add('visible');
            }
            
            // Mostrar personagem se estiver invisível
            const character = document.getElementById('character');
            if (character && character.style.opacity === '0') {
                character.style.opacity = '1';
            }
            
            showBattleMessage("Ocorreu um erro. A interface foi restaurada.");
        } catch (e) {
            console.error("Erro ao tentar restaurar interface:", e);
        }
    }
    
    // Não impedir o comportamento normal de tratamento de erros
    return false;
};

// FUNÇÕES PARA DESENVOLVIMENTO

// Script para controles de desenvolvedor
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const addDamageBtn = document.getElementById('dev-add-damage-btn');
    const addMpBtn = document.getElementById('dev-add-mp-btn');
    const fillChargesBtn = document.getElementById('dev-fill-charges-btn');
    const statusElement = document.getElementById('dev-status-value');
    
    // Verificar se os elementos existem (pode estar em ambiente de produção)
    if (!addDamageBtn || !addMpBtn || !fillChargesBtn) {
        console.log("Controles DEV não encontrados (provavelmente ambiente de produção)");
        return;
    }
    
    // Atualizar status para pronto
    if (statusElement) {
        statusElement.textContent = "Pronto";
        statusElement.style.color = "#4CAF50";
    }
    
    // Preencher cargas de habilidades especiais
    if (fillChargesBtn) {
        fillChargesBtn.addEventListener('click', function() {
            console.log("Botão de preencher cargas clicado");
            
            // Fazer requisição AJAX
            fetch('/gamification/fill_special_charges', {
                method: 'GET'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao preencher cargas: ' + response.status);
                }
                return response.text();
            })
            .then(data => {
                console.log("Cargas preenchidas com sucesso!");
                if (statusElement) {
                    statusElement.textContent = "Cargas preenchidas!";
                    statusElement.style.color = "#4CAF50";
                }
                
                showTempMessage("Cargas Preenchidas!", "#9933ff");
                
                // Recarregar dados de batalha para atualizar interface
                if (typeof loadBattleData === 'function') {
                    loadBattleData();
                }
            })
            .catch(error => {
                console.error("Erro ao preencher cargas:", error);
                if (statusElement) {
                    statusElement.textContent = "Erro!";
                    statusElement.style.color = "#F44336";
                }
                showTempMessage("Erro ao preencher cargas: " + error.message, "#F44336");
            });
        });
    }
    
    console.log("Controles DEV inicializados com sucesso!");
});

// Sistema de crossfade para música de fundo
let backgroundMusic1 = null;
let backgroundMusic2 = null;
let currentBackground = 1;

// Sistema de crossfade para som do coração
let heartbeatMusic1 = null;
let heartbeatMusic2 = null;
let currentHeartbeat = 1;
let heartbeatActive = false;
let heartbeatFadeTimeout = null;
let heartbeat1Listener = null;
let heartbeat2Listener = null;

// ===== SISTEMA DE ÁUDIO PARA ENEMY ATTACK VIEW =====

let enemyAttackMusic = null;

function startEnemyAttackMusic() {
    console.log("Iniciando música de enemy attack view");
    
    if (enemyAttackMusic) {
        stopEnemyAttackMusic();
    }
    
    try {
        enemyAttackMusic = new Audio('/static/game.data/sounds/enemyattackrythm.mp3');
        enemyAttackMusic.volume = 0.3;
        enemyAttackMusic.loop = true;
        
        const playPromise = enemyAttackMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Erro ao tocar música de enemy attack:", error);
            });
        }
    } catch (error) {
        console.error("Erro ao inicializar música de enemy attack:", error);
    }
}

function stopEnemyAttackMusic() {
    if (enemyAttackMusic) {
        console.log("Parando música de enemy attack view");
        enemyAttackMusic.pause();
        enemyAttackMusic.currentTime = 0;
        enemyAttackMusic = null;
    }
}

function playDefeatSound() {
    console.log("Tocando som de derrota");
    playSound('/static/game.data/sounds/defeat.mp3', 0.8);
}

function playDodgeSound() {
    console.log("Tocando som de esquiva");
    playSound('/static/game.data/sounds/dodge.mp3', 0.6);
}

function initializeBackgroundMusic() {
    console.log("Inicializando sistema de crossfade para música de fundo...");
    
    // Criar duas instâncias para crossfade
    backgroundMusic1 = new Audio('/static/game.data/sounds/battle_sound_loop1.mp3');
    backgroundMusic2 = new Audio('/static/game.data/sounds/battle_sound_loop1.mp3');
    
    backgroundMusic1.volume = 0.15;
    backgroundMusic2.volume = 0.15;
    
    // Configurar eventos para crossfade automático
    backgroundMusic1.addEventListener('timeupdate', () => {
        if (backgroundMusic1.duration - backgroundMusic1.currentTime <= 0.5) { // 50ms antes do fim
            if (currentBackground === 1) {
                console.log("Iniciando crossfade: música 2");
                backgroundMusic2.currentTime = 0;
                backgroundMusic2.play().catch(console.error);
                currentBackground = 2;
            }
        }
    });
    
    backgroundMusic2.addEventListener('timeupdate', () => {
        if (backgroundMusic2.duration - backgroundMusic2.currentTime <= 0.5) { // 50ms antes do fim
            if (currentBackground === 2) {
                console.log("Iniciando crossfade: música 1");
                backgroundMusic1.currentTime = 0;
                backgroundMusic1.play().catch(console.error);
                currentBackground = 1;
            }
        }
    });
    
    // Tentar tocar a primeira instância
    const playPromise = backgroundMusic1.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Música de fundo bloqueada pelo navegador. Será tocada na primeira interação.", error);
            
            const enableMusic = () => {
                backgroundMusic1.play().then(() => {
                    console.log("✅ Música de fundo iniciada após interação do usuário");
                }).catch(err => {
                    console.error("❌ Erro ao iniciar música de fundo:", err);
                });
                
                document.removeEventListener('click', enableMusic);
                document.removeEventListener('keydown', enableMusic);
            };
            
            document.addEventListener('click', enableMusic);
            document.addEventListener('keydown', enableMusic);
        });
    }
}

function stopBackgroundMusic() {
    if (backgroundMusic1) {
        backgroundMusic1.pause();
        backgroundMusic1.currentTime = 0;
    }
    if (backgroundMusic2) {
        backgroundMusic2.pause();
        backgroundMusic2.currentTime = 0;
    }
}

// Sistema de som do coração com crossfade
function startHeartbeatMusic() {
    if (heartbeatActive) return;
    
    console.log("🫀 Iniciando som do coração com crossfade...");
    heartbeatActive = true;
    
    // Limpar timeout anterior se existir
    if (heartbeatFadeTimeout) {
        clearTimeout(heartbeatFadeTimeout);
        heartbeatFadeTimeout = null;
    }
    
    // Criar duas instâncias para crossfade
    heartbeatMusic1 = new Audio('/static/game.data/sounds/heartbeat.mp3');
    heartbeatMusic2 = new Audio('/static/game.data/sounds/heartbeat.mp3');
    
    heartbeatMusic1.volume = 0.1;
    heartbeatMusic2.volume = 0.1;
    
    // Criar funções nomeadas para os listeners (para poder remover depois)
    const heartbeat1Listener = () => {
        if (heartbeatActive && heartbeatMusic1 && heartbeatMusic1.duration - heartbeatMusic1.currentTime <= 0.1) {
            if (currentHeartbeat === 1) {
                console.log("🫀 Crossfade: coração 2");
                if (heartbeatMusic2) {
                    heartbeatMusic2.currentTime = 0;
                    heartbeatMusic2.play().catch(console.error);
                    currentHeartbeat = 2;
                }
            }
        }
    };

    const heartbeat2Listener = () => {
        if (heartbeatActive && heartbeatMusic2 && heartbeatMusic2.duration - heartbeatMusic2.currentTime <= 0.1) {
            if (currentHeartbeat === 2) {
                console.log("🫀 Crossfade: coração 1");
                if (heartbeatMusic1) {
                    heartbeatMusic1.currentTime = 0;
                    heartbeatMusic1.play().catch(console.error);
                    currentHeartbeat = 1;
                }
            }
        }
    };

    // Configurar eventos para crossfade automático
    heartbeatMusic1.addEventListener('timeupdate', heartbeat1Listener);
    heartbeatMusic2.addEventListener('timeupdate', heartbeat2Listener);
    
    // Iniciar primeira instância
    heartbeatMusic1.play().catch(error => {
        console.error("❌ Erro ao tocar som do coração:", error);
    });
}

function stopHeartbeatMusic() {
    if (!heartbeatActive) return;
    
    console.log("🫀 Parando som do coração com fade-out...");
    heartbeatActive = false;
    
    // Fade-out suave de 1 segundo
    const fadeOutDuration = 1000;
    const fadeSteps = 20;
    const fadeInterval = fadeOutDuration / fadeSteps;
    const volumeStep = 0.1 / fadeSteps;
    
    let currentStep = 0;
    
    const fadeOut = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, 0.1 - (volumeStep * currentStep));
        
        if (heartbeatMusic1) heartbeatMusic1.volume = newVolume;
        if (heartbeatMusic2) heartbeatMusic2.volume = newVolume;
        
        if (currentStep >= fadeSteps) {
            clearInterval(fadeOut);
            
            // Parar, remover listeners e limpar
            if (heartbeatMusic1) {
                heartbeatMusic1.removeEventListener('timeupdate', heartbeat1Listener);
                heartbeatMusic1.pause();
                heartbeatMusic1.currentTime = 0;
                heartbeatMusic1 = null;
            }
            if (heartbeatMusic2) {
                heartbeatMusic2.removeEventListener('timeupdate', heartbeat2Listener);
                heartbeatMusic2.pause();
                heartbeatMusic2.currentTime = 0;
                heartbeatMusic2 = null;
            }
            
            currentHeartbeat = 1;
            console.log("🫀 Som do coração parado completamente");
        }
    }, fadeInterval);
}

function updateEnemyChargesHUD(attackStatus) {
    const hudElement = document.getElementById('enemy-charges-hud');
    const timersContainer = document.getElementById('timers-container');
    const timerElement = document.getElementById('charge-timer');
    const containerElement = document.getElementById('charges-container');
    const buffDebuffContainer = document.getElementById('buff-debuff-container');
    
    if (!hudElement || !timerElement || !containerElement) {
        console.warn('Elementos do HUD de cargas não encontrados');
        return;
    }
    
    // Mostrar HUD
    hudElement.classList.add('visible');
    
    // ===== ATUALIZAR TIMER DE ATAQUE NORMAL =====
    if (attackStatus.time_to_next) {
        const time = attackStatus.time_to_next;
        const hours = String(time.hours).padStart(2, '0');
        const minutes = String(time.minutes).padStart(2, '0');
        const seconds = String(time.seconds).padStart(2, '0');
        timerElement.textContent = `Próxima carga em: ${hours}:${minutes}:${seconds}`;
    } else {
        timerElement.textContent = 'Próxima carga em: --:--:--';
    }
    
    // ===== ADICIONAR/ATUALIZAR TIMERS DE SKILLS =====
    // Remover timers de skills antigos
    const oldSkillTimers = timersContainer.querySelectorAll('.skill-timer');
    oldSkillTimers.forEach(timer => timer.remove());
    
    // Adicionar novos timers de skills
    if (attackStatus.skill_timers) {
        Object.keys(attackStatus.skill_timers).forEach(skillId => {
            const skillTime = attackStatus.skill_timers[skillId];
            const hours = String(skillTime.hours).padStart(2, '0');
            const minutes = String(skillTime.minutes).padStart(2, '0');
            const seconds = String(skillTime.seconds).padStart(2, '0');
            
            const skillTimer = document.createElement('div');
            skillTimer.className = 'skill-timer';
            skillTimer.textContent = `Skill ${skillId}: ${hours}:${minutes}:${seconds}`;
            timersContainer.appendChild(skillTimer);
        });
    }
    
    // ===== ATUALIZAR FILA DE ATAQUES NORMAIS + SKILLS DE ATAQUE =====
    containerElement.innerHTML = '';
    
    if (attackStatus.action_queue && attackStatus.action_queue.length > 0) {
        attackStatus.action_queue.forEach(action => {
            if (action.type === 'attack') {
                // Ataque normal
                const chargeIcon = document.createElement('div');
                chargeIcon.className = 'attack-charge-icon';
                containerElement.appendChild(chargeIcon);
            } else if (action.type === 'skill_attack') {
                // Skill de ataque
                const skillIcon = document.createElement('div');
                skillIcon.className = 'skill-charge-icon';
                skillIcon.style.backgroundImage = `url('${action.icon}')`;
                containerElement.appendChild(skillIcon);
            }
        });
    } else if (attackStatus.charges_count > 0) {
        // Fallback: mostrar cargas normais se não houver action_queue
        for (let i = 0; i < attackStatus.charges_count; i++) {
            const chargeIcon = document.createElement('div');
            chargeIcon.className = 'attack-charge-icon';
            containerElement.appendChild(chargeIcon);
        }
    } else {
        const noChargesText = document.createElement('span');
        noChargesText.className = 'no-charges-text';
        noChargesText.textContent = 'Nenhuma carga disponível';
        containerElement.appendChild(noChargesText);
    }
    
    // ===== ATUALIZAR FILA DE BUFF/DEBUFF =====
    if (attackStatus.has_buff_debuff_charges && buffDebuffContainer) {
        buffDebuffContainer.style.display = 'flex';
        buffDebuffContainer.innerHTML = '';
        
        attackStatus.buff_debuff_queue.forEach(skill => {
            const skillIcon = document.createElement('div');
            skillIcon.className = 'skill-charge-icon';
            skillIcon.style.backgroundImage = `url('${skill.icon}')`;
            skillIcon.title = `${skill.data.name} (${skill.type})`;
            buffDebuffContainer.appendChild(skillIcon);
        });
    } else if (buffDebuffContainer) {
        buffDebuffContainer.style.display = 'none';
    }
    
    // ===== ATUALIZAR TEXTO DO BOTÃO DE ATAQUE =====
    const hasAnyAttackCharges = attackStatus.has_charges || 
                               (attackStatus.action_queue && attackStatus.action_queue.length > 0);
    
    updateAttackButtonsBasedOnCharges(hasAnyAttackCharges);
    
    console.log(`HUD atualizado: ${attackStatus.charges_count} cargas normais, ${Object.keys(attackStatus.skill_timers || {}).length} skills, buff/debuff: ${attackStatus.has_buff_debuff_charges}`);
}

function updateAttackButtonsBasedOnCharges(hasCharges) {
    const attackButton = document.getElementById('attack-button');
    
    if (!attackButton) return;
    
    if (hasCharges) {
        console.log("🎯 Alterando botão para 'Receber ataques'");
        attackButton.textContent = 'Receber ataques';
        attackButton.classList.add('has-enemy-charges');
    } else {
        console.log("⚔️ Restaurando botão para 'Atacar'");
        attackButton.textContent = 'Atacar';
        attackButton.classList.remove('has-enemy-charges');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, inicializando sistema de batalha base...");
    
    // Inicializar todas as referências DOM como primeiro passo
    initializeDOMReferences();
    
    // Verificar se estamos em mobile
    window.isMobile = window.innerWidth <= 768;

    // Carregar dados da batalha imediatamente
    loadBattleData().then(() => {
        console.log("✅ Dados iniciais da batalha carregados com sucesso");
        updateStats();
        
        // Pré-carregar opções de ataque para estarem prontas
        if (typeof populateAttackOptions === 'function') {
            populateAttackOptions();
        }
    }).catch(error => {
        console.error("❌ Erro ao carregar dados iniciais da batalha:", error);
    });
    
    // Evento para redimensionamento
    window.addEventListener('resize', function() {
        // Verificar se estamos em mobile
        const newIsMobile = window.innerWidth <= 768;
        
        // Se mudar entre mobile e desktop, recarregar a página
        if (newIsMobile !== window.isMobile && !gameState.inAction) {
            location.reload();
        }
        
        window.isMobile = newIsMobile;
        
        // Atualizar posição dos HUDs
        if (typeof alignHUDs === 'function') {
            alignHUDs();
        }
    });

    window.testBossSprite = function() {
        const mockBossData = {
            is_boss: true,
            sprite_idle: 'bosses/purassombra/purassombra-idle-128x128-9f.png',
            name: 'Purassombra'
        };
        console.log("🧪 Testando sprite do boss");
        updateBossSprites(mockBossData);
    };

    window.testBossSkills = function() {
        fetch('/gamification/enemy_attack_status')
            .then(r => r.json())
            .then(data => {
                console.log("🧪 Status do boss:", data);
                if (data.status && data.status.buff_debuff_queue) {
                    console.log("🧪 Skills na fila:", data.status.buff_debuff_queue);
                }
            });
    };
    
    // Configurar sistema de atualização
    setupUpdateSystem();
    // Inicializar música de fundo
    initializeBackgroundMusic();
});