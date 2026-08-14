# ADR 008: Tokenomics and Payments with LENS Token

## Status

Accepted

## Context

CohortLens needs a token economy for:
- Paying for Lens queries
- Rewarding Lens providers
- Staking for governance
- Gasless transactions for users

## Decision

Use **LENS** as the native ERC20 token with a simple payment model.

### Tokenomics

| Parameter | Value |
|-----------|-------|
| Token Name | Lens Token |
| Symbol | LENS |
| Max Supply | 1,000,000,000 LENS |
| Initial Distribution | See below |
| Utility | Pay for queries, staking, governance |

### Initial Distribution

| Allocation | Percentage | Amount | Vesting |
|------------|------------|--------|---------|
| Team & Advisors | 20% | 200M | 4 years, 1 year cliff |
| Ecosystem Fund | 30% | 300M | 5 years linear |
| Lens Providers | 25% | 250M | 3 years linear |
| Public Sale | 15% | 150M | No vesting |
| Treasury | 10% | 100M | Governed by DAO |

### Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   Oracle    │     │   Provider  │
│             │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Submit Query  │                   │
       │  + Pay LENS       │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │  2. Forward Query │
       │                   │──────────────────>│
       │                   │                   │
       │                   │  3. Return Result │
       │                   │<──────────────────│
       │                   │                   │
       │                   │  4. Pay Provider  │
       │                   │──────────────────>│
       │                   │                   │
       │  5. Return Result │                   │
       │<──────────────────│                   │
       │                   │                   │
```

### Pricing Model

- **Dynamic pricing**: Lens providers set their own price per query
- **Oracle fee**: 5% of query cost goes to protocol treasury
- **Minimum fee**: 0.1 LENS per query
- **Maximum fee**: 1000 LENS per query

### Staking Rewards

- **APY**: 5% base APY for staking LENS
- **Bonus APY**: Up to 5% additional for active Lens providers
- **Lock period**: Optional 30/90/180 day locks for bonus APY

### Gasless Transactions

Use **Gelato Network** for meta-transactions:
- Users sign transactions off-chain
- Gelato relays and pays gas in ETH
- Reimbursed from protocol treasury

```solidity
// Gasless transaction example
function submitQueryGasless(
    uint256 lensId,
    bytes memory params,
    bytes memory signature
) external {
    // Verify signature
    address user = ECDSA.recover(
        keccak256(abi.encodePacked(lensId, params)),
        signature
    );

    // Execute query on behalf of user
    _submitQuery(user, lensId, params);
}
```

## Alternatives Considered

### Multi-Token Model
- **Pros**: Separate utility and governance tokens
- **Cons**: Complexity, regulatory risk

### No Token
- **Pros**: Simpler, no regulatory concerns
- **Cons**: No staking, no governance, harder to incentivize providers

### Stablecoin Payments
- **Pros**: Price stability
- **Cons**: No upside for early adopters, less incentive

### LENS Token (Chosen)
- **Pros**: Simple, aligned incentives, governance ready
- **Cons**: Volatility, regulatory considerations

## Consequences

### Positive
- Aligned incentives for all participants
- Governance capability
- Revenue sharing with providers
- Gasless UX for users

### Negative
- Regulatory considerations
- Token volatility
- Need to manage token supply

## References

- [Uniswap UNI Token](https://uniswap.org/blog/uni)
- [Aave AAVE Token](https://aave.com/aave/)
- [Gelato Network](https://www.gelato.network/)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)
