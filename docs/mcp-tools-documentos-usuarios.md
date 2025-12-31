# Tools MCP - Documentos e Usuários

Documentação técnica das ferramentas (tools) MCP disponíveis para os módulos de **Documentos** e **Usuários**.

## Índice

- [Documentos](#documentos)
  - [listar_documentos](#listar_documentos)
  - [buscar_documento_por_tags](#buscar_documento_por_tags)
  - [listar_templates](#listar_templates)
  - [usar_template](#usar_template)
  - [listar_categorias_templates](#listar_categorias_templates)
  - [listar_templates_mais_usados](#listar_templates_mais_usados)
- [Usuários](#usuários)
  - [listar_usuarios](#listar_usuarios)
  - [buscar_usuario_por_email](#buscar_usuario_por_email)
  - [buscar_usuario_por_cpf](#buscar_usuario_por_cpf)
  - [listar_permissoes_usuario](#listar_permissoes_usuario)

---

## Documentos

### listar_documentos

**Descrição**: Lista documentos do sistema com filtros por pasta, tags e busca textual.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `limite` | number | Não | 20 | Número máximo de documentos a retornar (1-100) |
| `offset` | number | Não | 0 | Offset para paginação |
| `pasta_id` | number | Não | - | Filtrar documentos por pasta específica |
| `tags` | string[] | Não | - | Filtrar documentos por tags |
| `busca` | string | Não | - | Busca textual por título ou conteúdo |

**Exemplo de uso**:

```json
{
  "name": "listar_documentos",
  "arguments": {
    "limite": 10,
    "pasta_id": 1,
    "tags": ["contrato", "trabalhista"]
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "documentos": [...],
    "total": 42
  }
}
```

---

### buscar_documento_por_tags

**Descrição**: Busca documentos por tags específicas.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `tags` | string[] | Sim | - | Array de tags para buscar (mínimo 1 tag) |
| `limite` | number | Não | 20 | Número máximo de documentos (1-100) |

**Exemplo de uso**:

```json
{
  "name": "buscar_documento_por_tags",
  "arguments": {
    "tags": ["urgente", "processo-123"],
    "limite": 5
  }
}
```

---

### listar_templates

**Descrição**: Lista templates de documentos disponíveis com filtros por categoria e visibilidade.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `limite` | number | Não | 20 | Número máximo de templates (1-100) |
| `offset` | number | Não | 0 | Offset para paginação |
| `categoria` | string | Não | - | Filtrar por categoria |
| `visibilidade` | enum | Não | - | Filtrar por visibilidade: `"publico"` ou `"privado"` |
| `busca` | string | Não | - | Busca textual por título |

**Exemplo de uso**:

```json
{
  "name": "listar_templates",
  "arguments": {
    "limite": 10,
    "categoria": "peticao",
    "visibilidade": "publico"
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "titulo": "Petição Inicial - Trabalhista",
        "categoria": "peticao",
        "visibilidade": "publico"
      }
    ],
    "total": 15
  }
}
```

---

### usar_template

**Descrição**: Cria novo documento a partir de um template existente.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `template_id` | number | Sim | - | ID do template a usar |
| `titulo` | string | Não | - | Título do novo documento (opcional) |
| `pasta_id` | number \| null | Não | - | ID da pasta destino (`null` para raiz) |

**Exemplo de uso**:

```json
{
  "name": "usar_template",
  "arguments": {
    "template_id": 5,
    "titulo": "Nova Petição Inicial",
    "pasta_id": 3
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "documento_id": 42,
    "titulo": "Nova Petição Inicial",
    "pasta_id": 3
  }
}
```

---

### listar_categorias_templates

**Descrição**: Lista todas as categorias de templates disponíveis.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**: Nenhum

**Exemplo de uso**:

```json
{
  "name": "listar_categorias_templates",
  "arguments": {}
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "categorias": [
      "peticao",
      "contrato",
      "recurso",
      "parecer"
    ]
  }
}
```

---

### listar_templates_mais_usados

**Descrição**: Lista os templates mais utilizados no sistema.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `limite` | number | Não | 10 | Número de templates a retornar (1-50) |

**Exemplo de uso**:

```json
{
  "name": "listar_templates_mais_usados",
  "arguments": {
    "limite": 5
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "titulo": "Petição Inicial - Trabalhista",
        "usos": 142
      },
      {
        "id": 3,
        "titulo": "Contrato de Prestação de Serviços",
        "usos": 98
      }
    ]
  }
}
```

---

## Usuários

### listar_usuarios

**Descrição**: Lista usuários do sistema com filtros por busca, status ativo e cargo.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `limite` | number | Não | 20 | Número máximo de usuários (1-100) |
| `offset` | number | Não | 0 | Offset para paginação |
| `busca` | string | Não | - | Busca por nome, email ou CPF |
| `ativo` | boolean | Não | - | Filtrar por status ativo/inativo |
| `cargoId` | number | Não | - | Filtrar por cargo |

**Exemplo de uso**:

```json
{
  "name": "listar_usuarios",
  "arguments": {
    "limite": 10,
    "ativo": true,
    "cargoId": 2
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "usuarios": [...],
    "total": 25
  }
}
```

---

### buscar_usuario_por_email

**Descrição**: Busca usuário específico por endereço de email corporativo.

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `email` | string | Sim | - | Email corporativo do usuário (formato válido) |

**Exemplo de uso**:

```json
{
  "name": "buscar_usuario_por_email",
  "arguments": {
    "email": "joao.silva@escritorio.com.br"
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "João Silva",
    "email": "joao.silva@escritorio.com.br",
    "ativo": true
  }
}
```

**Resposta de erro (usuário não encontrado)**:

```json
{
  "success": false,
  "error": "Usuário não encontrado"
}
```

---

### buscar_usuario_por_cpf

**Descrição**: Busca usuário específico por CPF (apenas números).

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `cpf` | string | Sim | - | CPF do usuário (11 dígitos, apenas números) |

**Exemplo de uso**:

```json
{
  "name": "buscar_usuario_por_cpf",
  "arguments": {
    "cpf": "12345678901"
  }
}
```

**Validação**:
- O CPF deve ter exatamente 11 dígitos numéricos
- Regex de validação: `^\d{11}$`

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "João Silva",
    "cpf": "12345678901",
    "ativo": true
  }
}
```

---

### listar_permissoes_usuario

**Descrição**: Lista todas as permissões de um usuário específico (recursos e operações).

**Autenticação**: Obrigatória (`requiresAuth: true`)

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `usuarioId` | number | Sim | - | ID do usuário |

**Exemplo de uso**:

```json
{
  "name": "listar_permissoes_usuario",
  "arguments": {
    "usuarioId": 5
  }
}
```

**Resposta de sucesso**:

```json
{
  "success": true,
  "data": {
    "permissoes": [
      {
        "recurso": "processos",
        "operacoes": ["leitura", "escrita", "exclusao"]
      },
      {
        "recurso": "documentos",
        "operacoes": ["leitura", "escrita"]
      }
    ]
  }
}
```

---

## Notas Técnicas

### Autenticação

Todas as tools requerem autenticação (`requiresAuth: true`). Certifique-se de que o contexto de execução possui um usuário autenticado válido.

### Paginação

Tools de listagem suportam paginação através dos parâmetros `limite` e `offset`:

```json
{
  "limite": 20,
  "offset": 40
}
```

Isso retornará registros 41-60.

### Tratamento de Erros

Todas as tools seguem o padrão de resposta:

**Sucesso**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Erro**:
```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

### Validação de Schemas

Todos os parâmetros são validados com Zod antes da execução. Erros de validação retornam mensagens descritivas.

---

## Referências

- **Registry MCP**: [src/lib/mcp/registry.ts](../src/lib/mcp/registry.ts)
- **Actions Documentos**: [src/features/documentos/actions/documentos-actions.ts](../src/features/documentos/actions/documentos-actions.ts)
- **Actions Templates**: [src/features/documentos/actions/templates-actions.ts](../src/features/documentos/actions/templates-actions.ts)
- **Actions Usuários**: [src/features/usuarios/actions/usuarios-actions.ts](../src/features/usuarios/actions/usuarios-actions.ts)
- **Actions Permissões**: [src/features/usuarios/actions/permissoes-actions.ts](../src/features/usuarios/actions/permissoes-actions.ts)
