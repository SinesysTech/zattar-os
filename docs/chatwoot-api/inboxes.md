# Chatwoot API – Inboxes

## List All Inboxes

**Endpoint:**
GET /api/v1/accounts/{account_id}/inboxes

**Description:**
List all inboxes available in the current account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": [
    {
      "id": 123,
      "name": "<string>",
      "website_url": "<string>",
      "channel_type": "<string>",
      "avatar_url": "<string>",
      "widget_color": "<string>",
      "website_token": "<string>",
      "enable_auto_assignment": true,
      "web_widget_script": "<string>",
      "welcome_title": "<string>",
      "welcome_tagline": "<string>",
      "greeting_enabled": true,
      "greeting_message": "<string>",
      "channel_id": 123,
      "working_hours_enabled": true,
      "enable_email_collect": true,
      "csat_survey_enabled": true,
      "auto_assignment_config": {},
      "out_of_office_message": "<string>",
      "working_hours": [
        {
          "day_of_week": 123,
          "closed_all_day": true,
          "open_hour": 123,
          "open_minutes": 123,
          "close_hour": 123,
          "close_minutes": 123,
          "open_all_day": true
        }
      ],
      "timezone": "<string>",
      "callback_webhook_url": "<string>",
      "allow_messages_after_resolved": true,
      "lock_to_single_conversation": true,
      "sender_name_type": "<string>",
      "business_name": "<string>",
      "hmac_mandatory": true,
      "selected_feature_flags": {},
      "reply_time": "<string>",
      "messaging_service_sid": "<string>",
      "phone_number": "<string>",
      "medium": "<string>",
      "provider": "<string>"
    }
  ]
}
```

---

## Update Inbox

**Endpoint:**
PATCH /api/v1/accounts/{account_id}/inboxes/{id}

**Description:**
Update an existing inbox.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required): ID of the inbox

**Body:**
- `name` (string)
- `avatar` (file)
- `greeting_enabled` (boolean)
- `greeting_message` (string)
- `enable_email_collect` (boolean)
- `csat_survey_enabled` (boolean)
- `enable_auto_assignment` (boolean)
- `working_hours_enabled` (boolean)
- `out_of_office_message` (string)
- `timezone` (string)
- `allow_messages_after_resolved` (boolean)
- `lock_to_single_conversation` (boolean)
- `portal_id` (integer)
- `sender_name_type` (enum<string>): `friendly`, `professional`
- `business_name` (string)
- `channel` (object)

**Example cURL:**
```
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "name": "Support",
  "avatar": "<string>",
  "greeting_enabled": true,
  "greeting_message": "Hello, how can I help you?",
  "enable_email_collect": true,
  "csat_survey_enabled": true,
  "enable_auto_assignment": true,
  "working_hours_enabled": true,
  "out_of_office_message": "We are currently out of office. Please leave a message and we will get back to you.",
  "timezone": "America/New_York",
  "allow_messages_after_resolved": true,
  "lock_to_single_conversation": true,
  "portal_id": 1,
  "sender_name_type": "friendly",
  "business_name": "My Business",
  "channel": {
    "website_url": "https://example.com",
    "welcome_title": "Welcome to our support",
    "welcome_tagline": "We are here to help you",
    "widget_color": "#FF5733"
  }
}
'
```

**Response:**
```json
{
  "id": 123,
  "name": "<string>",
  "website_url": "<string>",
  "channel_type": "<string>",
  "avatar_url": "<string>",
  "widget_color": "<string>",
  "website_token": "<string>",
  "enable_auto_assignment": true,
  "web_widget_script": "<string>",
  "welcome_title": "<string>",
  "welcome_tagline": "<string>",
  "greeting_enabled": true,
  "greeting_message": "<string>",
  "channel_id": 123,
  "working_hours_enabled": true,
  "enable_email_collect": true,
  "csat_survey_enabled": true,
  "auto_assignment_config": {},
  "out_of_office_message": "<string>",
  "working_hours": [
    {
      "day_of_week": 123,
      "closed_all_day": true,
      "open_hour": 123,
      "open_minutes": 123,
      "close_hour": 123,
      "close_minutes": 123,
      "open_all_day": true
    }
  ],
  "timezone": "<string>",
  "callback_webhook_url": "<string>",
  "allow_messages_after_resolved": true,
  "lock_to_single_conversation": true,
  "sender_name_type": "<string>",
  "business_name": "<string>",
  "hmac_mandatory": true,
  "selected_feature_flags": {},
  "reply_time": "<string>",
  "messaging_service_sid": "<string>",
  "phone_number": "<string>",
  "medium": "<string>",
  "provider": "<string>"
}
```
