"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PublicDocumentCardProps {
  fileName: string;
  sender?: string;
  date?: string;
  className?: string;
}

export function PublicDocumentCard({
  fileName,
  sender,
  date,
  className,
}: PublicDocumentCardProps) {
  return (
    <div
      className={cn(
        "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex gap-4 items-center",
        className
      )}
    >
      {/* PDF Icon */}
      <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
        <span
          className="material-symbols-outlined text-red-500 text-2xl"
          aria-hidden="true"
        >
          picture_as_pdf
        </span>
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-slate-900 dark:text-white truncate"
          title={fileName}
        >
          {fileName}
        </p>
        {(sender || date) && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {sender && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                De: {sender}
              </span>
            )}
            {sender && date && (
              <span
                className="text-xs text-slate-300 dark:text-slate-600"
                aria-hidden="true"
              >
                •
              </span>
            )}
            {date && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {date}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
