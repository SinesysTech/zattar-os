# Design: Melhorias na Página de Lixeira de Documentos

## 1. Visão Geral da Solução

Esta spec implementa melhorias na página de lixeira de documentos para seguir os padrões de design estabelecidos no sistema, especialmente em relação aos filtros com checkbox/contorno pontilhado e estrutura de página usando `PageShell`.

### 1.1 Abordagem Escolhida

**Decisão**: Manter a estrutura de cards (não migrar para DataTable) e adicionar filtros padronizados.

**Justificativa**:
- A visualização em cards é mais adequada para documentos excluídos (mostra mais contexto)
- A página tem poucas ações (restaurar/excluir) que funcionam bem em cards
- Evita over-engineering para uma página secundária (lixeira)
- Mantém a UX atual que já funciona bem

### 1.2 Componentes Principais

```
PageShell
  └─ Conteúdo
      ├─ Toolbar (custom com filtros)
      │   ├─ Botão Voltar
      │   ├─ FilterPopover (Período)
      │   └─ Busca (opcional - fase 2)
      ├─ Card de Aviso (exclusão 30 dias)
      └─ Lista de Cards de Documentos
```

## 2. Arquitetura de Componentes

### 2.1 Estrutura de Arquivos

```
src/app/app/documentos/lixeira/
├── page.tsx                    # Server component (wrapper)
└── page-client.tsx             # Client component (atualizado)
```

**Não criar novos arquivos** - apenas atualizar `page-client.tsx` e `page.tsx`.

### 2.2 Hierarquia de Componentes

```tsx
// page.tsx (Server Component)
export default function LixeiraPage() {
  return (
    <Suspense fallback={<LixeiraLoading />}>
      <LixeiraClient />
    </Suspense>
  );
}

// page-client.tsx (Client Component)
export default function LixeiraClient() {
  return (
    <PageShell
      title="Lixeira"
      description="Documentos excluídos que serão deletados permanentemente após 30 dias"
    >
      <LixeiraToolbar />
      <LixeiraContent />
    </PageShell>
  );
}
```

### 2.3 Componentes Internos

#### LixeiraToolbar
```tsx
function LixeiraToolbar({
  periodo,
  onPeriodoChange,
  onVoltar,
}: {
  periodo: string;
  onPeriodoChange: (value: string) => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="icon" onClick={onVoltar}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <FilterPopover
        label="Período"
        options={PERIODO_OPTIONS}
        value={periodo}
        onValueChange={onPeriodoChange}
        defaultValue="todos"
      />
    </div>
  );
}
```

#### LixeiraContent
```tsx
function LixeiraContent({
  documentos,
  loading,
  actionLoading,
  onRestaurar,
  onExcluir,
}: LixeiraContentProps) {
  if (loading) return <LoadingState />;
  if (documentos.length === 0) return <EmptyState />;
  
  return (
    <div className="space-y-4">
      <AvisoExclusaoCard />
      <DocumentosList
        documentos={documentos}
        actionLoading={actionLoading}
        onRestaurar={onRestaurar}
        onExcluir={onExcluir}
      />
    </div>
  );
}
```

## 3. Lógica de Filtros

### 3.1 Opções de Filtro

```typescript
const PERIODO_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: 'todos', label: 'Todos' },
] as const;

type PeriodoFiltro = 'hoje' | '7dias' | '30dias' | 'todos';
```

### 3.2 Função de Filtro

```typescript
function filtrarDocumentosPorPeriodo(
  documentos: DocumentoComUsuario[],
  periodo: PeriodoFiltro
): DocumentoComUsuario[] {
  if (periodo === 'todos') return documentos;
  
  const agora = new Date();
  const limiteData = new Date();
  
  switch (periodo) {
    case 'hoje':
      limiteData.setHours(0, 0, 0, 0);
      break;
    case '7dias':
      limiteData.setDate(agora.getDate() - 7);
      break;
    case '30dias':
      limiteData.setDate(agora.getDate() - 30);
      break;
  }
  
  return documentos.filter((doc) => {
    if (!doc.deleted_at) return false;
    const deletedDate = new Date(doc.deleted_at);
    return deletedDate >= limiteData;
  });
}
```

### 3.3 Estado de Filtros

