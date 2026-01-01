# Migração Google Drive → Backblaze B2

## Status da Implementação

### ✅ Concluído

1. **Serviço Base do Backblaze B2**
   - `backend/storage/backblaze-b2.service.ts` - Funções de upload e delete
   - `backend/storage/file-naming.utils.ts` - Utilitários de nomeação de arquivos
2. **Implementação de Storage Service**

   - `backend/acordos-condenacoes/services/storage/backblaze-b2-storage.service.ts`
   - Implementa interface `IStorageService`
   - Adicionado ao factory de storage

3. **Serviço de Upload de Timeline**
   - `backend/captura/services/backblaze/upload-documento-timeline.service.ts`
   - Substitui upload do Google Drive na captura de timeline
4. **Atualização de Tipos**

   - `backend/types/pje-trt/timeline.ts` - Adicionado `BackblazeB2Info`
   - `app/_lib/types/timeline.ts` - Atualizado frontend
   - Google Drive marcado como `@deprecated`

5. **Atualização da Captura de Timeline**

   - `backend/captura/services/timeline/timeline-capture.service.ts`
   - Substituído `uploadDocumentoToGoogleDrive` por `uploadDocumentoTimeline`
   - Timeline agora inclui campo `backblaze` ao invés de `googleDrive`

6. **Migration de Banco de Dados**

   - `supabase/migrations/20251121183000_migrate_to_backblaze_b2.sql`
   - Adiciona colunas: `arquivo_url`, `arquivo_bucket`, `arquivo_key`
   - Remove colunas antigas do Google Drive

7. **Documentação**
   - README.md atualizado com variáveis de ambiente do Backblaze

### 📋 Próximos Passos (A Fazer)

#### 1. Configurar Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Storage Provider
STORAGE_PROVIDER=backblaze

# Backblaze B2
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET=zattar-advogados
B2_KEY_ID=<sua_key_id>
B2_APPLICATION_KEY=<sua_application_key>
```

**Como obter as credenciais do Backblaze:**

1. Acesse https://www.backblaze.com/b2/cloud-storage.html
2. Faça login no painel
3. Vá em "App Keys" → "Add a New Application Key"
4. Copie o `keyID` e `applicationKey`
5. O endpoint e região dependem do bucket criado

#### 2. Aplicar Migration no Banco de Dados

```bash
# Via Supabase CLI
npx supabase db push

# Ou via interface do Supabase
# Dashboard → SQL Editor → Execute a migration
```

#### 3. Migrar Outros Locais que Ainda Usam Google Drive

**Locais identificados que ainda usam Google Drive:**

- `backend/captura/services/google-drive/upload-documento.service.ts` ← **Deprecated**
- Outros serviços que fazem upload (verificar com grep)

**Ação necessária:** Substituir chamadas ao serviço do Google Drive pelo Backblaze nos seguintes contextos:

- Pendentes de manifestação (se aplicável)
- Audiências (se aplicável)
- Expedientes (se aplicável)

#### 4. Atualizar Componentes do Frontend

Se houver componentes React que exibem links do Google Drive, atualizar para:

```tsx
// Antes
{
  item.googleDrive && (
    <a href={item.googleDrive.linkVisualizacao}>Ver documento</a>
  );
}

