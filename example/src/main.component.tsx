import {ISources, ISinks} from "./ifaces";
import Stream from "xstream";
import { NavigationComponent } from "./navigation.component";
import { LocaleComponent } from "./locale.component";
import Collection from "@cycle/collection";

export const MainComponent = (sources: ISources): ISinks => {
    const nav$ = NavigationComponent(sources);
    const locales = ["en-US", "fr-FR", "es-ES"];
    const addLocale$ = sources.DOM.select("input").events("keydown").filter(e => {
        return e.keyCode === 13;
    }).map(e => [{
        props$: { locale: String(e.srcElement["value"]).trim() }
    }]);

    const localeCollection$ = Collection(LocaleComponent, sources, Stream.merge(
        Stream.of(locales.map(locale => ({props$: {locale}}))),
        addLocale$
    ), x => x.remove$);
    const localeCollectionDom$ = Collection.pluck(localeCollection$, x => x.DOM);

    return {
        translate: Collection.merge(localeCollection$, (x: ISinks) => x.translate),
        DOM: Stream.combine(nav$.DOM, localeCollectionDom$).map(([nav, list]) => <div>
            {nav}
            <div classNames="container">
                {list}
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