```typescript
// Estado
const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
const [documentos, setDocumentos] = useState<DocumentoComUsuario[]>([]);

// Documentos filtrados (computed)
const documentosFiltrados = useMemo(
  () => filtrarDocumentosPorPeriodo(documentos, periodo),
  [documentos, periodo]
);
```

## 4. Fluxo de Dados

### 4.1 Carregamento Inicial

```
1. Componente monta
2. useEffect chama fetchDocumentos()
3. fetchDocumentos() chama actionListarLixeira()
4. Documentos são armazenados em estado local
5. Filtros são aplicados no lado do cliente
```

### 4.2 Aplicação de Filtros

```
1. Usuário clica em FilterPopover
2. Usuário seleciona período
3. setPeriodo() atualiza estado
4. useMemo recalcula documentosFiltrados
5. UI re-renderiza com documentos filtrados
```

### 4.3 Restaurar Documento

```
1. Usuário clica em "Restaurar"
2. setActionLoading(documento.id)
3. Chama actionRestaurarDaLixeira(documento.id)
4. Se sucesso:
   - Remove documento do estado local
   - Toast de sucesso
5. setActionLoading(null)
6. Filtros permanecem ativos
```

## 5. Estrutura do Código

### 5.1 Imports

```typescript
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

// Shared Components
import { PageShell } from '@/components/shared/page-shell';
import { FilterPopover } from '@/features/partes';

// Feature Components
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentoComUsuario } from '@/features/documentos';
import {
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionDeletarPermanentemente
} from '@/features/documentos';
```

### 5.2 Constantes

```typescript
const PERIODO_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: 'todos', label: 'Todos' },
] as const;

type PeriodoFiltro = 'hoje' | '7dias' | '30dias' | 'todos';
```

### 5.3 Funções Auxiliares

```typescript
function filtrarDocumentosPorPeriodo(
  documentos: DocumentoComUsuario[],
  periodo: PeriodoFiltro
): DocumentoComUsuario[] {
  // Implementação conforme seção 3.2
}

function formatDeletedAt(date: string | null): string {
  if (!date) return 'Data desconhecida';
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  });
}
```

### 5.4 Componente Principal

```typescript
export default function LixeiraClient() {
  const router = useRouter();
  
  // Estado
  const [documentos, setDocumentos] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [periodo, setPeriodo] = React.useState<PeriodoFiltro>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] = React.useState<DocumentoComUsuario | null>(null);

  // Documentos filtrados
  const documentosFiltrados = React.useMemo(
    () => filtrarDocumentosPorPeriodo(documentos, periodo),
    [documentos, periodo]
  );

  // Buscar documentos
  const fetchDocumentos = React.useCallback(async () => {
    try {
      const result = await actionListarLixeira();
      if (result.success) {
        setDocumentos(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error);
      toast.error('Erro ao carregar documentos da lixeira');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // Handlers
  const handleRestaurar = async (documento: DocumentoComUsuario) => {
    // Implementação existente
  };

  const handleOpenDeleteDialog = (documento: DocumentoComUsuario) => {
    // Implementação existente
  };

  const handleDeletarPermanentemente = async () => {
    // Implementação existente
  };

  return (
    <PageShell
      title="Lixeira"
      description="Documentos excluídos que serão deletados permanentemente após 30 dias"
    >
      {/* Toolbar com filtros */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/app/documentos')}
          aria-label="Voltar para documentos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FilterPopover
          label="Período"
          options={PERIODO_OPTIONS}
          value={periodo}
          onValueChange={(val) => setPeriodo(val as PeriodoFiltro)}
          defaultValue="todos"
        />
      </div>

      {/* Conteúdo */}
      {loading ? (
        <LoadingState />
      ) : documentosFiltrados.length === 0 ? (
        <EmptyState onVoltar={() => router.push('/app/documentos')} />
      ) : (
        <div className="space-y-4">
          <AvisoExclusaoCard />
          {documentosFiltrados.map((documento) => (
            <DocumentoCard
              key={documento.id}
              documento={documento}
              actionLoading={actionLoading}
              onRestaurar={handleRestaurar}
              onExcluir={handleOpenDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmação */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documento={documentoParaDeletar}
        onConfirm={handleDeletarPermanentemente}
      />
    </PageShell>
  );
}
```

