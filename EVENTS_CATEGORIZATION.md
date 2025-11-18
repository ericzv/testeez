# Categorização de Eventos - Sistema de Raridade e Condições

## Distribuição de Raridade

- **Common (70%)**: 14 eventos - recompensas moderadas, escolhas simples
- **Uncommon (25%)**: 6 eventos - recompensas boas, escolhas estratégicas
- **Rare (5%)**: 1 evento - recompensa excepcional, alto risco/recompensa

---

## COMMON (14 eventos)

1. **tumulo_profanado** - Ato 1+
   - Escolhas balanceadas: HP por relíquia, gold, ou nada
   - Sem condições especiais

2. **relicario_abandonado** - Ato 1+
   - Simples: gold vs relíquia comum
   - Sem condições

3. **fonte_de_sangue** - Ato 1+
   - Cura vs damage
   - **Condição**: Aparece mais se HP < 70%

4. **camara_regeneracao** - Ato 1+
   - Evento de cura pura
   - **Condição**: Só aparece se HP < 60%

5. **tesouro_amaldicoado** - Ato 1+
   - Gold garantido com risco de damage
   - Sem condições

6. **cacador_recompensas** - Ato 1+
   - Combate ou fuga
   - Sem condições

7. **forja_sombria** - Ato 1+
   - Upgrade de stats por gold
   - **Condição**: Só aparece se gold >= 30

8. **biblioteca_proibida** - Ato 1+
   - Conhecimento vs risco
   - Sem condições

9. **mestre_armas** - Ato 2+
   - Treinamento por gold
   - **Condição**: gold >= 50

10. **goblin_vendedor** - Ato 1+
    - Loja simples
    - Sem condições

11. **poco_desejos** - Ato 1+
    - Sorte com moedas
    - **Condição**: gold >= 15

12. **fantasma_heroi** - Ato 2+
    - Buffs temporários
    - Sem condições

13. **encruzilhada_mistica** - Ato 1+
    - Escolha aleatória de paths
    - Sem condições

14. **espelho_dimensional** - Ato 2+
    - Troca resources
    - Sem condições

---

## UNCOMMON (6 eventos)

1. **comerciante_sombrio** - Ato 1+
   - Trocas complexas de relíquias
   - **Condição**: min_relics >= 1 para uma escolha

2. **altar_sangue_antigo** - Ato 2+
   - Sacrifícios por poder
   - **Condição**: HP > 30% para sacrifícios

3. **vampiro_anciao** - Ato 2+
   - Pactos de HP por relíquias
   - **Condição**: HP > 40%

4. **roda_fortuna** - Ato 1+
   - Alta variância, risco/recompensa
   - Sem condições

5. **demonio_tentador** - Ato 2+
   - Pactos sombrios
   - Sem condições

6. **aposta_morte** - Ato 3+
   - Aposta de alto risco
   - **Condição**: gold >= 50

---

## RARE (1 evento)

1. **espelho_verdade** - Ato 2+
   - Evento mítico com escolhas profundas
   - Recompensas únicas e poderosas
   - **Condição**: Máximo 1 vez por run (controle via flag)

---

## Sistema de Condições

### Tipos de Condições:
```python
'conditions': {
    # HP-based
    'min_hp_percent': 0.6,  # Só aparece se HP >= 60%
    'max_hp_percent': 0.7,  # Só aparece se HP <= 70%

    # Gold-based
    'min_gold': 50,  # Só aparece se gold >= 50

    # Relic-based
    'min_relics': 1,  # Só aparece se tem >= 1 relíquia

    # Act-based (já existe via min_act)
    'min_act': 2,

    # One-time events (para eventos raros únicos)
    'one_time': True,  # Só pode acontecer 1x por run

    # Boost weight under conditions
    'boost_weight_if': {
        'hp_below': 0.5,  # Dobra chance se HP < 50%
        'gold_above': 100  # Dobra chance se gold > 100
    }
}
```

---

## Weights por Raridade

```python
RARITY_WEIGHTS = {
    'common': 70,    # 70% dos eventos
    'uncommon': 25,  # 25% dos eventos
    'rare': 5        # 5% dos eventos
}
```

---

## Progressão por Ato

### Ato 1 (Introdução)
- Apenas events common/uncommon
- Foco em aprender mecânicas
- Rewards moderados

### Ato 2 (Escalada)
- Todos os rarities disponíveis
- Events mais complexos desbloqueiam
- Rewards maiores

### Ato 3 (Clímax)
- Todos os events
- Apenas high-stakes events aparecem com mais frequência
- Final sprint para o boss
