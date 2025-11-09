// shaders-attacks5.js - Shaders part 5
// Adiciona mais shaders ao dicionário existente

// SHADERS PRESENTES: FISSION, TEMPEST, SINGULARITY, PURIFIER, DEVASTATION, EXECUTION, FRENZY, ANNIHILATION, RAMPAGE, TEMPORAL

Object.assign(window.BOSS_DAMAGE_SHADERS, {

    // ========================================
    // 💥 FISSION/FISSÃO - Fissão Arcana
    // ========================================
    "fission_damage": {
        duration: 1600,
        name: "Fissão Arcana",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.5;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de fissão da realidade
            const fissionFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção de fissão no centro
                    vec2 fissionCenter = center;
                    float fissionForce = exp(-dist * 6.0) * intensity;
                    vec2 distortedUV = uv + (uv - fissionCenter) * fissionForce * 0.3;
                    
                    // Rachaduras na realidade
                    float cracks = 0.0;
                    for(float i = 0.0; i < 8.0; i++) {
                        float crackAngle = (i / 8.0) * 6.28318 + time * 2.0;
                        vec2 crackDir = vec2(cos(crackAngle), sin(crackAngle));
                        
                        float crackDist = abs(dot(uv - center, vec2(-crackDir.y, crackDir.x)));
                        float crack = 1.0 - smoothstep(0.0, 0.02, crackDist);
                        crack *= sin(dot(uv - center, crackDir) * 30.0 + time * 10.0) * 0.5 + 0.5;
                        crack *= 1.0 - smoothstep(0.0, 0.4, dist);
                        cracks += crack;
                    }
                    
                    // Campo de energia instável
                    float energyField = sin(dist * 20.0 + time * 15.0) * 0.5 + 0.5;
                    energyField *= exp(-dist * 4.0);
                    energyField *= sin(time * 12.0) * 0.4 + 0.6;
                    
                    // Núcleo de fissão pulsante
                    float fissionCore = exp(-dist * 12.0);
                    fissionCore *= sin(time * 20.0) * 0.5 + 0.5;
                    
                    vec4 color = texture2D(uSampler, distortedUV);
                    
                    // Cores da fissão (azul-roxo energético)
                    vec3 fissionColor = vec3(0.4, 0.6, 1.0);
                    vec3 crackColor = vec3(1.0, 0.8, 0.9);
                    vec3 coreColor = vec3(1.0, 1.0, 1.0);
                    
                    color.rgb = mix(color.rgb, fissionColor, energyField * intensity * 0.5);
                    color.rgb += crackColor * cracks * intensity * 0.6;
                    color.rgb += coreColor * fissionCore * intensity * 0.7;
                    
                    color.a = intensity * (1.0 - smoothstep(0.25, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [fissionFilter];
            container.addChild(bg);
            
            // Átomo central se dividindo
            const atomCore = new PIXI.Graphics();
            container.addChild(atomCore);
            
            // Ondas de choque da fissão
            const shockwaves = new PIXI.Graphics();
            container.addChild(shockwaves);
            
            // Fragmentos energéticos orbitando
            const energyFragments = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 12; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0x66AAFF, 0.8);
                fragment.drawCircle(0, 0, 2 + Math.random() * 2);
                fragment.endFill();
                
                // Brilho energético
                fragment.lineStyle(1, 0xCCEEFF, 0.6);
                fragment.drawCircle(0, 0, 4 + Math.random() * 2);
                
                const orbit = i < 6 ? 0 : 1;
                const angle = ((i % 6) / 6) * Math.PI * 2;
                const radius = 30 + orbit * 20;
                
                fragment.x = centerX + Math.cos(angle) * radius;
                fragment.y = centerY + Math.sin(angle) * radius;
                fragment.baseAngle = angle;
                fragment.baseRadius = radius;
                fragment.orbitSpeed = orbit === 0 ? 0.1 : -0.08;
                fragment.orbit = orbit;
                
                fragments.push(fragment);
                energyFragments.addChild(fragment);
            }
            
            container.addChild(energyFragments);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                fissionFilter.uniforms.time = elapsed;
                fissionFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar átomo central se dividindo
                atomCore.clear();
                
                const coreAlpha = Math.sin(progress * Math.PI) * 0.8;
                const splitDistance = progress * 20;
                
                // Núcleo original (se dividindo)
                atomCore.beginFill(0x4488FF, coreAlpha);
                atomCore.drawCircle(centerX - splitDistance/2, centerY, 8 - progress * 3);
                atomCore.drawCircle(centerX + splitDistance/2, centerY, 8 - progress * 3);
                atomCore.endFill();
                
                // Elétrons orbitando
                for (let i = 0; i < 4; i++) {
                    const orbitAngle = (i / 4) * Math.PI * 2 + elapsed * 8;
                    const orbitRadius = 15 + Math.sin(elapsed * 4) * 3;
                    
                    atomCore.beginFill(0x88CCFF, coreAlpha * 0.8);
                    atomCore.drawCircle(
                        centerX + Math.cos(orbitAngle) * orbitRadius,
                        centerY + Math.sin(orbitAngle) * orbitRadius,
                        2
                    );
                    atomCore.endFill();
                }
                
                // Desenhar ondas de choque
                shockwaves.clear();
                
                for (let i = 0; i < 4; i++) {
                    const waveProgress = (elapsed * 3 + i * 0.5) % 2;
                    if (waveProgress < 1) {
                        const waveRadius = waveProgress * maxRadius * 0.8;
                        const waveAlpha = (1 - waveProgress) * Math.sin(progress * Math.PI) * 0.5;
                        const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                        
                        if (waveAlpha > 0 && fadeAlpha > 0) {
                            // Onda principal
                            shockwaves.lineStyle(4, 0x4488FF, waveAlpha * fadeAlpha);
                            shockwaves.drawCircle(centerX, centerY, waveRadius);
                            
                            // Onda secundária
                            shockwaves.lineStyle(2, 0xCCEEFF, waveAlpha * fadeAlpha * 0.6);
                            shockwaves.drawCircle(centerX, centerY, waveRadius + 3);
                        }
                    }
                }
                
                // Animar fragmentos energéticos
                fragments.forEach((fragment, index) => {
                    fragment.baseAngle += fragment.orbitSpeed;
                    
                    // Afastamento gradual durante a fissão
                    const expansionFactor = 1 + progress * 0.5;
                    fragment.x = centerX + Math.cos(fragment.baseAngle) * fragment.baseRadius * expansionFactor;
                    fragment.y = centerY + Math.sin(fragment.baseAngle) * fragment.baseRadius * expansionFactor;
                    
                    // Brilho pulsante
                    fragment.scale.set(1 + Math.sin(elapsed * 6 + index) * 0.3);
                    
                    const distFromCenter = Math.sqrt((fragment.x - centerX) ** 2 + (fragment.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    fragment.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🌪️ TEMPEST/TEMPESTADE - Tempestade Elemental
    // ========================================
    "tempest_damage": {
        duration: 2000,
        name: "Tempestade Elemental",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.5;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de tempestade multi-elemental
            const tempestFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    
                    // Vórtice central da tempestade
                    float vortexAngle = angle + time * 8.0 * (1.5 - dist);
                    float vortexRadius = dist + sin(vortexAngle * 6.0) * 0.03 * (1.0 - dist);
                    vec2 vortexUV = center + vec2(cos(vortexAngle), sin(vortexAngle)) * vortexRadius;
                    
                    // Elementos girando em camadas
                    float elementalStorm = 0.0;
                    
                    // Camada de fogo
                    float fireLayer = sin(angle * 3.0 + time * 12.0 + dist * 20.0) * 0.5 + 0.5;
                    fireLayer *= exp(-dist * 3.0);
                    
                    // Camada de gelo
                    float iceLayer = sin(angle * 4.0 - time * 8.0 + dist * 25.0) * 0.5 + 0.5;
                    iceLayer *= exp(-dist * 4.0);
                    
                    // Camada elétrica
                    float electricLayer = sin(angle * 6.0 + time * 15.0 + dist * 30.0) * 0.5 + 0.5;
                    electricLayer *= exp(-dist * 2.5);
                    
                    // Camada de vento
                    float windLayer = sin(angle * 8.0 - time * 20.0 + dist * 15.0) * 0.5 + 0.5;
                    windLayer *= exp(-dist * 3.5);
                    
                    elementalStorm = fireLayer + iceLayer + electricLayer + windLayer;
                    
                    // Olho da tempestade (calmo no centro)
                    float eyeOfStorm = smoothstep(0.0, 0.1, dist);
                    elementalStorm *= eyeOfStorm;
                    
                    vec4 color = texture2D(uSampler, vortexUV);
                    
                    // Cores elementares
                    vec3 fireColor = vec3(1.0, 0.4, 0.1) * fireLayer;
                    vec3 iceColor = vec3(0.4, 0.8, 1.0) * iceLayer;
                    vec3 electricColor = vec3(1.0, 1.0, 0.6) * electricLayer;
                    vec3 windColor = vec3(0.8, 0.9, 1.0) * windLayer;
                    
                    vec3 stormColor = (fireColor + iceColor + electricColor + windColor) * 0.25;
                    
                    color.rgb = mix(color.rgb, stormColor, elementalStorm * intensity * 0.6);
                    
                    // Centro brilhante da tempestade
                    float centerGlow = exp(-dist * 8.0) * (sin(time * 25.0) * 0.3 + 0.7);
                    color.rgb += vec3(1.0, 1.0, 1.0) * centerGlow * intensity * 0.5;
                    
                    color.a = intensity * (1.0 - smoothstep(0.3, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [tempestFilter];
            container.addChild(bg);
            
            // Núcleo elemental central
            const elementalCore = new PIXI.Graphics();
            container.addChild(elementalCore);
            
            // Camadas elementares girando
            const elementalLayers = new PIXI.Container();
            const layers = [];
            
            const elements = [
                { color: 0xFF4444, radius: 20, speed: 0.12, symbol: '🔥' },
                { color: 0x4444FF, radius: 30, speed: -0.09, symbol: '❄️' },
                { color: 0xFFFF44, radius: 40, speed: 0.15, symbol: '⚡' },
                { color: 0x44FFFF, radius: 50, speed: -0.06, symbol: '💨' }
            ];
            
            elements.forEach((element, index) => {
                const layer = new PIXI.Container();
                const orbs = [];
                
                for (let i = 0; i < 6; i++) {
                    const orb = new PIXI.Graphics();
                    orb.beginFill(element.color, 0.7);
                    orb.drawCircle(0, 0, 3 + Math.random());
                    orb.endFill();
                    
                    // Brilho elemental
                    orb.lineStyle(1, element.color, 0.4);
                    orb.drawCircle(0, 0, 6);
                    
                    const angle = (i / 6) * Math.PI * 2;
                    orb.x = centerX + Math.cos(angle) * element.radius;
                    orb.y = centerY + Math.sin(angle) * element.radius;
                    orb.baseAngle = angle;
                    
                    orbs.push(orb);
                    layer.addChild(orb);
                }
                
                layers.push({ container: layer, orbs: orbs, element: element });
                elementalLayers.addChild(layer);
            });
            
            container.addChild(elementalLayers);
            
            // Raios conectando elementos
            const elementalConnections = new PIXI.Graphics();
            container.addChild(elementalConnections);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.0, 1);
                
                tempestFilter.uniforms.time = elapsed;
                tempestFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar núcleo elemental pulsante
                elementalCore.clear();
                
                const coreSize = 12 + Math.sin(elapsed * 8) * 4;
                const coreAlpha = Math.sin(progress * Math.PI) * 0.8;
                
                // Núcleo multi-colorido
                for (let i = 0; i < 4; i++) {
                    const segmentAngle = (i / 4) * Math.PI * 2;
                    const nextAngle = ((i + 1) / 4) * Math.PI * 2;
                    
                    elementalCore.beginFill(elements[i].color, coreAlpha);
                    elementalCore.moveTo(centerX, centerY);
                    
                    for (let j = 0; j <= 8; j++) {
                        const angle = segmentAngle + (nextAngle - segmentAngle) * (j / 8);
                        const x = centerX + Math.cos(angle) * coreSize;
                        const y = centerY + Math.sin(angle) * coreSize;
                        elementalCore.lineTo(x, y);
                    }
                    
                    elementalCore.lineTo(centerX, centerY);
                    elementalCore.endFill();
                }
                
                // Animar camadas elementares
                layers.forEach((layer, layerIndex) => {
                    layer.orbs.forEach((orb, orbIndex) => {
                        orb.baseAngle += layer.element.speed;
                        orb.x = centerX + Math.cos(orb.baseAngle) * layer.element.radius;
                        orb.y = centerY + Math.sin(orb.baseAngle) * layer.element.radius;
                        
                        // Pulsação individual
                        orb.scale.set(1 + Math.sin(elapsed * 6 + orbIndex + layerIndex) * 0.2);
                        
                        const distFromCenter = Math.sqrt((orb.x - centerX) ** 2 + (orb.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        orb.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                    });
                });
                
                // Desenhar conexões entre elementos
                elementalConnections.clear();
                
                if (progress > 0.3) {
                    const connectionAlpha = Math.sin(progress * Math.PI) * 0.4;
                    
                    layers.forEach((fromLayer, fromIndex) => {
                        layers.forEach((toLayer, toIndex) => {
                            if (fromIndex < toIndex) {
                                fromLayer.orbs.forEach((fromOrb, orbIndex) => {
                                    const toOrb = toLayer.orbs[orbIndex];
                                    
                                    if (Math.sin(elapsed * 4 + fromIndex + toIndex + orbIndex) > 0.5) {
                                        elementalConnections.lineStyle(2, 0xFFFFFF, connectionAlpha);
                                        elementalConnections.moveTo(fromOrb.x, fromOrb.y);
                                        elementalConnections.lineTo(toOrb.x, toOrb.y);
                                    }
                                });
                            }
                        });
                    });
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🌌 SINGULARITY/SINGULARIDADE - Singularidade Arcana
    // ========================================
    "singularity_damage": {
        duration: 2200,
        name: "Singularidade Arcana",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.5;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de singularidade com distorção extrema
            const singularityFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção gravitacional extrema
                    vec2 dir = normalize(uv - center);
                    float gravityForce = intensity * exp(-dist * 2.0);
                    float warpStrength = gravityForce * 0.8;
                    
                    // Múltiplas camadas de distorção
                    vec2 warpedUV = uv;
                    for(float i = 1.0; i <= 3.0; i++) {
                        float warpRadius = dist - warpStrength * (sin(time * 5.0 + i) * 0.3 + 0.7) / i;
                        warpedUV = center + dir * warpRadius;
                    }
                    
                    // Horizonte de eventos
                    float eventHorizon = 1.0 - smoothstep(0.0, 0.12, dist);
                    
                    // Disco de acreção espiral
                    float spiralAngle = atan(dir.y, dir.x) + time * 10.0 * (1.0 - dist);
                    float accretionDisk = sin(spiralAngle * 4.0 + dist * 40.0) * 0.5 + 0.5;
                    accretionDisk *= smoothstep(0.1, 0.4, dist) * (1.0 - smoothstep(0.4, 0.8, dist));
                    
                    // Radiação Hawking
                    float hawkingRadiation = 0.0;
                    for(float i = 0.0; i < 8.0; i++) {
                        float radiation = sin(dist * (25.0 + i * 5.0) - time * (15.0 + i * 2.0)) * 0.5 + 0.5;
                        radiation *= exp(-dist * (2.0 + i * 0.5));
                        hawkingRadiation += radiation;
                    }
                    
                    // Lente gravitacional
                    float lensing = sin(dist * 50.0 + time * 20.0) * 0.02 * gravityForce;
                    vec2 lensedUV = warpedUV + vec2(lensing, -lensing);
                    
                    vec4 color = texture2D(uSampler, lensedUV);
                    
                    // Cores da singularidade
                    vec3 horizonColor = vec3(0.0, 0.0, 0.0);
                    vec3 accretionColor = vec3(1.0, 0.6, 0.2);
                    vec3 radiationColor = vec3(0.8, 0.4, 1.0);
                    
                    color.rgb = mix(color.rgb, horizonColor, eventHorizon * intensity);
                    color.rgb = mix(color.rgb, accretionColor, accretionDisk * intensity * 0.7);
                    color.rgb += radiationColor * hawkingRadiation * intensity * 0.3;
                    
                    // Brilho sobrenatural no centro
                    float centerGlow = exp(-dist * 15.0) * (sin(time * 30.0) * 0.4 + 0.6);
                    color.rgb += vec3(1.0, 0.8, 1.0) * centerGlow * intensity;
                    
                    color.a = intensity * (1.0 - smoothstep(0.35, 0.5, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [singularityFilter];
            container.addChild(bg);
            
            // Núcleo da singularidade
            const singularityCore = new PIXI.Graphics();
            container.addChild(singularityCore);
            
            // Matéria sendo sugada em espirais
            const matterSpirals = new PIXI.Container();
            const spiralParticles = [];
            
            for (let i = 0; i < 40; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x9966FF, 0.8);
                particle.drawCircle(0, 0, 1 + Math.random() * 2);
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = maxRadius * 0.8;
                particle.x = centerX + Math.cos(angle) * distance;
                particle.y = centerY + Math.sin(angle) * distance;
                particle.startAngle = angle;
                particle.currentDistance = distance;
                particle.spiralSpeed = 0.05 + Math.random() * 0.03;
                particle.inwardSpeed = 0.8 + Math.random() * 0.4;
                
                spiralParticles.push(particle);
                matterSpirals.addChild(particle);
            }
            
            container.addChild(matterSpirals);
            
            // Ondas gravitacionais
            const gravitationalWaves = new PIXI.Graphics();
            container.addChild(gravitationalWaves);
            
            // Jatos polares
            const polarJets = new PIXI.Graphics();
            container.addChild(polarJets);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.2, 1);
                
                singularityFilter.uniforms.time = elapsed;
                singularityFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar núcleo da singularidade
                singularityCore.clear();
                
                const coreAlpha = Math.sin(progress * Math.PI);
                
                // Horizonte de eventos
                singularityCore.beginFill(0x000000, coreAlpha * 0.9);
                singularityCore.drawCircle(centerX, centerY, 8 + Math.sin(elapsed * 15) * 2);
                singularityCore.endFill();
                
                // Anel de luz na borda do horizonte
                singularityCore.lineStyle(3, 0xFFFFFF, coreAlpha * 0.8);
                singularityCore.drawCircle(centerX, centerY, 12 + Math.sin(elapsed * 12) * 3);
                
                // Pulso energético central
                const pulseSize = 4 + Math.sin(elapsed * 20) * 2;
                singularityCore.beginFill(0xFFFFFF, coreAlpha * 0.6);
                singularityCore.drawCircle(centerX, centerY, pulseSize);
                singularityCore.endFill();
                
                // Animar partículas em espiral
                spiralParticles.forEach(particle => {
                    particle.startAngle += particle.spiralSpeed;
                    particle.currentDistance -= particle.inwardSpeed;
                    
                    if (particle.currentDistance < 10) {
                        particle.currentDistance = maxRadius * 0.8;
                        particle.startAngle = Math.random() * Math.PI * 2;
                    }
                    
                    particle.x = centerX + Math.cos(particle.startAngle) * particle.currentDistance;
                    particle.y = centerY + Math.sin(particle.startAngle) * particle.currentDistance;
                    
                    // Brilho baseado na proximidade
                    const proximity = 1 - (particle.currentDistance / (maxRadius * 0.8));
                    particle.scale.set(1 + proximity * 0.5);
                    
                    const distFromCenter = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    particle.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (0.5 + proximity * 0.5);
                });
                
                // Desenhar ondas gravitacionais
                gravitationalWaves.clear();
                
                for (let i = 0; i < 6; i++) {
                    const waveProgress = (elapsed * 1.5 + i * 0.3) % 1.8;
                    if (waveProgress < 1) {
                        const waveRadius = waveProgress * maxRadius * 0.9;
                        const waveAlpha = (1 - waveProgress) * Math.sin(progress * Math.PI) * 0.4;
                        const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                        
                        if (waveAlpha > 0 && fadeAlpha > 0) {
                            gravitationalWaves.lineStyle(2, 0x9966FF, waveAlpha * fadeAlpha);
                            gravitationalWaves.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                // Desenhar jatos polares
                if (progress > 0.4) {
                    polarJets.clear();
                    
                    const jetAlpha = Math.sin(progress * Math.PI) * 0.6;
                    const jetLength = maxRadius * 0.7;
                    
                    // Jato superior
                    polarJets.lineStyle(8, 0x66AAFF, jetAlpha * 0.3);
                    polarJets.moveTo(centerX, centerY);
                    polarJets.lineTo(centerX, centerY - jetLength);
                    
                    polarJets.lineStyle(4, 0xCCEEFF, jetAlpha * 0.6);
                    polarJets.moveTo(centerX, centerY);
                    polarJets.lineTo(centerX, centerY - jetLength);
                    
                    // Jato inferior
                    polarJets.lineStyle(8, 0x66AAFF, jetAlpha * 0.3);
                    polarJets.moveTo(centerX, centerY);
                    polarJets.lineTo(centerX, centerY + jetLength);
                    
                    polarJets.lineStyle(4, 0xCCEEFF, jetAlpha * 0.6);
                    polarJets.moveTo(centerX, centerY);
                    polarJets.lineTo(centerX, centerY + jetLength);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🔥✨ PURIFIER/PURIFICADOR - Chama Purificadora
    // ========================================
    "purifier_damage": {
        duration: 1800,
        name: "Chama Purificadora",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.5;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de chama sagrada purificadora
            const purifierFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Chama sagrada ondulante no centro
                    float flameHeight = 1.0 - smoothstep(0.0, 0.4, dist);
                    float flameWave = sin(uv.y * 15.0 + time * 8.0) * 0.02;
                    flameWave += sin(uv.x * 20.0 + time * 6.0) * 0.015;
                    
                    vec2 flameUV = uv + vec2(flameWave, flameWave * 0.5) * flameHeight;
                    
                    // Núcleo da chama (branco-dourado)
                    float flameCore = exp(-dist * 8.0);
                    flameCore *= sin(time * 12.0) * 0.3 + 0.7;
                    
                    // Camadas da chama
                    float innerFlame = 1.0 - smoothstep(0.0, 0.15, dist);
                    innerFlame *= sin(time * 8.0 + dist * 20.0) * 0.4 + 0.6;
                    
                    float middleFlame = 1.0 - smoothstep(0.1, 0.25, dist);
                    middleFlame *= sin(time * 6.0 + dist * 15.0) * 0.5 + 0.5;
                    
                    float outerFlame = 1.0 - smoothstep(0.2, 0.35, dist);
                    outerFlame *= sin(time * 4.0 + dist * 10.0) * 0.6 + 0.4;
                    
                    // Aura purificadora
                    float purifyingAura = exp(-dist * 3.0);
                    purifyingAura *= sin(time * 5.0) * 0.2 + 0.8;
                    
                    // Raios de purificação
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float purificationRays = 0.0;
                    
                    for(float i = 0.0; i < 8.0; i++) {
                        float rayAngle = (i / 8.0) * 6.28318 + time * 2.0;
                        float rayDiff = abs(angle - rayAngle);
                        rayDiff = min(rayDiff, 6.28318 - rayDiff);
                        
                        float ray = 1.0 - smoothstep(0.0, 0.2, rayDiff);
                        ray *= sin(dist * 20.0 + time * 10.0 + i * 2.0) * 0.5 + 0.5;
                        ray *= 1.0 - smoothstep(0.1, 0.4, dist);
                        purificationRays += ray;
                    }
                    
                    vec4 color = texture2D(uSampler, flameUV);
                    
                    // Cores da chama purificadora
                    vec3 coreColor = vec3(1.0, 1.0, 0.9);      // Branco-dourado
                    vec3 innerColor = vec3(1.0, 0.9, 0.6);     // Dourado claro
                    vec3 middleColor = vec3(1.0, 0.7, 0.3);    // Laranja dourado
                    vec3 outerColor = vec3(1.0, 0.5, 0.2);     // Laranja-vermelho
                    vec3 auraColor = vec3(1.0, 1.0, 0.8);      // Aura dourada
                    vec3 rayColor = vec3(1.0, 0.95, 0.7);      // Raios dourados
                    
                    color.rgb = mix(color.rgb, auraColor, purifyingAura * intensity * 0.4);
                    color.rgb = mix(color.rgb, outerColor, outerFlame * intensity * 0.5);
                    color.rgb = mix(color.rgb, middleColor, middleFlame * intensity * 0.6);
                    color.rgb = mix(color.rgb, innerColor, innerFlame * intensity * 0.7);
                    color.rgb += coreColor * flameCore * intensity * 0.8;
                    color.rgb += rayColor * purificationRays * intensity * 0.4;
                    
                    color.a = intensity * (1.0 - smoothstep(0.3, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [purifierFilter];
            container.addChild(bg);
            
            // Altar sagrado central
            const sacredAltar = new PIXI.Graphics();
            sacredAltar.beginFill(0xFFD700, 0.8);
            sacredAltar.drawRect(centerX - 20, centerY + 15, 40, 8); // Base
            sacredAltar.drawRect(centerX - 15, centerY + 10, 30, 8); // Meio
            sacredAltar.drawRect(centerX - 10, centerY + 5, 20, 8);  // Topo
            sacredAltar.endFill();
            
            // Chama principal no altar
            const mainFlame = new PIXI.Graphics();
            container.addChild(sacredAltar);
            container.addChild(mainFlame);
            
            // Círculos sagrados concêntricos
            const sacredCircles = new PIXI.Graphics();
            container.addChild(sacredCircles);
            
            // Partículas de luz sagrada ascendentes
            const holyLight = new PIXI.Container();
            const lightParticles = [];
            
            for (let i = 0; i < 30; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFFFFAA, 0.8);
                
                // Forma de chama pequena
                const flameSize = 2 + Math.random() * 2;
                particle.drawCircle(0, flameSize * 0.3, flameSize);
                particle.drawCircle(0, -flameSize * 0.5, flameSize * 0.7);
                particle.endFill();
                
                particle.x = centerX + (Math.random() - 0.5) * 60;
                particle.y = centerY + 25;
                particle.vy = -1 - Math.random() * 2;
                particle.vx = (Math.random() - 0.5) * 0.5;
                particle.life = Math.random() * 0.5;
                particle.maxLife = 1.0 + Math.random() * 0.5;
                particle.wavePhase = Math.random() * Math.PI * 2;
                
                lightParticles.push(particle);
                holyLight.addChild(particle);
            }
            
            container.addChild(holyLight);
            
            // Ondas de purificação
            const purificationWaves = new PIXI.Graphics();
            container.addChild(purificationWaves);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.8, 1);
                
                purifierFilter.uniforms.time = elapsed;
                purifierFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar altar sagrado
                sacredAltar.alpha = Math.sin(progress * Math.PI);
                
                // Desenhar chama principal no altar
                mainFlame.clear();
                
                const flameAlpha = Math.sin(progress * Math.PI) * 0.9;
                const flameHeight = 30 + Math.sin(elapsed * 6) * 8;
                
                // Chama principal ondulante
                mainFlame.beginFill(0xFFAA44, flameAlpha);
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const waveOffset = Math.sin(elapsed * 4 + i) * 3;
                    const x = centerX + Math.cos(angle) * (6 + waveOffset);
                    const y = centerY + 5 - (flameHeight * (1 - i / 8));
                    
                    if (i === 0) {
                        mainFlame.moveTo(x, y);
                    } else {
                        mainFlame.lineTo(x, y);
                    }
                }
                mainFlame.closePath();
                mainFlame.endFill();
                
                // Núcleo branco da chama
                mainFlame.beginFill(0xFFFFFF, flameAlpha * 0.8);
                mainFlame.drawCircle(centerX, centerY - 5, 4 + Math.sin(elapsed * 8) * 2);
                mainFlame.endFill();
                
                // Desenhar círculos sagrados
                sacredCircles.clear();
                
                for (let i = 0; i < 4; i++) {
                    const circleProgress = (elapsed * 1.5 + i * 0.5) % 2;
                    if (circleProgress < 1) {
                        const circleRadius = 20 + circleProgress * maxRadius * 0.5;
                        const circleAlpha = (1 - circleProgress) * Math.sin(progress * Math.PI) * 0.5;
                        const fadeAlpha = getFadeoutAlpha(circleRadius, maxRadius);
                        
                        if (circleAlpha > 0 && fadeAlpha > 0) {
                            sacredCircles.lineStyle(3, 0xFFD700, circleAlpha * fadeAlpha);
                            sacredCircles.drawCircle(centerX, centerY, circleRadius);
                            
                            // Símbolos de pureza nos círculos
                            for (let j = 0; j < 6; j++) {
                                const symbolAngle = (j / 6) * Math.PI * 2 + elapsed;
                                const symbolX = centerX + Math.cos(symbolAngle) * circleRadius;
                                const symbolY = centerY + Math.sin(symbolAngle) * circleRadius;
                                
                                sacredCircles.beginFill(0xFFFFAA, circleAlpha * fadeAlpha * 0.8);
                                sacredCircles.drawCircle(symbolX, symbolY, 2);
                                sacredCircles.endFill();
                            }
                        }
                    }
                }
                
                // Animar partículas de luz ascendentes
                lightParticles.forEach(particle => {
                    particle.life += 0.02;
                    if (particle.life > particle.maxLife) {
                        particle.life = 0;
                        particle.x = centerX + (Math.random() - 0.5) * 60;
                        particle.y = centerY + 25;
                        particle.vy = -1 - Math.random() * 2;
                    }
                    
                    particle.x += particle.vx + Math.sin(elapsed * 2 + particle.wavePhase) * 0.3;
                    particle.y += particle.vy;
                    particle.rotation += 0.02;
                    
                    // Mudança de cor com a altura
                    const heightRatio = Math.max(0, (centerY + 25) - particle.y) / 100;
                    if (heightRatio < 0.3) {
                        particle.tint = 0xFFAA44; // Laranja
                    } else if (heightRatio < 0.6) {
                        particle.tint = 0xFFDD77; // Dourado
                    } else {
                        particle.tint = 0xFFFFAA; // Amarelo claro
                    }
                    
                    const distFromCenter = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    particle.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - particle.life / particle.maxLife);
                });
                
                // Desenhar ondas de purificação
                purificationWaves.clear();
                
                for (let i = 0; i < 3; i++) {
                    const waveProgress = (elapsed * 2 + i * 0.6) % 1.5;
                    if (waveProgress < 1) {
                        const waveRadius = waveProgress * maxRadius * 0.8;
                        const waveAlpha = (1 - waveProgress) * Math.sin(progress * Math.PI) * 0.4;
                        const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                        
                        if (waveAlpha > 0 && fadeAlpha > 0) {
                            purificationWaves.lineStyle(4, 0xFFFFAA, waveAlpha * fadeAlpha);
                            purificationWaves.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 💀 DEVASTATION/DEVASTAÇÃO - Devastação Primordial
    // ========================================
    "devastation_damage": {
        duration: 1400,
        name: "Devastação Primordial",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.85;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de devastação com rachaduras e caos
            const devastationFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Ondas de choque violentas
                    float shockwave = sin(dist * 40.0 - time * 25.0) * 0.5 + 0.5;
                    shockwave *= exp(-dist * 2.0);
                    
                    // Distorção caótica
                    vec2 chaosDir = vec2(
                        sin(uv.x * 50.0 + time * 30.0),
                        cos(uv.y * 45.0 + time * 25.0)
                    ) * 0.03 * intensity * shockwave;
                    
                    vec2 distortedUV = uv + chaosDir;
                    
                    // Rachaduras irradiando do centro
                    float cracks = 0.0;
                    for(float i = 0.0; i < 12.0; i++) {
                        float crackAngle = (i / 12.0) * 6.28318 + sin(time * 8.0) * 0.3;
                        vec2 crackDir = vec2(cos(crackAngle), sin(crackAngle));
                        
                        float crackDist = abs(dot(uv - center, vec2(-crackDir.y, crackDir.x)));
                        float crack = 1.0 - smoothstep(0.0, 0.015, crackDist);
                        crack *= sin(dot(uv - center, crackDir) * 60.0 + time * 15.0) * 0.5 + 0.5;
                        crack *= 1.0 - smoothstep(0.0, 0.4, dist);
                        cracks += crack;
                    }
                    
                    // Campo de destruição central
                    float destructionField = exp(-dist * 3.0);
                    destructionField *= sin(time * 20.0) * 0.4 + 0.6;
                    
                    // Pulso de aniquilação
                    float annihilationPulse = exp(-dist * 8.0);
                    annihilationPulse *= pow(sin(time * 12.0) * 0.5 + 0.5, 3.0);
                    
                    vec4 color = texture2D(uSampler, distortedUV);
                    
                    // Cores da devastação (vermelho-laranja agressivo)
                    vec3 destructionColor = vec3(0.8, 0.2, 0.1);
                    vec3 crackColor = vec3(1.0, 0.3, 0.0);
                    vec3 pulseColor = vec3(1.0, 0.6, 0.2);
                    
                    color.rgb = mix(color.rgb, destructionColor, destructionField * intensity * 0.7);
                    color.rgb += crackColor * cracks * intensity * 0.8;
                    color.rgb += pulseColor * annihilationPulse * intensity * 0.9;
                    
                    // Flash de destruição
                    float destructionFlash = step(0.95, sin(time * 40.0)) * annihilationPulse;
                    color.rgb += vec3(1.0, 1.0, 1.0) * destructionFlash * intensity;
                    
                    color.a = intensity * (1.0 - smoothstep(0.25, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [devastationFilter];
            container.addChild(bg);
            
            // Fragmentos de destruição explodindo
            const destructionFragments = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 50; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0x992222, 0.8);
                
                // Fragmento irregular e agressivo
                const sides = 3 + Math.floor(Math.random() * 4);
                const points = [];
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const radius = 3 + Math.random() * 8;
                    const variation = 0.6 + Math.random() * 0.8;
                    points.push(
                        Math.cos(angle) * radius * variation,
                        Math.sin(angle) * radius * variation
                    );
                }
                fragment.drawPolygon(points);
                fragment.endFill();
                
                // Brilho incandescente
                fragment.lineStyle(1, 0xFF4422, 0.6);
                fragment.drawPolygon(points.map(p => p * 1.2));
                
                fragment.x = centerX;
                fragment.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                fragment.vx = Math.cos(angle) * speed;
                fragment.vy = Math.sin(angle) * speed;
                fragment.rotSpeed = (Math.random() - 0.5) * 0.8;
                fragment.gravity = 0.3;
                fragment.life = 0;
                fragment.maxLife = 0.9 + Math.random() * 0.4;
                
                fragments.push(fragment);
                destructionFragments.addChild(fragment);
            }
            
            container.addChild(destructionFragments);
            
            // Crateras de impacto
            const impactCrators = new PIXI.Graphics();
            container.addChild(impactCrators);
            
            // Ondas de choque violentas
            const violentShockwaves = new PIXI.Graphics();
            container.addChild(violentShockwaves);
            
            // Tremor da tela
            const originalX = container.x;
            const originalY = container.y;
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.4, 1);
                
                devastationFilter.uniforms.time = elapsed;
                devastationFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Tremor violento da tela
                if (progress < 0.6) {
                    const shakeIntensity = (1 - progress / 0.4) * 15;
                    container.x = originalX + (Math.random() - 0.5) * shakeIntensity;
                    container.y = originalY + (Math.random() - 0.5) * shakeIntensity;
                } else {
                    container.x = originalX;
                    container.y = originalY;
                }
                
                // Animar fragmentos explosivos
                fragments.forEach(fragment => {
                    fragment.x += fragment.vx;
                    fragment.y += fragment.vy;
                    fragment.vy += fragment.gravity;
                    fragment.rotation += fragment.rotSpeed;
                    fragment.life += 0.04;
                    
                    // Desaceleração por atrito
                    fragment.vx *= 0.98;
                    fragment.vy *= 0.98;
                    
                    const distFromCenter = Math.sqrt((fragment.x - centerX) ** 2 + (fragment.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    fragment.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - fragment.life / fragment.maxLife);
                });
                
                // Desenhar crateras de impacto
                impactCrators.clear();
                
                if (progress > 0.2) {
                    const cratorAlpha = Math.sin(progress * Math.PI) * 0.6;
                    
                    // Cratera principal
                    impactCrators.beginFill(0x330000, cratorAlpha);
                    impactCrators.drawCircle(centerX, centerY, 45 + Math.sin(elapsed * 18) * 15);
                    impactCrators.endFill();
                    
                    // Crateras menores ao redor
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2 + elapsed * 2;
                        const distance = 35 + Math.sin(elapsed * 4 + i) * 10;
                        const cratorX = centerX + Math.cos(angle) * distance;
                        const cratorY = centerY + Math.sin(angle) * distance;
                        const cratorSize = 8 + Math.random() * 6;
                        
                        impactCrators.beginFill(0x441111, cratorAlpha * 0.8);
                        impactCrators.drawCircle(cratorX, cratorY, cratorSize);
                        impactCrators.endFill();
                    }
                }
                
                // Desenhar ondas de choque violentas
                violentShockwaves.clear();
                
                for (let i = 0; i < 5; i++) {
                    const waveProgress = (elapsed * 4 + i * 0.2) % 1.2;
                    if (waveProgress < 1) {
                        const waveRadius = waveProgress * maxRadius * 0.9;
                        const waveAlpha = Math.pow(1 - waveProgress, 2) * Math.sin(progress * Math.PI) * 0.8;
                        const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                        
                        if (waveAlpha > 0 && fadeAlpha > 0) {
                            // Onda principal violenta
                            violentShockwaves.lineStyle(8, 0xFF2200, waveAlpha * fadeAlpha);
                            violentShockwaves.drawCircle(centerX, centerY, waveRadius);
                            
                            // Onda secundária
                            violentShockwaves.lineStyle(4, 0xFF6644, waveAlpha * fadeAlpha * 0.7);
                            violentShockwaves.drawCircle(centerX, centerY, waveRadius + 15);
                        }
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🗡️💀 EXECUTION/EXECUÇÃO - Execução nas Sombras
    // ========================================
    "execution_damage": {
        duration: 1200,
        name: "Execução nas Sombras",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.8;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de execução mortal
            const executionFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Pulso de morte instantânea
                    float deathPulse = exp(-dist * 6.0);
                    deathPulse *= step(0.8, sin(time * 50.0)) * intensity;
                    
                    // Campo de execução
                    float executionField = 1.0 - smoothstep(0.0, 0.3, dist);
                    executionField *= sin(time * 15.0) * 0.4 + 0.6;
                    
                    // Distorção de lâmina cortando
                    vec2 bladeDir = vec2(cos(time * 10.0), sin(time * 10.0));
                    float bladeCut = abs(dot(uv - center, bladeDir));
                    bladeCut = 1.0 - smoothstep(0.0, 0.05, bladeCut);
                    bladeCut *= sin(time * 25.0) * 0.5 + 0.5;
                    
                    // Sombras convergindo
                    float shadows = 0.0;
                    for(float i = 0.0; i < 8.0; i++) {
                        vec2 shadowDir = vec2(
                            cos((i / 8.0) * 6.28318 + time * 5.0),
                            sin((i / 8.0) * 6.28318 + time * 5.0)
                        );
                        float shadowIntensity = max(0.0, dot(normalize(uv - center), shadowDir));
                        shadowIntensity *= 1.0 - smoothstep(0.0, 0.4, dist);
                        shadows += shadowIntensity;
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores da execução (vermelho sangue e preto)
                    vec3 deathColor = vec3(0.1, 0.0, 0.0);
                    vec3 bloodColor = vec3(0.8, 0.0, 0.0);
                    vec3 bladeColor = vec3(1.0, 1.0, 1.0);
                    
                    color.rgb = mix(color.rgb, deathColor, shadows * intensity * 0.6);
                    color.rgb = mix(color.rgb, bloodColor, executionField * intensity * 0.7);
                    color.rgb += bladeColor * bladeCut * intensity * 0.8;
                    color.rgb += vec3(1.0, 0.9, 0.9) * deathPulse;
                    
                    color.a = intensity * (1.0 - smoothstep(0.2, 0.4, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [executionFilter];
            container.addChild(bg);
            
            // Lâmina executora aparecendo instantaneamente
            const executionBlade = new PIXI.Graphics();
            container.addChild(executionBlade);
            
            // X de morte marcando o alvo
            const deathMark = new PIXI.Graphics();
            container.addChild(deathMark);
            
            // Explosão de sangue no impacto
            const bloodExplosion = new PIXI.Container();
            const bloodDroplets = [];
            
            for (let i = 0; i < 65; i++) {
                const droplet = new PIXI.Graphics();
                droplet.beginFill(0xAA0000, 0.9);
                droplet.drawCircle(0, 0, 1 + Math.random() * 3);
                droplet.endFill();
                
                droplet.x = centerX;
                droplet.y = centerY;
                droplet.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 6;
                droplet.vx = Math.cos(angle) * speed;
                droplet.vy = Math.sin(angle) * speed;
                droplet.gravity = 0.6;
                droplet.life = 0;
                droplet.maxLife = 0.9;
                
                bloodDroplets.push(droplet);
                bloodExplosion.addChild(droplet);
            }
            
            container.addChild(bloodExplosion);
            
            // Sombras convergindo violentamente
            const convergingShadows = new PIXI.Graphics();
            container.addChild(convergingShadows);
            
            // Animação
            let executionTriggered = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.2, 1);
                
                executionFilter.uniforms.time = elapsed;
                executionFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar marca de morte (X)
                if (progress > 0.3) {
                    deathMark.clear();
                    
                    const markAlpha = Math.sin(progress * Math.PI) * 0.45;
                    const markSize = 30 + Math.sin(elapsed * 20) * 5;
                    
                    deathMark.lineStyle(6, 0x880000, markAlpha);
                    
                    // X da morte
                    deathMark.moveTo(centerX - markSize, centerY - markSize);
                    deathMark.lineTo(centerX + markSize, centerY + markSize);
                    deathMark.moveTo(centerX + markSize, centerY - markSize);
                    deathMark.lineTo(centerX - markSize, centerY + markSize);
                    
                    // Círculo ao redor
                    deathMark.lineStyle(3, 0xAA0000, markAlpha * 0.6);
                    deathMark.drawCircle(centerX, centerY, markSize + 10);
                }
                
                // Lâmina executora (aparece e some rapidamente)
                if (progress > 0.45 && progress < 0.55) {
                    executionBlade.clear();
                    
                    const bladeAlpha = Math.sin((progress - 0.3) / 0.2 * Math.PI) * 0.9;
                    const bladeLength = maxRadius * 0.8;
                    
                    // Lâmina gigante cortando
                    for (let i = 0; i < 4; i++) {
                        const angle = (i / 4) * Math.PI * 2 + elapsed * 30;
                        const thickness = 8 - i * 1.5;
                        const alpha = bladeAlpha * (1 - i * 0.2);
                        
                        executionBlade.lineStyle(thickness, 0xCCCCCC, alpha);
                        executionBlade.moveTo(centerX, centerY);
                        executionBlade.lineTo(
                            centerX + Math.cos(angle) * bladeLength,
                            centerY + Math.sin(angle) * bladeLength
                        );
                    }
                    
                } else if (progress >= 0.5 && !executionTriggered) {
                    executionTriggered = true;
                    bloodDroplets.forEach(droplet => droplet.visible = true);
                    executionBlade.clear();
                }
                
                // Animar sombras convergindo violentamente
                convergingShadows.clear();
                
                const shadowAlpha = Math.sin(progress * Math.PI) * 0.7;
                
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + elapsed * 8;
                    const convergence = Math.min(progress * 3, 1);
                    const shadowLength = maxRadius * 0.7 * (1 - convergence * 0.8);
                    
                    // Sombra principal
                    convergingShadows.lineStyle(8, 0x220000, shadowAlpha * 0.6);
                    convergingShadows.moveTo(
                        centerX + Math.cos(angle) * maxRadius * 0.8,
                        centerY + Math.sin(angle) * maxRadius * 0.8
                    );
                    convergingShadows.lineTo(
                        centerX + Math.cos(angle) * shadowLength,
                        centerY + Math.sin(angle) * shadowLength
                    );
                    
                    // Sombra interna
                    convergingShadows.lineStyle(4, 0x440000, shadowAlpha * 0.8);
                    convergingShadows.moveTo(
                        centerX + Math.cos(angle) * maxRadius * 0.8,
                        centerY + Math.sin(angle) * maxRadius * 0.8
                    );
                    convergingShadows.lineTo(
                        centerX + Math.cos(angle) * shadowLength,
                        centerY + Math.sin(angle) * shadowLength
                    );
                }
                
                // Animar explosão de sangue
                bloodDroplets.forEach(droplet => {
                    if (droplet.visible) {
                        droplet.x += droplet.vx;
                        droplet.y += droplet.vy;
                        droplet.vy += droplet.gravity;
                        droplet.life += 0.0001;
                        
                        if (droplet.life > droplet.maxLife) {
                            droplet.visible = false;
                        }
                        
                        const distFromCenter = Math.sqrt((droplet.x - centerX) ** 2 + (droplet.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        droplet.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - droplet.life / droplet.maxLife);
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🐺🌙 FRENZY/FRENESI - Frenesi Lunar
    // ========================================
    "frenzy_damage": {
        duration: 1600,
        name: "Frenesi Lunar",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.85;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de frenesi bestial
            const frenzyFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção selvagem e caótica
                    float chaos = sin(uv.x * 60.0 + time * 40.0) * cos(uv.y * 55.0 + time * 35.0);
                    chaos *= exp(-dist * 2.0) * intensity * 0.04;
                    
                    vec2 chaosUV = uv + vec2(chaos, chaos * 0.7);
                    
                    // Aura bestial pulsante
                    float bestialAura = exp(-dist * 3.0);
                    bestialAura *= pow(sin(time * 12.0) * 0.5 + 0.5, 2.0);
                    
                    // Marcas de garra em todas as direções
                    float clawMarks = 0.0;
                    for(float i = 0.0; i < 16.0; i++) {
                        float clawAngle = (i / 16.0) * 6.28318 + sin(time * 8.0) * 0.5;
                        vec2 clawDir = vec2(cos(clawAngle), sin(clawAngle));
                        
                        float clawDist = abs(dot(uv - center, vec2(-clawDir.y, clawDir.x)));
                        float claw = 1.0 - smoothstep(0.0, 0.02, clawDist);
                        claw *= sin(dot(uv - center, clawDir) * 80.0 + time * 20.0 + i) * 0.5 + 0.5;
                        claw *= 1.0 - smoothstep(0.0, 0.35, dist);
                        clawMarks += claw;
                    }
                    
                    // Lua cheia fantasmagórica
                    float moonGlow = exp(-dist * 4.0);
                    moonGlow *= sin(time * 6.0) * 0.3 + 0.7;
                    
                    // Fúria crescente
                    float rage = sin(time * 25.0) * 0.5 + 0.5;
                    rage *= exp(-dist * 5.0);
                    
                    vec4 color = texture2D(uSampler, chaosUV);
                    
                    // Cores do frenesi (vermelho sangue e prata lunar)
                    vec3 rageColor = vec3(0.9, 0.1, 0.1);
                    vec3 moonColor = vec3(0.8, 0.8, 0.9);
                    vec3 clawColor = vec3(0.7, 0.0, 0.0);
                    vec3 furyColor = vec3(1.0, 0.2, 0.0);
                    
                    color.rgb = mix(color.rgb, moonColor, moonGlow * intensity * 0.4);
                    color.rgb = mix(color.rgb, rageColor, bestialAura * intensity * 0.6);
                    color.rgb += clawColor * clawMarks * intensity * 0.7;
                    color.rgb += furyColor * rage * intensity * 0.5;
                    
                    color.a = intensity * (1.0 - smoothstep(0.25, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [frenzyFilter];
            container.addChild(bg);
            
            // Lua sangrenta no fundo
            const bloodyMoon = new PIXI.Graphics();
            container.addChild(bloodyMoon);
            
            // Garras frenéticas atacando de todas as direções
            const frenziedClaws = new PIXI.Graphics();
            container.addChild(frenziedClaws);
            
            // Pelos voando violentamente
            const wildFur = new PIXI.Container();
            const furParticles = [];
            
            for (let i = 0; i < 40; i++) {
                const fur = new PIXI.Graphics();
                fur.lineStyle(2, 0x8B4513, 0.8);
                const furLength = 6 + Math.random() * 10;
                fur.moveTo(0, 0);
                fur.lineTo(furLength, (Math.random() - 0.5) * 4);
                
                fur.x = centerX + (Math.random() - 0.5) * maxRadius;
                fur.y = centerY + (Math.random() - 0.5) * maxRadius;
                fur.rotation = Math.random() * Math.PI * 2;
                
                const speed = 5 + Math.random() * 8;
                const angle = Math.random() * Math.PI * 2;
                fur.vx = Math.cos(angle) * speed;
                fur.vy = Math.sin(angle) * speed;
                fur.rotSpeed = (Math.random() - 0.5) * 0.6;
                fur.life = 0;
                fur.maxLife = 0.8;
                
                furParticles.push(fur);
                wildFur.addChild(fur);
            }
            
            container.addChild(wildFur);
            
            // Sangue espirrando
            const bloodSplatter = new PIXI.Container();
            const bloodParticles = [];
            
            for (let i = 0; i < 25; i++) {
                const blood = new PIXI.Graphics();
                blood.beginFill(0x990000, 0.9);
                blood.drawCircle(0, 0, 2 + Math.random() * 4);
                blood.endFill();
                
                blood.x = centerX;
                blood.y = centerY;
                blood.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 8;
                blood.vx = Math.cos(angle) * speed;
                blood.vy = Math.sin(angle) * speed;
                blood.life = 0;
                blood.maxLife = 1.0;
                
                bloodParticles.push(blood);
                bloodSplatter.addChild(blood);
            }
            
            container.addChild(bloodSplatter);
            
            // Animação
            let bloodActivated = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                frenzyFilter.uniforms.time = elapsed;
                frenzyFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar lua sangrenta
                bloodyMoon.clear();
                
                const moonAlpha = Math.sin(progress * Math.PI) * 0.6;
                const moonSize = 20 + Math.sin(elapsed * 1.2) * 5.2;
                
                // Lua com crateras
                bloodyMoon.beginFill(0xBB8888, moonAlpha);
                bloodyMoon.drawCircle(centerX - 25, centerY - 25, moonSize);
                bloodyMoon.endFill();
                
                // Manchas de sangue na lua
                bloodyMoon.beginFill(0x880000, moonAlpha * 0.8);
                bloodyMoon.drawCircle(centerX - 30, centerY - 30, moonSize * 0.3);
                bloodyMoon.drawCircle(centerX - 15, centerY - 20, moonSize * 0.2);
                bloodyMoon.endFill();
                
                // Desenhar garras frenéticas
                frenziedClaws.clear();
                
                const clawAlpha = Math.sin(progress * Math.PI) * 0.8;
                
                // Múltiplas garras atacando violentamente
                for (let set = 0; set < 6; set++) {
                    const setAngle = (set / 6) * Math.PI * 2 + elapsed * 12;
                    const setDistance = 20 + set * 8;
                    
                    for (let claw = 0; claw < 4; claw++) {
                        const clawAngle = setAngle + (claw * 0.15);
                        const startX = centerX + Math.cos(clawAngle) * setDistance;
                        const startY = centerY + Math.sin(clawAngle) * setDistance;
                        const endX = centerX + Math.cos(clawAngle) * (setDistance + 25);
                        const endY = centerY + Math.sin(clawAngle) * (setDistance + 25);
                        
                        // Trilha da garra
                        frenziedClaws.lineStyle(4, 0x660000, clawAlpha);
                        frenziedClaws.moveTo(startX, startY);
                        frenziedClaws.lineTo(endX, endY);
                        
                        // Brilho da garra
                        frenziedClaws.lineStyle(2, 0xAA2222, clawAlpha * 0.7);
                        frenziedClaws.moveTo(startX, startY);
                        frenziedClaws.lineTo(endX, endY);
                    }
                }
                
                // Animar pelos voando
                furParticles.forEach(fur => {
                    fur.x += fur.vx;
                    fur.y += fur.vy;
                    fur.rotation += fur.rotSpeed;
                    fur.life += 0.03;
                    
                    // Turbulência
                    fur.vx += (Math.random() - 0.5) * 0.5;
                    fur.vy += (Math.random() - 0.5) * 0.5;
                    
                    if (fur.life > fur.maxLife) {
                        fur.life = 0;
                        fur.x = centerX + (Math.random() - 0.5) * 60;
                        fur.y = centerY + (Math.random() - 0.5) * 60;
                        const speed = 5 + Math.random() * 8;
                        const angle = Math.random() * Math.PI * 2;
                        fur.vx = Math.cos(angle) * speed;
                        fur.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((fur.x - centerX) ** 2 + (fur.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    fur.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - fur.life / fur.maxLife);
                });
                
                // Ativar sangue no ápice do frenesi
                if (progress > 0.4 && !bloodActivated) {
                    bloodActivated = true;
                    bloodParticles.forEach(blood => blood.visible = true);
                }
                
                // Animar sangue
                bloodParticles.forEach(blood => {
                    if (blood.visible) {
                        blood.x += blood.vx;
                        blood.y += blood.vy;
                        blood.life += 0.045;
                        
                        if (blood.life > blood.maxLife) {
                            blood.life = 0;
                            blood.x = centerX + (Math.random() - 0.5) * 30;
                            blood.y = centerY + (Math.random() - 0.5) * 30;
                        }
                        
                        const distFromCenter = Math.sqrt((blood.x - centerX) ** 2 + (blood.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        blood.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - blood.life / blood.maxLife);
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // ⚡💥 ANNIHILATION/ANIQUILAÇÃO - Ataques Ultimate
    // ========================================
    "annihilation_damage": {
        duration: 2000,
        name: "Aniquilação Total",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.7;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader de aniquilação completa
            const annihilationFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Campo de aniquilação expandindo
                    float annihilationField = 1.0 - smoothstep(0.0, 0.5, dist);
                    annihilationField *= pow(sin(time * 8.0) * 0.5 + 0.5, 2.0);
                    
                    // Múltiplas ondas destrutivas
                    float destructiveWaves = 0.0;
                    for(float i = 1.0; i < 8.0; i++) {
                        float wave = sin(dist * (20.0 + i * 5.0) - time * (15.0 + i * 3.0)) * 0.5 + 0.5;
                        wave *= exp(-dist * (1.0 + i * 0.2));
                        destructiveWaves += wave;
                    }
                    
                    // Distorção do espaço-tempo
                    float spacetimeWarp = sin(dist * 30.0 + time * 20.0) * 0.1;
                    spacetimeWarp *= exp(-dist * 2.0) * intensity;
                    
                    vec2 warpedUV = uv + vec2(spacetimeWarp, spacetimeWarp * 0.7);
                    
                    // Núcleo de energia pura
                    float energyCore = exp(-dist * 10.0);
                    energyCore *= pow(sin(time * 30.0) * 0.5 + 0.5, 3.0);
                    
                    // Raios de destruição em todas as direções
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float destructionRays = 0.0;
                    
                    for(float i = 0.0; i < 24.0; i++) {
                        float rayAngle = (i / 24.0) * 6.28318 + time * 5.0;
                        float rayDiff = abs(angle - rayAngle);
                        rayDiff = min(rayDiff, 6.28318 - rayDiff);
                        
                        float ray = 1.0 - smoothstep(0.0, 0.05, rayDiff);
                        ray *= sin(dist * 40.0 + time * 25.0 + i * 2.0) * 0.5 + 0.5;
                        ray *= 1.0 - smoothstep(0.0, 0.4, dist);
                        destructionRays += ray;
                    }
                    
                    vec4 color = texture2D(uSampler, warpedUV);
                    
                    // Cores da aniquilação (branco puro devastador)
                    vec3 annihilationColor = vec3(1.0, 1.0, 1.0);
                    vec3 waveColor = vec3(1.0, 0.8, 0.6);
                    vec3 rayColor = vec3(1.0, 0.9, 0.8);
                    vec3 coreColor = vec3(1.0, 1.0, 1.0);
                    
                    color.rgb = mix(color.rgb, annihilationColor, annihilationField * intensity * 0.8);
                    color.rgb += waveColor * destructiveWaves * intensity * 0.3;
                    color.rgb += rayColor * destructionRays * intensity * 0.5;
                    color.rgb += coreColor * energyCore * intensity * 1.0;
                    
                    // Flash de aniquilação total
                    float totalAnnihilation = step(0.98, sin(time * 15.0)) * energyCore;
                    color.rgb += vec3(2.0, 2.0, 2.0) * totalAnnihilation * intensity;
                    
                    color.a = intensity * (1.0 - smoothstep(0.35, 0.5, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [annihilationFilter];
            container.addChild(bg);
            
            // Orbe de energia destrutiva no centro
            const destructiveOrb = new PIXI.Graphics();
            container.addChild(destructiveOrb);
            
            // Ondas de choque múltiplas e violentas
            const multipleShockwaves = new PIXI.Graphics();
            container.addChild(multipleShockwaves);
            
            // Fragmentos de realidade se despedaçando
            const realityFragments = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 60; i++) {
                const fragment = new PIXI.Graphics();
                
                // Fragmento de realidade brilhante
                const brightness = 0.8 + Math.random() * 0.2;
                fragment.beginFill(0xFFFFFF, brightness);
                
                const fragmentType = Math.floor(Math.random() * 3);
                if (fragmentType === 0) {
                    // Quadrado
                    const size = 2 + Math.random() * 4;
                    fragment.drawRect(-size/2, -size/2, size, size);
                } else if (fragmentType === 1) {
                    // Triângulo
                    const size = 3 + Math.random() * 5;
                    fragment.drawPolygon([0, -size, -size, size, size, size]);
                } else {
                    // Losango
                    const size = 2 + Math.random() * 4;
                    fragment.drawPolygon([0, -size, size, 0, 0, size, -size, 0]);
                }
                fragment.endFill();
                
                fragment.x = centerX;
                fragment.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 12;
                fragment.vx = Math.cos(angle) * speed;
                fragment.vy = Math.sin(angle) * speed;
                fragment.rotSpeed = (Math.random() - 0.5) * 0.5;
                fragment.life = 0;
                fragment.maxLife = 1.2;
                fragment.pulsePhase = Math.random() * Math.PI * 2;
                
                fragments.push(fragment);
                realityFragments.addChild(fragment);
            }
            
            container.addChild(realityFragments);
            
            // Raios de energia convergindo e divergindo
            const energyRays = new PIXI.Graphics();
            container.addChild(energyRays);
            
            // Tremor intenso da tela
            const originalX = container.x;
            const originalY = container.y;
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.0, 1);
                
                annihilationFilter.uniforms.time = elapsed;
                annihilationFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Tremor devastador da tela
                if (progress < 0.8) {
                    const shakeIntensity = Math.sin(progress * Math.PI) * 20;
                    container.x = originalX + Math.sin(elapsed * 50) * shakeIntensity;
                    container.y = originalY + Math.cos(elapsed * 45) * shakeIntensity;
                } else {
                    container.x = originalX;
                    container.y = originalY;
                }
                
                // Desenhar orbe destrutiva central
                destructiveOrb.clear();
                
                const orbAlpha = Math.sin(progress * Math.PI) * 0.4;
                const orbSize = 15 + Math.sin(elapsed * 15) * 8;
                const coreSize = 8 + Math.sin(elapsed * 25) * 4;
                
                // Múltiplas camadas do orbe
                for (let layer = 0; layer < 5; layer++) {
                    const layerSize = orbSize - layer * 2;
                    const layerAlpha = orbAlpha * (1 - layer * 0.15);
                    
                    destructiveOrb.beginFill(0xFFFFFF, layerAlpha);
                    destructiveOrb.drawCircle(centerX, centerY, layerSize);
                    destructiveOrb.endFill();
                }
                
                // Núcleo super brilhante
                destructiveOrb.beginFill(0xFFFFFF, orbAlpha * 1.2);
                destructiveOrb.drawCircle(centerX, centerY, coreSize);
                destructiveOrb.endFill();
                
                // Desenhar ondas de choque múltiplas
                multipleShockwaves.clear();
                
                for (let wave = 0; wave < 8; wave++) {
                    const waveProgress = (elapsed * 3 + wave * 0.15) % 1.5;
                    if (waveProgress < 1) {
                        const waveRadius = waveProgress * maxRadius * 1.2;
                        const waveAlpha = Math.pow(1 - waveProgress, 3) * Math.sin(progress * Math.PI) * 0.8;
                        const waveThickness = 6 + (1 - waveProgress) * 4;
                        
                        const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                        
                        if (waveAlpha > 0 && fadeAlpha > 0) {
                            multipleShockwaves.lineStyle(waveThickness, 0xFFFFFF, waveAlpha * fadeAlpha);
                            multipleShockwaves.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                // Animar fragmentos de realidade
                fragments.forEach(fragment => {
                    fragment.x += fragment.vx;
                    fragment.y += fragment.vy;
                    fragment.rotation += fragment.rotSpeed;
                    fragment.life += 0.02;
                    
                    // Pulsação energética
                    const pulse = 1 + Math.sin(elapsed * 20 + fragment.pulsePhase) * 0.3;
                    fragment.scale.set(pulse);
                    
                    if (fragment.life > fragment.maxLife) {
                        fragment.life = 0;
                        fragment.x = centerX;
                        fragment.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 3 + Math.random() * 12;
                        fragment.vx = Math.cos(angle) * speed;
                        fragment.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((fragment.x - centerX) ** 2 + (fragment.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    fragment.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - fragment.life / fragment.maxLife);
                });
                
                // Desenhar raios de energia
                energyRays.clear();
                
                const rayAlpha = Math.sin(progress * Math.PI) * 0.7;
                
                for (let ray = 0; ray < 16; ray++) {
                    const rayAngle = (ray / 16) * Math.PI * 2 + elapsed * 8;
                    const rayLength = maxRadius * 0.9;
                    const rayThickness = 2 + Math.sin(elapsed * 12 + ray) * 2;
                    
                    energyRays.lineStyle(rayThickness, 0xFFFFFF, rayAlpha * 0.6);
                    energyRays.moveTo(centerX, centerY);
                    energyRays.lineTo(
                        centerX + Math.cos(rayAngle) * rayLength,
                        centerY + Math.sin(rayAngle) * rayLength
                    );
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // 🌪️💢 RAMPAGE/FÚRIA - Ataque Frenético
    // ========================================
    "rampage_damage": {
        duration: 1800,
        name: "Fúria Descontrolada",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.85;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.55;
            
            // Shader de fúria descontrolada
            const rampageFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção caótica e violenta
                    float chaos1 = sin(uv.x * 80.0 + time * 50.0) * cos(uv.y * 70.0 + time * 45.0);
                    float chaos2 = sin(uv.x * 90.0 - time * 60.0) * sin(uv.y * 85.0 + time * 55.0);
                    
                    vec2 chaosDistortion = vec2(chaos1, chaos2) * 0.05 * intensity * exp(-dist * 1.5);
                    vec2 rampageUV = uv + chaosDistortion;
                    
                    // Campo de fúria crescente
                    float furyField = 1.0 - smoothstep(0.0, 0.4, dist);
                    furyField *= pow(sin(time * 15.0) * 0.5 + 0.5, 2.0);
                    
                    // Múltiplas ondas de ira
                    float rageWaves = 0.0;
                    for(float i = 1.0; i < 10.0; i++) {
                        float wave = sin(dist * (25.0 + i * 3.0) - time * (20.0 + i * 2.0)) * 0.5 + 0.5;
                        wave *= exp(-dist * (1.5 + i * 0.1));
                        rageWaves += wave;
                    }
                    
                    // Impactos violentos aleatórios
                    float violentImpacts = 0.0;
                    for(float i = 0.0; i < 12.0; i++) {
                        vec2 impactPos = vec2(
                            sin(time * 8.0 + i * 2.0) * 0.3,
                            cos(time * 6.0 + i * 1.5) * 0.3
                        );
                        float impactDist = distance(uv, center + impactPos);
                        float impact = exp(-impactDist * 15.0);
                        impact *= sin(time * 25.0 + i * 3.0) * 0.5 + 0.5;
                        violentImpacts += impact;
                    }
                    
                    // Turbilhão de destruição
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float destructionVortex = sin(angle * 6.0 + dist * 20.0 + time * 30.0) * 0.5 + 0.5;
                    destructionVortex *= exp(-dist * 2.0);
                    
                    vec4 color = texture2D(uSampler, rampageUV);
                    
                    // Cores da fúria (vermelho intenso e laranja)
                    vec3 furyColor = vec3(1.0, 0.1, 0.0);
                    vec3 rageColor = vec3(1.0, 0.3, 0.0);
                    vec3 impactColor = vec3(1.0, 0.5, 0.2);
                    vec3 vortexColor = vec3(0.9, 0.2, 0.1);
                    
                    color.rgb = mix(color.rgb, furyColor, furyField * intensity * 0.7);
                    color.rgb += rageColor * rageWaves * intensity * 0.4;
                    color.rgb += impactColor * violentImpacts * intensity * 0.6;
                    color.rgb += vortexColor * destructionVortex * intensity * 0.5;
                    
                    // Pulsos de fúria extrema
                    float extremeFury = step(0.9, sin(time * 40.0)) * furyField;
                    color.rgb += vec3(1.5, 0.8, 0.0) * extremeFury * intensity;
                    
                    color.a = intensity * (1.0 - smoothstep(0.25, 0.45, dist));
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [rampageFilter];
            container.addChild(bg);
            
            // Múltiplos punhos atacando simultaneamente
            const rampageFists = new PIXI.Graphics();
            container.addChild(rampageFists);
            
            // Detritos voando caoticamente
            const chaoticDebris = new PIXI.Container();
            const debris = [];
            
            for (let i = 0; i < 45; i++) {
                const piece = new PIXI.Graphics();
                piece.beginFill(0xAA4444, 0.8);
                
                // Fragmento destruído irregular
                const sides = 3 + Math.floor(Math.random() * 5);
                const points = [];
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const radius = 2 + Math.random() * 6;
                    const chaos = 0.5 + Math.random() * 1.0;
                    points.push(
                        Math.cos(angle) * radius * chaos,
                        Math.sin(angle) * radius * chaos
                    );
                }
                piece.drawPolygon(points);
                piece.endFill();
                
                piece.x = centerX + (Math.random() - 0.5) * 80;
                piece.y = centerY + (Math.random() - 0.5) * 80;
                
                const speed = 3 + Math.random() * 10;
                const angle = Math.random() * Math.PI * 2;
                piece.vx = Math.cos(angle) * speed;
                piece.vy = Math.sin(angle) * speed;
                piece.rotSpeed = (Math.random() - 0.5) * 1.0;
                piece.chaosForce = 0.2 + Math.random() * 0.3;
                piece.life = 0;
                piece.maxLife = 1.0;
                
                debris.push(piece);
                chaoticDebris.addChild(piece);
            }
            
            container.addChild(chaoticDebris);
            
            // Ondas de impacto violentas
            const violentImpacts = new PIXI.Graphics();
            container.addChild(violentImpacts);
            
            // Rastros de destruição
            const destructionTrails = new PIXI.Graphics();
            container.addChild(destructionTrails);
            
            // Tremor caótico da tela
            const originalX = container.x;
            const originalY = container.y;
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.8, 1);
                
                rampageFilter.uniforms.time = elapsed;
                rampageFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Tremor caótico e violento
                const shakeIntensity = Math.sin(progress * Math.PI) * 10;
                container.x = originalX + Math.sin(elapsed * 40 + Math.sin(elapsed * 15)) * shakeIntensity;
                container.y = originalY + Math.cos(elapsed * 45 + Math.cos(elapsed * 12)) * shakeIntensity;
                
                // Desenhar múltiplos punhos atacando
                rampageFists.clear();
                
                const fistAlpha = Math.sin(progress * Math.PI) * 0.7;
                
                for (let fist = 0; fist < 8; fist++) {
                    const fistAngle = (fist / 8) * Math.PI * 2 + elapsed * 10;
                    const fistDistance = 25 + Math.sin(elapsed * 8 + fist) * 15;
                    const fistX = centerX + Math.cos(fistAngle) * fistDistance;
                    const fistY = centerY + Math.sin(fistAngle) * fistDistance;
                    
                    // Punho (retângulo simples)
                    rampageFists.beginFill(0x884444, fistAlpha);
                    rampageFists.drawRect(fistX - 6, fistY - 4, 12, 8);
                    rampageFists.endFill();
                    
                    // Sombra do impacto
                    rampageFists.beginFill(0x662222, fistAlpha * 0.5);
                    rampageFists.drawRect(fistX - 8, fistY - 6, 16, 12);
                    rampageFists.endFill();
                    
                    // Rastro do soco
                    const trailLength = 20;
                    rampageFists.lineStyle(4, 0xAA2222, fistAlpha * 0.6);
                    rampageFists.moveTo(fistX, fistY);
                    rampageFists.lineTo(
                        fistX - Math.cos(fistAngle) * trailLength,
                        fistY - Math.sin(fistAngle) * trailLength
                    );
                }
                
                // Animar detritos caóticos
                debris.forEach(piece => {
                    piece.x += piece.vx;
                    piece.y += piece.vy;
                    piece.rotation += piece.rotSpeed;
                    piece.life += 0.02;
                    
                    // Força caótica adicional
                    piece.vx += (Math.random() - 0.5) * piece.chaosForce;
                    piece.vy += (Math.random() - 0.5) * piece.chaosForce;
                    
                    // Atrito
                    piece.vx *= 0.99;
                    piece.vy *= 0.99;
                    
                    if (piece.life > piece.maxLife) {
                        piece.life = 0;
                        piece.x = centerX + (Math.random() - 0.5) * 60;
                        piece.y = centerY + (Math.random() - 0.5) * 60;
                        const speed = 3 + Math.random() * 10;
                        const angle = Math.random() * Math.PI * 2;
                        piece.vx = Math.cos(angle) * speed;
                        piece.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((piece.x - centerX) ** 2 + (piece.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    piece.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - piece.life / piece.maxLife);
                });
                
                // Desenhar ondas de impacto violentas
                violentImpacts.clear();
                
                for (let impact = 0; impact < 6; impact++) {
                    const impactProgress = (elapsed * 4 + impact * 0.3) % 1.8;
                    if (impactProgress < 1) {
                        const impactRadius = impactProgress * maxRadius * 0.8;
                        const impactAlpha = Math.pow(1 - impactProgress, 2) * Math.sin(progress * Math.PI) * 0.7;
                        const impactThickness = 6 + (1 - impactProgress) * 8;
                        
                        const fadeAlpha = getFadeoutAlpha(impactRadius, maxRadius);
                        
                        if (impactAlpha > 0 && fadeAlpha > 0) {
                            violentImpacts.lineStyle(impactThickness, 0xFF3300, impactAlpha * fadeAlpha);
                            violentImpacts.drawCircle(centerX, centerY, impactRadius);
                        }
                    }
                }
                
                // Desenhar rastros de destruição
                destructionTrails.clear();
                
                const trailAlpha = Math.sin(progress * Math.PI) * 0.5;
                
                for (let trail = 0; trail < 12; trail++) {
                    const trailAngle = (trail / 12) * Math.PI * 2 + elapsed * 6;
                    const trailStart = 5;
                    const trailEnd = maxRadius * 0.4;
                    
                    destructionTrails.lineStyle(3, 0xCC4422, trailAlpha);
                    destructionTrails.moveTo(
                        centerX + Math.cos(trailAngle) * trailStart,
                        centerY + Math.sin(trailAngle) * trailStart
                    );
                    destructionTrails.lineTo(
                        centerX + Math.cos(trailAngle) * trailEnd,
                        centerY + Math.sin(trailAngle) * trailEnd
                    );
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    },

    // ========================================
    // ⏰ TEMPORAL/TEMPO - Arcanista
    // ========================================
    "temporal_damage": {
        duration: 1600,
        name: "Dano Temporal",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.5;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Shader temporal com mais cor
            const temporalFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção temporal centralizada
                    float timeWarp = sin(dist * 20.0 - time * 6.0) * 0.015;
                    timeWarp *= 1.0 - smoothstep(0.0, 0.4, dist);
                    vec2 warpedUV = uv + vec2(timeWarp, timeWarp) * intensity;
                    
                    // Ondas do tempo mais coloridas
                    float timeWaves = 0.0;
                    for(float i = 0.0; i < 6.0; i++) {
                        float wave = sin(dist * 30.0 - time * (10.0 + i * 3.0)) * 0.5 + 0.5;
                        wave *= 1.0 - smoothstep(0.0, 0.4, abs(dist - i * 0.06));
                        timeWaves += wave;
                    }
                    
                    // Vórtice temporal central
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float spiral = sin(angle * 8.0 + dist * 15.0 - time * 12.0) * 0.5 + 0.5;
                    spiral *= 1.0 - smoothstep(0.0, 0.25, dist);
                    
                    vec4 color = texture2D(uSampler, warpedUV);
                    
                    // Cores temporais mais vibrantes
                    vec3 timeColor1 = vec3(0.8, 0.5, 1.0);    // Roxo claro
                    vec3 timeColor2 = vec3(0.5, 0.9, 1.0);    // Azul ciano
                    vec3 timeColor3 = vec3(1.0, 0.7, 0.9);    // Rosa temporal
                    
                    color.rgb = mix(color.rgb, timeColor1, timeWaves * intensity * 0.4);
                    color.rgb += timeColor2 * spiral * intensity * 0.3;
                    
                    // Pulsação temporal central mais intensa
                    float pulse = sin(time * 8.0) * 0.5 + 0.5;
                    float timePulse = 1.0 - smoothstep(0.0, 0.2, dist);
                    color.rgb += timeColor3 * timePulse * pulse * intensity * 0.5;
                    
                    // Fragmentação temporal
                    float fragmentation = sin(uv.x * 50.0 + time * 15.0) * sin(uv.y * 40.0 + time * 12.0);
                    fragmentation = pow(max(0.0, fragmentation), 4.0);
                    fragmentation *= 1.0 - smoothstep(0.0, 0.3, dist);
                    color.rgb += vec3(0.9, 0.6, 1.0) * fragmentation * intensity * 0.2;
                    
                    // Fadeout nas bordas
                    color.a = intensity * (1.0 - smoothstep(0.3, 0.45, dist));
                    
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [temporalFilter];
            container.addChild(bg);
            
            // Runa temporal central
            const centralRune = new PIXI.Text('⧖', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0x9A2EFE,
                stroke: 0xFFFFFF,
                strokeThickness: 2
            });
            centralRune.anchor.set(0.5);
            centralRune.x = centerX;
            centralRune.y = centerY;
            container.addChild(centralRune);
            
            // Relógio temporal
            const clockFace = new PIXI.Graphics();
            container.addChild(clockFace);
            
            // Fragmentos de tempo
            const timeFragments = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 15; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0x8A2BE2, 0.7);
                
                const size = 2 + Math.random() * 3;
                fragment.drawPolygon([
                    -size, 0,
                    0, -size,
                    size, 0,
                    0, size
                ]);
                fragment.endFill();
                
                fragment.lineStyle(0.8, 0xFFFFFF, 0.8);
                fragment.drawPolygon([
                    -size * 0.7, 0,
                    0, -size * 0.7,
                    size * 0.7, 0,
                    0, size * 0.7
                ]);
                
                const angle = Math.random() * Math.PI * 2;
                const radius = 40 + Math.random() * 80;
                fragment.x = centerX + Math.cos(angle) * radius;
                fragment.y = centerY + Math.sin(angle) * radius;
                fragment.baseAngle = angle;
                fragment.baseRadius = radius;
                fragment.rotSpeed = (Math.random() - 0.5) * 0.15;
                fragment.life = Math.random() * 0.3;
                fragment.maxLife = 1.0;
                
                fragments.push(fragment);
                timeFragments.addChild(fragment);
            }
            
            container.addChild(timeFragments);
            
            // Linhas temporais
            const timeLines1 = new PIXI.Graphics();
            const timeLines2 = new PIXI.Graphics();
            container.addChild(timeLines1);
            container.addChild(timeLines2);
            
            // Partículas de cronos
            const chronoParticles = new PIXI.Container();
            const chronos = [];
            
            for (let i = 0; i < 10; i++) {
                const chrono = new PIXI.Text('⧗', {
                    fontFamily: 'Arial',
                    fontSize: 8 + Math.random() * 6,
                    fill: 0x9A2EFE,
                    stroke: 0xFFFFFF,
                    strokeThickness: 1
                });
                
                chrono.anchor.set(0.5);
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius * 0.6;
                chrono.x = centerX + Math.cos(angle) * radius;
                chrono.y = centerY + Math.sin(angle) * radius;
                chrono.vx = (Math.random() - 0.5) * 2;
                chrono.vy = (Math.random() - 0.5) * 2;
                chrono.rotSpeed = (Math.random() - 0.5) * 0.08;
                chrono.life = Math.random() * 0.5;
                chrono.maxLife = 1.2;
                
                chronos.push(chrono);
                chronoParticles.addChild(chrono);
            }
            
            container.addChild(chronoParticles);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                temporalFilter.uniforms.time = elapsed;
                temporalFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar runa central
                centralRune.rotation += 0.03;
                centralRune.scale.set(1 + Math.sin(elapsed * 3) * 0.15);
                centralRune.alpha = Math.sin(progress * Math.PI);
                
                // Desenhar relógio temporal
                clockFace.clear();
                
                const clockRadius = 50;
                clockFace.lineStyle(2, 0x9A2EFE, Math.sin(progress * Math.PI) * 0.6);
                clockFace.drawCircle(centerX, centerY, clockRadius);
                
                const hourAngle = elapsed * 1.5 - Math.PI / 2;
                const minuteAngle = elapsed * 8 - Math.PI / 2;
                
                clockFace.lineStyle(3, 0xFFFFFF, Math.sin(progress * Math.PI) * 0.8);
                clockFace.moveTo(centerX, centerY);
                clockFace.lineTo(
                    centerX + Math.cos(hourAngle) * (clockRadius * 0.4),
                    centerY + Math.sin(hourAngle) * (clockRadius * 0.4)
                );
                
                clockFace.lineStyle(1.5, 0xFFFFFF, Math.sin(progress * Math.PI) * 0.8);
                clockFace.moveTo(centerX, centerY);
                clockFace.lineTo(
                    centerX + Math.cos(minuteAngle) * (clockRadius * 0.7),
                    centerY + Math.sin(minuteAngle) * (clockRadius * 0.7)
                );
                
                // Animar fragmentos temporais
                fragments.forEach((frag, i) => {
                    frag.baseAngle += 0.01;
                    frag.x = centerX + Math.cos(frag.baseAngle) * frag.baseRadius;
                    frag.y = centerY + Math.sin(frag.baseAngle) * frag.baseRadius;
                    frag.rotation += frag.rotSpeed;
                    frag.life += 0.02;
                    
                    if (frag.life > frag.maxLife) {
                        frag.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        frag.baseRadius = 40 + Math.random() * 80;
                        frag.baseAngle = angle;
                    }
                    
                    const distFromCenter = Math.sqrt((frag.x - centerX) ** 2 + (frag.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    frag.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - frag.life / frag.maxLife);
                });
                
                // Linhas temporais
                timeLines1.clear();
                timeLines2.clear();
                
                const lineAlpha = Math.sin(progress * Math.PI) * 0.5;
                
                timeLines1.lineStyle(1.5, 0x8A2BE2, lineAlpha);
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + elapsed * 2;
                    const radius = maxRadius * 0.4;
                    timeLines1.moveTo(centerX, centerY);
                    timeLines1.lineTo(
                        centerX + Math.cos(angle) * radius,
                        centerY + Math.sin(angle) * radius
                    );
                }
                
                timeLines2.lineStyle(1, 0x9A2EFE, lineAlpha);
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - elapsed * 3.5;
                    const radius = maxRadius * 0.3;
                    timeLines2.moveTo(centerX, centerY);
                    timeLines2.lineTo(
                        centerX + Math.cos(angle) * radius,
                        centerY + Math.sin(angle) * radius
                    );
                }
                
                // Animar partículas de cronos
                chronos.forEach(chrono => {
                    chrono.x += chrono.vx;
                    chrono.y += chrono.vy;
                    chrono.rotation += chrono.rotSpeed;
                    chrono.life += 0.02;
                    
                    if (chrono.life > chrono.maxLife) {
                        chrono.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * maxRadius * 0.6;
                        chrono.x = centerX + Math.cos(angle) * radius;
                        chrono.y = centerY + Math.sin(angle) * radius;
                        chrono.vx = (Math.random() - 0.5) * 2;
                        chrono.vy = (Math.random() - 0.5) * 2;
                    }
                    
                    const distFromCenter = Math.sqrt((chrono.x - centerX) ** 2 + (chrono.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    chrono.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - chrono.life / chrono.maxLife);
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    container.destroy({ children: true });
                }
            };
            
            animate();
            return container;
        }
    }
});