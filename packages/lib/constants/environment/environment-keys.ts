/**
 * This file contains a list of **backend** environment variables that are used in the application/s.
 *
 * Make sure that you add the key to the correct list and the correct `dotenv-vault`.
 *
 * @author Aidan Kinzett
 */

const NEXT_CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID",
  "NEXT_PUBLIC_THIRDWEB_CLIENT_ID",
] as const;

const NEXT_SERVER_ENV_KEYS = [
  // "THIRD_PART_SECRET_KEY", // Needed if using the `secretKeyAuth` middleware
  "THIRDWEB_AUTH_PRIVATE_KEY",
] as const;

export enum EnvironmentType {
  Client = "CLIENT",
  Server = "SERVER",
}

/**
 * Object which sets the environment variable keys for each environment type.
 *
 * If we add a new environment type then we need to add it to the `ImptEnvironmentType` enum above, and to the `./variables.ts` file.
 */
export const environmentKeys: Record<EnvironmentType, readonly string[]> = {
  [EnvironmentType.Client]: NEXT_CLIENT_ENV_KEYS,
  [EnvironmentType.Server]: NEXT_SERVER_ENV_KEYS,
};
