# Phase 5: Indicadores & Detail Dialog - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Badges semanticos compartilhados (6 indicadores visuais) e dialog centrado substituindo o detail sheet lateral, com todas as secoes de dados da audiencia incluindo historico de alteracoes via timeline vertical. Badges sao construidos primeiro pois serao reutilizados nas views da Phase 6. Nenhuma mudanca no schema do banco de dados.

</domain>

<decisions>
## Implementation Decisions

### Dialog Container e Layout
- **D-01:** Criar novo componente `AudienciaDetailDialog` dedicado usando Dialog do shadcn/ui. NAO reusar DialogFormShell (que e voltado para forms). Layout: header fixo + body scrollavel + footer fixo.
- **D-02:** Secoes internas do dialog usam `GlassPanel depth-1` para consistencia com outros modulos (Processos, Expedientes). NAO criar estilo glass-card custom.
- **D-03:** Incluir 3 botoes de acao no header: "Entrar na Sala Virtual" (primario), "Visualizar Ata" (outline), "Abrir PJe" (outline). O botao "Abrir PJe" e novo — construir URL usando `idPje` + `trt` existentes no domain.
- **D-04:** Dialog max-width ~780px (max-w-3xl), max-height 92vh, com scrollbar estilizada. Fiel ao mock aprovado.

### Badges Indicadores
- **D-05:** Expandir o sistema `SemanticBadge` existente com nova categoria `audiencia_indicador` no design system (variants.ts/tokens.ts). Cada indicador e um valor da categoria. NAO criar componentes de badge standalone.
- **D-06:** Criar componente helper `AudienciaIndicadorBadges` que recebe uma audiencia e renderiza os badges aplicaveis. Prop `show` controla quais badges exibir (para diferentes contextos: dialog vs card vs row).
- **D-07:** Visibilidade segue requirements exatos:
  - INDIC-01 (segredo de justica): cards + rows + dialog
  - INDIC-02 (juizo digital): cards + rows + dialog
  - INDIC-03 (designada): cards + rows + dialog
  - INDIC-04 (documento ativo): apenas dialog
  - INDIC-05 (litisconsorcio): conforme requirements
  - INDIC-06 (presenca hibrida): conforme requirements
- **D-08:** Badge de presenca hibrida (INDIC-06): badge simples + tooltip em cards/rows; badge + texto explicito ("Advogado presencial . Cliente virtual") no dialog. Tooltip mostra quem e presencial e quem e virtual.

### Timeline de Historico
- **D-09:** Combinar duas fontes de dados para montar a timeline completa:
  1. `logs_alteracao` (tabela) — alteracoes manuais com diff (`{changes: {campo: {old, new}}}`) e usuario
  2. `dados_anteriores` (campo JSON) — snapshot do estado anterior a ultima atualizacao PJe (diff com estado atual)
  3. `created_at` da audiencia — entrada "Captura inicial"
- **D-10:** Timeline ordenada cronologicamente (mais recente primeiro). Entradas manuais mostram avatar do usuario; entradas automaticas (PJe) mostram icone de sistema.
- **D-11:** Mapeamento de labels legiveis para campos (`AUDIENCIA_FIELD_LABELS: Record<string, string>`) definido no `domain.ts`. Ex: `{ data_inicio: 'Data/Horario', responsavel_id: 'Responsavel', status: 'Status' }`.

### Transicao Sheet -> Dialog
- **D-12:** Substituicao big bang in-place: renomear `AudienciaDetailSheet` para `AudienciaDetailDialog`, trocar container de DetailSheet para Dialog, atualizar todos os 5 pontos de uso simultaneamente.
- **D-13:** Manter a mesma interface de props (`{ audienciaId?, audiencia?, open, onOpenChange }`). Integracao com `EditarAudienciaDialog` existente permanece inalterada.
- **D-14:** Arquivo renomeado de `audiencia-detail-sheet.tsx` para `audiencia-detail-dialog.tsx`.

### Claude's Discretion
- Abordagem de fetch para historico (useEffect paralelo vs action unificada) — Claude decide com base em performance e padroes do codebase
- URL pattern para "Abrir PJe" — Claude pesquisa formato correto
- Estrutura interna do componente de timeline (separar em subcomponentes ou inline)
- Logica de diff entre dados_anteriores e estado atual para entradas de sistema

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mocks Aprovados
- `.mocks/audiencias-detail-dialog.html` — Mock visual aprovado do dialog de detalhes (referencia definitiva para layout e secoes)
- `.mocks/audiencias-lista-view.html` — Referencia para posicionamento de badges em rows (Phase 6, mas informa design dos badges)

### Domain e Tipos
- `src/app/(authenticated)/audiencias/domain.ts` — Tipos Audiencia, enums, schemas Zod. Contem todos os campos relevantes (segredoJustica, juizoDigital, designada, documentoAtivo, presencaHibrida, dadosAnteriores, etc.)
- `src/app/(authenticated)/audiencias/domain.ts:132` — ALLOWED_UPDATE_FIELDS_CAPTURADA e isAudienciaCapturada() — whitelist PJE para edicao

