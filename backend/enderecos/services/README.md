  [
    {"codigo": "RES", "descricao": "Residencial"},
    {"codigo": "COM", "descricao": "Comercial"}
  ]
  ```

## Validation Rules

Addresses are validated to ensure data quality:

- **Minimum Fields**: At least one of `logradouro`, `municipio`, or `cep` must be present
- **PJE Addresses**: `id_pje` must be > 0 for addresses sourced from PJE
- **Required Fields**: `entidade_tipo` and `entidade_id` are mandatory for all addresses
- **Incomplete Addresses**: Logged as warnings but not rejected (allows partial data capture)

Validation is performed in `validarEnderecoMinimo()` and logged in service methods.

## Upsert Logic

Address creation/update uses atomic upsert operations:

```typescript
const { data, error } = await supabase
  .from('enderecos')
  .upsert(params, {
    onConflict: 'id_pje,entidade_tipo,entidade_id',
    ignoreDuplicates: false // Always update on conflict
  })
  .select()
  .single();
```

**Benefits:**
- **Atomic**: No race conditions between check and insert
- **Efficient**: ~50% fewer database queries
- **Idempotent**: Same result regardless of existing data
- **Always Updates**: On conflict, updates existing record with new data

## Representative Addresses

Representatives do NOT use `entidade_tipo='representante'` (invalid type). Instead:

1. Address is created with the **party's** `entidade_tipo` + `entidade_id`
2. Representative's `endereco_id` FK links to this shared address
3. Rationale: Representatives typically share the party's address, avoiding duplication

Example:
```typescript
// Representative address points to party's address
const enderecoId = await processarEnderecoRepresentante(rep, parteId, tipoParte, processo);
// Links representative to party's address
await vincularEnderecoNaEntidade('representante', repId, enderecoId);
```

## Usage Examples

### Create Address for Client

```typescript
import { criarEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';

const result = await criarEndereco({
  entidade_tipo: 'cliente',
  entidade_id: 123,
  logradouro: 'Rua das Flores, 123',
  municipio: 'São Paulo',
  estado_sigla: 'SP',
  cep: '01234-567'
});

if (result.sucesso) {
  console.log('Address created:', result.endereco);
} else {
  console.error('Error:', result.erro);
}
```

### Upsert Address from PJE Capture

```typescript
import { upsertEnderecoPorIdPje } from '@/backend/enderecos/services/enderecos-persistence.service';

const result = await upsertEnderecoPorIdPje({
  id_pje: 456,
  entidade_tipo: 'parte_contraria',
  entidade_id: 789,
  logradouro: enderecoPJE.logradouro,
  municipio: enderecoPJE.municipio,
  estado_sigla: enderecoPJE.estado?.sigla,
  dados_pje_completo: enderecoPJE, // Required for audit
  // ... other fields
});
```

### Query Addresses by Entity

```typescript
import { buscarEnderecosPorEntidade } from '@/backend/enderecos/services/enderecos-persistence.service';

const enderecos = await buscarEnderecosPorEntidade({
  entidade_tipo: 'cliente',
  entidade_id: 123
});
// Returns array sorted by correspondencia DESC, situacao ASC
```

### Find Principal Address

```typescript
import { buscarEnderecoPrincipal } from '@/backend/enderecos/services/enderecos-persistence.service';

const enderecoPrincipal = await buscarEnderecoPrincipal('cliente', 123);
// Returns address with correspondencia=true OR situacao='P'
```

### Link Address to Entity

```typescript
import { createClient } from '@/backend/utils/supabase/server-client';

const supabase = createClient();
await supabase
  .from('clientes')
  .update({ endereco_id: enderecoId })
  .eq('id', clienteId);
```

## Error Handling

Service methods return `OperacaoEnderecoResult` with success/error information:

```typescript
interface OperacaoEnderecoResult {
  sucesso: boolean;
  endereco?: Endereco;
  erro?: string;
}