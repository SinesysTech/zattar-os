import { Component } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const componentCategories = [
  {
    name: 'Botões',
    components: ['Button', 'IconButton'],
    description: 'Ações primárias e secundárias',
  },
  {
    name: 'Formulários',
    components: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider'],
    description: 'Entrada de dados',
  },
  {
    name: 'Feedback',
    components: ['Alert', 'Toast', 'Progress', 'Skeleton'],
    description: 'Comunicação com o usuário',
  },
  {
    name: 'Layout',
    components: ['Card', 'Separator', 'Tabs', 'Accordion', 'Collapsible'],
    description: 'Organização de conteúdo',
  },
  {
    name: 'Navegação',
    components: ['Breadcrumb', 'Pagination', 'NavigationMenu'],
    description: 'Navegação entre páginas',
  },
  {
    name: 'Overlay',
    components: ['Dialog', 'Sheet', 'Popover', 'Tooltip', 'DropdownMenu'],
    description: 'Elementos sobrepostos',
  },
  {
    name: 'Dados',
    components: ['Table', 'DataTable', 'Badge', 'Avatar'],
    description: 'Exibição de dados',
  },
];

export default function ComponentesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Component className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Componentes</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Catálogo de componentes reutilizáveis baseados no shadcn/ui.
        </p>
      </div>

      {/* Component Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {componentCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.components.map((comp) => (
                  <Badge key={comp} variant="secondary">
                    {comp}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Exemplos</h2>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Botões</CardTitle>
            <CardDescription>Variantes disponíveis do componente Button</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="action">Action</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Indicadores e tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="action">Action</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Formulários</CardTitle>
            <CardDescription>Elementos de entrada de dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
          <CardDescription>
            Importando e utilizando componentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// Importar componentes do shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Usar no componente
export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Digite algo..." />
        <Button>Enviar</Button>
      </CardContent>
    </Card>
  );
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Documentação shadcn/ui
              </a>
              {' '}- Referência completa de componentes
            </li>
            <li>
              <a
                href="https://www.radix-ui.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Radix UI
              </a>
              {' '}- Primitivos acessíveis
            </li>
            <li>
              <a
                href="https://tailwindcss.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Tailwind CSS
              </a>
              {' '}- Framework CSS
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
