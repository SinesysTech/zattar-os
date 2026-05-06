import { useRef, useCallback, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, RefreshCw} from "lucide-react";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailStore } from "../hooks/use-mail";
import { useMailMessages, useMailActions } from "../hooks/use-mail-api";
import { getMailListPreview, getMailPrimaryName } from "../utils/display";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { LoadingSpinner } from "@/components/ui/loading-state"
interface MailListProps {
  items: MailMessagePreview[];
}

export function MailList({ items }: MailListProps) {
  const { selectedMail, setSelectedMail, isLoading, isLoadingMore, hasMore, error, setError, selectedUids, toggleSelectedUid } =
    useMailStore();
  const { refetchMessages } = useMailMessages();
  const { loadMoreMessages } = useMailActions();
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Keyboard navigation (↑↓) within the list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowDown" && index < items.length - 1) {
        e.preventDefault();
        const next = listRef.current?.querySelector(
          `[data-mail-index="${index + 1}"]`
        ) as HTMLElement;
        next?.focus();
        setSelectedMail(items[index + 1]);
      } else if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        const prev = listRef.current?.querySelector(
          `[data-mail-index="${index - 1}"]`
        ) as HTMLElement;
        prev?.focus();
        setSelectedMail(items[index - 1]);
      }
    },
    [items, setSelectedMail]
  );

  if (error) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex h-full flex-col items-center justify-center inline-medium inset-extra-loose text-center")}>
        <AlertCircle className="text-destructive h-8 w-8" />
        <p className={cn("text-muted-foreground text-body-sm")}>{error}</p>
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
      <div className={cn("flex flex-col inline-tight inset-card-compact")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex flex-col inline-tight rounded-lg border inset-medium")}>
            <div className={cn("flex items-center inline-tight")}>
              <Skeleton className="h-4 w-32" />
              <div className={cn("ml-auto flex items-center inline-tight")}>
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "text-muted-foreground flex h-full items-center justify-center inset-extra-loose text-body-sm")}>
        Nenhum e-mail encontrado
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div
        ref={listRef}
        role="listbox"
        aria-label="Lista de e-mails"
        className={cn("flex flex-col inline-tight inset-card-compact")}>
        {items.map((item, index) => (
          <div
            key={item.uid}
            className={cn(
              /* design-system-escape: p-3 → usar <Inset> */ "group flex inline-tight rounded-lg border inset-medium text-body-sm transition-colors duration-200",
              selectedMail?.uid === item.uid
                ? "bg-accent"
                : "hover:bg-muted/50"
            )}>
            <div
              className={cn("flex shrink-0 items-start pt-0.5")}
              onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedUids.has(item.uid)}
                onCheckedChange={() => toggleSelectedUid(item.uid)}
                aria-label={`Selecionar e-mail de ${getMailPrimaryName(item)}`}
              />
            </div>
            <button
              role="option"
              aria-selected={selectedMail?.uid === item.uid}
              aria-label={`${!item.read ? "Não lido: " : ""}${getMailPrimaryName(item)} — ${item.subject}`}
              data-mail-index={index}
              tabIndex={selectedMail?.uid === item.uid ? 0 : -1}
              className={cn("flex min-w-0 flex-1 flex-col items-start inline-snug text-left")}
              onClick={() => setSelectedMail(item)}
              onKeyDown={(e) => handleKeyDown(e, index)}>
              <div className="flex w-full flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <div className={cn("flex min-w-0 flex-wrap items-center inline-tight")}>
                    <div className={cn(/* design-system-escape: leading-5 sem token DS */ "text-foreground whitespace-normal wrap-break-word font-semibold leading-5")}>
                      {getMailPrimaryName(item)}
                    </div>
                    {!item.read && (
                      <span
                        className="flex h-2 w-2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "text-[11px] leading-4 whitespace-normal wrap-break-word text-left sm:text-right",
                    selectedMail?.uid === item.uid
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
              <div className={cn("grid w-full inline-micro text-caption leading-5")}>
                <div className={cn( "font-medium text-foreground whitespace-normal wrap-break-word")}>
                  {item.subject}
                </div>
                {getMailListPreview(item) ? (
                  <div className="text-muted-foreground whitespace-normal wrap-break-word">
                    {getMailListPreview(item)}
                  </div>
                ) : null}
              </div>
            </button>
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className={cn("flex items-center justify-center py-4")}>
            {isLoadingMore && <LoadingSpinner size="lg" className="text-muted-foreground" />}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
