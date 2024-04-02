/* eslint-disable no-console -- not neeeded */
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("upgrade-contract")
  .addParam("address", "Contract's proxy address")
  .addParam("name", "Contract name")
  .setAction(async (args, hre) => {
    await upgradeContract(hre, args.address, args.name);
  });

const upgradeContract = async (
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  contractName: string
) => {
  try {
    const { getNamedAccounts } = hre;

    const { deployer } = await getNamedAccounts();
    const contractFactory = await hre.ethers.getContractFactory(
      contractName,
      deployer
    );

    const carbonCreditNFT = await hre.upgrades.upgradeProxy(
      contractAddress,
      contractFactory
    );

    await carbonCreditNFT.deployed();

    console.log("Contract upgraded at", carbonCreditNFT.address);
  } catch (e) {
    console.error(e);
  }
};
