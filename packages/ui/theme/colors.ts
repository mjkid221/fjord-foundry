import { ColorHues } from "@chakra-ui/react";

/**
 * Custom colors for the Chakra UI theme.
 * These should be formatted as per the example `customColor` below, with all variants, 50, 100...900 included.
 *
 * @see https://themera.vercel.app/ for a handy tool to generate chakra colour themes
 */
export const colors: Record<string, ColorHues | string> = {
  customColor: {
    50: "#F3F6EF",
    100: "#DDE5D1",
    200: "#C8D5B4",
    300: "#B2C596",
    400: "#9DB479",
    500: "#5F7340",
    600: "#6C8349",
    700: "#516237",
    800: "#364224",
    900: "#1B2112",
  },
};
