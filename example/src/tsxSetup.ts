/// <reference path="./tsx.d.ts" />

import { html } from "snabbdom-jsx";
(<any> window).JSX = {createElement: html};
