# Chatwoot API – Contact Labels

## List Labels

**Endpoint:**
GET /api/v1/accounts/{account_id}/contacts/{id}/labels

**Description:**
Lists all the labels of a contact.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account
- `id` (number, required): ID of the contact

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/{id}/labels \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": [
    "<string>"
  ]
}
```

---

## Add Labels

**Endpoint:**
POST /api/v1/accounts/{account_id}/contacts/{id}/labels

**Description:**
Add labels to a contact. This API overwrites the existing list of labels associated to the contact.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required): ID of the contact

**Body:**
- `labels` (string[], required): Array of labels (comma-separated strings)

**Example cURL:**
```
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/{id}/labels \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "labels": [
    "support",
    "billing"
  ]
}
'
```

**Response:**
```json
{
  "payload": [
    "<string>"
  ]
}
```
