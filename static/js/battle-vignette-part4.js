// battle-vignette-part4.js - Sistema de vinhetas avançadas - PARTE 4
// Gatuno + Vampiro + Ladrão Mestre
// Versão 4.0 - Shaders customizados para todas as vinhetas

// Verificar se o dicionário global existe
if (!window.ATTACK_VIGNETTES) {
    window.ATTACK_VIGNETTES = {};
}

// PARTE 4: Vinhetas com Shaders Customizados - Classes Furtivas e Sombrias
Object.assign(window.ATTACK_VIGNETTES, {

    // ========================================
    // 🏴‍☠️ GATUNO - Combate furtivo e terroso
    // ========================================

    "sneaky_attack_vignette": {
        name: "Ataque Sorrateiro",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(75),
            emitterType: "burst",
            startColor: "#3c2e26",
            endColor: "#1a1612",
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 2200, max: 3000 },
            speed: { min: 40, max: 80 },
            radius: 140,
            gravity: { x: 0, y: 25 },
            smoky: true
        },
        filters: {
            brightness: 0.8,
            contrast: 1.3,
            colorMatrix: {
                brightness: 0.9,
                saturation: 0.9
            }
        },
        customShader: {
            enabled: true,
            type: "ataque_sorrateiro",
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
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.22;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.22;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // SOMBRAS LÍQUIDAS se movendo furtivamente
                    for (int shadow = 0; shadow < 8; shadow++) {
                        float shadowTime = t * 1.8 + float(shadow) * 0.7;
                        float shadowPhase = mod(shadowTime, 3.5);
                        
                        if (shadowPhase < 2.0) {
                            float shadowProgress = shadowPhase / 2.0;
                            
                            // Trajetória orgânica e irregular
                            float shadowAngle = float(shadow) * 0.785 + sin(shadowTime * 0.5) * 0.8;
                            float shadowDistance = 0.1 + shadowProgress * 0.4;
                            
                            // Movimento serpenteante
                            float serpentine = sin(shadowProgress * 8.0 + shadowTime * 2.0) * 0.05;
                            vec2 shadowPos = center + vec2(
                                cos(shadowAngle) * shadowDistance + serpentine,
                                sin(shadowAngle) * shadowDistance + sin(shadowProgress * 6.0) * 0.03
                            );
                            
                            // Criar "mancha" de sombra irregular
                            for (int blob = 0; blob < 6; blob++) {
                                float blobAngle = float(blob) * 1.047 + shadowTime * 1.5;
                                float blobRadius = 0.015 + sin(shadowTime * 3.0 + float(blob)) * 0.008;
                                
                                vec2 blobPos = shadowPos + vec2(cos(blobAngle), sin(blobAngle)) * blobRadius;
                                float blobDist = distance(uv, blobPos);
                                
                                if (blobDist < 0.02) {
                                    float blobIntensity = 1.0 - (blobDist / 0.02);
                                    
                                    // Densidade variável da sombra
                                    float shadowDensity = sin(shadowProgress * 5.0 + float(blob)) * 0.3 + 0.7;
                                    pattern += blobIntensity * shadowDensity * (1.0 - shadowProgress * 0.4) * 0.4;
                                }
                            }
                            
                            // Rastro de sombra deixado para trás
                            for (int trail = 1; trail <= 4; trail++) {
                                float trailFactor = float(trail) * 0.05;
                                vec2 trailPos = shadowPos - vec2(cos(shadowAngle), sin(shadowAngle)) * trailFactor;
                                float trailDist = distance(uv, trailPos);
                                
                                if (trailDist < 0.012) {
                                    float trailIntensity = 1.0 - (trailDist / 0.012);
                                    pattern += trailIntensity * (1.0 - float(trail) / 5.0) * 0.25;
                                }
                            }
                        }
                    }
                    
                    // POEIRA sendo levantada discretamente
                    for (int dust = 0; dust < 12; dust++) {
                        float dustTime = t * 2.5 + float(dust) * 0.4;
                        float dustY = 0.8 - mod(dustTime * 0.3, 1.2);
                        
                        if (dustY > 0.2 && dustY < 0.8) {
                            float dustX = 0.2 + mod(float(dust), 3.0) * 0.2 + sin(dustTime * 1.5) * 0.08;
                            vec2 dustPos = vec2(dustX, dustY);
                            
                            float dustDist = distance(uv, dustPos);
                            if (dustDist < 0.008) {
                                float dustIntensity = 1.0 - (dustDist / 0.008);
                                float dustOpacity = sin(dustTime * 4.0) * 0.3 + 0.5;
                                pattern += dustIntensity * dustOpacity * 0.3;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho terroso muito sutil
                    float pulse = sin(t * 2.8) * 0.2 + 0.8;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * pulse * 0.12;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.15, 0.12, 0.08); // Marrom terroso escuro
                    vec3 shadowColor = vec3(0.08, 0.06, 0.04); // Marrom muito escuro
                    vec3 glowColor = vec3(0.12, 0.09, 0.06); // Marrom médio
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += shadowColor * lines;
                        alpha += lines * 0.65;
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

    "shadow_strike_vignette": {
        name: "Golpe nas Sombras",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(85),
            emitterType: "burst",
            startColor: "#2d2419",
            endColor: "#0f0c08",
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2600 },
            speed: { min: 60, max: 110 },
            radius: 160,
            gravity: { x: 0, y: 15 },
            smoky: true,
            cloud: true
        },
        filters: {
            brightness: 0.7,
            contrast: 1.4,
            colorMatrix: {
                brightness: 0.8,
                saturation: 0.8
            }
        },
        customShader: {
            enabled: true,
            type: "golpe_nas_sombras",
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
                    
                    if (uv.y < 0.50) {
                        float progress = (0.50 - uv.y) / 0.50;
                        float smoothFade = pow(progress, 1.4);
                        float vignetteIntensity = 0.25;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.4);
                        float vignetteIntensity = 0.25;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // CORTE SOMBRIO PRINCIPAL - rasgo irregular
                    float cutTime = mod(t * 2.5, 4.0);
                    if (cutTime < 1.5) {
                        float cutProgress = cutTime / 1.5;
                        
                        // Linha base do corte diagonal
                        vec2 cutStart = vec2(0.15, 0.2);
                        vec2 cutEnd = vec2(0.85, 0.8);
                        vec2 currentCutEnd = mix(cutStart, cutEnd, cutProgress);
                        
                        // Criar rasgo irregular como garra
                        for (int segment = 0; segment < 20; segment++) {
                            float segProgress = float(segment) / 19.0;
                            vec2 basePoint = mix(cutStart, currentCutEnd, segProgress);
                            
                            // Irregularidade do rasgo
                            float jaggedness = sin(segProgress * 15.0 + t * 6.0) * 0.015;
                            jaggedness += sin(segProgress * 30.0 + t * 12.0) * 0.008;
                            
                            // Direção perpendicular ao corte
                            vec2 perpDir = normalize(vec2(-(cutEnd.y - cutStart.y), cutEnd.x - cutStart.x));
                            vec2 jaggedPoint = basePoint + perpDir * jaggedness;
                            
                            float distToJagged = distance(uv, jaggedPoint);
                            
                            // Linha principal do rasgo
                            if (distToJagged < 0.003) {
                                float cutIntensity = 1.0 - (distToJagged / 0.003);
                                pattern += cutIntensity * (1.0 - segProgress * 0.2) * 0.8;
                            }
                            
                            // Bordas do rasgo
                            for (int edge = 0; edge < 2; edge++) {
                                float edgeOffset = (float(edge) - 0.5) * 0.008;
                                vec2 edgePoint = jaggedPoint + perpDir * edgeOffset;
                                float edgeDist = distance(uv, edgePoint);
                                
                                if (edgeDist < 0.002) {
                                    float edgeIntensity = 1.0 - (edgeDist / 0.002);
                                    pattern += edgeIntensity * 0.4;
                                }
                            }
                        }
                    }
                    
                    // SOMBRAS DANÇANTES ao redor do corte
                    for (int dancer = 0; dancer < 6; dancer++) {
                        float danceTime = t * 1.5 + float(dancer) * 1.2;
                        float danceRadius = 0.15 + sin(danceTime * 0.8) * 0.08;
                        float danceAngle = float(dancer) * 1.047 + danceTime * 0.4;
                        
                        vec2 danceCenter = center + vec2(cos(danceAngle), sin(danceAngle)) * danceRadius;
                        
                        // Ondulação da sombra
                        float waveIntensity = sin(danceTime * 2.5) * 0.5 + 0.5;
                        
                        for (int tendril = 0; tendril < 4; tendril++) {
                            float tendrilAngle = float(tendril) * 1.57 + danceTime * 1.8;
                            float tendrilLength = 0.02 + waveIntensity * 0.015;
                            
                            vec2 tendrilPos = danceCenter + vec2(cos(tendrilAngle), sin(tendrilAngle)) * tendrilLength;
                            float tendrilDist = distance(uv, tendrilPos);
                            
                            if (tendrilDist < 0.008) {
                                float tendrilIntensity = 1.0 - (tendrilDist / 0.008);
                                pattern += tendrilIntensity * waveIntensity * 0.3;
                            }
                        }
                    }
                    
                    // NÉVOA SOMBRIA emergindo
                    float mistPhase = sin(t * 1.2) * 0.5 + 0.5;
                    for (int mist = 0; mist < 15; mist++) {
                        float mistAngle = float(mist) * 0.419 + t * 0.8;
                        float mistDistance = 0.25 + mistPhase * 0.2;
                        
                        vec2 mistPos = center + vec2(cos(mistAngle), sin(mistAngle)) * mistDistance;
                        
                        // Adicionar movimento ondulante
                        mistPos.x += sin(t * 2.0 + float(mist)) * 0.03;
                        mistPos.y += cos(t * 1.5 + float(mist)) * 0.025;
                        
                        float mistDist = distance(uv, mistPos);
                        if (mistDist < 0.015) {
                            float mistIntensity = 1.0 - (mistDist / 0.015);
                            pattern += mistIntensity * mistPhase * 0.25;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho sombrio pulsante
                    float pulse = sin(t * 3.2) * 0.3 + 0.7;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.18;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.08, 0.06, 0.04); // Marrom muito escuro
                    vec3 cutColor = vec3(0.02, 0.02, 0.02); // Quase preto
                    vec3 glowColor = vec3(0.06, 0.04, 0.03); // Marrom escuríssimo
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += cutColor * lines;
                        alpha += lines * 0.7;
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

    "treacherous_stab_vignette": {
        name: "Apunhalada Traiçoeira",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(95),
            emitterType: "burst",
            startColor: "#4a3c2a",
            endColor: "#1e1611",
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 80, max: 140 },
            radius: 180,
            gravity: { x: 0, y: 30 },
            metallic: true,
            spark: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.05,
                saturation: 1.1
            }
        },
        customShader: {
            enabled: true,
            type: "apunhalada_traicoes",
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
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.28; // AUMENTADO
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.28; // AUMENTADO
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // APUNHALADA CENTRALIZADA - movimento mais longo e visível
                    float stabTime = mod(t * 1.8, 6.0); // MAIS LENTO E LONGO
                    if (stabTime < 1.2) { // DURAÇÃO MAIOR
                        // Movimento da lâmina centralizado
                        float stabProgress = stabTime / 1.2;
                        
                        // MOVIMENTO CENTRALIZADO - passa pelo centro
                        vec2 stabStart = vec2(0.2, 0.2);  // Começa mais perto do centro
                        vec2 stabEnd = vec2(0.8, 0.8);     // Termina mais longe
                        
                        // Interpolação não-linear para movimento mais dramático
                        float easedProgress = stabProgress * stabProgress * (3.0 - 2.0 * stabProgress);
                        vec2 currentStabPos = mix(stabStart, stabEnd, easedProgress);
                        
                        // TRILHA DA LÂMINA MAIS BRILHANTE E LONGA
                        for (int trail = 0; trail < 25; trail++) { // MAIS SEGMENTOS
                            float trailFactor = float(trail) / 24.0;
                            vec2 trailPos = mix(stabStart, currentStabPos, trailFactor);
                            
                            float distToTrail = distance(uv, trailPos);
                            
                            if (distToTrail < 0.004) { // ÁREA MAIOR
                                float trailIntensity = 1.0 - (distToTrail / 0.004);
                                // INTENSIDADE AUMENTADA
                                float fadeTrail = (1.0 - trailFactor) * (1.0 - stabProgress * 0.3);
                                pattern += trailIntensity * fadeTrail * 2.5; // MUITO MAIS BRILHANTE
                            }
                        }
                        
                        // BRILHO METÁLICO DA LÂMINA MAIS INTENSO
                        float bladeDist = distance(uv, currentStabPos);
                        if (bladeDist < 0.015) { // ÁREA MAIOR
                            float bladeIntensity = 1.0 - (bladeDist / 0.015);
                            float metalGlint = sin(stabProgress * 25.0 + t * 20.0) * 0.7 + 0.8;
                            pattern += bladeIntensity * (1.5 + metalGlint * 3.0) * 1.5; // MUITO MAIS BRILHANTE
                        }
                        
                        // EXPLOSÃO DE LUZ no momento do impacto
                        if (stabProgress > 0.7) {
                            float impactFlash = sin((stabProgress - 0.7) * 10.0) * 2.0;
                            vec2 impactPoint = vec2(0.8, 0.8);
                            float impactDist = distance(uv, impactPoint);
                            
                            if (impactDist < 0.08) { // GRANDE ÁREA DE IMPACTO
                                float impactIntensity = 1.0 - (impactDist / 0.08);
                                pattern += impactIntensity * impactFlash * 1.8;
                            }
                        }
                    }
                    
                    // ESTILHAÇOS MAIS DRAMÁTICOS do impacto
                    if (stabTime > 1.0 && stabTime < 3.0) { // DURAÇÃO MAIOR
                        float shardTime = (stabTime - 1.0) / 2.0;
                        vec2 impactPoint = vec2(0.8, 0.8); // CENTRALIZADO no final do corte
                        
                        for (int shard = 0; shard < 18; shard++) { // MAIS ESTILHAÇOS
                            float shardAngle = float(shard) * 0.349 + sin(float(shard) * 2.5) * 0.8;
                            float shardSpeed = 0.18 + mod(float(shard), 4.0) * 0.06;
                            float shardDistance = shardTime * shardSpeed;
                            
                            vec2 shardPos = impactPoint + vec2(cos(shardAngle), sin(shardAngle)) * shardDistance;
                            
                            // Rotação e turbulência dos estilhaços
                            float rotation = shardTime * (6.0 + float(shard));
                            shardPos += vec2(sin(rotation), cos(rotation)) * 0.012;
                            
                            float shardDist = distance(uv, shardPos);
                            if (shardDist < 0.008) { // ÁREA MAIOR
                                float shardIntensity = 1.0 - (shardDist / 0.008);
                                float shardLife = 1.0 - shardTime * 0.7;
                                pattern += shardIntensity * shardLife * 1.2; // MAIS BRILHANTE
                            }
                        }
                    }
                    
                    // SANGUE ESCORRENDO mais visível (marrom escuro)
                    for (int drop = 0; drop < 12; drop++) { // MAIS GOTAS
                        float dropTime = t * 2.2 + float(drop) * 0.4; // MAIS RÁPIDO
                        float dropX = 0.1 + float(drop) * 0.07 + sin(dropTime * 0.9) * 0.03;
                        float dropY = 0.05 + mod(dropTime * 0.5, 1.1);
                        
                        if (dropY > 0.05 && dropY < 0.95) {
                            vec2 dropPos = vec2(dropX, dropY);
                            float dropDist = distance(uv, dropPos);
                            
                            if (dropDist < 0.006) { // ÁREA MAIOR
                                float dropIntensity = 1.0 - (dropDist / 0.006);
                                
                                // Formato de gota mais definido
                                float dropShape = 1.0;
                                if (dropY > 0.5) {
                                    dropShape = 1.0 + (dropY - 0.5) * 0.8; // Alongar mais embaixo
                                }
                                
                                pattern += dropIntensity * dropShape * 0.8; // MAIS VISÍVEL
                            }
                        }
                    }
                    
                    // PULSOS DE ENERGIA do impacto - NOVO
                    if (stabTime > 1.2 && stabTime < 4.0) {
                        float pulseTime = (stabTime - 1.2) / 2.8;
                        vec2 pulseCenter = vec2(0.8, 0.8);
                        
                        for (int pulse = 0; pulse < 6; pulse++) {
                            float pulseRadius = pulseTime * 0.4 + float(pulse) * 0.04;
                            float pulseDist = abs(distance(uv, pulseCenter) - pulseRadius);
                            
                            if (pulseDist < 0.008) {
                                float pulseIntensity = 1.0 - (pulseDist / 0.008);
                                float pulseLife = 1.0 - pulseTime;
                                pattern += pulseIntensity * pulseLife * 0.9;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Pulso após o impacto MAIS INTENSO
                    float impactPulse = sin(t * 3.5) * 0.6 + 0.8; // AUMENTADO
                    float glow = 1.0 - smoothstep(0.0, 0.45, dist); // ÁREA MAIOR
                    return glow * impactPulse * 0.35; // MAIS BRILHANTE
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.25, 0.18, 0.12); // Marrom mais claro
                    vec3 bladeColor = vec3(0.4, 0.32, 0.22); // Marrom metálico mais visível
                    vec3 glowColor = vec3(0.3, 0.22, 0.15); // Marrom médio mais brilhante
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += bladeColor * lines;
                        alpha += lines * 0.85; // MAIS OPACO
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.25; // MAIS BRILHANTE
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
    // 🧛 VAMPIRO - Combate sombrio e sanguinário
    // ========================================

    "dark_energy_vignette": {
        name: "Energia Escura",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(120),
            emitterType: "burst",
            startColor: "#8b0000",
            endColor: "#2f0000",
            startScale: { min: 0.8, max: 1.4 },
            endScale: { min: 0.3, max: 0.6 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 2400, max: 3200 },
            speed: { min: 90, max: 160 },
            radius: 200,
            gravity: { x: 0, y: 80 },
            liquid: true
        },
        filters: {
            brightness: 0.4,
            contrast: 1.6,
            colorMatrix: {
                brightness: 0.5,
                saturation: 1.2
            }
        },
        customShader: {
            enabled: true,
            type: "mordida_vampirica",
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
                    
                    // Vinheta muito escura
                    if (uv.y < 0.50) {
                        float progress = (0.50 - uv.y) / 0.50;
                        float smoothFade = pow(progress, 1.2);
                        float vignetteIntensity = 0.45;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.2);
                        float vignetteIntensity = 0.45;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // MORCEGOS VOANDO EM ESPIRAL
                    for (int bat = 0; bat < 8; bat++) {
                        float batTime = t * 2.0 + float(bat) * 0.8;
                        float spiralRadius = 0.15 + sin(batTime * 0.6) * 0.1;
                        float spiralAngle = float(bat) * 0.785 + batTime * 1.2;
                        
                        vec2 batCenter = center + vec2(cos(spiralAngle), sin(spiralAngle)) * spiralRadius;
                        
                        // Corpo do morcego
                        float bodyDist = distance(uv, batCenter);
                        if (bodyDist < 0.006) {
                            float bodyIntensity = 1.0 - (bodyDist / 0.006);
                            pattern += bodyIntensity * 0.8;
                        }
                        
                        // Asas batendo
                        float wingBeat = sin(batTime * 8.0) * 0.5 + 0.5;
                        float wingSpan = 0.012 + wingBeat * 0.008;
                        
                        // Asa esquerda
                        vec2 leftWing = batCenter + vec2(-wingSpan, sin(batTime * 8.0) * 0.003);
                        float leftWingDist = distance(uv, leftWing);
                        if (leftWingDist < 0.004) {
                            float wingIntensity = 1.0 - (leftWingDist / 0.004);
                            pattern += wingIntensity * wingBeat * 0.6;
                        }
                        
                        // Asa direita
                        vec2 rightWing = batCenter + vec2(wingSpan, sin(batTime * 8.0 + 3.14159) * 0.003);
                        float rightWingDist = distance(uv, rightWing);
                        if (rightWingDist < 0.004) {
                            float wingIntensity = 1.0 - (rightWingDist / 0.004);
                            pattern += wingIntensity * wingBeat * 0.6;
                        }
                        
                        // Rastro do voo
                        for (int trail = 1; trail <= 4; trail++) {
                            float trailAngle = spiralAngle - float(trail) * 0.2;
                            float trailRadius = spiralRadius - float(trail) * 0.02;
                            vec2 trailPos = center + vec2(cos(trailAngle), sin(trailAngle)) * trailRadius;
                            
                            float trailDist = distance(uv, trailPos);
                            if (trailDist < 0.003) {
                                float trailIntensity = 1.0 - (trailDist / 0.003);
                                pattern += trailIntensity * (1.0 - float(trail) / 5.0) * 0.3;
                            }
                        }
                    }
                    
                    // SANGUE GOTEJANDO das presas
                    for (int fang = 0; fang < 2; fang++) {
                        float fangX = 0.45 + float(fang) * 0.1;
                        
                        for (int drop = 0; drop < 6; drop++) {
                            float dropTime = t * 1.5 + float(fang) * 0.3 + float(drop) * 0.4;
                            float dropY = 0.3 + mod(dropTime * 0.5, 0.6);
                            
                            if (dropY > 0.3 && dropY < 0.9) {
                                vec2 dropPos = vec2(fangX, dropY);
                                float dropDist = distance(uv, dropPos);
                                
                                if (dropDist < 0.003) {
                                    float dropIntensity = 1.0 - (dropDist / 0.003);
                                    
                                    // Formato alongado da gota
                                    float dropStretch = 1.0 + (dropY - 0.3) * 2.0;
                                    pattern += dropIntensity * dropStretch * 0.7;
                                }
                                
                                // Respingo quando atinge o "chão"
                                if (dropY > 0.85) {
                                    for (int splash = 0; splash < 4; splash++) {
                                        float splashAngle = float(splash) * 1.57;
                                        vec2 splashPos = dropPos + vec2(cos(splashAngle), sin(splashAngle)) * 0.01;
                                        float splashDist = distance(uv, splashPos);
                                        
                                        if (splashDist < 0.002) {
                                            pattern += 0.4;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // NÉVOA VERMELHA SOMBRIA
                    float mistIntensity = sin(t * 1.5) * 0.3 + 0.7;
                    for (int mist = 0; mist < 20; mist++) {
                        float mistTime = t * 0.8 + float(mist) * 0.2;
                        float mistAngle = float(mist) * 0.314 + mistTime * 0.5;
                        float mistRadius = 0.2 + sin(mistTime) * 0.15;
                        
                        vec2 mistPos = center + vec2(cos(mistAngle), sin(mistAngle)) * mistRadius;
                        
                        // Adicionar turbulência
                        mistPos.x += sin(mistTime * 3.0) * 0.02;
                        mistPos.y += cos(mistTime * 2.5) * 0.03;
                        
                        float mistDist = distance(uv, mistPos);
                        if (mistDist < 0.02) {
                            float mistParticleIntensity = 1.0 - (mistDist / 0.02);
                            pattern += mistParticleIntensity * mistIntensity * 0.3;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho vermelho sanguinário
                    float bloodPulse = sin(t * 3.5) * 0.4 + 0.6;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * bloodPulse * 0.35;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.08, 0.0, 0.0); // Vermelho bem escuro
                    vec3 bloodColor = vec3(0.3, 0.0, 0.0); // Vermelho sangue
                    vec3 glowColor = vec3(0.2, 0.05, 0.05); // Vermelho sombrio
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += bloodColor * lines;
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

    "bloody_claws_vignette": {
        name: "Garras Sangrentas",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(140),
            emitterType: "burst",
            startColor: "#660000",
            endColor: "#1a0000",
            startScale: { min: 1.0, max: 1.6 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 120, max: 200 },
            radius: 220,
            gravity: { x: 0, y: 60 },
            liquid: true,
            explosive: true
        },
        filters: {
            brightness: 0.3,
            contrast: 1.8,
            colorMatrix: {
                brightness: 0.4,
                saturation: 1.3
            }
        },
        customShader: {
            enabled: true,
            type: "garras_sangrentas",
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
                    
                    // Escuridão intensa
                    if (uv.y < 0.50) {
                        float progress = (0.50 - uv.y) / 0.50;
                        float smoothFade = pow(progress, 1.1);
                        float vignetteIntensity = 0.55;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.1);
                        float vignetteIntensity = 0.55;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // GARRAS RASGANDO - múltiplos cortes irregulares
                    for (int claw = 0; claw < 5; claw++) {
                        float clawTime = t * 2.8 + float(claw) * 0.4;
                        float clawPhase = mod(clawTime, 3.0);
                        
                        if (clawPhase < 0.8) {
                            float clawProgress = clawPhase / 0.8;
                            
                            // Posição e ângulo da garra
                            float clawAngle = float(claw) * 0.628 + sin(clawTime * 0.5) * 0.3;
                            vec2 clawStart = center + vec2(cos(clawAngle), sin(clawAngle)) * 0.15;
                            vec2 clawEnd = center + vec2(cos(clawAngle), sin(clawAngle)) * 0.45;
                            
                            vec2 currentClawEnd = mix(clawStart, clawEnd, clawProgress);
                            
                            // Criar rasgo serrilhado
                            for (int segment = 0; segment < 15; segment++) {
                                float segProgress = float(segment) / 14.0;
                                vec2 basePoint = mix(clawStart, currentClawEnd, segProgress);
                                
                                // Irregularidade serrilhada
                                float jaggedness = sin(segProgress * 12.0 + clawTime * 8.0) * 0.012;
                                jaggedness += sin(segProgress * 25.0 + clawTime * 15.0) * 0.006;
                                
                                // Direção perpendicular
                                vec2 perpDir = vec2(-sin(clawAngle), cos(clawAngle));
                                vec2 jaggedPoint = basePoint + perpDir * jaggedness;
                                
                                float distToJagged = distance(uv, jaggedPoint);
                                
                                // Linha principal do rasgo
                                if (distToJagged < 0.004) {
                                    float clawIntensity = 1.0 - (distToJagged / 0.004);
                                    pattern += clawIntensity * (1.0 - segProgress * 0.2) * 1.0;
                                }
                                
                                // Bordas irregulares do rasgo
                                for (int edge = 0; edge < 2; edge++) {
                                    float edgeOffset = (float(edge) - 0.5) * 0.008;
                                    vec2 edgePoint = jaggedPoint + perpDir * edgeOffset;
                                    float edgeDist = distance(uv, edgePoint);
                                    
                                    if (edgeDist < 0.003) {
                                        float edgeIntensity = 1.0 - (edgeDist / 0.003);
                                        pattern += edgeIntensity * 0.6;
                                    }
                                }
                            }
                        }
                    }
                    
                    // EXPLOSÃO DE SANGUE no centro
                    float bloodExplosionTime = mod(t * 1.5, 4.0);
                    if (bloodExplosionTime < 1.2) {
                        float explosionProgress = bloodExplosionTime / 1.2;
                        
                        for (int splatter = 0; splatter < 20; splatter++) {
                            float splatterAngle = float(splatter) * 0.314 + sin(float(splatter) * 2.0) * 0.5;
                            float splatterSpeed = 0.3 + mod(float(splatter), 3.0) * 0.1;
                            float splatterDistance = explosionProgress * splatterSpeed;
                            
                            vec2 splatterPos = center + vec2(cos(splatterAngle), sin(splatterAngle)) * splatterDistance;
                            
                            // Rotação e turbulência do respingo
                            float turbulence = sin(explosionProgress * 10.0 + float(splatter)) * 0.02;
                            splatterPos += vec2(turbulence, sin(turbulence * 5.0) * 0.015);
                            
                            float splatterDist = distance(uv, splatterPos);
                            
                            // Respingo principal
                            if (splatterDist < 0.008) {
                                float splatterIntensity = 1.0 - (splatterDist / 0.008);
                                float splatterLife = 1.0 - explosionProgress * 0.6;
                                pattern += splatterIntensity * splatterLife * 0.8;
                            }
                            
                            // Gotículas menores
                            for (int droplet = 0; droplet < 3; droplet++) {
                                float dropletAngle = splatterAngle + float(droplet) * 0.2;
                                vec2 dropletPos = splatterPos + vec2(cos(dropletAngle), sin(dropletAngle)) * 0.01;
                                float dropletDist = distance(uv, dropletPos);
                                
                                if (dropletDist < 0.003) {
                                    float dropletIntensity = 1.0 - (dropletDist / 0.003);
                                    pattern += dropletIntensity * 0.4;
                                }
                            }
                        }
                    }
                    
                    // SANGUE ESCORRENDO das bordas superiores
                    for (int stream = 0; stream < 6; stream++) {
                        float streamX = 0.1 + float(stream) * 0.16;
                        float streamTime = t * 1.2 + float(stream) * 0.3;
                        
                        for (int segment = 0; segment < 12; segment++) {
                            float segmentY = 0.1 + float(segment) * 0.06 + sin(streamTime + float(segment)) * 0.01;
                            
                            // Fluxo descendente
                            segmentY += mod(streamTime * 0.4, 0.8);
                            
                            if (segmentY > 0.1 && segmentY < 0.9) {
                                vec2 streamPos = vec2(streamX, segmentY);
                                float streamDist = distance(uv, streamPos);
                                
                                if (streamDist < 0.005) {
                                    float streamIntensity = 1.0 - (streamDist / 0.005);
                                    pattern += streamIntensity * 0.6;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Pulsação sanguinária intensa
                    float bloodPulse = sin(t * 4.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * bloodPulse * 0.4;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.05, 0.0, 0.0); // Vermelho escuríssimo
                    vec3 bloodColor = vec3(0.4, 0.0, 0.0); // Vermelho sangue intenso
                    vec3 glowColor = vec3(0.25, 0.02, 0.02); // Vermelho brilhante
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += bloodColor * lines;
                        alpha += lines * 0.85;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.3;
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

    "embrace_of_darkness_vignette": {
        name: "Abraço da Escuridão",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(160),
            emitterType: "circle",
            startColor: "#1a0000",
            endColor: "#000000",
            startScale: { min: 1.5, max: 2.2 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3000, max: 4000 },
            speed: { min: 80, max: 140 },
            radius: 250,
            gravity: { x: 0, y: -40 },
            smoky: true,
            cloud: true
        },
        filters: {
            brightness: 0.2,
            contrast: 2.0,
            colorMatrix: {
                brightness: 0.3,
                saturation: 0.8
            }
        },
        customShader: {
            enabled: true,
            type: "abraco_da_escuridao",
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
                    
                    // Escuridão total nas bordas
                    if (uv.y < 0.55) {
                        float progress = (0.55 - uv.y) / 0.55;
                        float smoothFade = pow(progress, 1.0);
                        float vignetteIntensity = 0.8;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.65) {
                        float progress = (uv.y - 0.65) / 0.35;
                        float smoothFade = pow(progress, 1.0);
                        float vignetteIntensity = 0.8;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // TENTÁCULOS DE ESCURIDÃO envolvendo
                    for (int tentacle = 0; tentacle < 12; tentacle++) {
                        float tentacleTime = t * 1.0 + float(tentacle) * 0.5;
                        float baseAngle = float(tentacle) * 0.524; // 30 graus
                        
                        // Movimento serpenteante complexo
                        for (int segment = 0; segment < 20; segment++) {
                            float segProgress = float(segment) / 19.0;
                            float segmentAngle = baseAngle + sin(tentacleTime + segProgress * 5.0) * 0.8;
                            float segmentRadius = 0.1 + segProgress * 0.4;
                            
                            // Ondulação adicional
                            segmentRadius += sin(tentacleTime * 2.0 + segProgress * 8.0) * 0.05;
                            
                            vec2 segmentPos = center + vec2(cos(segmentAngle), sin(segmentAngle)) * segmentRadius;
                            
                            // Espessura variável do tentáculo
                            float tentacleThickness = 0.015 * (1.0 - segProgress * 0.3);
                            float distToSegment = distance(uv, segmentPos);
                            
                            if (distToSegment < tentacleThickness) {
                                float tentacleIntensity = 1.0 - (distToSegment / tentacleThickness);
                                
                                // Densidade variável ao longo do tentáculo
                                float densityWave = sin(segProgress * 6.0 + tentacleTime * 3.0) * 0.4 + 0.6;
                                pattern += tentacleIntensity * densityWave * 0.7;
                            }
                            
                            // Filamentos menores saindo dos tentáculos
                            if (mod(float(segment), 3.0) < 1.0) {
                                for (int filament = 0; filament < 2; filament++) {
                                    float filamentAngle = segmentAngle + (float(filament) - 0.5) * 1.2;
                                    float filamentLength = 0.03 + sin(tentacleTime * 4.0 + float(segment)) * 0.01;
                                    
                                    vec2 filamentPos = segmentPos + vec2(cos(filamentAngle), sin(filamentAngle)) * filamentLength;
                                    float filamentDist = distance(uv, filamentPos);
                                    
                                    if (filamentDist < 0.005) {
                                        float filamentIntensity = 1.0 - (filamentDist / 0.005);
                                        pattern += filamentIntensity * 0.4;
                                    }
                                }
                            }
                        }
                    }
                    
                    // VÉUS DE ESCURIDÃO flutuando
                    for (int veil = 0; veil < 8; veil++) {
                        float veilTime = t * 0.8 + float(veil) * 0.8;
                        float veilAngle = float(veil) * 0.785 + veilTime * 0.3;
                        float veilRadius = 0.2 + sin(veilTime * 1.5) * 0.15;
                        
                        vec2 veilCenter = center + vec2(cos(veilAngle), sin(veilAngle)) * veilRadius;
                        
                        // Criar forma orgânica do véu
                        for (int veilPoint = 0; veilPoint < 12; veilPoint++) {
                            float pointAngle = float(veilPoint) * 0.524 + veilTime * 2.0;
                            float pointRadius = 0.03 + sin(veilTime * 3.0 + float(veilPoint)) * 0.02;
                            
                            vec2 pointPos = veilCenter + vec2(cos(pointAngle), sin(pointAngle)) * pointRadius;
                            float pointDist = distance(uv, pointPos);
                            
                            if (pointDist < 0.012) {
                                float pointIntensity = 1.0 - (pointDist / 0.012);
                                
                                // Transparência flutuante
                                float veilAlpha = sin(veilTime * 2.5 + float(veilPoint)) * 0.3 + 0.7;
                                pattern += pointIntensity * veilAlpha * 0.5;
                            }
                        }
                    }
                    
                    // MORCEGOS em movimento caótico
                    for (int bat = 0; bat < 10; bat++) {
                        float batTime = t * 2.5 + float(bat) * 0.6;
                        
                        // Trajetória caótica
                        float chaosX = sin(batTime * 1.3) * 0.3 + cos(batTime * 0.7) * 0.2;
                        float chaosY = cos(batTime * 1.1) * 0.25 + sin(batTime * 0.9) * 0.15;
                        
                        vec2 batPos = center + vec2(chaosX, chaosY);
                        
                        // Corpo do morcego
                        float bodyDist = distance(uv, batPos);
                        if (bodyDist < 0.005) {
                            float bodyIntensity = 1.0 - (bodyDist / 0.005);
                            pattern += bodyIntensity * 0.8;
                        }
                        
                        // Asas em movimento frenético
                        float wingBeat = sin(batTime * 12.0) * 0.6 + 0.4;
                        float wingSpan = 0.01 + wingBeat * 0.006;
                        
                        // Asas com movimento irregular
                        vec2 leftWing = batPos + vec2(-wingSpan, sin(batTime * 12.0) * 0.004);
                        vec2 rightWing = batPos + vec2(wingSpan, sin(batTime * 12.0 + 3.14159) * 0.004);
                        
                        float leftWingDist = distance(uv, leftWing);
                        float rightWingDist = distance(uv, rightWing);
                        
                        if (leftWingDist < 0.003) {
                            pattern += (1.0 - leftWingDist / 0.003) * wingBeat * 0.6;
                        }
                        if (rightWingDist < 0.003) {
                            pattern += (1.0 - rightWingDist / 0.003) * wingBeat * 0.6;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho sombrio hipnótico
                    float hypnoticPulse = sin(t * 2.0) * 0.3 + 0.7;
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    return glow * hypnoticPulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto absoluto
                    vec3 darknessColor = vec3(0.05, 0.0, 0.02); // Roxo escuríssimo
                    vec3 glowColor = vec3(0.08, 0.0, 0.04); // Roxo sombrio
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += darknessColor * lines;
                        alpha += lines * 0.9;
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

    "kiss_of_death_vignette": {
        name: "Beijo da Morte",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(180),
            emitterType: "circle",
            startColor: "#8b0000",
            endColor: "#000000",
            startScale: { min: 2.0, max: 2.8 },
            endScale: { min: 0.5, max: 1.0 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3500, max: 4500 },
            speed: { min: 60, max: 120 },
            radius: 280,
            gravity: { x: 0, y: -100 },
            magical: true,
            arcane: true
        },
        filters: {
            brightness: 0.15,
            contrast: 2.2,
            colorMatrix: {
                brightness: 0.2,
                saturation: 1.5
            }
        },
        customShader: {
            enabled: true,
            type: "beijo_da_morte",
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
                    
                    // Escuridão absoluta - Ultimate
                    if (uv.y < 0.60) {
                        float progress = (0.60 - uv.y) / 0.60;
                        float smoothFade = pow(progress, 0.8);
                        float vignetteIntensity = 1.0;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.60) {
                        float progress = (uv.y - 0.60) / 0.40;
                        float smoothFade = pow(progress, 0.8);
                        float vignetteIntensity = 1.0;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // VÓRTEX DA MORTE - energia sugando tudo
                    float vortexPhase = mod(t * 0.8, 6.0);
                    
                    if (vortexPhase < 4.0) {
                        float vortexProgress = vortexPhase / 4.0;
                        
                        // Espiral mortal centrípeta
                        for (int spiral = 0; spiral < 8; spiral++) {
                            float spiralTime = t * 2.0 + float(spiral) * 0.785;
                            float spiralRadius = 0.4 - vortexProgress * 0.3;
                            float spiralAngle = float(spiral) * 0.785 + spiralTime * 3.0;
                            
                            // Trajetória espiral complexa
                            for (int segment = 0; segment < 25; segment++) {
                                float segProgress = float(segment) / 24.0;
                                float currentRadius = spiralRadius * (1.0 - segProgress * 0.8);
                                float currentAngle = spiralAngle + segProgress * 12.0;
                                
                                vec2 spiralPos = center + vec2(cos(currentAngle), sin(currentAngle)) * currentRadius;
                                
                                // Distorção do vórtex
                                float distortion = sin(currentRadius * 15.0 + t * 8.0) * 0.01;
                                spiralPos += vec2(distortion, cos(distortion * 10.0) * 0.008);
                                
                                float spiralDist = distance(uv, spiralPos);
                                
                                if (spiralDist < 0.006) {
                                    float spiralIntensity = 1.0 - (spiralDist / 0.006);
                                    
                                    // Intensidade cresce conforme se aproxima do centro
                                    float centerPull = 1.0 - currentRadius / spiralRadius;
                                    pattern += spiralIntensity * (1.0 + centerPull * 2.0) * 0.4;
                                }
                            }
                        }
                        
                        // CENTRO DO VÓRTEX - buraco negro vampírico
                        float vortexRadius = 0.08 - vortexProgress * 0.05;
                        float distToVortex = distance(uv, center);
                        
                        if (distToVortex < vortexRadius) {
                            float vortexDepth = 1.0 - (distToVortex / vortexRadius);
                            
                            // Padrão hipnótico no centro
                            float hypnoticPattern = sin(distToVortex * 30.0 + t * 12.0) * sin(atan(uv.y - center.y, uv.x - center.x) * 6.0 + t * 8.0);
                            pattern += abs(hypnoticPattern) * vortexDepth * 1.5;
                        }
                    }
                    
                    // ALMAS sendo sugadas para o vórtex
                    for (int soul = 0; soul < 15; soul++) {
                        float soulTime = t * 1.5 + float(soul) * 0.4;
                        float soulAngle = float(soul) * 0.419 + soulTime * 0.8;
                        float soulRadius = 0.4 - mod(soulTime * 0.3, 0.4);
                        
                        if (soulRadius > 0.05) {
                            vec2 soulPos = center + vec2(cos(soulAngle), sin(soulAngle)) * soulRadius;
                            
                            // Movimento errático das almas
                            soulPos.x += sin(soulTime * 4.0) * 0.02;
                            soulPos.y += cos(soulTime * 3.5) * 0.015;
                            
                            float soulDist = distance(uv, soulPos);
                            
                            // Alma principal
                            if (soulDist < 0.008) {
                                float soulIntensity = 1.0 - (soulDist / 0.008);
                                
                                // Pulsação espectral
                                float spectralPulse = sin(soulTime * 6.0) * 0.5 + 0.5;
                                pattern += soulIntensity * spectralPulse * 0.6;
                            }
                            
                            // Rastro espectral da alma
                            for (int trail = 1; trail <= 4; trail++) {
                                float trailAngle = soulAngle - float(trail) * 0.1;
                                float trailRadius = soulRadius + float(trail) * 0.02;
                                vec2 trailPos = center + vec2(cos(trailAngle), sin(trailAngle)) * trailRadius;
                                
                                float trailDist = distance(uv, trailPos);
                                if (trailDist < 0.004) {
                                    float trailIntensity = 1.0 - (trailDist / 0.004);
                                    pattern += trailIntensity * (1.0 - float(trail) / 5.0) * 0.3;
                                }
                            }
                        }
                    }
                    
                    // ENXAME DE MORCEGOS em formação
                    for (int formation = 0; formation < 3; formation++) {
                        float formationTime = t * 1.8 + float(formation) * 2.0;
                        float formationAngle = float(formation) * 2.094 + formationTime * 0.5;
                        float formationRadius = 0.25 + sin(formationTime * 0.7) * 0.1;
                        
                        vec2 formationCenter = center + vec2(cos(formationAngle), sin(formationAngle)) * formationRadius;
                        
                        // Múltiplos morcegos na formação
                        for (int bat = 0; bat < 8; bat++) {
                            float batAngle = float(bat) * 0.785 + formationTime * 4.0;
                            float batDistance = 0.02 + mod(float(bat), 3.0) * 0.008;
                            
                            vec2 batPos = formationCenter + vec2(cos(batAngle), sin(batAngle)) * batDistance;
                            
                            // Corpo
                            float bodyDist = distance(uv, batPos);
                            if (bodyDist < 0.003) {
                                pattern += (1.0 - bodyDist / 0.003) * 0.7;
                            }
                            
                            // Asas sincronizadas
                            float wingBeat = sin(formationTime * 10.0) * 0.4 + 0.6;
                            float wingSpan = 0.006 + wingBeat * 0.004;
                            
                            vec2 leftWing = batPos + vec2(-wingSpan, sin(formationTime * 10.0) * 0.002);
                            vec2 rightWing = batPos + vec2(wingSpan, sin(formationTime * 10.0 + 3.14159) * 0.002);
                            
                            float leftWingDist = distance(uv, leftWing);
                            float rightWingDist = distance(uv, rightWing);
                            
                            if (leftWingDist < 0.002) {
                                pattern += (1.0 - leftWingDist / 0.002) * wingBeat * 0.5;
                            }
                            if (rightWingDist < 0.002) {
                                pattern += (1.0 - rightWingDist / 0.002) * wingBeat * 0.5;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho mortal supremo
                    float deathGlow = sin(t * 1.5) * 0.3 + 0.7;
                    float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                    return glow * deathGlow * 0.5;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto total
                    vec3 deathColor = vec3(0.2, 0.0, 0.05); // Vermelho morte
                    vec3 glowColor = vec3(0.15, 0.0, 0.08); // Brilho mortal
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += deathColor * lines;
                        alpha += lines * 0.95;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.35;
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
    // 💰 LADRÃO MESTRE - Combate dourado e místico
    // ========================================

    "precise_strike_vignette": {
        name: "Golpe Preciso",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(100),
            emitterType: "burst",
            startColor: "#daa520",
            endColor: "#b8860b",
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 70, max: 120 },
            radius: 150,
            gravity: { x: 0, y: 20 },
            metallic: true,
            spark: true
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
            type: "golpe_preciso",
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
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.18;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.18;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // LÂMINA DOURADA cortando com precisão
                    float bladeTime = mod(t * 2.5, 4.0);
                    if (bladeTime < 1.0) {
                        float bladeProgress = bladeTime;
                        
                        // Movimento preciso diagonal
                        vec2 bladeStart = vec2(0.2, 0.3);
                        vec2 bladeEnd = vec2(0.8, 0.7);
                        vec2 currentBladeEnd = mix(bladeStart, bladeEnd, bladeProgress);
                        
                        // Trilha dourada da lâmina
                        for (int segment = 0; segment < 20; segment++) {
                            float segProgress = float(segment) / 19.0;
                            vec2 bladePoint = mix(bladeStart, currentBladeEnd, segProgress);
                            
                            float bladeDist = distance(uv, bladePoint);
                            
                            if (bladeDist < 0.003) {
                                float bladeIntensity = 1.0 - (bladeDist / 0.003);
                                
                                // Brilho metálico dourado
                                float goldGlint = sin(segProgress * 15.0 + t * 10.0) * 0.5 + 0.5;
                                pattern += bladeIntensity * (1.0 + goldGlint * 2.0) * 0.8;
                            }
                        }
                    }
                    
                    // MOEDAS DOURADAS girando e brilhando
                    for (int coin = 0; coin < 12; coin++) {
                        float coinTime = t * 1.8 + float(coin) * 0.5;
                        
                        // Trajetória orbital complexa
                        float orbitAngle = float(coin) * 0.524 + coinTime * 0.8;
                        float orbitRadius = 0.15 + sin(coinTime * 1.2) * 0.08;
                        float heightOscillation = sin(coinTime * 2.5 + float(coin)) * 0.05;
                        
                        vec2 coinPos = center + vec2(
                            cos(orbitAngle) * orbitRadius,
                            sin(orbitAngle) * orbitRadius + heightOscillation
                        );
                        
                        // Rotação da moeda (efeito 3D simulado)
                        float coinRotation = coinTime * 4.0;
                        float coinScale = abs(sin(coinRotation)) * 0.8 + 0.2; // Simula perspectiva
                        
                        float coinDist = distance(uv, coinPos);
                        
                        // Corpo da moeda
                        if (coinDist < 0.008 * coinScale) {
                            float coinIntensity = 1.0 - (coinDist / (0.008 * coinScale));
                            
                            // Brilho baseado na rotação
                            float coinBrightness = coinScale * 1.5;
                            pattern += coinIntensity * coinBrightness * 0.6;
                        }
                        
                        // Reflexo dourado
                        if (coinScale > 0.7) { // Apenas quando a moeda está "de frente"
                            float reflectionDist = distance(uv, coinPos);
                            if (reflectionDist < 0.015) {
                                float reflectionIntensity = 1.0 - (reflectionDist / 0.015);
                                pattern += reflectionIntensity * coinScale * 0.3;
                            }
                        }
                    }
                    
                    // SÍMBOLOS ÁRABES flutuando - CORRIGIDO
                    for (int symbol = 0; symbol < 6; symbol++) {
                        float symbolTime = t * 1.2 + float(symbol) * 1.0;
                        float symbolAngle = float(symbol) * 1.047 + symbolTime * 0.3;
                        float symbolRadius = 0.25 + sin(symbolTime * 0.8) * 0.1;
                        
                        vec2 symbolCenter = center + vec2(cos(symbolAngle), sin(symbolAngle)) * symbolRadius;
                        
                        // Movimento flutuante - CORRIGIDO: sem reatribuição
                        float symbolOffsetX = sin(symbolTime * 2.0) * 0.02;
                        float symbolOffsetY = cos(symbolTime * 1.8) * 0.025;
                        vec2 symbolFinalPos = symbolCenter + vec2(symbolOffsetX, symbolOffsetY);
                        
                        // Criar padrão de símbolo (estrela árabe simplificada)
                        for (int star = 0; star < 8; star++) {
                            float starAngle = float(star) * 0.785 + symbolTime * 1.5;
                            float starRadius = 0.01 + mod(float(star), 2.0) * 0.008;
                            
                            vec2 starPoint = symbolFinalPos + vec2(cos(starAngle), sin(starAngle)) * starRadius;
                            float starDist = distance(uv, starPoint);
                            
                            if (starDist < 0.003) {
                                float starIntensity = 1.0 - (starDist / 0.003);
                                
                                // Brilho místico
                                float mysticGlow = sin(symbolTime * 3.0 + float(star)) * 0.3 + 0.7;
                                pattern += starIntensity * mysticGlow * 0.4;
                            }
                        }
                    }
                    
                    // POEIRA DOURADA flutuando
                    for (int dust = 0; dust < 15; dust++) {
                        float dustTime = t * 1.5 + float(dust) * 0.4;
                        
                        // Movimento browniano simulado
                        float dustX = 0.3 + sin(dustTime * 1.1) * 0.2 + cos(dustTime * 0.7) * 0.15;
                        float dustY = 0.3 + cos(dustTime * 1.3) * 0.25 + sin(dustTime * 0.9) * 0.1;
                        
                        vec2 dustPos = vec2(dustX, dustY);
                        float dustDist = distance(uv, dustPos);
                        
                        if (dustDist < 0.004) {
                            float dustIntensity = 1.0 - (dustDist / 0.004);
                            
                            // Cintilação
                            float twinkle = sin(dustTime * 5.0 + float(dust)) * 0.5 + 0.5;
                            pattern += dustIntensity * twinkle * 0.5;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho dourado suave
                    float goldPulse = sin(t * 3.0) * 0.3 + 0.7;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * goldPulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.4, 0.3, 0.1); // Dourado escuro
                    vec3 goldColor = vec3(0.8, 0.6, 0.2); // Dourado vibrante
                    vec3 glowColor = vec3(0.6, 0.5, 0.2); // Dourado suave
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += goldColor * lines;
                        alpha += lines * 0.7;
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

    "vital_strike_vignette": {
        name: "Ataque Vital",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(110),
            emitterType: "burst",
            startColor: "#ffd700",
            endColor: "#daa520",
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 2200, max: 3000 },
            speed: { min: 80, max: 140 },
            radius: 170,
            gravity: { x: 0, y: 15 },
            spark: true,
            crystalline: true
        },
        filters: {
            brightness: 1.3,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.15,
                saturation: 1.3
            }
        },
        customShader: {
            enabled: true,
            type: "ataque_vital",
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
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.20;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.5);
                        float vignetteIntensity = 0.20;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // PONTOS VITAIS se iluminando com posições fixas
                    vec2 vitalPositions[8];
                    vitalPositions[0] = vec2(0.5, 0.3);   // Cabeça
                    vitalPositions[1] = vec2(0.5, 0.45);  // Pescoço
                    vitalPositions[2] = vec2(0.4, 0.5);   // Coração esq
                    vitalPositions[3] = vec2(0.6, 0.5);   // Coração dir
                    vitalPositions[4] = vec2(0.3, 0.6);   // Lateral esq
                    vitalPositions[5] = vec2(0.7, 0.6);   // Lateral dir
                    vitalPositions[6] = vec2(0.45, 0.7);  // Abdomen esq
                    vitalPositions[7] = vec2(0.55, 0.7);  // Abdomen dir
                    
                    for (int vital = 0; vital < 8; vital++) {
                        float vitalTime = t * 2.0 + float(vital) * 0.6;
                        float vitalPhase = mod(vitalTime, 3.0);
                        
                        if (vitalPhase < 1.5) {
                            float vitalProgress = vitalPhase / 1.5;
                            float vitalIntensity = sin(vitalProgress * 3.14159) * 2.0;
                            
                            vec2 vitalPos = vitalPositions[vital];
                            
                            // Ponto vital principal
                            float vitalDist = distance(uv, vitalPos);
                            if (vitalDist < 0.012) {
                                float pointIntensity = 1.0 - (vitalDist / 0.012);
                                pattern += pointIntensity * vitalIntensity * 0.8;
                            }
                            
                            // Aura ao redor do ponto vital
                            if (vitalDist < 0.025) {
                                float auraIntensity = 1.0 - (vitalDist / 0.025);
                                pattern += auraIntensity * vitalIntensity * 0.3;
                            }
                            
                            // Raios conectando pontos vitais próximos - versão simplificada
                            if (vital < 7) {
                                vec2 connectPos = vitalPositions[vital + 1];
                                float connectDist = distance(vitalPos, connectPos);
                                
                                if (connectDist < 0.3) {
                                    // Linha de conexão
                                    for (int raySegment = 0; raySegment < 10; raySegment++) {
                                        float rayProgress = float(raySegment) / 9.0;
                                        vec2 rayPoint = mix(vitalPos, connectPos, rayProgress);
                                        
                                        float rayDist = distance(uv, rayPoint);
                                        if (rayDist < 0.002) {
                                            float rayIntensity = 1.0 - (rayDist / 0.002);
                                            pattern += rayIntensity * vitalIntensity * 0.4;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // JOIAS flutuando como alvos secundários
                    for (int jewel = 0; jewel < 6; jewel++) {
                        float jewelTime = t * 1.5 + float(jewel) * 0.8;
                        
                        // Órbita complexa
                        float orbitRadius = 0.2 + sin(jewelTime * 0.9) * 0.08;
                        float orbitAngle = float(jewel) * 1.047 + jewelTime * 0.6;
                        float orbitTilt = sin(jewelTime * 1.2) * 0.1;
                        
                        vec2 jewelPos = center + vec2(
                            cos(orbitAngle) * orbitRadius,
                            sin(orbitAngle) * orbitRadius + orbitTilt
                        );
                        
                        // Rotação da joia
                        float jewelRotation = jewelTime * 3.0;
                        
                        // Múltiplas facetas da joia
                        for (int facet = 0; facet < 6; facet++) {
                            float facetAngle = float(facet) * 1.047 + jewelRotation;
                            float facetRadius = 0.008 + sin(jewelTime * 4.0 + float(facet)) * 0.003;
                            
                            vec2 facetPos = jewelPos + vec2(cos(facetAngle), sin(facetAngle)) * facetRadius;
                            float facetDist = distance(uv, facetPos);
                            
                            if (facetDist < 0.004) {
                                float facetIntensity = 1.0 - (facetDist / 0.004);
                                
                                // Brilho baseado na orientação
                                float facetBrightness = abs(sin(facetAngle + jewelTime * 2.0)) * 1.5 + 0.5;
                                pattern += facetIntensity * facetBrightness * 0.6;
                            }
                        }
                        
                        // Reflexo da joia
                        float jewelDist = distance(uv, jewelPos);
                        if (jewelDist < 0.02) {
                            float reflectionIntensity = 1.0 - (jewelDist / 0.02);
                            float sparkle = sin(jewelTime * 6.0) * 0.5 + 0.5;
                            pattern += reflectionIntensity * sparkle * 0.4;
                        }
                    }
                    
                    // ENERGIA VITAL fluindo entre os pontos
                    for (int flow = 0; flow < 4; flow++) {
                        float flowTime = t * 2.5 + float(flow) * 1.5;
                        
                        // Caminho serpentino de energia
                        for (int flowSegment = 0; flowSegment < 20; flowSegment++) {
                            float segProgress = float(flowSegment) / 19.0;
                            float flowX = 0.2 + segProgress * 0.6;
                            float flowY = 0.4 + sin(segProgress * 6.0 + flowTime) * 0.2;
                            
                            // Movimento temporal
                            float timeOffset = mod(flowTime * 0.4, 1.0);
                            if (segProgress > timeOffset - 0.2 && segProgress < timeOffset + 0.2) {
                                vec2 flowPos = vec2(flowX, flowY);
                                float flowDist = distance(uv, flowPos);
                                
                                if (flowDist < 0.006) {
                                    float flowIntensity = 1.0 - (flowDist / 0.006);
                                    
                                    // Intensidade baseada na proximidade com o tempo
                                    float timeIntensity = 1.0 - abs(segProgress - timeOffset) / 0.2;
                                    pattern += flowIntensity * timeIntensity * 0.7;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho dourado pulsante
                    float vitalPulse = sin(t * 3.5) * 0.4 + 0.6;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * vitalPulse * 0.28;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.5, 0.4, 0.15); // Dourado médio
                    vec3 vitalColor = vec3(1.0, 0.8, 0.3); // Dourado brilhante
                    vec3 glowColor = vec3(0.8, 0.6, 0.25); // Dourado suave
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += vitalColor * lines;
                        alpha += lines * 0.75;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.22;
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

    "hidden_dagger_vignette": {
        name: "Punhal Oculto",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(90),
            emitterType: "burst",
            startColor: "#cd853f",
            endColor: "#a0522d",
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2600 },
            speed: { min: 100, max: 180 },
            radius: 140,
            gravity: { x: 0, y: 25 },
            metallic: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.25,
            colorMatrix: {
                brightness: 1.05,
                saturation: 1.1
            }
        },
        customShader: {
            enabled: true,
            type: "punhal_oculto",
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
                        float smoothFade = pow(progress, 1.7);
                        float vignetteIntensity = 0.16;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.7);
                        float vignetteIntensity = 0.16;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // PUNHAIS EMERGINDO de posições ocultas com posições fixas
                    vec2 hiddenPositions[6];
                    hiddenPositions[0] = vec2(0.1, 0.5);  // Esquerda
                    hiddenPositions[1] = vec2(0.9, 0.4);  // Direita
                    hiddenPositions[2] = vec2(0.5, 0.1);  // Topo
                    hiddenPositions[3] = vec2(0.3, 0.9);  // Baixo esq
                    hiddenPositions[4] = vec2(0.7, 0.9);  // Baixo dir
                    hiddenPositions[5] = vec2(0.2, 0.2);  // Canto
                    
                    for (int dagger = 0; dagger < 6; dagger++) {
                        float daggerTime = t * 2.2 + float(dagger) * 0.8;
                        float daggerPhase = mod(daggerTime, 4.0);
                        
                        if (daggerPhase < 0.5) {
                            // Fase de emergência súbita
                            float emergeProgress = daggerPhase / 0.5;
                            float emergeIntensity = sin(emergeProgress * 3.14159) * 3.0;
                            
                            vec2 daggerStart = hiddenPositions[dagger];
                            vec2 daggerTarget = center;
                            
                            // Trajetória do punhal
                            vec2 currentDaggerPos = mix(daggerStart, daggerTarget, emergeProgress);
                            
                            // Lâmina do punhal
                            float daggerDist = distance(uv, currentDaggerPos);
                            if (daggerDist < 0.006) {
                                float bladeIntensity = 1.0 - (daggerDist / 0.006);
                                pattern += bladeIntensity * emergeIntensity * 0.8;
                            }
                            
                            // Trilha dourada do movimento
                            for (int trail = 1; trail <= 5; trail++) {
                                float trailProgress = emergeProgress - float(trail) * 0.1;
                                if (trailProgress > 0.0) {
                                    vec2 trailPos = mix(daggerStart, daggerTarget, trailProgress);
                                    float trailDist = distance(uv, trailPos);
                                    
                                    if (trailDist < 0.003) {
                                        float trailIntensity = 1.0 - (trailDist / 0.003);
                                        float trailFade = 1.0 - float(trail) / 6.0;
                                        pattern += trailIntensity * trailFade * emergeIntensity * 0.4;
                                    }
                                }
                            }
                        }
                    }
                    
                    // VÉUS DE ILUSÃO - tecidos flutuantes ocultando
                    for (int veil = 0; veil < 4; veil++) {
                        float veilTime = t * 1.0 + float(veil) * 1.5;
                        
                        // Movimento ondulante do véu
                        for (int veilSegment = 0; veilSegment < 15; veilSegment++) {
                            float segProgress = float(veilSegment) / 14.0;
                            
                            // Posição base do véu
                            float veilX = 0.1 + float(veil) * 0.25;
                            float veilY = 0.2 + segProgress * 0.6;
                            
                            // Ondulação do tecido
                            float fabricWave = sin(segProgress * 4.0 + veilTime * 2.0) * 0.08;
                            veilX += fabricWave;
                            
                            // Movimento temporal
                            veilY += sin(veilTime * 0.8) * 0.1;
                            
                            vec2 veilPos = vec2(veilX, veilY);
                            float veilDist = distance(uv, veilPos);
                            
                            if (veilDist < 0.01) {
                                float veilIntensity = 1.0 - (veilDist / 0.01);
                                
                                // Transparência flutuante
                                float veilAlpha = sin(veilTime * 1.5 + segProgress * 2.0) * 0.3 + 0.7;
                                pattern += veilIntensity * veilAlpha * 0.4;
                            }
                        }
                    }
                    
                    // PEGADAS DOURADAS aparecendo e desaparecendo
                    for (int footstep = 0; footstep < 8; footstep++) {
                        float stepTime = t * 1.8 + float(footstep) * 0.4;
                        float stepPhase = mod(stepTime, 2.0);
                        
                        if (stepPhase < 1.0) {
                            float stepVisibility = sin(stepPhase * 3.14159);
                            
                            // Caminho das pegadas
                            float pathProgress = float(footstep) / 7.0;
                            vec2 stepPos = vec2(0.2 + pathProgress * 0.6, 0.6 + sin(pathProgress * 3.0) * 0.2);
                            
                            // Pegada (formato oval)
                            for (int toe = 0; toe < 5; toe++) {
                                vec2 toeOffset = vec2(float(toe) * 0.003 - 0.006, 0.008);
                                vec2 toePos = stepPos + toeOffset;
                                
                                float toeDist = distance(uv, toePos);
                                if (toeDist < 0.004) {
                                    float toeIntensity = 1.0 - (toeDist / 0.004);
                                    pattern += toeIntensity * stepVisibility * 0.5;
                                }
                            }
                            
                            // Calcanhar
                            vec2 heelPos = stepPos + vec2(0.0, -0.01);
                            float heelDist = distance(uv, heelPos);
                            if (heelDist < 0.006) {
                                float heelIntensity = 1.0 - (heelDist / 0.006);
                                pattern += heelIntensity * stepVisibility * 0.6;
                            }
                        }
                    }
                    
                    // REFLEXOS DE METAL aparecendo em múltiplos pontos
                    for (int glint = 0; glint < 10; glint++) {
                        float glintTime = t * 3.0 + float(glint) * 0.3;
                        float glintPhase = mod(glintTime, 1.5);
                        
                        if (glintPhase < 0.2) {
                            float glintProgress = glintPhase / 0.2;
                            float glintIntensity = sin(glintProgress * 3.14159) * 4.0;
                            
                            // Posições aleatórias mas fixas
                            float glintX = 0.2 + mod(float(glint) * 7.13, 0.6);
                            float glintY = 0.2 + mod(float(glint) * 5.47, 0.6);
                            
                            vec2 glintPos = vec2(glintX, glintY);
                            float glintDist = distance(uv, glintPos);
                            
                            if (glintDist < 0.003) {
                                float metalIntensity = 1.0 - (glintDist / 0.003);
                                pattern += metalIntensity * glintIntensity * 0.7;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho dourado misterioso
                    float mysteryPulse = sin(t * 2.8) * 0.3 + 0.7;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * mysteryPulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.4, 0.25, 0.1); // Dourado escuro
                    vec3 daggerColor = vec3(0.8, 0.5, 0.2); // Dourado metálico
                    vec3 glowColor = vec3(0.6, 0.4, 0.15); // Dourado suave
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += daggerColor * lines;
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

    "masters_strike_vignette": {
        name: "Golpe do Mestre",
        duration: 5000,
        particles: {
            count: VIGNETTE_LOD.getParticleCount(200),
            emitterType: "circle",
            startColor: "#ffd700",
            endColor: "#ff6347",
            startScale: { min: 1.8, max: 2.6 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3500, max: 4500 },
            speed: { min: 100, max: 180 },
            radius: 300,
            gravity: { x: 0, y: -80 },
            magical: true,
            arcane: true,
            explosive: true
        },
        filters: {
            brightness: 1.5,
            contrast: 1.4,
            colorMatrix: {
                brightness: 1.3,
                saturation: 1.6
            }
        },
        customShader: {
            enabled: true,
            type: "golpe_do_mestre",
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
                    
                    // Vinheta dourada intensa - Ultimate
                    if (uv.y < 0.55) {
                        float progress = (0.55 - uv.y) / 0.55;
                        float smoothFade = pow(progress, 1.2);
                        float vignetteIntensity = 0.35;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.65) {
                        float progress = (uv.y - 0.65) / 0.35;
                        float smoothFade = pow(progress, 1.2);
                        float vignetteIntensity = 0.35;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // TEMPESTADE DE OURO - explosão inicial
                    float stormPhase = mod(t * 1.0, 6.0);
                    
                    if (stormPhase < 3.0) {
                        float stormProgress = stormPhase / 3.0;
                        
                        // MOEDAS DOURADAS voando em todas as direções
                        for (int coin = 0; coin < 25; coin++) {
                            float coinTime = t * 2.5 + float(coin) * 0.2;
                            float coinAngle = float(coin) * 0.251 + sin(float(coin) * 3.0) * 0.8;
                            float coinSpeed = 0.3 + mod(float(coin), 4.0) * 0.1;
                            float coinDistance = stormProgress * coinSpeed;
                            
                            vec2 coinPos = center + vec2(cos(coinAngle), sin(coinAngle)) * coinDistance;
                            
                            // Rotação 3D simulada da moeda
                            float coinRotation = coinTime * 6.0;
                            float coinScale = abs(sin(coinRotation)) * 0.8 + 0.2;
                            
                            // Turbulência no voo
                            coinPos.x += sin(coinTime * 4.0) * 0.03;
                            coinPos.y += cos(coinTime * 3.5) * 0.025;
                            
                            float coinDist = distance(uv, coinPos);
                            
                            // Corpo da moeda
                            if (coinDist < 0.01 * coinScale) {
                                float coinIntensity = 1.0 - (coinDist / (0.01 * coinScale));
                                float coinBrightness = coinScale * 2.0 + sin(coinTime * 8.0) * 0.5;
                                pattern += coinIntensity * coinBrightness * 0.8;
                            }
                            
                            // Rastro dourado
                            for (int trail = 1; trail <= 3; trail++) {
                                float trailAngle = coinAngle - float(trail) * 0.15;
                                float trailDistance = coinDistance - float(trail) * 0.03;
                                if (trailDistance > 0.0) {
                                    vec2 trailPos = center + vec2(cos(trailAngle), sin(trailAngle)) * trailDistance;
                                    float trailDist = distance(uv, trailPos);
                                    
                                    if (trailDist < 0.006) {
                                        float trailIntensity = 1.0 - (trailDist / 0.006);
                                        pattern += trailIntensity * (1.0 - float(trail) / 4.0) * 0.5;
                                    }
                                }
                            }
                        }
                        
                        // GEMAS PRECIOSAS orbitando majestosamente
                        for (int gem = 0; gem < 8; gem++) {
                            float gemTime = t * 1.5 + float(gem) * 0.785;
                            float gemOrbitRadius = 0.2 + sin(gemTime * 0.8) * 0.05;
                            float gemOrbitAngle = float(gem) * 0.785 + gemTime * 0.6;
                            
                            vec2 gemCenter = center + vec2(cos(gemOrbitAngle), sin(gemOrbitAngle)) * gemOrbitRadius;
                            
                            // Flutuação vertical das gemas
                            gemCenter.y += sin(gemTime * 1.2) * 0.03;
                            
                            // Múltiplas facetas cintilantes
                            for (int facet = 0; facet < 12; facet++) {
                                float facetAngle = float(facet) * 0.524 + gemTime * 2.0;
                                float facetRadius = 0.008 + mod(float(facet), 3.0) * 0.003;
                                
                                vec2 facetPos = gemCenter + vec2(cos(facetAngle), sin(facetAngle)) * facetRadius;
                                float facetDist = distance(uv, facetPos);
                                
                                if (facetDist < 0.003) {
                                    float facetIntensity = 1.0 - (facetDist / 0.003);
                                    
                                    // Brilho baseado na orientação da faceta
                                    float facetBrightness = abs(sin(facetAngle + gemTime * 3.0)) * 2.0 + 0.5;
                                    
                                    // Cores variadas para diferentes gemas
                                    float colorVariation = float(gem) / 8.0;
                                    pattern += facetIntensity * facetBrightness * (0.8 + colorVariation * 0.4);
                                }
                            }
                            
                            // Aura da gema
                            float gemDist = distance(uv, gemCenter);
                            if (gemDist < 0.025) {
                                float auraIntensity = 1.0 - (gemDist / 0.025);
                                float auraPulse = sin(gemTime * 4.0) * 0.3 + 0.7;
                                pattern += auraIntensity * auraPulse * 0.3;
                            }
                        }
                    }
                    
                    // MANDALA ÁRABE DOURADA - formação mística
                    if (stormPhase > 2.0) {
                        float mandalaProgress = (stormPhase - 2.0) / 4.0;
                        float mandalaIntensity = sin(mandalaProgress * 3.14159) * 1.5;
                        
                        // Círculos concêntricos da mandala
                        for (int ring = 0; ring < 5; ring++) {
                            float ringRadius = 0.1 + float(ring) * 0.08;
                            float ringTime = t * (1.0 + float(ring) * 0.3);
                            
                            // Símbolos no anel
                            int symbolCount = 6 + ring * 2;
                            for (int symbol = 0; symbol < 16; symbol++) {
                                if (symbol < symbolCount) {
                                    float symbolAngle = float(symbol) * 6.28318 / float(symbolCount) + ringTime * 0.2;
                                    vec2 symbolPos = center + vec2(cos(symbolAngle), sin(symbolAngle)) * ringRadius;
                                    
                                    // Diferentes tipos de símbolos por anel
                                    if (ring == 0) {
                                        // Centro - estrela principal
                                        for (int star = 0; star < 8; star++) {
                                            float starAngle = float(star) * 0.785 + ringTime * 1.5;
                                            float starRadius = 0.01 + mod(float(star), 2.0) * 0.006;
                                            
                                            vec2 starPoint = symbolPos + vec2(cos(starAngle), sin(starAngle)) * starRadius;
                                            float starDist = distance(uv, starPoint);
                                            
                                            if (starDist < 0.003) {
                                                float starIntensity = 1.0 - (starDist / 0.003);
                                                pattern += starIntensity * mandalaIntensity * 0.8;
                                            }
                                        }
                                    } else if (ring == 1) {
                                        // Segundo anel - losangos
                                        for (int diamond = 0; diamond < 4; diamond++) {
                                            float diamondAngle = float(diamond) * 1.57;
                                            float diamondRadius = 0.008;
                                            
                                            vec2 diamondPoint = symbolPos + vec2(cos(diamondAngle), sin(diamondAngle)) * diamondRadius;
                                            float diamondDist = distance(uv, diamondPoint);
                                            
                                            if (diamondDist < 0.002) {
                                                pattern += mandalaIntensity * 0.6;
                                            }
                                        }
                                    } else {
                                        // Anéis externos - pontos decorativos
                                        float symbolDist = distance(uv, symbolPos);
                                        if (symbolDist < 0.004) {
                                            float symbolIntensity = 1.0 - (symbolDist / 0.004);
                                            pattern += symbolIntensity * mandalaIntensity * 0.5;
                                        }
                                    }
                                }
                            }
                            
                            // Linhas conectoras entre anéis
                            if (ring > 0) {
                                float prevRingRadius = 0.1 + float(ring - 1) * 0.08;
                                for (int connector = 0; connector < 12; connector++) {
                                    float connectorAngle = float(connector) * 0.524;
                                    
                                    // Linha radial
                                    for (int segment = 0; segment < 8; segment++) {
                                        float segProgress = float(segment) / 7.0;
                                        float currentRadius = prevRingRadius + (ringRadius - prevRingRadius) * segProgress;
                                        
                                        vec2 connectorPos = center + vec2(cos(connectorAngle), sin(connectorAngle)) * currentRadius;
                                        float connectorDist = distance(uv, connectorPos);
                                        
                                        if (connectorDist < 0.001) {
                                            pattern += mandalaIntensity * 0.3;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // TEMPESTADE DE PRATA E OURO
                    for (int storm = 0; storm < 15; storm++) {
                        float stormTime = t * 3.0 + float(storm) * 0.4;
                        
                        // Movimento caótico de partículas preciosas
                        float chaosX = sin(stormTime * 1.3) * 0.25 + cos(stormTime * 0.9) * 0.2;
                        float chaosY = cos(stormTime * 1.1) * 0.3 + sin(stormTime * 0.7) * 0.15;
                        
                        vec2 stormPos = center + vec2(chaosX, chaosY);
                        
                        // Partícula principal
                        float stormDist = distance(uv, stormPos);
                        if (stormDist < 0.006) {
                            float stormIntensity = 1.0 - (stormDist / 0.006);
                            
                            // Alternância entre ouro e prata
                            float metalType = sin(stormTime * 2.0) * 0.5 + 0.5;
                            pattern += stormIntensity * (1.0 + metalType) * 0.7;
                        }
                        
                        // Estilhaços menores
                        for (int shard = 0; shard < 4; shard++) {
                            float shardAngle = float(shard) * 1.57 + stormTime * 4.0;
                            vec2 shardPos = stormPos + vec2(cos(shardAngle), sin(shardAngle)) * 0.015;
                            
                            float shardDist = distance(uv, shardPos);
                            if (shardDist < 0.003) {
                                pattern += 0.4;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho dourado supremo - Ultimate
                    float masterGlow = sin(t * 2.0) * 0.4 + 0.6;
                    float pulseBoost = sin(t * 6.0) * 0.2 + 0.8; // Pulso adicional
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    return glow * masterGlow * pulseBoost * 0.45;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.6, 0.4, 0.1); // Dourado rico
                    vec3 masterColor = vec3(1.0, 0.7, 0.2); // Dourado supremo
                    vec3 glowColor = vec3(0.9, 0.6, 0.3); // Dourado brilhante
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += masterColor * lines;
                        alpha += lines * 0.85;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.35;
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

console.log("🎨 Sistema de Vinhetas Avançadas v4.0 - PARTE 4 carregado!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas totais disponíveis`);
console.log("   - Gatuno (3), Vampiro (4), Ladrão Mestre (4) implementados com shaders temáticos");
console.log("   - Efeitos únicos: Sombras, Sangue, Morcegos, Ouro, Joias, Misticismo");
console.log("🎨 Sistema de Vinhetas Avançadas v4.0 - PARTE 4 COMPLETA!");