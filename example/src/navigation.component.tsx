import { ISources, ISinks } from "./ifaces";

export const NavigationComponent = (sources: ISources): ISinks => {
    return {
        DOM: sources.translate.map(t => (
            <nav classNames="navigation navbar navbar-dark bg-inverse">
                <a classNames="navbar-brand">{t("CycleJs")}</a>
            </nav>
        ))
    };
};
