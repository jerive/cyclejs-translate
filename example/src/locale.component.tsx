import {ISources, ISinks} from "./ifaces";
import sampleCombine from "xstream/extra/sampleCombine";

export const LocaleComponent = ({DOM, translate, props$}: ISources): ISinks => {
    const locale = props$.locale;

    return {
        translate: DOM.select("[locale]").events("click").mapTo(locale),
        DOM: translate.map(t => {
            const isCurrentLocale = locale === t.$currentLocale;

            return (
            <div classNames="row">
                <div classNames="col-xl-5">
                    <span classNames="btn btn-link btn-sm remove" class={{ disabled: isCurrentLocale }}><i classNames="fa fa-times" aria-hidden="true"></i></span>
                    &nbsp;<span classNames="btn btn-secondary btn-sm locale" attrs={{locale}} class={{ "btn-success": isCurrentLocale }}>{t("Language." + locale)}</span>
                </div>
            </div>
        )}),
        remove$: DOM.select(".remove").events("click").compose(sampleCombine(translate))
            .filter(([, t]) => t.$currentLocale !== locale).mapTo(null)
    };
};
