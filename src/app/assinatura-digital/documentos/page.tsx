import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../redirect-utils";

export default function AssinaturaDigitalDocumentosAliasPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  redirect(buildRedirectUrl("/app/assinatura-digital/documentos", searchParams));
}
