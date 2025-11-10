// battle-vignette-part3.js - Sistema de vinhetas avançadas - PARTE 3
// Guerreiro + Berserker + Lobisomem
// Versão 4.0 - Shaders customizados para todas as vinhetas

// Verificar se o dicionário global existe
if (!window.ATTACK_VIGNETTES) {
    window.ATTACK_VIGNETTES = {};
}

// PARTE 3: Vinhetas com Shaders Customizados - Classes de Combate Físico
Object.assign(window.ATTACK_VIGNETTES, {

    // ========================================
    // ⚔️ GUERREIRO - Combate físico equilibrado
    // ========================================

    "devastating_blow_vignette": {
        name: "Golpe Devastador",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(95),
            emitterType: "burst",
            startColor: "#4a4a4a",
            endColor: "#2a2a2a",
            startScale: { min: 0.8, max: 1.4 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2600 },
            speed: { min: 80, max: 140 },
            radius: 150,
            gravity: { x: 0, y: 20 },
            metallic: true,
            spark: true
        },
        filters: {
            brightness: 1.1,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.0,
                saturation: 0.9
            }
        },
        customShader: {
            enabled: true,
            type: "devastating_blow",
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
                    
                    // GOLPE DEVASTADOR - diagonal grosso e irregular
                    for (int strike = 0; strike < 3; strike++) {
                        float strikeTime = t * 4.0 + float(strike) * 1.2;
                        float strikeCycle = mod(strikeTime, 3.0);
                        
                        if (strikeCycle < 1.8) {
                            float strikeProgress = strikeCycle / 1.8;
                            
                            // Trajetória diagonal - superior direita para inferior esquerda
                            vec2 strikeStart = vec2(0.9, 0.1);
                            vec2 strikeEnd = vec2(0.1, 0.9);
                            vec2 currentStrikeEnd = mix(strikeStart, strikeEnd, strikeProgress);
                            
                            // Criar golpe grosso e irregular
                            for (int segment = 0; segment < 25; segment++) {
                                float segmentProgress = float(segment) / 24.0;
                                if (segmentProgress > strikeProgress) break;
                                
                                vec2 segmentPos = mix(strikeStart, currentStrikeEnd, segmentProgress);
                                
                                // Irregularidade do golpe
                                float irregularity = sin(segmentProgress * 10.0 + t * 8.0 + float(strike)) * 0.03;
                                vec2 perpDir = normalize(vec2(-(strikeEnd.y - strikeStart.y), strikeEnd.x - strikeStart.x));
                                segmentPos += perpDir * irregularity;
                                
                                float distToStrike = distance(uv, segmentPos);
                                
                                // Golpe principal (grosso)
                                if (distToStrike < 0.015) {
                                    float strikeIntensity = 1.0 - (distToStrike / 0.015);
                                    
                                    // Fade-out do rastro
                                    float trailFade = 1.0 - pow(segmentProgress / strikeProgress, 3.0);
                                    
                                    pattern += strikeIntensity * trailFade * 1.2;
                                }
                                
                                // Impacto adicional no golpe
                                if (distToStrike < 0.008) {
                                    pattern += 0.6;
                                }
                                
                                // Faíscas do impacto
                                for (int spark = 0; spark < 4; spark++) {
                                    float sparkAngle = float(spark) * 1.57 + segmentProgress * 20.0;
                                    vec2 sparkOffset = vec2(cos(sparkAngle), sin(sparkAngle)) * 0.01;
                                    float sparkDist = distance(uv, segmentPos + sparkOffset);
                                    
                                    if (sparkDist < 0.003) {
                                        pattern += 0.4;
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
                    float pulse = sin(t * 2.8) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.18;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.1, 0.1, 0.1); // Cinza escuro
                    vec3 strikeColor = vec3(0.0, 0.0, 0.0); // Preto para o golpe
                    vec3 glowColor = vec3(0.15, 0.15, 0.15); // Cinza claro
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += strikeColor * lines;
                        alpha += lines * 0.75;
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

    "death_spin_vignette": {
        name: "Giro Mortal",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(110),
            emitterType: "circle",
            startColor: "#3a3a3a",
            endColor: "#1a1a1a",
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 0.1, max: 0.4 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 100, max: 180 },
            radius: 180,
            gravity: { x: 0, y: 15 },
            metallic: true,
            wind: true
        },
        filters: {
            brightness: 1.0,
            contrast: 1.1,
            colorMatrix: {
                brightness: 1.0,
                saturation: 0.8
            }
        },
        customShader: {
            enabled: true,
            type: "death_spin",
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
                    
                    if (uv.y < 0.48) {
                        float progress = (0.48 - uv.y) / 0.48;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.33; // 3x mais intenso
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.72) {
                        float progress = (uv.y - 0.72) / 0.28;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.33; // 3x mais intenso
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // GIRO MORTAL - múltiplos arcos girando
                    for (int spin = 0; spin < 4; spin++) {
                        float spinTime = t * 5.0 + float(spin) * 1.5;
                        float spinCycle = mod(spinTime, 2.5);
                        
                        if (spinCycle < 1.5) {
                            float spinProgress = spinCycle / 1.5;
                            float baseAngle = float(spin) * 1.57 + t * 6.0; // 90 graus base + rotação
                            
                            // Arco do giro
                            float arcLength = spinProgress * 3.14159; // Até 180 graus
                            
                            for (int arc = 0; arc < 20; arc++) {
                                float arcProgress = float(arc) / 19.0;
                                if (arcProgress > spinProgress) break;
                                
                                float currentAngle = baseAngle + arcProgress * arcLength;
                                float radius = 0.15 + float(spin) * 0.08;
                                
                                // Variação no raio para movimento mais orgânico
                                radius += sin(arcProgress * 8.0 + t * 10.0) * 0.02;
                                
                                vec2 arcPos = center + vec2(cos(currentAngle), sin(currentAngle)) * radius;
                                float distToArc = distance(uv, arcPos);
                                
                                // Linha principal do giro
                                if (distToArc < 0.008) {
                                    float arcIntensity = 1.0 - (distToArc / 0.008);
                                    
                                    // Fade do rastro
                                    float trailFade = 1.0 - pow(arcProgress / spinProgress, 2.0);
                                    
                                    pattern += arcIntensity * trailFade * 1.0;
                                }
                                
                                // Rastro mais grosso
                                if (distToArc < 0.015) {
                                    float trailIntensity = 1.0 - (distToArc / 0.015);
                                    float trailFade = 1.0 - pow(arcProgress / spinProgress, 4.0);
                                    
                                    pattern += trailIntensity * trailFade * 0.4;
                                }
                            }
                        }
                    }
                    
                    // Turbulência central do giro
                    float turbulenceRadius = 0.1;
                    float distFromCenter = distance(uv, center);
                    
                    if (distFromCenter < turbulenceRadius) {
                        float turbulence = sin(distFromCenter * 30.0 + t * 12.0) * 
                                         sin(atan(uv.y - center.y, uv.x - center.x) * 8.0 + t * 8.0);
                        turbulence = abs(turbulence);
                        
                        if (turbulence > 0.6) {
                            pattern += (turbulence - 0.6) * 0.8;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    float pulse = sin(t * 3.2) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.35, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.08, 0.08, 0.08); // Cinza mais escuro
                    vec3 spinColor = vec3(0.02, 0.02, 0.02); // Quase preto
                    vec3 glowColor = vec3(0.12, 0.12, 0.12); // Cinza médio
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += spinColor * lines;
                        alpha += lines * 0.8;
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

    "merciless_blow_vignette": {
        name: "Golpe Impiedoso",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(85),
            emitterType: "burst",
            startColor: "#505050",
            endColor: "#202020",
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 0.1, max: 0.3 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 1600, max: 2400 },
            speed: { min: 60, max: 120 },
            radius: 140,
            gravity: { x: 0, y: 25 },
            metallic: true,
            explosive: true
        },
        filters: {
            brightness: 1.05,
            contrast: 1.15,
            colorMatrix: {
                brightness: 0.95,
                saturation: 0.85
            }
        },
        customShader: {
            enabled: true,
            type: "merciless_blow",
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
                    
                    if (uv.y < 0.46) {
                        float progress = (0.46 - uv.y) / 0.46;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.39; // 3x mais intenso
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.74) {
                        float progress = (uv.y - 0.74) / 0.26;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.39; // 3x mais intenso
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // GOLPE IMPIEDOSO - múltiplos impactos brutais
                    for (int impact = 0; impact < 6; impact++) {
                        float impactTime = t * 6.0 + float(impact) * 0.8;
                        float impactCycle = mod(impactTime, 2.0);
                        
                        if (impactCycle < 0.3) {
                            float impactProgress = impactCycle / 0.3;
                            float impactIntensity = sin(impactProgress * 3.14159) * 2.0;
                            
                            // Posições variadas dos impactos
                            float impactX = 0.2 + mod(float(impact), 3.0) * 0.3 + sin(impactTime * 1.5) * 0.05;
                            float impactY = 0.25 + mod(float(impact), 2.0) * 0.5 + cos(impactTime * 1.2) * 0.04;
                            vec2 impactPos = vec2(impactX, impactY);
                            
                            // Impacto principal
                            float distToImpact = distance(uv, impactPos);
                            
                            if (distToImpact < 0.05) {
                                float mainImpact = 1.0 - (distToImpact / 0.05);
                                pattern += mainImpact * impactIntensity * 0.8;
                            }
                            
                            // Ondas de choque do impacto
                            for (int shock = 1; shock <= 4; shock++) {
                                float shockRadius = float(shock) * 0.02 + impactProgress * 0.08;
                                float distFromShock = abs(distToImpact - shockRadius);
                                
                                if (distFromShock < 0.008) {
                                    float shockIntensity = 1.0 - (distFromShock / 0.008);
                                    float shockFade = 1.0 - (float(shock) / 4.0);
                                    pattern += shockIntensity * shockFade * impactIntensity * 0.6;
                                }
                            }
                            
                            // Fragmentos do impacto
                            for (int fragment = 0; fragment < 8; fragment++) {
                                float fragAngle = float(fragment) * 0.785; // 45 graus
                                float fragDistance = 0.03 + impactProgress * 0.04;
                                vec2 fragPos = impactPos + vec2(cos(fragAngle), sin(fragAngle)) * fragDistance;
                                
                                float distToFrag = distance(uv, fragPos);
                                if (distToFrag < 0.004) {
                                    pattern += impactIntensity * 0.5;
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
                    float glow = 1.0 - smoothstep(0.0, 0.42, dist);
                    return glow * pulse * 0.17;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.12, 0.12, 0.12); // Cinza
                    vec3 impactColor = vec3(0.0, 0.0, 0.0); // Preto
                    vec3 glowColor = vec3(0.18, 0.18, 0.18); // Cinza claro
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += impactColor * lines;
                        alpha += lines * 0.75;
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
    },    "wild_fury_vignette": {
        name: "Fúria Selvagem",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(130),
            emitterType: "burst",
            startColor: "#cc2222",
            endColor: "#882222",
            startScale: { min: 1.0, max: 1.8 },
            endScale: { min: 0.3, max: 0.6 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2200, max: 2700 },
            speed: { min: 120, max: 200 },
            radius: 170,
            gravity: { x: 0, y: 10 },
            fiery: true,
            explosive: true
        },
        filters: {
            brightness: 1.3,
            contrast: 1.2,
            colorMatrix: {
                brightness: 1.1,
                saturation: 1.4
            }
        },
        customShader: {
            enabled: true,
            type: "wild_fury",
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
                    
                    if (uv.y < 0.45) {
                        float progress = (0.45 - uv.y) / 0.45;
                        float smoothFade = pow(progress, 0.8);
                        float vignetteIntensity = 0.58;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 0.8);
                        float vignetteIntensity = 0.58;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // FÚRIA SELVAGEM - ondas de energia vermelha pulsando rapidamente
                    for (int fury = 0; fury < 8; fury++) {
                        float furyTime = t * 8.0 + float(fury) * 0.6; // BERSERKER É LOUCO - tempo rápido
                        float furyCycle = mod(furyTime, 1.5);
                        
                        if (furyCycle < 0.8) {
                            float furyProgress = furyCycle / 0.8;
                            float furyRadius = furyProgress * 0.5 + float(fury) * 0.04;
                            
                            // Ondas irregulares de fúria
                            float irregularity = sin(furyTime * 12.0 + float(fury)) * 0.02;
                            float currentRadius = furyRadius + irregularity;
                            
                            float distFromFury = abs(distance(uv, center) - currentRadius);
                            
                            if (distFromFury < 0.007) {
                                float furyIntensity = 1.0 - (distFromFury / 0.007);
                                
                                // Pulso rápido de berserker
                                float berserkPulse = sin(t * 10.0 + float(fury) * 2.0) * 0.4 + 0.6; // 60% de intensidade no pico
                                
                                // TRANSPARÊNCIA PROGRESSIVA - mais transparente perto do centro
                                float centerDistance = distance(vec2(0.5, 0.5), center + vec2(cos(float(fury) * 0.785), sin(float(fury) * 0.785)) * currentRadius);
                                float centerFade = 1.0 - smoothstep(0.0, 0.55, centerDistance);
                                float transparency = 0.5 - (centerFade * 0.9); // 60% mais transparente no centro
                                
                                // MUDANÇA DE COR - mais escuro perto do centro
                                float colorShift = centerFade * 0.4; // 40% mais escuro no centro
                                
                                pattern += furyIntensity * (0.5 + berserkPulse) * transparency * (1.0 - colorShift) * 0.7;
                            }
                        }
                    }
                    
                    // Chamas de fúria surgindo das margens
                    if (uv.y < 0.3) {
                        for (int flame = 0; flame < 6; flame++) {
                            float flameX = 0.1 + float(flame) * 0.15 + sin(t * 4.0 + float(flame)) * 0.03;
                            float flameHeight = 0.08 + sin(t * 6.0 + float(flame) * 1.8) * 0.14;
                            
                            for (int seg = 0; seg < 8; seg++) {
                                float segProgress = float(seg) / 7.0;
                                float flameY = segProgress * flameHeight;
                                
                                // Chama irregular
                                float flameWaver = sin(segProgress * 25.0 + t * 8.0 + float(flame)) * 0.035;
                                vec2 flamePos = vec2(flameX + flameWaver, flameY);
                                
                                float distToFlame = distance(uv, flamePos);
                                if (distToFlame < 0.012) {
                                    float flameIntensity = 0.75 - (distToFlame / 0.012);
                                    pattern += flameIntensity * (1.0 - segProgress * 0.3) * 0.6;
                                }
                            }
                        }
                    }
                    
                    // Fúria emanando da parte inferior
                    if (uv.y > 0.7) {
                        for (int rage = 0; rage < 5; rage++) {
                            float rageX = 0.15 + float(rage) * 0.18 + sin(t * 5.0 + float(rage) * 2.1) * 0.04;
                            float rageHeight = 0.06 + sin(t * 7.0 + float(rage) * 1.6) * 0.03;
                            
                            for (int seg = 0; seg < 6; seg++) {
                                float segProgress = float(seg) / 5.0;
                                float rageY = 1.0 - segProgress * rageHeight;
                                
                                vec2 ragePos = vec2(rageX, rageY);
                                float distToRage = distance(uv, ragePos);
                                
                                if (distToRage < 0.01) {
                                    float rageIntensity = 1.0 - (distToRage / 0.01);
                                    pattern += rageIntensity * 0.5;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    // Pulso muito rápido de berserker
                    float pulse = sin(t * 8.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.45, dist);
                    return glow * pulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.15, 0.0, 0.0); // Vermelho mais escuro
                    vec3 furyColor = vec3(0.6, 0.08, 0.08); // Vermelho mais escuro e intenso
                    vec3 glowColor = vec3(0.7, 0.15, 0.15); // Vermelho escuro brilhante
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += furyColor * lines;
                        alpha += lines * 0.6;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.18;
                    }
                    
                    float smoothIntensity = smoothstep(0.0, 0.1, intensity) * (1.0 - smoothstep(0.9, 1.0, intensity));
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

    "frenetic_attack_vignette": {
        name: "Ataque Frenético",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(145),
            emitterType: "burst",
            startColor: "#dd1111",
            endColor: "#991111",
            startScale: { min: 1.2, max: 2.0 },
            endScale: { min: 0.2, max: 0.5 },
            startAlpha: 0.95,
            endAlpha: 0.0,
            lifetime: { min: 1600, max: 2400 },
            speed: { min: 150, max: 250 },
            radius: 200,
            gravity: { x: 0, y: -20 },
            fiery: true,
            explosive: true,
            electric: true
        },
        filters: {
            brightness: 1.4,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.2,
                saturation: 1.5
            }
        },
        customShader: {
            enabled: true,
            type: "frenetic_attack",
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
                        float vignetteIntensity = 0.20;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.20;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // IMPACTO DEVASTADOR ÚNICO
                    float impactTime = mod(t * 1.5, 2.0);
                    if (impactTime < 1.5) {
                        float impactProgress = impactTime / 0.5;
                        float impactIntensity = sin(impactProgress * 3.14159) * 3.0;
                        
                        // ONDAS DE CHOQUE concêntricas do impacto
                        for (int shock = 0; shock < 6; shock++) {
                            float shockRadius = impactProgress * 0.8 + float(shock) * 0.06;
                            float distFromShock = abs(length(uv - center) - shockRadius);
                            
                            if (distFromShock < 0.02) {
                                float shockIntensity = 1.0 - (distFromShock / 0.02);
                                
                                // Tremor violento
                                float tremor = sin(t * 25.0 + float(shock) * 3.0) * 0.02;
                                shockIntensity *= (1.0 + abs(tremor));
                                
                                pattern += shockIntensity * impactIntensity * (1.0 - float(shock) / 6.0) * 0.8;
                            }
                        }
                        
                        // CORTE PRINCIPAL - diagonal massivo atravessando tudo
                        vec2 cutStart = vec2(0.05, 0.05);
                        vec2 cutEnd = vec2(0.95, 0.95);
                        vec2 cutDir = cutEnd - cutStart;
                        
                        // Projeção do ponto na linha do corte
                        vec2 toPoint = uv - cutStart;
                        float projLength = dot(toPoint, cutDir) / dot(cutDir, cutDir);
                        projLength = clamp(projLength, 0.0, impactProgress);
                        
                        vec2 closestPoint = cutStart + cutDir * projLength;
                        float distToCut = length(uv - closestPoint);
                        
                        // Linha principal do corte (bem grossa)
                        if (distToCut < 0.025) {
                            float cutIntensity = 1.0 - (distToCut / 0.025);
                            
                            // Brilho metálico violento
                            float metalGlint = sin(projLength * 20.0 + t * 15.0) * 0.5 + 1.5;
                            
                            pattern += cutIntensity * metalGlint * impactIntensity * 1.2;
                        }
                        
                        // ESTILHAÇOS do impacto irradiando
                        for (int fragment = 0; fragment < 8; fragment++) {
                            float fragAngle = float(fragment) * 0.785 + t * 3.0; // 45 graus
                            float fragDistance = impactProgress * 0.4 + sin(t * 8.0 + float(fragment)) * 0.05;
                            
                            vec2 fragPos = center + vec2(cos(fragAngle), sin(fragAngle)) * fragDistance;
                            
                            // Tremor nos fragmentos
                            fragPos += vec2(sin(t * 20.0 + float(fragment)), cos(t * 22.0 + float(fragment))) * 0.015;
                            
                            float distToFrag = length(uv - fragPos);
                            if (distToFrag < 0.008) {
                                float fragIntensity = 1.0 - (distToFrag / 0.008);
                                pattern += fragIntensity * impactIntensity * 0.7;
                            }
                        }
                        
                        // DISTORÇÃO do espaço ao redor do impacto
                        float distFromImpact = length(uv - center);
                        if (distFromImpact < 0.15) {
                            float distortion = sin(distFromImpact * 30.0 + t * 12.0) * 0.5 + 0.5;
                            distortion *= (1.0 - distFromImpact / 0.15); // Mais forte no centro
                            pattern += distortion * impactIntensity * 0.4;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(uv - center);
                    
                    // Pulso frenético super rápido (mantido como solicitado)
                    float pulse = sin(t * 12.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.3;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.25, 0.0, 0.0);
                    vec3 attackColor = vec3(0.9, 0.1, 0.1);
                    vec3 glowColor = vec3(1.0, 0.2, 0.2);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += attackColor * lines;
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

    "bloody_blow_vignette": {
        name: "Golpe Sangrento",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(120),
            emitterType: "burst",
            startColor: "#aa0000",
            endColor: "#660000",
            startScale: { min: 0.8, max: 1.6 },
            endScale: { min: 0.3, max: 0.7 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 3000 },
            speed: { min: 80, max: 140 },
            radius: 160,
            gravity: { x: 0, y: 40 },
            liquid: true,
            toxic: true
        },
        filters: {
            brightness: 1.2,
            contrast: 1.3,
            colorMatrix: {
                brightness: 1.0,
                saturation: 1.6
            }
        },
        customShader: {
            enabled: true,
            type: "bloody_blow",
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
                        float vignetteIntensity = 0.22;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.22;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // SANGUE ESCORRENDO da parte superior
                    for (int drop = 0; drop < 8; drop++) {
                        float dropTime = t * 2.5 + float(drop) * 0.7;
                        float dropProgress = mod(dropTime, 3.0) / 3.0;
                        
                        float dropX = 0.1 + float(drop) * 0.11 + sin(dropTime * 1.2) * 0.03;
                        float dropY = -0.1 + dropProgress * 1.3; // Do topo até embaixo
                        
                        // Gota principal
                        vec2 dropPos = vec2(dropX, dropY);
                        vec2 dropDiff = uv - dropPos;
                        float distToDrop = length(dropDiff);
                        
                        if (distToDrop < 0.008 && dropY >= 0.0 && dropY <= 1.0) {
                            float dropIntensity = 1.0 - (distToDrop / 0.008);
                            pattern += dropIntensity * 0.8;
                        }
                        
                        // Rastro do sangue escorrendo
                        for (int trail = 1; trail <= 5; trail++) {
                            float trailY = dropY - float(trail) * 0.02;
                            if (trailY >= 0.0) {
                                vec2 trailPos = vec2(dropX, trailY);
                                vec2 trailDiff = uv - trailPos;
                                float distToTrail = length(trailDiff);
                                
                                if (distToTrail < 0.004) {
                                    float trailIntensity = 1.0 - (distToTrail / 0.004);
                                    float fadeFactor = 1.0 - (float(trail) / 5.0);
                                    pattern += trailIntensity * fadeFactor * 0.4;
                                }
                            }
                        }
                    }
                    
                    // MANCHAS DE SANGUE aparecendo (respingos na câmera)
                    for (int splatter = 0; splatter < 10; splatter++) {
                        float splatterTime = t * 4.0 + float(splatter) * 1.3;
                        float splatterCycle = mod(splatterTime, 5.0);
                        
                        if (splatterCycle < 2.0) {
                            float splatterProgress = splatterCycle / 2.0;
                            float splatterIntensity = sin(splatterProgress * 3.14159) * 1.5;
                            
                            // Posições aleatórias das manchas
                            float splatterX = 0.15 + mod(float(splatter), 4.0) * 0.2 + sin(splatterTime * 0.8) * 0.05;
                            float splatterY = 0.2 + mod(float(splatter), 3.0) * 0.25 + cos(splatterTime * 0.6) * 0.04;
                            
                            vec2 splatterCenter = vec2(splatterX, splatterY);
                            vec2 splatterDiff = uv - splatterCenter;
                            float distToSplatter = length(splatterDiff);
                            
                            // Mancha irregular
                            float splatterSize = 0.03 + sin(splatterTime * 3.0) * 0.01;
                            
                            if (distToSplatter < splatterSize) {
                                float mainSplatter = 1.0 - (distToSplatter / splatterSize);
                                
                                // Irregularidade da mancha
                                float angle = atan(splatterDiff.y, splatterDiff.x);
                                float irregularity = sin(angle * 6.0 + splatterTime * 4.0) * 0.3 + 0.7;
                                
                                pattern += mainSplatter * irregularity * splatterIntensity * 0.7;
                            }
                            
                            // Respingos menores ao redor
                            for (int speck = 0; speck < 6; speck++) {
                                float speckAngle = float(speck) * 1.047; // 60 graus
                                float speckDistance = 0.04 + sin(splatterTime * 2.0 + float(speck)) * 0.015;
                                vec2 speckPos = splatterCenter + vec2(cos(speckAngle), sin(speckAngle)) * speckDistance;
                                
                                vec2 speckDiff = uv - speckPos;
                                float distToSpeck = length(speckDiff);
                                if (distToSpeck < 0.005) {
                                    float speckIntensity = 1.0 - (distToSpeck / 0.005);
                                    pattern += speckIntensity * splatterIntensity * 0.5;
                                }
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 centerDiff = uv - center;
                    float dist = length(centerDiff);
                    // Pulso sangrento rápido
                    float pulse = sin(t * 7.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    return glow * pulse * 0.28;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.18, 0.0, 0.0); // Vermelho escuro
                    vec3 bloodColor = vec3(0.7, 0.0, 0.0); // Sangue vermelho
                    vec3 glowColor = vec3(0.8, 0.1, 0.1); // Vermelho brilhante
                    
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

    "primordial_devastation_vignette": {
        name: "Devastação Primordial",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(180),
            emitterType: "circle",
            startColor: "#ff0000",
            endColor: "#880000",
            startScale: { min: 1.5, max: 2.8 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3000, max: 4500 },
            speed: { min: 200, max: 300 },
            radius: 250,
            gravity: { x: 0, y: -150 },
            fiery: true,
            explosive: true,
            electric: true
        },
        filters: {
            brightness: 1.6,
            contrast: 1.4,
            colorMatrix: {
                brightness: 1.3,
                saturation: 1.8
            }
        },
        customShader: {
            enabled: true,
            type: "primordial_devastation",
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
                        float vignetteIntensity = 0.25; // Muito intenso para ultimate
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.25;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // DEVASTAÇÃO PRIMORDIAL - explosões massivas + tremores
                    
                    // FASE 1: Acúmulo de energia (0-1.3s)
                    if (t < 1.3) {
                        float chargeProgress = t / 1.3;
                        
                        // Ondas de energia convergindo
                        for (int wave = 0; wave < 8; wave++) {
                            float waveAngle = float(wave) * 0.785; // 45 graus
                            float waveDistance = 0.8 - chargeProgress * 0.6;
                            
                            vec2 wavePos = center + vec2(cos(waveAngle), sin(waveAngle)) * waveDistance;
                            
                            // Tremor na energia
                            float tremor = sin(t * 11.0 + float(wave)) * 0.03;
                            wavePos += vec2(tremor, sin(t * 18.0 + float(wave) * 1.3) * 0.015);
                            
                            vec2 waveDiff = uv - wavePos;
                            float distToWave = length(waveDiff);
                            if (distToWave < 0.015) {
                                float waveIntensity = 1.0 - (distToWave / 0.015);
                                pattern += waveIntensity * chargeProgress * 0.8;
                            }
                        }
                        
                        // Pulso central crescente
                        float centralRadius = chargeProgress * 0.22;
                        vec2 centerDiff = uv - center;
                        float distFromCenter = length(centerDiff);
                        
                        if (distFromCenter < centralRadius) {
                            float centralPulse = sin(t * 20.0) * 0.5 + 0.5;
                            pattern += centralPulse * chargeProgress * 0.6;
                        }
                    }
                    
                    // FASE 2: EXPLOSÃO MÁXIMA (2-3s)
                    else if (t >= 2.0 && t < 3.0) {
                        float explosionTime = t - 1.3;
                        float explosionIntensity = sin(explosionTime * 3.14159) * 4.0; // Pico massivo
                        
                        // Ondas de choque concêntricas
                        for (int shock = 0; shock < 10; shock++) {
                            float shockRadius = explosionTime * 0.5 + float(shock) * 0.06;
                            vec2 centerDiff = uv - center;
                            float distFromShock = abs(length(centerDiff) - shockRadius);
                            
                            if (distFromShock < 0.02) {
                                float shockIntensity = 0.5 - (distFromShock / 0.02);
                                
                                // Tremor violento
                                float violentTremor = sin(t * 25.0 + float(shock) * 3.0) * 0.03;
                                shockIntensity *= (1.0 + abs(violentTremor));
                                
                                pattern += shockIntensity * explosionIntensity * 0.8;
                            }
                        }
                        
                        // Fragmentos explosivos
                        for (int fragment = 0; fragment < 12; fragment++) {
                            float fragAngle = float(fragment) * 0.524; // 30 graus
                            float fragDistance = explosionTime * 0.6 + sin(t * 12.0 + float(fragment)) * 0.05;
                            
                            vec2 fragPos = center + vec2(cos(fragAngle), sin(fragAngle)) * fragDistance;
                            
                            // Tremor nos fragmentos
                            fragPos += vec2(sin(t * 20.0 + float(fragment)), cos(t * 22.0 + float(fragment))) * 0.02;
                            
                            vec2 fragDiff = uv - fragPos;
                            float distToFrag = length(fragDiff);
                            if (distToFrag < 0.012) {
                                pattern += explosionIntensity * 0.6;
                            }
                        }
                    }
                    
                    // FASE 3: Aftermath (3-5s)
                    else {
                        float aftermathTime = t - 3.0;
                        float aftermathIntensity = 1.0 - (aftermathTime / 2.0);
                        
                        // Ondas residuais
                        for (int residue = 0; residue < 6; residue++) {
                            float residueRadius = 0.3 + aftermathTime * 0.2 + float(residue) * 0.08;
                            vec2 centerDiff = uv - center;
                            float distFromResidue = abs(length(centerDiff) - residueRadius);
                            
                            if (distFromResidue < 0.015) {
                                float residueStrength = 1.0 - (distFromResidue / 0.015);
                                
                                // Tremor decrescente
                                float fadingTremor = sin(t * 8.0 + float(residue)) * 0.01 * aftermathIntensity;
                                residueStrength *= (1.0 + abs(fadingTremor));
                                
                                pattern += residueStrength * aftermathIntensity * 0.5;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 centerDiff = uv - center;
                    float dist = length(centerDiff);
                    
                    // Brilho central épico
                    if (t >= 2.0 && t < 3.0) {
                        // Durante explosão - brilho máximo
                        float explosionGlow = sin((t - 2.0) * 3.14159) * 3.0;
                        float glow = 1.0 - smoothstep(0.0, 0.6, dist);
                        return glow * explosionGlow * 0.5;
                    } else {
                        // Antes e depois - pulso normal
                        float pulse = sin(t * 6.0) * 0.5 + 0.5;
                        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                        return glow * pulse * 0.35;
                    }
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.3, 0.0, 0.0); // Vermelho bem escuro
                    vec3 devastationColor = vec3(1.0, 0.1, 0.0); // Vermelho devastador
                    vec3 glowColor = vec3(1.0, 0.3, 0.0); // Laranja-vermelho
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += devastationColor * lines;
                        alpha += lines * 0.9;
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

    // ========================================
    // 🐺 LOBISOMEM - Bestialidade sombria
    // ========================================

    "bestial_claw_vignette": {
        name: "Garra Bestial",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(120),
            emitterType: "burst",
            startColor: "#2a2a2a",
            endColor: "#1a1a1a",
            startScale: { min: 1.2, max: 1.6 },
            endScale: { min: 0.5, max: 0.7 },
            startAlpha: 0.8,
            endAlpha: 0.0,
            lifetime: { min: 2100, max: 2800 },
            speed: { min: 120, max: 160 },
            radius: 150,
            gravity: { x: 0, y: 20 },
            smoky: true,
            spark: true
        },
        filters: {
            brightness: 0.7,
            contrast: 1.3,
            colorMatrix: {
                brightness: 0.8,
                saturation: 0.7
            }
        },
        customShader: {
            enabled: true,
            type: "bestial_claw",
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
                        float smoothFade = pow(progress, 1.1);
                        float vignetteIntensity = 0.85; // Bem escuro
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.75) {
                        float progress = (uv.y - 0.75) / 0.25;
                        float smoothFade = pow(progress, 1.1);
                        float vignetteIntensity = 0.55;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // GARRAS BESTIAIS - múltiplos riscos de garra (simplificado)
                    for (int claw = 0; claw < 12; claw++) {
                        float clawTime = t * 4.0 + float(claw) * 1.0;
                        float clawCycle = mod(clawTime, 3.0);
                        
                        if (clawCycle < 1.2) {
                            float clawProgress = clawCycle / 1.2;
                            
                            float clawAngle = float(claw) * 0.785 + sin(clawTime * 0.8) * 0.3;
                            
                            // 3 riscos por garra
                            for (int scratch = 0; scratch < 3; scratch++) {
                                float scratchOffset = (float(scratch) - 1.0) * 0.03;
                                
                                for (int segment = 0; segment < 12; segment++) {
                                    float segProgress = float(segment) / 11.0;
                                    if (segProgress > clawProgress) break;
                                    
                                    float dist = 0.1 + segProgress * 0.3;
                                    vec2 scratchPos = vec2(0.5, 0.5) + vec2(cos(clawAngle), sin(clawAngle)) * dist;
                                    
                                    // Offset lateral para cada risco
                                    vec2 perpDir = vec2(-sin(clawAngle), cos(clawAngle));
                                    scratchPos += perpDir * scratchOffset;
                                    
                                    if (scratchPos.x >= 0.0 && scratchPos.x <= 1.0 && scratchPos.y >= 0.0 && scratchPos.y <= 1.0) {
                                        vec2 scratchDiff = uv - scratchPos;
                                        float distToScratch = length(scratchDiff);
                                        
                                        if (distToScratch < 0.006) {
                                            float scratchIntensity = 1.0 - (distToScratch / 0.006);
                                            
                                            // Fade do rastro
                                            float trailFade = 1.0 - pow(segProgress / clawProgress, 2.0);
                                            
                                            pattern += scratchIntensity * trailFade * 0.8;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // SOMBRAS BESTIAIS se movendo (simplificado)
                    for (int shadow = 0; shadow < 12; shadow++) {
                        float shadowTime = t * 2.0 + float(shadow) * 1.2;
                        float shadowX = 0.4 + mod(shadowTime * 0.3, 0.8);
                        float shadowY = 0.2 + mod(float(shadow), 3.0) * 0.25 + sin(shadowTime * 0.8) * 0.08;
                        
                        vec2 shadowPos = vec2(shadowX, shadowY);
                        
                        // Forma bestial irregular
                        for (int blob = 0; blob < 3; blob++) {
                            float blobAngle = float(blob) * 2.094 + shadowTime * 1.5;
                            float blobRadius = 0.015 + sin(shadowTime * 3.0 + float(blob)) * 0.008;
                            
                            vec2 blobPos = shadowPos + vec2(cos(blobAngle), sin(blobAngle)) * blobRadius;
                            vec2 blobDiff = uv - blobPos;
                            float distToBlob = length(blobDiff);
                            
                            if (distToBlob < 0.012) {
                                float blobIntensity = 1.0 - (distToBlob / 0.012);
                                float shadowStrength = sin(shadowTime * 3.0 + float(blob)) * 0.3 + 0.7;
                                pattern += blobIntensity * shadowStrength * 0.4;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 centerDiff = uv - center;
                    float dist = length(centerDiff);
                    float pulse = sin(t * 3.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                    return glow * pulse * 0.15; // Brilho sutil e escuro
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0); // Preto
                    vec3 clawColor = vec3(0.05, 0.05, 0.05); // Cinza muito escuro
                    vec3 glowColor = vec3(0.1, 0.1, 0.1); // Cinza escuro
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += clawColor * lines;
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

    "death_bite_vignette": {
        name: "Mordida Mortal",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(90),
            emitterType: "burst",
            startColor: "#333333",
            endColor: "#111111",
            startScale: { min: 0.8, max: 1.4 },
            endScale: { min: 0.2, max: 0.4 },
            startAlpha: 0.85,
            endAlpha: 0.0,
            lifetime: { min: 2000, max: 2800 },
            speed: { min: 60, max: 110 },
            radius: 140,
            gravity: { x: 0, y: 30 },
            smoky: true,
            liquid: true
        },
        filters: {
            brightness: 0.6,
            contrast: 1.4,
            colorMatrix: {
                brightness: 0.7,
                saturation: 0.6
            }
        },
        customShader: {
            enabled: true,
            type: "death_bite",
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
                    
                    if (uv.y < 0.48) {
                        float progress = (0.48 - uv.y) / 0.48;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.96; // 3x maior
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.72) {
                        float progress = (uv.y - 0.72) / 0.28;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.96; // 3x maior
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // VÓRTEX VORAZ no centro - movimento hipnótico
                    float vortexPhase = mod(t * 3.0, 5.0);
                    if (vortexPhase < 3.0) {
                        float vortexProgress = vortexPhase / 3.0;
                        float vortexIntensity = sin(vortexProgress * 3.14159) * 2.0;
                        
                        // Vórtex central com múltiplas camadas
                        for (int layer = 0; layer < 5; layer++) {
                            float layerRadius = 0.04 + float(layer) * 0.02;
                            float layerSpeed = 8.0 + float(layer) * 2.0;
                            
                            float spiralAngle = atan(uv.y - center.y, uv.x - center.x) + t * layerSpeed;
                            float distFromCenter = distance(uv, center);
                            
                            if (distFromCenter < layerRadius && distFromCenter > layerRadius - 0.015) {
                                float spiral = sin(spiralAngle * 6.0 + distFromCenter * 30.0) * 0.5 + 0.5;
                                pattern += spiral * vortexIntensity * (1.0 - float(layer) / 5.0) * 0.8;
                            }
                        }
                        
                        // Pulsos de energia saindo do vórtex
                        for (int pulse = 0; pulse < 6; pulse++) {
                            float pulseTime = t * 4.0 + float(pulse) * 1.5;
                            float pulseRadius = mod(pulseTime, 3.0) * 0.15;
                            
                            float distToPulse = abs(distance(uv, center) - pulseRadius);
                            if (distToPulse < 0.01 && pulseRadius > 0.05) {
                                float pulseIntensity = 1.0 - (distToPulse / 0.2);
                                pattern += pulseIntensity * vortexIntensity * 0.6;
                            }
                        }
                    }
                    
                    // PRESAS DESCENDO agressivamente (2 dentes superiores grandes)
                    float fangTime = mod(t * 2.5, 4.0);
                    if (fangTime < 2.0) {
                        float fangProgress = fangTime / 2.0;
                        float fangIntensity = sin(fangProgress * 3.14159) * 1.5;
                        
                        // Presas superiores mais agressivas
                        vec2 leftFang = vec2(0.4, 0.15 + fangProgress * 0.3);
                        vec2 rightFang = vec2(0.6, 0.15 + fangProgress * 0.3);
                        
                        // Presa esquerda com formato mais realista
                        for (int point = 0; point < 8; point++) {
                            float pointProgress = float(point) / 7.0;
                            vec2 fangPoint = leftFang + vec2(0.0, pointProgress * 0.15);
                            
                            float fangWidth = 0.01 * (1.0 - pointProgress * 0.7);
                            float distToFang = abs(uv.x - fangPoint.x);
                            
                            if (distToFang < fangWidth && uv.y > fangPoint.y - 0.02 && uv.y < fangPoint.y + 0.02) {
                                pattern += fangIntensity * (1.0 - pointProgress * 0.3) * 0.8;
                            }
                        }
                        
                        // Presa direita
                        for (int point = 0; point < 8; point++) {
                            float pointProgress = float(point) / 7.0;
                            vec2 fangPoint = rightFang + vec2(0.0, pointProgress * 0.15);
                            
                            float fangWidth = 0.01 * (1.0 - pointProgress * 0.7);
                            float distToFang = abs(uv.x - fangPoint.x);
                            
                            if (distToFang < fangWidth && uv.y > fangPoint.y - 0.02 && uv.y < fangPoint.y + 0.02) {
                                pattern += fangIntensity * (1.0 - pointProgress * 0.3) * 0.8;
                            }
                        }
                        
                        // DENTES INFERIORES SUBINDO (5 dentes menores)
                        float lowerTeethPositions[5];
                        lowerTeethPositions[0] = 0.42; // 1º dente (maior das pontas)
                        lowerTeethPositions[1] = 0.47; // 2º dente (menor)
                        lowerTeethPositions[2] = 0.50; // 3º dente (menor, centro)
                        lowerTeethPositions[3] = 0.53; // 4º dente (menor)
                        lowerTeethPositions[4] = 0.58; // 5º dente (maior das pontas)
                        
                        for (int tooth = 0; tooth < 5; tooth++) {
                            // Determinar tamanho do dente
                            float toothSize = (tooth == 0 || tooth == 4) ? 0.08 : 0.06; // Pontas maiores
                            float toothWidth = (tooth == 0 || tooth == 4) ? 0.008 : 0.006;
                            
                            // Posição base do dente (subindo de baixo)
                            vec2 lowerTooth = vec2(lowerTeethPositions[tooth], 0.85 - fangProgress * 0.25);
                            
                            // Criar cada dente inferior
                            for (int point = 0; point < 6; point++) {
                                float pointProgress = float(point) / 5.0;
                                vec2 toothPoint = lowerTooth - vec2(0.0, pointProgress * toothSize);
                                
                                float currentToothWidth = toothWidth * (1.0 - pointProgress * 0.8);
                                float distToTooth = abs(uv.x - toothPoint.x);
                                
                                if (distToTooth < currentToothWidth && uv.y > toothPoint.y - 0.015 && uv.y < toothPoint.y + 0.015) {
                                    float toothIntensity = 1.0 - (distToTooth / currentToothWidth);
                                    pattern += fangIntensity * toothIntensity * (1.0 - pointProgress * 0.2) * 0.5;
                                }
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
                    return glow * pulse * 0.25;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.02, 0.02, 0.02);
                    vec3 biteColor = vec3(0.08, 0.08, 0.08);
                    vec3 glowColor = vec3(0.12, 0.12, 0.12);
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += biteColor * lines;
                        alpha += lines * 0.75;
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

    "feral_attack_vignette": {
        name: "Ataque Feral",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(115),
            emitterType: "burst",
            startColor: "#2f2f2f",
            endColor: "#0f0f0f",
            startScale: { min: 1.0, max: 1.6 },
            endScale: { min: 0.3, max: 0.6 },
            startAlpha: 0.9,
            endAlpha: 0.0,
            lifetime: { min: 1800, max: 2600 },
            speed: { min: 100, max: 170 },
            radius: 170,
            gravity: { x: 0, y: 15 },
            smoky: true,
            explosive: true
        },
        filters: {
            brightness: 0.65,
            contrast: 1.35,
            colorMatrix: {
                brightness: 0.75,
                saturation: 0.65
            }
        },
        customShader: {
            enabled: true,
            type: "feral_attack",
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
                    
                    if (uv.y < 0.47) {
                        float progress = (0.47 - uv.y) / 0.47;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.38;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.73) {
                        float progress = (uv.y - 0.73) / 0.27;
                        float smoothFade = pow(progress, 1.8);
                        float vignetteIntensity = 0.38;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // INVESTIDA BESTIAL - onda de impacto inicial
                    float chargeTime = mod(t * 3.0, 4.0);
                    if (chargeTime < 1.0) {
                        float chargeProgress = chargeTime;
                        float chargeIntensity = sin(chargeProgress * 3.14159) * 2.0;
                        
                        // Onda de choque da investida
                        for (int wave = 0; wave < 4; wave++) {
                            float waveRadius = chargeProgress * 0.6 + float(wave) * 0.08;
                            float distFromWave = abs(length(uv - center) - waveRadius);
                            
                            if (distFromWave < 0.02) {
                                float waveIntensity = 1.0 - (distFromWave / 0.02);
                                pattern += waveIntensity * chargeIntensity * (1.0 - float(wave) / 4.0) * 0.8;
                            }
                        }
                    }
                    
                    // GARRAS MÚLTIPLAS - arranhões violentos em diferentes ângulos
                    for (int clawSet = 0; clawSet < 3; clawSet++) {
                        float clawTime = t * 4.0 + float(clawSet) * 1.3;
                        float clawCycle = mod(clawTime, 3.0);
                        
                        if (clawCycle < 1.5) {
                            float clawProgress = clawCycle / 1.5;
                            float clawIntensity = sin(clawProgress * 3.14159) * 1.8;
                            
                            // Ângulos diferentes para cada conjunto de garras
                            float baseAngle = float(clawSet) * 2.1 + sin(clawTime * 0.8) * 0.4;
                            
                            // 4 garras por conjunto (como uma pata)
                            for (int claw = 0; claw < 4; claw++) {
                                float clawAngle = baseAngle + (float(claw) - 1.5) * 0.15; // Leque de garras
                                
                                // ARRANHÃO - linha contínua da garra
                                vec2 clawStart = center + vec2(cos(clawAngle), sin(clawAngle)) * 0.05;
                                vec2 clawEnd = center + vec2(cos(clawAngle), sin(clawAngle)) * (0.05 + clawProgress * 0.4);
                                
                                // Criar linha do arranhão
                                vec2 clawDir = clawEnd - clawStart;
                                float clawLength = length(clawDir);
                                
                                if (clawLength > 0.0) {
                                    clawDir = clawDir / clawLength;
                                    
                                    // Projeção do ponto na linha da garra
                                    vec2 toPoint = uv - clawStart;
                                    float projLength = dot(toPoint, clawDir);
                                    projLength = clamp(projLength, 0.0, clawLength);
                                    
                                    vec2 closestPoint = clawStart + clawDir * projLength;
                                    float distToClaw = length(uv - closestPoint);
                                    
                                    // Garra principal
                                    if (distToClaw < 0.004) {
                                        float scratchIntensity = 1.0 - (distToClaw / 0.004); // CORRIGIDO: removido espaço
                                        
                                        // Variação de intensidade ao longo da garra
                                        float alongClaw = projLength / clawLength;
                                        float intensityVariation = 1.0 - alongClaw * 0.3;
                                        pattern += scratchIntensity * intensityVariation * clawIntensity * 1.0;
                                    }

                                    // Rastro da garra (mais largo e menos intenso)
                                    if (distToClaw < 0.008) {
                                        float trailIntensity = 1.0 - (distToClaw / 0.008);
                                        float alongClaw = projLength / clawLength;
                                        pattern += trailIntensity * (1.0 - alongClaw * 0.5) * clawIntensity * 0.4;
                                    }
                                }
                            }
                        }
                    }
                    
                    // MORDIDA BESTIAL - círculo com dentes
                    float biteTime = t * 2.0 + 1.5;
                    float biteCycle = mod(biteTime, 4.0);
                    if (biteCycle < 1.2) {
                        float biteProgress = biteCycle / 1.2;
                        float biteIntensity = sin(biteProgress * 3.14159) * 1.5;
                        
                        vec2 biteCenter = vec2(0.6, 0.4);
                        float distToBite = length(uv - biteCenter);
                        
                        // Círculo da mordida
                        if (distToBite < 0.06) {
                            float mouthIntensity = 1.0 - (distToBite / 0.06);
                            pattern += mouthIntensity * biteIntensity * 0.6;
                            
                            // Marcas de dentes ao redor
                            float toothAngle = atan(uv.y - biteCenter.y, uv.x - biteCenter.x);
                            float toothPattern = sin(toothAngle * 8.0) * 0.5 + 0.5;
                            
                            if (distToBite > 0.04 && toothPattern > 0.7) {
                                pattern += biteIntensity * 0.8;
                            }
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(uv - center);
                    float pulse = sin(t * 4.0) * 0.5 + 0.5;
                    float glow = 1.0 - smoothstep(0.0, 0.38, dist);
                    return glow * pulse * 0.2;
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.05, 0.05, 0.05); // Cinza bem escuro
                    vec3 feralColor = vec3(0.15, 0.15, 0.15); // Cinza escuro em vez de preto
                    vec3 glowColor = vec3(0.2, 0.2, 0.2); // Cinza médio
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        color += feralColor * lines;
                        alpha += lines * 0.8;
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

    "lunar_frenzy_vignette": {
        name: "Frenesi Lunar",
        duration: 2500, // OTIMIZADO: 5000ms → 2500ms (-50%)
        particles: {
            count: VIGNETTE_LOD.getParticleCount(160),
            emitterType: "circle",
            startColor: "#1a1a1a",
            endColor: "#0a0a0a",
            startScale: { min: 1.2, max: 2.2 },
            endScale: { min: 0.4, max: 0.8 },
            startAlpha: 1.0,
            endAlpha: 0.0,
            lifetime: { min: 3500, max: 4500 },
            speed: { min: 120, max: 200 },
            radius: 220,
            gravity: { x: 0, y: -80 },
            smoky: true,
            cloud: true,
            heavenly: true
        },
        filters: {
            brightness: 0.8,
            contrast: 1.6,
            colorMatrix: {
                brightness: 0.9,
                saturation: 0.8
            }
        },
        customShader: {
            enabled: true,
            type: "lunar_frenzy",
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
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.35;
                        vignette = smoothFade * vignetteIntensity;
                    }
                    
                    if (uv.y > 0.70) {
                        float progress = (uv.y - 0.70) / 0.30;
                        float smoothFade = pow(progress, 1.6);
                        float vignetteIntensity = 0.95;
                        vignette += smoothFade * vignetteIntensity;
                    }
                    
                    return vignette;
                }
                
                float marginLines(vec2 uv, float t) {
                    float pattern = 0.0;
                    
                    // OLHOS DE FERA realistas - formato de olho com largura > altura
                    vec2 leftEyeCenter = vec2(0.45, 0.5);
                    vec2 rightEyeCenter = vec2(0.55, 0.5);
                    
                    // Movimento sincronizado e lento
                    float eyeMovement = sin(t * 1.5) * 0.003;
                    leftEyeCenter.x += eyeMovement;
                    rightEyeCenter.x += eyeMovement;
                    leftEyeCenter.y += cos(t * 1.2) * 0.002;
                    rightEyeCenter.y += cos(t * 1.2) * 0.002;
                    
                    // Olho esquerdo - formato realista com ANGULAÇÃO DE LOBO
                    vec2 leftEyeOffset = uv - leftEyeCenter;
                    
                    // Formato de olho real com afinamento nas margens
                    float eyeWidth = 0.035;  // Largura maior
                    float eyeHeight = 0.025; // Altura menor
                    
                    // Calcular distância normalizada
                    float normalizedX = leftEyeOffset.x / eyeWidth;
                    float normalizedY = leftEyeOffset.y / eyeHeight;
                    
                    // ANGULAÇÃO DE LOBO - olho esquerdo (parte interna mais baixa)
                    float angleOffset = -normalizedX * 0.3; // Angulação discreta
                    normalizedY += angleOffset; // Parte direita (interna) fica mais baixa
                    
                    // Formato de olho com afinamento nas margens
                    float eyeShape = normalizedX * normalizedX + normalizedY * normalizedY;
                    
                    // Afinamento nas margens horizontais (formato de amêndoa)
                    float horizontalTaper = 1.0 - smoothstep(0.5, 2.0, abs(normalizedX));
                    eyeShape = eyeShape / (horizontalTaper * 0.8 + 0.2); // Afinamento gradual
                    
                    if (eyeShape < 1.0) {
                        // Base do olho - laranja-avermelhado
                        float eyeIntensity = 1.0 - eyeShape;
                        float redPulse = sin(t * 6.0) * 0.3 + 0.7;
                        pattern += eyeIntensity * redPulse * 1.0;
                        
                        // Pupila vertical mais fina com margens afinadas - ajustada para angulação
                        vec2 pupilaOffset = leftEyeOffset;
                        pupilaOffset.y += normalizedX * 0.3 * eyeHeight; // Aplicar mesma angulação na pupila
                        
                        if (abs(pupilaOffset.x) < 0.0015) { // Pupila mais fina
                            float verticalDistance = abs(pupilaOffset.y);
                            float maxPupilaHeight = 0.017;
                            
                            float taperFactor = 1.0 - smoothstep(maxPupilaHeight * 0.7, maxPupilaHeight, verticalDistance);
                            float pupilaWidth = 0.001 * taperFactor; // Mais fina
                            
                            if (abs(pupilaOffset.x) < pupilaWidth && verticalDistance < maxPupilaHeight) {
                                pattern *= 0.01; // Cor anterior (bem escura)
                            }
                        }
                        
                        // Reflexo de luz no olho
                        vec2 reflectionPos = leftEyeCenter + vec2(-0.010, -0.006);
                        float distToReflection = length(uv - reflectionPos);
                        if (distToReflection < 0.004) {
                            pattern += 0.8;
                        }
                    }
                    
                    // Olho direito - formato realista com ANGULAÇÃO DE LOBO (oposta)
                    vec2 rightEyeOffset = uv - rightEyeCenter;
                    
                    // Calcular distância normalizada
                    normalizedX = rightEyeOffset.x / eyeWidth;
                    normalizedY = rightEyeOffset.y / eyeHeight;
                    
                    // ANGULAÇÃO DE LOBO - olho direito (parte interna mais baixa, angulação oposta)
                    angleOffset = normalizedX * 0.3; // Angulação oposta
                    normalizedY += angleOffset;
                    
                    // Formato de olho com afinamento nas margens
                    eyeShape = normalizedX * normalizedX + normalizedY * normalizedY;
                    
                    // Afinamento nas margens horizontais
                    horizontalTaper = 1.0 - smoothstep(0.5, 2.0, abs(normalizedX));
                    eyeShape = eyeShape / (horizontalTaper * 0.8 + 0.2);
                    
                    if (eyeShape < 1.0) {
                        // Base do olho - laranja-avermelhado
                        float eyeIntensity = 1.0 - eyeShape;
                        float redPulse = sin(t * 6.0 + 0.2) * 0.3 + 0.7;
                        pattern += eyeIntensity * redPulse * 1.0;
                        
                        // Pupila vertical mais fina com margens afinadas - ajustada para angulação
                        vec2 pupilaOffset = rightEyeOffset;
                        pupilaOffset.y += (-normalizedX) * 0.3 * eyeHeight; // Aplicar mesma angulação na pupila
                        
                        if (abs(pupilaOffset.x) < 0.0015) { // Pupila mais fina
                            float verticalDistance = abs(pupilaOffset.y);
                            float maxPupilaHeight = 0.017;
                            
                            float taperFactor = 1.0 - smoothstep(maxPupilaHeight * 0.7, maxPupilaHeight, verticalDistance);
                            float pupilaWidth = 0.001 * taperFactor; // Mais fina
                            
                            if (abs(pupilaOffset.x) < pupilaWidth && verticalDistance < maxPupilaHeight) {
                                pattern *= 0.01; // Cor anterior (bem escura)
                            }
                        }
                        
                        // Reflexo de luz no olho
                        vec2 reflectionPos = rightEyeCenter + vec2(0.010, -0.006);
                        float distToReflection = length(uv - reflectionPos);
                        if (distToReflection < 0.004) {
                            pattern += 0.8;
                        }
                    }
                    
                    return pattern;
                }
                
                float centralGlow(vec2 uv, float t) {
                    // LUA - BRILHO RADIAL SIMPLES E FORTE
                    vec2 moonCenter = vec2(0.5, 0.18);
                    float distToMoon = length(uv - moonCenter);
                    
                    // Brilho intenso que diminui com o tempo
                    float timeDecay = 1.0 - (t / 5.0);
                    timeDecay = max(timeDecay, 0.5);
                    
                    // BRILHO RADIAL SIMPLES - sem círculos, só gradiente suave
                    float moonGlow = 1.0 - smoothstep(0.0, 0.45, distToMoon); // Brilho radial suave
                    
                    // Pulso lunar suave
                    float lunarPulse = sin(t * 1.5) * 0.3 + 1.0;
                    
                    return moonGlow * lunarPulse * timeDecay * 0.8; // Brilho forte e simples
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec3 color = vec3(0.0);
                    float alpha = 0.0;
                    
                    vec3 vignetteColor = vec3(0.0, 0.0, 0.0);
                    vec3 beastColor = vec3(0.03, 0.03, 0.03);
                    vec3 glowColor = vec3(1.0, 1.0, 1.0); // Branco puro para a lua
                    
                    float vignette = createVignette(uv, time);
                    if (vignette > 0.0) {
                        color += vignetteColor * vignette;
                        alpha += vignette;
                    }
                    
                    float lines = marginLines(uv, time);
                    if (lines > 0.0) {
                        // Olhos vermelhos específicos (MANTENDO LÓGICA ORIGINAL)
                        vec2 leftEyeCenter = vec2(0.45, 0.5);   // Coordenadas atualizadas
                        vec2 rightEyeCenter = vec2(0.55, 0.5);  // Coordenadas atualizadas
                        
                        float distToLeftEye = length(uv - leftEyeCenter);
                        float distToRightEye = length(uv - rightEyeCenter);
                        
                        if (distToLeftEye < 0.045 || distToRightEye < 0.045) { // Aumentado para olhos maiores
                            // Região dos olhos - usar laranja-avermelhado (COR ORIGINAL)
                            color += vec3(0.9, 0.3, 0.1) * lines;
                        } else {
                            // Outras regiões
                            color += beastColor * lines;
                        }
                        alpha += lines * 0.9;
                    }
                    
                    float glow = centralGlow(uv, time);
                    if (glow > 0.0) {
                        color += glowColor * glow;
                        alpha += glow * 0.8; // Brilho da lua bem visível
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

console.log("🎨 Sistema de Vinhetas Avançadas v4.0 - PARTE 3 carregado!");
console.log(`   - ${Object.keys(window.ATTACK_VIGNETTES).length} vinhetas totais disponíveis`);
console.log("   - Guerreiro (3), Berserker (4), Lobisomem (4) implementados com shaders temáticos");
console.log("   - Efeitos únicos: Golpes, Fúria, Sangue, Garras, Mordidas, Lua, Olhos Bestiais");