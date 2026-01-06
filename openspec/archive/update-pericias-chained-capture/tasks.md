## 1. Implementation
- [x] 1.1 Atualizar servico `periciasCapture` para extrair processos unicos e buscar dados complementares (timeline + partes)
  - Implementado via `buscarDadosComplementaresProcessos` (linha 63)
- [x] 1.2 Implementar obtencao/atualizacao de processos do acervo para os processos vinculados as pericias
  - Implementado via `salvarAcervo` (linha 64)
- [x] 1.3 Ajustar ordem de persistencia para: acervo -> timeline -> partes -> pericias
  - Documentado no fluxo (linhas 40-45): Processos -> Timeline -> Partes -> Pericias
  - `salvarTimeline` (linha 65)
  - `persistirPartesProcesso` (linha 66)
- [x] 1.4 Garantir logs e raw logs coerentes
  - `captureLogService` importado e utilizado
- [x] 1.5 Validar comportamento via endpoint existente

> **STATUS FINAL (2026-01-06)**: 100% implementado.
> Fluxo encadeado completo em pericias.service.ts com documentacao detalhada (linhas 1-51).
