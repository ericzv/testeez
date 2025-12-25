// ==========================================
// SISTEMA DE TURNOS - JavaScript (Switch Version)
// ==========================================

console.log('🎮 Sistema de Turnos (Switch) carregado');

// Estado global do turno
window.turnState = {
    isPlayerTurn: true,
    isProcessing: false,
    isLocked: false
};

/**
 * Inicializar o sistema de switch de turno
 */
function initTurnSwitch() {
    const toggle = document.getElementById('turn-toggle');
    const track = document.getElementById('turn-track');

    if (!toggle || !track) {
        console.warn('⚠️ Elementos do Turn Switch não encontrados');
        return;
    }

    // Prevenir comportamento padrão do checkbox - só mudamos via JavaScript
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // Evento de clique no track (label)
    track.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Se já está processando ou está no turno do inimigo, não fazer nada
        if (turnState.isProcessing || turnState.isLocked || !turnState.isPlayerTurn) {
            console.warn('⚠️ Switch bloqueado - Turno do inimigo ou processando');
            return;
        }

        // Processar fim do turno do jogador
        await endPlayerTurn();
    });

    // Iniciar sistema de partículas
    initTurnParticles(toggle, track);

    console.log('✅ Turn Switch inicializado');
}

/**
 * Terminar turno do jogador e processar turno do inimigo
 */
async function endPlayerTurn() {
    const toggle = document.getElementById('turn-toggle');

    if (!toggle) {
        console.error('❌ Turn toggle não encontrado');
        return;
    }

    // Verificar se já está processando
    if (turnState.isProcessing || turnState.isLocked) {
        console.warn('⚠️ Turno já está sendo processado');
        return;
    }

    // Marcar como processando
    turnState.isProcessing = true;

    try {
        console.log('🎮 Jogador terminando turno...');

        // Mover switch para direita (turno do inimigo)
        setTurnToEnemy();

        const response = await fetch('/gamification/end_player_turn', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Turno do inimigo processado:', data);

            // Atualizar HUD unificado de ações
            await updateEnemyActionsHUD();

            // Mostrar feedback
            showTurnFeedback(data);

            // Se tem ações, manter bloqueado até resolver
            if (data.has_actions) {
                console.log('⚔️ Inimigo tem ações disponíveis!');
                turnState.isLocked = true;
                turnState.isPlayerTurn = false;
                console.log('🔒 Switch bloqueado - Aguardando resolução das ações do inimigo');
            } else {
                // Sem ações, voltar para turno do jogador
                setTurnToPlayer();
            }
        } else {
            console.error('❌ Erro ao processar turno:', data.message);
            alert('Erro: ' + data.message);
            // Reverter para turno do jogador em caso de erro
            setTurnToPlayer();
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        alert('Erro ao processar turno!');
        // Reverter para turno do jogador em caso de erro
        setTurnToPlayer();
    }

    turnState.isProcessing = false;
}

/**
 * Mover switch para fase do inimigo (direita)
 */
function setTurnToEnemy() {
    const toggle = document.getElementById('turn-toggle');
    if (toggle) {
        toggle.checked = true;
        turnState.isPlayerTurn = false;
        turnState.isLocked = true;
        console.log('🔴 Switch movido para TURNO DO INIMIGO');
    }
}

/**
 * Mover switch para fase do jogador (esquerda)
 */
function setTurnToPlayer() {
    const toggle = document.getElementById('turn-toggle');
    if (toggle) {
        toggle.checked = false;
        turnState.isPlayerTurn = true;
        turnState.isLocked = false;
        console.log('🔵 Switch movido para TURNO DO JOGADOR');
    }
}

/**
 * Reabilitar botão de terminar turno (chamar quando jogador resolver ações do inimigo)
 * Agora move o switch de volta para o lado do jogador
 */
function enableEndTurnButton() {
    console.log('✅ Habilitando turno do jogador...');

    // Mover switch de volta para o lado do jogador
    setTurnToPlayer();

    // ===== FEEDBACK VISUAL: "SEU TURNO!" =====
    showYourTurnFeedback();

    // ===== RESTAURAR ENERGIA DO JOGADOR =====
    restorePlayerEnergy();
}

/**
 * Mostrar feedback "Seu Turno!"
 */
function showYourTurnFeedback() {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
        color: #4CAF50;
        padding: 30px 50px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        z-index: 9999;
        border: 4px solid #4CAF50;
        text-align: center;
        box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(76, 175, 80, 0.4),
            inset 0 0 20px rgba(76, 175, 80, 0.1);
        animation: feedbackPop 0.5s ease-out;
    `;
    feedback.textContent = '✅ Seu Turno!';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'feedbackFade 0.5s ease-out';
        setTimeout(() => feedback.remove(), 500);
    }, 750); // OTIMIZADO: 1500ms → 750ms (-50%)
}

// Expor função globalmente
window.showYourTurnFeedback = showYourTurnFeedback;

/**
 * Atualizar HUD unificado de ações do inimigo
 * Mostra ações ATUAIS (se houver) ou PRÓXIMAS (se não houver ações atuais)
 * Segue a lógica do Slay the Spire: um único HUD para todas as ações
 */
async function updateChargesHUD() {
    // Redirecionar para a função unificada
    await updateEnemyActionsHUD();
}

/**
 * Restaurar energia do jogador ao máximo
 */
async function restorePlayerEnergy() {
    try {
        console.log('⚡ Restaurando energia do jogador...');
        
        const response = await fetch('/gamification/restore_energy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Energia restaurada: ${data.current_energy}/${data.max_energy}`);
            
            // Atualizar UI da energia
            updateEnergyDisplay(data.current_energy, data.max_energy);
            
            // Feedback visual
            showEnergyRestoreFeedback();
        } else {
            console.error('❌ Erro ao restaurar energia:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição de energia:', error);
    }
}

