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

### `POST /api/assinatura-digital/segmentos`

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

### `PUT /api/assinatura-digital/segmentos/[id]`

Update an existing segmento (partial update supported).

### `DELETE /api/assinatura-digital/segmentos/[id]`

Delete a segmento. Returns 409 Conflict if the segmento has associated formulários.

## Data Types

### AssinaturaDigitalSegmento

```typescript
interface AssinaturaDigitalSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  formularios_count?: number;
  created_at?: string;
  updated_at?: string;
}