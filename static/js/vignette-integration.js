// vignette-integration.js - Sistema de integração das vinhetas avançadas - VERSÃO CORRIGIDA
// Este arquivo deve ser carregado APÓS os 3 arquivos de vinhetas

console.log("🎭 Iniciando integração do sistema de vinhetas avançadas (versão corrigida)...");

// Inicializar IMEDIATAMENTE o sistema de debug
function initializeDebugCommands() {
    // Comandos de debug para o console
    window.debugVignettes = {
        // Listar todas as vinhetas
        list: () => {
            console.log("🎭 Vinhetas disponíveis:");
            if (window.ATTACK_VIGNETTES) {
                Object.keys(window.ATTACK_VIGNETTES).forEach(key => {
                    console.log(`  - ${key}: ${window.ATTACK_VIGNETTES[key].name}`);
                });
                console.log(`Total: ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas`);
            } else {
                console.error("❌ window.ATTACK_VIGNETTES não encontrado!");
            }
        },
        
        // Testar uma vinheta específica
        test: (vignetteName, target = 'character', layer = 'front') => {
            if (!window.ATTACK_VIGNETTES) {
                console.error("❌ Sistema de vinhetas não carregado!");
                return;
            }
            
            if (window.ATTACK_VIGNETTES[vignetteName]) {
                console.log(`🧪 Testando vinheta: ${vignetteName}`);
                if (window.playPixiEffect) {
                    window.playPixiEffect(vignetteName, target, layer, 'debug');
                } else {
                    console.error("❌ window.playPixiEffect não encontrado!");
                }
            } else {
                console.error(`❌ Vinheta '${vignetteName}' não encontrada`);
                console.log("Vinhetas disponíveis:", Object.keys(window.ATTACK_VIGNETTES));
            }
        },
        
        // Testar vinheta por skill
        testSkill: (skillName, target = 'character', layer = 'front') => {
            if (!window.SKILL_TO_VIGNETTE_MAP) {
                console.error("❌ Mapeamento de skills não carregado!");
                return;
            }
            
            const vignetteName = window.SKILL_TO_VIGNETTE_MAP[skillName];
            if (vignetteName) {
                console.log(`🧪 Testando skill: ${skillName} -> ${vignetteName}`);
                window.debugVignettes.test(vignetteName, target, layer);
            } else {
                console.error(`❌ Skill '${skillName}' não mapeada`);
                console.log("Skills disponíveis:", Object.keys(window.SKILL_TO_VIGNETTE_MAP));
            }
        },
        
        // Limpar todos os efeitos
        clear: () => {
            if (window.cleanupAllPixiEffects) {
                window.cleanupAllPixiEffects('debug');
            } else {
                console.error("❌ window.cleanupAllPixiEffects não encontrado!");
            }
        },
        
        // Mostrar efeitos ativos
        active: () => {
            if (window.debugPixiEffects) {
                window.debugPixiEffects();
            } else {
                console.error("❌ window.debugPixiEffects não encontrado!");
            }
        },
        
        // Testar performance
        performance: () => {
            const start = Date.now();
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    window.debugVignettes.test('basic_attack_vignette', 'character', 'front');
                }, i * 200);
            }
            console.log(`⚡ Teste de performance iniciado em ${Date.now() - start}ms`);
        },
        
        // Status do sistema
        status: () => {
            console.log("🔍 Status do Sistema:");
            console.log("  - PIXI carregado:", typeof PIXI !== 'undefined');
            console.log("  - pixieSystem carregado:", typeof window.pixieSystem !== 'undefined');
            console.log("  - ATTACK_VIGNETTES carregado:", typeof window.ATTACK_VIGNETTES !== 'undefined');
            console.log("  - playPixiEffect disponível:", typeof window.playPixiEffect !== 'undefined');
            console.log("  - isPixiEffect disponível:", typeof window.isPixiEffect !== 'undefined');
            
            if (window.ATTACK_VIGNETTES) {
                console.log(`  - Total de vinhetas: ${Object.keys(window.ATTACK_VIGNETTES).length}`);
            }
            
            if (window.pixieSystem) {
                console.log(`  - PixieSystem inicializado: ${window.pixieSystem.isInitialized}`);
                console.log(`  - Efeitos ativos: ${window.pixieSystem.activeEffects?.length || 0}`);
            }
        }
    };
    
    console.log("🔧 Comandos de debug inicializados:");
    console.log("  - debugVignettes.list() - Listar todas as vinhetas");
    console.log("  - debugVignettes.test('nome_vinheta') - Testar vinheta");
    console.log("  - debugVignettes.testSkill('Nome da Skill') - Testar por skill");
    console.log("  - debugVignettes.clear() - Limpar efeitos");
    console.log("  - debugVignettes.active() - Mostrar efeitos ativos");
    console.log("  - debugVignettes.performance() - Teste de performance");
    console.log("  - debugVignettes.status() - Status do sistema");
}

