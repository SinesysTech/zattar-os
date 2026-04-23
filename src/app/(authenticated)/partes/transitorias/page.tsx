import { Metadata } from 'next';
import { TransitoriasListClient } from './client';

export const metadata: Metadata = {
  title: 'Cadastros pendentes · Partes contrárias',
};

export default function TransitoriasPage() {
  return <TransitoriasListClient />;
}
