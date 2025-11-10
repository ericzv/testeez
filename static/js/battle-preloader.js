// battle-preloader.js - Sistema de Pré-carregamento de Assets
// Carrega todos os recursos necessários antes de iniciar a batalha

class BattleAssetPreloader {
    constructor() {
        this.assetsToLoad = [];
        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.loadingScreen = null;
        this.loadingText = null;
        this.progressBar = null;
        this.characterId = null;
        this.enemyData = null;
        this.skillsData = null; // Cachear dados das skills
    }

    /**
     * Inicializa o preloader com os dados do personagem e inimigo
     */
    initialize(characterId, enemyData) {
        this.characterId = characterId;
        this.enemyData = enemyData;

        // Configurar elementos de loading
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingText = this.loadingScreen?.querySelector('.loading-text');

        // Criar barra de progresso
        this.createProgressBar();

        console.log('🎮 Preloader inicializado:', { characterId, enemyData });
    }

    /**
     * Cria a barra de progresso visual
     */
    createProgressBar() {
        if (!this.loadingScreen) {
            console.error('❌ Loading screen não encontrado!');
            return;
        }

        console.log('📊 Criando barra de progresso...');

        const progressContainer = document.createElement('div');
        progressContainer.id = 'preload-progress-container';
        progressContainer.style.cssText = `
            width: 60%;
            max-width: 400px;
            height: 24px;
            background: rgba(0, 0, 0, 0.7);
            border: 3px solid rgba(255, 255, 255, 0.5);
            border-radius: 12px;
            overflow: hidden;
            margin-top: 0;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        `;

        this.progressBar = document.createElement('div');
        this.progressBar.id = 'preload-progress-bar';
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.2s ease-out;
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
        `;

        progressContainer.appendChild(this.progressBar);
        this.loadingScreen.appendChild(progressContainer);

        console.log('✅ Barra de progresso criada');
    }

    /**
     * Coleta todos os assets que precisam ser carregados
     */
    collectAssets() {
        this.assetsToLoad = [];

        // 1. Assets do personagem
        this.collectCharacterAssets();

        // 2. Ícones das habilidades do personagem
        this.collectSkillIcons();

        // 3. Assets do inimigo
        this.collectEnemyAssets();

        // 4. Assets de UI e backgrounds
        this.collectUIAssets();

        // 4. Assets de efeitos comuns
        this.collectEffectAssets();

        this.totalAssets = this.assetsToLoad.length;
        console.log(`📦 Total de assets para carregar: ${this.totalAssets}`);
    }

    /**
     * Coleta sprites do personagem baseado no ID
     */
    collectCharacterAssets() {
        if (!this.characterId || typeof CHARACTER_SPRITE_CONFIG === 'undefined') {
            console.warn('⚠️ Character ID ou CONFIG não disponível');
            return;
        }

        const charConfig = CHARACTER_SPRITE_CONFIG[this.characterId];
        if (!charConfig) {
            console.warn(`⚠️ Configuração não encontrada para: ${this.characterId}`);
            return;
        }

        console.log(`🎨 Coletando sprites do personagem: ${this.characterId}`);

        // Iterar por todas as animações do personagem
        for (const animName in charConfig) {
            const anim = charConfig[animName];
            if (anim && anim.layers) {
                // Adicionar todas as camadas (back_effect, body, weapon, front_effect)
                for (const layerName in anim.layers) {
                    const layerPath = anim.layers[layerName];
                    if (layerPath) {
                        this.assetsToLoad.push({
                            type: 'character_sprite',
                            path: layerPath,
                            description: `${this.characterId} - ${animName} - ${layerName}`
                        });
                    }
                }
            }
        }
    }

    /**
     * Coleta ícones das habilidades do personagem
     */
    collectSkillIcons() {
        console.log('🎯 Coletando ícones de habilidades');

        // Obter skills do gameData
        const attackSkills = window.gameData?.attackSkills || [];
        const specialSkills = window.gameData?.specialSkills || [];

        const allSkills = [...attackSkills, ...specialSkills];

        allSkills.forEach(skill => {
            if (skill.icon) {
                this.assetsToLoad.push({
                    type: 'skill_icon',
                    path: skill.icon,
                    description: `Skill icon: ${skill.name}`
                });
            }
        });

        // Adicionar ícone padrão
        this.assetsToLoad.push({
            type: 'skill_icon',
            path: '/static/game.data/icons/default_skill.png',
            description: 'Default skill icon'
        });
    }

    /**
     * Coleta sprites do inimigo
     */
    collectEnemyAssets() {
        if (!this.enemyData || !this.enemyData.sprite_layers) {
            console.warn('⚠️ Dados do inimigo não disponíveis');
            return;
        }

        console.log('👹 Coletando sprites do inimigo');

        const layers = this.enemyData.sprite_layers;

        // Sprites principais do inimigo
        const layerTypes = ['back', 'body', 'head', 'weapon'];
        layerTypes.forEach(layerType => {
            if (layers[layerType]) {
                const path = `/static/game.data/enemies/${layerType}/${layers[layerType]}`;
                this.assetsToLoad.push({
                    type: 'enemy_sprite',
                    path: path,
                    description: `Enemy - ${layerType}`
                });
            }
        });

        // Sprites de hit animations
        const hitAnimations = [
            '/static/game.data/enemies/hits/blackhit-32-32-5f-160x32.png',
            '/static/game.data/enemies/hits/yellowhit-32-32-5f-160x32.png',
            '/static/game.data/enemies/hits/greenhit-32-32-5f-160x32.png',
            '/static/game.data/enemies/hits/purplehit-32-32-5f-160x32.png',
            '/static/game.data/enemies/hits/redhit-32-32-5f-160x32.png',
            '/static/game.data/enemies/hits/hit1.png',
            '/static/game.data/enemies/hits/hit2.png',
            '/static/game.data/enemies/hits/hit3.png',
            '/static/game.data/enemies/hits/smokeout.png'
        ];

        hitAnimations.forEach(path => {
            this.assetsToLoad.push({
                type: 'enemy_effect',
                path: path,
                description: 'Enemy hit animation'
            });
        });
    }

    /**
     * Coleta assets de UI e backgrounds
     */
    collectUIAssets() {
        console.log('🖼️ Coletando UI e backgrounds');

        const uiAssets = [
            '/static/game.data/energy.png',
            '/static/game.data/turn.png',
            '/static/game.data/icons/default_skill.png'
        ];

        // Backgrounds principais (se existirem paths fixos)
        const backgrounds = [
            // Adicionar paths de background se houver
        ];

        [...uiAssets, ...backgrounds].forEach(path => {
            this.assetsToLoad.push({
                type: 'ui',
                path: path,
                description: 'UI element'
            });
        });
    }

    /**
     * Coleta assets de efeitos comuns
     */
    collectEffectAssets() {
        // Efeitos que são sempre usados podem ser precarregados aqui
        // Por exemplo, partículas, explosões, etc.
        console.log('✨ Coletando efeitos comuns');

        // Adicionar efeitos comuns se necessário
    }

    /**
     * Pré-carrega os dados das habilidades via API
     */
    async preloadSkillsData() {
        try {
            console.log('📡 Pré-carregando dados das habilidades...');
            const response = await fetch('/gamification/player/attacks');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.attacks) {
                this.skillsData = data;
                // Armazenar globalmente para uso imediato
                window.PRELOADED_SKILLS = data;
                console.log(`✅ ${data.attacks.length} habilidades pré-carregadas!`);
            }
        } catch (error) {
            console.warn('⚠️ Erro ao pré-carregar skills:', error);
            // Não falhar o preload por isso
        }
    }

    /**
     * Inicia o carregamento de todos os assets
     */
    async startLoading() {
        console.log('🚀 Iniciando carregamento de assets...');
        this.updateLoadingText('Carregando recursos...');

        this.loadedAssets = 0;
        const promises = [];

        // Carregar dados das skills em paralelo com assets
        promises.push(this.preloadSkillsData());

        // Carregar todas as imagens em paralelo
        for (const asset of this.assetsToLoad) {
            promises.push(this.loadAsset(asset));
        }

        try {
            await Promise.all(promises);
            console.log('✅ Todos os assets carregados!');
            this.updateLoadingText('Preparando batalha...');
            return true;
        } catch (error) {
            console.error('❌ Erro ao carregar assets:', error);
            this.updateLoadingText('Erro ao carregar recursos. Iniciando mesmo assim...');
            return false;
        }
    }

    /**
     * Carrega um único asset
     */
    loadAsset(asset) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.loadedAssets++;
                this.updateProgress();
                // Log reduzido - apenas para debug se necessário
                // console.log(`✓ ${asset.description}`);
                resolve(asset);
            };

            img.onerror = () => {
                this.loadedAssets++;
                this.updateProgress();
                console.warn(`⚠️ Falha ao carregar: ${asset.description} (${asset.path})`);
                // Não rejeitar para não bloquear outros assets
                resolve(asset);
            };

            img.src = asset.path;
        });
    }

    /**
     * Atualiza a barra de progresso
     */
    updateProgress() {
        if (!this.progressBar) {
            console.warn('⚠️ progressBar não disponível para atualização');
            return;
        }

        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.progressBar.style.width = `${progress}%`;

        // Log a cada 10% de progresso
        if (this.loadedAssets % Math.max(1, Math.floor(this.totalAssets / 10)) === 0) {
            console.log(`📈 Progresso: ${progress.toFixed(1)}% (${this.loadedAssets}/${this.totalAssets})`);
        }

        this.updateLoadingText(
            `Carregando recursos... ${this.loadedAssets}/${this.totalAssets} (${progress.toFixed(0)}%)`
        );
    }

    /**
     * Atualiza o texto de loading
     */
    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    /**
     * Remove a tela de loading e inicia a batalha
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            this.loadingScreen.style.opacity = '0';

            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                console.log('🎮 Batalha iniciada!');
            }, 500);
        }
    }
}

// Criar instância global
window.battlePreloader = new BattleAssetPreloader();

// Função principal para iniciar o preload
async function initializeBattlePreloader() {
    console.log('=== BATTLE PRELOADER INICIANDO ===');

    // Aguardar dados estarem disponíveis
    await waitForGameData();

    // Obter dados do personagem e inimigo
    const characterId = window.gameData?.characterId || document.getElementById('current-character')?.textContent;
    const enemyData = window.currentEnemy || {}; // Será populado pelo battle-base.js

    // Inicializar preloader
    window.battlePreloader.initialize(characterId, enemyData);

    // Aguardar CHARACTER_SPRITE_CONFIG estar disponível
    await waitForCharacterConfig();

    // Coletar todos os assets
    window.battlePreloader.collectAssets();

    // Iniciar carregamento
    await window.battlePreloader.startLoading();

    console.log('=== PRELOAD CONCLUÍDO ===');

    // Remover loading screen será feito pelo battle-base.js após inicialização completa
}

/**
 * Aguarda os dados do jogo estarem disponíveis
 */
function waitForGameData() {
    return new Promise((resolve) => {
        if (window.gameData) {
            resolve();
            return;
        }

        const checkInterval = setInterval(() => {
            if (window.gameData) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Timeout após 5 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ gameData não disponível, continuando...');
            resolve();
        }, 5000);
    });
}

/**
 * Aguarda a configuração de sprites estar disponível
 */
function waitForCharacterConfig() {
    return new Promise((resolve) => {
        if (typeof CHARACTER_SPRITE_CONFIG !== 'undefined') {
            resolve();
            return;
        }

        const checkInterval = setInterval(() => {
            if (typeof CHARACTER_SPRITE_CONFIG !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Timeout após 5 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ CHARACTER_SPRITE_CONFIG não disponível, continuando...');
            resolve();
        }, 5000);
    });
}

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBattlePreloader);
} else {
    initializeBattlePreloader();
}
