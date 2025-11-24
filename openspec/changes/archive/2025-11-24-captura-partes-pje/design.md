# Design: Captura Automatizada de Partes do PJE-TRT

## Architectural Decisions

### AD-1: API do PJE para Partes
**Decision**: Utilizar API REST interna do PJE para capturar partes, seguindo padrão existente de acervo/audiências

**Rationale**:
- API REST é mais estável que scraping HTML
- Já temos padrão estabelecido em `backend/api/pje-trt/`
- Dados estruturados em JSON facilitam processamento
- Menos suscetível a quebras por mudanças no HTML

**Alternatives Considered**:
- Scraping HTML: Rejeitado por ser menos estável e mais complexo
- Scraping + API: Desnecessário, API fornece todos os dados

### AD-2: Identificação via CPF do Advogado da Credencial
**Decision**: Comparar CPF dos representantes da parte com CPF do advogado proprietário da credencial

**Rationale**:
- Única forma confiável de identificar "nosso cliente"
- CPF é identificador único e imutável
- Advogado da credencial = advogado do escritório que tem acesso ao processo
- Se representamos a parte, nosso advogado está nos representantes

**Edge Cases**:
1. **Parte sem representantes**: Classificar como parte contrária (caso raro)
2. **Múltiplos advogados nossos**: Qualquer um identifica como cliente
3. **Advogado não cadastrado**: Buscar ou criar via CPF (helper existente)

### AD-3: Três Tipos de Entidades
**Decision**: Separar em `cliente`, `parte_contraria`, `terceiro` baseado em tipo e representação

**Rationale**:
- Clientes: Partes que representamos (autor ou réu)
- Partes Contrárias: Oponentes processuais (autor ou réu)
- Terceiros: Participantes especiais (perito, MP, assistente, testemunha)

**Classification Logic**:
```typescript
if (tipo_parte in TIPOS_ESPECIAIS) {
  return 'terceiro';
}
if (temRepresentanteComCpfNosso) {
  return 'cliente';
}
return 'parte_contraria';
```

### AD-4: Upsert Pattern para Deduplicação
**Decision**: Usar upsert baseado em `id_pessoa_pje` para evitar duplicação

**Rationale**:
- `id_pessoa_pje` é único no PJE para cada pessoa
- Mesmo CPF/CNPJ pode ter múltiplos registros no PJE (tribunais diferentes)
- Upsert permite atualizar dados em recapturas
- Constraint UNIQUE previne duplicação

**Composite Key**:
- `id_pessoa_pje` + `trt` + `grau` garante unicidade por tribunal/grau

### AD-5: Relacionamento via processo_partes
**Decision**: Não adicionar colunas FK diretas em `acervo`, manter relacionamento via `processo_partes`

**Rationale**:
- Relacionamento N:N é mais flexível
- Processo pode ter múltiplos clientes
- Permite armazenar contexto: polo, tipo_parte, ordem, principal
- Mantém histórico completo de partes
- Mais normalizado e escalável

**Rejected Alternative**:
- Colunas `cliente_principal_id` e `parte_contraria_principal_id` em `acervo`:
  - Mais rápido para queries simples
  - Menos flexível (apenas 1:1)
  - Duplica dados (desnormalização)
  - **Decision: Não implementar agora, avaliar se necessário para performance**

### AD-6: Captura Separada vs Integrada
**Decision**: Criar endpoint separado `/api/captura/trt/partes` mas permitir integração futura

**Rationale**:
- **Separado inicialmente**:
  - Mais fácil de testar isoladamente
  - Não quebra fluxo de captura existente
  - Permite captura seletiva (apenas alguns processos)
  - Mais controle granular

- **Integração futura possível**:
  - Parâmetro `capturar_partes=true` em acervo-geral
  - Callback após salvar processo
  - Agendamento separado

### AD-7: Processamento Assíncrono
**Decision**: Captura síncrona inicial, preparar para async futuro

**Rationale**:
- **Síncrono (MVP)**:
  - Mais simples de implementar
  - Feedback imediato ao usuário
  - Suficiente para volume atual (<100 processos/captura)

- **Async (futura necessidade)**:
  - Se volume crescer (>500 processos)
  - Job queue com Bull/Redis
  - Progresso via polling de status

## Data Flow

### Fluxo de Captura Completo

