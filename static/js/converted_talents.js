const talentData = {
  "Ofensiva Brutal": {
    "id": "Draco",
    "name": "Draco",
    "oldName": "Ofensiva Brutal",
    "talents": []
  },
  "Defesa e Sobrevivência": {
    "id": "Taurus",
    "name": "Taurus",
    "oldName": "Defesa e Sobrevivência",
    "talents": []
  },
  "Artes Arcanas": {
    "id": "Aquarius",
    "name": "Aquarius",
    "oldName": "Artes Arcanas",
    "talents": []
  },
  "Sorte e Caos": {
    "id": "Hercules",
    "name": "Hercules",
    "oldName": "Sorte e Caos",
    "talents": []
  },
  "Mente Estratégica": {
    "id": "Pegasus",
    "name": "Pegasus",
    "oldName": "Mente Estratégica",
    "talents": []
  },
  "Constelação Oculta": {
    "id": "Phoenix",
    "name": "Phoenix",
    "oldName": "Constelação Oculta",
    "talents": []
  }
};

const talents = {
    "Ofensiva Brutal": [
      {
        "id": 1,
        "name": "Ataque Pesado I",
        "branch": "Ofensiva Brutal",
        "levels": [
          { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
        ]
      },
      {
        "id": 2,
        "name": "Golpe Crítico I",
        "branch": "Ofensiva Brutal",
        "levels": [
          { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
        ]
      },
      // Adicione todos os outros talentos do arquivo Python aqui
    ],
    // Adicione as outras categorias aqui
  };
  
  // Transformar o formato para ser compatível com o código existente
  const skilltreeData = {
    "Ofensiva Brutal": {
      "id": "Draco",
      "name": "Draco",
      "oldName": "Ofensiva Brutal",
      "talents": talents["Ofensiva Brutal"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: talent.levels || [{ level: 1, effect: talent.effect || "", cost: talent.cost || 1 }]
      }))
    },
    "Defesa e Sobrevivência": {
      "id": "Taurus",
      "name": "Taurus",
      "oldName": "Defesa e Sobrevivência",
      "talents": talents["Defesa e Sobrevivência"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: talent.levels || [{ level: 1, effect: talent.effect || "", cost: talent.cost || 1 }]
      }))
    },
    "Artes Arcanas": {
      "id": "Aquarius",
      "name": "Aquarius",
      "oldName": "Artes Arcanas",
      "talents": talents["Artes Arcanas"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: talent.levels || [{ level: 1, effect: talent.effect || "", cost: talent.cost || 1 }]
      }))
    },
    "Sorte e Caos": {
      "id": "Hercules",
      "name": "Hercules",
      "oldName": "Sorte e Caos",
      "talents": talents["Sorte e Caos"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: talent.levels || [{ level: 1, effect: talent.effect || "", cost: talent.cost || 1 }]
      }))
    },
    "Mente Estratégica": {
      "id": "Pegasus",
      "name": "Pegasus",
      "oldName": "Mente Estratégica",
      "talents": talents["Mente Estratégica"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: talent.levels || [{ level: 1, effect: talent.effect || "", cost: talent.cost || 1 }]
      }))
    },
    "Constelação Oculta": {
      "id": "Phoenix",
      "name": "Phoenix",
      "oldName": "Constelação Oculta",
      "talents": talents["Constelação Oculta"].map(talent => ({
        id: talent.id,
        name: talent.name,
        description: talent.description || "",
        levels: [{ level: 1, effect: talent.effect || "", cost: talent.cost || 3 }]
      }))
    }
  };
  
  console.log("Dados de talentos convertidos carregados!");


// Agora carregamos os dados do arquivo Python
// Ofensiva Brutal

