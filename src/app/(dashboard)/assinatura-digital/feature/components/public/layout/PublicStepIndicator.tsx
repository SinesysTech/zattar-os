"use client";

import * as React from "react";
import { Check } from "lucide-react";

export interface PublicStepIndicatorStep {
  label: string;
  description: string;
  icon?: string;
  status: "completed" | "current" | "pending";
}

export interface PublicStepIndicatorProps {
  steps: PublicStepIndicatorStep[];
}

export function PublicStepIndicator({ steps }: PublicStepIndicatorProps) {
  return (
    <div className="relative pl-2" role="list" aria-label="Etapas do processo">
      {/* Connecting Line */}
      <div
        className="absolute left-[15px] top-2 bottom-6 w-px bg-slate-200 dark:bg-slate-700"
        aria-hidden="true"
      />

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex gap-4"
            role="listitem"
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {/* Step Indicator Circle */}
            <div className="relative z-10 flex-shrink-0">
              {step.status === "completed" ? (
                <div className="h-7 w-7 rounded-full bg-[#135bec] flex items-center justify-center">
                  <Check
                    className="h-4 w-4 text-white"
                    aria-label="Concluído"
                  />
                </div>
              ) : step.status === "current" ? (
                <div className="h-7 w-7 rounded-full border-2 border-[#135bec] bg-white dark:bg-[#151b28] flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-[#135bec]" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151b28] flex items-center justify-center">
                  {step.icon ? (
                    <span
                      className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {index + 1}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5">
              <h3
                className={`text-sm font-medium ${
                  step.status === "completed"
                    ? "text-slate-900 dark:text-white"
                    : step.status === "current"
                      ? "text-[#135bec]"
                      : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {step.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
