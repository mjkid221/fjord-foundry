import {
  Button,
  Divider,
  Flex,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  VStack,
  chakra,
  useToast,
} from "@chakra-ui/react";
import { useGetExample, usePostExample } from "@scope/lib";
import { NextPage } from "next";
import { useState } from "react";

/**
 * This is an example page with some state handling and usage of the react-query helpers in `packages/lib`.
 * * NOTE: Ideally you would build all of this functionality in the Storybook UI library, but for the sake
 * of this example we are creating it here. You can delete this file when you understand how this works.
 *
 * We have two input boxes which update the state when you change them
 * - The GET request will automatically update by fetching the response from the server every time the state changes
 * - The POST request will only update when you click the button, as it does not automatically refetch. You will get a toast when the response comes back
 */
const ExamplePage: NextPage = () => {
  const toast = useToast();

  const [firstNumber, setFirstNumber] = useState<number>(0);
  const [secondNumber, setSecondNumber] = useState<number>(0);

  const { result, isLoading: isLoadingGet } = useGetExample({
    firstNumber,
    secondNumber,
  });
  const { mutateAsync, isLoading: isLoadingPost } = usePostExample();

  const handlePost = async () => {
    const response = await mutateAsync({ firstNumber, secondNumber });

    toast({
      title: "Success!",
      description: `The result is ${response.data.result}`,
    });
  };

  return (
    <PageContainer>
      <Heading>Example Page</Heading>
      <Text>
        This is an example page with some state handling and usage of the
        react-query helpers in `packages/lib`. We have two input boxes which
        update the state when you change them.
      </Text>
      <Divider />
      <Flex gap="20px">
        {/* The First Number Input Controls */}
        <Text>First Number: </Text>
        <NumberInput
          size="lg"
          value={firstNumber}
          onChange={(valueString) => setFirstNumber(Number(valueString))}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        {/* The Second Number Input Controls */}
        <Text>Second Number: </Text>
        <NumberInput
          size="lg"
          value={secondNumber}
          onChange={(valueString) => setSecondNumber(Number(valueString))}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </Flex>
      <Divider />
      <VStack>
        <Heading>GET</Heading>
        <Text>
          The GET request will automatically update by fetching the response
          from the server every time the state changes. You might also notice
          that going back to values you have already entered will not trigger a
          refetch. This is because the react-query library caches the results of
          the request, and will only refetch if new values are used
        </Text>
        {isLoadingGet ? <Text>loading...</Text> : <Text>Result: {result}</Text>}
      </VStack>
      <Divider />
      <VStack>
        <Heading>POST</Heading>

        <Text>
          The POST request will only update when you click the button, as it
          does not automatically refetch. You will get a toast when the response
          comes back.
        </Text>
        <Button isLoading={isLoadingPost} onClick={handlePost}>
          Add
        </Button>
      </VStack>
      <Button
        onClick={() => {
          throw Error("Throw error to Sentry.io");
        }}
      >
        Break the world
      </Button>
      <Button
        onClick={() => {
          fetch("/api/v1/example/sentry");
        }}
      >
        Break the API world
      </Button>
    </PageContainer>
  );
};

export default ExamplePage;

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
