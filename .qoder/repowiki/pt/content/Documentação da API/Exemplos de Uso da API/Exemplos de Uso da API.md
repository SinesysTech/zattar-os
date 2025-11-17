# Exemplos de Uso da API

<cite>
**Arquivos Referenciados neste Documento**   
- [contratos/route.ts](file://app/api/contratos/route.ts)
- [clientes/buscar/por-cpf/[cpf]/route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts)
- [acervo/[id]/responsavel/route.ts](file://app/api/acervo/[id]/responsavel/route.ts)
- [swagger.config.ts](file://swagger.config.ts)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts)
</cite>

## Sumário
1. [Listar Contratos](#listar-contratos)
2. [Buscar Cliente por CPF](#buscar-cliente-por-cpf)
3. [Atribuir Responsável a um Processo](#atribuir-responsável-a-um-processo)
4. [Métodos de Autenticação](#métodos-de-autenticação)
5. [Dicas para Testar a API](#dicas-para-testar-a-api)

## Listar Contratos

Este exemplo demonstra como listar contratos com filtros, paginação e ordenação. O endpoint suporta múltiplos parâmetros de consulta para refinar os resultados.

### cURL
```bash
curl -X GET "http://localhost:3000/api/contratos?pagina=1&limite=10&areaDireito=trabalhista&status=contratado" \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json"
```

### Corpo da Requisição
Não aplicável (GET sem corpo).

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "contratos": [
      {
        "id": 123,
        "areaDireito": "trabalhista",
        "tipoContrato": "ajuizamento",
        "clienteId": 456,
        "status": "contratado",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 10,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Seção fontes**
- [contratos/route.ts](file://app/api/contratos/route.ts#L15-L76)

## Buscar Cliente por CPF

Este exemplo mostra como buscar um cliente específico usando o CPF como parâmetro na URL.

### cURL
```bash
curl -X GET "http://localhost:3000/api/clientes/buscar/por-cpf/12345678900" \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json"
```

### Corpo da Requisição
Não aplicável (GET sem corpo).

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 456,
    "tipoPessoa": "pf",
    "nome": "João Silva",
    "cpf": "12345678900",
    "email": "joao.silva@email.com",
    "telefonePrimario": "+5511999998888"
  }
}
```

**Seção fontes**
- [clientes/buscar/por-cpf/[cpf]/route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts#L10-L36)

## Atribuir Responsável a um Processo

Este exemplo demonstra como atribuir um responsável a um processo no acervo usando uma requisição PATCH.

### cURL
```bash
curl -X PATCH "http://localhost:3000/api/acervo/789/responsavel" \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{"responsavelId": 15}'
```

### Corpo da Requisição
```json
{
  "responsavelId": 15
}
```

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 789,
    "responsavel_id": 15
  }
}
```

### Tratamento de Erros
Se o `responsavelId` for inválido:
```json
{
  "error": "responsavelId deve ser um número inteiro positivo ou null"
}
```

**Seção fontes**
- [acervo/[id]/responsavel/route.ts](file://app/api/acervo/[id]/responsavel/route.ts#L10-L42)

## Métodos de Autenticação

A API suporta três métodos de autenticação, conforme definido no `swagger.config.ts`.

### 1. Token Bearer (JWT)
Autenticação via token JWT no cabeçalho Authorization.

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/api/contratos" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Sessão do Supabase (Cookies)
Autenticação via cookie `sb-access-token` armazenado no navegador.

**Exemplo (usando curl com cookies):**
```bash
curl -X GET "http://localhost:3000/api/contratos" \
  -H "Cookie: sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. API Key de Serviço
Usado para jobs automatizados e processos agendados, enviado no cabeçalho `x-service-api-key`.

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/api/contratos" \
  -H "x-service-api-key: sua-chave-de-servico-secreta"
```

**Seção fontes**
- [swagger.config.ts](file://swagger.config.ts#L26-L44)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L44-L85)

## Dicas para Testar a API

### Usando Postman
1. Crie uma nova requisição e defina o método e URL.
2. Na aba **Headers**, adicione:
   - `Authorization: Bearer <seu-token-jwt>` ou
   - `x-service-api-key: <sua-chave-de-servico>`
3. Para requisições POST/PATCH, use a aba **Body** com formato JSON.
4. Salve a requisição em uma coleção para reutilização.

### Usando Swagger UI
1. Acesse `http://localhost:3000/docs` no navegador.
2. Clique em **Authorize** e insira seu token JWT.
3. Expanda qualquer endpoint e clique em **Try it out**.
4. Preencha os parâmetros e corpo conforme necessário.
5. Clique em **Execute** para enviar a requisição.

### Padrões de URL
- Todos os endpoints seguem o padrão: `/api/{recurso}/{id?}/{subrecurso?}`
- Parâmetros de caminho (path) são obrigatórios (ex: `/api/clientes/123`)
- Parâmetros de consulta (query) são opcionais (ex: `?pagina=1&limite=10`)

### Boas Práticas
- Sempre valide os códigos de status HTTP:
  - `200`: Sucesso em GET/PUT/PATCH
  - `201`: Recurso criado com sucesso (POST)
  - `400`: Dados inválidos
  - `401`: Não autenticado
  - `404`: Recurso não encontrado
  - `500`: Erro interno do servidor
- Use `try/catch` em chamadas à API para tratar erros de rede.
- Armazene tokens de forma segura (nunca em código-fonte).

**Seção fontes**
- [swagger.config.ts](file://swagger.config.ts#L15-L23)
- [contratos/route.ts](file://app/api/contratos/route.ts#L21-L24)
- [clientes/buscar/por-cpf/[cpf]/route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts#L16-L19)