# Tasks: Captura Automatizada de Partes do PJE-TRT

## Overview
Implementação completa do serviço de captura de partes de processos do PJE-TRT, incluindo identificação automática de clientes vs partes contrárias via CPF de representantes.

**Estimated Total**: 20-26 horas

## FASE 1: Tipos TypeScript e Estrutura Base
**Estimated**: 2-3 horas

### Task 1.1: Criar tipos PJE de Partes
**Estimated**: 30min

**Description**: Definir tipos TypeScript para dados de partes retornados pela API do PJE.

**Steps**:
1. Criar arquivo `backend/types/pje-trt/partes-types.ts`
2. Definir interface `PartePJE`:
   - `idParte: number`
   - `idPessoa: number`
   - `nome: string`
   - `tipoParte: string`
   - `polo: 'ATIVO' | 'PASSIVO' | 'OUTROS'`
   - `principal: boolean`
   - `tipoDocumento: 'CPF' | 'CNPJ' | 'OUTRO'`
   - `numeroDocumento: string`
   - `emails: string[]`
   - `telefones: { ddd: string; numero: string }[]`
   - `dadosCompletos: Record<string, unknown>`
3. Definir interface `RepresentantePJE`:
   - `idPessoa: number`
   - `nome: string`
   - `tipoDocumento: 'CPF' | 'CNPJ'`
   - `numeroDocumento: string`
   - `numeroOAB: string | null`
   - `ufOAB: string | null`
   - `situacaoOAB: string | null`
   - `tipo: string`
   - `email: string | null`
   - `telefones: { ddd: string; numero: string }[]`
   - `dadosCompletos: Record<string, unknown>`
4. Exportar em `backend/types/pje-trt/index.ts`

**Acceptance Criteria**:
- [ ] Tipos compilam sem erros
- [ ] Tipos documentados com JSDoc
- [ ] Exportados centralmente

**Files**:
- `backend/types/pje-trt/partes-types.ts` (NEW)

---

### Task 1.2: Criar tipos de Resultado de Captura
**Estimated**: 30min

**Description**: Definir tipos de resultado para serviço de captura.

**Steps**:
1. Criar arquivo `backend/captura/services/partes/types.ts`
2. Definir `CapturaPartesResult`:
   - `processoId: number`
   - `numeroProcesso: string`
   - `totalPartes: number`
   - `clientes: number`
   - `partesContrarias: number`
   - `terceiros: number`
   - `representantes: number`
   - `vinculos: number`
   - `erros: ErroCapturaParte[]`
   - `duracaoMs: number`
3. Definir `ErroCapturaParte`:
   - `parteIndex: number`
   - `parteDados: Partial<PartePJE>`
   - `erro: string`
4. Definir constante `TIPOS_ESPECIAIS` (array de tipos de terceiros)

**Acceptance Criteria**:
- [ ] Tipos exportados e importáveis
- [ ] TIPOS_ESPECIAIS inclui todos os tipos identificados

**Files**:
- `backend/captura/services/partes/types.ts` (NEW)

---

## FASE 2: API PJE para Partes
**Estimated**: 3-4 horas

### Task 2.1: Implementar obterPartesProcesso
**Estimated**: 1.5h

**Description**: Função para buscar partes de um processo via API REST do PJE.

**Steps**:
1. Criar arquivo `backend/api/pje-trt/partes/obter-partes.ts`
2. Implementar função `obterPartesProcesso(page: Page, idProcesso: number): Promise<PartePJE[]>`
3. Fazer requisição GET para `/pje-backend-api/api/processos/{idProcesso}/partes`
4. Mapear resposta JSON para array de `PartePJE`
5. Tratar erros (timeout, 401, 500, JSON inválido)
6. Implementar retry logic (3 tentativas com backoff)
7. Adicionar logging detalhado

**Acceptance Criteria**:
- [ ] Função retorna partes válidas
- [ ] Trata timeout com retry
- [ ] Trata autenticação expirada (401)
- [ ] Logs estruturados

**Files**:
- `backend/api/pje-trt/partes/obter-partes.ts` (NEW)

---

### Task 2.2: Implementar obterRepresentantesParte
**Estimated**: 1.5h

**Description**: Função para buscar representantes de uma parte.

