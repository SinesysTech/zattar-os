# Verificações e Correções - Assinatura Digital

## Problema Identificado

Erro de validação na tabela de documentos de assinatura digital: "Erro de validação"

## Verificações Realizadas

### 1. ✅ Estrutura da Tabela
- **Tabela**: `assinatura_digital_documentos`
- **Status**: Existe e está acessível
- **Registros**: 7 documentos encontrados
- **Campos**: Todos os campos necessários estão presentes

### 2. ✅ Políticas RLS (Row Level Security)
- **Service Role**: Acesso completo configurado
- **Authenticated**: Permissão de SELECT configurada
- **Status**: Políticas funcionando corretamente

### 3. ✅ Serviço de Listagem
- **Função**: `documentosService.listDocumentos()`
- **Status**: Funcionando corretamente
- **Retorno**: Estrutura de dados correta com contagens de assinantes

### 4. ❌ Validação do Schema Zod
**PROBLEMA ENCONTRADO**: O schema da action `actionListDocumentos` aceita `pageSize` máximo de 100, mas o código estava passando 200.

```typescript
// Schema da action
z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(), // ← Máximo 100
  status: z.enum(["rascunho", "pronto", "concluido", "cancelado"]).optional(),
})

// Código estava passando
actionListDocumentos({
  page: 1,
  pageSize: 200, // ← ERRO: Excede o máximo
})
```

### 5. ❌ Tipo TypeScript Incompleto
**PROBLEMA ENCONTRADO**: O tipo `DocumentoListItem` não incluía todos os campos retornados pelo banco de dados.

Campos faltantes:
- `hash_original_sha256`
- `hash_final_sha256`
- `created_by`
- `contrato_id`

## Correções Aplicadas

### 1. Substituição do Ícone
**Arquivo**: `src/app/app/assinatura-digital/documentos/lista/client-page.tsx`

```diff
- import { FileUp } from "lucide-react";
+ import { Plus } from "lucide-react";

- <FileUp className="h-4 w-4" />
+ <Plus className="h-4 w-4" />
```

### 2. Correção do pageSize
**Arquivo**: `src/app/app/assinatura-digital/documentos/lista/client-page.tsx`

```diff
  const resultado = await actionListDocumentos({
    page: 1,
-   pageSize: 200,
+   pageSize: 100, // Máximo permitido pelo schema
  });
```

### 3. Atualização do Tipo DocumentoListItem
**Arquivo**: `src/app/app/assinatura-digital/documentos/lista/components/columns.tsx`

```diff
export type DocumentoListItem = {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url: string | null;
+ hash_original_sha256: string | null;
+ hash_final_sha256: string | null;
+ created_by: number | null;
  created_at: string;
  updated_at: string;
+ contrato_id: number | null;
  _assinantes_count?: number;
  _assinantes_concluidos?: number;
};
```

## Scripts de Teste Criados

### 1. `scripts/test-assinatura-digital-list.ts`
Testa a conexão com o banco e a listagem de documentos.

```bash
npx tsx scripts/test-assinatura-digital-list.ts
```

### 2. `scripts/test-action-list-documentos.ts`
Testa o serviço de listagem de documentos.

```bash
npx tsx scripts/test-action-list-documentos.ts
```

### 3. `scripts/test-action-validation.ts`
Testa a validação do schema Zod.

```bash
npx tsx scripts/test-action-validation.ts
```

## Resultado Final

✅ **Problema Resolvido**

1. Ícone substituído de `FileUp` para `Plus`
2. Validação corrigida: `pageSize` agora respeita o limite de 100
3. Tipo TypeScript atualizado com todos os campos do banco
4. Tabela e políticas RLS funcionando corretamente

## Recomendações

### 1. Aumentar o Limite de pageSize (Opcional)
Se for necessário listar mais de 100 documentos por página, atualizar o schema:

```typescript
// src/app/app/assinatura-digital/feature/actions/documentos-actions.ts
z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(200).optional(), // ← Aumentar limite
  status: z.enum(["rascunho", "pronto", "concluido", "cancelado"]).optional(),
})
```

### 2. Adicionar Paginação Server-Side
Para melhor performance com muitos documentos, implementar paginação no serviço:

```typescript
export async function listDocumentos(
  params: {
    limit?: number;
    offset?: number; // ← Adicionar offset
  } = {}
): Promise<{
  documentos: DocumentoListItem[];
  total: number; // ← Adicionar total
}> {
  // ... implementação
}
```

### 3. Validação de Tipos em Tempo de Compilação
Considerar usar o tipo retornado pelo Supabase diretamente:

```typescript
import type { Database } from '@/types/supabase';

type DocumentoRow = Database['public']['Tables']['assinatura_digital_documentos']['Row'];
```

## Testes Recomendados

1. ✅ Testar a listagem de documentos na interface
2. ✅ Verificar se o botão "Novo Documento" exibe o ícone correto
3. ✅ Testar com diferentes quantidades de documentos
4. ✅ Verificar se a paginação funciona corretamente
5. ✅ Testar filtros de status

## Conclusão

O erro "Erro de validação" estava sendo causado por uma violação do schema Zod, onde o `pageSize` de 200 excedia o máximo permitido de 100. Após a correção, a tabela deve exibir os documentos corretamente.
