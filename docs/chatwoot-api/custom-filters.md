# Chatwoot API – Custom Filters

## List All Custom Filters

**Endpoint:**
GET /api/v1/accounts/{account_id}/custom_filters

**Description:**
List all custom filters in a category of a user.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `filter_type` (enum<string>): The type of custom filter (`conversation`, `contact`, `report`)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/custom_filters \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "<string>",
    "type": "conversation",
    "query": {},
    "created_at": "2023-11-07T05:31:56Z",
    "updated_at": "2023-11-07T05:31:56Z"
  }
]
```
