import { Flex } from "@chakra-ui/react";
import { NextPage } from "next";

import ZustandTaskList from "../components/ZustandTaskList";

const ZustandDemo: NextPage = () => (
  <Flex width="100%" justifyContent="center">
    <ZustandTaskList />
  </Flex>
);

export default ZustandDemo;
