import type { AdminPermissions } from '@/lib/db/schema';

/**
 * Admin Permission Categories
 * These define what features an admin can access
 */
export const ADMIN_PERMISSION_CATEGORIES = {
  members: {
    key: 'members',
    label: 'Members',
    description: 'View and manage member list',
  },
  communications: {
    key: 'communications',
    label: 'Communications',
    description: 'Send mass emails and SMS messages',
  },
  dues: {
    key: 'dues',
    label: 'Dues',
    description: 'Manage dues and payments',
  },
  strikes: {
    key: 'strikes',
    label: 'Strikes',
    description: 'Manage strike activities and picket schedules',
  },
  grievances: {
    key: 'grievances',
    label: 'Grievances',
    description: 'View and manage member grievances',
  },
  meetings: {
    key: 'meetings',
    label: 'Meetings',
    description: 'Create and manage meetings',
  },
  announcements: {
    key: 'announcements',
    label: 'Announcements',
    description: 'Create and manage announcements',
  },
  elections: {
    key: 'elections',
    label: 'Elections',
    description: 'Create and manage elections',
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    description: 'Access union settings and configuration',
  },
  analytics: {
    key: 'analytics',
    label: 'Analytics',
    description: 'View union analytics and reports',
  },
} as const;

export type AdminPermissionKey = keyof typeof ADMIN_PERMISSION_CATEGORIES;

/**
 * Get all permission keys
 */
export const ALL_PERMISSION_KEYS = Object.keys(ADMIN_PERMISSION_CATEGORIES) as AdminPermissionKey[];

/**
 * Default permissions for a new admin (all enabled by default)
 */
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  members: true,
  communications: true,
  dues: true,
  strikes: true,
  grievances: true,
  meetings: true,
  announcements: true,
  elections: true,
  settings: false, // Settings default to off - more sensitive
  analytics: false, // Analytics default to off - more sensitive
};

/**
 * Check if a member has a specific permission
 * Owners always have all permissions
 */
export function hasPermission(
  role: string | null | undefined,
  permissions: AdminPermissions | null | undefined,
  permission: AdminPermissionKey
): boolean {
  // Owners have all permissions
  if (role === 'owner') {
    return true;
  }

  // Non-admins have no admin permissions
  if (role !== 'admin') {
    return false;
  }

  // For admins, check the specific permission
  // If permissions object doesn't exist, use defaults (all enabled for backwards compatibility)
  if (!permissions) {
    return true; // Backwards compatibility - existing admins have all permissions
  }

  return permissions[permission] === true;
}

/**
 * Check if a member has owner or admin role with a specific permission
 */
export function isOwnerOrHasPermission(
  role: string | null | undefined,
  permissions: AdminPermissions | null | undefined,
  permission: AdminPermissionKey
): boolean {
  if (role === 'owner') return true;
  return hasPermission(role, permissions, permission);
}

/**
 * Get list of permissions an admin has
 */
export function getActivePermissions(permissions: AdminPermissions | null | undefined): AdminPermissionKey[] {
  if (!permissions) return ALL_PERMISSION_KEYS; // Backwards compatibility
  return ALL_PERMISSION_KEYS.filter(key => permissions[key] === true);
}

/**
 * Get count of enabled permissions
 */
export function getPermissionCount(permissions: AdminPermissions | null | undefined): number {
  if (!permissions) return ALL_PERMISSION_KEYS.length;
  return ALL_PERMISSION_KEYS.filter(key => permissions[key] === true).length;
}
