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
    // Verificar se estamos na página de batalha (URL ou SPA)
    const isBattlePage = window.location.pathname.includes('/battle');
    const isSPABattleView = document.getElementById('battle-view')?.classList.contains('active');

    if (!isBattlePage && !isSPABattleView) {
      console.log('Fast Battle Mode: Não estamos na página de batalha, aguardando SPA...');
      // Para SPA, aguardar ser chamado manualmente via window.initFastBattleMode()
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

    // Iniciar observador de estado para atualizações em tempo real
    this.startStateWatcher();

    this.active = true;
    console.log('✅ Modo Rápido de Batalha ativado!');
  }

  // Observador de estado para atualizar menus em tempo real
  startStateWatcher() {
    // Armazenar últimos valores conhecidos
    this.lastKnownEnergy = null;
    this.lastKnownBloodStacks = null;

    // Verificar mudanças a cada 300ms
    this.stateWatcherInterval = setInterval(() => {
      if (!window.gameState || !window.gameState.player) return;

      const currentEnergy = window.gameState.player.energy;
      // Blood stacks está em gameState.boss.bloodStacks (não enemy.blood_stacks)
      const currentBloodStacks = (window.gameState.boss && window.gameState.boss.bloodStacks) || 0;

      // Detectar mudanças
      const energyChanged = this.lastKnownEnergy !== null && this.lastKnownEnergy !== currentEnergy;
      const bloodStacksChanged = this.lastKnownBloodStacks !== null && this.lastKnownBloodStacks !== currentBloodStacks;

      // Detectar se energia AUMENTOU (indica novo turno - energia foi restaurada)
      const energyIncreased = this.lastKnownEnergy !== null && currentEnergy > this.lastKnownEnergy;

      if (energyChanged || bloodStacksChanged) {
        console.log(`🔄 Estado mudou! Energia: ${this.lastKnownEnergy} → ${currentEnergy}, Blood Stacks: ${this.lastKnownBloodStacks} → ${currentBloodStacks}`);

        // Atualizar estados dos cards (sem recriar)
        this.updateAttackCardsState();
        this.updateSpecialCardsState();

        // Se blood_stacks MUDOU (aumentou ou diminuiu), recarregar ataques do backend
        // Isso atualiza a disponibilidade do Ultimate baseado nos blood_stacks atuais
        if (bloodStacksChanged) {
          console.log('🔄 Blood stacks mudou! Recarregando ataques do backend');
          this.refreshAttacksMenu();
        }

        // Se blood_stacks mudou OU energia aumentou (novo turno), recarregar specials do backend
        // Isso reseta o used_this_turn para as skills especiais
        if (bloodStacksChanged || energyIncreased) {
          console.log('🔄 Recarregando specials do backend (novo turno ou blood_stacks mudou)');
          this.refreshSpecialsMenu();
        }
      }

      // Atualizar valores conhecidos
      this.lastKnownEnergy = currentEnergy;
      this.lastKnownBloodStacks = currentBloodStacks;
    }, 300);
  }

  async loadAttacks() {
    try {
      const response = await fetch('/gamification/player/attacks');
      const data = await response.json();

      if (data.success && data.attacks) {
        // Usar o ícone específico de cada skill que vem do backend
        this.attacks = data.attacks;
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
        this.specials = data.specials.map((special, index) => {
          // Extrair energy_cost do positive_effect.value (é um JSON string)
          let energyCost = 0;
          let requiresBloodStacks = false;

          if (special.positive_effect && special.positive_effect.value) {
            try {
              const effectValue = JSON.parse(special.positive_effect.value);
              energyCost = effectValue.energy_cost || 0;
              // Skills que consomem blood_stacks (todas exceto autofagia)
              requiresBloodStacks = effectValue.damage_per_stack || effectValue.barrier_per_stack || effectValue.heal_per_stack;
            } catch (e) {
              console.warn('Erro ao parsear positive_effect.value:', e);
            }
          }

          console.log(`🔮 Special [${index}] ${special.name}: energy_cost=${energyCost}, requires_blood_stacks=${requiresBloodStacks}`);

          return {
            ...special,
            energy_cost: energyCost,
            requires_blood_stacks: !!requiresBloodStacks,
            icon: special.icon || special.animation_fx_a || '/static/game.data/icons/special.png'
          };
        });
        console.log('🔮 Specials carregados:', this.specials);
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

    // Criar o novo menu de ataques Dark Fantasy
    this.createAttacksMenu();

    // Criar o menu de skills especiais Arcano Azul
    this.createSpecialsMenu();

    // Event listeners
    container.querySelectorAll('.fast-battle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSubmenu(e.target.dataset.type);
      });
    });

    // Fechar submenu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.fast-battle-container') && !e.target.closest('.fast-attacks-wrapper') && !e.target.closest('.fast-specials-wrapper')) {
        this.closeSubmenu();
      }
    });
  }

  // Mapear skill_type para posição do card
  getSkillByType(skillType) {
    return this.attacks.find(a => a.skill_type === skillType);
  }

  // Criar o novo menu de ataques Dark Fantasy
  createAttacksMenu() {
    // Remover menu anterior se existir
    const existingMenu = document.querySelector('.fast-attacks-wrapper');
    if (existingMenu) existingMenu.remove();

    // Organizar attacks por tipo
    const attackByType = {
      attack: this.getSkillByType('attack'),
      power: this.getSkillByType('power'),
      special: this.getSkillByType('special'),
      ultimate: this.getSkillByType('ultimate')
    };

    // Criar wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'fast-attacks-wrapper';

    // Criar container principal (2x2 grid)
    const main = document.createElement('div');
    main.className = 'fast-attacks-main';

    // Esfera de contenção (selo mágico)
    main.innerHTML = `
      <div class="unification-sphere"></div>
      <div class="center-symbol">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
        </svg>
      </div>
    `;

    // Linha superior (attack + power)
    const upRow = document.createElement('div');
    upRow.className = 'up';

    // Linha inferior (special + ultimate)
    const downRow = document.createElement('div');
    downRow.className = 'down';

    // Ordem dos cards: card1=attack, card2=power, card3=special, card4=ultimate
    const cardConfig = [
      { type: 'attack', cardClass: 'card1', row: upRow },
      { type: 'power', cardClass: 'card2', row: upRow },
      { type: 'special', cardClass: 'card3', row: downRow },
      { type: 'ultimate', cardClass: 'card4', row: downRow }
    ];

    cardConfig.forEach(config => {
      const skill = attackByType[config.type];
      const card = this.createAttackCard(skill, config.cardClass, config.type);
      config.row.appendChild(card);
    });

    main.appendChild(upRow);
    main.appendChild(downRow);
    wrapper.appendChild(main);

    // Criar painel de informações
    const infoPanel = document.createElement('div');
    infoPanel.className = 'fast-attacks-info-panel';

    // Criar um info-content para cada skill
    cardConfig.forEach(config => {
      const skill = attackByType[config.type];
      const infoContent = this.createInfoContent(skill, config.cardClass);
      infoPanel.appendChild(infoContent);
    });

    wrapper.appendChild(infoPanel);

    // Adicionar ao body (posicionado fixo - mais acima para dar espaço ao menu de especiais)
    wrapper.style.cssText = `
      position: fixed;
      bottom: 200px;
      left: 20px;
      z-index: 900;
    `;
    document.body.appendChild(wrapper);

    // Adicionar event listeners para hover nos cards
    this.setupCardHoverListeners(wrapper);
  }

  // Criar o menu de skills especiais - Tema Arcano Azul
  createSpecialsMenu() {
    // Remover menu anterior se existir
    const existingMenu = document.querySelector('.fast-specials-wrapper');
    if (existingMenu) existingMenu.remove();

    // Mapear specials por tipo (positive_effect.type)
    const getSpecialByType = (type) => {
      return this.specials.find(s => s.positive_effect && s.positive_effect.type === type);
    };

    // Organizar specials por tipo específico
    const specialsOrder = [
      getSpecialByType('autofagia'),    // Autofagia (card1) - usa HP, gera blood_stacks
      getSpecialByType('blood_blade'),  // Lâmina de Sangue (card2) - consome blood_stacks, causa dano
      getSpecialByType('blood_barrier'), // Barreira de Sangue (card3) - consome blood_stacks, gera barreira
      getSpecialByType('blood_regen')   // Regeneração (card4) - consome blood_stacks, cura
    ];

    console.log('🔮 Specials ordenados:', specialsOrder.map(s => s ? `${s.name} (custo: ${s.energy_cost})` : 'null'));

    // Criar wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'fast-specials-wrapper';

    // Criar container principal (2x2 grid)
    const main = document.createElement('div');
    main.className = 'fast-specials-main';

    // Esfera de contenção arcana (selo mágico azul) com símbolo de olho
    main.innerHTML = `
      <div class="unification-sphere"></div>
      <div class="center-symbol">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      </div>
    `;

    // Linha superior (card1 + card2)
    const upRow = document.createElement('div');
    upRow.className = 'up';

    // Linha inferior (card3 + card4)
    const downRow = document.createElement('div');
    downRow.className = 'down';

    // Configuração dos cards
    const cardConfig = [
      { index: 0, cardClass: 'card1', row: upRow },
      { index: 1, cardClass: 'card2', row: upRow },
      { index: 2, cardClass: 'card3', row: downRow },
      { index: 3, cardClass: 'card4', row: downRow }
    ];

    cardConfig.forEach(config => {
      const skill = specialsOrder[config.index];
      const card = this.createSpecialCard(skill, config.cardClass);
      config.row.appendChild(card);
    });

    main.appendChild(upRow);
    main.appendChild(downRow);
    wrapper.appendChild(main);

    // Criar painel de informações
    const infoPanel = document.createElement('div');
    infoPanel.className = 'fast-specials-info-panel';

    cardConfig.forEach(config => {
      const skill = specialsOrder[config.index];
      const infoContent = this.createSpecialInfoContent(skill, config.cardClass);
      infoPanel.appendChild(infoContent);
    });

    wrapper.appendChild(infoPanel);

    // Adicionar ao body (posicionado fixo - abaixo do menu de ataques)
    wrapper.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 900;
    `;
    document.body.appendChild(wrapper);

    // Adicionar event listeners para hover nos cards
    this.setupSpecialCardHoverListeners(wrapper);
  }

  // Criar um card de skill especial
  createSpecialCard(skill, cardClass) {
    const card = document.createElement('button');
    card.className = `special-card ${cardClass}`;

    if (skill) {
      card.dataset.skillId = skill.id;
      card.dataset.skillName = skill.name;

      // Verificar se está desabilitado
      const playerEnergy = (window.gameState && window.gameState.player) ? window.gameState.player.energy : 0;
      // Blood stacks está em gameState.boss.bloodStacks
      const enemyBloodStacks = (window.gameState && window.gameState.boss) ? (window.gameState.boss.bloodStacks || 0) : 0;

      const energyCost = skill.energy_cost || 0;
      const hasEnoughEnergy = energyCost === 0 || playerEnergy >= energyCost;
      const needsBloodStacks = skill.requires_blood_stacks;
      const hasBloodStacks = !needsBloodStacks || enemyBloodStacks > 0;
      const usedThisTurn = skill.used_this_turn;

      const isDisabled = skill.is_disabled || !hasEnoughEnergy || !hasBloodStacks || usedThisTurn;
      if (isDisabled) {
        card.classList.add('disabled');
      }

      // Badge de custo - só mostra se tiver custo de energia
      const energyBadgeHTML = energyCost > 0 ? `
        <div class="energy-cost-badge">
          <img src="/static/game.data/energy.webp" alt="Energia">
          <span>${energyCost}</span>
        </div>
      ` : '';

      // Partículas arcanas (3 camadas)
      card.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
          <div class="stars-infinite-xs"></div>
        </div>
        <div class="glow"><div class="circle"></div><div class="circle"></div></div>
        <img class="skill-icon-img" src="${skill.icon || '/static/game.data/icons/default_skill.png'}" alt="${skill.name}">
        ${energyBadgeHTML}
      `;

      // Event listener para executar skill especial
      if (!isDisabled) {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          this.executeAction(skill, 'specials');
        });
      }
    } else {
      // Skill não disponível
      card.classList.add('disabled');
      card.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
          <div class="stars-infinite-xs"></div>
        </div>
        <div class="glow"><div class="circle"></div><div class="circle"></div></div>
        <img class="skill-icon-img" src="/static/game.data/icons/default_skill.png" alt="Bloqueado">
      `;
    }

    return card;
  }

  // Criar conteúdo de informações para uma skill especial
  createSpecialInfoContent(skill, cardClass) {
    const content = document.createElement('div');
    content.className = `fast-specials-info-content info-${cardClass}`;

    if (!skill) {
      content.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
        </div>
        <h3 class="info-skill-name">Bloqueado</h3>
        <p class="info-desc">Skill não disponível</p>
      `;
      return content;
    }

    // Construir stats
    let statsHTML = '';
    const cache = skill.cache_data || {};

    // Cura
    if (cache.heal_amount) {
      statsHTML += `
        <span class="stat-tag heal">
          <img src="/static/game.data/icons/healing.png" alt="Cura">
          ${cache.heal_amount}
        </span>
      `;
    }

    // Energia
    if (skill.energy_cost) {
      statsHTML += `
        <span class="stat-tag energy">
          <img src="/static/game.data/energy.webp" alt="Energia">
          ${skill.energy_cost}
        </span>
      `;
    }

    // Escudo/Barreira
    if (cache.shield_amount || cache.barrier_amount) {
      const shieldVal = cache.shield_amount || cache.barrier_amount;
      statsHTML += `
        <span class="stat-tag shield">
          <img src="/static/game.data/icons/barrier.png" alt="Escudo">
          ${shieldVal}
        </span>
      `;
    }

    // Dano (algumas skills especiais causam dano também)
    if (cache.base_damage && cache.base_damage > 0) {
      statsHTML += `
        <span class="stat-tag damage">
          <img src="/static/game.data/icons/damage.png" alt="Dano">
          ${cache.base_damage}
        </span>
      `;
    }

    // Vampirismo
    if (cache.lifesteal_percent && cache.lifesteal_percent > 0) {
      statsHTML += `
        <span class="stat-tag heal">
          <img src="/static/game.data/icons/vampirism.png" alt="Vampirismo">
          ${(cache.lifesteal_percent * 100).toFixed(0)}%
        </span>
      `;
    }

    // Buff/Debuff
    if (cache.effect_type === 'buff') {
      statsHTML += `
        <span class="stat-tag buff">
          <img src="/static/game.data/icons/buff.png" alt="Buff">
          ${cache.effect_value || 'Ativo'}
        </span>
      `;
    }

    // Relíquias
    let relicsHTML = '';
    if (skill.applicable_relics && skill.applicable_relics.length > 0) {
      relicsHTML = '<div class="info-relics-row">';
      skill.applicable_relics.forEach(relic => {
        const iconSrc = relic.icon.startsWith('/') || relic.icon.startsWith('http')
          ? relic.icon
          : `/static/game.data/relics/${relic.icon}`;
        relicsHTML += `<img class="relic-icon" src="${iconSrc}" alt="${relic.name}" title="${relic.name}: ${relic.modifier.description}">`;
      });
      relicsHTML += '</div>';
    }

    content.innerHTML = `
      <div class="container-stars">
        <div class="stars-infinite"></div>
        <div class="stars-infinite-sm"></div>
      </div>
      <h3 class="info-skill-name">${skill.name}</h3>
      <div class="info-stats-row">${statsHTML}</div>
      ${skill.description ? `<p class="info-desc">${skill.description}</p>` : ''}
      ${relicsHTML}
    `;

    return content;
  }

  // Configurar listeners de hover para os cards de especiais
  setupSpecialCardHoverListeners(wrapper) {
    const cards = wrapper.querySelectorAll('.special-card');
    const infoPanels = wrapper.querySelectorAll('.fast-specials-info-content');

    cards.forEach(card => {
      const cardClass = [...card.classList].find(c => c.startsWith('card'));

      card.addEventListener('mouseenter', () => {
        // Ocultar todos os painéis
        infoPanels.forEach(p => p.classList.remove('visible'));
        // Mostrar painel correspondente
        const targetPanel = wrapper.querySelector(`.info-${cardClass}`);
        if (targetPanel) {
          targetPanel.classList.add('visible');
        }
      });

      card.addEventListener('mouseleave', () => {
        // Pequeno delay para permitir transição suave
        setTimeout(() => {
          const hoveredCard = wrapper.querySelector('.special-card:hover');
          if (!hoveredCard) {
            infoPanels.forEach(p => p.classList.remove('visible'));
          }
        }, 100);
      });
    });
  }

  // Atualizar o menu de especiais com dados atualizados
  async refreshSpecialsMenu() {
    await this.loadSpecials();
    this.createSpecialsMenu();
  }

  // Atualizar o menu de ataques com dados atualizados (para quando blood_stacks mudar)
  async refreshAttacksMenu() {
    await this.loadAttacks();
    this.createAttacksMenu();
  }

  // Atualizar apenas os estados dos cards de especiais
  updateSpecialCardsState() {
    if (!window.gameState || !window.gameState.player) return;

    const wrapper = document.querySelector('.fast-specials-wrapper');
    if (!wrapper) return;

    const cards = wrapper.querySelectorAll('.special-card');
    const playerEnergy = window.gameState.player.energy;
    // Blood stacks está em gameState.boss.bloodStacks
    const enemyBloodStacks = (window.gameState.boss && window.gameState.boss.bloodStacks) || 0;

    cards.forEach(card => {
      const skillId = parseInt(card.dataset.skillId);
      if (!skillId) return;

      const skill = this.specials.find(s => s.id === skillId);
      if (!skill) return;

      const energyCost = skill.energy_cost || 0;
      const hasEnoughEnergy = energyCost === 0 || playerEnergy >= energyCost;

      // Verificar se requer blood_stacks e se há suficiente
      const needsBloodStacks = skill.requires_blood_stacks;
      const hasBloodStacks = !needsBloodStacks || enemyBloodStacks > 0;

      // Verificar se já foi usada neste turno
      const usedThisTurn = skill.used_this_turn;

      const isDisabled = skill.is_disabled || !hasEnoughEnergy || !hasBloodStacks || usedThisTurn;

      if (isDisabled) {
        card.classList.add('disabled');
        card.style.pointerEvents = 'none';
      } else {
        card.classList.remove('disabled');
        card.style.pointerEvents = 'auto';
      }
    });
  }

  // Criar um card de ataque
  createAttackCard(skill, cardClass, skillType) {
    const card = document.createElement('button');
    card.className = `attack-card ${cardClass}`;
    card.dataset.skillType = skillType;

    if (skill) {
      console.log(`⚔️ Criando card ${cardClass} (${skillType}): ${skill.name}, energy_cost=${skill.energy_cost}`);
      card.dataset.skillId = skill.id;
      card.dataset.skillName = skill.name;

      // Verificar se está desabilitado
      const isDisabled = skill.is_disabled || !this.checkResources(skill, 'attacks');
      if (isDisabled) {
        card.classList.add('disabled');
      }

      // Partículas
      card.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
        </div>
        <div class="glow"><div class="circle"></div><div class="circle"></div></div>
        <img class="skill-icon-img" src="${skill.icon || '/static/game.data/icons/default_skill.png'}" alt="${skill.name}">
        <div class="energy-cost-badge">
          <img src="/static/game.data/energy.webp" alt="Energia">
          <span>${skill.energy_cost || 1}</span>
        </div>
      `;

      // Event listener para executar ataque
      if (!isDisabled) {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          this.executeAction(skill, 'attacks');
        });
      }
    } else {
      // Skill não disponível
      card.classList.add('disabled');
      card.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
        </div>
        <div class="glow"><div class="circle"></div><div class="circle"></div></div>
        <img class="skill-icon-img" src="/static/game.data/icons/default_skill.png" alt="Bloqueado">
      `;
    }

    return card;
  }

  // Criar conteúdo de informações para uma skill
  createInfoContent(skill, cardClass) {
    const content = document.createElement('div');
    content.className = `fast-attacks-info-content info-${cardClass}`;

    if (!skill) {
      content.innerHTML = `
        <div class="container-stars">
          <div class="stars-infinite"></div>
          <div class="stars-infinite-sm"></div>
        </div>
        <h3 class="info-skill-name">Bloqueado</h3>
        <p class="info-desc">Skill não disponível</p>
      `;
      return content;
    }

    // Construir stats
    let statsHTML = '';
    const cache = skill.cache_data || {};

    // Dano
    if (cache.base_damage) {
      statsHTML += `
        <span class="stat-tag damage">
          <img src="/static/game.data/icons/damage.png" alt="Dano">
          ${cache.base_damage}
        </span>
      `;
    }

    // Energia
    if (skill.energy_cost) {
      statsHTML += `
        <span class="stat-tag energy">
          <img src="/static/game.data/energy.webp" alt="Energia">
          ${skill.energy_cost}
        </span>
      `;
    }

    // Crítico
    if (cache.base_crit_chance && cache.base_crit_chance > 0) {
      statsHTML += `
        <span class="stat-tag crit">
          <img src="/static/game.data/icons/critchance.png" alt="Crítico">
          ${(cache.base_crit_chance * 100).toFixed(0)}%
        </span>
      `;
    }

    // Vampirismo
    if (cache.lifesteal_percent && cache.lifesteal_percent > 0) {
      statsHTML += `
        <span class="stat-tag vamp">
          <img src="/static/game.data/icons/vampirism.png" alt="Vampirismo">
          ${(cache.lifesteal_percent * 100).toFixed(0)}%
        </span>
      `;
    }

    // Barreira
    if (cache.effect_type === 'barrier') {
      const barrierValue = Math.ceil((cache.base_damage * (cache.effect_value || 0)) + (cache.effect_bonus || 0));
      statsHTML += `
        <span class="stat-tag barrier">
          <img src="/static/game.data/icons/barrier.png" alt="Barreira">
          ${barrierValue}
        </span>
      `;
    }

    // Blood stacks bonus (Ultimate Vlad)
    if (skill.blood_stacks_bonus && skill.blood_stacks_bonus > 0) {
      statsHTML += `
        <span class="stat-tag damage">
          <img src="/static/game.data/icons/bloodexplosion.png" alt="Sangue">
          +${skill.blood_stacks_bonus}
        </span>
      `;
    }

    // Relíquias
    let relicsHTML = '';
    if (skill.applicable_relics && skill.applicable_relics.length > 0) {
      relicsHTML = '<div class="info-relics-row">';
      skill.applicable_relics.forEach(relic => {
        const iconSrc = relic.icon.startsWith('/') || relic.icon.startsWith('http')
          ? relic.icon
          : `/static/game.data/relics/${relic.icon}`;
        relicsHTML += `<img class="relic-icon" src="${iconSrc}" alt="${relic.name}" title="${relic.name}: ${relic.modifier.description}">`;
      });
      relicsHTML += '</div>';
    }

    content.innerHTML = `
      <div class="container-stars">
        <div class="stars-infinite"></div>
        <div class="stars-infinite-sm"></div>
      </div>
      <h3 class="info-skill-name">${skill.name}</h3>
      <div class="info-stats-row">${statsHTML}</div>
      ${skill.description ? `<p class="info-desc">${skill.description}</p>` : ''}
      ${relicsHTML}
    `;

    return content;
  }

  // Configurar listeners de hover para mostrar/ocultar painéis de info
  setupCardHoverListeners(wrapper) {
    const cards = wrapper.querySelectorAll('.attack-card');
    const infoPanels = wrapper.querySelectorAll('.fast-attacks-info-content');

    cards.forEach(card => {
      const cardClass = [...card.classList].find(c => c.startsWith('card'));

      card.addEventListener('mouseenter', () => {
        // Ocultar todos os painéis
        infoPanels.forEach(p => p.classList.remove('visible'));
        // Mostrar painel correspondente
        const targetPanel = wrapper.querySelector(`.info-${cardClass}`);
        if (targetPanel) {
          targetPanel.classList.add('visible');
        }
      });

      card.addEventListener('mouseleave', () => {
        // Pequeno delay para permitir transição suave
        setTimeout(() => {
          const hoveredCard = wrapper.querySelector('.attack-card:hover');
          if (!hoveredCard) {
            infoPanels.forEach(p => p.classList.remove('visible'));
          }
        }, 100);
      });
    });
  }

  // Atualizar o menu de ataques com dados atualizados
  async refreshAttacksMenu() {
    await this.loadAttacks();
    this.createAttacksMenu();
  }

  // Atualizar apenas os estados dos cards (energia, disabled) sem recriar
  updateAttackCardsState() {
    if (!window.gameState || !window.gameState.player) return;

    const wrapper = document.querySelector('.fast-attacks-wrapper');
    if (!wrapper) return;

    const cards = wrapper.querySelectorAll('.attack-card');
    const playerEnergy = window.gameState.player.energy;

    cards.forEach(card => {
      const skillId = parseInt(card.dataset.skillId);
      if (!skillId) return;

      const skill = this.attacks.find(a => a.id === skillId);
      if (!skill) return;

      const energyCost = skill.energy_cost || 1;
      const hasEnough = playerEnergy >= energyCost;
      const isDisabled = skill.is_disabled || !hasEnough;

      if (isDisabled) {
        card.classList.add('disabled');
        card.style.pointerEvents = 'none';
      } else {
        card.classList.remove('disabled');
        card.style.pointerEvents = 'auto';
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

        // Atualizar gameState.boss.bloodStacks para verificação local
        if (window.gameState && data.blood_stacks !== undefined) {
          if (!window.gameState.boss) window.gameState.boss = {};
          window.gameState.boss.bloodStacks = data.blood_stacks;
        }

        // Atualizar menus Dark Fantasy e Arcane Blue (com delay para dados estabilizarem)
        setTimeout(() => {
          this.refreshAttacksMenu();
          this.refreshSpecialsMenu();
        }, 500);
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

// Função global para inicializar/reinicializar Fast Battle Mode (usado pelo SPA)
window.initFastBattleMode = function() {
  console.log('🚀 Inicializando Fast Battle Mode (via SPA)...');

  // Remover instância anterior se existir
  const existingContainer = document.querySelector('.fast-battle-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Criar nova instância
  window.fastBattle = new FastBattleMode();

  // Forçar inicialização imediata se já estamos na batalha
  if (window.fastBattle && typeof window.fastBattle.init === 'function') {
    setTimeout(() => {
      if (!document.querySelector('.fast-battle-container')) {
        window.fastBattle.init();
      }
    }, 500);
  }
};

// Inicializar quando DOM estiver pronto (para páginas de batalha diretas)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fastBattle = new FastBattleMode();
  });
} else {
  window.fastBattle = new FastBattleMode();
}
