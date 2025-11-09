// shaders-attacks-distant.js - Shaders para Ataques Distantes
// Efeitos verticais que surgem de cima para baixo ou de baixo para cima

// SHADERS PRESENTES: ARCANE_EXPLOSION, PURIFYING_FLAME, ARCANE_FISSION, MAGIC_IMPLOSION, ELEMENTAL_STORM, ABSOLUTE_VOID, DARKNESS_EMBRACE

Object.assign(window.BOSS_DAMAGE_SHADERS, {

    // ========================================
    // 🔮 EXPLOSÃO ARCANA - De cima para baixo com runas e explosão centrífuga
    // ========================================
    "arcane_explosion_distant": {
        duration: 2500,
        name: "Explosão Arcana Distante",
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
            
            // Vertex shader
            const arcaneVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.y += sin(position.x * 0.02 + time * 3.0) * 5.0;
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const arcaneFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.3, 0.5, abs(uv.x - 0.5) * 2.0);
                    
                    // Explosão descendo
                    float explosionY = time * 0.8;
                    float explosion = 1.0 - smoothstep(0.0, 0.2, abs(uv.y - explosionY));
                    explosion *= step(0.0, explosionY) * step(explosionY, 1.2);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor roxa intensa
                    vec3 arcaneColor = vec3(0.6, 0.2, 0.9);
                    color.rgb = mix(color.rgb, arcaneColor, explosion * intensity * 0.6);
                    color.a = intensity * horizontalFade * explosion;
                    
                    gl_FragColor = color;
                }
            `;
            
            // Aplicar shader
            const arcaneFilter = new PIXI.Filter(arcaneVertex, arcaneFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [arcaneFilter];
            container.addChild(bg);
            
            // Runas voando CENTRÍFUGAS
            const runesContainer = new PIXI.Container();
            const runes = [];
            
            for (let i = 0; i < 25; i++) {
                const rune = new PIXI.Graphics();
                rune.beginFill(0x9944FF, 0.8);
                rune.drawPolygon([0, -8, 6, 0, 0, 8, -6, 0]); // Losango
                rune.endFill();
                rune.lineStyle(2, 0xCC66FF, 1);
                rune.drawCircle(0, 0, 6);
                
                rune.x = centerX;
                rune.y = centerY;
                
                // Direção centrífuga (para fora do centro)
                const angle = (i / 25) * Math.PI * 2 + Math.random() * 0.5;
                rune.vx = Math.cos(angle) * (100 + Math.random() * 80);
                rune.vy = Math.sin(angle) * (100 + Math.random() * 80);
                rune.rotation = Math.random() * Math.PI * 2;
                rune.rotationSpeed = (Math.random() - 0.5) * 10;
                
                runes.push(rune);
                runesContainer.addChild(rune);
            }
            container.addChild(runesContainer);
            
            // Explosão de energia centrífuga
            const explosionContainer = new PIXI.Graphics();
            container.addChild(explosionContainer);
            
            // Ondas de choque
            const shockwavesContainer = new PIXI.Graphics();
            container.addChild(shockwavesContainer);
            
            // Fragmentos de luz voando
            const lightFragmentsContainer = new PIXI.Container();
            const lightFragments = [];
            
            for (let i = 0; i < 40; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0xAA66FF, 0.9);
                fragment.drawCircle(0, 0, 1 + Math.random() * 2);
                fragment.endFill();
                
                fragment.x = centerX;
                fragment.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 60 + Math.random() * 100;
                fragment.vx = Math.cos(angle) * speed;
                fragment.vy = Math.sin(angle) * speed;
                fragment.life = 1.5 + Math.random();
                fragment.maxLife = fragment.life;
                
                lightFragments.push(fragment);
                lightFragmentsContainer.addChild(fragment);
            }
            container.addChild(lightFragmentsContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                arcaneFilter.uniforms.time = elapsed;
                arcaneFilter.uniforms.intensity = 1.0 - Math.pow(progress, 2);
                
                // Explosão central massiva COM FADE PROGRESSIVO
                explosionContainer.clear();
                const explosionAlpha = Math.max(0, 1 - progress * 0.9);
                
                if (elapsed > 0.3) {
                    const explosionRadius = (elapsed - 0.3) * 180;
                    
                    // Múltiplas camadas de explosão COM FADE NAS MARGENS
                    for (let layer = 0; layer < 6; layer++) {
                        const layerRadius = explosionRadius * (0.2 + layer * 0.15);
                        let layerAlpha = explosionAlpha * (0.8 - layer * 0.12);
                        const colors = [0xCC66FF, 0x9944FF, 0x6622CC, 0x4411AA, 0x221188, 0x110044];
                        
                        // Aplicar fade baseado na distância do centro
                        const distanceFromCenter = layerRadius;
                        const fadeStart = maxRadius * 0.6;
                        const fadeEnd = maxRadius * 0.9;
                        
                        if (distanceFromCenter > fadeStart) {
                            const edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                            layerAlpha *= edgeFade;
                        }
                        
                        explosionContainer.beginFill(colors[layer], layerAlpha);
                        explosionContainer.drawCircle(centerX, centerY, layerRadius);
                        explosionContainer.endFill();
                    }
                    
                    // Brilho central intenso
                    explosionContainer.beginFill(0xFFAAFF, explosionAlpha * 0.9);
                    explosionContainer.drawCircle(centerX, centerY, explosionRadius * 0.1);
                    explosionContainer.endFill();
                    
                    // Raios de energia se expandindo COM FADE
                    for (let ray = 0; ray < 12; ray++) {
                        const rayAngle = (ray / 12) * Math.PI * 2;
                        const rayLength = explosionRadius * 0.8;
                        
                        // Fade do raio baseado no comprimento
                        let rayAlpha = explosionAlpha * 0.7;
                        const fadeStart = maxRadius * 0.5;
                        const fadeEnd = maxRadius * 0.8;
                        
                        if (rayLength > fadeStart) {
                            const edgeFade = 1.0 - Math.min(1.0, (rayLength - fadeStart) / (fadeEnd - fadeStart));
                            rayAlpha *= edgeFade;
                        }
                        
                        explosionContainer.lineStyle(4, 0xAA66FF, rayAlpha);
                        explosionContainer.moveTo(centerX, centerY);
                        explosionContainer.lineTo(
                            centerX + Math.cos(rayAngle) * rayLength,
                            centerY + Math.sin(rayAngle) * rayLength
                        );
                    }
                }
                
                // Ondas de choque múltiplas COM FADE
                shockwavesContainer.clear();
                if (elapsed > 0.4) {
                    for (let w = 0; w < 4; w++) {
                        const waveRadius = (elapsed - 0.4 - w * 0.15) * 200;
                        if (waveRadius > 0) {
                            let waveAlpha = Math.max(0, 1 - waveRadius / 250);
                            
                            // Fade nas margens
                            const fadeStart = maxRadius * 0.6;
                            const fadeEnd = maxRadius * 0.9;
                            
                            if (waveRadius > fadeStart) {
                                const edgeFade = 1.0 - Math.min(1.0, (waveRadius - fadeStart) / (fadeEnd - fadeStart));
                                waveAlpha *= edgeFade;
                            }
                            
                            waveAlpha *= explosionAlpha;
                            
                            shockwavesContainer.lineStyle(6 - w, 0x8844DD, waveAlpha);
                            shockwavesContainer.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                // Animar runas centrífugas COM FADE
                runes.forEach((rune, i) => {
                    if (elapsed > 0.2) {
                        rune.x += rune.vx * 0.025;
                        rune.y += rune.vy * 0.025;
                        rune.rotation += rune.rotationSpeed * 0.025;
                        
                        // Fade baseado na distância do centro
                        const distanceFromCenter = Math.sqrt((rune.x - centerX)**2 + (rune.y - centerY)**2);
                        let baseAlpha = Math.max(0, 1 - (elapsed - 0.2) * 1.2);
                        
                        const fadeStart = maxRadius * 0.5;
                        const fadeEnd = maxRadius * 0.8;
                        
                        if (distanceFromCenter > fadeStart) {
                            const edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                            baseAlpha *= edgeFade;
                        }
                        
                        rune.alpha = baseAlpha;
                    }
                });
                
                // Animar fragmentos de luz COM FADE
                lightFragments.forEach(fragment => {
                    if (elapsed > 0.35) {
                        fragment.x += fragment.vx * 0.016;
                        fragment.y += fragment.vy * 0.016;
                        fragment.life -= 0.016;
                        
                        // Fade baseado na distância do centro
                        const distanceFromCenter = Math.sqrt((fragment.x - centerX)**2 + (fragment.y - centerY)**2);
                        let baseAlpha = Math.max(0, fragment.life / fragment.maxLife);
                        
                        const fadeStart = maxRadius * 0.4;
                        const fadeEnd = maxRadius * 0.7;
                        
                        if (distanceFromCenter > fadeStart) {
                            const edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                            baseAlpha *= edgeFade;
                        }
                        
                        fragment.alpha = baseAlpha;
                    }
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // 🔥 CHAMA PURIFICADORA - De baixo para cima
    // ========================================
    "purifying_flame_distant": {
        duration: 2500,
        name: "Chama Purificadora Distante",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            
            // Vertex shader
            const flameVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.x += sin(position.y * 0.03 + time * 4.0) * 3.0;
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const flameFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.3, 0.5, abs(uv.x - 0.5) * 2.0);
                    
                    // Chamas subindo
                    float flameY = 1.0 - time * 0.6;
                    float flame = 1.0 - smoothstep(0.0, 0.3, abs(uv.y - flameY));
                    flame *= step(0.0, flameY) * step(flameY, 1.2);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores de fogo
                    vec3 flameColor = vec3(1.0, 0.4, 0.1);
                    color.rgb = mix(color.rgb, flameColor, flame * intensity * 0.7);
                    color.a = intensity * horizontalFade * flame;
                    
                    gl_FragColor = color;
                }
            `;
            
            const flameFilter = new PIXI.Filter(flameVertex, flameFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [flameFilter];
            container.addChild(bg);
            
            // Chamas físicas subindo
            const flamesContainer = new PIXI.Graphics();
            container.addChild(flamesContainer);
            
            // Centelhas
            const sparksContainer = new PIXI.Container();
            const sparks = [];
            
            for (let i = 0; i < 20; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0xFFAA00, 1);
                spark.drawCircle(0, 0, Math.random() * 2 + 1);
                spark.endFill();
                
                spark.x = centerX + (Math.random() - 0.5) * 80;
                spark.y = app.view.height + 10;
                spark.vy = -(Math.random() * 100 + 50);
                spark.life = Math.random() * 2;
                
                sparks.push(spark);
                sparksContainer.addChild(spark);
            }
            container.addChild(sparksContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                flameFilter.uniforms.time = elapsed;
                flameFilter.uniforms.intensity = 1.0 - Math.pow(progress, 1.5);
                
                // Chamas intensas e variadas com brilho difuso - VELOCIDADES AINDA MAIS LENTAS
                flamesContainer.clear();
                const flameAlpha = Math.max(0, 1 - progress * 1.2);
                
                // Brilho difuso de fogo que parte do chão - ANIMAÇÃO MUITO MAIS LENTA
                const centralWidth = app.view.width * 0.2;
                for (let g = 0; g < 6; g++) {
                    const glowX = centerX - (centralWidth / 2) + (g * (centralWidth / 5)) + Math.sin(elapsed * 0.4 + g) * 3; // EXTREMAMENTE mais lento
                    const glowY = app.view.height - (elapsed * 45); // MUITO mais lento: 35 ao invés de 60
                    const glowSize = 40 + Math.sin(elapsed * 0.8 + g) * 5; // EXTREMAMENTE mais lento
                    
                    // Núcleo do brilho
                    flamesContainer.beginFill(0xFFAA00, flameAlpha * 0.3);
                    flamesContainer.drawCircle(glowX, glowY, glowSize);
                    flamesContainer.endFill();
                    
                    // Brilho externo difuso
                    flamesContainer.beginFill(0xFF6600, flameAlpha * 0.15);
                    flamesContainer.drawCircle(glowX, glowY, glowSize * 1.8);
                    flamesContainer.endFill();
                    
                    // Brilho mais difuso ainda
                    flamesContainer.beginFill(0xFF3300, flameAlpha * 0.08);
                    flamesContainer.drawCircle(glowX, glowY, glowSize * 2.5);
                    flamesContainer.endFill();
                }
                
                // Chamas principais - formas orgânicas - ANIMAÇÃO MAIS LENTA
                for (let f = 0; f < 12; f++) {
                    const flameX = centerX - 120 + Math.random() * 240;
                    const baseY = app.view.height - (elapsed * 60) + Math.random() * 40; // Mais lento: 50 ao invés de 70
                    const flameHeight = 50 + Math.sin(elapsed * 0.2 + f) * 15; // Mais lento
                    
                    // Cores variadas de fogo intenso
                    const colors = [0xFF2200, 0xFF6600, 0xFFAA00, 0xFFDD00, 0xFF4400];
                    const color = colors[f % colors.length];
                    
                    // Forma de chama orgânica
                    flamesContainer.beginFill(color, flameAlpha);
                    flamesContainer.moveTo(flameX, baseY + flameHeight);
                    
                    // Criar forma de chama irregular - animação MUITO mais lenta
                    for (let i = 0; i <= 8; i++) {
                        const angle = (i / 8) * Math.PI;
                        const waveOffset = Math.sin(elapsed * 0.2 + f + i) * 1; // MUITO mais lento
                        const radius = (flameHeight * 0.6) + waveOffset;
                        const x = flameX + Math.cos(angle + Math.PI) * radius * 0.3;
                        const y = baseY + flameHeight - Math.sin(angle) * radius;
                        flamesContainer.lineTo(x, y);
                    }
                    flamesContainer.endFill();
                    
                    // Núcleo mais quente
                    flamesContainer.beginFill(0xFFFFAA, flameAlpha * 0.8);
                    flamesContainer.drawEllipse(flameX, baseY + flameHeight * 0.7, 4, flameHeight * 0.4);
                    flamesContainer.endFill();
                }
                
                // Esferas de fogo subindo - VELOCIDADE DRASTICAMENTE REDUZIDA
                for (let s = 0; s < 25; s++) {
                    const sphereX = centerX - 100 + Math.random() * 200;
                    const sphereY = app.view.height - (elapsed * (20 + Math.random() * 15)) - (s * 12); // MUITO mais lento
                    const sphereSize = 2 + Math.sin(elapsed * 1.0 + s) * 1.5; // Mais lento
                    
                    if (sphereY > -20 && sphereY < app.view.height + 20) {
                        // Cores intensas variadas
                        const fireColors = [0xFF1100, 0xFF5500, 0xFF8800, 0xFFBB00, 0xFFDD22];
                        const sphereColor = fireColors[s % fireColors.length];
                        
                        flamesContainer.beginFill(sphereColor, flameAlpha * 0.9);
                        flamesContainer.drawCircle(sphereX, sphereY, sphereSize);
                        flamesContainer.endFill();
                        
                        // Brilho externo - ANIMAÇÃO MUITO MAIS LENTA
                        flamesContainer.beginFill(sphereColor, flameAlpha * 0.3);
                        flamesContainer.drawCircle(sphereX, sphereY, sphereSize * (2 + Math.sin(elapsed * 0.8 + s) * 0.2)); // MUITO mais lento
                        flamesContainer.endFill();
                    }
                }
                
                // Fagulhas menores aleatórias - MAIS LENTAS
                for (let sp = 0; sp < 40; sp++) {
                    const sparkX = centerX - 120 + Math.random() * 240;
                    const sparkY = app.view.height - (elapsed * (25 + Math.random() * 20)); // Mais lento
                    const sparkSize = 0.5 + Math.random() * 1.5;
                    
                    if (sparkY > -10 && sparkY < app.view.height + 10 && Math.random() < 0.7) {
                        flamesContainer.beginFill(0xFFAA22, flameAlpha * (0.6 + Math.random() * 0.4));
                        flamesContainer.drawCircle(sparkX, sparkY, sparkSize);
                        flamesContainer.endFill();
                    }
                }
                
                // Animar centelhas
                sparks.forEach(spark => {
                    spark.y += spark.vy * 0.016;
                    spark.life -= 0.016;
                    spark.alpha = Math.max(0, spark.life / 2);
                    
                    if (spark.life <= 0) {
                        spark.y = app.view.height + 10;
                        spark.life = Math.random() * 2;
                    }
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // ⚡ FISSÃO ARCANA - Rasgo vertical irregular
    // ========================================
    "arcane_fission_distant": {
        duration: 2500,
        name: "Fissão Arcana Distante",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            
            // Vertex shader
            const fissionVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.x += sin(position.y * 0.05 + time * 2.0) * 2.0;
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const fissionFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.2, 0.4, abs(uv.x - 0.5) * 2.0);
                    
                    // Rachadura vertical
                    float crackCenter = 0.5 + sin(uv.y * 15.0 + time * 3.0) * 0.02;
                    float crack = 1.0 - smoothstep(0.0, 0.01, abs(uv.x - crackCenter));
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor violeta da fissura
                    vec3 fissionColor = vec3(0.4, 0.1, 0.6);
                    color.rgb = mix(color.rgb, fissionColor, crack * intensity * 0.8);
                    color.a = intensity * horizontalFade * crack;
                    
                    gl_FragColor = color;
                }
            `;
            
            const fissionFilter = new PIXI.Filter(fissionVertex, fissionFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [fissionFilter];
            container.addChild(bg);
            
            // Rachadura principal física
            const crackContainer = new PIXI.Graphics();
            container.addChild(crackContainer);
            
            // Partículas arcanas
            const particlesContainer = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 15; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x6633CC, 0.8);
                particle.drawCircle(0, 0, Math.random() * 2 + 1);
                particle.endFill();
                
                particle.x = centerX + (Math.random() - 0.5) * 20;
                particle.y = Math.random() * app.view.height;
                particle.vx = (Math.random() - 0.5) * 50;
                particle.vy = (Math.random() - 0.5) * 50;
                
                particles.push(particle);
                particlesContainer.addChild(particle);
            }
            container.addChild(particlesContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                fissionFilter.uniforms.time = elapsed;
                fissionFilter.uniforms.intensity = Math.sin(progress * Math.PI) * 1.2;
                
                // Desenhar rasgo de fissão impactante
                crackContainer.clear();
                const crackAlpha = Math.max(0, 1 - progress * 0.8);
                
                if (progress < 0.3) {
                    // Rasgo surge subitamente com espessura irregular
                    const cracksIntensity = Math.min(1, progress * 5); // Surge rapidamente
                    
                    // Rasgo principal com espessura heterogênea
                    for (let y = 0; y < app.view.height; y += 2) {
                        const normalizedY = y / app.view.height;
                        const baseX = centerX + Math.sin(normalizedY * 12 + elapsed * 4) * 8;
                        
                        // Espessura irregular e heterogênea
                        const thickness = 2 + Math.sin(normalizedY * 20 + elapsed * 6) * 6 + 
                                        Math.cos(normalizedY * 15 + elapsed * 3) * 4;
                        
                        // Cor roxa intensa do rasgo
                        crackContainer.beginFill(0x6600CC, crackAlpha * cracksIntensity);
                        crackContainer.drawRect(baseX - thickness/2, y, thickness, 2);
                        crackContainer.endFill();
                        
                        // Borda mais escura
                        crackContainer.beginFill(0x330066, crackAlpha * cracksIntensity * 0.8);
                        crackContainer.drawRect(baseX - thickness/2 - 1, y, 1, 2);
                        crackContainer.drawRect(baseX + thickness/2, y, 1, 2);
                        crackContainer.endFill();
                        
                        // Energia vazando do rasgo
                        if (Math.random() < 0.3) {
                            const energyOffset = (Math.random() - 0.5) * 20;
                            crackContainer.beginFill(0x9944FF, crackAlpha * cracksIntensity * 0.6);
                            crackContainer.drawRect(baseX + energyOffset, y, 2, 2);
                            crackContainer.endFill();
                        }
                    }
                    
                    // Explosão de partículas do rasgo
                    for (let p = 0; p < 15; p++) {
                        const particleY = (Math.random() * app.view.height);
                        const particleX = centerX + (Math.random() - 0.5) * 30;
                        const particleVel = (Math.random() - 0.5) * 40;
                        const currentX = particleX + particleVel * elapsed * 2;
                        
                        if (currentX > 0 && currentX < app.view.width) {
                            crackContainer.beginFill(0x8833DD, crackAlpha * cracksIntensity);
                            crackContainer.drawCircle(currentX, particleY, 1 + Math.random() * 2);
                            crackContainer.endFill();
                        }
                    }
                }
                
                // Animar partículas
                particles.forEach(particle => {
                    particle.x += particle.vx * 0.016;
                    particle.y += particle.vy * 0.016;
                    particle.alpha = Math.max(0, 1 - progress * 1.5);
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // 💥 IMPLOSÃO MÁGICA - Fase centrípeta seguida de explosão
    // ========================================
    "magic_implosion_distant": {
        duration: 2500,
        name: "Implosão Mágica Distante",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            
            // Vertex shader
            const implosionVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    vec2 center = vec2(${centerX.toFixed(1)}, ${centerY.toFixed(1)});
                    vec2 toCenter = position - center;
                    float dist = length(toCenter);
                    
                    if (time < 0.8) {
                        // Fase de implosão - puxar para o centro
                        position += normalize(toCenter) * sin(time * 6.28) * 5.0;
                    } else {
                        // Fase de explosão
                        position -= normalize(toCenter) * (time - 0.8) * 15.0;
                    }
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const implosionFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.3, 0.5, abs(uv.x - 0.5) * 2.0);
                    
                    // Efeito baseado na fase
                    float effect = 0.0;
                    if (time < 0.8) {
                        // Implosão - concentração no centro
                        effect = 1.0 - smoothstep(0.0, 0.4, dist);
                        effect *= time / 0.8; // Crescer até o pico
                    } else {
                        // Explosão
                        float explosionRadius = (time - 0.8) * 1.2;
                        effect = 1.0 - smoothstep(explosionRadius - 0.1, explosionRadius + 0.05, dist);
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor roxa da magia
                    vec3 magicColor = vec3(0.8, 0.3, 1.0);
                    color.rgb = mix(color.rgb, magicColor, effect * intensity * 0.8);
                    color.a = intensity * horizontalFade * effect;
                    
                    gl_FragColor = color;
                }
            `;
            
            const implosionFilter = new PIXI.Filter(implosionVertex, implosionFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [implosionFilter];
            container.addChild(bg);
            
            // Elementos convergindo para o centro (fase inicial)
            const convergingContainer = new PIXI.Graphics();
            container.addChild(convergingContainer);
            
            // Container para o brilho forte central
            const centralBurstContainer = new PIXI.Graphics();
            container.addChild(centralBurstContainer);
            
            // Partículas de energia convergindo
            const energyParticlesContainer = new PIXI.Container();
            const energyParticles = [];
            
            for (let i = 0; i < 30; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xAA55FF, 0.8);
                particle.drawCircle(0, 0, 2 + Math.random() * 3);
                particle.endFill();
                
                // Posição inicial na periferia
                const angle = (i / 30) * Math.PI * 2;
                const radius = Math.max(app.view.width, app.view.height) * 0.6;
                particle.startX = centerX + Math.cos(angle) * radius;
                particle.startY = centerY + Math.sin(angle) * radius;
                particle.x = particle.startX;
                particle.y = particle.startY;
                
                // Dados de movimento para o centro
                particle.startTime = Math.random() * 0.2; // Pequeno delay inicial
                particle.duration = 0.6 + Math.random() * 0.2; // Tempo para chegar ao centro
                particle.arrived = false;
                
                energyParticles.push(particle);
                energyParticlesContainer.addChild(particle);
            }
            container.addChild(energyParticlesContainer);
            
            // Ondas de choque (fase de explosão)
            const shockwavesContainer = new PIXI.Graphics();
            container.addChild(shockwavesContainer);
            
            // Fragmentos voando (fase de explosão)
            const fragmentsContainer = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 18; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0xAA55FF, 0.9);
                fragment.drawPolygon([0, -4, 3, 0, 0, 4, -3, 0]);
                fragment.endFill();
                
                const angle = (i / 18) * Math.PI * 2;
                fragment.x = centerX;
                fragment.y = centerY;
                fragment.vx = Math.cos(angle) * 150;
                fragment.vy = Math.sin(angle) * 150;
                fragment.rotation = angle;
                fragment.launched = false;
                
                fragments.push(fragment);
                fragmentsContainer.addChild(fragment);
            }
            container.addChild(fragmentsContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                implosionFilter.uniforms.time = elapsed;
                implosionFilter.uniforms.intensity = 1.0 - Math.pow(progress, 1.8);
                
                // Fase de convergência (0 - 0.8s)
                if (elapsed < 0.8) {
                    convergingContainer.clear();
                    const convergenceAlpha = Math.max(0, 1 - progress * 2.5);
                    
                    // Linhas de energia convergindo COM FADEOUT RÁPIDO APÓS CHEGAREM AO CENTRO
                    for (let line = 0; line < 12; line++) {
                        const lineAngle = (line / 12) * Math.PI * 2;
                        const lineProgress = Math.min(1, (elapsed - line * 0.03) * 1.8);
                        
                        if (lineProgress > 0) {
                            const startX = centerX + Math.cos(lineAngle) * 400;
                            const startY = centerY + Math.sin(lineAngle) * 400;
                            const currentX = startX + (centerX - startX) * lineProgress;
                            const currentY = startY + (centerY - startY) * lineProgress;
                            
                            // FADEOUT RÁPIDO após a linha chegar ao centro
                            let lineAlpha = convergenceAlpha;
                            if (lineProgress >= 0.5) {
                                // Calcular quanto tempo passou desde que chegou ao centro
                                const timeAfterArrival = elapsed - (line * 0.03 + (1.0 / 1.8));
                                if (timeAfterArrival > 0) {
                                    // Fadeout rápido em 0.2 segundos
                                    lineAlpha *= Math.max(0, 1 - (timeAfterArrival / 0.2));
                                }
                            }
                            
                            if (lineAlpha > 0) {
                                convergingContainer.lineStyle(4, 0x8855DD, lineAlpha);
                                convergingContainer.moveTo(startX, startY);
                                convergingContainer.lineTo(currentX, currentY);
                            }
                        }
                    }
                    
                    // Animar partículas convergindo DE FORMA MAIS EFICAZ
                    energyParticles.forEach(particle => {
                        if (elapsed > particle.startTime && !particle.arrived) {
                            const convergenceTime = elapsed - particle.startTime;
                            const convergenceProgress = Math.min(1, convergenceTime / particle.duration);
                            
                            // Movimento suave para o centro usando interpolação
                            particle.x = particle.startX + (centerX - particle.startX) * convergenceProgress;
                            particle.y = particle.startY + (centerY - particle.startY) * convergenceProgress;
                            
                            // Verificar se chegou ao centro
                            if (convergenceProgress >= 1.0) {
                                particle.arrived = true;
                                particle.alpha = 0;
                            }
                        }
                        
                        if (!particle.arrived) {
                            particle.alpha = convergenceAlpha;
                        }
                    });
                    
                    // Brilho crescente no centro mais intenso
                    const centerGlow = Math.min(1, elapsed / 0.8);
                    for (let glow = 0; glow < 5; glow++) {
                        const glowRadius = (glow + 1) * 12 * centerGlow;
                        const glowAlpha = convergenceAlpha * (1 - glow * 0.35) * centerGlow;
                        convergingContainer.beginFill(0xAA55FF, glowAlpha);
                        convergingContainer.drawCircle(centerX, centerY, glowRadius);
                        convergingContainer.endFill();
                    }
                    
                    // Núcleo super brilhante no centro
                    const nucleusIntensity = Math.sin(elapsed * 15) * 0.3 + 0.7;
                    convergingContainer.beginFill(0xFFCCFF, convergenceAlpha * nucleusIntensity * centerGlow);
                    convergingContainer.drawCircle(centerX, centerY, 8 * centerGlow);
                    convergingContainer.endFill();
                }
                
                // BRILHO FORTE ROXO NO CENTRO - 500ms de duração
                centralBurstContainer.clear();
                if (elapsed >= 0.8 && elapsed <= 1.3) { // 0.8s até 1.3s (500ms de duração)
                    const burstTime = elapsed - 0.8;
                    const burstProgress = burstTime / 0.5; // 0.5s = 500ms
                    
                    // Intensidade máxima no início, fade out gradual
                    const burstIntensity = 1.0 - burstProgress;
                    
                    if (burstIntensity > 0) {
                        // Múltiplas camadas de brilho roxo intenso
                        const burstColors = [0xFF88FF, 0xDD55FF, 0xAA33DD, 0x8822BB, 0x661199];
                        const burstSizes = [60, 80, 120, 160, 200];
                        const burstAlphas = [0.9, 0.7, 0.5, 0.3, 0.2];
                        
                        for (let b = 0; b < 5; b++) {
                            const layerAlpha = burstAlphas[b] * burstIntensity;
                            const layerSize = burstSizes[b] * (0.3 + burstIntensity * 0.7);
                            
                            centralBurstContainer.beginFill(burstColors[b], layerAlpha);
                            centralBurstContainer.drawCircle(centerX, centerY, layerSize);
                            centralBurstContainer.endFill();
                        }
                        
                        // Núcleo super brilhante
                        const coreIntensity = burstIntensity * (0.8 + Math.sin(elapsed * 20) * 0.2);
                        centralBurstContainer.beginFill(0xFFFFFF, coreIntensity);
                        centralBurstContainer.drawCircle(centerX, centerY, 25 * burstIntensity);
                        centralBurstContainer.endFill();
                        
                        // Raios de energia saindo do centro
                        for (let ray = 0; ray < 8; ray++) {
                            const rayAngle = (ray / 8) * Math.PI * 2 + elapsed * 3;
                            const rayLength = 40 + Math.sin(elapsed * 12 + ray) * 20;
                            const rayAlpha = burstIntensity * 0.6;
                            
                            centralBurstContainer.lineStyle(3, 0xEE66FF, rayAlpha);
                            centralBurstContainer.moveTo(centerX, centerY);
                            centralBurstContainer.lineTo(
                                centerX + Math.cos(rayAngle) * rayLength,
                                centerY + Math.sin(rayAngle) * rayLength
                            );
                        }
                    }
                }
                
                // Fase de explosão (após 0.8s)
                if (elapsed > 0.8) {
                    // Ondas de choque múltiplas
                    shockwavesContainer.clear();
                    for (let w = 0; w < 4; w++) {
                        const waveRadius = (elapsed - 0.8 - w * 0.15) * 180;
                        if (waveRadius > 0) {
                            const waveAlpha = Math.max(0, 1 - waveRadius / 220);
                            shockwavesContainer.lineStyle(6 - w, 0xAA55FF, waveAlpha);
                            shockwavesContainer.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                    
                    // Lançar fragmentos
                    fragments.forEach(fragment => {
                        if (!fragment.launched) {
                            fragment.launched = true;
                        }
                        fragment.x += fragment.vx * 0.020;
                        fragment.y += fragment.vy * 0.020;
                        fragment.alpha = Math.max(0, 1 - (elapsed - 0.8) * 1.2);
                    });
                }
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // ⚡ TEMPESTADE ELEMENTAL - Raios multicores verticais
    // ========================================
    "elemental_storm_distant": {
        duration: 2500,
        name: "Tempestade Elemental Distante",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            
            // Vertex shader
            const stormVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.x += sin(position.y * 0.1 + time * 8.0) * 2.0;
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const stormFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.25, 0.45, abs(uv.x - 0.5) * 2.0);
                    
                    // Campo elétrico
                    float electricField = sin(uv.x * 30.0 + time * 8.0) * 0.5 + 0.5;
                    electricField *= sin(uv.y * 25.0 + time * 6.0) * 0.5 + 0.5;
                    electricField *= 0.3;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor elétrica azul
                    vec3 electricColor = vec3(0.4, 0.8, 1.0);
                    color.rgb = mix(color.rgb, electricColor, electricField * intensity);
                    color.a = intensity * horizontalFade * electricField;
                    
                    gl_FragColor = color;
                }
            `;
            
            const stormFilter = new PIXI.Filter(stormVertex, stormFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [stormFilter];
            container.addChild(bg);
            
            // Raios elétricos físicos
            const lightningContainer = new PIXI.Graphics();
            container.addChild(lightningContainer);
            
            // Centelhas
            const sparksContainer = new PIXI.Container();
            const sparks = [];
            
            for (let i = 0; i < 30; i++) {
                const spark = new PIXI.Graphics();
                const colors = [0x00AAFF, 0xFF0088, 0x88FF00, 0xFF5500, 0x6600FF];
                spark.beginFill(colors[i % colors.length], 0.9);
                spark.drawCircle(0, 0, 1);
                spark.endFill();
                
                spark.x = Math.random() * app.view.width;
                spark.y = Math.random() * app.view.height;
                spark.vx = (Math.random() - 0.5) * 100;
                spark.vy = (Math.random() - 0.5) * 100;
                
                sparks.push(spark);
                sparksContainer.addChild(spark);
            }
            container.addChild(sparksContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                stormFilter.uniforms.time = elapsed;
                stormFilter.uniforms.intensity = Math.sin(progress * Math.PI) * 1.3;
                
                // Desenhar raios com brilho externo
                lightningContainer.clear();
                const colors = [0x00AAFF, 0xFF0088, 0x88FF00, 0xFF5500, 0x6600FF];
                
                for (let l = 0; l < 5; l++) {
                    const shouldShow = Math.random() < 0.4;
                    if (!shouldShow) continue;
                    
                    const lightningAlpha = Math.max(0, 1 - progress);
                    const startX = (app.view.width / 6) * (l + 1);
                    
                    // Brilho externo (mais grosso e transparente)
                    lightningContainer.lineStyle(8, colors[l], lightningAlpha * 0.3);
                    lightningContainer.moveTo(startX, 0);
                    
                    let currentX = startX;
                    for (let y = 0; y < app.view.height; y += 15) {
                        currentX += (Math.random() - 0.5) * 25;
                        lightningContainer.lineTo(currentX, y);
                    }
                    
                    // Raio principal (mais fino e intenso)
                    lightningContainer.lineStyle(3, colors[l], lightningAlpha);
                    lightningContainer.moveTo(startX, 0);
                    
                    currentX = startX;
                    for (let y = 0; y < app.view.height; y += 15) {
                        currentX += (Math.random() - 0.5) * 25;
                        lightningContainer.lineTo(currentX, y);
                    }
                    
                    // Núcleo super brilhante
                    lightningContainer.lineStyle(1, 0xFFFFFF, lightningAlpha * 0.8);
                    lightningContainer.moveTo(startX, 0);
                    
                    currentX = startX;
                    for (let y = 0; y < app.view.height; y += 15) {
                        currentX += (Math.random() - 0.5) * 25;
                        lightningContainer.lineTo(currentX, y);
                    }
                }
                
                // Animar centelhas
                sparks.forEach(spark => {
                    spark.x += spark.vx * 0.016;
                    spark.y += spark.vy * 0.016;
                    spark.alpha = Math.max(0, 1 - progress * 1.5);
                    
                    if (spark.x < 0 || spark.x > app.view.width) spark.vx *= -1;
                    if (spark.y < 0 || spark.y > app.view.height) spark.vy *= -1;
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // 🌌 CAMINHO DO VAZIO ABSOLUTO - Raio vertical união centro
    // ========================================
    "absolute_void_distant": {
        duration: 2500,
        name: "Caminho do Vazio Absoluto",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            
            // Vertex shader
            const voidVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    vec2 center = vec2(${centerX.toFixed(1)}, ${centerY.toFixed(1)});
                    
                    if (time > 0.5) {
                        vec2 toCenter = position - center;
                        position += normalize(toCenter) * sin(time * 10.0) * 2.0;
                    }
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const voidFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    
                    // Fade horizontal
                    float horizontalFade = 1.0 - smoothstep(0.3, 0.5, abs(uv.x - 0.5) * 2.0);
                    
                    // Raios se encontrando MAIS RÁPIDO
                    float topBeam = step(0.0, time * 4.0 - uv.y);  // 4x mais rápido
                    float bottomBeam = step(0.0, uv.y - (1.0 - time * 4.0));  // 4x mais rápido
                    float beams = (topBeam * step(time * 4.0, 0.5)) + (bottomBeam * step(time * 4.0, 0.5));
                    beams *= 1.0 - smoothstep(0.0, 0.02, abs(uv.x - 0.5));
                    
                    // União no centro com ponto de brilho violeta
                    float centerEffect = 0.0;
                    if (time > 0.125) {  // Começa mais cedo (metade de 0.25)
                        centerEffect = 1.0 - distance(uv, center) / 0.3;
                        centerEffect = max(0.0, centerEffect);
                        
                        // Ponto de brilho violeta pulsante
                        float centerPulse = 1.0 - distance(uv, center) / 0.1;
                        centerPulse = max(0.0, centerPulse);
                        centerPulse *= sin((time - 0.125) * 15.0) * 0.5 + 0.5;
                        centerPulse *= exp(-(time - 0.125) * 3.0); // Fade out
                        centerEffect += centerPulse * 2.0;
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor do vazio
                    vec3 voidColor = vec3(0.4, 0.1, 0.6);
                    float totalEffect = beams + centerEffect;
                    color.rgb = mix(color.rgb, voidColor, totalEffect * intensity * 0.8);
                    color.a = intensity * horizontalFade * totalEffect;
                    
                    gl_FragColor = color;
                }
            `;
            
            const voidFilter = new PIXI.Filter(voidVertex, voidFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [voidFilter];
            container.addChild(bg);
            
            // Raios físicos
            const beamsContainer = new PIXI.Graphics();
            container.addChild(beamsContainer);
            
            // Ondas de energia
            const wavesContainer = new PIXI.Graphics();
            container.addChild(wavesContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                voidFilter.uniforms.time = elapsed;
                voidFilter.uniforms.intensity = Math.sin(progress * Math.PI) * 1.1;
                
                // Desenhar raios físicos MAIS RÁPIDOS
                beamsContainer.clear();
                const beamAlpha = Math.max(0, 1 - progress);
                
                if (elapsed < 0.125) {  // Raios chegam em 0.125s (muito mais rápido)
                    // Raio do topo
                    beamsContainer.beginFill(0x6633AA, beamAlpha);
                    beamsContainer.drawRect(centerX - 5, 0, 10, elapsed * app.view.height * 8); // 8x mais rápido
                    beamsContainer.endFill();
                    
                    // Raio da base
                    beamsContainer.beginFill(0x6633AA, beamAlpha);
                    beamsContainer.drawRect(centerX - 5, app.view.height - (elapsed * app.view.height * 8), 10, elapsed * app.view.height * 8);
                    beamsContainer.endFill();
                }
                
                // Ponto de brilho central violeta pulsante - APÓS CONTATO, MAIOR E MAIS INTENSO
                if (elapsed > 0.125) { // Após as linhas se encontrarem
                    const timeSinceContact = elapsed - 0.125;
                    const pulseIntensity = Math.sin(timeSinceContact * 12) * 0.6 + 1.4; // Mais intenso
                    const fadeOut = Math.exp(-timeSinceContact * 1.5); // Dura mais tempo
                    const pulseAlpha = pulseIntensity * fadeOut * beamAlpha;
                    
                    if (pulseAlpha > 0.01) {
                        // Núcleo super brilhante
                        beamsContainer.beginFill(0xAA66FF, pulseAlpha * 1.2);
                        beamsContainer.drawCircle(centerX, centerY, 15 + pulseIntensity * 8); // Maior
                        beamsContainer.endFill();
                        
                        // Brilho médio
                        beamsContainer.beginFill(0x8844DD, pulseAlpha * 0.8);
                        beamsContainer.drawCircle(centerX, centerY, 25 + pulseIntensity * 12); // Maior
                        beamsContainer.endFill();
                        
                        // Brilho externo mais difuso
                        beamsContainer.beginFill(0x6633AA, pulseAlpha * 0.4);
                        beamsContainer.drawCircle(centerX, centerY, 40 + pulseIntensity * 20); // Muito maior
                        beamsContainer.endFill();
                        
                        // Brilho mais externo ainda
                        beamsContainer.beginFill(0x4422AA, pulseAlpha * 0.2);
                        beamsContainer.drawCircle(centerX, centerY, 60 + pulseIntensity * 30); // Enorme
                        beamsContainer.endFill();
                    }
                }
                
                // Ondas após união (mantém timing original)
                wavesContainer.clear();
                if (elapsed > 0.125) {
                    for (let w = 0; w < 4; w++) {
                        const waveRadius = (elapsed - 0.125 - w * 0.1) * 120;
                        if (waveRadius > 0) {
                            const waveAlpha = Math.max(0, 1 - waveRadius / 150);
                            wavesContainer.lineStyle(3, 0x8844CC, waveAlpha);
                            wavesContainer.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    },

    // ========================================
    // 🌑 ABRAÇO DA ESCURIDÃO - Elementos centrípetos da periferia para o centro
    // ========================================
    "darkness_embrace_distant": {
        duration: 2500,
        name: "Abraço da Escuridão Distante",
        create: function(app) {
            const container = new PIXI.Container();
            
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.max(app.view.width, app.view.height) * 0.6;
            
            // Vertex shader
            const darknessVertex = `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                uniform float time;
                varying vec2 vTextureCoord;
                
                void main(void) {
                    vec2 position = aVertexPosition;
                    vec2 center = vec2(${centerX.toFixed(1)}, ${centerY.toFixed(1)});
                    vec2 toCenter = center - position;
                    
                    if (time > 0.3) {
                        position += normalize(toCenter) * (time - 0.3) * 8.0;
                    }
                    
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;
            
            // Fragment shader
            const darknessFragment = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Escurecimento centrípeto com fade progressivo
                    float darkness = 0.0;
                    if (time > 0.5) {
                        float darknessRadius = (time - 0.5) * 1.2;
                        darkness = 1.0 - smoothstep(0.0, darknessRadius, dist);
                        
                        // Fade progressivo nas margens para evitar corte abrupto
                        float edgeFade = 1.0 - smoothstep(0.6, 1.0, dist);
                        darkness *= edgeFade;
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Escurecer drasticamente
                    vec3 darkColor = vec3(0.0, 0.0, 0.0);
                    color.rgb = mix(color.rgb, darkColor, darkness * intensity * 0.95);
                    color.a = intensity * darkness;
                    
                    gl_FragColor = color;
                }
            `;
            
            const darknessFilter = new PIXI.Filter(darknessVertex, darknessFragment, {
                time: 0,
                intensity: 0
            });
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF, 0);
            bg.drawRect(0, 0, app.view.width, app.view.height);
            bg.endFill();
            bg.filters = [darknessFilter];
            container.addChild(bg);
            
            // Elementos sombrios convergindo para o centro
            const shadowElementsContainer = new PIXI.Graphics();
            container.addChild(shadowElementsContainer);
            
            // Tentáculos sombrios das bordas
            const tentaclesContainer = new PIXI.Container();
            const tentacles = [];
            
            // Criar tentáculos das 4 direções
            for (let dir = 0; dir < 4; dir++) {
                for (let i = 0; i < 8; i++) {
                    const tentacle = {
                        startX: 0,
                        startY: 0,
                        endX: centerX,
                        endY: centerY,
                        progress: 0,
                        speed: 0.6 + Math.random() * 0.8,
                        thickness: 3 + Math.random() * 4,
                        segments: []
                    };
                    
                    // Posições iniciais baseadas na direção
                    switch(dir) {
                        case 0: // Esquerda
                            tentacle.startX = 0;
                            tentacle.startY = (i / 7) * app.view.height;
                            break;
                        case 1: // Direita
                            tentacle.startX = app.view.width;
                            tentacle.startY = (i / 7) * app.view.height;
                            break;
                        case 2: // Topo
                            tentacle.startX = (i / 7) * app.view.width;
                            tentacle.startY = 0;
                            break;
                        case 3: // Base
                            tentacle.startX = (i / 7) * app.view.width;
                            tentacle.startY = app.view.height;
                            break;
                    }
                    
                    // Criar segmentos curvos
                    const numSegments = 15;
                    for (let s = 0; s < numSegments; s++) {
                        const progress = s / (numSegments - 1);
                        const baseX = tentacle.startX + (tentacle.endX - tentacle.startX) * progress;
                        const baseY = tentacle.startY + (tentacle.endY - tentacle.startY) * progress;
                        
                        // Adicionar curvatura
                        const curveOffset = Math.sin(progress * Math.PI) * (20 + Math.random() * 30);
                        const perpX = -(tentacle.endY - tentacle.startY) / Math.sqrt((tentacle.endX - tentacle.startX)**2 + (tentacle.endY - tentacle.startY)**2);
                        const perpY = (tentacle.endX - tentacle.startX) / Math.sqrt((tentacle.endX - tentacle.startX)**2 + (tentacle.endY - tentacle.startY)**2);
                        
                        tentacle.segments.push({
                            x: baseX + perpX * curveOffset,
                            y: baseY + perpY * curveOffset
                        });
                    }
                    
                    tentacles.push(tentacle);
                }
            }
            
            // Fragmentos sombrios das bordas
            const fragmentsContainer = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 40; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0x000000, 0.8);
                fragment.drawPolygon([0, -3, 2, 0, 0, 3, -2, 0]); // Formato de losango
                fragment.endFill();
                
                // Posição inicial na periferia
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.max(app.view.width, app.view.height) * 0.7;
                fragment.x = centerX + Math.cos(angle) * radius;
                fragment.y = centerY + Math.sin(angle) * radius;
                
                // Velocidade para o centro
                const speed = 80 + Math.random() * 60;
                fragment.vx = -Math.cos(angle) * speed;
                fragment.vy = -Math.sin(angle) * speed;
                fragment.rotation = angle;
                fragment.rotationSpeed = (Math.random() - 0.5) * 8;
                
                fragments.push(fragment);
                fragmentsContainer.addChild(fragment);
            }
            container.addChild(fragmentsContainer);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 2.5, 1);
                
                if (progress >= 1) {
                    container.destroy({ children: true });
                    return;
                }
                
                darknessFilter.uniforms.time = elapsed;
                darknessFilter.uniforms.intensity = 1.0 - Math.pow(progress, 2);
                
                // Desenhar tentáculos convergindo COM FADE PROGRESSIVO
                shadowElementsContainer.clear();
                const shadowAlpha = Math.max(0, 1 - progress * 0.8);
                
                tentacles.forEach(tentacle => {
                    tentacle.progress = Math.min(1, elapsed * tentacle.speed);
                    
                    if (tentacle.progress > 0) {
                        const visibleSegments = Math.floor(tentacle.segments.length * tentacle.progress);
                        if (visibleSegments > 0) {
                            // Aplicar fade baseado na distância do centro para cada segmento
                            for (let s = 0; s < visibleSegments - 1; s++) {
                                const currentSegment = tentacle.segments[s];
                                const nextSegment = tentacle.segments[s + 1];
                                
                                // Calcular distância do centro para este segmento
                                const distanceFromCenter = Math.sqrt((currentSegment.x - centerX)**2 + (currentSegment.y - centerY)**2);
                                
                                // Fade progressivo baseado na distância
                                let segmentAlpha = shadowAlpha;
                                const fadeStart = maxRadius * 0.3;
                                const fadeEnd = maxRadius * 0.8;
                                
                                if (distanceFromCenter > fadeStart) {
                                    const edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                                    segmentAlpha *= edgeFade;
                                }
                                
                                if (segmentAlpha > 0.01) {
                                    shadowElementsContainer.lineStyle(tentacle.thickness, 0x000000, segmentAlpha);
                                    shadowElementsContainer.moveTo(currentSegment.x, currentSegment.y);
                                    shadowElementsContainer.lineTo(nextSegment.x, nextSegment.y);
                                }
                            }
                        }
                    }
                });
                
                // Brilho negro no centro (escurecimento intenso) COM FADE PROGRESSIVO MELHORADO
                if (elapsed > 0.8) {
                    const centerIntensity = (elapsed - 0.8) / 1.7;
                    const darkRadius = centerIntensity * 150;
                    
                    // Múltiplas camadas de escuridão COM FADE NAS MARGENS PROGRESSIVO
                    for (let layer = 0; layer < 5; layer++) {
                        const layerRadius = darkRadius * (1 + layer * 0.3);
                        const baseLayerAlpha = shadowAlpha * (0.6 - layer * 0.25);
                        
                        // Calcular fade baseado na distância das margens - SIMILAR À EXPLOSÃO ARCANA
                        const distanceFromCenter = layerRadius;
                        let edgeFade = 1.0;
                        
                        const fadeStart = maxRadius * 0.4;
                        const fadeEnd = maxRadius * 0.9;
                        
                        if (distanceFromCenter > fadeStart) {
                            edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                        }
                        
                        const finalAlpha = baseLayerAlpha * edgeFade;
                        
                        if (finalAlpha > 0.01) {
                            shadowElementsContainer.beginFill(0x000000, finalAlpha);
                            shadowElementsContainer.drawCircle(centerX, centerY, layerRadius);
                            shadowElementsContainer.endFill();
                        }
                    }
                    
                    // Núcleo de escuridão absoluta
                    shadowElementsContainer.beginFill(0x000000, shadowAlpha * 0.95);
                    shadowElementsContainer.drawCircle(centerX, centerY, darkRadius * 0.4);
                    shadowElementsContainer.endFill();
                }
                
                // Ondas de escuridão se expandindo do centro COM FADE PROGRESSIVO APRIMORADO
                if (elapsed > 1.0) {
                    for (let w = 0; w < 3; w++) {
                        const waveRadius = (elapsed - 1.0 - w * 0.2) * 100;
                        if (waveRadius > 0) {
                            // Fade baseado na distância e nas margens - SIMILAR À EXPLOSÃO ARCANA
                            let waveAlpha = Math.max(0, (1 - waveRadius / 120) * shadowAlpha);
                            
                            // Fade adicional nas margens progressivo
                            const fadeStart = maxRadius * 0.4;
                            const fadeEnd = maxRadius * 0.8;
                            if (waveRadius > fadeStart) {
                                const edgeFade = 1.0 - Math.min(1.0, (waveRadius - fadeStart) / (fadeEnd - fadeStart));
                                waveAlpha *= edgeFade;
                            }
                            
                            if (waveAlpha > 0.01) {
                                shadowElementsContainer.lineStyle(6, 0x111111, waveAlpha);
                                shadowElementsContainer.drawCircle(centerX, centerY, waveRadius);
                            }
                        }
                    }
                }
                
                // Animar fragmentos COM FADE PROGRESSIVO
                fragments.forEach(fragment => {
                    fragment.x += fragment.vx * 0.016;
                    fragment.y += fragment.vy * 0.016;
                    fragment.rotation += fragment.rotationSpeed * 0.016;
                    
                    // Fade baseado na distância do centro
                    const distanceFromCenter = Math.sqrt((fragment.x - centerX)**2 + (fragment.y - centerY)**2);
                    let baseAlpha = Math.max(0, 1 - progress * 1.2);
                    
                    // Aplicar fade progressivo similar aos outros elementos
                    const fadeStart = maxRadius * 0.3;
                    const fadeEnd = maxRadius * 0.7;
                    
                    if (distanceFromCenter > fadeStart) {
                        const edgeFade = 1.0 - Math.min(1.0, (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
                        baseAlpha *= edgeFade;
                    }
                    
                    fragment.alpha = baseAlpha;
                    
                    // Verificar se chegou perto do centro
                    if (distanceFromCenter < 20) {
                        fragment.alpha = 0;
                    }
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            return container;
        }
    }

});