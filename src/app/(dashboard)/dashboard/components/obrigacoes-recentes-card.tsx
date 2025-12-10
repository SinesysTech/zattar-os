import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data - replace with actual data fetching
const obrigacoes = [
  { id: 1, descricao: "Pagamento de fornecedor A", tipo: "Pagamento", vencimento: "10/12/2025", status: "Pendente" },
  { id: 2, descricao: "Entrega de relatório fiscal", tipo: "Obrigação", vencimento: "12/12/2025", status: "Pendente" },
  { id: 3, descricao: "Audiência processo 123", tipo: "Audiência", vencimento: "15/12/2025", status: "Agendada" },
  { id: 4, descricao: "Vencimento de parcela de acordo", tipo: "Acordo", vencimento: "20/12/2025", status: "Pendente" },
  { id: 5, descricao: "Reunião com cliente B", tipo: "Reunião", vencimento: "22/12/2025", status: "Agendada" },
];

export function ObrigacoesRecentesCard() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Obrigações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obrigacoes.map((ob) => (
              <TableRow key={ob.id}>
                <TableCell>{ob.descricao}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ob.tipo}</Badge>
                </TableCell>
                <TableCell>{ob.vencimento}</TableCell>
                <TableCell>
                  <Badge variant={ob.status === 'Pendente' ? 'destructive' : 'default'}>{ob.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
