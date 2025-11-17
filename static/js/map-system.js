/**
 * Sistema de Mapa Procedural - Frontend Pixi.js
 * Renderiza o mapa estilo Slay the Spire
 */

class ProceduralMapSystem {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error(`Container ${containerId} não encontrado`);
            return;
        }

        // Configuração do Pixi
        this.app = new PIXI.Application({
            width: this.container.clientWidth || 900,
            height: 650,
            backgroundColor: 0x0f0f23,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true
        });
        this.container.appendChild(this.app.view);

        // Configuração visual
        this.config = {
            nodeRadius: 22,
            levelHeight: 38,
            columnWidth: 110,
            offsetX: 80,
            offsetY: 580, // Começa de baixo
            maxLevels: 16 // 15 níveis + boss
        };

        // Ícones por tipo de nó
        this.nodeIcons = {
            battle: '⚔️',
            elite: '🔥',
            shop: '🛒',
            event: '❓',
            rest: '🏕️',
            boss: '💀'
        };

        // Cores por tipo de nó
        this.nodeColors = {
            battle: 0x4a5568,
            elite: 0xdc2626,
            shop: 0xfbbf24,
            event: 0x10b981,
            rest: 0x3b82f6,
            boss: 0x9333ea
        };

        // Estado
        this.nodes = {};
        this.nodeSprites = {};
        this.connections = new PIXI.Graphics();
        this.mapData = null;
        this.isLoading = false;

        // Layers
        this.connectionsLayer = new PIXI.Container();
        this.nodesLayer = new PIXI.Container();
        this.effectsLayer = new PIXI.Container();

        this.app.stage.addChild(this.connectionsLayer);
        this.app.stage.addChild(this.nodesLayer);
        this.app.stage.addChild(this.effectsLayer);

        // Adicionar conexões ao layer
        this.connectionsLayer.addChild(this.connections);

        // Scroll/Pan
        this.setupScrolling();

        console.log('ProceduralMapSystem inicializado');
    }

    setupScrolling() {
        // Permitir scroll vertical no mapa
        let isDragging = false;
        let lastY = 0;
        const stage = this.app.stage;

        this.app.view.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastY = e.clientY;
        });

        this.app.view.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaY = e.clientY - lastY;
                stage.y += deltaY;

                // Limitar scroll
                const maxScroll = 0;
                const minScroll = -this.config.maxLevels * this.config.levelHeight - 100;
                stage.y = Math.max(minScroll, Math.min(maxScroll, stage.y));

                lastY = e.clientY;
            }
        });

        this.app.view.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.app.view.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Scroll com roda do mouse
        this.app.view.addEventListener('wheel', (e) => {
            e.preventDefault();
            stage.y -= e.deltaY * 0.5;

            const maxScroll = 0;
            const minScroll = -this.config.maxLevels * this.config.levelHeight - 100;
            stage.y = Math.max(minScroll, Math.min(maxScroll, stage.y));
        });
    }

    async loadCurrentMap() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch('/map/api/current');
            const data = await response.json();

            if (data.has_map) {
                this.mapData = data;
                this.renderMap(data.nodes);
                this.scrollToCurrentPosition(data.current_node_id);
            } else {
                this.showGenerateButton(data.current_act || 1);
            }
        } catch (error) {
            console.error('Erro ao carregar mapa:', error);
            this.showError('Erro ao carregar mapa');
        } finally {
            this.isLoading = false;
        }
    }

    async generateNewMap(actNumber = 1) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch('/map/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ act_number: actNumber })
            });

            const data = await response.json();

            if (data.success) {
                this.mapData = data;
                this.renderMap(data.nodes);
                this.showNotification(`Mapa do Ato ${actNumber} gerado!`);
            } else {
                this.showError(data.error || 'Erro ao gerar mapa');
            }
        } catch (error) {
            console.error('Erro ao gerar mapa:', error);
            this.showError('Erro ao gerar mapa');
        } finally {
            this.isLoading = false;
        }
    }

    renderMap(nodes) {
        this.clearMap();

        // Converter array para dicionário
        this.nodes = {};
        nodes.forEach(node => {
            const key = `${node.x},${node.y}`;
            this.nodes[key] = node;
        });

        // Desenhar conexões primeiro (ficam atrás)
        this.drawConnections(nodes);

        // Desenhar nós
        nodes.forEach(node => {
            this.createNode(node);
        });

        console.log(`Mapa renderizado: ${nodes.length} nós`);
    }

    createNode(nodeData) {
        const container = new PIXI.Container();

        // Calcular posição visual
        // Y invertido: nível 0 fica embaixo, nível 15 (boss) fica em cima
        const visualX = nodeData.x * this.config.columnWidth + this.config.offsetX;
        const visualY = this.config.offsetY - (nodeData.y * this.config.levelHeight);

        container.x = visualX;
        container.y = visualY;

        // Criar círculo do nó
        const circle = new PIXI.Graphics();
        let color = this.nodeColors[nodeData.node_type] || 0x666666;
        let alpha = 1;
        let lineColor = 0x333333;
        let lineWidth = 2;

        // Ajustar aparência baseado no estado
        if (nodeData.is_current) {
            lineColor = 0xffffff;
            lineWidth = 4;
        } else if (nodeData.is_visited) {
            alpha = 0.4;
        } else if (!nodeData.is_available) {
            alpha = 0.3;
            color = 0x333333;
        } else {
            lineColor = 0xffffff;
            lineWidth = 3;
        }

        circle.beginFill(color, alpha);
        circle.lineStyle(lineWidth, lineColor);
        circle.drawCircle(0, 0, this.config.nodeRadius);
        circle.endFill();

        container.addChild(circle);

        // Adicionar ícone
        const icon = new PIXI.Text(this.nodeIcons[nodeData.node_type] || '?', {
            fontSize: 18,
            align: 'center'
        });
        icon.anchor.set(0.5);

        // Ajustar opacidade do ícone
        if (nodeData.is_visited && !nodeData.is_current) {
            icon.alpha = 0.5;
        } else if (!nodeData.is_available && !nodeData.is_visited) {
            icon.alpha = 0.3;
        }

        container.addChild(icon);

        // Adicionar indicador de nó atual
        if (nodeData.is_current) {
            this.addCurrentIndicator(container);
        }

        // Adicionar efeito de brilho para nós disponíveis
        if (nodeData.is_available && !nodeData.is_visited) {
            this.addGlowEffect(container, nodeData.node_type);
            this.makeInteractive(container, nodeData);
        }

        // Adicionar tooltip
        this.addTooltip(container, nodeData);

        // Salvar referência
        this.nodeSprites[nodeData.id] = container;

        this.nodesLayer.addChild(container);
    }

    drawConnections(nodes) {
        this.connections.clear();

        nodes.forEach(node => {
            const startX = node.x * this.config.columnWidth + this.config.offsetX;
            const startY = this.config.offsetY - (node.y * this.config.levelHeight);

            const connections = node.connections_up || [];

            connections.forEach(([upX, upY]) => {
                const endX = upX * this.config.columnWidth + this.config.offsetX;
                const endY = this.config.offsetY - (upY * this.config.levelHeight);

                // Determinar cor da conexão
                let lineColor = 0x2a2a4a;
                let lineAlpha = 0.6;

                // Se o nó foi visitado, destacar o caminho
                if (node.is_visited) {
                    lineColor = 0x4a5568;
                    lineAlpha = 0.9;
                }

                this.connections.lineStyle(3, lineColor, lineAlpha);
                this.connections.moveTo(startX, startY);
                this.connections.lineTo(endX, endY);
            });
        });
    }

    addCurrentIndicator(container) {
        // Círculo pulsante ao redor do nó atual
        const indicator = new PIXI.Graphics();
        indicator.lineStyle(3, 0xffd700);
        indicator.drawCircle(0, 0, this.config.nodeRadius + 8);

        // Animação pulsante
        let scale = 1;
        let growing = true;

        this.app.ticker.add(() => {
            if (growing) {
                scale += 0.005;
                if (scale >= 1.1) growing = false;
            } else {
                scale -= 0.005;
                if (scale <= 0.9) growing = true;
            }
            indicator.scale.set(scale);
            indicator.alpha = 0.3 + (scale - 0.9) * 2;
        });

        container.addChildAt(indicator, 0);
    }

    addGlowEffect(container, nodeType) {
        // Efeito de brilho para nós disponíveis
        const glow = new PIXI.Graphics();
        const color = this.nodeColors[nodeType] || 0xffffff;

        glow.beginFill(color, 0.2);
        glow.drawCircle(0, 0, this.config.nodeRadius + 12);
        glow.endFill();

        // Animação pulsante
        let alpha = 0.2;
        let increasing = true;

        this.app.ticker.add(() => {
            if (increasing) {
                alpha += 0.008;
                if (alpha >= 0.4) increasing = false;
            } else {
                alpha -= 0.008;
                if (alpha <= 0.1) increasing = true;
            }
            glow.alpha = alpha;
        });

        container.addChildAt(glow, 0);
    }

    makeInteractive(container, nodeData) {
        container.interactive = true;
        container.buttonMode = true;
        container.cursor = 'pointer';

        const originalScale = { x: container.scale.x, y: container.scale.y };

        container.on('pointerover', () => {
            container.scale.set(1.15);
        });

        container.on('pointerout', () => {
            container.scale.set(originalScale.x, originalScale.y);
        });

        container.on('pointerdown', () => {
            this.selectNode(nodeData);
        });
    }

    addTooltip(container, nodeData) {
        const typeNames = {
            battle: 'Batalha',
            elite: 'Desafiante Infernal',
            shop: 'Loja',
            event: 'Evento Aleatório',
            rest: 'Descanso',
            boss: 'Boss Final'
        };

        container.on('pointerover', () => {
            const tooltip = document.getElementById('map-tooltip');
            if (tooltip) {
                tooltip.innerHTML = `
                    <strong>${typeNames[nodeData.node_type] || nodeData.node_type}</strong>
                    <br>Nível ${nodeData.y + 1}
                    ${nodeData.is_visited ? '<br><em>Visitado</em>' : ''}
                    ${nodeData.is_available ? '<br><em>Disponível</em>' : ''}
                `;
                tooltip.style.display = 'block';
            }
        });

        container.on('pointermove', (e) => {
            const tooltip = document.getElementById('map-tooltip');
            if (tooltip) {
                tooltip.style.left = (e.data.global.x + 15) + 'px';
                tooltip.style.top = (e.data.global.y + 15) + 'px';
            }
        });

        container.on('pointerout', () => {
            const tooltip = document.getElementById('map-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    }

    async selectNode(nodeData) {
        if (this.isLoading) return;

        // Confirmar seleção
        const typeNames = {
            battle: 'Batalha',
            elite: 'Desafiante Infernal',
            shop: 'Loja',
            event: 'Evento Aleatório',
            rest: 'Descanso',
            boss: 'Boss Final'
        };

        const confirmed = confirm(`Ir para ${typeNames[nodeData.node_type]}?`);
        if (!confirmed) return;

        this.isLoading = true;

        try {
            const response = await fetch(`/map/api/select-node/${nodeData.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Indo para ${typeNames[result.node_type]}...`);

                // Redirecionar após pequeno delay
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 500);
            } else {
                this.showError(result.error || 'Erro ao selecionar nó');
            }
        } catch (error) {
            console.error('Erro ao selecionar nó:', error);
            this.showError('Erro ao selecionar nó');
        } finally {
            this.isLoading = false;
        }
    }

    scrollToCurrentPosition(currentNodeId) {
        if (!currentNodeId) {
            // Scroll para o início (parte de baixo do mapa)
            this.app.stage.y = 0;
            return;
        }

        // Encontrar nó atual
        const currentNode = this.nodeSprites[currentNodeId];
        if (currentNode) {
            // Centralizar viewport no nó atual
            const targetY = -currentNode.y + (this.app.view.height / 2);
            this.app.stage.y = targetY;
        }
    }

    showGenerateButton(actNumber) {
        // Mostrar UI para gerar novo mapa
        const button = document.createElement('button');
        button.className = 'generate-map-btn';
        button.textContent = `Gerar Mapa do Ato ${actNumber}`;
        button.onclick = () => {
            button.disabled = true;
            button.textContent = 'Gerando...';
            this.generateNewMap(actNumber).then(() => {
                button.remove();
            });
        };

        this.container.appendChild(button);
    }

    showNotification(message) {
        const notification = document.getElementById('map-notification');
        if (notification) {
            notification.textContent = message;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }

    showError(message) {
        const error = document.getElementById('map-error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
            setTimeout(() => {
                error.style.display = 'none';
            }, 5000);
        }
    }

    clearMap() {
        // Limpar nós
        Object.values(this.nodeSprites).forEach(sprite => {
            this.nodesLayer.removeChild(sprite);
            sprite.destroy();
        });
        this.nodeSprites = {};
        this.nodes = {};

        // Limpar conexões
        this.connections.clear();
    }

    destroy() {
        this.clearMap();
        if (this.app) {
            this.app.destroy(true);
        }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map-canvas-container');

    if (mapContainer) {
        window.mapSystem = new ProceduralMapSystem('map-canvas-container');
        window.mapSystem.loadCurrentMap();
    }
});
