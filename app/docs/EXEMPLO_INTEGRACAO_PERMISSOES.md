# Exemplo de Integração do Sistema de Permissões

Este documento mostra como integrar o `checkPermission` nas rotas API existentes.

## 1. Importar o Helper

```typescript
import { checkPermission } from '@/backend/utils/auth/authorization';
```

## 2. Exemplo Básico - Rota de Criação

```typescript
// app/api/contratos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { checkPermission } from '@/backend/utils/auth/authorization';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificar permissão
    const hasPermission = await checkPermission(
      authResult.usuarioId,
      'contratos',
      'criar'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar contratos' },
        { status: 403 }
      );
    }

    // 3. Continuar com a lógica normal...
    const body = await request.json();
    // ... resto do código
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 3. Exemplo com Múltiplas Permissões

```typescript
// app/api/contratos/[id]/route.ts
import { checkMultiplePermissions } from '@/backend/utils/auth/authorization';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar múltiplas permissões (requer TODAS)
  const hasPermissions = await checkMultiplePermissions(
    authResult.usuarioId,
    [
      ['contratos', 'deletar'],
      ['contratos', 'visualizar'], // Precisa ver antes de deletar
    ],
    true // requireAll = true
  );

  if (!hasPermissions) {
    return NextResponse.json(
      { error: 'Você não tem permissão para deletar contratos' },
      { status: 403 }
    );
  }

  // ... lógica de deleção
}
```

## 4. Exemplo com Verificação Condicional

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Verificar permissão diferente dependendo da ação
  let recurso = 'audiencias';
  let operacao = 'editar';

  if (body.url_audiencia_virtual) {
    // Operação específica requer permissão especial
    operacao = 'editar_url_virtual';
  }

  const hasPermission = await checkPermission(
    authResult.usuarioId,
    recurso,
    operacao
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: `Você não tem permissão para ${operacao} ${recurso}` },
      { status: 403 }
    );
  }

  // ... lógica de atualização
}
```

## 5. Exemplo com Ações Específicas

```typescript
// app/api/acervo/[id]/responsavel/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar permissão específica para atribuir responsável
  const hasPermission = await checkPermission(
    authResult.usuarioId,
    'acervo',
    'atribuir_responsavel'
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Você não tem permissão para atribuir responsáveis' },
      { status: 403 }
    );
  }

  // ... lógica de atribuição
}
```

## 6. Helper Reutilizável

Crie um helper para simplificar a verificação:

```typescript
// backend/utils/auth/require-permission.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from './api-auth';
import { checkPermission } from './authorization';
import type { Recurso, Operacao } from '@/backend/types/permissoes/types';

export const requirePermission = async (
  request: NextRequest,
  recurso: Recurso,
  operacao: Operacao
): Promise<{ usuarioId: number } | NextResponse> => {
  // 1. Autenticação
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verificar permissão
  const hasPermission = await checkPermission(
    authResult.usuarioId,
    recurso,
    operacao
  );

  if (!hasPermission) {
    return NextResponse.json(
      {
        error: `Você não tem permissão para ${operacao} ${recurso}`,
        recurso,
        operacao,
      },
      { status: 403 }
    );
  }

  // Retornar usuarioId se autenticado e autorizado
  return { usuarioId: authResult.usuarioId };
};
```

### Uso do Helper:

```typescript
// app/api/contratos/route.ts
import { requirePermission } from '@/backend/utils/auth/require-permission';

export async function POST(request: NextRequest) {
  // Verifica autenticação + autorização em uma linha
  const authOrError = await requirePermission(request, 'contratos', 'criar');

  // Se retornou NextResponse, é um erro (401 ou 403)
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  // Caso contrário, temos o usuarioId
  const { usuarioId } = authOrError;

  // Continuar com a lógica...
  const body = await request.json();
  // ...
}
```

## 7. Debug e Monitoramento

```typescript
import { getCacheStats } from '@/backend/utils/auth/authorization';

// Ver estatísticas do cache
const stats = getCacheStats();
console.log('Cache de permissões:', stats);
// Output: { total: 150, ativas: 120, expiradas: 30 }
```

## 8. Invalidação Manual de Cache

```typescript
import { invalidarCacheUsuario } from '@/backend/utils/auth/authorization';

// Invalidar cache quando permissões mudarem
await invalidarCacheUsuario(usuarioId);
```

## Resumo: Fluxo Completo

1. **Autenticação** (`authenticateRequest`) → Verifica se está logado
2. **Autorização** (`checkPermission`) → Verifica se tem permissão
3. **Lógica de negócio** → Executa a ação

**Sempre nesta ordem!** 🔒
