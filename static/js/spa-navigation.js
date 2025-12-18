/**
 * SPA Navigation System - Gamification Single Page
 * Gerencia transições suaves entre Hub e Battle
 */

window.SPANavigation = (function() {
    'use strict';

    // Estado da SPA
    const state = {
        currentView: 'hub',
        isTransitioning: false,
        battleScriptsLoaded: false,
        battleInitialized: false,
        pendingBattleData: null
    };

    // Elementos DOM
    let hubView, battleView, loadingOverlay, transitionFlash;

    // Scripts de batalha para lazy loading
    const battleScripts = [
        '/static/js/performance-manager.js',
        '/static/js/image-optimizer.js',
        '/static/js/fx-attacks.js',
        '/static/js/fx-specials.js',
        '/static/js/battle-vignette-part1.js',
        '/static/js/battle-vignette-part2.js',
        '/static/js/battle-vignette-part3.js',
        '/static/js/battle-vignette-part4.js',
        '/static/js/vignette-integration.js',
        '/static/js/battle-preloader.js',
        '/static/js/battle-class-animations.js',
        '/static/js/battle-blood-stacks.js',
        '/static/js/battle-base.js',
        '/static/js/battle-combat-system.js',
        '/static/js/battle-skills-system.js',
        '/static/js/battle-animation.js',
        '/static/js/battle-turns.js',
        '/static/js/battle-memory-system.js',
        '/static/js/fast-battle-mode.js',
        '/static/js/battle-skill-test.js',
        '/static/js/battle-skill-test-integration.js'
    ];

    // CSS de batalha
    const battleStyles = [
        '/static/css/battle.css',
        '/static/css/battle-turns.css',
        '/static/css/fast-battle-mode.css',
        '/static/css/battle-skill-test.css',
        '/static/css/enemy-skills.css'
    ];

    /**
     * Inicialização
     */
    function init() {
        // Cache elementos DOM
        hubView = document.getElementById('hub-view');
        battleView = document.getElementById('battle-view');
        loadingOverlay = document.getElementById('spa-loading-overlay');
        transitionFlash = document.getElementById('spa-transition-flash');

        if (!hubView || !battleView) {
            console.warn('SPA Views not found, running in legacy mode');
            return;
        }

        // Definir view inicial
        hubView.classList.add('active');

        // Interceptar navegação para batalha
        interceptBattleNavigation();

        // Configurar botão de voltar
        setupBackButton();

        // Verificar URL inicial
        checkInitialRoute();

        console.log('SPA Navigation initialized');
    }

    /**
     * Intercepta navegação para batalha
     */
    function interceptBattleNavigation() {
        // Interceptar links e botões de batalha
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a, button');
            if (!target) return;

            // Verificar se é navegação para batalha
            const href = target.getAttribute('href') || '';
            const onclick = target.getAttribute('onclick') || '';

            if (href.includes('/gamification/battle') ||
                onclick.includes('goToBattle') ||
                target.classList.contains('battle-btn')) {

                e.preventDefault();
                e.stopPropagation();
                navigateToBattle();
            }
        });

        // Sobrescrever função goToBattle global
        window.goToBattleSPA = navigateToBattle;
    }

    /**
     * Configura botão de voltar ao hub
     */
    function setupBackButton() {
        const backBtn = document.getElementById('spa-back-to-hub');
        if (backBtn) {
            backBtn.addEventListener('click', navigateToHub);
        }
    }

    /**
     * Verifica rota inicial
     */
    function checkInitialRoute() {
        // Se URL indica batalha, carregar direto
        if (window.location.pathname.includes('/battle')) {
            // Já estamos na batalha via rota normal
            state.currentView = 'battle';
        }
    }

    /**
     * Navega para batalha
     */
    async function navigateToBattle() {
        if (state.isTransitioning) return;
        if (state.currentView === 'battle') return;

        state.isTransitioning = true;
        console.log('Navigating to battle...');

        try {
            // Mostrar loading
            showLoading('Preparando batalha...');

            // 1. Verificar se há inimigo selecionado
            const battleData = await fetchBattleData();

            if (!battleData.success || (!battleData.enemy && !battleData.boss)) {
                hideLoading();
                state.isTransitioning = false;

                // Abrir seleção de inimigo
                if (typeof openMapPopup === 'function') {
                    openMapPopup();
                } else if (typeof openBossSelection === 'function') {
                    openBossSelection();
                }
                return;
            }

            // 2. Carregar scripts de batalha se necessário
            if (!state.battleScriptsLoaded) {
                await loadBattleAssets();
                state.battleScriptsLoaded = true;
            }

            // 3. Atualizar dados da batalha no DOM
            state.pendingBattleData = battleData;
            updateBattleViewData(battleData);

            // 4. Executar transição visual
            await performTransition('hub', 'battle');

            // 5. Inicializar batalha
            initializeBattle(battleData);

            // Atualizar estado
            state.currentView = 'battle';

            // Atualizar URL sem reload
            history.pushState({ view: 'battle' }, '', '/gamification/battle');

        } catch (error) {
            console.error('Error navigating to battle:', error);
            hideLoading();
        }

        state.isTransitioning = false;
    }

    /**
     * Navega para hub
     */
    async function navigateToHub() {
        if (state.isTransitioning) return;
        if (state.currentView === 'hub') return;

        state.isTransitioning = true;
        console.log('Navigating to hub...');

        try {
            showLoading('Voltando ao hub...');

            // Pausar/limpar battle se necessário
            cleanupBattle();

            // Executar transição visual
            await performTransition('battle', 'hub');

            // Atualizar dados do hub
            await refreshHubData();

            // Atualizar estado
            state.currentView = 'hub';

            // Atualizar URL sem reload
            history.pushState({ view: 'hub' }, '', '/gamification/');

        } catch (error) {
            console.error('Error navigating to hub:', error);
        }

        hideLoading();
        state.isTransitioning = false;
    }

    /**
     * Busca dados de batalha
     */
    async function fetchBattleData() {
        try {
            const response = await fetch('/gamification/get_battle_data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching battle data:', error);
            return { success: false };
        }
    }

    /**
     * Carrega assets de batalha (lazy loading)
     */
    async function loadBattleAssets() {
        console.log('Loading battle assets...');

        // Carregar CSS
        for (const cssUrl of battleStyles) {
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                document.head.appendChild(link);
            }
        }

        // Carregar scripts sequencialmente (ordem importa!)
        for (const scriptUrl of battleScripts) {
            await loadScript(scriptUrl);
        }

        console.log('Battle assets loaded');
    }

    /**
     * Carrega um script dinamicamente
     */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * Atualiza dados da view de batalha
     */
    function updateBattleViewData(data) {
        const enemy = data.enemy || data.boss;
        if (!enemy) return;

        // Atualizar elementos de dados
        const bossNameEl = document.getElementById('boss-info-name');
        const bossHpEl = document.getElementById('boss-info-hp');
        const bossDamageEl = document.getElementById('boss-info-damage');
        const bossQuoteEl = document.getElementById('boss-info-quote');

        if (bossNameEl) bossNameEl.textContent = enemy.name || 'Inimigo';
        if (bossHpEl) bossHpEl.textContent = `${enemy.hp}/${enemy.max_hp}`;
        if (bossDamageEl) bossDamageEl.textContent = enemy.damage || enemy.basic_attack_damage || 15;
        if (bossQuoteEl) bossQuoteEl.textContent = enemy.quote || '';

        // Atualizar barras de HP
        const bossHpBar = document.getElementById('small-boss-hp-bar');
        if (bossHpBar) {
            const hpPercent = (enemy.hp / enemy.max_hp) * 100;
            bossHpBar.style.width = `${hpPercent}%`;
        }

        // Atualizar dados globais do jogo
        if (window.gameState) {
            window.gameState.boss = {
                name: enemy.name,
                hp: enemy.hp,
                maxHp: enemy.max_hp,
                description: enemy.quote || ''
            };
        }
    }

    /**
     * Executa transição visual
     */
    function performTransition(from, to) {
        return new Promise((resolve) => {
            const fromView = from === 'hub' ? hubView : battleView;
            const toView = to === 'hub' ? hubView : battleView;

            // Flash de transição
            if (transitionFlash) {
                transitionFlash.classList.add('active');
                setTimeout(() => transitionFlash.classList.remove('active'), 500);
            }

            // Animar saída
            fromView.classList.add(from === 'hub' ? 'exiting-to-battle' : 'exiting-to-hub');

            setTimeout(() => {
                // Remover classes
                fromView.classList.remove('active', 'exiting-to-battle', 'exiting-to-hub');

                // Animar entrada
                toView.classList.add('active');
                toView.classList.add(to === 'battle' ? 'entering-from-hub' : 'entering-from-battle');

                setTimeout(() => {
                    toView.classList.remove('entering-from-hub', 'entering-from-battle');
                    hideLoading();
                    resolve();
                }, 500);
            }, 400);
        });
    }

    /**
     * Inicializa sistema de batalha
     */
    function initializeBattle(data) {
        console.log('Initializing battle...');

        // Re-inicializar sistemas de batalha
        if (typeof initializeCharacterContainer === 'function') {
            initializeCharacterContainer();
        }

        if (typeof initializeBossSprite === 'function') {
            initializeBossSprite();
        }

        // Disparar evento de batalha iniciada
        document.dispatchEvent(new CustomEvent('battleStarted', { detail: data }));

        state.battleInitialized = true;
    }

    /**
     * Limpa recursos de batalha
     */
    function cleanupBattle() {
        console.log('Cleaning up battle...');

        // Pausar animações
        if (typeof pauseAllAnimations === 'function') {
            pauseAllAnimations();
        }

        // Limpar canvas se existir
        const canvases = battleView.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Disparar evento de limpeza
        document.dispatchEvent(new CustomEvent('battleCleanup'));
    }

    /**
     * Atualiza dados do hub
     */
    async function refreshHubData() {
        try {
            // Atualizar currencies
            if (typeof updateCurrencyDisplay === 'function') {
                await updateCurrencyDisplay();
            }

            // Atualizar buffs
            if (typeof updateActiveRunBuffs === 'function') {
                await updateActiveRunBuffs();
            }

            // Atualizar relíquias
            if (typeof updateActiveRelics === 'function') {
                await updateActiveRelics();
            }

            // Verificar vitória recente
            if (typeof checkForRecentVictory === 'function') {
                checkForRecentVictory();
            }
        } catch (error) {
            console.error('Error refreshing hub data:', error);
        }
    }

    /**
     * Mostra overlay de loading
     */
    function showLoading(text) {
        if (!loadingOverlay) return;

        const textEl = loadingOverlay.querySelector('.spa-loading-text');
        if (textEl) textEl.textContent = text || 'Carregando...';

        loadingOverlay.classList.add('visible');
    }

    /**
     * Esconde overlay de loading
     */
    function hideLoading() {
        if (!loadingOverlay) return;
        loadingOverlay.classList.remove('visible');
    }

    /**
     * Handler para navegação do browser (back/forward)
     */
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.view) {
            if (e.state.view === 'battle' && state.currentView === 'hub') {
                navigateToBattle();
            } else if (e.state.view === 'hub' && state.currentView === 'battle') {
                navigateToHub();
            }
        }
    });

    // API pública
    return {
        init,
        navigateToBattle,
        navigateToHub,
        getCurrentView: () => state.currentView,
        isTransitioning: () => state.isTransitioning
    };

})();

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    SPANavigation.init();
});
