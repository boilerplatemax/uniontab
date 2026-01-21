'use client';

import { useState, useEffect } from 'react';

interface UserMembership {
  unionSlug: string;
  unionName: string;
  role: string;
}

interface UseUserMembershipResult {
  isLoggedIn: boolean;
  isLoading: boolean;
  membership: UserMembership | null;
}

export function useUserMembership(): UseUserMembershipResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [membership, setMembership] = useState<UserMembership | null>(null);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const response = await fetch('/api/user/membership');
        const data = await response.json();
        setIsLoggedIn(data.isLoggedIn);
        setMembership(data.membership);
      } catch (error) {
        setIsLoggedIn(false);
        setMembership(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, []);

  return { isLoggedIn, isLoading, membership };
}
