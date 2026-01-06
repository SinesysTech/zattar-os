# Change: Otimizar captura de perícias com sincronização encadeada (processos → timeline → partes → perícias)

## Why
A captura atual de perícias persiste apenas a lista de perícias e depende de o processo já existir no acervo. Isso causa dados desatualizados (processos/partes/timeline) para processos que possuem perícia e pode gerar falhas de persistência por ausência de vínculo (`processo_id`).

## What Changes
- A captura de **perícias** passará a seguir o mesmo padrão de **expedientes/audiências**:
  - Captura lista de perícias
  - Extrai processos únicos (ids)
  - Atualiza processos (acervo) para esses ids
  - Captura e persiste timeline (movimentos + documentos) e partes
  - Persiste perícias por último, com integridade referencial garantida
- Persistência será feita em ordem “segura”:
  - acervo → timeline → partes → perícias
- Mantém rate limiting e verificação de recaptura (pular processos atualizados recentemente), quando aplicável.

## Impact
- Affected specs: `openspec/specs/captura-trt/spec.md`
- Affected code:
  - `src/features/captura/services/trt/pericias.service.ts`
  - `src/features/captura/services/trt/dados-complementares.service.ts` (reuso)
  - `src/features/captura/pje-trt/*` (reuso, sem mudança esperada)
  - `src/features/captura/services/persistence/*` (reuso, sem mudança esperada)


