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

export default function PartesRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const query = toQueryString(searchParams);
  redirect(`/app/partes${query}`);
}
