# Technical Design: Captura de Documentos de Pendentes de Manifestação

## Context

O sistema já possui:
- Scraper de pendentes de manifestação funcionando (`pendentes-manifestacao.service.ts`)
- Sistema de autenticação PJE (`trt-auth.service.ts`)
- Sistema de storage abstrato com Google Drive via n8n webhook (`google-drive-storage.service.ts`)
- Tabela `pendente_manifestacao` no banco de dados

Precisamos adicionar capacidade de buscar documentos PDF dos expedientes pendentes e armazená-los no Google Drive.

## Goals / Non-Goals

### Goals
- Criar endpoint reutilizável para buscar documentos de pendentes específicos
- Integrar captura de documentos ao scraper existente (opcional)
- Armazenar metadados de documento no banco para acesso rápido
- Permitir uso standalone (botão na interface) e integrado (scraper automático)

### Non-Goals
- Não modificar estrutura de tabelas existentes além de adicionar 3 colunas
- Não implementar cache de documentos (armazenamento é permanente no Google Drive)
- Não criar sistema de fila para processamento assíncrono (implementação futura se necessário)

## Decisions

### 1. Nomenclatura Específica por Domínio PJE

**Decision:** Endpoint será `/api/pje/pendente-manifestacao/documento` (não genérico `/api/pje/documento`)

**Rationale:**
- O PJE possui múltiplos domínios: expedientes, processos, audiências, petições, etc.
- Cada domínio tem APIs diferentes para buscar documentos
- Nomenclatura específica evita confusão e permite expansão futura
- Permite criar endpoints separados: `/api/pje/carta-audiencia/documento`, `/api/pje/processo-completo/documento`, etc.

**Alternatives considered:**
- Endpoint genérico com query param `?tipo=pendente-manifestacao` - Rejeitado por dificultar descoberta e tipagem
- Endpoint `/api/documentos/pje` - Rejeitado por não deixar claro qual domínio PJE

### 2. Estrutura de Chamadas API PJE

**Decision:** Duas chamadas sequenciais:
1. `GET /api/processos/id/{processoId}/documentos/id/{documentoId}` - Metadados
2. `GET /api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo` - PDF base64

**Rationale:**
- API PJE separa metadados de conteúdo
- Metadados incluem informações úteis (mimetype, tamanho) para validação
- Permite implementar cache de metadados no futuro sem baixar PDF completo

**Implementation:**
```typescript
// 1. Buscar metadados
const metadata = await fetchDocumentoMetadata(processoId, documentoId, page);

// 2. Validar mimetype
if (metadata.mimetype !== 'application/pdf') {
  throw new Error('Documento não é PDF');
}

// 3. Buscar conteúdo
const conteudo = await fetchDocumentoConteudo(processoId, documentoId, page);

// 4. Converter base64 para Buffer
const buffer = Buffer.from(conteudo.documento, 'base64');
```

### 3. Storage Path Pattern

**Decision:** Padrão de caminho: `pendentes/{trt}{grau}/{pendenteId}_{timestamp}.pdf`

**Exemplo:** `pendentes/trt3g1/12345_1705856400000.pdf`

**Rationale:**
- Organização por tribunal e grau facilita navegação no Google Drive
- `pendenteId` garante unicidade dentro do escopo
- `timestamp` permite versioning se documento for rebaixado e capturado novamente
- Extensão `.pdf` mantém compatibilidade com visualizadores

**Alternatives considered:**
- `pendentes/{processoId}/{documentoId}.pdf` - Rejeitado por expor IDs internos do PJE
- `pendentes/{ano}/{mes}/{pendenteId}.pdf` - Rejeitado por dificultar busca por tribunal

### 4. Integração com Scraper

**Decision:** Parâmetro opcional `capturarDocumentos?: boolean` no scraper, default `false`

**Rationale:**
- Permite migração gradual (capturar pendentes primeiro, depois documentos)
- Evita falha da captura inteira se houver problema com documentos
- Usuário pode escolher não capturar documentos automaticamente (economia de storage)

**Implementation:**
```typescript
export async function pendentesManifestacaoCapture(
  params: CapturaPendentesManifestacaoParams & { capturarDocumentos?: boolean }
): Promise<PendentesManifestacaoResult> {
  // ... captura de pendentes existente ...

  if (params.capturarDocumentos) {
    for (const processo of processos) {
      try {
        await downloadAndUploadDocumento(
          processo.idProcesso,
          processo.idDocumento,
          processo.id,
          authResult.page
        );
      } catch (error) {
        console.error(`Erro ao capturar documento do pendente ${processo.id}:`, error);
        // Continua com próximo pendente
      }
    }
  }
}
```

### 5. Database Schema

