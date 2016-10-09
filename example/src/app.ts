import "./tsxSetup";

import { makeTranslateDriver, makeHTTPDriverLoader } from "./../../lib/index";
import * as en from "./../public/en-US.json";
import * as fr from "./../public/fr-FR.json";

import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";
import { run } from "@cycle/xstream-run";
import { MainComponent } from "./main.component";

const main = MainComponent;
const loader = makeHTTPDriverLoader(makeHTTPDriver(), locale => ({
    url: "/public/" + locale + ".json"
}));

run(main, {
    DOM: makeDOMDriver("#app"),
    translate: makeTranslateDriver("en-US", loader, {
        bundledTranslations: {
            "en-US": en,
            "fr-FR": fr
        }
    })
});
