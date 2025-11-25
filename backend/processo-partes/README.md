# Módulo processo-partes

## Visão Geral

O módulo `processo-partes` gerencia o relacionamento N:N entre processos (tabela `acervo`) e entidades participantes (clientes, partes contrárias e terceiros). Este é um módulo fundamental do sistema que:

- Vincula processos a suas partes participantes de forma polimórfica
- Captura e armazena dados de participação vindos do PJE
- Mantém histórico completo de dados do PJE para auditoria
- Suporta múltiplas participações da mesma entidade (por grau)
- Garante ordenação consistente das partes por polo e ordem

### Características Principais

- **Relacionamento Polimórfico**: Uma parte pode ser `cliente`, `parte_contraria` ou `terceiro`
- **Unicidade por Grau**: A mesma entidade pode participar de um processo em diferentes graus (1º e 2º grau)
- **Dados do PJE**: Armazena dados completos do PJE em formato JSON para auditoria
- **Ordenação Consistente**: Mantém ordem de exibição dentro de cada polo processual

---

## Schema da Tabela `processo_partes`

A tabela `processo_partes` é a tabela de junção que representa a participação de uma entidade em um processo específico.

### Campos Obrigatórios (NOT NULL)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária auto-incremento |
| `processo_id` | `bigint` | FK para `acervo.id` (processo), cascata no delete |
| `tipo_entidade` | `text` | Tipo de entidade: `cliente`, `parte_contraria` ou `terceiro` |
| `entidade_id` | `bigint` | ID da entidade na tabela correspondente (FK polimórfica) |
| `id_pje` | `bigint` | ID da parte no PJE (idParte, obrigatório) |
| `tipo_parte` | `text` | Tipo de participante (ex: RECLAMANTE, RECLAMADO) - vem do PJE |
| `polo` | `text` | Polo processual: `ATIVO`, `PASSIVO`, `NEUTRO` ou `TERCEIRO` |
| `trt` | `text` | Código TRT (ex: "02", "03") |
| `grau` | `text` | Grau do processo: `primeiro_grau` ou `segundo_grau` |
| `numero_processo` | `text` | Número CNJ do processo |
| `principal` | `boolean` | Indica se é a parte principal no polo |
| `ordem` | `integer` | Ordem de exibição dentro do polo (0-based, >= 0) |
| `created_at` | `timestamptz` | Timestamp de criação do registro |
| `updated_at` | `timestamptz` | Timestamp da última atualização (auto-atualizado) |

### Campos Opcionais (NULL)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_pessoa_pje` | `bigint` | ID da pessoa no PJE (idPessoa, recomendado para auditoria) |
| `id_tipo_parte` | `bigint` | ID do tipo de parte no PJE |
| `status_pje` | `text` | Status da parte no PJE |
| `situacao_pje` | `text` | Situação da parte no PJE |
| `autoridade` | `boolean` | Indica se a parte é uma autoridade |
| `endereco_desconhecido` | `boolean` | Indica se o endereço é desconhecido |
| `dados_pje_completo` | `jsonb` | JSON completo do PJE para auditoria e histórico |
| `ultima_atualizacao_pje` | `timestamptz` | Timestamp da última atualização no PJE |

### Constraints e Índices

**Constraint UNIQUE:**
```sql
UNIQUE (processo_id, tipo_entidade, entidade_id, grau)
```
Garante que uma entidade aparece apenas 1x por processo/grau. A mesma entidade pode aparecer em graus diferentes (1º e 2º grau).

**Constraint CHECK:**
- `tipo_entidade IN ('cliente', 'parte_contraria', 'terceiro')`
- `tipo_parte IN ('AUTOR', 'REU', 'RECLAMANTE', ...)`
- `polo IN ('ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO')`
- `grau IN ('primeiro_grau', 'segundo_grau')`
- `ordem >= 0`

