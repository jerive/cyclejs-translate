import xs from "xstream";
import { DriverFunction } from "@cycle/run";
import { IComponent, ISources, ISinks } from "./ifaces";

export interface Router {
    with: (sources: ISources, routes: { [key: string]: IComponent}) => xs<ISinks>;
};

export const RouterSource = (path$: xs<string>): Router => {
    return {
        with: (sources: ISources, routes: {[key: string]: any}) => {
            return path$.startWith("/")
                .filter(x => !!routes[x])
                .map(x => routes[x](sources))
                .remember();
        }
    };
};

export const makeRouterDriver = (): DriverFunction => {
    return (path$: xs<string>) => RouterSource(path$);
};
