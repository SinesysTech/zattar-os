import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailStore } from "../use-mail";
import { useMailMessages } from "../hooks/use-mail-api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface MailListProps {
  items: MailMessagePreview[];
}

export function MailList({ items }: MailListProps) {
  const { selectedMail, setSelectedMail, isLoading, error, setError } = useMailStore();
  const { refetchMessages } = useMailMessages();

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="text-destructive h-8 w-8" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            refetchMessages();
          }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-8 text-sm">
        Nenhum e-mail encontrado
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.uid}
            className={cn(
              "hover:bg-accent/70 flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
              selectedMail?.uid === item.uid && "bg-accent/70"
            )}
            onClick={() => setSelectedMail(item)}>
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.from.name || item.from.address}
                  </div>
                  {!item.read && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selectedMail?.uid === item.uid ? "text-foreground" : "text-muted-foreground"
                  )}>
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {item.preview || item.subject}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
