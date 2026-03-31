# Plano de Implementação: Assinatura Digital — Mock → Produção

## Visão Geral

Substituir a lista genérica por "Signature Command Center" com pipeline visual, progresso de assinantes, e inteligência de pendências.

**Total: 6 arquivos novos, 4 modificados.**

---

## O que já existe (reutilizável)

| Recurso | Arquivo |
|---------|---------|
| `actionListDocumentos(params)` | `feature/actions/documentos-actions.ts` |
| `actionGetDocumento(uuid)` | `feature/actions/documentos-actions.ts` |
| `actionCreateDocumento(input)` | `feature/actions/documentos-actions.ts` |
| `actionDeleteDocumento(uuid)` | `feature/actions/documentos-actions.ts` |
| `listDocumentos({ limit })` | `feature/services/documentos.service.ts` |
| `getDocumentoByUuid(uuid)` | `feature/services/documentos.service.ts` |
| Domain types completos | `feature/domain.ts`, `feature/types/types.ts` |
| Editor + public flow completos | `feature/components/editor/`, `feature/components/public/` |

## Componentes compartilhados reutilizados

| Componente | Uso |
|------------|-----|
| GlassPanel | Cards, pipeline, stats strip |
| TabPills | Filtro por status |
| SearchInput | Busca |
| ViewToggle | Cards / Lista (2 modos) |
| InsightBanner | Assinantes pendentes |
| ProgressRing | Progresso de assinatura por documento |
| AnimatedNumber | Totais animados |
| Sparkline | Tendência 6 meses |

---

## Implementação por camada

### Camada 1: Action de Stats

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 1 | `feature/actions/documentos-actions.ts` | MODIFICAR — add `actionDocumentosStats()` (contagem por status, taxa conclusão, tempo médio, trend) | Média |

Queries necessárias:
- Contar por status (rascunho, pronto, concluido, cancelado)
- Contar novos no mês
- Calcular tempo médio entre created_at e concluido_em dos assinantes
- Trend mensal (últimos 6 meses)

### Camada 2: Adapter

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 2 | `feature/adapters/documento-card-adapter.ts` | CRIAR — mapper de AssinaturaDigitalDocumentoCompleto para DocumentoCardData | Média |

Tipo de saída:
```typescript
interface DocumentoCardData {
  id: number;
  uuid: string;
  titulo: string;
  status: DocStatus;
  assinantes: { nome: string; tipo: string; status: string; diasPendente?: number }[];
  criadoEm: string;
  criadoPor: string;
  selfieHabilitada: boolean;
  origem: 'documento' | 'formulario';
}
```

### Camada 3: Hook

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 3 | `feature/hooks/use-documentos-page.ts` | CRIAR — hook unificado (fetch + adapter + filtros + debounce) | Média |
| 4 | `feature/hooks/use-documentos-stats.ts` | CRIAR — fetch stats pipeline | Baixa |

### Camada 4: Componentes visuais

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 5 | `feature/components/documento-card.tsx` | CRIAR — card glass com ProgressRing de assinantes + SignerPills | Baixa |
| 6 | `feature/components/documento-list-row.tsx` | CRIAR — row compacta com progresso | Baixa |
| 7 | `feature/components/signature-pipeline.tsx` | CRIAR — funil visual de documentos | Média |
| 8 | `feature/components/signature-stats-strip.tsx` | CRIAR — strip de KPIs | Baixa |

### Camada 5: Páginas

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 9 | `app/assinatura-digital/documentos/lista/client-page.tsx` | MODIFICAR — substituir DataTable por Glass UI | Alta |
| 10 | `app/assinatura-digital/documentos/lista/page.tsx` | MODIFICAR — passar stats iniciais | Média |

---

## Fluxo de dados

```
page.tsx (Server)
  ├── actionDocumentosStats()     → stats
  └── <DocumentosListClient initialStats={} />
        ├── useDocumentosPage(params)
        │     ├── actionListDocumentos()
        │     └── documentoToCardData()
        ├── useDocumentosStats()
        └── RENDER:
              ├── StatsStrip
              ├── SignaturePipeline
              ├── InsightBanner (assinantes atrasados)
              ├── TabPills + SearchInput + ViewToggle
              └── Cards | Lista
```

## Inovações do protótipo

1. **ProgressRing por documento** — Cada card mostra progresso visual (2/3 assinantes = 67%)
2. **SignerPills** — Pills coloridas por assinante (verde=assinado, amarelo=atrasado, cinza=pendente)
3. **Pipeline de conversão** — Rascunho → Aguardando → Concluído com taxas entre etapas
4. **InsightBanner** — "3 assinantes sem assinar há 7+ dias — reenviar convites"
5. **Cards com ring warning** — Documentos com assinantes atrasados (>7d) ganham borda amarela
