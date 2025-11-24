UNIQUE (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)
```
Garante que um representante único atue por contexto completo (parte + processo). Mesmo representante pode atuar em múltiplos processos (registros separados).

### Discriminated Union
O campo `tipo_pessoa` ('pf' | 'pj') determina quais campos são obrigatórios:
- **PF**: `cpf` obrigatório, `cnpj` sempre null
- **PJ**: `cnpj` obrigatório, `cpf` sempre null

### Relação Polimórfica
- `parte_tipo` + `parte_id`: aponta para tabelas `clientes`, `partes_contrarias` ou `terceiros`
- Permite representantes atuarem para diferentes tipos de partes

### FK Opcional
- `endereco_id`: FK para tabela `enderecos` (opcional, pode ser null)

## Operações CRUD

### `criarRepresentante()`
Cria novo representante com validações completas:
- Campos obrigatórios: `id_pessoa_pje`, `parte_tipo`, `parte_id`, `trt`, `grau`, `numero_processo`, `tipo_pessoa`, `nome`
- CPF/CNPJ: validado baseado em `tipo_pessoa`
- OAB: formato válido se informado
- Email: formato RFC 5322 se informado
- Retorna: `{ sucesso: true, representante }` ou `{ sucesso: false, erro }`

### `atualizarRepresentante()`
Atualiza representante existente:
- Campos imutáveis: `tipo_pessoa`, `parte_tipo`, `parte_id` (não podem ser alterados)
- Valida CPF/CNPJ/OAB/email apenas se fornecidos
- Popula `dados_anteriores` com estado anterior do registro (para auditoria)
- Retorna: `{ sucesso: true, representante }` ou `{ sucesso: false, erro }`

### `buscarRepresentantePorId()`
Busca representante por ID primário:
- Retorna: `Representante` (PF ou PJ) ou `null`

### `deletarRepresentante()`
Remove representante:
- Cuidado: verificar FKs em outras tabelas antes de deletar
- Retorna: `{ sucesso: true }` ou `{ sucesso: false, erro }`

### `upsertRepresentantePorIdPessoa()`
Upsert idempotente baseado na chave composta completa:
- Busca por `(id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)`
- Cria se não existe, atualiza se existe
- Usado na captura de dados do PJE-TRT

## Validações

### CPF
- 11 dígitos numéricos
- Dígitos verificadores válidos
- Rejeita sequências idênticas (ex: "11111111111")

### CNPJ
- 14 dígitos numéricos
- Dígitos verificadores válidos
- Rejeita sequências idênticas (ex: "00000000000000")

### OAB
- Formato: `UF` (2 letras) + 3-6 dígitos (ex: "MG123456")
- UF validada contra lista de estados brasileiros
- Exemplo válido: "SP123456", "RJ98765"

### Email
- Formato RFC 5322 simplificado: `user@domain.tld`
- Exemplo válido: "advogado@email.com"

## Queries Especializadas

### `buscarRepresentantesPorParte()`
Lista representantes de uma parte específica:
- Parâmetros: `parte_tipo`, `parte_id`, `trt?`, `grau?`
- Ordenação: `ordem ASC`, `nome ASC`

### `buscarRepresentantesPorOAB()`
Busca por número OAB:
- Pode retornar múltiplos registros (representante atua em vários processos)
- Filtros opcionais: `trt`, `grau`

### `buscarRepresentantesPorProcesso()`
Lista todos representantes de um processo:
- Parâmetros obrigatórios: `trt`, `grau`, `numero_processo`
- Ordenação: `parte_tipo ASC`, `ordem ASC`

### `listarRepresentantes()`
Listagem com paginação e filtros:
- Paginação: `pagina`, `limite` (default 50, max 100)
- Filtros: `parte_tipo`, `parte_id`, `trt`, `grau`, `numero_processo`, `numero_oab`, `tipo_pessoa`, `busca`
- Busca textual: nome, CPF, CNPJ, email
- Ordenação: `nome`, `numero_oab`, `situacao_oab`, `created_at`, `data_habilitacao`

## Queries com JOIN

### `buscarRepresentanteComEndereco()`
Busca representante com endereço populado:
- LEFT JOIN com `enderecos`
- Retorna: `RepresentanteComEndereco` (endereco pode ser null)

### `listarRepresentantesComEndereco()`
Listagem com endereços populados:
- LEFT JOIN + paginação
- Mesmo filtros da `listarRepresentantes()`

## Tratamento de Erros

### Código 23505 (UNIQUE violation)
"Representante já cadastrado para esta parte neste processo"
- Violação da constraint UNIQUE na chave composta

### Código 23503 (FK violation)
"Parte não encontrada"
- `parte_id` não existe na tabela referenciada por `parte_tipo`

### Código 23502 (NOT NULL violation)
"Campo obrigatório não informado"
- Campo NOT NULL não foi fornecido

### Código 23514 (CHECK violation)
"Valor inválido para campo"
- Valor não atende às restrições CHECK (ex: `tipo_pessoa` não é 'pf'/'pj')

## Casos de Uso

### Captura de Partes
- Upsert de representantes ao processar partes do PJE-TRT
- Garante idempotência mesmo com reprocessamentos

### Listagem de Advogados de um Cliente
```typescript
buscarRepresentantesPorParte({
  parte_tipo: 'cliente',
  parte_id: clienteId
})
```

### Busca de Processos de um Advogado
```typescript
buscarRepresentantesPorOAB({
  numero_oab: 'MG123456'
})
```

### Auditoria de Mudanças
- Consultar `dados_anteriores` para ver estado anterior do registro
- Permite rastrear alterações históricas

## Exemplos de Código

### Criar Representante PF (Advogado)
```typescript
const result = await criarRepresentante({
  id_pessoa_pje: 12345,
  parte_tipo: 'cliente',
  parte_id: 1,
  trt: '3',
  grau: '1',
  numero_processo: '0012345-67.2023.5.03.0001',
  tipo_pessoa: 'pf',
  nome: 'João Silva',
  cpf: '12345678901',
  numero_oab: 'MG123456',
  situacao_oab: 'REGULAR',
  email: 'joao.silva@advocacia.com'
});
```

### Criar Representante PJ (Escritório)
```typescript
const result = await criarRepresentante({
  id_pessoa_pje: 67890,
  parte_tipo: 'parte_contraria',
  parte_id: 2,
  trt: '15',
  grau: '2',
  numero_processo: '0012345-67.2023.5.15.0001',
  tipo_pessoa: 'pj',
  nome: 'Silva & Associados',
  cnpj: '12345678000123',
  razao_social: 'Silva & Associados Advogados Ltda'
});
```

### Upsert Idempotente (Captura)
```typescript
const result = await upsertRepresentantePorIdPessoa({
  id_pessoa_pje: 12345,
  parte_tipo: 'cliente',
  parte_id: 1,
  trt: '3',
  grau: '1',
  numero_processo: '0012345-67.2023.5.03.0001',
  tipo_pessoa: 'pf',
  nome: 'João Silva',
  cpf: '12345678901'
});
// Cria se não existe, atualiza se existe
```

### Buscar Representantes de um Processo
```typescript
const representantes = await buscarRepresentantesPorProcesso({
  trt: '3',
  grau: '1',
  numero_processo: '0012345-67.2023.5.03.0001'
});
```

### Listar com Paginação e Filtros
```typescript
const result = await listarRepresentantes({
  pagina: 1,
  limite: 20,
  parte_tipo: 'cliente',
  busca: 'Silva',
  ordenar_por: 'nome',
  ordem: 'asc'
});
// Retorna: { representantes, total, pagina, limite, totalPaginas }