export type FjordLbp = {
  version: "0.1.0";
  name: "fjord_lbp";
  instructions: [
    {
      name: "initializeOwnerConfig";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        },
        {
          name: "programData";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ownerKey";
          type: "publicKey";
        },
        {
          name: "feeRecipient";
          type: "publicKey";
        },
        {
          name: "platformFee";
          type: "u16";
        },
        {
          name: "referralFee";
          type: "u16";
        },
        {
          name: "swapFee";
          type: "u16";
        }
      ];
    },
    {
      name: "initializePool";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                path: "creator";
              }
            ];
          };
        },
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "creatorAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "creatorShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "assets";
          type: "u64";
        },
        {
          name: "shares";
          type: "u64";
        },
        {
          name: "virtualAssets";
          type: "u64";
        },
        {
          name: "virtualShares";
          type: "u64";
        },
        {
          name: "maxSharePrice";
          type: "u64";
        },
        {
          name: "maxSharesOut";
          type: "u64";
        },
        {
          name: "maxAssetsIn";
          type: "u64";
        },
        {
          name: "startWeightBasisPoints";
          type: "u16";
        },
        {
          name: "endWeightBasisPoints";
          type: "u16";
        },
        {
          name: "saleStartTime";
          type: "i64";
        },
        {
          name: "saleEndTime";
          type: "i64";
        },
        {
          name: "vestCliff";
          type: "i64";
        },
        {
          name: "vestEnd";
          type: "i64";
        },
        {
          name: "whitelistMerkleRoot";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "sellingAllowed";
          type: "bool";
        }
      ];
    },
    {
      name: "swapExactAssetsForShares";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                path: "user";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          isMut: true;
          isSigner: false;
          isOptional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                type: {
                  option: "publicKey";
                };
                path: "referrer";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "assetsIn";
          type: "u64";
        },
        {
          name: "minSharesOut";
          type: "u64";
        },
        {
          name: "merkleProof";
          type: {
            option: {
              vec: {
                array: ["u8", 32];
              };
            };
          };
        },
        {
          name: "referrer";
          type: {
            option: "publicKey";
          };
        }
      ];
    },
    {
      name: "swapAssetsForExactShares";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                path: "user";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          isMut: true;
          isSigner: false;
          isOptional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                type: {
                  option: "publicKey";
                };
                path: "referrer";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "sharesOut";
          type: "u64";
        },
        {
          name: "maxAssetsIn";
          type: "u64";
        },
        {
          name: "merkleProof";
          type: {
            option: {
              vec: {
                array: ["u8", 32];
              };
            };
          };
        },
        {
          name: "referrer";
          type: {
            option: "publicKey";
          };
        }
      ];
    },
    {
      name: "swapExactSharesForAssets";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                path: "user";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          isMut: true;
          isSigner: false;
          isOptional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                type: {
                  option: "publicKey";
                };
                path: "referrer";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "sharesIn";
          type: "u64";
        },
        {
          name: "minAssetsOut";
          type: "u64";
        },
        {
          name: "merkleProof";
          type: {
            option: {
              vec: {
                array: ["u8", 32];
              };
            };
          };
        },
        {
          name: "referrer";
          type: {
            option: "publicKey";
          };
        }
      ];
    },
    {
      name: "swapSharesForExactAssets";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                path: "user";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          isMut: true;
          isSigner: false;
          isOptional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                type: {
                  option: "publicKey";
                };
                path: "referrer";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "assetsOut";
          type: "u64";
        },
        {
          name: "maxSharesIn";
          type: "u64";
        },
        {
          name: "merkleProof";
          type: {
            option: {
              vec: {
                array: ["u8", 32];
              };
            };
          };
        },
        {
          name: "referrer";
          type: {
            option: "publicKey";
          };
        }
      ];
    },
    {
      name: "previewAssetsIn";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "sharesOut";
          type: "u64";
        }
      ];
      returns: "u64";
    },
    {
      name: "previewSharesIn";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "assetsOut";
          type: "u64";
        }
      ];
      returns: "u64";
    },
    {
      name: "previewSharesOut";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "assetsIn";
          type: "u64";
        }
      ];
      returns: "u64";
    },
    {
      name: "previewAssetsOut";
      accounts: [
        {
          name: "assetTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "shareTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "share_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "asset_token_mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "LiquidityBootstrappingPool";
                path: "pool.creator";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolShareTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "sharesIn";
          type: "u64";
        }
      ];
      returns: "u64";
    },
    {
      name: "setFees";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "feeRecipient";
          type: {
            option: "publicKey";
          };
        },
        {
          name: "platformFee";
          type: {
            option: "u16";
          };
        },
        {
          name: "referralFee";
          type: {
            option: "u16";
          };
        },
        {
          name: "swapFee";
          type: {
            option: "u16";
          };
        }
      ];
    },
    {
      name: "nominateNewOwner";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "newOwnerKey";
          type: "publicKey";
        }
      ];
    },
    {
      name: "acceptNewOwner";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "owner_config";
              }
            ];
          };
        },
        {
          name: "newOwner";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "liquidityBootstrappingPool";
      docs: [
        "Account storing the information of the liquidity bootstrapping pool"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "assetToken";
            type: "publicKey";
          },
          {
            name: "shareToken";
            type: "publicKey";
          },
          {
            name: "creator";
            type: "publicKey";
          },
          {
            name: "virtualAssets";
            type: "u64";
          },
          {
            name: "virtualShares";
            type: "u64";
          },
          {
            name: "maxSharePrice";
            type: "u64";
          },
          {
            name: "maxSharesOut";
            type: "u64";
          },
          {
            name: "maxAssetsIn";
            type: "u64";
          },
          {
            name: "startWeightBasisPoints";
            type: "u16";
          },
          {
            name: "endWeightBasisPoints";
            type: "u16";
          },
          {
            name: "saleStartTime";
            type: "i64";
          },
          {
            name: "saleEndTime";
            type: "i64";
          },
          {
            name: "vestCliff";
            type: "i64";
          },
          {
            name: "vestEnd";
            type: "i64";
          },
          {
            name: "sellingAllowed";
            type: "bool";
          },
          {
            name: "totalPurchased";
            type: "u64";
          },
          {
            name: "totalReferred";
            type: "u64";
          },
          {
            name: "totalSwapFeesAsset";
            type: "u64";
          },
          {
            name: "totalSwapFeesShare";
            type: "u64";
          },
          {
            name: "closed";
            type: "bool";
          },
          {
            name: "whitelistMerkleRoot";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "userStateInPool";
      docs: [
        "Account storing the information of the user in the liquidity bootstrapping pool"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "purchasedShares";
            type: "u64";
          },
          {
            name: "referredAssets";
            type: "u64";
          },
          {
            name: "redeemedShares";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "ownerConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "pendingOwner";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "feeRecipient";
            type: "publicKey";
          },
          {
            name: "platformFee";
            type: "u16";
          },
          {
            name: "referralFee";
            type: "u16";
          },
          {
            name: "swapFee";
            type: "u16";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "AccessControlError";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Unauthorized";
          }
        ];
      };
    },
    {
      name: "SafeMathError";
      type: {
        kind: "enum";
        variants: [
          {
            name: "AdditionOverflow";
          },
          {
            name: "SubtractionUnderflow";
          },
          {
            name: "MultiplicationOverflow";
          },
          {
            name: "DivisionUnderflow";
          },
          {
            name: "ExponentiationOverflow";
          },
          {
            name: "ConversionOverflow";
          },
          {
            name: "AmountInTooLarge";
          },
          {
            name: "AmountOutTooLarge";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "PoolCreatedEvent";
      fields: [
        {
          name: "pool";
          type: "publicKey";
          index: false;
        }
      ];
    },
    {
      name: "Buy";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "assets";
          type: "u64";
          index: false;
        },
        {
          name: "shares";
          type: "u64";
          index: false;
        },
        {
          name: "swapFee";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "Sell";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "shares";
          type: "u64";
          index: false;
        },
        {
          name: "assets";
          type: "u64";
          index: false;
        },
        {
          name: "swapFee";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "FeeSet";
      fields: [
        {
          name: "feeRecipient";
          type: "publicKey";
          index: false;
        },
        {
          name: "platformFee";
          type: "u16";
          index: false;
        },
        {
          name: "referralFee";
          type: "u16";
          index: false;
        },
        {
          name: "swapFee";
          type: "u16";
          index: false;
        }
      ];
    },
    {
      name: "PreviewAssetsIn";
      fields: [
        {
          name: "assetsIn";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "PreviewAssetsOut";
      fields: [
        {
          name: "assetsOut";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "PreviewSharesIn";
      fields: [
        {
          name: "sharesIn";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "PreviewSharesOut";
      fields: [
        {
          name: "sharesOut";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidAssetOrShare";
      msg: "Asset and share token mints must be different";
    },
    {
      code: 6001;
      name: "SalePeriodLow";
      msg: "Sale period is too low";
    },
    {
      code: 6002;
      name: "InvalidVestCliff";
      msg: "Vesting cliff time should be less than sale end";
    },
    {
      code: 6003;
      name: "InvalidVestEnd";
      msg: "Vesting end time should be greater or equal to vest cliff ";
    },
    {
      code: 6004;
      name: "InvalidWeightConfig";
      msg: "Invalid start or end weight";
    },
    {
      code: 6005;
      name: "InvalidAssetValue";
      msg: "Asset value cannot be 0";
    },
    {
      code: 6006;
      name: "MaxFeeExceeded";
      msg: "Max Fee Exceeded";
    },
    {
      code: 6007;
      name: "AssetsInExceeded";
      msg: "Max allowed assets in exceeded";
    },
    {
      code: 6008;
      name: "SharesOutExceeded";
      msg: "Max allowed shares out exceeded";
    },
    {
      code: 6009;
      name: "WhitelistProof";
      msg: "Whitelist verification failed";
    },
    {
      code: 6010;
      name: "SlippageExceeded";
      msg: "Slippage limit is exceeded";
    },
    {
      code: 6011;
      name: "SellingDisallowed";
      msg: "Selling is disallowed";
    },
    {
      code: 6012;
      name: "TradingDisallowed";
      msg: "Trading is disallowed";
    },
    {
      code: 6013;
      name: "ClosingDisallowed";
      msg: "Closing is disallowed";
    },
    {
      code: 6014;
      name: "RedeemingDisallowed";
      msg: "Redeeming is disallowed";
    },
    {
      code: 6015;
      name: "CallerDisallowed";
      msg: "Caller is disallowed";
    },
    {
      code: 6016;
      name: "InvalidSellingAllowed";
      msg: "Invalid selling allowed value";
    },
    {
      code: 6017;
      name: "InvalidShareValue";
      msg: "Share value cannot be 0";
    },
    {
      code: 6018;
      name: "InvalidSharePrice";
      msg: "Invalid share price";
    },
    {
      code: 6019;
      name: "InvalidMaxSharesOut";
      msg: "Max shares out cannot be 0";
    },
    {
      code: 6020;
      name: "InvalidMaxAssetsIn";
      msg: "Max assets in cannot be 0";
    },
    {
      code: 6021;
      name: "InsufficientShares";
      msg: "There are insuffcient shares to transfer in your account";
    },
    {
      code: 6022;
      name: "InsufficientAssets";
      msg: "There are insuffcient assets to transfer in your account";
    }
  ];
};

export const IDL: FjordLbp = {
  version: "0.1.0",
  name: "fjord_lbp",
  instructions: [
    {
      name: "initializeOwnerConfig",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "programData",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ownerKey",
          type: "publicKey",
        },
        {
          name: "feeRecipient",
          type: "publicKey",
        },
        {
          name: "platformFee",
          type: "u16",
        },
        {
          name: "referralFee",
          type: "u16",
        },
        {
          name: "swapFee",
          type: "u16",
        },
      ],
    },
    {
      name: "initializePool",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "creator",
              },
            ],
          },
        },
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "creatorAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "creatorShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "assets",
          type: "u64",
        },
        {
          name: "shares",
          type: "u64",
        },
        {
          name: "virtualAssets",
          type: "u64",
        },
        {
          name: "virtualShares",
          type: "u64",
        },
        {
          name: "maxSharePrice",
          type: "u64",
        },
        {
          name: "maxSharesOut",
          type: "u64",
        },
        {
          name: "maxAssetsIn",
          type: "u64",
        },
        {
          name: "startWeightBasisPoints",
          type: "u16",
        },
        {
          name: "endWeightBasisPoints",
          type: "u16",
        },
        {
          name: "saleStartTime",
          type: "i64",
        },
        {
          name: "saleEndTime",
          type: "i64",
        },
        {
          name: "vestCliff",
          type: "i64",
        },
        {
          name: "vestEnd",
          type: "i64",
        },
        {
          name: "whitelistMerkleRoot",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "sellingAllowed",
          type: "bool",
        },
      ],
    },
    {
      name: "swapExactAssetsForShares",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "userStateInPool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "referrerStateInPool",
          isMut: true,
          isSigner: false,
          isOptional: true,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: {
                  option: "publicKey",
                },
                path: "referrer",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "assetsIn",
          type: "u64",
        },
        {
          name: "minSharesOut",
          type: "u64",
        },
        {
          name: "merkleProof",
          type: {
            option: {
              vec: {
                array: ["u8", 32],
              },
            },
          },
        },
        {
          name: "referrer",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
    {
      name: "swapAssetsForExactShares",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "userStateInPool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "referrerStateInPool",
          isMut: true,
          isSigner: false,
          isOptional: true,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: {
                  option: "publicKey",
                },
                path: "referrer",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "sharesOut",
          type: "u64",
        },
        {
          name: "maxAssetsIn",
          type: "u64",
        },
        {
          name: "merkleProof",
          type: {
            option: {
              vec: {
                array: ["u8", 32],
              },
            },
          },
        },
        {
          name: "referrer",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
    {
      name: "swapExactSharesForAssets",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "userStateInPool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "referrerStateInPool",
          isMut: true,
          isSigner: false,
          isOptional: true,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: {
                  option: "publicKey",
                },
                path: "referrer",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "sharesIn",
          type: "u64",
        },
        {
          name: "minAssetsOut",
          type: "u64",
        },
        {
          name: "merkleProof",
          type: {
            option: {
              vec: {
                array: ["u8", 32],
              },
            },
          },
        },
        {
          name: "referrer",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
    {
      name: "swapSharesForExactAssets",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "userStateInPool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "referrerStateInPool",
          isMut: true,
          isSigner: false,
          isOptional: true,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: {
                  option: "publicKey",
                },
                path: "referrer",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "assetsOut",
          type: "u64",
        },
        {
          name: "maxSharesIn",
          type: "u64",
        },
        {
          name: "merkleProof",
          type: {
            option: {
              vec: {
                array: ["u8", 32],
              },
            },
          },
        },
        {
          name: "referrer",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
    {
      name: "previewAssetsIn",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "sharesOut",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "previewSharesIn",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "assetsOut",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "previewSharesOut",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "assetsIn",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "previewAssetsOut",
      accounts: [
        {
          name: "assetTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "shareTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "share_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "asset_token_mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "LiquidityBootstrappingPool",
                path: "pool.creator",
              },
            ],
          },
        },
        {
          name: "poolAssetTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolShareTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "sharesIn",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "setFees",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "feeRecipient",
          type: {
            option: "publicKey",
          },
        },
        {
          name: "platformFee",
          type: {
            option: "u16",
          },
        },
        {
          name: "referralFee",
          type: {
            option: "u16",
          },
        },
        {
          name: "swapFee",
          type: {
            option: "u16",
          },
        },
      ],
    },
    {
      name: "nominateNewOwner",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "newOwnerKey",
          type: "publicKey",
        },
      ],
    },
    {
      name: "acceptNewOwner",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "owner_config",
              },
            ],
          },
        },
        {
          name: "newOwner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "liquidityBootstrappingPool",
      docs: [
        "Account storing the information of the liquidity bootstrapping pool",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "assetToken",
            type: "publicKey",
          },
          {
            name: "shareToken",
            type: "publicKey",
          },
          {
            name: "creator",
            type: "publicKey",
          },
          {
            name: "virtualAssets",
            type: "u64",
          },
          {
            name: "virtualShares",
            type: "u64",
          },
          {
            name: "maxSharePrice",
            type: "u64",
          },
          {
            name: "maxSharesOut",
            type: "u64",
          },
          {
            name: "maxAssetsIn",
            type: "u64",
          },
          {
            name: "startWeightBasisPoints",
            type: "u16",
          },
          {
            name: "endWeightBasisPoints",
            type: "u16",
          },
          {
            name: "saleStartTime",
            type: "i64",
          },
          {
            name: "saleEndTime",
            type: "i64",
          },
          {
            name: "vestCliff",
            type: "i64",
          },
          {
            name: "vestEnd",
            type: "i64",
          },
          {
            name: "sellingAllowed",
            type: "bool",
          },
          {
            name: "totalPurchased",
            type: "u64",
          },
          {
            name: "totalReferred",
            type: "u64",
          },
          {
            name: "totalSwapFeesAsset",
            type: "u64",
          },
          {
            name: "totalSwapFeesShare",
            type: "u64",
          },
          {
            name: "closed",
            type: "bool",
          },
          {
            name: "whitelistMerkleRoot",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "userStateInPool",
      docs: [
        "Account storing the information of the user in the liquidity bootstrapping pool",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "purchasedShares",
            type: "u64",
          },
          {
            name: "referredAssets",
            type: "u64",
          },
          {
            name: "redeemedShares",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "ownerConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "pendingOwner",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "feeRecipient",
            type: "publicKey",
          },
          {
            name: "platformFee",
            type: "u16",
          },
          {
            name: "referralFee",
            type: "u16",
          },
          {
            name: "swapFee",
            type: "u16",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "AccessControlError",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Unauthorized",
          },
        ],
      },
    },
    {
      name: "SafeMathError",
      type: {
        kind: "enum",
        variants: [
          {
            name: "AdditionOverflow",
          },
          {
            name: "SubtractionUnderflow",
          },
          {
            name: "MultiplicationOverflow",
          },
          {
            name: "DivisionUnderflow",
          },
          {
            name: "ExponentiationOverflow",
          },
          {
            name: "ConversionOverflow",
          },
          {
            name: "AmountInTooLarge",
          },
          {
            name: "AmountOutTooLarge",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "PoolCreatedEvent",
      fields: [
        {
          name: "pool",
          type: "publicKey",
          index: false,
        },
      ],
    },
    {
      name: "Buy",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false,
        },
        {
          name: "assets",
          type: "u64",
          index: false,
        },
        {
          name: "shares",
          type: "u64",
          index: false,
        },
        {
          name: "swapFee",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "Sell",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false,
        },
        {
          name: "shares",
          type: "u64",
          index: false,
        },
        {
          name: "assets",
          type: "u64",
          index: false,
        },
        {
          name: "swapFee",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "FeeSet",
      fields: [
        {
          name: "feeRecipient",
          type: "publicKey",
          index: false,
        },
        {
          name: "platformFee",
          type: "u16",
          index: false,
        },
        {
          name: "referralFee",
          type: "u16",
          index: false,
        },
        {
          name: "swapFee",
          type: "u16",
          index: false,
        },
      ],
    },
    {
      name: "PreviewAssetsIn",
      fields: [
        {
          name: "assetsIn",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "PreviewAssetsOut",
      fields: [
        {
          name: "assetsOut",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "PreviewSharesIn",
      fields: [
        {
          name: "sharesIn",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "PreviewSharesOut",
      fields: [
        {
          name: "sharesOut",
          type: "u64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidAssetOrShare",
      msg: "Asset and share token mints must be different",
    },
    {
      code: 6001,
      name: "SalePeriodLow",
      msg: "Sale period is too low",
    },
    {
      code: 6002,
      name: "InvalidVestCliff",
      msg: "Vesting cliff time should be less than sale end",
    },
    {
      code: 6003,
      name: "InvalidVestEnd",
      msg: "Vesting end time should be greater or equal to vest cliff ",
    },
    {
      code: 6004,
      name: "InvalidWeightConfig",
      msg: "Invalid start or end weight",
    },
    {
      code: 6005,
      name: "InvalidAssetValue",
      msg: "Asset value cannot be 0",
    },
    {
      code: 6006,
      name: "MaxFeeExceeded",
      msg: "Max Fee Exceeded",
    },
    {
      code: 6007,
      name: "AssetsInExceeded",
      msg: "Max allowed assets in exceeded",
    },
    {
      code: 6008,
      name: "SharesOutExceeded",
      msg: "Max allowed shares out exceeded",
    },
    {
      code: 6009,
      name: "WhitelistProof",
      msg: "Whitelist verification failed",
    },
    {
      code: 6010,
      name: "SlippageExceeded",
      msg: "Slippage limit is exceeded",
    },
    {
      code: 6011,
      name: "SellingDisallowed",
      msg: "Selling is disallowed",
    },
    {
      code: 6012,
      name: "TradingDisallowed",
      msg: "Trading is disallowed",
    },
    {
      code: 6013,
      name: "ClosingDisallowed",
      msg: "Closing is disallowed",
    },
    {
      code: 6014,
      name: "RedeemingDisallowed",
      msg: "Redeeming is disallowed",
    },
    {
      code: 6015,
      name: "CallerDisallowed",
      msg: "Caller is disallowed",
    },
    {
      code: 6016,
      name: "InvalidSellingAllowed",
      msg: "Invalid selling allowed value",
    },
    {
      code: 6017,
      name: "InvalidShareValue",
      msg: "Share value cannot be 0",
    },
    {
      code: 6018,
      name: "InvalidSharePrice",
      msg: "Invalid share price",
    },
    {
      code: 6019,
      name: "InvalidMaxSharesOut",
      msg: "Max shares out cannot be 0",
    },
    {
      code: 6020,
      name: "InvalidMaxAssetsIn",
      msg: "Max assets in cannot be 0",
    },
    {
      code: 6021,
      name: "InsufficientShares",
      msg: "There are insuffcient shares to transfer in your account",
    },
    {
      code: 6022,
      name: "InsufficientAssets",
      msg: "There are insuffcient assets to transfer in your account",
    },
  ],
};
