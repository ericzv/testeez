// ===== SISTEMA DE MEMÓRIAS NA BATALHA =====

let memoryOptions = [];
let selectedMemoryType = null;
let pendingMemoryData = null;
let memoryRerollCount = 0; // Rastreador local de rerolls

// Função para tocar sons de memórias
function playMemoryOptionsSound() {
    playSound('/static/game.data/sounds/memory-reward-popup-openning.wav', 0.7);
}

function playMemorySelectionSound() {
    playSound('/static/game.data/sounds/memory-reward-popup-selection.wav', 0.8);
}

function playMemoryHoverSound() {
    playSound('/static/game.data/sounds/memory-hover.mp3', 0.4);
}

function playRewriteSound() {
    playSound('/static/game.data/sounds/rewrite.mp3', 0.5);
}

// Mostrar pop-up de seleção de memórias
function showMemorySelectionPopup(enemyRarity) {
    console.log("🧠 DEBUG: showMemorySelectionPopup chamada com raridade:", enemyRarity);

    // Salvar dados da recompensa para usar depois
    pendingMemoryData = { enemy_rarity: enemyRarity };

    fetch('/gamification/get_memory_options')
        .then(response => response.json())
        .then(data => {
            console.log("🧠 DEBUG: Opções recebidas:", data);
            if (data.success) {
                memoryOptions = data.options;
                displayMemoryOptions(enemyRarity);

                // Reset do estado de seleção
                selectedMemoryType = null;
                const confirmBtn = document.getElementById('confirm-memory-btn');
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'Confirmar Seleção';
                }

                // Atualizar divider de reroll
                updateMemoryRewriteDivider();

                // TOCAR SOM DO POP-UP DE MEMÓRIAS
                playMemoryOptionsSound();

                console.log("🧠 DEBUG: Mostrando pop-up");
                document.getElementById('memory-selection-popup').style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar opções de memória:', error);
        });
}

// Atualizar o divider de reroll (custo e visibilidade)
function updateMemoryRewriteDivider() {
    fetch('/gamification/get_player_currencies')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const eternalHourglasses = data.eternal_hourglasses || 0;
                memoryRerollCount = data.memory_reroll_count || 0;

                const cost = (memoryRerollCount + 1) * 2;
                const canReroll = memoryRerollCount < 3 && eternalHourglasses >= cost;

                // Atualizar custo no botão
                const costElement = document.getElementById('memory-rewrite-cost');
                if (costElement) {
                    costElement.textContent = cost;
                }

                // Mostrar/ocultar divider baseado na disponibilidade
                const divider = document.getElementById('memory-rewrite-divider');
                if (divider) {
                    divider.style.display = 'flex';

                    // Adicionar classe de disabled se não puder reroll
                    const button = document.getElementById('memory-rewrite-button');
                    if (button) {
                        if (canReroll) {
                            button.classList.remove('disabled');
                        } else {
                            button.classList.add('disabled');
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Erro ao obter currencies:', error);
        });
}

// Executar reroll de memórias
async function executeMemoryRewrite() {
    const button = document.getElementById('memory-rewrite-button');
    if (button && button.classList.contains('disabled')) {
        return; // Não fazer nada se estiver disabled
    }

    // Adicionar classe de animação
    button.classList.add('rewriting');

    // Tocar som
    playRewriteSound();

    try {
        const response = await fetch('/gamification/rewrite_memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            console.log("✨ Reroll executado com sucesso!");

            // Animar fade out das opções
            const container = document.getElementById('memory-options-container');
            if (container) {
                container.style.opacity = '0';
                container.style.transition = 'opacity 0.5s ease-out';

                setTimeout(() => {
                    // Recarregar opções
                    fetch('/gamification/get_memory_options')
                        .then(response => response.json())
                        .then(newData => {
                            if (newData.success) {
                                memoryOptions = newData.options;
                                displayMemoryOptions(pendingMemoryData.enemy_rarity);

                                // Reset seleção
                                selectedMemoryType = null;
                                const confirmBtn = document.getElementById('confirm-memory-btn');
                                if (confirmBtn) {
                                    confirmBtn.disabled = true;
                                    confirmBtn.textContent = 'Confirmar Seleção';
                                }

                                // Atualizar divider
                                updateMemoryRewriteDivider();

                                // Fade in
                                setTimeout(() => {
                                    container.style.opacity = '1';
                                    button.classList.remove('rewriting');
                                }, 50);
                            }
                        })
                        .catch(error => {
                            console.error('Erro ao recarregar opções:', error);
                            button.classList.remove('rewriting');
                        });
                }, 500);
            }
        } else {
            alert(data.message || 'Erro ao reescrever escolhas');
            button.classList.remove('rewriting');
        }
    } catch (error) {
        console.error('Erro ao executar reroll:', error);
        alert('Erro ao reescrever escolhas');
        button.classList.remove('rewriting');
    }
}

// Exibir opções de memória
function displayMemoryOptions(enemyRarity) {
    const container = document.getElementById('memory-options-container');
    container.innerHTML = '';

    // ===== Grid dinâmico baseado no número de opções =====
    const cols = Math.min(memoryOptions.length, 4);
    container.style.gridTemplateColumns = `repeat(${cols}, 240px)`;

    // Atualizar largura do painel pai
    const panel = document.querySelector('.victory-popup .victory-content');
    if (panel) panel.style.setProperty('--cols', cols);
    // ===== FIM =====

    memoryOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'memory-option';
        optionElement.dataset.memoryType = option.type;

        optionElement.innerHTML = `
            <div class="memory-header">
                <h3 class="memory-name-latin">${option.name}</h3>
                ${option.current_count > 0 ? `<div class="memory-count">${option.current_count}</div>` : ''}
            </div>
            <img src="/static/game.data/buffs/${option.icon}" alt="${option.name}" class="memory-icon">
            <div class="memory-description">${option.description}</div>
            <div class="memory-value">${option.formatted_value}</div>
        `;

        optionElement.addEventListener('mouseenter', () => playMemoryHoverSound());
        optionElement.addEventListener('click', () => selectMemoryOption(option.type, optionElement));
        container.appendChild(optionElement);
    });
}

