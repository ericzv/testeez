/**
 * Sistema de Blood Stacks (Sangue Coagulado) para o Vlad
 */

function updateBloodStacksDisplay(stacks) {
    console.log(`🩸 Atualizando Blood Stacks display: ${stacks}`);

    const container = document.getElementById('blood-stacks-container');
    if (!container) {
        console.error('❌ Container de blood stacks não encontrado!');
        return;
    }

    // Limpar ícones antigos
    container.innerHTML = '';

    if (stacks <= 0) {
        container.style.display = 'none';
        return;
    }

    // Mostrar container
    container.style.display = 'flex';

    // Adicionar ícones (um para cada stack)
    for (let i = 0; i < stacks; i++) {
        const icon = document.createElement('img');
        icon.src = '/static/game.data/icons/blood_charge.png';
        icon.className = 'blood-stack-icon';
        icon.alt = 'Sangue Coagulado';

        // Animação de fade-in com delay progressivo
        icon.style.opacity = '0';
        icon.style.animation = `bloodStackFadeIn 0.3s ease ${i * 0.05}s forwards`;

        container.appendChild(icon);
    }
}

function consumeBloodStacks() {
    console.log('🩸 Consumindo Blood Stacks com animação');

    const container = document.getElementById('blood-stacks-container');
    if (!container) return;

    const icons = container.querySelectorAll('.blood-stack-icon');

    // Animar consumo de todos os ícones
    icons.forEach((icon, index) => {
        icon.style.animation = `bloodStackConsume 0.4s ease ${index * 0.05}s forwards`;
    });

    // Limpar após animação
    setTimeout(() => {
        container.innerHTML = '';
        container.style.display = 'none';
    }, 500 + (icons.length * 50));
}

// Adicionar CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    .blood-stacks-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 8px;
        background: rgba(139, 0, 0, 0.2);
        border: 2px solid rgba(220, 20, 60, 0.6);
        border-radius: 8px;
        margin-bottom: 8px;
        justify-content: center;
        max-width: 200px;
        margin-left: auto;
        margin-right: auto;
    }

    .blood-stack-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
        filter: drop-shadow(0 0 4px rgba(220, 20, 60, 0.8));
    }

    @keyframes bloodStackFadeIn {
        from {
            opacity: 0;
            transform: scale(0.5) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes bloodStackConsume {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.5);
        }
        100% {
            opacity: 0;
            transform: scale(2) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Battle Blood Stacks System carregado');
