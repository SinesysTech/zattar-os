# Chatwoot API – Automation Rules

## List All Automation Rules in an Account

**Endpoint:**
GET /api/v1/accounts/{account_id}/automation_rules

**Description:**
Get details of automation rules in an Account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `page` (integer, default: 1): The page parameter

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/automation_rules \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": [
    {
      "id": 123,
      "account_id": 123,
      "name": "Add label on message create event",
      "description": "Add label support and sales on message create event if incoming message content contains text help",
      "event_name": "message_created",
      "conditions": [
        {
          "attribute_key": "content",
          "filter_operator": "contains",
          "values": [
            "help"
          ],
          "query_operator": "and"
        }
      ],
      "actions": [
        {
          "action_name": "add_label",
          "action_params": [
            "support",
            "sales"
          ]
        }
      ],
      "created_on": 123,
      "active": true
    }
  ]
}
```

---

## Update Automation Rule in Account

**Endpoint:**
PATCH /api/v1/accounts/{account_id}/automation_rules/{id}

**Description:**
Update an automation rule in account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required): ID of the automation rule

**Body:**
- `name` (string): Rule name
- `description` (string): Description about the automation and actions
- `event_name` (enum<string>): Event to execute the automation actions (`conversation_created`, `conversation_updated`, `conversation_resolved`, `message_created`)
- `active` (boolean): Enable/disable automation rule
- `actions` (object[]): Array of actions to perform when condition matches
- `conditions` (object[]): Array of conditions for the rule

**Example cURL:**
```
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/automation_rules/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "name": "Add label on message create event",
  "description": "Add label support and sales on message create event if incoming message content contains text help",
  "event_name": "message_created",
  "active": true,
  "actions": [
    {
      "action_name": "add_label",
      "action_params": [
        "support"
      ]
    }
  ],
  "conditions": [
    {
      "attribute_key": "content",
      "filter_operator": "contains",
      "query_operator": "OR",
      "values": [
        "help"
      ]
    }
  ]
}
'
```

**Response:**
```json
{
  "payload": [
    {
      "id": 123,
      "account_id": 123,
      "name": "Add label on message create event",
      "description": "Add label support and sales on message create event if incoming message content contains text help",
      "event_name": "message_created",
      "conditions": [
        {
          "attribute_key": "content",
          "filter_operator": "contains",
          "values": [
            "help"
          ],
          "query_operator": "and"
        }
      ],
      "actions": [
        {
          "action_name": "add_label",
          "action_params": [
            "support",
            "sales"
          ]
        }
      ],
      "created_on": 123,
      "active": true
    }
  ]
}
```
