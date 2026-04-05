"use client";

import { FileDown, Share } from "lucide-react";

interface ActionButtonsProps {
  onDownloadPDF?: () => void;
  onShare?: () => void;
}

export function ActionButtons({ onDownloadPDF, onShare }: ActionButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onDownloadPDF}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted border border-border hover:border-border/80 text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-muted/80"
      >
        <FileDown className="w-4 h-4" />
        Download PDF
      </button>
      <button
        type="button"
        onClick={onShare}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-primary/90 shadow-md hover:shadow-lg"
      >
        <Share className="w-4 h-4" />
        Compartilhar
      </button>
    </div>
  );
}
