/**
 * Cloudflare DNS API Client
 *
 * Handles creation, verification, and deletion of DNS records via Cloudflare API.
 * Used for setting up DKIM, Return-Path, and tracking CNAMEs for SendGrid.
 */

// Cloudflare API configuration
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

// DNS record types
export interface DnsRecord {
  type: 'CNAME' | 'TXT' | 'MX';
  name: string; // Full DNS name (e.g., "s1._domainkey.atu123.uniontab.com")
  content: string; // Record value
  ttl?: number; // TTL in seconds (default: 3600)
  proxied?: boolean; // Cloudflare proxy (default: false for email records)
}

export interface CloudflareDnsRecord extends DnsRecord {
  id: string; // Cloudflare record ID
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  proxiable: boolean;
  locked: boolean;
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
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is not set');
  }
  if (!CLOUDFLARE_ZONE_ID) {
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

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
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
  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl || 3600,
    proxied: record.proxied ?? false,
  };

  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
    'POST',
    payload
  );

  return response.result;
}

/**
 * Create multiple DNS records in batch
 */
export async function createDnsRecords(records: DnsRecord[]): Promise<CloudflareDnsRecord[]> {
  const createdRecords: CloudflareDnsRecord[] = [];

  // Create records sequentially to avoid rate limits
  for (const record of records) {
    try {
      const created = await createDnsRecord(record);
      createdRecords.push(created);
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
  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`
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

  const response = await cloudflareRequest<CloudflareDnsRecord[]>(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records?${params.toString()}`
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

  const payload = {
    type: updates.type || existing.type,
    name: updates.name || existing.name,
    content: updates.content || existing.content,
    ttl: updates.ttl || existing.ttl,
    proxied: updates.proxied ?? existing.proxied,
  };

  const response = await cloudflareRequest<CloudflareDnsRecord>(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
    'PUT',
    payload
  );

  return response.result;
}

/**
 * Delete a DNS record
 */
export async function deleteDnsRecord(recordId: string): Promise<void> {
  await cloudflareRequest<{ id: string }>(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
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
  const records: DnsRecord[] = [];

  // DKIM 1
  if (sendgridRecords.dkim1) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.dkim1.host,
      content: sendgridRecords.dkim1.data,
      ttl: 3600,
      proxied: false,
    });
  }

  // DKIM 2
  if (sendgridRecords.dkim2) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.dkim2.host,
      content: sendgridRecords.dkim2.data,
      ttl: 3600,
      proxied: false,
    });
  }

  // Return-Path (mail CNAME)
  if (sendgridRecords.mailCname) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.mailCname.host,
      content: sendgridRecords.mailCname.data,
      ttl: 3600,
      proxied: false,
    });
  }

  // Tracking CNAME
  if (sendgridRecords.trackingCname) {
    records.push({
      type: 'CNAME',
      name: sendgridRecords.trackingCname.host,
      content: sendgridRecords.trackingCname.data,
      ttl: 3600,
      proxied: false,
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

  const response = await cloudflareRequest<{
    id: string;
    name: string;
    status: string;
    name_servers: string[];
  }>(`/zones/${CLOUDFLARE_ZONE_ID}`);

  return response.result;
}
