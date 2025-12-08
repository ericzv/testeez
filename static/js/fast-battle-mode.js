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
    this.isExecuting = false; // Flag para prevenir cliques múltiplos

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

      console.log(`Tentativa ${attempts}: attack-button=${!!attackButton}, battleState=${!!window.gameState}`);

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
        this.attacks = data.attacks.map(attack => {
          // Mapear tipo de skill para ícone correto
          let icon = '/static/game.data/icons/attack.png';

          if (attack.skill_type === 'attack') {
            icon = '/static/game.data/icons/atk1.png';
          } else if (attack.skill_type === 'power') {
            icon = '/static/game.data/icons/atk2.png';
          } else if (attack.skill_type === 'special') {
            icon = '/static/game.data/icons/atk3.png';
          } else if (attack.skill_type === 'ultimate') {
            icon = '/static/game.data/icons/atk4.png';
          }

          return {
            ...attack,
            icon: icon
          };
        });
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

      console.log('📦 Inventário recebido:', data);

      if (data.success && data.items) {
        this.items = data.items;
        console.log('📦 Items carregados:', this.items.length);
      } else {
        this.items = [];
        console.log('⚠️ Nenhum item encontrado no inventário');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
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

  async toggleSubmenu(type) {
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
    const activeButton = document.querySelector(`.fast-battle-btn[data-type="${type}"]`);
    activeButton.classList.add('active');

    // Recarregar dados sempre que abrir submenu (para pegar estado atualizado)
    if (type === 'attacks') {
      await this.loadAttacks(); // Recarregar para pegar is_disabled atualizado
    } else if (type === 'inventory') {
      await this.loadItems();
    }

    // Criar submenu ao lado do botão clicado
    this.createSubmenu(type, activeButton);
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

  createSubmenu(type, buttonElement) {
    const submenu = document.createElement('div');
    submenu.className = 'fast-battle-submenu active';

    // Calcular posição do submenu baseado no botão
    const buttonRect = buttonElement.getBoundingClientRect();
    const containerRect = buttonElement.parentElement.getBoundingClientRect();
    const topOffset = buttonRect.top - containerRect.top;

    submenu.style.top = `${topOffset}px`;

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

        // Adicionar classe attack-icon APENAS para ataques (para ter outline branco)
        if (type === 'attacks') {
          btn.classList.add('attack-icon');
        }

        // Definir ícone de fundo via CSS custom property (para o ::before pegar)
        if (item.icon) {
          btn.style.setProperty('--icon-url', `url('${item.icon}')`);
        }

        // Verificar se skill foi desabilitada
        if (type === 'attacks' && item.is_disabled) {
          btn.classList.add('disabled');
          if (item.disabled_by_relic_id) {
            btn.classList.add('relic-disabled');
          }
          btn.title = item.disabled_reason || 'Desabilitada';
          console.log(`🔒 Skill ${item.name} desabilitada no modo rápido: ${item.disabled_reason}`);
        }

        // Verificar se tem recursos suficientes
        const hasEnoughResources = this.checkResources(item, type);
        if (!hasEnoughResources) {
          btn.classList.add('disabled');
        }

        // Mostrar custo de energia para ataques
        if (type === 'attacks') {
          const energyCost = item.points_cost || item.energy_cost || 1;
          if (energyCost > 0) {
            const cost = document.createElement('div');
            cost.className = 'fast-action-cost energy';
            cost.textContent = energyCost;
            btn.appendChild(cost);
          }
        } else if (type === 'inventory' && item.quantity) {
          // Mostrar quantidade para itens
          const cost = document.createElement('div');
          cost.className = 'fast-action-cost quantity';
          cost.textContent = `x${item.quantity}`;
          btn.appendChild(cost);
        }

        // Event listener APENAS se não está desabilitado e tem recursos
        const isDisabled = (type === 'attacks' && item.is_disabled) || !hasEnoughResources;
        if (!isDisabled) {
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

    // Atualizar estado dos botões quando battleState estiver pronto
    const checkAndUpdate = () => {
      if (window.gameState && window.gameState.player) {
        this.updateButtonStates();
      } else {
        // Tentar novamente em 200ms
        setTimeout(checkAndUpdate, 200);
      }
    };
    setTimeout(checkAndUpdate, 200);
  }

  checkResources(item, type) {
    if (type === 'attacks') {
      // VERIFICAÇÃO 1: Skill desabilitada por relíquia
      if (item.is_disabled) {
        console.log(`❌ checkResources: Skill ${item.name} desabilitada - ${item.disabled_reason}`);
        return false;
      }

      // VERIFICAÇÃO 2: Energia suficiente
      if (!window.gameState || !window.gameState.player) {
        console.log('⚠️ checkResources: gameState não disponível');
        return true; // Permitir otimisticamente na criação, será verificado no executeAction
      }

      const player = window.gameState.player;
      const cost = item.points_cost || item.energy_cost || 1;
      const hasEnough = player.energy >= cost;
      console.log(`checkResources (attack): energia=${player.energy}, custo=${cost}, ok=${hasEnough}`);
      return hasEnough;
    } else if (type === 'specials') {
      // Especiais sempre permitidos (sem custo de mana)
      return true;
    } else if (type === 'inventory') {
      return item.quantity > 0;
    }
    return true;
  }

  // Atualizar estado dos botões quando energia mudar
  updateButtonStates() {
    if (!window.gameState || !window.gameState.player) return;

    const player = window.gameState.player;

    // Atualizar botões de ataque
    document.querySelectorAll('.fast-action-btn[data-type="attacks"]').forEach(btn => {
      const skillId = parseInt(btn.dataset.id);
      const skill = this.attacks.find(s => s.id === skillId);

      if (skill) {
        const cost = skill.points_cost || skill.energy_cost || 1;
        const hasEnough = player.energy >= cost;

        if (!hasEnough || skill.is_disabled) {
          btn.classList.add('disabled');
          btn.style.pointerEvents = 'none';
        } else {
          btn.classList.remove('disabled');
          btn.style.pointerEvents = 'auto';
        }
      }
    });
  }

  async executeAction(item, type) {
    // PREVENIR SPAM EXTREMO (debounce curto)
    if (this.isExecuting) {
      console.log('⏸️ Debounce ativo, aguarde...');
      return;
    }

    console.log(`⚡ Executando ação rápida: ${item.name} (${type})`);

    // VERIFICAÇÃO CRÍTICA PARA ATAQUES: battleState DEVE existir
    if (type === 'attacks') {
      if (!window.gameState || !window.gameState.player) {
        console.log('❌ gameState não disponível, BLOQUEANDO ataque!');
        showFloatingText('Sistema não pronto, aguarde...', 'error');
        this.closeSubmenu();
        return;
      }

      // Verificar se skill está desabilitada
      if (item.is_disabled) {
        console.log('❌ Skill desabilitada!');
        showFloatingText(item.disabled_reason || 'Skill desabilitada', 'error');
        this.closeSubmenu();
        return;
      }

      // VALIDAÇÃO RIGOROSA DE ENERGIA
      const energyCost = item.points_cost || item.energy_cost || 1;
      const currentEnergy = window.gameState.player.energy;

      if (currentEnergy < energyCost) {
        console.log(`❌ Energia insuficiente! Precisa: ${energyCost}, Tem: ${currentEnergy}`);
        showFloatingText('Energia insuficiente!', 'error');
        this.closeSubmenu();
        return;
      }

      console.log(`✅ Energia OK: ${currentEnergy} >= ${energyCost}`);
    }

    // Verificar inventário
    if (type === 'inventory' && item.quantity <= 0) {
      showFloatingText('Slot vazio ou poção indisponível!', 'error');
      this.closeSubmenu();
      return;
    }

    // BLOQUEAR TEMPORARIAMENTE (debounce curto)
    this.isExecuting = true;

    // Fechar submenu
    this.closeSubmenu();

    if (type === 'attacks') {

      // Chamar triggerAttack que faz POST + animação + atualização
      if (window.triggerAttack) {
        console.log(`🎯 Chamando triggerAttack(${item.id})`);
        window.triggerAttack(item.id);

        // Sincronizar energia após ataque (com delay para servidor processar)
        setTimeout(async () => {
          await this.updateHUDFromServer();
        }, 800);
      } else {
        console.error('❌ triggerAttack não disponível');
        this.isExecuting = false;
        return;
      }

      // Desbloquear rapidamente (permitir ataques consecutivos rápidos)
      setTimeout(() => {
        this.isExecuting = false;
        console.log('✅ Modo rápido desbloqueado para próximo ataque');
      }, 200); // Debounce curto para ataques rápidos

    } else if (type === 'specials') {
      // Executar especial usando a função do sistema de batalha (COM animações/sons)
      if (window.useSpecialSkill) {
        window.useSpecialSkill(item.id, item.name);

        // DESBLOQUEAR após tempo suficiente para animações
        setTimeout(() => {
          this.isExecuting = false;
          console.log('✅ Ação de especial finalizada, desbloqueado');
        }, 3000); // 3 segundos para animação completa
      } else {
        console.warn('⚠️ useSpecialSkill não disponível, usando método direto');
        await this.executeSpecialDirect(item.id);
        setTimeout(() => {
          this.isExecuting = false;
        }, 1200);
      }
    } else if (type === 'inventory') {
      // Usar poção diretamente
      await this.usePotionDirect(item.slot_number);

      // DESBLOQUEAR após poção
      setTimeout(() => {
        this.isExecuting = false;
        console.log('✅ Ação de poção finalizada, desbloqueado');
      }, 1200);
    }
  }

  async executeSpecialDirect(skillId) {
    try {
      const response = await fetch('/gamification/use_special', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: `skill_id=${skillId}`
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Especial usado com sucesso:', data);

        // Mostrar apenas a mensagem principal (menor e legível)
        if (data.message) {
          showFloatingText(data.message, 'info');
        }

        // Atualizar HUD IMEDIATAMENTE (não aguardar)
        this.updateHUDFromServer();

        // Forçar update do HUD do sistema de batalha também
        if (window.updatePlayerHUD) {
          window.updatePlayerHUD();
        }

        // Atualizar novamente após delays curtos (múltiplas tentativas)
        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 200);

        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 500);

        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 1000);

      } else {
        showFloatingText(data.message || 'Erro ao usar especial', 'error');
      }
    } catch (error) {
      console.error('Erro ao executar especial:', error);
      showFloatingText('Erro ao usar especial', 'error');
    }
  }

  async updateHUDFromServer() {
    try {
      // Buscar dados atualizados do jogador
      const response = await fetch('/gamification/player_status');
      const data = await response.json();

      if (data.success && window.gameState) {
        // Atualizar battleState
        window.gameState.player.hp = data.hp;
        window.gameState.player.max_hp = data.max_hp;
        window.gameState.player.energy = data.energy;
        window.gameState.player.barrier = data.barrier || 0;

        console.log('✅ HUD atualizado do servidor:', data);
        console.log('🛡️ Barreira atualizada:', data.barrier);

        // Forçar atualização visual do HUD múltiplas vezes para garantir
        if (window.updatePlayerHUD) {
          window.updatePlayerHUD();

          // Tentar novamente após delays variados (fallback)
          setTimeout(() => {
            window.updatePlayerHUD();
          }, 100);

          setTimeout(() => {
            window.updatePlayerHUD();
          }, 300);
        }

        // Atualizar blood stacks se disponível
        if (window.updateBloodStacksDisplay && data.blood_stacks !== undefined) {
          window.updateBloodStacksDisplay(data.blood_stacks);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar HUD:', error);
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

        // Mostrar feedback visual IMEDIATAMENTE
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

        // Atualizar HUD IMEDIATAMENTE (não aguardar)
        this.updateHUDFromServer();

        // Forçar update do HUD do sistema de batalha também
        if (window.updatePlayerHUD) {
          window.updatePlayerHUD();
        }

        // Recarregar inventário em paralelo
        this.loadItems();

        // Atualizar novamente após delays curtos (múltiplas tentativas)
        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 200);

        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 500);

        setTimeout(() => {
          this.updateHUDFromServer();
          if (window.updatePlayerHUD) window.updatePlayerHUD();
        }, 1000);
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
    font-size: 24px;
    font-weight: bold;
    color: ${type === 'heal' ? '#2ecc71' : type === 'barrier' ? '#3498db' : type === 'energy' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#fff'};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
    z-index: 99999;
    animation: floatUp 2.5s ease-out forwards;
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    max-width: 80%;
    text-align: center;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 2500);
}

// Adicionar animação CSS
const fastBattleStyle = document.createElement('style');
fastBattleStyle.textContent = `
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
document.head.appendChild(fastBattleStyle);

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fastBattle = new FastBattleMode();
  });
} else {
  window.fastBattle = new FastBattleMode();
}
