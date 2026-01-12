export type SearchParams = Record<string, string | string[] | undefined>;

export function buildRedirectUrl(
  targetPath: string,
  searchParams?: SearchParams
): string {
  if (!searchParams) return targetPath;

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${targetPath}?${query}` : targetPath;
}
