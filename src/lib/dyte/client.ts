/**
 * DYTE CLIENT
 * 
 * Server-side client to interact with Dyte API.
 */

import { validateDyteConfig } from './utils';

const DYTE_API_BASE = 'https://api.dyte.io/v2';

// Helper for Basic Auth header
function getAuthHeader() {
  const { orgId, apiKey } = validateDyteConfig();
  const token = Buffer.from(`${orgId}:${apiKey}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Create a new meeting in Dyte.
 */
export async function createMeeting(title: string) {
  const response = await fetch(`${DYTE_API_BASE}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify({
      title,
      record_on_start: false,
      live_stream_on_start: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Dyte meeting: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.id as string;
}

/**
 * Add a participant to a meeting and get their auth token.
 */
export async function addParticipant(meetingId: string, name: string, preset_name: string = 'group_call_participant') {
  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify({
      name,
      preset_name,
      custom_participant_id: name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add participant to Dyte meeting: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.token as string;
}

/**
 * Get details of a specific meeting.
 */
export async function getMeetingDetails(meetingId: string) {
  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`Failed to get Dyte meeting details: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * List active meetings.
 */
export async function getActiveMeetings() {
  const response = await fetch(`${DYTE_API_BASE}/meetings?status=LIVE`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list active Dyte meetings: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get participants of a meeting.
 */
export async function getMeetingParticipants(meetingId: string) {
  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}/participants`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Dyte meeting participants: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}
