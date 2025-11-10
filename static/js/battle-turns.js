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
            
            // Atualizar visualização de intenções
            await updateEnemyIntentions();
            
            // Mostrar feedback
            showTurnFeedback(data);
            
            // Se tem ações, habilitar sistemas de combate
            if (data.has_actions) {
                console.log('⚔️ Inimigo tem ações disponíveis!');
                
                // Atualizar HUD de cargas
                if (typeof updateChargesHUD === 'function') {
                    updateChargesHUD();
                }
                
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
    }, 1500);
}

// Expor função globalmente
window.showYourTurnFeedback = showYourTurnFeedback;

/**
 * Atualizar HUD de cargas de ataque (turno ATUAL do inimigo)
 * Mostra as ações que o inimigo vai executar NESTE turno
 * AGORA TAMBÉM desabilita o botão "End Turn" se houver ações pendentes na carga.
 */
async function updateChargesHUD() {
    try {
        const response = await fetch('/gamification/enemy_attack_status');
        const data = await response.json();
        
        if (!data.success) {
            console.warn('⚠️ Não foi possível obter status das cargas');
            return;
        }
        
        const status = data.status;
        const chargesContainer = document.getElementById('charges-container');
        const buffDebuffContainer = document.getElementById('buff-debuff-container');
        const enemyChargesHud = document.getElementById('enemy-charges-hud');
        
        if (!chargesContainer || !buffDebuffContainer || !enemyChargesHud) {
            console.error('❌ Containers de cargas não encontrados');
            return;
        }
        
        // ===== ATUALIZAR CARGAS DE ATAQUE =====
        const actionQueue = status.action_queue || [];
        const attackActions = actionQueue.filter(action => 
            action.type === 'attack' || action.type === 'attack_skill'
        );
        
        console.log('⚡ Atualizando charges HUD (TURNO ATUAL):', {
            total_actions: actionQueue.length,
            attack_actions: attackActions.length
        });
        
        chargesContainer.innerHTML = '';
        
        if (attackActions.length > 0) {
            // Mostrar ícones das cargas
            attackActions.forEach((action, index) => {
                const chargeIcon = document.createElement('div');
                
                if (action.type === 'attack') {
                    chargeIcon.className = 'attack-charge-icon';
                    // ADICIONADO (FEATURE 2): Tooltip com dano
                    chargeIcon.title = `⚔️ Ataque Básico (Dano: ${action.data.damage})`;
                } else if (action.type === 'attack_skill') {
                    chargeIcon.className = 'attack-charge-icon';
                    chargeIcon.style.backgroundImage = `url('${action.icon}')`;
                    // ADICIONADO (FEATURE 2): Tooltip com nome da skill e dano
                    // (action.data.calculated_damage virá do Python no Passo 2)
                    chargeIcon.title = `🔥 ${action.data?.name || 'Skill de Ataque'} (Dano: ${action.data.calculated_damage || '??'})`;
                }
                
                chargesContainer.appendChild(chargeIcon);
            });
            
            // Mostrar HUD
            enemyChargesHud.classList.add('visible');
        } else {
            chargesContainer.innerHTML = '<span class="no-charges-text">Aguardando turno</span>';
            // Esconder HUD se não houver ações
            // (Não remover 'visible' se buffs/debuffs ainda estiverem lá)
            if (status.buff_debuff_queue.length === 0) {
                enemyChargesHud.classList.remove('visible');
            }
        }
        
        // ===== ATUALIZAR BUFF/DEBUFF =====
        const buffDebuffQueue = status.buff_debuff_queue || [];
        
        if (buffDebuffQueue.length > 0) {
            buffDebuffContainer.innerHTML = '';
            buffDebuffContainer.style.display = 'flex';
            console.log('🔮 Buff/Debuff container ativado com', buffDebuffQueue.length, 'skill(s)');
            
            buffDebuffQueue.forEach(skill => {
                const skillIcon = document.createElement('div');
                skillIcon.className = skill.type === 'buff' ? 'buff-skill-icon' : 'debuff-skill-icon';
                skillIcon.style.backgroundImage = `url('${skill.icon}')`;
                skillIcon.title = skill.data?.name || (skill.type === 'buff' ? 'Buff' : 'Debuff');
                
                buffDebuffContainer.appendChild(skillIcon);
            });
            
            enemyChargesHud.classList.add('visible');
        } else {
            buffDebuffContainer.style.display = 'none';
        }

        // ===== CORREÇÃO DO BUG DO F5 (PROBLEMA 1) =====
        const btn = document.getElementById('end-turn-btn');
        if (btn) {
            if (attackActions.length > 0 || buffDebuffQueue.length > 0) {
                // Se o inimigo TEM ações, DESABILITE o botão
                console.log('🔒 Botão desabilitado (via F5) - Inimigo tem ações pendentes');
                btn.disabled = true;
                btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 15px rgba(255, 68, 68, 0.8)) grayscale(30%)';
                btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
            } else {
                // Se o inimigo NÃO TEM ações (é turno do jogador), HABILITE o botão
                // (Isso também garante que o botão volte ao normal se o F5 for
                // pressionado durante o turno do jogador)
                console.log('✅ Botão habilitado (via F5) - Turno do jogador');
                btn.disabled = false;
                btn.querySelector('.turn-icon-img').style.filter = 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.6))';
                btn.querySelector('.turn-icon-img').style.animation = 'rotateSlow 10s linear infinite';
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar charges HUD:', error);
    }
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
 * Atualizar visualização de intenções do inimigo
 */
