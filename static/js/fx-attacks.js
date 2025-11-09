// fx-attacks.js - Efeitos de Ataques PixiJS Renovados
// Versão 2.0 - MÁXIMA DIFERENCIAÇÃO VISUAL

const ATTACK_EFFECTS = {
    // ========================================
    // 🌟 HABILIDADES GENÉRICAS - ATAQUES
    // ========================================
    
    // Ataque Básico - Efeito neutro com faíscas
    "ataque_basico_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 32,
            lifetime: { min: 0.9, max: 1.5 },
            speed: { min: 45, max: 85 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.6, max: 1.1 },
            startColor: "#ffffff",
            endColor: "#cccccc",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 28,
            gravity: { x: 0, y: -12 },
            turbulence: 18,
            spark: true
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.2, saturation: 0.9 },
            overlayType: "radial_glow",
            overlayColor: "#dddddd",
            overlayIntensity: 0.15,
            animated: { fadeAlpha: true }
        }
    },
    
    "ataque_basico_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 18,
            lifetime: { min: 1.2, max: 1.8 },
            speed: { min: 22, max: 45 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.4 },
            startColor: "#eeeeee",
            endColor: "#aaaaaa",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 55,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.4, saturation: 0.8 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Sobrecarga de Energia - Efeito elétrico intenso
    "sobrecarga_energia_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 45,
            lifetime: { min: 0.8, max: 1.4 },
            speed: { min: 75, max: 135 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.5, max: 1.2 },
            startColor: "#00ffff",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 35,
            gravity: { x: 0, y: -25 },
            turbulence: 45,
            electric: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.3, saturation: 1.6 },
            overlayType: "radial_electric",
            overlayColor: "#44ffff",
            overlayIntensity: 0.25,
            animated: { pulseBrightness: true, fadeAlpha: true }
        }
    },
    
    "sobrecarga_energia_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 65 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#0088dd",
            endColor: "#66ccff",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.7, saturation: 1.8 },
            blur: { strength: 1.0, quality: 4 }
        }
    },

    // Projétil Arcano - Partículas mágicas girando
    "projetil_arcano_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 38,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 100, max: 150 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#8800ff",
            endColor: "#cc66ff",
            startAlpha: 0.2,
            endAlpha: 0.6,
            emitterType: "circle",
            radius: 52,
            gravity: { x: 0, y: -18 },
            turbulence: 12,
            magical: true,
            rotation: { min: 0, max: 360 }
        },
        filters: {
            colorMatrix: { brightness: 1.0, contrast: 1.0, saturation: 1.2 },
            overlayType: "radial_magic",
            overlayColor: "#aa44ff",
            overlayIntensity: 0.1,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "projetil_arcano_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 22,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 18, max: 42 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#6600bb",
            endColor: "#9944ff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 5 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.6, saturation: 2.2 },
            blur: { strength: 0.9, quality: 4 }
        }
    },

    // Explosão Arcana - Efeito explosivo com runas
    "explosao_arcana_front": {
        type: "combined",
        duration: 1600,
        particles: {
            count: 65,
            lifetime: { min: 0.9, max: 1.6 },
            speed: { min: 85, max: 165 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 1.0, max: 2.2 },
            startColor: "#ff00aa",
            endColor: "#8800ff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 40,
            gravity: { x: 0, y: -8 },
            turbulence: 55,
            arcane: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.5, saturation: 2.3 },
            overlayType: "arcane_runes",
            overlayColor: "#dd22aa",
            overlayIntensity: 0.35,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "explosao_arcana_back": {
        type: "filters",
        duration: 1600,
        particles: {
            count: 32,
            lifetime: { min: 1.5, max: 2.3 },
            speed: { min: 42, max: 82 },
            startScale: { min: 0.5, max: 1.0 },
            endScale: { min: 1.4, max: 2.8 },
            startColor: "#aa0088",
            endColor: "#6600cc",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 88,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.8, saturation: 2.5 },
            blur: { strength: 1.1, quality: 4 }
        }
    },

    // Raio Elemental - Efeito linear elétrico
    "raio_elemental_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 42,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 120, max: 200 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.6, max: 1.4 },
            startColor: "#ffff00",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 20,
            gravity: { x: 0, y: -35 },
            turbulence: 25,
            electric: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.4, saturation: 1.5 },
            overlayType: "linear_vertical",
            overlayColor: "#ffff44",
            overlayIntensity: 0.3,
            animated: { pulseBrightness: true, fadeAlpha: true }
        }
    },
    
    "raio_elemental_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 25,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 55, max: 95 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#dddd00",
            endColor: "#ffff66",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: 18 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.6, saturation: 1.4 },
            blur: { strength: 0.7, quality: 3 }
        }
    },

    // Martelo Divino - Impacto celestial
    "martelo_divino_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 40,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 55, max: 105 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.9, max: 1.8 },
            startColor: "#ffffff",
            endColor: "#ffff88",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 30,
            gravity: { x: 0, y: -20 },
            turbulence: 8,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.2, saturation: 1.0 },
            overlayType: "cross_divine",
            overlayColor: "#ffffff",
            overlayIntensity: 0.35,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "martelo_divino_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 24,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 28, max: 58 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#ffff99",
            endColor: "#ffffff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 72,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.1, saturation: 0.9 },
            blur: { strength: 0.6, quality: 4 }
        }
    },
    
    // Julgamento Celestial - Raios divinos descendentes
    "julgamento_celestial_front": {
        type: "combined",
        duration: 1600,
        particles: {
            count: 55,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 40, max: 90 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ffffff",
            endColor: "#ffdd00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 38,
            gravity: { x: 0, y: -28 },
            turbulence: 5,
            cross: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.3, saturation: 1.2 },
            overlayType: "radial_divine",
            overlayColor: "#ffff99",
            overlayIntensity: 0.4,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "julgamento_celestial_back": {
        type: "filters",
        duration: 1600,
        particles: {
            count: 30,
            lifetime: { min: 1.5, max: 2.4 },
            speed: { min: 18, max: 45 },
            startScale: { min: 0.6, max: 1.1 },
            endScale: { min: 1.4, max: 2.6 },
            startColor: "#ffee88",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 85,
            gravity: { x: 0, y: 2 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.4, saturation: 1.4 },
            blur: { strength: 0.8, quality: 4 }
        }
    },

    // Ataque Frenético - Velocidade furiosa
    "ataque_frenetico_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 70,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 100, max: 180 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.9, max: 1.8 },
            startColor: "#FF4500",
            endColor: "#FF0000",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 25,
            gravity: { x: 0, y: 0 },
            turbulence: 65,
            spark: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.7, saturation: 2.0 },
            overlayType: "fan_burst",
            overlayColor: "#FF2200",
            overlayIntensity: 0.4,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "ataque_frenetico_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 42,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 48, max: 88 },
            startScale: { min: 0.6, max: 1.1 },
            endScale: { min: 1.3, max: 2.4 },
            startColor: "#CC1100",
            endColor: "#FF3300",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 5 }
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.9, saturation: 2.1 },
            blur: { strength: 0.9, quality: 3 }
        }
    },

    // Golpe Sangrento - Efeito de sangue
    "golpe_sangrento_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 50,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#8B0000",
            endColor: "#FF6347",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 35,
            gravity: { x: 0, y: -5 },
            turbulence: 32,
            liquid: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.5, saturation: 1.9 },
            overlayType: "radial_glow",
            overlayColor: "#CC0000",
            overlayIntensity: 0.35,
            animated: { pulseBrightness: true, fadeAlpha: true }
        }
    },
    
    "golpe_sangrento_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 32,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 68 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 1.4, max: 2.5 },
            startColor: "#660000",
            endColor: "#DC143C",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 78,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.7, saturation: 2.0 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Devastação Primordial - Ultimate berserker
    "devastacao_primordial_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 120,
            lifetime: { min: 1.2, max: 2.2 },
            speed: { min: 30, max: 120 },
            startScale: { min: 0.4, max: 1.0 },
            endScale: { min: 1.5, max: 3.5 },
            startColor: "#FF0000",
            endColor: "#000000",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 65,
            gravity: { x: 0, y: 15 },
            turbulence: 80,
            explosive: true
        },
        filters: {
            colorMatrix: { brightness: 2.2, contrast: 2.0, saturation: 2.5 },
            overlayType: "spiral_outward",
            overlayColor: "#FF0000",
            overlayIntensity: 0.4,
            animated: { growScale: true, fadeAlpha: true }
        }
    },
    
    "devastacao_primordial_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 70,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 15, max: 60 },
            startScale: { min: 1.0, max: 1.8 },
            endScale: { min: 2.2, max: 4.2 },
            startColor: "#990000",
            endColor: "#330000",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 140,
            gravity: { x: 0, y: 20 }
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 2.5, saturation: 2.8 },
            blur: { strength: 1.2, quality: 5 }
        }
    },

    // Mordida Mortal - Ataque feroz
    "mordida_mortal_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 48,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 80, max: 140 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.9, max: 1.8 },
            startColor: "#8B4513",
            endColor: "#DC143C",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 28,
            gravity: { x: 0, y: -2 },
            turbulence: 38,
            triangular: true
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.4, saturation: 1.7 },
            overlayType: "triangle_sharp",
            overlayColor: "#CD853F",
            overlayIntensity: 0.3,
            animated: { stabIntensity: true, fadeAlpha: true }
        }
    },
    
    "mordida_mortal_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 30,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 38, max: 72 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#654321",
            endColor: "#B22222",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.6, saturation: 1.8 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Ataque Feral - Selvageria pura
    "ataque_feral_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 55,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 95, max: 165 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#2F4F2F",
            endColor: "#8B4513",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 22,
            gravity: { x: 0, y: -12 },
            turbulence: 50,
            metallic: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.5, saturation: 1.6 },
            overlayType: "x_explosion",
            overlayColor: "#556B2F",
            overlayIntensity: 0.35,
            animated: { expandSpeed: true, fadeAlpha: true }
        }
    },
    
    "ataque_feral_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 34,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 45, max: 82 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#1C3A1C",
            endColor: "#654321",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 64,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.7, saturation: 1.7 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Frenesi Lunar - Ultimate lobisomem
    "frenesi_lunar_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 95,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 25, max: 100 },
            startScale: { min: 0.3, max: 0.8 },
            endScale: { min: 1.4, max: 2.8 },
            startColor: "#C0C0C0",
            endColor: "#8B4513",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 60,
            gravity: { x: 0, y: -30 },
            turbulence: 25,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.6, saturation: 1.9 },
            overlayType: "holy_aura",
            overlayColor: "#D3D3D3",
            overlayIntensity: 0.4,
            animated: { holyFloat: true, fadeAlpha: true }
        }
    },
    
    "frenesi_lunar_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 58,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 12, max: 50 },
            startScale: { min: 0.8, max: 1.4 },
            endScale: { min: 1.9, max: 3.6 },
            startColor: "#A0A0A0",
            endColor: "#654321",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 130,
            gravity: { x: 0, y: -18 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.9, saturation: 2.0 },
            blur: { strength: 1.1, quality: 5 }
        }
    },

    // Golpe nas Sombras - Ataque sorrateiro
    "golpe_nas_sombras_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 36,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 65, max: 125 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#2F2F2F",
            endColor: "#696969",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 25,
            gravity: { x: 0, y: 18 },
            turbulence: 35,
            smoky: true
        },
        filters: {
            colorMatrix: { brightness: 0.6, contrast: 1.6, saturation: 1.2 },
            overlayType: "linear_diagonal",
            overlayColor: "#555555",
            overlayIntensity: 0.25,
            animated: { linearPulse: true, fadeAlpha: true }
        }
    },
    
    "golpe_nas_sombras_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 22,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 32, max: 62 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 0.9, max: 1.7 },
            startColor: "#1C1C1C",
            endColor: "#555555",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 60,
            gravity: { x: 0, y: 22 }
        },
        filters: {
            colorMatrix: { brightness: 0.4, contrast: 1.8, saturation: 1.3 },
            blur: { strength: 0.7, quality: 2 }
        }
    },

    // Apunhalada Traiçoeira - Golpe rápido e preciso
    "apunhalada_traiceira_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 32,
            lifetime: { min: 0.5, max: 1.1 },
            speed: { min: 85, max: 145 },
            startScale: { min: 0.3, max: 0.5 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#8B0000",
            endColor: "#2F2F2F",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 20,
            gravity: { x: 0, y: 12 },
            turbulence: 32,
            triangular: true
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.5, saturation: 1.5 },
            overlayType: "spiral_inward",
            overlayColor: "#666666",
            overlayIntensity: 0.25,
            animated: { spiralInward: true, fadeAlpha: true }
        }
    },
    
    "apunhalada_traiceira_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 20,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 40, max: 72 },
            startScale: { min: 0.5, max: 0.8 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#660000",
            endColor: "#1C1C1C",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 52,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 0.8, contrast: 1.7, saturation: 1.6 },
            blur: { strength: 0.6, quality: 2 }
        }
    },

    // Golpe Preciso - Técnica refinada
    "golpe_preciso_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 34,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#4169E1",
            endColor: "#87CEEB",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 22,
            gravity: { x: 0, y: -12 },
            turbulence: 20,
            crystalline: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.3, saturation: 1.6 },
            overlayType: "star_6",
            overlayColor: "#6495ED",
            overlayIntensity: 0.25,
            animated: { starTwinkle: true, fadeAlpha: true }
        }
    },
    
    "golpe_preciso_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 22,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 35, max: 68 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 0.9, max: 1.7 },
            startColor: "#191970",
            endColor: "#778899",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 56,
            gravity: { x: 0, y: -6 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 1.7 },
            blur: { strength: 0.5, quality: 3 }
        }
    },

    // Ataque Vital - Golpe crítico
    "ataque_vital_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 40,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 68, max: 128 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#FF6347",
            endColor: "#4169E1",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 28,
            gravity: { x: 0, y: -8 },
            turbulence: 28,
            cross: true
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.4, saturation: 1.7 },
            overlayType: "cross_divine",
            overlayColor: "#FF7F50",
            overlayIntensity: 0.3,
            animated: { crossGlow: true, fadeAlpha: true }
        }
    },
    
    "ataque_vital_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 26,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 34, max: 66 },
            startScale: { min: 0.5, max: 0.8 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#CD5C5C",
            endColor: "#191970",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 64,
            gravity: { x: 0, y: -4 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.6, saturation: 1.8 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Punhal Oculto - Ataque das sombras
    "punhal_oculto_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 28,
            lifetime: { min: 0.5, max: 1.1 },
            speed: { min: 90, max: 150 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#2F4F4F",
            endColor: "#87CEEB",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 18,
            gravity: { x: 0, y: 15 },
            turbulence: 40,
            smoky: true
        },
        filters: {
            colorMatrix: { brightness: 0.9, contrast: 1.7, saturation: 1.4 },
            overlayType: "fractal_simple",
            overlayColor: "#555555",
            overlayIntensity: 0.25,
            animated: { fractalPulse: true, fadeAlpha: true }
        }
    },
    
    "punhal_oculto_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 18,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 42, max: 75 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#1C1C1C",
            endColor: "#708090",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 48,
            gravity: { x: 0, y: 18 }
        },
        filters: {
            colorMatrix: { brightness: 0.6, contrast: 1.9, saturation: 1.5 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Golpe do Mestre - Ultimate ladrão
    "golpe_mestre_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 85,
            lifetime: { min: 1.3, max: 2.2 },
            speed: { min: 30, max: 95 },
            startScale: { min: 0.2, max: 0.6 },
            endScale: { min: 1.0, max: 2.2 },
            startColor: "#FFD700",
            endColor: "#4169E1",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 55,
            gravity: { x: 0, y: -25 },
            turbulence: 15,
            arcane: true
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 1.5, saturation: 2.0 },
            overlayType: "magic_portal",
            overlayColor: "#DAA520",
            overlayIntensity: 0.4,
            animated: { portalSpin: true, fadeAlpha: true }
        }
    },
    
    "golpe_mestre_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 52,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 15, max: 48 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 1.5, max: 2.8 },
            startColor: "#B8860B",
            endColor: "#191970",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 120,
            gravity: { x: 0, y: -15 }
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.6, saturation: 2.1 },
            blur: { strength: 1.0, quality: 5 }
        }
    },

    // Garras Sangrentas - Ataque visceral
    "garras_sangrentas_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 42,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 65, max: 125 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#8B0000",
            endColor: "#FF4500",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 30,
            gravity: { x: 0, y: 10 },
            turbulence: 32,
            triangular: true
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.6, saturation: 1.9 },
            overlayType: "star_4",
            overlayColor: "#CC0000",
            overlayIntensity: 0.3,
            animated: { starTwinkle: true, fadeAlpha: true }
        }
    },
    
    "garras_sangrentas_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 32, max: 64 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#660000",
            endColor: "#DC143C",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.8, saturation: 2.0 },
            blur: { strength: 0.7, quality: 3 }
        }
    },
    
    // Abraço da Escuridão - Envolvimento sombrio
    "abraco_escuridao_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 50,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 45, max: 95 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#4B0082",
            endColor: "#000000",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 34,
            gravity: { x: 0, y: 20 },
            turbulence: 28,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 0.8, contrast: 1.9, saturation: 1.7 },
            overlayType: "spiral_inward",
            overlayColor: "#663399",
            overlayIntensity: 0.35,
            animated: { spiralInward: true, fadeAlpha: true }
        }
    },
    
    "abraco_escuridao_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 32,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 22, max: 52 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#2E0040",
            endColor: "#1C1C1C",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 76,
            gravity: { x: 0, y: 25 }
        },
        filters: {
            colorMatrix: { brightness: 0.5, contrast: 2.2, saturation: 1.8 },
            blur: { strength: 1.0, quality: 4 }
        }
    },

    // Beijo da Morte - Ultimate vampiro
    "beijo_morte_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 80,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 18, max: 78 },
            startScale: { min: 0.3, max: 0.8 },
            endScale: { min: 1.2, max: 2.4 },
            startColor: "#8B0000",
            endColor: "#4B0082",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: 18 },
            turbulence: 18,
            liquid: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 2.0, saturation: 2.2 },
            overlayType: "radial_aura",
            overlayColor: "#990033",
            overlayIntensity: 0.4,
            animated: { etherealFloat: true, fadeAlpha: true }
        }
    },
    
    "beijo_morte_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 48,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 8, max: 40 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 1.8, max: 3.2 },
            startColor: "#660000",
            endColor: "#2E0040",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 110,
            gravity: { x: 0, y: 20 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 2.3, saturation: 2.4 },
            blur: { strength: 1.1, quality: 5 }
        }
    },

    // Fúria Selvagem - Berserker attack
    "furia_selvagem_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 58,
            lifetime: { min: 0.8, max: 1.4 },
            speed: { min: 70, max: 140 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 1.0, max: 2.0 },
            startColor: "#ff0000",
            endColor: "#ffaa00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 32,
            gravity: { x: 0, y: -10 },
            turbulence: 45,
            explosive: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.5, saturation: 1.9 },
            overlayType: "explosion_irregular",
            overlayColor: "#ff4400",
            overlayIntensity: 0.35,
            animated: { irregularExplosion: true, fadeAlpha: true }
        }
    },
    
    "furia_selvagem_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 36,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 1.3, max: 2.4 },
            startColor: "#cc0000",
            endColor: "#ff6600",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.7, saturation: 2.0 },
            blur: { strength: 0.9, quality: 3 }
        }
    },

    // Garra Bestial - Lobisomem attack
    "garra_bestial_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 45,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 75, max: 135 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#8B4513",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 26,
            gravity: { x: 0, y: -12 },
            turbulence: 38,
            triangular: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.3, saturation: 1.4 },
            overlayType: "triangle_sharp",
            overlayColor: "#CD853F",
            overlayIntensity: 0.25,
            animated: { triangleStab: true, fadeAlpha: true }
        }
    },
    
    "garra_bestial_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 28,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 38, max: 75 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#654321",
            endColor: "#D2B48C",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 1.5 },
            blur: { strength: 0.7, quality: 3 }
        }
    },

    // Chama Purificadora - Fogo sagrado
    "chama_purificadora_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 52,
            lifetime: { min: 0.7, max: 1.4 },
            speed: { min: 55, max: 115 },
            startScale: { min: 0.3, max: 0.5 },
            endScale: { min: 0.8, max: 1.7 },
            startColor: "#ffff88",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 34,
            gravity: { x: 0, y: -25 },
            turbulence: 18,
            fiery: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.2, saturation: 1.4 },
            overlayType: "cross_divine",
            overlayColor: "#ffff99",
            overlayIntensity: 0.3,
            animated: { crossGlow: true, fadeAlpha: true }
        }
    },
    
    "chama_purificadora_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 32,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 28, max: 58 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 2.0 },
            startColor: "#ffdd44",
            endColor: "#ffff88",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.3, saturation: 1.5 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Apoteose Divina - Ultimate divino
    "apoteose_divina_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 95,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 30, max: 100 },
            startScale: { min: 0.2, max: 0.6 },
            endScale: { min: 1.2, max: 2.5 },
            startColor: "#ffffff",
            endColor: "#ffdd00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: -35 },
            turbulence: 5,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 2.5, contrast: 1.5, saturation: 1.3 },
            overlayType: "radial_divine",
            overlayColor: "#ffffff",
            overlayIntensity: 0.4,
            animated: { divineRadiance: true, fadeAlpha: true }
        }
    },
    
    "apoteose_divina_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 48,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 15, max: 50 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 1.7, max: 3.5 },
            startColor: "#ffff99",
            endColor: "#ffffff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 100,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 1.2, saturation: 1.1 },
            blur: { strength: 1.1, quality: 5 }
        }
    },

    // Corte Preciso - Ronin ataque
    "corte_preciso_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 28,
            lifetime: { min: 0.5, max: 1.0 },
            speed: { min: 80, max: 140 },
            startScale: { min: 0.2, max: 0.3 },
            endScale: { min: 0.6, max: 1.2 },
            startColor: "#dddddd",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 18,
            gravity: { x: 0, y: -15 },
            turbulence: 15,
            crystalline: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.3, saturation: 0.9 },
            overlayType: "linear_diagonal",
            overlayColor: "#ffffff",
            overlayIntensity: 0.25,
            animated: { linearPulse: true, fadeAlpha: true }
        }
    },
    
    "corte_preciso_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 16,
            lifetime: { min: 0.9, max: 1.6 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.8, max: 1.5 },
            startColor: "#cccccc",
            endColor: "#eeeeee",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 0.8 },
            blur: { strength: 0.4, quality: 2 }
        }
    },

    // Lâmina de Vento - Ronin especial
    "lamina_vento_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 38,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 85, max: 155 },
            startScale: { min: 0.1, max: 0.2 },
            endScale: { min: 0.5, max: 1.1 },
            startColor: "#ccffcc",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 26,
            gravity: { x: 0, y: -20 },
            turbulence: 25,
            wind: true
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.2, saturation: 1.3 },
            overlayType: "waves_concentric",
            overlayColor: "#ddffdd",
            overlayIntensity: 0.25,
            animated: { concentricWaves: true, fadeAlpha: true }
        }
    },
    
    "lamina_vento_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 22,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 42, max: 78 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.9, max: 1.7 },
            startColor: "#aaddaa",
            endColor: "#ddffdd",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 55,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 1.3, saturation: 1.4 },
            blur: { strength: 0.5, quality: 3 }
        }
    },

    // Golpe Ascendente - Ronin finalizador
    "golpe_ascendente_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 34,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 70, max: 120 },
            startScale: { min: 0.3, max: 0.5 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ffddaa",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 22,
            gravity: { x: 0, y: -30 },
            turbulence: 12,
            spark: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.1, saturation: 1.2 },
            overlayType: "star_6",
            overlayColor: "#ffeecc",
            overlayIntensity: 0.25,
            animated: { starTwinkle: true, fadeAlpha: true }
        }
    },
    
    "golpe_ascendente_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 20,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 35, max: 62 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#ddbb88",
            endColor: "#ffeecc",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.2, saturation: 1.3 },
            blur: { strength: 0.4, quality: 3 }
        }
    },

    // Corte do Vazio - Samurai ataque
    "corte_vazio_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 44,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 65, max: 115 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.7, max: 1.5 },
            startColor: "#330033",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 30,
            gravity: { x: 0, y: -15 },
            turbulence: 22,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.7, saturation: 1.6 },
            overlayType: "spiral_inward",
            overlayColor: "#666666",
            overlayIntensity: 0.3,
            animated: { spiralInward: true, fadeAlpha: true }
        }
    },
    
    "corte_vazio_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 32, max: 62 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.1 },
            startColor: "#220022",
            endColor: "#444444",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 0.6, contrast: 1.9, saturation: 1.9 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Corte do Dragão - Samurai especial
    "corte_dragao_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 55,
            lifetime: { min: 0.8, max: 1.4 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 0.9, max: 1.9 },
            startColor: "#ff4400",
            endColor: "#ffdd00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 33,
            gravity: { x: 0, y: -22 },
            turbulence: 18,
            fiery: true
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.4, saturation: 1.8 },
            overlayType: "explosion_irregular",
            overlayColor: "#ff6600",
            overlayIntensity: 0.3,
            animated: { irregularExplosion: true, fadeAlpha: true }
        }
    },
    
    "corte_dragao_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 34,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.3 },
            startColor: "#cc3300",
            endColor: "#ffaa00",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 70,
            gravity: { x: 0, y: 18 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.6, saturation: 1.9 },
            blur: { strength: 0.7, quality: 4 }
        }
    },

    // Dança das Lâminas - Samurai múltiplo
    "danca_laminas_front": {
        type: "combined",
        duration: 1600,
        particles: {
            count: 68,
            lifetime: { min: 0.9, max: 1.5 },
            speed: { min: 55, max: 105 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.6, max: 1.3 },
            startColor: "#ffffff",
            endColor: "#dddddd",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 35,
            gravity: { x: 0, y: -18 },
            turbulence: 30,
            metallic: true
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.3, saturation: 1.0 },
            overlayType: "fan_burst",
            overlayColor: "#ffffff",
            overlayIntensity: 0.3,
            animated: { fanExpansion: true, fadeAlpha: true }
        }
    },
    
    "danca_laminas_back": {
        type: "filters",
        duration: 1600,
        particles: {
            count: 40,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 28, max: 58 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#dddddd",
            endColor: "#ffffff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 0.9 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Caminho do Vazio Absoluto - Samurai ultimate
    "caminho_vazio_absoluto_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 105,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 30, max: 95 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#000000",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: 0 },
            turbulence: 8,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 2.3, saturation: 0.6 },
            overlayType: "waves_concentric",
            overlayColor: "#333333",
            overlayIntensity: 0.4,
            animated: { concentricWaves: true, fadeAlpha: true }
        }
    },
    
    "caminho_vazio_absoluto_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 52,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 15, max: 50 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#111111",
            endColor: "#666666",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 105,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.0, contrast: 2.8, saturation: 0.4 },
            blur: { strength: 1.2, quality: 5 }
        }
    },

    // Golpe das Sombras - Ninja ataque
    "golpe_sombras_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 40,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 60, max: 110 },
            startScale: { min: 0.3, max: 0.5 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#440044",
            endColor: "#110011",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 26,
            gravity: { x: 0, y: 20 },
            turbulence: 22,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 0.5, contrast: 1.7, saturation: 1.7 },
            overlayType: "linear_horizontal",
            overlayColor: "#660066",
            overlayIntensity: 0.3,
            animated: { linearPulse: true, fadeAlpha: true }
        }
    },
    
    "golpe_sombras_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 24,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 30, max: 60 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#330033",
            endColor: "#000000",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 58,
            gravity: { x: 0, y: 25 }
        },
        filters: {
            colorMatrix: { brightness: 0.3, contrast: 1.9, saturation: 1.9 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Lâmina Envenenada - Ninja especial
    "lamina_envenenada_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 45,
            lifetime: { min: 0.8, max: 1.4 },
            speed: { min: 55, max: 105 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.7, max: 1.5 },
            startColor: "#00ff00",
            endColor: "#666666",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 28,
            gravity: { x: 0, y: -12 },
            turbulence: 26,
            toxic: true
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.5, saturation: 2.0 },
            overlayType: "geometric_pattern",
            overlayColor: "#44ff44",
            overlayIntensity: 0.25,
            animated: { geometricRotation: true, fadeAlpha: true }
        }
    },
    
    "lamina_envenenada_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 28,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 28, max: 55 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#008800",
            endColor: "#444444",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 62,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 0.9, contrast: 1.7, saturation: 2.1 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Técnica do Assassino - Ninja finalizador
    "tecnica_assassino_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 50,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.6, max: 1.3 },
            startColor: "#880088",
            endColor: "#000000",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 30,
            gravity: { x: 0, y: 15 },
            turbulence: 35,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 1.0, contrast: 1.9, saturation: 1.9 },
            overlayType: "cherry_petals",
            overlayColor: "#aa00aa",
            overlayIntensity: 0.3,
            animated: { petalFall: true, fadeAlpha: true }
        }
    },
    
    "tecnica_assassino_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 34,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#660066",
            endColor: "#220022",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 20 }
        },
        filters: {
            colorMatrix: { brightness: 0.6, contrast: 2.1, saturation: 2.1 },
            blur: { strength: 0.9, quality: 4 }
        }
    },

    // Execução nas Sombras - Ninja ultimate
    "execucao_sombras_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 90,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 25, max: 85 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.05, max: 0.02 },
            startColor: "#cc00cc",
            endColor: "#000000",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 52,
            gravity: { x: 0, y: 35 },
            turbulence: 15,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 1.1, contrast: 2.3, saturation: 2.1 },
            overlayType: "cherry_petals",
            overlayColor: "#aa00aa",
            overlayIntensity: 0.4,
            animated: { petalFall: true, fadeAlpha: true }
        }
    },
    
    "execucao_sombras_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 48,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 5, max: 40 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#990099",
            endColor: "#220022",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 116,
            gravity: { x: 0, y: 40 }
        },
        filters: {
            colorMatrix: { brightness: 0.7, contrast: 2.6, saturation: 2.3 },
            blur: { strength: 1.2, quality: 5 }
        }
    },

    // ========================================
    // ⚔️ GUERREIRO - ATAQUES
    // ========================================
    
    // Golpe Devastador - Ataque poderoso com impacto
    "golpe_devastador_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 52,
            lifetime: { min: 0.9, max: 1.6 },
            speed: { min: 85, max: 155 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.2, max: 2.4 },
            startColor: "#ffaa00",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 35,
            gravity: { x: 0, y: -15 },
            turbulence: 20,
            metallic: true
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.4, saturation: 1.5 },
            overlayType: "star_4",
            overlayColor: "#ffcc44",
            overlayIntensity: 0.35,
            animated: { starTwinkle: true, fadeAlpha: true }
        }
    },
    
    "golpe_devastador_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 32,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 1.5, max: 2.6 },
            startColor: "#cc8800",
            endColor: "#ffbb44",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 70,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.6, saturation: 1.6 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Giro Mortal - Ataque circular com velocidade
    "giro_mortal_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 65,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 120, max: 200 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.0, max: 2.0 },
            startColor: "#ffffff",
            endColor: "#ffcccc",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 40,
            gravity: { x: 0, y: -10 },
            turbulence: 40,
            wind: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.3, saturation: 1.2 },
            overlayType: "spiral_outward",
            overlayColor: "#ffffff",
            overlayIntensity: 0.3,
            animated: { spiralOutward: true, fadeAlpha: true }
        }
    },
    
    "giro_mortal_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 38,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 40, max: 80 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.3, max: 2.4 },
            startColor: "#dddddd",
            endColor: "#ffdddd",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 80,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.5, saturation: 1.1 },
            blur: { strength: 0.9, quality: 4 }
        }
    },

    // Golpe Impiedoso - Ataque cruel com força
    "golpe_impiedoso_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 48,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 90, max: 170 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 1.1, max: 2.1 },
            startColor: "#ff6666",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 30,
            gravity: { x: 0, y: -12 },
            turbulence: 25,
            explosive: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.5, saturation: 1.4 },
            overlayType: "x_explosion",
            overlayColor: "#ff8888",
            overlayIntensity: 0.3,
            animated: { expandSpeed: true, fadeAlpha: true }
        }
    },
    
    "golpe_impiedoso_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 28,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 45, max: 85 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.4, max: 2.5 },
            startColor: "#cc4444",
            endColor: "#ffaaaa",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.7, saturation: 1.5 },
            blur: { strength: 0.7, quality: 3 }
        }
    },

    // ========================================
    // 🔥 CLÉRIGO - ATAQUES DIVINOS
    // ========================================
    
    // Chama Purificadora - Fogo sagrado que purifica
    "chama_purificadora_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 58,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 65, max: 125 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.0, max: 2.0 },
            startColor: "#ffff88",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 34,
            gravity: { x: 0, y: -25 },
            turbulence: 18,
            fiery: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.2, saturation: 1.4 },
            overlayType: "cross_divine",
            overlayColor: "#ffff99",
            overlayIntensity: 0.3,
            animated: { crossGlow: true, fadeAlpha: true }
        }
    },
    
    "chama_purificadora_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 34,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 28, max: 58 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.2, max: 2.3 },
            startColor: "#ffdd44",
            endColor: "#ffff88",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 68,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.3, saturation: 1.5 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Apoteose Divina - Ultimate clérigo com poder celestial máximo
    "apoteose_divina_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 105,
            lifetime: { min: 1.3, max: 2.3 },
            speed: { min: 30, max: 100 },
            startScale: { min: 0.2, max: 0.6 },
            endScale: { min: 1.2, max: 2.5 },
            startColor: "#ffffff",
            endColor: "#ffdd00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: -35 },
            turbulence: 5,
            heavenly: true
        },
        filters: {
            colorMatrix: { brightness: 2.5, contrast: 1.5, saturation: 1.3 },
            overlayType: "radial_divine",
            overlayColor: "#ffffff",
            overlayIntensity: 0.4,
            animated: { divineRadiance: true, fadeAlpha: true }
        }
    },
    
    "apoteose_divina_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 55,
            lifetime: { min: 1.6, max: 2.6 },
            speed: { min: 15, max: 50 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 1.7, max: 3.5 },
            startColor: "#ffff99",
            endColor: "#ffffff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 100,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 1.2, saturation: 1.1 },
            blur: { strength: 1.1, quality: 5 }
        }
    },

    // ========================================
    // 🌟 ARCANISTA - ATAQUES ARCANOS
    // ========================================
    
    // Fissão Arcana - Divisão da energia mágica
    "fissao_arcana_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 52,
            lifetime: { min: 0.9, max: 1.6 },
            speed: { min: 80, max: 150 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 1.0, max: 2.2 },
            startColor: "#cc00ff",
            endColor: "#ff66ff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "burst",
            radius: 32,
            gravity: { x: 0, y: -15 },
            turbulence: 35,
            arcane: true
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 1.5, saturation: 2.0 },
            overlayType: "fractal_simple",
            overlayColor: "#dd44ff",
            overlayIntensity: 0.35,
            animated: { fractalPulse: true, fadeAlpha: true }
        }
    },
    
    "fissao_arcana_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 32,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 40, max: 80 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.3, max: 2.6 },
            startColor: "#9900cc",
            endColor: "#cc44ff",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 70,
            gravity: { x: 0, y: 10 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.7, saturation: 2.2 },
            blur: { strength: 0.9, quality: 4 }
        }
    },

    // Implosão Mágica - Colapso da energia arcana
    "implosao_magica_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 68,
            lifetime: { min: 1.0, max: 1.8 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#ff00cc",
            endColor: "#660099",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: 0 },
            turbulence: 25,
            magical: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.6, saturation: 2.1 },
            overlayType: "spiral_inward",
            overlayColor: "#ee33cc",
            overlayIntensity: 0.35,
            animated: { spiralInward: true, fadeAlpha: true }
        }
    },
    
    "implosao_magica_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 42,
            lifetime: { min: 1.3, max: 2.1 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.6, max: 1.0 },
            endScale: { min: 0.3, max: 0.1 },
            startColor: "#bb0099",
            endColor: "#550077",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 80,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.8, saturation: 2.3 },
            blur: { strength: 1.0, quality: 4 }
        }
    },

    // Tempestade Elemental - Fúria dos elementos
    "tempestade_elemental_front": {
        type: "combined",
        duration: 1600,
        particles: {
            count: 75,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 80, max: 160 },
            startScale: { min: 0.1, max: 0.4 },
            endScale: { min: 1.2, max: 2.5 },
            startColor: "#00ccff",
            endColor: "#ffff00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 42,
            gravity: { x: 0, y: -20 },
            turbulence: 50,
            electric: true
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 1.4, saturation: 1.8 },
            overlayType: "radial_electric",
            overlayColor: "#88ddff",
            overlayIntensity: 0.35,
            animated: { thunderbolt: true, fadeAlpha: true }
        }
    },
    
    "tempestade_elemental_back": {
        type: "filters",
        duration: 1600,
        particles: {
            count: 48,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 40, max: 80 },
            startScale: { min: 0.3, max: 0.7 },
            endScale: { min: 1.5, max: 2.8 },
            startColor: "#0099cc",
            endColor: "#dddd00",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 85,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.6, saturation: 1.9 },
            blur: { strength: 0.8, quality: 4 }
        }
    },

    // Singularidade Arcana - Ultimate arcanista com buraco negro mágico
    "singularidade_arcana_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 120,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 30, max: 100 },
            startScale: { min: 0.3, max: 0.8 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#ff00ff",
            endColor: "#000033",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 60,
            gravity: { x: 0, y: 0 },
            turbulence: 15,
            arcane: true
        },
        filters: {
            colorMatrix: { brightness: 2.5, contrast: 2.0, saturation: 2.5 },
            overlayType: "magic_portal",
            overlayColor: "#aa00aa",
            overlayIntensity: 0.4,
            animated: { portalSpin: true, fadeAlpha: true }
        }
    },
    
    "singularidade_arcana_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 68,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 20, max: 60 },
            startScale: { min: 0.8, max: 1.5 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#cc00cc",
            endColor: "#330033",
            startAlpha: 0.8,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 120,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.8, contrast: 2.2, saturation: 2.8 },
            blur: { strength: 1.2, quality: 5 }
        }
    },

    // ========================================
    // 🎌 RONIN - ATAQUES DE LÂMINA
    // ========================================
    
    // Corte Preciso - Precisão absoluta da katana
    "corte_preciso_front": {
        type: "combined",
        duration: 1350,
        particles: {
            count: 28,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 90, max: 160 },
            startScale: { min: 0.2, max: 0.4 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#dddddd",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 18,
            gravity: { x: 0, y: -15 },
            turbulence: 15,
            crystalline: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.4, saturation: 0.9 },
            overlayType: "linear_diagonal",
            overlayColor: "#ffffff",
            overlayIntensity: 0.25,
            animated: { linearPulse: true, fadeAlpha: true }
        }
    },
    
    "corte_preciso_back": {
        type: "filters",
        duration: 1350,
        particles: {
            count: 18,
            lifetime: { min: 0.9, max: 1.6 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.0, max: 1.8 },
            startColor: "#cccccc",
            endColor: "#eeeeee",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 45,
            gravity: { x: 0, y: 8 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.6, saturation: 0.8 },
            blur: { strength: 0.4, quality: 2 }
        }
    },

    // Lâmina de Vento - Corte com velocidade do vento
    "lamina_vento_front": {
        type: "combined",
        duration: 1400,
        particles: {
            count: 38,
            lifetime: { min: 0.6, max: 1.2 },
            speed: { min: 100, max: 180 },
            startScale: { min: 0.1, max: 0.3 },
            endScale: { min: 0.7, max: 1.4 },
            startColor: "#ccffcc",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 26,
            gravity: { x: 0, y: -20 },
            turbulence: 25,
            wind: true
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.3, saturation: 1.3 },
            overlayType: "waves_concentric",
            overlayColor: "#ddffdd",
            overlayIntensity: 0.25,
            animated: { concentricWaves: true, fadeAlpha: true }
        }
    },
    
    "lamina_vento_back": {
        type: "filters",
        duration: 1400,
        particles: {
            count: 22,
            lifetime: { min: 1.1, max: 1.8 },
            speed: { min: 42, max: 78 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.1, max: 2.0 },
            startColor: "#aaddaa",
            endColor: "#ddffdd",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 55,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 1.4, saturation: 1.4 },
            blur: { strength: 0.5, quality: 3 }
        }
    },

    // Golpe Ascendente - Movimento ascendente poderoso
    "golpe_ascendente_front": {
        type: "combined",
        duration: 1450,
        particles: {
            count: 34,
            lifetime: { min: 0.7, max: 1.3 },
            speed: { min: 80, max: 140 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.0, max: 1.9 },
            startColor: "#ffddaa",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 22,
            gravity: { x: 0, y: -30 },
            turbulence: 12,
            spark: true
        },
        filters: {
            colorMatrix: { brightness: 1.6, contrast: 1.2, saturation: 1.2 },
            overlayType: "star_6",
            overlayColor: "#ffeecc",
            overlayIntensity: 0.25,
            animated: { starTwinkle: true, fadeAlpha: true }
        }
    },
    
    "golpe_ascendente_back": {
        type: "filters",
        duration: 1450,
        particles: {
            count: 20,
            lifetime: { min: 1.2, max: 1.9 },
            speed: { min: 35, max: 62 },
            startScale: { min: 0.4, max: 0.7 },
            endScale: { min: 1.2, max: 2.1 },
            startColor: "#ddbb88",
            endColor: "#ffeecc",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: -12 }
        },
        filters: {
            colorMatrix: { brightness: 1.3, contrast: 1.3, saturation: 1.3 },
            blur: { strength: 0.4, quality: 3 }
        }
    },

    // ========================================
    // 🗾 SAMURAI - ATAQUES HONORÁVEIS
    // ========================================
    
    // Corte do Vazio - Técnica do vazio absoluto
    "corte_vazio_front": {
        type: "combined",
        duration: 1500,
        particles: {
            count: 44,
            lifetime: { min: 0.8, max: 1.5 },
            speed: { min: 70, max: 130 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.9, max: 1.8 },
            startColor: "#330033",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 30,
            gravity: { x: 0, y: -15 },
            turbulence: 22,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.8, saturation: 1.6 },
            overlayType: "spiral_inward",
            overlayColor: "#666666",
            overlayIntensity: 0.3,
            animated: { spiralInward: true, fadeAlpha: true }
        }
    },
    
    "corte_vazio_back": {
        type: "filters",
        duration: 1500,
        particles: {
            count: 28,
            lifetime: { min: 1.3, max: 2.0 },
            speed: { min: 32, max: 62 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.3, max: 2.4 },
            startColor: "#220022",
            endColor: "#444444",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 65,
            gravity: { x: 0, y: 15 }
        },
        filters: {
            colorMatrix: { brightness: 0.8, contrast: 2.0, saturation: 1.9 },
            blur: { strength: 0.8, quality: 3 }
        }
    },

    // Corte do Dragão - Poder ancestral do dragão
    "corte_dragao_front": {
        type: "combined",
        duration: 1550,
        particles: {
            count: 55,
            lifetime: { min: 0.8, max: 1.4 },
            speed: { min: 80, max: 150 },
            startScale: { min: 0.3, max: 0.6 },
            endScale: { min: 1.1, max: 2.2 },
            startColor: "#ff4400",
            endColor: "#ffdd00",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 33,
            gravity: { x: 0, y: -22 },
            turbulence: 18,
            fiery: true
        },
        filters: {
            colorMatrix: { brightness: 1.9, contrast: 1.5, saturation: 1.8 },
            overlayType: "explosion_irregular",
            overlayColor: "#ff6600",
            overlayIntensity: 0.3,
            animated: { irregularExplosion: true, fadeAlpha: true }
        }
    },
    
    "corte_dragao_back": {
        type: "filters",
        duration: 1550,
        particles: {
            count: 34,
            lifetime: { min: 1.2, max: 2.0 },
            speed: { min: 35, max: 70 },
            startScale: { min: 0.5, max: 0.9 },
            endScale: { min: 1.4, max: 2.6 },
            startColor: "#cc3300",
            endColor: "#ffaa00",
            startAlpha: 0.6,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 70,
            gravity: { x: 0, y: 18 }
        },
        filters: {
            colorMatrix: { brightness: 1.5, contrast: 1.7, saturation: 1.9 },
            blur: { strength: 0.7, quality: 4 }
        }
    },

    // Dança das Lâminas - Múltiplos cortes elegantes
    "danca_laminas_front": {
        type: "combined",
        duration: 1600,
        particles: {
            count: 68,
            lifetime: { min: 1.0, max: 1.7 },
            speed: { min: 60, max: 120 },
            startScale: { min: 0.2, max: 0.5 },
            endScale: { min: 0.8, max: 1.6 },
            startColor: "#ffffff",
            endColor: "#dddddd",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 35,
            gravity: { x: 0, y: -18 },
            turbulence: 30,
            metallic: true
        },
        filters: {
            colorMatrix: { brightness: 1.7, contrast: 1.4, saturation: 1.0 },
            overlayType: "fan_burst",
            overlayColor: "#ffffff",
            overlayIntensity: 0.3,
            animated: { fanExpansion: true, fadeAlpha: true }
        }
    },
    
    "danca_laminas_back": {
        type: "filters",
        duration: 1600,
        particles: {
            count: 40,
            lifetime: { min: 1.4, max: 2.2 },
            speed: { min: 28, max: 58 },
            startScale: { min: 0.4, max: 0.8 },
            endScale: { min: 1.2, max: 2.2 },
            startColor: "#dddddd",
            endColor: "#ffffff",
            startAlpha: 0.5,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 75,
            gravity: { x: 0, y: 12 }
        },
        filters: {
            colorMatrix: { brightness: 1.4, contrast: 1.6, saturation: 0.9 },
            blur: { strength: 0.6, quality: 3 }
        }
    },

    // Caminho do Vazio Absoluto - Ultimate samurai de transcendência
    "caminho_vazio_absoluto_front": {
        type: "combined",
        duration: 2000,
        particles: {
            count: 105,
            lifetime: { min: 1.5, max: 2.5 },
            speed: { min: 40, max: 110 },
            startScale: { min: 0.3, max: 0.8 },
            endScale: { min: 0.1, max: 0.05 },
            startColor: "#000000",
            endColor: "#ffffff",
            startAlpha: 0.4,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 50,
            gravity: { x: 0, y: 0 },
            turbulence: 8,
            cloud: true
        },
        filters: {
            colorMatrix: { brightness: 2.0, contrast: 2.5, saturation: 0.6 },
            overlayType: "waves_concentric",
            overlayColor: "#333333",
            overlayIntensity: 0.4,
            animated: { concentricWaves: true, fadeAlpha: true }
        }
    },
    
    "caminho_vazio_absoluto_back": {
        type: "filters",
        duration: 2000,
        particles: {
            count: 52,
            lifetime: { min: 1.8, max: 2.8 },
            speed: { min: 20, max: 60 },
            startScale: { min: 0.6, max: 1.2 },
            endScale: { min: 0.2, max: 0.1 },
            startColor: "#111111",
            endColor: "#666666",
            startAlpha: 0.7,
            endAlpha: 0.0,
            emitterType: "circle",
            radius: 105,
            gravity: { x: 0, y: 0 }
        },
        filters: {
            colorMatrix: { brightness: 1.2, contrast: 3.0, saturation: 0.4 },
            blur: { strength: 1.2, quality: 5 }
        }
    }

};

// Expor globalmente
window.ATTACK_EFFECTS = ATTACK_EFFECTS;