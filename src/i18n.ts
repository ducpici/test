import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enTrans from "@/translations/en/translation.json";
import viTrans from "@/translations/vi/translation.json";

const resources = {
  en: {
    translation: enTrans,
  },
  vi: {
    translation: viTrans,
  },
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    supportedLngs: ["en", "vi"],
    debug: true,
    resources,
    fallbackLng: "vi",
    ns: ["translation", "configuration"],
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
