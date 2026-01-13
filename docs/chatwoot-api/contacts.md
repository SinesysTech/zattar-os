# Chatwoot API – Contacts

## List Contacts

**Endpoint:**
GET /api/v1/accounts/{account_id}/contacts

**Description:**
List all resolved contacts with pagination (Page size = 15). Resolved contacts have a value for identifier, email, or phone number.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `sort` (enum<string>): Sort by `name`, `email`, `phone_number`, `last_activity_at`, or their negative forms
- `page` (integer, default: 1): Page number

**Example cURL:**
```
curl --request GET \
  --url 'https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts?page=1' \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "meta": {
    "count": 123,
    "current_page": "<string>"
  },
  "payload": [
    {
      "additional_attributes": {
        "city": "<string>",
        "country": "<string>",
        "country_code": "<string>",
        "created_at_ip": "<string>"
      },
      "availability_status": "online",
      "email": "<string>",
      "id": 123,
      "name": "<string>",
      "phone_number": "<string>",
      "blocked": true,
      "identifier": "<string>",
      "thumbnail": "<string>",
      "custom_attributes": {},
      "last_activity_at": 123,
      "created_at": 123,
      "contact_inboxes": [
        {
          "source_id": "<string>",
          "inbox": {
            "id": 123,
            "avatar_url": "<string>",
            "channel_id": 123,
            "name": "<string>",
            "channel_type": "<string>",
            "provider": "<string>"
          }
        }
      ]
    }
  ]
}
```

---

## Create Contact

**Endpoint:**
POST /api/v1/accounts/{account_id}/contacts

**Description:**
Create a new contact.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Body:**
- `inbox_id` (number, required)
- `name` (string)
- `email` (string)
- `blocked` (boolean)
- `phone_number` (string)
- `avatar` (file)
- `avatar_url` (string)
- `identifier` (string)
- `additional_attributes` (object)
- `custom_attributes` (object)

**Example cURL:**
```
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "inbox_id": 1,
  "name": "Alice",
  "email": "alice@acme.inc",
  "blocked": false,
  "phone_number": "+123456789",
  "avatar": "<string>",
  "avatar_url": "https://example.com/avatar.png",
  "identifier": "1234567890",
  "additional_attributes": {
    "type": "customer",
    "age": 30
  },
  "custom_attributes": {}
}
'
```

**Response:**
```json
{
  "payload": [
    {
      "additional_attributes": {},
      "availability_status": "<string>",
      "email": "<string>",
      "id": 123,
      "name": "<string>",
      "phone_number": "<string>",
      "blocked": true,
      "identifier": "<string>",
      "thumbnail": "<string>",
      "custom_attributes": {
        "attribute_key": "attribute_value",
        "signed_up_at": "dd/mm/yyyy"
      },
      "last_activity_at": 123,
      "created_at": 123,
      "contact_inboxes": [
        {
          "source_id": "<string>",
          "inbox": {
            "id": 123,
            "avatar_url": "<string>",
            "channel_id": 123,
            "name": "<string>",
            "channel_type": "<string>",
            "provider": "<string>"
          }
        }
      ]
    }
  ],
  "id": 123,
  "availability_status": "online"
}
```

---

## Show Contact

**Endpoint:**
GET /api/v1/accounts/{account_id}/contacts/{id}

