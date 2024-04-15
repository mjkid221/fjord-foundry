import { addHours } from "date-fns";

export const generateTimestamp = (hoursToAdd = 0) =>
  addHours(new Date(), hoursToAdd).getTime() / 1000;
