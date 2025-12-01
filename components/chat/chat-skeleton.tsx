/**
 * Skeleton loader para interface de chat
 */

import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
  return (
    <div className="flex flex-1">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r p-4 space-y-2">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 border-b" />
        <div className="flex-1 p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Right sidebar skeleton */}
      <div className="w-64 border-l p-4">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
