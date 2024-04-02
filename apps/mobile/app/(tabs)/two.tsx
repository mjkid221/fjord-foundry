import { Text, Button, Heading, Center, Box } from "native-base";

import { useBearStore } from "@/hooks/useBearStore";

const TabTwoScreen = () => {
  const { bears, increase } = useBearStore();

  return (
    <Box width="100%" height="100%" bg="secondary.100" safeAreaTop>
      <Center>
        <Heading>Tab 2</Heading>
        <Text>Bears: {bears}</Text>
        <Button onPress={() => increase(1)}>Add Bear</Button>
      </Center>
    </Box>
  );
};

export default TabTwoScreen;
