import "@total-typescript/ts-reset";
import { ChakraProvider } from "@chakra-ui/react";
import { Navbar, theme, useProviderConfig } from "@scope/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Analytics } from "@vercel/analytics/react";
import { AppProps } from "next/app";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThirdwebProvider {...useProviderConfig()}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Analytics />
          <Navbar />
          <Component {...pageProps} />
        </ChakraProvider>
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default trpc.withTRPC(App);
