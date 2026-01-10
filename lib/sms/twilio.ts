import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
  return Boolean(accountSid && authToken && fromPhoneNumber);
}

// Get Twilio client (lazy initialization)
function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(accountSid, authToken);
}

interface SendSMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a single SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<SendSMSResult> {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
  }

  try {
    const client = getTwilioClient();

    // Normalize phone number - ensure it has country code
    const normalizedPhone = normalizePhoneNumber(to);

    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: normalizedPhone,
    });

    return {
      success: true,
      sid: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Normalize phone number to E.164 format for Twilio
 * Assumes North American numbers if no country code provided
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If it starts with +, assume it's already in E.164 format
  if (normalized.startsWith('+')) {
    return normalized;
  }

  // If it's 10 digits (North American), add +1
  if (normalized.length === 10) {
    return `+1${normalized}`;
  }

  // If it's 11 digits and starts with 1 (North American with country code), add +
  if (normalized.length === 11 && normalized.startsWith('1')) {
    return `+${normalized}`;
  }

  // Otherwise, just add + and hope for the best
  return `+${normalized}`;
}

/**
 * Validate a phone number (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all non-numeric characters except +
  const normalized = phone.replace(/[^\d+]/g, '');

  // Must have at least 10 digits
  const digitsOnly = normalized.replace(/\D/g, '');

  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}
