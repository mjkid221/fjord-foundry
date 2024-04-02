module.exports = {
  extends: "eslint-config-labrys",
  parser: "@typescript-eslint/parser",
  rules: {
    "eslint-comments/disable-enable-pair": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        ignoreRestSiblings: true,
      },
    ],
    "import/no-extraneous-dependencies": [
      "off",
      {
        devDependencies: false,
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
  },
  overrides: [
    {
      files: ["packages/contracts/tests/**/*.ts"],
      rules: {
        camelcase: "off",
      },
    },
  ],
};
