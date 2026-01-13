# Chatwoot API – Teams

## List All Teams

**Endpoint:**
GET /api/v1/accounts/{account_id}/teams

**Description:**
List all teams available in the current account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/teams \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "<string>",
    "description": "<string>",
    "allow_auto_assign": true,
    "account_id": 123,
    "is_member": true
  }
]
```