async function updateEnemyIntentions() {
    try {
        const response = await fetch('/gamification/enemy_attack_status');
        const data = await response.json();
        
        if (!data.success) {
            console.warn('⚠️ Não foi possível obter intenções');
            return;
        }
        
        // 'intentions' agora é uma lista de OBJETOS RICOS
        const intentions = data.status.next_intentions || [];
        const container = document.getElementById('intentions-icons');
        
        if (!container) {
            console.error('❌ Container intentions-icons não encontrado');
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        console.log('🎯 Próximas intenções (OBJETOS):', intentions);
        console.log('📋 IMPORTANTE: Estas são as intenções do PRÓXIMO turno (não do turno atual)');
        
        if (intentions.length === 0) {
            container.innerHTML = '<span style="color: rgba(255,215,0,0.5); font-size: 14px;">Aguardando...</span>';
            return;
        }
        
        // NÃO PRECISAMOS MAIS DE: const skillsData = await loadSkillsData();
        // O backend já nos enviou tudo.

        // Criar ícone para cada intenção
        intentions.forEach((intention, index) => {
            // 'intention' é um OBJETO (ex: { type: "debuff", name: "Nictalopia", ... })
            
            const iconDiv = document.createElement('div');
            
            // Usar o .type para a classe CSS
            iconDiv.className = `intention-icon ${intention.type}`;
            
            // Usar o .icon (caminho completo) enviado pelo backend
            const iconPath = intention.icon;
            if (iconPath) {
                iconDiv.style.backgroundImage = `url('${iconPath}')`;
            } else {
                // Fallback se o ícone não vier
                iconDiv.style.backgroundImage = `url('/static/game.data/icons/attackcharge.png')`;
            }
            
            // Adicionar badge de ordem (código anterior estava correto)
            if (intentions.length > 1) {
                const badge = document.createElement('div');
                badge.className = 'intention-badge';
                badge.textContent = index + 1;
                iconDiv.appendChild(badge);
            }
            
            // Tooltip com descrição vinda do backend
            let tooltip = intention.name || 'Ação';
            
            // Adicionar dano ao tooltip se for um ataque
            if ((intention.type === 'attack' || intention.type === 'attack_skill') && intention.damage) {
                tooltip += ` (Dano: ${intention.damage})`;
            }
            iconDiv.title = tooltip;
            
            // Animação de entrada (código anterior estava correto)
            iconDiv.style.opacity = '0';
            iconDiv.style.transform = 'scale(0.5)';
            
            container.appendChild(iconDiv);
            
            // Animar entrada
            setTimeout(() => {
                iconDiv.style.transition = 'all 0.4s ease-out';
                iconDiv.style.opacity = '1';
                iconDiv.style.transform = 'scale(1)';
            }, index * 100);
        });
        
    } catch (error) {
        // Este é o erro que você viu
        console.error('❌ Erro ao atualizar intenções:', error);
    }
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
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
        color: white;
        padding: 40px 60px;
        border-radius: 20px;
        font-size: 28px;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        z-index: 9999;
        border: 4px solid #ffd700;
        text-align: center;
        box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(255, 215, 0, 0.4),
            inset 0 0 20px rgba(255, 215, 0, 0.1);
        animation: feedbackPop 0.5s ease-out;
    `;
    
    const actionsText = data.num_actions === 1 ? 'ação' : 'ações';
    
    feedback.innerHTML = `
        <div style="color: #ffd700; margin-bottom: 10px; font-size: 20px;">⚔️ TURNO DO INIMIGO ⚔️</div>
        <div style="font-size: 24px;">${data.enemy_name}</div>
        <div style="color: #ff6b6b; margin-top: 15px; font-size: 22px;">
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
    
    // Atualizar intenções ao carregar a página
    setTimeout(() => {
        updateEnemyIntentions();
        console.log('✅ Intenções iniciais carregadas');
    }, 1000);

    // Atualizar HUD de cargas ao carregar a página
    setTimeout(() => {
        updateChargesHUD();
        console.log('✅ HUD de cargas inicial carregado');
    }, 1200);
});

// Expor funções globalmente para outros scripts
window.endPlayerTurn = endPlayerTurn;
window.updateEnemyIntentions = updateEnemyIntentions;
window.updateChargesHUD = updateChargesHUD;