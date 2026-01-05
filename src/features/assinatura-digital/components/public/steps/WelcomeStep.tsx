"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import { PublicDocumentCard } from "../shared/PublicDocumentCard";
import {
  PublicStepIndicator,
  type PublicStepIndicatorStep,
} from "../layout/PublicStepIndicator";

export interface WelcomeStepProps {
  documento: {
    titulo?: string | null;
    pdf_original_url: string;
  };
  onNext: () => void;
}

/**
 * Extrai o nome do arquivo da URL do PDF
 */
function extractFileName(url: string, fallbackTitle?: string | null): string {
  if (fallbackTitle) return fallbackTitle;

  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const filename = pathname.split("/").pop() || "Document.pdf";
    // Remove UUID prefix se existir (ex: "uuid_filename.pdf" -> "filename.pdf")
    const withoutUuid = filename.replace(/^[a-f0-9-]{36}_/i, "");
    return decodeURIComponent(withoutUuid);
  } catch {
    return "Document.pdf";
  }
}

const steps: PublicStepIndicatorStep[] = [
  {
    label: "Confirm details",
    description: "Verify your personal information.",
    icon: "person",
    status: "current" as const,
  },
  {
    label: "Photo verification",
    description: "Take a quick selfie for security.",
    icon: "photo_camera",
    status: "pending" as const,
  },
  {
    label: "Sign document",
    description: "Apply your digital signature.",
    icon: "ink_pen",
    status: "pending" as const,
  },
];

export function WelcomeStep({ documento, onNext }: WelcomeStepProps) {
  const fileName = extractFileName(documento.pdf_original_url, documento.titulo);
  const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <PublicStepLayout
      hideProgress={true}
      currentStep={0}
      totalSteps={3}
      title="Review and Sign"
      description="Please review the document details below before proceeding with the digital signature process."
      nextLabel="Start Signature"
      onNext={onNext}
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#135bec]/10 text-[#135bec] mb-4">
            <span className="material-symbols-outlined !text-2xl" aria-hidden="true">
              contract_edit
            </span>
          </div>
        </div>

        {/* Document Card */}
        <PublicDocumentCard
          fileName={fileName}
          sender="HR Department"
          date={formattedDate}
        />

        {/* Steps List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            What you&apos;ll need to do:
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <PublicStepIndicator steps={steps} />
          </div>
        </div>
      </div>
    </PublicStepLayout>
  );
}
