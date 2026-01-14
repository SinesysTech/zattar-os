import { redirect } from "next/navigation";
import { buildRedirectUrl, type SearchParams } from "./redirect-utils";

export default async function AssinaturaDigitalAliasPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  redirect(buildRedirectUrl("/app/assinatura-digital", searchParams));
}
