Aqui está a formatação em **Markdown** para a página **List Agents in Account**:

***

# **List Agents in Account**

**Endpoint:**

    GET /api/v1/accounts/{account_id}/agents

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

*   `id` *(integer)*: ID do agente
*   `account_id` *(integer)*: ID da conta
*   `availability_status` *(enum<string>)*: Status de disponibilidade do agente  
    **Opções:** `available`, `busy`, `offline`
*   `auto_offline` *(boolean)*: Se o status do agente é configurado para ir offline automaticamente quando ausente
*   `confirmed` *(boolean)*: Se o agente confirmou seu endereço de e-mail
*   `email` *(string)*: E-mail do agente
*   `available_name` *(string)*: Nome disponível do agente
*   `name` *(string)*: Nome do agente
*   `role` *(enum<string>)*: Função do agente  
    **Opções:** `agent`, `administrator`
*   `thumbnail` *(string)*: URL da imagem do agente
*   `custom_role_id` *(integer)*: ID da função personalizada do agente

***

## **Exemplo de Resposta**

```json
[
  {
    "id": 123,
    "account_id": 123,
    "availability_status": "available",
    "auto_offline": true,
    "confirmed": true,
    "email": "<string>",
    "available_name": "<string>",
    "name": "<string>",
    "role": "agent",
    "thumbnail": "<string>",
    "custom_role_id": 123
  }
]
```

***

## **Exemplo cURL**

```bash
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/agents \
  --header 'api_access_token: <api-key>'
```

---

Aqui está a formatação em **Markdown** para a página **Add a New Agent**:

***

# **Add a New Agent**

**Endpoint:**

    POST /api/v1/accounts/{account_id}/agents

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

## **Body (application/json)**

### **Campos**

*   `name` *(string, obrigatório)*: Nome completo do agente  
    **Exemplo:** `"John Doe"`
*   `email` *(string, obrigatório)*: E-mail do agente  
    **Exemplo:** `"john.doe@acme.inc"`
*   `role` *(enum<string>, obrigatório)*: Função do agente  
    **Opções:** `agent`, `administrator`  
    **Exemplo:** `"agent"`
*   `availability_status` *(enum<string>, opcional)*: Status de disponibilidade do agente  
    **Opções:** `available`, `busy`, `offline`  
    **Exemplo:** `"available"`
*   `auto_offline` *(boolean, opcional)*: Se o status do agente é configurado para ir offline automaticamente quando ausente  
    **Exemplo:** `true`

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(integer)*: ID do agente
*   `account_id` *(integer)*: ID da conta
*   `availability_status` *(enum<string>)*: Status de disponibilidade do agente  
    **Opções:** `available`, `busy`, `offline`
*   `auto_offline` *(boolean)*: Se o status do agente é configurado para ir offline automaticamente
*   `confirmed` *(boolean)*: Se o agente confirmou seu e-mail
*   `email` *(string)*: E-mail do agente
*   `available_name` *(string)*: Nome disponível do agente
*   `name` *(string)*: Nome do agente
*   `role` *(enum<string>)*: Função do agente  
    **Opções:** `agent`, `administrator`
*   `thumbnail` *(string)*: URL da imagem do agente
*   `custom_role_id` *(integer)*: ID da função personalizada

***

## **Exemplo de Body**

```json
{
  "name": "John Doe",
  "email": "john.doe@acme.inc",
  "role": "agent",
  "availability_status": "available",
  "auto_offline": true
}
```

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "account_id": 123,
  "availability_status": "available",
  "auto_offline": true,
  "confirmed": true,
  "email": "<string>",
  "available_name": "<string>",
  "name": "<string>",
  "role": "agent",
  "thumbnail": "<string>",
  "custom_role_id": 123
}
```

***

## **Exemplo cURL**

```bash
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/agents \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "name": "John Doe",
    "email": "john.doe@acme.inc",
    "role": "agent",
    "availability_status": "available",
    "auto_offline": true
  }'
```
---

Aqui está a formatação em **Markdown** para a página **Remove an Agent from Account**:

***

# **Remove an Agent from Account**

**Endpoint:**

    DELETE /api/v1/accounts/{account_id}/agents/{id}

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

*   **Path Parameters:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.
    *   `id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID do agente a ser removido.

***

## **Resposta (200 - Success)**

A remoção bem-sucedida retorna status **200** sem corpo ou com uma mensagem de confirmação.

***

### **Possíveis Erros**

*   **403 Forbidden**: Acesso negado devido a permissões insuficientes.
*   **404 Not Found**: Agente ou conta não encontrados.

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
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/agents/{id} \
  --header 'api_access_token: <api-key>'
```

---


Aqui está a formatação em **Markdown** para a página **Update Agent in Account**:

***

# **Update Agent in Account**

**Endpoint:**

    PATCH /api/v1/accounts/{account_id}/agents/{id}

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

*   **Path Parameters:**
    *   `account_id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID numérico da conta.
    *   `id`
        *   **Tipo:** `integer`
        *   **Obrigatório:** Sim
        *   **Descrição:** ID do agente a ser atualizado.

***

## **Body (application/json)**

### **Campos**

*   `role` *(enum<string>, obrigatório)*: Função do agente  
    **Opções:** `agent`, `administrator`  
    **Exemplo:** `"agent"`
*   `availability_status` *(enum<string>, opcional)*: Status de disponibilidade do agente  
    **Opções:** `available`, `busy`, `offline`  
    **Exemplo:** `"available"`
*   `auto_offline` *(boolean, opcional)*: Se o status do agente é configurado para ir offline automaticamente quando ausente  
    **Exemplo:** `true`

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(integer)*: ID do agente
*   `account_id` *(integer)*: ID da conta
*   `availability_status` *(enum<string>)*: Status de disponibilidade do agente  
    **Opções:** `available`, `busy`, `offline`
*   `auto_offline` *(boolean)*: Se o status do agente é configurado para ir offline automaticamente
*   `confirmed` *(boolean)*: Se o agente confirmou seu e-mail
*   `email` *(string)*: E-mail do agente
*   `available_name` *(string)*: Nome disponível do agente
*   `name` *(string)*: Nome do agente
*   `role` *(enum<string>)*: Função do agente  
    **Opções:** `agent`, `administrator`
*   `thumbnail` *(string)*: URL da imagem do agente
*   `custom_role_id` *(integer)*: ID da função personalizada

***

## **Exemplo de Body**

```json
{
  "role": "agent",
  "availability_status": "available",
  "auto_offline": true
}
```

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "account_id": 123,
  "availability_status": "available",
  "auto_offline": true,
  "confirmed": true,
  "email": "<string>",
  "available_name": "<string>",
  "name": "<string>",
  "role": "agent",
  "thumbnail": "<string>",
  "custom_role_id": 123
}
```

***

## **Exemplo cURL**

```bash
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/agents/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "role": "agent",
    "availability_status": "available",
    "auto_offline": true
  }'
```


