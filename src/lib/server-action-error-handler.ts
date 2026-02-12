import { toast } from "sonner";

/**
 * Detects if an error is a Server Action version mismatch.
 * This happens when the client has cached JS from an older deployment.
 */
export function isServerActionVersionMismatch(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("Failed to find Server Action");
  }
  if (typeof error === "string") {
    return error.includes("Failed to find Server Action");
  }
  return false;
}

/**
 * Handles Server Action errors, showing appropriate toasts.
 * Returns true if the error was handled, false otherwise.
 */
export function handleServerActionError(
  error: unknown,
  options?: {
    autoReload?: boolean;
    reloadDelay?: number;
  }
): boolean {
  const { autoReload = false, reloadDelay = 3000 } = options ?? {};

  if (isServerActionVersionMismatch(error)) {
    toast.error("Nova versão disponível", {
      description:
        "O sistema foi atualizado. A página será recarregada para aplicar as mudanças.",
      duration: autoReload ? reloadDelay : 10000,
      action: autoReload
        ? undefined
        : {
            label: "Recarregar",
            onClick: () => window.location.reload(),
          },
    });

    if (autoReload) {
      setTimeout(() => {
        window.location.reload();
      }, reloadDelay);
    }

    return true;
  }

  return false;
}

/**
 * Wraps a Server Action call with version mismatch error handling.
 * Use this for critical actions where you want automatic handling.
 *
 * @example
 * ```tsx
 * const result = await withServerActionErrorHandling(
 *   () => myServerAction(data),
 *   { autoReload: true }
 * );
 * ```
 */
export async function withServerActionErrorHandling<T>(
  action: () => Promise<T>,
  options?: {
    autoReload?: boolean;
    reloadDelay?: number;
    fallbackValue?: T;
  }
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    const handled = handleServerActionError(error, options);
    if (handled && options?.fallbackValue !== undefined) {
      return options.fallbackValue;
    }
    if (!handled) {
      throw error;
    }
    return undefined;
  }
}
