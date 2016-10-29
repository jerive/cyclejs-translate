import {ISources, ISinks} from "./ifaces";
import xs from "xstream";
import { NavigationComponent } from "./navigation.component";
import { LocaleComponent } from "./locale.component";
import Coll from "@cycle/collection";

const locales = ["en-US", "fr-FR", "es-ES"];

export const MainComponent = (sources: ISources): ISinks => {
    const { DOM: navigationDom$ } = NavigationComponent(sources);
    const addLocale$ = sources.DOM.select("input").events("keydown").filter(e => {
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
        router: xs.of(),
        translate: Coll.merge(localeCollection$, (x: ISinks) => x.translate),
        DOM: xs.combine(navigationDom$, localeCollectionDom$).map(([nav, localeList]) => <div>
            {nav}
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