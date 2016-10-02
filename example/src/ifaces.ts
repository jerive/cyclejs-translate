import { VNode } from "@cycle/dom";
import { Stream } from "xstream";
import { DOMSource } from "@cycle/dom/xstream-typings";
import { JeriveCycleTranslate as jct } from "./../../lib/index";

export interface ISources {
  DOM: DOMSource;
  translate: Stream<jct.Translator>;
}

export interface ISinks {
  DOM: Stream<VNode>;
  translate?: Stream<string>;
}