**Steps**:
1. Criar arquivo `backend/api/pje-trt/partes/obter-representantes.ts`
2. Implementar função `obterRepresentantesParte(page: Page, idParte: number): Promise<RepresentantePJE[]>`
3. Fazer requisição GET para `/pje-backend-api/api/partes/{idParte}/representantes`
4. Mapear resposta para array de `RepresentantePJE`
5. Tratar representantes com dados incompletos (CPF null, OAB null)
6. Adicionar logging
7. Tratar array vazio (parte sem representantes)

**Acceptance Criteria**:
- [ ] Retorna representantes válidos
- [ ] Aceita dados incompletos sem erro
- [ ] Array vazio se parte sem representantes

**Files**:
- `backend/api/pje-trt/partes/obter-representantes.ts` (NEW)

---

### Task 2.3: Criar index.ts e exports
**Estimated**: 15min

**Description**: Centralizar exports do módulo de partes.

**Steps**:
1. Criar `backend/api/pje-trt/partes/index.ts`
2. Exportar `obterPartesProcesso`
3. Exportar `obterRepresentantesParte`
4. Exportar tipos de `partes-types.ts`

**Acceptance Criteria**:
- [ ] Imports centralizados funcionam

**Files**:
- `backend/api/pje-trt/partes/index.ts` (NEW)

---

### Task 2.4: Testes de Integração da API
**Estimated**: 1h

**Description**: Testar chamadas reais à API do PJE (sandbox).

**Steps**:
1. Criar script de teste `dev_data/scripts/test-pje-partes-api.ts`
2. Autenticar no PJE sandbox
3. Chamar `obterPartesProcesso()` com processo real
4. Validar estrutura de retorno
5. Chamar `obterRepresentantesParte()` para cada parte
6. Logar resultados para validação manual

**Acceptance Criteria**:
- [ ] Script executa sem erros
- [ ] Retorna dados válidos
- [ ] Logs detalhados para verificação

**Files**:
- `dev_data/scripts/test-pje-partes-api.ts` (NEW)

---

## FASE 3: Serviço de Identificação de Clientes
**Estimated**: 2-3 horas

### Task 3.1: Implementar identificarTipoParte
**Estimated**: 1h

**Description**: Lógica principal de classificação de partes.

**Steps**:
1. Criar arquivo `backend/captura/services/partes/identificacao-partes.service.ts`
2. Implementar função `identificarTipoParte(parte: PartePJE, advogado: Advogado): 'cliente' | 'parte_contraria' | 'terceiro'`
3. Lógica:
   - Se `parte.tipoParte` em `TIPOS_ESPECIAIS` → 'terceiro'
   - Se algum representante tem CPF == advogado.cpf → 'cliente'
   - Caso contrário → 'parte_contraria'
4. Adicionar helper `normalizarCpf(cpf: string): string` (remover não-dígitos)
5. Adicionar helper `isTipoEspecial(tipoParte: string): boolean`
6. Adicionar helper `verificarRepresentantesComCpf(reps, cpf): boolean`
7. Logging detalhado de cada classificação

**Acceptance Criteria**:
- [ ] Classifica clientes corretamente
- [ ] Classifica terceiros corretamente
- [ ] CPF formatado vs não-formatado funciona
- [ ] Logs informativos

**Files**:
- `backend/captura/services/partes/identificacao-partes.service.ts` (NEW)

---

### Task 3.2: Testes Unitários de Identificação
**Estimated**: 1.5h

**Description**: Suite completa de testes unitários.

**Steps**:
1. Criar arquivo de teste (Jest ou Vitest)
2. Testes:
   - Cliente: Parte com representante nosso
   - Parte Contrária: Parte sem representante nosso
   - Terceiro: Tipo especial (PERITO, MP, etc.)
   - CPF formatado vs não formatado
   - Múltiplos representantes
   - Representante sem CPF
   - Parte sem representantes
   - Perito representado por nós (ainda terceiro)
3. Mock de `PartePJE` e `Advogado`
4. Asserções claras

**Acceptance Criteria**:
- [ ] Todos os testes passam
- [ ] Cobertura > 90%
- [ ] Edge cases cobertos

**Files**:
- `backend/captura/services/partes/__tests__/identificacao-partes.test.ts` (NEW)

