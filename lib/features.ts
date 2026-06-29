/**
 * Platform feature flags.
 *
 * These let us turn features on/off without ripping out code, so a temporarily
 * disabled feature can be restored by flipping a single boolean.
 */

/**
 * The mass email ("email blast") feature.
 *
 * Temporarily disabled while the SendGrid subscription is paused. The compose
 * UI and the send/preview APIs are gated on this flag. To re-enable the
 * feature, set this back to `true` (no other changes required).
 */
export const MASS_EMAIL_ENABLED = false;

/**
 * Message shown to users when they reach the mass email feature while it is
 * disabled.
 */
export const MASS_EMAIL_DISABLED_MESSAGE =
  'This feature is no longer available — please upgrade and email info@uniontab.com for access.';