```
1. API Request
   POST /api/captura/trt/partes
   Body: { advogado_id, credencial_ids, processo_ids? }
   ↓
2. Autenticação PJE
   autenticarPJE(credencial) → { page, advogadoInfo, cookies }
   ↓
3. Para cada processo:
   ├─ Buscar Partes PJE
   │  obterPartesProcesso(page, processoId) → PartePJE[]
   │  ↓
   ├─ Para cada parte:
   │  ├─ Identificar Tipo
   │  │  identificarTipoParte(parte, cpfAdvogado)
   │  │  ↓
   │  ├─ Upsert Entidade
   │  │  if (cliente) → upsertCliente()
   │  │  if (parte_contraria) → upsertParteContraria()
   │  │  if (terceiro) → upsertTerceiro()
   │  │  ↓
   │  ├─ Upsert Representantes
   │  │  for (rep of parte.representantes):
   │  │    upsertRepresentante(rep, parte_tipo, parte_id)
   │  │  ↓
   │  └─ Criar Vínculo Processo-Parte
   │     upsertProcessoParte({
   │       processo_id,
   │       entidade_tipo,
   │       entidade_id,
   │       polo,
   │       tipo_parte,
   │       principal,
   │       dados_pje_completo
   │     })
   │
4. Retornar Resultado
   {
     success: true,
     data: {
       total_processos: N,
       total_partes: M,
       clientes: X,
       partes_contrarias: Y,
       terceiros: Z,
       erros: []
     }
   }
```

### Modelo de Dados PJE → Sinesys

#### Parte PJE (API Response)
```typescript
interface PartePJE {
  idParte: number;
  idPessoa: number; // → id_pessoa_pje
  nome: string;
  tipoParte: string; // 'AUTOR', 'REU', 'PERITO', etc.
  polo: string; // 'ATIVO', 'PASSIVO'
  principal: boolean;
  tipoDocumento: string; // 'CPF', 'CNPJ'
  numeroDocumento: string; // CPF ou CNPJ
  emails: string[];
  telefones: { ddd: string; numero: string }[];
  representantes: RepresentantePJE[];
  dadosCompletos: Record<string, unknown>;
}
```

#### Mapeamento para Entidades

**Cliente/Parte Contrária**:
```typescript
{
  id_pje: PartePJE.idParte,
  id_pessoa_pje: PartePJE.idPessoa,
  nome: PartePJE.nome,
  tipo_pessoa: PartePJE.tipoDocumento === 'CPF' ? 'pf' : 'pj',
  cpf: PartePJE.tipoDocumento === 'CPF' ? PartePJE.numeroDocumento : null,
  cnpj: PartePJE.tipoDocumento === 'CNPJ' ? PartePJE.numeroDocumento : null,
  emails: PartePJE.emails,
  ddd_celular: PartePJE.telefones[0]?.ddd,
  numero_celular: PartePJE.telefones[0]?.numero,
  // ... outros campos do dadosCompletos
}
```

**Processo-Parte** (vínculo):
```typescript
{
  processo_id: acervo.id,
  entidade_tipo: 'cliente' | 'parte_contraria' | 'terceiro',
  entidade_id: cliente.id | parteContraria.id | terceiro.id,
  polo: PartePJE.polo === 'ATIVO' ? 'ativo' : 'passivo',
  tipo_parte: PartePJE.tipoParte,
  principal: PartePJE.principal,
  ordem: index,
  dados_pje_completo: PartePJE.dadosCompletos
}
```

**Representante**:
```typescript
{
  id_pessoa_pje: RepresentantePJE.idPessoa,
  parte_tipo: 'cliente' | 'parte_contraria' | 'terceiro',
  parte_id: cliente.id | parteContraria.id | terceiro.id,
  numero_processo: processo.numero_processo,
  trt: processo.trt,
  grau: processo.grau,
  polo: parte.polo,
  tipo_pessoa: RepresentantePJE.tipoDocumento === 'CPF' ? 'pf' : 'pj',
  nome: RepresentantePJE.nome,
  cpf: RepresentantePJE.cpf,
  numero_oab: RepresentantePJE.numeroOAB,
  // ... outros campos
}
```

## Error Handling

### Estratégia de Erros

#### 1. Erros Recuperáveis (Retry)
- Timeout de rede → Retry 3x com backoff
- Rate limit PJE → Aguardar e tentar novamente
- Processo não encontrado → Pular e continuar

#### 2. Erros Fatais (Abort)
- Autenticação falhou → Parar toda captura
- Credencial inválida → Retornar erro 401
- Banco de dados indisponível → Retornar erro 500

