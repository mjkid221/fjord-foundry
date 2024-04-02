import uniq from "lodash/uniq";

import { environmentKeys } from "./environment-keys";

/**
 * Check that there are no keys that are in multiple lists.
 *
 * This should be imported in the `./index.ts` file so that it is executed when the application starts up.
 * This function is self-executing and will automatically run on import.
 */
(() => {
  // list of all keys
  const allKeys = Object.values(environmentKeys).flat();

  // unique list of all keys
  const uniqueKeys = new Set(allKeys);

  // if the sizes don't match, throw an error
  if (allKeys.length !== uniqueKeys.size) {
    // get duplicate keys
    const duplicateKeys = uniq(
      // filter `allKeys` to keep keys that are in the `allKeys` array more than once
      allKeys.filter((key) => allKeys.filter((k) => k === key).length > 1)
    );

    throw new Error(
      `
        There are duplicate keys in the environment variables list. 
        
        Please fix in the ./lib/environment/keys.ts file, you probably need to move a key from one of the app specific
        lists to the SHARED list.

        Duplicate keys: ${duplicateKeys.toString()}
        `
    );
  }
})();
