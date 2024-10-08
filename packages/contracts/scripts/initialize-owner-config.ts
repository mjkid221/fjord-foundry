import { promises as fs } from "fs";

import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { FjordLbpStruct } from "../helpers";
import { IDL, type FjordLbp } from "../types";

// TODO: Replace this with the program ID of the deployed program.
const programId = new PublicKey("7UTvQUzE1iThaXhXDg1FsVoqcv3MBAgwUCW7PEKzNbPH");

// TODO: Replace this with the network you are targeting.
const network: "mainnet-beta" | "devnet" = "mainnet-beta";

// !Note: In order to run this script, the keypair must be the upgrade authority (the one that deployed the program).
const keypairPath = `./deployment-keypair/${
  {
    "mainnet-beta": "production",
    devnet: "development",
  }[network]
}/id.json`;

/**
 * TODO: Please replace all the values below.
 */
const ownerConfig: FjordLbpStruct<"initializeOwnerConfig"> = {
  /** Owner address * */
  ownerKey: new PublicKey(
    /** Replace key */ "AMT6SgVe6qyyeapGBy5bCJaiqjjrDTVEU9zY8VfZSKjo"
  ),
  /** Recipient that receives all swap fees * */
  swapFeeRecipient: new PublicKey(
    /** Replace key */ "AMT6SgVe6qyyeapGBy5bCJaiqjjrDTVEU9zY8VfZSKjo"
  ),
  /** Recipients that receives platform fee * */
  feeRecipients: [
    new PublicKey("AMT6SgVe6qyyeapGBy5bCJaiqjjrDTVEU9zY8VfZSKjo"),
    new PublicKey("AMT6SgVe6qyyeapGBy5bCJaiqjjrDTVEU9zY8VfZSKjo"),
  ],
  /** The fee % ratio that each `feeRecipients` receive. It must add up to 100% (10000) * */
  feePercentages: [5000, 5000],
  /**
   * The platform fee denoted in basis points (1% = 100 basis points)
   * @dev Must be lower than 10000 (100%)
   */
  platformFee: 100,
  /**
   * The referral fee denoted in basis points (1% = 100 basis points)
   * @dev Must be lower than 10000 (100%)
   */
  referralFee: 100,
  /**
   * The swap fee denoted in basis points (1% = 100 basis points)
   * @dev Must be lower than 10000 (100%)
   */
  swapFee: 100,
};

/**
 * Initializes the owner config. This should be ran after deploying the fjord lbp program.
 * This script can only be ran once, by the upgrade authority (deployer).
 */
async function main() {
  const secretKey = JSON.parse(
    await fs.readFile(keypairPath, { encoding: "utf8" })
  );
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  const connection = new Connection(clusterApiUrl(network));
  const provider = new AnchorProvider(connection, new Wallet(keypair), {});

  const program = new Program<FjordLbp>(IDL, programId, provider);
  const params = Object.values(ownerConfig) as any;

  const programDataAddress = findProgramAddressSync(
    [program.programId.toBytes()],
    new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  )[0];

  console.log("Initializing owner config...");

  const tx = await program.methods
    .initializeOwnerConfig(...params)
    .accounts({
      program: programId,
      programData: programDataAddress,
    })
    .rpc();

  console.log("Owner config initialized with tx: ", tx.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
