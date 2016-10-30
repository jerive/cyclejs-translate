import "./tsxSetup";

import { run } from "@cycle/xstream-run";
import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";
import { makeRouterDriver } from "cyclic-router";
import { createHistory } from "history";
import switchPath from "switch-path";
import xs from "xstream";

import { makeTranslateDriver, makeHTTPDriverLoader } from "./../../lib/index";

import { IComponent } from "./ifaces";
import { MainComponent } from "./components/main.component";
import { AboutComponent } from "./components/about.component";
import { NavigationComponent } from "./components/navigation.component";

const Route = (sources, routes, routerKey = "router") => sources[routerKey].define(routes).debug('hey').map(({path, value}) => {
    return value(Object.assign({}, sources, {
        router: sources[routerKey].path(path)
    }));
});

const main: IComponent = sources => {
    const { DOM: navDOM, router: navRouter} = NavigationComponent(sources);
    const page$ = Route(sources, {
        "/": MainComponent,
        "/about": AboutComponent
    });

    return {
        DOM: xs.combine(navDOM, page$.map(x => x.DOM).flatten()).map(([nav, page]) => (
            <div>{nav}{page}</div>
        )),
        translate: page$.map(c => c.translate).filter(x => !!x).flatten(),
        router: xs.merge(navRouter, page$.map(c => c.router).filter(x => !!x).flatten())
    };
};

const loader = makeHTTPDriverLoader(makeHTTPDriver(), locale => ({
    url: "/public/" + locale + ".json"
}));

import * as en from "./../public/en-US.json";
import * as fr from "./../public/fr-FR.json";

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
