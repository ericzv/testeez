// shaders-attacks2.js - Shaders part 2
// Adiciona mais shaders ao dicionário existente

// SHADERS PRESENTES: POISON, WIND, VOID, FIRE, ICE

Object.assign(window.BOSS_DAMAGE_SHADERS, {

    // ========================================
    // 🧪 POISON/VENENO - Ninja
    // ========================================
    "poison_damage": {
        duration: 1600,
        name: "Dano Venenoso",
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
            
            // Shader de veneno centralizado
            const poisonFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção tóxica centralizada
                    float wave = sin(uv.y * 15.0 + time * 4.0) * 0.008;
                    wave += cos(uv.x * 20.0 + time * 3.0) * 0.008;
                    wave *= 1.0 - smoothstep(0.0, 0.4, dist);
                    uv += wave * intensity;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor verde tóxica
                    vec3 poisonColor = vec3(0.3, 0.9, 0.4);
                    color.rgb = mix(color.rgb, poisonColor, intensity * 0.4 * (1.0 - smoothstep(0.0, 0.35, dist)));
                    
                    // Bolhas de ácido centralizadas
                    for(float i = 0.0; i < 4.0; i++) {
                        vec2 bubblePos = center + vec2(
                            sin(time * 3.0 + i * 1.5) * 0.15,
                            cos(time * 2.5 + i * 2.0) * 0.15
                        );
                        float bubble = 1.0 - smoothstep(0.0, 0.03, distance(uv, bubblePos));
                        color.rgb += poisonColor * bubble * intensity * 0.6;
                    }
                    
                    // Névoa tóxica
                    float fog = sin(uv.x * 8.0 + uv.y * 8.0 + time * 2.0) * 0.5 + 0.5;
                    fog *= 1.0 - smoothstep(0.0, 0.3, dist);
                    color.rgb = mix(color.rgb, poisonColor * 0.4, fog * intensity * 0.2);
                    
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
            bg.filters = [poisonFilter];
            container.addChild(bg);
            
            // Bolhas de veneno centrífugas
            const bubbles = new PIXI.Container();
            const bubbleList = [];
            
            for (let i = 0; i < 25; i++) {
                const bubble = new PIXI.Graphics();
                bubble.lineStyle(1.5, 0x00FF00, 0.7);
                bubble.beginFill(0x00FF00, 0.4);
                bubble.drawCircle(0, 0, 3 + Math.random() * 6);
                bubble.endFill();
                
                bubble.x = centerX;
                bubble.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                bubble.vx = Math.cos(angle) * speed;
                bubble.vy = Math.sin(angle) * speed;
                bubble.life = Math.random() * 0.5;
                bubble.maxLife = 1.2;
                bubble.initialScale = bubble.scale.x;
                
                bubbleList.push(bubble);
                bubbles.addChild(bubble);
            }
            
            container.addChild(bubbles);
            
            // Fumacinha tóxica saindo do centro
            const toxicSmoke = new PIXI.Container();
            const smokeParticles = [];
            
            for (let i = 0; i < 30; i++) {
                const smoke = new PIXI.Graphics();
                smoke.beginFill(0x44FF44, 0.3);
                smoke.drawCircle(0, 0, 4 + Math.random() * 6);
                smoke.endFill();
                
                smoke.x = centerX;
                smoke.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 2;
                smoke.vx = Math.cos(angle) * speed;
                smoke.vy = Math.sin(angle) * speed;
                smoke.life = Math.random() * 0.3;
                smoke.maxLife = 1.5;
                smoke.rotSpeed = (Math.random() - 0.5) * 0.05;
                
                smokeParticles.push(smoke);
                toxicSmoke.addChild(smoke);
            }
            
            container.addChild(toxicSmoke);
            
            // Névoa adicional do centro
            const poisonMist = new PIXI.Container();
            const mistParticles = [];
            
            for (let i = 0; i < 20; i++) {
                const mist = new PIXI.Graphics();
                mist.beginFill(0x88FF88, 0.2);
                mist.drawCircle(0, 0, 6 + Math.random() * 8);
                mist.endFill();
                
                mist.x = centerX;
                mist.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.3 + Math.random() * 1.5;
                mist.vx = Math.cos(angle) * speed;
                mist.vy = Math.sin(angle) * speed;
                mist.life = Math.random() * 0.2;
                mist.maxLife = 2.0;
                
                mistParticles.push(mist);
                poisonMist.addChild(mist);
            }
            
            container.addChild(poisonMist);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                poisonFilter.uniforms.time = elapsed;
                poisonFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar bolhas centrífugas
                bubbleList.forEach(bubble => {
                    bubble.x += bubble.vx;
                    bubble.y += bubble.vy;
                    bubble.life += 0.02;
                    
                    if (bubble.life > bubble.maxLife) {
                        bubble.life = 0;
                        bubble.x = centerX;
                        bubble.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 1 + Math.random() * 3;
                        bubble.vx = Math.cos(angle) * speed;
                        bubble.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((bubble.x - centerX) ** 2 + (bubble.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    bubble.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - bubble.life / bubble.maxLife);
                    bubble.scale.set(bubble.initialScale + bubble.life * 0.3);
                });
                
                // Animar fumacinha
                smokeParticles.forEach(smoke => {
                    smoke.x += smoke.vx;
                    smoke.y += smoke.vy;
                    smoke.life += 0.015;
                    smoke.rotation += smoke.rotSpeed;
                    
                    if (smoke.life > smoke.maxLife) {
                        smoke.life = 0;
                        smoke.x = centerX;
                        smoke.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 0.5 + Math.random() * 2;
                        smoke.vx = Math.cos(angle) * speed;
                        smoke.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((smoke.x - centerX) ** 2 + (smoke.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    smoke.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - smoke.life / smoke.maxLife) * 0.6;
                    smoke.scale.set(1 + smoke.life * 2);
                });
                
                // Animar névoa adicional
                mistParticles.forEach(mist => {
                    mist.x += mist.vx;
                    mist.y += mist.vy;
                    mist.life += 0.01;
                    
                    if (mist.life > mist.maxLife) {
                        mist.life = 0;
                        mist.x = centerX;
                        mist.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 0.3 + Math.random() * 1.5;
                        mist.vx = Math.cos(angle) * speed;
                        mist.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((mist.x - centerX) ** 2 + (mist.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    mist.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - mist.life / mist.maxLife) * 0.4;
                    mist.scale.set(1 + mist.life * 3);
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
    // 🌬️ WIND/VENTO - Ronin
    // ========================================
    "wind_damage": {
        duration: 1600,
        name: "Dano de Vento",
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
            
            // Shader de redemoinho rápido com fade-in/fade-out
            const windFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                uniform float fadePhase;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Redemoinho rápido centrífugo
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    
                    // Rotação do redemoinho (mais rápida no centro)
                    float rotationSpeed = (1.0 - dist) * 15.0 + 5.0;
                    float spiralAngle = angle + time * rotationSpeed;
                    
                    // Distorção espiral
                    float spiralRadius = dist + sin(spiralAngle * 3.0 + time * 8.0) * 0.02;
                    vec2 spiralUV = center + vec2(cos(spiralAngle), sin(spiralAngle)) * spiralRadius;
                    
                    // Turbulência adicional
                    float turbulence1 = sin(spiralAngle * 6.0 + time * 12.0) * 0.015;
                    float turbulence2 = cos(spiralAngle * 4.0 + time * 10.0) * 0.01;
                    spiralUV += vec2(turbulence1, turbulence2) * (1.0 - dist);
                    
                    vec4 color = texture2D(uSampler, spiralUV);
                    
                    // Efeito de redemoinho visual
                    float whirlpool = sin(angle * 8.0 + dist * 20.0 - time * 25.0) * 0.5 + 0.5;
                    whirlpool *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Anéis de vento concêntricos
                    float windRings = 0.0;
                    for(float i = 1.0; i < 5.0; i++) {
                        float ringDist = abs(dist - i * 0.08);
                        float ring = 1.0 - smoothstep(0.0, 0.02, ringDist);
                        ring *= sin(time * 20.0 + i * 3.0) * 0.5 + 0.5;
                        windRings += ring;
                    }
                    windRings *= 1.0 - smoothstep(0.0, 0.35, dist);
                    
                    // Vórtice central intenso
                    float vortex = 1.0 - smoothstep(0.0, 0.2, dist);
                    vortex *= sin(time * 30.0 + angle * 10.0) * 0.5 + 0.5;
                    
                    // Cor do vento com diferentes tonalidades
                    vec3 windColor1 = vec3(0.9, 0.95, 1.0);    // Azul claro
                    vec3 windColor2 = vec3(0.8, 0.9, 1.0);     // Azul mais forte
                    vec3 windColor3 = vec3(0.7, 0.85, 0.95);   // Azul acinzentado
                    
                    // Misturar as cores baseado no redemoinho
                    vec3 finalWindColor = mix(windColor3, windColor1, whirlpool);
                    finalWindColor = mix(finalWindColor, windColor2, vortex * 0.5);
                    
                    color.rgb = mix(color.rgb, finalWindColor, whirlpool * intensity * 0.6);
                    color.rgb += windColor1 * windRings * intensity * 0.4;
                    color.rgb += windColor2 * vortex * intensity * 0.5;
                    
                    // Transparência progressiva baseada na distância do centro
                    float centerFade = 1.0 - smoothstep(0.0, 0.45, dist);
                    
                    // Fade-in e fade-out baseado na fase
                    float timeFade = 1.0;
                    if (fadePhase < 0.3) {
                        // Fade-in rápido
                        timeFade = fadePhase / 0.3;
                    } else if (fadePhase > 0.7) {
                        // Fade-out rápido
                        timeFade = (1.0 - fadePhase) / 0.3;
                    }
                    
                    color.a = intensity * centerFade * timeFade;
                    
                    gl_FragColor = color;
                }
            `, {
                time: 0,
                intensity: 0,
                fadePhase: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [windFilter];
            container.addChild(bg);
            
            // Folhas voando no redemoinho
            const leaves = new PIXI.Container();
            const leafList = [];
            
            for (let i = 0; i < 20; i++) {
                const leaf = new PIXI.Graphics();
                leaf.beginFill(0x90EE90, 0.8);
                leaf.moveTo(0, 0);
                leaf.quadraticCurveTo(3, -3, 6, 0);
                leaf.quadraticCurveTo(3, 3, 0, 0);
                leaf.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius * 0.4;
                leaf.x = centerX + Math.cos(angle) * radius;
                leaf.y = centerY + Math.sin(angle) * radius;
                leaf.baseAngle = angle;
                leaf.baseRadius = radius;
                leaf.rotation = Math.random() * Math.PI * 2;
                leaf.rotSpeed = (Math.random() - 0.5) * 2.3;
                leaf.life = Math.random() * 0.5;
                leaf.maxLife = 0.8;
                
                leafList.push(leaf);
                leaves.addChild(leaf);
            }
            
            container.addChild(leaves);
            
            // Partículas de ar girando rapidamente
            const airParticles = new PIXI.Container();
            const airList = [];
            
            for (let i = 0; i < 20; i++) {
                const air = new PIXI.Graphics();
                air.beginFill(0xE0E0E0, 0.6);
                air.drawCircle(0, 0, 1 + Math.random());
                air.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius * 0.3;
                air.x = centerX + Math.cos(angle) * radius;
                air.y = centerY + Math.sin(angle) * radius;
                air.baseAngle = angle;
                air.baseRadius = radius;
                air.life = Math.random() * 0.2;
                air.maxLife = 0.6;
                
                airList.push(air);
                airParticles.addChild(air);
            }
            
            container.addChild(airParticles);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                windFilter.uniforms.time = elapsed;
                windFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                windFilter.uniforms.fadePhase = progress;
                
                // Animar folhas no redemoinho
                leafList.forEach(leaf => {
                    // Rotação rápida do redemoinho
                    leaf.baseAngle += 0.22; // Rotação rápida
                    leaf.x = centerX + Math.cos(leaf.baseAngle) * leaf.baseRadius;
                    leaf.y = centerY + Math.sin(leaf.baseAngle) * leaf.baseRadius;
                    leaf.rotation += leaf.rotSpeed;
                    leaf.life += 0.06;
                    
                    if (leaf.life > leaf.maxLife) {
                        leaf.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        leaf.baseRadius = Math.random() * maxRadius * 0.4;
                        leaf.baseAngle = angle;
                    }
                    
                    const distFromCenter = Math.sqrt((leaf.x - centerX) ** 2 + (leaf.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    // Fade-in e fade-out temporal
                    let timeFade = 1.0;
                    if (progress < 0.3) {
                        timeFade = progress / 0.3;
                    } else if (progress > 0.7) {
                        timeFade = (1.0 - progress) / 0.3;
                    }
                    
                    leaf.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - leaf.life / leaf.maxLife) * timeFade;
                });
                
                // Animar partículas de ar
                airList.forEach(air => {
                    // Rotação ainda mais rápida
                    air.baseAngle += 0.25;
                    air.x = centerX + Math.cos(air.baseAngle) * air.baseRadius;
                    air.y = centerY + Math.sin(air.baseAngle) * air.baseRadius;
                    air.life += 0.06;
                    
                    if (air.life > air.maxLife) {
                        air.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        air.baseRadius = Math.random() * maxRadius * 0.5;
                        air.baseAngle = angle;
                    }
                    
                    const distFromCenter = Math.sqrt((air.x - centerX) ** 2 + (air.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    // Fade-in e fade-out temporal
                    let timeFade = 1.0;
                    if (progress < 0.3) {
                        timeFade = progress / 0.3;
                    } else if (progress > 0.7) {
                        timeFade = (1.0 - progress) / 0.3;
                    }
                    
                    air.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - air.life / air.maxLife) * timeFade;
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
    // 🕳️ VOID/VAZIO - Samurai
    // ========================================
    "void_damage": {
        duration: 1600,
        name: "Dano do Vazio",
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
            
            // Shader de vazio mais visível
            const voidFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Sucção do vazio
                    vec2 dir = normalize(uv - center);
                    float suck = sin(dist * 25.0 - time * 8.0) * 0.02 * intensity;
                    uv = center + dir * (dist - suck);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Escurecimento progressivo mais intenso
                    float darkness = 1.0 - smoothstep(0.0, 0.4, dist);
                    color.rgb *= 1.0 - darkness * intensity * 0.8;
                    
                    // Vórtice de aniquilação com brilho roxo
                    float vortex = sin(atan(dir.y, dir.x) * 12.0 + dist * 20.0 - time * 15.0) * 0.5 + 0.5;
                    vortex *= 1.0 - smoothstep(0.0, 0.3, dist);
                    
                    // Cor do vazio com brilho roxo claro
                    vec3 voidColor = vec3(0.2, 0.1, 0.4);
                    vec3 voidGlow = vec3(0.6, 0.3, 0.8);
                    
                    color.rgb = mix(color.rgb, voidColor, vortex * intensity * 0.5);
                    color.rgb += voidGlow * vortex * intensity * 0.3;
                    
                    // Pulsação central roxa
                    float centralPulse = 1.0 - smoothstep(0.0, 0.2, dist);
                    centralPulse *= sin(time * 8.0) * 0.5 + 0.5;
                    color.rgb += vec3(0.7, 0.4, 0.9) * centralPulse * intensity * 0.4;
                    
                    // Fadeout nas bordas
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
            bg.filters = [voidFilter];
            container.addChild(bg);
            
            // Runa temporal central com brilho roxo
            const centralRune = new PIXI.Text('⚚', {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0x9A2EFE,
                stroke: 0xFFFFFF,
                strokeThickness: 2
            });
            centralRune.anchor.set(0.5);
            centralRune.x = centerX;
            centralRune.y = centerY;
            container.addChild(centralRune);
            
            // Mini buracos negros orbitando
            const blackHoles = new PIXI.Graphics();
            container.addChild(blackHoles);
            
            // Múltiplas camadas de fragmentos girando
            const fragmentLayers = [];
            
            for (let layer = 0; layer < 4; layer++) {
                const layerContainer = new PIXI.Container();
                const fragments = [];
                const numFragments = 8 + layer * 4;
                const layerRadius = 40 + layer * 25;
                
                for (let i = 0; i < numFragments; i++) {
                    const fragment = new PIXI.Graphics();
                    fragment.beginFill(0x6633CC, 0.8);
                    fragment.drawRect(-1.5, -1.5, 3, 3);
                    fragment.endFill();
                    
                    // Brilho roxo
                    fragment.lineStyle(0.5, 0x9966FF, 0.6);
                    fragment.drawRect(-2, -2, 4, 4);
                    
                    const angle = (i / numFragments) * Math.PI * 2;
                    fragment.x = centerX + Math.cos(angle) * layerRadius;
                    fragment.y = centerY + Math.sin(angle) * layerRadius;
                    fragment.baseAngle = angle;
                    fragment.baseRadius = layerRadius;
                    fragment.rotSpeed = (Math.random() - 0.5) * 0.2;
                    
                    fragments.push(fragment);
                    layerContainer.addChild(fragment);
                }
                
                fragmentLayers.push({
                    container: layerContainer,
                    fragments: fragments,
                    baseRadius: layerRadius,
                    rotationSpeed: (layer % 2 === 0) ? 0.03 : -0.04,
                    shrinkRate: 0.998 + layer * 0.0005
                });
                
                container.addChild(layerContainer);
            }
            
            // Linhas de absorção
            const absorptionLines = new PIXI.Graphics();
            container.addChild(absorptionLines);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                voidFilter.uniforms.time = elapsed;
                voidFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar runa central com brilho roxo
                centralRune.rotation += 0.05;
                centralRune.scale.set(0.5 + Math.sin(elapsed * 2) * 1.1);
                centralRune.alpha = Math.sin(progress * Math.PI);
                
                // Desenhar mini buracos negros orbitando
                blackHoles.clear();
                
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + elapsed * 1.5;
                    const radius = 80 + Math.sin(elapsed * 2 + i) * 20;
                    
                    // Aproximação progressiva do centro
                    const approachFactor = Math.min(progress * 2, 1);
                    const currentRadius = radius * (1 - approachFactor * 0.6);
                    
                    const x = centerX + Math.cos(angle) * currentRadius;
                    const y = centerY + Math.sin(angle) * currentRadius;
                    const size = 12 + Math.sin(elapsed * 3 + i) * 4;
                    
                    // Buraco negro
                    blackHoles.beginFill(0x000000, Math.sin(progress * Math.PI) * 0.9);
                    blackHoles.drawCircle(x, y, size);
                    blackHoles.endFill();
                    
                    // Anel de distorção roxo
                    blackHoles.lineStyle(2, 0x9966FF, Math.sin(progress * Math.PI) * 0.7);
                    blackHoles.drawCircle(x, y, size + 3);
                    
                    // Brilho roxo claro
                    blackHoles.beginFill(0xCC99FF, Math.sin(progress * Math.PI) * 0.3);
                    blackHoles.drawCircle(x, y, size + 6);
                    blackHoles.endFill();
                }
                
                // Animar camadas de fragmentos
                fragmentLayers.forEach((layer, layerIndex) => {
                    layer.fragments.forEach((frag, i) => {
                        frag.baseAngle += layer.rotationSpeed;
                        layer.baseRadius *= layer.shrinkRate;
                        
                        if (layer.baseRadius < 15) {
                            layer.baseRadius = 40 + layerIndex * 25;
                        }
                        
                        frag.x = centerX + Math.cos(frag.baseAngle) * layer.baseRadius;
                        frag.y = centerY + Math.sin(frag.baseAngle) * layer.baseRadius;
                        frag.rotation += frag.rotSpeed;
                        
                        const distFromCenter = Math.sqrt((frag.x - centerX) ** 2 + (frag.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        
                        // Brilho roxo baseado na proximidade do centro
                        const proximityGlow = 1 + (1 - layer.baseRadius / (40 + layerIndex * 25)) * 0.5;
                        frag.alpha = Math.sin(progress * Math.PI) * fadeAlpha * proximityGlow;
                    });
                });
                
                // Desenhar linhas de absorção com brilho roxo
                absorptionLines.clear();
                
                const numLines = 12;
                for (let i = 0; i < numLines; i++) {
                    const baseAngle = (i / numLines) * Math.PI * 2;
                    const angle1 = baseAngle + elapsed * 3;
                    const angle2 = baseAngle - elapsed * 4;
                    
                    for (let direction = 0; direction < 2; direction++) {
                        const angle = direction === 0 ? angle1 : angle2;
                        const alpha = Math.sin(progress * Math.PI) * 0.6;
                        
                        absorptionLines.lineStyle(2, 0x9966FF, alpha);
                        
                        const startRadius = maxRadius * 0.4;
                        const endRadius = 1;
                        const segments = 8;
                        
                        for (let seg = 0; seg < segments; seg++) {
                            const t = seg / segments;
                            const radius = startRadius - (startRadius - endRadius) * t;
                            const thickness = 2 + (1 - t) * 2;
                            const x = centerX + Math.cos(angle) * radius;
                            const y = centerY + Math.sin(angle) * radius;
                            
                            if (seg === 0) {
                                absorptionLines.moveTo(x, y);
                            } else {
                                absorptionLines.lineTo(x, y);
                            }
                            
                            absorptionLines.lineStyle(thickness, 0x9966FF, alpha * (1 - t * 0.5));
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
    // 🔥 FIRE/FOGO - Vários
    // ========================================
    "fire_damage": {
        duration: 1600,
        name: "Dano de Fogo",
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
            
            // Shader de fogo realista com filtro vermelho gradiente
            const fireFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção de calor ondulatório mais intensa
                    float heat1 = sin(uv.y * 30.0 + time * 12.0) * 0.02;
                    float heat2 = cos(uv.x * 20.0 + time * 10.0) * 0.015;
                    float heat3 = sin((uv.x + uv.y) * 25.0 + time * 15.0) * 0.01;
                    
                    vec2 heatDistortion = vec2(heat1 + heat2, heat2 + heat3);
                    heatDistortion *= 1.0 - smoothstep(0.0, 0.4, dist);
                    uv += heatDistortion * intensity;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Núcleo do fogo (branco-amarelo)
                    float fireCore = 1.0 - smoothstep(0.0, 0.15, dist);
                    fireCore *= sin(time * 8.0) * 0.3 + 0.7;
                    
                    // Chamas internas (laranja-amarelo)
                    float innerFlames = 1.0 - smoothstep(0.1, 0.25, dist);
                    innerFlames *= sin(time * 6.0 + dist * 10.0) * 0.5 + 0.5;
                    
                    // Chamas externas (vermelho-laranja)
                    float outerFlames = 1.0 - smoothstep(0.2, 0.35, dist);
                    outerFlames *= sin(time * 4.0 + dist * 8.0) * 0.4 + 0.6;
                    
                    // Turbulência do fogo
                    float turbulence = sin(uv.x * 15.0 + time * 8.0) * cos(uv.y * 12.0 + time * 6.0);
                    turbulence = pow(max(0.0, turbulence), 2.0);
                    turbulence *= 1.0 - smoothstep(0.0, 0.3, dist);
                    
                    // Filtro vermelho gradiente radial
                    float redGradient = 1.0 - smoothstep(0.0, 0.4, dist);
                    vec3 redTint = vec3(1.0, 0.3, 0.1); // Vermelho no centro
                    vec3 yellowTint = vec3(1.0, 0.8, 0.2); // Amarelado nas bordas
                    vec3 gradientColor = mix(yellowTint, redTint, redGradient);
                    
                    // Cores do fogo
                    vec3 coreColor = vec3(1.0, 1.0, 0.9);      // Branco-amarelo
                    vec3 innerColor = vec3(1.0, 0.8, 0.2);     // Amarelo-laranja
                    vec3 outerColor = vec3(1.0, 0.4, 0.1);     // Laranja-vermelho
                    vec3 turbColor = vec3(1.0, 0.6, 0.0);      // Laranja puro
                    
                    // Misturar as cores do fogo
                    vec3 fireColor = outerColor * outerFlames * 0.8;
                    fireColor += innerColor * innerFlames * 0.9;
                    fireColor += coreColor * fireCore * 1.0;
                    fireColor += turbColor * turbulence * 0.7;
                    
                    // Aplicar filtro vermelho gradiente
                    fireColor = mix(fireColor, gradientColor, redGradient * intensity * 0.3);
                    
                    color.rgb = mix(color.rgb, fireColor, intensity * 0.7);
                    
                    // Fadeout nas bordas
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
            bg.filters = [fireFilter];
            container.addChild(bg);
            
            // Mais chamas principais subindo do centro
            const mainFlames = new PIXI.Container();
            const flames = [];
            
            for (let i = 0; i < 50; i++) { // Aumentado de 20 para 50
                const flame = new PIXI.Graphics();
                flame.beginFill(0xFF4400, 0.8);
                
                // Forma de chama variada
                const flameType = Math.floor(Math.random() * 3);
                if (flameType === 0) {
                    flame.drawEllipse(0, 0, 3 + Math.random() * 2, 6 + Math.random() * 4);
                } else if (flameType === 1) {
                    flame.drawPolygon([-2, 4, -1, -6, 0, -8, 1, -6, 2, 4, 0, 2]);
                } else {
                    flame.drawCircle(0, 0, 2 + Math.random() * 3);
                }
                flame.endFill();
                
                flame.x = centerX + (Math.random() - 0.5) * 40;
                flame.y = centerY + 20;
                flame.vy = -1 - Math.random() * 2;
                flame.vx = (Math.random() - 0.5) * 0.8;
                flame.life = 0;
                flame.maxLife = 0.8 + Math.random() * 0.6;
                flame.wavePhase = Math.random() * Math.PI * 2;
                flame.waveSpeed = 3 + Math.random() * 2;
                flame.colorPhase = Math.random();
                
                flames.push(flame);
                mainFlames.addChild(flame);
            }
            
            container.addChild(mainFlames);
            
            // Mais faíscas de fogo
            const sparks = new PIXI.Container();
            const sparkList = [];
            
            for (let i = 0; i < 10; i++) { // 25 faíscas
                const spark = new PIXI.Graphics();
                spark.beginFill(0xFFAA00, 0.9);
                spark.drawCircle(0, 0, 1 + Math.random() * 1.0);
                spark.endFill();
                
                spark.x = centerX;
                spark.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 6;
                spark.vx = Math.cos(angle) * speed;
                spark.vy = Math.sin(angle) * speed - 2;
                spark.life = 0;
                spark.maxLife = 0.4 + Math.random() * 0.3;
                spark.gravity = 0.1;
                
                sparkList.push(spark);
                sparks.addChild(spark);
            }
            
            container.addChild(sparks);
            
            // Mais partículas pequenas de fogo
            const microFlames = new PIXI.Container();
            const microList = [];
            
            for (let i = 0; i < 50; i++) { // Novas partículas pequenas
                const micro = new PIXI.Graphics();
                micro.beginFill(0xFF6600, 0.7);
                micro.drawCircle(0, 0, 0.5 + Math.random());
                micro.endFill();
                
                micro.x = centerX;
                micro.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                micro.vx = Math.cos(angle) * speed;
                micro.vy = Math.sin(angle) * speed - 1;
                micro.life = 0;
                micro.maxLife = 0.6 + Math.random() * 0.4;
                
                microList.push(micro);
                microFlames.addChild(micro);
            }
            
            container.addChild(microFlames);
            
            // Anel de fogo expandindo
            const fireRing = new PIXI.Graphics();
            container.addChild(fireRing);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                fireFilter.uniforms.time = elapsed;
                fireFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar chamas principais
                flames.forEach(flame => {
                    flame.life += 0.01;
                    if (flame.life > flame.maxLife) {
                        flame.life = 0;
                        flame.x = centerX + (Math.random() - 0.5) * 40;
                        flame.y = centerY + 20;
                        flame.vy = -1 - Math.random() * 2;
                    }
                    
                    flame.x += flame.vx + Math.sin(elapsed * flame.waveSpeed + flame.wavePhase) * 0.5;
                    flame.y += flame.vy;
                    
                    const colorProgress = flame.life / flame.maxLife;
                    if (colorProgress < 0.3) {
                        flame.tint = 0xFF2200;
                    } else if (colorProgress < 0.6) {
                        flame.tint = 0xFF6600;
                    } else {
                        flame.tint = 0xFFAA00;
                    }
                    
                    flame.scale.set(1 + Math.sin(elapsed * 4 + flame.colorPhase) * 0.2);
                    
                    const distFromCenter = Math.sqrt((flame.x - centerX) ** 2 + (flame.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    flame.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - flame.life / flame.maxLife);
                });
                
                // Animar faíscas
                sparkList.forEach(spark => {
                    spark.x += spark.vx;
                    spark.y += spark.vy;
                    spark.vy += spark.gravity;
                    spark.life += 0.04;
                    
                    if (spark.life > spark.maxLife) {
                        spark.life = 0;
                        spark.x = centerX;
                        spark.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 4 + Math.random() * 6;
                        spark.vx = Math.cos(angle) * speed;
                        spark.vy = Math.sin(angle) * speed - 2;
                    }
                    
                    const distFromCenter = Math.sqrt((spark.x - centerX) ** 2 + (spark.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    spark.alpha = Math.sin(progress * Math.PI) * fadeAlpha * Math.pow(1 - spark.life / spark.maxLife, 2);
                });
                
                // Animar micro partículas
                microList.forEach(micro => {
                    micro.x += micro.vx;
                    micro.y += micro.vy;
                    micro.life += 0.03;
                    
                    if (micro.life > micro.maxLife) {
                        micro.life = 0;
                        micro.x = centerX;
                        micro.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 2 + Math.random() * 4;
                        micro.vx = Math.cos(angle) * speed;
                        micro.vy = Math.sin(angle) * speed - 1;
                    }
                    
                    const distFromCenter = Math.sqrt((micro.x - centerX) ** 2 + (micro.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    micro.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - micro.life / micro.maxLife);
                });
                
                // Anel de fogo expandindo
                fireRing.clear();
                for (let i = 0; i < 3; i++) {
                    const ringProgress = (elapsed * 1.5 + i * 0.4) % 1.5;
                    const ringRadius = ringProgress * maxRadius * 0.6;
                    const ringAlpha = Math.max(0, 1 - ringProgress) * Math.sin(progress * Math.PI) * 0.5;
                    
                    const fadeAlpha = getFadeoutAlpha(ringRadius, maxRadius);
                    const finalAlpha = ringAlpha * fadeAlpha;
                    
                    if (finalAlpha > 0) {
                        fireRing.lineStyle(4, 0xFF4400, finalAlpha);
                        fireRing.drawCircle(centerX, centerY, ringRadius);
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
    // 🧊 ICE/GELO - Elemental
    // ========================================
    "ice_damage": {
        duration: 1600,
        name: "Dano de Gelo",
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
            
            // Shader de gelo centralizado
            const iceFilter = new PIXI.Filter(null, `
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
                    
                    // Congelamento progressivo central
                    float freeze = 1.0 - smoothstep(0.0, 0.4, dist);
                    freeze *= intensity;
                    
                    // Cristais de gelo
                    float crystals = 0.0;
                    for(float i = 0.0; i < 6.0; i++) {
                        vec2 crystalPos = center + vec2(
                            cos(i * 1.047 + time) * 0.15,
                            sin(i * 1.047 + time) * 0.15
                        );
                        float crystal = 1.0 - smoothstep(0.0, 0.03, distance(uv, crystalPos));
                        crystals += crystal;
                    }
                    
                    // Padrão hexagonal centralizado
                    float hex = abs(sin(uv.x * 20.0) * sin(uv.y * 20.0));
                    hex = pow(hex, 4.0);
                    hex *= freeze;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor de gelo
                    vec3 iceColor = vec3(0.7, 0.9, 1.0);
                    color.rgb = mix(color.rgb, iceColor, freeze * 0.5);
                    color.rgb += vec3(0.9, 0.95, 1.0) * crystals * intensity;
                    color.rgb += vec3(0.8, 0.9, 1.0) * hex * intensity;
                    
                    // Efeito de fosco
                    float frost = random(uv * 80.0) * freeze * 0.2;
                    color.rgb += vec3(frost);
                    
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
            bg.filters = [iceFilter];
            container.addChild(bg);
            
            // Cristais de gelo emitidos do centro
            const iceShards = new PIXI.Container();
            const shards = [];
            
            for (let i = 0; i < 20; i++) {
                const shard = new PIXI.Graphics();
                shard.beginFill(0x88CCFF, 0.8);
                
                // Cristal hexagonal
                const points = [];
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2;
                    const radius = 2 + Math.random() * 3;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                shard.drawPolygon(points);
                shard.endFill();
                
                // Brilho do cristal
                shard.lineStyle(0.5, 0xFFFFFF, 0.6);
                shard.drawPolygon(points);
                
                shard.x = centerX;
                shard.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                shard.vx = Math.cos(angle) * speed;
                shard.vy = Math.sin(angle) * speed;
                shard.rotation = Math.random() * Math.PI * 2;
                shard.rotSpeed = (Math.random() - 0.5) * 0.08;
                shard.life = Math.random() * 0.3;
                shard.maxLife = 1.2;
                
                shards.push(shard);
                iceShards.addChild(shard);
            }
            
            container.addChild(iceShards);
            
            // Flocos de neve do centro
            const snowflakes = new PIXI.Container();
            const flakes = [];
            
            for (let i = 0; i < 15; i++) {
                const flake = new PIXI.Graphics();
                flake.lineStyle(1, 0xFFFFFF, 0.8);
                
                // Floco de neve detalhado
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2;
                    flake.moveTo(0, 0);
                    flake.lineTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
                    
                    // Ramificações
                    const branchX = Math.cos(angle) * 3;
                    const branchY = Math.sin(angle) * 3;
                    flake.moveTo(branchX, branchY);
                    flake.lineTo(branchX + Math.cos(angle + 0.5) * 1.5, branchY + Math.sin(angle + 0.5) * 1.5);
                    flake.moveTo(branchX, branchY);
                    flake.lineTo(branchX + Math.cos(angle - 0.5) * 1.5, branchY + Math.sin(angle - 0.5) * 1.5);
                }
                
                flake.x = centerX;
                flake.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.8 + Math.random() * 2;
                flake.vx = Math.cos(angle) * speed;
                flake.vy = Math.sin(angle) * speed;
                flake.rotSpeed = (Math.random() - 0.5) * 0.05;
                flake.life = Math.random() * 0.4;
                flake.maxLife = 1.5;
                
                flakes.push(flake);
                snowflakes.addChild(flake);
            }
            
            container.addChild(snowflakes);
            
            // Névoa gelada centralizada
            const frostMist = new PIXI.Graphics();
            container.addChild(frostMist);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                iceFilter.uniforms.time = elapsed;
                iceFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar cristais emitidos do centro
                shards.forEach(shard => {
                    shard.x += shard.vx;
                    shard.y += shard.vy;
                    shard.rotation += shard.rotSpeed;
                    shard.life += 0.02;
                    
                    if (shard.life > shard.maxLife) {
                        shard.life = 0;
                        shard.x = centerX;
                        shard.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 1 + Math.random() * 3;
                        shard.vx = Math.cos(angle) * speed;
                        shard.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((shard.x - centerX) ** 2 + (shard.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    shard.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - shard.life / shard.maxLife);
                    shard.scale.set(1 + Math.sin(elapsed * 2 + shard.life * 3) * 0.15);
                });
                
                // Animar flocos de neve
                flakes.forEach(flake => {
                    flake.x += flake.vx + Math.sin(elapsed + flake.life) * 0.3;
                    flake.y += flake.vy;
                    flake.rotation += flake.rotSpeed;
                    flake.life += 0.02;
                    
                    if (flake.life > flake.maxLife) {
                        flake.life = 0;
                        flake.x = centerX;
                        flake.y = centerY;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 0.8 + Math.random() * 2;
                        flake.vx = Math.cos(angle) * speed;
                        flake.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((flake.x - centerX) ** 2 + (flake.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    flake.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - flake.life / flake.maxLife);
                });
                
                // Névoa gelada centralizada
                frostMist.clear();
                frostMist.beginFill(0xCCEEFF, 0.08 * Math.sin(progress * Math.PI));
                
                for (let i = 0; i < 3; i++) {
                    const x = centerX + Math.cos(elapsed * 0.8 + i) * 25;
                    const y = centerY + Math.sin(elapsed * 0.6 + i) * 25;
                    const radius = 30 + Math.sin(elapsed * 3 + i) * 10;
                    
                    frostMist.drawCircle(x, y, radius);
                }
                
                frostMist.endFill();
                
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