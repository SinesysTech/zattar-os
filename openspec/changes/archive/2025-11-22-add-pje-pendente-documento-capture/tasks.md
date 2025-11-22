# Implementation Tasks

## 1. Database Schema
- [ ] 1.1 Criar migration adicionando colunas na tabela `pendente_manifestacao`:
  - `arquivo_nome` (TEXT)
  - `arquivo_url_visualizacao` (TEXT)
  - `arquivo_url_download` (TEXT)
- [ ] 1.2 Executar migration no banco

## 2. Backend Services
- [ ] 2.1 Criar `backend/captura/services/pje/pje-expediente-documento.service.ts` com:
  - `fetchDocumentoMetadata(processoId, documentoId, page)` - Buscar metadados
  - `fetchDocumentoConteudo(processoId, documentoId, page)` - Buscar PDF base64
  - `downloadAndUploadDocumento(processoId, documentoId, pendenteId, page)` - Orquestração completa
- [ ] 2.2 Criar tipos TypeScript em `backend/types/pje-trt/documento-types.ts`:
  - `DocumentoMetadata`
  - `DocumentoConteudo`
  - `FetchDocumentoParams`
  - `FetchDocumentoResult`
- [ ] 2.3 Atualizar `backend/captura/services/persistence/pendentes-persistence.service.ts`:
  - Adicionar função `atualizarDocumentoPendente(pendenteId, arquivoInfo)`

## 3. API Endpoint
- [ ] 3.1 Criar `app/api/pje/pendente-manifestacao/documento/route.ts`:
  - Endpoint `POST` que recebe `{ pendenteId, processoId, documentoId, credential }`
  - Autenticação obrigatória (Supabase Auth)
  - Chamar serviço PJE, fazer upload Google Drive, atualizar banco
  - Retornar `{ success, arquivoNome, urlVisualizacao, urlDownload }`
- [ ] 3.2 Adicionar tratamento de erros específicos:
  - Documento não encontrado (404)
  - Erro de autenticação PJE
  - Erro de upload Google Drive
  - Erro de persistência no banco

## 4. Scraper Integration
- [ ] 4.1 Modificar `backend/captura/services/trt/pendentes-manifestacao.service.ts`:
  - Adicionar chamada opcional para `downloadAndUploadDocumento` após salvar pendente
  - Adicionar parâmetro `capturarDocumentos?: boolean` (default: false)
  - Capturar documentos apenas se `capturarDocumentos=true`
- [ ] 4.2 Adicionar tratamento de erros não-bloqueante:
  - Se falhar captura de documento, continuar com outros pendentes
  - Logar erros de captura de documento separadamente

## 5. Frontend Components
- [ ] 5.1 Criar `components/pendentes-manifestacao-documento-button.tsx`:
  - Botão "Buscar Documento" visível quando pendente não tem documento
  - Loading state durante fetch
  - Toast de sucesso/erro
- [ ] 5.2 Atualizar `components/pendentes-manifestacao-list.tsx`:
  - Incluir coluna "Documento" com ícone de PDF ou status "Sem documento"
  - Incluir botão "Buscar Documento" quando aplicável
  - Link para visualização do documento quando disponível
- [ ] 5.3 Atualizar tipos TypeScript em frontend:
  - Adicionar campos `arquivoNome`, `arquivoUrlVisualizacao`, `arquivoUrlDownload` ao tipo `PendenteManifestacao`

## 6. Testing
- [ ] 6.1 Testar endpoint standalone:
  - Buscar documento de pendente sem documento
  - Verificar upload no Google Drive
  - Verificar atualização no banco
- [ ] 6.2 Testar integração com scraper:
  - Executar captura de pendentes com `capturarDocumentos=true`
  - Verificar que documentos são baixados automaticamente
  - Verificar tratamento de erros não-bloqueante
- [ ] 6.3 Testar interface:
  - Botão "Buscar Documento" aparece corretamente
  - Loading state funciona
  - Links de visualização funcionam
  - Toast de erro/sucesso aparecem

## 7. Documentation
- [ ] 7.1 Atualizar README do módulo captura-trt
- [ ] 7.2 Documentar estrutura de resposta do endpoint
- [ ] 7.3 Documentar parâmetro `capturarDocumentos` do scraper
