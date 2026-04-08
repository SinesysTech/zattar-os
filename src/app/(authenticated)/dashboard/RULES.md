# Regras de Negócio - Dashboard

## Contexto
Módulo de painel consolidado do ZattarOS. Agrega métricas de todos os módulos principais (processos, audiências, expedientes, financeiro, contratos) em duas visões: **Dashboard Usuário** (dados pessoais filtrados por responsável) e **Dashboard Admin** (visão global do escritório). Integra-se com o sistema de permissões para exibir apenas dados autorizados.

## Entidades Principais
- **DashboardUsuarioData**: Visão consolidada para usuário comum — processos, audiências, expedientes, produtividade, financeiro, contratos, lembretes
- **DashboardAdminData**: Visão consolidada para administrador — métricas do escritório, carga de usuários, status de capturas, performance de advogados
- **Lembrete**: Registro de lembrete pessoal com prioridade, categoria e data
- **AudienciaProxima**: Audiência futura para exibição na lista do dashboard
- **ExpedienteUrgente**: Expediente com prazo próximo ou vencido

## Enums e Tipos

### Roles de Dashboard
- `user`: Dashboard de usuário (dados pessoais)
- `admin`: Dashboard de administrador (dados globais)

### Prioridade de Lembrete
- `low`: Baixa
- `medium`: Média
- `high`: Alta

### Categorias de Lembrete
- Reunião, Educação em Design, Suporte ao Cliente, Pessoal, Trabalho, Processos, Audiências, Expedientes, Outros

### Períodos de Consulta
- `7dias`: Últimos 7 dias
- `30dias`: Últimos 30 dias
- `90dias`: Últimos 90 dias

### Status de Captura
- `sucesso`: Captura concluída com sucesso
- `erro`: Captura falhou
- `pendente`: Aguardando execução
- `executando`: Captura em andamento

## Regras de Validação

### Lembretes
- `texto`: Obrigatório, 1–500 caracteres
- `prioridade`: Deve ser `low`, `medium` ou `high`
- `categoria`: Obrigatório, 1–100 caracteres
- `data_lembrete`: Formato ISO 8601 válido

### Parâmetros de Dashboard
- `usuarioId`: Inteiro positivo (opcional)
- `periodo`: Um dos valores `7dias`, `30dias`, `90dias` (opcional)
- `trt`: Código do tribunal (opcional)

## Regras de Negócio

### Dashboard de Usuário
1. Verificar permissões do usuário para cada módulo (processos, audiências, expedientes, financeiro, contratos)
2. Buscar dados **apenas** dos módulos permitidos — módulos sem permissão retornam valores zerados
3. Todas as queries são filtradas por `usuarioId` (dados pessoais)
4. Dados são buscados em paralelo via `Promise.all` para performance
5. Métricas detalhadas (porStatus, porModalidade, aging) são mescladas nos resumos após busca

### Dashboard de Admin
1. Visão global sem filtro de usuário
2. Acesso requer `is_super_admin = true`
3. Inclui métricas adicionais: carga de usuários, status de capturas PJE, performance de advogados
4. Dados financeiros e contratos são sempre incluídos
5. Todas as queries executadas em paralelo (13 promises simultâneas)

### Lembretes
1. Cada lembrete pertence a um único usuário
2. Podem ser marcados como concluídos ou reabertos
3. Suportam filtragem por status de conclusão
4. Limite máximo de 100 por listagem

### Verificação de Acesso
1. Dashboard pessoal: qualquer usuário autenticado
2. Dashboard de outro usuário: apenas admin
3. Dashboard admin: apenas `is_super_admin`

## Cache

### TTL por Tipo
- Dashboard de usuário: 300s (5 min)
- Dashboard admin: 600s (10 min)
- Métricas do escritório: 600s (10 min)
- Status de capturas: 120s (2 min — mais volátil)

### Estratégia
- `unstable_cache` do Next.js com tags para invalidação on-demand
- Cache key inclui `usuarioId` para dados personalizados
- Tags: `dashboard`, `dashboard-admin`

## Integrações
- **Processos**: Resumo (total, ativos, arquivados, porGrau, porTRT, aging, tendência)
- **Audiências**: Resumo (total, hoje, amanhã, próximos 7/30 dias, porModalidade, heatmap)
- **Expedientes**: Resumo (total, vencidos, porTipo, porOrigem, prazo médio)
- **Financeiro**: Saldo total, contas a pagar/receber, aging, DRE comparativo, fluxo de caixa
- **Contratos**: Status, tipos, obrigações, parcelas, repasses, score contratual
- **Permissões**: `checkPermission` via `@/lib/auth/authorization`
- **Supabase Auth**: Identificação do usuário logado

## Revalidação de Cache
Após mutações, revalidar:
- `/dashboard` — Dashboard principal
- Tags `dashboard`, `dashboard-admin` — Invalidação por tag
