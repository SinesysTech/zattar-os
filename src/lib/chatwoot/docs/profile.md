# Chatwoot API – Profile

## Fetch User Profile

**Endpoint:**
GET /api/v1/profile

**Description:**
Get the user profile details.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/profile \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "id": 123,
  "access_token": "<string>",
  "account_id": 123,
  "available_name": "<string>",
  "avatar_url": "<string>",
  "confirmed": true,
  "display_name": "<string>",
  "message_signature": "<string>",
  "email": "<string>",
  "hmac_identifier": "<string>",
  "inviter_id": 123,
  "name": "<string>",
  "provider": "<string>",
  "pubsub_token": "<string>",
  "role": "agent",
  "ui_settings": {},
  "uid": "<string>",
  "type": "<string>",
  "custom_attributes": {},
  "accounts": [
    {
      "id": 123,
      "name": "<string>",
      "status": "<string>",
      "active_at": "2023-11-07T05:31:56Z",
      "role": "administrator",
      "permissions": [
        "<string>"
      ],
      "availability": "<string>",
      "availability_status": "<string>",
      "auto_offline": true,
      "custom_role_id": 123,
      "custom_role": {}
    }
  ]
}
```
