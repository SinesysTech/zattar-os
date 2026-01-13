# Chatwoot API – Custom Attributes

## List All Custom Attributes in an Account

**Endpoint:**
GET /api/v1/accounts/{account_id}/custom_attribute_definitions

**Description:**
Get details of custom attributes in an Account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Query Parameters:**
- `attribute_model` (enum<string>, required): conversation_attribute(0) / contact_attribute(1)

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/custom_attribute_definitions \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
[
  {
    "id": 123,
    "attribute_display_name": "<string>",
    "attribute_display_type": "<string>",
    "attribute_description": "<string>",
    "attribute_key": "<string>",
    "regex_pattern": "<string>",
    "regex_cue": "<string>",
    "attribute_values": "<string>",
    "attribute_model": "<string>",
    "default_value": "<string>",
    "created_at": "<string>",
    "updated_at": "<string>"
  }
]
```

---

## Update Custom Attribute in Account

**Endpoint:**
PATCH /api/v1/accounts/{account_id}/custom_attribute_definitions/{id}

**Description:**
Update a custom attribute in account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required)
- `id` (number, required): ID of the custom attribute

**Body:**
- `attribute_display_name` (string): Attribute display name
- `attribute_display_type` (integer): Attribute display type (text-0, number-1, currency-2, percent-3, link-4, date-5, list-6, checkbox-7)
- `attribute_description` (string): Attribute description
- `attribute_key` (string): Attribute unique key value
- `attribute_values` (string[]): Attribute values
- `attribute_model` (integer): Attribute type (conversation_attribute-0, contact_attribute-1)
- `regex_pattern` (string): Regex pattern (for type text)
- `regex_cue` (string): Regex cue message (for type text)

**Example cURL:**
```
curl --request PATCH \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/custom_attribute_definitions/{id} \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '
{
  "attribute_display_name": "Custom Attribute",
  "attribute_display_type": 0,
  "attribute_description": "This is a custom attribute",
  "attribute_key": "custom_attribute",
  "attribute_values": [
    "value1",
    "value2"
  ],
  "attribute_model": 0,
  "regex_pattern": "^[a-zA-Z0-9]+$",
  "regex_cue": "Please enter a valid value"
}
'
```

**Response:**
```json
{
  "id": 123,
  "attribute_display_name": "<string>",
  "attribute_display_type": "<string>",
  "attribute_description": "<string>",
  "attribute_key": "<string>",
  "regex_pattern": "<string>",
  "regex_cue": "<string>",
  "attribute_values": "<string>",
  "attribute_model": "<string>",
  "default_value": "<string>",
  "created_at": "<string>",
  "updated_at": "<string>"
}
```
