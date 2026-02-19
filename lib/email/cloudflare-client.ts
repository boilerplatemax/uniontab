/**
 * Cloudflare DNS API Client
 *
 * Handles creation, verification, and deletion of DNS records via Cloudflare API.
 * Used for setting up DKIM, Return-Path, and tracking CNAMEs for SendGrid.
 *
 * NOTE: Automatic DNS record creation is DISABLED. createDnsRecord,
 * createDnsRecords, and createSendGridDnsRecords will throw if called.
 * DNS records must be managed manually via the Cloudflare dashboard.
 */

// Cloudflare API configuration
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

// Automatic DNS record creation is disabled. Set to false to re-enable.
const DNS_RECORD_CREATION_DISABLED = true;

// Helper functions to get environment variables (lazy evaluation)
function getApiToken(): string | undefined {
  return process.env.CLOUDFLARE_API_TOKEN;
}

function getZoneId(): string | undefined {
  return process.env.CLOUDFLARE_ZONE_ID;
}

// DNS record types
export interface DnsRecord {
  type: 'CNAME' | 'TXT' | 'MX';
  name: string; // Full DNS name (e.g., "s1._domainkey.atu123.uniontab.com")
  content: string; // Record value
  ttl?: number; // TTL in seconds (default: 3600)
  proxied?: boolean; // Cloudflare proxy (default: false for email records)
  comment?: string; // User-friendly note/comment for the DNS record
}

export interface CloudflareDnsRecord extends DnsRecord {
  id: string; // Cloudflare record ID
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  proxiable: boolean;
  locked: boolean;
  comment?: string;
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

/**
 * Validate Cloudflare configuration
 */
function validateConfig(): void {
  const apiToken = getApiToken();
  const zoneId = getZoneId();

  if (!apiToken) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is not set');
  }
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID environment variable is not set');
  }
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cloudflareRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<CloudflareApiResponse<T>> {
  validateConfig();

  const url = `${CLOUDFLARE_API_BASE}${endpoint}`;

  const apiToken = getApiToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudflare API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();

  if (!data.success) {
    const errors = data.errors.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`Cloudflare API error: ${errors}`);
  }

  return data;
}

/**
 * Create a DNS record in Cloudflare
 */
export async function createDnsRecord(record: DnsRecord): Promise<CloudflareDnsRecord> {
  if (DNS_RECORD_CREATION_DISABLED) {
    throw new Error(
      '[Cloudflare] DNS record creation is disabled. Records must be managed manually via the Cloudflare dashboard.'
    );
  }

  const payload: Record<string, unknown> = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl || 3600,
    proxied: record.proxied ?? false,
  };

  // Add comment if provided
  if (record.comment) {
    payload.comment = record.comment;
  }

  const zoneId = getZoneId();

  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${zoneId}/dns_records`,
    'POST',
    payload
  );

  return response.result;
}

/**
 * Create multiple DNS records in batch
 * Checks if records already exist and reuses them instead of creating duplicates
 */
export async function createDnsRecords(records: DnsRecord[]): Promise<CloudflareDnsRecord[]> {
  if (DNS_RECORD_CREATION_DISABLED) {
    throw new Error(
      '[Cloudflare] DNS record creation is disabled. Records must be managed manually via the Cloudflare dashboard.'
    );
  }

  const createdRecords: CloudflareDnsRecord[] = [];

  // Create records sequentially to avoid rate limits
  for (const record of records) {
    try {
      // Check if record already exists
      const existingRecords = await listDnsRecords(record.name, record.type);

      if (existingRecords.length > 0) {
        console.log(`[Cloudflare] Record already exists: ${record.name} (${record.type})`);
        createdRecords.push(existingRecords[0]);
      } else {
        console.log(`[Cloudflare] Creating new record: ${record.name} (${record.type})`);
        const created = await createDnsRecord(record);
        createdRecords.push(created);
      }
    } catch (error) {
      console.error(`Failed to create DNS record ${record.name}:`, error);
      // Continue with other records even if one fails
      throw error; // Re-throw to allow caller to handle cleanup
    }
  }

  return createdRecords;
}

/**
 * Get a DNS record by ID
 */
export async function getDnsRecord(recordId: string): Promise<CloudflareDnsRecord> {
  const zoneId = getZoneId();

  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${zoneId}/dns_records/${recordId}`
  );

  return response.result;
}

/**
 * List DNS records matching a name pattern
 */
