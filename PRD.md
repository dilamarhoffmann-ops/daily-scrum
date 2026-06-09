# PRD - Scrum Time Apoio (Agile Engine)
## Documento de Requisitos do Produto & Guia de Regras do Sistema

Bem-vindo ao **Scrum Time Apoio**, um motor ágil completo integrado ao Supabase para planejar, executar, inspecionar e adaptar ciclos de desenvolvimento (Sprints) utilizando o framework Scrum.

Este documento detalha o propósito e as regras de negócio de cada tela (menu) e funcionalidade do sistema. Ele foi elaborado para guiar novos integrantes do time, explicando detalhadamente como o sistema opera, de ponta a ponta, mesmo que não tenham conhecimento prévio sobre as regras.

---

## 1. Visão Geral do Sistema e Perfis de Acesso

O Scrum Time Apoio organiza o trabalho em torno de **Produtos/Projetos** ativos, estruturando tarefas técnicas vinculadas a **Histórias de Usuário (User Stories)** que pertencem a grandes metas chamadas **Épicos**. O sistema é dinâmico e calcula automaticamente a capacidade de trabalho do time em horas, gerando gráficos de queima de tarefas (Burndown/Burnup) em tempo real.

### Níveis de Acesso e Permissões do Sistema

A segurança do sistema é definida por dois atributos no perfil do usuário (`profiles`): o **Cargo (Role)** e a **Permissão de Acesso (Access)**.

*   **Acesso Master (Gestores / Admins):**
    *   **Perfis associados:** Usuários com nível de acesso `Admin`, `Gestor` ou cargos como `Gestor`, `Product Owner`, `Gerente`, `Administrador`.
    *   **Permissões:** Controle total. Podem criar, pausar, retomar, arquivar e restaurar projetos; criar sprints; cadastrar e gerenciar usuários; alterar o checklist de Definição de Pronto (DoD); criar, editar e excluir histórias e tarefas.
*   **Acesso Operacional (Colaboradores / Desenvolvedores):**
    *   **Perfis associados:** Usuários com nível de acesso `Colaborador` ou cargos como `Desenvolvedor`, `BI`, `Designer`, `QA`.
    *   **Permissões:** Podem atualizar o status de suas próprias tarefas no Kanban, registrar notas diárias na Daily, adicionar insights na Retrospectiva, visualizar métricas e editar seus próprios perfis. Operações de exclusão de itens essenciais e controle administrativo do projeto são bloqueadas.

---

## 2. Regras Globais de Segurança e Estados do Projeto

Os projetos no Scrum Time possuem três status principais na tabela `projects`: `active` (ativo), `paused` (pausado) e `archived` (arquivado).

### Regra de Projeto Pausado (Read-Only Mode)
*   **O que é:** Qualquer projeto pode ser pausado estrategicamente por um Gestor ou Product Owner. Ao ser pausado, o projeto entra no estado de **Somente Leitura**.
*   **Funcionamento:** Toda a interface do projeto exibe um alerta contendo a **justificativa da pausa** (e, opcionalmente, a tarefa técnica específica que causou o impedimento).
*   **Impacto:** Nenhuma alteração no Backlog, Sprint Planning, Kanban Board, Daily, Review ou Retrospective será permitida. Todos os formulários, botões de exclusão, drag-and-drop e inputs de horas ficam desabilitados para todos os usuários.
*   **Retomada:** Apenas um usuário de nível Gestor/Admin pode retomar o projeto para o estado ativo.

### Regra de Arquivamento e Restauração
*   **Arquivamento:** Finalizar um projeto operacionalmente remove-o do menu de navegação de projetos ativos, mantendo seus dados históricos seguros.
*   **Restauração:** Projetos arquivados podem ser reativados na área administrativa por Gestores, retornando para o painel de projetos ativos.

---

## 3. Detalhamento dos Menus e Telas do Sistema

### 🗺️ 3.1. Dashboard (Scrum Compass)
O painel de controle executivo oferece uma visão rápida do direcionamento estratégico do time.

