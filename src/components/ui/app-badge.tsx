'use client';

import * as React from 'react';
import { Badge, type BadgeTone } from '@/components/ui/badge';

/**
 * AppBadge
 *
 * Wrapper de governança para uso de badges em features.
 * - Use `SemanticBadge` para valores de domínio (status, tribunal, polo, etc)
 * - Use `AppBadge` apenas para badges puramente visuais/UX (ex.: rótulos de seção)
 */
export function AppBadge(
  props: React.ComponentProps<typeof Badge> & { tone?: BadgeTone }
) {
  return <Badge {...props} />;
}
