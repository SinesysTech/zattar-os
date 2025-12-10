'use client';

import { Typography } from '@/components/ui/typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientOnlyTabs } from '@/components/ui/client-only-tabs';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type } from 'lucide-react';

export default function TypographyDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Type className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Tipografia</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Estilos tipográficos consistentes baseados no shadcn/ui para garantir hierarquia visual clara em todo o sistema.
        </p>
      </div>

      <ClientOnlyTabs defaultValue="headings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="headings">Títulos</TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="special">Especiais</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        {/* Títulos */}
        <TabsContent value="headings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>H1 - Título Principal</CardTitle>
              <CardDescription>
                Use para o título principal da página. Apenas um por página recomendado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.H1>Taxing Laughter: The Joke Tax Chronicles</Typography.H1>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.H1>Taxing Laughter: The Joke Tax Chronicles</Typography.H1>

// Ou usando classe CSS:
<h1 className="typography-h1">Taxing Laughter: The Joke Tax Chronicles</h1>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H2 - Título de Seção</CardTitle>
              <CardDescription>
                Use para seções principais dentro da página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.H2>The People of the Kingdom</Typography.H2>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.H2>The People of the Kingdom</Typography.H2>

// Ou usando classe CSS:
<h2 className="typography-h2">The People of the Kingdom</h2>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H3 - Título de Subseção</CardTitle>
              <CardDescription>
                Use para subdivisões dentro de seções.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.H3>The Joke Tax</Typography.H3>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.H3>The Joke Tax</Typography.H3>

// Ou usando classe CSS:
<h3 className="typography-h3">The Joke Tax</h3>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H4 - Título Menor</CardTitle>
              <CardDescription>
                Use para títulos de menor importância ou em componentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.H4>People stopped telling jokes</Typography.H4>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.H4>People stopped telling jokes</Typography.H4>

// Ou usando classe CSS:
<h4 className="typography-h4">People stopped telling jokes</h4>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Texto */}
        <TabsContent value="text" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parágrafo</CardTitle>
              <CardDescription>
                Texto de corpo padrão com espaçamento vertical adequado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.P>
                  The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.
                </Typography.P>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.P>
  The king, seeing how much happier his subjects were...
</Typography.P>

// Ou usando classe CSS:
<p className="typography-p">The king, seeing how much happier...</p>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead</CardTitle>
              <CardDescription>
                Parágrafo introdutório destacado, maior que o texto normal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Lead>
                  A modal dialog that interrupts the user with important content and expects a response.
                </Typography.Lead>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Lead>
  A modal dialog that interrupts the user...
</Typography.Lead>

// Ou usando classe CSS:
<p className="typography-lead">A modal dialog that...</p>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large</CardTitle>
              <CardDescription>
                Texto grande para ênfase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Large>Are you absolutely sure?</Typography.Large>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Large>Are you absolutely sure?</Typography.Large>

// Ou usando classe CSS:
<div className="typography-large">Are you absolutely sure?</div>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Small</CardTitle>
              <CardDescription>
                Texto pequeno para notas de rodapé ou informações secundárias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Small>Email address</Typography.Small>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Small>Email address</Typography.Small>

// Ou usando classe CSS:
<small className="typography-small">Email address</small>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Muted</CardTitle>
              <CardDescription>
                Texto com cor atenuada para informações menos importantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Muted>Enter your email address.</Typography.Muted>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Muted>Enter your email address.</Typography.Muted>

// Ou usando classe CSS:
<p className="typography-muted">Enter your email address.</p>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Especiais */}
        <TabsContent value="special" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Blockquote</CardTitle>
              <CardDescription>
                Use para citações ou destacar trechos importantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Blockquote>
                  &quot;After all,&quot; he said, &quot;everyone enjoys a good joke, so it&apos;s only fair that they should pay for the privilege.&quot;
                </Typography.Blockquote>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Blockquote>
  "After all," he said, "everyone enjoys a good joke..."
</Typography.Blockquote>

// Ou usando classe CSS:
<blockquote className="typography-blockquote">
  "After all," he said...