**Description:**
Get a contact belonging to the account using ID.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/{id} \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": {
    "additional_attributes": {
      "city": "<string>",
      "country": "<string>",
      "country_code": "<string>",
      "created_at_ip": "<string>"
    },
    "availability_status": "online",
    "email": "<string>",
    "id": 123,
    "name": "<string>",
    "phone_number": "<string>",
    "blocked": true,
    "identifier": "<string>",
    "thumbnail": "<string>",
    "custom_attributes": {},
    "last_activity_at": 123,
    "created_at": 123,
    "contact_inboxes": [
      {
        "source_id": "<string>",
        "inbox": {
          "id": 123,
          "avatar_url": "<string>",
          "channel_id": 123,
          "name": "<string>",
          "channel_type": "<string>",
          "provider": "<string>"
        }
      }
    ]
  }
}
```

---

## Update Contact

**Endpoint:**
PUT /api/v1/accounts/{account_id}/contacts/{id}

**Description:**
Update a contact belonging to the account using ID.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required)

**Body:**
- `name` (string)
- `email` (string)
- `blocked` (boolean)
- `phone_number` (string)
- `avatar` (file)
- `avatar_url` (string)
- `identifier` (string)
- `additional_attributes` (object)
- `custom_attributes` (object)

**Example cURL:**
```
curl --request PUT \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "name": "Alice",
  "email": "alice@acme.inc",
  "blocked": false,
  "phone_number": "+123456789",
  "avatar": "<string>",
  "avatar_url": "https://example.com/avatar.png",
  "identifier": "1234567890",
  "additional_attributes": {
    "type": "customer",
    "age": 30
  },
  "custom_attributes": {}
}
'
```

**Response:**
```json
{
  "id": 123,
  "payload": [
    {
      "additional_attributes": {},
      "availability_status": "<string>",
      "email": "<string>",
      "id": 123,
      "name": "<string>",
      "phone_number": "<string>",
      "blocked": true,
      "identifier": "<string>",
      "thumbnail": "<string>",
      "custom_attributes": {
        "attribute_key": "attribute_value",
        "signed_up_at": "dd/mm/yyyy"
      },
      "last_activity_at": 123,
      "created_at": 123,
      "contact_inboxes": [
        {
          "source_id": "<string>",
          "inbox": {
            "id": 123,
            "avatar_url": "<string>",
            "channel_id": 123,
            "name": "<string>",
            "channel_type": "<string>",
            "provider": "<string>"
          }
        }
      ]
    }
  ]
}
```

---

## Delete Contact

**Endpoint:**
DELETE /api/v1/accounts/{account_id}/contacts/{id}

**Description:**
Delete a contact belonging to the account using ID.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required)

**Example cURL:**
```
curl --request DELETE \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/{id} \
  --header 'api_access_token: <api-key>'
```

**Response:**
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

---

## Search Contacts

**Endpoint:**
GET /api/v1/accounts/{account_id}/contacts/search

**Description:**
Search resolved contacts using a search key (supports email, name, identifier, phone number). Page size = 15.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Query Parameters:**
- `q` (string): Search by name, identifier, email, or phone number
- `sort` (enum<string>): Sort by `name`, `email`, `phone_number`, `last_activity_at`, or their negative forms
- `page` (integer, default: 1): Page number

**Example cURL:**
```
curl --request GET \
  --url 'https://app.chatwoot.com/api/v1/accounts/{account_id}/contacts/search?page=1' \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "meta": {
    "count": 123,
    "current_page": "<string>"
  },
  "payload": [
    {
      "additional_attributes": {
        "city": "<string>",
        "country": "<string>",
        "country_code": "<string>",
        "created_at_ip": "<string>"
      },
      "availability_status": "online",
      "email": "<string>",
      "id": 123,
      "name": "<string>",
      "phone_number": "<string>",
      "blocked": true,
      "identifier": "<string>",
      "thumbnail": "<string>",
      "custom_attributes": {},
      "last_activity_at": 123,
      "created_at": 123,
      "contact_inboxes": [
        {
          "source_id": "<string>",
          "inbox": {
            "id": 123,
            "avatar_url": "<string>",
            "channel_id": 123,
            "name": "<string>",
            "channel_type": "<string>",
            "provider": "<string>"
          }
        }
      ]
    }
  ]
}
```

---

## Merge Contacts

**Endpoint:**
POST /api/v1/accounts/{account_id}/actions/contact_merge

**Description:**
Merge two contacts into a single contact. The base contact remains and receives all data from the mergee contact. This action is irreversible.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Body:**
- `base_contact_id` (integer, required): Contact that will remain
- `mergee_contact_id` (integer, required): Contact to be merged and deleted

**Example cURL:**
```
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/actions/contact_merge \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "base_contact_id": 1,
  "mergee_contact_id": 2
}
'
```

**Response:**
```json
{
  "id": 123,
  "payload": [
    {
      "additional_attributes": {},
      "availability_status": "<string>",
      "email": "<string>",
      "id": 123,
      "name": "<string>",
      "phone_number": "<string>",
      "blocked": true,
      "identifier": "<string>",
      "thumbnail": "<string>",
      "custom_attributes": {
        "attribute_key": "attribute_value",
        "signed_up_at": "dd/mm/yyyy"
      },
      "last_activity_at": 123,
      "created_at": 123,
      "contact_inboxes": [
        {
          "source_id": "<string>",
          "inbox": {
            "id": 123,
            "avatar_url": "<string>",
            "channel_id": 123,
            "name": "<string>",
            "channel_type": "<string>",
            "provider": "<string>"
          }
        }
      ]
    }
  ]
}
```
