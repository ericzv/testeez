/* ================================================================================
   FAST BATTLE MODE - Sistema de Atalhos Rápidos na Batalha
   ================================================================================

   Adiciona botões de atalho circulares na tela de batalha para acesso rápido
   a ataques, especiais e inventário, com animações abreviadas.
*/

class FastBattleMode {
  constructor() {
    this.active = false;
    this.currentSubmenu = null;
    this.attacks = [];
    this.specials = [];
    this.items = [];

    // Aguardar carregamento completo da batalha
    this.waitForBattleReady();
  }

  waitForBattleReady() {
    // Verificar se estamos na página de batalha
    if (!window.location.pathname.includes('/battle')) {
      console.log('Fast Battle Mode: Não estamos na página de batalha');
      return;
    }

    console.log('Fast Battle Mode: Aguardando sistema de batalha...');

    // Aguardar o sistema de batalha estar pronto
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos (100 * 100ms)

    const checkReady = setInterval(() => {
      attempts++;

      // Verificar se elementos necessários existem
      const attackButton = document.getElementById('attack-button');

      console.log(`Tentativa ${attempts}: attack-button=${!!attackButton}, battleState=${!!window.battleState}`);

      // Inicializar se o botão de ataque existir (não precisa esperar battleState)
      if (attackButton) {
        console.log('✅ Elementos encontrados! Inicializando...');
        clearInterval(checkReady);
        this.init();
        return;
      }

      // Timeout
      if (attempts >= maxAttempts) {
        console.error('❌ Timeout: Sistema de batalha não carregou a tempo');
        clearInterval(checkReady);
      }
    }, 100);
  }

  async init() {
    console.log('🚀 Inicializando Modo Rápido de Batalha...');

    // Carregar dados
    await this.loadAttacks();
    await this.loadSpecials();
    await this.loadItems();

    // Criar UI
    this.createUI();

    this.active = true;
    console.log('✅ Modo Rápido de Batalha ativado!');
  }

  async loadAttacks() {
    try {
      const response = await fetch('/gamification/player/attacks');
      const data = await response.json();

      if (data.success && data.attacks) {
        this.attacks = data.attacks.map(attack => ({
          ...attack,
          icon: attack.icon || attack.animation_fx_a || '/static/game.data/icons/attack.png'
        }));
      } else {
        this.attacks = [];
      }
    } catch (error) {
      console.error('Erro ao carregar ataques:', error);
      this.attacks = [];
    }
  }

  async loadSpecials() {
    try {
      const response = await fetch('/gamification/player/specials');
      const data = await response.json();

      if (data.success && data.specials) {
        this.specials = data.specials.map(special => ({
          ...special,
          icon: special.icon || special.animation_fx_a || '/static/game.data/icons/special.png'
        }));
      } else {
        this.specials = [];
      }
    } catch (error) {
      console.error('Erro ao carregar especiais:', error);
      this.specials = [];
    }
  }