// Selecionar opção de memória (apenas visual)
function selectMemoryOption(memoryType, clickedElement) {
    console.log("🧠 DEBUG: Selecionando opção:", memoryType);

    // Remover seleção anterior
    document.querySelectorAll('.memory-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Marcar como selecionado
    if (clickedElement) {
        clickedElement.classList.add('selected');
        selectedMemoryType = memoryType;

        // Habilitar botão de confirmar
        const confirmBtn = document.getElementById('confirm-memory-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = `Confirmar: ${memoryOptions.find(opt => opt.type === memoryType)?.name || 'Lembrança'}`;
        }

        console.log("🧠 DEBUG: Opção selecionada:", memoryType);
    }
}

// Confirmar seleção de memória (enviar para servidor)
function confirmMemorySelection() {
    if (!selectedMemoryType) {
        alert('Selecione uma lembrança primeiro!');
        return;
    }

    // Obter raridade do inimigo da sessão
    const enemyRarity = pendingMemoryData?.enemy_rarity || 1;

    console.log("🧠 DEBUG: Confirmando seleção:", { memoryType: selectedMemoryType, enemyRarity });

    // Desabilitar botão para evitar cliques duplos
    const confirmBtn = document.getElementById('confirm-memory-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Aplicando...';
    }

    // Enviar seleção para o servidor
    fetch('/gamification/select_memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            memory_type: selectedMemoryType,
            enemy_rarity: enemyRarity
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("🧠 DEBUG: Resposta do servidor:", data);

        if (data.success) {
            // TOCAR SOM DE SELEÇÃO DE MEMÓRIA
            playMemorySelectionSound();

            console.log("✅ Lembrança aplicada com sucesso:", {
                type: data.buff_type,
                value: data.value,
                total_count: data.total_count,
                total_value: data.total_value
            });

            // Fechar pop-up e redirecionar para o hub imediatamente
            setTimeout(() => {
                const popup = document.getElementById('memory-selection-popup');
                if (popup) popup.style.display = 'none';

                // Reset final
                selectedMemoryType = null;
                pendingMemoryData = null;

                // Redirecionar para o hub APENAS se estiver na página de batalha
                const isBattlePage = window.location.pathname.includes('/battle');
                if (isBattlePage) {
                    console.log("🏠 Redirecionando para o hub...");
                    window.location.href = '/gamification';
                } else {
                    console.log("✅ Já está no hub, não precisa redirecionar");
                    // Recarregar a página para atualizar os dados
                    window.location.reload();
                }
            }, 300);
        } else {
            alert('Erro: ' + data.message);

            // Reabilitar botão em caso de erro
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirmar Seleção';
            }
        }
    })
    .catch(error => {
        console.error('Erro ao selecionar memória:', error);
        alert('Erro ao selecionar memória');

        // Reabilitar botão em caso de erro
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar Seleção';
        }
    });
}

// Verificar se há recompensa de memória pendente ao carregar
function checkPendingMemoryReward() {
    console.log("🔍 Verificando recompensas de memória pendentes...");

    fetch('/gamification/check_memory_reward')
        .then(response => response.json())
        .then(data => {
            console.log("🔍 Resposta do check_memory_reward:", data);
            if (data.success && data.has_memory_reward) {
                console.log("⚠️ RECOMPENSA PENDENTE DETECTADA! Bloqueando nova batalha.");

                // Bloquear todas as ações da batalha
                if (typeof gameState !== 'undefined') {
                    gameState.inAction = true;
                }

                // Mostrar pop-up de memória imediatamente
                showMemorySelectionPopup(data.enemy_rarity);
            }
        })
        .catch(error => {
            console.error('Erro ao verificar recompensa de memória:', error);
        });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botão de confirmar
    const confirmBtn = document.getElementById('confirm-memory-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmMemorySelection);
    }

    // Botão de reroll
    const rewriteBtn = document.getElementById('memory-rewrite-button');
    if (rewriteBtn) {
        rewriteBtn.addEventListener('click', executeMemoryRewrite);
    }

    // Verificar recompensas pendentes ao carregar a página
    checkPendingMemoryReward();
});

// Expor funções globalmente para serem chamadas de outros scripts
window.showMemorySelectionPopup = showMemorySelectionPopup;
window.confirmMemorySelection = confirmMemorySelection;
window.checkPendingMemoryReward = checkPendingMemoryReward;
