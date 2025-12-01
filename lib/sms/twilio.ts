import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio not configured');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Send 2FA verification code via SMS
 */
export async function send2FACodeSMS(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const message = `Your UnionTab verification code is: ${code}. This code will expire in 10 minutes.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format phone number to E.164 format (for US numbers)
 */
export function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it's 11 digits and starts with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If it already has +, return as is (if valid)
  if (phoneNumber.startsWith('+') && validatePhoneNumber(phoneNumber)) {
    return phoneNumber;
  }

  return null;
}
