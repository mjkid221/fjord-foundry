import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ChakraProvider } from "@chakra-ui/react";
import { getBaseUrl } from "@scope/lib/utils";
import { theme } from "@scope/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Analytics } from "@vercel/analytics/react";
import { AppProps } from "next/app";
import { useState } from "react";
import SuperJSON from "superjson";

import { trpc } from "@/utils/trpc";

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            // next-auth's session cookie should already handle authentication
            return {};
          },
        }),
      ],
      transformer: SuperJSON,
    })
  );

  return (
    <UserProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <Analytics />
            <Component {...pageProps} />
          </ChakraProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </UserProvider>
  );
};

export default App;
