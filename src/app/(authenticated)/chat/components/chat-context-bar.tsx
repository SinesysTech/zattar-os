"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { actionBuscarProcesso } from "@/app/(authenticated)/processos";

interface ChatContextBarProps {
  documentoId: number;
}

interface ProcessoMini {
  trt: string;
  numeroProcesso: string;
}

export function ChatContextBar({ documentoId }: ChatContextBarProps) {
  const [processo, setProcesso] = useState<ProcessoMini | null>(null);

  useEffect(() => {
    actionBuscarProcesso(documentoId)
      .then((result) => {
        if (result.success && result.data) {
          const p = result.data as { trt: string; numeroProcesso: string };
          setProcesso({ trt: p.trt, numeroProcesso: p.numeroProcesso });
        }
      })
      .catch(() => {
        // Silently fail — bar stays hidden on error
      });
  }, [documentoId]);

  // Render nothing while loading or on error
  if (!processo) return null;

  return (
    <div
      className="relative z-[9] flex items-center gap-3 px-5 py-2 border-b border-border/40 dark:border-white/[0.06]"
      style={{ background: "rgba(139,92,246,0.03)" }}
    >
      <span
        className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-md shrink-0"
        style={{
          background: "rgba(139,92,246,0.08)",
          color: "rgba(139,92,246,0.7)",
        }}
      >
        {processo.trt}
      </span>
      <span className="text-[0.65rem] text-muted-foreground/50 truncate min-w-0">
        Vinculada ao processo {processo.numeroProcesso}
      </span>
      <Link
        href={`/processos/${documentoId}`}
        className="text-[0.65rem] text-primary/60 hover:text-primary ml-auto shrink-0 transition-colors duration-200"
      >
        Ver processo &rarr;
      </Link>
    </div>
  );
}
