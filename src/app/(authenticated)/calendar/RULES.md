# Regras de Negocio - Calendar (Calendario Unificado)

## Contexto
Modulo de calendario unificado que agrega eventos de multiplas fontes do sistema (audiencias, expedientes, obrigacoes, pericias, agenda) em uma interface consolidada. Nao possui tabela propria -- atua como camada de agregacao sobre os dados de outros modulos. Inclui uma view de Briefing diario/semanal.

## Entidades Principais
- **UnifiedCalendarEvent**: Evento unificado com `id`, `title`, `startAt`, `endAt`, `allDay`, `source`, `sourceEntityId`, `url`, `responsavelId`, `color`, `metadata`

## Enums e Tipos
- **CalendarSource**: `"audiencias" | "expedientes" | "obrigacoes" | "pericias" | "agenda"`
- IDs unificados no formato `{source}:{sourceEntityId}` (ex: `audiencias:123`)

## Regras de Validacao
- `startAt` e `endAt`: obrigatorios (ISO string), intervalo valido
- `sources`: array opcional de `CalendarSource` para filtrar quais fontes exibir
- `id` e `title`: obrigatorios, minimo 1 caractere

## Regras de Negocio
- Busca todas as fontes em paralelo (`Promise.all`) para performance
- Se `sources` nao for informado, busca todas as 5 fontes por padrao
- Normaliza datas para full-day bounds (`startOfDay` / `endOfDay`) via `date-fns`
- Paginacao interna: audiencias, expedientes e pericias percorrem ate 10 paginas (100 registros/pagina)
- Obrigacoes busca ate 1000 registros por chamada
- Resultado final ordenado por `startAt` ascendente
- Cores derivadas do status da entidade de origem:
  - Audiencias: `sky` (marcada), `emerald` (finalizada), `rose` (demais)
  - Expedientes: `rose` (prazo vencido), `amber` (demais)
  - Obrigacoes: `rose` (atrasada/vencida), `emerald` (recebida/paga), `amber` (demais)
  - Pericias: `emerald` (finalizada/laudo juntado), `rose` (cancelada/redesignada), `violet` (demais)
  - Agenda: cor definida pelo usuario

## Fluxos Especiais
- **Correcao de timezone**: Eventos all-day usam `toAllDayISOString()` que aplica offset de Sao Paulo (UTC-3 fixo) e retorna horario meio-dia UTC para evitar mudanca de dia em diferentes fusos
- **Briefing**: Action `actionListarBriefingData` retorna eventos da semana + resumo do dia + pulse semanal
- **Metadata enriquecido**: Cada fonte inclui metadados especificos (ex: `processoId`, `trt`, `grau`, `status`, `prepStatus` para audiencias)

## Filtros Disponiveis
- `startAt`: data inicio do periodo (obrigatorio)
- `endAt`: data fim do periodo (obrigatorio)
- `sources`: array de fontes a incluir (opcional)

## Restricoes de Acesso
- Todas as actions usam `authenticatedAction`
- Nao ha filtro por responsavel no calendario (exibe todos os eventos do escritorio)

## Integracoes
- `@/app/(authenticated)/audiencias` (service + tipos)
- `@/app/(authenticated)/expedientes` (service + tipos)
- `@/app/(authenticated)/obrigacoes` (service + tipos)
- `@/app/(authenticated)/pericias` (service + tipos)
- `@/app/(authenticated)/agenda` (repository direto + tipos)

## Revalidacao de Cache
- Nenhuma revalidatePath configurada (opera via client-side fetch)
