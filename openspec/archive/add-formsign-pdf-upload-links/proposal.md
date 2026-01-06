# Change: Novo fluxo principal de assinatura via upload de PDF + links públicos por assinante

## Why
O fluxo atual de “Fluxo de Assinatura” atua como simulador/preview e não representa o caso principal de uso: enviar um PDF pronto para múltiplos assinantes (inclusive convidados) com posicionamento visual de assinatura/rubrica e links públicos por assinante.

## What Changes
- Adicionar um fluxo administrativo para **criar um documento de assinatura a partir de PDF uploadado**, vinculado a 1..N assinantes.
- Adicionar suporte a assinantes de múltiplas origens:
  - entidades existentes (clientes, partes contrárias, representantes, terceiros, usuários)
  - convidados (dados capturados no link público; não criam entidade no sistema)
- Gerar **um link público por assinante**, sem expiração, sem reuso após conclusão.
- Implementar o fluxo do assinante no link público:
  - etapa de identificação (informar/confirmar nome completo, CPF, e-mail, telefone)
  - selfie opcional (única configuração “não-padrão”)
  - assinatura e rubrica: o assinante executa **uma vez por tipo**, e o sistema replica em todas as âncoras marcadas para o assinante/tipo.
- Permitir posicionamento **visual** das âncoras no PDF, associando cada âncora a um assinante e a um tipo (`assinatura` | `rubrica`).
- Remover a tab “Fluxo de Assinatura” da navegação padrão (manter código), e tornar o novo fluxo a primeira experiência do módulo.

## Impact
- Affected specs:
  - `formsign-admin` (novo fluxo de criação e gestão de documentos/links)
  - `formsign-signature` (novo fluxo público do assinante e regras de finalização)
- Affected code (estimado):
  - `src/features/assinatura-digital/` (UI/serviços existentes; integração do novo fluxo)
  - `src/app/(dashboard)/assinatura-digital/*` (nova página principal e remoção do tab do simulador)
  - `src/app/api/assinatura-digital/*` (novas rotas para criação do documento, upload/artefatos, links públicos e execução do fluxo público)
  - Supabase (novas tabelas/colunas/Storage para documentos, signatários e artefatos)


