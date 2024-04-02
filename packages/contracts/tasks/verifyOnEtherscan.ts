import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("verify-upgradeable-contract")
  .addParam("address", "Contract's proxy address")
  .setAction(async (args, hre) => {
    const implementationAddress = await getImplementationAddress(
      hre.ethers.provider,
      args.address
    );
    await verifyOnEtherscan(hre, implementationAddress, []);
  });

const verifyOnEtherscan = async (
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  constructorArguments = []
) => {
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments,
    });
  } catch (e) {
    // eslint-disable-next-line no-console -- not needed
    console.error(e);
  }
};
