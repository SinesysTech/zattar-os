import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../../../redirect-utils";

export default function AssinaturaDigitalTemplateEditAliasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  redirect(
    buildRedirectUrl(`/app/assinatura-digital/templates/${params.id}/edit`, searchParams)
  );
}
