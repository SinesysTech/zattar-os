"use client";

import dynamic from 'next/dynamic';

const SegmentosClient = dynamic(() => import('./client-page').then(m => m.SegmentosClient), { ssr: false });

export function ClientLoader() {
  return <SegmentosClient />;
}
