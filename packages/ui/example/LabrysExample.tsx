import { chakra, Flex, Text } from "@chakra-ui/react";
import Image from "next/image";

/**
 * These are the props for this component. They should be typed, documented and exported so that we can see how they are used in the example.
 */
export interface LabrysExampleProps {
  /**
   * This is a prop that is used to show how to document a prop.
   */
  title: string;
  /**
   * The color of the component
   */
  color: string;
}

export const LabrysExample = ({ title, color }: LabrysExampleProps) => (
  <StyledContainer>
    <Text color={color}>{title}</Text>
    {/* Note that next image works and you can import files from the apps/client app directly */}
    <Image src="/labrys.png" alt="Labrys" width={200} height={200} />

    <Text fontFamily="VT323">This text uses a custom local font</Text>
  </StyledContainer>
);

const StyledContainer = chakra(Flex, {
  baseStyle: {
    color: "black",
    bg: "gray.200",
    p: "20px",
    rounded: "lg",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
});
