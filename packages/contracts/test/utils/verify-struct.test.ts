// eslint-disable-next-line eslint-comments/disable-enable-pair -- needed for comment below
/* eslint-disable camelcase -- not needed in testing files */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { deployments, ethers } from "hardhat";

import { HelloWorld } from "../../typechain-types";
import { verifyStruct, generateRole } from "../../utils";

describe("Helper function tests", () => {
  let Deployer: SignerWithAddress;
  let contract: HelloWorld;
  let tokenDetails: { name: string; startingPrice: BigNumber };

  const MINTER_ROLE = generateRole("MINTER_ROLE");

  beforeEach(async () => {
    await deployments.fixture("testbed");
    contract = await ethers.getContract("HelloWorld");
    const signers = await ethers.getSigners();
    [Deployer] = signers;

    tokenDetails = {
      name: "TestToken",
      startingPrice: BigNumber.from(6),
    };

    await contract.grantRole(MINTER_ROLE, Deployer.address);
  });

  it("Should verify token details struct", async () => {
    await contract.addTokenDetails(
      1,
      tokenDetails.name,
      tokenDetails.startingPrice
    );
    verifyStruct(await contract.tokenDetails(1), tokenDetails);
  });
});
