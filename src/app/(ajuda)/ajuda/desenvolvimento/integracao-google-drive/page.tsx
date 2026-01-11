import { Cloud, Webhook, FileUp, Trash2, Link, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const operations = [
  {
    name: 'upload',
    description: 'Fazer upload de arquivo',
    request: `{
  "operation": "upload",
  "path": "documentos/2024/",
  "fileName": "contrato.pdf",
  "fileContent": "base64...",
  "contentType": "application/pdf"
}`,
    response: `{
  "path": "documentos/2024/contrato.pdf",
  "url": "https://drive.google.com/...",
  "fileId": "abc123",
  "success": true
}`,
  },
  {
    name: 'delete',
    description: 'Deletar arquivo',
    request: `{
  "operation": "delete",
  "path": "documentos/2024/contrato.pdf"
}`,
    response: `{
  "success": true
}`,
  },
  {
    name: 'get-url',
    description: 'Obter URL de download',
    request: `{
  "operation": "get-url",
  "path": "documentos/2024/contrato.pdf",
  "expiresIn": 3600
}`,
    response: `{
  "url": "https://drive.google.com/...",
  "expiresAt": "2025-01-15T12:00:00Z",
  "success": true
}`,
  },
  {
    name: 'exists',
    description: 'Verificar se arquivo existe',
    request: `{
  "operation": "exists",
  "path": "documentos/2024/contrato.pdf"
}`,
    response: `{
  "exists": true
}`,
  },
];

export default function IntegracaoGoogleDrivePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Cloud className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Integração Google Drive</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Storage de documentos via webhook n8n para integração com Google Drive.
        </p>
      </div>

      {/* Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>Arquitetura</CardTitle>
          <CardDescription>Fluxo de armazenamento via n8n</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Sinesys     │     │       n8n       │     │  Google Drive   │
│   (Next.js)     │────▶│    Workflow     │────▶│     Storage     │
│                 │     │                 │     │                 │
│   POST /webhook │     │  Processa req   │     │  Upload/Delete  │
│   + operation   │     │  + Google API   │     │  + Get URL      │
└─────────────────┘     └─────────────────┘     └─────────────────┘`}
          </pre>
          <p className="text-sm text-muted-foreground">
            O Sinesys envia requisições POST para um webhook único no n8n,
            que processa a operação e interage com a API do Google Drive.
          </p>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`# Provider de storage
STORAGE_PROVIDER=google-drive

# URL do webhook n8n (única para todas as operações)
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive-storage

# Token de autenticação (opcional)
# Enviado no header: Authorization: Bearer {token}
GOOGLE_DRIVE_WEBHOOK_TOKEN=gdrive_webhook_xxxxxxxxxxxxxxxxxxxxxxxx`}
          </pre>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              🔒 Segurança: Nunca exponha tokens reais em documentação ou commits
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            <CardTitle>Operações Disponíveis</CardTitle>
          </div>
          <CardDescription>
            Todas as operações usam POST com body JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {operations.map((op) => (
            <div key={op.name} className="border-l-2 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                {op.name === 'upload' && <FileUp className="h-4 w-4" />}
                {op.name === 'delete' && <Trash2 className="h-4 w-4" />}
                {op.name === 'get-url' && <Link className="h-4 w-4" />}
                {op.name === 'exists' && <Search className="h-4 w-4" />}
                <Badge variant="secondary">{op.name.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">{op.description}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium mb-1">Request</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                    {op.request}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Response</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                    {op.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* n8n Workflow Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Workflow n8n</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Criar Webhook</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Adicione um nó <strong>Webhook</strong></li>
              <li>• Método: POST</li>
              <li>• Path: google-drive-storage</li>
              <li>• Autenticação: Header Auth (opcional)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Switch por Operação</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Adicione um nó <strong>Switch</strong></li>
              <li>• Campo: <code className="bg-muted px-1 rounded">body.operation</code></li>
              <li>• Valores: upload, delete, get-url, exists</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Google Drive Nodes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Upload:</strong> Google Drive → Upload File</li>
              <li>• <strong>Delete:</strong> Google Drive → Delete File</li>
              <li>• <strong>Get URL:</strong> Google Drive → Get Share Link</li>
              <li>• <strong>Exists:</strong> Google Drive → Search Files</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Example */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// lib/storage/google-drive.ts
interface StorageResult {
  success: boolean;
  path?: string;
  url?: string;
  fileId?: string;
}

export async function uploadToGoogleDrive(
  path: string,
  fileName: string,
  fileContent: string, // base64
  contentType: string
): Promise<StorageResult> {
  const response = await fetch(process.env.GOOGLE_DRIVE_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN && {
        Authorization: \`Bearer \${process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN}\`,
      }),
    },
    body: JSON.stringify({
      operation: 'upload',
      path,
      fileName,
      fileContent,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error(\`Upload failed: \${response.statusText}\`);
  }

  return response.json();
}

export async function deleteFromGoogleDrive(path: string): Promise<boolean> {
  const response = await fetch(process.env.GOOGLE_DRIVE_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN && {
        Authorization: \`Bearer \${process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN}\`,
      }),
    },
    body: JSON.stringify({
      operation: 'delete',
      path,
    }),
  });

  const result = await response.json();
  return result.success;
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Providers Suportados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">google-drive</Badge>
            <Badge variant="outline">minio</Badge>
            <Badge variant="outline">s3</Badge>
            <Badge variant="outline">aws</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            O provider é configurado via <code className="bg-muted px-1 rounded">STORAGE_PROVIDER</code>.
            A interface é a mesma para todos os providers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
