import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionConfig } from "../../configs/types";
import { get } from "lodash"; // Need to check if lodash is available, if not use util. 
// Assuming explicit safe navigation for now or copying the util function.
// User didn't specify lodash, I'll use the same inline util to be safe.

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

interface RelatedTableProps {
  config: SectionConfig;
  data: any; // Parent data object, containing the list at config.dataSource
}

export function RelatedTable({ config, data }: RelatedTableProps) {
  const list = config.dataSource ? getNestedValue(data, config.dataSource) : [];

  if (!list || !Array.isArray(list) || list.length === 0) {
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
              {list.map((row: any, rIdx: number) => (
                <TableRow key={rIdx}>
                  {config.columns?.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      {col.cell ? col.cell(getNestedValue(row, col.accessorKey), row) : getNestedValue(row, col.accessorKey)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
