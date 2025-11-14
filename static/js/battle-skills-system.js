// battle-skills-system.js - Sistema de Habilidades
// Versão 1.0

// Cache global para evitar repopulação
window.SKILLS_ALREADY_POPULATED = false;

// ===== HELPER PARA TOOLTIPS ESTILIZADOS =====
/**
 * Adiciona um tooltip estilizado a um elemento
 * @param {HTMLElement} element - Elemento que receberá o tooltip
 * @param {string} text - Texto do tooltip
 * @param {string} position - Posição: 'top' (default), 'bottom', 'left', 'right'
 */
window.addStyledTooltip = function(element, text, position = 'top') {
    if (!element || !text) return;

    // Criar wrapper se o elemento ainda não estiver dentro de um
    let wrapper = element.parentElement;
    if (!wrapper || !wrapper.classList.contains('styled-tooltip-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'styled-tooltip-wrapper';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    // Verificar se já existe um tooltip
    let tooltip = wrapper.querySelector('.styled-tooltip');
    if (tooltip) {
        tooltip.textContent = text;
    } else {
        // Criar tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'styled-tooltip';
        if (position !== 'top') {
            tooltip.classList.add(`tooltip-${position}`);
        }
        tooltip.textContent = text;
        wrapper.appendChild(tooltip);
    }

    // Remover atributo title nativo para evitar conflito
    element.removeAttribute('title');
};

// Popular opções de ataque
function populateAttackOptions() {
    const attackOptions = document.getElementById('attack-skills-menu');
    if (!attackOptions) {
        console.error('Elemento attack-skills-menu não encontrado!');
        return;
    }
    
    // Se já estiver carregando, não fazer novamente
    if (attackOptions.dataset.loading === 'true') {
        return;
    }
    
    // Marcar como carregando
    attackOptions.dataset.loading = 'true';
    
    // Preservar conteúdo atual para caso de falha
    const originalContent = attackOptions.innerHTML;
    
    // Adicionar indicador de carregamento apenas se estiver vazio
    if (!attackOptions.querySelector('.skill-button')) {
        attackOptions.innerHTML = '<div class="skill-button"><div>Carregando habilidades...</div></div>';
    }
    
    // Adicionar timeout para limitar tempo de espera
    let timeoutId = setTimeout(() => {
        console.log("Timeout atingido na carga de ataques");
        if (attackOptions.dataset.loading === 'true') {
            attackOptions.dataset.loading = 'false';
            // Se não houver conteúdo real, restaurar original ou mostrar erro
            if (!attackOptions.querySelector('.skill-button:not(.loading)')) {
                if (originalContent && originalContent.includes('skill-button')) {
                    attackOptions.innerHTML = originalContent;
                } else {
                    attackOptions.innerHTML = '<div class="skill-button"><div>Habilidades indisponíveis</div><div class="skill-details"><span>Tente novamente mais tarde</span></div></div>';
                }
            }
        }
    }, 5000); // 5 segundos máximo
    
    // URL ajustada
    const apiUrl = '/gamification/player/attacks';
    console.log("Tentando carregar habilidades de: " + apiUrl);
    
    // Carregar habilidades da API com tratamento de erros aprimorado
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Resposta do servidor: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Limpar timeout
            clearTimeout(timeoutId);
            
            // Marcar como não mais carregando
            attackOptions.dataset.loading = 'false';
            
            // ===== LOGS DE DEBUG ADICIONADOS =====
            console.log("🔍 DEBUG POPULATE - Dados recebidos da API:", data);
            console.log("🔍 DEBUG POPULATE - data.success:", data.success);
            
            if (data.success) {
                // ===== LOGS DE DEBUG PARA ATTACKS =====
                console.log("🔍 DEBUG POPULATE - Lista completa de attacks:", data.attacks);
                console.log("🔍 DEBUG POPULATE - Quantidade de attacks:", data.attacks ? data.attacks.length : 0);
                
                // Limpar indicador de carregamento
                attackOptions.innerHTML = '';
                
                // Verificar se temos ataques
                if (!data.attacks || data.attacks.length === 0) {
                    attackOptions.innerHTML = '<div class="skill-button"><div>Nenhum ataque disponível</div></div>';
                    return;
                }
                
                // Adicionar cada habilidade como botão
                data.attacks.forEach((skill, index) => {
                    // ===== LOGS DE DEBUG PARA CADA SKILL =====
                    console.log(`🔍 DEBUG SKILL ${index + 1}:`, skill);
                    console.log(`   → ID: ${skill.id}`);
                    console.log(`   → Name: "${skill.name}"`);
                    console.log(`   → animation_attack: "${skill.animation_attack}"`);
                    console.log(`   → Tipo animation_attack: ${typeof skill.animation_attack}`);
                    console.log(`   → animation_attack está vazio?`, !skill.animation_attack || skill.animation_attack.trim() === "");
                    console.log(`   → Todos os campos:`, Object.keys(skill));
                    console.log(`   → projectile_type: "${skill.projectile_type}"`);
                    console.log(`   → Cache Data:`, skill.cache_data);
                    console.log(`   → Applicable Relics:`, skill.applicable_relics);

                    // ---- REGISTRAR NO CACHE ----
                    window.SKILL_LOOKUP[skill.id] = skill;
                    window.SKILL_LOOKUP[skill.name.toLowerCase()] = skill;

                    // ===== LOG DO CACHE =====
                    console.log(`💾 CACHE - Skill ${skill.id} registrada:`, window.SKILL_LOOKUP[skill.id]);

                    const button = document.createElement('button');
                    button.classList.add('skill-button');
                    
                    // Adicionar todos os dados como atributos data-*
                    button.dataset.skillId = skill.id;
                    button.dataset.damageModifier = skill.damage_modifier;
                    // Adicionar custo de energia
                    if (skill.energy_cost !== undefined) {
                        button.dataset.energyCost = skill.energy_cost;
                    }
                    if (skill.projectile_type) button.dataset.projectileType = skill.projectile_type;
                    if (skill.beam_type) button.dataset.beamType = skill.beam_type;

                    // NOVOS CAMPOS ADICIONADOS
                    if (skill.sound_activation) button.dataset.soundActivation = skill.sound_activation;
                    if (skill.vignette) button.dataset.vignette = skill.vignette;

                    // Adicionar efeito de dano no boss
                    if (skill.boss_damage_overlay) button.dataset.bossDamageOverlay = skill.boss_damage_overlay;

                    // Adicionar caminhos de som
                    if (skill.sound_prep_1) button.dataset.soundPrep1 = skill.sound_prep_1;
                    if (skill.sound_prep_2) button.dataset.soundPrep2 = skill.sound_prep_2;
                    if (skill.sound_attack) button.dataset.soundAttack = skill.sound_attack;
                    if (skill.sound_effect_1) button.dataset.soundEffect1 = skill.sound_effect_1;
                    if (skill.sound_effect_2) button.dataset.soundEffect2 = skill.sound_effect_2;

                    // Adicionar efeitos visuais
                    if (skill.animation_fx_a) button.dataset.fxA = skill.animation_fx_a;
                    if (skill.animation_fx_b) button.dataset.fxB = skill.animation_fx_b;
                    
                    // ===== ADICIONAR animation_attack AOS DADOS DO BOTÃO =====
                    if (skill.animation_attack) {
                        button.dataset.animationAttack = skill.animation_attack;
                        console.log(`✅ BUTTON - animation_attack adicionado: "${skill.animation_attack}"`);
                    } else {
                        console.log(`⚠️ BUTTON - animation_attack VAZIO ou UNDEFINED para skill: ${skill.name}`);
                    }

                    // ===== ADICIONAR attack_sequence AOS DADOS DO BOTÃO =====
                    if (skill.attack_sequence) {
                        button.dataset.attackSequence = skill.attack_sequence;
                        console.log(`✅ BUTTON - attack_sequence adicionado: "${skill.attack_sequence}"`);
                    } else {
                        console.log(`⚠️ BUTTON - attack_sequence VAZIO ou UNDEFINED para skill: ${skill.name}`);
                    }
                    
                    // Verificar custos e disponibilidade
                    let disabled = false;
                    let disableReason = "";

                    if (gameState.revisionPoints < skill.points_cost) {
                        disabled = true;
                        disableReason += "Pontos insuficientes. ";
                    }

                    // ===== VERIFICAR SE FOI DESABILITADA POR RELÍQUIA =====
                    if (skill.is_disabled) {
                        disabled = true;
                        disableReason += skill.disabled_reason || "Desabilitada por relíquia. ";
                        button.classList.add('relic-disabled');
                        
                        // ===== ADICIONAR ÍCONE DA RELÍQUIA NO BOTÃO =====
                        const relicIcon = document.createElement('img');
                        relicIcon.src = '/static/game.data/relics/relic_24.png';
                        relicIcon.classList.add('relic-lock-icon');
                        relicIcon.alt = 'Relíquia Última Graça';
                        button.appendChild(relicIcon);
                        
                        console.log(`🔒 Skill ${skill.name} desabilitada: ${skill.disabled_reason}`);
                    }

                    if (disabled) {
                        button.classList.add('disabled');
                        button.disabled = true;
                        button.title = disableReason;
                    }
                    
                    // ===== CRIAR ESTRUTURA DO BOTÃO (LAYOUT 3 LINHAS) =====
                    const buttonContent = document.createElement('div');
                    buttonContent.className = 'skill-button-content';

                    // ===== LINHA 1: ÍCONE + NOME + ENERGIA =====
                    const topLine = document.createElement('div');
                    topLine.className = 'skill-top-line';

                    // Ícone do tipo de ataque (pequeno, sem círculo)
                    const typeIconContainer = document.createElement('div');
                    typeIconContainer.className = 'attack-type-icon-container';

                    const attackTypeIcon = document.createElement('img');
                    attackTypeIcon.className = 'attack-type-icon';

                    const typeIconMap = {
                        'attack': 'atk1.png',
                        'power': 'atk2.png',
                        'special': 'atk3.png',
                        'ultimate': 'atk4.png'
                    };

                    const iconFile = typeIconMap[skill.skill_type] || 'atk1.png';
                    attackTypeIcon.src = `/static/game.data/icons/${iconFile}`;
                    attackTypeIcon.alt = skill.skill_type || 'attack';

                    typeIconContainer.appendChild(attackTypeIcon);
                    topLine.appendChild(typeIconContainer);

                    // Nome da skill
                    const skillName = document.createElement('div');
                    skillName.className = 'skill-name';
                    skillName.textContent = skill.name;
                    topLine.appendChild(skillName);

                    // Energia na mesma linha (final)
                    if (skill.energy_cost !== undefined) {
                        const energyBadge = document.createElement('div');
                        energyBadge.className = 'skill-energy-cost';

                        const energyIcon = document.createElement('img');
                        energyIcon.src = '/static/game.data/energy.png';
                        energyIcon.className = 'skill-energy-icon';

                        const costText = document.createElement('span');
                        costText.textContent = skill.energy_cost;

                        energyBadge.appendChild(energyIcon);
                        energyBadge.appendChild(costText);
                        topLine.appendChild(energyBadge);

                        // Verificar disponibilidade de energia
                        if (gameState.player.energy !== undefined && gameState.player.energy < skill.energy_cost) {
                            button.classList.add('insufficient-energy');
                            disabled = true;
                            disableReason += "Energia insuficiente. ";
                        }
                    }

                    buttonContent.appendChild(topLine);

                    // ===== CONTAINER PARA LINHAS 2 E 3 =====
                    const centralContainer = document.createElement('div');
                    centralContainer.className = 'skill-central-container';

                    // LINHA DE EFEITOS (EMBAIXO DO NOME, HORIZONTAL)
                    const skillDetails = document.createElement('div');
                    skillDetails.className = 'skill-details';

                    if (skill.cache_data) {
                        const cache = skill.cache_data;

                        // DANO
                        if (cache.base_damage) {
                            const damageInfo = document.createElement('div');
                            damageInfo.className = 'skill-stat';
                            damageInfo.title = `Dano base: ${cache.base_damage} HP`;

                            const damageIcon = document.createElement('img');
                            damageIcon.src = '/static/game.data/icons/damage.png';
                            damageIcon.className = 'stat-icon';

                            const damageText = document.createElement('span');
                            damageText.textContent = cache.base_damage;

                            damageInfo.appendChild(damageIcon);
                            damageInfo.appendChild(damageText);
                            skillDetails.appendChild(damageInfo);
                        }

                        // CHANCE DE CRÍTICO
                        if (cache.base_crit_chance && cache.base_crit_chance > 0) {
                            const critInfo = document.createElement('div');
                            critInfo.className = 'skill-stat';
                            critInfo.title = `Chance de crítico: ${(cache.base_crit_chance * 100).toFixed(0)}%`;

                            const critIcon = document.createElement('img');
                            critIcon.src = '/static/game.data/icons/critchance.png';
                            critIcon.className = 'stat-icon';

                            const critText = document.createElement('span');
                            critText.textContent = `${(cache.base_crit_chance * 100).toFixed(0)}%`;

                            critInfo.appendChild(critIcon);
                            critInfo.appendChild(critText);
                            skillDetails.appendChild(critInfo);
                        }

                        // VAMPIRISMO
                        if (cache.lifesteal_percent && cache.lifesteal_percent > 0) {
                            const vampInfo = document.createElement('div');
                            vampInfo.className = 'skill-stat';
                            vampInfo.title = `Vampirismo: ${(cache.lifesteal_percent * 100).toFixed(0)}% do dano vira HP`;

                            const vampIcon = document.createElement('img');
                            vampIcon.src = '/static/game.data/icons/vampirism.png';
                            vampIcon.className = 'stat-icon';

                            const vampText = document.createElement('span');
                            vampText.textContent = `${(cache.lifesteal_percent * 100).toFixed(0)}%`;

                            vampInfo.appendChild(vampIcon);
                            vampInfo.appendChild(vampText);
                            skillDetails.appendChild(vampInfo);
                        }

                        // BARREIRA
                        if (cache.effect_type === 'barrier') {
                            const barrierValue = Math.ceil((cache.base_damage * (cache.effect_value || 0)) + (cache.effect_bonus || 0));

                            const barrierInfo = document.createElement('div');
                            barrierInfo.className = 'skill-stat';
                            barrierInfo.title = `Barreira: Ganha ${barrierValue} de escudo`;

                            const barrierIcon = document.createElement('img');
                            barrierIcon.src = '/static/game.data/icons/barrier.png';
                            barrierIcon.className = 'stat-icon';

                            const barrierText = document.createElement('span');
                            barrierText.textContent = barrierValue;

                            barrierInfo.appendChild(barrierIcon);
                            barrierInfo.appendChild(barrierText);
                            skillDetails.appendChild(barrierInfo);
                        }
                    }

                    centralContainer.appendChild(skillDetails);

                    // ===== LINHA 3: RELÍQUIAS (SE HOUVER) =====
                    if (skill.applicable_relics && skill.applicable_relics.length > 0) {
                        const relicsContainer = document.createElement('div');
                        relicsContainer.className = 'skill-relics-container';

                        skill.applicable_relics.forEach(relic => {
                            const relicIcon = document.createElement('img');
                            const iconSrc = relic.icon.startsWith('/') || relic.icon.startsWith('http')
                                ? relic.icon
                                : `/static/game.data/relics/${relic.icon}`;
                            relicIcon.src = iconSrc;
                            relicIcon.className = 'skill-relic-icon';
                            relicIcon.title = `${relic.name}: ${relic.modifier.description}`; // Tooltip nativo (igual às infos de ataque)

                            relicsContainer.appendChild(relicIcon);
                        });

                        centralContainer.appendChild(relicsContainer);
                    }

                    buttonContent.appendChild(centralContainer);
                    button.appendChild(buttonContent);
                    
                    button.addEventListener('click', () => {
                        // Verificar energia primeiro
                        const energyCost = parseInt(button.dataset.energyCost);
                        const currentEnergy = gameState.player.energy;
                        
                        if (!isNaN(energyCost) && currentEnergy < energyCost) {
                            if (typeof showBattleMessage === 'function') {
                                showBattleMessage(`Energia insuficiente! Você precisa de ${energyCost} energia.`);
                            }
                            return;
                        }
                        
                        if (!button.disabled) {
                            closeAllSubmenus();
                            window.activeSubmenu = null;
                            
                            useAttackSkill(
                                skill.id, 
                                skill.name, 
                                skill.damage_modifier
                            );
                        }
                    });
                    
                    attackOptions.appendChild(button);
                });
                
                // ===== LOG FINAL =====
                console.log("🔍 DEBUG POPULATE - Skills carregadas com sucesso!");
                console.log("🔍 DEBUG POPULATE - SKILL_LOOKUP atual:", window.SKILL_LOOKUP);

                // Atualizar indicador de energia após carregar skills
                if (typeof updateEnergyIndicator === 'function') {
                    updateEnergyIndicator();
                }
                
            } else {
                console.error("❌ DEBUG POPULATE - API retornou success: false");
                // Mostrar mensagem de erro
                attackOptions.innerHTML = '<div class="skill-button disabled"><div>Erro ao carregar habilidades</div></div>';
            }
        })
        .catch(error => {
            // Limpar timeout
            clearTimeout(timeoutId);
            
            // Marcar como não mais carregando
            attackOptions.dataset.loading = 'false';
            
            console.error('❌ DEBUG POPULATE - Erro ao carregar habilidades de ataque:', error);
            
            // Restaurar conteúdo original se houver, ou mostrar erro
            if (originalContent && originalContent.includes('skill-button')) {
                attackOptions.innerHTML = originalContent;
            } else {
                attackOptions.innerHTML = '<div class="skill-button disabled"><div>Erro ao carregar habilidades</div><div class="skill-details"><span>Tente novamente</span></div></div>';
            }
        });
}

