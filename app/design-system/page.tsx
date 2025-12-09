/**
 * Página de Teste do Design System Zattar
 * 
 * Objetivo: Validar visualmente a consistência e as variantes dos componentes
 * principais do sistema. Use esta página para testes rápidos durante o desenvolvimento.
 * 
 * @see /ajuda/design-system/componentes para documentação oficial.
 */
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DesignSystemTestPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tighter">Design System - Test Bed</h1>
          <p className="text-muted-foreground mt-2">Validação visual de componentes shadcn/ui customizados para Zattar.</p>
        </header>

        {/* Seção de Botões */}
        <Card>
          <CardHeader>
            <CardTitle>Botões</CardTitle>
            <CardDescription>Variantes de botões para ações primárias, secundárias e destrutivas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['lg', 'default', 'sm'].map(size => (
              <div key={size} className="flex items-center gap-4 flex-wrap">
                <span className="w-12 text-sm font-medium text-muted-foreground">{size.toUpperCase()}</span>
                <Button size={size as any} variant="default">Default</Button>
                <Button size={size as any} variant="action">Action</Button>
                <Button size={size as any} variant="destructive">Destructive</Button>
                <Button size={size as any} variant="outline">Outline</Button>
                <Button size={size as any} variant="secondary">Secondary</Button>
                <Button size={size as any} variant="ghost">Ghost</Button>
                <Button size={size as any} variant="link">Link</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Seção de Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Badges de status com estilo "soft" para densidade visual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="action">Action</Badge>
            <Badge variant="outline">Outline</Badge>
          </CardContent>
        </Card>
        
        {/* Seção de Inputs e Formulários */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs e Controles de Formulário</CardTitle>
            <CardDescription>Demonstração de inputs, selects e textareas com `h-9` e `tabular-nums`.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="text-input" className="text-sm font-medium">Input de Texto</label>
              <Input id="text-input" placeholder="ex: João da Silva" />
            </div>
            <div className="space-y-2">
              <label htmlFor="num-input" className="text-sm font-medium">Input Numérico (com tabularNums)</label>
              <Input id="num-input" type="text" tabularNums placeholder="001.011.111-99" />
              <p className="text-xs text-muted-foreground">Compare '111.111' com '999.999'.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="select-input" className="text-sm font-medium">Select</label>
              <Select>
                <SelectTrigger id="select-input">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="urgente">Urgente</lo>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="textarea-input" className="text-sm font-medium">Textarea</label>
              <Textarea id="textarea-input" placeholder="Digite sua observação aqui." />
            </div>
          </CardContent>
        </Card>

        {/* Seção de Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Validação da tipografia `font-heading` (Montserrat) nos títulos.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Exemplo 1</CardTitle>
              </CardHeader>
              <CardContent>
                <p>O título acima deve usar a fonte Montserrat.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Card Exemplo 2</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Verifique no DevTools se `font-heading` está aplicado.</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Seção de Toasts */}
        <Card>
          <CardHeader>
            <CardTitle>Toasts (Sonner)</CardTitle>
            <CardDescription>Dispare toasts para validar o estilo `richColors`.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => toast("Evento agendado", { description: "Sua audiência foi marcada para sexta-feira." })}>
              Default Toast
            </Button>
            <Button variant="outline" className="text-emerald-600 border-emerald-600/30" onClick={() => toast.success("Sucesso!", { description: "O processo foi cadastrado com êxito." })}>
              Success Toast
            </Button>
            <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => toast.error("Erro Inesperado", { description: "Não foi possível conectar ao PJE." })}>
              Error Toast
            </Button>
            <Button variant="outline" className="text-amber-600 border-amber-600/30" onClick={() => toast.warning("Atenção", { description: "Este prazo vence em 2 dias." })}>
              Warning Toast
            </Button>
            <Button variant="outline" onClick={() => toast.info("Você Sabia?", { description: "É possível anexar múltiplos arquivos." })}>
              Info Toast
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
