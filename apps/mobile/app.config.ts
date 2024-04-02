import { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Use environment variables to extend the config from `app.json` to add
 * bundle specific configuration.
 *
 * Environment variables are set in the `eas.json` file.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  // get the env variables set in eas.json
  const { bundleIdentifier, icon, splashImage } = process.env;

  // add them into the config
  return {
    ...config,
    name: config.name!, // we know this is set in the app.json file
    slug: config.slug!, // we know this is set in the app.json file
    ios: {
      ...config.ios,
      bundleIdentifier: bundleIdentifier!,
    },
    android: {
      ...config.android,
      package: bundleIdentifier!,
    },
    icon,
    splash: {
      ...config.splash,
      image: splashImage!,
    },
    extra: {
      storybookEnabled: process.env.STORYBOOK_ENABLED,
    },
  };
};