*   **Funcionalidades:**
    *   **Filtro de Visualização:** Alterna entre **Projeto Atual** (dados individuais da Sprint ativa do projeto selecionado) e **Portfólio Global** (consolidação de todos os projetos ativos do portfólio).
    *   **Resumo de Carga (Capacidade):** Exibe as horas totais estimadas do projeto, horas concluídas e horas restantes.
    *   **Engajamento de Time:** Lista os membros envolvidos, comparando as horas atribuídas (planejadas) contra as horas reais (realizadas), apontando a variância.
    *   **Saúde do Portfólio / Burndown:** Exibe um gráfico simplificado de queima de horas ou progresso em barra percentual para cada projeto ativo.
    *   **Priorização de Projetos:** No menu lateral, Gestores podem clicar nas setas para cima/baixo para reordenar os projetos. Essa ordenação atualiza o campo `priority_order` no banco de dados e reorganiza a navegação de todo o time.

---

### 📂 3.2. Product Backlog
É a lista geral de todas as necessidades do projeto. O local onde as ideias brutas são cadastradas e transformadas em itens planejáveis.

*   **Épicos:** Iniciativas de alto nível (ex: *Integração Financeira*). Histórias de usuário devem ser agrupadas dentro de Épicos para melhor organização do escopo.
*   **Histórias de Usuário (User Stories - US):** Requisitos de negócio detalhados da perspectiva do usuário final (ex: *"Como cliente, quero pagar com Pix para aprovação imediata"*).
*   **Regras de Planejamento da US:**
    *   **Story Points (SP):** Pontuação de complexidade baseada na escala Fibonacci (1, 2, 3, 5, 8, 13, 21). Representa o esforço subjetivo e incerteza técnica da história.
    *   **Horas Estimadas:** O tempo previsto para conclusão.
    *   **Priorização:** Itens no backlog podem ser arrastados ou reordenados para definir a ordem em que serão levados para desenvolvimento.

---

### 📅 3.3. Sprint Planning
Tela de planejamento e partida de uma Sprint (iteração, geralmente de 2 semanas de trabalho focado).

*   **Bloqueio de Acesso (Pré-requisitos Obrigatórios):**
    A tela de planejamento é bloqueada caso as três etapas básicas de ciclo não estejam cumpridas no Backlog:
    1.  **Criar Produto:** O projeto ativo precisa existir.
    2.  **Ativar Sprint:** Uma sprint com metas e datas deve estar ativa.
    3.  **Criar Histórias:** O backlog do projeto deve conter pelo menos uma história de usuário.
*   **Meta da Sprint (Sprint Goal - North Star):**
    O objetivo de valor que guia a iteração. Fica em destaque para manter o time focado no resultado de negócio esperado.
*   **Métrica de Capacidade do Time (Cálculo dos 80%):**
    O sistema soma a capacidade individual dos membros baseada nas horas úteis diárias cadastradas (ex: 8 horas/dia) multiplicada pelos dias úteis do período da Sprint. É aplicado um fator de foco de **80%** (fator de buffer para rituais, reuniões e imprevistos).
    *   *Regra de Alerta:* Se as horas planejadas das tarefas na Sprint ultrapassarem essa capacidade de foco calculada, o sistema emite um alerta vermelho indicando que o time está sobrecarregado (Over Capacity).
*   **Lançar Projeto:**
    As Histórias de Usuário planejadas contêm tarefas técnicas. Para iniciar a Sprint, o planejador marca quais tarefas da história quer levar e clica em "Lançar Projeto". Isso move a história para a Sprint ativa e publica as tarefas no Sprint Backlog.

---

### 📋 3.4. Sprint Backlog (Kanban Board)
O quadro visual onde as tarefas técnicas são monitoradas no dia a dia. É dividido em 5 colunas:
1.  **PENDENTE (To Do):** Tarefas aguardando início.
2.  **EM ANDAMENTO (In Progress):** Tarefas sendo executadas no momento.
3.  **PRONTO PARA TESTE (Ready to Test):** Concluídas pelo desenvolvedor, prontas para validação interna.
4.  **EM REVISÃO (Review):** Passando por Code Review ou homologação.
5.  **CONCLUÍDO (Done):** Tarefas finalizadas com sucesso.

