import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Button,
  chakra,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * Toggle the current light/dark mode color settings
 */
export const DarkModeButton = () => {
  const { toggleColorMode } = useColorMode();

  const icon = useColorModeValue(<MoonIcon />, <SunIcon />);

  return (
    <StyledButton variant="inverseStandard" onClick={toggleColorMode}>
      {icon}
    </StyledButton>
  );
};

const StyledButton = chakra(Button, {
  baseStyle: {
    boxSize: "40px",
    boxShadow: "base",
  },
});
