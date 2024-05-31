# Fjord LBP Program

This repository contains the implementation of Fjord's Liquidity Bootstrapping Pool (LBP) program built on Solana using the Anchor framework.

## Prerequisites

- Solana Tool Suite installed and configured: https://docs.solana.com/cli/install-solana-cli-tools
- Anchor framework: https://www.anchor-lang.com/
- Node.js and Yarn

## Deployment Keypair

To deploy the program, you'll need a Solana wallet keypair.

1. Create a keypair file named `id.json`.
2. Place this file inside the `deployment-keypair` folder.

## Anchor Configuration

Ensure your `Anchor.toml` file has the correct network settings for your intended deployment environment (e.g., devnet, mainnet).

## Deployment and Upgrades

To deploy or upgrade the program:

1. `cd` into the project directory.
2. Run `anchor deploy`

## Running Tests

To execute the unit tests:

1. `cd` into the project directory.
2. Create a new local key pair using `solana-keygen new` and place it in `./deployment-keypair/local/id.json`
3. Run `yarn test`