/**
 * Atualizar display de energia na UI
 */
function updateEnergyDisplay(current, max) {
    const energyText = document.getElementById('energy-text');
    if (energyText) {
        energyText.textContent = `${current}/${max}`;
    }

    // ===== CORREÇÃO: ATUALIZAR GAMESTATE =====
    // Isso garante que outras funções que leem gameState.player.energy
    // vejam o valor correto após a restauração de energia
    if (typeof gameState !== 'undefined' && gameState.player) {
        gameState.player.energy = current;
        gameState.player.maxEnergy = max;
        console.log(`⚡ GameState atualizado: ${gameState.player.energy}/${gameState.player.maxEnergy}`);
    }
    // =========================================

    // Atualizar indicador visual (se existir)
    const energyIndicator = document.getElementById('energy-indicator');
    if (energyIndicator) {
        const percent = (current / max) * 100;

        if (percent > 66) {
            energyIndicator.setAttribute('data-energy-percent', 'high');
        } else if (percent > 33) {
            energyIndicator.setAttribute('data-energy-percent', 'medium');
        } else {
            energyIndicator.setAttribute('data-energy-percent', 'low');
        }
    }

    // ===== ATUALIZAR TAMBÉM COM updateEnergyIndicator SE DISPONÍVEL =====
    if (typeof updateEnergyIndicator === 'function') {
        updateEnergyIndicator();
    }
}

/**
 * Feedback visual de energia restaurada
 */
function showEnergyRestoreFeedback() {
    const energyIndicator = document.getElementById('energy-indicator');
    if (!energyIndicator) return;
    
    // Adicionar efeito de pulse
    energyIndicator.style.animation = 'none';
    setTimeout(() => {
        energyIndicator.style.animation = 'energyPulse 0.8s ease-out';
    }, 10);
    
    // Criar partículas de energia
    createEnergyParticles();
}

/**
 * Criar partículas visuais de energia restaurada
 */
