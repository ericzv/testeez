# Guia de Implementação - Sistema de Acúmulo de Sangue

## 1. ADICIONAR CAMPOS AO BANCO

Arquivo: `/home/user/testeez/models.py` (classe `Player`, após linha 138)

```python
# Sistema de Acúmulo de Sangue para Vlad
blood_accumulated = db.Column(db.Integer, default=0)
blood_threshold = db.Column(db.Integer, default=100)
blood_max = db.Column(db.Integer, default=500)
blood_stacks = db.Column(db.Integer, default=0)  # Número de vezes que atingiu threshold
```

### Migração de Banco
```bash
flask db migrate -m "Add blood accumulation system"
flask db upgrade
```

---

## 2. MODIFICAR FUNÇÕES DE SKILL

### Arquivo: `/home/user/testeez/characters.py`

#### A. Atualizar `use_special_skill()` (linha ~1150)

Adicionar após validação de cargas (linha 1164):

```python
def use_special_skill(player_id, skill_id):
    """Ativa uma habilidade especial"""
    print(f"==== INICIANDO use_special_skill(player_id={player_id}, skill_id={skill_id}) ====")
    try:
        from models import Player
        
        player = Player.query.get(player_id)
        if not player:
            return False, "Jogador não encontrado.", {}
        
        player_skill = PlayerSkill.query.filter_by(
            player_id=player_id,
            skill_id=skill_id,
            skill_type="special"
        ).first()
        
        if not player_skill:
            return False, "Você não possui esta habilidade.", {}
        
        skill = SpecialSkill.query.get(skill_id)
        if not skill:
            return False, "Habilidade não encontrada.", {}
        
        if player_skill.current_charges <= 0:
            time_until_next = player_skill.get_time_until_next_charge()
            hours, remainder = divmod(time_until_next.total_seconds(), 3600)
            minutes, seconds = divmod(remainder, 60)
            time_str = ""
            if hours > 0:
                time_str += f"{int(hours)}h "
            if minutes > 0:
                time_str += f"{int(minutes)}min "
            time_str += f"{int(seconds)}s"
            
            return False, f"Sem cargas disponíveis. Próxima carga em: {time_str}", {}
        
        # ===== NOVO: SISTEMA DE ACÚMULO DE SANGUE =====
        blood_cost = 0
        blood_messages = []
        
        # Determinar custo de sangue baseado na skill
        if skill_id == 138:  # Autofagia
            blood_cost = 30  # Custa 30 de sangue
        elif skill_id == 141:  # Abraço Sanguíneo
            blood_cost = 50  # Custa 50 de sangue
        
        # Registrar sangue gasto
        if blood_cost > 0:
            old_blood = player.blood_accumulated
            player.blood_accumulated += blood_cost
            
            # Verificar se atingiu threshold
            stacks_gained = player.blood_accumulated // player.blood_threshold
            old_stacks = player.blood_stacks
            player.blood_stacks = stacks_gained
            
            if stacks_gained > old_stacks:
                new_stacks = stacks_gained - old_stacks
                blood_messages.append(f"Sangue acumulado! +{new_stacks} stack(s)!")
            
            blood_messages.append(f"Sangue: {old_blood} → {player.blood_accumulated}")
        
        # ===== FIM: SISTEMA DE ACÚMULO DE SANGUE =====
        
        positive_type = skill.positive_effect_type
        positive_value = skill.positive_effect_value
        # ... resto do código original ...
        
        # Adicionar mensagem de sangue ao resultado
        effect_msg = ""
        if positive_type == "crit_chance":
            effect_msg = f"+{float(positive_value)*100:.0f}% Chance de Crítico"
        # ... resto dos efeitos ...
        
        if blood_messages:
            effect_msg += " | " + " | ".join(blood_messages)
        
        animation_data = {
            "animation_activate_1": getattr(skill, 'animation_activate_1', None),
            "animation_activate_2": getattr(skill, 'animation_activate_2', None),
            "sound_prep_1": getattr(skill, 'sound_prep_1', None),
            "sound_prep_2": getattr(skill, 'sound_prep_2', None),
            "sound_effect_1": getattr(skill, 'sound_effect_1', None),
            "sound_effect_2": getattr(skill, 'sound_effect_2', None)
        }
        
        return True, f"Habilidade {skill.name} ativada! {effect_msg} {duration_msg}", {
            "positive_effect": {
                "type": positive_type,
                "value": positive_value,
                "icon": skill_icon
            },
            "negative_effects": negative_effects,
            "duration": {
                "type": duration_type,
                "value": duration_value
            },
            "animation": animation_data,
            "blood": {  # NOVO
                "cost": blood_cost,
                "accumulated": player.blood_accumulated,
                "stacks": player.blood_stacks,
                "messages": blood_messages
            }
        }
```