export async function listDnsRecords(
  name?: string,
  type?: 'CNAME' | 'TXT' | 'MX'
): Promise<CloudflareDnsRecord[]> {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (type) params.append('type', type);

  const zoneId = getZoneId();

  const response = await cloudflareRequest<CloudflareDnsRecord[]>(
    `/zones/${zoneId}/dns_records?${params.toString()}`
  );

  return response.result;
}

/**
 * Update a DNS record
 */
export async function updateDnsRecord(
  recordId: string,
  updates: Partial<DnsRecord>
): Promise<CloudflareDnsRecord> {
  // Get existing record first to merge with updates
  const existing = await getDnsRecord(recordId);

  const payload: Record<string, unknown> = {
    type: updates.type || existing.type,
    name: updates.name || existing.name,
    content: updates.content || existing.content,
    ttl: updates.ttl || existing.ttl,
    proxied: updates.proxied ?? existing.proxied,
  };

  // Update comment if provided
  if (updates.comment !== undefined) {
    payload.comment = updates.comment;
  }

  const zoneId = getZoneId();

  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${zoneId}/dns_records/${recordId}`,
    'PUT',
    payload
  );

  return response.result;
}

/**
 * Delete a DNS record
 */
export async function deleteDnsRecord(recordId: string): Promise<void> {
  const zoneId = getZoneId();

  await cloudflareRequest<{ id: string }>(
    `/zones/${zoneId}/dns_records/${recordId}`,
    'DELETE'
  );
}

/**
 * Delete multiple DNS records
 */
export async function deleteDnsRecords(recordIds: string[]): Promise<void> {
  // Delete records sequentially to avoid rate limits
  for (const recordId of recordIds) {
    try {
      await deleteDnsRecord(recordId);
    } catch (error) {
      console.error(`Failed to delete DNS record ${recordId}:`, error);
      // Continue with other records even if one fails
    }
  }
}

/**
 * Verify DNS record exists and matches expected value
 */
export async function verifyDnsRecord(
  name: string,
  type: 'CNAME' | 'TXT' | 'MX',
  expectedContent: string
): Promise<boolean> {
  try {
    const records = await listDnsRecords(name, type);

    // Check if any record matches the expected content
    return records.some(record => record.content === expectedContent);
  } catch (error) {
    console.error(`Failed to verify DNS record ${name}:`, error);
    return false;
  }
}

/**
 * Create SendGrid-required DNS records for a subdomain
 * Returns the created Cloudflare record IDs
 */
export interface SendGridDnsRecords {
  dkim1: { host: string; data: string };
  dkim2: { host: string; data: string };
  mailCname?: { host: string; data: string };
  trackingCname?: { host: string; data: string };
}

export async function createSendGridDnsRecords(
  subdomain: string,
  sendgridRecords: SendGridDnsRecords
): Promise<CloudflareDnsRecord[]> {
  if (DNS_RECORD_CREATION_DISABLED) {
    throw new Error(
      '[Cloudflare] DNS record creation is disabled. Records must be managed manually via the Cloudflare dashboard.'
    );
  }

  const records: DnsRecord[] = [];

  // DKIM 1
  if (sendgridRecords.dkim1) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.dkim1.host,
      content: sendgridRecords.dkim1.data,
      ttl: 60,
      proxied: false,
      comment: `SendGrid DKIM1 signature for ${subdomain} - Required for email authentication`,
    });
  }

  // DKIM 2
  if (sendgridRecords.dkim2) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.dkim2.host,
      content: sendgridRecords.dkim2.data,
      ttl: 60,
      proxied: false,
      comment: `SendGrid DKIM2 signature for ${subdomain} - Required for email authentication`,
    });
  }

  // Return-Path (mail CNAME)
  if (sendgridRecords.mailCname) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.mailCname.host,
      content: sendgridRecords.mailCname.data,
      ttl: 60,
      proxied: false,
      comment: `SendGrid Return-Path for ${subdomain} - Required for bounce handling`,
    });
  }

  // Tracking CNAME
  if (sendgridRecords.trackingCname) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.trackingCname.host,
      content: sendgridRecords.trackingCname.data,
      ttl: 60,
      proxied: false,
      comment: `SendGrid tracking domain for ${subdomain} - Optional for click/open tracking`,
    });
  }

  return await createDnsRecords(records);
}

/**
 * Get Cloudflare zone information
 */
export async function getZoneInfo(): Promise<{
  id: string;
  name: string;
  status: string;
  name_servers: string[];
}> {
  validateConfig();

  const zoneId = getZoneId();

  const response = await cloudflareRequest<{
    id: string;
    name: string;
    status: string;
    name_servers: string[];
  }>(`/zones/${zoneId}`);

  return response.result;
}
