import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LeadSourceRow = {
  fonte: string;
  leads: number;
};

const DEFAULT_DATA: LeadSourceRow[] = [
  { fonte: "Website", leads: 412 },
  { fonte: "Indicação", leads: 287 },
  { fonte: "Anúncios", leads: 198 },
  { fonte: "Outros", leads: 94 },
];

export function LeadBySourceCard({ data = DEFAULT_DATA }: { data?: LeadSourceRow[] }) {
  const total = data.reduce((acc, row) => acc + row.leads, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Leads por origem</CardTitle>
        <CardDescription>Distribuição de leads por canal</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="space-y-2">
            {data.map((row) => {
              const percent = total > 0 ? (row.leads / total) * 100 : 0;
              return (
                <div key={row.fonte} className="flex items-center justify-between gap-3">
                  <div className="text-sm">{row.fonte}</div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{row.leads.toLocaleString("pt-BR")}</span>{" "}
                    ({percent.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


