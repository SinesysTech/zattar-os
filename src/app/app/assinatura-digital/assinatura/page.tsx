import { redirect } from 'next/navigation';

/**
 * AssinaturaPage - Redirect para o novo fluxo de documentos
 *
 * O antigo formulario AssinaturaFluxoForm foi substituido pelo novo fluxo
 * de 3 etapas: Upload → Configurar → Revisar
 *
 * Usa redirect() server-side (HTTP 307) em vez de router.replace() client-side
 * para evitar warning "Session History Item Skippable"
 */
export default function AssinaturaPage() {
  redirect('/app/assinatura-digital/documentos/novo');
}
