import {IComponent} from "./../ifaces";

export const AboutComponent: IComponent = ({ translate }) => ({
    DOM: translate.map(t => <div classNames="container">{t("About.Text")}</div>)
});
