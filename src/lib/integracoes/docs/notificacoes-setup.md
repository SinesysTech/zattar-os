# Configuração do Sistema de Notificações

## ✅ Implementação Completa

O sistema de notificações está **100% implementado** e funcional. Todas as migrations foram aplicadas ao banco de dados.

## 📋 Funcionalidades Implementadas

### 1. Notificações Automáticas
- ✅ Processos atribuídos
- ✅ Movimentações em processos atribuídos
- ✅ Audiências atribuídas
- ✅ Alterações em audiências atribuídas
- ✅ Expedientes atribuídos
- ✅ Alterações em expedientes atribuídos
- ✅ Prazos vencendo (via função agendada)
- ✅ Prazos vencidos (via função agendada)

### 2. Interface do Usuário
- ✅ Componente de notificações no header
- ✅ Contador de notificações não lidas
- ✅ Página de listagem completa (`/notificacoes`)
- ✅ Filtros por tipo e status (lida/não lida)
- ✅ Paginação
- ✅ Marcar como lida individual ou em massa
- ✅ Links para entidades relacionadas

### 3. Realtime
- ✅ Notificações em tempo real via Supabase Realtime
- ✅ Broadcast automático quando notificações são criadas
- ✅ RLS policies configuradas para segurança

## 🔧 Configuração do Cron Job para Prazos

A função `verificar_e_notificar_prazos()` verifica expedientes com prazos próximos ou vencidos e cria notificações automaticamente.

### Opção 1: Vercel Cron (Recomendado)

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/verificar-prazos",
      "schedule": "0 * * * *"
    }
  ]
}
```

E configure a variável de ambiente:
```bash
CRON_SECRET=seu-secret-token-aqui
```

### Opção 2: GitHub Actions

Crie `.github/workflows/verificar-prazos.yml`:

```yaml
name: Verificar Prazos
on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
  workflow_dispatch:  # Permite execução manual

jobs:
  verificar-prazos:
    runs-on: ubuntu-latest
    steps:
      - name: Verificar Prazos
        run: |
          curl -X POST https://seu-dominio.com/api/cron/verificar-prazos \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Opção 3: pg_cron (Supabase)

Se o Supabase tiver `pg_cron` habilitado:

```sql
SELECT cron.schedule(
  'verificar-prazos-expedientes',
  '0 * * * *', -- A cada hora
  $$SELECT public.verificar_e_notificar_prazos()$$
);
```

### Teste Manual

Para testar a função manualmente:

```bash
curl -X POST http://localhost:3000/api/cron/verificar-prazos \
  -H "Authorization: Bearer seu-secret-token"
```

## 📊 Estrutura do Banco de Dados

### Tabela: `notificacoes`
- Armazena todas as notificações dos usuários
- RLS habilitado (usuários só veem suas próprias notificações)
- Índices otimizados para performance

### Funções PostgreSQL
- `criar_notificacao()` - Cria notificação e faz broadcast via Realtime
- `verificar_e_notificar_prazos()` - Verifica prazos e cria notificações
- Triggers automáticos em `acervo`, `audiencias`, `expedientes`

## 🧪 Testes

Testes unitários criados em:
- `src/features/notificacoes/__tests__/unit/notificacoes.service.test.ts`
- `src/features/notificacoes/__tests__/actions/notificacoes-actions.test.ts`

Execute com:
```bash
npm test src/features/notificacoes
```

## 📝 Próximos Passos (Opcional)

1. **Configurar cron job** para verificação de prazos (ver seção acima)
2. **Adicionar notificações por email** (futuro)
3. **Adicionar notificações push** (futuro)
4. **Dashboard de métricas** de notificações (futuro)

## ✅ Status Final

- **Database Schema**: ✅ Completo
- **Database Triggers**: ✅ Completo (exceto job agendado que requer configuração externa)
- **Feature FSD**: ✅ Completo
- **Componentes UI**: ✅ Completo
- **Realtime**: ✅ Completo
- **Página de Listagem**: ✅ Completo
- **Testes**: ✅ Básicos criados
- **Cron Job**: ⚠️ Requer configuração manual (função e API route prontos)

