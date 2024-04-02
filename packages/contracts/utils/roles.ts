import { ethers } from "ethers";

/**
 * Build a correctly formatted OpenZeppelin Access Control revert message,
 * e.g 'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xf65e2691b9931cc42bef2dfd8b73c9feda20541ddf847534448cb61ef75a7dff'
 * @param account The account for which the Access Control error should be thrown
 * @param role The role that the account is missing
 */
export const buildRBACError = (account: string, role: string) =>
  `AccessControl: account ${account.toLowerCase()} is missing role ${role.toLowerCase()}`;

  /**
   * Build a correctly formatted OpenZeppelin Access Control role,
   * @param role A string matching the role in the contract
   * @returns The encoded role that will be recognized by the contract
   */
export const generateRole = (role: string) =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
