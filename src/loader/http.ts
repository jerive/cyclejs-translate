import { RequestOptions, HTTPSource, Response } from "@cycle/http";
import XStreamAdapter from "@cycle/xstream-adapter";
import Stream from "xstream";
import {JeriveCycleTranslate as jct} from "./../interfaces";

/**
 * @param {Function} httpDriver - The HTTP Driver (usually the result of makeHTTPDriver())
 * @param {(locale: string) => RequestOptions} localeToRequestMapper - A mapper from a locale to a Superagent request
 * @return {(stream: Stream<string>) => Stream<Translations>} An operator that transforms
 * a stream of locales to a stream of Translations object.
 */
export function makeHTTPDriverLoader(httpDriver: Function, localeToRequestMapper: ((locale: string) => RequestOptions)) {
    return (locale$: Stream<string>): Stream<jct.Translations> => {
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