### 5.5 Componentes de UI

```typescript
function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function EmptyState({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="text-center">
        <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Lixeira vazia</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Documentos excluídos aparecerão aqui
        </p>
        <Button variant="outline" className="mt-4" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
      </div>
    </div>
  );
}

function AvisoExclusaoCard() {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <p className="text-sm text-orange-800 dark:text-orange-200">
          Documentos na lixeira serão deletados permanentemente após 30 dias.
        </p>
      </CardContent>
    </Card>
  );
}

function DocumentoCard({
  documento,
  actionLoading,
  onRestaurar,
  onExcluir,
}: {
  documento: DocumentoComUsuario;
  actionLoading: number | null;
  onRestaurar: (doc: DocumentoComUsuario) => void;
  onExcluir: (doc: DocumentoComUsuario) => void;
}) {
  const isLoading = actionLoading === documento.id;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">
                {documento.titulo || 'Documento sem título'}
              </CardTitle>
              <CardDescription>
                Excluído {formatDeletedAt(documento.deleted_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestaurar(documento)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restaurar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onExcluir(documento)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      {documento.descricao && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {documento.descricao}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  documento,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: DocumentoComUsuario | null;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O documento{' '}
            <strong>&quot;{documento?.titulo || 'Sem título'}&quot;</strong>{' '}
            será excluído permanentemente e não poderá ser recuperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## 6. Atualização do page.tsx

```typescript
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LixeiraClient from './page-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Lixeira | Documentos',
  description: 'Documentos excluídos que serão deletados permanentemente após 30 dias',
};

function LixeiraLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function LixeiraPage() {
  return (
    <Suspense fallback={<LixeiraLoading />}>
      <LixeiraClient />
    </Suspense>
  );
}
```

## 7. Testes

### 7.1 Testes Unitários

```typescript
describe('filtrarDocumentosPorPeriodo', () => {
  it('deve retornar todos os documentos quando periodo = "todos"', () => {
    const docs = [mockDoc1, mockDoc2];
    const result = filtrarDocumentosPorPeriodo(docs, 'todos');
    expect(result).toEqual(docs);
  });

  it('deve filtrar documentos excluídos hoje', () => {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    const docs = [
      { ...mockDoc1, deleted_at: hoje.toISOString() },
      { ...mockDoc2, deleted_at: ontem.toISOString() },
    ];
    
    const result = filtrarDocumentosPorPeriodo(docs, 'hoje');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockDoc1.id);
  });

  it('deve filtrar documentos dos últimos 7 dias', () => {
    const hoje = new Date();
    const dias5Atras = new Date(hoje);
    dias5Atras.setDate(hoje.getDate() - 5);
    const dias10Atras = new Date(hoje);
    dias10Atras.setDate(hoje.getDate() - 10);
    
    const docs = [
      { ...mockDoc1, deleted_at: dias5Atras.toISOString() },
      { ...mockDoc2, deleted_at: dias10Atras.toISOString() },
    ];
    
    const result = filtrarDocumentosPorPeriodo(docs, '7dias');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockDoc1.id);
  });
});
```

### 7.2 Testes de Integração

```typescript
describe('LixeiraClient', () => {
  it('deve renderizar PageShell com título e descrição', () => {
    render(<LixeiraClient />);
    expect(screen.getByText('Lixeira')).toBeInTheDocument();
    expect(screen.getByText(/deletados permanentemente após 30 dias/)).toBeInTheDocument();
  });

  it('deve exibir FilterPopover com opções de período', () => {
    render(<LixeiraClient />);
    const filtro = screen.getByRole('button', { name: /período/i });
    expect(filtro).toBeInTheDocument();
    expect(filtro).toHaveClass('border-dashed');
  });

  it('deve filtrar documentos ao selecionar período', async () => {
    const { user } = setup(<LixeiraClient />);
    
    // Abrir filtro
    await user.click(screen.getByRole('button', { name: /período/i }));
    
    // Selecionar "Últimos 7 dias"
    await user.click(screen.getByText('Últimos 7 dias'));
    
    // Verificar que apenas documentos dos últimos 7 dias são exibidos
    // (mock de documentos deve ser configurado no setup)
  });

  it('deve manter filtro ativo após restaurar documento', async () => {
    const { user } = setup(<LixeiraClient />);
    
    // Aplicar filtro
    await user.click(screen.getByRole('button', { name: /período/i }));
    await user.click(screen.getByText('Últimos 7 dias'));
    
    // Restaurar documento
    await user.click(screen.getByRole('button', { name: /restaurar/i }));
    
    // Verificar que filtro ainda está ativo
    expect(screen.getByRole('button', { name: /período/i })).toHaveTextContent('Últimos 7 dias');
  });
});
```

## 8. Propriedades de Correção

### Propriedade 1: Filtro de Período
**Valida: Requirements 1.1, 3.1**

Para todo documento `d` e período `p`:
- Se `p = "todos"`, então `d` está em `documentosFiltrados`
- Se `p = "hoje"`, então `d` está em `documentosFiltrados` ⟺ `d.deleted_at` é hoje
- Se `p = "7dias"`, então `d` está em `documentosFiltrados` ⟺ `d.deleted_at` ≥ (hoje - 7 dias)
- Se `p = "30dias"`, então `d` está em `documentosFiltrados` ⟺ `d.deleted_at` ≥ (hoje - 30 dias)

### Propriedade 2: Persistência de Filtro
**Valida: Requirements 3.1**

Para toda ação de restaurar/excluir:
- O filtro ativo antes da ação permanece ativo após a ação
- Apenas o documento afetado é removido da lista
- Outros documentos filtrados permanecem visíveis

### Propriedade 3: Consistência Visual
**Valida: Requirements 2.1, 2.2**

Para todo filtro ativo:
- O botão de filtro tem classe `border-dashed`
- O botão de filtro mostra badge com valor selecionado
- O popover contém checkboxes
- Existe opção "Limpar filtro" quando filtro está ativo

## 9. Decisões de Design

### 9.1 Por que não usar DataTable?

**Decisão**: Manter estrutura de cards em vez de migrar para DataTable.

**Razões**:
1. **Contexto visual**: Cards mostram mais informações (título, descrição, data) de forma mais legível
2. **Ações inline**: Botões de restaurar/excluir são mais acessíveis em cards
3. **Simplicidade**: Página secundária não precisa de complexidade de tabela
4. **UX existente**: Usuários já estão familiarizados com o layout atual

### 9.2 Filtros no Cliente vs Servidor

**Decisão**: Aplicar filtros no lado do cliente.

**Razões**:
1. **Performance**: Evita requisições adicionais ao servidor
2. **Simplicidade**: Lixeira geralmente tem poucos documentos
3. **Responsividade**: Filtros aplicam instantaneamente
4. **Consistência**: Mesma abordagem usada em outras páginas similares

### 9.3 Posicionamento do Botão Voltar

**Decisão**: Manter botão "Voltar" na toolbar, antes dos filtros.

**Razões**:
1. **Navegação clara**: Usuário sabe como voltar imediatamente
2. **Padrão estabelecido**: Outras páginas secundárias usam esse padrão
3. **Acessibilidade**: Botão é o primeiro elemento focável

## 10. Melhorias Futuras (Fora do Escopo)

1. **Busca por texto**: Filtrar documentos por título/descrição
2. **Filtro por tipo**: Se houver tipos de documentos diferentes
3. **Ordenação**: Por data de exclusão, título, etc.
4. **Seleção múltipla**: Restaurar/excluir múltiplos documentos de uma vez
5. **Paginação**: Se a lixeira crescer muito
6. **Estatísticas**: Mostrar quantos documentos por período

## 11. Checklist de Implementação

- [ ] Atualizar imports em `page-client.tsx`
- [ ] Adicionar constante `PERIODO_OPTIONS`
- [ ] Implementar função `filtrarDocumentosPorPeriodo`
- [ ] Adicionar estado `periodo` e `documentosFiltrados`
- [ ] Substituir estrutura por `PageShell`
- [ ] Adicionar `FilterPopover` na toolbar
- [ ] Extrair componentes de UI (LoadingState, EmptyState, etc.)
- [ ] Atualizar `page.tsx` com metadata
- [ ] Testar filtros manualmente
- [ ] Escrever testes unitários
- [ ] Escrever testes de integração
- [ ] Validar acessibilidade
- [ ] Verificar responsividade
- [ ] Code review
