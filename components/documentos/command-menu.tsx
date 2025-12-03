'use client';

/**
 * Command Menu (Cmd+K) para navegação e ações rápidas
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Home,
  Clock,
  FilePlus,
  FolderPlus,
  Trash2,
  File,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import type { DocumentoComUsuario } from '@/backend/types/documentos/types';

interface CommandMenuProps {
  onNewDocument?: () => void;
  onNewFolder?: () => void;
  onOpenTemplates?: () => void;
  onImport?: () => void;
}

export function CommandMenu({
  onNewDocument,
  onNewFolder,
  onOpenTemplates,
  onImport,
}: CommandMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [recentDocuments, setRecentDocuments] = React.useState<DocumentoComUsuario[]>([]);
  const [searchResults, setSearchResults] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Atalho de teclado global
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Carregar documentos recentes quando abrir
  React.useEffect(() => {
    if (open && recentDocuments.length === 0) {
      fetch('/api/documentos?limit=5&ordenar_por=updated_at&ordem=desc')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRecentDocuments(data.data);
          }
        })
        .catch(console.error);
    }
  }, [open, recentDocuments.length]);

  // Buscar documentos quando digitar
  React.useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/documentos?busca=${encodeURIComponent(search)}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const navigateTo = (path: string) => {
    handleSelect(() => router.push(path));
  };

  const openDocument = (id: number) => {
    handleSelect(() => router.push(`/documentos/${id}`));
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Digite um comando ou busque documentos..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Buscando...' : 'Nenhum resultado encontrado.'}
        </CommandEmpty>

        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <CommandGroup heading="Resultados da busca">
            {searchResults.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => openDocument(doc.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{doc.titulo || 'Sem título'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Ações rápidas */}
        {!search && (
          <>
            <CommandGroup heading="Ações rápidas">
              {onNewDocument && (
                <CommandItem onSelect={() => handleSelect(onNewDocument)}>
                  <FilePlus className="mr-2 h-4 w-4" />
                  <span>Novo documento</span>
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
              )}
              {onNewFolder && (
                <CommandItem onSelect={() => handleSelect(onNewFolder)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  <span>Nova pasta</span>
                </CommandItem>
              )}
              {onOpenTemplates && (
                <CommandItem onSelect={() => handleSelect(onOpenTemplates)}>
                  <File className="mr-2 h-4 w-4" />
                  <span>Usar template</span>
                  <CommandShortcut>⌘T</CommandShortcut>
                </CommandItem>
              )}
              {onImport && (
                <CommandItem onSelect={() => handleSelect(onImport)}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Importar arquivo</span>
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />

            {/* Documentos recentes */}
            {recentDocuments.length > 0 && (
              <>
                <CommandGroup heading="Documentos recentes">
                  {recentDocuments.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      onSelect={() => openDocument(doc.id)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span className="flex-1 truncate">{doc.titulo || 'Sem título'}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />
              </>
            )}

            {/* Navegação */}
            <CommandGroup heading="Navegação">
              <CommandItem onSelect={() => navigateTo('/documentos')}>
                <Home className="mr-2 h-4 w-4" />
                <span>Documentos</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo('/documentos/lixeira')}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Lixeira</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
