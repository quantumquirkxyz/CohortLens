// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title LensToken
/// @notice LENS ERC20 utility token. The full 1B supply is minted to the
///         deployer at construction; mint() is capped so no more can ever be
///         created beyond MAX_SUPPLY (ADR 005).
contract LensToken is ERC20, Ownable {
    /// @dev 1,000,000,000 LENS with 18 decimals.
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;

    constructor() ERC20("Lens Token", "LENS") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }

    /// @notice Mint new LENS tokens, only up to the hard supply cap.
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "LensToken: max supply exceeded");
        _mint(to, amount);
    }
}
