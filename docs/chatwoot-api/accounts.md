# **Get Account Details**

**Endpoint:**

    GET /api/v1/accounts/{id}

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

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(number)*: ID da conta
*   `name` *(string)*: Nome da conta
*   `locale` *(string)*: Localidade da conta
*   `domain` *(string)*: Domínio da conta
*   `support_email` *(string)*: E-mail de suporte
*   `status` *(string)*: Status da conta
*   `created_at` *(string<date-time>)*: Data de criação
*   `cache_keys` *(object)*: Chaves de cache
*   `features` *(string\[])*: Recursos habilitados
*   `settings` *(object)*: Configurações da conta
    *   `auto_resolve_after` *(number)*
    *   `auto_resolve_message` *(string)*
    *   `auto_resolve_ignore_waiting` *(boolean)*
*   `custom_attributes` *(object)*: Atributos personalizados
    *   `plan_name` *(string)*
    *   `subscribed_quantity` *(number)*
    *   `subscription_status` *(string)*
    *   `subscription_ends_on` *(date)*
    *   `industry` *(string)*
    *   `company_size` *(string)*
    *   `timezone` *(string)*
    *   `logo` *(string)*
    *   `onboarding_step` *(string)*
    *   `marked_for_deletion_at` *(date-time)*
    *   `marked_for_deletion_reason` *(string)*
*   `latest_chatwoot_version` *(string)*: Última versão disponível (ex.: `"3.0.0"`)
*   `subscribed_features` *(string\[])*: Recursos empresariais assinados

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "name": "<string>",
  "locale": "<string>",
  "domain": "<string>",
  "support_email": "<string>",
  "status": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "cache_keys": {},
  "features": ["<string>"],
  "settings": {
    "auto_resolve_after": 123,
    "auto_resolve_message": "<string>",
    "auto_resolve_ignore_waiting": true
  },
  "custom_attributes": {
    "plan_name": "<string>",
    "subscribed_quantity": 123,
    "subscription_status": "<string>",
    "subscription_ends_on": "2023-12-25",
    "industry": "<string>",
    "company_size": "<string>",
    "timezone": "<string>",
    "logo": "<string>",
    "onboarding_step": "<string>",
    "marked_for_deletion_at": "2023-11-07T05:31:56Z",
    "marked_for_deletion_reason": "<string>"
  },
  "latest_chatwoot_version": "3.0.0",
  "subscribed_features": ["<string>"]
}
```

***

## **Exemplo cURL**

```bash
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{id} \
  --header 'api_access_token: <api-key>'
```

---

# **Update Account Details**

**Endpoint:**

    PATCH /api/v1/accounts/{id}

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

*   `name` *(string)*: Nome da conta  
    **Exemplo:** `"My Account"`
*   `locale` *(string)*: Localidade da conta  
    **Exemplo:** `"en"`
*   `domain` *(string)*: Domínio da conta  
    **Exemplo:** `"example.com"`
*   `support_email` *(string)*: E-mail de suporte  
    **Exemplo:** `"support@example.com"`
*   `auto_resolve_after` *(integer | null)*: Tempo (em minutos) para auto-resolução  
    **Intervalo:** `10 <= x <= 1439856`  
    **Exemplo:** `1440`
*   `auto_resolve_message` *(string | null)*: Mensagem enviada ao auto resolver  
    **Exemplo:** `"This conversation has been automatically resolved due to inactivity"`
*   `auto_resolve_ignore_waiting` *(boolean | null)*: Ignorar conversas em espera para auto resolver  
    **Exemplo:** `false`
*   `industry` *(string)*: Tipo de indústria  
    **Exemplo:** `"Technology"`
*   `company_size` *(string)*: Tamanho da empresa  
    **Exemplo:** `"50-100"`
*   `timezone` *(string)*: Fuso horário da conta  
    **Exemplo:** `"UTC"`

***

## **Resposta (200 - application/json)**

### **Campos**

*   `id` *(number)*: ID da conta
*   `name` *(string)*: Nome da conta
*   `locale` *(string)*: Localidade
*   `domain` *(string)*: Domínio
*   `support_email` *(string)*: E-mail de suporte
*   `status` *(string)*: Status da conta
*   `created_at` *(string<date-time>)*: Data de criação
*   `cache_keys` *(object)*: Chaves de cache
*   `features` *(string\[])*: Recursos habilitados
*   `settings` *(object)*: Configurações da conta
    *   `auto_resolve_after` *(number)*
    *   `auto_resolve_message` *(string)*
    *   `auto_resolve_ignore_waiting` *(boolean)*
*   `custom_attributes` *(object)*: Atributos personalizados
    *   `plan_name` *(string)*
    *   `subscribed_quantity` *(number)*
    *   `subscription_status` *(string)*
    *   `subscription_ends_on` *(date)*
    *   `industry` *(string)*
    *   `company_size` *(string)*
    *   `timezone` *(string)*
    *   `logo` *(string)*
    *   `onboarding_step` *(string)*
    *   `marked_for_deletion_at` *(date-time)*
    *   `marked_for_deletion_reason` *(string)*

***

## **Exemplo de Body**

```json
{
  "name": "My Account",
  "locale": "en",
  "domain": "example.com",
  "support_email": "support@example.com",
  "auto_resolve_after": 1440,
  "auto_resolve_message": "This conversation has been automatically resolved due to inactivity",
  "auto_resolve_ignore_waiting": false,
  "industry": "Technology",
  "company_size": "50-100",
  "timezone": "UTC"
}
```

***

## **Exemplo de Resposta**

```json
{
  "id": 123,
  "name": "<string>",
  "locale": "<string>",
  "domain": "<string>",
  "support_email": "<string>",
  "status": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "cache_keys": {},
  "features": ["<string>"],
  "settings": {
    "auto_resolve_after": 123,
    "auto_resolve_message": "<string>",
    "auto_resolve_ignore_waiting": true
  },
  "custom_attributes": {
    "plan_name": "<string>",
    "subscribed_quantity": 123,
    "subscription_status": "<string>",
    "subscription_ends_on": "2023-12-25",
    "industry": "<string>",
    "company_size": "<string>",
    "timezone": "<string>",
    "logo": "<string>",
    "onboarding_step": "<string>",
    "marked_for_deletion_at": "2023-11-07T05:31:56Z",
    "marked_for_deletion_reason": "<string>"
  }
}
```

***

## **Exemplo cURL**

```bash
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "name": "My Account",
    "locale": "en",
    "domain": "example.com",
    "support_email": "support@example.com",
    "auto_resolve_after": 1440,
    "auto_resolve_message": "This conversation has been automatically resolved due to inactivity",
    "auto_resolve_ignore_waiting": false,
    "industry": "Technology",
    "company_size": "50-100",
    "timezone": "UTC"
  }'
```

---