// Depois
{
  item.backblaze && (
    <a href={item.backblaze.url} target="_blank">
      Ver documento
    </a>
  );
}
```

#### 5. Testar Integração Completa

**Teste 1: Upload de Documento da Timeline**

```bash
# Executar captura de timeline
# Verificar se:
# 1. Documento foi enviado ao Backblaze
# 2. URL está correta no campo backblaze
# 3. Dados salvos no Supabase (JSONB) incluem backblaze info
```

**Teste 2: Verificar Armazenamento**

```bash
# Acessar painel do Backblaze B2
# Verificar estrutura de pastas:
# processos/{numeroProcesso}/timeline/doc_{id}_{YYYYMMDD}.pdf
```

**Teste 3: Download de Documento**

```bash
# Clicar em URL do documento no frontend
# Deve abrir o PDF diretamente do Backblaze
```

#### 6. Remover Código do Google Drive (Opcional)

Após confirmar que tudo funciona:

1. Remover serviço: `backend/captura/services/google-drive/upload-documento.service.ts`
2. Remover import e uso no factory se não for mais necessário
3. Remover documentação de setup do Google Drive

## Estrutura de Armazenamento no Backblaze B2

```
bucket: zattar-advogados/
├── processos/
│   ├── 0010702-80.2025.5.03.0111/
│   │   ├── timeline/
│   │   │   ├── doc_222702194_20251121.pdf
│   │   │   └── doc_222702195_20251121.pdf
│   │   ├── pendente_manifestacao/
│   │   │   └── exp_789_doc_234517663_20251121.pdf
│   │   ├── audiencias/
│   │   │   └── ata_456_20251121.pdf
│   │   └── expedientes/
│   │       └── exp_123_doc_987_20251121.pdf
│   └── [outros processos...]
```

## Estratégia de Nomeação

### Timeline

- **Formato:** `doc_{documentoId}_{YYYYMMDD}.pdf`
- **Exemplo:** `doc_222702194_20251121.pdf`
- **Função:** `gerarCaminhoCompletoTimeline(numeroProcesso, documentoId)`

### Pendente de Manifestação

- **Formato:** `exp_{pendenteId}_doc_{documentoId}_{YYYYMMDD}.pdf`
- **Exemplo:** `exp_789_doc_234517663_20251121.pdf`
- **Função:** `gerarCaminhoCompletoPendente(numeroProcesso, pendenteId, documentoId)`

### Audiências

- **Formato:** `ata_{audienciaId}_{YYYYMMDD}.pdf`
- **Exemplo:** `ata_456_20251121.pdf`

### Expedientes

- **Formato:** `exp_{expedienteId}_doc_{documentoId}_{YYYYMMDD}.pdf`
- **Exemplo:** `exp_123_doc_987_20251121.pdf`

## Campos no Banco de Dados

### Tabela: `pendentes_manifestacao` (e outras tabelas com arquivos)

| Campo            | Tipo | Descrição                                                  |
| ---------------- | ---- | ---------------------------------------------------------- |
| `arquivo_nome`   | text | Nome do arquivo (ex: `exp_789_doc_234517663_20251121.pdf`) |
| `arquivo_url`    | text | URL pública do arquivo no Backblaze                        |
| `arquivo_key`    | text | Chave S3 (ex: `processos/.../pendente_manifestacao/...`)   |
| `arquivo_bucket` | text | Nome do bucket (ex: `zattar-advogados`)                    |

## Compatibilidade com Google Drive

Os tipos mantêm compatibilidade com Google Drive durante o período de transição:

```typescript
export interface TimelineItemEnriquecido extends TimelineItem {
  backblaze?: BackblazeB2Info; // ✅ Novo - Use este
  googleDrive?: GoogleDriveInfo; // ⚠️ Deprecated - Remover após migração
}
```

## Troubleshooting

### Erro: "Configuração do Backblaze B2 incompleta"

- Verificar se todas as variáveis de ambiente estão configuradas
- Verificar se não há espaços extras nos valores

### Erro: "Access Denied" ao fazer upload

- Verificar se a `applicationKey` tem permissões de escrita
- Verificar se o bucket existe e está acessível

### URL retornada não funciona

- Verificar se o bucket está configurado como público
- Verificar se o endpoint está correto para a região

### Documento não aparece no Backblaze

- Verificar logs do upload
- Verificar se a chave (key) está correta
- Verificar permissões da conta

## Benefícios da Migração

1. **Redução de Custos:** Backblaze B2 é mais barato que Google Drive
2. **API Nativa:** Sem necessidade de N8N como intermediário
3. **Controle Total:** Acesso direto via S3-compatible API
4. **Escalabilidade:** Melhor para grandes volumes de documentos
5. **Performance:** URLs públicas diretas, sem redirecionamentos

## Suporte

Para dúvidas sobre a implementação:

- Documentação Backblaze B2: https://www.backblaze.com/b2/docs/
- AWS SDK S3 Client: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
