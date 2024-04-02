// eslint-disable-next-line eslint-comments/disable-enable-pair -- needed for comment below
/* eslint-disable camelcase -- not needed in testing files */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers } from "hardhat";

import { HelloWorld } from "../../typechain-types";
import { buildRBACError, generateRole } from "../../utils/roles";

describe("Helper function tests", () => {
  let Deployer: SignerWithAddress;
  let Alice: SignerWithAddress;

  let contract: HelloWorld;
  let aliceContract: HelloWorld;
  let tokenDetails: { name: string; startingPrice: BigNumber };

  const MINTER_ROLE = generateRole("MINTER_ROLE");

  beforeEach(async () => {
    await deployments.fixture("testbed");
    const signers = await ethers.getSigners();
    [Deployer, Alice] = signers;

    contract = await ethers.getContract("HelloWorld");
    aliceContract = contract.connect(Alice);
    tokenDetails = {
      name: "TestToken",
      startingPrice: BigNumber.from(6),
    };
    await contract.grantRole(MINTER_ROLE, Deployer.address);
  });

  it("Should generate a role", async () => {
    expect(await contract.MINTER_ROLE()).to.eq(MINTER_ROLE);
  });

  it("Should check for RBAC Error", async () => {
    await expect(
      aliceContract.addTokenDetails(
        1,
        tokenDetails.name,
        tokenDetails.startingPrice
      )
    ).to.be.revertedWith(buildRBACError(Alice.address, MINTER_ROLE));
  });
});
