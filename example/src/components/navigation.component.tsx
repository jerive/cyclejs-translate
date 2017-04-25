import { IComponent } from "./../ifaces";

export const NavigationComponent: IComponent = ({ DOM, translate}) => ({
    router: DOM.select("a").events("click").map(e => {
        e.preventDefault();
        return (e.currentTarget as HTMLAnchorElement).pathname;
    }),
    DOM: translate.go("Menu.").map(({t}) => (
        <nav classNames="navigation navbar navbar-dark bg-inverse">
            <a classNames="navbar-brand" href="/">{t("CycleJs")}</a>
            <ul classNames="nav navbar-nav pull-right">
                <li classNames="nav-item">
                    <a classNames="nav-link" href="/about">{t("About")}</a>
                </li>
            </ul>
        </nav>
    ))
});
