'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

