'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import type { Language } from '@/lib/i18n/types';

interface UnionLanguageSyncProps {
  defaultLanguage: Language;
}

const UNION_LANGUAGE_KEY = 'uniontab-union-language-set';

/**
 * Client component that syncs the union's default language with the language context.
 * It only sets the language on first visit to a union site if the user hasn't explicitly
 * chosen a language preference before.
 */
export function UnionLanguageSync({ defaultLanguage }: UnionLanguageSyncProps) {
  const { setLanguage, language } = useLanguage();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Check if user has explicitly set their language preference
    const savedLanguage = localStorage.getItem('uniontab-language');

    // If no user preference exists, use the union's default language
    if (!savedLanguage && defaultLanguage !== language) {
      setLanguage(defaultLanguage);
    }
  }, [defaultLanguage, setLanguage, language]);

  return null;
}
