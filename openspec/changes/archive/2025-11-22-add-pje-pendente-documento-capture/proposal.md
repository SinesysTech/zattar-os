# Change: Adicionar Captura de Documentos de Pendentes de Manifestação do PJE

## Why

Atualmente, o sistema captura as informações dos pendentes de manifestação do PJE, mas não baixa os documentos (PDFs) associados a cada expediente. Isso significa que o usuário precisa acessar o PJE manualmente para visualizar os documentos, reduzindo a eficiência do sistema.

Esta mudança implementa a captura automática dos documentos PDF dos expedientes pendentes e armazena-os no Google Drive via webhook n8n, permitindo que os usuários visualizem os documentos diretamente no sistema sem precisar acessar o PJE.

## What Changes

- **Backend Service:** Novo serviço `pje-expediente-documento.service.ts` para buscar documentos do PJE
- **API Endpoint:** Novo endpoint `POST /api/pje/pendente-manifestacao/documento` para buscar documento específico
- **Database Migration:** Adicionar colunas `arquivo_nome`, `arquivo_url_visualizacao`, `arquivo_url_download` na tabela `pendente_manifestacao`
- **Integração Storage:** Utilizar `GoogleDriveStorageService` existente para upload de PDFs
- **Scraper Integration:** Modificar scraper existente para chamar automaticamente o novo endpoint durante a captura
- **Frontend Component:** Botão "Buscar Documento" na página de pendentes de manifestação

## Impact

- **Affected specs:** `pendentes-manifestacao`, `captura-trt`
- **Affected code:**
  - `backend/captura/services/trt/pendentes-manifestacao.service.ts` - Modificar para chamar captura de documento
  - `backend/captura/services/pje/pje-expediente-documento.service.ts` - Novo serviço
  - `app/api/pje/pendente-manifestacao/documento/route.ts` - Novo endpoint
  - `supabase/migrations/` - Nova migration para colunas de arquivo
  - `components/pendentes-manifestacao-*.tsx` - Adicionar botão de busca de documento

## Dual Usage

Este endpoint serve dois propósitos:

1. **Standalone (Manual):** Usuário pode clicar em "Buscar Documento" na interface para baixar documento de um pendente específico que não tem documento
2. **Integrated (Automático):** Scraper de pendentes de manifestação chama automaticamente durante a captura para baixar documentos de todos os pendentes

Ambos os casos utilizam o mesmo endpoint `POST /api/pje/pendente-manifestacao/documento` com arquitetura qualificada por domínio PJE.
