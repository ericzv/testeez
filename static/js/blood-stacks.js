/**
 * blood-stacks.js
 * Sistema de gerenciamento visual dos Acúmulos de Sangue Coagulado
 */

class BloodStacksManager {
  constructor() {
    this.container = document.getElementById('blood-stacks-container');
    this.currentStacks = 0;
    this.iconPath = '/static/game.data/icons/blood_charge.png';
  }

  /**
   * Atualiza o display de acúmulos de sangue
   * @param {number} stacks - Número de acúmulos atuais
   * @param {boolean} animated - Se deve animar a mudança
   */
  updateStacks(stacks, animated = true) {
    console.log(`🩸 Atualizando acúmulos: ${this.currentStacks} → ${stacks}`);

    if (stacks === 0) {
      this.clearStacks(animated);
      return;
    }

    // Mostrar container se estiver oculto
    if (this.container.style.display === 'none') {
      this.container.style.display = 'flex';
    }

    // Adicionar classe se houver muitos acúmulos
    if (stacks > 8) {
      this.container.classList.add('many-stacks');
    } else {
      this.container.classList.remove('many-stacks');
    }

    // Se aumentou os acúmulos, adicionar novos ícones
    if (stacks > this.currentStacks) {
      const toAdd = stacks - this.currentStacks;
      for (let i = 0; i < toAdd; i++) {
        this.addStackIcon(animated);
      }
    }
    // Se diminuiu, remover ícones
    else if (stacks < this.currentStacks) {
      const toRemove = this.currentStacks - stacks;
      this.removeStackIcons(toRemove, animated);
    }

    this.currentStacks = stacks;
  }

  /**
   * Adiciona um ícone de acúmulo
   * @param {boolean} animated - Se deve animar a entrada
   */
  addStackIcon(animated = true) {
    const icon = document.createElement('img');
    icon.src = this.iconPath;
    icon.className = 'blood-stack-icon';
    icon.alt = 'Sangue Coagulado';

    if (animated) {
      // Adiciona animação de pulso após fade-in
      setTimeout(() => {
        icon.classList.add('pulse');
        setTimeout(() => icon.classList.remove('pulse'), 1000);
      }, 300);
    }

    this.container.appendChild(icon);
  }

  /**
   * Remove ícones de acúmulo
   * @param {number} count - Quantidade a remover
   * @param {boolean} animated - Se deve animar a saída (explosão)
   */
  removeStackIcons(count, animated = true) {
    const icons = this.container.querySelectorAll('.blood-stack-icon');
    const toRemove = Math.min(count, icons.length);

    for (let i = 0; i < toRemove; i++) {
      const icon = icons[icons.length - 1 - i];

      if (animated) {
        // Animação de explosão
        icon.classList.add('consuming');
        setTimeout(() => icon.remove(), 500);
      } else {
        icon.remove();
      }
    }
  }

  /**
   * Limpa todos os acúmulos
   * @param {boolean} animated - Se deve animar a limpeza
   */
  clearStacks(animated = true) {
    console.log('🩸 Limpando todos os acúmulos');

    if (animated) {
      const icons = this.container.querySelectorAll('.blood-stack-icon');
      icons.forEach((icon, index) => {
        setTimeout(() => {
          icon.classList.add('consuming');
          setTimeout(() => icon.remove(), 500);
        }, index * 50); // Escalonar as animações
      });

      // Ocultar container após todas as animações
      setTimeout(() => {
        this.container.innerHTML = '';
        this.container.style.display = 'none';
        this.container.classList.remove('many-stacks');
      }, icons.length * 50 + 500);
    } else {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      this.container.classList.remove('many-stacks');
    }

    this.currentStacks = 0;
  }

  /**
   * Anima adição de acúmulos (chamada quando Vlad ataca)
   * @param {number} count - Quantidade de acúmulos adicionados
   */
  animateAdd(count) {
    console.log(`🩸 Animando adição de ${count} acúmulos`);
    const newTotal = this.currentStacks + count;
    this.updateStacks(newTotal, true);
  }

  /**
   * Anima consumo de acúmulos (chamada quando usa skills ou Suprema)
   * @param {number} count - Quantidade de acúmulos consumidos (0 = todos)
   */
  animateConsume(count = 0) {
    const toConsume = count === 0 ? this.currentStacks : count;
    console.log(`💀 Animando consumo de ${toConsume} acúmulos`);

    if (toConsume === this.currentStacks) {
      this.clearStacks(true);
    } else {
      this.updateStacks(this.currentStacks - toConsume, true);
    }
  }

  /**
   * Define o número de acúmulos sem animação (para sincronização inicial)
   * @param {number} stacks - Número de acúmulos
   */
  setStacks(stacks) {
    console.log(`🩸 Definindo acúmulos sem animação: ${stacks}`);
    this.clearStacks(false);
    this.currentStacks = stacks;
    this.updateStacks(stacks, false);
  }

  /**
   * Retorna o número atual de acúmulos
   * @returns {number}
   */
  getCurrentStacks() {
    return this.currentStacks;
  }
}

// Criar instância global
window.bloodStacksManager = new BloodStacksManager();

console.log('✅ BloodStacksManager inicializado');
