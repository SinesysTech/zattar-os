/**
 * TEMPLATE DE REFERÊNCIA PARA AGENTES
 * 
 * Este arquivo demonstra o padrão correto para criar páginas de módulo.
 * Copie esta estrutura ao criar novas páginas.
 * 
 * @see .qoder/rules/design-system-foundation.md
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PageTemplateExample() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Título da Página
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Descrição breve do módulo
          </p>
        </div>
        <Button>Ação Principal</Button>
      </div>

      {/* Cards de Conteúdo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Card de Estatística
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">1.234</p>
            <p className="text-sm text-muted-foreground">
              Descrição do valor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Lista de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Usar ResponsiveTable aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
