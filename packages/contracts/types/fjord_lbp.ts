export type FjordLbp = {
  version: "0.1.0";
  name: "fjord_lbp";
  constants: [
    {
      name: "ONE_DAY_SECONDS";
      type: "i64";
      value: "60 * 60 * 24";
    }
  ];
  instructions: [
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
    }
  ];
  accounts: [
    {
      name: "liquidityBootstrappingPool";
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
            name: "whitelistMerkleRoot";
            type: {
              array: ["u8", 32];
            };
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
            name: "NowOwner";
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
      name: "InvalidSellingAllowed";
      msg: "Invalid selling allowed value";
    },
    {
      code: 6007;
      name: "InvalidShareValue";
      msg: "Share value cannot be 0";
    },
    {
      code: 6008;
      name: "InvalidSharePrice";
      msg: "Invalid share price";
    },
    {
      code: 6009;
      name: "InvalidMaxSharesOut";
      msg: "Max shares out cannot be 0";
    },
    {
      code: 6010;
      name: "InvalidMaxAssetsIn";
      msg: "Max assets in cannot be 0";
    },
    {
      code: 6011;
      name: "InsufficientShares";
      msg: "There are insuffcient shares to transfer in your account";
    },
    {
      code: 6012;
      name: "InsufficientAssets";
      msg: "There are insuffcient assets to transfer in your account";
    }
  ];
};

export const IDL: FjordLbp = {
  version: "0.1.0",
  name: "fjord_lbp",
  constants: [
    {
      name: "ONE_DAY_SECONDS",
      type: "i64",
      value: "60 * 60 * 24",
    },
  ],
  instructions: [
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
  ],
  accounts: [
    {
      name: "liquidityBootstrappingPool",
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
            name: "whitelistMerkleRoot",
            type: {
              array: ["u8", 32],
            },
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
            name: "NowOwner",
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
      name: "InvalidSellingAllowed",
      msg: "Invalid selling allowed value",
    },
    {
      code: 6007,
      name: "InvalidShareValue",
      msg: "Share value cannot be 0",
    },
    {
      code: 6008,
      name: "InvalidSharePrice",
      msg: "Invalid share price",
    },
    {
      code: 6009,
      name: "InvalidMaxSharesOut",
      msg: "Max shares out cannot be 0",
    },
    {
      code: 6010,
      name: "InvalidMaxAssetsIn",
      msg: "Max assets in cannot be 0",
    },
    {
      code: 6011,
      name: "InsufficientShares",
      msg: "There are insuffcient shares to transfer in your account",
    },
    {
      code: 6012,
      name: "InsufficientAssets",
      msg: "There are insuffcient assets to transfer in your account",
    },
  ],
};
