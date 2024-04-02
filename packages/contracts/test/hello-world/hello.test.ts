/* eslint-disable camelcase */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { HelloWorld } from "../../typechain-types";

describe("HelloWorld hello tests", () => {
  let Deployer: SignerWithAddress;
  let Alice: SignerWithAddress;
  let Bob: SignerWithAddress;
  let Carol: SignerWithAddress;

  let HelloWorld_Deployer: HelloWorld;
  let HelloWorld_Alice: HelloWorld;
  let HelloWorld_Bob: HelloWorld;
  let HelloWorld_Carol: HelloWorld;

  beforeEach(async () => {
    await deployments.fixture("testbed");
    const signers = await ethers.getSigners();
    [Deployer, Alice, Bob, Carol] = signers;

    HelloWorld_Deployer = await ethers.getContract("HelloWorld", Deployer);
    HelloWorld_Alice = HelloWorld_Deployer.connect(Alice);
    HelloWorld_Bob = HelloWorld_Deployer.connect(Bob);
    HelloWorld_Carol = HelloWorld_Deployer.connect(Carol);
  });

  it("Should return hello world!", async () => {
    expect(await HelloWorld_Deployer.hello()).eq("hello world!");
  });
});
