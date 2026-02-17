/**
 * DYTE UTILS
 *
 * Helper functions for Dyte integration.
 */

/**
 * Generate a descriptive meeting title based on room info.
 */
export function generateMeetingTitle(salaId: number, salaNome: string, type: 'audio' | 'video' = 'video'): string {
  const prefix = type === 'audio' ? 'Audio Call' : 'Video Call';
  // Sanitize name to be safe
  const safeName = salaNome.replace(/[^a-zA-Z0-9\s-_]/g, '').substring(0, 30);
  return `${prefix}: ${safeName} (#${salaId})`;
}