#### 3. Erros Parciais (Log + Continue)
- Parte com dados inválidos → Logar erro, pular parte
- Representante sem CPF → Logar warning, pular representante
- Falha em 1 de N processos → Logar erro, continuar demais

### Logging Strategy

```typescript
// Início da captura
console.log('[CAPTURA-PARTES] Iniciando', {
  advogado_id,
  credencial_ids,
  total_processos: processo_ids?.length || 'todos'
});

// Por processo
console.log('[CAPTURA-PARTES] Processo', {
  processo_id,
  numero_processo,
  total_partes_encontradas
});

// Por parte
console.log('[CAPTURA-PARTES] Parte identificada', {
  tipo: 'cliente' | 'parte_contraria' | 'terceiro',
  nome,
  cpf_cnpj,
  tem_representantes: Boolean(representantes?.length)
});

// Erros
console.error('[CAPTURA-PARTES] Erro ao processar parte', {
  erro: error.message,
  stack: error.stack,
  contexto: { processo_id, parte }
});

// Fim
console.log('[CAPTURA-PARTES] Concluída', {
  total_processados,
  clientes,
  partes_contrarias,
  terceiros,
  erros
});
```

## Performance Considerations

### Otimizações Planejadas

1. **Batch Upserts**:
   - Agrupar múltiplos upserts em transação única
   - Reduz round-trips ao banco

2. **Cache de Advogados**:
   - Manter map `cpf → advogado_id` em memória durante captura
   - Evita queries repetidas

3. **Índices Necessários** (já existem):
   - `clientes(id_pessoa_pje, trt, grau)` UNIQUE
   - `partes_contrarias(id_pessoa_pje, trt, grau)` UNIQUE
   - `terceiros(id_pessoa_pje, trt, grau, numero_processo)` UNIQUE
   - `representantes(id_pessoa_pje, parte_tipo, parte_id, numero_processo)` UNIQUE
   - `processo_partes(processo_id, entidade_tipo, entidade_id)` UNIQUE

4. **Rate Limiting PJE**:
   - Delay de 100ms entre requisições de partes
   - Máximo 10 requisições paralelas

### Métricas Esperadas
- **1 processo**: ~500ms (1 parte + representantes)
- **10 processos**: ~5s (média 2 partes/processo)
- **100 processos**: ~60s (com paralellização)

## Security Considerations

### Autenticação e Autorização
- [ ] Endpoint requer autenticação (`authenticateRequest`)
- [ ] Verificar permissão de acesso a processos
- [ ] Validar `advogado_id` existe e pertence ao usuário

### Sanitização de Dados
- [ ] Validar CPF/CNPJ antes de salvar
- [ ] Escapar dados do PJE antes de inserir no banco
- [ ] Limitar tamanho de campos (evitar DoS)

### Auditoria
- [ ] Registrar todas as capturas em `capturas_log`
- [ ] Logar identificação de clientes (para revisão)
- [ ] Rastrear modificações em partes existentes

## Testing Strategy

### Unit Tests
- `identificarTipoParte()` com diversos cenários
- `processarParte()` com dados válidos/inválidos
- Helpers de formatação e validação

### Integration Tests
- Captura de partes de processo real (sandbox)
- Upsert de entidades duplicadas
- Criação de vínculos processo-partes

### E2E Tests
- Fluxo completo: autenticação → captura → persistência
- Verificar classificação correta de clientes
- Validar representantes criados

## Migration Path

### Fase 1: MVP (Esta Change)
- Captura sob demanda via endpoint separado
- Identificação básica via CPF
- Logs detalhados para validação

### Fase 2: Integração com Acervo
- Parâmetro opcional em `/api/captura/trt/acervo-geral`
- Captura automática de partes após salvar processo

### Fase 3: Interface de Validação
- Página para revisar classificações
- Permitir reclassificação manual (cliente ↔ parte contrária)
- Histórico de alterações

### Fase 4: Otimizações
- Processamento assíncrono (job queue)
- Cache distribuído (Redis)
- Batch processing (múltiplos processos)

## Open Technical Questions

1. **Devemos capturar representantes de terceiros?**
   - **Proposta**: Sim, terceiros também têm representantes (ex: perito)

2. **Como lidar com mudança de representação?**
   - **Proposta**: Upsert atualiza, manter histórico em `dados_pje_completo`

3. **Validação de CPF obrigatória?**
   - **Proposta**: Não bloquear se inválido, apenas logar warning

4. **Limite de partes por processo?**
   - **Proposta**: Sem limite técnico, mas alertar se >10 partes (caso suspeito)
