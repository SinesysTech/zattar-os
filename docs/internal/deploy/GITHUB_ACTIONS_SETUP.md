# GitHub Actions: VACUUM Maintenance Workflow

## Visão Geral

Workflow automatizado para executar diagnóstico de VACUUM semanalmente via GitHub Actions.

- **Arquivo**: `.github/workflows/vacuum-maintenance.yml`
- **Schedule**: Todo domingo às 3h UTC
- **Execução Manual**: Disponível em GitHub Actions UI

---

## Configuração dos Secrets

### Pré-requisitos

- Repository com acesso a Settings
- Role: Owner ou Admin
- CRON_SECRET gerado (deve ser aleatório e seguro)

### Passos para Configurar

1. **Acessar Secrets do GitHub**
   ```
   https://github.com/SinesysTech/zattar-os/settings/secrets/actions
   ```

2. **Criar Secret: APP_URL**
   - Clicar em "New repository secret"
   - Name: `APP_URL`
   - Value: `https://seu-dominio.com` (ex: https://app.zattar.com.br)
   - Salvar

3. **Criar Secret: CRON_SECRET**
   - Clicar em "New repository secret"
   - Name: `CRON_SECRET`
   - Value: Gerar token seguro (ex: `openssl rand -hex 32`)
   - Salvar

### Importante ⚠️

O `CRON_SECRET` usado no GitHub Actions **DEVE SER IDÊNTICO** ao `CRON_SECRET` configurado em:
- `.env.production`
- `vercel.json` (se usando Vercel)
- Variáveis de ambiente da aplicação

---

## Uso

### Execução Automática

O workflow executa automaticamente todo domingo às 3h UTC.

Para ver resultados:
1. Ir para: `Actions` → `VACUUM Maintenance`
2. Selecionar a execução desejada
3. Expandir "Execute VACUUM Maintenance"

### Execução Manual

Para executar manualmente (útil para testes):

1. Ir para: `Actions` → `VACUUM Maintenance`
2. Clicar em "Run workflow"
3. Clicar em botão azul "Run workflow"
4. Acompanhar execução em tempo real

---

## Output Esperado

### Sucesso (HTTP 200)

```
Status: 200

{
  "success": true,
  "message": "Diagnóstico de bloat concluído",
  "duration_ms": 1234,
  "timestamp": "2026-01-12T03:00:00.000Z",
  "summary": {
    "total_tabelas": 9,
    "tabelas_com_bloat": 2,
    "tabelas_criticas": 0
  },
  "diagnostics": [...],
  "alertas": []
}
```

### Erro (HTTP 500)

```
Status: 500

{
  "success": false,
  "error": "Erro ao executar diagnóstico de bloat",
  "message": "...",
  "duration_ms": 456,
  "timestamp": "2026-01-12T03:00:00.000Z"
}
```

---

## Troubleshooting

### Erro: "No secrets available"

**Causa**: Secrets não foram configurados

**Solução**: Executar passos de "Configuração dos Secrets" acima

### Erro: "Unauthorized (401)"

**Causa**: CRON_SECRET inválido ou não corresponde ao da aplicação

**Solução**: 
1. Verificar se `CRON_SECRET` foi copiado corretamente
2. Confirmar que é idêntico ao value em produção
3. Regenerar token se necessário

### Erro: "Connection timeout"

**Causa**: Aplicação indisponível ou URL inválida

**Solução**:
1. Verificar se `APP_URL` está correto
2. Confirmar que endpoint `/api/cron/vacuum-maintenance` está acessível
3. Verificar logs da aplicação

### Workflow não executa automaticamente

**Causa**: Schedule pode não estar ativo em repository vazio ou desabilitado

**Solução**:
1. Ir para: `Actions`
2. Verificar se "VACUUM Maintenance" aparece na lista
3. Se não aparece, fazer commit/push de uma mudança em `.github/workflows/`
4. Aguardar ~5 minutos para ativar

---

## Monitoramento e Alertas

### Logs

Todos os logs da execução aparecem em:
```
Actions → VACUUM Maintenance → [Clique na execução] → Execute VACUUM Maintenance
```

### Notificações

- ✅ **Sucesso**: Nenhuma notificação (silencioso por default)
- ❌ **Falha**: Comentário automático em issues (se no contexto de PR)

Para adicionar notificações via email/Slack, editar workflow adicionando steps:

```yaml
- name: Send Slack notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ VACUUM Maintenance falhou"
      }
```

---

## Alternativas de Orchestration

Se não quiser usar GitHub Actions, considere:

### Opção 1: Supabase pg_cron (Recomendado)

Usar pg_cron do Supabase para executar cron jobs direto do Postgres:

```sql
-- 1. Salvar secrets no Vault
SELECT vault.create_secret('https://zattaradvogados.com', 'app_url');
SELECT vault.create_secret('seu_cron_secret', 'cron_secret');

-- 2. Criar cron job (executa todo domingo às 3h UTC)
SELECT cron.schedule(
  'vacuum-maintenance',
  '0 3 * * 0',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'app_url')
             || '/api/cron/vacuum-maintenance',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    );
  $$
);

-- Ver jobs: SELECT * FROM cron.job;
-- Ver execuções: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
```

### Opção 2: Vercel Cron

Adicionar ao `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/vacuum-maintenance",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

---

## Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Cron Syntax](https://crontab.guru/)

---

**Última atualização**: 2026-01-09
**Status**: ✅ Implementado
