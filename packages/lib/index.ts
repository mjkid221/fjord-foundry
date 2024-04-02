/**
 * Be careful when barrelling certain folder from the lib package.
 *
 * If you barrel folders containing files which use mongoose models you will likely receive strange errors in you Next.js client environment
 * For this reason, the middleware and handlers folders exist to create API handlers and API middleware which can use mongoose models without breaking your Next.js app
 */
export * from "./api";
export * from "./constants";
export * from "./database";
export * from "./query";
export * from "./types";
export * from "./services";
export * from "./utils";
