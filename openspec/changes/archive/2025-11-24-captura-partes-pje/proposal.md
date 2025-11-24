# Proposal: Captura Automatizada de Partes do PJE-TRT

## Change ID
`captura-partes-pje`

## Status
Draft

## Overview
Implementar sistema de captura automatizada de partes (clientes, partes contrárias e terceiros) dos processos no PJE-TRT, com identificação inteligente de quem é nosso cliente baseado no CPF do advogado proprietário da credencial.

## Problem Statement
Atualmente, o sistema captura processos do acervo geral, arquivados, audiências e pendências, mas **não captura as partes envolvidas** em cada processo. Isso impede:

- Identificação automática de quais partes são nossos clientes
- Identificação de partes contrárias
- Vínculo de terceiros (peritos, MP, testemunhas, etc.)
- Relacionamento correto entre processos e partes
- Gestão completa de clientes e partes contrárias

A captura de partes precisa de **lógica de identificação inteligente**: uma parte é nosso cliente se seus representantes incluem um advogado com o mesmo CPF do advogado proprietário da credencial usada para captura.

## Proposed Solution

### Fluxo de Captura de Partes

```
1. Autenticar no PJE com credencial do advogado
2. Para cada processo capturado:
   a. Buscar partes via API do PJE
   b. Para cada parte:
      - Capturar representantes da parte
      - Verificar se algum representante tem CPF = CPF do advogado da credencial
      - Se SIM → parte é nosso CLIENTE
      - Se NÃO → parte é PARTE CONTRÁRIA
      - Se tipo_parte especial (PERITO, MP, etc.) → TERCEIRO
   c. Upsert entidade (cliente/parte_contraria/terceiro)
   d. Upsert representantes da parte
   e. Criar vínculo em processo_partes
3. Retornar resumo da captura
```

### Identificação de Cliente

```typescript
function identificarTipoParte(
  parte: PartePJE,
  cpfAdvogadoCredencial: string
): 'cliente' | 'parte_contraria' | 'terceiro' {
  // 1. Verificar se é tipo especial (terceiro)
  const tiposEspeciais = ['PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE',
                          'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE'];
  if (tiposEspeciais.includes(parte.tipo_parte)) {
    return 'terceiro';
  }

  // 2. Verificar representantes
  const representantes = parte.representantes || [];
  const temAdvogadoNosso = representantes.some(rep =>
    rep.cpf === cpfAdvogadoCredencial
  );

  // 3. Se tem nosso advogado representando → é cliente
  if (temAdvogadoNosso) {
    return 'cliente';
  }

  // 4. Caso contrário → é parte contrária
  return 'parte_contraria';
}
```

## Architecture & Design

### Novos Componentes

#### 1. Backend API Cliente PJE
- **Local**: `backend/api/pje-trt/partes/`
- **Responsabilidade**: Chamadas HTTP para API REST do PJE para capturar partes
- **Funções**:
  - `obterPartesProcesso(page, idProcesso)` → `PartePJE[]`
  - `obterRepresentantesParte(page, idParte)` → `RepresentantePJE[]`

#### 2. Serviço de Captura
- **Local**: `backend/captura/services/partes/partes-capture.service.ts`
- **Responsabilidade**: Orquestrar captura e processamento de partes
- **Funções**:
  - `capturarPartesProcesso(processoId, credencial)` → `CapturaPartesResult`
  - `identificarTipoParte(parte, cpfAdvogado)` → `'cliente' | 'parte_contraria' | 'terceiro'`
  - `processarParte(parte, processoId, tipoParte)` → `ProcessoParteVinculo`

#### 3. Serviço de Identificação
- **Local**: `backend/captura/services/partes/identificacao-partes.service.ts`
- **Responsabilidade**: Lógica de identificação de cliente vs parte contrária
- **Funções**:
  - `determinarTipoParte(parte, advogado)` → `ParteTipo`
  - `verificarRepresentantesComCpf(representantes, cpf)` → `boolean`

#### 4. API Route
- **Local**: `app/api/captura/trt/partes/route.ts`
- **Endpoint**: `POST /api/captura/trt/partes`
- **Body**:
  ```typescript
  {
    advogado_id: number;
    credencial_ids: number[];
    processo_ids?: number[]; // opcional, se vazio captura todos
  }
  ```

### Integração com Estrutura Existente

#### Tabelas Utilizadas (já existem)
- `processo_partes` - Relacionamento N:N entre processos e partes
- `clientes` - Armazena partes identificadas como clientes
- `partes_contrarias` - Armazena partes contrárias
- `terceiros` - Armazena terceiros (peritos, MP, etc.)
- `representantes` - Armazena advogados/representantes de cada parte
- `advogados` - Advogados do escritório (com CPF)
- `credenciais` - Credenciais de acesso ao PJE

#### Serviços Reutilizados
- `upsertCliente()` - De `backend/partes/services/clientes-persistence.service.ts`
- `upsertParteContraria()` - De `backend/partes-contrarias/services/persistence/`
- `upsertTerceiro()` - De `backend/partes/services/terceiros-persistence.service.ts`
- `upsertRepresentante()` - De `backend/representantes/services/`
- `upsertProcessoParte()` - De `backend/partes/services/processo-partes-persistence.service.ts`
- `autenticarPJE()` - De `backend/captura/services/trt/trt-auth.service.ts`

## Specs

This change introduces/modifies the following specs:

1. **`pje-partes-api`** (NEW) - API PJE-TRT para captura de partes
2. **`captura-partes-service`** (NEW) - Serviço de captura e processamento
3. **`identificacao-cliente`** (NEW) - Lógica de identificação via CPF
4. **`api-routes`** (MODIFIED) - Adicionar endpoint de captura de partes

## Tasks Breakdown
See [tasks.md](./tasks.md) for detailed implementation tasks.

## Dependencies

### Internal Dependencies
- Tabelas de partes já implementadas (change `refatoracao-sistema-partes`)
- Sistema de autenticação PJE (`captura-trt` spec)
- Serviços de persistência de partes

### External Dependencies
- API REST do PJE-TRT (endpoints de partes e representantes)
- Puppeteer/Playwright para navegação autenticada

## Success Criteria

- [ ] Captura partes de um processo via API PJE
- [ ] Identifica corretamente clientes vs partes contrárias via CPF
- [ ] Cria/atualiza entidades (clientes, partes_contrarias, terceiros)
- [ ] Cria/atualiza representantes
- [ ] Cria vínculos corretos em processo_partes
- [ ] Endpoint REST funcional
- [ ] Logs de captura detalhados
- [ ] Tratamento de erros robusto
- [ ] Integração com sistema de captura existente

## Risks & Mitigations

### Risk: API PJE não documentada pode mudar
- **Mitigation**: Abstrair chamadas em módulo dedicado, facilitar ajustes

### Risk: Identificação incorreta de cliente
- **Mitigation**: Logs detalhados, validação manual em interface, possibilidade de correção

### Risk: Performance com muitos processos
- **Mitigation**: Captura assíncrona, processamento em lote, rate limiting

## Timeline Estimate
- **Development**: 16-20 horas
- **Testing**: 4-6 horas
- **Total**: 20-26 horas

## Open Questions
- [ ] Devemos capturar partes automaticamente em toda captura de acervo?
- [ ] Ou criar endpoint separado que captura sob demanda?
- [ ] Como lidar com partes que já existem mas com dados conflitantes?

## References
- PJE API endpoints (não documentados, descobertos via DevTools)
- Tabela `representantes` e lógica de relacionamento
- Change `refatoracao-sistema-partes` para estrutura de partes
