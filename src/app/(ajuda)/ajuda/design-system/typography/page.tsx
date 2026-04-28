'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientOnlyTabs } from '@/components/ui/client-only-tabs';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type } from 'lucide-react';

export default function TypographyDocsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Type className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Tipografia</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Classes Tailwind inline aplicadas diretamente ao HTML — padrão shadcn/ui. Para módulos
          admin, use os componentes <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">Heading</code> e{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">Text</code> do design system.
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
              <CardTitle>H1 — Título Principal</CardTitle>
              <CardDescription>Apenas um por página. Padrão shadcn/ui.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Taxing Laughter: The Joke Tax Chronicles
                </h1>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`// shadcn/ui — inline Tailwind
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
  Taxing Laughter
</h1>

// Design system admin (PageShell)
<Heading level="page">Processos</Heading>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H2 — Título de Seção</CardTitle>
              <CardDescription>Seções principais dentro da página.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                  The People of the Kingdom
                </h2>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`// shadcn/ui — inline Tailwind
<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
  The People of the Kingdom
</h2>

// Design system admin
<Heading level="section">Audiências desta semana</Heading>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H3 — Título de Subseção</CardTitle>
              <CardDescription>Subdivisões dentro de seções.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  The Joke Tax
                </h3>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`// shadcn/ui — inline Tailwind
<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
  The Joke Tax
</h3>

// Design system admin
<Heading level="card">Detalhes do processo</Heading>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>H4 — Título Menor</CardTitle>
              <CardDescription>Títulos de componentes, seções de formulário.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  People stopped telling jokes
                </h4>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`// shadcn/ui — inline Tailwind
<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
  People stopped telling jokes
</h4>

// Design system admin
<Heading level="subsection">Informações Básicas</Heading>`}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Texto */}
        <TabsContent value="text" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parágrafo</CardTitle>
              <CardDescription>Corpo de texto com margem automática entre parágrafos consecutivos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <p className="leading-7 not-first:mt-6">
                  The king, seeing how much happier his subjects were, realized the error of his ways
                  and repealed the joke tax.
                </p>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<p className="leading-7 not-first:mt-6">
  Texto do parágrafo
</p>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead</CardTitle>
              <CardDescription>Parágrafo introdutório destacado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <p className="text-xl text-muted-foreground">
                  A modal dialog that interrupts the user with important content and expects a response.
                </p>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<p className="text-xl text-muted-foreground">
  Parágrafo introdutório
</p>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large</CardTitle>
              <CardDescription>Texto grande para ênfase sem ser heading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <div className="text-lg font-semibold">Are you absolutely sure?</div>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<div className="text-lg font-semibold">Are you absolutely sure?</div>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Small</CardTitle>
              <CardDescription>Labels de formulário, legendas, notas de rodapé.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <small className="text-sm font-medium leading-none">Email address</small>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<small className="text-sm font-medium leading-none">Email address</small>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Muted</CardTitle>
              <CardDescription>Texto atenuado para informações secundárias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <p className="text-sm text-muted-foreground">Enter your email address.</p>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<p className="text-sm text-muted-foreground">Enter your email address.</p>`}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Especiais */}
        <TabsContent value="special" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Blockquote</CardTitle>
              <CardDescription>Citações ou trechos destacados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <blockquote className="mt-6 border-l-2 pl-6 italic">
                  &quot;After all,&quot; he said, &quot;everyone enjoys a good joke, so it&apos;s
                  only fair that they should pay for the privilege.&quot;
                </blockquote>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<blockquote className="mt-6 border-l-2 pl-6 italic">
  "After all," he said...
</blockquote>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
              <CardDescription>Listas com marcadores e espaçamento adequado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>1st level of puns: 5 gold coins</li>
                  <li>2nd level of jokes: 10 gold coins</li>
                  <li>3rd level of one-liners: 20 gold coins</li>
                </ul>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<ul className="my-6 ml-6 list-disc [&>li]:mt-2">
  <li>1st level of puns: 5 gold coins</li>
</ul>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Código Inline</CardTitle>
              <CardDescription>Código ou termos técnicos dentro de texto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <p className="leading-7">
                  Install dependencies with{' '}
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    npm install
                  </code>{' '}
                  command.
                </p>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
  npm install
</code>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabela</CardTitle>
              <CardDescription>Wrapper responsivo com overflow horizontal automático.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/20">
                <div className="my-6 w-full overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="m-0 border-t p-0 even:bg-muted">
                        <th className="border px-4 py-2 text-left font-bold">King&apos;s Treasury</th>
                        <th className="border px-4 py-2 text-left font-bold">People&apos;s happiness</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="m-0 border-t p-0 even:bg-muted">
                        <td className="border px-4 py-2 text-left">Empty</td>
                        <td className="border px-4 py-2 text-left">Overflowing</td>
                      </tr>
                      <tr className="m-0 border-t p-0 even:bg-muted">
                        <td className="border px-4 py-2 text-left">Full</td>
                        <td className="border px-4 py-2 text-left">Ecstatic</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`<div className="my-6 w-full overflow-y-auto">
  <table className="w-full">
    <thead>
      <tr className="m-0 border-t p-0 even:bg-muted">
        <th className="border px-4 py-2 text-left font-bold">King's Treasury</th>
      </tr>
    </thead>
    <tbody>
      <tr className="m-0 border-t p-0 even:bg-muted">
        <td className="border px-4 py-2 text-left">Empty</td>
      </tr>
    </tbody>
  </table>
</div>`}</pre>
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
              <CardTitle>Design System — Heading e Text</CardTitle>
              <CardDescription>
                API canônica para módulos admin. Aplica tokens do design system (escala visual precisa) em vez das classes shadcn genéricas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">{`import { Heading, Text } from '@/components/ui/typography';

// Headings — nível semântico
<Heading level="page">Processos</Heading>          // h1, 24px
<Heading level="section">Esta semana</Heading>     // h2, 20px
<Heading level="card">Detalhes</Heading>           // h3, 18px
<Heading level="subsection">Contato</Heading>      // h4, 16px
<Heading level="widget">KPIs</Heading>             // h3, 14px

// Heading com tag diferente (SEO sem mudar visual)
<Heading level="subsection" as="h3">Seção</Heading>

// Text — variantes de corpo
<Text variant="body">Texto padrão</Text>
<Text variant="caption">Texto auxiliar / metadata</Text>
<Text variant="label">Label de campo</Text>
<Text variant="overline">SEÇÃO UPPERCASE</Text>
<Text variant="helper">Dica de preenchimento</Text>`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acessibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Sempre use tags HTML semânticas corretas (h1, h2, p, etc.)</li>
                <li>Mantenha hierarquia lógica de headings — não pule níveis</li>
                <li>Contraste mínimo de 4.5:1 para texto normal, 3:1 para texto grande</li>
                <li>Line-height mínimo de 1.5 para legibilidade</li>
                <li>Tamanho mínimo de fonte: 14px para corpo de texto</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
