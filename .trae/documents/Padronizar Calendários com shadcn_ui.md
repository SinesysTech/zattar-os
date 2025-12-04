## Contexto e Levantamento

* O projeto já possui `Calendar` oficial (shadcn) em `components/ui/calendar.tsx`, baseado em `react-day-picker`.

* Há wrappers oficiais não utilizados: `components/ui/date-picker.tsx` e `components/ui/date-range-picker.tsx`.

* Existem muitos exemplos/demos `components/calendar-02.tsx` … `calendar-32.tsx` sem uso externo.

* Uso real de calendário fora dos wrappers oficiais:

  * `comunica-cnj/frontend/components/search-form.tsx` usa um `DateRangePicker` local (`comunica-cnj/frontend/components/date-range-picker.tsx`) que por baixo utiliza `ui/calendar`.

  * `app/(dashboard)/audiencias/components/audiencias-visualizacao-mes.tsx` e `.../audiencias-visualizacao-ano.tsx` constroem calendários customizados via grid, sem `ui/calendar`.

## Decisão de Variações (por contexto)

* Seleção de data única (inputs/formulários): usar `ui/date-picker` com `Calendar mode="single"`.

* Seleção de intervalo (filtros): usar `ui/date-range-picker` com `Calendar mode="range"` e `locale=ptBR` quando necessário.

* Calendário inline/popover: usar `ui/calendar` diretamente com `captionLayout` adequado, `showOutsideDays` conforme contexto, `initialFocus` em popovers.

* Visualizações de calendário (mês/ano) com marcação de eventos: usar `ui/calendar` com `month`/`numberOfMonths`, `modifiers` para destacar dias com audiências e `onDayClick` para abrir diálogos.

## Plano de Substituição (arquivos e mudanças)

* `comunica-cnj/frontend/components/search-form.tsx`

  * Substituir import do `DateRangePicker` local por `@/components/ui/date-range-picker`.

  * Adaptar props: passar `value` como `{ from?: Date; to?: Date }` e consumir `onChange(range)` para atualizar `dataInicio`/`dataFim` (strings `YYYY-MM-DD`).

  * Manter rótulos e layout; aplicar `locale=ptBR` via `Calendar` se necessário.

* `comunica-cnj/frontend/components/date-range-picker.tsx`

  * Remover após migração ou transformar em wrapper leve que delega para `ui/date-range-picker` para compatibilidade.

* `app/(dashboard)/audiencias/components/audiencias-visualizacao-mes.tsx`

  * Refatorar para usar `ui/calendar` inline (`mode="single"`).

  * Definir `modifiers={{ hasAud: (date) => existe audiência no dia }}`; opcionalmente `modifiersClassNames` para estilizar.

  * Usar `onDayClick`/`onSelect` para abrir `AudienciaDetalhesDialog` e mostrar lista completa do dia.

  * Ajustar cabeçalho de semana via `weekdayFormat`/`formatters` do `Calendar` quando preciso.

* `app/(dashboard)/audiencias/components/audiencias-visualizacao-ano.tsx`

  * Renderizar grade de 12 `Calendar` (um por mês) com `showOutsideDays={false}`, `captionLayout="label"` e célula compacta via `--cell-size`.

  * Aplicar `modifiers` para marcar dias com audiência; `onDayClick` para abrir diálogo com todas do dia.

* `components/ui/date-picker.tsx` e `components/ui/date-range-picker.tsx`

  * Padronizar uso em todo o app para entradas de data/intervalo; substituir quaisquer pickers manuais equivalentes.

* `components/calendar-*.tsx`

  * Após migração, remover ou arquivar exemplos não utilizados.

## Considerações Técnicas

* Locale/format: usar `date-fns/locale ptBR` nos contextos que exibem datas formatadas; manter padrão visual do app.

* Acessibilidade: manter `initialFocus` e navegação por teclado do `DayPicker`.

* Estado/controlado: manter controle externo onde necessário; sincronizar com `react-hook-form`.

* Performance: usar `modifiers` e memoização para marcação de dias com audiência.

## Testes e Validação

* Fluxos do `search-form`: seleção de intervalo atualiza `dataInicio`/`dataFim` corretamente.

* Visualizações mês/ano: marcar corretamente dias com audiência, abrir diálogos e exibir PDFs.

* Regressão visual: checar tema claro/escuro e `captionLayout`.

## Passos de Execução

1. Migrar `search-form` para

