import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const metadata: Metadata = {
  title: 'Perícias | Missão',
  description: 'Visão de missão das perícias — prazos e prioridades',
};

export const dynamic = 'force-dynamic';

export default function PericiasQuadroPage() {
  return <PericiasClient initialView="quadro" />;
}
