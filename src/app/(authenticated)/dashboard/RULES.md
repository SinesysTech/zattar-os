# Regras de Negocio - Dashboard

## Contexto
Painel principal do sistema com metricas consolidadas de todos os modulos. Exibe dados diferentes conforme o papel do usuario (admin vs usuario comum).

## Estrutura
- `domain.ts` — Tipos para resumos de processos, audiencias, expedientes, produtividade, financeiro e contratos
- `service.ts` — Orquestracao de dados de todos os modulos
- `widgets/` — Widgets visuais organizados por dominio: processos, audiencias, expedientes, financeiro, contratos, pessoal, shared
- `components/` — Dashboard unificada, chat, lembretes, tarefas, widget picker
- `v2/` — Client component para renderizacao da dashboard

## Regras Principais
- **Duas visoes por papel**: `DashboardUsuarioData` (role=user) e `DashboardAdminData` (role=admin), discriminadas via `role`
- **Server-side prefetch**: Dados sao buscados no Server Component e passados como `initialData` para evitar waterfall client-side
- **Cache com TTL diferenciado**: usuario=5min, admin/metricas=10min, capturas=2min (mais volatil)
- **Widgets por dominio**: Cada pasta em `widgets/` corresponde a um modulo do sistema (processos, audiencias, expedientes, financeiro, contratos, pessoal)
- **Lembretes**: CRUD completo com prioridade (low/medium/high), categoria e data. Validacao via Zod
- **Admin extras**: Metricas do escritorio, carga por usuario, status de capturas, performance de advogados
- **Periodos de consulta**: Suporta filtro por 7dias, 30dias, 90dias
- **Type guards**: `isDashboardAdmin()` e `isDashboardUsuario()` para narrowing seguro do tipo uniao
