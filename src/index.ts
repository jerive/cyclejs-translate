/// <reference path="./../typings/index.d.ts" />

import Stream from "xstream";
import Concat from "xstream/extra/concat";
import {StreamAdapter} from "@cycle/base";

export interface TranslationLoader {
    (locale$: Stream<string>): Stream<Object>;
}

export interface Translations {
    locale: string;
    data: Object;
}

export interface Translator {
    (key: string, values?: Object): string;
    $currentLocale?: string;
}

interface TranslatorFactory {
    (defaultLocaleAndLocale: [Translations, Translations, string]): Translator;
}

export function makeTranslationDriver(
    defaultLocale: string,
    translationLoader: TranslationLoader
) {
    return (locale$: Stream<any>, runSA: StreamAdapter): Stream<Translator> => {
        const currentLocale = getCurrentLocale();
        const defaultTranslations$ = translationLoader(Stream.of(defaultLocale));
        const translationsFactory: TranslatorFactory = ([defaultTranslations, translations, locale]) => {
            const translate: Translator = (key: string, values?: Object) => {
                return translations.data[key]
                    ? translations.data[key]
                    : defaultTranslations.data[key]
                        ? defaultTranslations.data[key]
                        : key
                ;
            };

            translate.$currentLocale = locale;

            return translate;
        };

        return Stream.combine(
            defaultTranslations$,
            Concat(currentLocale === defaultLocale ? defaultTranslations$ : translationLoader(Stream.of(currentLocale)), translationLoader(locale$)),
            locale$.startWith(currentLocale)
        ).map(translationsFactory);
    };
};

export function memoryTranslationLoader(translations: Object) {
    return (locale$: Stream<string>): Stream<Translations> => {
        return locale$.map(locale => ({
            locale,
            data: translations[locale]
        }));
    };
};

function getCurrentLocale() {
    return "en-US";
}
