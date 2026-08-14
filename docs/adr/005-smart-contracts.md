# ADR 005: Smart Contracts for Lenses Oracle and Registry

## Status

Accepted

## Context

CohortLens needs smart contracts for:
- **Lens Registry**: Register available Lenses with metadata and pricing
- **Lens Oracle**: Execute queries against the Capital Flow Graph
- **LENS Token**: ERC20 token for paying queries
- **Staking**: Allow Lens providers to stake LENS

## Decision

Use **Foundry** for development with a modular contract architecture.

### Contract Architecture

```
contracts/
├── src/
│   ├── LensToken.sol          # ERC20 token (LENS)
│   ├── LensRegistry.sol       # Registry of available Lenses
│   ├── LensOracle.sol         # Oracle for executing queries
│   ├── LensStaking.sol        # Staking for Lens providers
│   └── interfaces/
│       ├── ILensRegistry.sol
│       ├── ILensOracle.sol
│       └── ILensStaking.sol
├── test/
│   ├── LensToken.t.sol
│   ├── LensRegistry.t.sol
│   ├── LensOracle.t.sol
│   └── LensStaking.t.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
└── package.json
```

### LensToken.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LensToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1B tokens

    constructor() ERC20("Lens Token", "LENS") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}
```

### LensRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LensRegistry is Ownable {
    struct Lens {
        string name;
        string description;
        address provider;
        uint256 pricePerQuery;
        bool active;
        uint256 createdAt;
    }

    mapping(uint256 => Lens) public lenses;
    uint256 public lensCount;

    event LensRegistered(uint256 indexed lensId, string name, address provider);
    event LensUpdated(uint256 indexed lensId, bool active);

    function registerLens(
        string memory name,
        string memory description,
        uint256 pricePerQuery
    ) external returns (uint256) {
        lensCount++;
        lenses[lensCount] = Lens({
            name: name,
            description: description,
            provider: msg.sender,
            pricePerQuery: pricePerQuery,
            active: true,
            createdAt: block.timestamp
        });

        emit LensRegistered(lensCount, name, msg.sender);
        return lensCount;
    }

    function updateLens(uint256 lensId, bool active) external {
        require(lenses[lensId].provider == msg.sender, "Not provider");
        lenses[lensId].active = active;
        emit LensUpdated(lensId, active);
    }

    function getLens(uint256 lensId) external view returns (Lens memory) {
        require(lenses[lensId].name != "", "Lens not found");
        return lenses[lensId];
    }
}
```

### LensOracle.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILensRegistry.sol";

contract LensOracle is Ownable {
    ILensRegistry public registry;
    IERC20 public lensToken;

    struct Query {
        uint256 lensId;
        bytes params;
        address requester;
        uint256 timestamp;
        bytes result;
        bool executed;
    }

    mapping(bytes32 => Query) public queries;

    event QuerySubmitted(bytes32 indexed queryId, uint256 lensId, address requester);
    event QueryExecuted(bytes32 indexed queryId, bytes result);

    constructor(address _registry, address _lensToken) {
        registry = ILensRegistry(_registry);
        lensToken = IERC20(_lensToken);
    }

    function submitQuery(
        uint256 lensId,
        bytes memory params
    ) external returns (bytes32 queryId) {
        ILensRegistry.Lens memory lens = registry.getLens(lensId);
        require(lens.active, "Lens not active");

        // Transfer LENS from requester
        lensToken.transferFrom(msg.sender, address(this), lens.pricePerQuery);

        queryId = keccak256(abi.encodePacked(lensId, params, msg.sender, block.timestamp));
        queries[queryId] = Query({
            lensId: lensId,
            params: params,
            requester: msg.sender,
            timestamp: block.timestamp,
            result: "",
            executed: false
        });

        emit QuerySubmitted(queryId, lensId, msg.sender);
    }

    function executeQuery(
        bytes32 queryId,
        bytes memory result
    ) external {
        Query storage query = queries[queryId];
        require(!query.executed, "Already executed");
        require(
            lensToken.balanceOf(query.requester) > 0,
            "Requester not found"
        );

        query.result = result;
        query.executed = true;

        // Pay Lens provider
        ILensRegistry.Lens memory lens = registry.getLens(query.lensId);
        lensToken.transfer(lens.provider, lens.pricePerQuery);

        emit QueryExecuted(queryId, result);
    }
}
```

### LensStaking.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LensStaking is Ownable {
    IERC20 public lensToken;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 rewards;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRate = 5; // 5% APY

    event Staked(address indexed provider, uint256 amount);
    event Withdrawn(address indexed provider, uint256 amount);

    constructor(address _lensToken) {
        lensToken = IERC20(_lensToken);
    }

    function stake(uint256 amount) external {
        lensToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].stakedAt = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        lensToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external {
        StakeInfo storage stake = stakes[msg.sender];
        uint256 rewards = calculateRewards(msg.sender);
        stake.rewards = 0;
        lensToken.transfer(msg.sender, rewards);
    }

    function calculateRewards(address provider) public view returns (uint256) {
        StakeInfo memory stake = stakes[provider];
        uint256 duration = block.timestamp - stake.stakedAt;
        return (stake.amount * rewardRate * duration) / (365 days * 100);
    }
}
```

## Alternatives Considered

### Chainlink Oracle
- **Pros**: Decentralized, battle-tested
- **Cons**: Overkill for internal queries, requires LINK tokens

### Band Protocol
- **Pros**: Cheaper than Chainlink
- **Cons**: Less mature, smaller ecosystem

### Custom Oracle (Chosen)
- **Pros**: Full control, no external dependencies, simpler
- **Cons**: Centralized, requires trust in Lens providers

## Consequences

### Positive
- Full control over query execution
- No external oracle costs
- Simple staking mechanism
- Easy to extend with new features

### Negative
- Centralized (Lens providers are trusted)
- Need to manage LENS token distribution
- Gas costs for on-chain queries

## References

- [OpenZeppelin Contracts](https://www.openzeppelin.com/contracts)
- [Foundry Book](https://book.getfoundry.sh/)
- [Chainlink Oracle](https://docs.chain.link/)
