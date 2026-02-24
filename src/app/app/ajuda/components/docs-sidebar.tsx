'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { docsRegistry, searchDocs, type DocEntry } from '../docs-registry';

function SidebarItem({ entry, level = 0 }: { entry: DocEntry; level?: number }) {
  const pathname = usePathname();
  const href = `/app/ajuda/${entry.slug}`;
  const isActive = pathname === href;
  const hasChildren = entry.children && entry.children.length > 0;
  const isParentActive = pathname?.startsWith(href + '/');
  const [expanded, setExpanded] = useState(isActive || isParentActive);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent',
            (isActive || isParentActive) && 'text-primary',
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 shrink-0 transition-transform', expanded && 'rotate-90')}
          />
          {entry.title}
        </button>
        {expanded && (
          <div>
            {entry.children!.map((child) => (
              <SidebarItem key={child.slug} entry={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
        isActive ? 'bg-accent text-primary font-medium' : 'text-muted-foreground',
      )}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      {entry.title}
    </Link>
  );
}

export function DocsSidebar() {
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return docsRegistry;

    const results = searchDocs(search);
    const slugs = new Set(results.map((r) => r.slug));

    // Também mostrar pais de resultados encontrados
    function filterTree(entries: DocEntry[]): DocEntry[] {
      return entries
        .map((entry) => {
          if (slugs.has(entry.slug)) return entry;
          if (entry.children) {
            const filtered = filterTree(entry.children);
            if (filtered.length > 0) return { ...entry, children: filtered };
          }
          return null;
        })
        .filter(Boolean) as DocEntry[];
    }

    return filterTree(docsRegistry);
  }, [search]);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na documentação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-1">
          {filteredEntries.map((entry) => (
            <SidebarItem key={entry.slug} entry={entry} />
          ))}
          {filteredEntries.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-4">
              Nenhum resultado encontrado.
            </p>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
