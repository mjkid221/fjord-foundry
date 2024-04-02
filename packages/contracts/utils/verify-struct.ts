import { expect } from "chai";

/**
 * Verify that a struct returned from a contract matches the expected result. This function also supports nested structs and array types
 *
 * @param result The result returned from the contract
 * @param expectedResult The expected resulting struct
 */
export const verifyStruct = (result: Record<string, any>, expectedResult: Record<string, any>) => {
  Object.keys(expectedResult).forEach((key: string) => {
    const expectedValue = expectedResult[key];
    const actualValue = result[key];

    if (typeof expectedValue === "object" && expectedValue !== null) {
      verifyStruct(actualValue, expectedValue);
    } else {
      expect(result[key]).to.deep.equal(expectedResult[key]);
    }
  });
};