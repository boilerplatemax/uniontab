/**
 * Zoom API Service for Server-to-Server OAuth
 *
 * This service handles authentication and meeting creation with Zoom's API.
 * Uses Server-to-Server OAuth (for General Apps) - no user login required.
 *
 * Required ENV variables:
 * - ZOOM_ACCOUNT_ID: Your Zoom account ID from the Server-to-Server OAuth app
 * - ZOOM_CLIENT_ID: Client ID from the Server-to-Server OAuth app
 * - ZOOM_CLIENT_SECRET: Client Secret from the Server-to-Server OAuth app
 */

// Cache for access token to avoid unnecessary token requests
let cachedToken: { token: string; expiresAt: number } | null = null;

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  waiting_room?: boolean;
  audio?: 'both' | 'telephony' | 'voip';
  auto_recording?: 'local' | 'cloud' | 'none';
  alternative_hosts?: string; // Comma-separated email addresses
}

interface ZoomCreateMeetingRequest {
  topic: string;
  type?: number; // 1 = instant, 2 = scheduled, 3 = recurring no fixed time, 8 = recurring fixed time
  start_time?: string; // ISO 8601 format
  duration?: number; // minutes
  timezone?: string;
  password?: string;
  agenda?: string;
  settings?: ZoomMeetingSettings;
}

export interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  agenda?: string;
  created_at: string;
  start_url: string; // URL for host to start meeting
  join_url: string; // URL for participants to join
  password?: string;
  h323_password?: string;
  pstn_password?: string;
  encrypted_password?: string;
}

interface ZoomErrorResponse {
  code: number;
  message: string;
}

/**
 * Check if Zoom integration is configured
 */
export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

/**
 * Get an access token using Server-to-Server OAuth
 * Tokens are cached until they expire
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    return cachedToken.token;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Zoom API credentials not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET environment variables.'
    );
  }

  // Create Basic auth header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: accountId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zoom OAuth error:', errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status} ${response.statusText}`);
  }

  const data: ZoomTokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Create a new Zoom meeting
 *
 * @param params Meeting parameters
 * @returns The created meeting details including join URL
 */
export async function createZoomMeeting(params: {
  topic: string;
  startTime: Date;
  duration: number; // minutes
  timezone?: string;
  agenda?: string;
  password?: string;
  alternativeHosts?: string; // Comma-separated email addresses
  settings?: ZoomMeetingSettings;
}): Promise<ZoomMeetingResponse> {
  const accessToken = await getAccessToken();

  const requestBody: ZoomCreateMeetingRequest = {
    topic: params.topic,
    type: 2, // Scheduled meeting
    start_time: params.startTime.toISOString(),
    duration: params.duration,
    timezone: params.timezone || 'America/New_York',
    agenda: params.agenda,
    password: params.password,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true, // Allow participants to join before host
      mute_upon_entry: true, // Mute participants on entry
      waiting_room: false, // Disable waiting room for easier access
      audio: 'both',
      auto_recording: 'none',
      ...(params.alternativeHosts ? { alternative_hosts: params.alternativeHosts } : {}),
      ...params.settings,
    },
  };

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData: ZoomErrorResponse = await response.json().catch(() => ({ code: response.status, message: response.statusText }));
    console.error('Zoom create meeting error:', errorData);
    throw new Error(`Failed to create Zoom meeting: ${errorData.message || response.statusText}`);
  }

  const meeting: ZoomMeetingResponse = await response.json();
  return meeting;
}

/**
 * Delete a Zoom meeting
 *
 * @param meetingId The Zoom meeting ID
 */
export async function deleteZoomMeeting(meetingId: string | number): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  // 204 No Content is success, 404 means meeting already deleted
  if (!response.ok && response.status !== 404) {
    const errorData: ZoomErrorResponse = await response.json().catch(() => ({ code: response.status, message: response.statusText }));
    console.error('Zoom delete meeting error:', errorData);
    throw new Error(`Failed to delete Zoom meeting: ${errorData.message || response.statusText}`);
  }
}

/**
 * Update a Zoom meeting
 *
 * @param meetingId The Zoom meeting ID
 * @param params Updated meeting parameters
 */
export async function updateZoomMeeting(
  meetingId: string | number,
  params: {
    topic?: string;
    startTime?: Date;
    duration?: number;
    timezone?: string;
    agenda?: string;
    password?: string;
    settings?: ZoomMeetingSettings;
  }
): Promise<void> {
  const accessToken = await getAccessToken();

  const requestBody: Partial<ZoomCreateMeetingRequest> = {};

  if (params.topic) requestBody.topic = params.topic;
  if (params.startTime) requestBody.start_time = params.startTime.toISOString();
  if (params.duration) requestBody.duration = params.duration;
  if (params.timezone) requestBody.timezone = params.timezone;
  if (params.agenda) requestBody.agenda = params.agenda;
  if (params.password) requestBody.password = params.password;
  if (params.settings) requestBody.settings = params.settings;

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  // 204 No Content is success
  if (!response.ok && response.status !== 204) {
    const errorData: ZoomErrorResponse = await response.json().catch(() => ({ code: response.status, message: response.statusText }));
    console.error('Zoom update meeting error:', errorData);
    throw new Error(`Failed to update Zoom meeting: ${errorData.message || response.statusText}`);
  }
}

/**
 * Get a Zoom meeting details
 *
 * @param meetingId The Zoom meeting ID
 * @returns Meeting details
 */
export async function getZoomMeeting(meetingId: string | number): Promise<ZoomMeetingResponse> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData: ZoomErrorResponse = await response.json().catch(() => ({ code: response.status, message: response.statusText }));
    console.error('Zoom get meeting error:', errorData);
    throw new Error(`Failed to get Zoom meeting: ${errorData.message || response.statusText}`);
  }

  return await response.json();
}
