import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../../redirect-utils";

export default async function AssinaturaDigitalFormularioSchemaAliasPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  redirect(
    buildRedirectUrl(`/app/assinatura-digital/formularios/${params.id}/schema`, searchParams)
  );
}
