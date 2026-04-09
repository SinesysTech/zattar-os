# Phase 5: Indicadores & Detail Dialog - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 05-indicadores-detail-dialog
**Areas discussed:** Dialog: Container e Layout, Badges Indicadores, Timeline de Historico, Transicao Sheet->Dialog

---

## Dialog: Container e Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Novo AudienciaDetailDialog | Componente dedicado usando Dialog do shadcn/ui, com layout custom (header fixo + scroll + footer). Reutiliza sub-componentes do DetailSheet adaptados. | ✓ |
| Adaptar DialogFormShell | Estender DialogFormShell existente com modo "detail" (read-only). | |
| Voce decide | Claude escolhe a melhor abordagem. | |

**User's choice:** Novo AudienciaDetailDialog
**Notes:** Componente dedicado para maxima fidelidade ao mock.

---

| Option | Description | Selected |
|--------|-------------|----------|
| GlassPanel depth-1 | Reutilizar GlassPanel existente com depth-1. Mantem consistencia com outros modulos. | ✓ |
| Estilo glass-card custom | Classe utilitaria especifica para secoes de dialog. Fiel ao mock. | |
| Voce decide | Claude avalia qual se aproxima mais do mock. | |

**User's choice:** GlassPanel depth-1
**Notes:** Consistencia com outros modulos prevalece.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Incluir Abrir PJe (Recomendado) | Link direto ao PJe usando dados existentes (idPje + trt). Ja esta no mock aprovado. | ✓ |
| So Sala Virtual + Ata | Manter apenas os 2 botoes existentes. | |
| Voce decide | Claude decide com base na complexidade. | |

**User's choice:** Incluir Abrir PJe
**Notes:** Segue o mock aprovado.

---

## Badges Indicadores

| Option | Description | Selected |
|--------|-------------|----------|
| Expandir SemanticBadge (Recomendado) | Adicionar nova categoria 'audiencia_indicador' ao design system. Helper AudienciaIndicadorBadges renderiza os badges aplicaveis. | ✓ |
| Componente dedicado | AudienciaIndicadorBadge standalone com logica propria. Nao toca no design system. | |
| Voce decide | Claude escolhe para reutilizacao na Phase 6. | |

**User's choice:** Expandir SemanticBadge
**Notes:** Mantem padrao centralizado do design system.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Seguir requirements exato | INDIC-01/02/03 em cards + rows + dialog. INDIC-04 apenas dialog. | ✓ |
| Maximo 2 em cards | Cards mostram max 2 badges prioritarios. Rows podem mostrar mais. | |
| Voce decide | Claude define visibilidade por contexto. | |

**User's choice:** Seguir requirements exato
**Notes:** Fidelidade aos requirements definidos.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Badge simples + tooltip | Em cards/rows: badge 'Hibrida' compacto. Tooltip no hover mostra detalhes. No dialog: badge + texto explicito. | ✓ |
| Badge com texto inline | Mesmo em cards/rows mostra texto abreviado ao lado do badge. | |
| Voce decide | Claude define com base no espaco. | |

**User's choice:** Badge simples + tooltip
**Notes:** Informacao detalhada no tooltip, visual limpo em espacos compactos.

---

## Timeline de Historico

| Option | Description | Selected |
|--------|-------------|----------|
| Combinar ambas fontes (Recomendado) | Buscar logs_alteracao + diff dados_anteriores. Timeline cronologica completa. | ✓ |
| So dados_anteriores (simplificado) | Apenas diff entre snapshot e estado atual. Limitado a 1-2 entradas. | |
| So logs_alteracao | Apenas tabela de logs. Cobre manuais mas nao PJe. | |

**User's choice:** Combinar ambas fontes
**Notes:** Timeline completa atendendo ao mock.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Mapeamento no domain.ts | FIELD_LABELS: Record<string, string> no domain.ts. Centralizado e reutilizavel. | ✓ |
| Inline no componente | Mapeamento direto no componente de timeline. | |
| Voce decide | Claude escolhe onde colocar. | |

**User's choice:** Mapeamento no domain.ts
**Notes:** Centralizado no domain para reutilizacao.

---

## Transicao Sheet -> Dialog

| Option | Description | Selected |
|--------|-------------|----------|
| Substituir in-place (Recomendado) | Renomear componente, trocar container, atualizar todos os pontos de uso. Big bang. | ✓ |
| Criar novo, deprecar antigo | Criar novo ao lado do sheet. Migrar gradualmente. | |
| Voce decide | Claude escolhe com base no risco. | |

**User's choice:** Substituir in-place
**Notes:** Big bang como feito na Phase 1 do chat.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch paralelo no componente | Dois useEffect paralelos para audiencia e logs. | |
| Action unificada nova | actionBuscarAudienciaComHistorico retorna tudo numa chamada. | |
| Voce decide | Claude decide o approach. | ✓ |

**User's choice:** Voce decide
**Notes:** Claude tem discricionariedade para escolher a melhor abordagem de fetch.

---

## Claude's Discretion

- Abordagem de fetch para historico (paralelo vs action unificada)
- URL pattern para "Abrir PJe"
- Estrutura interna do componente de timeline
- Logica de diff entre dados_anteriores e estado atual

## Deferred Ideas

None — discussion stayed within phase scope
