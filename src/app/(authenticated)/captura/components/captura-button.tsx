'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from "@/components/ui/loading-state"
interface CapturaButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Botão de ação para captura com estado de loading
 */
export function CapturaButton({
  isLoading,
  disabled,
  onClick,
  children,
}: CapturaButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading || disabled}
      className="w-full sm:w-auto"
    >
      {isLoading && <LoadingSpinner className="mr-2" />}
      {children}
    </Button>
  );
}
