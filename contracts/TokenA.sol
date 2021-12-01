//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenA
 */
contract TokenA is ERC20, Ownable{

    constructor() ERC20("TokenA", "TKNA"){

    }

    //mintable, owner can mint more tokens if he wishes to
    function mint(address account, uint256 amount) public onlyOwner{
        _mint(account, amount);
    }
}
