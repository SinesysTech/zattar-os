# Formulários de Assinatura Digital - Admin

## Visão Geral

Página de gerenciamento de formulários dinâmicos para assinatura digital. Permite criar, editar schema, duplicar e deletar formulários, com seleção de segmentos, templates opcionais e configurações de foto e geolocalização.

## Componentes

### Página Principal (`page.tsx`)
- Lista formulários com DataTable
- Busca e filtros avançados
- Bulk actions (delete, export)
- Paginação server-side

### Dialogs

#### `FormularioCreateDialog`
- Seleção de segmento via Combobox
- Multi-select de templates com preview
- Toggles para foto necessária e geolocalização necessária
- Slug auto-gerado a partir do nome

#### `FormularioDuplicateDialog`
- Duplica formulário existente
- Copia configurações (segmento, templates, toggles)
- Permite editar nome e descrição

#### `FormularioDeleteDialog`
- Confirmação de exclusão
- Suporta exclusão única e em lote
- Feedback de progresso

### Filtros (`formulario-filters.tsx`)
- Segmento: multi-select
- Ativo: Sim/Não
- Foto necessária: Sim/Não
- Geolocalização necessária: Sim/Não
- Integração com TableToolbar

## Fluxo de Uso

### Criar Formulário
1. Clicar em "Novo Formulário"
2. Preencher nome (slug auto-gerado), selecionar segmento
3. Escolher templates opcionais via multi-select
4. Configurar toggles para foto e geolocalização
5. Salvar formulário

### Editar Schema
1. Clicar em "Editar Schema" na tabela
2. Abre FormSchemaBuilder visual
3. Editar campos do formulário
4. Salvar alterações

### Duplicar Formulário
1. Clicar em "Duplicar" no menu de ações
2. Editar nome da cópia (slug auto-gerado)
3. Confirmar duplicação
4. Nova cópia criada com configurações originais

### Deletar Formulário
1. Clicar em "Deletar" no menu de ações ou bulk action
2. Confirmar exclusão com warning
3. Formulário removido permanentemente

## Campos Principais
- `nome`: Nome do formulário
- `slug`: Identificador único (auto-gerado a partir do nome)
- `segmento_id`: ID do segmento (obrigatório)
- `template_ids`: Array de UUIDs de templates (opcional)
- `foto_necessaria`: Boolean (default true)
- `geolocation_necessaria`: Boolean (default false)
- `form_schema`: Schema JSON editado via FormSchemaBuilder

## Filtros Disponíveis
- **Segmento**: Multi-select de segmentos
- **Ativo**: Sim/Não
- **Foto necessária**: Sim/Não
- **Geolocalização necessária**: Sim/Não

## APIs Utilizadas

- `GET /api/assinatura-digital/admin/formularios` - Listar formulários
- `POST /api/assinatura-digital/admin/formularios` - Criar formulário
- `GET /api/assinatura-digital/admin/formularios/[id]` - Obter formulário
- `PUT /api/assinatura-digital/admin/formularios/[id]` - Atualizar formulário
- `DELETE /api/assinatura-digital/admin/formularios/[id]` - Deletar formulário
- `GET /api/assinatura-digital/admin/formularios/[id]/schema` - Obter schema
- `PUT /api/assinatura-digital/admin/formularios/[id]/schema` - Atualizar schema
- `GET /api/assinatura-digital/admin/segmentos` - Listar segmentos
- `GET /api/assinatura-digital/admin/templates` - Listar templates

## Permissões

Requer permissão `formsign_admin` com ações:
- `listar` - Ver formulários
- `criar` - Criar formulários
- `editar` - Editar formulários
- `deletar` - Deletar formulários

## Melhorias Implementadas

✅ Seleção de segmento via Combobox (sem inputs manuais!)
✅ Multi-select de templates com preview
✅ Toggles visuais para foto/geolocalização
✅ Slug auto-gerado a partir do nome
✅ Busca e filtros avançados
✅ Bulk actions (delete, export)
✅ Loading states e error handling
✅ Feedback visual melhorado
✅ Responsivo e acessível

## Próximos Passos

- [ ] Preview de templates na seleção
- [ ] Validação de slug único em tempo real
- [ ] Reordenação de formulários (campo ordem)
- [ ] Importação/exportação em lote