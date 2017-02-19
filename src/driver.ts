import Stream from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import concat from "xstream/extra/concat";
import {JeriveCycleTranslate as jct} from "./interfaces";
import {adapt} from "@cycle/run/lib/adapt";

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
            interpolator: getDefaultInterpolator(),
            cacheTranslations: true,
            getPreferredLocale: defaultGetPreferredLocale,
            bundledTranslations: {}
        }, options);

        const cache = {};
        const flatten = objectFlattener(options.flattenerDelimiter);
        const preferredLocale$ = options.getPreferredLocale();
        const dedupedLocale$ = concat(preferredLocale$.take(1), locale$).compose(dropRepeats()).remember();
        const flatTranslationLoader = (locale$: Stream<string>): Stream<jct.Translations> =>
            locale$.compose(translationLoader)
                .replaceError(e => dedupedLocale$.drop(1).compose(translationLoader))
                .map(({locale, payload}) => ({ locale, payload: flatten(payload)}));

        Object.keys(options.bundledTranslations).forEach(locale => cache[locale] = flatten(options.bundledTranslations[locale]));

        const cachedTranslationLoader = makeCachedLoader(flatTranslationLoader, cache, options.cacheTranslations);
        const translation$ = dedupedLocale$.compose(cachedTranslationLoader);
        const translator$ = Stream.combine(
            Stream.of(fallbackLocale).compose(cachedTranslationLoader),
            translation$
        ).map(translationsFactory(options.interpolator)).remember();

        translator$.addListener({
            next: () => {},
            error: e => console.error(e),
        });

        return adapt(translator$);
    };

    return driver;
};

const makeCachedLoader = (loader: jct.TranslationLoader, cache: {[x: string]: Object}, useCache: boolean = true): jct.TranslationLoader => {
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
        let match: RegExpExecArray;
        while (match = regex.exec(key)) {
            placeholders.push(match[1]);
        }

        let s = key;

        for (let i = 0; i < placeholders.length; i++) {
            let value = values[placeholders[i]];
            if (typeof value === "undefined") {
                throw new Error("Translate: missing value for parameter " + placeholders[i]);
            }
            s = s.replace("{{" + placeholders[i] + "}}", value);
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
