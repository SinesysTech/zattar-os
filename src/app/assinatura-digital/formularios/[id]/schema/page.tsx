import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../../redirect-utils";

export default function AssinaturaDigitalFormularioSchemaAliasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  redirect(
    buildRedirectUrl(`/app/assinatura-digital/formularios/${params.id}/schema`, searchParams)
  );
}
