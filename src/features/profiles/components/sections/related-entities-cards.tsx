import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { RelatedCardConfig } from "../../configs/types";
import { useRelatedEntities } from "../../hooks/use-related-entities";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedEntitiesCardsProps {
  config: RelatedCardConfig;
  entityType: string;
  entityId: number;
}

export function RelatedEntitiesCards({ config, entityType, entityId }: RelatedEntitiesCardsProps) {
  const { data, isLoading } = useRelatedEntities(entityType, entityId, config.relationType);

  if (isLoading) {
    return <div className="grid gap-6 lg:grid-cols-2">
       {[1, 2].map(i => <Skeleton key={i} className="h-[200px] w-full" />)}
    </div>;
  }

  if (!data || data.length === 0) {
    return null; // Or show empty state
  }

  return (
    <Card className="overflow-hidden pb-0">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item: Record<string, unknown>, idx: number) => {
           const title = String(item[config.titleField] || '');
           const subtitle = config.subtitleField ? String(item[config.subtitleField] || '') : null;
           const avatarSrc = config.avatarField ? String(item[config.avatarField] || '') : null;
           // Use avatar_iniciais if available, otherwise generate from title
           const initials = String(item.avatar_iniciais || (title ? title.substring(0, 1).toUpperCase() : '?'));

           // Determinar rota baseado no tipo de relação
           let href: string | null = null;
           if (config.relationType === "representantes") {
             href = `/partes/representantes/${item.id}`;
           } else if (config.relationType === "clientes") {
             href = `/partes/clientes/${item.id}`;
           }

           const content = (
            <div className="flex items-center gap-4">
              <Avatar className="size-10">
                <AvatarImage src={avatarSrc} alt={title} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{title}</p>
                {subtitle && (
                  <p className="text-muted-foreground text-sm truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              <Button size="icon-sm" variant="ghost" className="shrink-0 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
           );

           return href ? (
             <Link key={idx} href={href} className="block hover:bg-muted/50 rounded-lg transition-colors">
               {content}
             </Link>
           ) : (
             <div key={idx}>{content}</div>
           );
        })}
      </CardContent>
      <CardFooter className="border-t p-0!">
        <Button variant="link" className="flex w-full justify-between rounded-none lg:px-6!">
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