talents = {
    "Ofensiva Brutal": [
        {   "id": 1,
            "name": "Ataque Pesado I",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
            ]
        },
        {   "id": 2,
            "name": "Golpe Crítico I",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 3,
            "name": "Dano Crítico I",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano do acerto crítico em 15%", "cost": 1 }
            ]
        },
        {   "id": 4,
            "name": "Bloqueio Ofensivo",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o bloqueio em 3%", "cost": 1 }
            ]
        },
        {   "id": 5,
            "name": "Cura ao Causar Dano I",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Cura 3% do HP ao causar dano", "cost": 1 }
            ]
        },
        {   "id": 6,
            "name": "Ataque Pesado II",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
            ]
        },
        {   "id": 7,
            "name": "Golpe Crítico II",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 8,
            "name": "Dano Crítico II",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano do acerto crítico em 15%", "cost": 1 }
            ]
        },
        {   "id": 9,
            "name": "Cura ao Causar Dano II",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Cura 3% do HP ao causar dano", "cost": 1 }
            ]
        },
        {   "id": 10,
            "name": "Ataque Pesado III",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
            ]
        },
        {   "id": 11,
            "name": "Golpe Crítico III",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 12,
            "name": "Dano Crítico III",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano do acerto crítico em 15%", "cost": 1 }
            ]
        },
        {   "id": 13,
            "name": "Ataque Pesado IV",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
            ]
        },
        {   "id": 14,
            "name": "Golpe Crítico IV",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 15,
            "name": "Dano Crítico IV",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano do acerto crítico em 15%", "cost": 1 }
            ]
        },
        {   "id": 16,
            "name": "Bloqueio Ofensivo II",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o bloqueio em 3%", "cost": 1 }
            ]
        },
        {   "id": 17,
            "name": "Cura ao Causar Dano III",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Cura 3% do HP ao causar dano", "cost": 1 }
            ]
        },
        {   "id": 18,
            "name": "Ataque Pesado V",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano em 20%", "cost": 3 }
            ]
        },
        {   "id": 19,
            "name": "Golpe Crítico V",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "+3% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 20,
            "name": "Vampirismo Supremo",
            "branch": "Ofensiva Brutal",
            "levels": [
                { "level": 1, "effect": "Ao causar dano, cura 10% do HP com base no dano causado e aumenta o dano em 30%", "cost": 3 }
            ]
        }
    ],
    "Defesa e Sobrevivência": [
        {   "id": 101,
            "name": "Bloqueio I",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Aumenta 2% bloqueio", "cost": 1 }
            ]
        },
        {   "id": 102,
            "name": "Bloqueio II",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Aumenta 2% bloqueio", "cost": 1 }
            ]
        },
        {   "id": 103,
            "name": "Bloqueio III",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Aumenta 2% bloqueio", "cost": 1 }
            ]
        },
        {   "id": 104,
            "name": "Bloqueio IV",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Aumenta 2% bloqueio", "cost": 1 }
            ]
        },
        {   "id": 105,
            "name": "Bloqueio V",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Aumenta 2% bloqueio", "cost": 1 }
            ]
        },
        {   "id": 106,
            "name": "+HP Máximo I",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+15 HP máximo", "cost": 1 }
            ]
        },
        {   "id": 107,
            "name": "+HP Máximo II",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+15 HP máximo", "cost": 1 }
            ]
        },
        {   "id": 108,
            "name": "+HP Máximo III",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+15 HP máximo", "cost": 1 }
            ]
        },
        {   "id": 109,
            "name": "Vitalidade I",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+3 Vitalidade", "cost": 1 }
            ]
        },
        {   "id": 110,
            "name": "Vitalidade II",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+3 Vitalidade", "cost": 1 }
            ]
        },
        {   "id": 111,
            "name": "Vitalidade III",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+3 Vitalidade", "cost": 1 }
            ]
        },
        {   "id": 112,
            "name": "Vitalidade IV",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+3 Vitalidade", "cost": 1 }
            ]
        },
        {   "id": 113,
            "name": "Vitalidade V",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "+3 Vitalidade", "cost": 1 }
            ]
        },
        {   "id": 114,
            "name": "Cura de Batalha I",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Cura 25HP após derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 115,
            "name": "Cura de Batalha II",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Cura 25HP após derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 116,
            "name": "Regeneração Dupla",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Duplica a regeneração de HP se o HP atual for <30%", "cost": 2 }
            ]
        },
        {   "id": 117,
            "name": "Cura Matinal I",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Cura 10HP todo início do dia", "cost": 1 }
            ]
        },
        {   "id": 118,
            "name": "Cura Matinal II",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Cura 10HP todo início do dia", "cost": 1 }
            ]
        },
        {   "id": 119,
            "name": "Cura Matinal III",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Cura 10HP todo início do dia", "cost": 1 }
            ]
        },
        {   "id": 120,
            "name": "Renovação Total",
            "branch": "Defesa e Sobrevivência",
            "levels": [
                { "level": 1, "effect": "Após derrotar um inimigo, cura completamente o HP", "cost": 3 }
            ]
        }
    ],
    "Artes Arcanas": [
        {   "id": 201,
            "name": "MP Máximo I",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+15 MP máximo", "cost": 1 }
            ]
        },
        {   "id": 202,
            "name": "MP Máximo II",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+15 MP máximo", "cost": 1 }
            ]
        },
        {   "id": 203,
            "name": "MP Máximo III",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+15 MP máximo", "cost": 1 }
            ]
        },
        {   "id": 204,
            "name": "Regeneração Mágica",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Regenera 10 MP no início do dia", "cost": 1 }
            ]
        },
        {   "id": 205,
            "name": "Regeneração Dobrada",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Duplica a regeneração de MP se MP for <30%", "cost": 2 }
            ]
        },
        {   "id": 206,
            "name": "Concentração I",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+3 Concentração", "cost": 1 }
            ]
        },
        {   "id": 207,
            "name": "Concentração II",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+3 Concentração", "cost": 1 }
            ]
        },
        {   "id": 208,
            "name": "Concentração III",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+3 Concentração", "cost": 1 }
            ]
        },
        {   "id": 209,
            "name": "Recuperação Arcana",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Recupera 25HP após derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 210,
            "name": "Escudo de Mana I",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", "cost": 1 }
            ]
        },
        {   "id": 211,
            "name": "Escudo de Mana II",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", "cost": 1 }
            ]
        },
        {   "id": 212,
            "name": "Escudo de Mana III",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", "cost": 1 }
            ]
        },
        {   "id": 213,
            "name": "Escudo de Mana IV",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", "cost": 1 }
            ]
        },
        {   "id": 214,
            "name": "Escudo de Mana V",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Escudo de mana: concede defesa de 1% da mana gasta no dia anterior", "cost": 1 }
            ]
        },
        {   "id": 215,
            "name": "Regeneração Menor",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Regenera 5 MP no início do dia", "cost": 1 }
            ]
        },
        {   "id": 216,
            "name": "Concentração IV",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+3 Concentração", "cost": 1 }
            ]
        },
        {   "id": 217,
            "name": "Concentração V",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "+3 Concentração", "cost": 1 }
            ]
        },
        {   "id": 218,
            "name": "Recuperação Mística",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Recupera 25HP após derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 219,
            "name": "Regeneração Superior",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Regenera 10 MP no início do dia", "cost": 1 }
            ]
        },
        {   "id": 220,
            "name": "Conversão de Mana",
            "branch": "Artes Arcanas",
            "levels": [
                { "level": 1, "effect": "Cura 10% de HP de todo MP consumido em habilidades", "cost": 3 }
            ]
        }
    ],
    "Sorte e Caos": [
        {   "id": 301,
            "name": "Sorte I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 302,
            "name": "Sorte II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 303,
            "name": "Sorte III",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 304,
            "name": "Sorte IV",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 305,
            "name": "Sorte V",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 306,
            "name": "Sorte VI",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5 Sorte", "cost": 1 }
            ]
        },
        {   "id": 307,
            "name": "Desconto I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% desconto na loja", "cost": 1 }
            ]
        },
        {   "id": 308,
            "name": "Desconto II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% desconto na loja", "cost": 1 }
            ]
        },
        {   "id": 309,
            "name": "Desconto III",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% desconto na loja", "cost": 1 }
            ]
        },
        {   "id": 310,
            "name": "Crítico Caótico I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 311,
            "name": "Crítico Caótico II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 312,
            "name": "Crítico Caótico III",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "+5% chance de acerto crítico", "cost": 1 }
            ]
        },
        {   "id": 313,
            "name": "Cura Caótica I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "5% de chance de curar totalmente HP e MP no início do dia", "cost": 1 }
            ]
        },
        {   "id": 314,
            "name": "Cura Caótica II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "5% de chance de curar totalmente HP e MP no início do dia", "cost": 1 }
            ]
        },
        {   "id": 315,
            "name": "Cristais Dobrados I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% de chance de duplicar a quantidade de cristais recebidos", "cost": 1 }
            ]
        },
        {   "id": 316,
            "name": "Cristais Dobrados II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% de chance de duplicar a quantidade de cristais recebidos", "cost": 1 }
            ]
        },
        {   "id": 317,
            "name": "Cristais Dobrados III",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "10% de chance de duplicar a quantidade de cristais recebidos", "cost": 1 }
            ]
        },
        {   "id": 318,
            "name": "EXP Turbinada I",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "Aumenta EXP recebido em 10%", "cost": 1 }
            ]
        },
        {   "id": 319,
            "name": "EXP Turbinada II",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "Aumenta EXP recebido em 10%", "cost": 1 }
            ]
        },
        {   "id": 320,
            "name": "Ladrão Mestre",
            "branch": "Sorte e Caos",
            "levels": [
                { "level": 1, "effect": "20% de chance de conseguir um baú de recompensa ao logar, tendo logado diariamente nos últimos 3 dias", "cost": 3 }
            ]
        }
    ],
    "Mente Estratégica": [
        {   "id": 401,
            "name": "EXP Estratégico I",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "+10% EXP recebido", "cost": 1 }
            ]
        },
        {   "id": 402,
            "name": "EXP Estratégico II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "+10% EXP recebido", "cost": 1 }
            ]
        },
        {   "id": 403,
            "name": "EXP Estratégico III",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "+10% EXP recebido", "cost": 1 }
            ]
        },
        {   "id": 404,
            "name": "EXP Estratégico IV",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "+10% EXP recebido", "cost": 1 }
            ]
        },
        {   "id": 405,
            "name": "Cura Matinal",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Cura +5 HP todo início de dia", "cost": 1 }
            ]
        },
        {   "id": 406,
            "name": "Cura Matinal II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Cura +5 HP todo início de dia", "cost": 1 }
            ]
        },
        {   "id": 407,
            "name": "Recuperação Matinal",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recupera +5 MP todo início de dia", "cost": 1 }
            ]
        },
        {   "id": 408,
            "name": "Recuperação Matinal II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recupera +5 MP todo início de dia", "cost": 1 }
            ]
        },
        {   "id": 409,
            "name": "Atributo Adicional I",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recebe 1 ponto de atributo adicional a cada 10 níveis", "cost": 1 }
            ]
        },
        {   "id": 410,
            "name": "Atributo Adicional II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recebe 1 ponto de atributo adicional a cada 10 níveis", "cost": 1 }
            ]
        },
        {   "id": 411,
            "name": "Manhã Potente",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Cura 20HP se começar o dia com MP cheio", "cost": 1 }
            ]
        },
        {   "id": 412,
            "name": "Início Revitalizante",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recupera 20MP se começar o dia com HP cheio", "cost": 1 }
            ]
        },
        {   "id": 413,
            "name": "Vitória Pós-Batalha",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Cura 10 HP ao derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 414,
            "name": "Recuperação Pós-Batalha",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recupera 10 MP ao derrotar um inimigo", "cost": 1 }
            ]
        },
        {   "id": 415,
            "name": "Defesa Emergencial I",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Aumenta o bloqueio em 5% se HP atual estiver abaixo de 50% do HP máximo", "cost": 1 }
            ]
        },
        {   "id": 416,
            "name": "Defesa Emergencial II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Aumenta o bloqueio em 5% se HP atual estiver abaixo de 50% do HP máximo", "cost": 1 }
            ]
        },
        {   "id": 417,
            "name": "Dano Retaliatório",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "+0.5x dano se o dano causado aos inimigos no dia anterior foi 500 ou mais", "cost": 1 }
            ]
        },
        {   "id": 418,
            "name": "EXP Impecável I",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recebe 10% a mais de EXP ao derrotar um inimigo sem sofrer dano", "cost": 1 }
            ]
        },
        {   "id": 419,
            "name": "EXP Impecável II",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Recebe 10% a mais de EXP ao derrotar um inimigo sem sofrer dano", "cost": 1 }
            ]
        },
        {   "id": 420,
            "name": "Privança do Mestre",
            "branch": "Mente Estratégica",
            "levels": [
                { "level": 1, "effect": "Privança do Mestre (+20 Sorte, +15 Vitalidade, +15 Concentração)", "cost": 3 }
            ]
        }
    ],
    "Constelação Oculta": [
        {   "id": 501,
            "name": "Dano Final",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "Aumenta o dano final em 10%", "cost": 3 }
            ]
        },
        {   "id": 502,
            "name": "Crítico Oculto",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "Aumenta a chance de crítico em 10%", "cost": 3 }
            ]
        },
        {   "id": 503,
            "name": "Cura Oculta",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "Cura 2% do dano causado aos inimigos, em HP", "cost": 3 }
            ]
        },
        {   "id": 504,
            "name": "Recuperação Oculta",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "Recupera 5% do dano causado, em MP", "cost": 3 }
            ]
        },
        {   "id": 505,
            "name": "Bloqueio Oculto",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "+12% de bloqueio", "cost": 3 }
            ]
        },
        {   "id": 506,
            "name": "Vitalidade Oculta",
            "branch": "Constelação Oculta",
            "levels": [
                { "level": 1, "effect": "+20 Vitalidade", "cost": 3 }
            ]
        }
    ]
}

// Define esta variável para compatibilidade com o código existente
const skilltreeData = talentData;