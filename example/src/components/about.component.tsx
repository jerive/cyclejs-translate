import {IComponent} from "./../ifaces";

export const AboutComponent: IComponent = ({ translate }) => ({
    DOM: translate.go("About.").map(({t}) => <div classNames="container">{t("Text")}</div>)
});
