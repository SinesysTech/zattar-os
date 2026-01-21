# Chatwoot API – Reports

## Account Reporting Events

**Endpoint:**
GET /api/v1/accounts/{account_id}/reporting_events

**Description:**
Get paginated reporting events for the account (first response time, resolution time, and other metrics). Only administrators can access this endpoint. Results are paginated with 25 items per page.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `page` (integer, default: 1)
- `since` (string): Start timestamp (Unix seconds)
- `until` (string): End timestamp (Unix seconds)
- `inbox_id` (number): Filter by inbox ID
- `user_id` (number): Filter by user/agent ID
- `name` (string): Filter by event name (e.g., first_response, resolution, reply_time)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/reporting_events \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "meta": {
    "count": 123,
    "current_page": 123,
    "total_pages": 123
  },
  "payload": [
    {
      "id": 123,
      "name": "<string>",
      "value": 123,
      "value_in_business_hours": 123,
      "event_start_time": "2023-11-07T05:31:56Z",
      "event_end_time": "2023-11-07T05:31:56Z",
      "account_id": 123,
      "conversation_id": 123,
      "inbox_id": 123,
      "user_id": 123,
      "created_at": "2023-11-07T05:31:56Z",
      "updated_at": "2023-11-07T05:31:56Z"
    }
  ]
}
```

---

## Get Conversation Statistics Grouped by Channel Type

**Endpoint:**
GET /api/v2/accounts/{account_id}/summary_reports/channel

**Description:**
Get conversation counts grouped by channel type and status for a given date range. Returns statistics for each channel type including open, resolved, pending, snoozed, and total conversation counts. (Available in Chatwoot v4.10.0+; max range 6 months)

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)

**Query Parameters:**
- `since` (string): Start timestamp (Unix seconds)
- `until` (string): End timestamp (Unix seconds)
- `business_hours` (boolean): Filter by business hours

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v2/accounts/{account_id}/summary_reports/channel \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "Channel::WebWidget": {
    "open": 10,
    "resolved": 20,
    "pending": 5,
    "snoozed": 2,
    "total": 37
  },
  "Channel::Api": {
    "open": 5,
    "resolved": 15,
    "pending": 3,
    "snoozed": 1,
    "total": 24
  }
}
```
