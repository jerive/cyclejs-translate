declare module "cyclejs-auth0" {
    type Component<So, Si> = (sources: So, ...rest: Array<any>) => Si;
    export function makeAuth0Driver(token: string, domain: string): Function;
    export function protect<So, Si>(component: Component<So, Si>): Component<So, Si>;
}

declare module "snabbdom-jsx" {
    export const html;
}

declare var JSX;