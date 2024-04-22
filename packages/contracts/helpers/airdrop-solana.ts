import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const airdropSolana = async (
  connection: Connection,
  amount: number,
  to: string
) => {
  const airdropSignature = await connection.requestAirdrop(
    new PublicKey(to),
    amount * LAMPORTS_PER_SOL
  );

  const latestBlockhash = await connection.getLatestBlockhash();
  return connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: airdropSignature,
  });
};
