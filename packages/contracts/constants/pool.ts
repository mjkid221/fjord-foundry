import { BN } from "@coral-xyz/anchor";
import { hoursToSeconds } from "date-fns";

const TIME_OFFSET = 1_000;
const ONE_DAY_SECONDS = hoursToSeconds(24);
const PERCENTAGE_BASIS_POINTS = 100;

const DEFAULT_SALE_START_TIME_BN = new BN(
  new Date().getTime() / 1000 + TIME_OFFSET
);

const DEFAULT_SALE_END_TIME_BN = DEFAULT_SALE_START_TIME_BN.add(
  new BN(ONE_DAY_SECONDS)
);

const DEFAULT_VESTING_CLIFF_BN = DEFAULT_SALE_END_TIME_BN.add(
  new BN(ONE_DAY_SECONDS)
);

const DEFAULT_VESTING_END_BN = DEFAULT_VESTING_CLIFF_BN.add(
  new BN(ONE_DAY_SECONDS)
);

/**
 * !NOTE For testing
 */
const testMerkleWhitelistedAddresses = [
  "NMC4r582ErAaCrFFJZQ9PhkxtPmFpWFMkoZEEQT1mvk",
  "HirkJEZy8Q3zdUuN55Ci8Gz71Ggb46wpqmodqz1He2jF",
  "DP7KM2Y4wAGU3RLLVWZ7g1N52aafNRnLvSYDrb6E9siL",
  "3hZu5KH5CSAtnfERxbKnFMTRy1VwPkyEphkm2PRfZjTB",
];

export {
  TIME_OFFSET,
  ONE_DAY_SECONDS,
  PERCENTAGE_BASIS_POINTS,
  DEFAULT_SALE_START_TIME_BN,
  DEFAULT_SALE_END_TIME_BN,
  DEFAULT_VESTING_CLIFF_BN,
  DEFAULT_VESTING_END_BN,
  testMerkleWhitelistedAddresses,
};
