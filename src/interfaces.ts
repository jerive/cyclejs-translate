/// <reference path="./../node_modules/xstream/core.d.ts" />
/// <reference path="./../node_modules/@cycle/base/lib/index.d.ts" />

import Stream from "./../node_modules/xstream/core.d";
import { StreamAdapter } from "./../node_modules/@cycle/base/lib/index.d";

export namespace JeriveCycleTranslate {
    /**
     * Emitted translator function
     * Takes a translation key and optional values to be interpolated
     * 
     * You can access the current locale via the $currentLocale property 
     */
    export interface Translator {
        (key: string, values?: Object): string;
        $currentLocale?: string;
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
        payload: Object;
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
        (locale$: Stream<any>): Stream<Translator>;
        streamAdapter?: StreamAdapter;
    }
}
