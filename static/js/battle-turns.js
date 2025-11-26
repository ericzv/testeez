// ==========================================
// SISTEMA DE TURNOS - JavaScript
// ==========================================

console.log('🎮 Sistema de Turnos carregado');

/**
 * Terminar turno do jogador e processar turno do inimigo
 */
async function endPlayerTurn() {
    const btn = document.getElementById('end-turn-btn');
    if (!btn) {
        console.error('❌ Botão end-turn-btn não encontrado');
        return;
    }
    
    // Verificar se já está processando
    if (btn.disabled) {
        console.warn('⚠️ Turno já está sendo processado');
        return;
    }
    
    // CAPTURAR HTML ORIGINAL ANTES DE MODIFICAR
    const originalHTML = btn.innerHTML;
    
    // Desabilitar botão temporariamente
    btn.disabled = true;
    btn.querySelector('.turn-icon-img').style.filter = 'grayscale(100%)';
    btn.querySelector('.turn-icon-img').style.animation = 'none';
    
    try {
        console.log('🎮 Jogador terminando turno...');
        
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

            // Se tem ações, habilitar sistemas de combate
            if (data.has_actions) {
                console.log('⚔️ Inimigo tem ações disponíveis!');
                
                // DESABILITAR BOTÃO ATÉ JOGADOR RESOLVER AS AÇÕES DO INIMIGO
                btn.disabled = true;
                btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 15px rgba(255, 68, 68, 0.8)) grayscale(30%)';
                btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
                
                console.log('🔒 Botão desabilitado - Aguardando resolução das ações do inimigo');
            } else {
                // Sem ações, reabilitar botão
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        } else {
            console.error('❌ Erro ao processar turno:', data.message);
            alert('Erro: ' + data.message);
            // Reabilitar em caso de erro
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        alert('Erro ao processar turno!');
        // Reabilitar em caso de erro
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

/**
 * Reabilitar botão de terminar turno (chamar quando jogador resolver ações do inimigo)
 */
function enableEndTurnButton() {
    const btn = document.getElementById('end-turn-btn');
    if (!btn) return;
    
    btn.disabled = false;
    btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.6))';
    btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
    
    console.log('✅ Botão de terminar turno reabilitado');
    
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

        // ===== CONTROLE DO BOTÃO END TURN =====
        const btn = document.getElementById('end-turn-btn');
        if (btn) {
            if (isCurrentTurn && actionsToShow.length > 0) {
                // Turno do inimigo - desabilitar botão
                console.log('🔒 Botão desabilitado - Inimigo tem ações pendentes');
                btn.disabled = true;
                btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 15px rgba(255, 68, 68, 0.8)) grayscale(30%)';
                btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
            } else {
                // Turno do jogador - habilitar botão
                console.log('✅ Botão habilitado - Turno do jogador');
                btn.disabled = false;
                btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.6))';
                btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
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
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Inicializando sistema de turnos...');
    
    // Event listener para o botão
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', endPlayerTurn);
        console.log('✅ Botão de terminar turno configurado');
    } else {
        console.warn('⚠️ Botão end-turn-btn não encontrado no DOM');
    }
    
    // Atualizar HUD unificado de ações ao carregar a página
    setTimeout(() => {
        updateEnemyActionsHUD();
        console.log('✅ HUD de ações do inimigo carregado');
    }, 1000);
});

// Expor funções globalmente para outros scripts
window.endPlayerTurn = endPlayerTurn;
window.updateEnemyIntentions = updateEnemyIntentions; // Legado
window.updateEnemyActionsHUD = updateEnemyActionsHUD; // Novo unificado
window.updateChargesHUD = updateChargesHUD;
window.hideEnemyActionsHUD = hideEnemyActionsHUD;