#### Regras de Ouro do Kanban Board:

*   **Regra de Responsabilidade Obrigatória (P0):**
    Nenhuma tarefa pode ser arrastada ou atualizada para outro status se não possuir um **Membro Responsável** definido. O sistema bloqueia a transição imediatamente caso o campo `assigned_to` esteja em branco.
*   **Regra de Pausa de Tarefa Individual:**
    O time pode pausar uma tarefa técnica individual informando uma **Justificativa de Pausa** obrigatória (ex: aguardando dependência externa). Uma tarefa pausada fica com marcação visual amarela no Kanban e **não pode ser movida** ou alterada até que um Gestor clique em "Retomar Tarefa".
*   **Regra de Impedimento (Blocked):**
    Qualquer membro do time pode marcar um impedimento crítico na tarefa, descrevendo o motivo. O card ganha uma borda vermelha e um ícone de alerta para notificar o Scrum Master sobre o gargalo.
*   **Propagação Automática de Status da História (Parent US):**
    Mover tarefas altera automaticamente o status da História de Usuário (US) a que pertencem:
    *   Se *todas* as tarefas de uma história são movidas para `CONCLUÍDO`, a história pai é automaticamente atualizada para `done` (concluída).
    *   Se *pelo menos uma* tarefa é iniciada, a história pai muda para `in_progress` (em andamento).
    *   Se *todas* as tarefas voltam para `PENDENTE`, a história pai retorna para `todo`.
*   **Cálculo Automático de Horas Reais (Actual Hours):**
    *   Ao arrastar uma tarefa da coluna PENDENTE pela primeira vez, o sistema grava internamente a data/hora exata de início (`started_at`).
    *   Ao arrastar a tarefa para CONCLUÍDO, o sistema grava a data/hora final (`completed_at`).
    *   O sistema calcula automaticamente o tempo de ciclo real e preenche as **Horas Realizadas** (`actual_hours`). A fórmula calcula a diferença em horas com o mínimo de 0.5h (meia hora) e arredondamento para uma casa decimal.
*   **Definição de Pronto (DoD - Definition of Done):**
    Ao arrastar uma tarefa para a coluna **CONCLUÍDO**, o sistema abre um popup com um checklist obrigatório de critérios de qualidade (DoD). O botão de conclusão só é liberado para gravação após o usuário marcar todos os critérios definidos nas configurações globais.
*   **Retorno ao Backlog:**
    Gestores, Gerentes ou POs podem enviar uma tarefa (e consequentemente toda a história vinculada a ela) de volta para o Backlog Geral caso ocorra uma mudança severa de escopo, registrando obrigatoriamente a justificativa.

---

### 💬 3.5. Daily Meeting
Menu dedicado ao ritual diário de alinhamento rápido do time (reunião diária de 15 minutos).

*   **Timebox Daily (Cronômetro):**
    Cronômetro em destaque. Caso a reunião passe de **15 minutos (900 segundos)**, o contador fica vermelho, alertando visualmente que o limite de tempo sugerido do ritual estourou.
*   **Status por Membro:**
    As tarefas ativas (não concluídas) são agrupadas na tela por membro do time. Isso facilita a leitura dinâmica dos três pilares da Daily: *"O que fiz ontem? O que farei hoje? Há algum impedimento?"*.
*   **Atualização Diária de Tempo Restante:**
    Ao lado de cada tarefa nesta tela, há um input direto para atualizar as **Horas Restantes** (`remaining_hours`). Manter este número atualizado diariamente é vital para alimentar o gráfico de burndown.
*   **Histórico de Tarefa:**
    Lista abaixo de cada tarefa as anotações geradas no dia a dia, organizadas cronologicamente.
