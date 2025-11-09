// battle-pixie.js - Sistema PixiJS LIMPO para Efeitos de Batalha
// Versão 3.0 - APENAS CÓDIGO NECESSÁRIO

// Armazenar referências globais dos canvas PixiJS
window.pixieSystem = {
    characterFrontApp: null,
    characterBackApp: null,
    bossFrontApp: null,
    bossBackApp: null,
    activeEffects: [],
    isInitialized: false
};

// Sistema dedicado para efeitos de cenário permanentes
window.backgroundEffectsSystem = {
    backgroundCanvas: null,
    backgroundApp: null,
    foregroundCanvas: null,
    foregroundApp: null,
    activeElements: [],
    isInitialized: false,
    petalSystem: null
};

// Inicializar sistema PixiJS
function initializePixieSystem() {
    console.log("🎭 PixiJS: Iniciando sistema LIMPO de efeitos visuais");
    
    try {
        // Verificar se PixiJS está disponível
        if (typeof PIXI === 'undefined') {
            console.error("❌ PixiJS não encontrado! Verifique se pixi.min.js foi carregado");
            return false;
        }
        
        console.log("✅ PixiJS v" + PIXI.VERSION + " detectado");
        
        // Inicializar cada canvas
        initializeCharacterCanvas();
        initializeBossCanvas();

        // Inicializar sistema de efeitos de cenário
        initializeBackgroundEffectsSystem();
        
        // Configurar redimensionamento responsivo
        setupResponsiveResize();
        
        window.pixieSystem.isInitialized = true;
        console.log("🎭 PixiJS: Sistema LIMPO inicializado com sucesso");
        
        return true;
    } catch (error) {
        console.error("❌ PixiJS: Erro ao inicializar sistema:", error);
        return false;
    }
}

// Inicializar canvas do personagem
function initializeCharacterCanvas() {
    const characterContainer = document.getElementById('character');
    if (!characterContainer) {
        console.error("❌ PixiJS: Container do personagem não encontrado");
        return;
    }
    
    const frontCanvas = document.getElementById('character-fx-front');
    const backCanvas = document.getElementById('character-fx-back');
    
    if (!frontCanvas || !backCanvas) {
        console.error("❌ PixiJS: Canvas do personagem não encontrados");
        return;
    }
    
    updateCanvasSize(frontCanvas, characterContainer);
    updateCanvasSize(backCanvas, characterContainer);
    
    window.pixieSystem.characterFrontApp = new PIXI.Application({
        view: frontCanvas,
        width: frontCanvas.width,
        height: frontCanvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: false, // Mantido false para performance
        resolution: Math.min(frontCanvas.width / frontCanvas.offsetWidth, 2), // Limitado a 2x
        autoDensity: true,
        powerPreference: "default", // Balanceado para mobile
        preserveDrawingBuffer: false, // Otimização de memória
        clearBeforeRender: true
    });

    window.pixieSystem.characterBackApp = new PIXI.Application({
        view: backCanvas,
        width: backCanvas.width,
        height: backCanvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: false,
        resolution: Math.min(backCanvas.width / backCanvas.offsetWidth, 2), // Limitado a 2x
        autoDensity: true,
        powerPreference: "default",
        preserveDrawingBuffer: false,
        clearBeforeRender: true
    });
    
    console.log("🎭 PixiJS: Canvas do personagem inicializados");
}

// Inicializar canvas do boss
function initializeBossCanvas() {
    const bossContainer = document.getElementById('boss');
    if (!bossContainer) {
        console.error("❌ PixiJS: Container do boss não encontrado");
        return;
    }
    
    const frontCanvas = document.getElementById('boss-fx-front');
    const backCanvas = document.getElementById('boss-fx-back');
    
    if (!frontCanvas || !backCanvas) {
        console.error("❌ PixiJS: Canvas do boss não encontrados");
        return;
    }
    
    updateCanvasSize(frontCanvas, bossContainer);
    updateCanvasSize(backCanvas, bossContainer);
    
    window.pixieSystem.bossFrontApp = new PIXI.Application({
        view: frontCanvas,
        width: frontCanvas.width,
        height: frontCanvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: false,
        resolution: frontCanvas.width / frontCanvas.offsetWidth,
        autoDensity: true
    });

    window.pixieSystem.bossBackApp = new PIXI.Application({
        view: backCanvas,
        width: backCanvas.width,
        height: backCanvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: false,
        resolution: backCanvas.width / backCanvas.offsetWidth,
        autoDensity: true
    });
    
    console.log("🎭 PixiJS: Canvas do boss inicializados");
}

// Inicializar sistema de efeitos de cenário
function initializeBackgroundEffectsSystem() {
    console.log("🌸 PixiJS: Iniciando sistema de efeitos de cenário (2 camadas)");
    
    try {
        const backgroundCanvas = document.getElementById('background-effects-canvas');
        const foregroundCanvas = document.getElementById('foreground-effects-canvas');
        
        if (!backgroundCanvas || !foregroundCanvas) {
            console.error("❌ Canvas de efeitos de cenário não encontrados!");
            return false;
        }
        
        // Configurar ambos os canvas para tela cheia
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
        foregroundCanvas.width = width;
        foregroundCanvas.height = height;
        
        // Criar aplicação PixiJS para fundo (atrás dos personagens)
        window.backgroundEffectsSystem.backgroundApp = new PIXI.Application({
            view: backgroundCanvas,
            width: width,
            height: height,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            antialias: false,
            resolution: Math.min(window.devicePixelRatio || 1, 1.5), // Limitado para mobile
            autoDensity: true,
            powerPreference: "default",
            preserveDrawingBuffer: false
        });

        // Criar aplicação PixiJS para frente (na frente dos personagens)
        window.backgroundEffectsSystem.foregroundApp = new PIXI.Application({
            view: foregroundCanvas,
            width: width,
            height: height,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            antialias: false,
            resolution: Math.min(window.devicePixelRatio || 1, 1.5), // Limitado para mobile
            autoDensity: true,
            powerPreference: "default",
            preserveDrawingBuffer: false
        });
        
        window.backgroundEffectsSystem.isInitialized = true;
        console.log("✅ Sistema de efeitos de cenário (2 camadas) inicializado");
        
        return true;
    } catch (error) {
        console.error("❌ Erro ao inicializar sistema de efeitos de cenário:", error);
        return false;
    }
}

