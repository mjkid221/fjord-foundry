import { Button, Flex, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import Link from "next/link";

const HomePage: NextPage = () => (
  <Flex
    p="20px"
    justifyContent="center"
    alignItems="center"
    h="100vh"
    flexDirection="column"
  >
    <Text fontSize="100px">🚀</Text>
    <Link href="/example">
      <Button>Go to example page</Button>
    </Link>
  </Flex>
);

export default HomePage;
