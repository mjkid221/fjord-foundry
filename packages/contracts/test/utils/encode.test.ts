// eslint-disable-next-line eslint-comments/disable-enable-pair -- needed for comment below
/* eslint-disable camelcase -- not needed in testing files */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers } from "hardhat";

import { createMessageHash, arrayifyHash } from "../../utils/encode";

describe("Helper function tests", () => {
  let Deployer: SignerWithAddress;
  let data: { types: string[]; values: any[] };

  beforeEach(async () => {
    await deployments.fixture("testbed");
    const signers = await ethers.getSigners();
    [Deployer] = signers;
    data = {
      types: ["address", "bool", "uint256"],
      values: [Deployer.address, true, BigNumber.from(4)],
    };
  });

  it("Should create a valid message hash", async () => {
    const hash = createMessageHash(data);
    expect(hash).to.eq(
      "0xac3e416ccbae4e3f68359342c75f168a4b36f0db85eb3b813ba6738603dc5b07"
    );
  });

  it("Should create an arrayified signature", async () => {
    // Encode an array of values
    const encoded = arrayifyHash(data);
    // Signature should be 32 bytes long
    expect(encoded.byteLength).to.eq(32);
  });
});
