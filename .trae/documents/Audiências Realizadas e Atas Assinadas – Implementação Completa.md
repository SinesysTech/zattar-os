## Enfoque
- É uma melhoria no serviço atual de captura de audiências, sem criação de novo serviço de captura.
- Usaremos o mesmo endpoint `POST /api/captura/trt/audiencias`, focando no filtro `status='F'` (realizadas) e acoplando a captura/persistência das atas assinadas.

## Ajuste no Serviço Existente
- Estender `audienciasCapture` para, quando `codigoSituacao='F'`:
  - Obter ata(s) associadas à audiência (via PJE, por `processoId`/vínculo de pauta).
  - Baixar o conteúdo do documento da ata: `GET /api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo?incluirCapa=false&incluirAssinatura=true`.
  - Subir para storage (Backblaze) e persistir `ata_audiencia_id` e `url` na mesma operação de UPSERT da audiência.
- Sem novos endpoints de captura; apenas enriquecemos a persistência e o resultado/logs.

## Migração de Dados
- Tabela `audiencias`:
  - `ata_audiencia_id bigint` — ID do documento da ata.
  - `url text` — URL de storage para abrir o PDF.
- (Opcional recomendado) `arquivo_key text` para integração com o viewer de expedientes (presigned URL reaproveitado).
- Índices: `data_inicio`, `data_fim`, `responsavel_id`, `tipo_is_virtual`.

## Persistência e Storage (Reuso)
- Reutilizar serviços e utilitários existentes: download de documento, upload para B2, e `file-naming.utils` (origem `audiencias`).
- UPSERT na audiência: manter as chaves únicas atuais; gravar `dados_anteriores` em atualizações.

## UI
- Na listagem de audiências filtradas por realizadas (`status=F`), exibir ícone `FileText` que abre `PdfViewerDialog` com a ata armazenada.
- Reutilizar componentes de expedientes para visualização (mesma UX de pop‑up).

## Otimizações Incluídas
- Paralelismo controlado por credencial (limite 3–4) com retry exponencial.
- Cache in-memory durante `salvarAudiencias` para entidades relacionadas.
- Índices conforme migração.

## Erros e Contratos
- Backend mantém `{ error: { code, message, details? } }`.
- Frontend converte mensagens para exibição consistente.

## Testes
- Cenário de audiência designada → realizada, com ata vinculada.
- Verificação de upload e abertura via UI.
- Bench com concorrência vs sequencial.

## Sequência de Implementação
1) Migração das colunas e índices.
2) Extensão do `audienciasCapture` para status F com atas.
3) Persistência em `salvarAudiencias` incluindo `ata_audiencia_id`/`url`.
4) Ajustes de UI (ícone + dialog).
5) Paralelismo e cache.
6) Testes e validação.

Confirma seguir com esta melhoria no serviço atual (sem novo endpoint de captura), iniciando pela migração e integração das atas na rotina de realizadas?