---

## FASE 4: Serviço de Captura de Partes
**Estimated**: 4-5 horas

### Task 4.1: Implementar processarParte
**Estimated**: 1.5h

**Description**: Processar parte individual (upsert entidade).

**Steps**:
1. Criar arquivo `backend/captura/services/partes/processar-parte.service.ts`
2. Implementar `processarParte(parte: PartePJE, processoId: number, tipoParte: ParteTipo, trt: string, grau: string): Promise<{ entidadeTipo, entidadeId }>`
3. Switch baseado em `tipoParte`:
   - 'cliente' → `upsertCliente()` de persistence service
   - 'parte_contraria' → `upsertParteContraria()`
   - 'terceiro' → `upsertTerceiro()`
4. Mapear campos `PartePJE` → `CriarClienteParams` (ou equivalente)
5. Incluir `dados_pje_completo: parte.dadosCompletos`
6. Logging

**Acceptance Criteria**:
- [ ] Upsert funciona para todos os tipos
- [ ] Deduplicação via `id_pessoa_pje`
- [ ] Logs informativos

**Files**:
- `backend/captura/services/partes/processar-parte.service.ts` (NEW)

---

### Task 4.2: Implementar processarRepresentantes
**Estimated**: 1h

**Description**: Salvar representantes de uma parte.

**Steps**:
1. Criar arquivo `backend/captura/services/partes/processar-representantes.service.ts`
2. Implementar `processarRepresentantes(representantes: RepresentantePJE[], parteTipo: ParteTipo, parteId: number, numeroProcesso: string, trt: string, grau: string): Promise<number>`
3. Para cada representante:
   - Mapear para `UpsertRepresentantePorIdPessoaParams`
   - Chamar `upsertRepresentante()` de persistence service
4. Retornar contador de representantes salvos
5. Logar warnings para representantes sem CPF

**Acceptance Criteria**:
- [ ] Múltiplos representantes salvos
- [ ] Composite key correto
- [ ] Trata dados incompletos

**Files**:
- `backend/captura/services/partes/processar-representantes.service.ts` (NEW)

---

### Task 4.3: Implementar criarVinculoProcessoParte
**Estimated**: 45min

**Description**: Criar vínculo em tabela `processo_partes`.

**Steps**:
1. Criar arquivo `backend/captura/services/partes/criar-vinculo.service.ts`
2. Implementar `criarVinculoProcessoParte(processoId, entidadeTipo, entidadeId, parte: PartePJE, ordem: number): Promise<void>`
3. Mapear campos:
   - `polo`: 'ATIVO' → 'ativo', 'PASSIVO' → 'passivo'
   - `tipo_parte`: parte.tipoParte
   - `principal`: parte.principal
   - `ordem`: ordem
   - `dados_pje_completo`: parte.dadosCompletos
4. Chamar `upsertProcessoParte()` de persistence service

**Acceptance Criteria**:
- [ ] Vínculo criado/atualizado
- [ ] Campos mapeados corretamente

**Files**:
- `backend/captura/services/partes/criar-vinculo.service.ts` (NEW)

---

### Task 4.4: Implementar capturarPartesProcesso (orquestração)
**Estimated**: 2h

**Description**: Função principal que orquestra captura de partes de um processo.

**Steps**:
1. Criar arquivo `backend/captura/services/partes/partes-capture.service.ts`
2. Implementar `capturarPartesProcesso(processoId: number, credencial: Credencial): Promise<CapturaPartesResult>`
3. Fluxo:
   - Autenticar no PJE via `autenticarPJE()`
   - Buscar processo no banco (obter numero_processo, trt, grau)
   - Buscar advogado por CPF (da credencial)
   - Chamar `obterPartesProcesso(page, idProcessoPJE)`
   - Para cada parte:
     - Chamar `identificarTipoParte(parte, advogado)`
     - Chamar `processarParte(parte, processoId, tipoParte, trt, grau)`
     - Buscar `obterRepresentantesParte(page, parte.idParte)`
     - Chamar `processarRepresentantes(reps, tipoParte, parteId, ...)`
     - Chamar `criarVinculoProcessoParte(...)`
   - Acumular contadores (clientes, partes_contrarias, terceiros, etc.)
   - Tratar erros parciais (logar e continuar)
   - Retornar `CapturaPartesResult`
