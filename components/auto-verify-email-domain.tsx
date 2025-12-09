'use client';

import { useEffect, useState } from 'react';

interface AutoVerifyEmailDomainProps {
  unionId: number;
}

/**
 * Automatically verifies email domain after 2 minutes if it's pending
 * This component should be included on the union dashboard/home page
 */
export function AutoVerifyEmailDomain({ unionId }: AutoVerifyEmailDomainProps) {
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    // Check if domain needs verification
    async function checkAndVerify() {
      try {
        // Check current status
        const statusResponse = await fetch(`/api/email-domains/status?unionId=${unionId}`);
        const status = await statusResponse.json();

        // Only verify if configured but not verified
        if (status.configured && !status.isVerified && status.verificationStatus === 'pending') {
          console.log('[Auto-Verify] Email domain is pending verification, scheduling...');

          // Calculate time since creation
          const createdAt = new Date(status.createdAt);
          const now = new Date();
          const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60;

          // If less than 2 minutes old, wait the remaining time
          const waitMinutes = Math.max(0, 2 - minutesSinceCreation);
          const waitMs = waitMinutes * 60 * 1000;

          console.log(`[Auto-Verify] Waiting ${waitMinutes.toFixed(1)} minutes before verification...`);

          setTimeout(async () => {
            console.log('[Auto-Verify] Attempting verification...');

            try {
              const verifyResponse = await fetch('/api/email-domains/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unionId }),
              });

              const result = await verifyResponse.json();

              if (result.verified) {
                console.log('[Auto-Verify] ✅ Email domain verified successfully!');
              } else {
                console.log('[Auto-Verify] ⏳ Verification pending, DNS may still be propagating');
              }

              setVerificationAttempted(true);
            } catch (error) {
              console.error('[Auto-Verify] ❌ Verification failed:', error);
            }
          }, waitMs);
        } else if (status.isVerified) {
          console.log('[Auto-Verify] Email domain already verified ✅');
        } else if (!status.configured) {
          console.log('[Auto-Verify] Email domain not configured yet');
        }
      } catch (error) {
        console.error('[Auto-Verify] Error checking email domain status:', error);
      }
    }

    checkAndVerify();
  }, [unionId, verificationAttempted]);

  // This component doesn't render anything visible
  return null;
}
