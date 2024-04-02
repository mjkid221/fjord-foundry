import { User } from "../../database";

/**
 * User auth session. Use this to pass additional context to routes such as a user model
 */
export interface Session {
  address: string;
}

export type AuthContext = {
  user?: User;
  session?: Session;
};
