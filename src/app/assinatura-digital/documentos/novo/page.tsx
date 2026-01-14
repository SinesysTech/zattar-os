import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../redirect-utils";

export default async function AssinaturaDigitalDocumentosNovoAliasPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  redirect(buildRedirectUrl("/app/assinatura-digital/documentos/novo", searchParams));
}
