// battle-sakura.js - Animações específicas do tema sakura
// Versão 1.0

// Função para calcular escala responsiva das árvores
function calculateResponsiveTreeScale(verticalPos) {
    // Fator de escala baseado no tamanho da tela
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calcular fator responsivo (telas menores = árvores menores)
    let screenFactor;
    if (screenWidth <= 768) {
        // Mobile: escala moderada (aumentada de 0.6 para 0.9)
        screenFactor = Math.min(screenWidth / 768, screenHeight / 1024) * 0.9;
    } else if (screenWidth <= 1366) {
        // Telas médias: escala moderada
        screenFactor = Math.min(screenWidth / 1366, screenHeight / 768) * 0.8;
    } else {
        // Telas grandes: escala normal
        screenFactor = Math.min(screenWidth / 1920, 1.0);
    }
    
    // Limitar o fator entre 0.3 e 1.2
    screenFactor = Math.max(0.3, Math.min(1.2, screenFactor));
    
    // Base com perspectiva (árvores mais embaixo ficam maiores)
    const perspectiveFactor = 0.8 + ((verticalPos + 40) / 90) * 0.8;
    
    // Variação aleatória (±5%)
    const randomFactor = 0.95 + Math.random() * 0.1;
    
    // Combinar todos os fatores
    const finalScale = perspectiveFactor * screenFactor * randomFactor;
    
    return Math.max(0.2, Math.min(2.0, finalScale)); // Limitar entre 0.2 e 2.0
}

