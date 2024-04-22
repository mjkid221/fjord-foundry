import * as fs from "fs";
import * as path from "path";

/**
 * Copies over the Anchor.toml file to the tests/bank-run-tests/ directory.
 * This is required to run the bank run client tests.
 */
const copyAnchorTomlFile = () => {
  const sourceFilePath = path.resolve(__dirname, "../Anchor.toml");
  const destinationFilePath = path.resolve(
    __dirname,
    "../tests/bank-run-tests/Anchor.toml"
  );

  fs.copyFileSync(sourceFilePath, destinationFilePath);
};

copyAnchorTomlFile();
