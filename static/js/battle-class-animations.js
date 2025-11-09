// ===== SISTEMA DE ANIMAÇÕES POR CLASSE =====
// Configurações de sprites e animações para cada classe/subclasse

const CHARACTER_ANIMATIONS = {
    // ========================================
    // CLASSE MAGO (Sprites próprios - Referência)
    // ========================================
    "Mago": {
        idle: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/idle/mago_idle_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/idle/mago_idle_body.png",
                weapon: "/static/game.data/sprites/mago_standard/idle/mago_idle_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/idle/mago_idle_front_effect.png"
            },
            frames: 11,
            totalWidth: 2816,
            duration: "1.0s",
            steps: 11,
            scale: 1.0,
            loop: "infinite"
        },
        run: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_body.png",
                weapon: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_front_effect.png"
            },
            frames: 8,
            totalWidth: 2048,
            duration: "0.4s",
            steps: 8,
            scale: 1.0,
            loop: "infinite"
        },
        melee_attack1: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/melee_1/mago_melee_1_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/melee_1/mago_melee_1_body.png",
                weapon: "/static/game.data/sprites/mago_standard/melee_1/mago_melee_1_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/melee_1/mago_melee_1_front_effect.png"
            },
            frames: 24,
            totalWidth: 6144,
            duration: "1.4s",
            steps: 24,
            scale: 1.0,
            loop: "forwards"
        },
        melee_attack2: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/melee_2/mago_melee_2_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/melee_2/mago_melee_2_body.png",
                weapon: "/static/game.data/sprites/mago_standard/melee_2/mago_melee_2_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/melee_2/mago_melee_2_front_effect.png"
            },
            frames: 7,
            totalWidth: 1792,
            duration: "0.6s",
            steps: 7,
            scale: 1.0,
            loop: "forwards"
        },
        magic_attack1: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_body.png",
                weapon: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_front_effect.png"
            },
            frames: 15,
            totalWidth: 3840,
            duration: "1.2s",
            steps: 15,
            scale: 1.0,
            loop: "forwards"
        },
        cast_preparation: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_body.png",
                weapon: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/magic_1/mago_magic_1_front_effect.png"
            },
            frames: 15,
            totalWidth: 3840,
            duration: "1.0s",
            steps: 15,
            scale: 1.0,
            loop: "forwards"
        },
        walk_advance: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_body.png",
                weapon: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/run_1/mago_run_1_front_effect.png"
            },
            frames: 8,
            totalWidth: 2048,
            duration: "0.3s",
            steps: 8,
            scale: 1.0,
            loop: "forwards"
        },
        walk_return: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/retorno/mago_retorno_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/retorno/mago_retorno_body.png",
                weapon: "/static/game.data/sprites/mago_standard/retorno/mago_retorno_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/retorno/mago_retorno_front_effect.png"
            },
            frames: 8,
            totalWidth: 2048,
            duration: "0.6s",
            steps: 8,
            scale: 1.0,
            loop: "forwards"
        },
        teleport_return: {
            layers: {
                back_effect: "/static/game.data/sprites/mago_standard/ressurgimento/mago_ressurgimento_back_effect.png",
                body: "/static/game.data/sprites/mago_standard/ressurgimento/mago_ressurgimento_body.png",
                weapon: "/static/game.data/sprites/mago_standard/ressurgimento/mago_ressurgimento_weapon.png",
                front_effect: "/static/game.data/sprites/mago_standard/ressurgimento/mago_ressurgimento_front_effect.png"
            },
            frames: 13,
            totalWidth: 3328,
            duration: "0.8s",
            steps: 13,
            scale: 1.0,
            loop: "forwards"
        }
    },

    // ========================================
    // VLAD
    // ========================================
    "Vlad": {
        idle: {
            layers: {
                fx2: "/static/game.data/character/vlad/idle/idle-fx2.png",
                hairback: "/static/game.data/character/vlad/idle/idle-hairback.png",
                cape: "/static/game.data/character/vlad/idle/idle-cape.png",
                backarm: "/static/game.data/character/vlad/idle/idle-backarm.png",
                body: "/static/game.data/character/vlad/idle/idle-body.png",
                arms: "/static/game.data/character/vlad/idle/idle-arms.png",
                head: "/static/game.data/character/vlad/idle/idle-head.png",
                hair: "/static/game.data/character/vlad/idle/idle-hair.png",
                ear: "/static/game.data/character/vlad/idle/idle-ear.png",
                robe: "/static/game.data/character/vlad/idle/idle-robe.png",
                ombreira: "/static/game.data/character/vlad/idle/idle-ombreira.png",
                hairfront: "/static/game.data/character/vlad/idle/idle-hairfront.png",
                fx1: "/static/game.data/character/vlad/idle/idle-fx1.png"
            },
            frames: 13,
            totalWidth: 1664,
            duration: "1.3s",
            steps: 12,
            scale: 1.0,
            loop: "infinite"
        },
        run: {
            layers: {
                fx2: "/static/game.data/character/vlad/run/run-fx2.png",
                hairback: "/static/game.data/character/vlad/run/run-hairback.png",
                cape: "/static/game.data/character/vlad/run/run-cape.png",
                backarm: "/static/game.data/character/vlad/run/run-backarm.png",
                body: "/static/game.data/character/vlad/run/run-body.png",
                arms: "/static/game.data/character/vlad/run/run-arms.png",
                head: "/static/game.data/character/vlad/run/run-head.png",
                hair: "/static/game.data/character/vlad/run/run-hair.png",
                ear: "/static/game.data/character/vlad/run/run-ear.png",
                robe: "/static/game.data/character/vlad/run/run-robe.png",
                ombreira: "/static/game.data/character/vlad/run/run-ombreira.png",
                hairfront: "/static/game.data/character/vlad/run/run-hairfront.png",
                fx1: "/static/game.data/character/vlad/run/run-fx1.png"
            },
            frames: 12,
            totalWidth: 1408,
            duration: "0.4s",
            steps: 12,
            scale: 1.0,
            loop: "infinite"
        },
        stop: {
            layers: {
                fx2: "/static/game.data/character/vlad/stop/stop-fx2.png",
                hairback: "/static/game.data/character/vlad/stop/stop-hairback.png",
                cape: "/static/game.data/character/vlad/stop/stop-cape.png",
                backarm: "/static/game.data/character/vlad/stop/stop-backarm.png",
                body: "/static/game.data/character/vlad/stop/stop-body.png",
                arms: "/static/game.data/character/vlad/stop/stop-arms.png",
                head: "/static/game.data/character/vlad/stop/stop-head.png",
                hair: "/static/game.data/character/vlad/stop/stop-hair.png",
                ear: "/static/game.data/character/vlad/stop/stop-ear.png",
                robe: "/static/game.data/character/vlad/stop/stop-robe.png",
                ombreira: "/static/game.data/character/vlad/stop/stop-ombreira.png",
                hairfront: "/static/game.data/character/vlad/stop/stop-hairfront.png",
                fx1: "/static/game.data/character/vlad/stop/stop-fx1.png"
            },
            frames: 8,
            totalWidth: 1024,
            duration: "0.3s",
            steps: 8,
            scale: 1.0,
            loop: "forwards"
        },
        bloodattack: {
            layers: {
                fx2: "/static/game.data/character/vlad/bloodattack/bloodattack-fx2.png",
                hairback: "/static/game.data/character/vlad/bloodattack/bloodattack-hairback.png",
                cape: "/static/game.data/character/vlad/bloodattack/bloodattack-cape.png",
                backarm: "/static/game.data/character/vlad/bloodattack/bloodattack-backarm.png",
                body: "/static/game.data/character/vlad/bloodattack/bloodattack-body.png",
                arms: "/static/game.data/character/vlad/bloodattack/bloodattack-arms.png",
                head: "/static/game.data/character/vlad/bloodattack/bloodattack-head.png",
                hair: "/static/game.data/character/vlad/bloodattack/bloodattack-hair.png",
                ear: "/static/game.data/character/vlad/bloodattack/bloodattack-ear.png",
                robe: "/static/game.data/character/vlad/bloodattack/bloodattack-robe.png",
                ombreira: "/static/game.data/character/vlad/bloodattack/bloodattack-ombreira.png",
                hairfront: "/static/game.data/character/vlad/bloodattack/bloodattack-hairfront.png",
                fx1: "/static/game.data/character/vlad/bloodattack/bloodattack-fx1.png"
            },
            frames: 24,
            totalWidth: 4224,
            duration: "1.8s",
            steps: 24,
            scale: 1.0,
            loop: "forwards"
        },
        power: {
            layers: {
                fx2: "/static/game.data/character/vlad/power/power-fx2.png",
                hairback: "/static/game.data/character/vlad/power/power-hairback.png",
                cape: "/static/game.data/character/vlad/power/power-cape.png",
                backarm: "/static/game.data/character/vlad/power/power-backarm.png",
                body: "/static/game.data/character/vlad/power/power-body.png",
                arms: "/static/game.data/character/vlad/power/power-arms.png",
                head: "/static/game.data/character/vlad/power/power-head.png",
                hair: "/static/game.data/character/vlad/power/power-hair.png",
                ear: "/static/game.data/character/vlad/power/power-ear.png",
                robe: "/static/game.data/character/vlad/power/power-robe.png",
                ombreira: "/static/game.data/character/vlad/power/power-ombreira.png",
                hairfront: "/static/game.data/character/vlad/power/power-hairfront.png",
                fx1: "/static/game.data/character/vlad/power/power-fx1.png"
            },
            frames: 27,
            totalWidth: 4752,
            duration: "2.0s",
            steps: 27,
            scale: 1.4,
            loop: "forwards"
        },
        special: {
            layers: {
                fx2: "/static/game.data/character/vlad/special/special-fx2.png",
                hairback: "/static/game.data/character/vlad/special/special-hairback.png",
                cape: "/static/game.data/character/vlad/special/special-cape.png",
                backarm: "/static/game.data/character/vlad/special/special-backarm.png",
                body: "/static/game.data/character/vlad/special/special-body.png",
                arms: "/static/game.data/character/vlad/special/special-arms.png",
                head: "/static/game.data/character/vlad/special/special-head.png",
                hair: "/static/game.data/character/vlad/special/special-hair.png",
                ear: "/static/game.data/character/vlad/special/special-ear.png",
                robe: "/static/game.data/character/vlad/special/special-robe.png",
                ombreira: "/static/game.data/character/vlad/special/special-ombreira.png",
                hairfront: "/static/game.data/character/vlad/special/special-hairfront.png",
                fx1: "/static/game.data/character/vlad/special/special-fx1.png"
            },
            frames: 32,
            totalWidth: 4096,
            duration: "2.2s",
            steps: 32,
            scale: 1.0,
            loop: "forwards"
        },
        ultimate: {
            layers: {
                fx2: "/static/game.data/character/vlad/ultimate/ultimate-fx2.png",
                hairback: "/static/game.data/character/vlad/ultimate/ultimate-hairback.png",
                cape: "/static/game.data/character/vlad/ultimate/ultimate-cape.png",
                backarm: "/static/game.data/character/vlad/ultimate/ultimate-backarm.png",
                body: "/static/game.data/character/vlad/ultimate/ultimate-body.png",
                arms: "/static/game.data/character/vlad/ultimate/ultimate-arms.png",
                head: "/static/game.data/character/vlad/ultimate/ultimate-head.png",
                hair: "/static/game.data/character/vlad/ultimate/ultimate-hair.png",
                ear: "/static/game.data/character/vlad/ultimate/ultimate-ear.png",
                robe: "/static/game.data/character/vlad/ultimate/ultimate-robe.png",
                ombreira: "/static/game.data/character/vlad/ultimate/ultimate-ombreira.png",
                hairfront: "/static/game.data/character/vlad/ultimate/ultimate-hairfront.png",
                fx1: "/static/game.data/character/vlad/ultimate/ultimate-fx1.png"
            },
            frames: 28,
            totalWidth: 3584,
            duration: "1.4s",
            steps: 28,
            scale: 1.0,
            loop: "forwards"
        },
        return: {
            layers: {
                fx2: "/static/game.data/character/vlad/return/return-fx2.png",
                hairback: "/static/game.data/character/vlad/return/return-hairback.png",
                cape: "/static/game.data/character/vlad/return/return-cape.png",
                backarm: "/static/game.data/character/vlad/return/return-backarm.png",
                body: "/static/game.data/character/vlad/return/return-body.png",
                arms: "/static/game.data/character/vlad/return/return-arms.png",
                head: "/static/game.data/character/vlad/return/return-head.png",
                hair: "/static/game.data/character/vlad/return/return-hair.png",
                ear: "/static/game.data/character/vlad/return/return-ear.png",
                robe: "/static/game.data/character/vlad/return/return-robe.png",
                ombreira: "/static/game.data/character/vlad/return/return-ombreira.png",
                hairfront: "/static/game.data/character/vlad/return/return-hairfront.png",
                fx1: "/static/game.data/character/vlad/return/return-fx1.png"
            },
            frames: 13,
            totalWidth: 1664,
            duration: "1.0s",
            steps: 13,
            scale: 1.0,
            loop: "forwards"
        },
        autofagia: {
            layers: {
                fx2: "/static/game.data/character/vlad/autofagia/autofagia-fx2.png",
                hairback: "/static/game.data/character/vlad/autofagia/autofagia-hairback.png",
                cape: "/static/game.data/character/vlad/autofagia/autofagia-cape.png",
                backarm: "/static/game.data/character/vlad/autofagia/autofagia-backarm.png",
                body: "/static/game.data/character/vlad/autofagia/autofagia-body.png",
                arms: "/static/game.data/character/vlad/autofagia/autofagia-arms.png",
                head: "/static/game.data/character/vlad/autofagia/autofagia-head.png",
                hair: "/static/game.data/character/vlad/autofagia/autofagia-hair.png",
                ear: "/static/game.data/character/vlad/autofagia/autofagia-ear.png",
                robe: "/static/game.data/character/vlad/autofagia/autofagia-robe.png",
                ombreira: "/static/game.data/character/vlad/autofagia/autofagia-ombreira.png",
                hairfront: "/static/game.data/character/vlad/autofagia/autofagia-hairfront.png",
                fx1: "/static/game.data/character/vlad/autofagia/autofagia-fx1.png"
            },
            frames: 31,
            totalWidth: 3968,
            duration: "1.5s",
            steps: 31,
            scale: 1.0,
            loop: "forwards"
        },
        damage: {
            layers: {
                fx2: "/static/game.data/character/vlad/damage/damage-fx2.png",
                hairback: "/static/game.data/character/vlad/damage/damage-hairback.png",
                cape: "/static/game.data/character/vlad/damage/damage-cape.png",
                backarm: "/static/game.data/character/vlad/damage/damage-backarm.png",
                body: "/static/game.data/character/vlad/damage/damage-body.png",
                arms: "/static/game.data/character/vlad/damage/damage-arms.png",
                head: "/static/game.data/character/vlad/damage/damage-head.png",
                hair: "/static/game.data/character/vlad/damage/damage-hair.png",
                ear: "/static/game.data/character/vlad/damage/damage-ear.png",
                robe: "/static/game.data/character/vlad/damage/damage-robe.png",
                ombreira: "/static/game.data/character/vlad/damage/damage-ombreira.png",
                hairfront: "/static/game.data/character/vlad/damage/damage-hairfront.png",
                fx1: "/static/game.data/character/vlad/damage/damage-fx1.png"
            },
            frames: 9,
            totalWidth: 1152,
            duration: "1.0s",
            steps: 8,
            scale: 1.0,
            loop: "forwards"
        },
        deathdamage: {
            layers: {
                fx2: "/static/game.data/character/vlad/deathdamage/deathdamage-fx2.png",
                hairback: "/static/game.data/character/vlad/deathdamage/deathdamage-hairback.png",
                cape: "/static/game.data/character/vlad/deathdamage/deathdamage-cape.png",
                backarm: "/static/game.data/character/vlad/deathdamage/deathdamage-backarm.png",
                body: "/static/game.data/character/vlad/deathdamage/deathdamage-body.png",
                arms: "/static/game.data/character/vlad/deathdamage/deathdamage-arms.png",
                head: "/static/game.data/character/vlad/deathdamage/deathdamage-head.png",
                hair: "/static/game.data/character/vlad/deathdamage/deathdamage-hair.png",
                ear: "/static/game.data/character/vlad/deathdamage/deathdamage-ear.png",
                robe: "/static/game.data/character/vlad/deathdamage/deathdamage-robe.png",
                ombreira: "/static/game.data/character/vlad/deathdamage/deathdamage-ombreira.png",
                hairfront: "/static/game.data/character/vlad/deathdamage/deathdamage-hairfront.png",
                fx1: "/static/game.data/character/vlad/deathdamage/deathdamage-fx1.png"
            },
            frames: 44,
            totalWidth: 5632,
            duration: "4.0s",
            steps: 43,
            scale: 1.0,
            loop: "forwards"
        },
        dodge: {
            layers: {
                fx2: "/static/game.data/character/vlad/dodge/dodge-fx2.png",
                hairback: "/static/game.data/character/vlad/dodge/dodge-hairback.png",
                cape: "/static/game.data/character/vlad/dodge/dodge-cape.png",
                backarm: "/static/game.data/character/vlad/dodge/dodge-backarm.png",
                body: "/static/game.data/character/vlad/dodge/dodge-body.png",
                arms: "/static/game.data/character/vlad/dodge/dodge-arms.png",
                head: "/static/game.data/character/vlad/dodge/dodge-head.png",
                hair: "/static/game.data/character/vlad/dodge/dodge-hair.png",
                ear: "/static/game.data/character/vlad/dodge/dodge-ear.png",
                robe: "/static/game.data/character/vlad/dodge/dodge-robe.png",
                ombreira: "/static/game.data/character/vlad/dodge/dodge-ombreira.png",
                hairfront: "/static/game.data/character/vlad/dodge/dodge-hairfront.png",
                fx1: "/static/game.data/character/vlad/dodge/dodge-fx1.png"
            },
            frames: 13,
            totalWidth: 1664,
            duration: "1.0s",
            steps: 12,
            scale: 1.0,
            loop: "forwards"
        }
    },
};

