/// <reference path="./ifaces.d.ts" />

import { VNode, DOMSource } from "@cycle/dom";
import { Stream } from "xstream";
import { RouterSource } from "cyclic-router/lib/RouterSource.d";

import { JeriveCycleTranslate as jct } from "./../../lib/index";

export interface ISources {
  DOM: DOMSource;
  translate: jct.TranslatorSource;
  router: RouterSource;
  [x: string]: any;
}

export interface ISinks {
  DOM?: Stream<VNode>;
  translate?: Stream<string>;
  router?: Stream<string>;
}

export interface IComponent{
    (sources?: ISources): ISinks;
}