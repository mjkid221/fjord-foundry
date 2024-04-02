import { EnvironmentType } from "./environment-keys";
import { readEnvironmentVariables } from "./read-environment-variables";

export const NEXT_CLIENT_ENV = () =>
  readEnvironmentVariables(EnvironmentType.Client);

export const NEXT_SERVER_ENV = () =>
  readEnvironmentVariables(EnvironmentType.Server);

// The following ENV Variables are optional in some environment so are not read by the above helpers
export const { VERCEL_URL } = process.env;
