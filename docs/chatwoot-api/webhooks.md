# Chatwoot API – Webhooks

## List All Webhooks

**Endpoint:**
GET /api/v1/accounts/{account_id}/webhooks

**Description:**
List all webhooks in the account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Response:**
```json
[
  {
    "id": 123,
    "url": "<string>",
    "name": "<string>",
    "subscriptions": [
      "conversation_created"
    ],
    "account_id": 123
  }
]
```

**Subscriptions (event types):**
- `conversation_created`
- `conversation_status_changed`
- `conversation_updated`
- `contact_created`
- `contact_updated`
- `message_created`
- `message_updated`
- `webwidget_triggered`

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/webhooks \
  --header 'api_access_token: <api-key>'
```