#### B. Criar função para amplificar efeitos com sangue

Adicionar ao final do arquivo characters.py:

```python
def apply_blood_amplification(player, skill_id, effect_data):
    """
    Amplifica efeitos de skills baseado em sangue acumulado
    
    Returns: efeito modificado
    """
    if not hasattr(player, 'blood_stacks') or player.blood_stacks <= 0:
        return effect_data
    
    amplification = 1.0 + (player.blood_stacks * 0.15)  # 15% por stack
    
    # Amplificar efeitos específicos
    if effect_data.get('type') == 'crit_chance':
        effect_data['value'] = float(effect_data['value']) * amplification
    elif effect_data.get('type') == 'lifesteal':
        effect_data['value'] = float(effect_data['value']) * amplification
    
    return effect_data

def consume_blood_on_attack(player, skill_type):
    """
    Consome pequena quantidade de sangue ao usar ataque
    Opcional: sistema de "sangue alimentando" o combate
    """
    if not hasattr(player, 'blood_accumulated'):
        return
    
    # Consumir 1 sangue por ataque se tiver mais de 100
    if player.blood_accumulated > 100:
        player.blood_accumulated -= 1
```

---

## 3. ATUALIZAR API DE SKILLS ESPECIAIS

Arquivo: `/home/user/testeez/routes/battle.py` (função `player_specials`)

Modificar para incluir informações de sangue:

```python
@battle_bp.route('/player/specials')
def player_specials():
    """API simplificada para retornar as habilidades especiais do jogador"""
    try:
        player = Player.query.first()
        if not player:
            return jsonify({'success': False, 'message': 'Jogador não encontrado'})
        
        # Obter as habilidades especiais desbloqueadas
        specials = get_player_specials(player.id)
        
        # NOVO: Adicionar informações de sangue
        blood_info = {
            'accumulated': getattr(player, 'blood_accumulated', 0),
            'threshold': getattr(player, 'blood_threshold', 100),
            'max': getattr(player, 'blood_max', 500),
            'stacks': getattr(player, 'blood_stacks', 0)
        }
        
        # Marcar skills que usam sangue
        for special in specials:
            if special['id'] in [138, 141]:  # Skills que usam sangue
                special['uses_blood'] = True
                special['blood_cost'] = 30 if special['id'] == 138 else 50
                
                # Calcular amplificação
                amplification = 1.0 + (blood_info['stacks'] * 0.15)
                special['amplification'] = amplification
        
        return jsonify({
            'success': True,
            'specials': specials,
            'blood': blood_info
        })
    except Exception as e:
        print(f"Erro na API de habilidades especiais: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Erro ao processar habilidades especiais: {str(e)}',
            'specials': []
        })
```

---

## 4. ADICIONAR AO FRONT-END

Arquivo: `/home/user/testeez/static/js/battle-skills-system.js`

Adicionar função para exibir acúmulo de sangue:

```javascript
/**
 * Atualizar display de sangue acumulado
 */
async function updateBloodDisplay() {
    try {
        const response = await fetch('/gamification/player/specials');
        const data = await response.json();
        
        if (!data.success) return;
        
        const blood = data.blood;
        
        // Criar/atualizar elemento de sangue
        let bloodBar = document.getElementById('blood-accumulation');
        if (!bloodBar) {
            bloodBar = document.createElement('div');
            bloodBar.id = 'blood-accumulation';
            bloodBar.className = 'blood-bar-container';
            document.body.appendChild(bloodBar);
        }
        
        // Calcular porcentagem
        const percentage = (blood.accumulated / blood.max) * 100;
        
        bloodBar.innerHTML = `
            <div class="blood-bar-label">Sangue</div>
            <div class="blood-bar-background">
                <div class="blood-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="blood-bar-text">
                ${blood.accumulated}/${blood.max} (${blood.stacks} stacks)
            </div>
        `;
        
        // Atualizar skills com custo de sangue
        updateSpecialSkillCosts(data.specials);
        
    } catch (error) {
        console.error('Erro ao atualizar sangue:', error);
    }
}

/**
 * Atualizar custos de skills especiais baseado em sangue
 */
function updateSpecialSkillCosts(specials) {
    specials.forEach(special => {
        const skillBtn = document.querySelector(`[data-skill-id="${special.id}"]`);
        if (!skillBtn) return;
        
        if (special.uses_blood) {
            // Mostrar custo de sangue
            let costDisplay = skillBtn.querySelector('.blood-cost');
            if (!costDisplay) {
                costDisplay = document.createElement('span');
                costDisplay.className = 'blood-cost';
                skillBtn.appendChild(costDisplay);
            }
            
            costDisplay.textContent = `Sangue: ${special.blood_cost}`;
            costDisplay.style.color = '#8B0000';  // Dark red
            
            // Mostrar amplificação
            if (special.amplification > 1.0) {
                let ampDisplay = skillBtn.querySelector('.amplification');
                if (!ampDisplay) {
                    ampDisplay = document.createElement('span');
                    ampDisplay.className = 'amplification';
                    skillBtn.appendChild(ampDisplay);
                }
                
                const ampPercent = ((special.amplification - 1) * 100).toFixed(0);
                ampDisplay.textContent = `+${ampPercent}%`;
                ampDisplay.style.color = '#FF4500';  // Orange-red
            }
        }
    });
}

// Chamar ao carregar skills
document.addEventListener('DOMContentLoaded', function() {
    updateBloodDisplay();
    // Atualizar a cada 30 segundos
    setInterval(updateBloodDisplay, 30000);
});
```

