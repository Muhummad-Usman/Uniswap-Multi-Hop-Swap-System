// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct QuoteExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint24 fee;
    uint160 sqrtPriceLimitX96;
}

struct QuoteExactInputParams {
    bytes path;
    uint256 amountIn;
}

interface IQuoterV2 {
    function quoteExactInputSingle(
        QuoteExactInputSingleParams memory params
    )
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );

    function quoteExactInput(
        QuoteExactInputParams memory params
    )
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
}
