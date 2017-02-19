/// <reference path="./ifaces.d.ts" />

import { VNode } from "@cycle/dom";
import { Stream } from "xstream";
import { DOMSource } from "@cycle/dom";
import { Router } from "./router.hoc";

import { JeriveCycleTranslate as jct } from "./../../lib/index";

export interface ISources {
  DOM: DOMSource;
  translate: Stream<jct.Translator>;
  router: Router;
  [x: string]: any;
}

export interface ISinks {
  DOM?: Stream<VNode>;
  translate?: Stream<string>;
  router?: Stream<string>;
  [x: string]: any;
}

export interface IComponent{
    (sources?: ISources): ISinks;
}