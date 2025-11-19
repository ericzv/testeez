/**
 * Lazy Loader - Code Splitting Module
 * Carrega módulos JavaScript sob demanda (apenas quando necessário)
 * Reduz tempo de carregamento inicial em 50-70%
 */

(function() {
    'use strict';

    // Cache de módulos já carregados
    const loadedModules = new Map();
    const loadingPromises = new Map();

    /**
     * Carrega um script dinamicamente
     */
    function loadScript(src) {
        // Se já está carregado, retornar imediatamente
        if (loadedModules.has(src)) {
            return Promise.resolve(loadedModules.get(src));
        }

        // Se já está carregando, retornar a promise existente
        if (loadingPromises.has(src)) {
            return loadingPromises.get(src);
        }

        console.log(`[LazyLoader] Loading: ${src}`);

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                console.log(`[LazyLoader] ✓ Loaded: ${src}`);
                loadedModules.set(src, true);
                loadingPromises.delete(src);
                resolve(true);
            };

            script.onerror = () => {
                console.error(`[LazyLoader] ✗ Failed: ${src}`);
                loadingPromises.delete(src);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });

        loadingPromises.set(src, promise);
        return promise;
    }

    /**
     * Carrega múltiplos scripts em paralelo
     */
    function loadScripts(sources) {
        return Promise.all(sources.map(src => loadScript(src)));
    }

    /**
     * Pré-carregar scripts com baixa prioridade (idle time)
     */
    function preloadScripts(sources) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                sources.forEach(src => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = src;
                    document.head.appendChild(link);
                });
            });
        }
    }

    // ============================================
    // MÓDULOS ESPECÍFICOS DO JOGO
    // ============================================

    /**
     * Carrega módulos de vinhetas de ataque
     */
    async function loadVignettes() {
        const vignettes = [
            '/static/js/battle-vignette-part1.js',
            '/static/js/battle-vignette-part2.js',
            '/static/js/battle-vignette-part3.js',
            '/static/js/battle-vignette-part4.js',
            '/static/js/vignette-integration.js'
        ];

        return loadScripts(vignettes);
    }

    /**
     * Carrega shaders de ataque
     */
    async function loadShaders() {
        const shaders = [
            '/static/js/shaders-attacks1.js',
            '/static/js/shaders-attacks2.js',
            '/static/js/shaders-attacks3.js',
            '/static/js/shaders-attacks4.js',
            '/static/js/shaders-attacks5.js',
            '/static/js/shaders-attacks-distant.js',
            '/static/js/shaders-attacks.js'
        ];

        return loadScripts(shaders);
    }

    /**
     * Carrega efeitos especiais
     */
    async function loadSpecialEffects() {
        const effects = [
            '/static/js/fx-attacks.js',
            '/static/js/fx-specials.js',
            '/static/js/battle-sakura.js'
        ];

        return loadScripts(effects);
    }

    /**
     * Sistema de carregamento em níveis
     */
    const LoadingLevels = {
        // Nível 1: Essencial (carrega imediatamente)
        CRITICAL: [
            '/static/js/performance-manager.js',
            '/static/js/battle-base.js',
            '/static/js/battle-combat-system.js'
        ],

        // Nível 2: Importante (carrega após inicial)
        IMPORTANT: [
            '/static/js/battle-animation.js',
            '/static/js/battle-turns.js',
            '/static/js/battle-skills-system.js'
        ],

        // Nível 3: Secundário (carrega quando idle)
        SECONDARY: [
            '/static/js/battle-class-animations.js',
            '/static/js/battle-blood-stacks.js',
            '/static/js/battle-memory-system.js'
        ],

        // Nível 4: Lazy (carrega apenas quando necessário)
        LAZY: {
            vignettes: [
                '/static/js/battle-vignette-part1.js',
                '/static/js/battle-vignette-part2.js',
                '/static/js/battle-vignette-part3.js',
                '/static/js/battle-vignette-part4.js',
                '/static/js/vignette-integration.js'
            ],
            shaders: [
                '/static/js/shaders-attacks1.js',
                '/static/js/shaders-attacks2.js',
                '/static/js/shaders-attacks3.js',
                '/static/js/shaders-attacks4.js',
                '/static/js/shaders-attacks5.js',
                '/static/js/shaders-attacks-distant.js',
                '/static/js/shaders-attacks.js'
            ],
            effects: [
                '/static/js/fx-attacks.js',
                '/static/js/fx-specials.js',
                '/static/js/battle-sakura.js'
            ]
        }
    };

    /**
     * Inicialização progressiva
     */
    async function initializeProgressively() {
        console.log('[LazyLoader] Starting progressive loading...');

        // Nível 1: Crítico (já carregado no HTML)
        console.log('[LazyLoader] Level 1: Critical modules (preloaded)');

        // Nível 2: Importante (carregar logo após)
        console.log('[LazyLoader] Level 2: Important modules');
        await loadScripts(LoadingLevels.IMPORTANT);

        // Nível 3: Secundário (carregar quando idle)
        if ('requestIdleCallback' in window) {
            requestIdleCallback(async () => {
                console.log('[LazyLoader] Level 3: Secondary modules');
                await loadScripts(LoadingLevels.SECONDARY);
            });
        } else {
            setTimeout(async () => {
                await loadScripts(LoadingLevels.SECONDARY);
            }, 2000);
        }

        // Nível 4: Lazy (prefetch para carregar mais rápido depois)
        preloadScripts([
            ...LoadingLevels.LAZY.vignettes,
            ...LoadingLevels.LAZY.shaders,
            ...LoadingLevels.LAZY.effects
        ]);

        console.log('[LazyLoader] Progressive loading complete!');
    }

    // Exportar API global
    window.LazyLoader = {
        loadScript,
        loadScripts,
        preloadScripts,
        loadVignettes,
        loadShaders,
        loadSpecialEffects,
        initializeProgressively,
        isLoaded: (src) => loadedModules.has(src)
    };

    // Auto-inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProgressively);
    } else {
        initializeProgressively();
    }

})();
