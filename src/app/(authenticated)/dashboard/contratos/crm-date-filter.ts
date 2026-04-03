import { endOfDay, startOfDay } from "date-fns";

export type CrmDateFilter =
  | { mode: "all" }
  | { mode: "range"; from: Date; to: Date };

export type CrmDateFilterInput =
  | { mode: "all" }
  | { mode: "range"; from: string; to: string }; // ISO or YYYY-MM-DD

export function normalizeCrmDateFilter(input?: CrmDateFilterInput): CrmDateFilter {
  if (!input || input.mode === "all") return { mode: "all" };

  const fromDate = new Date(input.from);
  const toDate = new Date(input.to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return { mode: "all" };
  }

  const from = startOfDay(fromDate);
  const to = endOfDay(toDate);

  if (from.getTime() > to.getTime()) return { mode: "all" };

  return { mode: "range", from, to };
}

export function parseCrmDateFilterFromSearchParams(searchParams?: Record<string, string | string[] | undefined>): CrmDateFilter {
  const get = (key: string): string | undefined => {
    if (!searchParams || !(key in searchParams)) return undefined;
    const v = searchParams[key];
    if (!v) return undefined;
    return Array.isArray(v) ? v[0] : v;
  };

  const period = get("period");
  if (!period || period === "all") return { mode: "all" };

  const from = get("from");
  const to = get("to");
  if (!from || !to) return { mode: "all" };

  return normalizeCrmDateFilter({ mode: "range", from, to });
}

export function toCrmDateFilterInput(filter: CrmDateFilter): CrmDateFilterInput {
  if (filter.mode === "all") return { mode: "all" };
  return { mode: "range", from: filter.from.toISOString(), to: filter.to.toISOString() };
}