*   **Board de Ações/Impedimentos:**
    Permite criar notas rápidas separadas em **Ação** (tarefa rápida de correção fora do escopo planejado) ou **Impedimento** (dificuldade que precisa de auxílio externo). Essas notas podem ser vinculadas a tarefas específicas.

---

### 🔍 3.6. Sprint Review
Reunião ao final de cada iteração para apresentar o incremento do produto concluído aos stakeholders.

*   **Incremento da Sprint:**
    Exibe uma lista contendo todas as Histórias de Usuário finalizadas no período, com seus Story Points e a indicação de que o DoD foi validado.
*   **Regra de Reprovação de Tarefa:**
    Durante a revisão, o Product Owner ou Gestor pode **reprovar** uma das tarefas de entrega. Ao fazer isso, é obrigatório preencher uma **Justificativa de Reprovação**. A tarefa retorna para o fluxo de execução no Kanban e a história pai perde o status de concluída, voltando a ficar em aberto.
*   **Feedback do Cliente:**
    Permite registrar o feedback de stakeholders recebido na reunião. Os feedbacks são categorizados em:
    *   *Melhoria (Improvement)*
    *   *Elogio (Compliment)*
    *   *Alteração (Change Request)*
    Eles podem ser vinculados a uma história ou tarefa técnica específica para que o time saiba exatamente onde agir.

---

### 🔄 3.7. Retrospective
Menu para o time debater o processo de trabalho e identificar melhorias para as próximas sprints.

*   **Colunas de Insights:**
    O time cadastra notas anônimas ou identificadas em 3 tópicos essenciais:
    *   *O que fizemos bem? (Keep):* Pontos fortes a serem mantidos.
    *   *O que não repetir? (Stop):* Erros, gargalos ou frustrações.
    *   *O que podemos melhorar? (Start):* Ideias práticas de melhoria.
*   **Finalizar e Arquivar Projeto:**
    Ao término do ciclo de vida de um projeto operacional, Gestores e Product Owners podem clicar neste botão dentro da Retrospectiva para arquivar o projeto, fechando a iteração e resguardando os dados históricos.

---

### 📈 3.8. Performance Metrics
A central de dados estatísticos do projeto.

*   **Sprint Burndown:** Gráfico diário que rastreia a queima das estimativas de horas restantes. A linha ideal desce até zero na data final da Sprint.
*   **Sprint Burnup:** Acompanha o total de escopo entregue acumulado contra o escopo total planejado, monitorando desvios de escopo (scope creep).
*   **Cycle Time Scatterplot:** Gráfico de dispersão que mostra o tempo necessário para que as tarefas finalizadas transitem de "início" a "fim". Crucial para prever a previsibilidade do time.
*   **Alocação de Esforço:** Gráfico que detalha onde as horas do time estão concentradas (por membro, história ou tipo de tarefa).
*   **Relatórios Executivos:** Consolidação estatística focada na produtividade geral do time para apresentação à gerência.

---

### ⚙️ 3.9. Settings (Configurações)
O centro de controle do administrador do Scrum Time. É dividido em 3 abas:

1.  **Usuários:**
    *   Exibe membros pendentes (que solicitaram acesso) e permite que Gestores/Gerentes os aprovem ou rejeitem.
    *   Permite cadastrar novos membros definindo Nome, E-mail corporativo, Senha provisória e Cargo.
    *   Permite exclusão permanente de usuários.
2.  **Projeto (Gestão de Sprints e Cargas):**
    *   Histórico e criação de novas Sprints com metas claras e datas limites.
    *   **Carga Horária do Time:** Configuração das horas de disponibilidade diária de cada desenvolvedor. O sistema recalcula automaticamente a capacidade total de foco (80%) da Sprint com base nestes números.
    *   **Backup & Sync:** Opção para forçar a sincronização de cache de dados local com o banco de dados PostgreSQL do Supabase.
3.  **Definição de Pronto (DoD):**
    *   Área para adicionar, editar ou remover itens do checklist de qualidade exigido na conclusão de tarefas do Kanban.
