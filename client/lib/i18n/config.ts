export const fallbackLng = 'en';
export const languages = [fallbackLng, 'hi', 'fr', 'de', 'ar', 'si', 'ta', 'ja', 'zh'];
export const defaultNS = 'common';
export const cookieName = 'i18next';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
}
