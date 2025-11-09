// shaders-attacks4.js - Shaders part 4
// Adiciona mais shaders ao dicionário existente

// SHADERS PRESENTES: IMPLOSION, DRAGON, BLADES, GORE, WHIRLWIND, STAB, DARKNESS, JUDGMENT

Object.assign(window.BOSS_DAMAGE_SHADERS, {

    // ========================================
    // 🌀 IMPLOSION/IMPLOSÃO - Implosão Mágica
    // ========================================
    "implosion_damage": {
        duration: 1600,
        name: "Dano de Implosão",
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
            
            // Shader de implosão
            const implosionFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Sucção para o centro
                    vec2 dir = normalize(uv - center);
                    float suckForce = (1.0 - dist) * intensity * 0.1;
                    vec2 suckUV = center + dir * (dist - suckForce);
                    
                    // Vórtice de implosão
                    float angle = atan(dir.y, dir.x);
                    float spiral = sin(angle * 8.0 + dist * 30.0 - time * 15.0) * 0.5 + 0.5;
                    spiral *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Anéis convergentes
                    float rings = 0.0;
                    for(float i = 1.0; i < 8.0; i++) {
                        float ring = 1.0 - smoothstep(0.0, 0.02, abs(dist - (0.5 - time * 0.3 + i * 0.1)));
                        rings += ring;
                    }
                    
                    vec4 color = texture2D(uSampler, suckUV);
                    
                    // Cores da implosão (roxo escuro)
                    vec3 implosionColor = vec3(0.4, 0.1, 0.6);
                    color.rgb = mix(color.rgb, implosionColor, spiral * intensity * 0.5);
                    color.rgb += vec3(0.6, 0.2, 0.8) * rings * intensity * 0.4;
                    
                    // Centro escuro
                    float darkCenter = 1.0 - smoothstep(0.0, 0.15, dist);
                    color.rgb *= 1.0 - darkCenter * intensity * 0.8;
                    
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
            bg.filters = [implosionFilter];
            container.addChild(bg);
            
            // Partículas sendo sugadas para o centro
            const suckParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 30; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x8A2BE2, 0.8);
                particle.drawCircle(0, 0, 1 + Math.random() * 2);
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = maxRadius * 0.8;
                particle.x = centerX + Math.cos(angle) * distance;
                particle.y = centerY + Math.sin(angle) * distance;
                particle.startX = particle.x;
                particle.startY = particle.y;
                particle.life = Math.random() * 0.5;
                
                particles.push(particle);
                suckParticles.addChild(particle);
            }
            
            container.addChild(suckParticles);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                implosionFilter.uniforms.time = elapsed;
                implosionFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar partículas sendo sugadas
                particles.forEach(p => {
                    p.life += 0.02;
                    
                    // Movimento em espiral para o centro
                    const dx = centerX - p.x;
                    const dy = centerY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 5) {
                        const force = 0.3 + p.life * 2;
                        p.x += (dx / dist) * force;
                        p.y += (dy / dist) * force;
                        
                        // Rotação espiral
                        const angle = Math.atan2(dy, dx);
                        const perpAngle = angle + Math.PI/2;
                        p.x += Math.cos(perpAngle) * force * 0.3;
                        p.y += Math.sin(perpAngle) * force * 0.3;
                    }
                    
                    if (p.life > 2) {
                        p.x = p.startX;
                        p.y = p.startY;
                        p.life = 0;
                    }
                    
                    const distFromCenter = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    p.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
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
    // 🐉 DRAGON/DRAGÃO - Corte do Dragão
    // ========================================
    "dragon_damage": {
        duration: 1600,
        name: "Dano do Dragão",
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
            
            // Trilha do dragão ascendente
            const dragonPath = new PIXI.Graphics();
            container.addChild(dragonPath);
            
            // Escamas douradas flutuantes
            const dragonScales = new PIXI.Container();
            const scales = [];
            
            for (let i = 0; i < 25; i++) {
                const scale = new PIXI.Graphics();
                scale.beginFill(0xFFD700, 0.7);
                
                // Forma de escama (losango)
                const scaleSize = 2 + Math.random() * 3;
                scale.drawPolygon([
                    0, -scaleSize,
                    scaleSize * 0.6, 0,
                    0, scaleSize,
                    -scaleSize * 0.6, 0
                ]);
                scale.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * maxRadius * 0.6;
                scale.x = centerX + Math.cos(angle) * distance;
                scale.y = centerY + Math.sin(angle) * distance;
                scale.vy = -1 - Math.random() * 2;
                scale.vx = (Math.random() - 0.5) * 1.5;
                scale.rotSpeed = (Math.random() - 0.5) * 0.1;
                scale.life = Math.random() * 0.5;
                scale.maxLife = 1.2;
                
                scales.push(scale);
                dragonScales.addChild(scale);
            }
            
            container.addChild(dragonScales);
            
            // Chamas douradas
            const dragonFlames = new PIXI.Container();
            const flames = [];
            
            for (let i = 0; i < 15; i++) {
                const flame = new PIXI.Graphics();
                flame.beginFill(0xFF6600, 0.8);
                flame.drawCircle(0, 0, 2 + Math.random() * 3);
                flame.endFill();
                
                flame.x = centerX;
                flame.y = centerY;
                flame.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                flame.vx = Math.cos(angle) * speed;
                flame.vy = Math.sin(angle) * speed - 3;
                flame.life = 0;
                flame.maxLife = 0.8;
                
                flames.push(flame);
                dragonFlames.addChild(flame);
            }
            
            container.addChild(dragonFlames);
            
            // Animação
            let breathStarted = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                // Desenhar trilha ascendente do dragão
                dragonPath.clear();
                
                if (progress > 0.2) {
                    const pathProgress = Math.min((progress - 0.2) / 0.6, 1);
                    
                    dragonPath.lineStyle(8, 0xFFD700, 0.8 * Math.sin(progress * Math.PI));
                    
                    // Trilha em S ascendente (como um dragão subindo)
                    const segments = Math.floor(pathProgress * 20);
                    if (segments > 0) {
                        dragonPath.moveTo(centerX - maxRadius * 0.3, centerY + maxRadius * 0.4);
                        
                        for (let i = 1; i <= segments; i++) {
                            const t = i / 20;
                            const waveX = Math.sin(t * Math.PI * 3) * maxRadius * 0.2;
                            const x = centerX + waveX;
                            const y = centerY + maxRadius * 0.4 - t * maxRadius * 0.8;
                            dragonPath.lineTo(x, y);
                        }
                    }
                }
                
                // Escamas douradas subindo
                scales.forEach(scale => {
                    scale.x += scale.vx;
                    scale.y += scale.vy;
                    scale.rotation += scale.rotSpeed;
                    scale.life += 0.02;
                    
                    if (scale.life > scale.maxLife) {
                        scale.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * maxRadius * 0.6;
                        scale.x = centerX + Math.cos(angle) * distance;
                        scale.y = centerY + Math.sin(angle) * distance + maxRadius * 0.3;
                        scale.vy = -1 - Math.random() * 2;
                    }
                    
                    const distFromCenter = Math.sqrt((scale.x - centerX) ** 2 + (scale.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    scale.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - scale.life / scale.maxLife);
                });
                
                // Respiração de fogo do dragão
                if (progress > 0.6 && !breathStarted) {
                    breathStarted = true;
                    flames.forEach(flame => flame.visible = true);
                }
                
                flames.forEach(flame => {
                    if (flame.visible) {
                        flame.x += flame.vx;
                        flame.y += flame.vy;
                        flame.life += 0.03;
                        
                        if (flame.life > flame.maxLife) {
                            flame.life = 0;
                            flame.x = centerX;
                            flame.y = centerY;
                        }
                        
                        const distFromCenter = Math.sqrt((flame.x - centerX) ** 2 + (flame.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        flame.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - flame.life / flame.maxLife);
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
    // ⚔️ BLADES/LÂMINAS - Dança das Lâminas
    // ========================================
    "blades_damage": {
        duration: 1600,
        name: "Dança das Lâminas",
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
            
            // Lâminas girando
            const bladesContainer = new PIXI.Graphics();
            container.addChild(bladesContainer);
            
            // Rastros de luz das lâminas
            const lightTrails = new PIXI.Container();
            const trails = [];
            
            for (let i = 0; i < 8; i++) {
                const trail = [];
                for (let j = 0; j < 10; j++) {
                    const trailPoint = new PIXI.Graphics();
                    trailPoint.beginFill(0xCCCCFF, 0.3);
                    trailPoint.drawCircle(0, 0, 2 - j * 0.15);
                    trailPoint.endFill();
                    trailPoint.visible = false;
                    trail.push(trailPoint);
                    lightTrails.addChild(trailPoint);
                }
                trails.push(trail);
            }
            
            container.addChild(lightTrails);
            
            // Faíscas metálicas
            const metalSparks = new PIXI.Container();
            const sparks = [];
            
            for (let i = 0; i < 20; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0xFFFFAA, 0.8);
                spark.drawCircle(0, 0, 0.5 + Math.random());
                spark.endFill();
                
                spark.x = centerX;
                spark.y = centerY;
                spark.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                spark.vx = Math.cos(angle) * speed;
                spark.vy = Math.sin(angle) * speed;
                spark.life = 0;
                spark.maxLife = 0.6;
                
                sparks.push(spark);
                metalSparks.addChild(spark);
            }
            
            container.addChild(metalSparks);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                // Desenhar lâminas girando
                bladesContainer.clear();
                
                const numBlades = 6;
                const bladeAlpha = Math.sin(progress * Math.PI) * 0.8;
                
                for (let i = 0; i < numBlades; i++) {
                    const angle = (i / numBlades) * Math.PI * 2 + elapsed * 12;
                    const bladeLength = maxRadius * 0.4;
                    
                    // Lâmina principal
                    bladesContainer.lineStyle(4, 0xCCCCCC, bladeAlpha);
                    bladesContainer.moveTo(centerX, centerY);
                    bladesContainer.lineTo(
                        centerX + Math.cos(angle) * bladeLength,
                        centerY + Math.sin(angle) * bladeLength
                    );
                    
                    // Brilho da lâmina
                    bladesContainer.lineStyle(2, 0xFFFFFF, bladeAlpha * 0.6);
                    bladesContainer.moveTo(centerX, centerY);
                    bladesContainer.lineTo(
                        centerX + Math.cos(angle) * bladeLength,
                        centerY + Math.sin(angle) * bladeLength
                    );
                    
                    // Atualizar rastros de luz
                    const bladeEndX = centerX + Math.cos(angle) * bladeLength;
                    const bladeEndY = centerY + Math.sin(angle) * bladeLength;
                    
                    const trail = trails[i];
                    // Mover rastros
                    for (let j = trail.length - 1; j > 0; j--) {
                        trail[j].x = trail[j - 1].x;
                        trail[j].y = trail[j - 1].y;
                        trail[j].visible = trail[j - 1].visible;
                        
                        const distFromCenter = Math.sqrt((trail[j].x - centerX) ** 2 + (trail[j].y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        trail[j].alpha = fadeAlpha * 0.5 * (1 - j / trail.length);
                    }
                    
                    // Novo ponto do rastro
                    trail[0].x = bladeEndX;
                    trail[0].y = bladeEndY;
                    trail[0].visible = progress > 0.1;
                }
                
                // Emitir faíscas
                if (Math.random() < 0.15) {
                    sparks.forEach(spark => {
                        if (!spark.visible) {
                            spark.visible = true;
                            spark.x = centerX;
                            spark.y = centerY;
                            spark.life = 0;
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 2 + Math.random() * 4;
                            spark.vx = Math.cos(angle) * speed;
                            spark.vy = Math.sin(angle) * speed;
                            return;
                        }
                    });
                }
                
                // Animar faíscas
                sparks.forEach(spark => {
                    if (spark.visible) {
                        spark.x += spark.vx;
                        spark.y += spark.vy;
                        spark.life += 0.04;
                        
                        if (spark.life > spark.maxLife) {
                            spark.visible = false;
                        }
                        
                        const distFromCenter = Math.sqrt((spark.x - centerX) ** 2 + (spark.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        spark.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - spark.life / spark.maxLife);
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
    // 🩸 GORE/SANGRENTO - Golpe Sangrento
    // ========================================
    "gore_damage": {
        duration: 1400,
        name: "Dano Sangrento",
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
            
            // Respingos de sangue em arco
            const bloodSplatters = new PIXI.Container();
            const splatters = [];
            
            for (let i = 0; i < 35; i++) {
                const splatter = new PIXI.Graphics();
                const splatSize = 2 + Math.random() * 4;
                splatter.beginFill(0x880000, 0.8);
                
                // Forma irregular de respingo
                const points = [];
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2;
                    const radius = splatSize * (0.7 + Math.random() * 0.6);
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                splatter.drawPolygon(points);
                splatter.endFill();
                
                // Posição em arco (como se fosse um corte horizontal)
                const arcAngle = -Math.PI/3 + (i / 35) * (2*Math.PI/3);
                const distance = 20 + Math.random() * maxRadius * 0.5;
                splatter.x = centerX + Math.cos(arcAngle) * distance;
                splatter.y = centerY + Math.sin(arcAngle) * distance;
                splatter.vx = Math.cos(arcAngle) * (3 + Math.random() * 4);
                splatter.vy = Math.sin(arcAngle) * (3 + Math.random() * 4) + Math.random() * 2;
                splatter.life = 0;
                splatter.maxLife = 1.0;
                splatter.gravity = 0.15;
                
                splatters.push(splatter);
                bloodSplatters.addChild(splatter);
            }
            
            container.addChild(bloodSplatters);
            
            // Marca de corte sangrenta
            const slashMark = new PIXI.Graphics();
            container.addChild(slashMark);
            
            // Gotejamento
            const bloodDrops = new PIXI.Container();
            const drops = [];
            
            for (let i = 0; i < 10; i++) {
                const drop = new PIXI.Graphics();
                drop.beginFill(0xAA0000, 0.9);
                // Forma de gota
                drop.drawCircle(0, 2, 2);
                drop.drawCircle(0, -1, 1.5);
                drop.endFill();
                
                drop.x = centerX + (Math.random() - 0.5) * 40;
                drop.y = centerY - 20;
                drop.vy = 0;
                drop.visible = false;
                drop.life = Math.random() * 0.5;
                
                drops.push(drop);
                bloodDrops.addChild(drop);
            }
            
            container.addChild(bloodDrops);
            
            // Animação
            let slashAppeared = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.4, 1);
                
                // Marca de corte aparece rapidamente
                if (progress > 0.1 && !slashAppeared) {
                    slashAppeared = true;
                    
                    slashMark.clear();
                    slashMark.lineStyle(6, 0x660000, 0.8);
                    
                    // Corte diagonal longo
                    const slashLength = maxRadius * 0.6;
                    slashMark.moveTo(centerX - slashLength/2, centerY - slashLength/4);
                    slashMark.lineTo(centerX + slashLength/2, centerY + slashLength/4);
                    
                    // Segundo corte cruzado
                    slashMark.moveTo(centerX - slashLength/3, centerY + slashLength/5);
                    slashMark.lineTo(centerX + slashLength/3, centerY - slashLength/5);
                    
                    // Ativar gotejamento
                    drops.forEach(drop => drop.visible = true);
                }
                
                // Fade da marca de corte
                if (slashAppeared) {
                    slashMark.alpha = Math.max(0, 1 - (progress - 0.3) * 2);
                }
                
                // Animar respingos
                splatters.forEach(splatter => {
                    splatter.x += splatter.vx;
                    splatter.y += splatter.vy;
                    splatter.vy += splatter.gravity;
                    splatter.life += 0.02;
                    
                    const distFromCenter = Math.sqrt((splatter.x - centerX) ** 2 + (splatter.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    splatter.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - splatter.life / splatter.maxLife);
                });
                
                // Animar gotejamento
                drops.forEach(drop => {
                    if (drop.visible) {
                        drop.life += 0.03;
                        drop.vy += 0.1;
                        drop.y += drop.vy;
                        
                        const distFromCenter = Math.sqrt((drop.x - centerX) ** 2 + (drop.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        drop.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
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
    // 🌪️ WHIRLWIND/REDEMOINHO - Giro Mortal
    // ========================================
    "whirlwind_damage": {
        duration: 1600,
        name: "Redemoinho Mortal",
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
            
            // Shader de redemoinho
            const whirlwindFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Rotação do redemoinho
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float spiralAngle = angle + time * 15.0 * (1.0 - dist);
                    
                    // Distorção espiral
                    float spiralRadius = dist + sin(spiralAngle * 4.0) * 0.02 * (1.0 - dist);
                    vec2 spiralUV = center + vec2(cos(spiralAngle), sin(spiralAngle)) * spiralRadius;
                    
                    // Linhas de força
                    float forceLines = sin(spiralAngle * 8.0 + time * 20.0) * 0.5 + 0.5;
                    forceLines *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    vec4 color = texture2D(uSampler, spiralUV);
                    
                    // Cor do redemoinho (cinza metálico)
                    vec3 whirlColor = vec3(0.7, 0.7, 0.8);
                    color.rgb = mix(color.rgb, whirlColor, forceLines * intensity * 0.5);
                    
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
            bg.filters = [whirlwindFilter];
            container.addChild(bg);
            
            // Detritos girando
            const debris = new PIXI.Container();
            const debrisParticles = [];
            
            for (let i = 0; i < 20; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x999999, 0.7);
                
                // Fragmento irregular
                const sides = 3 + Math.floor(Math.random() * 3);
                const points = [];
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const radius = 2 + Math.random() * 3;
                    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                particle.drawPolygon(points);
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 40;
                particle.x = centerX + Math.cos(angle) * distance;
                particle.y = centerY + Math.sin(angle) * distance;
                particle.baseAngle = angle;
                particle.baseDistance = distance;
                particle.orbitSpeed = 0.15 + Math.random() * 0.1;
                particle.rotSpeed = (Math.random() - 0.5) * 0.3;
                
                debrisParticles.push(particle);
                debris.addChild(particle);
            }
            
            container.addChild(debris);
            
            // Linhas de movimento circular
            const motionLines = new PIXI.Graphics();
            container.addChild(motionLines);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                whirlwindFilter.uniforms.time = elapsed;
                whirlwindFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar detritos girando
                debrisParticles.forEach(particle => {
                    particle.baseAngle += particle.orbitSpeed;
                    particle.x = centerX + Math.cos(particle.baseAngle) * particle.baseDistance;
                    particle.y = centerY + Math.sin(particle.baseAngle) * particle.baseDistance;
                    particle.rotation += particle.rotSpeed;
                    
                    const distFromCenter = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    particle.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                });
                
                // Desenhar linhas de movimento
                motionLines.clear();
                const lineAlpha = Math.sin(progress * Math.PI) * 0.4;
                
                for (let i = 0; i < 6; i++) {
                    const radius = 30 + i * 15;
                    motionLines.lineStyle(2 - i * 0.2, 0xCCCCCC, lineAlpha);
                    
                    // Arco de movimento
                    const startAngle = elapsed * 10 + i;
                    const arcLength = Math.PI / 2;
                    
                    for (let j = 0; j < 20; j++) {
                        const angle = startAngle + (j / 20) * arcLength;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;
                        
                        if (j === 0) {
                            motionLines.moveTo(x, y);
                        } else {
                            motionLines.lineTo(x, y);
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
    // 🗡️ STAB/PUNHALADA - Apunhalada Traiçoeira
    // ========================================
    "stab_damage": {
        duration: 1200,
        name: "Punhalada Traiçoeira",
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
            
            // Punhal aparecendo das sombras
            const dagger = new PIXI.Graphics();
            container.addChild(dagger);
            
            // Sangue do golpe crítico
            const criticalBlood = new PIXI.Container();
            const bloodSplashes = [];
            
            for (let i = 0; i < 35; i++) {
                const splash = new PIXI.Graphics();
                splash.beginFill(0xAA0000, 0.8);
                splash.drawCircle(0, 0, 1 + Math.random() * 3);
                splash.endFill();
                
                splash.x = centerX;
                splash.y = centerY;
                splash.visible = false;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                splash.vx = Math.cos(angle) * speed;
                splash.vy = Math.sin(angle) * speed;
                splash.life = 0;
                splash.maxLife = 1.2;
                
                bloodSplashes.push(splash);
                criticalBlood.addChild(splash);
            }
            
            container.addChild(criticalBlood);
            
            // Efeito de sombra ao redor
            const shadowRing = new PIXI.Graphics();
            container.addChild(shadowRing);
            
            // Linhas de impacto crítico
            const criticalLines = new PIXI.Graphics();
            container.addChild(criticalLines);
            
            // Animação
            let stabOccurred = false;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.2, 1);
                
                // Punhal aparecendo rapidamente
                if (progress < 0.2) {
                    const stabProgress = progress / 0.15;
                    
                    dagger.clear();
                    dagger.beginFill(0x444444, 0.9);
                    
                    // Lâmina do punhal
                    const bladeLength = 35 * stabProgress;
                    dagger.drawPolygon([
                        centerX, centerY - bladeLength,
                        centerX - 3, centerY - bladeLength + 15,
                        centerX - 2, centerY,
                        centerX + 2, centerY,
                        centerX + 3, centerY - bladeLength + 15
                    ]);
                    
                    // Cabo
                    dagger.beginFill(0x8B4513, 0.9);
                    dagger.drawRect(centerX - 2, centerY, 4, 8 * stabProgress);
                    dagger.endFill();
                    
                    // Brilho da lâmina
                    dagger.lineStyle(1, 0xCCCCCC, 0.8);
                    dagger.moveTo(centerX, centerY - bladeLength);
                    dagger.lineTo(centerX, centerY);
                    
                } else if (!stabOccurred) {
                    stabOccurred = true;
                    
                    // Ativar sangue crítico
                    bloodSplashes.forEach(splash => splash.visible = true);
                    
                    // Punhal some rapidamente
                    dagger.alpha = 0.5;
                }
                
                // Anel de sombra
                shadowRing.clear();
                if (progress > 0.1) {
                    const shadowAlpha = Math.sin(progress * Math.PI) * 0.6;
                    
                    // Círculo externo
                    shadowRing.beginFill(0x000000, shadowAlpha);
                    shadowRing.drawCircle(centerX, centerY, maxRadius * 0.4);
                    shadowRing.endFill();
                    
                    // Círculo interno (para criar o "buraco")
                    shadowRing.beginFill(0x000000, 0);
                    shadowRing.drawCircle(centerX, centerY, maxRadius * 0.3);
                    shadowRing.endFill();
                    
                    // Alternativa: usar apenas contorno
                    shadowRing.lineStyle(8, 0x000000, shadowAlpha * 0.6);
                    shadowRing.drawCircle(centerX, centerY, (maxRadius * 0.3 + maxRadius * 0.15) / 2);
                }
                
                // Linhas de impacto crítico
                if (stabOccurred) {
                    criticalLines.clear();
                    const lineAlpha = Math.sin(progress * Math.PI) * 0.2;
                    
                    criticalLines.lineStyle(3, 0xFFFFFF, lineAlpha);
                    
                    // Linhas radiais de impacto
                    for (let i = 0; i < 5; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const length = 15 + Math.sin(elapsed * 10 + i) * 3;
                        
                        criticalLines.moveTo(centerX, centerY);
                        criticalLines.lineTo(
                            centerX + Math.cos(angle) * length,
                            centerY + Math.sin(angle) * length
                        );
                    }
                }
                
                // Animar sangue crítico
                bloodSplashes.forEach(splash => {
                    if (splash.visible) {
                        splash.x += splash.vx;
                        splash.y += splash.vy;
                        splash.life += 0.04;
                        
                        if (splash.life > splash.maxLife) {
                            splash.visible = false;
                        }
                        
                        const distFromCenter = Math.sqrt((splash.x - centerX) ** 2 + (splash.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        splash.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - splash.life / splash.maxLife);
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
    // 🌑 DARKNESS/TREVAS - Abraço da Escuridão
    // ========================================
    "darkness_damage": {
        duration: 1600,
        name: "Abraço das Trevas",
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
            
            // Shader de trevas envolventes
            const darknessFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Ondas de escuridão
                    float darkness = sin(dist * 20.0 - time * 4.0) * 0.5 + 0.5;
                    darkness *= 1.0 - smoothstep(0.0, 0.4, dist);
                    
                    // Tentáculos sombrios
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float tentacles = 0.0;
                    
                    for(float i = 0.0; i < 6.0; i++) {
                        float tentacleAngle = (i / 6.0) * 3.14159 * 2.0 + time * 2.0;
                        float tentacleDist = abs(angle - tentacleAngle);
                        tentacleDist = min(tentacleDist, 6.28318 - tentacleDist);
                        
                        float tentacle = 1.0 - smoothstep(0.0, 0.2, tentacleDist);
                        tentacle *= sin(dist * 15.0 + time * 8.0 + i) * 0.5 + 0.5;
                        tentacle *= 1.0 - smoothstep(0.0, 0.35, dist);
                        tentacles += tentacle;
                    }
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cor das trevas (roxo escuro)
                    vec3 darknessColor = vec3(0.2, 0.1, 0.3);
                    color.rgb = mix(color.rgb, darknessColor, darkness * intensity * 0.6);
                    color.rgb = mix(color.rgb, vec3(0.0, 0.0, 0.0), tentacles * intensity * 0.4);
                    
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
            bg.filters = [darknessFilter];
            container.addChild(bg);
            
            // Tentáculos sombrios convergindo
            const shadowTentacles = new PIXI.Container();
            const tentacles = [];
            
            for (let i = 0; i < 8; i++) {
                const tentacle = [];
                const angle = (i / 8) * Math.PI * 2;
                
                for (let j = 0; j < 8; j++) {
                    const segment = new PIXI.Graphics();
                    segment.beginFill(0x000000, 0.6);
                    segment.drawCircle(0, 0, 4 - j * 0.4);
                    segment.endFill();
                    
                    const distance = maxRadius * 0.8 - j * 10;
                    segment.x = centerX + Math.cos(angle) * distance;
                    segment.y = centerY + Math.sin(angle) * distance;
                    segment.baseAngle = angle;
                    segment.baseDistance = distance;
                    segment.segmentIndex = j;
                    
                    tentacle.push(segment);
                    shadowTentacles.addChild(segment);
                }
                
                tentacles.push(tentacle);
            }
            
            container.addChild(shadowTentacles);
            
            // Partículas sombrias
            const darkParticles = new PIXI.Container();
            const particles = [];
            
            for (let i = 0; i < 25; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x330033, 0.7);
                particle.drawCircle(0, 0, 1 + Math.random() * 2);
                particle.endFill();
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * maxRadius * 0.7;
                particle.x = centerX + Math.cos(angle) * distance;
                particle.y = centerY + Math.sin(angle) * distance;
                particle.vx = (Math.random() - 0.5) * 2;
                particle.vy = (Math.random() - 0.5) * 2;
                particle.life = Math.random() * 0.5;
                particle.maxLife = 1.2;
                
                particles.push(particle);
                darkParticles.addChild(particle);
            }
            
            container.addChild(darkParticles);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.6, 1);
                
                darknessFilter.uniforms.time = elapsed;
                darknessFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar tentáculos convergindo
                tentacles.forEach((tentacle, tentacleIndex) => {
                    tentacle.forEach((segment, segmentIndex) => {
                        // Convergir para o centro
                        const convergence = Math.min(progress * 2, 1);
                        const targetDistance = segment.baseDistance * (1 - convergence * 0.7);
                        
                        // Movimento ondulante
                        const wave = Math.sin(elapsed * 3 + tentacleIndex + segmentIndex * 0.5) * 15;
                        const waveAngle = segment.baseAngle + wave * 0.01;
                        
                        segment.x = centerX + Math.cos(waveAngle) * targetDistance;
                        segment.y = centerY + Math.sin(waveAngle) * targetDistance;
                        
                        const distFromCenter = Math.sqrt((segment.x - centerX) ** 2 + (segment.y - centerY) ** 2);
                        const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                        segment.alpha = Math.sin(progress * Math.PI) * fadeAlpha;
                    });
                });
                
                // Animar partículas sombrias
                particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.life += 0.02;
                    
                    // Atraídas para o centro
                    const dx = centerX - particle.x;
                    const dy = centerY - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 5) {
                        particle.vx += (dx / distance) * 0.2;
                        particle.vy += (dy / distance) * 0.2;
                    }
                    
                    if (particle.life > particle.maxLife) {
                        particle.life = 0;
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * maxRadius * 0.7;
                        particle.x = centerX + Math.cos(angle) * dist;
                        particle.y = centerY + Math.sin(angle) * dist;
                        particle.vx = (Math.random() - 0.5) * 2;
                        particle.vy = (Math.random() - 0.5) * 2;
                    }
                    
                    const distFromCenter = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
                    const fadeAlpha = getFadeoutAlpha(distFromCenter, maxRadius);
                    particle.alpha = Math.sin(progress * Math.PI) * fadeAlpha * (1 - particle.life / particle.maxLife);
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
    // ⚖️ JUDGMENT/JULGAMENTO - Julgamento Celestial
    // ========================================
    "judgment_damage": {
        duration: 1800,
        name: "Julgamento Celestial",
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
            
            // Shader de julgamento divino com múltiplos efeitos
            const judgmentFilter = new PIXI.Filter(null, `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float time;
                uniform float intensity;
                
                void main(void) {
                    vec2 uv = vTextureCoord;
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // Campo de energia divina central
                    float divineField = 1.0 - smoothstep(0.0, 0.35, dist);
                    divineField *= sin(time * 8.0) * 0.3 + 0.7;
                    
                    // Raios de julgamento convergindo
                    vec2 dir = uv - center;
                    float angle = atan(dir.y, dir.x);
                    float rayPattern = 0.0;
                    
                    for(float i = 0.0; i < 12.0; i++) {
                        float rayAngle = (i / 12.0) * 6.28318;
                        float rayDiff = abs(angle - rayAngle);
                        rayDiff = min(rayDiff, 6.28318 - rayDiff);
                        
                        float ray = 1.0 - smoothstep(0.0, 0.1, rayDiff);
                        ray *= sin(dist * 25.0 - time * 12.0 + i) * 0.5 + 0.5;
                        ray *= 1.0 - smoothstep(0.1, 0.4, dist);
                        rayPattern += ray;
                    }
                    
                    // Ondas de purificação
                    float purificationWaves = 0.0;
                    for(float i = 1.0; i < 6.0; i++) {
                        float wave = sin(dist * 30.0 - time * (6.0 + i * 2.0)) * 0.5 + 0.5;
                        wave *= pow(1.0 - smoothstep(0.0, 0.4, dist), 2.0);
                        purificationWaves += wave;
                    }
                    
                    // Brilho celestial central
                    float celestialGlow = exp(-dist * 8.0) * (sin(time * 10.0) * 0.4 + 0.6);
                    
                    vec4 color = texture2D(uSampler, uv);
                    
                    // Cores do julgamento (dourado-branco)
                    vec3 divineColor = vec3(1.0, 0.9, 0.7);
                    vec3 rayColor = vec3(1.0, 1.0, 0.8);
                    vec3 glowColor = vec3(1.0, 1.0, 1.0);
                    
                    color.rgb = mix(color.rgb, divineColor, divineField * intensity * 0.6);
                    color.rgb += rayColor * rayPattern * intensity * 0.4;
                    color.rgb += glowColor * celestialGlow * intensity * 0.5;
                    color.rgb += divineColor * purificationWaves * intensity * 0.3;
                    
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
            bg.filters = [judgmentFilter];
            container.addChild(bg);
            
            // Símbolo de justiça central brilhante
            const justiceSymbol = new PIXI.Graphics();
            justiceSymbol.beginFill(0xFFD700, 0.8);
            
            // Balança da justiça (forma simplificada)
            justiceSymbol.drawRect(centerX - 2, centerY - 20, 4, 40); // Haste central
            justiceSymbol.drawRect(centerX - 15, centerY - 22, 30, 4); // Barra horizontal
            
            // Pratos da balança
            justiceSymbol.lineStyle(2, 0xFFD700, 0.9);
            justiceSymbol.drawCircle(centerX - 12, centerY - 15, 8);
            justiceSymbol.drawCircle(centerX + 12, centerY - 15, 8);
            
            container.addChild(justiceSymbol);
            
            // Anéis de energia divina pulsantes
            const divineRings = new PIXI.Graphics();
            container.addChild(divineRings);
            
            // Colunas de luz descendentes
            const lightPillars = new PIXI.Container();
            const pillars = [];
            
            for (let i = 0; i < 6; i++) {
                const pillar = new PIXI.Graphics();
                pillar.beginFill(0xFFFFAA, 0.4);
                pillar.drawRect(-3, -app.view.height, 6, app.view.height * 2);
                pillar.endFill();
                
                const angle = (i / 6) * Math.PI * 2;
                const distance = 25 + i * 8;
                pillar.x = centerX + Math.cos(angle) * distance;
                pillar.y = centerY;
                pillar.alpha = 0;
                pillar.baseAlpha = 0.6 - i * 0.08;
                
                pillars.push(pillar);
                lightPillars.addChild(pillar);
            }
            
            container.addChild(lightPillars);
            
            // Animação
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / 1.8, 1);
                
                judgmentFilter.uniforms.time = elapsed;
                judgmentFilter.uniforms.intensity = Math.sin(progress * Math.PI);
                
                // Animar símbolo de justiça
                justiceSymbol.rotation = Math.sin(elapsed * 2) * 0.05;
                justiceSymbol.scale.set(1 + Math.sin(elapsed * 4) * 0.1);
                justiceSymbol.alpha = Math.sin(progress * Math.PI);
                
                // Desenhar anéis de energia pulsantes
                divineRings.clear();
                
                for (let i = 0; i < 5; i++) {
                    const ringProgress = (elapsed * 2 + i * 0.4) % 2;
                    const ringRadius = 15 + ringProgress * maxRadius * 0.6;
                    const ringAlpha = Math.max(0, 1 - ringProgress) * Math.sin(progress * Math.PI) * 0.6;
                    const fadeAlpha = getFadeoutAlpha(ringRadius, maxRadius);
                    
                    if (ringAlpha > 0 && fadeAlpha > 0) {
                        divineRings.lineStyle(3, 0xFFD700, ringAlpha * fadeAlpha);
                        divineRings.drawCircle(centerX, centerY, ringRadius);
                        
                        // Anel interno brilhante
                        divineRings.lineStyle(1, 0xFFFFFF, ringAlpha * fadeAlpha * 0.8);
                        divineRings.drawCircle(centerX, centerY, ringRadius - 2);
                    }
                }
                
                // Animar colunas de luz
                pillars.forEach((pillar, index) => {
                    if (progress > 0.3) {
                        const pillarProgress = Math.min((progress - 0.3) * 2, 1);
                        pillar.alpha = pillar.baseAlpha * pillarProgress * Math.sin(elapsed * 3 + index);
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