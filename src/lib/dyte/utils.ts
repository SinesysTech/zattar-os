/**
 * DYTE UTILS
 * 
 * Helper functions for Dyte integration.
 */

/**
 * Validate that necessary environment variables are set.
 */
export function validateDyteConfig() {
  const orgId = process.env.NEXT_PUBLIC_DYTE_ORG_ID;
  const apiKey = process.env.DYTE_API_KEY;

  if (!orgId || !apiKey) {
    throw new Error('Dyte configuration missing. Please set NEXT_PUBLIC_DYTE_ORG_ID and DYTE_API_KEY.');
  }

  return { orgId, apiKey };
}

/**
 * Generate a descriptive meeting title based on room info.
 */
export function generateMeetingTitle(salaId: number, salaNome: string, type: 'audio' | 'video' = 'video'): string {
  const prefix = type === 'audio' ? 'Audio Call' : 'Video Call';
  // Sanitize name to be safe
  const safeName = salaNome.replace(/[^a-zA-Z0-9\s-_]/g, '').substring(0, 30);
  return `${prefix}: ${safeName} (#${salaId})`;
}
