const skilltreeData = {
  "Ofensiva Brutal": {
    "id": "Draco",
    "name": "Draco",
    "oldName": "Ofensiva Brutal",
    "talents": [
      {
        "id": 1,
        "name": "Ataque Pesado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.15x dano com ataque carregado",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.3x dano com ataque carregado",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.5x dano com ataque carregado",
            "cost": 5
          }
        ]
      },
      {
        "id": 2,
        "name": "Golpe Crítico",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+2% chance de crítico permanentemente",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+4% chance de crítico permanentemente",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+6% chance de crítico permanentemente",
            "cost": 5
          }
        ]
      },
      {
        "id": 3,
        "name": "Ira Instintiva",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.1x dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.2x dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.3x dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 4,
        "name": "Estocada Dupla",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "2% chance de atacar 2x",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "4% chance de atacar 2x",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "6% chance de atacar 2x",
            "cost": 5
          }
        ]
      },
      {
        "id": 5,
        "name": "Destruidor",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.25x dano no próximo golpe após sofrer um golpe do inimigo",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.50x dano no próximo golpe após sofrer um golpe do inimigo",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.75x dano no próximo golpe após sofrer um golpe do inimigo",
            "cost": 5
          }
        ]
      },
      {
        "id": 6,
        "name": "Fúria Crescente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.05x dano por ataque carregado consecutivo (máx 3x)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.1x dano por ataque carregado consecutivo (máx 3x)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.15x dano por ataque carregado consecutivo (máx 3x)",
            "cost": 5
          }
        ]
      },
      {
        "id": 7,
        "name": "Investida Brutal",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.1x dano no primeiro ataque ao inimigo",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.2x dano no primeiro ataque ao inimigo",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.3x dano no primeiro ataque ao inimigo",
            "cost": 5
          }
        ]
      },
      {
        "id": 8,
        "name": "Ruptura",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Acerto crítico aumenta dano do próximo ataque em +0.1x",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Acerto crítico aumenta dano do próximo ataque em +0.2x",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Acerto crítico aumenta dano do próximo ataque em +0.3x",
            "cost": 5
          }
        ]
      },
      {
        "id": 9,
        "name": "Rasgo Profundo",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Acerto crítico de ataque carregado cura 1% HP máximo",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Acerto crítico de ataque carregado cura 2% HP máximo",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Acerto crítico de ataque carregado cura 3% HP máximo",
            "cost": 5
          }
        ]
      },
      {
        "id": 10,
        "name": "Voracidade",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 2% do HP ao matar um inimigo",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 4% do HP ao matar um inimigo",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 6% do HP ao matar um inimigo",
            "cost": 5
          }
        ]
      },
      {
        "id": 11,
        "name": "Quebra-Postura",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Acertos críticos aumentam em 1% o bloqueio por um dia (máximo 10% no dia)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Acertos críticos aumentam em 2% o bloqueio por um dia (máximo 10% no dia)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Acertos críticos aumentam em 3% o bloqueio por um dia (máximo 10% no dia)",
            "cost": 5
          }
        ]
      },
      {
        "id": 12,
        "name": "Fúria Inata",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.05x de dano se HP do personagem < 50%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.1x de dano se HP do personagem < 50%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.15x de dano se HP do personagem < 50%",
            "cost": 5
          }
        ]
      },
      {
        "id": 13,
        "name": "Garras Vorpais",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.1x contra inimigos com HP cheio",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.2x contra inimigos com HP cheio",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.3x contra inimigos com HP cheio",
            "cost": 5
          }
        ]
      },
      {
        "id": 14,
        "name": "Postura Agressiva",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+5% crítico no próximo ataque após uma esquiva",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+10% crítico no próximo ataque após uma esquiva",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+15% crítico no próximo ataque após uma esquiva",
            "cost": 5
          }
        ]
      },
      {
        "id": 15,
        "name": "Chama Interna",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.1x de dano após tomar dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.2x de dano após tomar dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.3x de dano após tomar dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 16,
        "name": "Corte Ascendente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.3x no 1º ataque do dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.6x no 1º ataque do dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.9x no 1º ataque do dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 17,
        "name": "Execução Final",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.2x contra inimigos com HP inferior a 20%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.4x contra inimigos com HP inferior a 20%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.6x contra inimigos com HP inferior a 20%",
            "cost": 5
          }
        ]
      },
      {
        "id": 18,
        "name": "Retaliação",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.3x de dano no próximo ataque após levar dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.6x de dano no próximo ataque após levar dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.9x de dano no próximo ataque após levar dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 19,
        "name": "Golpe de Impacto",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Dano crítico adicional de 12%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Dano crítico adicional de 24%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Dano crítico adicional de 36%",
            "cost": 5
          }
        ]
      },
      {
        "id": 20,
        "name": "Estocada Final",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+0.3x de dano se o inimigo surgiu no dia anterior",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+0.6x de dano se o inimigo surgiu no dia anterior",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+0.9x de dano se o inimigo surgiu no dia anterior",
            "cost": 5
          }
        ]
      }
    ]
  },
  "Defesa e Sobrevivência": {
    "id": "Taurus",
    "name": "Taurus",
    "oldName": "Defesa e Sobrevivência",
    "talents": [
      {
        "id": 101,
        "name": "Pele de Pedra",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de bloquear 50% do dano em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a chance de bloquear 50% do dano em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a chance de bloquear 50% do dano em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 102,
        "name": "Coração de Titã",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o HP máximo em 10",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o HP máximo em 20",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o HP máximo em 30",
            "cost": 5
          }
        ]
      },
      {
        "id": 103,
        "name": "Vigor Natural",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Regenera 5 HP por dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Regenera 10 HP por dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Regenera 15 HP por dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 104,
        "name": "Desvio Instintivo",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de esquiva em 3%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a chance de esquiva em 6%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a chance de esquiva em 9%",
            "cost": 5
          }
        ]
      },
      {
        "id": 105,
        "name": "Muralha Viva",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o dano recebido em 1",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o dano recebido em 2",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o dano recebido em 3",
            "cost": 5
          }
        ]
      },
      {
        "id": 106,
        "name": "Espírito Resistente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 5 HP por inimigo derrotado",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 10 HP por inimigo derrotado",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 15 HP por inimigo derrotado",
            "cost": 5
          }
        ]
      },
      {
        "id": 107,
        "name": "Autodefesa Corporal",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o bloqueio em 5% após receber um crítico",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o bloqueio em 10% após receber um crítico",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o bloqueio em 15% após receber um crítico",
            "cost": 5
          }
        ]
      },
      {
        "id": 108,
        "name": "Constituição Rígida",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o bloqueio em 2%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o bloqueio em 4%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o bloqueio em 6%",
            "cost": 5
          }
        ]
      },
      {
        "id": 109,
        "name": "Cascata de Cura",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 5 HP ao receber dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 10 HP ao receber dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 15 HP ao receber dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 110,
        "name": "Alma Inquebrável",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de resistir à morte em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a chance de resistir à morte em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a chance de resistir à morte em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 111,
        "name": "Determinação Vital",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Duplica a regeneração de HP quando o HP estiver abaixo de 30%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Duplica a regeneração de HP quando o HP estiver abaixo de 30%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Duplica a regeneração de HP quando o HP estiver abaixo de 30%",
            "cost": 5
          }
        ]
      },
      {
        "id": 112,
        "name": "Barreira de Aço",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 10% o bloqueio se matar sem receber dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 20% o bloqueio se matar sem receber dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 30% o bloqueio se matar sem receber dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 113,
        "name": "Casca de Pedra",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 5% o bloqueio se o HP estiver acima de 90%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 10% o bloqueio se o HP estiver acima de 90%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 15% o bloqueio se o HP estiver acima de 90%",
            "cost": 5
          }
        ]
      },
      {
        "id": 114,
        "name": "Fortificação Espiritual",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 1 HP a cada 50 MP",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 2 HP a cada 50 MP",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 3 HP a cada 50 MP",
            "cost": 5
          }
        ]
      },
      {
        "id": 115,
        "name": "Pele Espessa",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o dano em 3 uma vez por dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o dano em 6 uma vez por dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o dano em 9 uma vez por dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 116,
        "name": "Casco Duro",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o bloqueio em 10% após 3 ataques",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o bloqueio em 20% após 3 ataques",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o bloqueio em 30% após 3 ataques",
            "cost": 5
          }
        ]
      },
      {
        "id": 117,
        "name": "Aura de Pedra",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede um escudo de 10 HP a cada 3 dias",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede um escudo de 20 HP a cada 3 dias",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede um escudo de 30 HP a cada 3 dias",
            "cost": 5
          }
        ]
      },
      {
        "id": 118,
        "name": "Reforço Total",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 5% do HP ao subir de nível",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 10% do HP ao subir de nível",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 15% do HP ao subir de nível",
            "cost": 5
          }
        ]
      },
      {
        "id": 119,
        "name": "Guardião Vital",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a resistência em 5% ao sofrer dano",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a resistência em 10% ao sofrer dano",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a resistência em 15% ao sofrer dano",
            "cost": 5
          }
        ]
      },
      {
        "id": 120,
        "name": "Reflexo Inato",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+2% esquiva após esquivar",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+4% esquiva após esquivar",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+6% esquiva após esquivar",
            "cost": 5
          }
        ]
      }
    ]
  },
  "Artes Arcanas": {
    "id": "Aquarius",
    "name": "Aquarius",
    "oldName": "Artes Arcanas",
    "talents": [
      {
        "id": 201,
        "name": "Meditação",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+5 MP/dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+10 MP/dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+15 MP/dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 202,
        "name": "Fonte Interior",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+5 MP por kill",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+10 MP por kill",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+15 MP por kill",
            "cost": 5
          }
        ]
      },
      {
        "id": 203,
        "name": "Foco Espiritual",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o MP máximo em 10",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o MP máximo em 20",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o MP máximo em 30",
            "cost": 5
          }
        ]
      },
      {
        "id": 204,
        "name": "Reserva Oculta",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Recupera 10 MP quando MP cair abaixo de 10%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Recupera 20 MP quando MP cair abaixo de 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Recupera 30 MP quando MP cair abaixo de 10%",
            "cost": 5
          }
        ]
      },
      {
        "id": 205,
        "name": "Vínculo com os Cristais",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+5 MP a cada 10 cristais",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+10 MP a cada 10 cristais",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+15 MP a cada 10 cristais",
            "cost": 5
          }
        ]
      },
      {
        "id": 206,
        "name": "Respiração Rítmica",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o MP em 10 se não usar MP",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o MP em 20 se não usar MP",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o MP em 30 se não usar MP",
            "cost": 5
          }
        ]
      },
      {
        "id": 207,
        "name": "Disciplina Mágica",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o custo de MP em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o custo de MP em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o custo de MP em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 208,
        "name": "Estudo Energético",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cura 5 HP a cada 100 MP",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Cura 10 HP a cada 100 MP",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Cura 15 HP a cada 100 MP",
            "cost": 5
          }
        ]
      },
      {
        "id": 209,
        "name": "Canalização Prática",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 5 MP após utilizar 3 habilidades",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 10 MP após utilizar 3 habilidades",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 15 MP após utilizar 3 habilidades",
            "cost": 5
          }
        ]
      },
      {
        "id": 210,
        "name": "Reservatório Arcano",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o MP em 5 no dia seguinte se recuperar 30 ou mais MP",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o MP em 10 no dia seguinte se recuperar 30 ou mais MP",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o MP em 15 no dia seguinte se recuperar 30 ou mais MP",
            "cost": 5
          }
        ]
      },
      {
        "id": 211,
        "name": "Refúgio Mental",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o dano em 5 quando MP estiver cheio",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o dano em 10 quando MP estiver cheio",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o dano em 15 quando MP estiver cheio",
            "cost": 5
          }
        ]
      },
      {
        "id": 212,
        "name": "Harmonia Interior",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 3 HP por dia quando MP for maior que 50%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 6 HP por dia quando MP for maior que 50%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 9 HP por dia quando MP for maior que 50%",
            "cost": 5
          }
        ]
      },
      {
        "id": 213,
        "name": "Mente Brilhante",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+1 ponto em um atributo a cada 10 níveis",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+1 ponto em um atributo a cada 9 níveis",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+1 ponto em um atributo a cada 8 níveis",
            "cost": 5
          }
        ]
      },
      {
        "id": 214,
        "name": "Despertar Cíclico",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+10 MP por kill",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+20 MP por kill",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+30 MP por kill",
            "cost": 5
          }
        ]
      },
      {
        "id": 215,
        "name": "Transcendência Leve",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+15 MP ao subir de nível",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+30 MP ao subir de nível",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+45 MP ao subir de nível",
            "cost": 5
          }
        ]
      },
      {
        "id": 216,
        "name": "Estabilidade Arcana",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 10 MP ao receber dano quando MP for menor que 30%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 20 MP ao receber dano quando MP for menor que 30%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 30 MP ao receber dano quando MP for menor que 30%",
            "cost": 5
          }
        ]
      },
      {
        "id": 217,
        "name": "Eficiência Total",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o custo de MP da próxima skill em 10% após acumular 100 MP",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o custo de MP da próxima skill em 20% após acumular 100 MP",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o custo de MP da próxima skill em 30% após acumular 100 MP",
            "cost": 5
          }
        ]
      },
      {
        "id": 218,
        "name": "Mana Protetora",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Converte MP em um escudo uma vez por semana",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "-",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "-",
            "cost": 5
          }
        ]
      },
      {
        "id": 219,
        "name": "Eco Espiritual",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "2% de chance de repetir uma habilidade sem custo",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "4% de chance de repetir uma habilidade sem custo",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "6% de chance de repetir uma habilidade sem custo",
            "cost": 5
          }
        ]
      },
      {
        "id": 220,
        "name": "Clarão Interior",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 10 MP se o HP estiver cheio ao amanhecer",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 20 MP se o HP estiver cheio ao amanhecer",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 30 MP se o HP estiver cheio ao amanhecer",
            "cost": 5
          }
        ]
      }
    ]
  },
  "Sorte e Caos": {
    "id": "Hercules",
    "name": "Hercules",
    "oldName": "Sorte e Caos",
    "talents": [
      {
        "id": 301,
        "name": "Intuição Rara",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de obter loot raro em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a chance de obter loot raro em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a chance de obter loot raro em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 302,
        "name": "Sortudo por Natureza",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 1% a chance de duplicar o loot",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 2% a chance de duplicar o loot",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 3% a chance de duplicar o loot",
            "cost": 5
          }
        ]
      },
      {
        "id": 303,
        "name": "Olhar Afiado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 5% a chance de melhorar a qualidade do item",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 10% a chance de melhorar a qualidade do item",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 15% a chance de melhorar a qualidade do item",
            "cost": 5
          }
        ]
      },
      {
        "id": 304,
        "name": "Cliente Esperto",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 5% de desconto na loja",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 10% de desconto na loja",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 15% de desconto na loja",
            "cost": 5
          }
        ]
      },
      {
        "id": 305,
        "name": "Crítico Preciso",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 2% a chance de crítico",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 4% a chance de crítico",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 6% a chance de crítico",
            "cost": 5
          }
        ]
      },
      {
        "id": 306,
        "name": "Golpe Abençoado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o dano crítico em 10%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o dano crítico em 20%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o dano crítico em 30%",
            "cost": 5
          }
        ]
      },
      {
        "id": 307,
        "name": "Comprador Afortunado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 5% de chance de receber um item extra ao comprar",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 10% de chance de receber um item extra ao comprar",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 15% de chance de receber um item extra ao comprar",
            "cost": 5
          }
        ]
      },
      {
        "id": 308,
        "name": "Pressentimento do Caçador",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 10% de chance de duplicar cristais",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 20% de chance de duplicar cristais",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 30% de chance de duplicar cristais",
            "cost": 5
          }
        ]
      },
      {
        "id": 309,
        "name": "Espólio Duplicado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta em 8% a chance de duplicar cristais ou itens na loja",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta em 16% a chance de duplicar cristais ou itens na loja",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta em 24% a chance de duplicar cristais ou itens na loja",
            "cost": 5
          }
        ]
      },
      {
        "id": 310,
        "name": "Destino Premiado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a EXP obtida por kill em 3%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a EXP obtida por kill em 6%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a EXP obtida por kill em 9%",
            "cost": 5
          }
        ]
      },
      {
        "id": 311,
        "name": "Profecia de Ouro",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz em 10% a chance de receber loot comum",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz em 20% a chance de receber loot comum",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz em 30% a chance de receber loot comum",
            "cost": 5
          }
        ]
      },
      {
        "id": 312,
        "name": "Chamado do Tesouro",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 5% de chance de gerar um baú após 3 dias",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 10% de chance de gerar um baú após 3 dias",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 15% de chance de gerar um baú após 3 dias",
            "cost": 5
          }
        ]
      },
      {
        "id": 313,
        "name": "Visão do Comerciante",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 2% de chance de receber um item grátis na loja",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 4% de chance de receber um item grátis na loja",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 6% de chance de receber um item grátis na loja",
            "cost": 5
          }
        ]
      },
      {
        "id": 314,
        "name": "Destino Fluido",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a sorte em 3 pontos por 7 dias de login (máx 10)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a sorte em 6 pontos por 7 dias de login (máx 10)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a sorte em 9 pontos por 7 dias de login (máx 10)",
            "cost": 5
          }
        ]
      },
      {
        "id": 315,
        "name": "Toque Dourado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 5% de reembolso total na loja",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 10% de reembolso total na loja",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 15% de reembolso total na loja",
            "cost": 5
          }
        ]
      },
      {
        "id": 316,
        "name": "Sorte Retida",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a sorte em 1 ponto por 7 dias de login (máx 10)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a sorte em 15 pontos por 7 dias de login (máx 10)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a sorte em 20 pontos por 7 dias de login (máx 10)",
            "cost": 5
          }
        ]
      },
      {
        "id": 317,
        "name": "Faro Raro",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 5% de chance de gerar um baú extra ao matar",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 10% de chance de gerar um baú extra ao matar",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 15% de chance de gerar um baú extra ao matar",
            "cost": 5
          }
        ]
      },
      {
        "id": 318,
        "name": "Aposta do Destino",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 10% de chance de ganhar um item raro ao subir de nível",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede 20% de chance de ganhar um item raro ao subir de nível",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede 30% de chance de ganhar um item raro ao subir de nível",
            "cost": 5
          }
        ]
      },
      {
        "id": 319,
        "name": "Sinal da Fortuna",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de obter loot raro em 1% por login (máx 5%)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a chance de obter loot raro em 2% por login (máx 5%)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a chance de obter loot raro em 3% por login (máx 5%)",
            "cost": 5
          }
        ]
      },
      {
        "id": 320,
        "name": "Sortudo de Nascimento",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+1 ponto em um atributo a cada 10 níveis",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+1 ponto em um atributo a cada 9 níveis",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+1 ponto em um atributo a cada 8 níveis",
            "cost": 5
          }
        ]
      }
    ]
  },
  "Mente Estratégica": {
    "id": "Pegasus",
    "name": "Pegasus",
    "oldName": "Mente Estratégica",
    "talents": [
      {
        "id": 401,
        "name": "Estudo Intenso",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a EXP em 3%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a EXP em 6%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a EXP em 9%",
            "cost": 5
          }
        ]
      },
      {
        "id": 402,
        "name": "Planejamento de Guerra",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a regeneração de MP em 2 por dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a regeneração de MP em 4 por dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a regeneração de MP em 6 por dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 403,
        "name": "Disciplina Física",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a regeneração de HP em 2 por dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a regeneração de HP em 4 por dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a regeneração de HP em 6 por dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 404,
        "name": "Rumo ao Topo",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "+1 ponto em um atributo a cada 10 níveis",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "+1 ponto em um atributo a cada 9 níveis",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "+1 ponto em um atributo a cada 8 níveis",
            "cost": 5
          }
        ]
      },
      {
        "id": 405,
        "name": "Eficiência Tática",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o custo de MP em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o custo de MP em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o custo de MP em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 406,
        "name": "Treinamento Focado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 5 EXP após 3 dias de login",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 10 EXP após 3 dias de login",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 15 EXP após 3 dias de login",
            "cost": 5
          }
        ]
      },
      {
        "id": 407,
        "name": "Preparação Silenciosa",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 10 HP se iniciar o dia com MP cheio",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 20 HP se iniciar o dia com MP cheio",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 30 HP se iniciar o dia com MP cheio",
            "cost": 5
          }
        ]
      },
      {
        "id": 408,
        "name": "Prática Deliberada",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 5 EXP após obter 5 acertos",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 10 EXP após obter 5 acertos",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 15 EXP após obter 5 acertos",
            "cost": 5
          }
        ]
      },
      {
        "id": 409,
        "name": "Pensamento Acelerado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a regeneração de HP e MP em 5%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a regeneração de HP e MP em 10%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a regeneração de HP e MP em 15%",
            "cost": 5
          }
        ]
      },
      {
        "id": 410,
        "name": "Fluxo de Conhecimento",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 15 MP a cada 5 ataques carregados",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 30 MP a cada 5 ataques carregados",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 45 MP a cada 5 ataques carregados",
            "cost": 5
          }
        ]
      },
      {
        "id": 411,
        "name": "Ascensão",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede +1 ponto em um atributo ao vencer um chefe oculto",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede +2 pontos em um atributo ao vencer um chefe oculto",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede +3 pontos em um atributo ao vencer um chefe oculto",
            "cost": 5
          }
        ]
      },
      {
        "id": 412,
        "name": "Sintonia Mental",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 10 EXP se o HP e o MP estiverem cheios",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 20 EXP se o HP e o MP estiverem cheios",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 30 EXP se o HP e o MP estiverem cheios",
            "cost": 5
          }
        ]
      },
      {
        "id": 413,
        "name": "Inspiração Repentina",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 5 MP se agir rapidamente",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 10 MP se agir rapidamente",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 15 MP se agir rapidamente",
            "cost": 5
          }
        ]
      },
      {
        "id": 414,
        "name": "Resiliência Lógica",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o dano em 3 se HP e MP estiverem acima de 50%",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o dano em 6 se HP e MP estiverem acima de 50%",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o dano em 9 se HP e MP estiverem acima de 50%",
            "cost": 5
          }
        ]
      },
      {
        "id": 415,
        "name": "Transe de Estudo",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o dano em 10% após causar 1000 de dano em um dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta o dano em 10% após causar 1000 de dano em um dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta o dano em 10% após causar 1000 de dano em um dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 416,
        "name": "Memória Eficiente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede +1 ponto de sorte a cada 10 kills (máximo 5)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Concede +1 ponto de sorte a cada 10 kills (máximo 10)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Concede +1 ponto de sorte a cada 10 kills (máximo 15)",
            "cost": 5
          }
        ]
      },
      {
        "id": 417,
        "name": "Foco Absoluto",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 15 MP se o HP estiver cheio no início do dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 30 MP se o HP estiver cheio no início do dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 45 MP se o HP estiver cheio no início do dia",
            "cost": 5
          }
        ]
      },
      {
        "id": 418,
        "name": "Disciplina Inabalável",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a EXP bônus em 1% por dia (máximo 15%)",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Aumenta a EXP bônus em 2% por dia (máximo 15%)",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Aumenta a EXP bônus em 3% por dia (máximo 15%)",
            "cost": 5
          }
        ]
      },
      {
        "id": 419,
        "name": "Consistência Mental",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ganha 5 EXP após 3 dias de login",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Ganha 10 EXP após 3 dias de login",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Ganha 15 EXP após 3 dias de login",
            "cost": 5
          }
        ]
      },
      {
        "id": 420,
        "name": "Estabilidade Avançada",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Reduz o dano em 5 se não errar durante 1 dia",
            "cost": 1
          },
          {
            "level": 2,
            "effect": "Reduz o dano em 10 se não errar durante 1 dia",
            "cost": 3
          },
          {
            "level": 3,
            "effect": "Reduz o dano em 15 se não errar durante 1 dia",
            "cost": 5
          }
        ]
      }
    ]
  },
  "Constelação Oculta": {
    "id": "Phoenix",
    "name": "Phoenix",
    "oldName": "Constelação Oculta",
    "talents": [
      {
        "id": 501,
        "name": "Espada do Verbo",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o dano total em 10%",
            "cost": 3
          }
        ]
      },
      {
        "id": 502,
        "name": "Juízo Final",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a chance de crítico em 10% contra todos os inimigos",
            "cost": 3
          }
        ]
      },
      {
        "id": 503,
        "name": "Selo de Luz",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede +3 HP e +3 MP por golpe carregado",
            "cost": 3
          }
        ]
      },
      {
        "id": 504,
        "name": "Palavra de Poder",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 10% de chance de duplicar o ataque com golpe carregado",
            "cost": 3
          }
        ]
      },
      {
        "id": 505,
        "name": "Guardião Silencioso",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ao iniciar o dia com HP cheio, concede um escudo de 25 HP",
            "cost": 3
          }
        ]
      },
      {
        "id": 506,
        "name": "Inspiração Sagrada",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Regenera 5% do HP e 5% do MP a cada 10 minutos de estudo",
            "cost": 3
          }
        ]
      },
      {
        "id": 507,
        "name": "Fúria Santa",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta o dano em 15% quando o HP estiver em 10%",
            "cost": 3
          }
        ]
      },
      {
        "id": 508,
        "name": "Golpe Transcendente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Golpe carregado causa aumento de +0.3x no dano",
            "cost": 3
          }
        ]
      },
      {
        "id": 509,
        "name": "Aura Estática",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Quando MP estiver cheio, reduz o dano recebido em 5",
            "cost": 3
          }
        ]
      },
      {
        "id": 510,
        "name": "Bênção do Ancião",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede +5 pontos permanentes em todos os atributos",
            "cost": 3
          }
        ]
      },
      {
        "id": 511,
        "name": "Toque Divino",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Cada ataque carregado cura 1% do HP máximo",
            "cost": 3
          }
        ]
      },
      {
        "id": 512,
        "name": "Alma Ascendente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ao subir de nível, recupera 30% do HP e 30% do MP",
            "cost": 3
          }
        ]
      },
      {
        "id": 513,
        "name": "Sabedoria Silenciosa",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta a EXP em 20% ao derrotar um inimigo sem sofrer dano",
            "cost": 3
          }
        ]
      },
      {
        "id": 514,
        "name": "Resiliência Ardente",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Quando o HP estiver abaixo de 50%, recupera 5/10/15 MP ao receber dano",
            "cost": 3
          }
        ]
      },
      {
        "id": 515,
        "name": "Clarão Interior",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Quando MP estiver cheio, inimigos derrotados concedem +10% de EXP",
            "cost": 3
          }
        ]
      },
      {
        "id": 516,
        "name": "Corte Condenado",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Após 3 ataques carregados consecutivos, o próximo golpe causa +20% de dano",
            "cost": 3
          }
        ]
      },
      {
        "id": 517,
        "name": "Presença Absoluta",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Ao adquirir este talento, concede +10 pontos de atributos",
            "cost": 3
          }
        ]
      },
      {
        "id": 518,
        "name": "Armadura Celestial",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta permanentemente a resistência em 15 pontos",
            "cost": 3
          }
        ]
      },
      {
        "id": 519,
        "name": "Consagração",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Aumenta permanentemente a força em 15 pontos",
            "cost": 3
          }
        ]
      },
      {
        "id": 520,
        "name": "Graça Divina",
        "description": "",
        "levels": [
          {
            "level": 1,
            "effect": "Concede 20% de chance de recuperar totalmente o HP e o MP ao derrotar um inimigo",
            "cost": 3
          }
        ]
      }
    ]
  }
};