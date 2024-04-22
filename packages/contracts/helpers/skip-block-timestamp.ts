import { Clock, ProgramTestContext } from "solana-bankrun";

/**
 * Allows skipping timestamps in the test environment.
 * Works only in Bankrun tests.
 */
export const skipBlockTimestamp = async (
  context: ProgramTestContext,
  secondsForward: number
) => {
  const currentClock = await context.banksClient.getClock();
  const newTimestamp = currentClock.unixTimestamp + BigInt(secondsForward);
  context.setClock(
    new Clock(
      currentClock.slot,
      currentClock.epochStartTimestamp,
      currentClock.epoch,
      currentClock.leaderScheduleEpoch,
      newTimestamp
    )
  );
};
