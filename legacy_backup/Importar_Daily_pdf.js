import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ==========================================
// CONFIGURAÇÕES DO SUPABASE
// ==========================================
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

/**
 * Script Principal de Importação de Daily via PDF
 * Foco: Extrair dados da pasta Documentos e sincronizar com o banco.
 * Suporta múltiplos arquivos e datas.
 */
async function importarDaily() {
    const folderPath = 'C:/Users/SR APOIO/OneDrive/Documents/Projetos IA/Daily Scrum/Documentos';

    // Lista todos os PDFs na pasta
    const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));

    if (files.length === 0) {
        console.error('❌ Nenhum arquivo PDF encontrado na pasta Documentos.');
        return;
    }

    // Dados consolidados das extrações manuais/específicas
    const allReports = {
        "2026-03-02": [
            { name: 'Menezes', yesterday: ['Com a ajuda do Guilherme estive fazendo correções nos códigos da aplicação de gente e gestão'], today: ['Continuar os ajustes e finalizar e fazer o commit.'], blockers: 'Nenhum' },
            { name: 'Vinicius', yesterday: ['Inclui uma feature de atualização de campos do DDA relacionado ao combustível, auxiliei o Benincasa com uma View e alinhei algumas demandas do Br apoio.'], today: ['Vou trabalhar em features do Servidor de arquivos e aplicar a atualização de campos do DDA para Ipiranga e Raizen.'], blockers: 'Nenhum' },
            { name: 'David', yesterday: ['Auxiliei a Kenia com umas documentações do Ivan.', 'Corrigi algumas partes da visualização que estavam agrupando vendas e não mostrando separadas (diesel/arla)'], today: ['Verificar a implementação do alelo.'], blockers: 'Nenhum' },
            { name: 'Luis Gustavo', yesterday: ['Feedback sobre funções de gerar contas a pagar a partir do pedido de compra', 'Configurar migração dos dados para o DW america do sul para rodar no final de semana', 'Melhorias a partir dos feedbacks de gerar contas a pagar a partir de pedido de compra.', 'Reunião sobre portal do Cliente.'], today: ['Resolução de Erro no modulo de atendimento que não está recebendo mensagem', 'Migração do DW para america do SUL', 'Gerar contas a pagar a partir do pedido de compra.'], blockers: 'Nenhum' },
            { name: 'Gilbert', yesterday: ['Atuei na validação do valor padrão, sendo que subi a PR hoje. Hoje eu corrigi o warning do inject.', 'Jorge me pediu para abrir uma PR. Já subi essa PR.', 'Corrigi um erro no duplo click da edição de um registro pq ao clicar chama uma função que consulta uma classe na tabela de listagem mas nesse momento a tabela já não existe mais e estourava o erro. Já corrigi e subi a PR.'], today: ['Analisar as PRs do pessoal e aguardar alguma demanda.'], blockers: 'Nenhum' },
            { name: 'Lucas', yesterday: ['Configurar Gateway para atualizar com supabase.', 'Incluir base de dados pagamentos de parcelas de financiamentos.', 'Segunda Etapa DFC (Alinhamento com Jorge e Guilherme)', 'Desenvolver Pipeline CI-CD GitHub Actions'], today: ['Configurar Gateway para atualizar com supabase.', 'Incluir base de dados pagamentos de parcelas de financiamentos.', 'Segunda Etapa DFC (Alinhamento com Jorge)', 'Refatorar DRE (Jandson)', 'Pipeline CI-CD GitHub Actions.'], blockers: 'Nenhum' },
            { name: 'Germano', yesterday: ['Terminei os ajustes de monitoramento na infra da AWS. Fiquei dando suporte aos desenvolvedores.', 'Resolvi alguns problemas de permissão na execução do cron.'], today: ['Resolver problemas que aparecem após o Guilherme validar funcionalidades na AWS.', 'Continuar dando suporte.'], blockers: 'Nenhum' },
            { name: 'Luiz Benincasa', yesterday: ['Corrigi os bugs e subi para produção.', 'Comecei a refatorar a tela principal do atendimento, estava passando de 10 mil linhas e estava dificultando fazer manutenção na tela.', 'Tentei também registrar alguns templates no facebook, mas sem sucesso, estão marcando todos eles como marketing.'], today: ['Continuar a refatoração do sistema de atendimento para diminuir a quantidade de código no mesmo arquivo e reutilização de componentes.', 'Tentar novamente registrar os templates necessários para a iniciação da conversa.'], blockers: 'Nenhum' },
            { name: 'Guilherme', yesterday: ['1. Dei auxilio ao Menezes em relação ao Gente e Gestão.', '2. Fiz algumas integrações no frontend para auxilio do Benincasa', '4. Dei suporte aos usuários do br apoio'], today: ['1. Pretendo alinhar com o Jorge como vai ser feita a busca de documentos para realizar upload nas adquirentes', '2. Auxiliar o Menezes no Gente e Gestão.', '3. Verificar o ambiente que o Germano preparou com algumas functions lambdas.', '3. Suporte aos usuarios do br apoio.'], blockers: 'Nenhum' },
            { name: 'Dilamar', yesterday: ['Suporte aos Squads, analisar documentação da API da Empregare, finalizar emissão de recibos do DP.'], today: ['Suporte aos Squads;', 'Finalizar recibos do DP;', 'Trabalhar na API da Empregare.'], blockers: 'Nenhum' }
        ],
        "2026-03-03": [
            { name: 'Vinicius', yesterday: ['Trabalhei nas features do Servidor de Arquivos e correções das NFS da automação Vibra.'], today: ['Pretendo trabalhar nas importações do Br apoio'], blockers: 'Nenhum' },
            { name: 'Luis Gustavo', yesterday: ['Resolução de Erro no modulo de atendimento que não está recebendo mensagem', 'Migração do DW para america do SUL', 'Gerar contas a pagar a partir do pedido de compra.'], today: ['Migração do DW para america do SUL', 'Gerar contas a pagar a partir do pedido de compra.'], blockers: 'Nenhum' },
            { name: 'Lucas', yesterday: ['Configurar Gateway para atualizar com supabase.', 'Incluir base de dados pagamentos de parcelas de financiamentos.', 'Segunda Etapa DFC (Alinhamento com Jorge e Guilherme)', 'Desenvolver Pipeline CI-CD GitHub Actions'], today: ['Configurar Gateway para atualizar com supabase (Alinhamento com Jorge)', 'Incluir base de dados pagamentos de parcelas de financiamentos.', 'Segunda Etapa DFC (Alinhamento com Jorge)', 'Refatorar DRE (Jandson)', 'Pipeline CI-CD GitHub Actions.', 'Estudos sobre RAG e Langchan.', 'Ajuste no script de Cotacao.'], blockers: 'Nenhum' },
            { name: 'Gilbert', yesterday: ['Ontem aproveitei que estava sem tarefa e realizei testes nas prs que havia subido para verificar se estava quebrando em algum tipo de visualização.'], today: ['Estou a disposição para dúvidas, problemas que possam precisar e analisar prs.'], blockers: 'Nenhum' },
            { name: 'Menezes', yesterday: ['Ontem achei que tinha concluído a parte de gente e gestão e fui para a apresentação para usuário, foi apontado os pontos de ajustes.'], today: ['Realizar os ajustes solicitados e tentar entregar novamente já pronto para uso.'], blockers: 'Nenhum' },
            { name: 'Guilherme', yesterday: ['1. Dei auxilio ao Menezes em relação ao Gente e Gestão.', '2. Adaptei a função de sincronização de notas ficais do ticketlog e finalizei o script de upload de notas do Ticketlog.', '3. Testei o laboratório do Germano.', '4. Dei suporte aos usuários do br apoio (Lentidão, DDA travado ao sincronizar, Contas a Receber não sincroniza)'], today: ['1. Hoje vou fazer alguns testes no Ticketlog antes de subir para prod.', '3. Me reunir com Jorge para definir proximos passos da recolha e ou lentidão do br apoio.', '3. Suporte aos usuários do br apoio.'], blockers: 'Nenhum' },
            { name: 'Luiz Benincasa', yesterday: ['Continuei a refatoração do sistema de atendimento.', 'Registrei os templates necessários para a iniciação da conversa e para enviar orçamento.', 'Corrigi um erro em produção que deixou o sistema de atendimento fora do ar e comecei a analisar o motivo pelo qual ocorreu.'], today: ['Finalizar a refatoração com testes.', 'Implementar o fluxo ponta a ponta de envio de inicio de conversa.', 'Implementar o fluxo ponta a ponta de envio de cobrança.'], blockers: 'Nenhum' },
            { name: 'Dilamar', yesterday: ['Suporte aos Squads;', 'Reestruturação do banco de dados do projeto do DP;', 'Continuei implementando recibo automático pro DP;', 'Enviei pro Germano aplicar um ajuste no bucket de gestao-dp;', 'Teste de cadastro do módulo Gente e Gestão.'], today: ['Finalizei módulo de recibos automáticos do DP;', 'Testando importação das informações dos candidatos da Empregare.'], blockers: 'Nenhum' }
        ],
        "2026-03-04": [
            { name: 'Lucas', yesterday: ['Configurar Gateway para atualizar com supabase', 'Incluir base de dados pagamentos de parcelas de financiamentos', 'Segunda Etapa DFC (Alinhamento com Jorge e Guilherme)', 'Desenvolver Pipeline CI-CD GitHub Actions'], today: ['Configurar Gateway para atualizar com supabase (Alinhamento com Jorge)', 'Incluir base de dados pagamentos de parcelas de financiamentos', 'Segunda Etapa DFC (Alinhamento com Jorge)', 'Refatorar DRE (Jandson)', 'Pipeline CI-CD GitHub Actions', 'Estudos sobre RAG e Langchan', 'Ajuste no script de Cotacao'], blockers: 'Nenhum' },
            { name: 'David', yesterday: ['Implementei o PagBem.'], today: ['Verificar a implementação do CTF.'], blockers: 'Nenhum' },
            { name: 'Luis Gustavo', yesterday: ['Migração do DW para america do SUL', 'Finalizado o gerar contas a pagar a partir do pedido de compra'], today: ['Verificar com o Jorge a fila de tarefas possíveis correções na geração do contas a pagar pelo pedido de compra', 'Resolução de problema na cotação de compra raizen'], blockers: 'Nenhum' },
            { name: 'Gilbert', yesterday: ['Ontem fiquei sem atividades', 'No final do dia tivemos um problema na PR da validação do valor padrão que estava quebrando outros inputs e com isso fiz uma PR para desfazer as alterações'], today: ['Entender no cenário reportado o que aconteceu'], blockers: 'Nenhum' },
            { name: 'Vinicius', yesterday: ['Trabalhei numa POC relacionada ao Prefect para automações do Br apoio', 'Tive um impedimento com liberações no Banco para finalizar os testes'], today: ['Vou finalizar essa POC, testa-la', 'Estudar um pouco mais sobre a implementação do Prefect em produção', 'mexer em algumas funções pretendendo criar uma versão de uma função de importação em Go'], blockers: 'Nenhum' },
            { name: 'Guilherme', yesterday: ['1. Finalizei os testes de upload no Ticketlog, mas identifiquei que alguns registros estão na planilha de lançamentos mas nao estao no portal, vou entrar em contato com o suporte para resolver esta questão', '2. Dei auxilio ao Menezes em algumas questões no banco de dados', '3. Dei suporte aos usuários do br apoio'], today: ['1. Trabalhar junto com o Jorge para identificar o bug na planilha do ticketlog', '2. Suporte aos usuários do br apoio'], blockers: 'Nenhum' },
            { name: 'Menezes', yesterday: ['Resolvi mais alguns ajustes de gente e gestão em dev e estive, na parte da tarde, resolvendo alguns problemas na implementação de cartão de crédito em produção'], today: ['Terminei os ajustes de cartão crédito em produção', 'vou continuar a fazer a aplicação de engenharia no brapoio e levar o sistema de gente e gestão para produção'], blockers: 'Nenhum' },
            { name: 'Luiz Benincasa', yesterday: ['Finalizado a refatoração', 'Finalizado o envio de inicio de conversa por template', 'Tive a ajuda do Luis Gustavo para ajustar um endpoint de envio no WPP'], today: ['continuar os testes e impactos da abertura de conversa em Massa', 'Iniciar a implementação do flow de serviços/chamado'], blockers: 'Nenhum' },
            { name: 'Dilamar', yesterday: ['Finalizei recibos, testando importação das informações dos candidatos da Empregare', 'Suporte aos Squads'], today: ['Suporte aos Squads', 'Finalizar configuração para importar vagas e candidatos, ajuste final, suporte aos squads'], blockers: 'Nenhum' }
        ],
        "2026-03-05": [
            { name: 'Luis Gustavo', yesterday: ['Correção no sistema de cotação', 'Associar tipo de despesa no pedido de compra'], today: ['Correções na cotação', 'Associação de despesas'], blockers: 'Nenhum' },
            { name: 'Vinicius', yesterday: ['Automações Ipiranga/Raizen', 'Revisão de PRs'], today: ['Novas demandas com Jorge/Guilherme'], blockers: 'Nenhum' },
            { name: 'Guilherme', yesterday: ['Suporte Br Apoio', 'Auxílio ao Jorge'], today: ['Correção de bugs Pix Troco/DDA', 'Revisão PRs Vinicius'], blockers: 'Nenhum' },
            { name: 'Lucas', yesterday: ['Base de pagamentos', 'Etapa DFC'], today: ['Estudos RAG/Langchain', 'Ajuste Cotação'], blockers: 'Nenhum' },
            { name: 'Menezes', yesterday: ['HTMLs Ajuda Gente e Gestão'], today: ['Testes de telas em produção'], blockers: 'Nenhum' }
        ],
        "2026-03-06": [
            { name: "Guilherme", yesterday: ["Auxílio ao Jorge em alteração de preço base", "Revisão de PRs de database", "Suporte ao Br Apoio (CPA/CRE/Pix Troco)"], today: ["Correção de bugs no Pix Troco e DDA", "Revisão de PRs do Vinicius", "Alinhamento de recolha autônoma com Jorge"], blockers: "Nenhum" },
            { name: "Benincasa", yesterday: ["Configuração do Flow de atendimento", "Ajuste de endpoint com Luis Gustavo", "Resolução de problemas no Docker"], today: ["Finalizar fluxo de boas vindas com categorias de chamados", "Review de código para produção"], blockers: "Nenhum" },
            { name: "Gilbert", yesterday: ["Sem demanda"], today: ["Verificar erro de lista de valor reportado pelo Rangel"], blockers: "Nenhum" },
            { name: "Vinicius", yesterday: ["Alterações e reativação de cache no Br Apoio", "Mudança na trigger de invalidação"], today: ["Alinhamento de PRs pendentes", "Subida de atualização de dados dos DDAs da Raizen"], blockers: "Nenhum" },
            { name: "Germano", yesterday: ["Planejamento de migração de cloud", "Suporte à equipe e Nuage", "Debug de automações"], today: ["Continuidade do planejamento e suporte ao pessoal"], blockers: "Nenhum" },
            { name: "David", yesterday: ["Tratativa de bloqueio de IP no CTF", "Alinhamento com Jorge sobre serviço de reCAPTCHA"], today: ["Mapeamento do fluxo do CTF", "Foco na extração de dados do portal Sem Parar Empresas"], blockers: "Nenhum" },
            { name: "Lucas", yesterday: ["Base de pagamentos de parcelas", "2ª etapa do DFC", "Pipeline CI-CD via GitHub Actions"], today: ["Base de pagamentos", "Etapa DFC", "Refatoração de DRE", "Estudos de RAG e Langchain", "Ajuste no script de Cotação"], blockers: "Nenhum" },
            { name: "Luis Gustavo", yesterday: ["Correção no sistema de cotação", "Atividade de associar tipo de despesa no pedido de compra"], today: ["Continuidade das correções na cotação e associação de despesas no pedido de compra"], blockers: "Nenhum" },
            { name: "Menezes", yesterday: ["HTMLs de ajuda para 'Gente e Gestão'", "Alinhamento de PRs com Jorge", "Teste de telas em produção"], today: ["Continuidade dos testes de funcionalidades e agendamento de apresentação da aplicação"], blockers: "Nenhum" }
        ],
        "2026-03-09": [
            { pdfName: "David", yesterday: ["Contratado e implementado o serviço de reCAPTCHA no CTF.", "Apoio operacional ao setor comercial devido à instabilidade dos preços do barril."], today: ["Continuidade no suporte ao comercial.", "Caso a API do Jorge seja liberada, início do mapeamento do Truckpag."], blockers: "Dependência da entrega da API para avançar com o mapeamento do Truckpag." },
            { pdfName: "Luis Gustavo", yesterday: ["Correção no sistema de cotação", "Continuar atividade de associar tipo de despesa no pedido de compra", "Correções com o fluxo de cotação.", "Correção na coleta de cotações da Raizen"], today: ["Continuar atividade de associar tipo de despesa no pedido de compra", "Correções no fluxo de coletar cotações Raizen."], blockers: "Nenhum" },
            { pdfName: "Vinicius", yesterday: ["Revisei algumas prs e atualizei as automações Ipiranga e Raizen para Atualizar o DDA, após inserção dos anexos."], today: ["Vou alinhar com o Jorge e/ou o Guilherme novas demandas."], blockers: "Nenhum" },
            { pdfName: "Luiz Benincasa", yesterday: ["Tive alguns impedimentos no fluxo de mensagens de boas vindas.", "Reunião com o Jorge e equipe."], today: ["Corrigir os erros da mensagem de boas vindas para que o fluxo de inicio de atendimento ocorra 100%, esse é o ultimo ponto para subir a nova versão para produção.", "Criar os PR para publicar em produção."], blockers: "Nenhum" },
            { pdfName: "Gilbert", yesterday: ["Trabalhei em uns erros na lista valor que já haviam sido tratados mas se perderam em uns merges."], today: ["Seguir com essa correção."], blockers: "Nenhum" },
            { pdfName: "Menezes", yesterday: ["Testando as telas de gente e gestão e pela tarde nos tivemos uma discussion sobre o futuro do BrApoio."], today: ["Terminar de testar as telas de gente e gestão e me preparar para apresentar"], blockers: "Nenhum" },
            { pdfName: "Guilherme", yesterday: ["1. Dei auxilio ao Menezes em algumas questões no Gente e Gestão.", "2. Junto com o time alinhei algumas ideias com o Jorge, vamos migrar a parte de liquidar pagamento para o golang", "3. Dei suporte aos usuários do br apoio (Bug ao configurar titulo e erro ao liquidar pagamentos)."], today: ["1. Desenhar e alinhar com o Jorge a estrutura de liquidar pagamento", "2. Auxiliar o Menezes no gente e gestão", "3. Dar suporte no br apoio"], blockers: "Nenhum" },
            { pdfName: "Dilamar", yesterday: ["Iniciei resumo do treinamento do Lovable Day;", "Corrigi alguns erros de login na parte de recibos do DP;", "Iniciei estudo sobre ferramenta para gerenciar projetos do desenvolvimento."], today: ["Terminar relatório do treinamento;", "Estudar forma de gestão dos processos do desenvolvimento."], blockers: "Nenhum" }
        ],
        "2026-03-10": [
            { name: "Rangel", yesterday: ["Me atualizei das mudanças que foram feitas no repositório do frontend", "Alinhei com o Gilbert sobre as tasks que ele ficou responsável e fiz sugestões de correções e melhorias"], today: ["Auxiliar o Menezes e o Gilbert", "Organizar e priorizar as próximas tarefas a serem feitas"], blockers: "Nenhum" },
            { name: "Guilherme", yesterday: ["Auxílio ao Menezes no Gente e Gestão", "Review de PRs do Vinicius (cron jobs/cache)", "PR de correção de QR Code Pix", "Ajuste de nomenclatura no movimento de venda", "PR de upload de notas Rede Frota", "Suporte usuários BR Apoio"], today: ["Testes no upload de nota fiscal Rede Frota", "Resolver bug no dashboard", "Suporte BR Apoio"], blockers: "Nenhum" },
            { name: "Vinicius", yesterday: ["Trabalho no Débito Direto Autorizado (DDA) e escrita de testes para as aplicações"], today: ["Nova etapa da POC de agentes", "Atualizar e testar PR de caches (mudanças no Backend)"], blockers: "Nenhum" },
            { name: "Gilbert", yesterday: ["Ajuste da lista valor (não concluído, revertido pelo Rangel)", "Busca de branch anterior que resolvia o problema"], today: ["Seguir com ajuste da lista valor", "Nova abordagem para LocalStorage para evitar sobrecarga no sistema ao coletar árvores de usuário"], blockers: "Nenhum" },
            { name: "Luis Gustavo", yesterday: ["Correção no sistema de cotação", "Sincronização de templates/flows via API oficial do WPP", "Login nos painéis do Dash Server (TVs)", "Painel de acompanhamento de preços para diretoria"], today: ["Correção na coleta de cotações da Raizen", "Associar tipo de despesa no pedido de compra"], blockers: "Nenhum" },
            { name: "Menezes", yesterday: ["Finalização das telas de Gente e Gestão em produção", "Início das tabelas de detalhes de cartão de crédito"], today: ["Terminar as tabelas de detalhes de cartão de crédito"], blockers: "Nenhum" },
            { name: "David", yesterday: ["Suporte técnico e operacional às demandas da equipe comercial"], today: ["Continuidade no atendimento e resolution de chamados do setor comercial"], blockers: "Gargalo operacional devido à volatilidade diária no preço dos combustíveis (exige atualizações manuais constantes)" },
            { name: "Lucas", yesterday: ["Base de dados de parcelas de financiamentos", "Pipeline CI/CD GitHub Actions", "Dashboard Diretoria (preços)"], today: ["Finalizar DFC", "Refatorar DRE", "Pipeline CI/CD", "Estudos sobre RAG e Langchain", "Ajuste no script de cotação"], blockers: "Nenhum" },
            { name: "Luiz Benincasa", yesterday: ["Finalização do fluxo de boas-vindas no atendimento (API WPP)", "Ajuste de endpoints com Luis Gustavo", "Problemas de espaço em disco na máquina de trabalho"], today: ["Limpeza/ajuste de espaço na máquina", "Testes finais de atendimento", "Publicação em produção"], blockers: "Nenhum (problema de espaço em tratamento)" },
            { name: "Dilamar", yesterday: ["Relatório de treinamento", "Análise de ferramentas de gestão", "Importação de dados de projetos do GitHub"], today: ["Terminar compilado do treinamento", "Refinar telas e relatórios de controle de projetos", "Deslocamento para BSB"], blockers: "Nenhum" }
        ],
        "2026-03-11": [
            { name: "Vinicius", yesterday: ["Trabalhei Comecei a escrever uma nova POC para o sistema de agentes scraping, depois comecei a alinhar com o Jorge uma mudança na logica de request HTTP do Banco."], today: ["trabalhar nessa logica de Request HTTP no Backend."], blockers: "Nenhum" },
            { name: "Luis Gustavo", yesterday: ["Verificação de erros no sistema de paineis BRAPOIO. Monitorar aplicações e integração com o petros. Deploy e correções no dash Server para poder visualizar os paineis. Correção no wpp_manager para aceitar token de aplicação na sincronização de templates e flows."], today: ["criação das telas do front para associação de tipo despesa receita com o pedido de compra. criar PR com essa alteração no pedido de compra. revisão na tela de sugestão de compra e planejamento de estoque."], blockers: "Nenhum" },
            { name: "Lucas", yesterday: ["Incluir base de dados pagamentos de parcelas de financiamentos. Atualizar todos Paineis do BR APOIO. Desenvolver Pipeline CI-CD GitHub Actions. Dashboard Diretoria (acompanhamento de preco e Ivan)."], today: ["Refatorar DRE (Jandson). Pipeline CI-CD GitHub Actions. Estudos sobre RAG e Langchain. Ajuste no script de Cotacao."], blockers: "Nenhum" },
            { name: "Rangel", yesterday: ["Auxiliei o Menezes e o Luis com a resolução de pendencias no frontend. Revisão e deploy de PR's com correções que estavam pendentes para lista valor, custom_input e movimento de venda. Alinhei as próximas tarefas com o Jorge."], today: ["Ajustar a tabela de notificações para poder notificar usuários sem que seja necessário ligar a um registro. Analisar e ajustar o frontend para que o Vinicius consiga utilizar a parte de notificações o quanto antes."], blockers: "Nenhum" },
            { name: "David", yesterday: ["Suporte operacional às demandas da equipe comercial."], today: ["Continuidade no suporte ao setor comercial."], blockers: "Nenhum" },
            { name: "Gilbert", yesterday: ["Subi a PR para a correção na validação do valor padrão do input. Me reuni com Rangel para ver a branch da correção da lista valor que deu bo em produção. A partir dela eu fiz uns ajustes para trazer o título da lista no modo visualização, tbm subi a PR. Fiz alguns reviews."], today: ["Trabalhar no localstorage"], blockers: "Nenhum" },
            { name: "Guilherme", yesterday: ["1. Mandei um pr corrigindo um erro ao dar update/criar sennho no br apoio; 2. Mandei um pr corrigindo um erro ao entrar para visualizar os paineis; 3. Renovei algumas credenciais que estavam invalidas, impossibilitando consulta de pix recebidos; 4. Revisão de prs database e backend; 5. Dei suporte aos usuarios do br apoio (Falha ao consultar saldo no borderô de pagamento)."], today: ["1. Realizar alguns testes no upload de nota fiscal do rede frota; 2. Caso o Petros resolva voltar, vou testar o pr de upload de notas fiscais do rede frota; 3. Dar suporte no br apoio"], blockers: "Nenhum" },
            { name: "Luiz Benincasa", yesterday: ["Consegui liberar espaço na maquina mas preciso entender o porque de estar crescendo rápido o uso de espaço. Novas funcionalidades do Atende foram publicadas e com a ajuda do time foram feitos os PR e publicações em produção."], today: ["Verificar novamente o espaço da maquina. Acompanhar o sistema atualizado em produção vendo logs e buscando algum erro que possa ter passado desapercebido. Verificar opções para backup do whatsapp. Iniciar a analise do sistema de campanhas/marketing Registrar celular da Graciely e Matheus no sistema de atendimento."], blockers: "Nenhum" },
            { name: "Menezes", yesterday: ["estive trabalhando nas tabelas detalhes de cartão de credito e de tarde eu fiz as parte das funções de parcelamento e recorrência, pelo final do dia o Jorge revisou meu código e decidimos fazer os parcelamento de lançamento dentro das triggers."], today: ["Realizar os ajustes solicitados pelo Jorge e fazer essa migração das funções para as triggers."], blockers: "Nenhum" },
            { name: "Dilamar", yesterday: ["Terminar relatório do compilado das informações passadas no treinamento; Refinar telas e relatório do controle de projetos; suporte aos squads, Deslocamento de volta para BSB."], today: ["Suporte aos Squads; Teste das telas do gente e gestão; Melhorar lógica do sistema de controle de projetos."], blockers: "Nenhum" }
        ],
        "2026-03-12": [
            { name: "Vinicius", yesterday: ["Trabalhei no Worker que faz requisições HTTP"], today: ["Darei continuidade a aperfeiçoamento desse Worker"], blockers: "Nenhum" },
            { name: "Luis Gustavo", yesterday: ["criação das telas do front para associação de tipo despesa receita com o pedido de compra", "revisão na tela de sugestão de compra e planejamento de estoque", "Verificação de erro no WPP_manager para correção do fluxo de sincronização de flows e templates.", "Configuração de chaves do Petros para Obter Dados de estoque"], today: ["Novas configs de serviços que dependem de conexão com o petros ", "Revisão de codigo", "Auxilio ao lucas com WPP Manager"], blockers: "Nenhum" },
            { name: "Rangel", yesterday: ["Continuidade no suporte ao setor comercial."], today: ["Finalizar os ajustes de notificação no frontend e alinhar com o Vinicius a criação dos middlewares na api"], blockers: "Nenhum" },
            { name: "David", yesterday: ["Suporte operacional às demandas da equipe comercial."], today: ["Continuidade no suporte ao setor comercial."], blockers: "Nenhum" },
            { name: "Luiz Benincasa", yesterday: ["Acompanhei o sistema de atendimento após a publicação em produção e não tivemos nenhum erro, apenas anotei pontos de melhorias.", "Ajustei com a ajuda do Luis e Germano a ultima parte da publicação referente ao flow de inicio, faltava liberar uma view para o usuario do atende.", "Continuei procurando ferramentas para backup do whatsapp.", "Ajudei tambem o Lucas Alves a usar o sistema de atendimento para que ele consiga mapear e usar a api oficial do whatsapp."], today: ["Registrar celular da Graciely no sistema de atendimento.", "Conversar com o Jandson sobre o sistema de campanhas.", "Continuar a analise e modelagem do sistem de campanhas."], blockers: "Nenhum" },
            { name: "Dilamar", yesterday: ["Suporte aos Squads;", "Teste de telas do gente e gestão, Melhorar lógica do sistema de controle de projetos;", "Criar sincronização bidirecional dos dados entre Github e projeto daily."], today: ["Suporte aos Squads;", "Corrigir erro no login do projeto daily;", "Testar rota do plugnotas."], blockers: "Nenhum" }
        ],
        "2026-03-13": [
            { name: "Luiz Benincasa", yesterday: ["Não foi possivel registrar o celular da Graci, nao teve espaco no celular dela para fazer backup, compramos um cartao de memoria e vai chegar hoje.", "Fiz o cadastro no brapoio de tudo que sera necessario para registrar o celular da cobranca.", "Conversei e entendi com o Jandson sobre o sistema de campanha e alinhei com o jorge tambem.", "Comecei a fazer a parte de campanha na api oficial do whatsapp ( backend )"], today: ["Continuar a fazer o backend do wpp mananger para registrar e acompanhar templates de forma automatica pelo brapoio.", "Registrar o celular da Graciely."], blockers: "Nenhum" },
            { name: "Rangel", yesterday: ["Finalizei a parte do frontend que controla as notificações e compartilhei com o Guilherme."], today: ["Trabalhar na exibição de uma linha do tempo com o histórico de modificações do contas a pagar."], blockers: "Nenhum" },
            { name: "Luis Gustavo", yesterday: ["Auxilio nos Merges da branch de produção.", "Correção no acesso a maquina DEV"], today: ["seguir nos teste e validar com Rangel."], blockers: "Nenhum" },
            { name: "Gilbert", yesterday: ["Atuei na divisão do localstorage do login em modulo, arvore e programa para diminuir o tamanho."], today: ["seguir nos teste e validar com Rangel."], blockers: "Nenhum" },
            { name: "Menezes", yesterday: ["ontem eu tive um impedimento pela manhã e cheguei aqui pelas 9:20. Terminei as funções da aplicação de cartão de credito e pela parte da tarde o Jorge me demandou para fazer telas de algumas aplicações, ontem eu ja fiz algumas."], today: ["continuando a fazer as telas dessas aplicações, pretendo terminar hoje"], blockers: "Nenhum" },
            { name: "Guilherme", yesterday: ["Suporte aos Squads;", "Corrigir erro no login do projeto daily;", "Testar rota do plugnotas."], today: ["1. Pretendo trabalhar na parte de notificar o usuário sobre notify", "2. Dar continuidade na investigação de bugs no Contas a Receber", "3. Dar suporte no br apoio"], blockers: "Nenhum" },
            { name: "Dilamar", yesterday: ["Suporte aos Squads;", "Corrigir erro no login do projeto daily;", "Testar rota do plugnotas."], today: ["Terminar de importar notas do plugnotas;", "Ajustar login do projeto daily;", "suporte aos squads."], blockers: "Nenhum" }
        ]
    };


    // Pega todos os usuários uma só vez
    const { data: users } = await supabase.from('users').select('*');

    for (const targetFile of files) {
        const pdfPath = path.join(folderPath, targetFile);
        console.log(`\n📄 Processando relatório: ${targetFile}`);

        // Detecção de data via nome do arquivo (ex: Daily 2026-03-05.pdf)
        let dateStr = '';
        const dateMatch = targetFile.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) dateStr = dateMatch[0];

        if (!dateStr || !allReports[dateStr]) {
            console.warn(`⚠️ Data '${dateStr}' não mapeada ou não encontrada no nome do arquivo. Pulando.`);
            continue;
        }

        const reportData = allReports[dateStr];
        console.log(`� Data: ${dateStr} | ${reportData.length} registros`);

        for (const item of reportData) {
            const targetName = item.name || item.pdfName;
            let user = users.find(u => u.name.toLowerCase().includes(targetName.toLowerCase()));

            if (!user) {
                console.log(`👤 Criando novo usuário: ${targetName}`);
                const newUserId = `user_pdf_${targetName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
                user = {
                    id: newUserId,
                    name: targetName,
                    email: `${targetName.toLowerCase().replace(/\s+/g, '.')}@redesaoroque.com.br`,
                    role: 'Colaborador',
                    access: 'Colaborador',
                    password: '123mudar',
                    mustChangePassword: true
                };
                await supabase.from('users').insert([user]);
                users.push(user);
            }

            const dailyData = {
                userId: user.id,
                date: dateStr,
                yesterdayActivities: item.yesterday.map(t => ({ text: t, projectId: null })),
                todayActivities: item.today.map(t => ({ text: t, projectId: null })),
                blockers: item.blockers,
                createdAt: Date.now()
            };

            // Checa se já existe para este usuário nesta data
            const { data: existing } = await supabase
                .from('daily_entries')
                .select('id')
                .eq('userId', user.id)
                .eq('date', dateStr);

            if (existing && existing.length > 0) {
                const { error } = await supabase
                    .from('daily_entries')
                    .update(dailyData)
                    .eq('id', existing[0].id);
                if (error) console.error(`   ❌ Erro na Daily de ${user.name}:`, error.message);
                else console.log(`✅ Daily ATUALIZADA: ${user.name}`);
            } else {
                dailyData.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                const { error } = await supabase
                    .from('daily_entries')
                    .insert([dailyData]);
                if (error) console.error(`   ❌ Erro na Daily de ${user.name}:`, error.message);
                else console.log(`✨ Daily CRIADA: ${user.name}`);
            }
        }
    }

    console.log('\n🚀 Todas as importações finalizadas!');
    process.exit(0);
}

importarDaily();
