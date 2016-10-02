import { ISources, ISinks } from "./ifaces";

export const NavigationComponent = (sources: ISources): ISinks => {
    const locales = ["en-US", "fr-FR", "es-ES"];
    const locale$ = sources.DOM.select("[locale]").events("click").map(e => {
        e.preventDefault();
        return e.srcElement.attributes.getNamedItem("locale").nodeValue;
    });

    return {
        translate: locale$,
        DOM: sources.translate.map(t => (
            <nav classNames="navigation navbar navbar-fixed-top navbar-dark bg-inverse">
                <a classNames="navbar-brand">{t("CycleJs")}</a>
                <ul classNames="nav navbar-nav pull-xs-right">
                    {locales.map(locale =>
                        <li classNames="nav-item" class={{ active: locale === t.$currentLocale }}>
                            <a href classNames="nav-link locale" attrs={{locale}}>{t("Language." + locale)}</a>
                        </li>
                    )}
                </ul>
            </nav>
        ))
    };
};
