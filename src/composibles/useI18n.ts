// Simple i18n composable for the custom elements
// Usage: const { t, n, locale } = useI18n(language)
// - t(key) translates a string key
// - n(number) formats a number for the locale

export type SupportedLanguage = 'nl' | 'en' | 'de';

const messages: Record<SupportedLanguage, Readonly<Record<string, string>>> = {
  nl: {
    'tabs.all': 'Alle',
    'tabs.media': 'Beeld',
    'loading': 'Laden...',
    'moreDetails': 'Meer details',
    'hello': 'Hallo wereld',
  },
  en: {
    'tabs.all': 'All',
    'tabs.media': 'Images',
    'loading': 'Loading...',
    'moreDetails': 'More details',
    'hello': 'Hello world',
  },
  de: {
    'tabs.all': 'Alle',
    'tabs.media': 'Bilder',
    'loading': 'Wird geladen...',
    'moreDetails': 'Mehr Details',
    'hello': 'Hallo Welt',
  },
};

const localeMap: Record<SupportedLanguage, string> = {
  nl: 'nl-NL',
  en: 'en-US',
  de: 'de-DE',
};

export function useI18n(language: string = 'nl') {
  const lang = (['nl', 'en', 'de'] as string[]).includes(language) ? (language as SupportedLanguage) : 'nl';
  const dict = messages[lang];
  const locale = localeMap[lang];

  function t(key: string): string {
    return dict[key] ?? key;
  }

  function n(value: number): string {
    try {
      return new Intl.NumberFormat(locale).format(value);
    } catch {
      return String(value);
    }
  }

  return { t, n, locale, lang, };
}
