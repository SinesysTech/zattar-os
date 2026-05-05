import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Conhecimento — ZattarOS',
};

export default function ConhecimentoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
