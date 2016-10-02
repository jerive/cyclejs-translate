import Stream from "xstream";
import {JeriveCycleTranslate as jct} from "./../interfaces";

export function makeMemoryLoader(translations: Object) {
    return (locale$: Stream<string>): Stream<jct.Translations> => {
        return locale$.map(locale => ({ locale, payload: translations[locale]}));
    };
};