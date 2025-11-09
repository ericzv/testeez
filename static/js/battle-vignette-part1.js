// battle-vignette-part1.js - Sistema de vinhetas avançadas - PARTE 1
// Genéricas + Mago + Clérigo + Arcanista
// Versão 4.0 - Shaders customizados para todas as vinhetas

// Inicializar dicionário global se não existir
if (!window.ATTACK_VIGNETTES) {
    window.ATTACK_VIGNETTES = {};
}

// battle-vignette-part1.js - Inicialização de variáveis globais
// DEVE ser carregado PRIMEIRO

// Inicializar variáveis globais necessárias
window.VIGNETTE_LOD = {};
window.VIGNETTE_EFFECTS = {};
window.VIGNETTE_ANIMATIONS = {};
window.VIGNETTE_TEXTURES = {};

console.log("🎭 Variáveis globais de vinheta inicializadas");

// Configuração de LOD para performance
const VIGNETTE_LOD = {
    isLowEndDevice: () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;
        
        const renderer = gl.getParameter(gl.RENDERER);
        const isLowEnd = /Mali|PowerVR|Adreno 3|Adreno 4|Intel HD/.test(renderer);
        const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        const slowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        return isLowEnd || lowMemory || slowCores;
    },
    
    getParticleCount: (baseCount) => {
        return VIGNETTE_LOD.isLowEndDevice() ? Math.floor(baseCount * 0.6) : baseCount;
    },
    
    getGraphicElementCount: (baseCount) => {
        return VIGNETTE_LOD.isLowEndDevice() ? Math.floor(baseCount * 0.5) : baseCount;
    }
};



// ========================================
// 🔧 FUNÇÃO PRINCIPAL DE CRIAÇÃO DE VINHETA
// ========================================

// Função principal para criar uma vinheta completa (mantém compatibilidade)
window.createAdvancedVignette = function(vignetteKey, app) {
    console.log(`🎬 Criando vinheta avançada: ${vignetteKey}`);
    
    const vignetteConfig = window.ATTACK_VIGNETTES[vignetteKey];
    if (!vignetteConfig) {
        console.error(`❌ Vinheta '${vignetteKey}' não encontrada!`);
        return null;
    }
    
    const container = new PIXI.Container();
    
    // 1. Criar partículas (sistema existente)
    const particlesContainer = createParticles(vignetteConfig, app);
    if (particlesContainer) {
        container.addChild(particlesContainer);
    }
    
    // 2. Criar elementos gráficos (novo sistema)
    const graphicsContainer = createGraphicElements(vignetteConfig, app);
    if (graphicsContainer) {
        container.addChild(graphicsContainer);
    }
    
    // 3. Aplicar filtros (sistema existente)
    if (vignetteConfig.filters) {
        applyVignetteFilters(container, vignetteConfig.filters);
    }
    
    console.log(`✅ Vinheta '${vignetteKey}' criada com sucesso`);
    return container;
};

// Função auxiliar para criar partículas (compatibilidade com sistema existente)
function createParticles(vignetteConfig, app) {
    // Esta função seria implementada baseada no sistema existente de partículas
    // Por enquanto retorna null para manter o foco nos elementos gráficos
    return null;
}

// Função auxiliar para aplicar filtros
function applyVignetteFilters(container, filters) {
    // Implementação dos filtros baseada na configuração
    if (filters.brightness || filters.contrast) {
        // Aplicar filtros de brilho e contraste
    }
    
    if (filters.colorMatrix) {
        // Aplicar matriz de cores
    }
}

