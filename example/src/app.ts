import "./tsxSetup";

import { makeTranslateDriver, makeHTTPDriverLoader } from "./../../lib/index";
import * as en from "./../public/en-US.json";
import * as fr from "./../public/fr-FR.json";

import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";
import { makeRouterDriver } from 'cyclic-router';

import { run } from "@cycle/xstream-run";
import { MainComponent } from "./main.component";
import { createHistory } from "history";
import switchPath from "switch-path";
import { ISources, ISinks } from "./ifaces";

const main = (sources: ISources): ISinks => {
    const match$ = sources.router.define({
        '/': MainComponent,
    });

    const page$ = match$.map(({path, value}): ISinks => {
        return value(Object.assign({}, sources, {
            router: sources.router.path(path)
        }));
    });

    return {
        DOM: page$.map(c => c.DOM).flatten(),
        translate: page$.map(c => c.translate).flatten(),
        router: page$.map(c => c.router).flatten(),
    };
};

const loader = makeHTTPDriverLoader(makeHTTPDriver(), locale => ({
    url: "/public/" + locale + ".json"
}));

run(main, {
    router: makeRouterDriver(createHistory(), switchPath),
    DOM: makeDOMDriver("#app"),
    translate: makeTranslateDriver("en-US", loader, {
        bundledTranslations: {
            "en-US": en,
            "fr-FR": fr
        }
    })
});
