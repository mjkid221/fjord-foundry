module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@scope/ui", "@scope/lib", "@scope/contracts"],
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    // You can get this from the Organization settings page in Sentry
    org: "UPDATE_THIS_TO_THE_ORGANIZATION_SLUG",
    // You can get this from the Project settings page in Sentry
    project: "UPDATE_THIS_TO_THE_PROJECT_NAME",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    widenClientFileUpload: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