---

## 5. ADICIONAR ESTILOS CSS

Arquivo: `/home/user/testeez/static/css/battle.css` (ou hub.css)

```css
/* Sistema de Acúmulo de Sangue */
.blood-bar-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 250px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #8B0000;
    border-radius: 8px;
    z-index: 100;
}

.blood-bar-label {
    color: #8B0000;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
}

.blood-bar-background {
    width: 100%;
    height: 20px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #8B0000;
    border-radius: 4px;
    overflow: hidden;
}

.blood-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #8B0000 0%, #FF4500 100%);
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
}

.blood-bar-text {
    color: #FF8C00;
    font-size: 12px;
    margin-top: 5px;
    text-align: center;
}

/* Custo de Sangue nas Skills */
.blood-cost {
    display: block;
    font-size: 12px;
    color: #8B0000;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
    margin-top: 3px;
}

.amplification {
    display: block;
    font-size: 12px;
    color: #FF4500;
    font-weight: bold;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
    margin-top: 2px;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* Animação quando threshold é atingido */
.blood-stack-gained {
    animation: bloodStackAnimation 0.5s ease;
}

@keyframes bloodStackAnimation {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); box-shadow: 0 0 20px #FF4500; }
    100% { transform: scale(1); }
}
```

---

## 6. FUNÇÕES AUXILIARES

Arquivo: `/home/user/testeez/skill_effects.py`

Adicionar ao final:

```python
def apply_blood_effects(player, blood_stacks):
    """Aplica efeitos baseado em stacks de sangue"""
    
    if blood_stacks <= 0:
        return False, "Nenhum stack de sangue ativo"
    
    # A cada stack, aumenta crit damage em 10%
    bonus = blood_stacks * 0.1
    
    return True, f"Efeito de sangue ativado! +{bonus*100:.0f}% dano crítico baseado em {blood_stacks} stacks"

def reset_blood_on_run_end(player):
    """Reseta sangue acumulado ao terminar a run"""
    player.blood_accumulated = 0
    player.blood_stacks = 0
    return True
```

---

## 7. RESUMO DE MUDANÇAS

| Arquivo | Mudança | Linha |
|---------|---------|-------|
| models.py | Adicionar campos de sangue | ~140 |
| characters.py | Atualizar use_special_skill() | ~1150 |
| characters.py | Adicionar apply_blood_amplification() | Final |
| routes/battle.py | Atualizar player_specials() | ~1654 |
| battle-skills-system.js | Adicionar updateBloodDisplay() | Final |
| battle.css | Adicionar estilos de sangue | Final |
| skill_effects.py | Adicionar apply_blood_effects() | Final |

---

## 8. TESTES

```bash
# 1. Fazer migração do banco
flask db migrate -m "Add blood system"
flask db upgrade

# 2. Testar no navegador
http://localhost:5000/gamification/fill_special_charges

# 3. Verificar console para:
# - Logs de acúmulo de sangue
# - Mensagens de stack adquirido
# - Atualização da barra visual

# 4. Confirmar amplificação é aplicada ao próximo ataque
```

---

## NOTAS IMPORTANTES

1. **Migração de Banco**: Sempre rodar `flask db upgrade` após mudanças em models.py
2. **Sincronização Front-Back**: Usar intervalos (30s) para atualizar display sem sobrecarregar
3. **Persistência**: Sangue deve ser zerado ao morrer (adicionar em reset_player_run)
4. **Valores**: Ajustar blood_cost, blood_threshold, amplification conforme balance desejado

