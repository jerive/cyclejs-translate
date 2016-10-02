/// <reference path="./../typings/index.d.ts" />

import Stream from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import concat from "xstream/extra/concat";
import XStreamAdapter from "@cycle/xstream-adapter";
import { StreamAdapter } from "@cycle/base";
import { RequestOptions, HTTPSource, Response } from "@cycle/http";

export interface TranslationLoader {
    (locale$: Stream<string>): Stream<Translations>;
}

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

export interface TranslationInterpolator {
    (key: string, values?: Object): string;
}

interface TranslatorFactory {
    (defaultLocaleAndLocale: [Translations, Translations]): Translator;
}

export interface Translations {
    payload: Object;
    locale: string;
}

export interface DriverOptions {
    flattenerDelimiter?: string;
    interpolator?: TranslationInterpolator;
    useCache?: boolean;
}

export interface TranslateDriverFunction {
    (locale$: Stream<any>): Stream<Translator>;
    streamAdapter?: StreamAdapter;
}

/**
 * @param {string} fallbackLocale - The locale to fallback to when a translation 
 * is missing in the required locale
 * @param {TranslationLoader} translationLoader - How to load the translations
 * @return {TranslateDriverFunction} The translate driver
 */
export function makeTranslateDriver(
    fallbackLocale: string,
    translationLoader: TranslationLoader,
    options: DriverOptions = {}
) {
    const driver: TranslateDriverFunction = (locale$: Stream<any>): Stream<Translator> => {
        options = Object.assign({
            flattenerDelimiter: ".",
            interpolator: (key: string, _values: Object) => key,
            useCache: false
        }, options);

        let flatTranslationLoader = (locale$: Stream<string>): Stream<Translations> =>
            locale$.compose(translationLoader).map(({locale, payload}) => ({ locale, payload: flatten(payload)}));

        if (options.useCache) {
            flatTranslationLoader = makeCachedLoader(flatTranslationLoader, {});
        }

        const flatten = objectFlattener(options.flattenerDelimiter);
        const preferredLocale = getPreferredLocale();
        const dedupedLocale$ = locale$.compose(dropRepeats<string>());
        const translation$ = dedupedLocale$.startWith(preferredLocale).compose(flatTranslationLoader);

        return Stream.combine(
            // Avoid loading both fallback translations and preferred translations if they are the same 
            preferredLocale === fallbackLocale ? translation$.take(1) : Stream.of(fallbackLocale).compose(flatTranslationLoader),
            translation$
        ).map(translationsFactory(options.interpolator));
    };

    driver.streamAdapter = XStreamAdapter;

    return driver;
};

const makeCachedLoader = (loader: TranslationLoader, cache: Object): TranslationLoader => {
    const inCache = (yes: boolean) => (locale: string) => yes ? !!cache[locale] : !cache[locale];

    return (locale$: Stream<string>) => {
        return Stream.merge<Translations>(
            locale$.filter(inCache(true)).map(locale => ({ locale, payload: cache[locale]})),
            locale$.filter(inCache(false)).compose(loader).map(x => {
                cache[x.locale] = x.payload;
                return x;
            })
        );
    };
};

const translationsFactory = (interpolate: TranslationInterpolator): TranslatorFactory => ([defaultTranslations, translations]) => {
    const translate: Translator = (key: string, values?: Object) => {
        return interpolate(translations.payload[key]
            ? translations.payload[key]
            : defaultTranslations.payload[key]
                ? defaultTranslations.payload[key]
                : key
            , values)
        ;
    };

    translate.$currentLocale = translations.locale;

    return translate;
};

export function memoryTranslationLoader(translations: Object) {
    return (locale$: Stream<string>): Stream<Translations> => {
        return locale$.map(locale => ({ locale, payload: translations[locale]}));
    };
};

/**
 * @param {Function} httpDriver - The HTTP Driver (usually the result of makeHTTPDriver())
 * @param {(locale: string) => RequestOptions} localeToRequestMapper - A mapper from a locale to a Superagent request
 * @return {(stream: Stream<string>) => Stream<Translations>} An operator that transforms
 * a stream of locales to a stream of Translations object.
 */
export function httpDriverTranslationLoader(httpDriver: Function, localeToRequestMapper: ((locale: string) => RequestOptions)) {
    return (locale$: Stream<string>): Stream<Translations> => {
        const http: HTTPSource = httpDriver(locale$.map(locale => {
            const request = localeToRequestMapper(locale);
            request.category = locale;
            request.lazy = true;
            return request;
        }).remember(), XStreamAdapter);

        return http.select(null).flatten().map((x: Response) => ({
            payload: x.body,
            locale: x.request.category
        })).remember();
    };
};

function getPreferredLocale() {
    return "en-US";
}

const objectFlattener = (delimiter: string) => {
    return function flattenObject (data: Object, path: string[] = null, result: Object = null) {
        let key: string, keyWithPath: string, obj: string;

        if (!path) path = [];
        if (!result) result = {};
        for (key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) {
                continue;
            }
            obj = data[key];
            if (obj && typeof obj === "object") {
                flattenObject(obj, path.concat(key), result);
            } else {
                keyWithPath = path.length ? ("" + path.join(delimiter) + delimiter + key) : key;
                result[keyWithPath] = obj;
            }
        }
        return result;
    };
};