import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../redirect-utils";

export default function AssinaturaDigitalDocumentosNovoAliasPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  redirect(buildRedirectUrl("/app/assinatura-digital/documentos/novo", searchParams));
}
