/**
 * Toast hook compatible with sonner
 * Provides a consistent interface for showing toasts throughout the application
 */

import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration,
    action,
  }: ToastOptions) => {
    const message = title || description || '';
    const options: Parameters<typeof sonnerToast>[1] = {
      description: title && description ? description : undefined,
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (variant) {
      case 'success':
        return sonnerToast.success(message, options);
      case 'error':
        return sonnerToast.error(message, options);
      case 'warning':
        return sonnerToast.warning(message, options);
      case 'info':
        return sonnerToast.info(message, options);
      default:
        return sonnerToast(message, options);
    }
  };

  return { toast };
}
