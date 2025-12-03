# Segmentos - Assinatura Digital Admin

## Overview

The Segmentos module manages logical groupings for digital signature forms. Each segmento can contain multiple formulários and serves as an organizational unit for different business areas or use cases.

## Features

- **List Segmentos**: View all segmentos with search, filtering by ativo status, and pagination
- **Create Segmento**: Create new segmentos with automatic slug generation from the name
- **Edit Segmento**: Update segmento details including name, slug, description, and ativo status
- **Duplicate Segmento**: Clone an existing segmento with a new name and slug
- **Delete Segmento**: Remove segmentos (bulk delete supported)
- **Export CSV**: Export segmentos data to CSV format
- **Formulários Count**: Display the number of formulários associated with each segmento

## Components

### Page (`page.tsx`)

Main page component featuring:
- DataTable with sortable columns (nome, slug, descricao, formularios_count, ativo)
- TableToolbar with search and ativo filter
- Row selection for bulk actions
- Integration with all dialog components

### Dialog Components (`components/`)

- **SegmentoCreateDialog**: Form dialog for creating new segmentos
- **SegmentoEditDialog**: Form dialog for editing existing segmentos
- **SegmentoDuplicateDialog**: Form dialog for duplicating segmentos
- **SegmentoDeleteDialog**: Confirmation dialog for deleting segmentos (supports bulk delete)

## API Endpoints

### `GET /api/assinatura-digital/admin/segmentos`

List segmentos with optional filters.

Query Parameters:
- `ativo` (boolean): Filter by ativo status
- `search` (string): Search by nome, slug, or descricao
- `slug` (string): Exact-match lookup by slug (for uniqueness validation)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Jurídico",
      "slug": "juridico",
      "descricao": "Documentos jurídicos",
      "ativo": true,
      "formularios_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### `POST /api/assinatura-digital/admin/segmentos`

Create a new segmento.

Request Body:
```json
{
  "nome": "Segmento Empresarial",
  "slug": "segmento-empresarial",
  "descricao": "Segmento para clientes empresariais",
  "ativo": true
}
```

### `PUT /api/assinatura-digital/admin/segmentos/[id]`

Update an existing segmento (partial update supported).

### `DELETE /api/assinatura-digital/admin/segmentos/[id]`

Delete a segmento. Returns 409 Conflict if the segmento has associated formulários.

## Data Types

### FormsignSegmento

```typescript
interface FormsignSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  formularios_count?: number;
  created_at?: string;
  updated_at?: string;
}
```

## Usage

### Auto-generated Slugs

When creating or duplicating a segmento, the slug is automatically generated from the name using the `generateSlug` function. Users can manually override the slug if needed.

### Slug Uniqueness

Before creating or updating a segmento, the system validates that the slug is unique by performing an exact-match lookup via the `?slug=` query parameter.

### Formulários Count

The `formularios_count` field is populated by the backend when listing segmentos. It shows the number of formulários associated with each segmento and is used to warn users before deleting segmentos with associated data.

## Permissions

All endpoints require `formsign_admin` permission with the appropriate action (`listar`, `criar`, `atualizar`, `deletar`).
