import { IComponent } from "./../ifaces";
import { LocaleComponent } from "./locale.component";
import Coll from "@cycle/collection";
import xs from "xstream";

const locales = ["en-US", "fr-FR", "es-ES"];

export const MainComponent: IComponent = sources => {
    const addLocale$ = sources.DOM.select("input").events("keydown").filter((e: KeyboardEvent) => {
        return e.keyCode === 13;
    }).map(e => [{
        props$: { locale: String(e.srcElement["value"]).trim() }
    }]);

    const localeCollection$ = Coll(LocaleComponent, sources, xs.merge(
        xs.of(locales.map(locale => ({ props$: {locale} }))),
        addLocale$
    ), x => x.remove$);
    const localeCollectionDom$ = Coll.pluck(localeCollection$, x => x.DOM);

    return {
        translate: Coll.merge(localeCollection$, x => x.translate),
        DOM: localeCollectionDom$.map(localeList => <div>
            <div classNames="container">
                {localeList}
                <hr/>
                <div classNames="row">
                    <span classNames="col-xl-5 form-inline">
                        <input type="text" classNames="form-control" attrs={{placeholder: "locale"}} />
                    </span>
                </div>
            </div>
        </div>)
    };
};