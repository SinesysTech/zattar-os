import { FileText, Keyboard, FolderOpen, Share2, History, Trash2, Download, MessageSquare, Search, FileTemplate, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const toolbarFeatures = [
  { icon: 'B', name: 'Negrito', shortcut: 'Ctrl+B' },
  { icon: 'I', name: 'Itálico', shortcut: 'Ctrl+I' },
  { icon: 'U', name: 'Sublinhado', shortcut: 'Ctrl+U' },
  { icon: 'S', name: 'Riscado', shortcut: 'Ctrl+Shift+S' },
  { icon: 'H1/H2/H3', name: 'Títulos', shortcut: 'Ctrl+1/2/3' },
  { icon: '•', name: 'Lista com marcadores', shortcut: '-' },
  { icon: '1.', name: 'Lista ordenada', shortcut: '-' },
  { icon: '☑', name: 'Lista de tarefas', shortcut: '-' },
  { icon: '⊞', name: 'Inserir tabela', shortcut: '-' },
  { icon: '🖼', name: 'Inserir imagem', shortcut: '-' },
  { icon: '🔗', name: 'Inserir link', shortcut: '-' },
  { icon: '<>', name: 'Bloco de código', shortcut: '-' },
];

const keyboardShortcuts = [
  { shortcut: 'Ctrl+K', action: 'Busca rápida' },
  { shortcut: 'Ctrl+S', action: 'Forçar salvamento' },
  { shortcut: 'Ctrl+Z', action: 'Desfazer' },
  { shortcut: 'Ctrl+Shift+Z', action: 'Refazer' },
  { shortcut: 'Ctrl+B', action: 'Negrito' },
  { shortcut: 'Ctrl+I', action: 'Itálico' },
  { shortcut: 'Ctrl+U', action: 'Sublinhado' },
];

const commonProblems = [
  {
    problem: 'Não consigo salvar o documento',
    solutions: [
      'Verifique sua conexão com a internet',
      'Tente recarregar a página',
      'Se o problema persistir, copie o conteúdo antes de fechar',
    ],
  },
  {
    problem: 'Não encontro meu documento',
    solutions: [
      'Use a busca rápida (Ctrl+K)',
      'Verifique se não está na lixeira',
      'Verifique os filtros de pasta',
    ],
  },
  {
    problem: 'Não consigo editar um documento compartilhado',
    solutions: [
      'Verifique sua permissão (deve ser "Editar")',
      'Peça ao criador para alterar sua permissão',
    ],
  },
  {
    problem: 'A imagem não aparece',
    solutions: [
      'Verifique se o arquivo não excede 50MB',
      'Verifique o tipo de arquivo (JPG, PNG, GIF, WebP)',
      'Tente fazer upload novamente',
    ],
  },
];

export default function DocumentosPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Editor de Documentos</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guia completo para criar, editar e compartilhar documentos no Sinesys.
        </p>
      </div>

      {/* Acesso */}
      <Card>
        <CardHeader>
          <CardTitle>Acessando o Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Faça login no Sinesys</li>
            <li>No menu lateral, clique em <strong className="text-foreground">Serviços</strong> → <strong className="text-foreground">Editor de Documentos</strong></li>
            <li>Você verá a lista de seus documentos</li>
          </ol>
        </CardContent>
      </Card>

      {/* Criando Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Criando um Documento</CardTitle>
          <CardDescription>Duas formas de criar novos documentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Método 1: Documento em Branco</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Clique no botão <strong className="text-foreground">"Novo Documento"</strong></li>
              <li>Digite um título para o documento</li>
              <li>(Opcional) Escolha uma pasta para salvar</li>
              <li>Clique em <strong className="text-foreground">"Criar"</strong></li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Método 2: A partir de um Template</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Clique no botão <strong className="text-foreground">"Novo Documento"</strong></li>
              <li>Clique em <strong className="text-foreground">"Usar Template"</strong></li>
              <li>Navegue pelos templates disponíveis</li>
              <li>Clique no template desejado</li>
              <li>O documento será criado com o conteúdo do template</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Ferramentas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <CardTitle>Barra de Ferramentas</CardTitle>
          </div>
          <CardDescription>Funções disponíveis para formatação</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Ícone</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="w-32">Atalho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolbarFeatures.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="font-mono">{feature.icon}</TableCell>
                  <TableCell>{feature.name}</TableCell>
                  <TableCell>
                    {feature.shortcut !== '-' ? (
                      <Badge variant="secondary">{feature.shortcut}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Salvamento Automático */}
      <Card>
        <CardHeader>
          <CardTitle>Salvamento Automático</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O documento é salvo automaticamente a cada 2 segundos de inatividade.
          </p>
          <div className="space-y-2">
            <p className="font-medium">Indicadores de status:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Salvando...</Badge>
                <span className="text-sm text-muted-foreground">Documento sendo salvo</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Salvo</Badge>
                <span className="text-sm text-muted-foreground">Salvo com sucesso</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Erro</Badge>
                <span className="text-sm text-muted-foreground">Verifique sua conexão</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pastas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <CardTitle className="text-lg">Organizando com Pastas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Criando uma Pasta</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Clique em "Nova Pasta"</li>
                <li>Digite o nome da pasta</li>
                <li>Escolha: Comum ou Privada</li>
                <li>Clique em "Criar"</li>
              </ol>
            </div>
            <div>
              <h5 className="font-medium mb-2">Movendo Documentos</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Clique nos três pontos ao lado do documento</li>
                <li>Selecione "Mover para..."</li>
                <li>Escolha a pasta de destino</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Compartilhamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <CardTitle className="text-lg">Compartilhamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Abra o documento</li>
              <li>Clique no ícone de Compartilhar</li>
              <li>Digite o nome ou email do usuário</li>
              <li>Escolha a permissão:</li>
            </ol>
            <div className="flex gap-2 ml-4">
              <Badge variant="outline">Visualizar</Badge>
              <Badge variant="secondary">Editar</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Apenas o criador pode gerenciar compartilhamentos.
            </p>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle className="text-lg">Histórico de Versões</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O sistema guarda automaticamente as versões do documento.
            </p>
            <div>
              <h5 className="font-medium mb-2">Restaurando uma Versão</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Menu "..." → "Histórico de Versões"</li>
                <li>Clique em "Visualizar" na versão desejada</li>
                <li>Se for a correta, clique em "Restaurar"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Lixeira */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <CardTitle className="text-lg">Lixeira</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Documentos deletados vão para a lixeira e podem ser recuperados.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse: Menu de documentos → "Lixeira"</li>
              <li>Clique em "Restaurar" para recuperar</li>
              <li>"Deletar Permanentemente" remove definitivamente</li>
            </ul>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Documentos na lixeira são deletados automaticamente após 30 dias.
            </p>
          </CardContent>
        </Card>

        {/* Exportação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <CardTitle className="text-lg">Exportação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exporte seus documentos para outros formatos:
            </p>
            <div className="flex gap-2">
              <Badge>PDF</Badge>
              <Badge>Word (DOCX)</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Acesse: Menu "..." → "Exportar como..."
            </p>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle className="text-lg">Chat do Documento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cada documento tem um chat integrado para colaboração.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Clique no ícone de Chat (balão)</li>
              <li>O painel abrirá à direita</li>
              <li>Digite e pressione Enter para enviar</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Todos com acesso ao documento podem ver as mensagens.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca Rápida e Templates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <CardTitle className="text-lg">Busca Rápida (Command Menu)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use <Badge variant="secondary">Ctrl+K</Badge> ou <Badge variant="secondary">Cmd+K</Badge> para abrir.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Buscar documentos pelo nome</li>
              <li>Criar novo documento</li>
              <li>Abrir templates</li>
              <li>Acessar ações rápidas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileTemplate className="h-5 w-5" />
              <CardTitle className="text-lg">Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Templates são documentos modelo reutilizáveis.
            </p>
            <div>
              <h5 className="font-medium mb-2">Criando seu Template</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Crie um documento com a estrutura desejada</li>
                <li>Menu "..." → "Salvar como Template"</li>
                <li>Escolha: Público ou Privado</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos de Teclado */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle>Atalhos de Teclado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {keyboardShortcuts.map((item) => (
              <div key={item.shortcut} className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{item.shortcut}</Badge>
                <span className="text-sm text-muted-foreground">{item.action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle>Boas Práticas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Use títulos descritivos</strong> para facilitar a busca</li>
            <li><strong className="text-foreground">Organize em pastas</strong> por projeto ou categoria</li>
            <li><strong className="text-foreground">Use tags</strong> para classificar documentos</li>
            <li><strong className="text-foreground">Compartilhe com permissão mínima</strong> necessária</li>
            <li><strong className="text-foreground">Verifique o histórico</strong> antes de fazer grandes alterações</li>
          </ul>
        </CardContent>
      </Card>

      {/* Problemas Comuns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Problemas Comuns</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {commonProblems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.problem}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {item.solutions.map((solution, i) => (
                      <li key={i}>{solution}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
