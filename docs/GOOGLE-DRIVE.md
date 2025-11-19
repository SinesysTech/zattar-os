# Configuração de Storage - Google Drive via n8n Webhook
# Copie este arquivo para .env e preencha com suas configurações

# Provider de storage (minio | s3 | aws | google-drive)
STORAGE_PROVIDER=google-drive

# Google Drive via n8n Webhook
# URL ÚNICA do webhook do n8n que processa TODAS as operações
# Todas as operações usam POST com body JSON contendo o campo "operation"
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive-storage

# Token de autenticação para o webhook (deixe em branco se não usar autenticação)
# Este token será enviado no header Authorization: Bearer {token}
GOOGLE_DRIVE_WEBHOOK_TOKEN=

# Webhook único com POST para todas as operações:
#
# Operação: UPLOAD
# Body: { "operation": "upload", "path": "...", "fileName": "...", "fileContent": "base64...", "contentType": "..." }
# Retorna: { "path": "...", "url": "...", "fileId": "...", "success": true }
#
# Operação: DELETE
# Body: { "operation": "delete", "path": "..." }
# Retorna: { "success": true }
#
# Operação: GET-URL
# Body: { "operation": "get-url", "path": "...", "expiresIn": 3600 }
# Retorna: { "url": "...", "expiresAt": "...", "success": true }
#
# Operação: EXISTS
# Body: { "operation": "exists", "path": "..." }
# Retorna: { "exists": true/false }
#
# Consulte GOOGLE_DRIVE_WEBHOOK_BODY_STRUCTURE.md para mais detalhes
