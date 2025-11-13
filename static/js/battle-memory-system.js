// ===== SISTEMA DE MEMÓRIAS NA BATALHA =====

let memoryOptions = [];
let selectedMemoryType = null;
let pendingMemoryData = null;

// Função para carregar sons (se houver)
function playMemoryOptionsSound() {
    // Se você tiver um sistema de som no battle, use aqui
    // Por exemplo: playSound('/static/sounds/memoryoptions.mp3');
    console.log("🎵 Som de opções de memória (placeholder)");
}

function playMemorySelectionSound() {
    // Se você tiver um sistema de som no battle, use aqui
    // Por exemplo: playSound('/static/sounds/memoryselection.mp3');
    console.log("🎵 Som de seleção de memória (placeholder)");
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

            // Fechar pop-up e redirecionar para o hub após delay
            setTimeout(() => {
                const popup = document.getElementById('memory-selection-popup');
                if (popup) popup.style.display = 'none';

                // Reset final
                selectedMemoryType = null;
                pendingMemoryData = null;

                // Redirecionar para o hub
                console.log("🏠 Redirecionando para o hub...");
                window.location.href = '/gamification';
            }, 1000);
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botão de confirmar
    const confirmBtn = document.getElementById('confirm-memory-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmMemorySelection);
    }
});

// Expor funções globalmente para serem chamadas de outros scripts
window.showMemorySelectionPopup = showMemorySelectionPopup;
window.confirmMemorySelection = confirmMemorySelection;
