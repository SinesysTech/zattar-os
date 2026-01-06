## Context
Hoje a captura de perícias busca `Pericia[]` e tenta persistir diretamente em `public.pericias`. A persistência exige vínculo com `acervo` (`processo_id`), e processos/partes/timeline podem estar desatualizados para os processos que possuem perícia.

Expedientes e audiências seguem um fluxo encadeado que reaproveita a sessão autenticada para capturar dados complementares (timeline e partes) e persiste numa ordem que evita falhas de FK.

## Goals / Non-Goals
- Goals:
  - Garantir que, ao capturar perícias, os processos envolvidos sejam sincronizados (acervo, partes, timeline).
  - Persistir em ordem segura para evitar falhas por ausência de `processo_id`.
  - Reutilizar sessão autenticada (sem logins extras).
  - Manter rate limiting e lógica de recaptura (evitar refetch agressivo).
- Non-Goals:
  - Alterar schema de banco.
  - Implementar download/upload de PDFs de todos os documentos da timeline (somente captura/persistência da timeline JSONB e partes, conforme padrão de dados complementares atual).

## Decisions
- **Decisão: Reutilizar `buscarDadosComplementaresProcessos`** para obter timeline (movimentos + documentos) e partes por `processoId`, com `delayEntreRequisicoes` e verificação de recaptura por `acervo.updated_at`.
- **Decisão: Persistência encadeada**:
  - Persistir processos no acervo primeiro (garantir IDs para vínculos).
  - Persistir timeline (JSONB) em seguida.
  - Persistir partes vinculando ao `acervo.id`.
  - Persistir perícias por último.
- **Decisão: Atualização de processos do acervo por conjunto de IDs**:
  - Implementar estratégia de obter os `Processo` do PJe para os IDs das perícias, preferindo dados “completos” do endpoint de painel do advogado quando possível.
  - Se algum `processoId` não estiver disponível via painel (ex.: não aparece em acervo/arquivados), usar fallback de persistência mínima (com defaults) apenas para garantir integridade referencial.

## Risks / Trade-offs
- Buscar processos via painel pode exigir paginação; mitigação: “early stop” quando todos os IDs alvo forem encontrados.
- Fallback de processo “mínimo” garante FK, mas pode não conter todos os campos do processo; mitigação: complementar com captura de acervo/arquivados em rotinas próprias e/ou enriquecimento futuro.

## Migration Plan
- Nenhuma migração de schema necessária.
- Deploy do serviço atualizado e validação via captura “Nova Captura → Perícias” e logs no histórico.


