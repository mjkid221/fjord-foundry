/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fjord_lbp.json`.
 */
export type FjordLbp = {
  address: "HSbvUZ5aSBSUteCEmvyspZd85YCy3pgofX7dyLf844iw";
  metadata: {
    name: "fjordLbp";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "acceptNewOwner";
      discriminator: [132, 117, 78, 241, 190, 90, 101, 162];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "newOwner";
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "closePool";
      discriminator: [140, 189, 209, 23, 239, 62, 239, 11];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "treasuryAssetTokenAccount";
          writable: true;
        },
        {
          name: "treasuryShareTokenAccount";
          writable: true;
        },
        {
          name: "treasury";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              }
            ];
          };
        },
        {
          name: "creatorAssetTokenAccount";
          writable: true;
        },
        {
          name: "creatorShareTokenAccount";
          writable: true;
        },
        {
          name: "poolCreator";
        },
        {
          name: "swapFeeRecipientAssetTokenAccount";
          writable: true;
        },
        {
          name: "swapFeeRecipientShareTokenAccount";
          writable: true;
        },
        {
          name: "swapFeeRecipient";
        },
        {
          name: "ownerConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initializeOwnerConfig";
      discriminator: [92, 163, 119, 60, 121, 197, 236, 20];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              }
            ];
          };
        },
        {
          name: "program";
          address: "HSbvUZ5aSBSUteCEmvyspZd85YCy3pgofX7dyLf844iw";
        },
        {
          name: "programData";
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "ownerKey";
          type: "pubkey";
        },
        {
          name: "swapFeeRecipient";
          type: "pubkey";
        },
        {
          name: "feeRecipients";
          type: {
            vec: "pubkey";
          };
        },
        {
          name: "feePercentages";
          type: {
            vec: "u16";
          };
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
      discriminator: [95, 180, 10, 172, 84, 174, 232, 40];
      accounts: [
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "salt";
              }
            ];
          };
        },
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "creatorAssetTokenAccount";
          writable: true;
        },
        {
          name: "creatorShareTokenAccount";
          writable: true;
        },
        {
          name: "creator";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "salt";
          type: "string";
        },
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
      name: "nominateNewOwner";
      discriminator: [158, 77, 70, 87, 131, 14, 137, 215];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "owner";
          signer: true;
        }
      ];
      args: [
        {
          name: "newOwnerKey";
          type: "pubkey";
        }
      ];
    },
    {
      name: "previewAssetsIn";
      discriminator: [103, 135, 97, 4, 163, 166, 209, 118];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
        },
        {
          name: "poolShareTokenAccount";
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
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
      name: "previewAssetsOut";
      discriminator: [77, 41, 53, 127, 181, 41, 244, 138];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
        },
        {
          name: "poolShareTokenAccount";
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
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
      name: "previewSharesIn";
      discriminator: [202, 109, 193, 148, 64, 69, 35, 225];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
        },
        {
          name: "poolShareTokenAccount";
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
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
      discriminator: [2, 243, 49, 115, 247, 155, 87, 58];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
        },
        {
          name: "poolShareTokenAccount";
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
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
      name: "redeem";
      discriminator: [184, 12, 86, 149, 70, 196, 97, 225];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "userAssetTokenAccount";
          writable: true;
        },
        {
          name: "userShareTokenAccount";
          writable: true;
        },
        {
          name: "userStateInPool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "referred";
          type: "bool";
        }
      ];
    },
    {
      name: "reservesAndWeights";
      discriminator: [62, 172, 77, 231, 36, 32, 3, 172];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
        },
        {
          name: "poolShareTokenAccount";
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        }
      ];
      args: [];
      returns: {
        defined: {
          name: "computedReservesAndWeights";
        };
      };
    },
    {
      name: "setFees";
      discriminator: [137, 178, 49, 58, 0, 245, 242, 190];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "owner";
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
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
      name: "setTreasuryFeeRecipients";
      discriminator: [139, 30, 142, 164, 63, 78, 237, 96];
      accounts: [
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              }
            ];
          };
        },
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "swapFeeRecipient";
          type: {
            option: "pubkey";
          };
        },
        {
          name: "feeRecipients";
          type: {
            vec: "pubkey";
          };
        },
        {
          name: "feePercentages";
          type: {
            vec: "u16";
          };
        }
      ];
    },
    {
      name: "swapAssetsForExactShares";
      discriminator: [109, 155, 102, 58, 182, 210, 68, 216];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "userAssetTokenAccount";
          writable: true;
        },
        {
          name: "userShareTokenAccount";
          writable: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "referrer";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
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
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "swapExactAssetsForShares";
      discriminator: [9, 40, 95, 204, 39, 163, 27, 162];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "userAssetTokenAccount";
          writable: true;
        },
        {
          name: "userShareTokenAccount";
          writable: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "referrer";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
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
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "swapExactSharesForAssets";
      discriminator: [229, 222, 24, 151, 179, 119, 72, 247];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "userAssetTokenAccount";
          writable: true;
        },
        {
          name: "userShareTokenAccount";
          writable: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "referrer";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
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
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "swapSharesForExactAssets";
      discriminator: [36, 224, 73, 237, 138, 71, 184, 77];
      accounts: [
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "pool.creator";
                account: "liquidityBootstrappingPool";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "poolAssetTokenAccount";
          writable: true;
        },
        {
          name: "poolShareTokenAccount";
          writable: true;
        },
        {
          name: "userAssetTokenAccount";
          writable: true;
        },
        {
          name: "userShareTokenAccount";
          writable: true;
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  111,
                  119,
                  110,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "userStateInPool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "referrerStateInPool";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "referrer";
              },
              {
                kind: "account";
                path: "pool";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
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
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "togglePause";
      discriminator: [238, 237, 206, 27, 255, 95, 123, 229];
      accounts: [
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "shareTokenMint";
              },
              {
                kind: "account";
                path: "assetTokenMint";
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "account";
                path: "pool.salt";
                account: "liquidityBootstrappingPool";
              }
            ];
          };
        },
        {
          name: "assetTokenMint";
        },
        {
          name: "shareTokenMint";
        },
        {
          name: "creator";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "liquidityBootstrappingPool";
      discriminator: [27, 42, 87, 108, 101, 210, 52, 234];
    },
    {
      name: "ownerConfig";
      discriminator: [68, 140, 203, 32, 144, 130, 191, 23];
    },
    {
      name: "treasury";
      discriminator: [238, 239, 123, 238, 89, 1, 168, 253];
    },
    {
      name: "userStateInPool";
      discriminator: [192, 140, 241, 138, 166, 26, 128, 158];
    }
  ];
  events: [
    {
      name: "buy";
      discriminator: [104, 229, 167, 8, 240, 133, 178, 57];
    },
    {
      name: "close";
      discriminator: [255, 220, 12, 202, 144, 201, 67, 237];
    },
    {
      name: "poolCreatedEvent";
      discriminator: [25, 94, 75, 47, 112, 99, 53, 63];
    },
    {
      name: "previewAssetsIn";
      discriminator: [200, 66, 33, 255, 179, 166, 45, 117];
    },
    {
      name: "previewAssetsOut";
      discriminator: [231, 154, 34, 230, 104, 110, 101, 5];
    },
    {
      name: "previewSharesIn";
      discriminator: [27, 234, 16, 29, 25, 213, 167, 68];
    },
    {
      name: "previewSharesOut";
      discriminator: [76, 247, 96, 98, 23, 58, 199, 122];
    },
    {
      name: "redeem";
      discriminator: [251, 40, 155, 2, 18, 221, 176, 73];
    },
    {
      name: "reservesAndWeights";
      discriminator: [57, 46, 244, 71, 177, 227, 14, 2];
    },
    {
      name: "sell";
      discriminator: [208, 253, 142, 56, 83, 4, 87, 225];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "additionOverflow";
      msg: "SafeMath: Addition overflow";
    },
    {
      code: 6001;
      name: "subtractionUnderflow";
      msg: "SafeMath: Subtraction underflow";
    },
    {
      code: 6002;
      name: "multiplicationOverflow";
      msg: "SafeMath: Multiplication overflow";
    },
    {
      code: 6003;
      name: "divisionUnderflow";
      msg: "SafeMath: Division underflow";
    },
    {
      code: 6004;
      name: "exponentiationOverflow";
      msg: "SafeMath: Exponentiation overflow";
    },
    {
      code: 6005;
      name: "conversionOverflow";
      msg: "SafeMath: Conversion overflow";
    },
    {
      code: 6006;
      name: "amountInTooLarge";
      msg: "WeightedMathLib: amount_in exceeds MAX_PERCENTAGE_IN";
    },
    {
      code: 6007;
      name: "amountOutTooLarge";
      msg: "WeightedMathLib: amount_out exceeds MAX_PERCENTAGE_OUT";
    },
    {
      code: 6008;
      name: "logarithmUndefined";
      msg: "WeightedMathLib: Logarithm undefined";
    },
    {
      code: 6009;
      name: "invalidSharesIn";
      msg: "BootstrapLib: Expected shares in cannot be 0";
    },
    {
      code: 6010;
      name: "invalidAssetsIn";
      msg: "BootstrapLib: Expected assets in cannot be 0";
    }
  ];
  types: [
    {
      name: "buy";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "assets";
            type: "u64";
          },
          {
            name: "shares";
            type: "u64";
          },
          {
            name: "swapFee";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "close";
      type: {
        kind: "struct";
        fields: [
          {
            name: "assets";
            type: "u64";
          },
          {
            name: "platformFees";
            type: "u64";
          },
          {
            name: "swapFeesAsset";
            type: "u64";
          },
          {
            name: "swapFeesShare";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "computedReservesAndWeights";
      type: {
        kind: "struct";
        fields: [
          {
            name: "assetReserve";
            type: "u64";
          },
          {
            name: "shareReserve";
            type: "u64";
          },
          {
            name: "assetWeight";
            type: "u64";
          },
          {
            name: "shareWeight";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "feeMapping";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "percentage";
            type: "u16";
          }
        ];
      };
    },
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
            type: "pubkey";
          },
          {
            name: "shareToken";
            type: "pubkey";
          },
          {
            name: "creator";
            type: "pubkey";
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
            name: "paused";
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
          },
          {
            name: "salt";
            type: "string";
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
            type: "pubkey";
          },
          {
            name: "pendingOwner";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "treasury";
            type: "pubkey";
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
    },
    {
      name: "poolCreatedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "previewAssetsIn";
      type: {
        kind: "struct";
        fields: [
          {
            name: "assetsIn";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "previewAssetsOut";
      type: {
        kind: "struct";
        fields: [
          {
            name: "assetsOut";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "previewSharesIn";
      type: {
        kind: "struct";
        fields: [
          {
            name: "sharesIn";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "previewSharesOut";
      type: {
        kind: "struct";
        fields: [
          {
            name: "sharesOut";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "redeem";
      type: {
        kind: "struct";
        fields: [
          {
            name: "caller";
            type: "pubkey";
          },
          {
            name: "shares";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "reservesAndWeights";
      type: {
        kind: "struct";
        fields: [
          {
            name: "assetReserve";
            type: "u64";
          },
          {
            name: "shareReserve";
            type: "u64";
          },
          {
            name: "assetWeight";
            type: "u64";
          },
          {
            name: "shareWeight";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "sell";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "shares";
            type: "u64";
          },
          {
            name: "assets";
            type: "u64";
          },
          {
            name: "swapFee";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "treasury";
      type: {
        kind: "struct";
        fields: [
          {
            name: "swapFeeRecipient";
            type: "pubkey";
          },
          {
            name: "feeRecipients";
            type: {
              vec: {
                defined: {
                  name: "feeMapping";
                };
              };
            };
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
    }
  ];
};
