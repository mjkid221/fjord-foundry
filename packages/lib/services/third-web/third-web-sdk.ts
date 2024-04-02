import { ChainOrRpcUrl, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Signer } from "ethers";

import { NEXT_CLIENT_ENV, NEXT_SERVER_ENV } from "../..";

const { NEXT_PUBLIC_THIRDWEB_CLIENT_ID } = NEXT_CLIENT_ENV();

const { THIRDWEB_SECRET_KEY, THIRDWEB_AUTH_PRIVATE_KEY } = NEXT_SERVER_ENV();

export const clientThirdWebSDK = (signer: Signer, network: ChainOrRpcUrl) =>
  ThirdwebSDK.fromSigner(signer, network, {
    clientId: NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  });

export const serverThirdWebSDK = (network: ChainOrRpcUrl) =>
  ThirdwebSDK.fromPrivateKey(THIRDWEB_AUTH_PRIVATE_KEY, network, {
    secretKey: THIRDWEB_SECRET_KEY,
  });
