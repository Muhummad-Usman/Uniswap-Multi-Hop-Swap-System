// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV3Router.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IQuoterV2.sol";

contract UniswapMultihopSwapper {
    address public owner;

    // Uniswap V2 addresses (Sepolia)
    address public constant UNISWAP_V2_ROUTER =
        0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
    address public constant UNISWAP_V2_FACTORY =
        0x7E0987E5b3a30e3f2828572Bb659A548460a3003;

    // Uniswap V3 addresses (Sepolia)
    address public constant UNISWAP_V3_ROUTER =
        0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
    address public constant UNISWAP_V3_QUOTER =
        0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3;

    // Common tokens for routing
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // WETH on Sepolia
    address public constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC on Sepolia

    enum SwapVersion {
        V2,
        V3
    }

    event SwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        SwapVersion version
    );

    event PathFound(address[] path, SwapVersion version);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Main swap function - user only specifies input/output tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input token to swap
     * @param version Uniswap version to use (V2 or V3)
     * @param deadline Transaction deadline
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        SwapVersion version,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline passed");

        // Transfer tokens from user to contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve router to spend tokens
        IERC20(tokenIn).approve(
            version == SwapVersion.V2 ? UNISWAP_V2_ROUTER : UNISWAP_V3_ROUTER,
            amountIn
        );

        // Find optimal path and execute swap
        if (version == SwapVersion.V2) {
            amountOut = _swapV2(tokenIn, tokenOut, amountIn, deadline);
        } else {
            amountOut = _swapV3(tokenIn, tokenOut, amountIn, deadline);
        }

        // Transfer output tokens to user
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            version
        );
    }

    /**
     * @dev Uniswap V2 swap with automated path finding
     */
    function _swapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 deadline
    ) internal returns (uint256) {
        // Find optimal path
        address[] memory path = _findV2Path(tokenIn, tokenOut);
        require(path.length >= 2, "No path found");

        emit PathFound(path, SwapVersion.V2);

        // Get minimum amount out (slippage protection)
        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .getAmountsOut(amountIn, path);
        uint256 amountOutMin = amounts[amounts.length - 1];

        // Execute swap
        uint256[] memory swapAmounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .swapExactTokensForTokens(
                amountIn,
                (amountOutMin * 99) / 100, // 1% slippage tolerance
                path,
                address(this),
                deadline
            );

        return swapAmounts[swapAmounts.length - 1];
    }

    /**
     * @dev Uniswap V3 swap with automated path finding
     */
    function _swapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 deadline
    ) internal returns (uint256) {
        // Find optimal path and fee
        (bytes memory path, uint24 fee) = _findV3Path(tokenIn, tokenOut);
        require(path.length > 0, "No path found");

        // Create swap parameters
        ExactInputParams memory params = ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0 // We'll calculate this after getting quote
        });

        // Get quote for minimum output
        QuoteExactInputParams memory quoteParams = QuoteExactInputParams({
            path: path,
            amountIn: amountIn
        });
        (uint256 amountOutQuote, , , ) = IQuoterV2(UNISWAP_V3_QUOTER)
            .quoteExactInput(quoteParams);

        // Update minimum amount with slippage protection
        params.amountOutMinimum = (amountOutQuote * 99) / 100; // 1% slippage

        // Execute swap
        uint256 amountOut = IUniswapV3Router(UNISWAP_V3_ROUTER).exactInput(
            params
        );

        return amountOut;
    }

    /**
     * @dev Find optimal path for Uniswap V2
     * This is a simplified version - in production you'd use a more sophisticated algorithm
     */
    function _findV2Path(
        address tokenIn,
        address tokenOut
    ) internal view returns (address[] memory) {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY);

        // Check direct pair
        address directPair = factory.getPair(tokenIn, tokenOut);
        if (directPair != address(0)) {
            address[] memory directPath = new address[](2);
            directPath[0] = tokenIn;
            directPath[1] = tokenOut;
            return directPath;
        }

        // Check pair via WETH
        address pairInWETH = factory.getPair(tokenIn, WETH);
        address pairOutWETH = factory.getPair(WETH, tokenOut);

        if (pairInWETH != address(0) && pairOutWETH != address(0)) {
            address[] memory wethPath = new address[](3);
            wethPath[0] = tokenIn;
            wethPath[1] = WETH;
            wethPath[2] = tokenOut;
            return wethPath;
        }

        // Check pair via USDC
        address pairInUSDC = factory.getPair(tokenIn, USDC);
        address pairOutUSDC = factory.getPair(USDC, tokenOut);

        if (pairInUSDC != address(0) && pairOutUSDC != address(0)) {
            address[] memory usdcPath = new address[](3);
            usdcPath[0] = tokenIn;
            usdcPath[1] = USDC;
            usdcPath[2] = tokenOut;
            return usdcPath;
        }

        // If no path found, return empty array
        return new address[](0);
    }

    /**
     * @dev Find optimal path for Uniswap V3
     * Simplified version - assumes WETH as intermediary
     */
    function _findV3Path(
        address tokenIn,
        address tokenOut
    ) internal pure returns (bytes memory path, uint24 fee) {
        // In production, you would check multiple fee tiers and routes
        // Here we use a common path through WETH with 0.3% fee

        if (tokenIn == tokenOut) {
            return (path, 0);
        }

        // Use 0.3% fee as default
        fee = 3000;

        // Build path: tokenIn -> WETH -> tokenOut
        path = abi.encodePacked(tokenIn, fee, WETH, fee, tokenOut);

        return (path, fee);
    }

    /**
     * @dev Estimate output amount for a swap
     */
    function estimateSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        SwapVersion version
    ) external returns (uint256 estimatedAmount) {
        if (version == SwapVersion.V2) {
            address[] memory path = _findV2Path(tokenIn, tokenOut);
            require(path.length >= 2, "No V2 path found");

            uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
                .getAmountsOut(amountIn, path);
            estimatedAmount = amounts[amounts.length - 1];
        } else {
            (bytes memory path, ) = _findV3Path(tokenIn, tokenOut);
            require(path.length > 0, "No V3 path found");

            QuoteExactInputParams memory params = QuoteExactInputParams({
                path: path,
                amountIn: amountIn
            });

            (estimatedAmount, , , ) = IQuoterV2(UNISWAP_V3_QUOTER)
                .quoteExactInput(params);
        }
    }

    /**
     * @dev Rescue tokens sent by mistake
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
