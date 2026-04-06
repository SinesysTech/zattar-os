# Regras de Negocio - Notas

## Contexto
Modulo de notas pessoais do usuario. Suporta notas de texto, checklists e imagens, com etiquetas (labels) coloridas para organizacao.

## Entidades Principais
- **Note**: Nota com titulo, conteudo, tipo, etiquetas e status de arquivamento
- **NoteLabel (Etiqueta)**: Etiqueta com titulo e cor, pertence ao usuario
- **NoteChecklistItem**: Item de checklist com texto e estado (checked)

## Regras de Validacao
### Nota
- `title`: obrigatorio, 1-200 caracteres (trimmed)
- `type`: `text`, `checklist` ou `image` (default: `text`)
- `labels`: array de IDs de etiquetas (inteiros positivos)
- `items`: array de checklist items (quando tipo=checklist)
- `image`: string opcional (quando tipo=image)

### Etiqueta
- `title`: obrigatorio, 1-80 caracteres (trimmed)
- `color`: obrigatoria, 1-64 caracteres (trimmed)

## Regras de Negocio
- Notas sao isoladas por usuario (`usuario_id`)
- Listagem exclui arquivadas por default; parametro `includeArchived` mostra todas
- Etiquetas sao vinculadas via tabela `nota_etiqueta_vinculos`
- Na atualizacao de labels, os vinculos anteriores sao deletados e recriados (replace-all)
- Atualizacao requer pelo menos um campo alterado
- Exclusao de nota e etiqueta sao hard deletes (sem soft delete)
- Notas sao ordenadas por `updated_at DESC`

## Tabelas
- `notas`: tabela principal
- `nota_etiquetas`: etiquetas do usuario
- `nota_etiqueta_vinculos`: relacao N:N entre notas e etiquetas

## Revalidacao de Cache
- `revalidatePath("/app/notas")` em todas as mutacoes (criar, atualizar, arquivar, excluir nota, criar/atualizar/excluir etiqueta)
