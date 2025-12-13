'use client';

import * as React from 'react';
import { TablePagination } from '@/components/shared/table-pagination';

type DataPaginationProps = Omit<
  React.ComponentProps<typeof TablePagination>,
  'variant'
>;

/**
 * DataPagination
 *
 * Wrapper para padronizar paginação quando usada dentro do `DataShell`.
 */
export function DataPagination(props: DataPaginationProps) {
  return <TablePagination variant="integrated" {...props} />;
}