// Sistema de pétalas contínuas (2 camadas) - SAKURA
function createContinuousPetals(config = {}) {
    if (!window.backgroundEffectsSystem.isInitialized) {
        console.error("❌ Sistema de efeitos de cenário não inicializado!");
        return false;
    }
    
    const backgroundApp = window.backgroundEffectsSystem.backgroundApp;
    const foregroundApp = window.backgroundEffectsSystem.foregroundApp;
    
    // Configuração padrão das pétalas
    const petalConfig = {
        count: config.count || 80,
        minSize: config.minSize || 3,
        maxSize: config.maxSize || 8,
        colors: config.colors || [0xFFB6C1, 0xFFC0CB, 0xFF69B4, 0xFFE4E1, 0xFFF0F5],
        fallSpeed: config.fallSpeed || { min: 20, max: 60 },
        swayAmount: config.swayAmount || 30,
        rotationSpeed: config.rotationSpeed || 2,
        spawnRate: config.spawnRate || 0.3,
        foregroundRatio: config.foregroundRatio || 0.8
    };
    
    console.log("🌸 Criando sistema de pétalas contínuas (2 camadas):", petalConfig);
    
    // Container para pétalas de fundo (atrás)
    const backgroundContainer = new PIXI.Container();
    backgroundApp.stage.addChild(backgroundContainer);
    
    // Container para pétalas de frente (na frente)
    const foregroundContainer = new PIXI.Container();
    foregroundApp.stage.addChild(foregroundContainer);
    
    const backgroundPetals = [];
    const foregroundPetals = [];
    const screenWidth = backgroundApp.view.width;
    const screenHeight = backgroundApp.view.height;
    
    // Função para criar uma única pétala
    function createSinglePetal(isForefront = false) {
        const petal = new PIXI.Graphics();
        
        // Escolher cor aleatória
        const color = petalConfig.colors[Math.floor(Math.random() * petalConfig.colors.length)];
        
        // Tamanho aleatório (pétalas da frente ligeiramente maiores)
        const sizeMultiplier = isForefront ? 1.2 : 1.0;
        const size = (petalConfig.minSize + Math.random() * (petalConfig.maxSize - petalConfig.minSize)) * sizeMultiplier;
        
        // Alpha (pétalas da frente ligeiramente mais opacas)
        const baseAlpha = isForefront ? 0.4 : 0.25;
        const alpha = baseAlpha + Math.random() * 0.15;
        
        // Desenhar forma de pétala
        petal.beginFill(color, alpha);
        
        // Forma orgânica de pétala
        const points = [];
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            let radius = size;
            
            // Criar forma de pétala mais orgânica
            if (i < segments / 2) {
                radius *= (0.6 + Math.sin((i / segments) * Math.PI) * 0.4);
            } else {
                radius *= (0.3 + Math.sin((i / segments) * Math.PI) * 0.2);
            }
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(x, y);
        }
        
        petal.drawPolygon(points);
        petal.endFill();
        
        // Posição inicial aleatória (acima da tela)
        petal.x = Math.random() * screenWidth;
        petal.y = -size - Math.random() * screenHeight * 0.5;
        
        // Propriedades de movimento
        const speedMultiplier = isForefront ? 0.5 : 1.0;
        petal.baseSpeed = (petalConfig.fallSpeed.min + Math.random() * (petalConfig.fallSpeed.max - petalConfig.fallSpeed.min)) * speedMultiplier;
        petal.swayPhase = Math.random() * Math.PI * 2;
        petal.swaySpeed = 0.2 + Math.random() * 0.6;
        petal.rotationSpeed = (Math.random() - 0.5) * petalConfig.rotationSpeed;
        petal.size = size;
        petal.isForefront = isForefront;
        
        return petal;
    }
    
    // Criar pétalas (distribuir entre fundo e frente)
    const totalPetals = petalConfig.count;
    const foregroundCount = Math.floor(totalPetals * petalConfig.foregroundRatio);
    const backgroundCount = totalPetals - foregroundCount;
    
    // Pétalas de fundo (atrás dos personagens)
    for (let i = 0; i < backgroundCount; i++) {
        const petal = createSinglePetal(false);
        petal.y = Math.random() * screenHeight;
        backgroundPetals.push(petal);
        backgroundContainer.addChild(petal);
    }
    
    // Pétalas de frente (na frente dos personagens)
    for (let i = 0; i < foregroundCount; i++) {
        const petal = createSinglePetal(true);
        petal.y = Math.random() * screenHeight;
        foregroundPetals.push(petal);
        foregroundContainer.addChild(petal);
    }
    
    // Sistema de animação contínua (NUNCA PARA)
    let animationActive = true;
    let lastSpawnTime = Date.now();
    
    function updatePetals() {
        if (!animationActive) return;
        
        const deltaTime = 0.016; // ~60fps
        const currentTime = Date.now();
        
        // Função para atualizar uma lista de pétalas
        function updatePetalList(petals, container, isForefront) {
            petals.forEach(petal => {
                if (!petal || !petal.parent) return;
                
                // Movimento vertical (queda)
                petal.y += petal.baseSpeed * deltaTime;
                
                // Movimento horizontal (balanço)
                petal.swayPhase += petal.swaySpeed * deltaTime;
                petal.x += Math.sin(petal.swayPhase) * petalConfig.swayAmount * deltaTime;
                
                // Rotação
                petal.rotation += petal.rotationSpeed * deltaTime;
                
                // Reciclagem: quando sai da tela, volta ao topo
                if (petal.y > screenHeight + petal.size) {
                    petal.x = Math.random() * screenWidth;
                    petal.y = -petal.size - Math.random() * 100;
                    petal.swayPhase = Math.random() * Math.PI * 2;
                }
                
                // Reciclagem lateral
                if (petal.x < -petal.size) {
                    petal.x = screenWidth + petal.size;
                } else if (petal.x > screenWidth + petal.size) {
                    petal.x = -petal.size;
                }
            });
        }
        
        // Atualizar ambas as listas
        updatePetalList(backgroundPetals, backgroundContainer, false);
        updatePetalList(foregroundPetals, foregroundContainer, true);
        
        // Spawn ocasional de novas pétalas
        if (currentTime - lastSpawnTime > 5000 && Math.random() < petalConfig.spawnRate) {
            const totalCurrentPetals = backgroundPetals.length + foregroundPetals.length;
            if (totalCurrentPetals < totalPetals * 1.5) {
                const newPetalIsForefront = Math.random() < petalConfig.foregroundRatio;
                const newPetal = createSinglePetal(newPetalIsForefront);
                
                if (newPetalIsForefront) {
                    foregroundPetals.push(newPetal);
                    foregroundContainer.addChild(newPetal);
                } else {
                    backgroundPetals.push(newPetal);
                    backgroundContainer.addChild(newPetal);
                }
                
                lastSpawnTime = currentTime;
            }
        }
        
        requestAnimationFrame(updatePetals);
    }
    
    // Iniciar animação contínua
    updatePetals();
    
    // Armazenar referência para controle
    window.backgroundEffectsSystem.petalSystem = {
        backgroundContainer: backgroundContainer,
        foregroundContainer: foregroundContainer,
        backgroundPetals: backgroundPetals,
        foregroundPetals: foregroundPetals,
        config: petalConfig,
        stopAnimation: () => { animationActive = false; },
        isActive: () => animationActive
    };
    
    console.log(`✅ Sistema de pétalas contínuas (2 camadas) iniciado:`);
    console.log(`   - Fundo (z-index 1): ${backgroundCount} pétalas`);
    console.log(`   - Frente (z-index 500): ${foregroundCount} pétalas`);
    return true;
}