**Índices:**
- `idx_processo_partes_processo_id` - Busca por processo
- `idx_processo_partes_entidade` - Busca por entidade (tipo + id)
- `idx_processo_partes_polo` - Filtros por polo
- `idx_processo_partes_trt_grau` - Filtros por TRT e grau
- `idx_processo_partes_numero_processo` - Busca por número de processo
- `idx_processo_partes_id_pessoa_pje` - Busca por ID PJE (parcial, apenas NOT NULL)

---

## Enums e Tipos

### EntidadeTipoProcessoParte
```typescript
type EntidadeTipoProcessoParte = 'cliente' | 'parte_contraria' | 'terceiro'
```

### TipoParteProcesso
```typescript
type TipoParteProcesso =
  | 'AUTOR' | 'REU'
  | 'RECLAMANTE' | 'RECLAMADO'
  | 'EXEQUENTE' | 'EXECUTADO'
  | 'EMBARGANTE' | 'EMBARGADO'
  | 'APELANTE' | 'APELADO'
  | 'AGRAVANTE' | 'AGRAVADO'
  | 'PERITO'
  | 'MINISTERIO_PUBLICO'
  | 'ASSISTENTE'
  | 'TESTEMUNHA'
  | 'CUSTOS_LEGIS'
  | 'AMICUS_CURIAE'
  | 'OUTRO'
```

### PoloProcessoParte
```typescript
type PoloProcessoParte = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'
```

### GrauProcessoParte
```typescript
type GrauProcessoParte = 'primeiro_grau' | 'segundo_grau'
```

---

## Fluxo de Captura PJE

O fluxo de captura de partes do PJE segue estes passos:

1. **Busca de Partes no PJE**
   - Chama API do PJE (`obterPartesProcesso`) para buscar todas as partes do processo
   - Retorna array de `PartePJE` com dados completos

2. **Identificação de Tipo**
   - Analisa cada parte e identifica se é `cliente`, `parte_contraria` ou `terceiro`
   - Usa documento do advogado e representantes para classificação

3. **Upsert de Entidade**
   - Cria ou atualiza a entidade na tabela apropriada (clientes/partes_contrarias/terceiros)
   - Usa `id_pessoa_pje` como chave natural para upsert

4. **Processamento de Endereço**
   - Se a parte tiver endereço, faz upsert na tabela `enderecos`
   - Vincula endereço à entidade

5. **Criação de Vínculo**
   - Cria registro em `processo_partes` vinculando processo à entidade
   - Define `ordem` (baseado na posição no array) e `principal` (do PJE ou false)

6. **Processamento de Representantes**
   - Para cada representante da parte, faz upsert na tabela `representantes`
   - Processa endereços dos representantes

### Garantias de Dados Obrigatórios

**Campos `principal` e `ordem` são OBRIGATÓRIOS:**
- Se o PJE não retornar `principal`, usa `false` como default
- `ordem` é sempre definido com base no índice da parte no array (0-based)
- Se valores não forem fornecidos, a operação **falhará** com erro de validação

---

## Principais Funções do Serviço de Persistência

### `criarProcessoParte(params)`
Cria um novo vínculo entre processo e entidade.

**Parâmetros obrigatórios:**
- `processo_id`, `tipo_entidade`, `entidade_id`
- `id_pje`, `trt`, `grau`, `numero_processo`
- `tipo_parte`, `polo`
- `principal`, `ordem` (**obrigatórios**)

**Retorno:**
```typescript
{
  success: boolean;
  data?: ProcessoParte;
  error?: string;
}
```

### `buscarPartesPorProcesso(params)`
Busca todas as partes de um processo com dados completos da entidade (JOIN polimórfico).

**Parâmetros:**
- `processo_id` (obrigatório)
- `polo` (opcional, filtra por polo específico)

**Retorno:** Array de `ParteComDadosCompletos` ordenado por `polo` e `ordem`.

### `buscarProcessosPorEntidade(params)`
Busca todos os processos de uma entidade com dados do processo.

**Parâmetros:**
- `tipo_entidade` (obrigatório)
- `entidade_id` (obrigatório)

**Retorno:** Array de `ProcessoComParticipacao` ordenado por `created_at DESC`.

