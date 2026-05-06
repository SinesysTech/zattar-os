import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatorioRepassesPage() {
    return (
        <div className={cn("flex flex-col stack-loose")}>
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