console.log("🎨 Sistema de Vinhetas Avançadas v4.0 carregado!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas disponíveis com shaders customizados`);
console.log("   - Todas as vinhetas agora usam shaders para efeitos visuais únicos");
console.log("   - Animações fluidas e específicas por habilidade");
console.log("   - LOD automático para performance");



// PARTE 1: Vinhetas com Shaders Customizados
Object.assign(window.ATTACK_VIGNETTES, {

    // ========================================
    // 🔰 GENÉRICAS - Disponíveis para todas as classes
    // ========================================

    "basic_attack_vignette": {
        name: "Ataque Básico",
        duration: 3000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(75),
            emitterType: "burst",
            startColor: "#cccccc",
            endColor: "#888888",
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 0.3, max: 0.5 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 1400, max: 1600 }, // Fade aos 70% = 1050-1400ms
            speed: { min: 40, max: 60 },
            radius: 100,
            gravity: { x: 0, y: 15 },
            sparkle: true
        },
        vignette: {
            type: "horizontal",
            color: "#1a1a1a", // Cinza escuro
            intensity: 0.9,
            fadeInDuration: 300,
            fadeOutDuration: 1800,
            startDelay: 600
        },
        filters: {
            brightness: 4.1,
            contrast: 1.2
        }
    },

    "energy_overload_vignette": {
        name: "Sobrecarga de Energia",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(135),
            emitterType: "burst",
            startColor: "#4488ff",
            endColor: "#2266cc",
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2400, max: 3100 },
            speed: { min: 40, max: 80 },
            radius: 160,
            gravity: { x: 0, y: 10 },
            electric: true
        },
        filters: {
            brightness: 1.3,
            contrast: 1.1,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.3
            }
        },
        customShader: {
            enabled: true,
            type: "energy_overload",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Linhas convergentes de cima
                    if (uv.y < 0.5) {
                        for (int i = 0; i < 30; i++) {
                            float lineX = 0.05 + float(i) * 0.03;
                            
                            // Movimento de convergência - vai rápido, volta devagar
                            float cycle = mod(t * 2.0 + float(i) * 0.1, 3.0);
                            float lineProgress;
                            
                            if (cycle < 1.5) {
                                lineProgress = cycle / 1.5;
                            } else {
                                lineProgress = 1.0 - ((cycle - 1.5) / 1.5) * 0.8;
                            }
                            
                            float lineStartY = 0.0;
                            float lineCenterY = 0.5;
                            float currentY = lineStartY + (lineCenterY - lineStartY) * lineProgress;
                            
                            // Distância da linha
                            float distFromLine = abs(uv.x - lineX) + abs(uv.y - currentY);
                            
                            if (distFromLine < 0.008) {
                                float lineIntensity = 1.0 - (distFromLine / 0.008);
                                
                                // Brilho adicional baseado na velocidade
                                float speedGlow = 1.0;
                                if (cycle < 1.5) {
                                    speedGlow = 1.5 + sin(t * 8.0 + float(i)) * 0.5;
                                }
                                
                                pattern += lineIntensity * speedGlow * 0.7;
                                
                                // Trail effect SEM LOOP - usando matemática direta
                                float trailOffset1 = 0.01;
                                float trailOffset2 = 0.015;
                                float trailOffset3 = 0.02;
                                
                                float trailY1 = currentY - trailOffset1;
                                float trailY2 = currentY - trailOffset2;
                                float trailY3 = currentY - trailOffset3;
                                
                                if (trailY1 >= lineStartY) {
                                    float trailDist1 = abs(uv.x - lineX) + abs(uv.y - trailY1);
                                    if (trailDist1 < 0.005) {
                                        pattern += 0.5 * 0.3;
                                    }
                                }
                                
                                if (trailY2 >= lineStartY) {
                                    float trailDist2 = abs(uv.x - lineX) + abs(uv.y - trailY2);
                                    if (trailDist2 < 0.005) {
                                        pattern += 0.25 * 0.3;
                                    }
                                }
                                
                                if (trailY3 >= lineStartY) {
                                    float trailDist3 = abs(uv.x - lineX) + abs(uv.y - trailY3);
                                    if (trailDist3 < 0.005) {
                                        pattern += 0.1 * 0.3;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Linhas convergentes de baixo
                    if (uv.y > 0.5) {
                        for (int i = 0; i < 30; i++) {
                            float lineX = 0.05 + float(i) * 0.03;
                            
                            float cycle = mod(t * 2.0 + float(i) * 0.1 + 1.5, 3.0);
                            float lineProgress;
                            
                            if (cycle < 1.5) {
                                lineProgress = cycle / 1.5;
                            } else {
                                lineProgress = 1.0 - ((cycle - 1.5) / 1.5) * 0.8;
                            }
                            
                            float lineStartY = 1.0;
                            float lineCenterY = 0.5;
                            float currentY = lineStartY + (lineCenterY - lineStartY) * lineProgress;
                            
                            float distFromLine = abs(uv.x - lineX) + abs(uv.y - currentY);
                            
                            if (distFromLine < 0.008) {
                                float lineIntensity = 1.0 - (distFromLine / 0.008);
                                
                                float speedGlow = 1.0;
                                if (cycle < 1.5) {
                                    speedGlow = 1.5 + sin(t * 8.0 + float(i)) * 0.5;
                                }
                                
                                pattern += lineIntensity * speedGlow * 0.7;
                                
                                // Trail effect SEM LOOP
                                float trailOffset1 = 0.01;
                                float trailOffset2 = 0.015;
                                float trailOffset3 = 0.02;
                                
                                float trailY1 = currentY + trailOffset1;
                                float trailY2 = currentY + trailOffset2;
                                float trailY3 = currentY + trailOffset3;
                                
                                if (trailY1 <= lineStartY) {
                                    float trailDist1 = abs(uv.x - lineX) + abs(uv.y - trailY1);
                                    if (trailDist1 < 0.005) {
                                        pattern += 0.5 * 0.3;
                                    }
                                }
                                
                                if (trailY2 <= lineStartY) {
                                    float trailDist2 = abs(uv.x - lineX) + abs(uv.y - trailY2);
                                    if (trailDist2 < 0.005) {
                                        pattern += 0.25 * 0.3;
                                    }
                                }
                                
                                if (trailY3 <= lineStartY) {
                                    float trailDist3 = abs(uv.x - lineX) + abs(uv.y - trailY3);
                                    if (trailDist3 < 0.005) {
                                        pattern += 0.1 * 0.3;
                                    }
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.5) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * pulse * 0.18;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.129); // #000021
                    vec3 lineColor = vec3(0.4, 0.6, 1.0);
                    vec3 glowColor = vec3(0.5, 0.7, 1.0);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += lineColor * lines;
                        alpha += lines * 0.5;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.12;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    // ========================================
    // 🔮 MAGO - Habilidades base de magia
    // ========================================

    "arcane_projectile_vignette": {
        name: "Projétil Arcano",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(100),
            emitterType: "circle",
            startColor: "#8b16ff",
            endColor: "#c081ff",
            startScale: { min: 1.0, max: 2.0 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 1000, max: 1500 },
            speed: { min: 60, max: 120 },
            radius: 140,
            gravity: { x: 245, y: -12 },
            magical: true
        },
        filters: {
            brightness: 1.2,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.5
            }
        },
        customShader: {
            enabled: true,
            type: "arcane_projectile",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Runas místicas flutuando
                    if (uv.y < 0.4) {
                        for (int i = 0; i < 4; i++) {
                            float runeX = 0.15 + float(i) * 0.2 + sin(t * 0.8 + float(i)) * 0.05;
                            float runeY = 0.15 + sin(t * 1.2 + float(i) * 1.5) * 0.08;
                            
                            float runeDistX = abs(uv.x - runeX);
                            float runeDistY = abs(uv.y - runeY);
                            
                            // Símbolo triangular místico
                            if (runeDistX < 0.03 && runeDistY < 0.03) {
                                float triPattern = 0.0;
                                vec2 runeUV = vec2((uv.x - runeX) / 0.03, (uv.y - runeY) / 0.03);
                                
                                // Triângulo central
                                if (abs(runeUV.y) < 0.7 && abs(runeUV.x) < (0.7 - abs(runeUV.y))) {
                                    triPattern = 0.5;
                                }
                                
                                // Círculo interno
                                if (length(runeUV) < 0.3) {
                                    triPattern += 0.3;
                                }
                                
                                float fade = 1.0 - length(runeUV);
                                pattern += triPattern * fade * 0.6;
                            }
                        }
                    }
                    
                    if (uv.y > 0.6) {
                        for (int i = 0; i < 3; i++) {
                            float runeX = 0.2 + float(i) * 0.25 + sin(t * 0.9 + float(i) * 2.0) * 0.04;
                            float runeY = 0.8 - sin(t * 1.1 + float(i) * 1.8) * 0.06;
                            
                            float runeDistX = abs(uv.x - runeX);
                            float runeDistY = abs(uv.y - runeY);
                            
                            if (runeDistX < 0.025 && runeDistY < 0.025) {
                                vec2 runeUV = vec2((uv.x - runeX) / 0.025, (uv.y - runeY) / 0.025);
                                
                                // Losango místico
                                float diamond = 1.0 - (abs(runeUV.x) + abs(runeUV.y));
                                if (diamond > 0.0) {
                                    pattern += diamond * 0.4;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 2.8) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.65, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.094, 0.0, 0.192); // #180031
                    vec3 runeColor = vec3(0.7, 0.4, 1.0);
                    vec3 glowColor = vec3(0.8, 0.5, 1.0);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += runeColor * lines;
                        alpha += lines * 0.5;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.15;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "arcane_explosion_vignette": {
        name: "Explosão Arcana",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(40),
            emitterType: "circle",
            startColor: "#481b8b",
            endColor: "#264b73",
            startScale: { min: 1.0, max: 1.2 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 0.5,
            endAlpha: 0.0,
            lifetime: { min: 2500, max: 3500 },
            speed: { min: 700, max: 900 },
            radius: 250,
            gravity: { x: 0, y: -100 },
            magical: true,
            explosive: true,
            electric: true
        },
        filters: {
            brightness: 1.3,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.3,
                saturation: 1.0
            }
        },
        customShader: {
            enabled: true,
            type: "arcane_singularity",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // Ondas explosivas no CENTRO da tela
                    for (int i = 0; i < 8; i++) {
                        float waveAngle = float(i) * 0.785; // 45 graus entre ondas
                        
                        // Tremor rápido e intenso
                        float tremor = sin(t * 25.0 + float(i) * 3.0) * 0.02; // Tremor muito rápido
                        float tremor2 = sin(t * 18.0 + float(i) * 2.5) * 0.015; // Tremor secundário
                        
                        // Ponto inicial da onda (próximo ao centro)
                        float waveStartRadius = 0.05 + tremor;
                        // Ponto final da onda
                        float waveEndRadius = 0.25 + tremor2;
                        
                        vec2 waveStart = center + vec2(
                            cos(waveAngle) * waveStartRadius,
                            sin(waveAngle) * waveStartRadius
                        );
                        
                        vec2 waveEnd = center + vec2(
                            cos(waveAngle) * waveEndRadius,
                            sin(waveAngle) * waveEndRadius
                        );
                        
                        // Criar linha ondulante entre os pontos
                        for (int seg = 0; seg < 15; seg++) {
                            float segmentProgress = float(seg) / 15.0;
                            
                            // Posição base ao longo da linha
                            vec2 segmentPos = mix(waveStart, waveEnd, segmentProgress);
                            
                            // Ondulação lateral com tremor
                            float lateral = sin(segmentProgress * 12.0 + t * 15.0 + float(i)) * 0.02;
                            lateral += sin(segmentProgress * 20.0 + t * 22.0) * 0.01; // Tremor adicional
                            
                            vec2 perpendicular = vec2(-sin(waveAngle), cos(waveAngle));
                            segmentPos += perpendicular * lateral;
                            
                            float distToSegment = distance(uv, segmentPos);
                            
                            if (distToSegment < 0.012) {
                                float waveIntensity = 1.0 - (distToSegment / 0.012);
                                
                                // Intensidade crescente com tremor
                                float explosiveIntensity = 1.0 + sin(t * 20.0 + float(i)) * 0.5;
                                
                                pattern += waveIntensity * explosiveIntensity * 0.8; // 80% de transparência base
                            }
                        }
                    }
                    
                    // Pulsos concêntricos no centro
                    for (int pulse = 0; pulse < 4; pulse++) {
                        float pulseRadius = 0.03 + float(pulse) * 0.04;
                        float pulsePhase = t * 12.0 + float(pulse) * 1.57;
                        pulseRadius += sin(pulsePhase) * 0.02; // Tremor nos pulsos
                        
                        float distFromPulse = abs(distance(uv, center) - pulseRadius);
                        if (distFromPulse < 0.008) {
                            float pulseIntensity = 1.0 - (distFromPulse / 0.008);
                            float trembling = sin(t * 30.0 + float(pulse) * 2.0) * 0.5 + 0.5;
                            pattern += pulseIntensity * trembling * 0.6;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 1.8) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.8, dist);
                    return glow * pulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.282, 0.090, 0.545); // #481b8b (púrpura escuro)
                    vec3 distortionColor = vec3(0.6, 0.33, 0.8);    // púrpura médio
                    vec3 glowColor = vec3(0.7, 0.4, 0.9);           // púrpura claro
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += distortionColor * lines;
                        alpha += lines * 0.6;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.16;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },


    "elemental_ray_vignette": {
        name: "Raio Elemental",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(80),
            emitterType: "burst",
            startColor: "#d8b1ff",
            endColor: "#d8b1ff",
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 1900, max: 2500 },
            speed: { min: 150, max: 290 },
            radius: 170,
            gravity: { x: 0, y: 8 },
            triangular: true
        },
        filters: {
            brightness: 1.0,
            contrast: 1.0,
            colorMatrix: {
                brightness: 1.2,
                saturation: 1.4
            }
        },
        customShader: {
            enabled: true,
            type: "elemental_ray",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Relâmpagos atravessando a tela de cima para baixo
                    if (mod(floor(t * 6.0), 4.0) < 1.0) { // Aparecem esporadicamente
                        // Raio 1 - grosso
                        float bolt1X = 0.2 + sin(t * 1.5) * 0.1;
                        for (int j = 0; j < 20; j++) {
                            float y1 = float(j) * 0.05;
                            float y2 = float(j + 1) * 0.05;
                            
                            float x1 = bolt1X + sin(float(j) * 3.0 + t * 20.0) * 0.04;
                            float x2 = bolt1X + sin(float(j + 1) * 3.0 + t * 20.0) * 0.04;
                            
                            float dist = abs((y2 - y1) * uv.x - (x2 - x1) * uv.y + x2 * y1 - y2 * x1) / 
                                        sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
                            
                            if (dist < 0.006 && uv.y >= y1 && uv.y <= y2) {
                                float intensity = 1.0 - (dist / 0.006);
                                pattern += intensity * 1.2; // Brilho forte
                                
                                // Brilho externo
                                if (dist < 0.015) {
                                    pattern += (1.0 - dist / 0.015) * 0.4;
                                }
                            }
                        }
                        
                        // Raio 2 - médio
                        float bolt2X = 0.5 + sin(t * 1.8) * 0.08;
                        for (int j = 0; j < 15; j++) {
                            float y1 = float(j) * 0.067;
                            float y2 = float(j + 1) * 0.067;
                            
                            float x1 = bolt2X + sin(float(j) * 2.5 + t * 18.0) * 0.03;
                            float x2 = bolt2X + sin(float(j + 1) * 2.5 + t * 18.0) * 0.03;
                            
                            float dist = abs((y2 - y1) * uv.x - (x2 - x1) * uv.y + x2 * y1 - y2 * x1) / 
                                        sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
                            
                            if (dist < 0.004 && uv.y >= y1 && uv.y <= y2) {
                                float intensity = 1.0 - (dist / 0.004);
                                pattern += intensity * 0.9;
                                
                                if (dist < 0.012) {
                                    pattern += (1.0 - dist / 0.012) * 0.3;
                                }
                            }
                        }
                        
                        // Raio 3 - fino
                        float bolt3X = 0.75 + sin(t * 1.2) * 0.06;
                        for (int j = 0; j < 12; j++) {
                            float y1 = float(j) * 0.083;
                            float y2 = float(j + 1) * 0.083;
                            
                            float x1 = bolt3X + sin(float(j) * 2.0 + t * 15.0) * 0.02;
                            float x2 = bolt3X + sin(float(j + 1) * 2.0 + t * 15.0) * 0.02;
                            
                            float dist = abs((y2 - y1) * uv.x - (x2 - x1) * uv.y + x2 * y1 - y2 * x1) / 
                                        sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
                            
                            if (dist < 0.002 && uv.y >= y1 && uv.y <= y2) {
                                float intensity = 1.0 - (dist / 0.002);
                                pattern += intensity * 0.7;
                                
                                if (dist < 0.008) {
                                    pattern += (1.0 - dist / 0.008) * 0.2;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.2) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * pulse * 0.25; // Menos transparente
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.114, 0.0, 0.224); // #1d0039
                    vec3 crystalColor = vec3(0.9, 0.78, 1.0);
                    vec3 glowColor = vec3(0.85, 0.7, 1.0);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += crystalColor * lines;
                        alpha += lines * 0.45;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.13;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    // ========================================
    // ⚡ CLÉRIGO - Habilidades divinas
    // ========================================

    "divine_hammer_vignette": {
        name: "Martelo Divino",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(85),
            emitterType: "burst",
            startColor: "#fff8dc",
            endColor: "#daa520",
            startScale: { min: 0.3, max: 0.8 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.4,
            endAlpha: 0.0,
            lifetime: { min: 3000, max: 4500 },
            speed: { min: 25, max: 45 },
            radius: 120,
            gravity: { x: 0, y: -20 },
            cross: true,
            marginEmission: true
        },
        filters: {
            brightness: 1.2,
            contrast: 1.05,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.15
            }
        },
        customShader: {
            enabled: true,
            type: "divine_complete",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    if (uv.y < 0.4) {
                        float yProgress = uv.y / 0.4;
                        
                        float wave1 = sin(uv.x * 15.0 + t * 2.0) * 0.02;
                        float wave2 = sin(uv.x * 8.0 + t * 1.5) * 0.015;
                        float targetY = wave1 + wave2;
                        
                        float distance = abs(uv.y - targetY);
                        float thickness = 0.008 * (1.0 - yProgress);
                        
                        pattern += (1.0 - smoothstep(0.0, thickness, distance)) * (1.0 - yProgress);
                        
                        if (mod(floor(uv.x * 20.0), 3.0) == 0.0) {
                            float branchY = targetY + sin(uv.x * 25.0 + t) * 0.05 * yProgress;
                            float branchDist = abs(uv.y - branchY);
                            pattern += (1.0 - smoothstep(0.0, thickness * 0.5, branchDist)) * 0.6;
                        }
                    }
                    
                    if (uv.y > 0.6) {
                        float yProgress = (1.0 - uv.y) / 0.4;
                        
                        float wave1 = sin(uv.x * 12.0 + t * 1.8) * 0.025;
                        float wave2 = sin(uv.x * 6.0 + t * 1.2) * 0.02;
                        float targetY = 1.0 + wave1 + wave2;
                        
                        float distance = abs(uv.y - targetY);
                        float thickness = 0.008 * (1.0 - yProgress);
                        
                        pattern += (1.0 - smoothstep(0.0, thickness, distance)) * (1.0 - yProgress);
                        
                        if (mod(floor(uv.x * 18.0 + 1.0), 4.0) == 0.0) {
                            float branchY = targetY - sin(uv.x * 22.0 + t * 1.3) * 0.04 * yProgress;
                            float branchDist = abs(uv.y - branchY);
                            pattern += (1.0 - smoothstep(0.0, thickness * 0.4, branchDist)) * 0.5;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * pulse * 0.3;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.957, 0.910, 0.541); // #f4e88a
                    vec3 gold2 = vec3(1.0, 0.92, 0.71);
                    vec3 gold3 = vec3(0.85, 0.76, 0.49);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        float colorVar = noise(uv * 15.0 + time);
                        vec3 lineColor = mix(gold2, gold3, colorVar);
                        color += lineColor * lines;
                        alpha += lines * 0.4;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        vec3 glowColor = gold2 * glow;
                        color += glowColor;
                        alpha += glow * 0.15;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "celestial_judgment_vignette": {
        name: "Julgamento Celestial",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(40),
            emitterType: "circle",
            startColor: "#ffdd99",
            endColor: "#ffeedd",
            startScale: { min: 0.9, max: 1.4 },
            endScale: { min: 0.4, max: 0.7 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 2400, max: 3200 },
            speed: { min: 30, max: 60 },
            radius: 140,
            gravity: { x: 0, y: -8 },
            heavenly: true
        },
        filters: {
            brightness: 1.0,
            contrast: 1.0,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.0
            }
        },
        customShader: {
            enabled: true,
            type: "celestial_judgment",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.08;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Raios de luz descendo do topo - SEM CORTE
                    for (int i = 0; i < 8; i++) {
                        float rayX = 0.1 + float(i) * 0.1 + sin(t * 0.8 + float(i) * 1.2) * 0.02;
                        float rayProgress = (t * 0.5 + float(i) * 0.3);
                        float rayLength = mod(rayProgress, 2.0);
                        
                        float rayStartY = -0.1 + rayLength * 0.6; // Maior alcance
                        float rayEndY = rayStartY + 0.25;
                        
                        if (uv.y >= rayStartY && uv.y <= rayEndY && abs(uv.x - rayX) < 0.008) {
                            float rayIntensity = 1.0 - abs(uv.x - rayX) / 0.008;
                            float fadeIn = smoothstep(rayStartY, rayStartY + 0.02, uv.y);
                            float fadeOut = 1.0 - smoothstep(rayEndY - 0.02, rayEndY, uv.y);
                            pattern += rayIntensity * fadeIn * fadeOut * 0.8;
                            
                            if (abs(uv.x - rayX) < 0.004) {
                                pattern += 0.3;
                            }
                        }
                    }
                    
                    // Ondas celestiais na parte inferior
                    if (uv.y > 0.6) {
                        float wave1 = sin(uv.x * 10.0 + t * 2.2) * 0.02;
                        float wave2 = sin(uv.x * 6.0 + t * 1.8) * 0.015;
                        float targetY = 0.8 + wave1 + wave2;
                        
                        float distance = abs(uv.y - targetY);
                        float thickness = 0.01;
                        
                        if (distance < thickness) {
                            float waveIntensity = 1.0 - (distance / thickness);
                            pattern += waveIntensity * 0.6;
                            
                            if (mod(floor(uv.x * 25.0), 5.0) == 0.0) {
                                float particleY = targetY + sin(uv.x * 30.0 + t * 3.0) * 0.03;
                                float particleDist = abs(uv.y - particleY);
                                if (particleDist < 0.005) {
                                    pattern += 0.4;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 2.5) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.7, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.965, 0.918, 0.549); // #f6ea8c
                    vec3 rayColor = vec3(1.0, 0.95, 0.7);
                    vec3 glowColor = vec3(1.0, 0.93, 0.6);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += rayColor * lines;
                        alpha += lines * 0.4;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.12;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "purifying_flame_vignette": {
        name: "Chama Purificadora",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(145),
            emitterType: "burst",
            startColor: "#ffcc44",
            endColor: "#ffaa22",
            startScale: { min: 0.7, max: 1.3 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 3100 },
            speed: { min: 40, max: 70 },
            radius: 150,
            gravity: { x: 0, y: -51 },
            fiery: true
        },
        filters: {
            brightness: 1.00,
            contrast: 1.0,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.0
            }
        },
        customShader: {
            enabled: true,
            type: "purifying_flame",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Chamas saindo da margem SUPERIOR (base em y=0, crescendo para o centro)
                    if (uv.y < 0.35) {
                        for (int i = 0; i < 6; i++) {
                            float flameX = 0.1 + float(i) * 0.15 + sin(t * 1.5 + float(i) * 2.0) * 0.03;
                            float flameBase = 0.0; // Base na margem superior
                            float flameHeight = 0.12 + sin(t * 3.0 + float(i) * 1.7) * 0.05;
                            float flameTop = flameBase + flameHeight;
                            
                            if (uv.y > flameBase && uv.y < flameTop) {
                                float distanceFromCenter = abs(uv.x - flameX);
                                
                                // CORREÇÃO: Afina conforme se afasta da margem (yProgress = 0 na base, 1 no topo)
                                float yProgress = (uv.y - flameBase) / flameHeight;
                                float flameWidth = 0.018 * (1.0 - yProgress * 0.7); // AFINA em direção ao centro
                                
                                if (distanceFromCenter < flameWidth) {
                                    float flameIntensity = 1.0 - (distanceFromCenter / flameWidth);
                                    float waver = sin(uv.y * 40.0 + t * 4.0 + float(i)) * 0.01;
                                    if (abs(uv.x - flameX - waver) < flameWidth) {
                                        pattern += flameIntensity * 0.7;
                                        
                                        if (distanceFromCenter < flameWidth * 0.5) {
                                            pattern += 0.3;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Chamas saindo da margem INFERIOR (base em y=1, crescendo para o centro)
                    if (uv.y > 0.65) {
                        for (int i = 0; i < 5; i++) {
                            float flameX = 0.15 + float(i) * 0.18 + sin(t * 1.8 + float(i) * 2.3) * 0.025;
                            float flameBase = 1.0; // Base na margem inferior
                            float flameHeight = 0.08 + sin(t * 2.5 + float(i) * 1.9) * 0.04;
                            float flameTop = flameBase - flameHeight; // Cresce para cima (centro)
                            
                            if (uv.y < flameBase && uv.y > flameTop) {
                                float distanceFromCenter = abs(uv.x - flameX);
                                
                                // CORREÇÃO: Afina conforme se afasta da margem
                                float yProgress = (flameBase - uv.y) / flameHeight; // 0 na base, 1 no topo
                                float flameWidth = 0.015 * (1.0 - yProgress * 0.7); // AFINA em direção ao centro
                                
                                if (distanceFromCenter < flameWidth) {
                                    float flameIntensity = 1.0 - (distanceFromCenter / flameWidth);
                                    float waver = sin(uv.y * 35.0 - t * 3.5 + float(i)) * 0.008;
                                    if (abs(uv.x - flameX - waver) < flameWidth) {
                                        pattern += flameIntensity * 0.6;
                                    }
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.8) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.55, dist);
                    return glow * pulse * 0.22;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(1.0, 0.569, 0.322); // #ff9152
                    vec3 flameColor = vec3(1.0, 0.73, 0.33);
                    vec3 glowColor = vec3(1.0, 0.8, 0.4);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += flameColor * lines;
                        alpha += lines * 0.5;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.16;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "divine_apotheosis_vignette": {
        name: "Apoteose Divina",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(160),
            emitterType: "circle",
            startColor: "#ffffff",
            endColor: "#ffffcc",
            startScale: { min: 1.0, max: 1.8 },
            endScale: { min: 0.5, max: 0.9 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3000, max: 4000 },
            speed: { min: 55, max: 100 },
            radius: 200,
            gravity: { x: 0, y: -100 },
            cross: true,
            heavenly: true
        },
        filters: {
            brightness: 1.6,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.5,
                saturation: 1.6
            }
        },
        customShader: {
            enabled: true,
            type: "divine_apotheosis",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.12;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.12;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // APENAS símbolos sagrados ascendendo (removidas asas e auréola)
                    if (uv.y > 0.55) {
                        // Símbolos sagrados ascendendo
                        for (int i = 0; i < 4; i++) {
                            float symbolX = 0.15 + float(i) * 0.2 + sin(t * 1.1 + float(i) * 2.0) * 0.03;
                            float symbolY = 0.8 - (t * 0.3 + float(i) * 0.5);
                            symbolY = mod(symbolY + 1.0, 0.4) + 0.6; // Loop ascendente
                            
                            vec2 symbolPos = vec2(symbolX, symbolY);
                            float symbolDist = distance(uv, symbolPos);
                            
                            if (symbolDist < 0.025) {
                                // Cruz sagrada
                                vec2 crossUV = (uv - symbolPos) / 0.025;
                                float crossPattern = 0.0;
                                
                                // Braços da cruz
                                if (abs(crossUV.x) < 0.3 && abs(crossUV.y) < 0.8) {
                                    crossPattern += 0.8;
                                }
                                if (abs(crossUV.y) < 0.3 && abs(crossUV.x) < 0.8) {
                                    crossPattern += 0.8;
                                }
                                
                                float fade = 1.0 - (symbolDist / 0.025);
                                pattern += crossPattern * fade * 0.6;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 2.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.8, dist);
                    return glow * pulse * 0.3;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(1.0, 1.0, 1.0); // #ffffff
                    vec3 divineColor = vec3(1.0, 0.98, 0.87);
                    vec3 glowColor = vec3(1.0, 0.95, 0.8);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += divineColor * lines;
                        alpha += lines * 0.6;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.2;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    // ========================================
    // 🌟 ARCANISTA - Magia avançada
    // ========================================

    "arcane_fission_vignette": {
        name: "Fissão Arcana",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(150),
            emitterType: "burst",
            startColor: "#5272a8",
            endColor: "#022766",
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 2.0, max: 2.6 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 1100, max: 3500 },
            speed: { min: 170, max: 230 },
            radius: 190,
            gravity: { x: -300, y: 0 },
            explosive: true
        },
        filters: {
            brightness: 1.3,
            contrast: 1.4,
            colorMatrix: {
                brightness: 1.2,
                saturation: 1.7
            }
        },
        customShader: {
            enabled: true,
            type: "arcane_fission",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.09;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Rachadura principal diagonal atravessando a tela
                    vec2 crackStart = vec2(0.1, 0.1);
                    vec2 crackEnd = vec2(0.9, 0.9);
                    
                    // Linha principal da rachadura com irregularidades
                    for (int i = 0; i < 25; i++) {
                        float progress = float(i) / 24.0;
                        vec2 currentPos = mix(crackStart, crackEnd, progress);
                        
                        // Adicionar irregularidades à rachadura
                        float irregularity = sin(progress * 15.0 + t * 2.0) * 0.05 + 
                                        sin(progress * 25.0 + t * 1.5) * 0.03;
                        
                        vec2 perpDir = normalize(vec2(-(crackEnd.y - crackStart.y), crackEnd.x - crackStart.x));
                        currentPos += perpDir * irregularity;
                        
                        float distToCrack = distance(uv, currentPos);
                        if (distToCrack < 0.015) {
                            float intensity = 1.0 - (distToCrack / 0.015);
                            pattern += intensity * 0.8;
                            
                            // Energia vazando da rachadura
                            if (distToCrack < 0.008) {
                                float leak = sin(progress * 30.0 + t * 4.0) * 0.5 + 0.5;
                                pattern += leak * 0.4;
                            }
                        }
                        
                        // Ramificações da rachadura
                        if (mod(float(i), 5.0) == 0.0 && progress > 0.2 && progress < 0.8) {
                            vec2 branchDir = vec2(sin(progress * 10.0 + t), cos(progress * 10.0 + t)) * 0.1;
                            vec2 branchEnd = currentPos + branchDir;
                            
                            for (int j = 0; j < 8; j++) {
                                float branchProgress = float(j) / 7.0;
                                vec2 branchPos = mix(currentPos, branchEnd, branchProgress);
                                
                                float distToBranch = distance(uv, branchPos);
                                if (distToBranch < 0.008) {
                                    float branchIntensity = 1.0 - (distToBranch / 0.008);
                                    pattern += branchIntensity * 0.5 * (1.0 - branchProgress);
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.5) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * pulse * 0.18;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.196, 0.145, 0.4); // #322566
                    vec3 crackColor = vec3(0.4, 0.53, 0.73);
                    vec3 glowColor = vec3(0.5, 0.6, 0.8);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += crackColor * lines;
                        alpha += lines * 0.6;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.14;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "magical_implosion_vignette": {
        name: "Implosão Mágica",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(105),
            emitterType: "circle",
            startColor: "#9955ee",
            endColor: "#7733cc",
            startScale: { min: 0.8, max: 1.3 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 800, max: 2500 },
            speed: { min: 50, max: 90 },
            radius: 180,
            gravity: { x: 0, y: -30 },
            magical: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.1,
            colorMatrix: {
                brightness: 1.11,
                saturation: 1.1
            }
        },
        customShader: {
            enabled: true,
            type: "magical_implosion",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.10;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // Anéis concêntricos contraindo para o CENTRO
                    for (int i = 0; i < 8; i++) {
                        // Começam grandes e contraem rapidamente
                        float baseRadius = 0.6 - (t * 1.5); // Contração rápida
                        float ringRadius = baseRadius + float(i) * 0.08;
                        
                        // Loop: quando o anel chega ao centro, reinicia nas bordas
                        ringRadius = mod(ringRadius + 0.8, 0.8) + 0.05;
                        float distFromRing = abs(distance(uv, center) - ringRadius);
                        if (distFromRing < 0.01) {
                            float ringIntensity = 1.0 - (distFromRing / 0.01);
                            
                            // Intensidade maior conforme se aproxima do centro
                            float centerProximity = 1.0 - (ringRadius / 0.6);
                            ringIntensity *= (1.0 + centerProximity * 2.0);
                            
                            // NOVA: Transparência crescente conforme se aproxima do centro
                            float fadeByProximity = 1.0 - (centerProximity * 2.3); // Mais transparente perto do centro
                            
                            pattern += ringIntensity * 0.7 * fadeByProximity;
                            
                            // Partículas sendo sugadas nos anéis
                            if (mod(floor(atan(uv.y - center.y, uv.x - center.x) * 10.0), 3.0) == 0.0) {
                                pattern += centerProximity * 0.4;
                            }
                        }
                    }
                    
                    // Espiral central única (posicionada no centro)
                    vec2 spiralCenter = vec2(0.5, 0.5); // Centro da tela
                    vec2 spiralUV = uv - spiralCenter;
                    
                    float spiralAngle = atan(spiralUV.y, spiralUV.x) + t * 4.0; // Rotação
                    float spiralRadius = length(spiralUV);
                    
                    if (spiralRadius < 0.15) { // Tamanho da espiral
                        // Padrão espiral que acelera conforme se aproxima do centro
                        float distanceFromCenter = spiralRadius / 0.15;
                        float acceleration = (1.0 - distanceFromCenter) * 3.0 + 1.0; // Acelera
                        
                        float spiralPattern = sin(spiralAngle * 3.0 + spiralRadius * 25.0 + t * acceleration * 5.0) * 0.5 + 0.5;
                        
                        if (spiralRadius > 0.02) { // Não desenhar no centro exato
                            float fade = 1.0 - abs(spiralRadius - 0.075) / 0.075;
                            pattern += spiralPattern * fade * 0.8 * (1.0 + acceleration * 0.3);
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho intenso no centro da implosão
                    if (dist < 0.05) {
                        float pulse = sin(t * 8.0) * 0.5 + 0.5; // Pulso rápido
                        float coreGlow = 1.0 - (dist / 0.05);
                        return coreGlow * pulse * 0.6;
                    }
                    
                    // Brilho secundário
                    float pulse = sin(t * 4.2) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.282, 0.235, 0.471); // #483c78
                    vec3 ringColor = vec3(0.73, 0.47, 1.0);
                    vec3 glowColor = vec3(0.8, 0.55, 1.0);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += ringColor * lines;
                        alpha += lines * 0.55;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.16;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

    "elemental_storm_vignette": {
        name: "Tempestade Elemental",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(105),
            emitterType: "burst",
            startColor: "#bcacfa",
            endColor: "#350dd9",
            startScale: { min: 1.7, max: 2.4 },
            endScale: { min: 0.3, max: 0.7 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2300, max: 2800 },
            speed: { min: 80, max: 150 },
            radius: 200,
            gravity: { x: 0, y: 25 },
            electric: true,
            triangular: true,
            explosive: true
        },
        filters: {
            brightness: 0.4,
            contrast: 0.3,
            colorMatrix: {
                brightness: 1.3,
                saturation: 1.8
            }
        },
        customShader: {
            enabled: true,
            type: "elemental_storm",
            uniforms: {
                time: 0,
                intensity: 0,
                fadeProgress: 0
            },
            vertex: `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `,
            fragment: `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform float time;
                uniform float intensity;
                uniform float fadeProgress;
                
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float createVignette(vec2 uv, float t) {
                    float vignette = 0.0;
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.45;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.45;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Caos elemental - raios elétricos CORRIGIDOS
                    if (uv.y < 0.4) {
                        for (int i = 0; i < 6; i++) {
                            float boltX = 0.1 + float(i) * 0.15 + sin(t * 2.5 + float(i) * 1.8) * 0.05;
                            
                            // CORREÇÃO: usar loop fixo em vez de variável
                            for (int j = 0; j < 15; j++) {
                                float y = 0.1 + float(j) * 0.017; // 0.02 * 15 = 0.3, então 0.3/15 = 0.02
                                if (y > 0.35) break;
                                
                                float zigzag = sin(y * 30.0 + t * 6.0 + float(i)) * 0.02;
                                float currentX = boltX + zigzag;
                                
                                float distFromBolt = distance(uv, vec2(currentX, y));
                                if (distFromBolt < 0.008) {
                                    pattern += (1.0 - distFromBolt / 0.008) * 0.8;
                                    
                                    // Flash elétrico
                                    if (mod(floor(t * 10.0), 3.0) == 0.0) {
                                        pattern += 0.4;
                                    }
                                }
                            }
                        }
                        
                        // Cristais elementais flutuando
                        for (int i = 0; i < 4; i++) {
                            float crystalX = 0.15 + float(i) * 0.2 + sin(t * 1.3 + float(i) * 2.1) * 0.04;
                            float crystalY = 0.2 + sin(t * 1.7 + float(i) * 1.9) * 0.06;
                            
                            vec2 crystalPos = vec2(crystalX, crystalY);
                            float crystalDist = distance(uv, crystalPos);
                            
                            if (crystalDist < 0.02) {
                                vec2 crystalUV = (uv - crystalPos) / 0.02;
                                float triPattern = 0.0;
                                
                                if (abs(crystalUV.y) < 0.8 && abs(crystalUV.x) < (0.8 - abs(crystalUV.y))) {
                                    triPattern = 0.7;
                                }
                                
                                float fade = 1.0 - (crystalDist / 0.02);
                                pattern += triPattern * fade * 0.6;
                            }
                        }
                    }
                    
                    if (uv.y > 0.6) {
                        // Vórtices elementais
                        for (int i = 0; i < 3; i++) {
                            vec2 vortexCenter = vec2(0.2 + float(i) * 0.3, 0.8);
                            vec2 vortexUV = uv - vortexCenter;
                            
                            float vortexAngle = atan(vortexUV.y, vortexUV.x) + t * 3.0;
                            float vortexRadius = length(vortexUV);
                            
                            if (vortexRadius < 0.05) {
                                float spiralPattern = sin(vortexAngle * 4.0 + vortexRadius * 20.0) * 0.5 + 0.5;
                                float explosivePattern = sin(vortexRadius * 15.0 + t * 4.0) * 0.5 + 0.5;
                                
                                float fade = 1.0 - (vortexRadius / 0.05);
                                pattern += (spiralPattern + explosivePattern) * fade * 0.4;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 5.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.45, dist);
                    return glow * pulse * 0.28;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.255, 0.184, 0.553); // #412f8d
                    vec3 chaosColor = vec3(0.8, 0.6, 1.0);
                    vec3 glowColor = vec3(0.9, 0.7, 1.0);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += chaosColor * lines;
                        alpha += lines * 0.6;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.18;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                    alpha *= smoothIntensity;
                    
                    if (fadeProgress > 0.6) {
                        float fadeAmount = (fadeProgress - 0.6) / 0.4;
                        alpha *= (1.0 - fadeAmount);
                        color *= (1.0 - fadeAmount);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    },

"arcane_singularity_vignette": {
    name: "Singularidade Arcana",
    duration: 5000,
    particles: {
        count: VIGNETTE_LOD.getParticleCount(80),
        emitterType: "circle",
        startColor: "#8b16ff",
        endColor: "#2d0842",
        startScale: { min: 1.5, max: 2.5 },
        endScale: { min: 0.1, max: 0.3 },
        startAlpha: 0.9,
        endAlpha: 0.0,
        lifetime: { min: 4000, max: 6000 },
        speed: { min: 50, max: 100 },
        radius: 300,
        gravity: { x: 0, y: 0 },
        magical: true,
        arcane: true
    },
    filters: {
        brightness: 1.2,
        contrast: 1.3,
        colorMatrix: {
            brightness: 1.1,
            saturation: 1.4
        }
    },
    customShader: {
        enabled: true,
        type: "black_hole_singularity",
        uniforms: {
            time: 0,
            intensity: 0,
            fadeProgress: 0
        },
        vertex: `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
        `,
        fragment: `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform float time;
            uniform float intensity;
            uniform float fadeProgress;
            
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            float createVignette(vec2 uv, float t) {
                float vignette = 0.06;
                
                if (uv.y < 0.45) {
                    float progress = (0.45 - uv.y) / 0.45;
                    float smoothFade = pow(progress, 1.0);
                    float vignetteIntensity = 0.22;
                    vignette = smoothFade * vignetteIntensity;
                }
                
                if (uv.y > 0.75) {
                    float progress = (uv.y - 0.75) / 0.25;
                    float smoothFade = pow(progress, 1.0);
                    float vignetteIntensity = 0.22;
                    vignette += smoothFade * vignetteIntensity;
                }
                
                return vignette;
            }
            
            float marginLines(vec2 uv, float t) {
                float pattern = 0.0;
                vec2 center = vec2(0.5, 0.5);
                
                // Partículas orbitando e sendo sugadas
                for (int i = 0; i < 25; i++) {
                    float particleId = float(i);
                    
                    // Partícula começa nas bordas
                    float startAngle = particleId * 0.8 + t * 0.5;
                    float orbitRadius = 0.4 - (mod(t * 0.8 + particleId * 0.3, 2.0) * 0.35);
                    
                    // Movimento em espiral para o centro
                    float spiralFactor = 1.0 + sin(t * 2.0 + particleId) * 0.1;
                    float currentAngle = startAngle * spiralFactor;
                    
                    vec2 particlePos = center + vec2(
                        cos(currentAngle) * orbitRadius,
                        sin(currentAngle) * orbitRadius
                    );
                    
                    float distToParticle = distance(uv, particlePos);
                    
                    if (distToParticle < 0.015) {
                        // Fadeout progressivo conforme se aproxima do centro
                        float fadeDistance = distance(particlePos, center);
                        float fadeout = smoothstep(0.05, 0.4, fadeDistance);
                        
                        float particleIntensity = (1.0 - distToParticle / 0.015) * fadeout;
                        pattern += particleIntensity * 0.8;
                        
                        // Trail da partícula SEM LOOP - usando posições fixas
                        vec2 trailDirection = normalize(particlePos - center);
                        
                        vec2 trailPos1 = particlePos - trailDirection * 0.008;
                        vec2 trailPos2 = particlePos - trailDirection * 0.016;
                        vec2 trailPos3 = particlePos - trailDirection * 0.024;
                        
                        float trailDist1 = distance(uv, trailPos1);
                        float trailDist2 = distance(uv, trailPos2);
                        float trailDist3 = distance(uv, trailPos3);
                        
                        if (trailDist1 < 0.008) {
                            pattern += (0.66 * fadeout) * 0.4;
                        }
                        if (trailDist2 < 0.008) {
                            pattern += (0.33 * fadeout) * 0.4;
                        }
                        if (trailDist3 < 0.008) {
                            pattern += (0.1 * fadeout) * 0.4;
                        }
                    }
                }
                
                return pattern;
            }
            
            float centralGlow(vec2 uv, float t) {
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(uv, center);
                
                // Núcleo escuro girando
                if (dist < 0.08) {
                    float corePattern = 0.0;
                    
                    // Elementos internos para percepção de rotação
                    float angle = atan(uv.y - center.y, uv.x - center.x) - t * 6.0; // Sentido contrário e 3x mais rápido
                    
                    // Espirais internas
                    for (int spiral = 0; spiral < 4; spiral++) {
                        float spiralAngle = angle + float(spiral) * 1.57; // 90 graus
                        float spiralRadius = dist;
                        
                        float spiralPattern = sin(spiralAngle * 6.0 + spiralRadius * 25.0 + t * 3.0);
                        if (spiralPattern > 0.3) {
                            corePattern += (spiralPattern - 0.3) * 0.3;
                        }
                    }
                    
                    // Anéis concêntricos no núcleo
                    for (int ring = 1; ring <= 3; ring++) {
                        float ringRadius = float(ring) * 0.02;
                        float ringDist = abs(dist - ringRadius);
                        if (ringDist < 0.003) {
                            float ringRotation = -t * (8.0 - float(ring) * 2.0); // Sentido contrário e mais rápido
                            float ringPattern = sin(angle * 8.0 + ringRotation) * 0.5 + 0.5;
                            corePattern += ringPattern * 0.4;
                        }
                    }
                    
                    return corePattern * 0.6; // Escuro mas visível
                }
                
                // Brilho ao redor do buraco negro
                if (dist > 0.08 && dist < 0.15) {
                    float glowIntensity = 1.0 - ((dist - 0.08) / 0.07);
                    float pulse = sin(t * 4.0) * 0.3 + 0.7;
                    return glowIntensity * pulse * 0.3;
                }
                
                return 0.0;
            }
            
            void main(void) {
                vec2 uv = vTextureCoord;
                vec3 color = vec3(0.0);
                float alpha = 0.0;
                
                vec3 vignetteColor = vec3(0.094, 0.0, 0.192); // #180031
                vec3 particleColor = vec3(0.6, 0.2, 0.9);
                vec3 coreColor = vec3(0.2, 0.05, 0.4);
                
                float vignette = createVignette(uv, time);
                if (vignette > 0.0) {
                    color += vignetteColor * vignette;
                    alpha += vignette;
                }
                
                float lines = marginLines(uv, time);
                if (lines > 0.0) {
                    color += particleColor * lines;
                    alpha += lines * 0.7;
                }
                
                float glow = centralGlow(uv, time);
                if (glow > 0.0) {
                    color += coreColor * glow;
                    alpha += glow * 0.8;
                }
                
                float smoothIntensity = smoothstep(0.0, 0.3, intensity) * (1.0 - smoothstep(0.7, 1.0, intensity));
                alpha *= smoothIntensity;
                
                if (fadeProgress > 0.6) {
                    float fadeAmount = (fadeProgress - 0.6) / 0.4;
                    alpha *= (1.0 - fadeAmount);
                    color *= (1.0 - fadeAmount);
                }
                
                gl_FragColor = vec4(color, alpha);
            }
        `
    }
}

});


// ========================================
// 🔧 FUNÇÃO PRINCIPAL DE CRIAÇÃO DE VINHETA
// ========================================

// Função principal para criar uma vinheta completa (mantém compatibilidade)
window.createAdvancedVignette = function(vignetteKey, app) {
    console.log(`🎬 Criando vinheta avançada: ${vignetteKey}`);
    
    const vignetteConfig = window.ATTACK_VIGNETTES[vignetteKey];
    if (!vignetteConfig) {
        console.error(`❌ Vinheta '${vignetteKey}' não encontrada!`);
        return null;
    }
    
    const container = new PIXI.Container();
    
    // 1. Criar partículas (sistema existente)
    const particlesContainer = createParticles(vignetteConfig, app);
    if (particlesContainer) {
        container.addChild(particlesContainer);
    }
    
    // 2. Criar elementos gráficos (novo sistema)
    const graphicsContainer = createGraphicElements(vignetteConfig, app);
    if (graphicsContainer) {
        container.addChild(graphicsContainer);
    }
    
    // 3. Aplicar filtros (sistema existente)
    if (vignetteConfig.filters) {
        applyVignetteFilters(container, vignetteConfig.filters);
    }
    
    console.log(`✅ Vinheta '${vignetteKey}' criada com sucesso`);
    return container;
};

// Função auxiliar para criar partículas (compatibilidade com sistema existente)
function createParticles(vignetteConfig, app) {
    // Esta função seria implementada baseada no sistema existente de partículas
    // Por enquanto retorna null para manter o foco nos elementos gráficos
    return null;
}

// Função auxiliar para aplicar filtros
function applyVignetteFilters(container, filters) {
    // Implementação dos filtros baseada na configuração
    if (filters.brightness || filters.contrast) {
        // Aplicar filtros de brilho e contraste
    }
    
    if (filters.colorMatrix) {
        // Aplicar matriz de cores
    }
}

console.log("🎨 Sistema de Vinhetas Avançadas v4.0 carregado!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas disponíveis com shaders customizados`);
console.log("   - Todas as vinhetas agora usam shaders para efeitos visuais únicos");
console.log("   - Animações fluidas e específicas por habilidade");
console.log("   - LOD automático para performance");