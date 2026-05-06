import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatorioInconsistenciasPage() {
    return (
        <div className={cn("stack-loose")}>
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
