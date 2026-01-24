import { redirect } from 'next/navigation';

/**
 * Página de Captura - Redireciona para Histórico (seção padrão)
 * 
 * A navegação entre as seções (Histórico, Agendamentos, Credenciais, Tribunais)
 * agora é feita através da sidebar, que leva diretamente para cada rota.
 */
export default function CapturaPage() {
  redirect('/app/captura/historico');
}