'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * ClientOnlyTabs - Wrapper para componente Tabs do Radix UI
 * 
 * Evita hydration mismatch com React 19 renderizando tabs apenas no cliente.
 * Isso resolve a incompatibilidade conhecida entre React 19 e Radix UI.
 */

interface ClientOnlyTabsProps extends React.ComponentProps<typeof Tabs> {
  children: React.ReactNode;
}

const ClientOnlyTabs = React.forwardRef<
  React.ElementRef<typeof Tabs>,
  ClientOnlyTabsProps
>(({ children, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Tabs ref={ref} {...props}>
      {children}
    </Tabs>
  );
});
ClientOnlyTabs.displayName = 'ClientOnlyTabs';

export { ClientOnlyTabs, TabsList, TabsTrigger, TabsContent };
