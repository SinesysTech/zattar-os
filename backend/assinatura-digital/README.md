# Backend de Assinatura Digital

## Visão Geral

Este diretório contém todos os serviços backend responsáveis pelo módulo de assinatura digital eletrônica do Sinesys. A implementação segue os requisitos da **Medida Provisória 2.200-2/2001** para **Assinatura Eletrônica Avançada** (Art. 10, § 2º).

A arquitetura é baseada em uma camada de serviços que orquestra a lógica de negócio, integrada ao Supabase para persistência de metadados e ao Backblaze B2 para armazenamento de arquivos (object storage).

### Principais Responsabilidades
- Geração dinâmica de documentos PDF a partir de templates.
- Coleta e validação de evidências (biometria facial, assinatura manuscrita, device fingerprint).
- Cálculo de hashes (`SHA-256`) para garantir a integridade dos documentos (dual hashing).
- Geração de um manifesto de assinatura embedado no PDF final.
- Funções de auditoria para verificação forense da integridade das assinaturas.

## Estrutura de Diretórios
```
backend/assinatura-digital/
├── services/
│   ├── signature.service.ts       # Orquestra a finalização, validação e auditoria da assinatura.
│   ├── template-pdf.service.ts    # Gera PDFs a partir de templates e anexa o manifesto de assinatura.
│   ├── integrity.service.ts       # Funções utilitárias para cálculo e verificação de hashes SHA-256.
│   ├── storage.service.ts         # Gerencia upload e download de arquivos para o Backblaze B2.
│   ├── data.service.ts            # Executa queries no Supabase para buscar dados (clientes, templates, etc.).
│   ├── formularios.service.ts     # Lógica de negócio para formulários dinâmicos.
│   ├── templates.service.ts       # CRUD de templates de documentos.
│   ├── segmentos.service.ts       # CRUD de segmentos de clientes.
│   ├── dashboard.service.ts       # Serviços para métricas e relatórios do dashboard.
│   ├── logger.ts                  # Serviço de logging estruturado.
│   ├── constants.ts               # Constantes globais do módulo (nomes de buckets, etc.).
│   ├── base64.ts                  # Funções para decodificação de data URLs.
│   └── __tests__/                 # Testes unitários dos serviços.
│       └── integrity.service.test.ts
```

## Serviços Principais

### `signature.service.ts`
É o coração do backend, orquestrando todo o processo de finalização e auditoria.
- **`finalizeSignature(payload)`:** Recebe todos os dados do frontend, valida as evidências, gera o PDF final com manifesto, calcula os hashes, persiste os metadados e faz o upload dos artefatos.
- **`auditSignatureIntegrity(assinaturaId)`:** Realiza uma auditoria forense completa, recalculando o hash do PDF e comparando-o com o valor armazenado no banco para garantir que o documento não foi adulterado.
- **`validateDeviceFingerprintEntropy(fingerprint)`:** Garante que a "impressão digital" do dispositivo coletada tem informações suficientes para ser considerada uma evidência robusta.
- **`generatePreview(payload)`:** Gera uma pré-visualização do PDF para o usuário revisar antes de assinar.

### `template-pdf.service.ts`
Responsável pela manipulação dos documentos PDF.
- **`generatePdfFromTemplate(...)`:** Preenche um template de PDF com os dados do cliente e do formulário.
- **`appendManifestPage(pdfDoc, manifestData)`:** Anexa a página de manifesto ao final do documento, contendo todas as evidências coletadas (hashes, dados do signatário, etc.).

### `integrity.service.ts`
Contém a lógica de hashing para garantir a integridade dos documentos.
- **`calculateHash(buffer)`:** Calcula o hash `SHA-256` de um buffer de dados (ex: o conteúdo de um PDF).
- **`verifyHash(buffer, expectedHash)`:** Compara o hash de um buffer com um hash esperado usando `timingSafeEqual` para prevenir ataques de temporização.

### `storage.service.ts`
Abstrai a comunicação com o serviço de armazenamento de objetos (Backblaze B2).
- Gerencia o upload e download de PDFs, fotos e imagens de assinatura.
- Usa uma estrutura de pastas organizada para separar `templates`, `assinaturas`, `fotos` e `pdfs` finalizados.

### `data.service.ts`
Centraliza o acesso aos dados no Supabase, buscando informações sobre clientes, templates de documentos e formulários.

## Fluxo de Assinatura (Resumo)

1.  **Verificação CPF:** `POST /api/assinatura-digital/forms/verificar-cpf`
2.  **Dados Pessoais:** `POST /api/assinatura-digital/forms/save-client`
3.  **Formulário Dinâmico:** `POST /api/salvar-acao`
4.  **Captura Foto:** Realizada no frontend (via webcam) e mantida no estado do React (Zustand).
5.  **Geolocalização:** Capturada no frontend (via Geolocation API) e mantida no estado.
6.  **Preview PDF:** `POST /api/assinatura-digital/signature/preview`
7.  **Aceite Termos:** Realizado no frontend (checkbox), com timestamp e versão dos termos armazenados no estado.
8.  **Assinatura Manuscrita:** Desenhada no frontend (canvas) e mantida no estado.
9.  **Finalização:** `POST /api/assinatura-digital/signature/finalizar`, que invoca `signature.service.finalizeSignature()`.
10. **Sucesso:** A API retorna os links para download dos PDFs (original e assinado).

## Testes

-   **Unitários:** O serviço de integridade (`integrity.service.ts`) possui uma suíte de testes robusta em `__tests__/integrity.service.test.ts`.
-   **Execução:** Para rodar os testes de cobertura, use o comando `npm run test:coverage`.
-   **Como Adicionar:** Crie novos arquivos `*.test.ts` no diretório `__tests__/` para testar outros serviços, seguindo o padrão Jest.

## Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para o funcionamento do módulo:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Backblaze B2 (S3-compatible)
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_REGION=us-west-000
B2_ACCESS_KEY_ID=xxx
B2_SECRET_ACCESS_KEY=xxx
B2_BUCKET_NAME=sinesys-assinatura-digital
```

## Referências

-   **Documentação Arquitetural:** `docs/assinatura-digital/arquitetura-conceitual.md`
-   **Documentação de Conformidade Legal:** `docs/assinatura-digital/CONFORMIDADE_LEGAL.md`
-   **Documentação do Frontend:** `components/assinatura-digital/README.md`
-   **Documentação da Lib (Frontend):** `lib/assinatura-digital/README.md`