4. Usar try/catch por parte (não abortar toda captura)
5. Logging detalhado

**Acceptance Criteria**:
- [ ] Captura completa funciona
- [ ] Erros parciais não param captura
- [ ] Resultado detalhado retornado

**Files**:
- `backend/captura/services/partes/partes-capture.service.ts` (NEW)

---

## FASE 5: API Route
**Estimated**: 3-4 horas

### Task 5.1: Implementar endpoint POST /api/captura/trt/partes
**Estimated**: 2h

**Description**: Endpoint REST para acionar captura.

**Steps**:
1. Criar arquivo `app/api/captura/trt/partes/route.ts`
2. Implementar `async function POST(request: NextRequest)`
3. Autenticar via `authenticateRequest()`
4. Parsear body: `{ advogado_id, credencial_ids, processo_ids? }`
5. Validar parâmetros (Zod ou manual)
6. Buscar advogado, credenciais, processos
7. Validar credenciais pertencem ao advogado
8. Criar registro em `capturas_log` (status: 'in_progress')
9. Para cada processo:
   - Chamar `capturarPartesProcesso(processo.id, credencial)`
   - Acumular resultados
10. Atualizar `capturas_log` (status: 'completed', resultado)
11. Retornar `NextResponse.json({ success: true, data })`
12. Tratar erros: 400, 401, 403, 404, 500

**Acceptance Criteria**:
- [ ] Endpoint funciona end-to-end
- [ ] Validação de parâmetros
- [ ] Registro em histórico
- [ ] Tratamento de erros

**Files**:
- `app/api/captura/trt/partes/route.ts` (NEW)

---

### Task 5.2: Adicionar Documentação Swagger
**Estimated**: 1h

**Description**: Documentar endpoint com anotações Swagger.

**Steps**:
1. Adicionar JSDoc com `@swagger` tags
2. Documentar request body schema
3. Documentar responses: 200, 400, 401, 403, 404, 500
4. Adicionar exemplos de request/response
5. Tags: "Captura"
6. Security: bearerAuth, sessionAuth

**Acceptance Criteria**:
- [ ] Aparece em `/api/docs`
- [ ] Schema completo
- [ ] Exemplos válidos

**Files**:
- `app/api/captura/trt/partes/route.ts` (MODIFIED)

---

### Task 5.3: Testes de Integração da API
**Estimated**: 1.5h

**Description**: Testar endpoint com requisições reais.

**Steps**:
1. Criar script de teste ou usar Postman/Insomnia
2. Testar:
   - Captura de processos específicos
   - Captura de todos os processos
   - Erro 400 (parâmetros inválidos)
   - Erro 404 (advogado/credencial não encontrado)
   - Erro 401 (não autenticado)
3. Verificar registros criados no banco
4. Verificar histórico em `capturas_log`

**Acceptance Criteria**:
- [ ] Todos os cenários testados
- [ ] Dados corretos no banco
- [ ] Histórico registrado

---

## FASE 6: Testes End-to-End
**Estimated**: 3-4 horas

### Task 6.1: Teste E2E com Processo Real
**Estimated**: 2h

**Description**: Testar captura completa de processo real do PJE.

**Steps**:
1. Selecionar processo real do acervo
2. Executar captura via endpoint
3. Verificar no banco:
   - Clientes criados/atualizados
   - Partes contrárias criadas
   - Terceiros criados (se houver)
   - Representantes vinculados
   - Vínculos em `processo_partes`
4. Validar classificação correta (cliente vs parte contrária)
5. Verificar dados mapeados corretamente
6. Conferir logs de captura

**Acceptance Criteria**:
- [ ] Captura concluída sem erros
- [ ] Classificação correta verificada manualmente
- [ ] Dados completos no banco

---

### Task 6.2: Teste de Recaptura (Deduplicação)
**Estimated**: 1h

**Description**: Testar upsert ao recapturar mesmo processo.

**Steps**:
1. Capturar partes de um processo
2. Modificar dados manualmente no banco (simular atualização)
3. Recapturar mesmo processo
4. Verificar que:
   - Entidades foram atualizadas (não duplicadas)
   - `updated_at` foi atualizado
   - `created_at` mantido
   - `id` mantido

