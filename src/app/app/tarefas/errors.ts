export const QUADRO_CUSTOM_UNAVAILABLE_MESSAGE =
  'Quadros personalizados indisponíveis neste ambiente. Aplique as migrations de tarefas/kanban para habilitar este recurso.';

export function normalizeQuadroActionErrorMessage(message: string): string {
  if (
    message.includes('public.quadros') ||
    message.includes('quadro_id') ||
    message.includes('schema cache') ||
    message.includes('relation "public.quadros" does not exist') ||
    message.includes(QUADRO_CUSTOM_UNAVAILABLE_MESSAGE)
  ) {
    return QUADRO_CUSTOM_UNAVAILABLE_MESSAGE;
  }

  return message;
}
