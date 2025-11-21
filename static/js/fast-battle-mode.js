/* ================================================================================
   FAST BATTLE MODE - Sistema de Batalha Rápida
   ================================================================================

   Sistema que permite combate direto do hub sem entrar na view de batalha,
   com animações abreviadas e resultados imediatos.
*/

class FastBattleMode {
  constructor() {
    this.active = false;
    this.currentSubmenu = null;
    this.attacks = [];
    this.specials = [];
    this.items = [];
    this.playerStatus = null;
    this.enemyStatus = null;
    this.isProcessing = false;

    this.init();
  }

  async init() {
    // Verificar se há inimigo ativo
    const hasEnemy = await this.checkActiveEnemy();
    if (!hasEnemy) {
      console.log('Nenhum inimigo ativo, modo rápido desabilitado');
      return;
    }

    // Carregar dados
    await this.loadPlayerData();
    await this.loadAttacks();
    await this.loadSpecials();
    await this.loadItems();

    // Criar UI
    this.createUI();

    this.active = true;
    console.log('Modo Rápido de Batalha ativado!');
  }

  async checkActiveEnemy() {
    try {
      const response = await fetch('/gamification/battle_status');
      const data = await response.json();

      if (data.enemy) {
        this.enemyStatus = {
          id: data.enemy.id,
          name: data.enemy.name,
          hp: data.enemy.hp,
          max_hp: data.enemy.max_hp,
          energy: data.enemy.energy || 0,
          max_energy: data.enemy.max_energy || 100
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar inimigo:', error);
      return false;
    }
  }

  async loadPlayerData() {
    try {
      const response = await fetch('/gamification/player_status');
      const data = await response.json();

      this.playerStatus = {
        name: data.name,
        hp: data.hp,
        max_hp: data.max_hp,
        energy: data.energy || 100,
        max_energy: data.max_energy || 100,
        mana: data.mana || 0,
        max_mana: data.max_mana || 100
      };
    } catch (error) {
      console.error('Erro ao carregar dados do jogador:', error);
    }
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
    // Container principal
    const container = document.createElement('div');
    container.className = 'fast-battle-container';
    container.innerHTML = `
      <div class="fast-battle-btn attacks" data-type="attacks">
        Ataques
      </div>
      <div class="fast-battle-btn specials" data-type="specials">
        Especiais
      </div>
      <div class="fast-battle-btn inventory" data-type="inventory">
        Inventário
      </div>
    `;

    // Adicionar ao body
    document.body.appendChild(container);

    // Event listeners
    container.querySelectorAll('.fast-battle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.toggleSubmenu(e.target.dataset.type));
    });

    // Criar status do jogador e inimigo
    this.createStatusBars();

    // Criar loading spinner
    const loading = document.createElement('div');
    loading.className = 'fast-battle-loading';
    document.body.appendChild(loading);
  }

  createStatusBars() {
    // Status do jogador
    const playerBar = document.createElement('div');
    playerBar.className = 'fast-player-status';
    playerBar.innerHTML = `
      <div class="fast-player-name">${this.playerStatus.name}</div>
      <div class="fast-status-bar">
        <div class="fast-status-fill hp" style="width: ${(this.playerStatus.hp / this.playerStatus.max_hp) * 100}%">
          ${this.playerStatus.hp} / ${this.playerStatus.max_hp}
        </div>
      </div>
      <div class="fast-status-bar">
        <div class="fast-status-fill energy" style="width: ${(this.playerStatus.energy / this.playerStatus.max_energy) * 100}%">
          ⚡ ${this.playerStatus.energy}
        </div>
      </div>
    `;
    document.body.appendChild(playerBar);

    // Status do inimigo
    const enemyBar = document.createElement('div');
    enemyBar.className = 'fast-enemy-status';
    enemyBar.innerHTML = `
      <div class="fast-enemy-name">${this.enemyStatus.name}</div>
      <div class="fast-status-bar">
        <div class="fast-status-fill hp" style="width: ${(this.enemyStatus.hp / this.enemyStatus.max_hp) * 100}%">
          ${this.enemyStatus.hp} / ${this.enemyStatus.max_hp}
        </div>
      </div>
    `;
    document.body.appendChild(enemyBar);
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

    // Criar botões para cada item
    items.forEach(item => {
      const btn = document.createElement('div');
      btn.className = 'fast-action-btn';
      btn.dataset.id = item.id;
      btn.dataset.type = type;
      btn.dataset.name = item.name;

      // Definir ícone
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
        btn.addEventListener('click', () => this.executeAction(item, type));
      }

      submenu.appendChild(btn);
    });

    // Adicionar ao container
    const container = document.querySelector('.fast-battle-container');
    container.appendChild(submenu);
  }

