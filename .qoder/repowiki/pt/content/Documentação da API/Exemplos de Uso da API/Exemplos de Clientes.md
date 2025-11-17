# Exemplos de Clientes

<cite>
**Arquivos Referenciados neste Documento**   
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [clientes/[id]/route.ts](file://app/api/clientes/[id]/route.ts)
- [clientes/buscar/por-cpf/[cpf]/route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts)
- [clientes/buscar/por-cnpj/[cnpj]/route.ts](file://app/api/clientes/buscar/por-cnpj/[cnpj]/route.ts)
- [swagger.config.ts](file://swagger.config.ts)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Listar Todos os Clientes](#listar-todos-os-clientes)
3. [Criar um Novo Cliente](#criar-um-novo-cliente)
4. [Buscar Cliente por CPF](#buscar-cliente-por-cpf)
5. [Buscar Cliente por CNPJ](#buscar-cliente-por-cnpj)
6. [Atualizar Dados de Cliente](#atualizar-dados-de-cliente)
7. [Autenticação](#autenticação)
8. [Testes no Swagger UI e Postman](#testes-no-swagger-ui-e-postman)
9. [Tratamento de Erros Comuns](#tratamento-de-erros-comuns)

## Introdução
Este documento fornece exemplos práticos de uso da API para operações relacionadas a clientes no sistema Sinesys. Os exemplos incluem comandos cURL completos, corpos de requisição, respostas esperadas e orientações sobre o uso de endpoints parametrizados. A documentação cobre os principais métodos de autenticação suportados e fornece dicas para testar os endpoints e tratar erros comuns.

## Listar Todos os Clientes
O endpoint `GET /api/clientes` permite listar todos os clientes do sistema com filtros opcionais.

### Exemplo com cURL
```bash
curl -X GET "http://localhost:3000/api/clientes?pagina=1&limite=10&busca=João&tipoPessoa=pf&ativo=true" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### Parâmetros de Consulta
- **pagina**: Número da página (padrão: 1)
- **limite**: Quantidade de itens por página (padrão: 50)
- **busca**: Termo de busca em nome, nome fantasia, CPF, CNPJ ou e-mail
- **tipoPessoa**: Filtrar por tipo de pessoa (`pf` para física, `pj` para jurídica)
- **ativo**: Filtrar por status ativo/inativo (`true` ou `false`)

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "clientes": [
      {
        "id": 1,
        "tipoPessoa": "pf",
        "nome": "João Silva",
        "nomeFantasia": "João",
        "cpf": "12345678909",
        "email": "joao.silva@email.com",
        "telefonePrimario": "(11) 99999-9999",
        "ativo": true,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 1,
    "pagina": 1,
    "limite": 10,
    "totalPaginas": 1
  }
}
```

**Fontes da Seção**
- [clientes/route.ts](file://app/api/clientes/route.ts#L164-L199)

## Criar um Novo Cliente
O endpoint `POST /api/clientes` permite criar um novo cliente no sistema.

### Corpo da Requisição para Pessoa Física
```json
{
  "tipoPessoa": "pf",
  "nome": "Maria Santos",
  "nomeFantasia": "Mari",
  "cpf": "98765432100",
  "rg": "123456789",
  "dataNascimento": "1985-05-15",
  "genero": "feminino",
  "estadoCivil": "casado",
  "nacionalidade": "brasileira",
  "naturalidade": "São Paulo/SP",
  "email": "maria.santos@email.com",
  "telefonePrimario": "(11) 88888-8888",
  "telefoneSecundario": "(11) 77777-7777",
  "endereco": {
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Jardim Primavera",
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "Brasil",
    "cep": "01234567"
  },
  "observacoes": "Cliente preferencial",
  "createdBy": 1,
  "ativo": true
}
```

### Corpo da Requisição para Pessoa Jurídica
```json
{
  "tipoPessoa": "pj",
  "nome": "Empresa XYZ Ltda",
  "nomeFantasia": "XYZ",
  "cnpj": "12345678000195",
  "inscricaoEstadual": "123456789",
  "email": "contato@empresa.com",
  "telefonePrimario": "(11) 55555-5555",
  "endereco": {
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "Brasil",
    "cep": "01310000"
  },
  "observacoes": "Empresa parceira",
  "createdBy": 1,
  "ativo": true
}
```

### Exemplo com cURL
```bash
curl -X POST "http://localhost:3000/api/clientes" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoPessoa": "pf",
    "nome": "Carlos Oliveira",
    "cpf": "11122233344",
    "email": "carlos.oliveira@email.com",
    "telefonePrimario": "(11) 77777-7777"
  }'
```

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 2,
    "tipoPessoa": "pf",
    "nome": "Carlos Oliveira",
    "cpf": "11122233344",
    "email": "carlos.oliveira@email.com",
    "telefonePrimario": "(11) 77777-7777",
    "ativo": true,
    "createdAt": "2025-01-15T11:00:00Z",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

**Fontes da Seção**
- [clientes/route.ts](file://app/api/clientes/route.ts#L202-L250)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L246-L365)

## Buscar Cliente por CPF
O endpoint `GET /api/clientes/buscar/por-cpf/{cpf}` permite buscar um cliente específico pelo CPF.

### Exemplo com cURL
```bash
curl -X GET "http://localhost:3000/api/clientes/buscar/por-cpf/12345678909" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### Formato do CPF
O CPF pode ser fornecido com ou sem formatação:
- Com formatação: `123.456.789-09`
- Sem formatação: `12345678909`

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipoPessoa": "pf",
    "nome": "João Silva",
    "cpf": "12345678909",
    "email": "joao.silva@email.com",
    "telefonePrimario": "(11) 99999-9999",
    "ativo": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Fontes da Seção**
- [clientes/buscar/por-cpf/[cpf]/route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts#L37-L83)

## Buscar Cliente por CNPJ
O endpoint `GET /api/clientes/buscar/por-cnpj/{cnpj}` permite buscar um cliente específico pelo CNPJ.

### Exemplo com cURL
```bash
curl -X GET "http://localhost:3000/api/clientes/buscar/por-cnpj/12345678000195" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### Formato do CNPJ
O CNPJ pode ser fornecido com ou sem formatação:
- Com formatação: `12.345.678/0001-95`
- Sem formatação: `12345678000195`

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 3,
    "tipoPessoa": "pj",
    "nome": "Empresa ABC Ltda",
    "cnpj": "12345678000195",
    "email": "contato@empresaabc.com",
    "telefonePrimario": "(11) 66666-6666",
    "ativo": true,
    "createdAt": "2025-01-15T10:45:00Z"
  }
}
```

**Fontes da Seção**
- [clientes/buscar/por-cnpj/[cnpj]/route.ts](file://app/api/clientes/buscar/por-cnpj/[cnpj]/route.ts#L37-L83)

## Atualizar Dados de Cliente
O endpoint `PATCH /api/clientes/{id}` permite atualizar parcialmente os dados de um cliente existente.

### Corpo da Requisição
```json
{
  "nome": "João Silva Jr.",
  "email": "joao.silva.jr@email.com",
  "telefonePrimario": "(11) 98765-4321",
  "endereco": {
    "logradouro": "Avenida Brasil",
    "numero": "456",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234567"
  }
}
```

### Exemplo com cURL
```bash
curl -X PATCH "http://localhost:3000/api/clientes/1" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva.jr@email.com",
    "telefonePrimario": "(11) 98765-4321"
  }'
```

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipoPessoa": "pf",
    "nome": "João Silva",
    "cpf": "12345678909",
    "email": "joao.silva.jr@email.com",
    "telefonePrimario": "(11) 98765-4321",
    "ativo": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T11:30:00Z"
  }
}
```

**Fontes da Seção**
- [clientes/[id]/route.ts](file://app/api/clientes/[id]/route.ts#L159-L215)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L370-L521)

## Autenticação
A API suporta três métodos de autenticação:

### 1. Bearer Token (JWT)
Utilize o cabeçalho `Authorization` com o prefixo `Bearer`:
```bash
-H "Authorization: Bearer <seu-token-jwt>"
```

### 2. Sessão (Cookie)
A autenticação via sessão utiliza o cookie `sb-access-token` do Supabase. O token é automaticamente incluído nas requisições quando o usuário está autenticado.

### 3. API Key
Utilize o cabeçalho `x-service-api-key` para autenticação de serviços:
```bash
-H "x-service-api-key: <sua-api-key>"
```

**Fontes da Seção**
- [swagger.config.ts](file://swagger.config.ts#L26-L44)
- [clientes/route.ts](file://app/api/clientes/route.ts#L18-L21)

## Testes no Swagger UI e Postman

### Swagger UI
1. Acesse `http://localhost:3000/api/docs` para visualizar a documentação interativa
2. Clique no endpoint desejado
3. Clique em "Try it out"
4. Preencha os parâmetros e corpo da requisição
5. Adicione o cabeçalho de autenticação no campo "security"
6. Clique em "Execute" para enviar a requisição

### Postman
1. Crie uma nova requisição
2. Defina o método HTTP e URL
3. Na aba "Headers", adicione:
   - Chave: `Authorization`, Valor: `Bearer <seu-token-jwt>`
   - Ou Chave: `x-service-api-key`, Valor: `<sua-api-key>`
4. Na aba "Body", selecione "raw" e "JSON"
5. Insira o corpo da requisição no formato JSON
6. Clique em "Send" para executar

**Fontes da Seção**
- [swagger.config.ts](file://swagger.config.ts#L3-L212)

## Tratamento de Erros Comuns

### Erro 404 - Cliente Não Encontrado
Ocorre quando o cliente solicitado não existe no sistema.

**Exemplo de Resposta:**
```json
{
  "error": "Cliente não encontrado"
}
```

**Soluções:**
- Verifique se o ID, CPF ou CNPJ está correto
- Confirme se o cliente foi criado com sucesso anteriormente
- Valide se o cliente não foi desativado

### Erro 422 - Validação de Dados Falhou
Ocorre quando os dados fornecidos não atendem aos critérios de validação.

**Exemplos Comuns:**
- CPF inválido (deve conter 11 dígitos)
- CNPJ inválido (deve conter 14 dígitos)
- E-mail inválido
- CPF já cadastrado para outro cliente
- CNPJ já cadastrado para outro cliente

**Exemplo de Resposta:**
```json
{
  "error": "CPF inválido (deve conter 11 dígitos)"
}
```

**Soluções:**
- Valide o formato do CPF/CNPJ antes de enviar
- Verifique se o e-mail está no formato correto
- Confirme se o CPF/CNPJ já não está cadastrado
- Para pessoas físicas, o CPF é obrigatório
- Para pessoas jurídicas, o CNPJ é obrigatório

### Outros Erros
- **400 Bad Request**: Dados inválidos ou campos obrigatórios ausentes
- **401 Unauthorized**: Token inválido, expirado ou ausente
- **500 Internal Server Error**: Erro interno do servidor

**Fontes da Seção**
- [clientes/route.ts](file://app/api/clientes/route.ts#L169-L172)
- [clientes/[id]/route.ts](file://app/api/clientes/[id]/route.ts#L118-L121)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L253-L312)