// ===== FUNÇÕES DE CONSULTA E CRIAÇÃO =====

function getCurrentPlayerCharacter() {
    const playerCharacterElement = document.getElementById('player-character');
    
    if (playerCharacterElement) {
        const characterId = playerCharacterElement.innerText.trim();
        
        // Mapeamento de IDs para nomes das animações
        const characterMapping = {
            "vlad": "Vlad",
            "mago_teste": "Mago",
            "spectra": "Spectra",  // Para futuros personagens
            // ... outros personagens
        };
        
        const animationName = characterMapping[characterId] || characterId;
        
        if (CHARACTER_ANIMATIONS[animationName]) {
            console.log(`Usando animações do personagem: ${animationName} (ID: ${characterId})`);
            return animationName;
        }
    }
    
    console.log("Personagem não encontrado, usando Mago como fallback");
    return "Mago";
}

function getCharacterAnimation(animationType) {
    const currentCharacter = getCurrentPlayerCharacter();
    const characterAnimations = CHARACTER_ANIMATIONS[currentCharacter];
    
    if (!characterAnimations || !characterAnimations[animationType]) {
        console.warn(`Animação '${animationType}' não encontrada para personagem '${currentCharacter}', tentando fallback Mago`);
        
        if (CHARACTER_ANIMATIONS["Mago"] && CHARACTER_ANIMATIONS["Mago"][animationType]) {
            return CHARACTER_ANIMATIONS["Mago"][animationType];
        }
        
        console.error(`Animação '${animationType}' não encontrada nem no fallback`);
        return null;
    }
    
    return characterAnimations[animationType];
}

