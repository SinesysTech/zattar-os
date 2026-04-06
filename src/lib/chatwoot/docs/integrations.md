# Chatwoot API – Integrations

## List All Integrations

**Endpoint:**
GET /api/v1/accounts/{account_id}/integrations/apps

**Description:**
Get the details of all Integrations available for the account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/integrations/apps \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": [
    {
      "id": "<string>",
      "name": "<string>",
      "description": "<string>",
      "hook_type": "<string>",
      "enabled": true,
      "allow_multiple_hooks": true,
      "hooks": [
        {}
      ]
    }
  ]
}
```
