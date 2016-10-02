/// <reference path="./main.d.ts" />
import "./tsxSetup";

import { makeTranslateDriver, makeHTTPDriverLoader } from "./../../lib/index";
import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";
import { run } from "@cycle/xstream-run";
import { NavigationComponent } from "./navigation.component";

const main = NavigationComponent;
const loader = makeHTTPDriverLoader(makeHTTPDriver(), locale => ({
    url: "/public/" + locale + ".json"
}));

run(main, {
  DOM: makeDOMDriver("#app"),
  translate: makeTranslateDriver("en-US", loader)
});
