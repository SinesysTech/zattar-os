# Exemplos de Contratos

<cite>
**Arquivos Referenciados neste Documento**   
- [swagger.config.ts](file://swagger.config.ts)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [contrato-processo-persistence.service.ts](file://backend/contratos/services/persistence/contrato-processo-persistence.service.ts)
- [route.ts](file://app/api/contratos/route.ts)
- [route.ts](file://app/api/contratos/[id]/route.ts)
- [route.ts](file://app/api/contratos/[id]/processos/route.ts)
- [route.ts](file://app/api/contratos/[id]/processos/[processoId]/route.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Listar Todos os Contratos](#listar-todos-os-contratos)
3. [Criar um Novo Contrato](#criar-um-novo-contrato)
4. [Buscar Contrato por ID](#buscar-contrato-por-id)
5. [Listar Processos Associados a um Contrato](#listar-processos-associados-a-um-contrato)
6. [Testar Endpoints no Swagger UI e Postman](#testar-endpoints-no-swagger-ui-e-postman)
7. [Tratamento de Erros Comuns](#tratamento-de-erros-comuns)

## Introdução
Este documento fornece exemplos práticos de uso da API para operações relacionadas a contratos, incluindo listagem, criação, busca por ID e gerenciamento de processos associados. Os exemplos demonstram o uso de diferentes métodos HTTP (GET, POST, PATCH, DELETE) e métodos de autenticação (Bearer, Session e API Key). Os padrões de URL, parâmetros de consulta para paginação e filtragem, e o formato esperado para a associação de processos são detalhados com base nos schemas definidos no arquivo `swagger.config.ts`.

**Seção fontes**
- [swagger.config.ts](file://swagger.config.ts#L1-L212)

## Listar Todos os Contratos
O endpoint `GET /api/contratos` permite listar todos os contratos com suporte a paginação, filtros e ordenação. A resposta inclui metadados de paginação como total de registros, número da página atual e total de páginas.

### Exemplo com cURL (Bearer Token)
```bash
curl -X GET "http://localhost:3000/api/contratos?pagina=1&limite=10&areaDireito=trabalhista&status=contratado" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### Exemplo com cURL (Session Auth)
```bash
curl -X GET "http://localhost:3000/api/contratos?busca=observações&clienteId=5" \
  -H "Cookie: sb-access-token=<seu-token-de-sessão>"
```

### Exemplo com cURL (API Key)
```bash
curl -X GET "http://localhost:3000/api/contratos?tipoContrato=ajuizamento&responsavelId=3" \
  -H "x-service-api-key: <sua-api-key>"
```

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "contratos": [
      {
        "id": 1,
        "areaDireito": "trabalhista",
        "tipoContrato": "ajuizamento",
        "tipoCobranca": "pro_exito",
        "clienteId": 5,
        "poloCliente": "autor",
        "parteContrariaId": 8,
        "parteAutora": null,
        "parteRe": null,
        "qtdeParteAutora": 1,
        "qtdeParteRe": 1,
        "status": "contratado",
        "dataContratacao": "2024-01-15",
        "dataAssinatura": "2024-01-16",
        "dataDistribuicao": null,
        "dataDesistencia": null,
        "responsavelId": 3,
        "createdBy": 1,
        "observacoes": "Contrato de ajuizamento inicial",
        "dadosAnteriores": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-16T14:20:00.000Z"
      }
    ],
    "total": 1,
    "pagina": 1,
    "limite": 10,
    "totalPaginas": 1
  }
}
```

**Seção fontes**
- [route.ts](file://app/api/contratos/route.ts#L102-L135)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts#L463-L523)

## Criar um Novo Contrato
O endpoint `POST /api/contratos` permite criar um novo contrato no sistema. O corpo da requisição deve conter os dados obrigatórios definidos no schema `ContratoDados`.

### Corpo da Requisição
```json
{
  "areaDireito": "trabalhista",
  "tipoContrato": "ajuizamento",
  "tipoCobranca": "pro_exito",
  "clienteId": 5,
  "poloCliente": "autor",
  "parteContrariaId": 8,
  "status": "em_contratacao",
  "dataContratacao": "2024-01-15",
  "responsavelId": 3,
  "observacoes": "Novo contrato de ajuizamento"
}
```

### Exemplo com cURL (Bearer Token)
```bash
curl -X POST "http://localhost:3000/api/contratos" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
  "areaDireito": "trabalhista",
  "tipoContrato": "ajuizamento",
  "tipoCobranca": "pro_exito",
  "clienteId": 5,
  "poloCliente": "autor",
  "parteContrariaId": 8,
  "status": "em_contratacao",
  "dataContratacao": "2024-01-15",
  "responsavelId": 3,
  "observacoes": "Novo contrato de ajuizamento"
}'
```

### Resposta Esperada (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "areaDireito": "trabalhista",
    "tipoContrato": "ajuizamento",
    "tipoCobranca": "pro_exito",
    "clienteId": 5,
    "poloCliente": "autor",
    "parteContrariaId": 8,
    "parteAutora": null,
    "parteRe": null,
    "qtdeParteAutora": 1,
    "qtdeParteRe": 1,
    "status": "em_contratacao",
    "dataContratacao": "2024-01-15",
    "dataAssinatura": null,
    "dataDistribuicao": null,
    "dataDesistencia": null,
    "responsavelId": 3,
    "createdBy": 1,
    "observacoes": "Novo contrato de ajuizamento",
    "dadosAnteriores": null,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Seção fontes**
- [route.ts](file://app/api/contratos/route.ts#L138-L185)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts#L197-L300)

## Buscar Contrato por ID
O endpoint `GET /api/contratos/{id}` retorna os dados completos de um contrato específico com base no ID fornecido.

### Exemplo com cURL
```bash
curl -X GET "http://localhost:3000/api/contratos/1" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### Resposta Esperada (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "areaDireito": "trabalhista",
    "tipoContrato": "ajuizamento",
    "tipoCobranca": "pro_exito",
    "clienteId": 5,
    "poloCliente": "autor",
    "parteContrariaId": 8,
    "parteAutora": null,
    "parteRe": null,
    "qtdeParteAutora": 1,
    "qtdeParteRe": 1,
    "status": "contratado",
    "dataContratacao": "2024-01-15",
    "dataAssinatura": "2024-01-16",
    "dataDistribuicao": null,
    "dataDesistencia": null,
    "responsavelId": 3,
    "createdBy": 1,
    "observacoes": "Contrato de ajuizamento inicial",
    "dadosAnteriores": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

### Resposta de Erro (404 Not Found)
```json
{
  "error": "Contrato não encontrado"
}
```

**Seção fontes**
- [route.ts](file://app/api/contratos/[id]/route.ts#L73-L105)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts#L441-L458)

## Listar Processos Associados a um Contrato
Os endpoints relacionados a processos permitem listar, associar e remover processos vinculados a um contrato.

### Listar Processos (GET)
```bash
curl -X GET "http://localhost:3000/api/contratos/1/processos?pagina=1&limite=5" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

#### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "itens": [
      {
        "id": 1,
        "contratoId": 1,
        "processoId": 101,
        "createdAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "total": 1,
    "pagina": 1,
    "limite": 5,
    "totalPaginas": 1
  }
}
```

### Associar Processo (POST)
```bash
curl -X POST "http://localhost:3000/api/contratos/1/processos" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
  "processoId": 102
}'
```

#### Resposta Esperada (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "contratoId": 1,
    "processoId": 102,
    "createdAt": "2024-01-15T11:15:00.000Z"
  }
}
```

### Remover Processo (DELETE)
```bash
curl -X DELETE "http://localhost:3000/api/contratos/1/processos/101" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

#### Resposta Esperada (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contratoId": 1,
    "processoId": 101,
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Seção fontes**
- [route.ts](file://app/api/contratos/[id]/processos/route.ts#L84-L168)
- [route.ts](file://app/api/contratos/[id]/processos/[processoId]/route.ts#L43-L84)
- [contrato-processo-persistence.service.ts](file://backend/contratos/services/persistence/contrato-processo-persistence.service.ts#L57-L193)

## Testar Endpoints no Swagger UI e Postman

### Swagger UI
1. Acesse `http://localhost:3000/docs` para visualizar a documentação interativa
2. Clique em "Authorize" para configurar seu método de autenticação:
   - **Bearer Auth**: Insira seu token JWT
   - **Session Auth**: Insira seu token de sessão no cookie `sb-access-token`
   - **Service API Key**: Insira sua chave no header `x-service-api-key`
3. Expanda os endpoints da categoria "Contratos" para testar as operações
4. Preencha os parâmetros e corpos de requisição conforme necessário
5. Clique em "Try it out" para executar a requisição

### Postman
1. Importe a coleção OpenAPI do arquivo `openapi.json`
2. Configure as variáveis de ambiente para armazenar seus tokens de autenticação
3. Para autenticação Bearer:
   - Vá para a aba "Authorization"
   - Selecione "Bearer Token"
   - Insira seu token JWT
4. Para autenticação por API Key:
   - Selecione "API Key" como tipo
   - Nome: `x-service-api-key`
   - Valor: `<sua-chave-api>`
   - Localização: Header
5. Utilize a função "Runner" para executar sequências de testes automatizados

**Seção fontes**
- [swagger.config.ts](file://swagger.config.ts#L25-L45)

## Tratamento de Erros Comuns

### Erro 404 (Contrato Não Encontrado)
Ocorre quando o ID do contrato não existe no sistema.

**Exemplo de Resposta:**
```json
{
  "error": "Contrato não encontrado"
}
```

**Solução:**
- Verifique se o ID fornecido está correto
- Liste todos os contratos para confirmar a existência do registro
- Valide se o usuário tem permissão para acessar o contrato

### Erro 400 (Dados Inválidos)
Ocorre quando os dados fornecidos na requisição são inválidos ou campos obrigatórios estão ausentes.

**Exemplo de Resposta:**
```json
{
  "error": "Missing required fields: areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente"
}
```

**Campos Obrigatórios para Criação:**
- `areaDireito`: trabalhista, civil, previdenciario, criminal, empresarial, administrativo
- `tipoContrato`: ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer
- `tipoCobranca`: pro_exito, pro_labore
- `clienteId`: ID válido do cliente
- `poloCliente`: autor, re

**Solução:**
- Verifique se todos os campos obrigatórios estão presentes
- Confirme os valores permitidos para campos enumerados
- Valide os tipos de dados (números, strings, formatos de data)

### Erro 401 (Não Autenticado)
Ocorre quando a requisição não inclui credenciais válidas de autenticação.

**Solução:**
- Inclua o header de autorização apropriado
- Para Bearer: `Authorization: Bearer <token>`
- Para API Key: `x-service-api-key: <chave>`
- Para Session: Cookie `sb-access-token=<token>`

**Seção fontes**
- [route.ts](file://app/api/contratos/route.ts#L104-L107)
- [route.ts](file://app/api/contratos/[id]/route.ts#L78-L81)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts#L204-L222)