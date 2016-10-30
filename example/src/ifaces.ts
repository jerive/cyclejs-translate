/// <reference path="./ifaces.d.ts" />

import { VNode } from "@cycle/dom";
import { Stream } from "xstream";
import { DOMSource } from "@cycle/dom/xstream-typings";
import { RouterSource } from "./../node_modules/cyclic-router/xstream-typings.d";
import { JeriveCycleTranslate as jct } from "./../../lib/index";
import { Location } from "@cycle/history";

export interface ISources {
  DOM: DOMSource;
  translate: Stream<jct.Translator>;
  router: RouterSource;
  [x: string]: any;
}

export interface ISinks {
  DOM?: Stream<VNode>;
  translate?: Stream<string>;
  router?: Stream<Location| string>;
  [x: string]: any;
}

export interface IComponent{
    (sources?: ISources): ISinks;
}