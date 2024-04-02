import { chakra, Flex } from "@chakra-ui/react";
import { NextPage } from "next";

import ZustandTaskList from "../components/ZustandTaskList";

const ZustandDemo: NextPage = () => (
  <PageContainer>
    <ZustandTaskList />
  </PageContainer>
);

export default ZustandDemo;

const PageContainer = chakra(Flex, {
  baseStyle: {
    p: "20px",
    justifyContent: "center",
    alignItems: "center",
    h: "100vh",
    flexDirection: "column",
    maxW: "xl",
    mx: "auto",
    gap: "20px",
  },
});