  async loadItems() {
    try {
      const response = await fetch('/gamification/player/inventory');
      const data = await response.json();

      if (data.success && data.items) {
        this.items = data.items;
      } else {
        this.items = [];
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      this.items = [];
    }
  }

  createUI() {
    // Container principal dos botões de atalho
    const container = document.createElement('div');
    container.className = 'fast-battle-container';
    container.innerHTML = `
      <div class="fast-battle-btn attacks" data-type="attacks" title="Atalho de Ataques">
        Ataques
      </div>
      <div class="fast-battle-btn specials" data-type="specials" title="Atalho de Especiais">
        Especiais
      </div>
      <div class="fast-battle-btn inventory" data-type="inventory" title="Atalho de Inventário">
        Inventário
      </div>
    `;

    // Adicionar ao body
    document.body.appendChild(container);

    // Event listeners
    container.querySelectorAll('.fast-battle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSubmenu(e.target.dataset.type);
      });
    });

    // Fechar submenu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.fast-battle-container')) {
        this.closeSubmenu();
      }
    });
  }

  toggleSubmenu(type) {
    // Se já está aberto, fechar
    if (this.currentSubmenu === type) {
      this.closeSubmenu();
      return;
    }

    // Fechar submenu anterior
    this.closeSubmenu();

    // Abrir novo submenu
    this.currentSubmenu = type;

    // Adicionar classe active ao botão
    document.querySelectorAll('.fast-battle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.fast-battle-btn[data-type="${type}"]`).classList.add('active');

    // Criar submenu
    this.createSubmenu(type);
  }

  closeSubmenu() {
    const existing = document.querySelector('.fast-battle-submenu');
    if (existing) {
      existing.remove();
    }

    document.querySelectorAll('.fast-battle-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    this.currentSubmenu = null;
  }

  createSubmenu(type) {
    const submenu = document.createElement('div');
    submenu.className = 'fast-battle-submenu active';

    let items = [];
    if (type === 'attacks') {
      items = this.attacks;
    } else if (type === 'specials') {
      items = this.specials;
    } else if (type === 'inventory') {
      items = this.items;
    }

    if (items.length === 0) {
      submenu.innerHTML = '<div style="color: #999; padding: 20px; text-align: center;">Nenhum item disponível</div>';
    } else {
      // Criar botões para cada item
      items.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'fast-action-btn';
        btn.dataset.id = item.id;
        btn.dataset.type = type;
        btn.dataset.name = item.name;
        btn.title = item.name;

        // Definir ícone de fundo
        if (item.icon) {
          btn.style.backgroundImage = `url('${item.icon}')`;
        }

        // Verificar se tem recursos suficientes
        const hasEnoughResources = this.checkResources(item, type);
        if (!hasEnoughResources) {
          btn.classList.add('disabled');
        }

        // Mostrar custo
        if (type === 'attacks') {
          const energyCost = item.points_cost || item.energy_cost || 1;
          if (energyCost > 0) {
            const cost = document.createElement('div');
            cost.className = 'fast-action-cost';
            cost.textContent = energyCost;
            btn.appendChild(cost);
          }
        } else if (type === 'specials') {
          const manaCost = item.mana_cost || 0;
          if (manaCost > 0) {
            const cost = document.createElement('div');
            cost.className = 'fast-action-cost mana';
            cost.textContent = manaCost;
            btn.appendChild(cost);
          }
        } else if (type === 'inventory' && item.quantity) {
          const cost = document.createElement('div');
          cost.className = 'fast-action-cost';
          cost.textContent = `x${item.quantity}`;
          btn.appendChild(cost);
        }

        // Event listener
        if (hasEnoughResources) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.executeAction(item, type);
          });
        }

        submenu.appendChild(btn);
      });
    }

    // Adicionar ao container
    const container = document.querySelector('.fast-battle-container');
    container.appendChild(submenu);
  }

  checkResources(item, type) {
    // Se battleState não existe, permitir a ação (será verificado no servidor)
    if (!window.battleState || !window.battleState.player) {
      console.log('checkResources: battleState não disponível, permitindo ação');
      return true;
    }

    const player = window.battleState.player;

    if (type === 'attacks') {
      const cost = item.points_cost || item.energy_cost || 1;
      const hasEnough = player.energy >= cost;
      console.log(`checkResources (attack): energia=${player.energy}, custo=${cost}, ok=${hasEnough}`);
      return hasEnough;
    } else if (type === 'specials') {
      const cost = item.mana_cost || 0;
      const hasEnough = (player.mana || 0) >= cost;
      console.log(`checkResources (special): mana=${player.mana}, custo=${cost}, ok=${hasEnough}`);
      return hasEnough;
    } else if (type === 'inventory') {
      return item.quantity > 0;
    }
    return true;
  }

  executeAction(item, type) {
    console.log(`⚡ Executando ação rápida: ${item.name} (${type})`);

    // Fechar submenu
    this.closeSubmenu();

    if (type === 'attacks') {
      // Usar função existente do sistema de batalha
      if (window.triggerAttack) {
        window.triggerAttack(item.id);
      }
    } else if (type === 'specials') {
      // Abrir modal de especiais com a skill pré-selecionada
      if (window.openSpecialModal) {
        window.openSpecialModal(item.id);
      } else {
        // Fallback: executar diretamente
        this.executeSpecialDirect(item.id);
      }
    } else if (type === 'inventory') {
      // Usar poção diretamente
      this.usePotionDirect(item.slot_number);
    }
  }

  async executeSpecialDirect(skillId) {
    try {
      const response = await fetch('/gamification/use_special', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `skill_id=${skillId}`
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar página ou atualizar UI
        if (window.updatePlayerHUD) {
          window.updatePlayerHUD();
        }

        // Mostrar mensagem
        if (data.message) {
          showFloatingText(data.message, 'info');
        }
      } else {
        showFloatingText(data.message || 'Erro ao usar especial', 'error');
      }
    } catch (error) {
      console.error('Erro ao executar especial:', error);
      showFloatingText('Erro ao usar especial', 'error');
    }
  }

  async usePotionDirect(slotNumber) {
    try {
      const response = await fetch(`/gamification/use_potion/${slotNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Poção usada:', data.message);

        // Atualizar HUD do jogador
        if (window.updatePlayerHUD && data.player) {
          window.battleState.player.hp = data.player.hp;
          window.battleState.player.barrier = data.player.barrier || 0;
          window.battleState.player.energy = data.player.energy;
          window.updatePlayerHUD();
        }

        // Recarregar inventário
        await this.loadItems();

        // Mostrar feedback visual
        if (data.message.includes('vida')) {
          const healAmount = parseInt(data.message.match(/\d+/)?.[0] || 0);
          showFloatingText(`+${healAmount} HP`, 'heal');
        } else if (data.message.includes('barreira')) {
          const barrierAmount = parseInt(data.message.match(/\d+/)?.[0] || 0);
          showFloatingText(`+${barrierAmount} Barreira`, 'barrier');
        } else if (data.message.includes('energia')) {
          const energyAmount = parseInt(data.message.match(/\d+/)?.[0] || 0);
          showFloatingText(`+${energyAmount} Energia`, 'energy');
        }
      } else {
        showFloatingText(data.error || 'Erro ao usar poção', 'error');
      }
    } catch (error) {
      console.error('Erro ao usar poção:', error);
      showFloatingText('Erro ao usar poção', 'error');
    }
  }
}

// Função auxiliar para mostrar texto flutuante
function showFloatingText(text, type = 'info') {
  const feedback = document.createElement('div');
  feedback.className = `fast-battle-feedback ${type}`;
  feedback.textContent = text;
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: ${type === 'heal' ? '#2ecc71' : type === 'barrier' ? '#3498db' : type === 'energy' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#fff'};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
    z-index: 99999;
    animation: floatUp 1.5s ease-out forwards;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 1500);
}

// Adicionar animação CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    80% {
      opacity: 1;
      transform: translate(-50%, -70%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -90%) scale(0.8);
    }
  }
`;
document.head.appendChild(style);

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fastBattle = new FastBattleMode();
  });
} else {
  window.fastBattle = new FastBattleMode();
}
