# Roadmap do Testeez

Atualizado em 04/10/2026, depois de uma revisão completa do projeto (código, histórico de
495 commits e uma run jogada de ponta a ponta pelo servidor e pelo navegador).

## 1. Onde o projeto está

**Resumo:** os flashcards estão maduros. O jogo tem bastante conteúdo e roda do começo ao fim
(3 atos até a vitória final), mas tinha bugs que travavam ou corrompiam a run. Esses foram
corrigidos agora. O que mais falta é **ligar o estudo ao jogo**, que hoje são quase dois apps
separados.

### Flashcards — ✅ completo para uso diário
- Baralhos em hierarquia (arrastar e soltar), notas básicas e cloze (com dica `{{c1::x::dica}}`)
- Importação `.apkg` do Anki (inclusive 2.1.28+ com zstd e mídia), com barra de progresso
- Sessão de estudo estilo Anki (SM-2, filas novo/aprendizado/revisão, desfazer)
- Painel de cartões com visão dividida, tags na barra lateral, estudo personalizado
- Estatísticas interativas (Chart.js): heatmap, previsão, intervalos, facilidade, botões

### Jogo (roguelike) — 🟡 jogável, falta integração e profundidade
| Sistema | Estado |
|---|---|
| Personagens | **1 jogável (Vlad)**: 4 ataques + 4 especiais. "Mago Teste" é só para testes |
| Mapa | 3 atos × 16 andares; batalha, evento, descanso, loja, elite, boss |
| Inimigos | 92 modelos em 6 grupos de dificuldade, visual montado por equipamentos, intenções por turno |
| Eventos | 21 eventos com imagens e escolhas |
| Relíquias | 49 ativas (a 27 está desativada) |
| Lembranças | 13 tipos (bônus da run escolhido após cada vitória) |
| Talentos | 6 constelações, 56 talentos, comprados com cristais (permanentes) |
| Moedas | Cristais (permanentes → talentos), ouro (da run → loja), ampulhetas (permanentes, **quase sem uso**) |
| Skill test | Barra de poder (timing) |
| Bestiário | Existe a página, mas **não há link para ela na SPA** |

### Ligação estudo → jogo — 🔴 fraca
Hoje estudar só dá cristais em marcos de tempo (30 min; 20/50/100 h). O hub ainda diz
"Estude cartões de revisão para causar dano ao boss!", mas os pontos de revisão
(`session_revision_count`) não são mais usados pelo combate. Ver decisão D1.

## 2. O que foi feito nesta revisão

**Bugs corrigidos** (cada um com teste automático em `tests/`; as partes do navegador também foram
conferidas jogando no Chromium, inclusive simulando a rede caindo e erro de JavaScript):
1. **Recompensa sumia e o jogador ficava preso no nó** (o bug "CRÍTICO" do TODO.md). Eram várias
   causas somadas:
   - *A sessão perdia dados*: toda requisição regravava a sessão inteira, e como o jogo faz várias
     requisições em paralelo, uma requisição lenta apagava o que outra tinha acabado de salvar
     (a lembrança/relíquia pendente sumia de forma intermitente). Agora a sessão só é gravada
     quando muda.
   - A conclusão do nó dependia só do navegador. Agora o servidor conclui o nó quando o inimigo morre.
   - O hub só procurava recompensa vindo da batalha. Agora procura sempre (também ao recarregar).
   - Recompensas não coletadas ficavam presas reaparecendo e nunca eram limpas; agora são
     somadas na próxima coleta e apagadas ao começar outra run.
   - Um erro de JavaScript na atualização visual pós-ataque pulava o fluxo de vitória.
2. **Crítico quebrava o cálculo de ataque**: com a relíquia *Coleção de Espinhos* ou a lembrança
   *Fervor*, o cache de ataque dava erro e o jogo passava a ignorar, em silêncio, tudo que você
   pegasse depois naquela run. Agora os bônus de crítico funcionam.
3. **Escolher a relíquia *Ritual de Sangue* derrubava o servidor**: a relíquia 27 tinha sido
   "comentada" com `'''`, o que corrompia a chave da 28.
4. **Poções derrubadas por inimigos nunca chegavam ao inventário** (14 inimigos têm drop). Agora
   vão para os slots e aparecem no popup de vitória.
5. **Talento *Caçador de Bosses*** (+2 de dano por boss) contava todo inimigo comum como boss.
6. Log de batalha nunca era salvo (campo de MP removido); página de Perfil antiga quebrava.

**Melhorias:**
- Tocar/clicar pula o banner de vitória (a recompensa aparece em ~1 s em vez de ~4 s).
- Base para trabalhar com segurança: `requirements.txt`, `README.md`, `CLAUDE.md`, suíte de testes
  (`python -m pytest`, ~30 s) com um robô que joga a run inteira, banco configurável por variável
  de ambiente, `matplotlib` removido (não era mais usado).

**Não foi verificado:** balanceamento (o robô de teste joga de forma simples e perde para o
primeiro elite sem o "modo invencível") e a sensação de jogo no celular.

## 3. Decisões para você tomar

**D1 — Como o estudo deve alimentar o jogo?** (a decisão mais importante)
| Opção | Como funciona | Prós / contras |
|---|---|---|
| A. Bônus do dia | Revisões do dia viram vantagens na run (ex.: 20 revisões = +1 opção de relíquia; sequência de dias = cristais extras) | Simples, não trava ninguém de jogar. Ligação fraca |
| B. Combustível | Cada nó do mapa custa "Foco", que só se ganha estudando | Ligação forte, motiva estudar. Pode frustrar quando você só quer jogar |
| C. Cartão na batalha | Um skill test que mostra um cartão vencido: acertar fortalece o golpe e conta como revisão | Junta as duas coisas de verdade. Mais trabalho (UI de batalha) |

