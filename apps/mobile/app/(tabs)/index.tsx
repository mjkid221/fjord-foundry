import { Box, Button, Center, Heading, Text } from "native-base";

import { useBearStore } from "@/hooks/useBearStore";

const TabOneScreen = () => {
  const { bears, increase } = useBearStore();

  return (
    <Box width="100%" height="100%" bg="primary.100" safeAreaTop>
      <Center>
        <Heading>Tab 1</Heading>
        <Text>Bears: {bears}</Text>
        <Button onPress={() => increase(1)}>Add Bear</Button>
      </Center>
    </Box>
  );
};

export default TabOneScreen;
