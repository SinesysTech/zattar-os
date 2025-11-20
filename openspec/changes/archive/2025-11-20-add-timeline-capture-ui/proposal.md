# Change: Adicionar Interface de Captura de Timeline de Processos

## Why

O sistema já possui um serviço backend completo para captura de timeline de processos do PJE-TRT (movimentos e documentos), incluindo download de PDFs, upload para Google Drive e persistência no MongoDB. No entanto, não há interface de usuário que permita aos usuários iniciar essa captura através da página de captura.

Esta funcionalidade é essencial para permitir que os usuários visualizem o histórico completo de movimentações e documentos de um processo, que atualmente só pode ser acessado diretamente através da API.

## What Changes

- Adicionar tipo "timeline" ao select de tipos de captura
- Criar componente `TimelineForm` para captura de timeline de processo específico
- Adicionar função cliente `capturarTimeline()` em `lib/api/captura.ts`
- Integrar novo formulário no dialog de captura existente
- Adicionar ícone apropriado (FileText) para o tipo timeline

**Campos do formulário:**
- Advogado (obrigatório) - herdado do `CapturaFormBase`
- Credenciais (obrigatórias) - herdado do `CapturaFormBase`
- Número do Processo (obrigatório) - input text formatado
- Baixar Documentos (opcional) - checkbox (default: true)
- Filtros de Documentos (opcional/avançado) - collapsible:
  - Apenas Assinados (boolean, default: true)
  - Apenas Não Sigilosos (boolean, default: true)
  - Tipos de Documento (multi-select)
  - Data Inicial (date picker)
  - Data Final (date picker)

## Impact

- **Affected specs:** `captura-trt` (adicionar requisitos de UI para timeline)
- **Affected code:**
  - `app/(dashboard)/captura/components/tipo-captura-select.tsx` - adicionar tipo timeline
  - `app/(dashboard)/captura/components/captura-dialog.tsx` - adicionar case para timeline
  - `app/(dashboard)/captura/components/timeline-form.tsx` - novo componente (a criar)
  - `lib/api/captura.ts` - adicionar função `capturarTimeline`

- **Dependencies:**
  - API endpoint `/api/captura/trt/timeline` (já existe)
  - Serviço backend `timeline-capture.service.ts` (já existe)
  - Componentes base: `CapturaFormBase`, `CapturaButton`, `CapturaResult` (já existem)

- **Breaking changes:** Nenhum
