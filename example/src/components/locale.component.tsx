import {IComponent} from "./../ifaces";
import sampleCombine from "xstream/extra/sampleCombine";

export const LocaleComponent: IComponent = ({DOM, translate, props$}) => {
    const locale = props$.locale;
    const tr = translate.go("Language.");

    return {
        translate: DOM.select("[locale]").events("click").mapTo(locale),
        DOM: tr.map(({t, currentLocale}) =>
            <div classNames="row">
                <div classNames="col-xl-5">
                    <span classNames="btn btn-link btn-sm remove" class={{ disabled: locale === currentLocale }}>
                        <i classNames="fa fa-times" aria-hidden="true"></i>
                    </span>&nbsp;
                    <span classNames="btn btn-secondary btn-sm locale" attrs={{locale}} class={{ "btn-success": locale === currentLocale }}>
                        {t(locale)}
                    </span>
                </div>
            </div>
        ),
        remove$: DOM.select(".remove").events("click").compose(sampleCombine(tr))
            .filter(([, {currentLocale}]) => currentLocale !== locale).mapTo(null)
    };
};