function createEnergyParticles() {
    const energyIcon = document.querySelector('.energy-icon-container');
    if (!energyIcon) return;
    
    const rect = energyIcon.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width/2}px;
            top: ${rect.top + rect.height/2}px;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #ffeb3b 0%, #ffc107 100%);
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 10px #ffeb3b;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 50;
        const endX = rect.left + rect.width/2 + Math.cos(angle) * distance;
        const endY = rect.top + rect.height/2 + Math.sin(angle) * distance;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - rect.left - rect.width/2}px, ${endY - rect.top - rect.height/2}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// Adicionar CSS de animação
const energyStyle = document.createElement('style');
energyStyle.textContent = `
    @keyframes energyPulse {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.2); filter: brightness(1.5); }
        100% { transform: scale(1); filter: brightness(1); }
    }
`;
document.head.appendChild(energyStyle);

// Expor função globalmente
window.restorePlayerEnergy = restorePlayerEnergy;

// Expor função globalmente
window.enableEndTurnButton = enableEndTurnButton;

/**
 * HUD UNIFICADO: Atualizar ações do inimigo
 * Mostra action_queue (turno atual) OU next_intentions (próximo turno)
 * Estilo Slay the Spire: sempre mostra o que o inimigo vai fazer
 */
async function updateEnemyActionsHUD() {
    try {
        const response = await fetch('/gamification/enemy_attack_status');
        const data = await response.json();

        if (!data.success) {
            console.warn('⚠️ Não foi possível obter ações do inimigo');
            return;
        }

        const status = data.status;
        const container = document.getElementById('intentions-icons');
        const hudContainer = document.getElementById('enemy-intentions-container');

        if (!container || !hudContainer) {
            console.error('❌ Containers não encontrados');
            return;
        }

        // ===== ANIMAÇÃO DE SAÍDA COM SHAKE DOS ÍCONES ATUAIS =====
        const currentIcons = container.querySelectorAll('.intention-icon');
        if (currentIcons.length > 0) {
            // Aplicar animação de shake/consumo aos ícones atuais
            currentIcons.forEach((icon, index) => {
                setTimeout(() => {
                    icon.style.animation = 'iconConsumeShake 0.5s ease-out forwards';
                }, index * 80); // Cascata de saída
            });

            // Aguardar animação de shake terminar antes de limpar
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        // Prioridade: action_queue (ações atuais) > next_intentions (próximas ações)
        const actionQueue = status.action_queue || [];
        const nextIntentions = status.next_intentions || [];

        // Determinar qual lista mostrar
        let actionsToShow = [];
        let isCurrentTurn = false;

        if (actionQueue.length > 0) {
            // Há ações no turno atual - mostrar elas
            actionsToShow = actionQueue.map(action => ({
                type: action.type,
                name: action.data?.name || (action.type === 'attack' ? 'Ataque Básico' : 'Ação'),
                icon: action.icon || '/static/game.data/icons/attackcharge.png',
                damage: action.data?.calculated_damage || action.data?.damage,
                id: action.id || Math.random() // ID único para remover depois
            }));
            isCurrentTurn = true;
            console.log('⚔️ Mostrando AÇÕES ATUAIS (turno do inimigo):', actionsToShow);
        } else {
            // Sem ações atuais - mostrar próximas intenções
            actionsToShow = nextIntentions;
            isCurrentTurn = false;
            console.log('🎯 Mostrando PRÓXIMAS AÇÕES (próximo turno):', actionsToShow);
        }

        // Limpar container (após animação de saída)
        container.innerHTML = '';

        // NÃO mostrar "Aguardando..." durante transição - apenas deixar vazio
        if (actionsToShow.length === 0) {
            // Sem ações e sem próximas intenções - esconder HUD
            hudContainer.classList.remove('visible');
            return;
        }

        // Mostrar HUD se houver ações
        hudContainer.classList.add('visible');

        // ===== PEQUENO DELAY ANTES DE MOSTRAR NOVOS ÍCONES =====
        await new Promise(resolve => setTimeout(resolve, 200));

        // Criar ícone para cada ação (com animação de entrada)
        actionsToShow.forEach((action, index) => {
            const iconDiv = document.createElement('div');

            // Classe CSS baseada no tipo
            iconDiv.className = `intention-icon ${action.type}`;

            // Adicionar atributo data-action-id para remoção posterior
            if (action.id) {
                iconDiv.setAttribute('data-action-id', action.id);
            }

            // Ícone
            const iconPath = action.icon;
            if (iconPath) {
                iconDiv.style.backgroundImage = `url('${iconPath}')`;
            } else {
                iconDiv.style.backgroundImage = `url('/static/game.data/icons/attackcharge.png')`;
            }

            // Badge de ordem
            if (actionsToShow.length > 1) {
                const badge = document.createElement('div');
                badge.className = 'intention-badge';
                badge.textContent = index + 1;
                iconDiv.appendChild(badge);
            }

            // Tooltip
            let tooltip = action.name || 'Ação';
            if ((action.type === 'attack' || action.type === 'attack_skill') && action.damage) {
                tooltip += ` (Dano: ${action.damage})`;
            }

            // Aplicar animação de fade in suave via CSS
            iconDiv.style.animation = `iconFadeIn 0.5s ease-out forwards ${index * 0.1}s`;
            iconDiv.style.opacity = '0';

            container.appendChild(iconDiv);

            // Tooltip estilizado
            if (typeof addStyledTooltip === 'function') {
                addStyledTooltip(iconDiv, tooltip, 'bottom');
            } else {
                iconDiv.title = tooltip;
            }
        });

        // ===== CONTROLE DO SWITCH DE TURNO =====
        if (isCurrentTurn && actionsToShow.length > 0) {
            // Turno do inimigo - manter switch na posição inimigo e bloqueado
            console.log('🔒 Switch bloqueado - Inimigo tem ações pendentes');
            turnState.isLocked = true;
            turnState.isPlayerTurn = false;
            // Garantir que o switch está na posição correta
            const toggle = document.getElementById('turn-toggle');
            if (toggle && !toggle.checked) {
                toggle.checked = true;
            }
        } else {
            // Turno do jogador - liberar switch para posição do jogador
            console.log('✅ Switch liberado - Turno do jogador');
            // Só mudar se estava no turno do inimigo
            if (!turnState.isPlayerTurn) {
                setTurnToPlayer();
            }
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar ações do inimigo:', error);
    }
}

/**
 * Esconder HUD de ações do inimigo (chamado ao vencer/perder)
 */
function hideEnemyActionsHUD() {
    const hudContainer = document.getElementById('enemy-intentions-container');
    if (hudContainer) {
        hudContainer.classList.remove('visible');
        console.log('👻 HUD de ações do inimigo escondido');
    }
}

/**
 * Função legada - redireciona para updateEnemyActionsHUD
 */
async function updateEnemyIntentions() {
    await updateEnemyActionsHUD();
}

/**
 * Obter ícone da intenção
 */
function getIntentionIcon(intention, skillsData) {
    // Remover sufixo de rotação se existir (ex: "attack_skill_0" -> "attack_skill")
    const baseIntention = intention.replace(/_\d+$/, '');
    
    if (baseIntention === 'attack') {
        return '/static/game.data/icons/attackcharge.png';
    }
    
    if (baseIntention === 'attack_skill') {
        // Pegar ícone da primeira attack skill disponível
        if (skillsData && skillsData.attack_skills) {
            const firstSkill = Object.values(skillsData.attack_skills)[0];
            return firstSkill?.icon || '/static/game.data/icons/sk1.png';
        }
        return '/static/game.data/icons/sk1.png';
    }

    if (baseIntention === 'buff_debuff') {
        // Ícone genérico de "utility/support"
        // Pode usar ícone de buff como padrão
        return '/static/game.data/icons/sk2.png';
    }
    
    return '/static/game.data/icons/attackcharge.png';
}

/**
 * Obter descrição da intenção
 */
function getIntentionDescription(intention) {
    const baseIntention = intention.replace(/_\d+$/, '');
    
    const descriptions = {
        'attack': '⚔️ Ataque Básico',
        'attack_skill': '🔥 Skill de Ataque',
        'buff': '💚 Buff (Fortalecimento)',
        'debuff': '💜 Debuff (Enfraquecimento)',
        'buff_debuff': '🔮 Buff/Debuff'
    };
    
    return descriptions[baseIntention] || '❓ Ação Desconhecida';
}

/**
 * Carregar dados das skills (cache simples)
 */
let cachedSkillsData = null;
async function loadSkillsData() {
    if (cachedSkillsData) return cachedSkillsData;
    
    try {
        const response = await fetch('/static/game.data/enemy_skills_data.json');
        cachedSkillsData = await response.json();
        return cachedSkillsData;
    } catch (error) {
        console.error('Erro ao carregar skills data:', error);
        return null;
    }
}

/**
 * Verifica se o turno do inimigo acabou (sem mais ações)
 * e reabilita botão se necessário
 */
async function checkAndEndEnemyTurnIfComplete() {
    try {
        const response = await fetch('/gamification/enemy_attack_status');
        const data = await response.json();
        
        if (!data.success) return false;
        
        // Verificar se há ações de ataque pendentes
        const hasAttacksRemaining = data.status.charges_count > 0 || 
            (data.status.action_queue && 
             data.status.action_queue.some(action => 
                 action.type === 'attack' || action.type === 'attack_skill'
             ));
        
        if (!hasAttacksRemaining) {
            console.log('✅ Turno do inimigo completo (sem mais ataques), restaurando turno ao jogador');
            
            // Reabilitar botão
            if (typeof enableEndTurnButton === 'function') {
                enableEndTurnButton();
            }
            
            // Feedback
            const feedback = document.createElement('div');
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
                color: #4CAF50;
                padding: 30px 50px;
                border-radius: 20px;
                font-size: 24px;
                font-weight: bold;
                font-family: 'Cinzel', serif;
                z-index: 9999;
                border: 4px solid #4CAF50;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
                animation: feedbackPop 0.5s ease-out;
            `;
            feedback.textContent = '✅ Seu Turno!';
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.style.animation = 'feedbackFade 0.5s ease-out';
                setTimeout(() => feedback.remove(), 500);
            }, 1500);
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao verificar fim do turno:', error);
        return false;
    }
}

// Expor globalmente
window.checkAndEndEnemyTurnIfComplete = checkAndEndEnemyTurnIfComplete;

/**
 * Mostrar feedback visual ao terminar turno
 */
function showTurnFeedback(data) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(20, 20, 40, 0.15) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        color: white;
        padding: 20px 35px;
        border-radius: 16px;
        font-size: 20px;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        z-index: 9999;
        border: 1px solid rgba(255, 255, 255, 0.3);
        text-align: center;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(255, 215, 0, 0.2);
        animation: feedbackPop 0.5s ease-out;
    `;

    const actionsText = data.num_actions === 1 ? 'ação' : 'ações';

    feedback.innerHTML = `
        <div style="color: #ffd700; margin-bottom: 8px; font-size: 16px;">⚔️ TURNO DO INIMIGO ⚔️</div>
        <div style="font-size: 18px;">${data.enemy_name}</div>
        <div style="color: #ff6b6b; margin-top: 10px; font-size: 16px;">
            ${data.num_actions} ${actionsText} preparada${data.num_actions > 1 ? 's' : ''}!
        </div>
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.animation = 'feedbackFade 0.5s ease-out';
        setTimeout(() => feedback.remove(), 500);
    }, 2500);
}

// ==========================================
// SISTEMA DE PARTÍCULAS DO SWITCH
// ==========================================

let particleInterval = null;

/**
 * Inicializar sistema de partículas do switch de turno
 */
function initTurnParticles(toggle, track) {
    // Limpar intervalo anterior se existir
    if (particleInterval) {
        clearInterval(particleInterval);
    }

    // Criar partículas periodicamente
    particleInterval = setInterval(() => {
        const count = toggle.checked ? 4 : 5;
        for (let i = 0; i < count; i++) {
            setTimeout(() => createTurnParticle(toggle, track), Math.random() * 100);
        }
    }, 100);
}

/**
 * Criar uma partícula individual
 */
function createTurnParticle(toggle, track) {
    if (!track) return;

    const particle = document.createElement('div');
    particle.classList.add('turn-particle');

    const isEnemyTurn = toggle.checked;

    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    if (isEnemyTurn) {
        particle.style.background = `rgba(255, ${Math.random() * 50}, 50, 0.8)`;
        particle.style.boxShadow = `0 0 8px rgba(255, 0, 0, 0.6)`;
    } else {
        particle.style.background = `rgba(200, 255, 255, 0.9)`;
        particle.style.boxShadow = `0 0 10px rgba(100, 255, 255, 0.8)`;
    }

    const randomY = (Math.random() - 0.5) * 30;
    let startX, startY;

    if (isEnemyTurn) {
        startX = 170; // Posição do knob na direita
    } else {
        startX = 30;  // Posição do knob na esquerda
    }
    startY = 30 + randomY;

    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    const moveDistance = Math.random() * 60 + 30;
    const duration = Math.random() * 1 + 0.5;

    track.appendChild(particle);

    const destinationX = isEnemyTurn ? startX - moveDistance : startX + moveDistance;

    const animation = particle.animate([
        { transform: `translate(0, 0) scale(1)`, opacity: isEnemyTurn ? 0.6 : 0.9 },
        { transform: `translate(${destinationX - startX}px, ${(Math.random() - 0.5) * 20}px) scale(0)`, opacity: 0 }
    ], {
        duration: duration * 1000,
        easing: 'ease-out'
    });

    animation.onfinish = () => {
        particle.remove();
    };
}

/**
 * Parar sistema de partículas (limpar ao sair da batalha)
 */
function stopTurnParticles() {
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
}

/**
 * Resetar estado do turno (para nova batalha)
 */
function resetTurnState() {
    turnState.isPlayerTurn = true;
    turnState.isProcessing = false;
    turnState.isLocked = false;
    setTurnToPlayer();
    console.log('🔄 Estado do turno resetado');
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Inicializando sistema de turnos...');

    // Inicializar Turn Switch (novo)
    initTurnSwitch();

    // Fallback: Event listener para botão antigo (compatibilidade)
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', endPlayerTurn);
        console.log('✅ Fallback: Botão antigo configurado');
    }

    // Atualizar HUD unificado de ações ao carregar a página
    setTimeout(() => {
        updateEnemyActionsHUD();
        console.log('✅ HUD de ações do inimigo carregado');
    }, 1000);
});

// Expor funções globalmente para outros scripts
window.endPlayerTurn = endPlayerTurn;
window.enableEndTurnButton = enableEndTurnButton;
window.setTurnToEnemy = setTurnToEnemy;
window.setTurnToPlayer = setTurnToPlayer;
window.resetTurnState = resetTurnState;
window.initTurnSwitch = initTurnSwitch;
window.stopTurnParticles = stopTurnParticles;
window.updateEnemyIntentions = updateEnemyIntentions; // Legado
window.updateEnemyActionsHUD = updateEnemyActionsHUD; // Novo unificado
window.updateChargesHUD = updateChargesHUD;
window.hideEnemyActionsHUD = hideEnemyActionsHUD;