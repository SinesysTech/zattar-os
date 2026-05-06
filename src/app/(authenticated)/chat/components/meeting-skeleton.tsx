import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MeetingSkeletonProps {
  className?: string;
}

export function MeetingSkeleton({ className }: MeetingSkeletonProps) {
  return (
    <div className={cn("relative w-full h-full bg-video-bg flex flex-col overflow-hidden", className)}>
      {/* Header / Top Bar */}
      <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "h-16 border-b border-video-border flex items-center justify-between px-4")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Skeleton className="h-8 w-8 rounded-full bg-video-skeleton" />
          <Skeleton className="h-4 w-32 bg-video-skeleton" />
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Skeleton className="h-8 w-20 rounded-md bg-video-skeleton" />
        </div>
      </div>

      {/* Main Grid */}
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; gap-4 → migrar para <Inline gap="default"> */ "flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4")}>
        {/* Mock Participant 1 (Self) */}
        <div className="relative bg-video-surface rounded-lg overflow-hidden border border-video-border">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-20 h-20 rounded-full bg-video-skeleton" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Skeleton className="h-4 w-24 bg-video-skeleton" />
          </div>
        </div>

        {/* Mock Participant 2 */}
        <div className="relative bg-video-surface rounded-lg overflow-hidden border border-video-border">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-20 h-20 rounded-full bg-video-skeleton" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Skeleton className="h-4 w-24 bg-video-skeleton" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "h-20 border-t border-video-border flex items-center justify-center gap-4")}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-12 h-12 rounded-full bg-video-skeleton" />
        ))}
      </div>

      {/* Loading overlay for additional feedback */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
        <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "px-4 py-2 bg-video-surface/80 rounded-full backdrop-blur-sm border border-video-border text-body-sm text-video-muted animate-pulse")}>
          Preparando interface...
        </div>
      </div>
    </div>
  );
}
