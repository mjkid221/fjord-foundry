## Slither Analysis
Contracts should be analyzed for vulnerabilities using slither. Vulnerable functions from this analaysis should either been rectified or commented with @notice to give an explanation for the vulnerability.

## Summarised User Features
The following summeries will outline user features that are the high level focus that the smart contracts achieve. 

## Running Unit tests
Run `yarn test` to see the output of unit tests.
Unit tests in this directory cover helper functions and contract functions.

## Checking unit test coverage
Run `yarn coverage` to see how much test coverage the contracts have.

Unit test coverage should always be as close to 100% as possible. Exceptions include internal functions, which cannot be run outside of the contract.

## Checking contract sizes
Run `yarn size` to view contract sizes

## Compiling contracts
Contracts are compiled when running tests. However, you may also run `yarn compile` from `packages/contracts`

### Libraries
*Add overview of libraries created here*

### Contracts
*Add contract overview here*

### Deployments
*Add deployed contract addresses for individual projects here*

Contracts are deployed in number order according to the file name in this directory, using hardhat-deploy.

## Upgradeability