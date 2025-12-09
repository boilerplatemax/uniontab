/**
 * SendGrid Domain Authentication API Client
 *
 * Handles domain authentication setup and verification via SendGrid API.
 * This allows each tenant to send emails from their own subdomain.
 */

// SendGrid API configuration
const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3';

// Helper function to get environment variable (lazy evaluation)
function getApiKey(): string | undefined {
  return process.env.SENDGRID_API_KEY;
}

/**
 * SendGrid Domain Authentication response structure
 */
export interface SendGridDomainAuth {
  id: number;
  user_id: number;
  subdomain: string | null;
  domain: string;
  username: string;
  ips: string[];
  custom_spf: boolean;
  default: boolean;
  legacy: boolean;
  automatic_security: boolean;
  valid: boolean;
  dns: {
    mail_cname: {
      valid: boolean;
      type: 'cname' | 'mx';
      host: string;
      data: string;
    };
    dkim1: {
      valid: boolean;
      type: 'cname';
      host: string;
      data: string;
    };
    dkim2: {
      valid: boolean;
      type: 'cname';
      host: string;
      data: string;
    };
  };
}

/**
 * Request payload for creating domain authentication
 */
export interface CreateDomainAuthRequest {
  domain: string; // Base domain (e.g., "uniontab.com")
  subdomain?: string; // Subdomain to authenticate (e.g., "atu123")
  username?: string; // Optional username for tracking
  ips?: string[]; // Optional IPs to associate
  custom_spf?: boolean; // Use custom SPF record
  default?: boolean; // Set as default sending domain
  automatic_security?: boolean; // Auto-renew security settings
}

/**
 * Validation response
 */
export interface ValidationResponse {
  id: number;
  valid: boolean;
  validation_results: {
    mail_cname: {
      valid: boolean;
      reason: string | null;
    };
    dkim1: {
      valid: boolean;
      reason: string | null;
    };
    dkim2: {
      valid: boolean;
      reason: string | null;
    };
  };
}

/**
 * Validate SendGrid configuration
 */
function validateConfig(): void {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }
}

/**
 * Make authenticated request to SendGrid API
 */
async function sendgridRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  validateConfig();

  const url = `${SENDGRID_API_BASE}${endpoint}`;
  const apiKey = getApiKey();

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SendGrid API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  // Handle empty responses (e.g., DELETE)
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  return data;
}

/**
 * Create a new authenticated domain in SendGrid
 * This returns the DNS records that need to be created
 */
export async function createDomainAuthentication(
  domain: string,
  subdomain: string
): Promise<SendGridDomainAuth> {
  const payload: CreateDomainAuthRequest = {
    domain,
    subdomain,
    automatic_security: true,
    custom_spf: false,
    default: false,
  };

  const response = await sendgridRequest<SendGridDomainAuth>(
    '/whitelabel/domains',
    'POST',
    payload
  );

  return response;
}

/**
 * Get an authenticated domain by ID
 */
export async function getDomainAuthentication(domainId: number): Promise<SendGridDomainAuth> {
  const response = await sendgridRequest<SendGridDomainAuth>(
    `/whitelabel/domains/${domainId}`
  );

  return response;
}

/**
 * List all authenticated domains
 */
export async function listDomainAuthentications(): Promise<SendGridDomainAuth[]> {
  const response = await sendgridRequest<SendGridDomainAuth[]>('/whitelabel/domains');

  return response;
}

/**
 * Validate (verify) a domain authentication
 * This checks if the DNS records are properly configured
 */
export async function validateDomainAuthentication(
  domainId: number
): Promise<ValidationResponse> {
  const response = await sendgridRequest<ValidationResponse>(
    `/whitelabel/domains/${domainId}/validate`,
    'POST'
  );

  return response;
}

/**
 * Delete a domain authentication
 */
export async function deleteDomainAuthentication(domainId: number): Promise<void> {
  await sendgridRequest<void>(`/whitelabel/domains/${domainId}`, 'DELETE');
}