// Parar sistema de pétalas
function stopContinuousPetals() {
    if (window.backgroundEffectsSystem.petalSystem) {
        window.backgroundEffectsSystem.petalSystem.stopAnimation();
        
        // Limpar container de fundo
        if (window.backgroundEffectsSystem.backgroundApp && window.backgroundEffectsSystem.petalSystem.backgroundContainer) {
            window.backgroundEffectsSystem.backgroundApp.stage.removeChild(window.backgroundEffectsSystem.petalSystem.backgroundContainer);
            window.backgroundEffectsSystem.petalSystem.backgroundContainer.destroy({ children: true });
        }
        
        // Limpar container de frente
        if (window.backgroundEffectsSystem.foregroundApp && window.backgroundEffectsSystem.petalSystem.foregroundContainer) {
            window.backgroundEffectsSystem.foregroundApp.stage.removeChild(window.backgroundEffectsSystem.petalSystem.foregroundContainer);
            window.backgroundEffectsSystem.petalSystem.foregroundContainer.destroy({ children: true });
        }
        
        window.backgroundEffectsSystem.petalSystem = null;
        console.log("🌸 Sistema de pétalas (2 camadas) parado");
    }
}

// Redimensionamento responsivo para efeitos de cenário
function resizeBackgroundEffects() {
    if (!window.backgroundEffectsSystem.isInitialized) return;
    
    const backgroundCanvas = window.backgroundEffectsSystem.backgroundCanvas;
    const foregroundCanvas = window.backgroundEffectsSystem.foregroundCanvas;
    const backgroundApp = window.backgroundEffectsSystem.backgroundApp;
    const foregroundApp = window.backgroundEffectsSystem.foregroundApp;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (backgroundCanvas && backgroundApp) {
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
        backgroundApp.renderer.resize(width, height);
    }
    
    if (foregroundCanvas && foregroundApp) {
        foregroundCanvas.width = width;
        foregroundCanvas.height = height;
        foregroundApp.renderer.resize(width, height);
    }
    
    console.log("🌸 Canvas de efeitos de cenário (2 camadas) redimensionados:", width, "x", height);
}

