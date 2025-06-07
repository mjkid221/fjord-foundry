# Fjord LBP Architecture

## Program Flow Diagram

```mermaid
flowchart TD
    Start([Program Start]) --> InitOwner[Initialize Owner Config]
    InitOwner --> CreatePool[Initialize Pool]

    CreatePool --> PoolActive{Pool Active?}
    PoolActive -->|Yes| CheckTime{Within Sale Period?}
    PoolActive -->|No| PoolClosed[Pool Closed]

    CheckTime -->|Yes| CheckWhitelist{Whitelisted?}
    CheckTime -->|No| WaitForStart[Wait for Sale Start]

    CheckWhitelist -->|Yes| TradingOps[Trading Operations]
    CheckWhitelist -->|No| AccessDenied[Access Denied]

    TradingOps --> BuyShares[Buy Shares]
    TradingOps --> SellShares[Sell Shares]
    TradingOps --> PreviewOps[Preview Operations]

    BuyShares --> UpdateState[Update Pool State]
    SellShares --> UpdateState
    UpdateState --> CheckLimits{Limits Exceeded?}

    CheckLimits -->|No| ProcessFees[Process Fees]
    CheckLimits -->|Yes| RejectTx[Reject Transaction]

    ProcessFees --> UpdateUserState[Update User State]
    UpdateUserState --> EmitEvent[Emit Event]
    EmitEvent --> TradingOps

    WaitForStart --> SaleEnded{Sale Ended?}
    SaleEnded -->|Yes| RedemptionPhase[Redemption Phase]
    SaleEnded -->|No| CheckTime

    RedemptionPhase --> CheckVesting{Vesting Active?}
    CheckVesting -->|Yes| VestingCheck[Check Vesting Period]
    CheckVesting -->|No| DirectRedeem[Direct Redemption]

    VestingCheck --> CliffPassed{Cliff Passed?}
    CliffPassed -->|Yes| PartialRedeem[Partial Redemption]
    CliffPassed -->|No| WaitForCliff[Wait for Cliff]

    PartialRedeem --> UpdateRedemption[Update Redemption State]
    DirectRedeem --> UpdateRedemption
    UpdateRedemption --> ClosePool[Close Pool]

    ClosePool --> DistributeFees[Distribute Fees]
    DistributeFees --> PoolClosed
```

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    Uninitialized --> Initialized: initialize_pool()

    Initialized --> Active: sale_start_time reached
    Active --> Paused: toggle_pause()
    Paused --> Active: toggle_pause()

    Active --> Trading: user interactions
    Trading --> Active: transaction complete

    Active --> SaleEnded: sale_end_time reached
    SaleEnded --> Redemption: redeem()

    Redemption --> Closed: close_pool()
    Closed --> [*]

    note right of Trading
        - swap_exact_assets_for_shares
        - swap_assets_for_exact_shares
        - swap_exact_shares_for_assets
        - swap_shares_for_exact_assets
    end note
```

## Weight Progression Over Time

```mermaid
graph LR
    subgraph "Weight Timeline"
        T0[Sale Start<br/>Weight: 90%/10%]
        T1[25% Progress<br/>Weight: 80%/20%]
        T2[50% Progress<br/>Weight: 70%/30%]
        T3[75% Progress<br/>Weight: 60%/40%]
        T4[Sale End<br/>Weight: 50%/50%]
    end

    T0 --> T1
    T1 --> T2
    T2 --> T3
    T3 --> T4

    subgraph "Price Impact"
        P1[High Share Price<br/>Low Asset Price]
        P2[Decreasing Share Price<br/>Increasing Asset Price]
        P3[Balanced Pricing]
    end

    T0 -.-> P1
    T2 -.-> P2
    T4 -.-> P3
