import { Session, thirdWebService, AuthContext } from "@scope/lib";
import * as trpcNext from "@trpc/server/adapters/next";

/**
 * Creates the Auth Context for the API. If the user is correctly authenticated, the auth will be included in the context
 * Also includes DB connection
 */
export const createAuthContext = async ({
  req,
}: trpcNext.CreateNextContextOptions): Promise<AuthContext> => {
  const session = (await thirdWebService().getUser(req)) as Session;

  if (!session || !session.address) {
    return {
      session: undefined,
      user: undefined,
    };
  }

  // You can also fetch user models in here and attach them to the auth context so that they are available in all routes
  // await connect();
  // const user = await UserModel.findOne({ address: session.address });

  return {
    session,
  };
};
