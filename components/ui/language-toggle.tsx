'use client';

import { useLanguage, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'pill';
}

export function LanguageToggle({ className, variant = 'default' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => handleLanguageChange(language === 'en' ? 'fr' : 'en')}
        className={cn(
          'text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors',
          className
        )}
        aria-label={`Switch to ${language === 'en' ? 'French' : 'English'}`}
      >
        {language === 'en' ? 'FR' : 'EN'}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm',
          className
        )}
      >
        <button
          onClick={() => handleLanguageChange('en')}
          className={cn(
            'px-3 py-1 text-sm font-medium rounded-full transition-all duration-200',
            language === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
          aria-label="Switch to English"
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          onClick={() => handleLanguageChange('fr')}
          className={cn(
            'px-3 py-1 text-sm font-medium rounded-full transition-all duration-200',
            language === 'fr'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
          aria-label="Switch to French"
          aria-pressed={language === 'fr'}
        >
          FR
        </button>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        className
      )}
    >
      <button
        onClick={() => handleLanguageChange('en')}
        className={cn(
          'px-2 py-1 rounded transition-colors',
          language === 'en'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Switch to English"
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => handleLanguageChange('fr')}
        className={cn(
          'px-2 py-1 rounded transition-colors',
          language === 'fr'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Switch to French"
        aria-pressed={language === 'fr'}
      >
        FR
      </button>
    </div>
  );
}
