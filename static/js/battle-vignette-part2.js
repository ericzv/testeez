// battle-vignette-part2.js - Sistema de vinhetas avançadas - PARTE 2
// Ronin + Samurai + Ninja
// Versão 4.0 - Shaders customizados para todas as vinhetas

// Verificar se o dicionário global existe
if (!window.ATTACK_VIGNETTES) {
    window.ATTACK_VIGNETTES = {};
}

// PARTE 2: Vinhetas com Shaders Customizados - Classes de Combate Corpo a Corpo
Object.assign(window.ATTACK_VIGNETTES, {

    // ========================================
    // ⚔️ RONIN - Combate equilibrado e preciso
    // ========================================

    "precise_cut_vignette": {
        name: "Corte Preciso",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(85),
            emitterType: "burst",
            startColor: "#8b4513",
            endColor: "#654321",
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2400 },
            speed: { min: 60, max: 100 },
            radius: 120,
            gravity: { x: 0, y: 15 },
            metallic: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.1
            }
        },
        customShader: {
            enabled: true,
            type: "precise_cut",
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
                    
                    // Cortes precisos atravessando a tela rapidamente
                    for (int i = 0; i < 5; i++) {
                        float cutTime = t * 3.0 + float(i) * 0.8;
                        float cutPhase = mod(cutTime, 4.0);
                        
                        if (cutPhase < 1.5) {
                            float cutProgress = cutPhase / 1.5;
                            
                            // Corte diagonal preciso
                            float cutAngle = float(i) * 0.4 + sin(float(i) * 2.0) * 0.3;
                            vec2 cutDirection = vec2(cos(cutAngle), sin(cutAngle));
                            vec2 cutStart = vec2(0.5, 0.5) - cutDirection * 0.8;
                            vec2 cutEnd = vec2(0.5, 0.5) + cutDirection * 0.8;
                            
                            vec2 currentCutPos = mix(cutStart, cutEnd, cutProgress);
                            
                            // Linha do corte com brilho metálico
                            for (int j = 0; j < 20; j++) {
                                float segmentProgress = float(j) / 19.0;
                                vec2 segmentPos = mix(cutStart, currentCutPos, segmentProgress);
                                
                                float distToCut = distance(uv, segmentPos);
                                if (distToCut < 0.003) {
                                    float cutIntensity = 1.0 - (distToCut / 0.003);
                                    
                                    // Brilho metálico na lâmina
                                    float metalGlint = sin(segmentProgress * 15.0 + t * 8.0) * 0.5 + 0.5;
                                    pattern += cutIntensity * (1.0 + metalGlint) * 0.8;
                                    
                                    // Faíscas do corte
                                    if (distToCut < 0.001) {
                                        pattern += 0.5;
                                    }
                                }
                            }
                            
                            // Estilhaços do corte
                            for (int shard = 0; shard < 8; shard++) {
                                float shardAngle = cutAngle + 1.57 + (float(shard) / 4.0 - 1.0) * 0.5;
                                vec2 shardDir = vec2(cos(shardAngle), sin(shardAngle));
                                vec2 shardPos = currentCutPos + shardDir * (0.02 + float(shard) * 0.008);
                                
                                float distToShard = distance(uv, shardPos);
                                if (distToShard < 0.004) {
                                    float shardIntensity = 1.0 - (distToShard / 0.004);
                                    pattern += shardIntensity * 0.4;
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
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.15;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.4, 0.25, 0.1); // Marrom terroso
                    vec3 cutColor = vec3(0.8, 0.6, 0.4);
                    vec3 glowColor = vec3(0.6, 0.4, 0.2);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += cutColor * lines;
                        alpha += lines * 0.6;
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

    "wind_blade_vignette": {
        name: "Lâmina de Vento",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(120),
            emitterType: "burst",
            startColor: "#a0522d",
            endColor: "#8b4513",
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.2 },
            startAlpha: 0.7,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 80, max: 140 },
            radius: 180,
            gravity: { x: 0, y: -10 },
            wind: true
        },
        filters: {
            brightness: 1.0,
            contrast: 1.1,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.0
            }
        },
        customShader: {
            enabled: true,
            type: "wind_blade",
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
                    
                    if (uv.y < 0.55) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.16;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.65) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.16;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Rajadas de vento discretas e finas atravessando
                    for (int i = 0; i < 4; i++) {
                        float windTime = t * 4.0 + float(i) * 1.5;
                        float windCycle = mod(windTime, 3.0);
                        
                        if (windCycle < 1.2) {
                            float windProgress = windCycle / 1.2;
                            
                            float windX = 0.1 + float(i) * 0.25;
                            float windStartY = -0.1;
                            float windEndY = 1.1;
                            float currentWindY = windStartY + (windEndY - windStartY) * windProgress;
                            
                            // Ondulação sutil do vento
                            float windWave = sin(currentWindY * 8.0 + t * 6.0) * 0.015;
                            windX += windWave;
                            
                            float distToWind = abs(uv.x - windX);
                            
                            if (distToWind < 0.002 && uv.y > windStartY && uv.y < currentWindY) {
                                float windIntensity = 1.0 - (distToWind / 0.002);
                                
                                // Transparência aumentada conforme solicitado
                                float alphaReduction = 0.3;
                                pattern += windIntensity * alphaReduction;
                                
                                // Partículas de vento
                                if (mod(floor(uv.y * 30.0), 4.0) == 0.0) {
                                    pattern += 0.1;
                                }
                            }
                        }
                    }
                    
                    // Turbulência de alta velocidade
                    if (uv.y > 0.3 && uv.y < 0.7) {
                        float turbulence = sin(uv.x * 25.0 + t * 12.0) * sin(uv.y * 20.0 + t * 8.0);
                        turbulence *= 0.05;
                        
                        if (turbulence > 0.03) {
                            pattern += (turbulence - 0.03) * 2.0;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.5) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    return glow * pulse * 0.18;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.35, 0.27, 0.15); // Marrom terroso mais claro
                    vec3 windColor = vec3(0.7, 0.55, 0.35);
                    vec3 glowColor = vec3(0.55, 0.42, 0.25);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += windColor * lines;
                        alpha += lines * 0.4; // Reduzida para maior transparência
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

    "ascending_strike_vignette": {
        name: "Golpe Ascendente",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(95),
            emitterType: "burst",
            startColor: "#8b4513",
            endColor: "#a0522d",
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 2200, max: 2900 },
            speed: { min: 70, max: 120 },
            radius: 140,
            gravity: { x: 0, y: -80 },
            spark: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.1,
            colorMatrix: {
                brightness: 1.05,
                saturation: 1.05
            }
        },
        customShader: {
            enabled: true,
            type: "ascending_strike",
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
                        float vignetteIntensity = 0.07;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.07;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Energia ascendente do centro para cima
                    vec2 center = vec2(0.5, 0.5);
                    
                    // Correntes de energia subindo - movimento mais natural
                    for (int i = 0; i < 6; i++) {
                        float streamAngle = float(i) * 1.047 + sin(t * 1.5 + float(i)) * 0.3; // 60 graus + variação
                        float baseRadius = 0.08 + float(i) * 0.025;
                        
                        // Cada stream tem seu próprio padrão de movimento
                        float streamVariation = sin(t * (2.0 + float(i) * 0.3)) * 0.04;
                        float currentRadius = baseRadius + streamVariation;
                        
                        for (int j = 0; j < 15; j++) {
                            float streamProgress = float(j) / 14.0;
                            
                            // Altura variável com ondulação individual
                            float baseHeight = 0.35 * streamProgress;
                            float waveHeight = sin(t * (3.0 + float(i) * 0.5) + streamProgress * 5.0) * 0.05;
                            float ascendHeight = baseHeight + waveHeight;
                            
                            // Movimento lateral individual para cada stream
                            float lateralMovement = sin(t * (2.5 + float(i) * 0.2) + streamProgress * 3.0) * 0.02;
                            
                            vec2 streamPos = center + vec2(
                                cos(streamAngle) * currentRadius + lateralMovement,
                                -ascendHeight - (t * (0.25 + float(i) * 0.05)) // Velocidades diferentes
                            );
                            
                            // Loop da energia quando sai de cena
                            streamPos.y = mod(streamPos.y + 0.5, 1.0) - 0.2;
                            
                            if (streamPos.y > -0.1 && streamPos.y < 0.9) {
                                float distToStream = distance(uv, streamPos);
                                
                                if (distToStream < 0.007) {
                                    float streamIntensity = 1.0 - (distToStream / 0.007);
                                    
                                    // Intensidade crescente conforme sobe
                                    float ascendBoost = 1.0 + streamProgress * 1.5;
                                    
                                    // Variação de intensidade individual
                                    float personalIntensity = sin(t * (4.0 + float(i))) * 0.3 + 0.7;
                                    
                                    pattern += streamIntensity * ascendBoost * personalIntensity * 0.6;
                                    
                                    // Faíscas da energia
                                    if (distToStream < 0.003) {
                                        pattern += personalIntensity * 0.3;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Ondas de impacto ascendente
                    for (int wave = 0; wave < 4; wave++) {
                        float waveTime = t * 2.5 + float(wave) * 0.8;
                        float waveY = 0.8 - mod(waveTime, 2.0) * 0.6; // Sobe de baixo para cima
                        
                        float distToWave = abs(uv.y - waveY);
                        if (distToWave < 0.015 && waveY > 0.2) {
                            float waveIntensity = 1.0 - (distToWave / 0.015);
                            
                            // Ondulação lateral
                            float lateral = sin(uv.x * 15.0 + t * 8.0) * 0.01;
                            if (abs(uv.y - waveY - lateral) < 0.01) {
                                pattern += waveIntensity * 0.5;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.45, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.4, 0.28, 0.15); // Marrom terroso médio
                    vec3 energyColor = vec3(0.75, 0.58, 0.38);
                    vec3 glowColor = vec3(0.6, 0.45, 0.28);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += energyColor * lines;
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

    // ========================================
    // 🗡️ SAMURAI - Combate disciplinado e mortal
    // ========================================

    "void_cut_vignette": {
        name: "Corte do Vazio",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(90),
            emitterType: "burst",
            startColor: "#2d5016",
            endColor: "#1a3009",
            startScale: { min: 0.6, max: 1.1 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 80, max: 140 },
            radius: 160,
            gravity: { x: 0, y: 20 },
            crystalline: true
        },
        filters: {
            brightness: 1.2,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.2
            }
        },
        customShader: {
            enabled: true,
            type: "void_cut",
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
                        float vignetteIntensity = 0.29;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.29;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // Distorção do espaço - "cortar a realidade"
                    vec2 center = vec2(0.5, 0.5);
                    
                    // Fenda principal cortando o espaço
                    float voidCutTime = mod(t * 2.0, 3.0);
                    if (voidCutTime < 1.5) {
                        float cutProgress = voidCutTime / 1.5;
                        
                        // Corte diagonal atravessando toda a tela
                        float cutAngle = 0.785; // 45 graus
                        vec2 cutDir = vec2(cos(cutAngle), sin(cutAngle));
                        vec2 cutStart = center - cutDir * 0.8;
                        vec2 cutEnd = center + cutDir * 0.8;
                        
                        vec2 currentCutEnd = mix(cutStart, cutEnd, cutProgress);
                        
                        // Distorção do espaço ao redor do corte
                        for (int i = 0; i < 25; i++) {
                            float segmentProgress = float(i) / 24.0;
                            vec2 cutPoint = mix(cutStart, currentCutEnd, segmentProgress);
                            
                            float distToCut = distance(uv, cutPoint);
                            
                            // Zona de distorção espacial
                            if (distToCut < 0.08) {
                                float distortionIntensity = 1.0 - (distToCut / 0.08);
                                
                                // Distorção visual do vazio
                                float voidEffect = sin(distToCut * 40.0 + t * 12.0) * 0.5 + 0.5;
                                pattern += distortionIntensity * voidEffect * 0.3;
                                
                                // Linha central do corte
                                if (distToCut < 0.002) {
                                    pattern += 1.2; // Linha brilhante do corte
                                }
                                
                                // Fissuras menores
                                if (distToCut > 0.02 && distToCut < 0.04) {
                                    float crackPattern = sin(segmentProgress * 20.0 + t * 8.0);
                                    if (crackPattern > 0.6) {
                                        pattern += (crackPattern - 0.6) * 0.5;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Fragmentos do espaço sendo cortado
                    for (int frag = 0; frag < 8; frag++) {
                        float fragAngle = float(frag) * 0.785 + t * 1.5;
                        float fragRadius = 0.15 + sin(t * 3.0 + float(frag)) * 0.05;
                        
                        vec2 fragPos = center + vec2(cos(fragAngle), sin(fragAngle)) * fragRadius;
                        float fragDist = distance(uv, fragPos);
                        
                        if (fragDist < 0.01) {
                            float fragIntensity = 1.0 - (fragDist / 0.01);
                            pattern += fragIntensity * 0.6;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 4.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
                    return glow * pulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.05, 0.0, 0.1); // Roxo bem escuro + preto
                    vec3 voidColor = vec3(0.15, 0.05, 0.25);
                    vec3 glowColor = vec3(0.2, 0.1, 0.3);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += voidColor * lines;
                        alpha += lines * 0.7;
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

"dragon_cut_vignette": {
        name: "Corte do Dragão",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(140),
            emitterType: "burst",
            startColor: "#ff4500",
            endColor: "#8b0000",
            startScale: { min: 1.2, max: 2.0 },
            endScale: { min: 0.3, max: 0.6 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2600 },
            speed: { min: 120, max: 200 },
            radius: 220,
            gravity: { x: 0, y: -60 },
            fiery: true,
            explosive: true
        },
        filters: {
            brightness: 1.4,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.2,
                saturation: 1.4
            }
        },
        customShader: {
            enabled: true,
            type: "dragon_cut",
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
                        float vignetteIntensity = 0.11;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.11;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // IMPACTO VIOLENTO - Explosão inicial
                    float impactTime = mod(t * 1.5, 4.0);
                    if (impactTime < 0.8) {
                        float explosionProgress = impactTime / 0.8;
                        vec2 center = vec2(0.5, 0.5);
                        
                        // Ondas de choque do impacto
                        for (int shock = 0; shock < 6; shock++) {
                            float shockRadius = explosionProgress * 0.6 + float(shock) * 0.05;
                            float distFromShock = abs(distance(uv, center) - shockRadius);
                            
                            if (distFromShock < 0.02) {
                                float shockIntensity = 1.0 - (distFromShock / 0.02);
                                pattern += shockIntensity * (1.0 - explosionProgress * 0.3) * 1.2;
                            }
                        }
                        
                        // FOGO explosivo irradiando
                        for (int fire = 0; fire < 8; fire++) {
                            float fireAngle = float(fire) * 0.785; // 45 graus
                            float fireLength = explosionProgress * 0.4;
                            
                            for (int segment = 0; segment < 12; segment++) {
                                float segProgress = float(segment) / 11.0;
                                vec2 firePos = center + vec2(cos(fireAngle), sin(fireAngle)) * fireLength * segProgress;
                                
                                // Ondulação do fogo
                                float fireWave = sin(segProgress * 10.0 + t * 8.0) * 0.02;
                                firePos += vec2(-sin(fireAngle), cos(fireAngle)) * fireWave;
                                
                                float distToFire = distance(uv, firePos);
                                if (distToFire < 0.008) {
                                    float fireIntensity = 1.0 - (distToFire / 0.008);
                                    pattern += fireIntensity * (1.0 - segProgress * 0.5) * 0.8;
                                }
                            }
                        }
                    }
                    
                    // CORTE PRINCIPAL - Depois do impacto (5x mais rápido)
                    if (impactTime > 0.5 && impactTime < 1.2) { // Reduzido de 2.5 para 1.2
                        float cutProgress = (impactTime - 0.5) / 0.7; // Reduzido de 2.0 para 0.7
                        
                        // Corte diagonal massivo
                        vec2 cutStart = vec2(0.1, 0.1);
                        vec2 cutEnd = vec2(0.9, 0.9);
                        vec2 currentCutEnd = mix(cutStart, cutEnd, cutProgress);
                        
                        for (int i = 0; i < 30; i++) {
                            float segmentProgress = float(i) / 29.0;
                            vec2 cutPoint = mix(cutStart, currentCutEnd, segmentProgress);
                            
                            float distToCut = distance(uv, cutPoint);
                            
                            // Linha principal do corte
                            if (distToCut < 0.004) {
                                float cutIntensity = 1.0 - (distToCut / 0.004);
                                
                                // Calor residual do corte
                                float heatGlow = sin(segmentProgress * 20.0 + t * 6.0) * 0.5 + 0.5;
                                pattern += cutIntensity * (1.0 + heatGlow) * 1.0;
                            }
                            
                            // Calor irradiando do corte
                            if (distToCut < 0.015) {
                                float heatIntensity = 1.0 - (distToCut / 0.015);
                                pattern += heatIntensity * 0.3;
                            }
                        }
                        
                        // Fagulhas do corte
                        for (int spark = 0; spark < 15; spark++) {
                            float sparkAngle = float(spark) * 0.419 + t * 4.0; // Dispersão
                            float sparkDist = 0.05 + sin(t * 3.0 + float(spark)) * 0.03;
                            vec2 sparkPos = vec2(0.5, 0.5) + vec2(cos(sparkAngle), sin(sparkAngle)) * sparkDist;
                            
                            float distToSpark = distance(uv, sparkPos);
                            if (distToSpark < 0.005) {
                                pattern += 0.6;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 5.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * pulse * 0.3;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.15, 0.25, 0.08); // Verde escuro
                    vec3 impactColor = vec3(0.8, 0.4, 0.1); // Laranja fogo
                    vec3 glowColor = vec3(0.6, 0.8, 0.3); // Verde brilhante
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += impactColor * lines;
                        alpha += lines * 0.8;
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

    "blade_dance_vignette": {
        name: "Dança das Lâminas",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(110),
            emitterType: "burst",
            startColor: "#1a1a1a",
            endColor: "#0d0d0d",
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 1600, max: 2200 },
            speed: { min: 90, max: 160 },
            radius: 180,
            gravity: { x: 0, y: 10 },
            spark: true,
            metallic: true
        },
        filters: {
            brightness: 1.2,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.3
            }
        },
        customShader: {
            enabled: true,
            type: "blade_dance",
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
                    
                    // APENAS UM CORTE DE CADA VEZ - sucessão rápida
                    int currentBlade = int(mod(t * 8.0, 5.0)); // 5 posições diferentes, mais rápido
                    
                    for (int blade = 0; blade < 5; blade++) {
                        if (blade == currentBlade) {
                            float bladeTime = mod(t * 8.0, 1.0); // Ciclo rápido
                            
                            if (bladeTime < 0.15) { // Aparece e desaparece muito rápido
                                float bladeProgress = bladeTime / 0.15;
                                float bladeIntensity = sin(bladeProgress * 3.14159) * 3.0; // Pico intenso e rápido
                                
                                // Posições variáveis para cada corte
                                vec2 bladePositions[5];
                                bladePositions[0] = vec2(0.2, 0.3);
                                bladePositions[1] = vec2(0.7, 0.2);
                                bladePositions[2] = vec2(0.4, 0.6);
                                bladePositions[3] = vec2(0.8, 0.7);
                                bladePositions[4] = vec2(0.3, 0.8);
                                
                                float bladeAngles[5];
                                bladeAngles[0] = 0.785;  // 45°
                                bladeAngles[1] = -0.524; // -30°
                                bladeAngles[2] = 1.047;  // 60°
                                bladeAngles[3] = 0.262;  // 15°
                                bladeAngles[4] = -0.785; // -45°
                                
                                vec2 bladeCenter = bladePositions[blade];
                                float bladeAngle = bladeAngles[blade] + sin(t * 3.0) * 0.2;
                                
                                vec2 bladeDir = vec2(cos(bladeAngle), sin(bladeAngle));
                                vec2 bladeStart = bladeCenter - bladeDir * 0.12;
                                vec2 bladeEnd = bladeCenter + bladeDir * 0.12;
                                
                                // Criar linha do corte
                                for (int segment = 0; segment < 12; segment++) {
                                    float segProgress = float(segment) / 11.0;
                                    vec2 bladePoint = mix(bladeStart, bladeEnd, segProgress);
                                    
                                    float distToBlade = distance(uv, bladePoint);
                                    
                                    if (distToBlade < 0.002) {
                                        float lineIntensity = 1.0 - (distToBlade / 0.002);
                                        
                                        // Brilho metálico da lâmina
                                        float metalGlint = sin(segProgress * 25.0 + t * 15.0) * 0.5 + 0.5;
                                        
                                        pattern += lineIntensity * bladeIntensity * (1.0 + metalGlint) * 0.8;
                                    }
                                    
                                    // Rastro de luz do corte
                                    if (distToBlade < 0.006) {
                                        float trailIntensity = 1.0 - (distToBlade / 0.006);
                                        pattern += trailIntensity * bladeIntensity * 0.4;
                                    }
                                }
                                
                                // Faíscas nas pontas dos cortes
                                for (int tip = 0; tip < 2; tip++) {
                                    vec2 tipPos = (tip == 0) ? bladeStart : bladeEnd;
                                    float distToTip = distance(uv, tipPos);
                                    
                                    if (distToTip < 0.005) {
                                        float tipIntensity = 1.0 - (distToTip / 0.005);
                                        pattern += tipIntensity * bladeIntensity * 0.6;
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
                    float pulse = sin(t * 4.5) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.22;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto
                    vec3 bladeColor = vec3(0.1, 0.1, 0.1); // Cortes pretos
                    vec3 glowColor = vec3(0.098, 0.165, 0.004); // Verde bem escuro #192a01
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += bladeColor * lines;
                        alpha += lines * 0.65;
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

    "absolute_void_path_vignette": {
        name: "Caminho do Vazio Absoluto",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(160),
            emitterType: "circle",
            startColor: "#4b0082",
            endColor: "#2e0054",
            startScale: { min: 1.5, max: 2.5 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3000, max: 4000 },
            speed: { min: 100, max: 180 },
            radius: 250,
            gravity: { x: 0, y: -120 },
            magical: true,
            arcane: true
        },
        filters: {
            brightness: 1.6,
            contrast: 1.4,
            colorMatrix: {
                brightness: 1.3,
                saturation: 1.5
            }
        },
        customShader: {
            enabled: true,
            type: "absolute_void_path",
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
                    
                    // VINHETA MAIS INTENSA - roxo bem escuro
                    if (uv.y < 0.50) {
                        float progress = (0.50 - uv.y) / 0.50;
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.25; // Mais intensa
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.25; // Mais intensa
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // VAZIO TRANSCENDENTAL - alteração fundamental da realidade
                    float voidPhase = mod(t * 1.2, 5.0);
                    
                    if (voidPhase < 2.0) {
                        // Fase 1: Colapso da realidade
                        float collapseProgress = voidPhase / 2.0;
                        
                        // Ondas de colapso concêntricas
                        for (int wave = 0; wave < 8; wave++) {
                            float waveRadius = collapseProgress * 0.8 - float(wave) * 0.08;
                            if (waveRadius > 0.0) {
                                float distFromWave = abs(distance(uv, center) - waveRadius);
                                
                                if (distFromWave < 0.02) {
                                    float waveIntensity = 1.0 - (distFromWave / 0.02);
                                    
                                    // Distorção do vazio
                                    float voidDistortion = sin(waveRadius * 30.0 + t * 8.0) * 0.5 + 0.5;
                                    pattern += waveIntensity * voidDistortion * (1.0 - collapseProgress * 0.3) * 0.8;
                                }
                            }
                        }
                        
                        // Fragmentação do espaço
                        for (int frag = 0; frag < 12; frag++) {
                            float fragAngle = float(frag) * 0.524 + t * 2.0; // 30 graus
                            float fragRadius = 0.3 - collapseProgress * 0.25;
                            
                            vec2 fragPos = center + vec2(cos(fragAngle), sin(fragAngle)) * fragRadius;
                            float fragDist = distance(uv, fragPos);
                            
                            if (fragDist < 0.008) {
                                float fragIntensity = 1.0 - (fragDist / 0.008);
                                pattern += fragIntensity * (1.0 - collapseProgress) * 0.6;
                            }
                        }
                    }
                    
                    if (voidPhase > 1.5 && voidPhase < 4.0) {
                        // Fase 2: VAZIO ABSOLUTO - ausência total
                        float voidProgress = (voidPhase - 1.5) / 2.5;
                        
                        // Portal do vazio central
                        float voidRadius = 0.05 + voidProgress * 0.25;
                        float distToVoid = distance(uv, center);
                        
                        if (distToVoid < voidRadius) {
                            // Interior do vazio - escuridão transcendental
                            float voidDepth = 1.0 - (distToVoid / voidRadius);
                            
                            // Padrões do vazio absoluto
                            float voidPattern = sin(distToVoid * 50.0 + t * 6.0) * sin(atan(uv.y - center.y, uv.x - center.x) * 8.0 + t * 4.0);
                            voidPattern = abs(voidPattern) * voidDepth;
                            
                            pattern += voidPattern * 1.2;
                        }
                        
                        // Borda do vazio - distorção extrema
                        float borderDist = abs(distToVoid - voidRadius);
                        if (borderDist < 0.03) {
                            float borderIntensity = 1.0 - (borderDist / 0.03);
                            
                            // Energia do vazio vazando
                            float voidLeakage = sin(atan(uv.y - center.y, uv.x - center.x) * 16.0 + t * 10.0) * 0.5 + 0.5;
                            pattern += borderIntensity * voidLeakage * 1.5;
                        }
                        
                        // Raios do vazio irradiando
                        for (int ray = 0; ray < 16; ray++) {
                            float rayAngle = float(ray) * 0.393 + t * 3.0; // 22.5 graus
                            vec2 rayDir = vec2(cos(rayAngle), sin(rayAngle));
                            
                            for (int segment = 0; segment < 20; segment++) {
                                float segmentDist = voidRadius + float(segment) * 0.02;
                                vec2 rayPos = center + rayDir * segmentDist;
                                
                                if (rayPos.x >= 0.0 && rayPos.x <= 1.0 && rayPos.y >= 0.0 && rayPos.y <= 1.0) {
                                    float distToRay = distance(uv, rayPos);
                                    
                                    if (distToRay < 0.003) {
                                        float rayIntensity = 1.0 - (distToRay / 0.003);
                                        float distanceFade = 1.0 - (float(segment) / 20.0);
                                        pattern += rayIntensity * distanceFade * 0.8;
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
                    float pulse = sin(t * 2.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * pulse * 0.35;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.08, 0.0, 0.15); // Roxo bem mais escuro
                    vec3 voidColor = vec3(0.2, 0.05, 0.35);
                    vec3 glowColor = vec3(0.25, 0.1, 0.4);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += voidColor * lines;
                        alpha += lines * 0.8;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.25;
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
    // 🥷 NINJA - Combate das sombras
    // ========================================

    "shadow_strike_vignette": {
        name: "Golpe das Sombras",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(200),
            emitterType: "burst",
            startColor: "#2f2f2f",
            endColor: "#1a1a1a",
            startScale: { min: 2.0, max: 2.4 },
            endScale: { min: 0.5, max: 0.8 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2500, max: 3500 },
            speed: { min: 150, max: 220 },
            radius: 130,
            gravity: { x: 5, y: 500 },
            smoky: true
        },
        filters: {
            brightness: 0.6,
            contrast: 1.4,
            colorMatrix: {
                brightness: 0.7,
                saturation: 0.8
            }
        },
        customShader: {
            enabled: true,
            type: "shadow_strike",
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
                    float vignette = 0.05;
                    
                    // FORTE VINHETA PRETA - muito escura
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 1.55; // Bem forte
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 1.55; // Bem forte
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // ELEMENTOS MISTERIOSOS ANDANDO NAS SOMBRAS
                    for (int shadow = 0; shadow < 6; shadow++) {
                        float shadowTime = t * 1.5 + float(shadow) * 1.2;
                        float shadowX = 0.1 + mod(shadowTime * 0.3, 0.8); // Movimento horizontal
                        float shadowY = 0.2 + mod(float(shadow), 3.0) * 0.2 + sin(shadowTime * 0.8) * 0.1; // Movimento vertical sutil
                        
                        vec2 shadowPos = vec2(shadowX, shadowY);
                        
                        // Forma misteriosa das sombras
                        for (int blob = 0; blob < 4; blob++) {
                            float blobAngle = float(blob) * 1.57 + shadowTime * 2.0; // 90 graus, girando
                            float blobRadius = 0.02 + sin(shadowTime * 3.0 + float(blob)) * 0.01;
                            
                            vec2 blobPos = shadowPos + vec2(cos(blobAngle), sin(blobAngle)) * blobRadius;
                            float distToBlob = distance(uv, blobPos);
                            
                            if (distToBlob < 0.015) {
                                float blobIntensity = 1.0 - (distToBlob / 0.015);
                                
                                // "Luz preta" - sombras que se movem
                                float darkLight = sin(shadowTime * 4.0 + float(blob)) * 0.3 + 0.7;
                                pattern += blobIntensity * darkLight * 0.4;
                            }
                        }
                        
                        // Rastros das sombras
                        for (int trail = 1; trail <= 3; trail++) {
                            vec2 trailPos = vec2(shadowX - float(trail) * 0.03, shadowY);
                            float trailDist = distance(uv, trailPos);
                            
                            if (trailDist < 0.008) {
                                float trailIntensity = 1.0 - (trailDist / 0.008);
                                pattern += trailIntensity * (1.0 - float(trail) / 4.0) * 0.3;
                            }
                        }
                    }
                    
                    // Ondas de sombra atravessando
                    for (int wave = 0; wave < 3; wave++) {
                        float waveTime = t * 2.0 + float(wave) * 1.5;
                        float waveY = mod(waveTime * 0.4, 1.2) - 0.1; // Atravessa de cima para baixo
                        
                        if (waveY > 0.0 && waveY < 1.0) {
                            float distToWave = abs(uv.y - waveY);
                            
                            if (distToWave < 0.03) {
                                float waveIntensity = 1.0 - (distToWave / 0.03);
                                
                                // Ondulação sombria
                                float shadowWave = sin(uv.x * 20.0 + waveTime * 5.0) * 0.01;
                                if (abs(uv.y - waveY - shadowWave) < 0.02) {
                                    pattern += waveIntensity * 0.5;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // "Luz preta" central - escuridão brilhante
                    float darkPulse = sin(t * 3.5) * 0.3 + 0.7; // Pulso escuro
                    float darkGlow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return darkGlow * darkPulse * 0.2; // Bem sutil
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto absoluto
                    vec3 shadowColor = vec3(0.2, 0.2, 0.2); // Cinza muito escuro
                    vec3 glowColor = vec3(0.1, 0.1, 0.1); // "Luz preta"
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += shadowColor * lines;
                        alpha += lines * 0.7;
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

    "poisoned_blade_vignette": {
        name: "Lâmina Envenenada",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(95),
            emitterType: "burst",
            startColor: "#00ff00",
            endColor: "#44ff44",
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 1.0, max: 1.8 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 2800, max: 3600 },
            speed: { min: 30, max: 60 },
            radius: 150,
            gravity: { x: 0, y: -15 },
            toxic: true,
            cloud: true
        },
        filters: {
            brightness: 1.0,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.3
            }
        },
        customShader: {
            enabled: true,
            type: "poisoned_blade",
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
                    
                    // VINHETAS VERDES TÓXICAS - mais fortes
                    if (uv.y < 0.50) {
                        float progress = (0.50 - uv.y) / 0.50;
                        float smoothFade = pow(progress, 1.4);
                        float vignetteIntensity = 0.18;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.4);
                        float vignetteIntensity = 0.18;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // DISTORÇÃO TÓXICA CENTRALIZADA (inspirado no shader original)
                    float wave = sin(uv.y * 15.0 + t * 4.0) * 0.008;
                    wave += cos(uv.x * 20.0 + t * 3.0) * 0.008;
                    wave *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    if (abs(wave) > 0.004) {
                        pattern += abs(wave) * 8.0;
                    }
                    
                    // BOLHAS DE ÁCIDO CENTRALIZADAS (como no original)
                    for (int i = 0; i < 4; i++) {
                        vec2 bubblePos = center + vec2(
                            sin(t * 3.0 + float(i) * 1.5) * 0.15,
                            cos(t * 2.5 + float(i) * 2.0) * 0.15
                        );
                        float bubbleDist = distance(uv, bubblePos);
                        
                        if (bubbleDist < 0.03) {
                            float bubbleIntensity = 1.0 - (bubbleDist / 0.03);
                            pattern += bubbleIntensity * 0.8;
                            
                            // Núcleo brilhante da bolha
                            if (bubbleDist < 0.015) {
                                pattern += 0.5;
                            }
                        }
                        
                        // Borda da bolha
                        float borderDist = abs(bubbleDist - 0.025);
                        if (borderDist < 0.003) {
                            pattern += (1.0 - borderDist / 0.003) * 0.4;
                        }
                    }
                    
                    // BOLHAS CENTRÍFUGAS SAINDO DO CENTRO
                    for (int bubble = 0; bubble < 8; bubble++) {
                        float bubbleTime = t * 2.0 + float(bubble) * 0.8;
                        float bubbleAngle = float(bubble) * 0.785 + t * 1.5; // 45 graus
                        float bubbleDistance = mod(bubbleTime * 0.2, 0.6) + 0.02;
                        
                        vec2 bubblePos = center + vec2(cos(bubbleAngle), sin(bubbleAngle)) * bubbleDistance;
                        float bubbleDist = distance(uv, bubblePos);
                        
                        if (bubbleDist < 0.012) {
                            float bubbleIntensity = 1.0 - (bubbleDist / 0.012);
                            
                            // Fadeout conforme se afasta do centro
                            float fadeout = 1.0 - smoothstep(0.0, 0.5, bubbleDistance);
                            pattern += bubbleIntensity * fadeout * 0.6;
                        }
                    }
                    
                    // NÉVOA TÓXICA (inspirado no original)
                    float fog = sin(uv.x * 8.0 + uv.y * 8.0 + t * 2.0) * 0.5 + 0.5;
                    fog *= 1.0 - smoothstep(0.0, 0.35, dist);
                    pattern += fog * 0.3;
                    
                    // FUMACINHA SAINDO DO CENTRO
                    for (int smoke = 0; smoke < 6; smoke++) {
                        float smokeTime = t * 1.8 + float(smoke) * 1.0;
                        float smokeAngle = float(smoke) * 1.047 + smokeTime * 0.3; // 60 graus
                        float smokeDistance = mod(smokeTime * 0.12, 0.4) + 0.01;
                        
                        vec2 smokePos = center + vec2(cos(smokeAngle), sin(smokeAngle)) * smokeDistance;
                        
                        // Múltiplas partículas de fumaça por direção
                        for (int puff = 0; puff < 3; puff++) {
                            float puffOffset = float(puff) * 0.02;
                            vec2 puffPos = smokePos + vec2(
                                sin(smokeTime * 4.0 + float(puff)) * 0.015,
                                cos(smokeTime * 3.0 + float(puff)) * 0.015
                            );
                            
                            float puffDist = distance(uv, puffPos);
                            
                            if (puffDist < 0.018) {
                                float puffIntensity = 1.0 - (puffDist / 0.018);
                                float smokeLife = 1.0 - (smokeDistance / 0.4);
                                pattern += puffIntensity * smokeLife * 0.4;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // BRILHO VERDE TÓXICO INTENSO no centro
                    float poisonPulse = sin(t * 4.0) * 0.3 + 0.7;
                    float poisonGlow = 1.0 - smoothstep(0.0, 0.25, dist);
                    
                    // Pulso adicional para toxicidade
                    float toxicBoost = sin(t * 8.0) * 0.2 + 0.8;
                    
                    return poisonGlow * poisonPulse * toxicBoost * 0.4;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.1, 0.3, 0.1); // Verde escuro para vinhetas
                    vec3 toxicColor = vec3(0.3, 0.9, 0.4); // Verde tóxico vibrante (como no original)
                    vec3 glowColor = vec3(0.2, 1.0, 0.3); // Verde brilhante para o centro
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += toxicColor * lines;
                        alpha += lines * 0.7;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.3;
                    }
                    
                    // Fadeout nas bordas (como no original)
                    vec2 center = vec2(0.5, 0.5);
                    float distFromCenter = distance(uv, center);
                    float edgeFade = 1.0 - smoothstep(0.3, 0.45, distFromCenter);
                    alpha *= edgeFade;
                    
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

    "assassin_technique_vignette": {
        name: "Técnica do Assassino",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(80),
            emitterType: "burst",
            startColor: "#333333",
            endColor: "#111111",
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 50, max: 90 },
            radius: 120,
            gravity: { x: 0, y: 8 },
            spark: true
        },
        filters: {
            brightness: 0.5,
            contrast: 1.5,
            colorMatrix: {
                brightness: 0.6,
                saturation: 0.7
            }
        },
        customShader: {
            enabled: true,
            type: "assassin_technique",
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
                        float vignetteIntensity = 0.20; // Bem escuro
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.20; // Bem escuro
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // PONTOS BRILHANTES APARECENDO - alvos precisos
                    for (int point = 0; point < 12; point++) {
                        float pointTime = t * 3.0 + float(point) * 0.5;
                        float pointCycle = mod(pointTime, 2.5);
                        
                        if (pointCycle < 0.6) {
                            float pointProgress = pointCycle / 0.6;
                            float pointIntensity = sin(pointProgress * 3.14159) * 2.0; // Aparecem e desaparecem
                            
                            // Posições estratégicas dos pontos
                            float pointX = 0.15 + mod(float(point), 5.0) * 0.15 + sin(pointTime * 0.8) * 0.02;
                            float pointY = 0.2 + mod(float(point), 4.0) * 0.2 + cos(pointTime * 0.6) * 0.03;
                            
                            vec2 pointPos = vec2(pointX, pointY);
                            float distToPoint = distance(uv, pointPos);
                            
                            if (distToPoint < 0.008) {
                                float brightness = 1.0 - (distToPoint / 0.008);
                                pattern += brightness * pointIntensity * 0.8;
                                
                                // Núcleo brilhante
                                if (distToPoint < 0.003) {
                                    pattern += 0.6;
                                }
                            }
                            
                            // Mira de precisão ao redor do ponto
                            for (int crosshair = 0; crosshair < 4; crosshair++) {
                                float crossAngle = float(crosshair) * 1.57; // 90 graus
                                vec2 crossDir = vec2(cos(crossAngle), sin(crossAngle));
                                
                                for (int segment = 1; segment <= 3; segment++) {
                                    vec2 crossPos = pointPos + crossDir * (0.01 + float(segment) * 0.005);
                                    float distToCross = distance(uv, crossPos);
                                    
                                    if (distToCross < 0.002) {
                                        float crossIntensity = 1.0 - (distToCross / 0.002);
                                        pattern += crossIntensity * pointIntensity * 0.4;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Linhas de mira conectando pontos
                    for (int line = 0; line < 6; line++) {
                        float lineTime = t * 2.0 + float(line) * 0.8;
                        float lineCycle = mod(lineTime, 3.0);
                        
                        if (lineCycle < 1.0) {
                            float lineProgress = lineCycle;
                            
                            vec2 lineStart = vec2(0.2 + mod(float(line), 3.0) * 0.3, 0.3 + mod(float(line), 2.0) * 0.4);
                            vec2 lineEnd = vec2(0.8 - mod(float(line), 3.0) * 0.3, 0.7 - mod(float(line), 2.0) * 0.4);
                            vec2 currentLineEnd = mix(lineStart, lineEnd, lineProgress);
                            
                            // Linha de conexão
                            for (int segment = 0; segment < 15; segment++) {
                                float segProgress = float(segment) / 14.0;
                                vec2 linePoint = mix(lineStart, currentLineEnd, segProgress);
                                
                                float distToLine = distance(uv, linePoint);
                                
                                if (distToLine < 0.001) {
                                    float lineIntensity = 1.0 - (distToLine / 0.001);
                                    pattern += lineIntensity * (1.0 - segProgress * 0.3) * 0.5;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 4.0) * 0.4 + 0.6; // Pulso focado
                    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
                    return glow * pulse * 0.15;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.02, 0.02, 0.02); // Quase preto
                    vec3 targetColor = vec3(0.25, 0.25, 0.25); // Cinza claro para os pontos
                    vec3 glowColor = vec3(0.15, 0.15, 0.15);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += targetColor * lines;
                        alpha += lines * 0.7;
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

    "shadow_execution_vignette": {
        name: "Execução nas Sombras",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(140),
            emitterType: "circle",
            startColor: "#1a1a1a",
            endColor: "#0d0d0d",
            startScale: { min: 1.0, max: 1.8 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3500, max: 4500 },
            speed: { min: 70, max: 130 },
            radius: 200,
            gravity: { x: 0, y: -50 },
            smoky: true,
            cloud: true
        },
        filters: {
            brightness: 0.4,
            contrast: 1.6,
            colorMatrix: {
                brightness: 0.5,
                saturation: 0.6
            }
        },
        customShader: {
            enabled: true,
            type: "shadow_execution",
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
                    
                    // TUDO MUITO ESCURO
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.35; // Extremamente escuro
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.35; // Extremamente escuro
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // ESCURIDÃO ENVOLVENTE - primeira fase
                    if (t < 3.0) {
                        float darknessProgress = t / 3.0;
                        
                        // Ondas de escuridão se espalhando
                        for (int wave = 0; wave < 6; wave++) {
                            float waveRadius = darknessProgress * 0.8 + float(wave) * 0.08;
                            float distFromWave = abs(distance(uv, center) - waveRadius);
                            
                            if (distFromWave < 0.025) {
                                float waveIntensity = 1.0 - (distFromWave / 0.025);
                                
                                // Escuridão crescente
                                float darknessLevel = darknessProgress * (1.0 - float(wave) / 6.0);
                                pattern += waveIntensity * darknessLevel * 0.3;
                            }
                        }
                        
                        // Sombras se movendo
                        for (int shadow = 0; shadow < 8; shadow++) {
                            float shadowAngle = float(shadow) * 0.785 + t * 2.0; // 45 graus
                            float shadowRadius = 0.2 + sin(t * 3.0 + float(shadow)) * 0.1;
                            
                            vec2 shadowPos = center + vec2(cos(shadowAngle), sin(shadowAngle)) * shadowRadius;
                            float shadowDist = distance(uv, shadowPos);
                            
                            if (shadowDist < 0.02) {
                                float shadowIntensity = 1.0 - (shadowDist / 0.02);
                                pattern += shadowIntensity * darknessProgress * 0.4;
                            }
                        }
                    }
                    
                    // VÓRTEX VERMELHO - surge depois de um tempo, rapidamente, e some
                    if (t > 2.5 && t < 3.5) {
                        float vortexTime = (t - 2.5) / 1.0; // 1 segundo de duração
                        float vortexIntensity = sin(vortexTime * 3.14159) * 3.0; // Pico rápido e intenso
                        
                        // Vórtex central vermelho
                        float vortexRadius = 0.15 * vortexTime;
                        float distToVortex = distance(uv, center);
                        
                        if (distToVortex < vortexRadius) {
                            // Interior do vórtex
                            float vortexDepth = 1.0 - (distToVortex / vortexRadius);
                            
                            // Padrão espiral do vórtex
                            float spiralAngle = atan(uv.y - center.y, uv.x - center.x) + t * 12.0;
                            float spiralPattern = sin(spiralAngle * 6.0 + distToVortex * 30.0) * 0.5 + 0.5;
                            
                            // COR VERMELHA para a execução
                            float redExecution = vortexDepth * spiralPattern * vortexIntensity;
                            pattern += redExecution * 0.8;
                        }
                        
                        // Bordas do vórtex com energia vermelha
                        float vortexBorder = abs(distToVortex - vortexRadius);
                        if (vortexBorder < 0.02) {
                            float borderIntensity = 1.0 - (vortexBorder / 0.02);
                            pattern += borderIntensity * vortexIntensity * 0.6;
                        }
                        
                        // Raios vermelhos irradiando do vórtex
                        for (int ray = 0; ray < 12; ray++) {
                            float rayAngle = float(ray) * 0.524 + t * 8.0; // 30 graus
                            vec2 rayDir = vec2(cos(rayAngle), sin(rayAngle));
                            
                            for (int segment = 0; segment < 10; segment++) {
                                float segmentDist = vortexRadius + float(segment) * 0.03;
                                vec2 rayPos = center + rayDir * segmentDist;
                                
                                if (rayPos.x >= 0.0 && rayPos.x <= 1.0 && rayPos.y >= 0.0 && rayPos.y <= 1.0) {
                                    float distToRay = distance(uv, rayPos);
                                    
                                    if (distToRay < 0.002) {
                                        float rayIntensity = 1.0 - (distToRay / 0.002);
                                        float distanceFade = 1.0 - (float(segment) / 10.0);
                                        pattern += rayIntensity * distanceFade * vortexIntensity * 0.5;
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
                    
                    // Brilho escuro inicial, depois vermelho na execução
                    if (t > 2.5 && t < 3.5) {
                        // Brilho vermelho da execução
                        float executionTime = (t - 2.5) / 1.0;
                        float redPulse = sin(executionTime * 3.14159) * 2.0;
                        float redGlow = 1.0 - smoothstep(0.0, 0.25, dist);
                        return redGlow * redPulse * 0.4; // Brilho vermelho
                    } else {
                        // Brilho escuro normal
                        float darkPulse = sin(t * 2.5) * 0.3 + 0.7;
                        float darkGlow = 1.0 - smoothstep(0.0, 0.4, dist);
                        return darkGlow * darkPulse * 0.1;
                    }
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    // Cores base escuras
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto absoluto
                    vec3 shadowColor = vec3(0.05, 0.05, 0.05); // Cinza escuríssimo
                    
                    // COR VERMELHA para o vórtex de execução
                    if (time > 2.5 && time < 3.5) {
                        shadowColor = vec3(0.3, 0.0, 0.0); // Vermelho escuro
                    }
                    
                    vec3 glowColor = shadowColor * 0.5;
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += shadowColor * lines;
                        alpha += lines * 0.8;
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
    }

});

console.log("🎨 Sistema de Vinhetas Avançadas v4.0 - PARTE 2 carregado!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas totais disponíveis`);
console.log("   - Ronin, Samurai e Ninja implementados com shaders temáticos");
console.log("🎨 Sistema de Vinhetas Avançadas v4.0 - PARTE 2 COMPLETA!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas totais disponíveis`);
console.log("   - Ronin (3), Samurai (4), Ninja (4) implementados com shaders temáticos");
console.log("   - Efeitos únicos: Cortes, Impactos, Vazio, Sombras, Veneno, Execução");