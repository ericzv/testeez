document.addEventListener('DOMContentLoaded', function() {
  console.log("Script de atributos inicializado");
  
  // Seletores para os botões de atributos com debug
  const attributeButtons = document.querySelectorAll('.attribute-increase-btn');
  console.log("Botões de atributo encontrados:", attributeButtons.length);
  
  attributeButtons.forEach(button => {
    // Adicionar IDs aos botões para debug
    const parentAttr = button.closest('.attribute-container');
    const attrType = parentAttr ? parentAttr.getAttribute('data-attribute') : 'unknown';
    button.id = `attr-btn-${attrType}`;
    
    button.addEventListener('click', function(e) {
      console.log(`Botão de ${attrType} clicado`);
      e.preventDefault();
      
      // Verificar se há pontos disponíveis
      const pointsElement = document.getElementById('available-points');
      if (!pointsElement) {
        console.error('Elemento de pontos disponíveis não encontrado');
        showNotification('Erro ao verificar pontos disponíveis', 'error');
        return;
      }
      
      const availablePoints = parseInt(pointsElement.textContent) || 0;
      if (availablePoints <= 0) {
        showNotification('Nenhum ponto disponível para gastar', 'warning');
        return;
      }
      
      // Encontrar o container do atributo
      const attributeContainer = this.closest('.attribute-container');
      if (!attributeContainer) {
        console.error('Container de atributo não encontrado');
        return;
      }
      
      // Encontrar o elemento de valor
      const valueElement = attributeContainer.querySelector('.attribute-value');
      if (!valueElement) {
        console.error('Elemento de valor não encontrado');
        return;
      }
      
      // Obter o atributo e valor atual
      const attributeType = attributeContainer.getAttribute('data-attribute');
      if (!attributeType) {
        console.error('Tipo de atributo não encontrado');
        return;
      }
      
      const currentValue = parseInt(valueElement.textContent) || 0;
      const newValue = currentValue + 1;
      
      // Atualizar visualmente primeiro
      valueElement.textContent = newValue;
      pointsElement.textContent = availablePoints - 1;
      
      // Enviar para o servidor
      updateServerAttribute(attributeType, newValue);
    });
  });
  
  // Função para enviar a atualização para o servidor
  function updateServerAttribute(attributeType, newValue) {
    fetch('/gamification/update_attribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        attribute: attributeType,
        value: newValue
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification('Atributo atualizado com sucesso!', 'success');
      } else {
        showNotification('Erro ao atualizar atributo: ' + data.message, 'error');
        // Reverter a alteração visual
        const container = document.querySelector(`.attribute-container[data-attribute="${attributeType}"]`);
        if (container) {
          const valueElement = container.querySelector('.attribute-value');
          if (valueElement) {
            valueElement.textContent = newValue - 1;
          }
        }
        // Restaurar pontos
        const pointsElement = document.getElementById('available-points');
        if (pointsElement) {
          const currentPoints = parseInt(pointsElement.textContent) || 0;
          pointsElement.textContent = currentPoints + 1;
        }
      }
    })
    .catch(error => {
      console.error('Erro:', error);
      showNotification('Erro ao comunicar com o servidor', 'error');
    });
  }
  
  // Função para mostrar notificações
  function showNotification(message, type = 'success') {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3000);
    }, 10);
  }
});