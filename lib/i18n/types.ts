export type Language = 'en' | 'fr';

export interface LandingPageTranslations {
  nav: {
    features: string;
    pricing: string;
    about: string;
    blog: string;
    contact: string;
    memberLogin: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    title: {
      line1: string;
      highlight: string;
      line3: string;
    };
    subtitle: string;
    stats: {
      builtByUnion: string;
      uptime: string;
      freeForSmall: string;
    };
    cta: {
      startFree: string;
      seeFeatures: string;
    };
    floatingCard: {
      title: string;
      subtitle: string;
    };
    disclaimer: string;
  };
  roi: {
    stat1: { value: string; label: string };
    stat2: { value: string; label: string };
    stat3: { value: string; label: string };
    stat4: { value: string; label: string };
    headline: string;
    body: string;
    points: string[];
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      step1: {
        title: string;
        description: string;
      };
      step2: {
        title: string;
        description: string;
      };
      step3: {
        title: string;
        description: string;
      };
    };
  };
  features: {
    title: string;
    subtitle: string;
    elections: {
      title: string;
      eyebrow: string;
      description: string;
      points: string[];
    };
    communications: {
      title: string;
      eyebrow: string;
      description: string;
      points: string[];
    };
    analytics: {
      title: string;
      eyebrow: string;
      description: string;
      points: string[];
    };
    memberPortal: {
      title: string;
      description: string;
      points: string[];
    };
    storage: {
      title: string;
      description: string;
      points: string[];
    };
    events: {
      title: string;
      description: string;
      points: string[];
    };
  };
  whyUs: {
    title: string;
    subtitle: string;
    builtByUnion: {
      title: string;
      description: string;
    };
    freeForSmall: {
      title: string;
      description: string;
    };
    saveHours: {
      title: string;
      description: string;
    };
  };
  security: {
    title: string;
    subtitle: string;
    encryption: {
      title: string;
      description: string;
    };
    auditTrails: {
      title: string;
      description: string;
    };
    anonymousVoting: {
      title: string;
      description: string;
    };
    uptime: {
      title: string;
      description: string;
    };
  };
  trustedBy: string;
  cta: {
    title: string;
    subtitle: string;
    startFree: string;
    viewPricing: string;
    bottomText: string;
    demoText: string;
    bookDemo: string;
  };
  footer: {
    description: string;
    product: string;
    company: string;
    legal: string;
    about: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
}

export interface Translations {
  landing: LandingPageTranslations;
}