**Decision:** Adicionar 3 colunas na tabela existente `pendente_manifestacao`

```sql
ALTER TABLE pendente_manifestacao
ADD COLUMN arquivo_nome TEXT,
ADD COLUMN arquivo_url_visualizacao TEXT,
ADD COLUMN arquivo_url_download TEXT;
```

**Rationale:**
- Mínima mudança no schema existente
- Campos `NULL` por padrão (pendentes antigos não terão documento)
- URLs são copiadas do response do Google Drive webhook
- `arquivo_nome` facilita identificação visual na interface

**Alternatives considered:**
- Tabela separada `pendente_documento` - Rejeitado por over-engineering (1:1 relationship)
- Usar JSON column - Rejeitado por dificultar queries e índices

### 6. Error Handling

**Decision:** Erros de captura de documento não bloqueiam scraper, mas falham endpoint standalone

**Rationale:**
- No scraper: melhor ter dados de pendente sem documento do que perder tudo
- No endpoint standalone: usuário espera feedback imediato de sucesso/erro

**Implementation:**
```typescript
// Scraper (non-blocking)
try {
  await downloadAndUploadDocumento(...);
} catch (error) {
  console.error('Erro captura documento:', error);
  // Continua
}

// Endpoint (blocking)
try {
  const result = await downloadAndUploadDocumento(...);
  return NextResponse.json({ success: true, ...result });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

### 7. Frontend Integration

**Decision:** Botão "Buscar Documento" visível apenas quando `arquivo_nome` é `null`

**Rationale:**
- Interface limpa: botão aparece apenas quando necessário
- Usuário vê claramente quais pendentes não têm documento
- Permite "retry" manual se captura automática falhou

**Implementation:**
```tsx
{!pendente.arquivo_nome && (
  <Button onClick={() => handleBuscarDocumento(pendente.id)}>
    Buscar Documento
  </Button>
)}

{pendente.arquivo_nome && (
  <a href={pendente.arquivo_url_visualizacao} target="_blank">
    <FileIcon /> {pendente.arquivo_nome}
  </a>
)}
```

## Risks / Trade-offs

### Risk: Google Drive Quota
- **Descrição:** Upload de muitos documentos pode exceder quota do Google Drive
- **Mitigation:**
  - Parâmetro `capturarDocumentos` permite controle manual
  - Implementar rate limiting no scraper (500ms entre documentos)
  - Monitorar logs de erro do webhook n8n

### Risk: Documentos Grandes
- **Descrição:** PDFs grandes (>10MB) podem causar timeout na API PJE ou webhook
- **Mitigation:**
  - Timeout de 60s nas requisições PJE
  - Webhook n8n deve ter timeout adequado
  - Logar tamanho do documento antes do upload

### Risk: Autenticação Concorrente
- **Descrição:** Múltiplos usuários buscando documentos simultaneamente podem causar conflito de sessão PJE
- **Mitigation:**
  - Cada chamada cria nova sessão de autenticação (não reutiliza)
  - Browser headless isolado por requisição
  - Cleanup adequado de recursos (finally block)

### Trade-off: Performance vs Confiabilidade
- **Escolha:** Captura sequencial de documentos (não paralela)
- **Justificativa:** API PJE não documenta limite de rate, melhor ser conservador
- **Custo:** Captura de 100 pendentes com documentos leva ~50 segundos (500ms delay)

## Migration Plan

### Phase 1: Database (Safe to deploy)
1. Criar migration adicionando 3 colunas
2. Executar em produção (colunas NULL, não afeta queries existentes)

### Phase 2: Backend (Safe to deploy)
1. Deploy do novo serviço `pje-expediente-documento.service.ts`
2. Deploy do novo endpoint `/api/pje/pendente-manifestacao/documento`
3. Testar endpoint standalone manualmente

### Phase 3: Frontend (Safe to deploy)
1. Deploy do botão "Buscar Documento"
2. Testar interface com usuários

### Phase 4: Scraper Integration (Opt-in)
1. Deploy do parâmetro `capturarDocumentos` no scraper
2. Testar em ambiente de staging primeiro
3. Habilitar em produção gradualmente (começar com TRT menor)

### Rollback Strategy
- Remover botão do frontend (não afeta dados)
- Desabilitar `capturarDocumentos=true` em agendamentos
- Manter endpoint e colunas (não causam problemas)
- Eventual cleanup: remover migration se nunca utilizado (após 30 dias)

## Open Questions

- [ ] Qual o limite de tamanho de arquivo do Google Drive via webhook n8n?
- [ ] Devemos implementar re-captura automática de documentos faltantes? (cron job)
- [ ] Devemos armazenar hash do documento para detectar mudanças?
- [ ] Como lidar com documentos que não são PDF (ex: imagens, DOC)?