// Atualizar tamanho do canvas
function updateCanvasSize(canvas, container) {
    const rect = container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Detectar se estamos em character-view (personagem maior)
    const isCharacterView = document.querySelector('.battle-arena.character-view') !== null;
    const isZoomView = document.querySelector('.battle-arena.zoom-view') !== null;
    
    // Calcular fator de qualidade baseado na view atual
    let qualityFactor = devicePixelRatio;
    
    if (isCharacterView) {
        qualityFactor = Math.min(devicePixelRatio * 2.5, 4);
    } else if (isZoomView) {
        qualityFactor = Math.min(devicePixelRatio * 1.8, 3);
    } else {
        qualityFactor = Math.min(devicePixelRatio * 1.2, 2);
    }
    
    // Canvas interno (alta resolução para qualidade)
    canvas.width = rect.width * qualityFactor;
    canvas.height = rect.height * qualityFactor;
    
    // Canvas visual (tamanho real na tela)
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    console.log(`🎭 PixiJS: Canvas ${canvas.id} redimensionado para ${canvas.width}x${canvas.height} (visual: ${rect.width}x${rect.height}, qualidade: ${qualityFactor.toFixed(1)}x)`);
}

function setupResponsiveResize() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("🎭 PixiJS: Redimensionando canvas responsivamente");
            
            if (window.pixieSystem.isInitialized) {
                const characterContainer = document.getElementById('character');
                const bossContainer = document.getElementById('boss');
                
                if (characterContainer) {
                    updateCanvasSize(document.getElementById('character-fx-front'), characterContainer);
                    updateCanvasSize(document.getElementById('character-fx-back'), characterContainer);
                    
                    if (window.pixieSystem.characterFrontApp) {
                        window.pixieSystem.characterFrontApp.renderer.resize(
                            document.getElementById('character-fx-front').width,
                            document.getElementById('character-fx-front').height
                        );
                    }
                    if (window.pixieSystem.characterBackApp) {
                        window.pixieSystem.characterBackApp.renderer.resize(
                            document.getElementById('character-fx-back').width,
                            document.getElementById('character-fx-back').height
                        );
                    }
                }
                
                if (bossContainer) {
                    updateCanvasSize(document.getElementById('boss-fx-front'), bossContainer);
                    updateCanvasSize(document.getElementById('boss-fx-back'), bossContainer);
                    
                    if (window.pixieSystem.bossFrontApp) {
                        window.pixieSystem.bossFrontApp.renderer.resize(
                            document.getElementById('boss-fx-front').width,
                            document.getElementById('boss-fx-front').height
                        );
                    }
                    if (window.pixieSystem.bossBackApp) {
                        window.pixieSystem.bossBackApp.renderer.resize(
                            document.getElementById('boss-fx-back').width,
                            document.getElementById('boss-fx-back').height
                        );
                    }
                }
                
                // Forçar re-renderização após redimensionamento
                if (window.pixieSystem.characterFrontApp) window.pixieSystem.characterFrontApp.render();
                if (window.pixieSystem.characterBackApp) window.pixieSystem.characterBackApp.render();
                if (window.pixieSystem.bossFrontApp) window.pixieSystem.bossFrontApp.render();
                if (window.pixieSystem.bossBackApp) window.pixieSystem.bossBackApp.render();

                // Redimensionar efeitos de cenário
                resizeBackgroundEffects();
            }
        }, 250);
    });
}

