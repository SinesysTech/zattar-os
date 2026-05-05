import { listarBases } from './repository';
import { ConhecimentoClient } from './conhecimento-client';
import { getCurrentUser } from '@/lib/auth/server';

export default async function ConhecimentoPage() {
  const [bases, user] = await Promise.all([
    listarBases(),
    getCurrentUser(),
  ]);
  return <ConhecimentoClient bases={bases} isSuperAdmin={!!user?.roles.includes('admin')} />;
}
