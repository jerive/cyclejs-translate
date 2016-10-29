declare module "@cycle/collection" {
    const collection;
    export default collection;
}

declare module "switch-path" {
    const switchPath;
    export default switchPath;
}

declare module "history" {
    export const createHistory: Function;
} 

interface Event {
    keyCode: number;
}

declare module "*.json" {
    export const json;
}