// Função principal para tocar efeito PixiJS
function playPixiEffect(effectName, target, layer, callerFunction = 'unknown') {
    if (!window.pixieSystem.isInitialized) {
        console.error("❌ PixiJS: Sistema não inicializado! Chamado por:", callerFunction);
        return false;
    }
    
    // BUSCAR EFEITO: Vinhetas (shaders) OU efeitos antigos (partículas/filtros)
    let effect = null;
    let isVignetteEffect = false;

    // 1. Verificar vinhetas com shaders (battle-vignette-part1.js)
    if (window.ATTACK_VIGNETTES && window.ATTACK_VIGNETTES[effectName]) {
        effect = window.ATTACK_VIGNETTES[effectName];
        isVignetteEffect = true;
        console.log(`✅ Encontrado como vinheta com shader: ${effectName}`);
    } 
    // 2. Verificar efeitos antigos (fx-attacks.js)
    else if (window.ATTACK_EFFECTS && window.ATTACK_EFFECTS[effectName]) {
        effect = window.ATTACK_EFFECTS[effectName];
        console.log(`✅ Encontrado como efeito de ataque: ${effectName}`);
    }
    // 3. Outros efeitos especiais se existirem
    else if (window.SPECIAL_EFFECTS && window.SPECIAL_EFFECTS[effectName]) {
        effect = window.SPECIAL_EFFECTS[effectName];
        console.log(`✅ Encontrado como efeito especial: ${effectName}`);
    }
    
    if (!effect) {
        console.error(`❌ PixiJS: Efeito '${effectName}' não encontrado! Chamado por:`, callerFunction);
        return false;
    }
    
    const startTime = Date.now();
    
    console.log(`🎭 PixiJS: Iniciando efeito '${effectName}' no ${target}/${layer}`);
    console.log(`   - Duração: ${effect.duration}ms`);
    console.log(`   - Tipo: ${isVignetteEffect ? 'Vinheta com Shader' : 'Efeito com Partículas'}`);
    console.log(`   - Chamado por função: ${callerFunction}`);
    
    // Determinar qual aplicação PixiJS usar
    let app = null;
    let zIndex = 0;
    
    if (target === 'character' && layer === 'front') {
        app = window.pixieSystem.characterFrontApp;
        zIndex = 46;
    } else if (target === 'character' && layer === 'back') {
        app = window.pixieSystem.characterBackApp;
        zIndex = 1;
    } else if (target === 'boss' && layer === 'front') {
        app = window.pixieSystem.bossFrontApp;
        zIndex = 25;
    } else if (target === 'boss' && layer === 'back') {
        app = window.pixieSystem.bossBackApp;
        zIndex = 1;
    } else {
        console.error(`❌ PixiJS: Combinação target/layer inválida: ${target}/${layer}`);
        return false;
    }
    
    if (!app) {
        console.error(`❌ PixiJS: Aplicação não encontrada para ${target}/${layer}`);
        return false;
    }
    
    console.log(`   - Z-Index: ${zIndex}`);
    console.log(`   - Canvas: ${app.view.width}x${app.view.height}`);
    
    // Criar container para o efeito
    const effectContainer = new PIXI.Container();
    effectContainer.x = app.view.width / 2;
    effectContainer.y = app.view.height / 2;
    
    // PROCESSAR VINHETAS COM SHADERS CUSTOMIZADOS
    if (isVignetteEffect) {
        console.log(`🎨 Processando vinheta com shader customizado`);
        
        try {
            // SHADER CUSTOMIZADO (prioridade máxima)
            if (effect.customShader && effect.customShader.enabled) {
                console.log("🔍 Aplicando shader customizado:", effect.customShader.type);
                
                const customFilter = new PIXI.Filter(
                    effect.customShader.vertex,
                    effect.customShader.fragment,
                    effect.customShader.uniforms
                );
                
                if (!effectContainer.filters) {
                    effectContainer.filters = [];
                }
                effectContainer.filters.push(customFilter);
                
                // Animar uniforms do shader
                let shaderAnimationActive = true;
                const shaderStartTime = Date.now();
                
                const animateShader = () => {
                    if (!shaderAnimationActive || !effectContainer.filters) return;
                    
                    const elapsed = (Date.now() - shaderStartTime) / 1000;
                    const progress = Math.min(elapsed / (effect.duration / 1000), 1);
                    
                    // Atualizar uniforms
                    customFilter.uniforms.time = elapsed;
                    const base = Math.sin(progress * Math.PI);
                    customFilter.uniforms.intensity = Math.pow(base, 1.1) * 0.8;
                    customFilter.uniforms.fadeProgress = progress;
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateShader);
                    } else {
                        shaderAnimationActive = false;
                        console.log("🎨 Animação do shader customizado finalizada");
                    }
                };
                
                animateShader();
                effectContainer.stopShaderAnimation = () => { shaderAnimationActive = false; };
                
                console.log("✅ Shader customizado aplicado e animação iniciada");
            }
            
            // PARTÍCULAS das vinhetas (se existirem)
            if (effect.particles) {
                console.log("🔍 Adicionando partículas da vinheta");
                const particleSystem = createManualParticles(effect.particles, app, effect.duration);
                if (particleSystem) {
                    particleSystem.zIndex = 5;
                    effectContainer.addChild(particleSystem);
                    console.log("✅ Partículas da vinheta adicionadas");
                }
            }
            
        } catch (vignetteError) {
            console.error("❌ Erro ao processar vinheta:", vignetteError);
        }
    } 
    // PROCESSAR EFEITOS ANTIGOS (fx-attacks.js)
    else {
        console.log(`🎨 Processando efeito de ataque com partículas`);
        
        // Partículas manuais
        if (effect.particles) {
            const particleSystem = createManualParticles(effect.particles, app, effect.duration);
            if (particleSystem) {
                effectContainer.addChild(particleSystem);
                console.log(`✅ Partículas criadas: ${effect.particles.count} partículas`);
            }
        }
        
        // Filtros
        if (effect.filters) {
            const filters = createManualFilters(effect.filters);
            if (filters.length > 0) {
                effectContainer.filters = filters;
                console.log(`✅ Filtros aplicados: ${Object.keys(effect.filters).join(', ')}`);
            }
        }
    }
    
    // Adicionar efeito ao stage
    app.stage.addChild(effectContainer);
    
    // Registrar efeito ativo
    const effectData = {
        id: Date.now() + Math.random(),
        name: effectName,
        target: target,
        layer: layer,
        container: effectContainer,
        app: app,
        startTime: startTime,
        duration: effect.duration,
        callerFunction: callerFunction
    };
    
    window.pixieSystem.activeEffects.push(effectData);
    
    console.log(`   - ID do efeito: ${effectData.id}`);
    console.log(`   - Efeitos ativos: ${window.pixieSystem.activeEffects.length}`);
    
    // Programar limpeza automática
    setTimeout(() => {
        cleanupPixiEffect(effectData.id, callerFunction);
    }, effect.duration);
    
    return true;
}

