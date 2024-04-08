# Keypair Management for Deployment and Upgrades

Place your Solana program deployer keypair as 'id.json' in here, as referenced in the provider of 'Anchor.toml'. You may point the keypair elsewhere, but please DO NOT commit your production keypair (this has been excluded via gitignore). It is required to deploy/upgrade your Solana programs, and is critical to the security of your programs. Also, make sure to ever re-use development keypairs.