function createAnimatedLayers(animationType, className = '', additionalStyles = {}) {
    const animConfig = getCharacterAnimation(animationType);
    if (!animConfig) {
        console.error(`Configuração de animação não encontrada: ${animationType}`);
        return [];
    }
    
    const currentCharacter = getCurrentPlayerCharacter();
    const layers = [];
    
    // Determinar ordem das camadas baseada no personagem
    let layerOrder;
    if (currentCharacter === "Vlad") {
        layerOrder = ['fx2', 'hairback', 'cape', 'backarm', 'body', 'arms', 'head', 'hair', 'ear', 'robe', 'ombreira', 'hairfront', 'fx1'];
    } else {
        // Fallback para Mago e outros personagens
        layerOrder = ['back_effect', 'body', 'weapon', 'front_effect'];
    }
    
    console.log(`Criando camadas para ${currentCharacter}: ${layerOrder.join(', ')}`);
    
    layerOrder.forEach((layerType, index) => {
        const spritePath = animConfig.layers[layerType];
        if (spritePath) {
            const element = document.createElement('div');
            
            // Converter underscore para hífen no CSS
            const cssLayerType = layerType.replace('_', '-');
            element.className = `character-sprite-layer layer-${cssLayerType} ${animationType}-anim ${className}`.trim();
            
            element.style.cssText = `
                position: absolute;
                top: 0; 
                left: 0;
                width: 100%; 
                height: 100%;
                background-image: url('${spritePath}');
                background-size: auto 100%;
                background-position: 0 0;
                background-repeat: no-repeat;
                pointer-events: none;
                image-rendering: pixelated;
                ${Object.entries(additionalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
            `;
            
            layers.push(element);
            // console.log(`Camada criada: ${layerType} -> ${spritePath}`);
        } else {
            console.warn(`Sprite não encontrado para camada: ${layerType}`);
        }
    });
    
    return layers;
}

