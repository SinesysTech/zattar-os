import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../../redirect-utils";

export default async function AssinaturaDigitalDocumentoEditarAliasPage(props: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  redirect(
    buildRedirectUrl(`/app/assinatura-digital/documentos/editar/${params.uuid}`, searchParams)
  );
}
