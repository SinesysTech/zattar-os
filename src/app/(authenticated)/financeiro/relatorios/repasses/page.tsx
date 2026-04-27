import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatorioRepassesPage() {
    return (
        <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
            <Card>
                <CardHeader>
                    <CardTitle>Repasses ao Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Funcionalidade em desenvolvimento.</p>
                </CardContent>
            </Card>
        </div>
    )
}
