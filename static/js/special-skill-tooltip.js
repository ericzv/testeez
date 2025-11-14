/**
 * Sistema de Tooltip para Skills Especiais
 * Mostra informações detalhadas sobre cada skill especial quando o mouse passa sobre o botão
 */

class SpecialSkillTooltip {
    constructor() {
        this.tooltip = null;
        this.currentSkill = null;
        this.hideTimeout = null;
        this.init();
    }

    init() {
        // Criar elemento do tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'special-skill-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);

        console.log('✅ Special Skill Tooltip inicializado');
    }

    /**
     * Mostra o tooltip para uma skill específica
     * @param {HTMLElement} button - Botão da skill
     * @param {Object} skill - Dados da skill
     */
    show(button, skill) {
        if (!this.tooltip) return;

        // Cancelar timeout de hide se existir
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.currentSkill = skill;

        // Renderizar conteúdo
        this.render(skill);

        // Posicionar tooltip
        this.position(button);

        // Mostrar tooltip
        this.tooltip.style.display = 'block';
        setTimeout(() => {
            this.tooltip.classList.add('visible');
        }, 10);
    }

    /**
     * Esconde o tooltip
     */
    hide() {
        if (!this.tooltip) return;

        // Delay de 100ms antes de esconder (para evitar flickering)
        this.hideTimeout = setTimeout(() => {
            this.tooltip.classList.remove('visible');
            setTimeout(() => {
                this.tooltip.style.display = 'none';
                this.currentSkill = null;
            }, 200);
        }, 100);
    }

    /**
     * Renderiza o conteúdo do tooltip
     * @param {Object} skill - Dados da skill
     */
    render(skill) {
        const iconPath = skill.icon || '/static/game.data/icons/icon1.png';

        // Determinar descrição e efeitos baseado no ID
        const skillInfo = this.getSkillInfo(skill);

        let html = `
            <div class="tooltip-content">
                <div class="tooltip-header">
                    <div class="tooltip-icon" style="background-image: url('${iconPath}')"></div>
                    <div class="tooltip-header-info">
                        <div class="tooltip-skill-name">${skill.name}</div>
                        <div class="tooltip-type">Habilidade Especial</div>
                    </div>
                </div>
                <div class="tooltip-body">
                    <div class="tooltip-description">${skillInfo.description}</div>
        `;

        // Custos
        if (skillInfo.costs && skillInfo.costs.length > 0) {
            html += '<div class="tooltip-costs">';
            skillInfo.costs.forEach(cost => {
                html += `
                    <div class="tooltip-cost-item">
                        <span class="tooltip-cost-icon">${cost.icon}</span>
                        <span class="tooltip-cost-value">${cost.value}</span>
                        <span class="tooltip-cost-label">${cost.label}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Efeitos
        if (skillInfo.effects && skillInfo.effects.length > 0) {
            html += `
                <div class="tooltip-effects">
                    <div class="tooltip-effects-title">Efeitos</div>
            `;
            skillInfo.effects.forEach(effect => {
                html += `
                    <div class="tooltip-effect-item">
                        <span class="tooltip-effect-icon">${effect.icon}</span>
                        <span class="tooltip-effect-text">${effect.text}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Blood stacks info
        if (skillInfo.bloodInfo) {
            html += `
                <div class="tooltip-blood-info">
                    <div class="tooltip-blood-item">
                        <span class="tooltip-blood-icon">🩸</span>
                        <span class="tooltip-blood-text">${skillInfo.bloodInfo}</span>
                    </div>
                </div>
            `;
        }

        html += `
                </div>
                <div class="tooltip-footer">
                    ${skillInfo.footer}
                </div>
            </div>
        `;

        this.tooltip.innerHTML = html;
    }

    /**
     * Retorna informações específicas de cada skill
     * @param {Object} skill - Dados da skill
     * @returns {Object} - Informações formatadas da skill
     */
    getSkillInfo(skill) {
        const skillData = {
            138: { // Autofagia
                description: 'Sacrifique sua própria vitalidade para acumular poder sanguíneo e fortalecer seu próximo ataque.',
                costs: [
                    { icon: '❤️', value: '7', label: 'HP' }
                ],
                effects: [
                    { icon: '🩸', text: 'Gera 3 Sangue Coagulado' },
                    { icon: '⚔️', text: '+5 de dano no próximo ataque' }
                ],
                bloodInfo: 'Gera <span class="tooltip-blood-value">+3</span> acúmulos',
                footer: 'Use estrategicamente antes de ataques poderosos'
            },
            139: { // Lâmina de Sangue
                description: 'Consome todo o Sangue Coagulado para desferir um ataque devastador. Cada acúmulo aumenta o poder do golpe.',
                costs: [
                    { icon: '⚡', value: '2', label: 'Energia' }
                ],
                effects: [
                    { icon: '⚔️', text: '2 de dano por acúmulo consumido' },
                    { icon: '💥', text: 'Dano aumenta com mais acúmulos' }
                ],
                bloodInfo: 'Consome <span class="tooltip-blood-value">TODOS</span> os acúmulos',
                footer: 'Máximo dano com muitos acúmulos'
            },
            140: { // Barreira de Sangue
                description: 'Solidifica o sangue em uma barreira protetora. Cada acúmulo gera 2 pontos de escudo.',
                costs: [
                    { icon: '⚡', value: '3', label: 'Energia' }
                ],
                effects: [
                    { icon: '🛡️', text: '2 de barreira por acúmulo consumido' },
                    { icon: '🩹', text: 'Protege contra dano recebido' }
                ],
                bloodInfo: 'Consome <span class="tooltip-blood-value">TODOS</span> os acúmulos',
                footer: 'Use antes de receber ataques poderosos'
            },
            141: { // Regeneração
                description: 'Canaliza o poder do sangue para regenerar ferimentos. Cada acúmulo restaura 1 ponto de vida.',
                costs: [
                    { icon: '⚡', value: '2', label: 'Energia' }
                ],
                effects: [
                    { icon: '💚', text: '1 de cura por acúmulo consumido' },
                    { icon: '🩹', text: 'Restaura HP perdido' }
                ],
                bloodInfo: 'Consome <span class="tooltip-blood-value">TODOS</span> os acúmulos',
                footer: 'Cura emergencial em batalha'
            }
        };

        return skillData[skill.id] || {
            description: skill.description || 'Habilidade especial poderosa.',
            costs: [],
            effects: [],
            bloodInfo: null,
            footer: 'Clique para usar'
        };
    }

    /**
     * Posiciona o tooltip próximo ao botão
     * @param {HTMLElement} button - Botão da skill
     */
    position(button) {
        const buttonRect = button.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        const spacing = 12;

        // Posição padrão: acima do botão centralizado
        let top = buttonRect.top - tooltipRect.height - spacing;
        let left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);

        // Se não couber acima, colocar abaixo
        if (top < 10) {
            top = buttonRect.bottom + spacing;
        }

        // Ajustar se sair da tela pela esquerda
        if (left < 10) {
            left = 10;
        }

        // Ajustar se sair da tela pela direita
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }
}

// Criar instância global
window.specialSkillTooltip = new SpecialSkillTooltip();

console.log('📦 special-skill-tooltip.js carregado');
