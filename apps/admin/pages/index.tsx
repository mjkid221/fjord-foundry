import { useUser } from "@auth0/nextjs-auth0/client";
import { Flex, Link, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import NextLink from "next/link";

const HomePage: NextPage = () => {
  const { user } = useUser();

  return (
    <Flex
      p="20px"
      justifyContent="center"
      alignItems="center"
      h="100vh"
      flexDirection="column"
    >
      <Text fontSize="100px">🚀</Text>
      {user ? (
        <>
          <Text>Logged in as: {user.name}</Text>
          <Link as={NextLink} href="/api/auth/logout">
            Logout
          </Link>
        </>
      ) : (
        <Link as={NextLink} href="/api/auth/login">
          Login
        </Link>
      )}
    </Flex>
  );
};

export default HomePage;
