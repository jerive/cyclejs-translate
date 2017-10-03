import {Stream} from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import concat from "xstream/extra/concat";
import {JeriveCycleTranslate as jct} from "./interfaces";
import {adapt} from "@cycle/run/lib/adapt";

class TranslatorSource implements jct.TranslatorSource {
    constructor(
        private t$: Stream<jct.Translator>
    ) {}

    go(namespace: string = ""): Stream<jct.Translator> {
        return this.t$.map(({t, currentLocale}) => {
            return { t: (k: string, v?: {}) => t(namespace + k, v), currentLocale};
        });
    }
}

/**
 * @param {string} fallbackLocale - The locale to fallback to when a translation 
 * is missing in the required locale
 * @param {translate.TranslationLoader} translationLoader - How to load the translations
 * @return {translate.TranslateDriverFunction} The translate driver
 */
export function makeTranslateDriver(
    fallbackLocale: string,
    loader: jct.TranslationLoader,
    options: jct.DriverOptions = {}
) {
    const driver: jct.TranslateDriverFunction = (locale$: Stream<any>): jct.TranslatorSource => {
        const newOptions = Object.assign({
            flattenerDelimiter: ".",
            interpolator: getDefaultInterpolator(),
            cacheTranslations: true,
            getPreferredLocale: defaultGetPreferredLocale,
            bundledTranslations: {}
        }, options);

        const localeHttp$Cache: { [key: string]: Stream<jct.Translations> } = {};
        const cache = {};
        const flatten = objectFlattener(newOptions.flattenerDelimiter);
        Object.keys(options.bundledTranslations).forEach(locale => cache[locale] = flatten(newOptions.bundledTranslations[locale]));

        const preferredLocale$ = newOptions.getPreferredLocale();
        const dedupedLocale$ = concat(preferredLocale$.take(1), locale$).compose(dropRepeats()).remember();
        const translator$ = makeTranslator$(dedupedLocale$, loader, cache, flatten, fallbackLocale, localeHttp$Cache, newOptions.interpolator, newOptions.cacheTranslations);

        return new TranslatorSource(adapt(translator$));
    };

    return driver;
};

const makeTranslator$ = (
    locale$: Stream<string>,
    loader: jct.TranslationLoader,
    cache: {[x: string]: {}},
    flatten: Function,
    fallbackLocale: string,
    localeHttp$Cache: { [key: string]: Stream<jct.Translations> },
    interpolator: (key: string, values: Object) => string,
    cacheTranslations: boolean
) => {
    const flatTranslationLoader = (locale$: Stream<string>): Stream<jct.Translations> =>
        locale$.compose(loader)
            .replaceError(e => locale$.drop(1).compose(loader))
            .map(({locale, payload}) => ({ locale, payload: flatten(payload)}));

    const cachedLoader = makeCachedLoader(flatTranslationLoader, cache, cacheTranslations);
    const translation$ = locale$.compose(cachedLoader);
    const translator$ = Stream.combine(
        Stream.of(fallbackLocale).compose(cachedLoader),
        translation$
    ).map(translationsFactory(interpolator)).remember();

    translator$.addListener({
        next: () => {},
        error: e => console.error(e),
    });

    return translator$;
};

const makeCachedLoader = (loader: jct.TranslationLoader, cache: {[x: string]: {}}, useCache: boolean = true): jct.TranslationLoader => {
    const inCache = (yes: boolean) => yes
        ? (locale: string) => !!cache[locale]
        : (locale: string) => !cache[locale];

    return (locale$: Stream<string>) => {
        return Stream.merge(
            locale$.filter(inCache(true)).map(locale => ({ locale, payload: cache[locale]})),
            locale$.filter(inCache(false)).compose(loader).map(x => {
                if (useCache) cache[x.locale] = x.payload;
                return x;
            })
        ).remember();
    };
};

const translationsFactory = (interpolate: jct.TranslationInterpolator): jct.TranslatorFactory => ([defaultTranslations, translations]) => ({
    currentLocale: translations.locale,
    t: (key: string, values?: Object) => interpolate(
        translations.payload[key]
            ? translations.payload[key]
            : defaultTranslations.payload[key]
                ? defaultTranslations.payload[key]
                : key
            , values
        )
});

const defaultGetPreferredLocale = () => {
    return Stream.of(getBrowserLanguage() || "en-US");
};

export const doNotGetPreferredLocale = () => {
    return Stream.empty();
};

const getDefaultInterpolator = () => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;

    return (key: string, values: Object) => {
        const placeholders: string[] = [];
        let match: RegExpExecArray | null;
        while (match = regex.exec(key)) {
            placeholders.push(match[1]);
        }

        let s = key;

        for (let i = 0; i < placeholders.length; i++) {
            let value = values[placeholders[i]];
            if (typeof value === "undefined") {
                throw new Error("Translate: missing value for parameter " + placeholders[i]);
            }
            s = s.replace(`{{${placeholders[i]}}}`, value);
        }
        return s;
    };
};

/**
 * The MIT License (MIT)
 *
 * Copyright (c) <2014> <pascal.precht@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const objectFlattener = (delimiter: string) => {
    return function flattenObject (data: Object, path: string[] = [], result: Object = {}) {
        let key: string, keyWithPath: string, obj: string;

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

/**
 * The MIT License (MIT)
 *
 * Copyright (c) <2014> <pascal.precht@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * Try to guess the browser language
 * 
 * @return {string|null}
 */
const getBrowserLanguage = () => {
    const nav: Navigator = window.navigator, browserLanguagePropertyKeys = ["language", "browserLanguage", "systemLanguage", "userLanguage"];
    let i: number, language: string;

    // support for HTML 5.1 "navigator.languages"
    if (Object.prototype.toString.call(nav["languages"] === "[object Array]")) {
      for (i = 0; i < nav["languages"].length; i++) {
        language = nav["languages"][i];
        if (language && language.length) {
          return language;
        }
      }
    }

    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
};
