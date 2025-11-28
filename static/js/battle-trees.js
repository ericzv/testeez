// Sistema simplificado de árvores (sem PixiJS)

function calculateResponsiveTreeScale(verticalPos) {
    const baseSize = 0.9 + (verticalPos / 100) * 0.8;
    return baseSize;
}

function initializeTrees() {
    console.log("🌳 Inicializando árvores");

    const leftTrees = document.querySelectorAll('.tree-paralax.left-side');
    const rightTrees = document.querySelectorAll('.tree-paralax.right-side');

    console.log("Árvores encontradas - Esquerda:", leftTrees.length, "Direita:", rightTrees.length);

    // Inicializar árvores do lado esquerdo
    leftTrees.forEach((tree, index) => {
        // Posição vertical aleatória com distribuição vertical
        const verticalPos = -40 + (index * 12) + (Math.random() * 10);
        const horizontalVariation = Math.random() * 50;

        // Aplicar estilos
        tree.style.display = 'block';
        tree.style.opacity = '0.8';

        const responsiveScale = calculateResponsiveTreeScale(verticalPos);
        tree.style.setProperty('--tree-scale', responsiveScale);

        tree.style.top = `${verticalPos}%`;
        tree.style.left = `${-100 + horizontalVariation}px`;
        tree.style.right = 'auto';

        // Delay aleatório para animação
        const randomDelay = Math.random() * 3;
        tree.style.animationDelay = `${randomDelay}s`;

        // Z-index baseado na posição vertical
        tree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;
    });

    // Inicializar árvores do lado direito
    rightTrees.forEach((tree, index) => {
        // Posição vertical aleatória com distribuição vertical
        const verticalPos = -40 + (index * 12) + (Math.random() * 10);
        const horizontalVariation = Math.random() * 50;

        // Aplicar estilos
        tree.style.display = 'block';
        tree.style.opacity = '0.8';

        const randomSize = 0.7 + Math.random() * 0.6;
        tree.style.setProperty('--tree-scale', randomSize);

        tree.style.top = `${verticalPos}%`;
        tree.style.left = 'auto';
        tree.style.right = `${-100 + horizontalVariation}px`;

        // Delay aleatório para animação
        const randomDelay = Math.random() * 3;
        tree.style.animationDelay = `${randomDelay}s`;

        // Z-index baseado na posição vertical
        tree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;
    });

    console.log("✅ Árvores inicializadas");
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTrees);
} else {
    initializeTrees();
}
