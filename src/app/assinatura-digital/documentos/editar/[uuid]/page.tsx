import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../../redirect-utils";

export default function AssinaturaDigitalDocumentoEditarAliasPage({
  params,
  searchParams,
}: {
  params: { uuid: string };
  searchParams?: SearchParams;
}) {
  redirect(
    buildRedirectUrl(`/app/assinatura-digital/documentos/editar/${params.uuid}`, searchParams)
  );
}