```

## Fee Distribution Flow

```mermaid
graph TD
    SwapFee[Swap Fee Collected] --> PlatformFee[Platform Fee]
    SwapFee --> ReferralFee[Referral Fee]
    SwapFee --> SwapFeeRecipient[Swap Fee Recipient]

    PlatformFee --> Treasury[Treasury Account]
    ReferralFee --> Referrer[Referrer Account]

    Treasury --> FeeRecipient1[Fee Recipient 1]
    Treasury --> FeeRecipient2[Fee Recipient 2]
    Treasury --> FeeRecipientN[Fee Recipient N]

    subgraph "Fee Percentages"
        PlatformPct[Platform: Configurable %]
        ReferralPct[Referral: Configurable %]
        SwapPct[Swap: Configurable %]
    end

    PlatformPct -.-> PlatformFee
    ReferralPct -.-> ReferralFee
    SwapPct -.-> SwapFeeRecipient
```

## Access Control Matrix

```mermaid
graph TB
    subgraph "Roles"
        Owner[Program Owner]
        Creator[Pool Creator]
        User[Regular User]
        Whitelisted[Whitelisted User]
    end

    subgraph "Permissions"
        InitConfig[Initialize Config]
        CreatePool[Create Pool]
        SetFees[Set Fees]
        Pause[Pause Pool]
        Trade[Trade Tokens]
        Redeem[Redeem Tokens]
        Close[Close Pool]
    end

    Owner --> InitConfig
    Owner --> SetFees

    Creator --> CreatePool
    Creator --> Pause
    Creator --> Close

    User --> Trade
    User --> Redeem

    Whitelisted --> Trade
    Whitelisted --> Redeem

    subgraph "Conditions"
        TimeCheck[Within Sale Period]
        WhitelistCheck[Merkle Proof Valid]
        VestingCheck[Vesting Period Passed]
    end

    Trade -.-> TimeCheck
    Trade -.-> WhitelistCheck
    Redeem -.-> VestingCheck
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Layer"
        UserTx[User Transaction]
        TimeOracle[Time Oracle]
        PriceFeeds[Price Feeds]
    end

    subgraph "Processing Layer"
        Validation[Input Validation]
        WeightCalc[Weight Calculation]
        PriceCalc[Price Calculation]
        FeeCalc[Fee Calculation]
    end

    subgraph "State Layer"
        PoolState[Pool State]
        UserState[User State]
        ConfigState[Config State]
    end

    subgraph "Output Layer"
        TokenTransfer[Token Transfer]
        EventEmit[Event Emission]
        StateUpdate[State Update]
    end

    UserTx --> Validation
    TimeOracle --> WeightCalc
    PriceFeeds --> PriceCalc

    Validation --> WeightCalc
    WeightCalc --> PriceCalc
    PriceCalc --> FeeCalc

    FeeCalc --> PoolState
    FeeCalc --> UserState
    FeeCalc --> ConfigState

    PoolState --> TokenTransfer
    UserState --> EventEmit
    ConfigState --> StateUpdate
```

## Key Components Interaction

```mermaid
graph TB
    subgraph "Core Program"
        LBP[fjord_lbp Program]
    end

    subgraph "Instructions"
        Init[initialize_pool]
        SwapBuy[swap_*_for_shares]
        SwapSell[swap_shares_for_*]
        Red[redeem]
        Cls[close_pool]
    end

    subgraph "State Accounts"
        Pool[LiquidityBootstrappingPool]
        Config[OwnerConfig]
        UserPool[UserStateInPool]
        Treas[Treasury]
    end

    subgraph "Utils"
        Math[weighted_math_lib]
        Safe[safe_math]
        Own[ownable]
        Trans[transfer]
    end

    LBP --> Init
    LBP --> SwapBuy
    LBP --> SwapSell
    LBP --> Red
    LBP --> Cls

    Init --> Pool
    SwapBuy --> Pool
    SwapBuy --> UserPool
    SwapSell --> Pool
    SwapSell --> UserPool
    Red --> UserPool
    Cls --> Treas

    SwapBuy --> Math
    SwapSell --> Math
    Math --> Safe

    Init --> Own
    Cls --> Trans
```