**Acceptance Criteria**:
- [ ] Deduplicação funciona
- [ ] Dados atualizados corretamente

---

### Task 6.3: Teste de Erro Parcial
**Estimated**: 1h

**Description**: Simular falha em parte do processo.

**Steps**:
1. Mockar `obterPartesProcesso()` para retornar parte com dados inválidos
2. Executar captura
3. Verificar que:
   - Erro foi logado
   - Incluído em `erros[]` do resultado
   - Demais partes foram processadas com sucesso
   - Captura não abortou

**Acceptance Criteria**:
- [ ] Erro parcial não para captura
- [ ] Resultado inclui erros
- [ ] Logs apropriados

---

## FASE 7: Documentação e Refinamentos
**Estimated**: 2-3 horas

### Task 7.1: Documentar README técnico
**Estimated**: 1h

**Description**: Documentar funcionamento do serviço.

**Steps**:
1. Criar ou atualizar README em `backend/captura/services/partes/`
2. Explicar fluxo de captura
3. Explicar lógica de identificação
4. Dar exemplos de uso
5. Documentar estrutura de código

**Acceptance Criteria**:
- [ ] README claro e completo
- [ ] Exemplos funcionais

**Files**:
- `backend/captura/services/partes/README.md` (NEW)

---

### Task 7.2: Adicionar Logs Estruturados
**Estimated**: 1h

**Description**: Revisar e melhorar logging.

**Steps**:
1. Revisar todos os pontos de logging
2. Garantir formato consistente: `[CAPTURA-PARTES] Mensagem`
3. Incluir contexto útil (processo_id, parte_nome, etc.)
4. Usar níveis apropriados (info, debug, warn, error)
5. Não logar dados sensíveis (senhas, tokens)

**Acceptance Criteria**:
- [ ] Logs estruturados e úteis
- [ ] Sem dados sensíveis
- [ ] Fácil debugging

---

### Task 7.3: Performance Review
**Estimated**: 1h

**Description**: Otimizar performance se necessário.

**Steps**:
1. Medir tempo de captura de 10, 50, 100 processos
2. Identificar gargalos (queries N+1, etc.)
3. Implementar otimizações se necessário:
   - Batch upserts
   - Cache de advogados
   - Paralelização controlada
4. Documentar métricas de performance

**Acceptance Criteria**:
- [ ] Performance aceitável (<1min para 10 processos)
- [ ] Gargalos identificados e mitigados

---

## Summary

| Fase | Tarefas | Tempo Estimado |
|------|---------|----------------|
| 1. Tipos TypeScript | 2 | 1-1.5h |
| 2. API PJE Partes | 4 | 3-4h |
| 3. Identificação | 2 | 2-3h |
| 4. Serviço Captura | 4 | 4-5h |
| 5. API Route | 3 | 3-4h |
| 6. E2E Tests | 3 | 3-4h |
| 7. Documentação | 3 | 2-3h |
| **TOTAL** | **21** | **20-26h** |

## Dependencies Between Tasks
- Task 2.x depends on Task 1.1 (tipos PJE)
- Task 3.x depends on Task 1.x (tipos)
- Task 4.x depends on Task 2.x (API PJE) and Task 3.1 (identificação)
- Task 5.x depends on Task 4.4 (serviço principal)
- Task 6.x depends on Task 5.1 (endpoint)
- Task 7.x can run in parallel with Task 6.x

## Parallel Work Opportunities
- Task 1.1 e 1.2 podem ser feitas em paralelo
- Task 2.1 e 2.2 podem ser feitas em paralelo
- Task 4.1, 4.2, 4.3 podem ser feitas em paralelo (depois integradas em 4.4)
- Task 6.1, 6.2, 6.3 podem ser feitas em paralelo
- Task 7.1, 7.2, 7.3 podem ser feitas em paralelo

## Success Metrics
- [ ] Captura de partes de 1 processo: <5s
- [ ] Captura de partes de 10 processos: <60s
- [ ] Taxa de sucesso: >95%
- [ ] Identificação correta de clientes: 100% (validado manualmente)
- [ ] Zero duplicações (mesmo id_pessoa_pje)
