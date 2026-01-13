import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(searchParams: SearchParams | undefined): string {
  if (!searchParams) return "";

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    }
  }

  const str = qs.toString();
  return str ? `?${str}` : "";
}

interface ProcessosCatchAllRedirectPageProps {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<SearchParams | undefined>;
}

export default async function ProcessosCatchAllRedirectPage({
  params,
  searchParams,
}: ProcessosCatchAllRedirectPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rest = (resolvedParams.path ?? []).join("/");
  const query = toQueryString(resolvedSearchParams);
  redirect(`/app/processos/${rest}${query}`);
}
