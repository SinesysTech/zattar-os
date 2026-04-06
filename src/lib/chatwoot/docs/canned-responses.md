Aqui está a formatação em **Markdown** para a página **List all Canned Responses in an Account**:

***

# **List all Canned Responses in an Account**

**Endpoint:**

    GET /api/v1/accounts/{account_id}/canned_responses

***

## **Autorização**

*   **Header:**  
    `api_access_token: <api-key>`
    *   **Tipo:** `string`
    *   **Obrigatório:** Sim
    *   **Descrição:** Token obtido na página de perfil ou via console Rails. Permite acesso aos endpoints conforme nível de permissão do usuário.
    *   Pode ser salvo por sistemas externos quando o usuário é criado via API para realizar atividades em seu nome.

***

## **Parâmetros**

*   **Path Parameter:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(integer)*: ID da resposta rápida
*   `account_id` *(integer)*: ID da conta
*   `short_code` *(string)*: Código curto para acesso rápido à resposta
*   `content` *(string)*: Conteúdo da resposta rápida
*   `created_at` *(string)*: Data e hora de criação
*   `updated_at` *(string)*: Data e hora da última atualização

***

## **Exemplo de Resposta**

```json
[
  {
    "id": 123,
    "account_id": 123,
    "short_code": "<string>",
    "content": "<string>",
    "created_at": "<string>",
    "updated_at": "<string>"
  }
]
```

***

## **Exemplo cURL**

```bash
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/canned_responses \
  --header 'api_access_token: <api-key>'
```

---

Aqui está a formatação em **Markdown** para a página **Create a Canned Response**:

***

# **Create a Canned Response**

**Endpoint:**

    POST /api/v1/accounts/{account_id}/canned_responses

***

## **Autorização**

*   **Header:**  
    `api_access_token: <api-key>`
    *   **Tipo:** `string`
    *   **Obrigatório:** Sim
    *   **Descrição:** Token obtido na página de perfil ou via console Rails. Permite acesso aos endpoints conforme nível de permissão do usuário.

***

## **Parâmetros**

*   **Path Parameter:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.

***

## **Body (application/json)**

### **Campos**

*   `short_code` *(string, obrigatório)*: Código curto para acessar rapidamente a resposta  
    **Exemplo:** `"greeting"`
*   `content` *(string, obrigatório)*: Texto da resposta rápida  
    **Exemplo:** `"Hello! How can I help you today?"`

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(integer)*: ID da resposta rápida
*   `account_id` *(integer)*: ID da conta
*   `short_code` *(string)*: Código curto
*   `content` *(string)*: Conteúdo da resposta
*   `created_at` *(string)*: Data e hora de criação
*   `updated_at` *(string)*: Data e hora da última atualização

***

## **Exemplo de Body**

```json
{
  "short_code": "greeting",
  "content": "Hello! How can I help you today?"
}
```

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "account_id": 123,
  "short_code": "greeting",
  "content": "Hello! How can I help you today?",
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z"
}
```

***

## **Exemplo cURL**

```bash
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/canned_responses \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "short_code": "greeting",
    "content": "Hello! How can I help you today?"
  }'
```

---

Aqui está a formatação em **Markdown** para a página **Delete a Canned Response**:

***

# **Delete a Canned Response**

**Endpoint:**

    DELETE /api/v1/accounts/{account_id}/canned_responses/{id}

***

## **Autorização**

*   **Header:**  
    `api_access_token: <api-key>`
    *   **Tipo:** `string`
    *   **Obrigatório:** Sim
    *   **Descrição:** Token obtido na página de perfil ou via console Rails. Permite acesso aos endpoints conforme nível de permissão do usuário.

***

## **Parâmetros**

*   **Path Parameters:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.
    *   `id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID da resposta rápida a ser removida.

***

## **Resposta (200 - Success)**

A remoção bem-sucedida retorna status **200** sem corpo ou com uma mensagem de confirmação.

***

### **Possíveis Erros**

*   **403 Forbidden**: Acesso negado devido a permissões insuficientes.
*   **404 Not Found**: Resposta rápida ou conta não encontrada.

**Formato de erro:**

```json
{
  "description": "<string>",
  "errors": [
    {
      "field": "<string>",
      "message": "<string>",
      "code": "<string>"
    }
  ]
}
```

***

## **Exemplo cURL**

```bash
curl --request DELETE \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/canned_responses/{id} \
  --header 'api_access_token: <api-key>'
```

---

Aqui está a formatação em **Markdown** para a página **Update a Canned Response**:

***

# **Update a Canned Response**

**Endpoint:**

    PATCH /api/v1/accounts/{account_id}/canned_responses/{id}

***

## **Autorização**

*   **Header:**  
    `api_access_token: <api-key>`
    *   **Tipo:** `string`
    *   **Obrigatório:** Sim
    *   **Descrição:** Token obtido na página de perfil ou via console Rails. Permite acesso aos endpoints conforme nível de permissão do usuário.

***

## **Parâmetros**

*   **Path Parameters:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.
    *   `id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID da resposta rápida a ser atualizada.

***

## **Body (application/json)**

### **Campos**

*   `short_code` *(string, opcional)*: Código curto para acessar rapidamente a resposta  
    **Exemplo:** `"greeting"`
*   `content` *(string, opcional)*: Texto da resposta rápida  
    **Exemplo:** `"Hello! How can I help you today?"`

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(integer)*: ID da resposta rápida
*   `account_id` *(integer)*: ID da conta
*   `short_code` *(string)*: Código curto
*   `content` *(string)*: Conteúdo da resposta
*   `created_at` *(string)*: Data e hora de criação
*   `updated_at` *(string)*: Data e hora da última atualização

***

## **Exemplo de Body**

```json
{
  "short_code": "greeting",
  "content": "Hello! How can I help you today?"
}
```

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "account_id": 123,
  "short_code": "greeting",
  "content": "Hello! How can I help you today?",
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z"
}
```

***

## **Exemplo cURL**

```bash
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/canned_responses/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "short_code": "greeting",
    "content": "Hello! How can I help you today?"
  }'
```




