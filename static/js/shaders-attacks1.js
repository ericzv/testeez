// shaders-attacks1.js - Shaders Básicos
// Inicializa o objeto principal se não existir
window.BOSS_DAMAGE_SHADERS = window.BOSS_DAMAGE_SHADERS || {};

// SHADERS PRESENTES: SHADOW, ARCANE, DIVINE, BRUTAL, FERAL, BLOOD, ELETRIC

// Adiciona os shaders básicos ao dicionário
Object.assign(window.BOSS_DAMAGE_SHADERS, {
    
    // ========================================
    // 🌑 SHADOW/SOMBRA - Ninja, Ladrão
    // ========================================
    "shadow_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Sombrio",
        create: function(app) {
            const container = new PIXI.Container();
            
            // Função para calcular fadeout baseado na distância do centro
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
            
            // Shader de distorção sombria (mais modesto)
            const shadowVertex = `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.x += sin(position.y * 0.05 + time * 2.0) * 10.0;
                    position.y += cos(position.x * 0.05 + time * 1.5) * 8.0;
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            const shadowFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção mais sutil
                    uv.x += sin(uv.y * 20.0 + time * 3.0) * 0.01;
                    uv.y += cos(uv.x * 15.0 + time * 2.0) * 0.01;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Escurecimento central
                    float darkness = 1.0 - smoothstep(0.0, 0.35, dist);
                    color.rgb *= 0.3 + darkness * 0.4;
                    
                    // Vórtice sombrio
                    float angle = atan(uv.y - center.y, uv.x - center.x) + time * 1.5;
                    float spiral = sin(dist * 15.0 - angle * 3.0) * 0.5 + 0.5;
                    spiral *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    color.rgb = mix(color.rgb, vec3(0.2, 0.0, 0.3), spiral * intensity * 0.3);
                    color.a = intensity * (1.0 - smoothstep(0.3, 0.5, dist));
                    
                    gl_FragColor = color;
                }
            `;
            
            // Nuvem escura rotativa no centro
            const darkCloud = new PIXI.Graphics();
            container.addChild(darkCloud);
            
            // Partículas de sombra centralizadas
            const shadowParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 25; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x000000, 0.6);
                particle.drawCircle(0, 0, Math.random() * 3 + 2);
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius * 0.7;
                particle.x = centerX + Math.cos(angle) * radius;
                particle.y = centerY + Math.sin(angle) * radius;
                particle.baseAngle = angle;
                particle.baseRadius = radius;
                particle.rotSpeed = (Math.random() - 0.5) * 0.02;
                particle.life = 0;
                particle.maxLife = Math.random() * 0.8 + 0.5;
                
                particles.push(particle);
                shadowParticles.addChild(particle);
            }
            
            container.addChild(shadowParticles);
            
            // Tentáculos menores e centralizados
            const tentacles = new PIXI.Graphics();
            container.addChild(tentacles);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                // Desenhar nuvem escura rotativa
                darkCloud.clear();
                darkCloud.beginFill(0x000000, 0.3 * Math.sin(progress * Math.PI));
                
                const cloudRadius = maxRadius * 0.35;
                const cloudPoints = [];
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + elapsed * 0.5;
                    const r = cloudRadius + Math.sin(elapsed * 2 + i) * 10;
                    cloudPoints.push(centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r);
                }
                darkCloud.drawPolygon(cloudPoints);
                darkCloud.endFill();
                
                // Animar partículas
                particles.forEach(p => {
                    p.life += 0.015;
                    if (p.life > p.maxLife) {
                        p.life = 0;
                        p.baseAngle = Math.random() * Math.PI * 2;
                        p.baseRadius = Math.random() * maxRadius * 0.7;
                    }
                    
                    p.baseAngle += p.rotSpeed;
                    p.x = centerX + Math.cos(p.baseAngle) * p.baseRadius;
                    p.y = centerY + Math.sin(p.baseAngle) * p.baseRadius;
                    
                    const distFromCenter = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    p.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - p.life / p.maxLife);
                });
                
                // Desenhar tentáculos centralizados
                tentacles.clear();
                tentacles.lineStyle(3, 0x330033, 0.4 * Math.sin(progress * Math.PI));
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + elapsed * 0.8;
                    tentacles.moveTo(centerX, centerY);
                    
                    for (let j = 0; j < 4; j++) {
                        const dist = j * 25;
                        const wobble = Math.sin(elapsed * 2 + j + i) * 12;
                        const x = centerX + Math.cos(angle) * dist + Math.sin(angle) * wobble;
                        const y = centerY + Math.sin(angle) * dist + Math.cos(angle) * wobble;
                        tentacles.lineTo(x, y);
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
    // 🔮 ARCANE/ARCANO - Mago, Arcanista
    // ========================================
    "arcane_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Arcano",
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
            
            // Shader arcano mais intenso no centro
            const arcaneFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                vec3 hsv2rgb(vec3 c) {
                    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Anéis concêntricos que se concentram
                    float rings = 0.0;
                    for(float i = 1.0; i < 8.0; i++) {
                        float ringDist = abs(dist - (0.4 - i * 0.05 + time * 0.1));
                        float ring = 1.0 - smoothstep(0.0, 0.02, ringDist);
                        ring *= sin(time * 8.0 + i * 2.0) * 0.5 + 0.5;
                        rings += ring;
                    }
                    
                    // Vórtice central mais intenso
                    vec2 rotUV = uv - center;
                    float angle = atan(rotUV.y, rotUV.x);
                    float spiral = sin(angle * 12.0 + dist * 15.0 + time * 12.0) * 0.5 + 0.5;
                    spiral *= 1.0 - smoothstep(0.0, 0.25, dist);
                    
                    // Pulsação central
                    float centralPulse = 1.0 - smoothstep(0.0, 0.15, dist);
                    centralPulse *= sin(time * 10.0) * 0.5 + 0.5;
                    
                    // Cor arcana
                    float hue = 0.8 + sin(time * 6.0 + dist * 10.0) * 0.1;
                    vec3 color = hsv2rgb(vec3(hue, 0.8, 0.9));
                    
                    vec3 finalColor = color * rings * 2.0;
                    finalColor += vec3(0.6, 0.3, 0.9) * spiral * 1.5;
                    finalColor += vec3(0.8, 0.4, 1.0) * centralPulse * 2.0;
                    
                    // Fadeout nas bordas
                    float alpha = intensity * 0.6 * (1.0 - smoothstep(0.2, 0.45, dist));
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0x000000, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [arcaneFilter];
            container.addChild(bg);
            
            // Círculos concêntricos
            const concentricRings = new PIXI.Graphics();
            container.addChild(concentricRings);
            
            // Órbitas de runas girando rapidamente
            const runeOrbits = new PIXI.Container();
            const orbitSystems = [];
            
            // Criar 4 órbitas com velocidades diferentes
            for (let orbitIndex = 0; orbitIndex < 4; orbitIndex++) {
                const orbitRadius = 30 + orbitIndex * 15;
                const numRunes = 3 + orbitIndex;
                const rotationSpeed = (orbitIndex % 2 === 0) ? 0.08 + orbitIndex * 0.02 : -(0.06 + orbitIndex * 0.015); // Sentidos opostos
                
                const orbitSystem = {
                    radius: orbitRadius,
                    rotationSpeed: rotationSpeed,
                    angle: 0,
                    runes: []
                };
                
                // Criar runas para esta órbita
                for (let runeIndex = 0; runeIndex < numRunes; runeIndex++) {
                    const runeAngle = (runeIndex / numRunes) * Math.PI * 2;
                    const rune = new PIXI.Text(['⟡', '✦', '◈', '❋', '✧', '⧈'][runeIndex % 6], {
                        fontFamily: 'Arial',
                        fontSize: 8 + Math.random() * 4,
                        fill: 0x9A2EFE,
                        stroke: 0xFFFFFF,
                        strokeThickness: 1
                    });
                    
                    rune.anchor.set(0.5);
                    rune.baseAngle = runeAngle;
                    rune.rotSpeed = (Math.random() - 0.5) * 0.1;
                    
                    orbitSystem.runes.push(rune);
                    runeOrbits.addChild(rune);
                }
                
                orbitSystems.push(orbitSystem);
            }
            
            container.addChild(runeOrbits);
            
            // Fagulhas arcanas (aparecem no final)
            const arcaneParks = new PIXI.Container();
            const sparks = [];
            let sparksEmitted = false;
            
            for (let i = 0; i < 20; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0x8A2BE2);
                spark.drawCircle(0, 0, 1 + Math.random());
                spark.endFill();
                
                spark.x = centerX;
                spark.y = centerY;
                spark.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 6;
                spark.vx = Math.cos(angle) * speed;
                spark.vy = Math.sin(angle) * speed;
                spark.life = 0;
                spark.maxLife = 0.4;
                
                sparks.push(spark);
                arcaneParks.addChild(spark);
            }
            
            container.addChild(arcaneParks);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                arcaneFilter.uniforms.time = elapsed;
                arcaneFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar círculos concêntricos que se fecham
                concentricRings.clear();
                
                for (let i = 0; i < 6; i++) {
                    const ringProgress = (elapsed * 2 + i * 0.3) % 2;
                    const ringRadius = maxRadius * 0.6 * (1 - ringProgress / 2);
                    const alpha = Math.max(0, 1 - ringProgress) * Math.sin(progress * Math.PI) * 0.4;
                    
                    if (ringRadius > 5) {
                        concentricRings.lineStyle(2, 0x9A2EFE, alpha);
                        concentricRings.drawCircle(centerX, centerY, ringRadius);
                    }
                }
                
                // Animar órbitas de runas
                orbitSystems.forEach(orbitSystem => {
                    orbitSystem.angle += orbitSystem.rotationSpeed;
                    
                    orbitSystem.runes.forEach(rune => {
                        const totalAngle = orbitSystem.angle + rune.baseAngle;
                        rune.x = centerX + Math.cos(totalAngle) * orbitSystem.radius;
                        rune.y = centerY + Math.sin(totalAngle) * orbitSystem.radius;
                        rune.rotation += rune.rotSpeed;
                        
                        const distFromCenter = Math.sqrt((rune.x - centerX) ** 2 + (rune.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        rune.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                    });
                });
                
                // Emitir fagulhas quando círculos chegam ao centro
                if (!sparksEmitted && progress > 0.7) {
                    sparksEmitted = true;
                    sparks.forEach(spark => spark.visible = true);
                }
                
                // Animar fagulhas
                sparks.forEach(spark => {
                    if (spark.visible) {
                        spark.x += spark.vx;
                        spark.y += spark.vy;
                        spark.life += 0.03;
                        
                        const distFromCenter = Math.sqrt((spark.x - centerX) ** 2 + (spark.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        spark.alpha = fadeAlpha * (1 - spark.life / spark.maxLife);
                        
                        if (spark.life > spark.maxLife) {
                            spark.visible = false;
                        }
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
    // ✨ DIVINE/DIVINO - Clérigo
    // ========================================
    "divine_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Divino",
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
            
            // Filtro de luz divina vertical
            const divineFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Luz vertical centralizada
                    float verticalLight = 1.0 - smoothstep(0.0, 0.15, abs(uv.x - center.x));
                    
                    // Fade-in do topo (transparência maior no topo)
                    float topFade = smoothstep(0.0, 0.3, uv.y);
                    
                    // Fade-out embaixo (transparência maior embaixo)
                    float bottomFade = 1.0 - smoothstep(0.7, 1.0, uv.y);
                    
                    // Transparência baseada na distância do centro
                    float centerDistance = distance(uv, center);
                    float centerFade = 1.0 - smoothstep(0.0, 0.4, centerDistance);
                    
                    // Combinar todos os fades
                    float lightIntensity = verticalLight * topFade * bottomFade * centerFade;
                    
                    // Pulsação da luz
                    float pulse = sin(time * 4.0) * 0.3 + 0.7;
                    lightIntensity *= pulse;
                    
                    // Ondulação suave da luz
                    float wave = sin(uv.y * 10.0 + time * 3.0) * 0.1 + 0.9;
                    lightIntensity *= wave;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor da luz divina
                    vec3 divineColor = vec3(1.0, 1.0, 0.9);
                    vec3 goldenColor = vec3(1.0, 0.9, 0.7);
                    
                    // Misturar as cores
                    vec3 finalLightColor = mix(goldenColor, divineColor, lightIntensity);
                    
                    color.rgb = mix(color.rgb, finalLightColor, lightIntensity * intensity * 0.6);
                    
                    // Alpha baseado na intensidade da luz e fadeout geral
                    color.a = intensity * lightIntensity * (1.0 - smoothstep(0.3, 0.5, dist));
                    
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
            bg.filters = [divineFilter];
            container.addChild(bg);
            
            // Partículas de luz sagrada (estrelas subindo da parte inferior)
            const holyParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 30; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFFFFFF);
                
                // Estrela de 6 pontas
                const points = [];
                for (let j = 0; j < 12; j++) {
                    const angle = (j / 12) * Math.PI * 2;
                    const radius = j % 2 === 0 ? 4 : 2;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                particle.drawPolygon(points);
                particle.endFill();
                
                particle.x = centerX + (Math.random() - 0.5) * 40;
                particle.y = app.view.height; // Começar na parte inferior
                particle.vx = (Math.random() - 0.5) * 1;
                particle.vy = -Math.random() * 3 - 2; // Subindo
                particle.rotation = Math.random() * Math.PI * 2;
                particle.rotSpeed = (Math.random() - 0.5) * 0.1;
                particle.wavePhase = Math.random() * Math.PI * 2;
                particle.waveSpeed = Math.random() * 3 + 2;
                particle.waveAmplitude = Math.random() * 15 + 10;
                particle.life = 0;
                particle.maxLife = Math.random() * 1.2 + 0.8;
                
                particles.push(particle);
                holyParticles.addChild(particle);
            }
            
            container.addChild(holyParticles);
            
            // Anéis expansivos
            const expandingRings = new PIXI.Graphics();
            container.addChild(expandingRings);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                divineFilter.uniforms.time = elapsed;
                divineFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar estrelas subindo da parte inferior
                particles.forEach((p, i) => {
                    p.life += 0.02;
                    if (p.life > p.maxLife) {
                        p.life = 0;
                        p.x = centerX + (Math.random() - 0.5) * 40;
                        p.y = app.view.height;
                        p.vy = -Math.random() * 3 - 2;
                    }
                    
                    // Movimento ondulatório
                    p.x += p.vx + Math.sin(elapsed * p.waveSpeed + p.wavePhase) * p.waveAmplitude * 0.01;
                    p.y += p.vy;
                    p.rotation += p.rotSpeed;
                    
                    const distFromCenter = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    p.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - p.life / p.maxLife);
                });
                
                // Anéis expansivos
                expandingRings.clear();
                
                for (let i = 0; i < 3; i++) {
                    const ringProgress = (elapsed * 2 + i * 0.5) % 2;
                    const ringRadius = ringProgress * maxRadius * 0.8;
                    const ringAlpha = Math.max(0, 1 - ringProgress) * Math.sin(progress * Math.PI);
                    
                    const distanceBasedAlpha = getFadeoutAlpha(ringRadius, maxRadius);
                    const finalAlpha = ringAlpha * distanceBasedAlpha;
                    
                    if (finalAlpha > 0) {
                        expandingRings.lineStyle(3, 0xFFFF88, finalAlpha * 0.6);
                        expandingRings.drawCircle(centerX, centerY, ringRadius);
                        
                        expandingRings.lineStyle(1, 0xFFFFFF, finalAlpha * 0.3);
                        expandingRings.drawCircle(centerX, centerY, ringRadius + 5);
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
    // 💪 BRUTAL/FÍSICO - Berserker, Guerreiro
    // ========================================
    "brutal_damage": {
        duration: 600, // OTIMIZADO: 1200ms → 600ms (-50%)
        name: "Dano Brutal",
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
            
            // Shader de impacto brutal
            const brutalFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                uniform vec2 impact;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = impact;
                    float dist = distance(uv, center);
                    
                    // Ondas de choque
                    float shockwave = sin(dist * 50.0 - time * 20.0) * 0.5 + 0.5;
                    shockwave *= 1.0 - smoothstep(0.0, 0.5, dist);
                    shockwave *= intensity;
                    
                    // Rachaduras
                    vec2 crackUV = uv * 10.0;
                    float cracks = 0.0;
                    for(float i = 0.0; i < 5.0; i++) {
                        float crack = abs(sin(crackUV.x * (i + 1.0) + crackUV.y * (i + 2.0)));
                        crack = pow(crack, 10.0);
                        cracks += crack;
                    }
                    cracks *= 1.0 - smoothstep(0.1, 0.4, dist);
                    
                    // Distorção de impacto
                    vec2 dir = normalize(uv - center);
                    vec2 distort = dir * sin(dist * 30.0 - time * 15.0) * 0.02 * intensity;
                    
                    vec4 color = texture2D(uSampler, uv + distort);
                    
                    // Cor vermelha/laranja do impacto
                    vec3 impactColor = vec3(1.0, 0.3, 0.1);
                    vec3 finalColor = mix(color.rgb, impactColor, shockwave);
                    finalColor += vec3(1.0, 0.5, 0.0) * cracks * intensity;
                    
                    // Flash de impacto
                    float flash = 1.0 - smoothstep(0.0, 0.2, dist);
                    flash *= pow(intensity, 2.0);
                    finalColor += vec3(1.0, 0.8, 0.6) * flash;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `, {
                time: 0,
                intensity: 0,
                impact: [0.5, 0.5]
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [brutalFilter];
            container.addChild(bg);
            
            // Fragmentos voando com transparência progressiva
            const fragments = new PIXI.Container();
            const fragList = [];
            
            for (let i = 0; i < 30; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0x883333);
                
                // Forma irregular do fragmento
                const points = [];
                const sides = 3 + Math.floor(Math.random() * 3);
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const radius = 5 + Math.random() * 10;
                    points.push(
                        Math.cos(angle) * radius * (0.7 + Math.random() * 0.6),
                        Math.sin(angle) * radius * (0.7 + Math.random() * 0.6)
                    );
                }
                fragment.drawPolygon(points);
                fragment.endFill();
                
                fragment.x = centerX;
                fragment.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 15;
                fragment.vx = Math.cos(angle) * speed;
                fragment.vy = Math.sin(angle) * speed - 10;
                fragment.rotation = Math.random() * Math.PI * 2;
                fragment.rotSpeed = (Math.random() - 0.5) * 0.5;
                fragment.gravity = 0.8;
                
                fragList.push(fragment);
                fragments.addChild(fragment);
            }
            
            container.addChild(fragments);
            
            // Anel de poeira
            const dustRing = new PIXI.Graphics();
            container.addChild(dustRing);
            
            // Tela tremendo
            const originalX = container.x;
            const originalY = container.y;
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.2, 1);
                
                // Animar shader
                brutalFilter.uniforms.time = elapsed;
                brutalFilter.uniforms.intensity = Math.sin(progress * Math.PI) * 1.2;
                
                // Tremor da tela
                if (progress < 0.3) {
                    container.x = originalX + (Math.random() - 0.5) * 20 * (1 - progress / 0.3);
                    container.y = originalY + (Math.random() - 0.5) * 20 * (1 - progress / 0.3);
                } else {
                    container.x = originalX;
                    container.y = originalY;
                }
                
                // Animar fragmentos com transparência baseada na distância
                fragList.forEach(frag => {
                    frag.x += frag.vx;
                    frag.y += frag.vy;
                    frag.vy += frag.gravity;
                    frag.rotation += frag.rotSpeed;
                    
                    const distFromCenter = Math.sqrt((frag.x - centerX) ** 2 + (frag.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    frag.alpha = (1 - progress) * fadeAlpha;
                });
                
                // Anel de poeira expandindo
                dustRing.clear();
                if (progress < 0.5) {
                    const ringProgress = progress / 0.5;
                    const radius = ringProgress * maxRadius * 0.6;
                    const alpha = (1 - ringProgress) * 0.5;
                    const fadeAlpha = getFadeoutAlpha(radius, maxRadius);
                    
                    dustRing.beginFill(0x996633, alpha * fadeAlpha);
                    dustRing.drawCircle(centerX, centerY, radius);
                    dustRing.drawCircle(centerX, centerY, radius * 0.8);
                    dustRing.endFill();
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
    // 🐺 FERAL/BESTIAL - Lobisomem
    // ========================================
    "feral_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Feral",
        create: function(app) {
            const container = new PIXI.Container();
            
            function getFadeoutAlpha(distance, maxRadius) {
                const fadeStart = maxRadius * 0.4;
                const fadeEnd = maxRadius * 0.9;
                
                if (distance <= fadeStart) return 1.0;
                if (distance >= fadeEnd) return 0.0;
                return 1.0 - (distance - fadeStart) / (fadeEnd - fadeStart);
            }
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;
            
            // Marcas de garra serrilhadas maiores
            const clawMarks = new PIXI.Graphics();
            container.addChild(clawMarks);
            
            // Pelos voando
            const furParticles = new PIXI.Container();
            const furs = [];
            
            for (let i = 0; i < 25; i++) {
                const fur = new PIXI.Graphics();
                fur.lineStyle(1.5, 0x8B4513, 0.7);
                const furLength = 4 + Math.random() * 6;
                fur.moveTo(0, 0);
                fur.lineTo(furLength, Math.random() * 2 - 1);
                
                fur.x = centerX + (Math.random() - 0.5) * maxRadius * 0.8;
                fur.y = centerY + (Math.random() - 0.5) * maxRadius * 0.8;
                fur.rotation = Math.random() * Math.PI * 2;
                fur.vx = (Math.random() - 0.5) * 3;
                fur.vy = (Math.random() - 0.5) * 3;
                fur.rotSpeed = (Math.random() - 0.5) * 0.2;
                
                furs.push(fur);
                furParticles.addChild(fur);
            }
            
            container.addChild(furParticles);
            
            // Respingos de sangue mais espalhados
            const bloodSplatters = new PIXI.Container();
            const splatters = [];
            
            for (let i = 0; i < 20; i++) {
                const splatter = new PIXI.Graphics();
                splatter.beginFill(0xAA0000, 0.8);
                splatter.drawCircle(0, 0, 1 + Math.random() * 4);
                splatter.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * maxRadius * 0.8; // Mais espalhado
                splatter.x = centerX + Math.cos(angle) * distance;
                splatter.y = centerY + Math.sin(angle) * distance;
                splatter.visible = false;
                splatter.life = 0;
                
                splatters.push(splatter);
                bloodSplatters.addChild(splatter);
            }
            
            container.addChild(bloodSplatters);
            
            // Animação
            const startTime = Date.now();
            let clawAnimPhase = 0;
            let firstClawSet = [];
            let secondClawSet = [];
            
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                // Animar marcas de garra maiores com mudança de cor
                if (progress > 0.1 && clawAnimPhase === 0) {
                    clawAnimPhase = 1;
                    
                    clawMarks.clear();
                    
                    // Primeiro conjunto (esquerda para direita) - maior
                    for (let i = 0; i < 4; i++) {
                        const startX = centerX - maxRadius * 0.4;
                        const startY = centerY - 40 + i * 20;
                        const endX = centerX + maxRadius * 0.4;
                        const endY = centerY - 30 + i * 20;
                        
                        const clawGraphic = new PIXI.Graphics();
                        clawGraphic.lineStyle(4 + Math.random() * 4, 0x660000, 0.9);
                        clawGraphic.moveTo(startX, startY);
                        
                        // Criar linha serrilhada
                        const segments = 10;
                        for (let seg = 0; seg <= segments; seg++) {
                            const t = seg / segments;
                            const x = startX + (endX - startX) * t;
                            const y = startY + (endY - startY) * t;
                            const jaggedness = (Math.random() - 0.5) * 6;
                            
                            clawGraphic.lineTo(x + jaggedness, y + jaggedness);
                        }
                        
                        firstClawSet.push(clawGraphic);
                        clawMarks.addChild(clawGraphic);
                    }
                }
                
                if (progress > 0.4 && clawAnimPhase === 1) {
                    clawAnimPhase = 2;
                    
                    // Segundo conjunto (direita para esquerda) - maior
                    for (let i = 0; i < 4; i++) {
                        const startX = centerX + maxRadius * 0.4;
                        const startY = centerY - 30 + i * 20;
                        const endX = centerX - maxRadius * 0.4;
                        const endY = centerY - 20 + i * 20;
                        
                        const clawGraphic = new PIXI.Graphics();
                        clawGraphic.lineStyle(4 + Math.random() * 4, 0x660000, 0.9);
                        clawGraphic.moveTo(startX, startY);
                        
                        const segments = 10;
                        for (let seg = 0; seg <= segments; seg++) {
                            const t = seg / segments;
                            const x = startX + (endX - startX) * t;
                            const y = startY + (endY - startY) * t;
                            const jaggedness = (Math.random() - 0.5) * 6;
                            
                            clawGraphic.lineTo(x + jaggedness, y + jaggedness);
                        }
                        
                        secondClawSet.push(clawGraphic);
                        clawMarks.addChild(clawGraphic);
                    }
                }
                
                // Mudança de cor progressiva das garras
                const colorProgress = Math.max(0, progress - 0.3);
                
                // Primeiro conjunto ficando mais claro e transparente
                firstClawSet.forEach(claw => {
                    const fadeProgress = Math.min(colorProgress * 2, 1);
                    claw.tint = 0x660000 + Math.floor(fadeProgress * 0x994444);
                    claw.alpha = 1 - fadeProgress * 0.8;
                });
                
                // Segundo conjunto ficando mais claro e transparente
                if (progress > 0.4) {
                    const secondFadeProgress = Math.min((progress - 0.4) * 1.5, 1);
                    secondClawSet.forEach(claw => {
                        claw.tint = 0x660000 + Math.floor(secondFadeProgress * 0x994444);
                        claw.alpha = 1 - secondFadeProgress * 0.8;
                    });
                }
                
                // Animar pelos com fadeout
                furs.forEach(fur => {
                    fur.x += fur.vx;
                    fur.y += fur.vy;
                    fur.rotation += fur.rotSpeed;
                    
                    const distFromCenter = Math.sqrt((fur.x - centerX) ** 2 + (fur.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    fur.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                });
                
                // Mostrar sangue progressivamente com fadeout nas margens
                if (progress > 0.5) {
                    splatters.forEach((splatter, i) => {
                        if (!splatter.visible && Math.random() < 0.08) {
                            splatter.visible = true;
                            splatter.scale.set(0);
                        }
                        if (splatter.visible) {
                            splatter.scale.x = Math.min(splatter.scale.x + 0.1, 1);
                            splatter.scale.y = splatter.scale.x;
                            
                            const distFromCenter = Math.sqrt((splatter.x - centerX) ** 2 + (splatter.y - centerY) ** 2);
                            const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                            splatter.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                        }
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
    // 🩸 BLOOD/SANGUE - Vampiro
    // ========================================
    "blood_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Sanguíneo",
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
            
            // Presas vampíricas mais compridas
            const fangs = new PIXI.Graphics();
            container.addChild(fangs);
            
            // Nuvem de sangue do impacto (aparece rapidamente no momento do impacto)
            const bloodImpactCloud = new PIXI.Graphics();
            container.addChild(bloodImpactCloud);
            let impactCloudActive = false;
            let impactCloudLife = 0;
            
            // Partículas de sangue (só aparecem quando presas chegam)
            const bloodParticles = new PIXI.Container();
            const bloodDrops = [];
            let fangsReachedCenter = false;
            
            for (let i = 0; i < 40; i++) {
                const drop = new PIXI.Graphics();
                drop.beginFill(0xAA0000, 0.8);
                drop.drawCircle(0, 0, 2 + Math.random() * 3);
                drop.endFill();
                
                // Reflexo na gota
                drop.beginFill(0xFF6666, 0.4);
                drop.drawCircle(-0.5, -0.5, 1);
                drop.endFill();
                
                drop.x = centerX;
                drop.y = centerY;
                drop.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 6;
                drop.vx = Math.cos(angle) * speed;
                drop.vy = Math.sin(angle) * speed;
                drop.initialSize = drop.scale.x;
                drop.life = 0;
                drop.maxLife = 0.8;
                
                bloodDrops.push(drop);
                bloodParticles.addChild(drop);
            }
            
            container.addChild(bloodParticles);
            
            // Veias de sangue tremulantes
            const veins = new PIXI.Graphics();
            container.addChild(veins);
            
            // Animação
            let fangY = -app.view.height * 0.4; // Começar mais alto
            let fangsAtCenter = false;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                // Presas descendo MUITO mais rapidamente
                fangs.clear();
                if (progress < 0.15) { // Reduzido de 0.4 para 0.25 (mais rápido)
                    const dropSpeed = progress / 0.15; // Velocidade aumentada
                    fangY = -app.view.height * 0.4 + dropSpeed * (centerY + app.view.height * 0.4);
                    
                    fangs.beginFill(0xFFFFFF, 0.9);
                    // Presas mais compridas
                    const fangHeight = app.view.height * 0.2;
                    
                    // Presa esquerda
                    fangs.moveTo(centerX - 25, fangY - fangHeight);
                    fangs.lineTo(centerX - 20, fangY);
                    fangs.lineTo(centerX - 15, fangY - fangHeight);
                    fangs.closePath();
                    
                    // Presa direita
                    fangs.moveTo(centerX + 15, fangY - fangHeight);
                    fangs.lineTo(centerX + 20, fangY);
                    fangs.lineTo(centerX + 25, fangY - fangHeight);
                    fangs.closePath();
                    fangs.endFill();
                    
                } else if (progress < 0.4) { // Reduzido de 0.7 para 0.5
                    // Presas param no centro e ficam transparentes
                    if (!fangsAtCenter) {
                        fangsAtCenter = true;
                        fangsReachedCenter = true;
                        
                        // IMPACTO: Ativar nuvem de sangue
                        impactCloudActive = true;
                        impactCloudLife = 0;
                        
                        // Emitir partículas quando chegam ao centro
                        bloodDrops.forEach(drop => {
                            drop.visible = true;
                        });
                    }
                    
                    const fadeProgress = (progress - 0.25) / 0.25; // Ajustado
                    fangs.beginFill(0xFFFFFF, 0.9 * (1 - fadeProgress));
                    
                    const fangHeight = app.view.height * 0.6;
                    
                    // Presas no centro
                    fangs.moveTo(centerX - 25, centerY - fangHeight);
                    fangs.lineTo(centerX - 20, centerY);
                    fangs.lineTo(centerX - 15, centerY - fangHeight);
                    fangs.closePath();
                    
                    fangs.moveTo(centerX + 15, centerY - fangHeight);
                    fangs.lineTo(centerX + 20, centerY);
                    fangs.lineTo(centerX + 25, centerY - fangHeight);
                    fangs.closePath();
                    fangs.endFill();
                }
                
                // Animar nuvem de sangue do impacto (bem rápida)
                if (impactCloudActive) {
                    impactCloudLife += 0.045; // Bem rápido
                    
                    bloodImpactCloud.clear();
                    
                    if (impactCloudLife < 1.0) {
                        const cloudAlpha = Math.sin(impactCloudLife * Math.PI) * 0.8;
                        const cloudSize = 20 + impactCloudLife * 30; // Expande rapidamente
                        
                        // Nuvem principal de sangue
                        bloodImpactCloud.beginFill(0x880000, cloudAlpha);
                        bloodImpactCloud.drawCircle(centerX, centerY, cloudSize);
                        bloodImpactCloud.endFill();
                        
                        // Salpicos ao redor
                        for (let i = 0; i < 15; i++) {
                            const angle = (i / 15) * Math.PI * 2;
                            const splatDistance = cloudSize * 1.0;
                            const splatX = centerX + Math.cos(angle) * splatDistance;
                            const splatY = centerY + Math.sin(angle) * splatDistance;
                            const splatSize = 5 + Math.random() * 15;
                            
                            bloodImpactCloud.beginFill(0xAA0000, cloudAlpha * 0.6);
                            bloodImpactCloud.drawCircle(splatX, splatY, splatSize);
                            bloodImpactCloud.endFill();
                        }
                    } else {
                        impactCloudActive = false;
                    }
                }
                
                // Partículas de sangue saindo do centro (só quando presas chegam)
                if (fangsReachedCenter) {
                    bloodDrops.forEach(drop => {
                        if (drop.visible) {
                            drop.x += drop.vx;
                            drop.y += drop.vy;
                            drop.life += 0.03;
                            
                            if (drop.life > drop.maxLife) {
                                drop.life = 0;
                                drop.x = centerX;
                                drop.y = centerY;
                                const angle = Math.random() * Math.PI * 2;
                                const speed = 3 + Math.random() * 6;
                                drop.vx = Math.cos(angle) * speed;
                                drop.vy = Math.sin(angle) * speed;
                            }
                            
                            const distFromCenter = Math.sqrt((drop.x - centerX) ** 2 + (drop.y - centerY) ** 2);
                            const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                            
                            const distanceRatio = distFromCenter / (maxRadius * 0.5);
                            drop.scale.set(drop.initialSize * Math.max(0.2, 1 - distanceRatio * 0.8));
                            drop.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - drop.life / drop.maxLife);
                        }
                    });
                }
                
                // Veias tremulantes
                veins.clear();
                
                const veinCount = 2;
                for (let i = 0; i < veinCount; i++) {
                    const angle = (i / veinCount) * Math.PI * 2 + elapsed * 2;
                    const veinAlpha = 0.2 + Math.sin(elapsed * 8 + i) * 0.1;
                    
                    veins.lineStyle(1, 0x660000, veinAlpha * Math.sin(progress * Math.PI));
                    
                    const startRadius = 20;
                    const endRadius = maxRadius * 0.4;
                    
                    veins.moveTo(
                        centerX + Math.cos(angle) * startRadius,
                        centerY + Math.sin(angle) * startRadius
                    );
                    
                    // Linha tremulante
                    for (let j = 0; j < 6; j++) {
                        const t = j / 6;
                        const radius = startRadius + (endRadius - startRadius) * t;
                        const wobble = Math.sin(elapsed * 12 + j + i) * 8;
                        
                        veins.lineTo(
                            centerX + Math.cos(angle) * radius + wobble,
                            centerY + Math.sin(angle) * radius
                        );
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
    // ⚡ ELECTRIC/ELÉTRICO - Elemental
    // ========================================
    "electric_damage": {
        duration: 800, // OTIMIZADO: 1600ms → 800ms (-50%)
        name: "Dano Elétrico",
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
            
            // Shader elétrico
            const electricFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Interferência elétrica centralizada
                    float noise = random(uv + time) * 0.3;
                    vec2 offset = vec2(
                        sin(uv.y * 60.0 + time * 30.0) * 0.005,
                        cos(uv.x * 60.0 + time * 25.0) * 0.005
                    ) * intensity * (1.0 - smoothstep(0.0, 0.4, dist));
                    
                    vec4 color = texture2D(uSampler, uv + offset);
                    
                    // Linhas de scan elétricas
                    float scanline = sin(uv.y * 400.0 + time * 15.0) * 0.02;
                    color.rgb += scanline * intensity * (1.0 - smoothstep(0.0, 0.3, dist));
                    
                    // Cor elétrica
                    vec3 electricColor = vec3(0.6, 0.9, 1.0);
                    color.rgb = mix(color.rgb, electricColor, intensity * 0.3 * (1.0 - smoothstep(0.0, 0.35, dist)));
                    
                    // Flash aleatório central
                    if (noise > 0.95 && dist < 0.3) {
                        color.rgb = vec3(1.0, 1.0, 1.0);
                    }
                    
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
            bg.filters = [electricFilter];
            container.addChild(bg);
            
            // Raios elétricos com brilho
            const lightning = new PIXI.Graphics();
            container.addChild(lightning);
            
            // Partículas elétricas efêmeras no centro
            const electricParticles = new PIXI.Container();
            const sparks = [];
            
            for (let i = 0; i < 40; i++) {
                const spark = new PIXI.Graphics();
                spark.lineStyle(1.5, 0x00FFFF, 1);
                spark.moveTo(0, 0);
                spark.lineTo(6 + Math.random() * 4, 0);
                
                spark.x = centerX + (Math.random() - 0.5) * 40;
                spark.y = centerY + (Math.random() - 0.5) * 40;
                spark.rotation = Math.random() * Math.PI * 2;
                spark.vx = (Math.random() - 0.5) * 8;
                spark.vy = (Math.random() - 0.5) * 8;
                spark.life = 0;
                spark.maxLife = 0.2 + Math.random() * 0.3; // Muito efêmeras
                spark.initialX = spark.x;
                spark.initialY = spark.y;
                
                sparks.push(spark);
                electricParticles.addChild(spark);
            }
            
            container.addChild(electricParticles);
            
            // Arcos elétricos
            const arcs = [];
            for (let i = 0; i < 6; i++) {
                arcs.push({
                    start: { 
                        x: centerX + (Math.random() - 0.5) * 60, 
                        y: centerY + (Math.random() - 0.5) * 60 
                    },
                    end: { 
                        x: centerX + (Math.random() - 0.5) * 60, 
                        y: centerY + (Math.random() - 0.5) * 60 
                    },
                    life: 0
                });
            }
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                electricFilter.uniforms.time = elapsed;
                electricFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Desenhar raios com brilho
                lightning.clear();
                
                // Raio principal com brilho
                if (Math.random() < 0.15 || (progress > 0.3 && progress < 0.7)) {
                    // Brilho do raio
                    lightning.lineStyle(8, 0x88DDFF, 0.3);
                    
                    const segments = 8;
                    lightning.moveTo(centerX, centerY - maxRadius * 0.3);
                    
                    for (let i = 1; i <= segments; i++) {
                        const t = i / segments;
                        const x = centerX + (Math.random() - 0.5) * 30;
                        const y = centerY - maxRadius * 0.3 + t * maxRadius * 0.6;
                        lightning.lineTo(x, y);
                        
                        // Ramificações
                        if (Math.random() < 0.4) {
                            const branchX = x + (Math.random() - 0.5) * 40;
                            const branchY = y + Math.random() * 20;
                            lightning.moveTo(x, y);
                            lightning.lineTo(branchX, branchY);
                            lightning.moveTo(x, y);
                        }
                    }
                    
                    // Raio principal brilhante
                    lightning.lineStyle(2, 0x00FFFF, 1);
                    lightning.moveTo(centerX, centerY - maxRadius * 0.3);
                    
                    for (let i = 1; i <= segments; i++) {
                        const t = i / segments;
                        const x = centerX + (Math.random() - 0.5) * 30;
                        const y = centerY - maxRadius * 0.3 + t * maxRadius * 0.6;
                        lightning.lineTo(x, y);
                    }
                }
                
                // Arcos elétricos entre pontos
                arcs.forEach(arc => {
                    arc.life += 0.08;
                    if (arc.life > 1) {
                        arc.start = { 
                            x: centerX + (Math.random() - 0.5) * 60, 
                            y: centerY + (Math.random() - 0.5) * 60 
                        };
                        arc.end = { 
                            x: centerX + (Math.random() - 0.5) * 60, 
                            y: centerY + (Math.random() - 0.5) * 60 
                        };
                        arc.life = 0;
                    }
                    
                    if (arc.life > 0.7) {
                        // Brilho do arco
                        lightning.lineStyle(4, 0x66CCFF, (1 - arc.life) * 2);
                        lightning.moveTo(arc.start.x, arc.start.y);
                        lightning.quadraticCurveTo(
                            (arc.start.x + arc.end.x) / 2 + Math.sin(elapsed * 15) * 10,
                            (arc.start.y + arc.end.y) / 2 + Math.cos(elapsed * 15) * 10,
                            arc.end.x, arc.end.y
                        );
                        
                        // Arco principal
                        lightning.lineStyle(1, 0x00FFFF, (1 - arc.life) * 4);
                        lightning.moveTo(arc.start.x, arc.start.y);
                        lightning.quadraticCurveTo(
                            (arc.start.x + arc.end.x) / 2 + Math.sin(elapsed * 15) * 10,
                            (arc.start.y + arc.end.y) / 2 + Math.cos(elapsed * 15) * 10,
                            arc.end.x, arc.end.y
                        );
                    }
                });
                
                // Animar partículas efêmeras
                sparks.forEach(spark => {
                    spark.x += spark.vx;
                    spark.y += spark.vy;
                    spark.life += 0.03;
                    
                    if (spark.life > spark.maxLife) {
                        spark.life = 0;
                        spark.x = centerX + (Math.random() - 0.5) * 40;
                        spark.y = centerY + (Math.random() - 0.5) * 40;
                        spark.vx = (Math.random() - 0.5) * 8;
                        spark.vy = (Math.random() - 0.5) * 8;
                    }
                    
                    const distFromCenter = Math.sqrt((spark.x - centerX) ** 2 + (spark.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    // Transparência rapidamente perdida
                    const lifeAlpha = 1 - (spark.life / spark.maxLife);
                    spark.alpha = Math.sin(progress * Math.PI) * fadeAlpha * lifeAlpha;
                    spark.scale.set(1 + Math.sin(elapsed * 25 + spark.life * 20) * 0.5);
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

});