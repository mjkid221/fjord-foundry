import { Poppins } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const fonts = {
  heading: poppins.style.fontFamily,
  body: poppins.style.fontFamily,
};
