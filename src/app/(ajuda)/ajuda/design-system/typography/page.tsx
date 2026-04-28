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
          Estilos tipográficos baseados no shadcn/ui com classes Tailwind inline — sem abstração CSS intermediária.
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

// Classes aplicadas:
// scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl`}
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

// Classes aplicadas:
// scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0`}
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

// Classes aplicadas:
// scroll-m-20 text-2xl font-semibold tracking-tight`}
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

// Classes aplicadas:
// scroll-m-20 text-xl font-semibold tracking-tight`}
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
                Texto de corpo padrão com margem superior automática entre parágrafos consecutivos.
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

// Classes aplicadas:
// leading-7 not-first:mt-6`}
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

// Classes aplicadas:
// text-xl text-muted-foreground`}
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

// Classes aplicadas:
// text-lg font-semibold`}
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

// Classes aplicadas:
// text-sm font-medium leading-none`}
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

// Classes aplicadas:
// text-sm text-muted-foreground`}
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

// Classes aplicadas:
// mt-6 border-l-2 pl-6 italic`}
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
                <Typography.List>
                  <li>1st level of puns: 5 gold coins</li>
                  <li>2nd level of jokes: 10 gold coins</li>
                  <li>3rd level of one-liners: 20 gold coins</li>
                </Typography.List>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`<Typography.List>
  <li>1st level of puns: 5 gold coins</li>
  <li>2nd level of jokes: 10 gold coins</li>
  <li>3rd level of one-liners: 20 gold coins</li>
</Typography.List>

// Classes aplicadas:
// my-6 ml-6 list-disc [&>li]:mt-2`}
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
  Install dependencies with{' '}
  <Typography.InlineCode>npm install</Typography.InlineCode> command.
</Typography.P>

// Classes aplicadas ao code:
// relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabela</CardTitle>
              <CardDescription>
                Wrapper responsivo com overflow horizontal automático.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <Typography.Table>
                  <thead>
                    <tr>
                      <th className="border-b bg-muted/40 px-3 py-2 text-left font-medium text-sm">King&apos;s Treasury</th>
                      <th className="border-b bg-muted/40 px-3 py-2 text-left font-medium text-sm">People&apos;s happiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-b px-3 py-2 text-sm align-top">Empty</td>
                      <td className="border-b px-3 py-2 text-sm align-top">Overflowing</td>
                    </tr>
                    <tr>
                      <td className="border-b px-3 py-2 text-sm align-top">Modest</td>
                      <td className="border-b px-3 py-2 text-sm align-top">Satisfied</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-sm align-top">Full</td>
                      <td className="px-3 py-2 text-sm align-top">Ecstatic</td>
                    </tr>
                  </tbody>
                </Typography.Table>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`<Typography.Table>
  <thead>
    <tr>
      <th className="border-b bg-muted/40 px-3 py-2 text-left font-medium text-sm">
        King's Treasury
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="border-b px-3 py-2 text-sm align-top">Empty</td>
    </tr>
  </tbody>
</Typography.Table>

// Wrapper: my-6 w-full overflow-y-auto`}
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
              <CardTitle>Design System — Heading e Text</CardTitle>
              <CardDescription>
                Para módulos admin, prefira os componentes tipados do design system em vez dos legados acima.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`import { Heading, Text } from '@/components/ui/typography';

// Títulos de página, seção, card, widget...
<Heading level="page">Processos</Heading>
<Heading level="section">Audiências desta semana</Heading>
<Heading level="card">Detalhes do processo</Heading>
<Heading level="widget">KPIs</Heading>

// Variantes de texto
<Text variant="body">Texto padrão do sistema</Text>
<Text variant="caption">Texto auxiliar / metadata</Text>
<Text variant="label">Label de campo</Text>
<Text variant="overline">SEÇÃO UPPERCASE</Text>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
