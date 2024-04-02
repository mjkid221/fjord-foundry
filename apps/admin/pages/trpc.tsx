import { Heading, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import { Suspense } from "react";

import { trpc } from "@/utils/trpc";

const TrpcClientDemoSuspenseContent = () => {
  // this component is suspended until the query is resolved
  const { data } = trpc.sample.hello.useQuery(
    {
      text: "world",
    },
    { suspense: true }
  );

  if (!data) return null;

  const { greeting } = data;

  return <Heading as="h1">{greeting}</Heading>;
};

const TrpcClientDemoContent = () => {
  // this component is not suspended, so it will render immediately then update
  const { data } = trpc.sample.hello.useQuery({
    text: "world",
  });

  if (!data) return <Text>Loading...</Text>;

  const { greeting } = data;

  return <Heading as="h2">{greeting}</Heading>;
};

const TrpcClientDemo: NextPage = () => (
  <>
    <Suspense>
      <TrpcClientDemoSuspenseContent />
    </Suspense>
    <TrpcClientDemoContent />
  </>
);

export default TrpcClientDemo;
