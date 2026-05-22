# Sincronização GitHub <-> Supabase via Edge Functions

Para rodar essa sincronização diretamente no Supabase (sem depender de uma máquina local ligada), utilizaremos **Supabase Edge Functions** e **Supabase Cron (pg_net)**.

## 1. Estrutura da Edge Function

Criaremos uma função em Deno (padrão Supabase) que fará o papel do nosso worker.

**Local sugerido:** `supabase/functions/sync-github/index.ts`

### Lógica da Função:
1.  **Auth**: Usa a `SUPABASE_SERVICE_ROLE_KEY` para ter permissão de bypass RLS.
2.  **GitHub API**: Faz as mesmas chamadas GraphQL que o nosso script local.
3.  **Database**: Faz os `upserts` nas tabelas `projects` e `users`.

## 2. Configuração de Variáveis de Ambiente no Supabase

Você precisará rodar via CLI ou no Dashboard:
```bash
supabase secrets set GITHUB_TOKEN=seu_token_aqui
supabase secrets set GITHUB_ORG=redesaoroquegroup
```

## 3. Agendamento (Cron)

Como o Supabase não tem um "loop" infinito de 1 hora em Edge Functions, usamos a extensão `pg_net` para chamar a função via HTTP a cada hora.

**SQL para rodar no Supabase SQL Editor:**
```sql
select cron.schedule(
    'sync-github-every-hour', -- nome da tarefa
    '0 * * * *',              -- a cada hora (minuto 0)
    $$
    select net.http_post(
        url := 'https://your-project-ref.functions.supabase.co/sync-github',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
    $$
);
```

---

## Próximo Passo:
Vou gerar o código da Edge Function adaptado para o ambiente Deno do Supabase. Posso prosseguir com a criação do arquivo `.ts`?