// Inicializar árvores com posições variadas
function initializeTrees() {
    // Definir posições verticais (do topo até o fundo)
    const verticalPositions = [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
    
    // Acessar todas as árvores
    const leftTrees = document.querySelectorAll('.tree-paralax.left-side');
    const rightTrees = document.querySelectorAll('.tree-paralax.right-side');
    
    // Garantir que temos exatamente 10 árvores de cada lado
    console.log("Árvores encontradas - Esquerda:", leftTrees.length, "Direita:", rightTrees.length);
    
    // Distribuir árvores da esquerda com posições fixas
    leftTrees.forEach((tree, index) => {
        if (index >= 10) return;
        
        // Desativar transição temporariamente
        tree.classList.add('no-transition');
        
        // Garantir que a árvore está visível
        tree.style.display = 'block';
        tree.style.opacity = '0.8';
        
        const verticalPos = verticalPositions[index];
        const horizontalVariation = -30 + Math.random() * 60;
        
        // Calcular escala responsiva
        const responsiveScale = calculateResponsiveTreeScale(verticalPos);
        
        // Definir a variável CSS para a escala responsiva
        tree.style.setProperty('--tree-scale', responsiveScale);
        
        // Aplicar posições
        tree.style.top = `${verticalPos}%`;
        tree.style.left = `${-100 + horizontalVariation}px`;
        tree.style.right = 'auto';
        
        // Forçar reflow do navegador para garantir aplicação imediata
        void tree.offsetWidth;
        
        // Restaurar transição após um pequeno delay
        setTimeout(() => {
            tree.classList.remove('no-transition');
        }, 10);
        
        // Aplicar variação na rotação para o balanço
        const randomDelay = Math.random() * 3;
        tree.style.animationDelay = `${randomDelay}s`;
        
        // Z-index baseado na posição vertical
        tree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;
    });
    
    // Distribuir árvores da direita com posições fixas
    rightTrees.forEach((tree, index) => {
        if (index >= 10) return;
        
        // Desativar transição temporariamente
        tree.classList.add('no-transition');
        
        // Garantir que a árvore está visível
        tree.style.display = 'block';
        tree.style.opacity = '0.8';
        
        const verticalPos = verticalPositions[index];
        const horizontalVariation = -30 + Math.random() * 60;
        
        // Calcular escala baseada na posição vertical
        const baseSize = 0.8 + ((verticalPos + 40) / 90) * 0.8;
        const randomSize = baseSize * (0.95 + Math.random() * 0.1);
        
        // Definir a variável CSS para a escala em vez de transform diretamente
        tree.style.setProperty('--tree-scale', randomSize);
        
        // Aplicar posições
        tree.style.top = `${verticalPos}%`;
        tree.style.left = 'auto';
        tree.style.right = `${-100 + horizontalVariation}px`;
        
        // Forçar reflow do navegador para garantir aplicação imediata
        void tree.offsetWidth;
        
        // Restaurar transição após um pequeno delay
        setTimeout(() => {
            tree.classList.remove('no-transition');
        }, 10);
        
        // Aplicar variação na rotação para o balanço
        const randomDelay = Math.random() * 3;
        tree.style.animationDelay = `${randomDelay}s`;
        
        // Z-index baseado na posição vertical
        tree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;
    });
    
    // Garantir que o container de árvores está visível
    document.getElementById('tree-paralax-container').style.visibility = 'visible';
    document.getElementById('tree-paralax-container').style.opacity = '1';
    console.log("Árvores inicializadas:", document.querySelectorAll('.tree-paralax').length);
    console.log("Amostra de árvore:", document.querySelector('.tree-paralax')?.style.backgroundImage);
}

// Função para criar árvores transitórias que atravessam a tela
function createTransitionalTrees(direction) {
    console.log("Criando árvores transitórias na direção:", direction);
    
    // Acessar o container de árvores
    const treeContainer = document.getElementById('tree-paralax-container');
    
    // Número de árvores transitórias
    const numTrees = 8;
    
    // Variações de posição vertical (todas na parte inferior)
    const verticalPositions = [60, 65, 70, 75, 80, 85, 90, 95];
    
    // Duração da animação
    const animationDuration = 1000; // 1 segundo
    
    // Largura da janela para calcular distâncias
    const windowWidth = window.innerWidth;
    
    for (let i = 0; i < numTrees; i++) {
        // Criar nova árvore
        const transitionalTree = document.createElement('div');
        transitionalTree.classList.add('tree-paralax', 'transitional-tree', 'no-transition');
        
        // Posição vertical com variação
        const verticalPos = verticalPositions[i % verticalPositions.length];
        
        // Calcular escala responsiva para árvores transitórias
        const treeScale = calculateResponsiveTreeScale(verticalPos) * 1.2; // 20% maior que as normais
        transitionalTree.style.setProperty('--tree-scale', treeScale);
        
        // Aplicar filtro de brilho semelhante às árvores existentes
        transitionalTree.style.filter = 'brightness(0.8)';
        
        // Variação no delay de animação para não parecer muito uniforme
        const startDelay = i * 100; // 100ms entre cada árvore
        
        // Configurar posição inicial e final baseada na direção
        if (direction === 'left-to-right') {
            // Começa fora da tela à esquerda
            transitionalTree.style.left = `-500px`;
            transitionalTree.style.right = 'auto';
            
            // Calcula posição horizontal distribuída uniformemente
            const horizontalOffset = i * (windowWidth / numTrees);
            transitionalTree.style.left = `${-500 - horizontalOffset}px`;
        } else { // right-to-left
            // Começa fora da tela à direita
            transitionalTree.style.right = `-500px`;
            transitionalTree.style.left = 'auto';
            
            // Calcula posição horizontal distribuída uniformemente
            const horizontalOffset = i * (windowWidth / numTrees);
            transitionalTree.style.right = `${-500 - horizontalOffset}px`;
        }
        
        // Posição vertical
        transitionalTree.style.top = `${verticalPos}%`;
        transitionalTree.style.opacity = '0.8';
        
        // Z-index para ficar atrás dos personagens
        transitionalTree.style.zIndex = '880';
        
        // Adicionar ao container
        treeContainer.appendChild(transitionalTree);
        
        // Forçar reflow do navegador para garantir aplicação de estilos
        void transitionalTree.offsetWidth;
        
        // Remover a classe no-transition após um pequeno delay
        setTimeout(() => {
            transitionalTree.classList.remove('no-transition');
            
            // Configurar a transição para 1 segundo
            transitionalTree.style.transition = `transform ${animationDuration}ms linear, left ${animationDuration}ms linear, right ${animationDuration}ms linear`;
            
            // Iniciar a animação baseada na direção
            if (direction === 'left-to-right') {
                transitionalTree.style.transform = `translateX(${windowWidth + 500}px)`;
            } else { // right-to-left
                transitionalTree.style.transform = `translateX(-${windowWidth + 500}px)`;
            }
            
            // Remover a árvore após a conclusão da animação
            setTimeout(() => {
                transitionalTree.remove();
            }, animationDuration + 100); // Um pouco mais do que a duração para garantir
            
        }, startDelay);
    }
}

// Função para animar árvores
function animateTrees(direction) {
    console.log("Animando árvores:", direction);

    createTransitionalTrees(direction);
    
    // Acessar o container de árvores
    const treeContainer = document.getElementById('tree-paralax-container');
    
    // Acessar as árvores dos dois lados
    const leftTrees = document.querySelectorAll('.tree-paralax.left-side');
    const rightTrees = document.querySelectorAll('.tree-paralax.right-side');
    
    console.log("Árvores antes da animação - Esquerda:", leftTrees.length, "Direita:", rightTrees.length);
    
    // Definir posições verticais (do topo até o fundo)
    const verticalPositions = [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
    
    // Duração total em milissegundos (base)
    const baseDuration = 1000;
    
    // Largura da janela para calcular distâncias
    const windowWidth = window.innerWidth;
    
    if (direction === 'left-to-right') {
        console.log("Animando da esquerda para a direita");
        
        // 1. Mover árvores da ESQUERDA para a DIREITA
        leftTrees.forEach((tree, index) => {
            // Remover classes anteriores
            tree.classList.remove('left-to-right', 'right-to-left', 'animate');
            
            // Calcular posição inicial
            const initialLeft = parseInt(tree.style.left || '-100');
            const currentTop = parseInt(tree.style.top || '0');
            
            // Calcular posição final na direita (com variação)
            const horizontalVariation = -30 + Math.random() * 60;
            const finalRight = -100 + horizontalVariation;
            
            // Manter a mesma posição vertical
            const verticalPos = currentTop;
            
            // Ajustar velocidade baseada na posição vertical
            // Valores mais altos de verticalPos (mais embaixo na tela) resultam em durações menores (movimento mais rápido)
            const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
            const duration = baseDuration / speedFactor;
            
            // Distância total a percorrer
            const distanceToTravel = windowWidth + initialLeft + Math.abs(finalRight);
            
            // Iniciar animação
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                if (progress < 1) {
                    // Calcular posição atual
                    const currentPos = initialLeft + distanceToTravel * progress;
                    tree.style.left = `${currentPos}px`;
                    tree.style.right = 'auto';
                    
                    requestAnimationFrame(animate);
                } else {
                    // Animação concluída - configurar posição final
                    tree.style.left = 'auto';
                    tree.style.right = `${finalRight}px`;
                    tree.style.top = `${verticalPos}%`;
                    
                    // IMPORTANTE: Mudar a classe do lado - agora é uma árvore da direita
                    tree.classList.remove('left-side');
                    tree.classList.add('right-side');
                    
                    // Ajustar z-index baseado na posição vertical
                    tree.style.zIndex = `${900 + parseInt(verticalPos / 10)}`;
                }
            }
            
            // Iniciar a animação
            requestAnimationFrame(animate);
        });
        
        // 2. NOVO: Mover TODAS as árvores da DIREITA para FORA da tela (efeito carrossel)
        rightTrees.forEach((tree, index) => {
            // Remover classes anteriores
            tree.classList.remove('left-to-right', 'right-to-left', 'animate');
            
            // Calcular posição inicial
            const initialRight = parseInt(tree.style.right || '-100');
            const initialLeft = tree.getBoundingClientRect().left;
            const currentTop = parseInt(tree.style.top || '0');
            
            // Ajustar velocidade baseada na posição vertical
            const verticalPos = currentTop;
            const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
            const duration = baseDuration / speedFactor;
            
            // Distância para mover para fora da tela
            const distanceToTravel = windowWidth + 500; // Garantir que saia completamente
            
            // Iniciar animação
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                if (progress < 1) {
                    // Mover para a direita (fora da tela)
                    const currentPos = initialLeft + distanceToTravel * progress;
                    tree.style.left = `${currentPos}px`;
                    tree.style.right = 'auto';
                    
                    // Gradualmente diminuir a opacidade
                    if (progress > 0.7) {
                        tree.style.opacity = Math.max(0, 0.8 - ((progress - 0.7) * 2.5));
                    }
                    
                    requestAnimationFrame(animate);
                } else {
                    // Remover a árvore quando estiver fora da tela
                    tree.remove();
                }
            }
            
            // Iniciar a animação
            requestAnimationFrame(animate);
        });
        
        // 3. Criar NOVAS árvores na ESQUERDA após a transição
        setTimeout(() => {
            console.log("Criando novas árvores à esquerda");
            
            // Criar 10 novas árvores na esquerda
            for (let i = 0; i < 10; i++) {
                // Criar nova árvore
                const newTree = document.createElement('div');
                newTree.classList.add('tree-paralax', 'left-side', 'no-transition');
                
                // Escolher uma posição vertical
                const verticalPos = verticalPositions[i];
                
                // Variação horizontal aleatória (-30px a +30px)
                const horizontalVariation = -30 + Math.random() * 60;
                
                // Calcular escala responsiva
                const responsiveScale = calculateResponsiveTreeScale(verticalPos);
                
                const finalLeft = -100 + horizontalVariation;
                
                // Configurar a posição inicial (fora da tela à esquerda)
                newTree.style.left = `-400px`;
                newTree.style.right = 'auto';
                newTree.style.top = `${verticalPos}%`;
                newTree.style.setProperty('--tree-scale', responsiveScale);
                newTree.style.opacity = '0.8';
                newTree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;

                // Forçar reflow do navegador
                void newTree.offsetWidth;
                
                // Aplicar variação no delay de animação do balanço
                const randomDelay = Math.random() * 3;
                newTree.style.animationDelay = `${randomDelay}s`;
                
                // Adicionar ao container
                treeContainer.appendChild(newTree);

                // Forçar reflow do navegador para garantir que o tamanho seja aplicado
                void newTree.offsetWidth;

                // Remover a classe no-transition após um delay maior
                setTimeout(() => {
                    // Forçar um novo reflow antes de remover a classe
                    void newTree.offsetWidth;
                    newTree.classList.remove('no-transition');
                }, 100); // Aumentado de 10ms para 100ms
                
                // Distância a percorrer
                const distanceToTravel = 300 + horizontalVariation;
                
                // Ajustar velocidade baseada na posição vertical
                const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
                const duration = baseDuration / speedFactor;
                
                // Iniciar animação após um pequeno delay
                setTimeout(() => {
                    // Iniciar a animação de entrada
                    const startTime = performance.now();
                    
                    function animate(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        
                        if (progress < 1) {
                            // Calcular posição atual
                            const currentPos = -400 + distanceToTravel * progress;
                            newTree.style.left = `${currentPos}px`;
                            
                            requestAnimationFrame(animate);
                        } else {
                            // Posição final
                            newTree.style.left = `${finalLeft}px`;
                        }
                    }
                    
                    // Iniciar a animação
                    requestAnimationFrame(animate);
                }, 50 * i); // Delay escalonado para cada árvore
            }
        }, 400); // Delay para garantir que a transição principal termine primeiro
        
    } else if (direction === 'right-to-left') {
        console.log("Animando da direita para a esquerda");
        
        // 1. Mover árvores da DIREITA para a ESQUERDA
        rightTrees.forEach((tree, index) => {
            // Remover classes anteriores
            tree.classList.remove('left-to-right', 'right-to-left', 'animate');
            
            // Calcular posição inicial
            const initialRight = parseInt(tree.style.right || '-100');
            const initialLeft = tree.getBoundingClientRect().left;
            const currentTop = parseInt(tree.style.top || '0');
            
            // Calcular posição final na esquerda (com variação)
            const horizontalVariation = -30 + Math.random() * 60;
            const finalLeft = -100 + horizontalVariation;
            
            // Manter a mesma posição vertical
            const verticalPos = currentTop;
            
            // Ajustar velocidade baseada na posição vertical
            const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
            const duration = baseDuration / speedFactor;
            
            // Distância total a percorrer
            const distanceToTravel = initialLeft + Math.abs(finalLeft);
            
            // Iniciar animação
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                if (progress < 1) {
                    // Calcular posição atual
                    const currentPos = initialLeft - distanceToTravel * progress;
                    tree.style.left = `${currentPos}px`;
                    tree.style.right = 'auto';
                    
                    requestAnimationFrame(animate);
                } else {
                    // Animação concluída - configurar posição final
                    tree.style.right = 'auto';
                    tree.style.left = `${finalLeft}px`;
                    tree.style.top = `${verticalPos}%`;
                    
                    // IMPORTANTE: Mudar a classe do lado - agora é uma árvore da esquerda
                    tree.classList.remove('right-side');
                    tree.classList.add('left-side');
                    
                    // Ajustar z-index baseado na posição vertical
                    tree.style.zIndex = `${900 + parseInt(verticalPos / 10)}`;
                }
            }
            
            // Iniciar a animação
            requestAnimationFrame(animate);
        });
        
        // 2. NOVO: Mover TODAS as árvores da ESQUERDA para FORA da tela (efeito carrossel)
        leftTrees.forEach((tree, index) => {
            // Remover classes anteriores
            tree.classList.remove('left-to-right', 'right-to-left', 'animate');
            
            // Calcular posição inicial
            const initialLeft = parseInt(tree.style.left || '-100');
            const currentTop = parseInt(tree.style.top || '0');
            
            // Ajustar velocidade baseada na posição vertical
            const verticalPos = currentTop;
            const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
            const duration = baseDuration / speedFactor;
            
            // Distância para mover para fora da tela
            const distanceToTravel = initialLeft + 500; // Garantir que saia completamente
            
            // Iniciar animação
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                if (progress < 1) {
                    // Mover para a esquerda (fora da tela)
                    const currentPos = initialLeft - distanceToTravel * progress;
                    tree.style.left = `${currentPos}px`;
                    
                    // Gradualmente diminuir a opacidade
                    if (progress > 0.7) {
                        tree.style.opacity = Math.max(0, 0.8 - ((progress - 0.7) * 2.5));
                    }
                    
                    requestAnimationFrame(animate);
                } else {
                    // Remover a árvore quando estiver fora da tela
                    tree.remove();
                }
            }
            
            // Iniciar a animação
            requestAnimationFrame(animate);
        });
        
        // 3. Criar NOVAS árvores na DIREITA após a transição
        setTimeout(() => {
            console.log("Criando novas árvores à direita");
            
            // Criar 10 novas árvores na direita
            for (let i = 0; i < 10; i++) {
                // Criar nova árvore
                const newTree = document.createElement('div');
                newTree.classList.add('tree-paralax', 'right-side', 'no-transition');
                
                // Escolher uma posição vertical
                const verticalPos = verticalPositions[i];
                
                // Variação horizontal aleatória (-30px a +30px)
                const horizontalVariation = -30 + Math.random() * 60;
                
                // MODIFICAÇÃO: Tamanho baseado na posição vertical
                const baseSize = 0.8 + ((verticalPos + 40) / 90) * 0.8;
                const randomSize = baseSize * (0.95 + Math.random() * 0.1);
                
                const finalRight = -100 + horizontalVariation;
                
                // Configurar a posição inicial (fora da tela à direita)
                newTree.style.right = `-400px`;
                newTree.style.left = 'auto';
                newTree.style.top = `${verticalPos}%`;
                newTree.style.setProperty('--tree-scale', randomSize);
                newTree.style.opacity = '0.8';
                newTree.style.zIndex = `${900 + parseInt((verticalPos + 40) / 10)}`;

                // Forçar reflow do navegador
                void newTree.offsetWidth;
                
                // Aplicar variação no delay de animação do balanço
                const randomDelay = Math.random() * 3;
                newTree.style.animationDelay = `${randomDelay}s`;
                
                // Adicionar ao container
                treeContainer.appendChild(newTree);

                // Remover a classe no-transition após um pequeno delay
                setTimeout(() => {
                    newTree.classList.remove('no-transition');
                }, 10);
                
                // Distância a percorrer
                const distanceToTravel = 300 + horizontalVariation;
                
                // Ajustar velocidade baseada na posição vertical
                const speedFactor = 1 + ((verticalPos + 40) / 90); // Normaliza para um valor entre 1 e 2
                const duration = baseDuration / speedFactor;
                
                // Iniciar animação após um pequeno delay
                setTimeout(() => {
                    // Iniciar a animação de entrada
                    const startTime = performance.now();
                    
                    function animate(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        
                        if (progress < 1) {
                            // Calcular posição atual
                            const currentPos = -400 + distanceToTravel * progress;
                            newTree.style.right = `${currentPos}px`;
                            
                            requestAnimationFrame(animate);
                        } else {
                            // Posição final
                            newTree.style.right = `${finalRight}px`;
                        }
                    }
                    
                    // Iniciar a animação
                    requestAnimationFrame(animate);
                }, 50 * i); // Delay escalonado para cada árvore
            }
        }, 400); // Delay para garantir que a transição principal termine primeiro
    }
    
    // Garantir que o container esteja visível
    treeContainer.style.visibility = 'visible';
    treeContainer.style.opacity = '1';
    
    // Verificar o resultado final
    setTimeout(() => {
        const finalLeftTrees = document.querySelectorAll('.tree-paralax.left-side');
        const finalRightTrees = document.querySelectorAll('.tree-paralax.right-side');
        console.log("Árvores após a animação - Esquerda:", finalLeftTrees.length, "Direita:", finalRightTrees.length);
    }, baseDuration + 500);
}

