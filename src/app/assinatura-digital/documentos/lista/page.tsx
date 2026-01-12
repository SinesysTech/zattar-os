import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../redirect-utils";

export default function AssinaturaDigitalDocumentosListaAliasPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  redirect(buildRedirectUrl("/app/assinatura-digital/documentos/lista", searchParams));
}
