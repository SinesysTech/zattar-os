'use client';

import dynamic from 'next/dynamic';

const SalariosContent = dynamic(
  () => import('./salarios-content').then(mod => ({ default: mod.SalariosContent })),
  { ssr: false }
);

export default function SalariosPage() {
  return <SalariosContent />;
}