// Configurar mapeamento de skills para vinhetas
function setupSkillMappings() {
    // Mapear nomes de skills para nomes de vinhetas
    window.SKILL_TO_VIGNETTE_MAP = {
        // Skills Genéricas - COMPATÍVEIS
        "Ataque Básico": "basic_attack_vignette",
        
        // Skills de Mago - COMPATÍVEIS
        "Projétil Arcano": "arcane_projectile_vignette",
        "Martelo Divino": "divine_hammer_vignette",
        
        // Skills de Ronin - COMPATÍVEIS
        "Corte Preciso": "precise_cut_vignette",
        
        // Skills de Ninja - COMPATÍVEIS
        "Golpe das Sombras": "shadow_strike_vignette",
        
        // ✅ ADICIONAR SKILLS DO VLAD:
        "Energia Escura": "vampiric_bite_vignette",
        "Garras Sangrentas": "bloody_claws_vignette",
        "Execução": "embrace_of_darkness_vignette",
        "Sombra da Morte": "kiss_of_death_vignette"
    };
    
    console.log(`🗺️ Mapeamento de ${Object.keys(window.SKILL_TO_VIGNETTE_MAP).length} skills configurado`);
}

// Função utilitária para encontrar vinheta por skill
window.getVignetteForSkill = (skillName) => {
    const vignetteName = window.SKILL_TO_VIGNETTE_MAP?.[skillName];
    if (vignetteName && window.ATTACK_VIGNETTES?.[vignetteName]) {
        return vignetteName;
    }
    
    console.warn(`⚠️ Vinheta não encontrada para skill: ${skillName}`);
    return 'basic_attack_vignette'; // Fallback
};

// Expor função para uso global
window.playSkillVignette = (skillName, target = 'character', layer = 'front') => {
    const vignetteName = window.getVignetteForSkill(skillName);
    return window.playPixiEffect(vignetteName, target, layer, 'skillSystem');
};

// Função principal de inicialização
function initializeVignetteIntegration() {
    console.log("🎭 Iniciando integração completa...");
    
    // Verificar se todos os sistemas estão presentes
    const pixieLoaded = typeof window.pixieSystem !== 'undefined';
    const vignettesLoaded = typeof window.ATTACK_VIGNETTES !== 'undefined';
    const pixiLibLoaded = typeof PIXI !== 'undefined';
    
    console.log("📊 Status dos sistemas:");
    console.log(`  - PixiJS: ${pixiLibLoaded ? '✅' : '❌'}`);
    console.log(`  - PixieSystem: ${pixieLoaded ? '✅' : '❌'}`);
    console.log(`  - Vinhetas: ${vignettesLoaded ? '✅' : '❌'}`);
    
    if (vignettesLoaded) {
        const totalVignettes = Object.keys(window.ATTACK_VIGNETTES).length;
        console.log(`🎭 ${totalVignettes} vinhetas carregadas`);
    }
    
    // Configurar mapeamentos
    setupSkillMappings();
    
    console.log("🎉 Sistema de vinhetas integrado!");
}

// INICIALIZAR IMEDIATAMENTE
initializeDebugCommands();
setupSkillMappings();

// Aguardar carregamento completo do DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVignetteIntegration);
} else {
    // DOM já carregado
    initializeVignetteIntegration();
}

// Também tentar inicializar após um delay para garantir
setTimeout(() => {
    if (!window.debugVignettes) {
        console.warn("⚠️ Debug commands não inicializados, tentando novamente...");
        initializeDebugCommands();
    }
    
    initializeVignetteIntegration();
}, 1000);

console.log("🎭 Sistema de integração de vinhetas carregado! (versão corrigida)");