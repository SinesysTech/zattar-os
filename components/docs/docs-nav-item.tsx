'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface NavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

interface DocsNavItemProps {
  item: NavItem;
  level?: number;
}

export function DocsNavItem({ item, level = 0 }: DocsNavItemProps) {
  const pathname = usePathname();
  const isActive = item.href === pathname;
  const hasChildren = item.items && item.items.length > 0;

  // Verificar se algum filho está ativo para expandir automaticamente
  const isChildActive = hasChildren && item.items?.some(
    (child) => child.href === pathname ||
    child.items?.some((grandchild) => grandchild.href === pathname)
  );

  const [isOpen, setIsOpen] = React.useState(isChildActive || isActive);

  React.useEffect(() => {
    if (isChildActive || isActive) {
      setIsOpen(true);
    }
  }, [isChildActive, isActive]);

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              level > 0 && 'pl-6',
              isChildActive && 'text-primary'
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4">
          {item.items?.map((child, index) => (
            <DocsNavItem key={index} item={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        level > 0 && 'pl-6',
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground'
      )}
    >
      {item.icon}
      <span>{item.title}</span>
    </Link>
  );
}

interface DocsNavSectionProps {
  section: NavSection;
}

export function DocsNavSection({ section }: DocsNavSectionProps) {
  return (
    <div className="space-y-1">
      <h4 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {section.title}
      </h4>
      <div className="space-y-1">
        {section.items.map((item, index) => (
          <DocsNavItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
}