// Criar partículas de sangue  --------- RETIRAR, NAO ESTA MAIS SENDO USADA
function createBloodParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('blood-particle');
        
        // Position at the center of the boss
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Add to battle arena
        document.getElementById('battle-arena').appendChild(particle);
        
        // Animate particle - direcionado para a esquerda e para cima
        // Ângulo entre -180 (esquerda) e -270 (cima)
        const angle = Math.random() * (Math.PI/2) + Math.PI;
        const speed = Math.random() * 6 + 3;
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        let posX = x;
        let posY = y;
        let opacity = 0.9;
        let size = Math.random() * 4 + 4; // Tamanho variado
        
        // Definir tamanho inicial
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        function animateBlood() {
            posX += speedX * 0.7; // Mais lento
            posY += speedY * 0.7;
            opacity -= 0.02; // Desaparecer mais rápido
            size -= 0.05; // Diminuir gradualmente
            
            if (opacity <= 0 || size <= 1) {
                particle.remove();
                return;
            }
            
            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            particle.style.opacity = opacity;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            requestAnimationFrame(animateBlood);
        }
        
        // Delay aleatório para cada partícula
        setTimeout(animateBlood, Math.random() * 100);
    }
}

// Inicialização do tema Sakura
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando tema Sakura...");
    
    // Inicializar posições das árvores
    initializeTrees();
    
    // Aguardar o PixiJS estar pronto antes de criar pétalas
    function waitForPixiAndCreatePetals() {
        if (typeof window.createContinuousPetals === 'function' && 
            window.backgroundEffectsSystem && 
            window.backgroundEffectsSystem.isInitialized) {
            
            // Criar pétalas PixiJS usando o sistema separado
            const petalConfig = {
                count: 60,
                minSize: 2,
                maxSize: 5,
                colors: [0xFFB7C5, 0xFF8FA3, 0xFF69B4, 0xF48FB1],  // Gradient rosa natural
                fallSpeed: { min: 65, max: 90 },
                swayAmount: 35,
                rotationSpeed: 3.5,
                spawnRate: 1.3
            };
            
            window.createContinuousPetals(petalConfig);
            console.log("Tema Sakura inicializado com sucesso!");
        } else {
            // Tentar novamente em 500ms
            setTimeout(waitForPixiAndCreatePetals, 500);
        }
    }
    
    // Iniciar verificação
    waitForPixiAndCreatePetals();
});