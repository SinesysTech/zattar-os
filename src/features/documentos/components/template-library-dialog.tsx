'use client';

/**
 * Dialog para biblioteca de templates
 * Permite buscar, filtrar e usar templates para criar novos documentos
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Loader2,
  Globe,
  Lock,
  Star,
} from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { TemplateCard } from './template-card';
import type { TemplateComUsuario } from '@/backend/types/documentos/types';

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastaId?: number | null;
}

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  pastaId,
}: TemplateLibraryDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [templates, setTemplates] = React.useState<TemplateComUsuario[]>([]);
  const [maisUsados, setMaisUsados] = React.useState<TemplateComUsuario[]>([]);
  const [categorias, setCategorias] = React.useState<string[]>([]);
  const [busca, setBusca] = React.useState('');
  const [buscaDebounced, setBuscaDebounced] = React.useState('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [visibilidade, setVisibilidade] = React.useState<string>('');
  const [tab, setTab] = React.useState('todos');

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  // Carregar categorias
  React.useEffect(() => {
    if (open) {
      fetch('/api/templates?modo=categorias')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCategorias(data.data);
          }
        })
        .catch(console.error);
    }
  }, [open]);

  // Carregar templates mais usados
  React.useEffect(() => {
    if (open) {
      fetch('/api/templates?modo=mais_usados&limit=4')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMaisUsados(data.data);
          }
        })
        .catch(console.error);
    }
  }, [open]);

  // Carregar templates
  React.useEffect(() => {
    if (!open) return;

    async function fetchTemplates() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (buscaDebounced) {
          params.set('busca', buscaDebounced);
        }

        if (categoria) {
          params.set('categoria', categoria);
        }

        if (visibilidade) {
          params.set('visibilidade', visibilidade);
        }

        params.set('limit', '50');

        const response = await fetch(`/api/templates?${params}`);
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar templates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [open, buscaDebounced, categoria, visibilidade]);

  // Usar template
  const handleUseTemplate = async (template: TemplateComUsuario) => {
    setCreating(true);
    try {
      const response = await fetch(`/api/templates/${template.id}/usar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pasta_id: pastaId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar documento');
      }

      toast.success(`Documento criado a partir de "${template.titulo}"`);
      onOpenChange(false);

      // Navegar para o novo documento
      router.push(`/documentos/${data.data.id}`);
    } catch (error) {
      console.error('Erro ao usar template:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar documento');
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setBusca('');
    setCategoria('');
    setVisibilidade('');
  };

  const hasFilters = busca || categoria || visibilidade;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Biblioteca de Templates
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Escolha um template para criar um novo documento
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <Tabs value={tab} onValueChange={setTab} className="flex-1">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="mais_usados">
                <Star className="h-4 w-4 mr-1" />
                Mais Usados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-0 space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={visibilidade} onValueChange={setVisibilidade}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="publico">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público
                      </div>
                    </SelectItem>
                    <SelectItem value="privado">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Privado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* Lista de templates */}
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">Nenhum template encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasFilters
                        ? 'Tente ajustar os filtros de busca'
                        : 'Crie seu primeiro template para reutilizar'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mais_usados" className="mt-0">
              <ScrollArea className="h-[400px]">
                {maisUsados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">Nenhum template popular ainda</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Templates mais usados aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {maisUsados.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Loading overlay */}
          {creating && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Criando documento...</p>
              </div>
            </div>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
