# Chatwoot API – Help Center

## List All Portals in an Account

**Endpoint:**
GET /api/v1/accounts/{account_id}/portals

**Description:**
Get details of portals in an Account.

**Authorizations:**
- Header: `api_access_token` (string, required)

**Path Parameters:**
- `account_id` (integer, required): The numeric ID of the account

**Example cURL:**
```
curl --request GET \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/portals \
  --header 'api_access_token: <api-key>'
```

**Response:**
```json
{
  "payload": [
    {
      "id": 4,
      "color": "#1F93FF",
      "custom_domain": "chatwoot.help",
      "header_text": "Handbook",
      "homepage_link": "https://www.chatwoot.com",
      "name": "Handbook",
      "page_title": "Handbook",
      "slug": "handbook",
      "archived": false,
      "account_id": 1,
      "config": {
        "allowed_locales": [
          {
            "code": "en",
            "articles_count": 32,
            "categories_count": 9
          }
        ]
      },
      "inbox": {
        "id": 37,
        "avatar_url": "https://example.com/avatar.png",
        "channel_id": 1,
        "name": "Chatwoot",
        "channel_type": "Channel::WebWidget",
        "greeting_enabled": true,
        "widget_color": "#1F93FF",
        "website_url": "chatwoot.com"
      },
      "logo": {
        "id": 19399916,
        "portal_id": 4,
        "file_type": "image/png",
        "account_id": 1,
        "file_url": "https://example.com/logo.png",
        "blob_id": 21239614,
        "filename": "square.png"
      },
      "meta": {
        "all_articles_count": 0,
        "categories_count": 9,
        "default_locale": "en"
      }
    }
  ]
}
```