function initializeCharacterContainer() {
    const currentCharacter = getCurrentPlayerCharacter();
    updateCharacterContainer(currentCharacter, 'idle');
    
    // Aplicar animação idle inicial
    applyCharacterAnimation('idle');
    
    console.log(`Personagem inicializado: ${currentCharacter}`);
}

function createAnimationKeyframe(animationType, totalWidth) {
    const styleId = `${animationType}-animation-style`;
    if (!document.querySelector(`#${styleId}`)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes ${animationType}-animation {
                from { background-position: 0 0; }
                to { background-position: -${totalWidth}px 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateCharacterContainer(character, animationType = '') {
    const characterContainer = document.getElementById('character');
    if (characterContainer) {
        // Definir atributo data-character
        characterContainer.setAttribute('data-character', character.toLowerCase());
        
        // Definir atributo data-animation se fornecido
        if (animationType) {
            characterContainer.setAttribute('data-animation', animationType);
        }
        
        console.log(`Container atualizado: character=${character}, animation=${animationType}`);
    }
}

// Função para limpar personagem e aplicar animação
function applyCharacterAnimation(animationType, className = '') {
    const currentCharacter = getCurrentPlayerCharacter();
    
    // Atualizar container com atributos data
    updateCharacterContainer(currentCharacter, animationType);
    
    // Preservar canvas PixiJS
    const frontCanvas = character.querySelector('#character-fx-front');
    const backCanvas = character.querySelector('#character-fx-back');
    
    // Remover elementos que não são canvas
    character.querySelectorAll('*:not(#character-fx-front):not(#character-fx-back)').forEach(el => el.remove());
    
    // Criar novas camadas animadas
    const animatedLayers = createAnimatedLayers(animationType, className);
    
    // Adicionar camadas ao personagem
    animatedLayers.forEach(layer => {
        character.appendChild(layer);
    });
    
    // Garantir que os canvas permaneçam
    if (frontCanvas && !character.contains(frontCanvas)) character.appendChild(frontCanvas);
    if (backCanvas && !character.contains(backCanvas)) character.appendChild(backCanvas);
    
    console.log(`Animação aplicada: ${animationType} para personagem ${currentCharacter}`);
    return animatedLayers;
}

function restoreCharacterIdle() {
    console.log('🎭 Restaurando animação idle do personagem');
    
    // Aplicar animação idle usando o novo sistema de personagens
    const currentCharacter = getCurrentPlayerCharacter();
    if (currentCharacter) {
        applyCharacterAnimation('idle');
    } else {
        console.warn('Nenhum personagem encontrado para restaurar idle');
    }
}

// ========================================
// MAPEAMENTO DE COMPATIBILITY
// ========================================

// Para manter compatibilidade com código existente que pode chamar getClassAnimation
if (typeof getClassAnimation === 'undefined') {
    window.getClassAnimation = function(animationType) {
        console.warn('getClassAnimation está deprecated, use getCharacterAnimation');
        return getCharacterAnimation(animationType);
    };
}

// Expor funções globalmente
window.getCurrentPlayerCharacter = getCurrentPlayerCharacter;
window.getCharacterAnimation = getCharacterAnimation;
window.createAnimatedLayers = createAnimatedLayers;
window.applyCharacterAnimation = applyCharacterAnimation;
window.updateCharacterContainer = updateCharacterContainer;  // ← ADICIONADO
window.restoreCharacterIdle = restoreCharacterIdle;          // ← ADICIONADO
window.initializeCharacterContainer = initializeCharacterContainer;
window.CHARACTER_ANIMATIONS = CHARACTER_ANIMATIONS;

// Garanta que as funções usadas no HTML estejam acessíveis no escopo global:
window.initializeCharacterContainer = window.initializeCharacterContainer || initializeCharacterContainer;
window.applyCharacterAnimation = window.applyCharacterAnimation || applyCharacterAnimation;