/**
 * Sistema de Display de Acúmulos de Sangue Coagulado (Vlad)
 * Os acúmulos estão NO PRÓPRIO VLAD, não no inimigo
 */

class BloodStacksDisplay {
    constructor() {
        this.container = null;
        this.currentStacks = 0;
        this.init();
    }

    init() {
        // Criar container para os acúmulos
        this.container = document.createElement('div');
        this.container.id = 'blood-stacks-display';
        this.container.className = 'blood-stacks-container';
        this.container.style.display = 'none'; // Oculto por padrão

        // Adicionar ao DOM próximo do HUD do player
        const playerHud = document.querySelector('.player-hud') || document.querySelector('.battle-container');
        if (playerHud) {
            playerHud.appendChild(this.container);
            console.log('✅ Blood Stacks Display inicializado');
        } else {
            console.warn('⚠️ Não foi possível encontrar .player-hud para adicionar blood stacks display');
        }
    }

    /**
     * Atualiza o display com o número atual de acúmulos
     * @param {number} stacks - Número de acúmulos
     */
    update(stacks) {
        if (typeof stacks !== 'number') {
            console.error('Blood stacks deve ser um número, recebido:', stacks);
            return;
        }

        this.currentStacks = stacks;

        if (stacks <= 0) {
            this.hide();
            return;
        }

        // Mostrar e atualizar
        this.show();
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="blood-stacks-content">
                <div class="blood-stacks-icon">🩸</div>
                <div class="blood-stacks-info">
                    <div class="blood-stacks-label">Sangue Coagulado</div>
                    <div class="blood-stacks-count">${this.currentStacks}</div>
                </div>
            </div>
        `;
    }

    show() {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Animação ao adicionar acúmulos
     */
    animateAdd(amount) {
        if (!this.container) return;

        this.container.classList.add('pulse-animation');
        setTimeout(() => {
            this.container.classList.remove('pulse-animation');
        }, 600);

        // Mostrar valor adicionado
        const addIndicator = document.createElement('div');
        addIndicator.className = 'blood-stacks-add-indicator';
        addIndicator.textContent = `+${amount}`;
        this.container.appendChild(addIndicator);

        setTimeout(() => {
            addIndicator.remove();
        }, 1000);
    }

    /**
     * Animação ao consumir acúmulos
     */
    animateConsume(amount) {
        if (!this.container) return;

        this.container.classList.add('consume-animation');
        setTimeout(() => {
            this.container.classList.remove('consume-animation');
        }, 600);
    }
}

// Criar instância global
window.bloodStacksDisplay = new BloodStacksDisplay();

console.log('📦 blood-display.js carregado');
