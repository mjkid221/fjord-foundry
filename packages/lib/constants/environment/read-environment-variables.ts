import { environmentKeys, EnvironmentType } from "./environment-keys";
import { integrationTestEnvironment } from "./integration-test-environment";

/**
 * This method is to help standardize environment variable reading and to provide type-safety. This will be execute at runtime for all the environment variables used in the application. This ensures that all required environment variables exist otherwise when the application starts up it will crash.
 *
 * @param variables An array of environment variables to be read from process.env
 * @returns Returns the environment variable values
 */
export const readEnvironmentVariables = (environment: EnvironmentType) => {
  if (!Object.keys(process.env).length) {
    return {}; // Loading environment
  }

  // Return hardcoded values for integration test mode
  if (process.env.INTEGRATION_TEST_MODE) {
    return integrationTestEnvironment;
  }

  // get the keys for the environment
  const envKeys = environmentKeys[environment];

  // instantiate object to contain valid variables
  // this is typed to ensure that APP_NAME is always included, and has the correct type
  const variablesToReturn: Record<(typeof envKeys)[number], string> = {};

  // instantiate array to contain missing variable keys
  const missingVariableKeys: string[] = [];

  // for each key in the array of keys
  envKeys.forEach((variableName: (typeof envKeys)[number]) => {
    // get the value of the environment variable
    const environmentVariable = process.env[variableName];

    // if the environment variable is not set then add it to the missing variables array
    if (!environmentVariable) {
      missingVariableKeys.push(variableName);
      return;
    }

    // otherwise add it to the object of valid variables
    variablesToReturn[variableName] = environmentVariable;
  });

  // if there are missing variables then throw an error
  if (missingVariableKeys.length > 0) {
    throw new Error(
      `Missing the following environment variables from the ${environment} environment: ${missingVariableKeys.toString()}. You may need to pull from the dotenv-vault.`
    );
  }

  return variablesToReturn;
};