### Componentes a Refatorar
- `src/app/(authenticated)/audiencias/components/audiencia-detail-sheet.tsx` — Componente atual (sera substituido pelo dialog)
- `src/app/(authenticated)/audiencias/components/prep-score.tsx` — PrepScore ring + checklist (reutilizar no dialog com showBreakdown=true)

### Design System
- `src/components/ui/semantic-badge.tsx` — SemanticBadge (expandir com categoria audiencia_indicador)
- `src/lib/design-system/variants.ts` — Mapeamento de categorias para variantes visuais
- `src/lib/design-system/tokens.ts` — Tokens de cores do design system
- `src/components/shared/glass-panel.tsx` — GlassPanel (depth 1/2/3) para secoes do dialog

### Componentes Shared
- `src/components/shared/detail-sheet.tsx` — DetailSheet e subcomponentes (DetailSheetSection, DetailSheetMetaGrid, etc.) — referencia de padroes, subcomponentes podem ser adaptados
- `src/components/shared/dialog-shell/dialog-form-shell.tsx` — DialogFormShell (NAO usar, mas consultar padroes)

### Dados de Historico
- `supabase/migrations/20260202180000_create_generic_audit_trigger.sql` — Trigger de auditoria que popula logs_alteracao com diff de campos
- `src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts` — Como dados_anteriores e populado (snapshot pre-update do PJe)
- `src/app/(authenticated)/captura/services/persistence/comparison.util.ts` — removerCamposControle() e compararObjetos()

### Pontos de Uso (Migracao)
- `src/app/(authenticated)/audiencias/audiencias-client.tsx`
- `src/app/(authenticated)/audiencias/components/audiencias-content.tsx`
- `src/app/(authenticated)/audiencias/components/audiencias-list-wrapper.tsx`
- `src/app/(authenticated)/audiencias/components/audiencias-table-wrapper.tsx`
- `src/app/(authenticated)/audiencias/components/index.ts`
- `src/app/(authenticated)/audiencias/index.ts`

### Requirements
- `.planning/REQUIREMENTS.md` — INDIC-01 a INDIC-06, DIALOG-01 a DIALOG-10

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **GlassPanel**: Container glass com depth 1/2/3. Usar depth-1 para secoes do dialog.
- **SemanticBadge**: Badge semantico com categorias. Expandir com `audiencia_indicador`.
- **PrepScore**: Ring SVG + checklist breakdown. Reutilizar com `showBreakdown={true}` e `size="lg"` no dialog.
- **AudienciaStatusBadge**: Badge de status que ja usa SemanticBadge internamente.
- **AudienciaModalidadeBadge**: Badge de modalidade que ja usa SemanticBadge.
- **ParteBadge**: Badge de polo (ATIVO/PASSIVO) usado no detail sheet atual.
- **DetailSheetMetaGrid/MetaItem**: Padroes de layout para meta strip — podem informar o design do meta strip do dialog.
- **Dialog (shadcn)**: Componente base do shadcn/ui para dialogs.

### Established Patterns
- **DetailSheet pattern**: Header + Content + Section + Footer. O dialog seguira padroes similares mas com container diferente.
- **Action fetch**: `actionBuscarAudienciaPorId` busca audiencia completa. Pattern de useEffect + cancelled flag para cleanup.
- **Responsive**: Detail sheet atual nao tem logica responsive especifica (e um Sheet). Dialog precisara ser responsivo (full-screen em mobile?).
- **PJE whitelist**: `isAudienciaCapturada()` + `ALLOWED_UPDATE_FIELDS_CAPTURADA` controla o que pode ser editado em audiencias capturadas.

### Integration Points
- `AudienciaDetailSheet` e referenciado em 5 arquivos — todos precisam ser atualizados na migracao.
- `EditarAudienciaDialog` e aberto de dentro do detail — manter integracao.
- `useUsuarios()` e usado para resolver nomes de responsaveis — manter no novo dialog.
- `logs_alteracao` (tabela Supabase) precisa de query no repository para buscar historico.

</code_context>

<specifics>
## Specific Ideas

- Mock HTML em `.mocks/audiencias-detail-dialog.html` e a referencia visual definitiva para o dialog
- Meta strip com 4 itens separados por dividers verticais: Horario, Modalidade, Tribunal, Responsavel
- Secao Processo com numero mono clicavel (link para o cockpit do processo), TRT/Grau, e polos com ParteBadge
- Indicador de litisconsorcio ("e outros") inline com o nome da parte, nao como badge separado
- Secao Preparo com ring SVG maior (84px no mock) e checklist completa com destaque visual para itens pendentes (fundo amber)
- Timeline com avatares circulares com iniciais para usuarios, icone CPU para sistema
- Footer com botoes Fechar (outline) e Editar Audiencia (primary com icone pencil)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-indicadores-detail-dialog*
*Context gathered: 2026-04-09*
