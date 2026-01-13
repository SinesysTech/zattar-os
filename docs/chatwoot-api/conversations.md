# Chatwoot API – Conversations

## Get Conversation Counts

**Endpoint:**
GET /api/v1/accounts/{account_id}/conversations/meta

**Description:**
Get open, unassigned, and all conversation counts.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `status` (enum<string>, default: open): Filter by conversation status (`all`, `open`, `resolved`, `pending`, `snoozed`)
- `q` (string): Filters conversations with messages containing the search term
- `inbox_id` (integer)
- `team_id` (integer)
- `labels` (string[])

**Example cURL:**
```
curl --request GET \
  --url 'https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations/meta?status=open' \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "meta": {
    "mine_count": 123,
    "unassigned_count": 123,
    "assigned_count": 123,
    "all_count": 123
  }
}
```

---

## Conversations List

**Endpoint:**
GET /api/v1/accounts/{account_id}/conversations

**Description:**
List all the conversations with pagination.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Query Parameters:**
- `assignee_type` (enum<string>, default: all): `me`, `unassigned`, `all`, `assigned`
- `status` (enum<string>, default: open): `all`, `open`, `resolved`, `pending`, `snoozed`
- `q` (string)
- `inbox_id` (integer)
- `team_id` (integer)
- `labels` (string[])
- `page` (integer, default: 1)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "data": {
    "meta": {
      "mine_count": 123,
      "unassigned_count": 123,
      "assigned_count": 123,
      "all_count": 123
    },
    "payload": [
      {
        "id": 123,
        "messages": [
          {
            "id": 123,
            "content": "<string>",
            "account_id": 123,
            "inbox_id": 123,
            "conversation_id": 123,
            "message_type": 0,
            "created_at": 123,
            "updated_at": 123,
            "private": true,
            "status": "sent",
            "source_id": "<string>",
            "content_type": "text",
            "content_attributes": {},
            "sender_type": "contact",
            "sender_id": 123,
            "external_source_ids": {},
            "additional_attributes": {},
            "processed_message_content": "<string>",
            "sentiment": {},
            "conversation": {},
            "attachment": {},
            "sender": {}
          }
        ],
        "account_id": 123,
        "uuid": "<string>",
        "additional_attributes": {},
        "agent_last_seen_at": 123,
        "assignee_last_seen_at": 123,
        "can_reply": true,
        "contact_last_seen_at": 123,
        "custom_attributes": {},
        "inbox_id": 123,
        "labels": [
          "<string>"
        ],
        "muted": true,
        "snoozed_until": 123,
        "status": "open",
        "created_at": 123,
        "updated_at": 123,
        "timestamp": "<string>",
        "first_reply_created_at": 123,
        "unread_count": 123,
        "last_non_activity_message": {
          "id": 123,
          "content": "<string>",
          "account_id": 123,
          "inbox_id": 123,
          "conversation_id": 123,
          "message_type": 0,
          "created_at": 123,
          "updated_at": 123,
          "private": true,
          "status": "sent",
          "source_id": "<string>",
          "content_type": "text",
          "content_attributes": {},
          "sender_type": "contact",
          "sender_id": 123,
          "external_source_ids": {},
          "additional_attributes": {},
          "processed_message_content": "<string>",
          "sentiment": {},
          "conversation": {},
          "attachment": {},
          "sender": {}
        },
        "last_activity_at": 123,
        "priority": "<string>",
        "waiting_since": 123,
        "sla_policy_id": 123,
        "applied_sla": {},
        "sla_events": [
          {}
        ],
        "meta": {
          "sender": {
            "additional_attributes": {},
            "availability_status": "<string>",
            "email": "<string>",
            "id": 123,
            "name": "<string>",
            "phone_number": "<string>",
            "blocked": true,
            "identifier": "<string>",
            "thumbnail": "<string>",
            "custom_attributes": {},
            "last_activity_at": 123,
            "created_at": 123
          },
          "channel": "<string>",
          "assignee": {
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
          },
          "hmac_verified": true
        }
      }
    ]
  }
}
```

---

## Create New Conversation

**Endpoint:**
POST /api/v1/accounts/{account_id}/conversations

**Description:**
Create a new conversation in Chatwoot. Requires a source id.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Body:**
- `source_id` (string, required)
- `inbox_id` (integer, required)
- `contact_id` (integer)
- `additional_attributes` (object)
- `custom_attributes` (object)
- `status` (enum<string>): `open`, `resolved`, `pending`
- `assignee_id` (integer)
- `team_id` (integer)
- `snoozed_until` (string, date-time)
- `message` (object)

**Example cURL:**
```
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "source_id": "1234567890",
  "inbox_id": 1,
  "contact_id": 1,
  "additional_attributes": {
    "browser": "Chrome",
    "browser_version": "89.0.4389.82",
    "os": "Windows",
    "os_version": "10"
  },
  "custom_attributes": {
    "attribute_key": "attribute_value",
    "priority_conversation_number": 3
  },
  "status": "open",
  "assignee_id": 1,
  "team_id": 1,
  "snoozed_until": "2030-07-21T17:32:28Z",
  "message": {
    "content": "Hello, how can I help you?",
    "template_params": {
      "name": "sample_issue_resolution",
      "category": "UTILITY",
      "language": "en_US",
      "processed_params": {
        "1": "Chatwoot"
      }
    }
  }
}
'
```

**Response:**
```json
{
  "id": 123,
  "account_id": 123,
  "inbox_id": 123
}
```

---

## Conversations Filter

**Endpoint:**
POST /api/v1/accounts/{account_id}/conversations/filter

**Description:**
Filter conversations with custom filter options and pagination.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Query Parameters:**
- `page` (number)

**Body:**
- `payload` (object[]): Array of filter conditions

**Example cURL:**
```
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations/filter \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "payload": [
    {
      "attribute_key": "browser_language",
      "filter_operator": "not_equal_to",
      "values": [
        "en"
      ],
      "query_operator": "AND"
    },
    {
      "attribute_key": "status",
      "filter_operator": "equal_to",
      "values": [
        "pending"
      ],
      "query_operator": null
    }
  ]
}
'
```

**Response:**
```json
{
  "data": {
    "meta": {
      "mine_count": 123,
      "unassigned_count": 123,
      "assigned_count": 123,
      "all_count": 123
    },
    "payload": [
      {
        "id": 123,
        "messages": [
          {
            "id": 123,
            "content": "<string>",
            "account_id": 123,
            "inbox_id": 123,
            "conversation_id": 123,
            "message_type": 0,
            "created_at": 123,
            "updated_at": 123,
            "private": true,
            "status": "sent",
            "source_id": "<string>",
            "content_type": "text",
            "content_attributes": {},
            "sender_type": "contact",
            "sender_id": 123,
            "external_source_ids": {},
            "additional_attributes": {},
            "processed_message_content": "<string>",
            "sentiment": {},
            "conversation": {},
            "attachment": {},
            "sender": {}
          }
        ],
        "account_id": 123,
        "uuid": "<string>",
        "additional_attributes": {},
        "agent_last_seen_at": 123,
        "assignee_last_seen_at": 123,
        "can_reply": true,
        "contact_last_seen_at": 123,
        "custom_attributes": {},
        "inbox_id": 123,
        "labels": [
          "<string>"
        ],
        "muted": true,
        "snoozed_until": 123,
        "status": "open",
        "created_at": 123,
        "updated_at": 123,
        "timestamp": "<string>",
        "first_reply_created_at": 123,
        "unread_count": 123,
        "last_non_activity_message": {
          "id": 123,
          "content": "<string>",
          "account_id": 123,
          "inbox_id": 123,
          "conversation_id": 123,
          "message_type": 0,
          "created_at": 123,
          "updated_at": 123,
          "private": true,
          "status": "sent",
          "source_id": "<string>",
          "content_type": "text",
          "content_attributes": {},
          "sender_type": "contact",
          "sender_id": 123,
          "external_source_ids": {},
          "additional_attributes": {},
          "processed_message_content": "<string>",
          "sentiment": {},
          "conversation": {},
          "attachment": {},
          "sender": {}
        },
        "last_activity_at": 123,
        "priority": "<string>",
        "waiting_since": 123,
        "sla_policy_id": 123,
        "applied_sla": {},
        "sla_events": [
          {}
        ],
        "meta": {
          "sender": {
            "additional_attributes": {},
            "availability_status": "<string>",
            "email": "<string>",
            "id": 123,
            "name": "<string>",
            "phone_number": "<string>",
            "blocked": true,
            "identifier": "<string>",
            "thumbnail": "<string>",
            "custom_attributes": {},
            "last_activity_at": 123,
            "created_at": 123
          },
          "channel": "<string>",
          "assignee": {
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
          },
          "hmac_verified": true
        }
      }
    ]
  }
}
```

---
