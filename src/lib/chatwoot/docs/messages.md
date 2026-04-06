# Chatwoot API – Messages

## Get Messages

**Endpoint:**
GET /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages

**Description:**
List all messages of a conversation.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account
- `conversation_id` (integer, required): The numeric ID of the conversation

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations/{conversation_id}/messages \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "meta": {
    "labels": [
      "<string>"
    ],
    "additional_attributes": {},
    "contact": {
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
    },
    "assignee": {
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
    },
    "agent_last_seen_at": "2023-11-07T05:31:56Z",
    "assignee_last_seen_at": "2023-11-07T05:31:56Z"
  },
  "payload": [
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
  ]
}
```
