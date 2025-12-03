import { Calendar, Video, Bell, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AudienciasDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Audiências</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Controle completo de audiências agendadas, URLs de audiência virtual e integração com calendário.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Agenda Completa</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Visualize todas as audiências agendadas com data, hora, tipo e local de realização.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Audiências Virtuais</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cadastre e acesse URLs de audiências virtuais (Zoom, Teams, Google Meet) diretamente do sistema.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Lembretes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Receba notificações sobre audiências próximas para nunca perder um compromisso.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Responsáveis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Atribua advogados responsáveis por cada audiência para melhor organização da equipe.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How to Use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Como Usar</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Visualizando Audiências</h3>
          <ol>
            <li>No menu lateral, clique em <strong>Audiências</strong></li>
            <li>A lista mostra todas as audiências ordenadas por data</li>
            <li>Use os filtros para encontrar audiências específicas</li>
          </ol>

          <h3>Filtros Disponíveis</h3>
          <ul>
            <li><strong>Período:</strong> Data inicial e final</li>
            <li><strong>TRT:</strong> Tribunal específico</li>
            <li><strong>Responsável:</strong> Advogado atribuído</li>
            <li><strong>Tipo:</strong> Instrução, julgamento, conciliação, etc.</li>
          </ul>

          <h3>Adicionando URL Virtual</h3>
          <ol>
            <li>Encontre a audiência na lista</li>
            <li>Clique no ícone de edição ou no campo de URL</li>
            <li>Cole a URL da audiência virtual</li>
            <li>Salve as alterações</li>
          </ol>

          <h3>Atribuindo Responsável</h3>
          <ol>
            <li>Clique na audiência para ver detalhes</li>
            <li>Selecione o advogado no campo Responsável</li>
            <li>A alteração é salva automaticamente</li>
          </ol>
        </div>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Verifique regularmente as audiências da semana</li>
            <li>Cadastre as URLs virtuais assim que recebê-las</li>
            <li>Atribua responsáveis com antecedência para evitar conflitos</li>
            <li>Use o filtro de período para planejar a agenda</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
