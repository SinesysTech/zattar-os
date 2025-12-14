import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock12Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityTimelineProps {
  data: any; // Expecting { activities: [] } or just [] passed as dataSource
}

export function ActivityTimeline({ data }: ActivityTimelineProps) {
  // If data is the entity object, look for 'activities' or similar
  const activities = Array.isArray(data) ? data : (data?.activities || []);

  if (!activities || activities.length === 0) {
     return (
        <Card>
            <CardHeader><CardTitle>Atividades</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p></CardContent>
        </Card>
     );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Histórico de Atividades</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {activities.map((activity: any, idx: number) => (
            <TimelineItem key={activity.id || idx}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineTitle>{activity.title || activity.descricao}</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>
                <div className="text-sm text-muted-foreground">
                   {activity.description || activity.detalhes}
                </div>
                {activity.created_at && (
                  <TimelineDate className="flex items-center gap-1">
                    <Clock12Icon className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                  </TimelineDate>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
