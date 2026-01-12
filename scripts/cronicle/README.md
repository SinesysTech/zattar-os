# Cronicle provisioning

This folder contains scripts to provision Cronicle schedule events for this app.

## Provision Zattar cron endpoints

Script: `scripts/cronicle/provision-zattar-crons.ts`

### Required env vars

- `CRONICLE_URL` (e.g. `https://cronicle.service.sinesys.app`)
- `CRONICLE_API_KEY` (Cronicle API Key)
- `APP_INTERNAL_BASE_URL` (e.g. `http://srv-captain--zattar-app:3000`)
- `APP_CRON_SECRET` (same value as `CRON_SECRET` on the app)

### Run

```bash
npm run cronicle:provision
# or
npm run cronicle:provision -- --dry-run
```

### Notes

- Defaults assume Cronicle has `category=general`, `plugin=shellplug`, and `target=all`.
- Override with:
  - `CRONICLE_CATEGORY`
  - `CRONICLE_PLUGIN`
  - `CRONICLE_TARGET`
  - `CRONICLE_TIMEZONE`