</blockquote>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
              <CardDescription>
                Listas com marcadores e espaçamento adequado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <ul className="typography-list" role="list">
                  <li>1st level of puns: 5 gold coins</li>
                  <li>2nd level of jokes: 10 gold coins</li>
                  <li>3rd level of one-liners: 20 gold coins</li>
                </ul>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.List>
  <li>1st level of puns: 5 gold coins</li>
  <li>2nd level of jokes: 10 gold coins</li>
  <li>3rd level of one-liners: 20 gold coins</li>
</Typography.List>

// Ou usando classe CSS:
<ul className="typography-list">
  <li>1st level of puns: 5 gold coins</li>
  ...
</ul>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Código Inline</CardTitle>
              <CardDescription>
                Código ou termos técnicos dentro de texto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.P>
                  Install dependencies with <Typography.InlineCode>npm install</Typography.InlineCode> command.
                </Typography.P>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.P>
  Install dependencies with <Typography.InlineCode>npm install</Typography.InlineCode> command.
</Typography.P>

// Ou usando classe CSS:
<p className="typography-p">
  Install dependencies with <code className="typography-inline-code">npm install</code> command.
</p>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabela</CardTitle>
              <CardDescription>
                Tabelas com estilo consistente e responsivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20 overflow-x-auto">
                <Typography.Table>
                  <thead>
                    <tr>
                      <th>King&apos;s Treasury</th>
                      <th>People&apos;s happiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Empty</td>
                      <td>Overflowing</td>
                    </tr>
                    <tr>
                      <td>Modest</td>
                      <td>Satisfied</td>
                    </tr>
                    <tr>
                      <td>Full</td>
                      <td>Ecstatic</td>
                    </tr>
                  </tbody>
                </Typography.Table>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`<Typography.Table>
  <thead>
    <tr>
      <th>King's Treasury</th>
      <th>People's happiness</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Empty</td>
      <td>Overflowing</td>
    </tr>
  </tbody>
</Typography.Table>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines */}
        <TabsContent value="guidelines" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hierarquia Tipográfica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Estrutura Recomendada</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>H1:</strong> Título principal da página (apenas um por página)</li>
                <li><strong>H2:</strong> Seções principais</li>
                <li><strong>H3:</strong> Subseções</li>
                <li><strong>H4:</strong> Títulos menores ou em componentes</li>
                <li><strong>P:</strong> Texto de corpo padrão</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quando Usar Cada Variante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold">Lead</h4>
                <p className="text-sm text-muted-foreground">
                  Use para parágrafos introdutórios de artigos, páginas de destino, ou para destacar a primeira frase de uma seção importante.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Large</h4>
                <p className="text-sm text-muted-foreground">
                  Use para perguntas importantes, chamadas para ação (CTA), ou texto que precisa de ênfase visual sem ser um título.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Muted</h4>
                <p className="text-sm text-muted-foreground">
                  Use para metadados (datas, autores), instruções secundárias, ou informações complementares que não são o foco principal.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Small</h4>
                <p className="text-sm text-muted-foreground">
                  Use para labels de formulário, legendas de imagens, ou notas de rodapé.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acessibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Sempre use tags HTML semânticas corretas (h1, h2, p, etc.)</li>
                <li>Mantenha hierarquia lógica de headings (não pule níveis)</li>
                <li>Contraste mínimo de 4.5:1 para texto normal, 3:1 para texto grande</li>
                <li>Line-height mínimo de 1.5 para legibilidade</li>
                <li>Tamanho mínimo de fonte: 14px para corpo de texto</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uso com Polimorfismo</CardTitle>
              <CardDescription>
                Os componentes Typography suportam a prop <code className="bg-muted px-1 rounded">as</code> para renderizar elementos diferentes mantendo os estilos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// Renderizar h1 com estilos de h2
<Typography.H2 as="h1">
  Título Principal com Visual de H2
</Typography.H2>

// Útil para SEO mantendo hierarquia visual
<Typography.H3 as="h2">
  Seção Principal (SEO) com Visual de H3
</Typography.H3>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
