import {Stream} from "xstream";

export namespace JeriveCycleTranslate {
    /**
     * Emitted translator function
     * Takes a translation key and optional values to be interpolated
     * 
     * You can access the current locale via the $currentLocale property 
     */
    export interface Translator {
        t(key: string, values?: {}): string;
        currentLocale: string;
    }

    export interface TranslationLoader {
        (locale$: Stream<string>): Stream<Translations>;
    }

    export interface TranslationInterpolator {
        (key: string, values?: Object): string;
    }

    export interface TranslatorFactory {
        (defaultLocaleAndLocale: [Translations, Translations]): Translator;
    }

    export interface Translations {
        payload: {};
        locale: string;
    }

    export interface DriverOptions {
        flattenerDelimiter?: string;
        interpolator?: TranslationInterpolator;
        cacheTranslations?: boolean;
        getPreferredLocale?: () => Stream<string>;
        bundledTranslations?: Object;
    }

    export interface TranslateDriverFunction {
        (locale$: Stream<string>): TranslatorSource;
    }

    export interface TranslatorSource {
        go(ns?: string): Stream<Translator>;
    }
}
