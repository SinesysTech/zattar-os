# Regras de Negócio - Contratos

## Contexto

Módulo para gestão de contratos jurídicos do escritório. Gerencia contratação de serviços jurídicos (ajuizamento, defesa, assessoria, etc.) com diferentes modalidades de cobrança (pró-êxito, pró-labore).

## Entidades Principais

- **Contrato**: Representa um contrato jurídico com cliente
- **ParteContrato**: Estrutura JSONB para partes envolvidas (autor/réu)

## Regras de Validação

### Campos Obrigatórios

- `tipoContrato`: Tipo de serviço contratado
- `tipoCobranca`: Modalidade de cobrança (pró-êxito ou pró-labore)
- `clienteId`: Cliente contratante (deve existir)
- `poloCliente`: Polo processual do cliente (autor ou réu)
- `dataContratacao`: Data de contratação (default: data atual)
- `status`: Status do contrato (default: em_contratacao)

### Tipos de Contrato

| Valor | Label | Descrição |
|-------|-------|-----------|
| `ajuizamento` | Ajuizamento | Propositura de ação judicial |
| `defesa` | Defesa | Defesa em processo existente |
| `ato_processual` | Ato Processual | Ato processual específico |
| `assessoria` | Assessoria | Assessoria jurídica contínua |
| `consultoria` | Consultoria | Consultoria pontual |
| `extrajudicial` | Extrajudicial | Atuação extrajudicial |
| `parecer` | Parecer | Emissão de parecer jurídico |

### Tipos de Cobrança

| Valor | Label | Descrição |
|-------|-------|-----------|
| `pro_exito` | Pró-Êxito | Honorários vinculados ao resultado |
| `pro_labore` | Pró-Labore | Honorários fixos por trabalho |

### Status do Contrato

| Valor | Label | Descrição |
|-------|-------|-----------|
| `em_contratacao` | Em Contratação | Contrato em negociação |
| `contratado` | Contratado | Contrato firmado |
| `distribuido` | Distribuído | Processo distribuído (se aplicável) |
| `desistencia` | Desistência | Cliente desistiu do contrato |

## Regras de Negócio

### Criação de Contrato

1. Cliente deve existir no sistema
2. Se `parteContrariaId` fornecido, parte contrária deve existir
3. Status inicial: `em_contratacao`
4. Data de contratação padrão: data atual
5. Quantidades padrão: `qtdeParteAutora=1`, `qtdeParteRe=1`

### Atualização de Contrato

1. Contrato deve existir
2. Se alterar `clienteId`, novo cliente deve existir
3. Se alterar `parteContrariaId`, nova parte contrária deve existir
4. Estado anterior preservado em `dadosAnteriores` para auditoria

### Partes JSONB

- Array de objetos com `tipo`, `id` e `nome`
- Validação automática de estrutura
- Atualização de quantidades baseada no array

```typescript
interface ParteContrato {
  tipo: 'cliente' | 'parte_contraria';
  id: number;
  nome: string;
}
```

## Fluxos Especiais

### Integração com Financeiro

1. Contratos geram lançamentos financeiros
2. Tipo de cobrança determina forma de recebimento
3. Pró-êxito: Recebimento vinculado a resultado
4. Pró-labore: Recebimento fixo mensal/pontual

### Vinculação a Processo

1. Contrato pode gerar processo judicial
2. Status muda para `distribuido` após distribuição
3. Dados do contrato alimentam dados do processo

## Filtros Disponíveis

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `segmentoId` | number | Filtrar por segmento jurídico |
| `tipoContrato` | enum | Filtrar por tipo de contrato |
| `tipoCobranca` | enum | Filtrar por modalidade de cobrança |
| `status` | enum | Filtrar por status |
| `clienteId` | number | Filtrar por cliente |
| `parteContrariaId` | number | Filtrar por parte contrária |
| `responsavelId` | number | Filtrar por advogado responsável |
| `busca` | string | Busca em observações |

### Ordenação

Campos disponíveis para ordenação:
- `id`
- `data_contratacao`
- `status`
- `segmento_id`
- `tipo_contrato`
- `created_at`
- `updated_at`

## Restrições de Acesso

- Apenas advogados e administradores podem criar contratos
- Responsável pode editar contratos sob sua responsabilidade
- Dados financeiros requerem permissão especial

## Integrações

### Módulos Internos

- **Financeiro**: Geração de lançamentos a receber
- **Processos**: Vinculação após distribuição
- **Partes**: Validação de cliente e parte contrária
- **Segmentos**: Categorização por área do direito

### Sistema de IA

- Indexação para busca semântica via pgvector
- Exposição de actions como ferramentas MCP
- Contexto de regras de negócio para agentes

## Revalidação de Cache

Após mutações, revalidar:

```typescript
revalidatePath('/contratos');           // Lista de contratos
revalidatePath('/contratos/[id]');      // Detalhe do contrato
revalidatePath('/financeiro');          // Módulo financeiro
```

## Schemas de Validação

### Criação (createContratoSchema)

```typescript
{
  segmentoId: number | null,      // opcional
  tipoContrato: TipoContrato,     // obrigatório
  tipoCobranca: TipoCobranca,     // obrigatório
  clienteId: number,              // obrigatório
  poloCliente: PoloProcessual,    // obrigatório
  parteContrariaId?: number,
  parteAutora?: ParteContrato[],
  parteRe?: ParteContrato[],
  qtdeParteAutora?: number,       // default: 1
  qtdeParteRe?: number,           // default: 1
  status?: StatusContrato,        // default: 'em_contratacao'
  dataContratacao?: string,       // default: hoje
  dataAssinatura?: string,
  dataDistribuicao?: string,
  dataDesistencia?: string,
  responsavelId?: number,
  createdBy?: number,
  observacoes?: string,           // max: 5000 chars
}
```

### Atualização (updateContratoSchema)

Todos os campos são opcionais (partial update).

## Erros Comuns

| Código | Mensagem | Causa |
|--------|----------|-------|
| `NOT_FOUND` | Cliente não encontrado | clienteId inválido |
| `NOT_FOUND` | Parte contrária não encontrada | parteContrariaId inválido |
| `NOT_FOUND` | Contrato não encontrado | ID inexistente |
| `VALIDATION_ERROR` | Dados inválidos | Schema Zod falhou |
| `DATABASE_ERROR` | Erro de banco | Falha na persistência |
