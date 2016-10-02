import Stream from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import XStreamAdapter from "@cycle/xstream-adapter";
import {JeriveCycleTranslate as jct} from "./interfaces";
import "es6-shim";

/**
 * @param {string} fallbackLocale - The locale to fallback to when a translation 
 * is missing in the required locale
 * @param {translate.TranslationLoader} translationLoader - How to load the translations
 * @return {translate.TranslateDriverFunction} The translate driver
 */
export function makeTranslateDriver(
    fallbackLocale: string,
    translationLoader: jct.TranslationLoader,
    options: jct.DriverOptions = {}
) {
    const driver: jct.TranslateDriverFunction = (locale$: Stream<any>): Stream<jct.Translator> => {
        options = Object.assign({
            flattenerDelimiter: ".",
            interpolator: (key: string, _values: Object) => key,
            useCache: false
        }, options);

        let flatTranslationLoader = (locale$: Stream<string>): Stream<jct.Translations> =>
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


const makeCachedLoader = (loader: jct.TranslationLoader, cache: Object): jct.TranslationLoader => {
    const inCache = (yes: boolean) => (locale: string) => yes ? !!cache[locale] : !cache[locale];

    return (locale$: Stream<string>) => {
        return Stream.merge<jct.Translations>(
            locale$.filter(inCache(true)).map(locale => ({ locale, payload: cache[locale]})),
            locale$.filter(inCache(false)).compose(loader).map(x => {
                cache[x.locale] = x.payload;
                return x;
            })
        );
    };
};

const translationsFactory = (interpolate: jct.TranslationInterpolator): jct.TranslatorFactory => ([defaultTranslations, translations]) => {
    const translate: jct.Translator = (key: string, values?: Object) => {
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


function getPreferredLocale() {
    return "en-US";
}

function objectFlattener (delimiter: string) {
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