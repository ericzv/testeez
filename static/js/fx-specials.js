// fx-specials.js - Efeitos de Habilidades Especiais PixiJS
// Versão 1.0

const SPECIAL_EFFECTS = {


    // ========================================
    // 🔥 HABILIDADES ESPECIAIS - BUFFS
    // (Só efeitos no personagem - activate_1 e activate_2)
    // ========================================
    
    // Foco (Genérica)
    "foco_activate_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 30,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 20, max: 50 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#88ccff",
            endColor: "#ffffff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 40,
            gravity: { x: 0, y: -15 },
            turbulence: 10
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.2, saturation: 1.3 },
            overlayType: "radial_aura",
            overlayColor: "#aaddff",
            overlayIntensity: 0.3
        }
    },
    
    "foco_activate_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 20,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 10, max: 30 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#6699cc",
            endColor: "#bbddff",
            startAlpha: 0.3,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 80,
            gravity: { x: 0, y: 5 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.4, saturation: 1.4 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Barreira Arcana (Mago)
    "barreira_arcana_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 35,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 25, max: 60 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.9, max: 1.7 },
            startColor: "#8800ff",
            endColor: "#cc66ff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: -20 },
            turbulence: 15,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.3, saturation: 1.8 },
            overlayType: "radial_magic",
            overlayColor: "#aa44ff",
            overlayIntensity: 0.4
        }
    },

    "barreira_arcana_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 25,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 15, max: 40 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.3, max: 2.4 },
            startColor: "#6600cc",
            endColor: "#9933ff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 90,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.5, saturation: 2.0 },
            blur: { strength: 4, quality: 4 }
        }
    },

    // Canalização Mágica (Mago)
    "canalizacao_magica_activate_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 40,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 30, max: 70 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ff00ff",
            endColor: "#ffffff",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: -18 },
            turbulence: 12,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.4, saturation: 1.9 },
            overlayType: "radial_magic",
            overlayColor: "#dd44dd",
            overlayIntensity: 0.4
        }
    },

    "canalizacao_magica_activate_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 22,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 18, max: 45 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#cc00cc",
            endColor: "#ff88ff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 85,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.6, saturation: 2.1 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Ampliação Mental (Mago)
    "ampliacao_mental_activate_front": {
        type: "combined",
        duration: 1300,
        particles: {
            count: 32,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 20, max: 55 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#00aaff",
            endColor: "#88ddff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 38,
            gravity: { x: 0, y: -12 },
            turbulence: 8
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.2, saturation: 1.6 },
            overlayType: "radial_aura",
            overlayColor: "#66ccff",
            overlayIntensity: 0.3
        }
    },

    "ampliacao_mental_activate_back": {
        type: "filters",
        duration: 1300,
        particles: {
            count: 20,
            lifetime: { min: 1.4, max: 2.1 },
            speed: { min: 12, max: 35 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#0088cc",
            endColor: "#66bbff",
            startAlpha: 0.3,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 6 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.4, saturation: 1.7 },
            blur: { strength: 4, quality: 3 }
        }
    },

    // Bênção Divina (Clérigo)
    "bencao_divina_activate_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 45,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 15, max: 45 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#ffffff",
            endColor: "#ffff88",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: -25 },
            turbulence: 5,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 1.1, saturation: 0.9 },
            overlayType: "radial_divine",
            overlayColor: "#ffffff",
            overlayIntensity: 0.4
        }
    },

    "bencao_divina_activate_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 30,
            lifetime: { min: 1.6, max: 2.4 },
            speed: { min: 8, max: 25 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#ffff99",
            endColor: "#ffffff",
            startAlpha: 0.3,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 95,
            gravity: { x: 0, y: -15 }
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.0, saturation: 0.8 },
            blur: { strength: 5, quality: 4 }
        }
    },

    // Proteção Sagrada (Clérigo)
    "protecao_sagrada_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 38,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 18, max: 50 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#ffdd88",
            endColor: "#ffffff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 46,
            gravity: { x: 0, y: -20 },
            turbulence: 8,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.2, saturation: 1.0 },
            overlayType: "radial_divine",
            overlayColor: "#ffee99",
            overlayIntensity: 0.4
        }
    },

    "protecao_sagrada_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 26,
            lifetime: { min: 1.5, max: 2.2 },
            speed: { min: 10, max: 30 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#ddbb66",
            endColor: "#ffeeaa",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 88,
            gravity: { x: 0, y: -10 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.1, saturation: 1.1 },
            blur: { strength: 4, quality: 4 }
        }
    },

    // Palavra de Poder (Clérigo)
    "palavra_poder_activate_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 42,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 25, max: 65 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#ffff00",
            endColor: "#ffffff",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 44,
            gravity: { x: 0, y: -22 },
            turbulence: 10,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 2.1, contrast: 1.3, saturation: 1.2 },
            overlayType: "radial_divine",
            overlayColor: "#ffff66",
            overlayIntensity: 0.4
        }
    },

    "palavra_poder_activate_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 28,
            lifetime: { min: 1.4, max: 2.1 },
            speed: { min: 12, max: 35 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#dddd00",
            endColor: "#ffff88",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 86,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.2, saturation: 1.3 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Intervenção Divina (Clérigo - Suprema)
    "intervencao_divina_activate_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 70,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 20, max: 80 },
            startScale: { min: 0.1, max: 0.4 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ffffff",
            endColor: "#ffdd00",
            startAlpha: 0.9,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 60,
            gravity: { x: 0, y: -30 },
            turbulence: 3,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 2.8, contrast: 1.4, saturation: 1.0 },
            overlayType: "radial_divine",
            overlayColor: "#ffffff",
            overlayIntensity: 0.7
        }
    },

    "intervencao_divina_activate_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 45,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 5, max: 35 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 1.5, max: 2.8 },
            startColor: "#ffff99",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 120,
            gravity: { x: 0, y: -20 }
        },
        filters: {
            colorMatrix: { brightness: 2.2, contrast: 1.1, saturation: 0.9 },
            blur: { strength: 8, quality: 5 }
        }
    },

    // Sobrecarga Arcana (Arcanista)
    "sobrecarga_arcana_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 48,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 30, max: 80 },
            startScale: { min: 0.2, max: 0.6 },
            endScale: { min: 0.9, max: 1.8 },
            startColor: "#cc00ff",
            endColor: "#ff66ff",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 48,
            gravity: { x: 0, y: -25 },
            turbulence: 20,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.5, saturation: 2.2 },
            overlayType: "radial_magic",
            overlayColor: "#ee44ff",
            overlayIntensity: 0.5
        }
    },

    "sobrecarga_arcana_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 32,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 15, max: 45 },
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 1.3, max: 2.5 },
            startColor: "#9900cc",
            endColor: "#dd44ff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 92,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.7, saturation: 2.4 },
            blur: { strength: 5, quality: 4 }
        }
    },

    // Mente Expandida (Arcanista)
    "mente_expandida_activate_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 35,
            lifetime: { min: 1.1, max: 1.9 },
            speed: { min: 20, max: 60 },
            startScale: { min: 0.1, max: 0.4 },
            endScale: { min: 0.6, max: 1.3 },
            startColor: "#00ccff",
            endColor: "#cc66ff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: -18 },
            turbulence: 15
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.4, saturation: 1.9 },
            overlayType: "radial_aura",
            overlayColor: "#66aaff",
            overlayIntensity: 0.4
        }
    },

    "mente_expandida_activate_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 24,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 10, max: 35 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#0099cc",
            endColor: "#9944ff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 82,
            gravity: { x: 0, y: -8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.6, saturation: 2.0 },
            blur: { strength: 4, quality: 3 }
        }
    },

    // Distorção Temporal (Arcanista)
    "distorcao_temporal_activate_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 40,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 10, max: 50 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#9900ff",
            endColor: "#330066",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: 0 },
            turbulence: 25,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.8, saturation: 2.3 },
            overlayType: "radial_magic",
            overlayColor: "#bb33ff",
            overlayIntensity: 0.5
        }
    },

    "distorcao_temporal_activate_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 5, max: 30 },
            startScale: { min: 0.6, max: 1.1 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#6600bb",
            endColor: "#220044",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 90,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 2.0, saturation: 2.5 },
            blur: { strength: 6, quality: 4 }
        }
    },

    // Arcano Supremo (Arcanista - Suprema)
    "arcano_supremo_activate_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 80,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 20, max: 100 },
            startScale: { min: 0.2, max: 0.8 },
            endScale: { min: 1.0, max: 2.0 },
            startColor: "#ff00ff",
            endColor: "#ffffff",
            startAlpha: 0.9,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: -35 },
            turbulence: 30,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 2.5, contrast: 1.8, saturation: 2.8 },
            overlayType: "radial_magic",
            overlayColor: "#ff44ff",
            overlayIntensity: 0.8
        }
    },

    "arcano_supremo_activate_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 50,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 8, max: 50 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 1.8, max: 3.5 },
            startColor: "#cc00cc",
            endColor: "#ff88ff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 130,
            gravity: { x: 0, y: -20 }
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 2.0, saturation: 3.0 },
            blur: { strength: 8, quality: 5 }
        }
    },

    // Postura de Combate (Ronin)
    "postura_combate_activate_front": {
        type: "combined",
        duration: 1300,
        particles: {
            count: 28,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 25, max: 60 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#ffaa44",
            endColor: "#ffffff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 40,
            gravity: { x: 0, y: -15 },
            turbulence: 12
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.3, saturation: 1.4 },
            overlayType: "radial_glow",
            overlayColor: "#ffcc66",
            overlayIntensity: 0.3
        }
    },

    "postura_combate_activate_back": {
        type: "filters",
        duration: 1300,
        particles: {
            count: 18,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 12, max: 35 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.1 },
            startColor: "#cc8833",
            endColor: "#ffbb77",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 78,
            gravity: { x: 0, y: -8 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 1.5 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Mente Zen (Ronin)
    "mente_zen_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 25,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 15, max: 45 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#88cccc",
            endColor: "#ffffff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 38,
            gravity: { x: 0, y: -20 },
            turbulence: 5
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.1, saturation: 1.2 },
            overlayType: "radial_aura",
            overlayColor: "#aadddd",
            overlayIntensity: 0.3
        }
    },

    "mente_zen_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 16,
            lifetime: { min: 1.5, max: 2.3 },
            speed: { min: 8, max: 25 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#669999",
            endColor: "#bbdddd",
            startAlpha: 0.3,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.3, saturation: 1.3 },
            blur: { strength: 4, quality: 4 }
        }
    },

    // Espírito do Guerreiro (Ronin)
    "espirito_guerreiro_activate_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 32,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 20, max: 55 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ffddaa",
            endColor: "#ffffff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: -18 },
            turbulence: 10
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.2, saturation: 1.3 },
            overlayType: "radial_glow",
            overlayColor: "#ffeedd",
            overlayIntensity: 0.3
        }
    },

    "espirito_guerreiro_activate_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 20,
            lifetime: { min: 1.4, max: 2.1 },
            speed: { min: 10, max: 30 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#ddbb88",
            endColor: "#ffeecc",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 80,
            gravity: { x: 0, y: -10 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.4, saturation: 1.4 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Código Bushido (Samurai)
    "codigo_bushido_activate_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 35,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 22, max: 58 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#ffffff",
            endColor: "#ffdd88",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 44,
            gravity: { x: 0, y: -20 },
            turbulence: 8
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.3, saturation: 1.1 },
            overlayType: "radial_glow",
            overlayColor: "#ffffff",
            overlayIntensity: 0.4
        }
    },

    "codigo_bushido_activate_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 24,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 11, max: 32 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#dddddd",
            endColor: "#ffeeaa",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 84,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.4, saturation: 1.2 },
            blur: { strength: 4, quality: 3 }
        }
    },

    // Concentração Absoluta (Samurai)
    "concentracao_absoluta_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 30,
            lifetime: { min: 1.1, max: 1.9 },
            speed: { min: 18, max: 50 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.5, max: 1.0 },
            startColor: "#ffffcc",
            endColor: "#ffffff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 40,
            gravity: { x: 0, y: -25 },
            turbulence: 3
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.1, saturation: 0.9 },
            overlayType: "radial_aura",
            overlayColor: "#ffffdd",
            overlayIntensity: 0.3
        }
    },

    "concentracao_absoluta_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 20,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 8, max: 28 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#eeeeaa",
            endColor: "#ffffff",
            startAlpha: 0.3,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 76,
            gravity: { x: 0, y: -15 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.2, saturation: 1.0 },
            blur: { strength: 4, quality: 4 }
        }
    },

    // Meditação do Vazio (Samurai)
    "meditacao_vazio_activate_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 12, max: 40 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#333333",
            endColor: "#ffffff",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 38,
            gravity: { x: 0, y: 0 },
            turbulence: 8,
            smoky: true
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 2.0, saturation: 0.5 },
            overlayType: "radial_shadow",
            overlayColor: "#666666",
            overlayIntensity: 0.4
        }
    },

    "meditacao_vazio_activate_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 18,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 6, max: 25 },
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#222222",
            endColor: "#888888",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 72,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 0.8, contrast: 2.5, saturation: 0.3 },
            blur: { strength: 6, quality: 4 }
        }
    },

    // Corte da Realidade (Samurai - Suprema)
    "corte_realidade_activate_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 60,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 15, max: 80 },
            startScale: { min: 0.4, max: 0.9 },
            endScale: { min: 0.05, max: 0.02 },
            startColor: "#ffffff",
            endColor: "#000000",
            startAlpha: 0.9,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 55,
            gravity: { x: 0, y: 0 },
            turbulence: 5
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 3.0, saturation: 0.2 },
            overlayType: "radial_glow",
            overlayColor: "#ffffff",
            overlayIntensity: 0.8
        }
    },

    "corte_realidade_activate_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 35,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 5, max: 40 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#cccccc",
            endColor: "#333333",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 110,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 3.5, saturation: 0.1 },
            blur: { strength: 8, quality: 5 }
        }
    },

    // Veneno Paralisante (Ninja)
    "veneno_paralisante_activate_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 35,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 20, max: 55 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#00ff00",
            endColor: "#666666",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: 15 },
            turbulence: 20
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.6, saturation: 1.9 },
            overlayType: "radial_glow",
            overlayColor: "#44ff44",
            overlayIntensity: 0.4
        }
    },

    "veneno_paralisante_activate_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 22,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 10, max: 32 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#008800",
            endColor: "#444444",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 82,
            gravity: { x: 0, y: 18 }
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.8, saturation: 2.0 },
            blur: { strength: 4, quality: 3 }
        }
    },

    // Arte do Desaparecimento (Ninja)
    "arte_desaparecimento_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 40,
            lifetime: { min: 1.1, max: 1.9 },
            speed: { min: 25, max: 65 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#440044",
            endColor: "#000000",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: 20 },
            turbulence: 30,
            smoky: true
        },
        filters: {
            colorMatrix: { brightness: 0.8, contrast: 1.9, saturation: 1.6 },
            overlayType: "radial_shadow",
            overlayColor: "#660066",
            overlayIntensity: 0.5
        }
    },

    "arte_desaparecimento_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 28,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 12, max: 38 },
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#330033",
            endColor: "#110011",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 88,
            gravity: { x: 0, y: 25 }
        },
        filters: {
            colorMatrix: { brightness: 0.6, contrast: 2.2, saturation: 1.8 },
            blur: { strength: 5, quality: 4 }
        }
    },

    // Preparação de Veneno (Ninja)
    "preparacao_veneno_activate_front": {
        type: "combined",
        duration: 1300,
        particles: {
            count: 32,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 18, max: 48 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#88ff00",
            endColor: "#333333",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 38,
            gravity: { x: 0, y: 12 },
            turbulence: 25
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.7, saturation: 2.1 },
            overlayType: "radial_glow",
            overlayColor: "#66ff33",
            overlayIntensity: 0.3
        }
    },

    "preparacao_veneno_activate_back": {
        type: "filters",
        duration: 1300,
        particles: {
            count: 20,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 8, max: 28 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 0.9, max: 1.7 },
            startColor: "#66cc00",
            endColor: "#222222",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 74,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 1.0, contrast: 1.9, saturation: 2.2 },
            blur: { strength: 3, quality: 3 }
        }
    },

    // Assassinato Perfeito (Ninja - Suprema)
    "assassinato_perfeito_activate_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 70,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 20, max: 90 },
            startScale: { min: 0.4, max: 0.9 },
            endScale: { min: 0.05, max: 0.02 },
            startColor: "#cc00cc",
            endColor: "#000000",
            startAlpha: 0.9,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 58,
            gravity: { x: 0, y: 30 },
            turbulence: 20,
            smoky: true
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 2.5, saturation: 2.0 },
            overlayType: "radial_shadow",
            overlayColor: "#aa00aa",
            overlayIntensity: 0.8
        }
    },

    "assassinato_perfeito_activate_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 42,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 8, max: 50 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#990099",
            endColor: "#220022",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 116,
            gravity: { x: 0, y: 35 }
        },
        filters: {
            colorMatrix: { brightness: 0.9, contrast: 2.8, saturation: 2.2 },
            blur: { strength: 8, quality: 5 }
        }
    },

    // Fúria Guerreira (Guerreiro)
    "furia_guerreira_activate_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 40,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 30, max: 70 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#ff4400",
            endColor: "#ffaa00",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: -12 },
            turbulence: 18,
            sparkle: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.5, saturation: 1.6 },
            overlayType: "radial_glow",
            overlayColor: "#ff6600",
            overlayIntensity: 0.4
        }
    },

    "furia_guerreira_activate_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 26,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 15, max: 40 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.3, max: 2.3 },
            startColor: "#cc3300",
            endColor: "#ff8800",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 86,
            gravity: { x: 0, y: -6 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.7, saturation: 1.7 },
            blur: { strength: 4, quality: 3 }
        }
    },

    // Armadura de Batalha (Guerreiro)
    "armadura_batalha_activate_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 35,
            lifetime: { min: 1.1, max: 1.9 },
            speed: { min: 20, max: 55 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#cccccc",
            endColor: "#ffffff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: -15 },
            turbulence: 10
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.3, saturation: 0.8 },
            overlayType: "radial_glow",
            overlayColor: "#dddddd",
            overlayIntensity: 0.3
        }
    },

    "armadura_batalha_activate_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 22,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 10, max: 32 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 1.4, max: 2.4 },
            startColor: "#aaaaaa",
            endColor: "#eeeeee",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 80,
            gravity: { x: 0, y: -8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.4, saturation: 0.9 },
            blur: { strength: 3, quality: 3 }
        }
    }

};


window.SPECIAL_EFFECTS = SPECIAL_EFFECTS;