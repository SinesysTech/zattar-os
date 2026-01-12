import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "../redirect-utils";

export default function AssinaturaDigitalTemplatesAliasPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  redirect(buildRedirectUrl("/app/assinatura-digital/templates", searchParams));
}
