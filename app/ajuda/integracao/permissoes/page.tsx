import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PermissoesDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Permissões</h1>
        </div>
        <p className="text-muted-foreground">
          Guia de integração do sistema de permissões nas rotas API do Sinesys.
        </p>
      </div>

      {/* Importar Helper */}
      <Card>
        <CardHeader>
          <CardTitle>1. Importar o Helper</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`import { checkPermission } from '@/backend/utils/auth/authorization';`}
          </pre>
        </CardContent>
      </Card>

      {/* Exemplo Básico */}
      <Card>
        <CardHeader>
          <CardTitle>2. Exemplo Básico - Rota de Criação</CardTitle>
          <CardDescription>
            Verificação de permissão para criar recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// app/api/contratos/route.ts
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
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Múltiplas Permissões */}
      <Card>
        <CardHeader>
          <CardTitle>3. Múltiplas Permissões</CardTitle>
          <CardDescription>
            Verificar várias permissões de uma vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// app/api/contratos/[id]/route.ts
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
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Verificação Condicional */}
      <Card>
        <CardHeader>
          <CardTitle>4. Verificação Condicional</CardTitle>
          <CardDescription>
            Permissões diferentes baseadas na ação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`export async function PUT(
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
      { error: \`Você não tem permissão para \${operacao} \${recurso}\` },
      { status: 403 }
    );
  }

  // ... lógica de atualização
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Helper Reutilizável */}
      <Card>
        <CardHeader>
          <CardTitle>5. Helper Reutilizável</CardTitle>
          <CardDescription>
            Simplifique a verificação com um helper
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// backend/utils/auth/require-permission.ts
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
        error: \`Você não tem permissão para \${operacao} \${recurso}\`,
        recurso,
        operacao,
      },
      { status: 403 }
    );
  }

  // Retornar usuarioId se autenticado e autorizado
  return { usuarioId: authResult.usuarioId };
};`}
          </pre>

          <h4 className="font-semibold">Uso do Helper:</h4>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// app/api/contratos/route.ts
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
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Debug e Cache */}
      <Card>
        <CardHeader>
          <CardTitle>6. Debug e Monitoramento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`import { getCacheStats } from '@/backend/utils/auth/authorization';

// Ver estatísticas do cache
const stats = getCacheStats();
console.log('Cache de permissões:', stats);
// Output: { total: 150, ativas: 120, expiradas: 30 }`}
          </pre>

          <h4 className="font-semibold">Invalidação Manual de Cache:</h4>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`import { invalidarCacheUsuario } from '@/backend/utils/auth/authorization';

// Invalidar cache quando permissões mudarem
await invalidarCacheUsuario(usuarioId);`}
          </pre>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo: Fluxo Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><strong>Autenticação</strong> (<code className="bg-muted px-1 rounded">authenticateRequest</code>) → Verifica se está logado</li>
            <li><strong>Autorização</strong> (<code className="bg-muted px-1 rounded">checkPermission</code>) → Verifica se tem permissão</li>
            <li><strong>Lógica de negócio</strong> → Executa a ação</li>
          </ol>
          <p className="mt-4 text-sm font-medium">
            Sempre nesta ordem!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
