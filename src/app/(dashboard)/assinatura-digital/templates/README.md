# Templates de Assinatura Digital - Admin

## Visão Geral

Página de gerenciamento de templates PDF para assinatura digital. Permite criar, editar, duplicar e deletar templates, com upload de PDF e mapeamento visual de campos.

## Componentes

### Página Principal (`page.tsx`)
- Lista templates com DataTable
- Busca e filtros avançados
- Bulk actions (delete, export)
- Paginação server-side

### Dialogs

#### `TemplateCreateDialog`
- Upload de PDF via Dropzone
- Validação de arquivo (tipo, tamanho)
- Upload para Supabase Storage
- Extração automática de metadados

#### `TemplateDuplicateDialog`
- Duplica template existente
- Copia campos mapeados e configurações
- Permite editar nome e descrição

#### `TemplateDeleteDialog`
- Confirmação de exclusão
- Suporta exclusão única e em lote
- Feedback de progresso

### Filtros (`template-filters.tsx`)
- Status: ativo, inativo, rascunho
- Disponibilidade: ativo/inativo
- Integração com TableToolbar

## Fluxo de Uso

### Criar Template
1. Clicar em "Novo Template"
2. Preencher nome e descrição
3. Fazer upload do PDF
4. Salvar (cria como rascunho)
5. Editar template para mapear campos

### Editar Template
1. Clicar em "Editar" na tabela
2. Abre FieldMappingEditor visual
3. Mapear campos no PDF
4. Salvar alterações

### Duplicar Template
1. Clicar em "Duplicar" no menu de ações
2. Editar nome da cópia
3. Confirmar duplicação
4. Nova cópia criada como rascunho

## APIs Utilizadas

- `GET /api/assinatura-digital/templates` - Listar
- `POST /api/assinatura-digital/templates` - Criar
- `GET /api/assinatura-digital/templates/[id]` - Obter
- `PUT /api/assinatura-digital/templates/[id]` - Atualizar
- `DELETE /api/assinatura-digital/templates/[id]` - Deletar

## Permissões

Requer permissão `assinatura_digital` com ações:
- `listar` - Ver templates
- `criar` - Criar templates
- `editar` - Editar templates
- `deletar` - Deletar templates

## Melhorias Implementadas

✅ Upload de PDF com Dropzone (sem inputs manuais!)
✅ Busca e filtros avançados
✅ Bulk actions (delete, export)
✅ Duplicação de templates
✅ Loading states e error handling
✅ Feedback visual melhorado
✅ Responsivo e acessível

## Próximos Passos

- [ ] Preview de PDF na tabela (hover)
- [ ] Histórico de versões
- [ ] Tags/categorias para templates
- [ ] Importação/exportação em lote