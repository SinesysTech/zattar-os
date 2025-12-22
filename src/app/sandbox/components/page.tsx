'use client';

/**
 * Sandbox de Componentes UI
 * 
 * Página de exemplos e validação de componentes do Design System.
 * Facilita o desenvolvimento e teste de componentes visuais.
 * 
 * Esta página contém exemplos dos componentes que estavam em components/examples/
 * e outros exemplos úteis para desenvolvimento.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// EXEMPLO: Button Standard (de components/examples/button/standard/button-standard-1.tsx)
// =============================================================================

export const ButtonStandardExample = () => (
  <Card>
    <CardHeader>
      <CardTitle>Button Standard</CardTitle>
      <CardDescription>
        Exemplo de botões com diferentes variantes do Design System
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-2 flex-wrap">
        <Button>Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">🚀</Button>
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
      </div>
    </CardContent>
  </Card>
);

// =============================================================================
// EXEMPLO: Card Standard (de components/examples/card/standard/card-standard-1.tsx)
// =============================================================================

export const CardStandardExample = () => (
  <Card>
    <CardHeader>
      <CardTitle>Card Standard</CardTitle>
      <CardDescription>
        Exemplo de card com header, content e footer
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-4 flex-wrap">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area where you can place any content.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Submit</Button>
          </CardFooter>
        </Card>
        
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Card sem Footer</CardTitle>
            <CardDescription>Card apenas com header e content</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Este card não possui footer, apenas conteúdo.</p>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
);

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

export default function ComponentsSandboxPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Componentes UI - Sandbox</h1>
          <Badge variant="outline">Sandbox</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Página de exemplos e validação de componentes do Design System Sinesys.
          Use esta página para testar e visualizar componentes antes de implementá-los.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Nota:</strong> Esta página contém exemplos que estavam em{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">components/examples/</code>
          e foram movidos para a sandbox seguindo a arquitetura FSD.
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        <ButtonStandardExample />
        <CardStandardExample />
      </div>
    </div>
  );
}

