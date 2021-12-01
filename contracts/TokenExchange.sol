//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title TokenExchange
 */
contract TokenExchange is Ownable{

    using SafeERC20 for IERC20;

    // first token
    IERC20 immutable private _tokenA;
    // second token
    IERC20 immutable private _tokenB;
    // 100 means 100 tokenA == 1 tokenB
    uint256 public price;

    constructor(address tokenA, address tokenB, uint256 price_){
        require(tokenA != address(0x0));
        require(tokenB != address(0x0));
        _tokenA = IERC20(tokenA);
        _tokenB = IERC20(tokenB);
        price = price_;
    }

    function updatePrice(uint256 price_) public onlyOwner{
        price = price_;
    }

    function deposit(address tokenAddress, uint256 amount) public onlyOwner{
        require(tokenAddress == address(_tokenA) || tokenAddress == address(_tokenB),
            "TokenExchange: Wrong token address");

        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }
}
