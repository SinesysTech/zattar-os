import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatorioInconsistenciasPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Relatório de Inconsistências</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Inconsistências de Sincronização</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Funcionalidade em desenvolvimento.</p>
                </CardContent>
            </Card>
        </div>
    )
}