**Recomendação:** começar por **A** (rápido, sem risco) e depois fazer **C** como um novo skill test.

**D2 — Remover as páginas antigas pré-SPA?** `hub-legacy`, Perfil, Atributos, Inventário e Loja antigos,
`hub.html`, `spa-navigation.js`. Nada na SPA leva até elas; elas confundem quem mexe no código.
Recomendação: remover (o Bestiário pode ser religado no hub antes).

**D3 — Banco versionado no git.** `instance/flashcards.db` (uma versão antiga) e 25 arquivos
`__pycache__/*.pyc` estão no repositório. Não removi daqui porque o `git pull` no seu PC poderia
apagar ou travar no seu banco de verdade. Para limpar com segurança, no seu PC: copie
`instance/flashcards.db` para fora da pasta, rode
`git rm -r --cached instance/flashcards.db __pycache__ routes/__pycache__ routes/battle_modules/__pycache__ routes/relics/__pycache__`,
faça commit e confira que o banco continua lá (o `--cached` só tira do git, não apaga o arquivo).

## 4. Próximos passos

Cada item é pensado para caber num PR pequeno, com teste.

### Fase 1 — Terminar a estabilização (curta)
- [ ] Jogar uma run real no seu PC/celular e anotar o que estranhar (checklist no fim)
- [ ] Implementar as relíquias de evento que hoje não fazem nada: *Pacto Demoníaco*
      (Demônio Tentador) e *Favor da Morte* (evento da Morte) — o jogo diz "Ganhou", mas nada acontece.
      Precisa de 2 ícones (hoje só existe `relics/placeholder.png`) e de uma marca `event_only` no
      registro para elas não aparecerem nas recompensas comuns. O "Favor da Morte" pode reaproveitar
      a lógica do Espelho de Lázaro (`battle_utils.apply_damage_to_player`)
- [ ] Religar o Bestiário no hub (ou decidir removê-lo — D2)
- [ ] Simulação de balanceamento: um robô melhor (usa especiais e poções) jogando centenas de runs
      para medir taxa de vitória por ato e ajustar elites/bosses com números

### Fase 2 — Fluidez (GAME_DESIGN_ANALYSIS.md §1–2)
- [x] Pular o banner de vitória
- [ ] Recompensa e lembrança por cima do campo de batalha, sem voltar ao hub a cada luta (§1.4)
- [ ] Encurtar o turno inimigo (transição 1000→600 ms, buffs 400 ms) e os bloqueios de especial/poção (§1.1, §1.2)
- [ ] Uma atualização de HUD por ação em vez de três; trocar o polling de 300 ms por eventos (§2.1, §2.3)
- [ ] Carregar os 21 scripts da batalha em paralelo (§1.3)
- [ ] Intenções do inimigo mais visíveis durante o turno do jogador

### Fase 3 — Estudo ↔ jogo (depende da D1)
- [ ] Opção A: bônus diários por revisões e sequência de dias, mostrados no hub
- [ ] Atualizar o texto do hub ("Estude cartões...") para refletir a regra nova
- [ ] (depois) Opção C: skill test de cartão

### Fase 4 — Profundidade com o que já existe (§3)
- [ ] Limiares de lembranças (ex.: 3× Dominatio = 10% de chance de atacar 2×)
- [ ] Combos de tipos de ataque (básico → poder → especial)
- [ ] Energia como recurso tático (sobrecarga com energia cheia, "última gota")
- [ ] Usar as ampulhetas (hoje acumulam sem destino): loja permanente de bênçãos de início de run

### Fase 5 — Técnicas (§5)
- [ ] Estrutura de técnicas (1 por skill, mudam o comportamento)
- [ ] 3 técnicas para ataque básico e 3 para poder; depois 3 por especial
- [ ] Pontos de aquisição: após o 1º elite de cada ato, evento "Mestre de Armas", loja

### Fase 6 — Conteúdo e metaprogressão (§4, §6, §7)
- [ ] Segundo personagem jogável (precisa de sprites/animações; o código já suporta vários)
- [ ] Bestiário com recompensas, coleção de relíquias, conquistas com efeito
- [ ] Novos skill tests (sequência de símbolos, segurar e soltar, escolha rápida)
- [ ] Ecos de Memória (lore dinâmica)

## 5. Dívida técnica (atacar aos poucos, quando mexer na área)
- Arquivos enormes: `routes/battle.py` (3,8 mil linhas), `static/js/battle-combat-system.js` (6,7 mil)
- Sem ferramenta de migração: colunas novas exigem `ALTER TABLE` manual no código de inicialização
- Dependência de CDN (Bootstrap, jQuery, particles.js, Chart.js): sem internet o visual quebra
- Lembrança e relíquia pendentes ainda ficam na sessão; duas requisições que *alteram* a sessão ao
  mesmo tempo ainda podem se sobrescrever. O ideal é guardá-las no banco, como já é feito com
  `PendingReward`
- Muitos `print`/`console.log` de depuração; `Query.get()` legado do SQLAlchemy 2.0
- Rotas de desenvolvimento (`/dev_*`, `/definir_cristais`, `/gamification/add_crystals`) abertas para qualquer um na rede

## Checklist para testar no seu PC
1. `pip install -r requirements.txt` e `python -m pytest` (deve dar tudo verde)
2. Faça cópia de `instance/flashcards.db` e rode `python app.py`
3. Comece uma run, vença 3 batalhas: a recompensa aparece sempre? Dá para avançar no mapa?
4. Recarregue a página logo após vencer: a recompensa aparece ao voltar?
5. Pegue *Fervor* ou *Coleção de Espinhos* e veja se a chance de crítico aparece nos ataques
6. Toque na tela durante o banner de vitória: pula para a recompensa?