/**
 * Set a domain as the default sending domain
 */
export async function setDefaultDomain(domainId: number): Promise<SendGridDomainAuth> {
  const response = await sendgridRequest<SendGridDomainAuth>(
    `/whitelabel/domains/${domainId}/default`,
    'POST'
  );

  return response;
}

/**
 * Get the DNS records needed for domain authentication
 * This extracts the records from the SendGrid response in a clean format
 */
export interface DnsRecordInfo {
  type: string;
  host: string;
  data: string;
  valid: boolean;
}

export function extractDnsRecords(domainAuth: SendGridDomainAuth): DnsRecordInfo[] {
  const records: DnsRecordInfo[] = [];

  // DKIM 1
  if (domainAuth.dns.dkim1) {
    records.push({
      type: 'CNAME',
      host: domainAuth.dns.dkim1.host,
      data: domainAuth.dns.dkim1.data,
      valid: domainAuth.dns.dkim1.valid,
    });
  }

  // DKIM 2
  if (domainAuth.dns.dkim2) {
    records.push({
      type: 'CNAME',
      host: domainAuth.dns.dkim2.host,
      data: domainAuth.dns.dkim2.data,
      valid: domainAuth.dns.dkim2.valid,
    });
  }

  // Mail CNAME (Return-Path)
  if (domainAuth.dns.mail_cname) {
    records.push({
      type: domainAuth.dns.mail_cname.type.toUpperCase(),
      host: domainAuth.dns.mail_cname.host,
      data: domainAuth.dns.mail_cname.data,
      valid: domainAuth.dns.mail_cname.valid,
    });
  }

  return records;
}

/**
 * Check if domain authentication is fully valid
 */
export function isDomainValid(domainAuth: SendGridDomainAuth): boolean {
  return (
    domainAuth.valid &&
    domainAuth.dns.dkim1.valid &&
    domainAuth.dns.dkim2.valid &&
    domainAuth.dns.mail_cname.valid
  );
}

/**
 * Get validation status summary
 */
export interface ValidationSummary {
  isValid: boolean;
  validRecords: string[];
  invalidRecords: string[];
  pendingRecords: string[];
}

export function getValidationSummary(domainAuth: SendGridDomainAuth): ValidationSummary {
  const summary: ValidationSummary = {
    isValid: domainAuth.valid,
    validRecords: [],
    invalidRecords: [],
    pendingRecords: [],
  };

  // Check DKIM1
  if (domainAuth.dns.dkim1.valid) {
    summary.validRecords.push('DKIM1');
  } else {
    summary.invalidRecords.push('DKIM1');
  }

  // Check DKIM2
  if (domainAuth.dns.dkim2.valid) {
    summary.validRecords.push('DKIM2');
  } else {
    summary.invalidRecords.push('DKIM2');
  }

  // Check Mail CNAME
  if (domainAuth.dns.mail_cname.valid) {
    summary.validRecords.push('Return-Path');
  } else {
    summary.invalidRecords.push('Return-Path');
  }

  return summary;
}

/**
 * Parse SendGrid domain ID from string or number
 */
export function parseDomainId(domainId: string | number): number {
  const id = typeof domainId === 'string' ? parseInt(domainId, 10) : domainId;

  if (isNaN(id)) {
    throw new Error(`Invalid SendGrid domain ID: ${domainId}`);
  }

  return id;
}

/**
 * Wait for DNS propagation with retry logic
 * Useful after creating DNS records to wait for validation
 */
export async function waitForDnsValidation(
  domainId: number,
  maxAttempts: number = 10,
  delayMs: number = 30000 // 30 seconds between attempts
): Promise<ValidationResponse> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const validation = await validateDomainAuthentication(domainId);

      if (validation.valid) {
        return validation;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        console.log(
          `DNS validation attempt ${attempt}/${maxAttempts} failed. Waiting ${delayMs / 1000}s...`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Validation attempt ${attempt} error:`, error);

      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`DNS validation failed after ${maxAttempts} attempts`);
}
