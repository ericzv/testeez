// shaders-attacks.js - Sistema Principal de Shaders
// Este arquivo deve ser carregado POR ÚLTIMO

// INICIALIZAR o objeto ANTES de qualquer outro shader tentar usá-lo
if (!window.BOSS_DAMAGE_SHADERS) {
    window.BOSS_DAMAGE_SHADERS = {};
    console.log("🎭 BOSS_DAMAGE_SHADERS inicializado");
}

// Função para aplicar shader de dano no boss
window.applyBossDamageShader = function(shaderName, app) {
    console.log(`🎭 Aplicando shader de dano: ${shaderName}`);
    
    if (!window.BOSS_DAMAGE_SHADERS[shaderName]) {
        console.error(`❌ Shader '${shaderName}' não encontrado!`);
        return null;
    }
    
    const shader = window.BOSS_DAMAGE_SHADERS[shaderName];
    console.log(`   - Nome: ${shader.name}`);
    console.log(`   - Duração: ${shader.duration}ms`);
    
    try {
        const effect = shader.create(app);
        app.stage.addChild(effect);
        console.log(`   - Efeito adicionado ao stage`);
        console.log(`✅ Shader '${shaderName}' aplicado com sucesso`);
        return effect;
    } catch (error) {
        console.error(`❌ Erro ao aplicar shader '${shaderName}':`, error);
        return null;
    }
};

// Função para obter lista de shaders disponíveis
window.getAvailableBossShaders = function() {
    return Object.keys(window.BOSS_DAMAGE_SHADERS);
};

// Log de inicialização (executado após todos os shaders carregarem)
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎭 Sistema de Shaders de Dano carregado!");
    
    // Verificar se o objeto existe antes de tentar usá-lo
    if (window.BOSS_DAMAGE_SHADERS && typeof window.BOSS_DAMAGE_SHADERS === 'object') {
        console.log(`   - ${Object.keys(window.BOSS_DAMAGE_SHADERS).length} shaders disponíveis:`);
        Object.keys(window.BOSS_DAMAGE_SHADERS).forEach(shader => {
            console.log(`     • ${shader}: ${window.BOSS_DAMAGE_SHADERS[shader].name}`);
        });
    } else {
        console.log("   - BOSS_DAMAGE_SHADERS ainda não carregado");
    }
});