  checkResources(item, type) {
    if (type === 'attacks') {
      const cost = item.points_cost || item.energy_cost || 1;
      return this.playerStatus.energy >= cost;
    } else if (type === 'specials') {
      const cost = item.mana_cost || 0;
      return this.playerStatus.mana >= cost;
    } else if (type === 'inventory') {
      return item.quantity > 0;
    }
    return true;
  }

  async executeAction(item, type) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.showLoading();

    try {
      let result;

      if (type === 'attacks') {
        result = await this.executeAttack(item);
      } else if (type === 'specials') {
        result = await this.executeSpecial(item);
      } else if (type === 'inventory') {
        result = await this.executeItem(item);
      }

      // Processar resultado
      if (result) {
        await this.processResult(result, type);
      }

      // Fechar submenu após ação
      this.closeSubmenu();

      // Verificar se inimigo foi derrotado
      if (result && result.enemy_defeated) {
        this.handleEnemyDefeated();
      } else {
        // Executar turno do inimigo
        await this.executeEnemyTurn();
      }

    } catch (error) {
      console.error('Erro ao executar ação:', error);
      this.showFeedback('Erro!', 'damage');
    } finally {
      this.hideLoading();
      this.isProcessing = false;
    }
  }

  async executeAttack(attack) {
    try {
      const response = await fetch('/gamification/damage_boss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `skill_id=${attack.id}&fast_mode=true`
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao executar ataque:', error);
      return null;
    }
  }

  async executeSpecial(special) {
    try {
      const response = await fetch('/gamification/use_special', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `skill_id=${special.id}&fast_mode=true`
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao executar especial:', error);
      return null;
    }
  }

  async executeItem(item) {
    try {
      const response = await fetch(`/gamification/use_potion/${item.slot_number}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      // Adaptar resposta para formato esperado
      if (data.success && data.player) {
        return {
          ...data,
          heal: data.message.includes('vida') ? parseInt(data.message.match(/\d+/)?.[0] || 0) : 0,
          barrier: data.message.includes('barreira') ? parseInt(data.message.match(/\d+/)?.[0] || 0) : 0
        };
      }

      return data;
    } catch (error) {
      console.error('Erro ao usar item:', error);
      return null;
    }
  }

  async processResult(result, type) {
    // Atualizar status do jogador
    if (result.player) {
      this.playerStatus.hp = result.player.hp;
      this.playerStatus.energy = result.player.energy;
      this.playerStatus.mana = result.player.mana;
      this.updatePlayerBar();
    }

    // Atualizar status do inimigo
    if (result.enemy) {
      this.enemyStatus.hp = result.enemy.hp;
      this.updateEnemyBar();
    }

    // Mostrar feedback visual
    if (type === 'attacks') {
      const isCritical = result.critical || false;
      const damage = result.damage || 0;
      this.showFeedback(`-${damage}`, isCritical ? 'critical' : 'damage');
    } else if (type === 'specials') {
      if (result.heal) {
        this.showFeedback(`+${result.heal}`, 'heal');
      } else if (result.barrier) {
        this.showFeedback(`🛡️ +${result.barrier}`, 'barrier');
      } else if (result.damage) {
        this.showFeedback(`-${result.damage}`, 'damage');
      }
    } else if (type === 'inventory') {
      if (result.heal) {
        this.showFeedback(`+${result.heal}`, 'heal');
      }
    }
  }

  async executeEnemyTurn() {
    try {
      // Processar turno do inimigo
      const endTurnResponse = await fetch('/gamification/end_player_turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'fast_mode=true'
      });

      const endTurnData = await endTurnResponse.json();

      // Executar ataques do inimigo
      if (endTurnData.enemy_actions) {
        for (const action of endTurnData.enemy_actions) {
          await this.sleep(300); // Pequeno delay entre ações

          const attackResponse = await fetch('/gamification/execute_enemy_attack', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'fast_mode=true'
          });

          const attackData = await attackResponse.json();

          // Atualizar HP do jogador
          if (attackData.player) {
            this.playerStatus.hp = attackData.player.hp;
            this.updatePlayerBar();
          }

          // Mostrar dano recebido
          if (attackData.damage > 0) {
            this.showFeedback(`-${attackData.damage}`, 'damage');
          } else if (attackData.dodged) {
            this.showFeedback('ESQUIVA!', 'heal');
          } else if (attackData.blocked) {
            this.showFeedback('BLOQUEIO!', 'barrier');
          }

          // Verificar se jogador morreu
          if (attackData.player_defeated) {
            this.handlePlayerDefeated();
            return;
          }
        }
      }

    } catch (error) {
      console.error('Erro ao executar turno do inimigo:', error);
    }
  }

  updatePlayerBar() {
    const bar = document.querySelector('.fast-player-status');
    if (bar) {
      bar.querySelector('.fast-status-fill.hp').style.width =
        `${(this.playerStatus.hp / this.playerStatus.max_hp) * 100}%`;
      bar.querySelector('.fast-status-fill.hp').textContent =
        `${this.playerStatus.hp} / ${this.playerStatus.max_hp}`;

      bar.querySelector('.fast-status-fill.energy').style.width =
        `${(this.playerStatus.energy / this.playerStatus.max_energy) * 100}%`;
      bar.querySelector('.fast-status-fill.energy').textContent =
        `⚡ ${this.playerStatus.energy}`;
    }
  }

  updateEnemyBar() {
    const bar = document.querySelector('.fast-enemy-status');
    if (bar) {
      bar.querySelector('.fast-status-fill.hp').style.width =
        `${(this.enemyStatus.hp / this.enemyStatus.max_hp) * 100}%`;
      bar.querySelector('.fast-status-fill.hp').textContent =
        `${this.enemyStatus.hp} / ${this.enemyStatus.max_hp}`;
    }
  }

  showFeedback(text, type) {
    const feedback = document.createElement('div');
    feedback.className = `fast-battle-feedback ${type}`;
    feedback.textContent = text;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 1000);
  }

  showLoading() {
    const loading = document.querySelector('.fast-battle-loading');
    if (loading) {
      loading.classList.add('active');
    }
  }

  hideLoading() {
    const loading = document.querySelector('.fast-battle-loading');
    if (loading) {
      loading.classList.remove('active');
    }
  }

  handleEnemyDefeated() {
    this.showFeedback('VITÓRIA!', 'critical');

    setTimeout(() => {
      // Recarregar página para mostrar recompensas
      window.location.reload();
    }, 1500);
  }

  handlePlayerDefeated() {
    this.showFeedback('DERROTA!', 'damage');

    setTimeout(() => {
      window.location.href = '/gamification/game_over';
    }, 1500);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Só ativar no hub de gamificação
  if (window.location.pathname === '/gamification/' ||
      window.location.pathname === '/gamification') {
    window.fastBattle = new FastBattleMode();
  }
});
