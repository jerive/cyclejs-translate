import "./tsxSetup";

import { run } from "@cycle/run";
import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";

import Stream from "xstream";

// Routing
import { createBrowserHistory } from "history";
import { makeRouterDriver } from "cyclic-router";
import switchPath from  "switch-path";

import { makeTranslateDriver, makeHTTPDriverLoader } from "./../../lib/index";
import { ISources, ISinks } from "./ifaces";
import { MainComponent } from "./components/main.component";
import { AboutComponent } from "./components/about.component";
import { NavigationComponent } from "./components/navigation.component";

const ff = <K extends keyof ISinks>(driver: K) => (s: Stream<ISinks>) => s
    .map((x) => x[driver])
    .filter(x => typeof x !== "undefined")
    .flatten()
;

const main = (sources: ISources) => {
    const { DOM: navDOM$, router: navRouter } = NavigationComponent(sources);
    const match$ = sources.router.define({
        "/": MainComponent,
        "/about": AboutComponent
    });

    const page$ = match$.map(({path, value}) => {
        return value(Object.assign({}, sources, {
            router: sources.router.path(path)
        }));
    });

    return {
        DOM: Stream.combine(navDOM$, ff("DOM")(page$)).map(([nav, page]) => (
            <div>{nav}{page}</div>
        )),
        translate: ff("translate")(page$),
        router: Stream.merge(navRouter, ff("router")(page$))
    };
};

import * as en from "./../public/en-US.json";
import * as fr from "./../public/fr-FR.json";

run(main, {
    router: makeRouterDriver(createBrowserHistory(), switchPath),
    DOM: makeDOMDriver("#app"),
    translate: makeTranslateDriver(
        "en-US",
        makeHTTPDriverLoader(
            makeHTTPDriver(),
            locale => ({ url: "/public/" + locale + ".json" })
        ),
        {
            bundledTranslations: {
                "en-US": en,
                "fr-FR": fr
            }
        })
});
