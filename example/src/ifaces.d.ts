declare module "@cycle/collection" {
    const collection;
    export default collection;
}

interface Event {
    keyCode: number;
}

declare module "*.json" {
    export const json;
}