// Criar partículas MANUAIS (USADO PELO fx-attacks.js)
function createManualParticles(particleConfig, app, duration) {
    try {
        console.log("🎨 Criando partículas manuais:", particleConfig);
        
        const particleContainer = new PIXI.Container();
        const particles = [];
        
        // Criar partículas individuais com propriedades avançadas
        for (let i = 0; i < particleConfig.count; i++) {
            const particle = new PIXI.Graphics();
            
            // Tipo de partícula baseado no efeito especial
            if (particleConfig.sparkle) {
                // Partícula estrelinha
                particle.beginFill(0xffffff);
                const radius = Math.random() * 2 + 2;
                const spikes = 5;
                const outerRadius = radius;
                const innerRadius = radius * 0.5;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const angle = (i * Math.PI) / spikes;
                    const r = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    
                    if (i === 0) {
                        particle.moveTo(x, y);
                    } else {
                        particle.lineTo(x, y);
                    }
                }
                particle.closePath();
                particle.endFill();
            } else if (particleConfig.crystalline) {
                // Partícula cristalina
                particle.beginFill(0xffffff);
                particle.drawPolygon([0, -3, 2, 0, 0, 3, -2, 0]);
                particle.endFill();
            } else if (particleConfig.electric) {
                // Partícula elétrica com zig-zag
                particle.lineStyle(1.5, 0xffffff, 1.0);
                const segments = 4;
                const totalLength = 6;
                particle.moveTo(0, -totalLength/2);
                
                for (let seg = 1; seg <= segments; seg++) {
                    const y = (-totalLength/2) + (totalLength / segments) * seg;
                    const x = (seg % 2 === 0) ? 1.5 : -1.5;
                    particle.lineTo(x, y);
                }
                
                // Adicionar ramo lateral
                particle.moveTo(-1, 0);
                particle.lineTo(-2.5, -1);
                particle.moveTo(1, 0);
                particle.lineTo(2.5, 1);
                particle.endFill();
            } else if (particleConfig.magical) {
                // Partícula mágica
                particle.beginFill(0xffffff);
                particle.drawCircle(0, 0, Math.random() * 1.5 + 1);
                particle.endFill();
                // Adicionar anel mágico
                particle.lineStyle(0.5, 0xffffff, 0.8);
                particle.drawCircle(0, 0, Math.random() * 3 + 2);
            } else if (particleConfig.explosive) {
                // Partícula explosiva
                particle.beginFill(0xffffff);
                const points = [];
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 2 + Math.random() * 2;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                particle.drawPolygon(points);
                particle.endFill();
            } else if (particleConfig.metallic) {
                // Partícula metálica
                particle.beginFill(0xffffff);
                const metalPoints = [-2, -1, 0, -2, 2, -1, 1, 2, -1, 2];
                particle.drawPolygon(metalPoints);
                particle.endFill();
                // Adicionar brilho metálico
                particle.lineStyle(0.5, 0xffffff, 0.9);
                particle.moveTo(-1, -1); particle.lineTo(1, 1);
            } else if (particleConfig.wind) {
                // Partícula de vento
                particle.beginFill(0xffffff, 0.7);
                particle.lineStyle(1.5, 0xffffff, 0.8);
                particle.moveTo(-3, 0);
                particle.quadraticCurveTo(0, -2, 3, 0);
                particle.quadraticCurveTo(0, 1, -2, 0);
                particle.endFill();
            } else {
                // Partícula circular padrão
                particle.beginFill(0xffffff);
                particle.drawCircle(0, 0, Math.random() * 2 + 1.5);
                particle.endFill();
            }
            
            // Posição inicial baseada no tipo de emissor
            let angle, radius;
            if (particleConfig.emitterType === "burst") {
                angle = Math.random() * Math.PI * 2;
                radius = Math.random() * (particleConfig.radius || 30);
            } else {
                angle = Math.random() * Math.PI * 2;
                radius = Math.random() * (particleConfig.radius || 50);
            }
            
            particle.x = Math.cos(angle) * radius;
            particle.y = Math.sin(angle) * radius;
            
            // Propriedades da partícula
            particle.life = Math.random() * (particleConfig.lifetime.max - particleConfig.lifetime.min) + particleConfig.lifetime.min;
            particle.maxLife = particle.life;
            particle.age = 0;
            
            // Velocidade inicial
            const baseSpeed = Math.random() * (particleConfig.speed.max - particleConfig.speed.min) + particleConfig.speed.min;
            const turbulence = particleConfig.turbulence || 0;
            const turbulenceX = (Math.random() - 0.5) * turbulence;
            const turbulenceY = (Math.random() - 0.5) * turbulence;
            
            if (particleConfig.emitterType === "burst") {
                particle.vx = Math.cos(angle) * baseSpeed + turbulenceX;
                particle.vy = Math.sin(angle) * baseSpeed + turbulenceY;
            } else {
                particle.vx = Math.cos(angle) * baseSpeed * 0.3 + turbulenceX;
                particle.vy = Math.sin(angle) * baseSpeed * 0.3 + turbulenceY;
            }
            
            // Gravidade
            particle.gravity = particleConfig.gravity || { x: 0, y: 0 };
            
            // Cor inicial e final
            const startColor = parseInt(particleConfig.startColor.replace('#', ''), 16);
            const endColor = parseInt(particleConfig.endColor.replace('#', ''), 16);
            particle.tint = startColor;
            particle.startColor = startColor;
            particle.endColor = endColor;
            
            // Escala inicial e final
            const startScale = Math.random() * (particleConfig.startScale.max - particleConfig.startScale.min) + particleConfig.startScale.min;
            const endScale = Math.random() * (particleConfig.endScale.max - particleConfig.endScale.min) + particleConfig.endScale.min;
            particle.scale.set(startScale);
            particle.startScale = startScale;
            particle.endScale = endScale;
            
            // Alpha inicial e final
            particle.alpha = particleConfig.startAlpha;
            particle.startAlpha = particleConfig.startAlpha;
            particle.endAlpha = particleConfig.endAlpha;
            
            particleContainer.addChild(particle);
            particles.push(particle);
        }
        
        console.log(`✅ ${particles.length} partículas manuais criadas`);
        
        // Sistema de atualização das partículas
        let animationActive = true;
        const updateParticles = () => {
            if (!animationActive) return;
            
            const deltaTime = 0.016;
            let aliveCount = 0;
            
            particles.forEach(particle => {
                if (particle && particle.parent && particle.age < particle.maxLife) {
                    // Atualizar idade
                    particle.age += deltaTime;
                    const lifePercent = particle.age / particle.maxLife;
                    
                    // Aplicar gravidade à velocidade
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
                console.log("🎨 Todas as partículas manuais finalizaram");
            }
        };
        
        updateParticles();
        particleContainer.stopAnimation = () => { animationActive = false; };
        
        return particleContainer;
        
    } catch (error) {
        console.error("❌ PixiJS: Erro ao criar partículas manuais:", error);
        return null;
    }
}

// Criar filtros MANUAIS (USADO PELO fx-attacks.js)
function createManualFilters(filterConfig) {
    const filters = [];
    
    try {
        console.log("🎨 Criando filtros manuais:", Object.keys(filterConfig));
        
        // Color Matrix Filter
        if (filterConfig.colorMatrix) {
            try {
                const colorMatrix = new PIXI.ColorMatrixFilter();
                
                if (filterConfig.colorMatrix.brightness !== undefined) {
                    colorMatrix.brightness(filterConfig.colorMatrix.brightness, false);
                    console.log(`     - Brightness aplicado: ${filterConfig.colorMatrix.brightness}`);
                }
                if (filterConfig.colorMatrix.contrast !== undefined) {
                    colorMatrix.contrast(filterConfig.colorMatrix.contrast, false);
                    console.log(`     - Contrast aplicado: ${filterConfig.colorMatrix.contrast}`);
                }
                if (filterConfig.colorMatrix.saturation !== undefined) {
                    colorMatrix.saturate(filterConfig.colorMatrix.saturation, false);
                    console.log(`     - Saturation aplicado: ${filterConfig.colorMatrix.saturation}`);
                }
                
                filters.push(colorMatrix);
                console.log(`     ✅ ColorMatrix filter ativo`);
            } catch (colorError) {
                console.error("❌ Erro ao criar ColorMatrixFilter:", colorError);
            }
        }
        
        // Blur Filter
        if (filterConfig.blur) {
            try {
                const BlurFilterClass = PIXI.BlurFilter || PIXI.filters.BlurFilter;
                const blur = new BlurFilterClass(
                    filterConfig.blur.strength || 5,
                    filterConfig.blur.quality || 4
                );
                filters.push(blur);
                console.log(`     ✅ Blur filter ativo: força=${filterConfig.blur.strength}`);
            } catch (blurError) {
                console.error("❌ Erro ao criar BlurFilter:", blurError);
            }
        }
        
        console.log(`✅ ${filters.length} filtros criados`);
        
    } catch (error) {
        console.error("❌ PixiJS: Erro ao criar filtros:", error);
    }
    
    return filters;
}

// Limpar efeito específico
function cleanupPixiEffect(effectId, callerFunction = 'cleanup') {
    const effectIndex = window.pixieSystem.activeEffects.findIndex(effect => effect.id === effectId);
    
    if (effectIndex === -1) {
        console.warn(`⚠️ PixiJS: Efeito ${effectId} não encontrado para limpeza`);
        return false;
    }
    
    const effect = window.pixieSystem.activeEffects[effectIndex];
    
    // Proteção: NÃO limpar vinhetas de tela completa
    if (effect.app === window.attackVignetteSystem?.app) {
        console.log(`🛡️ Protegendo vinheta de tela completa: ${effect.name}`);
        return false;
    }
    
    const duration = Date.now() - effect.startTime;
    
    console.log(`🎭 PixiJS: Removendo efeito '${effect.name}' (ID: ${effectId})`);
    console.log(`   - Duração real: ${duration}ms`);
    console.log(`   - Função de limpeza: ${callerFunction}`);
    console.log(`   - Target: ${effect.target}/${effect.layer}`);
    
    try {
        if (effect.app && effect.container) {
            // Parar loops de animação se existirem
            if (effect.container.stopAnimation) {
                effect.container.stopAnimation();
            }

            // Parar animação de shader customizado se existir
            if (effect.container.stopShaderAnimation) {
                effect.container.stopShaderAnimation();
            }
            
            // Forçar limpeza completa do container
            if (effect.container.children) {
                effect.container.children.forEach(child => {
                    if (child.stopAnimation) {
                        child.stopAnimation();
                    }
                    if (child.destroy) {
                        child.destroy({ children: true, texture: false, baseTexture: false });
                    }
                });
            }
            
            // Limpar filtros
            if (effect.container.filters) {
                effect.container.filters = null;
            }

            effect.app.stage.removeChild(effect.container);
            effect.container.destroy({ children: true, texture: true, baseTexture: true });
        }
        
        window.pixieSystem.activeEffects.splice(effectIndex, 1);
        
        console.log(`   - Efeito removido com sucesso. Efeitos restantes: ${window.pixieSystem.activeEffects.length}`);
        return true;
        
    } catch (error) {
        console.error(`❌ PixiJS: Erro ao limpar efeito ${effectId}:`, error);
        window.pixieSystem.activeEffects.splice(effectIndex, 1);
        return false;
    }
}

// Limpar todos os efeitos ativos
function cleanupAllPixiEffects(callerFunction = 'cleanupAll') {
    console.log(`🎭 PixiJS: Limpando todos os efeitos ativos (${window.pixieSystem.activeEffects.length})`);
    console.log(`   - Função chamadora: ${callerFunction}`);
    
    const effectsToClean = [...window.pixieSystem.activeEffects];
    let cleanedCount = 0;
    
    effectsToClean.forEach(effect => {
        // Proteção: Pular vinhetas de tela completa
        if (effect.app === window.attackVignetteSystem?.app) {
            console.log(`🛡️ Protegendo vinheta de tela completa: ${effect.name}`);
            return;
        }
        
        if (cleanupPixiEffect(effect.id, callerFunction)) {
            cleanedCount++;
        }
    });
    
    // Proteção extra: Garantir que as pétalas não sejam removidas
    if (window.sakuraPetalSystem && window.sakuraPetalSystem.isActive && window.sakuraPetalSystem.container) {
        const app = window.attackVignetteSystem?.app;
        if (app && !app.stage.children.includes(window.sakuraPetalSystem.container)) {
            console.log("🌸 Reprotegendo pétalas após limpeza");
            app.stage.addChildAt(window.sakuraPetalSystem.container, 0);
        }
    }
    
    console.log(`🎭 PixiJS: ${cleanedCount}/${effectsToClean.length} efeitos removidos (vinhetas e pétalas protegidas)`);
    return cleanedCount;
}

function isPixiEffect(effectPath) {
    if (!effectPath) return false;
    
    if (effectPath.startsWith('/static/')) {
        return false;
    }

    // Verificar nas vinhetas com shaders
    if (window.ATTACK_VIGNETTES && window.ATTACK_VIGNETTES[effectPath]) {
        return true;
    }
    
    // Verificar nos efeitos de ataque
    if (window.ATTACK_EFFECTS && window.ATTACK_EFFECTS[effectPath]) {
        return true;
    }
    
    // Verificar nos efeitos especiais
    if (window.SPECIAL_EFFECTS && window.SPECIAL_EFFECTS[effectPath]) {
        return true;
    }
    
    return false;
}

// Função de debug para listar efeitos ativos
function debugPixiEffects() {
    console.log("🎭 PixiJS Debug - Efeitos Ativos:");
    console.log(`   - Total: ${window.pixieSystem.activeEffects.length}`);
    
    window.pixieSystem.activeEffects.forEach((effect, index) => {
        const duration = Date.now() - effect.startTime;
        const remaining = Math.max(0, effect.duration - duration);
        
        console.log(`   ${index + 1}. ${effect.name} (ID: ${effect.id})`);
        console.log(`      - Target: ${effect.target}/${effect.layer}`);
        console.log(`      - Duração: ${duration}ms / ${effect.duration}ms`);
        console.log(`      - Restante: ${remaining}ms`);
        console.log(`      - Chamado por: ${effect.callerFunction}`);
    });
    
    return window.pixieSystem.activeEffects.length;
}

// Função para resetar completamente o sistema PixiJS
function resetPixiSystem() {
    console.log("🎭 PixiJS: Resetando sistema completo");
    
    // Proteger pétalas durante reset
    let petalsBackup = null;
    if (window.sakuraPetalSystem && window.sakuraPetalSystem.isActive && window.sakuraPetalSystem.container) {
        console.log("🌸 Fazendo backup das pétalas durante reset");
        petalsBackup = window.sakuraPetalSystem.container;
        if (petalsBackup.parent) {
            petalsBackup.parent.removeChild(petalsBackup);
        }
    }
    
    // Limpar todos os efeitos ativos
    cleanupAllPixiEffects('resetPixiSystem');
    
    // Limpar todos os stages
    if (window.pixieSystem.characterFrontApp && window.pixieSystem.characterFrontApp.stage) {
        window.pixieSystem.characterFrontApp.stage.removeChildren();
    }
    if (window.pixieSystem.characterBackApp && window.pixieSystem.characterBackApp.stage) {
        window.pixieSystem.characterBackApp.stage.removeChildren();
    }
    if (window.pixieSystem.bossFrontApp && window.pixieSystem.bossFrontApp.stage) {
        window.pixieSystem.bossFrontApp.stage.removeChildren();
    }
    if (window.pixieSystem.bossBackApp && window.pixieSystem.bossBackApp.stage) {
        window.pixieSystem.bossBackApp.stage.removeChildren();
    }
    
    // Restaurar pétalas após reset
    if (petalsBackup && window.attackVignetteSystem?.app) {
        console.log("🌸 Restaurando pétalas após reset");
        window.attackVignetteSystem.app.stage.addChildAt(petalsBackup, 0);
    }
    
    // Forçar renderização
    if (window.pixieSystem.characterFrontApp) window.pixieSystem.characterFrontApp.render();
    if (window.pixieSystem.characterBackApp) window.pixieSystem.characterBackApp.render();
    if (window.pixieSystem.bossFrontApp) window.pixieSystem.bossFrontApp.render();
    if (window.pixieSystem.bossBackApp) window.pixieSystem.bossBackApp.render();
    
    console.log("🎭 PixiJS: Reset completo realizado (pétalas preservadas)");
}

// Expor funções globalmente
window.initializePixieSystem = initializePixieSystem;
window.playPixiEffect = playPixiEffect;
window.cleanupPixiEffect = cleanupPixiEffect;
window.cleanupAllPixiEffects = cleanupAllPixiEffects;
window.isPixiEffect = isPixiEffect;
window.debugPixiEffects = debugPixiEffects;
window.resetPixiSystem = resetPixiSystem;

// Expor funções de efeitos de cenário
window.initializeBackgroundEffectsSystem = initializeBackgroundEffectsSystem;
window.createContinuousPetals = createContinuousPetals;
window.stopContinuousPetals = stopContinuousPetals;
window.resizeBackgroundEffects = resizeBackgroundEffects;

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎭 PixiJS: DOM carregado, aguardando inicialização...");
    
    setTimeout(() => {
        if (typeof PIXI !== 'undefined') {
            initializePixieSystem();
        } else {
            console.error("❌ PixiJS: Biblioteca não carregada! Verifique os imports no HTML");
        }
    }, 500);
});

console.log("🎭 PixiJS: Sistema LIMPO carregado - Suporte para vinhetas com shaders + efeitos de ataque");