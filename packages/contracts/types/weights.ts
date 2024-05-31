import BN from "bn.js";

export type ComputedReservesAndWeights = {
  assetReserve: BN;
  shareReserve: BN;
  assetWeight: BN;
  shareWeight: BN;
};