// Popular opções de habilidades especiais
function populateSpecialOptions() {
    console.log("Populando menu de habilidades especiais...");
    const specialOptions = document.getElementById('special-skills-menu');
    if (!specialOptions) {
        console.error('Menu de habilidades especiais não encontrado!');
        return;
    }
    
    // Limpar menu atual
    specialOptions.innerHTML = '';
    
    // Adicionar elemento container para os ícones
    const skillsContainer = document.createElement('div');
    skillsContainer.className = 'special-skills-container';
    specialOptions.appendChild(skillsContainer);
    
    // Adicionar indicador de carregamento
    const loadingItem = document.createElement('div');
    loadingItem.className = 'skill-button';
    loadingItem.innerHTML = '<div>Carregando habilidades...</div>';
    skillsContainer.appendChild(loadingItem);
    
    // Carregar habilidades da API
    fetch('/gamification/get_player_specials_api')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Limpar indicador de carregamento
                skillsContainer.innerHTML = '';
                
                // Se não houver habilidades especiais, mostrar mensagem padrão
                if (!data.specials || data.specials.length === 0) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'skill-button';
                    placeholder.style.background = 'linear-gradient(to bottom, #6a2080, #4a106b)';
                    placeholder.style.border = '2px solid #883aa5';
                    
                    const placeholderName = document.createElement('div');
                    placeholderName.textContent = 'Habilidades Especiais';
                    
                    const placeholderDetails = document.createElement('div');
                    placeholderDetails.className = 'skill-details';
                    placeholderDetails.innerHTML = '<span>Em breve</span>';
                    
                    placeholder.appendChild(placeholderName);
                    placeholder.appendChild(placeholderDetails);
                    
                    skillsContainer.appendChild(placeholder);
                    return;
                }
                
                // Adicionar cada habilidade especial como ícone
                data.specials.forEach(skill => {
                    // Criar container do ícone da skill
                    const skillItem = document.createElement('div');
                    skillItem.className = 'special-skill-icon';
                    skillItem.dataset.skillId = skill.id;
                    
                    // Aplicar classes CSS com base no nome da skill
                    const skillClasses = getSkillClass(skill.name);
                    skillClasses.split(' ').forEach(className => {
                        skillItem.classList.add(className);
                    });
                    
                    // Adicionar efeito especial para skills supremas
                    if (skill.is_supreme) {
                        skillItem.classList.add('supreme');
                    }
                    
                    // Criar imagem do ícone da skill
                    const skillImage = document.createElement('img');
                    skillImage.src = skill.icon || '/static/game.data/icons/default_skill.png';
                    skillImage.alt = skill.name;
                    skillImage.onerror = function() {
                        // Fallback em caso de erro no carregamento da imagem
                        this.src = '/static/game.data/icons/default_skill.png';
                    };
                    skillItem.appendChild(skillImage);
                    
                    // Sistema novo: baseado em turnos, não em tempo
                    let usedThisTurn = skill.used_this_turn || false;
                    
                    // Formatar efeito positivo em texto legível
                    let positiveEffectText = '';
                    if (skill.positive_effect && skill.positive_effect.type) {
                        const effectType = skill.positive_effect.type;
                        const effectValue = skill.positive_effect.value;
                        
                        // Formatar com base no tipo
                        switch (effectType) {
                            case 'crit_chance': 
                                positiveEffectText = `+${effectValue * 100}% Chance de Crítico`; 
                                break;
                            case 'crit_damage': 
                                positiveEffectText = `+${effectValue * 100}% Dano Crítico`; 
                                break;
                            case 'damage': 
                                positiveEffectText = `+${effectValue * 100}% Dano`; 
                                break;
                            case 'dodge_bonus': 
                                positiveEffectText = `+${effectValue * 100}% Chance de Esquiva`; 
                                break;
                            case 'block_bonus': 
                                positiveEffectText = `+${effectValue * 100}% Chance de Bloqueio`; 
                                break;
                            case 'lifesteal': 
                                positiveEffectText = `+${effectValue * 100}% Roubo de Vida`; 
                                break;
                            case 'damage_reduction': 
                                positiveEffectText = `Reduz dano recebido em ${effectValue * 100}%`; 
                                break;
                            default: 
                                positiveEffectText = `Efeito: ${effectType} (${effectValue * 100}%)`;
                        }
                    } else if (skill.effect_description) {
                        // Alternativa: usar descrição de efeito se disponível
                        positiveEffectText = skill.effect_description;
                    } else {
                        // Último recurso: usar descrição da skill
                        positiveEffectText = skill.description || "Efeito especial";
                    }
                
                    // Formatar efeito negativo/custo em texto legível
                    let negativeEffectText = '';
                    if (skill.negative_effect_type) {
                        switch (skill.negative_effect_type) {
                            case 'mp_cost': 
                                negativeEffectText = `Custo: ${skill.negative_effect_value * 100}% do MP máximo`; 
                                break;
                            case 'hp_cost': 
                                negativeEffectText = `Custo: ${skill.negative_effect_value * 100}% do HP máximo`; 
                                break;
                            case 'defense_loss': 
                                negativeEffectText = `Reduz defesa em ${skill.negative_effect_value * 100}%`; 
                                break;
                            default: 
                                negativeEffectText = `Custo: ${skill.negative_effect_type}`;
                        }
                    }
                    
                    // Formatar duração
                    let durationText = '';
                    if (skill.duration && skill.duration.type) {
                        const durationType = skill.duration.type;
                        const durationValue = skill.duration.value;
                        
                        if (durationType === 'attacks') {
                            durationText = `Duração: ${durationValue} ataques`;
                        } else if (durationType === 'time') {
                            if (durationValue < 60) {
                                durationText = `Duração: ${durationValue} minutos`;
                            } else {
                                const hours = Math.floor(durationValue / 60);
                                const mins = durationValue % 60;
                                durationText = `Duração: ${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
                            }
                        } else if (durationType === 'instant') {
                            durationText = 'Efeito Instantâneo';
                        }
                    } else if (skill.duration_description) {
                        // Alternativa: usar descrição de duração se disponível
                        durationText = skill.duration_description;
                    } else {
                        // Extrair informação de duração da descrição da skill se possível
                        const description = skill.description || "";
                        if (description.includes("ataque") && description.match(/\d+\s+ataques/)) {
                            durationText = "Duração: " + description.match(/\d+\s+ataques/)[0];
                        } else if (description.includes("minuto") && description.match(/\d+\s+minutos/)) {
                            durationText = "Duração: " + description.match(/\d+\s+minutos/)[0];
                        } else if (description.includes("hora") && description.match(/\d+\s+horas/)) {
                            durationText = "Duração: " + description.match(/\d+\s+horas/)[0];
                        } else {
                            durationText = "Duração: Ver descrição";
                        }
                    }
                    
                    // Criar tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = 'special-skill-tooltip';

                    // Nome da skill (grande, centralizado, dourado)
                    const skillName = document.createElement('h3');
                    skillName.textContent = skill.name;
                    skillName.style.cssText = 'font-size: 18px; text-align: center; color: #FFD700; margin-bottom: 8px; font-weight: bold;';
                    tooltip.appendChild(skillName);

                    // Descrição da skill (se disponível)
                    if (skill.description) {
                        const description = document.createElement('div');
                        description.className = 'skill-description';
                        description.textContent = skill.description;
                        description.style.cssText = 'font-size: 13px; color: #e0e0e0; margin-bottom: 10px; line-height: 1.4; text-align: center;';
                        tooltip.appendChild(description);
                    }

                    // Disponibilidade (baseado em turnos)
                    const availabilityInfo = document.createElement('div');
                    availabilityInfo.className = 'charges';
                    availabilityInfo.style.cssText = 'font-size: 13px; margin-top: 8px; font-weight: bold; text-align: center;';
                    if (usedThisTurn) {
                        availabilityInfo.innerHTML = '⏳ Usada neste turno';
                        availabilityInfo.style.color = '#ff6b6b';
                    } else {
                        availabilityInfo.innerHTML = '✓ Disponível';
                        availabilityInfo.style.color = '#51cf66';
                    }
                    tooltip.appendChild(availabilityInfo);

                    // Adicionar tooltip ao item da skill
                    skillItem.appendChild(tooltip);

                    // Verificar disponibilidade (se foi usada neste turno)
                    if (usedThisTurn) {
                        skillItem.classList.add('disabled');
                    } else {
                        // Adicionar eventos de mouse mais robustos
                        skillItem.addEventListener('mousedown', function() {
                            this.classList.add('active');
                        });
                        
                        skillItem.addEventListener('mouseup', function() {
                            this.classList.remove('active');
                        });
                        
                        skillItem.addEventListener('mouseleave', function() {
                            this.classList.remove('active');
                        });
                        
                        // Adicionar suporte para eventos de toque
                        skillItem.addEventListener('touchstart', function(e) {
                            e.preventDefault(); // Prevenir comportamento padrão
                            this.classList.add('active');
                        });

                        skillItem.addEventListener('touchend', function(e) {
                            e.preventDefault(); // Prevenir comportamento padrão
                            this.classList.remove('active');
                            
                            // Simular o evento de clique
                            if (!this.classList.contains('disabled')) {
                                this.classList.add('skill-using');
                                
                                setTimeout(() => {
                                    this.classList.remove('skill-using');
                                }, 800);
                                
                                useSpecialSkill(skill.id, skill.name);
                            }
                        });
                        
                        // Adicionar evento de clique
                        skillItem.addEventListener('click', function() {
                            // Adicionar classe de animação
                            this.classList.add('skill-using');
                            
                            // Remover a classe após a animação terminar
                            setTimeout(() => {
                                this.classList.remove('skill-using');
                            }, 800); // 800ms = duração da animação
                            
                            // Chamar a função de uso da skill
                            useSpecialSkill(skill.id, skill.name);
                        });
                    }

                    // Adicionar ao container
                    skillsContainer.appendChild(skillItem);
                });
            } else {
                // Mostrar mensagem de erro
                skillsContainer.innerHTML = '<div class="skill-button disabled"><div>Erro ao carregar habilidades</div></div>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar habilidades especiais:', error);
            skillsContainer.innerHTML = '<div class="skill-button disabled"><div>Erro ao carregar habilidades</div></div>';
        });
}

// Determinar a classe/subclasse com base no nome da skill
function getSkillClass(skillName) {
    // Nomes de skills que pertencem a cada classe/subclasse
    const classMap = {
        // Genérico
        'Foco': 'generic',
        
        // Mago
        'Barreira Arcana': 'mage',
        'Canalização Mágica': 'mage',
        'Ampliação Mental': 'mage',
        
        // Clérigo
        'Bênção Divina': 'cleric',
        'Proteção Sagrada': 'cleric',
        'Palavra de Poder': 'cleric',
        'Intervenção Divina': 'cleric supreme',
        
        // Arcanista
        'Sobrecarga Arcana': 'arcanist',
        'Mente Expandida': 'arcanist',
        'Distorção Temporal': 'arcanist',
        'Arcano Supremo': 'arcanist supreme',
        
        // Ronin
        'Postura de Combate': 'ronin',
        'Mente Zen': 'ronin',
        'Espírito do Guerreiro': 'ronin',
        
        // Samurai
        'Código Bushido': 'samurai',
        'Concentração Absoluta': 'samurai',
        'Meditação do Vazio': 'samurai',
        'Corte da Realidade': 'samurai supreme',
        
        // Ninja
        'Arte do Desaparecimento': 'ninja',
        'Veneno Paralisante': 'ninja',
        'Preparação de Veneno': 'ninja',
        'Assassinato Perfeito': 'ninja supreme',
        
        // Guerreiro
        'Fúria Guerreira': 'warrior',
        'Armadura de Batalha': 'warrior',
        
        // Berserker
        'Sede de Sangue': 'berserker',
        'Adrenalina': 'berserker',
        'Força Bruta': 'berserker',
        'Frenesi Incontrolável': 'berserker supreme',
        
        // Lobisomem
        'Transformação Lupina': 'werewolf',
        'Instinto Predador': 'werewolf',
        'Regeneração Bestial': 'werewolf',
        'Forma Primordial': 'werewolf supreme',
        
        // Gatuno
        'Furtividade': 'thief',
        'Mão Leve': 'thief',
        
        // Ladrão Mestre
        'Olhar Astuto': 'master-thief',
        'Gatuno das Sombras': 'master-thief',
        'Roubo da Sorte': 'master-thief',
        'Golpe da Fortuna': 'master-thief supreme',
        
        // Vampiro
        'Autofagia': 'vampire',
        'Aura Vampírica': 'vampire',
        'Domínio Mental': 'vampire',
        'Abraço Sanguíneo': 'vampire supreme'
    };
    
    // Retornar a classe correspondente ou 'generic' se não encontrar
    return classMap[skillName] || 'generic';
}

// Usar habilidade de ataque
function useAttackSkill(skillId, skillName, damageModifier) {
    console.log("🔍 DEBUG - useAttackSkill chamada com ID:", skillId);
    console.log("🔍 DEBUG - Skills ativas no gameState:", gameState.player.active_skills);
    console.log("🔍 DEBUG - SKILL_LOOKUP:", window.SKILL_LOOKUP);
    console.log("🔍 DEBUG - Skill buscada por ID:", window.SKILL_LOOKUP[skillId]);
    // Verificar se o jogo já está em ação
    if (gameState.inAction) {
        console.log("Jogo já está em ação, ignorando pedido de ataque");
        return;
    }
    
    // TOCAR SOM DE ATIVAÇÃO IMEDIATAMENTE
    const soundActivation = document.querySelector(`[data-skill-id="${skillId}"]`)?.dataset.soundActivation;
    if (soundActivation) {
        console.log("🔊 Tocando som de ativação:", soundActivation);
        playSound(soundActivation, 0.8);
    }

    // INICIAR VINHETA DE ATAQUE IMEDIATAMENTE
    const vignetteName = document.querySelector(`[data-skill-id="${skillId}"]`)?.dataset.vignette;
    if (vignetteName) {
        console.log("🎬 Iniciando vinheta de ataque:", vignetteName);
        playAttackVignette(vignetteName);
    }

    // Adicionar debug
    console.log(`USANDO SKILL: ID=${skillId}, Nome=${skillName}, Modificador=${damageModifier}`);
    
    // Verificar se gameState existe
    if (typeof gameState === 'undefined') {
        console.error("gameState não está definido!");
        return;
    }

    // Garantir que a UI seja atualizada imediatamente
    if (window.playerHpTextEl) window.playerHpTextEl.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
        
    // Fechar submenus
    closeAllSubmenus();
    
    // IMPORTANTE: Buscar TODOS os dados da skill de forma completa
    const skillButtons = document.querySelectorAll('.skill-button');
    let completeSkill = {
        id: skillId,
        name: skillName,
        damageModifier: damageModifier,
        // Inicializar outros parâmetros com valores padrão
        sound_prep_1: null,
        sound_prep_2: null,
        sound_attack: null,
        sound_effect_1: null,
        sound_effect_2: null,
        animation_fx_a: null,
        animation_fx_b: null,
        boss_damage_overlay: null,
        criticalBonus: 0,
        animation_attack: "" // ADICIONAR este campo
    };

    // Buscar dados específicos do botão clicado
    skillButtons.forEach(button => {
        if (parseInt(button.dataset.skillId) === skillId) {
            // Capturar todos os dados armazenados no botão
            if (button.dataset.soundPrep1) completeSkill.sound_prep_1 = button.dataset.soundPrep1;
            if (button.dataset.soundPrep2) completeSkill.sound_prep_2 = button.dataset.soundPrep2;
            if (button.dataset.soundAttack) completeSkill.sound_attack = button.dataset.soundAttack;
            if (button.dataset.soundEffect1) completeSkill.sound_effect_1 = button.dataset.soundEffect1;
            if (button.dataset.soundEffect2) completeSkill.sound_effect_2 = button.dataset.soundEffect2;
            if (button.dataset.fxA) completeSkill.animation_fx_a = button.dataset.fxA;
            if (button.dataset.fxB) completeSkill.animation_fx_b = button.dataset.fxB;
            if (button.dataset.bossDamageOverlay) completeSkill.boss_damage_overlay = button.dataset.bossDamageOverlay;
            if (button.dataset.animationAttack) completeSkill.animation_attack = button.dataset.animationAttack;
            if (button.dataset.attackSequence) completeSkill.attack_sequence = button.dataset.attackSequence;
            if (button.dataset.projectileType) completeSkill.projectile_type = button.dataset.projectileType;
            if (button.dataset.beamType) completeSkill.beam_type = button.dataset.beamType;
        }
    });
    
    // Executar o ataque com a animação
    performAttack(completeSkill);
    
    // Atualizar a interface para feedback imediato
    updateStats();
}

// Usar habilidade especial
function useSpecialSkill(skillId, skillName) {
    console.log(`Usando habilidade especial: ${skillName} (ID: ${skillId})`);
    
    // Evitar processamento duplicado
    if (window.processingSkill) {
        console.log("Já processando uma skill, ignorando nova requisição");
        return false;
    }
    
    // Definir flag de processamento
    window.processingSkill = true;
    
    // Encontrar o botão da skill pelo ID
    const skillButtons = document.querySelectorAll('.skill-button');
    let skillButton = null;
    
    skillButtons.forEach(button => {
        if (button.dataset.skillId == skillId) {
            skillButton = button;
        }
    });
    
    // Aplicar efeito visual imediato
    if (skillButton) {
        // Adicionar classe para efeito visual
        skillButton.classList.add('skill-using');
    }
    
    // Mostrar mensagem de carregamento
    showTempMessage(`Ativando ${skillName}...`, "#9933ff");
    
    // Fazer requisição AJAX
    fetch('/gamification/use_special', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `skill_id=${skillId}`
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na resposta do servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Resposta da ativação de skill:", data);
        console.log("RESPOSTA COMPLETA DA API:", JSON.stringify(data, null, 2));
        console.log("DADOS DE ANIMAÇÃO:", JSON.stringify(data.details?.animation, null, 2));
        
        // Remover classe de efeito visual de processamento
        if (skillButton) {
            skillButton.classList.remove('skill-using');
        }
        
        // Mostrar mensagem de sucesso ou erro
        if (data.success) {
            showTempMessage(`${skillName} ativada com sucesso!`, "#9933ff");
            
            // Aplicar feedback visual ao botão
            if (skillButton) {
                // Adicionar classe para efeito visual de sucesso
                skillButton.classList.add('skill-used');
                
                // Atualizar contagem de cargas
                const chargesSpan = skillButton.querySelector('.skill-details span:first-child');
                if (chargesSpan && chargesSpan.textContent.includes('Cargas:')) {
                    const match = chargesSpan.textContent.match(/Cargas:\s*(\d+)\/(\d+)/);
                    if (match) {
                        const current = parseInt(match[1]);
                        const max = parseInt(match[2]);
                        
                        // Decrementar contador de cargas
                        if (current > 0) {
                            chargesSpan.textContent = `Cargas: ${current-1}/${max}`;
                            
                            // Desabilitar se não houver mais cargas
                            if (current <= 1) {
                                skillButton.classList.add('disabled');
                                
                                // Remover evento de clique
                                skillButton.style.pointerEvents = 'none';
                            }
                        }
                    }
                }
                
                // Remover a classe após efeito
                setTimeout(() => {
                    skillButton.classList.remove('skill-used');
                }, 1500);
            }
            
            // Recarregar dados de batalha para atualizar interface
            loadBattleData()
                .then(() => {
                    // Atualizar interface
                    updateStats();
                    updatePlayerStatusCard();

                    console.log("🎬 [VISUAL FX DEBUG] data.details:", data.details);

                    if (data.details && data.details.animation) {
                        console.log("🎬 [VISUAL FX DEBUG] Usando animation data da API:", data.details.animation);
                        applySpecialSkillVisualEffect(data.details.animation);
                    } else if (data.details && data.details.effect_type) {
                        console.log("🎬 [VISUAL FX DEBUG] Construindo animation data de effect_type:", data.details.effect_type);
                        // Converter o tipo de efeito em dados de animação
                        const animationData = {
                            animation_activate_1: `/static/game.data/activation/${data.details.effect_type}_a.png`,
                            animation_activate_2: `/static/game.data/activation/${data.details.effect_type}_b.png`,
                            sound_prep_1: "/static/game.data/sounds/buff_prep.mp3",
                            sound_prep_2: "",
                            sound_effect_1: "/static/game.data/sounds/buff_activate.mp3",
                            sound_effect_2: ""
                        };
                        applySpecialSkillVisualEffect(animationData);
                    } else {
                        console.error("🎬 [VISUAL FX DEBUG] NENHUM dado de animação encontrado! data.details:", data.details);
                    }
                })
                .catch(error => {
                    console.error("Erro ao recarregar dados após usar skill:", error);
                });
        } else {
            showTempMessage(data.message || "Erro ao ativar skill", "#ff3333");
        }
    })
    .catch(error => {
        console.error("Erro ao ativar skill especial:", error);
        showTempMessage("Erro ao ativar skill. Tente novamente.", "#ff3333");
        
        // Remover classe de efeito visual em caso de erro
        if (skillButton) {
            skillButton.classList.remove('skill-using');
        }
    })
    .finally(() => {
        // Sempre liberar a flag de processamento, mesmo em caso de erro
        setTimeout(() => {
            window.processingSkill = false;
        }, 1000);
    });
    
    return false; // Prevenir comportamento padrão
}

// Aplicar efeito visual das habilidades especiais
function applySpecialSkillVisualEffect(animationData) {
    console.log("🎬 [VISUAL FX] Aplicando efeito visual com dados diretos da API:", animationData);
    console.log("🎬 [VISUAL FX] animation_activate_1:", animationData?.animation_activate_1);
    console.log("🎬 [VISUAL FX] animation_activate_2:", animationData?.animation_activate_2);
    console.log("🎬 [VISUAL FX] sound_prep_1:", animationData?.sound_prep_1);
    console.log("🎬 [VISUAL FX] sound_effect_1:", animationData?.sound_effect_1);

    // Verificar se temos dados de animação
    if (!animationData) {
        console.error("🎬 [VISUAL FX] ❌ Dados de animação não fornecidos");
        return;
    }
    
    // PARTE 1: PROCESSAR SONS EXATAMENTE COMO VIERAM DA API
    const delay = 500; // 500ms entre os sons
    
    // Tocar os sons em sequência
    if (animationData.sound_prep_1) {
        console.log("Tocando sound_prep_1:", animationData.sound_prep_1);
        playSound(animationData.sound_prep_1, 0.8);
    }
    
    if (animationData.sound_prep_2) {
        setTimeout(() => {
            console.log("Tocando sound_prep_2:", animationData.sound_prep_2);
            playSound(animationData.sound_prep_2, 0.8);
        }, delay);
    }
    
    if (animationData.sound_effect_1) {
        setTimeout(() => {
            console.log("Tocando sound_effect_1:", animationData.sound_effect_1);
            playSound(animationData.sound_effect_1, 0.8);
        }, delay * 3);
    }
    
    if (animationData.sound_effect_2) {
        setTimeout(() => {
            console.log("Tocando sound_effect_2:", animationData.sound_effect_2);
            playSound(animationData.sound_effect_2, 0.8);
        }, delay * 4);
    }
    
    // PARTE 2: PROCESSAR ANIMAÇÕES VISUAIS COM SISTEMA HÍBRIDO
    const hasVisualEffect1 = animationData.animation_activate_1;
    const hasVisualEffect2 = animationData.animation_activate_2;
    
    if (!hasVisualEffect1 && !hasVisualEffect2) {
        console.log("Nenhuma animação visual disponível nos dados da API");
        return;
    }
    
    // Verificar se estamos na character-view
    const isCharacterView = document.querySelector('.battle-arena.character-view') !== null;
    
    if (!isCharacterView) {
        console.log("Forçando character-view para animação...");
        const previousView = {
            zoomedView: window.gameState.zoomedView,
            characterView: window.gameState.characterView,
            bossView: window.gameState.bossView
        };
        
        if (typeof toggleCharacterView === 'function' && !window.gameState.characterView) {
            toggleCharacterView();
            
            setTimeout(() => {
                processSpecialEffects();
                
                // Restaurar view anterior após a animação
                setTimeout(() => {
                    if (previousView.zoomedView && !window.gameState.zoomedView) {
                        toggleZoomView();
                    } else if (!previousView.characterView && window.gameState.characterView) {
                        toggleCharacterView();
                    }
                }, 2500); // Aguardar mais tempo para efeitos PixiJS
            }, 500);
            return;
        }
    } else {
        processSpecialEffects();
    }
    
    // Função para processar efeitos especiais
    function processSpecialEffects() {
        console.log("Processando efeitos especiais de skill especial");
        
        // ANIMATION_ACTIVATE_1 - Efeito frontal (character front)
        if (hasVisualEffect1) {
            if (isPixiEffect(hasVisualEffect1)) {
                console.log("🎭 Aplicando PixiJS activate_1:", hasVisualEffect1);
                setTimeout(() => {
                    playPixiEffect(hasVisualEffect1, 'character', 'front', 'applySpecialSkillVisualEffect_activate_1');
                }, delay * 3); // Sincronizar com sound_effect_1
            } else {
                console.log("🖼️ Aplicando sprite activate_1:", hasVisualEffect1);
                // Usar sistema existente de sprites para character
                setTimeout(() => {
                    createSpriteAnimationLayers(hasVisualEffect1, 'front');
                }, delay * 3);
            }
        }
        
        // ANIMATION_ACTIVATE_2 - Efeito traseiro (character back)  
        if (hasVisualEffect2) {
            if (isPixiEffect(hasVisualEffect2)) {
                console.log("🎭 Aplicando PixiJS activate_2:", hasVisualEffect2);
                setTimeout(() => {
                    playPixiEffect(hasVisualEffect2, 'character', 'back', 'applySpecialSkillVisualEffect_activate_2');
                }, delay * 3); // Sincronizar com sound_effect_1
            } else {
                console.log("🖼️ Aplicando sprite activate_2:", hasVisualEffect2);
                // Usar sistema existente de sprites para character
                setTimeout(() => {
                    createSpriteAnimationLayers(hasVisualEffect2, 'back');
                }, delay * 3);
            }
        }
    }
    
    // Função para criar sprites (manter sistema existente)
    function createSpriteAnimationLayers(imageUrl, layer) {
        console.log("Criando sprite de skill especial:", imageUrl, "camada:", layer);
        
        const characterContainer = document.getElementById('character');
        if (!characterContainer) {
            console.error("Container do personagem não encontrado");
            return;
        }
        
        // Remover camadas anteriores
        document.querySelectorAll('.skill-fx-layer').forEach(el => el.remove());
        
        const fxLayer = document.createElement('div');
        fxLayer.className = `skill-fx-layer skill-fx-${layer}`;
        
        fxLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url("${imageUrl}");
            background-repeat: no-repeat;
            background-position: 0 0;
            background-size: cover;
            opacity: 0;
            pointer-events: none;
            z-index: ${layer === 'front' ? '12' : '8'};
        `;
        
        characterContainer.appendChild(fxLayer);
        
        // Aplicar animação
        void fxLayer.offsetWidth;
        fxLayer.style.opacity = '1';
        fxLayer.classList.add('animate-skill-fx');
        
        // Remover após animação
        setTimeout(() => {
            fxLayer.remove();
        }, 1200);
    }
}

// Verificar imagem de sprite
function checkSpriteImage(imageUrl) {
    if (!imageUrl) return;
    
    const img = new Image();
    img.onload = function() {
        console.log(`Sprite carregada: ${imageUrl}`);
        console.log(`Dimensões: ${img.width}x${img.height}`);
        
        // Calcular número de frames
        const estimatedFrames = Math.round(img.width / (img.height));
        console.log(`Número estimado de frames: ${estimatedFrames}`);
        
        // Verificar se o CSS precisa ser ajustado
        if (img.width !== 2816) {
            console.warn(`AVISO: A largura da sprite (${img.width}px) não corresponde à largura esperada (2816px).`);
            console.warn(`Ajuste o valor em @keyframes skill-fx-animation para -${img.width}px`);
        }
    };
    
    img.onerror = function() {
        console.error(`Erro ao carregar sprite: ${imageUrl}`);
    };
    
    img.src = imageUrl;
}

// Expor funções globalmente
window.populateAttackOptions = populateAttackOptions;
window.populateSpecialOptions = populateSpecialOptions;
window.getSkillClass = getSkillClass;
window.useAttackSkill = useAttackSkill;
window.useSpecialSkill = useSpecialSkill;
window.applySpecialSkillVisualEffect = applySpecialSkillVisualEffect;
window.checkSpriteImage = checkSpriteImage;