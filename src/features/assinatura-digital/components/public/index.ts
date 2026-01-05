// Layout components
export { PublicPageShell } from "./layout/PublicPageShell";
export { PublicStepLayout } from "./layout/PublicStepLayout";
export { PublicStepIndicator } from "./layout/PublicStepIndicator";

// Shared components
export { PublicDocumentCard } from "./shared/PublicDocumentCard";
export { PublicProgressBar } from "./shared/PublicProgressBar";

// Step components
export { WelcomeStep, ConfirmDetailsStep, ReviewDocumentStep } from "./steps";

// Re-export types
export type { PublicPageShellProps } from "./layout/PublicPageShell";
export type { PublicStepLayoutProps } from "./layout/PublicStepLayout";
export type {
  PublicStepIndicatorProps,
  PublicStepIndicatorStep,
} from "./layout/PublicStepIndicator";
export type { PublicDocumentCardProps } from "./shared/PublicDocumentCard";
export type { PublicProgressBarProps } from "./shared/PublicProgressBar";
export type {
  WelcomeStepProps,
  ConfirmDetailsStepProps,
  ReviewDocumentStepProps,
} from "./steps";
