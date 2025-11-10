// shaders-attacks3.js - Shaders part 3
// Adiciona mais shaders ao dicionário existente

// SHADERS PRESENTES: METAL, FORTUNE, GRAVITY, COSMIC, NECROTIC, NATURE, ENERGY, HAMMER

Object.assign(window.BOSS_DAMAGE_SHADERS, {

    // ========================================
    // ⚙️ METAL/METAL - Guerreiro/Samurai
    // ========================================
    "metal_damage": {
        duration: 840, // OTIMIZADO: 1200ms → 840ms (-30%)
        name: "Dano Metálico",
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
            
            // Shader metálico
            const metalFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Reflexos metálicos centralizados
                    float metallic = sin(uv.x * 30.0 + time * 8.0) * 0.5 + 0.5;
                    metallic *= sin(uv.y * 20.0 + time * 6.0) * 0.5 + 0.5;
                    metallic = pow(metallic, 2.0);
                    metallic *= 1.0 - smoothstep(0.0, 0.35, dist);
                    
                    // Riscos de metal
                    float scratches = 0.0;
                    for(float i = 0.0; i < 4.0; i++) {
                        float angle = i * 0.785 + time * 0.5;
                        vec2 scratchDir = vec2(cos(angle), sin(angle));
                        float scratch = abs(sin((dot(uv - center, scratchDir)) * 80.0));
                        scratch = pow(scratch, 15.0);
                        scratch *= 1.0 - smoothstep(0.0, 0.3, dist);
                        scratches += scratch;
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor metálica
                    vec3 metalColor = vec3(0.85, 0.87, 0.9);
                    color.rgb = mix(color.rgb, metalColor, metallic * intensity * 0.4);
                    color.rgb += vec3(1.0, 1.0, 1.0) * scratches * intensity * 0.25;
                    
                    // Brilho metálico central
                    float shine = pow(max(0.0, 1.0 - dist * 2.0), 8.0);
                    color.rgb += vec3(1.0, 1.0, 1.0) * shine * intensity * 0.3;
                    
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
            bg.filters = [metalFilter];
            container.addChild(bg);
            
            // Lâminas cortando rapidamente (duração breve, alta transparência)
            const blades = new PIXI.Graphics();
            container.addChild(blades);
            
            // Faíscas metálicas
            const sparks = new PIXI.Container();
            const sparkList = [];
            
            for (let i = 0; i < 30; i++) {
                const spark = new PIXI.Graphics();
                spark.lineStyle(1.5, 0xFFFFAA, 1);
                spark.moveTo(0, 0);
                spark.lineTo(5 + Math.random() * 6, 0);
                
                spark.x = centerX;
                spark.y = centerY;
                spark.rotation = Math.random() * Math.PI * 2;
                
                const speed = 8 + Math.random() * 10;
                spark.vx = Math.cos(spark.rotation) * speed;
                spark.vy = Math.sin(spark.rotation) * speed;
                spark.life = 0;
                spark.maxLife = 0.3 + Math.random() * 0.4;
                spark.gravity = 0.2;
                
                sparkList.push(spark);
                sparks.addChild(spark);
            }
            
            container.addChild(sparks);
            
            // Fragmentos de metal
            const metalFragments = new PIXI.Container();
            const fragments = [];
            
            for (let i = 0; i < 15; i++) {
                const fragment = new PIXI.Graphics();
                fragment.beginFill(0xCCCCCC, 0.8);
                
                const sides = 3 + Math.floor(Math.random() * 3);
                const points = [];
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const radius = 2 + Math.random() * 3;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                fragment.drawPolygon(points);
                fragment.endFill();
                
                // Brilho metálico
                fragment.beginFill(0xFFFFFF, 0.4);
                fragment.drawPolygon(points.map(p => p * 0.6));
                fragment.endFill();
                
                fragment.x = centerX;
                fragment.y = centerY;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 6;
                fragment.vx = Math.cos(angle) * speed;
                fragment.vy = Math.sin(angle) * speed - 3;
                fragment.rotation = Math.random() * Math.PI * 2;
                fragment.rotSpeed = (Math.random() - 0.5) * 0.3;
                fragment.gravity = 0.3;
                fragment.life = 0;
                fragment.maxLife = 1.0;
                
                fragments.push(fragment);
                metalFragments.addChild(fragment);
            }
            
            container.addChild(metalFragments);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                metalFilter.uniforms.time = elapsed;
                metalFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Lâminas girando rapidamente com duração breve (alta transparência)
                blades.clear();
                
                if (progress < 0.4) { // Duração bem mais breve
                    const bladeAlpha = 0.1; // Transparência de 90%
                    blades.lineStyle(3, 0xFFFFFF, bladeAlpha);
                    
                    const numBlades = 6;
                    for (let i = 0; i < numBlades; i++) {
                        const angle = (i / numBlades) * Math.PI * 2 + elapsed * 15; // Girando bem rapidamente
                        const length = maxRadius * 0.4;
                        
                        blades.moveTo(centerX, centerY);
                        blades.lineTo(
                            centerX + Math.cos(angle) * length,
                            centerY + Math.sin(angle) * length
                        );
                    }
                }
                
                // Animar faíscas com transparência rápida
                sparkList.forEach(spark => {
                    spark.x += spark.vx;
                    spark.y += spark.vy;
                    spark.vy += spark.gravity;
                    spark.life += 0.04;
                    
                    if (spark.life > spark.maxLife) {
                        spark.life = 0;
                        spark.x = centerX;
                        spark.y = centerY;
                        spark.rotation = Math.random() * Math.PI * 2;
                        const speed = 8 + Math.random() * 10;
                        spark.vx = Math.cos(spark.rotation) * speed;
                        spark.vy = Math.sin(spark.rotation) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((spark.x - centerX) ** 2 + (spark.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    // Transparência aumenta rapidamente
                    const lifeAlpha = Math.pow(1 - spark.life / spark.maxLife, 2);
                    spark.alpha = Math.sin(progress * Math.PI) * fadeAlpha * lifeAlpha;
                });
                
                // Animar fragmentos
                fragments.forEach(frag => {
                    frag.x += frag.vx;
                    frag.y += frag.vy;
                    frag.vy += frag.gravity;
                    frag.rotation += frag.rotSpeed;
                    frag.life += 0.025;
                    
                    const distFromCenter = Math.sqrt((frag.x - centerX) ** 2 + (frag.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    frag.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - frag.life / frag.maxLife);
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
    // 💰 FORTUNE/DOURADO - Ladrão
    // ========================================
    "fortune_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Dourado",
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
            
            // Shader dourado centralizado
            const fortuneFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Brilho dourado central
                    float golden = sin(dist * 15.0 - time * 4.0) * 0.5 + 0.5;
                    golden *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Reflexos dourados
                    float reflections = sin(uv.x * 25.0 + time * 8.0) * sin(uv.y * 20.0 + time * 6.0);
                    reflections = pow(max(0.0, reflections), 2.0);
                    reflections *= 1.0 - smoothstep(0.0, 0.35, dist);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores douradas
                    vec3 goldColor1 = vec3(1.0, 0.8, 0.3);
                    vec3 goldColor2 = vec3(1.0, 0.9, 0.5);
                    
                    color.rgb = mix(color.rgb, goldColor1, golden * intensity * 0.4);
                    color.rgb += goldColor2 * reflections * intensity * 0.2;
                    
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
            bg.filters = [fortuneFilter];
            container.addChild(bg);
            
            // Moedas caindo
            const goldCoins = new PIXI.Container();
            const coins = [];
            
            for (let i = 0; i < 25; i++) {
                const coin = new PIXI.Graphics();
                coin.beginFill(0xFFD700, 0.9);
                coin.drawCircle(0, 0, 3 + Math.random() * 3);
                coin.endFill();
                
                coin.lineStyle(0.8, 0xFFFF88, 0.8);
                coin.drawCircle(0, 0, 4 + Math.random() * 3);
                
                coin.beginFill(0xDAA520, 0.8);
                coin.drawCircle(0, 0, 1.5);
                coin.endFill();
                
                coin.x = centerX;
                coin.y = centerY;
                
                const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8;
                const speed = 2 + Math.random() * 4;
                coin.vx = Math.cos(angle) * speed;
                coin.vy = Math.sin(angle) * speed;
                coin.rotSpeed = (Math.random() - 0.5) * 0.3;
                coin.life = Math.random() * 0.3;
                coin.maxLife = 1.2;
                coin.glintPhase = Math.random() * Math.PI * 2;
                coin.glintSpeed = 2 + Math.random() * 3;
                
                coins.push(coin);
                goldCoins.addChild(coin);
            }
            
            container.addChild(goldCoins);
            
            // Chuva de ouro
            const goldRain = new PIXI.Container();
            const raindrops = [];
            
            for (let i = 0; i < 20; i++) {
                const drop = new PIXI.Graphics();
                drop.beginFill(0xFFD700, 0.7);
                drop.drawRect(-0.8, -3, 1.6, 6);
                drop.endFill();
                
                drop.x = centerX;
                drop.y = centerY;
                
                const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.6;
                const speed = 3 + Math.random() * 5;
                drop.vx = Math.cos(angle) * speed;
                drop.vy = Math.sin(angle) * speed;
                drop.rotation = Math.random() * Math.PI * 2;
                drop.rotSpeed = (Math.random() - 0.5) * 0.4;
                drop.life = Math.random() * 0.2;
                drop.maxLife = 1.0;
                
                raindrops.push(drop);
                goldRain.addChild(drop);
            }
            
            container.addChild(goldRain);
            
            // Brilhos de tesouro (CORRIGIDO - sem drawStar)
            const treasureGlints = new PIXI.Graphics();
            container.addChild(treasureGlints);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                fortuneFilter.uniforms.time = elapsed;
                fortuneFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar moedas
                coins.forEach((coin, i) => {
                    coin.x += coin.vx;
                    coin.y += coin.vy;
                    coin.rotation += coin.rotSpeed;
                    coin.life += 0.02;
                    
                    if (coin.life > coin.maxLife) {
                        coin.life = 0;
                        coin.x = centerX;
                        coin.y = centerY;
                        const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8;
                        const speed = 2 + Math.random() * 4;
                        coin.vx = Math.cos(angle) * speed;
                        coin.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((coin.x - centerX) ** 2 + (coin.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    
                    const glint = Math.sin(elapsed * coin.glintSpeed + coin.glintPhase + coin.rotation * 4) * 0.5 + 0.5;
                    const glintBoost = glint > 0.8 ? 1.5 : 1.0;
                    
                    coin.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - coin.life / coin.maxLife) * glintBoost;
                    coin.scale.set(1 + glint * 0.2);
                });
                
                // Animar chuva de ouro
                raindrops.forEach(drop => {
                    drop.x += drop.vx;
                    drop.y += drop.vy;
                    drop.rotation += drop.rotSpeed;
                    drop.life += 0.025;
                    
                    if (drop.life > drop.maxLife) {
                        drop.life = 0;
                        drop.x = centerX;
                        drop.y = centerY;
                        const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.6;
                        const speed = 3 + Math.random() * 5;
                        drop.vx = Math.cos(angle) * speed;
                        drop.vy = Math.sin(angle) * speed;
                    }
                    
                    const distFromCenter = Math.sqrt((drop.x - centerX) ** 2 + (drop.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    drop.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - drop.life / drop.maxLife);
                });
                
                // Desenhar brilhos de tesouro (CORRIGIDO - estrelas manuais)
                treasureGlints.clear();
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + elapsed * 2;
                    const radius = 60 + Math.sin(elapsed * 3 + i) * 20;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    const size = 4 + Math.sin(elapsed * 4 + i) * 2;
                    const glintAlpha = Math.sin(elapsed * 6 + i) * 0.5 + 0.5;
                    
                    treasureGlints.beginFill(0xFFD700, Math.sin(progress * Math.PI) * glintAlpha * 0.6);
                    
                    // Desenhar estrela manualmente
                    const starPoints = [];
                    for (let j = 0; j < 8; j++) {
                        const starAngle = (j / 8) * Math.PI * 2;
                        const starRadius = j % 2 === 0 ? size : size * 0.5;
                        starPoints.push(
                            x + Math.cos(starAngle) * starRadius,
                            y + Math.sin(starAngle) * starRadius
                        );
                    }
                    treasureGlints.drawPolygon(starPoints);
                    treasureGlints.endFill();
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
    // 🌌 GRAVITY/GRAVIDADE - Elemental Espacial
    // ========================================
    "gravity_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Gravitacional",
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
            
            // Shader de distorção gravitacional
            const gravityFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Distorção do espaço-tempo
                    vec2 dir = normalize(uv - center);
                    float warp = sin(dist * 30.0 - time * 12.0) * 0.02;
                    uv = center + dir * (dist - warp * intensity);
                    
                    // Anéis gravitacionais
                    float gravityRings = 0.0;
                    for(float i = 1.0; i < 6.0; i++) {
                        float ring = 1.0 - smoothstep(0.0, 0.01, abs(dist - i * 0.08 - time * 0.05));
                        ring *= sin(time * 8.0 + i * 2.0) * 0.5 + 0.5;
                        gravityRings += ring;
                    }
                    
                    // Singularidade central
                    float singularity = 1.0 - smoothstep(0.0, 0.1, dist);
                    singularity = pow(singularity, 4.0);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores gravitacionais (azul profundo)
                    vec3 gravityColor = vec3(0.2, 0.4, 0.8);
                    color.rgb = mix(color.rgb, vec3(0.0), singularity * intensity * 0.7);
                    color.rgb += gravityColor * gravityRings * intensity * 0.6;
                    
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
            bg.filters = [gravityFilter];
            container.addChild(bg);
            
            // Partículas sendo atraídas
            const gravityParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 50; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x88AAFF, 0.7);
                particle.drawCircle(0, 0, 1 + Math.random());
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = maxRadius * 0.8;
                particle.x = centerX + Math.cos(angle) * distance;
                particle.y = centerY + Math.sin(angle) * distance;
                particle.vx = 0;
                particle.vy = 0;
                particle.life = 0;
                particle.maxLife = 1.5;
                
                particles.push(particle);
                gravityParticles.addChild(particle);
            }
            container.addChild(gravityParticles);
            
            // Ondas gravitacionais
            const gravityWaves = new PIXI.Graphics();
            container.addChild(gravityWaves);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                gravityFilter.uniforms.time = elapsed;
                gravityFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar partículas sendo atraídas
                particles.forEach(p => {
                    p.life += 0.01;
                    
                    // Calcular direção para o centro
                    const dx = centerX - p.x;
                    const dy = centerY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Aumentar velocidade conforme se aproxima
                    if (dist > 5) {
                        const force = 0.5 + (1 - p.life / p.maxLife) * 2;
                        p.vx = (dx / dist) * force;
                        p.vy = (dy / dist) * force;
                        p.x += p.vx;
                        p.y += p.vy;
                    }
                    
                    if (p.life > p.maxLife) {
                        p.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        const distance = maxRadius * 0.8;
                        p.x = centerX + Math.cos(angle) * distance;
                        p.y = centerY + Math.sin(angle) * distance;
                    }
                    
                    const distFromCenter = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    p.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - p.life / p.maxLife);
                });
                
                // Desenhar ondas gravitacionais
                gravityWaves.clear();
                for (let i = 0; i < 3; i++) {
                    const waveProgress = (elapsed * 1.5 + i * 0.5) % 1.5;
                    const waveRadius = waveProgress * maxRadius * 0.7;
                    const waveAlpha = Math.max(0, 1 - waveProgress) * Math.sin(progress * Math.PI) * 0.4;
                    
                    if (waveAlpha > 0) {
                        gravityWaves.lineStyle(2, 0x4D4DFF, waveAlpha);
                        gravityWaves.drawCircle(centerX, centerY, waveRadius);
                        
                        gravityWaves.lineStyle(1, 0xFFFFFF, waveAlpha * 0.3);
                        gravityWaves.drawCircle(centerX, centerY, waveRadius + 3);
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
    // 🌟 COSMIC/CÓSMICO - Ser Celestial
    // ========================================
    "cosmic_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Cósmico",
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
            
            // Shader cósmico
            const cosmicFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Nebulosa central
                    float nebula = sin(dist * 20.0 - time * 2.0) * 0.5 + 0.5;
                    nebula *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Estrelas piscando
                    float stars = sin(uv.x * 100.0 + time * 5.0) * sin(uv.y * 80.0 - time * 4.0);
                    stars = pow(max(0.0, stars), 20.0);
                    stars *= 1.0 - smoothstep(0.0, 0.3, dist);
                    
                    // Buraco negro central
                    float blackHole = 1.0 - smoothstep(0.0, 0.1, dist);
                    blackHole = pow(blackHole, 4.0);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores cósmicas
                    vec3 cosmicColor1 = vec3(0.8, 0.4, 0.9); // Roxo
                    vec3 cosmicColor2 = vec3(0.3, 0.5, 1.0); // Azul
                    
                    color.rgb = mix(color.rgb, cosmicColor1, nebula * intensity * 0.5);
                    color.rgb += vec3(1.0, 1.0, 1.0) * stars * 0.8;
                    color.rgb = mix(color.rgb, vec3(0.0), blackHole * intensity * 0.7);
                    
                    // Disco de acreção
                    float accretion = abs(dist - 0.15);
                    accretion = 1.0 - smoothstep(0.0, 0.02, accretion);
                    accretion *= sin(time * 8.0) * 0.5 + 0.5;
                    color.rgb += cosmicColor2 * accretion * intensity * 0.6;
                    
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
            bg.filters = [cosmicFilter];
            container.addChild(bg);
            
            // Partículas estelares orbitando
            const starParticles = new PIXI.Container();
            const stars = [];
            
            for (let i = 0; i < 40; i++) {
                const star = new PIXI.Graphics();
                star.beginFill(0xFFFFFF, 0.9);
                star.drawCircle(0, 0, 0.5 + Math.random() * 1.5);
                star.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * maxRadius * 0.4;
                star.x = centerX + Math.cos(angle) * distance;
                star.y = centerY + Math.sin(angle) * distance;
                star.baseAngle = angle;
                star.baseDistance = distance;
                star.orbitSpeed = (Math.random() - 0.5) * 0.05;
                
                stars.push(star);
                starParticles.addChild(star);
            }
            
            container.addChild(starParticles);
            
            // Anéis cósmicos
            const cosmicRings = new PIXI.Graphics();
            container.addChild(cosmicRings);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                cosmicFilter.uniforms.time = elapsed;
                cosmicFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar estrelas orbitando
                stars.forEach(star => {
                    star.baseAngle += star.orbitSpeed;
                    star.x = centerX + Math.cos(star.baseAngle) * star.baseDistance;
                    star.y = centerY + Math.sin(star.baseAngle) * star.baseDistance;
                    
                    // Piscar aleatoriamente
                    if (Math.random() < 0.05) {
                        star.scale.set(1.5);
                    } else {
                        star.scale.set(1.0);
                    }
                    
                    const distFromCenter = Math.sqrt((star.x - centerX) ** 2 + (star.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    star.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                });
                
                // Desenhar anéis cósmicos
                cosmicRings.clear();
                cosmicRings.lineStyle(2, 0x9A2EFE, 0.5 * Math.sin(progress * Math.PI));
                cosmicRings.drawCircle(centerX, centerY, maxRadius * 0.25);
                
                cosmicRings.lineStyle(1, 0x4D4DFF, 0.4 * Math.sin(progress * Math.PI));
                cosmicRings.drawCircle(centerX, centerY, maxRadius * 0.35);
                
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
    // 💀 NECROTIC/NECRÓTICO - Lich
    // ========================================
    "necrotic_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Necrótico",
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
            
            // Shader necrótico
            const necroticFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Efeito de decomposição
                    float decay = sin(dist * 25.0 - time * 3.0) * 0.5 + 0.5;
                    decay *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Bolhas de necrose
                    float necrosis = sin(uv.x * 30.0 + time * 4.0) * sin(uv.y * 25.0 - time * 3.0);
                    necrosis = pow(max(0.0, necrosis), 6.0);
                    necrosis *= 1.0 - smoothstep(0.0, 0.3, dist);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores necróticas
                    vec3 necroticColor = vec3(0.4, 0.3, 0.2);
                    vec3 necrosisColor = vec3(0.7, 0.6, 0.1);
                    
                    color.rgb = mix(color.rgb, necroticColor, decay * intensity * 0.5);
                    color.rgb += necrosisColor * necrosis * 0.6;
                    
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
            bg.filters = [necroticFilter];
            container.addChild(bg);
            
            // Mãos esqueléticas emergindo
            const skeletalHands = new PIXI.Container();
            const hands = [];
            
            for (let i = 0; i < 5; i++) {
                const hand = new PIXI.Graphics();
                hand.lineStyle(2, 0xBBBBBB, 0.8);
                
                // Desenho simplificado de mão esquelética
                hand.moveTo(0, 0);
                hand.lineTo(-10, 5);
                hand.lineTo(-15, 0);
                hand.lineTo(-10, -5);
                hand.lineTo(0, 0);
                hand.moveTo(0, 0);
                hand.lineTo(0, 15);
                
                hand.x = centerX;
                hand.y = centerY;
                hand.scale.set(0);
                hand.rotation = (i / 5) * Math.PI * 2;
                
                hands.push(hand);
                skeletalHands.addChild(hand);
            }
            
            container.addChild(skeletalHands);
            
            // Névoa esverdeada
            const greenMist = new PIXI.Container();
            const mistParticles = [];
            
            for (let i = 0; i < 20; i++) {
                const mist = new PIXI.Graphics();
                mist.beginFill(0x88AA44, 0.6);
                mist.drawCircle(0, 0, 5 + Math.random() * 8);
                mist.endFill();
                
                mist.x = centerX;
                mist.y = centerY;
                mist.vx = (Math.random() - 0.5) * 2.5;
                mist.vy = (Math.random() - 0.5) * 2.5;
                
                mistParticles.push(mist);
                greenMist.addChild(mist);
            }
            
            container.addChild(greenMist);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                necroticFilter.uniforms.time = elapsed;
                necroticFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar mãos emergindo
                hands.forEach((hand, i) => {
                    if (progress > 0.1) {
                        const handProgress = Math.min(1, (progress - 0.1) * 2);
                        hand.scale.set(handProgress);
                        hand.alpha = Math.sin(progress * Math.PI);
                        
                        // Movimento de agarrar
                        const grabAngle = Math.sin(elapsed * 3 + i) * 0.3;
                        hand.rotation = (i / 4) * Math.PI * 2 + grabAngle;
                    }
                });
                
                // Animar névoa
                mistParticles.forEach(mist => {
                    mist.x += mist.vx;
                    mist.y += mist.vy;
                    mist.scale.set(1 + Math.sin(elapsed * 2) * 0.4);
                    
                    // Resetar partículas que saíram muito
                    const distFromCenter = Math.sqrt((mist.x - centerX) ** 2 + (mist.y - centerY) ** 2);
                    if (distFromCenter > maxRadius * 0.7) {
                        mist.x = centerX;
                        mist.y = centerY;
                    }
                    
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    mist.alpha = Math.sin(progress * Math.PI) * fadeAlpha * 0.5;
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
    // NATUREZA
    // ========================================

    "nature_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Natural",
        create: function(app) {
            const container = new PIXI.Container();
            const centerX = app.view.width / 2;
            const centerY = app.view.height / 2;
            const maxRadius = Math.min(app.view.width, app.view.height) * 0.45;

            // Vinhas com folhas e botões
            const vines = new PIXI.Graphics();
            container.addChild(vines);

            // Folhas flutuantes
            const leavesContainer = new PIXI.Container();
            const leaves = [];
            for (let i = 0; i < 30; i++) {
                const leaf = new PIXI.Graphics();
                const leafColor = 0x228B22 + Math.floor(Math.random() * 0x003300);
                leaf.beginFill(leafColor);
                leaf.drawEllipse(0, 0, 4 + Math.random() * 3, 2 + Math.random() * 2);
                leaf.endFill();
                leaf.x = centerX;
                leaf.y = centerY;
                leaf.angle = Math.random() * 360;
                leaf.speed = 1 + Math.random() * 2;
                leaf.rotationSpeed = (Math.random() - 0.5) * 0.1;
                leaf.life = Math.random() * 0.5;
                leaf.maxLife = 1.0 + Math.random() * 0.5;
                leaves.push(leaf);
                leavesContainer.addChild(leaf);
            }
            container.addChild(leavesContainer);

            // Partículas de terra
            const particlesContainer = new PIXI.Container();
            const particles = [];
            for (let i = 0; i < 20; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x8B4513, 0.5);
                particle.drawCircle(0, 0, 1 + Math.random() * 2);
                particle.endFill();
                particle.x = centerX;
                particle.y = centerY;
                particle.vx = (Math.random() - 0.5) * 5;
                particle.vy = (Math.random() - 0.5) * 5;
                particle.life = 0;
                particle.maxLife = 0.8 + Math.random() * 0.4;
                particles.push(particle);
                particlesContainer.addChild(particle);
            }
            container.addChild(particlesContainer);

            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);

                // Desenhar vinhas com folhas e botões
                vines.clear();
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const length = progress * maxRadius * 0.8;
                    vines.lineStyle(2, 0x8B4513);
                    vines.moveTo(centerX, centerY);
                    const segments = 10;
                    for (let j = 0; j <= segments; j++) {
                        const t = j / segments;
                        const x = centerX + Math.cos(angle + t * Math.PI / 4) * (length * t);
                        const y = centerY + Math.sin(angle + t * Math.PI / 4) * (length * t);
                        vines.lineTo(x, y);
                        if (j % 3 === 0) {
                            vines.beginFill(0x228B22);
                            vines.drawEllipse(x, y, 3, 1.5);
                            vines.endFill();
                        }
                    }
                    vines.beginFill(0xFF4500);
                    vines.drawCircle(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length, 3);
                    vines.endFill();
                }

                // Animar folhas
                leaves.forEach(leaf => {
                    leaf.x += Math.cos(leaf.angle * Math.PI / 180) * leaf.speed;
                    leaf.y += Math.sin(leaf.angle * Math.PI / 180) * leaf.speed;
                    leaf.rotation += leaf.rotationSpeed;
                    leaf.life += 0.02;
                    if (leaf.life > leaf.maxLife) {
                        leaf.life = 0;
                        leaf.x = centerX;
                        leaf.y = centerY;
                        leaf.angle = Math.random() * 360;
                        leaf.speed = 1 + Math.random() * 2;
                    }
                    leaf.alpha = Math.sin(progress * Math.PI) * (1 - leaf.life / leaf.maxLife);
                });

                // Animar partículas
                particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.life += 0.02;
                    if (particle.life > particle.maxLife) {
                        particle.life = 0;
                        particle.x = centerX;
                        particle.y = centerY;
                        particle.vx = (Math.random() - 0.5) * 5;
                        particle.vy = (Math.random() - 0.5) * 5;
                    }
                    particle.alpha = Math.sin(progress * Math.PI) * (1 - particle.life / particle.maxLife);
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
    // ⚡ ENERGY/ENERGIA - Sobrecarga de Energia
    // ========================================
    "energy_damage": {
        duration: 1120, // OTIMIZADO: 1600ms → 1120ms (-30%)
        name: "Dano Energético",
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
            
            // Shader energético
            const energyFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Pulsos energéticos concêntricos
                    float energyPulse = 0.0;
                    for(float i = 1.0; i < 6.0; i++) {
                        float pulse = sin(dist * 25.0 - time * (8.0 + i * 2.0)) * 0.5 + 0.5;
                        pulse *= 1.0 - smoothstep(0.0, 0.4, dist);
                        energyPulse += pulse;
                    }
                    
                    // Campo energético central
                    float energyField = 1.0 - smoothstep(0.0, 0.3, dist);
                    energyField *= sin(time * 6.0) * 0.3 + 0.7;
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores energéticas (azul-branco)
                    vec3 energyColor = vec3(0.4, 0.8, 1.0);
                    color.rgb = mix(color.rgb, energyColor, energyPulse * intensity * 0.4);
                    color.rgb += vec3(0.8, 0.9, 1.0) * energyField * intensity * 0.5;
                    
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
            bg.filters = [energyFilter];
            container.addChild(bg);
            
            // Orbes energéticos orbitando
            const energyOrbs = new PIXI.Container();
            const orbs = [];
            
            for (let i = 0; i < 8; i++) {
                const orb = new PIXI.Graphics();
                orb.beginFill(0x44CCFF, 0.8);
                orb.drawCircle(0, 0, 3 + Math.random() * 2);
                orb.endFill();
                
                const angle = (i / 8) * Math.PI * 2;
                const radius = 40 + Math.random() * 30;
                orb.x = centerX + Math.cos(angle) * radius;
                orb.y = centerY + Math.sin(angle) * radius;
                orb.baseAngle = angle;
                orb.baseRadius = radius;
                orb.orbitSpeed = 0.08 + Math.random() * 0.04;
                
                orbs.push(orb);
                energyOrbs.addChild(orb);
            }
            
            container.addChild(energyOrbs);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                energyFilter.uniforms.time = elapsed;
                energyFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar orbes
                orbs.forEach(orb => {
                    orb.baseAngle += orb.orbitSpeed;
                    orb.x = centerX + Math.cos(orb.baseAngle) * orb.baseRadius;
                    orb.y = centerY + Math.sin(orb.baseAngle) * orb.baseRadius;
                    
                    const distFromCenter = Math.sqrt((orb.x - centerX) ** 2 + (orb.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    orb.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
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
    // 🔨 HAMMER/MARTELO - Martelo Divino
    // ========================================
    "hammer_damage": {
        duration: 840, // OTIMIZADO: 1200ms → 840ms (-30%)
        name: "Dano do Martelo",
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
            
            // Martelo descendo do céu
            const hammer = new PIXI.Graphics();
            hammer.beginFill(0xFFFFAA, 0.9);
            // Cabeça do martelo
            hammer.drawRect(-15, -8, 30, 16);
            // Cabo do martelo
            hammer.drawRect(-3, -40, 6, 32);
            hammer.endFill();
            
            // Brilho dourado
            hammer.lineStyle(2, 0xFFFF88, 0.8);
            hammer.drawRect(-16, -9, 32, 18);
            
            hammer.x = centerX;
            hammer.y = -app.view.height * 0.5;
            container.addChild(hammer);
            
            // Ondas de impacto
            const impactWaves = new PIXI.Graphics();
            container.addChild(impactWaves);
            
            // Partículas de luz dourada
            const goldenParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 20; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFFD700, 0.7);
                particle.drawCircle(0, 0, 2 + Math.random() * 2);
                particle.endFill();
                
                particle.x = centerX;
                particle.y = centerY;
                particle.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.life = 0;
                particle.maxLife = 0.8;
                
                particles.push(particle);
                goldenParticles.addChild(particle);
            }
            
            container.addChild(goldenParticles);
            
            // Animação
            let impactOccurred = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.2, 1);
                
                // Martelo descendo
                if (progress < 0.3) {
                    hammer.y = -app.view.height * 0.5 + (progress / 0.3) * (centerY + app.view.height * 0.5);
                    hammer.alpha = Math.sin(progress * Math.PI * 3.33);
                } else if (!impactOccurred) {
                    impactOccurred = true;
                    hammer.y = centerY;
                    particles.forEach(p => p.visible = true);
                } else {
                    hammer.alpha = Math.max(0, hammer.alpha - 0.05);
                }
                
                // Ondas de impacto após o martelo chegar
                if (impactOccurred) {
                    impactWaves.clear();
                    
                    for (let i = 0; i < 3; i++) {
                        const waveProgress = ((elapsed - 0.36) * 3 + i * 0.3) % 1.5;
                        if (waveProgress > 0 && waveProgress < 1) {
                            const waveRadius = waveProgress * maxRadius * 0.7;
                            const waveAlpha = (1 - waveProgress) * 0.6;
                            const fadeAlpha = getFadeoutAlpha(waveRadius, maxRadius);
                            
                            impactWaves.lineStyle(4, 0xFFD700, waveAlpha * fadeAlpha);
                            impactWaves.drawCircle(centerX, centerY, waveRadius);
                        }
                    }
                }
                
                // Animar partículas
                particles.forEach(p => {
                    if (p.visible) {
                        p.x += p.vx;
                        p.y += p.vy;
                        p.life += 0.03;
                        
                        if (p.life > p.maxLife) {
                            p.visible = false;
                        }
                        
                        const distFromCenter = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        p.alpha = fadeAlpha * (1 - p.life / p.maxLife);
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
});