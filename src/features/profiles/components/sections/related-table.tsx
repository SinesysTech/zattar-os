import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionConfig, ProfileData } from "../../configs/types";

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
};

interface RelatedTableProps {
  config: SectionConfig;
  data: ProfileData;
}

export function RelatedTable({ config, data }: RelatedTableProps) {
  const rawList = config.dataSource ? getNestedValue(data, config.dataSource) : [];
  const list = Array.isArray(rawList) ? rawList : [];

  if (list.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle>{config.title}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground text-sm">Nenhum registro encontrado.</p></CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns?.map((col, idx) => (
                  <TableHead key={idx}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row: unknown, rIdx: number) => (
                <TableRow key={rIdx}>
                  {config.columns?.map((col, cIdx) => {
                    const rowData = row as Record<string, unknown>;
                    const cellValue = getNestedValue(rowData, col.accessorKey);
                    return (
                      <TableCell key={cIdx}>
                        {col.cell ? col.cell(cellValue, rowData) : String(cellValue ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
