// ===== PERFORMANCE MANAGER - Sistema de Otimização Global =====
// Criado para otimizar animações e reduzir lag em dispositivos móveis

window.PerformanceManager = {
    // Configurações
    targetFPS: 45, // FPS alvo para otimização
    maxFPS: 60,    // FPS máximo permitido
    minFPS: 20,    // FPS mínimo antes de reduzir qualidade
    
    // Estados internos
    activeAnimations: new Map(),
    lastFrameTime: 0,
    frameCount: 0,
    startTime: Date.now(),
    isLowPerformanceMode: false,
    
    // Métricas de performance
    currentFPS: 60,
    averageFPS: 60,
    frameTimeHistory: [],
    
    // Detectar dispositivo móvel
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    // Inicializar sistema
    init() {
        console.log("🚀 Performance Manager: Iniciando sistema de otimização");
        console.log(`📱 Dispositivo móvel detectado: ${this.isMobile}`);
        
        // Ajustar FPS para mobile
        if (this.isMobile) {
            this.targetFPS = 30; // Mais conservador em mobile
            console.log("📱 Ajustado para mobile: 30 FPS");
        }
        
        this.startPerformanceMonitoring();
        this.startMainLoop();
        this.setupVisibilityOptimization();
        
        return this;
    },
    
    // Registrar animação para gerenciamento
    registerAnimation(id, callback, priority = 'normal') {
        const animation = {
            id: id,
            callback: callback,
            priority: priority, // 'high', 'normal', 'low'
            lastRun: 0,
            skipFrames: 0,
            enabled: true
        };
        
        // Definir frequência baseada na prioridade
        switch(priority) {
            case 'high':
                animation.interval = 1000 / this.targetFPS; // FPS total
                break;
            case 'normal':
                animation.interval = 1000 / (this.targetFPS * 0.8); // 80% do FPS
                break;
            case 'low':
                animation.interval = 1000 / (this.targetFPS * 0.5); // 50% do FPS
                break;
        }
        
        this.activeAnimations.set(id, animation);
        console.log(`✅ Animação registrada: ${id} (${priority})`);
        return this;
    },
    
    // Remover animação
    unregisterAnimation(id) {
        if (this.activeAnimations.has(id)) {
            this.activeAnimations.delete(id);
            console.log(`❌ Animação removida: ${id}`);
        }
        return this;
    },
    
    // Loop principal otimizado
    startMainLoop() {
        const frameInterval = 1000 / this.maxFPS;
        
        const loop = (currentTime) => {
            // Limitar FPS
            if (currentTime - this.lastFrameTime >= frameInterval) {
                this.updatePerformanceMetrics(currentTime);
                this.runAnimations(currentTime);
                this.lastFrameTime = currentTime;
            }
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
        console.log("🔄 Loop principal iniciado");
    },
    
    // Executar animações registradas
    runAnimations(currentTime) {
        let animationsRun = 0;
        
        this.activeAnimations.forEach((animation) => {
            if (!animation.enabled) return;
            
            // Verificar se é hora de executar esta animação
            if (currentTime - animation.lastRun >= animation.interval) {
                try {
                    animation.callback(currentTime);
                    animation.lastRun = currentTime;
                    animationsRun++;
                } catch (error) {
                    console.warn(`⚠️ Erro na animação ${animation.id}:`, error);
                }
            }
        });
        
        // Em modo de baixa performance, pular algumas animações
        if (this.isLowPerformanceMode && animationsRun > 5) {
            this.skipLowPriorityAnimations();
        }
    },
    
    // Monitoramento de performance
    startPerformanceMonitoring() {
        setInterval(() => {
            this.calculateFPS();
            this.adjustPerformanceMode();
        }, 1000);
        
        console.log("📊 Monitoramento de performance ativo");
    },
    
    // Calcular FPS atual
    calculateFPS() {
        const now = Date.now();
        const elapsed = now - this.startTime;
        this.currentFPS = (this.frameCount / elapsed) * 1000;
        
        // Histórico para média
        this.frameTimeHistory.push(this.currentFPS);
        if (this.frameTimeHistory.length > 10) {
            this.frameTimeHistory.shift();
        }
        
        this.averageFPS = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        
        this.frameCount++;
    },
    
    // Atualizar métricas
    updatePerformanceMetrics(currentTime) {
        this.frameCount++;
    },
    
    // Ajustar modo de performance automaticamente
    adjustPerformanceMode() {
        const wasLowPerformance = this.isLowPerformanceMode;
        
        // Ativar modo baixa performance se FPS cair muito
        if (this.averageFPS < this.minFPS) {
            this.isLowPerformanceMode = true;
            this.targetFPS = Math.max(20, this.targetFPS - 5);
        }
        // Sair do modo baixa performance se FPS melhorar
        else if (this.averageFPS > this.targetFPS && this.isLowPerformanceMode) {
            this.isLowPerformanceMode = false;
            this.targetFPS = Math.min(45, this.targetFPS + 5);
        }
        
        if (wasLowPerformance !== this.isLowPerformanceMode) {
            console.log(`🎛️ Modo performance: ${this.isLowPerformanceMode ? 'BAIXA' : 'NORMAL'} (FPS: ${this.averageFPS.toFixed(1)})`);
            this.adjustAnimationIntervals();
        }
    },
    
    // Ajustar intervalos das animações
    adjustAnimationIntervals() {
        this.activeAnimations.forEach((animation) => {
            const multiplier = this.isLowPerformanceMode ? 1.5 : 1;
            
            switch(animation.priority) {
                case 'high':
                    animation.interval = (1000 / this.targetFPS) * multiplier;
                    break;
                case 'normal':
                    animation.interval = (1000 / (this.targetFPS * 0.8)) * multiplier;
                    break;
                case 'low':
                    animation.interval = (1000 / (this.targetFPS * 0.5)) * multiplier;
                    break;
            }
        });
    },
    
    // Pular animações de baixa prioridade
    skipLowPriorityAnimations() {
        this.activeAnimations.forEach((animation) => {
            if (animation.priority === 'low') {
                animation.skipFrames = Math.min(animation.skipFrames + 1, 3);
            }
        });
    },
    
    // Otimização quando página não está visível
    setupVisibilityOptimization() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Página oculta - reduzir drasticamente performance
                this.targetFPS = 5;
                console.log("👁️ Página oculta - FPS reduzido para 5");
            } else {
                // Página visível - restaurar performance
                this.targetFPS = this.isMobile ? 30 : 45;
                console.log("👁️ Página visível - FPS restaurado");
            }
            this.adjustAnimationIntervals();
        });
    },
    
    // API pública para verificar status
    getStatus() {
        return {
            currentFPS: this.currentFPS,
            averageFPS: this.averageFPS,
            targetFPS: this.targetFPS,
            isLowPerformance: this.isLowPerformanceMode,
            activeAnimations: this.activeAnimations.size,
            isMobile: this.isMobile
        };
    },
    
    // Pausar/resumir animação específica
    pauseAnimation(id) {
        const animation = this.activeAnimations.get(id);
        if (animation) {
            animation.enabled = false;
            console.log(`⏸️ Animação pausada: ${id}`);
        }
    },
    
    resumeAnimation(id) {
        const animation = this.activeAnimations.get(id);
        if (animation) {
            animation.enabled = true;
            console.log(`▶️ Animação resumida: ${id}`);
        }
    },
    
    // Debug: mostrar status no console
    debugStatus() {
        const status = this.getStatus();
        console.log("📊 Performance Manager Status:", status);
        return status;
    }
};

// Auto-inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.PerformanceManager.init();
    
    // Debug periódico (remover em produção)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setInterval(() => {
            const status = window.PerformanceManager.getStatus();
            if (status.averageFPS < 25) {
                console.warn("⚠️ Performance baixa detectada:", status);
            }
        }, 5000);
    }
});

// Expor globalmente
window.PerfManager = window.PerformanceManager;

console.log("🎭 Performance Manager carregado - Sistema de otimização pronto!");