import { ta } from './ta';
import { en } from './en';
import { Language } from '../types';

export const translations = {
  ta,
  en,
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.ta;
}