### `atualizarProcessoParte(params)`
Atualiza um vínculo existente.

**Restrições:**
- Não permite alterar campos da UNIQUE constraint (`processo_id`, `tipo_entidade`, `entidade_id`, `grau`)
- Valida tipos e valores (ex: `ordem >= 0`)

### `vincularParteProcesso(params)`
Alias semântico para `criarProcessoParte` - usado pelo fluxo de captura.

### `desvincularParteProcesso(params)`
Remove um vínculo processo-parte.

**Parâmetros:**
- `id` - ID do vínculo em `processo_partes`

---

## Tratamento de Erros

### Erros de Validação
O serviço valida todos os campos obrigatórios e retorna mensagens específicas:

```typescript
{
  success: false,
  error: 'tipo_entidade inválido (deve ser cliente, parte_contraria ou terceiro)'
}
```

**Validações realizadas:**
- Campos obrigatórios presentes
- Tipos de enum válidos (`tipo_entidade`, `tipo_parte`, `polo`, `grau`)
- Valor de `ordem >= 0`
- **IMPORTANTE:** `principal` e `ordem` devem ser fornecidos (não podem ser `undefined` ou `null`)

### Erros de Banco de Dados

| Código | Descrição | Mensagem |
|--------|-----------|----------|
| `23503` | Foreign key inválida | "Processo ou entidade não encontrada (FK inválida)" |
| `23505` | Violação de UNIQUE constraint | "Vínculo duplicado para esta entidade neste processo/grau" |
| `23514` | Violação de CHECK constraint | "Valor inválido em campo com constraint CHECK" |

### Logging
Todos os erros são logados com contexto completo:
```typescript
console.error('[PROCESSO-PARTES] Erro ao criar vínculo:', {
  processo_id,
  tipo_entidade,
  entidade_id,
  grau,
  error: errorMessage
});
```

---

## Exemplos de Código

### Criar Vínculo de Cliente a Processo

```typescript
import { criarProcessoParte } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const result = await criarProcessoParte({
  processo_id: 123,
  tipo_entidade: 'cliente',
  entidade_id: 456,
  id_pje: 789,
  id_pessoa_pje: 101112,
  tipo_parte: 'RECLAMANTE',
  polo: 'ATIVO',
  trt: '02',
  grau: 'primeiro_grau',
  numero_processo: '0000123-45.2024.5.02.0001',
  principal: true,
  ordem: 0,
  dados_pje_completo: { /* dados do PJE */ }
});

if (result.success) {
  console.log('Vínculo criado:', result.data);
} else {
  console.error('Erro:', result.error);
}
```

### Buscar Todas as Partes Ativas de um Processo

```typescript
import { buscarPartesPorProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const partesAtivas = await buscarPartesPorProcesso({
  processo_id: 123,
  polo: 'ATIVO'
});

// partesAtivas contém array de ParteComDadosCompletos com nome, CPF, emails, etc.
```

### Buscar Todos os Processos de um Cliente

```typescript
import { buscarProcessosPorEntidade } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const processos = await buscarProcessosPorEntidade({
  tipo_entidade: 'cliente',
  entidade_id: 456
});

// processos contém array de ProcessoComParticipacao com numero_processo, trt, tipo_parte, etc.
```

### Atualizar Ordem de Exibição das Partes

```typescript
import { atualizarProcessoParte } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const result = await atualizarProcessoParte({
  id: 789, // ID do vínculo
  ordem: 1, // Nova ordem
  principal: false
});

if (result.success) {
  console.log('Ordem atualizada');
} else {
  console.error('Erro:', result.error);
}
```

---

## Referências

- **Migração:** `supabase/migrations/20251127000000_create_processo_partes.sql`
- **Tipos:** `backend/types/partes/processo-partes-types.ts`
- **Serviço de Persistência:** `backend/processo-partes/services/persistence/processo-partes-persistence.service.ts`
- **Serviço de Captura:** `backend/captura/services/partes/partes-capture.service.ts`
