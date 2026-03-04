import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TOKENS } from '../constants/contracts';

export function SwapInterface() {
  const { state, dispatch, swapperService, walletService } = useApp();
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // Auto-estimate when amount or tokens change
    if (state.amountIn && state.selectedTokenIn && state.selectedTokenOut) {
      handleEstimate();
    } else {
      dispatch({ type: 'SET_AMOUNT_OUT', payload: '' });
      dispatch({ type: 'SET_ESTIMATE_ERROR', payload: null });
    }
  }, [state.amountIn, state.selectedTokenIn, state.selectedTokenOut, state.swapVersion]);

  const handleEstimate = async () => {
    if (!state.amountIn || parseFloat(state.amountIn) <= 0) return;

    dispatch({ type: 'SET_ESTIMATING', payload: true });
    dispatch({ type: 'SET_ESTIMATE_ERROR', payload: null });

    try {
      const result = await swapperService.estimateSwap(
        state.selectedTokenIn,
        state.selectedTokenOut,
        state.amountIn,
        state.swapVersion
      );
      dispatch({ type: 'SET_AMOUNT_OUT', payload: result.estimatedAmount });
    } catch (error: any) {
      console.error('Estimation failed:', error);
      dispatch({ 
        type: 'SET_ESTIMATE_ERROR', 
        payload: error.message || 'Failed to estimate swap' 
      });
      dispatch({ type: 'SET_AMOUNT_OUT', payload: '' });
    } finally {
      dispatch({ type: 'SET_ESTIMATING', payload: false });
    }
  };

  const handleSwap = async () => {
    if (!state.amountIn || !state.amountOut) return;

    // Validate inputs
    if (parseFloat(state.amountIn) <= 0) {
      dispatch({ type: 'SET_SWAP_ERROR', payload: 'Amount must be greater than 0' });
      return;
    }

    const tokenInBalance = state.tokenBalances[state.selectedTokenIn] || '0';
    if (parseFloat(tokenInBalance) < parseFloat(state.amountIn)) {
      dispatch({ type: 'SET_SWAP_ERROR', payload: 'Insufficient balance' });
      return;
    }

    if (!walletService.isSepoliaNetwork()) {
      dispatch({ type: 'SET_SWAP_ERROR', payload: 'Please switch to Sepolia network' });
      return;
    }

    dispatch({ type: 'SET_SWAPPING', payload: true });
    dispatch({ type: 'SET_SWAP_ERROR', payload: null });

    try {
      const result = await swapperService.executeSwap(
        state.selectedTokenIn,
        state.selectedTokenOut,
        state.amountIn,
        state.swapVersion,
        state.wallet
      );

      if (result.status === 'success') {
        dispatch({ type: 'SET_LAST_SWAP_RESULT', payload: result });
        dispatch({ type: 'SET_AMOUNT_IN', payload: '' });
        dispatch({ type: 'SET_AMOUNT_OUT', payload: '' });
        
        // Update balances
        Object.values(TOKENS).forEach(token => {
          walletService.getTokenBalance(token.address)
            .then(balance => {
              dispatch({ 
                type: 'SET_TOKEN_BALANCE', 
                payload: { token: token.address, balance } 
              });
            })
            .catch(console.error);
        });
        
        alert(`Swap successful! Transaction: ${result.transactionHash}`);
      } else {
        dispatch({ type: 'SET_SWAP_ERROR', payload: result.error || 'Swap failed' });
      }
    } catch (error: any) {
      console.error('Swap failed:', error);
      dispatch({ 
        type: 'SET_SWAP_ERROR', 
        payload: error.message || 'Swap failed' 
      });
    } finally {
      dispatch({ type: 'SET_SWAPPING', payload: false });
    }
  };

  const handleTokenSwap = () => {
    const tempToken = state.selectedTokenIn;
    dispatch({ type: 'SET_SELECTED_TOKEN_IN', payload: state.selectedTokenOut });
    dispatch({ type: 'SET_SELECTED_TOKEN_OUT', payload: tempToken });
  };

  const getTokenInfo = (address: string) => {
    return Object.values(TOKENS).find(token => token.address === address);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Swap Tokens</h2>
        
        {/* Swap Version Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Swap Version
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => dispatch({ type: 'SET_SWAP_VERSION', payload: 0 })}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                state.swapVersion === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Uniswap V2
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SWAP_VERSION', payload: 1 })}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                state.swapVersion === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Uniswap V3
            </button>
          </div>
        </div>

        {/* Token Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="flex space-x-2">
              <select
                value={state.selectedTokenIn}
                onChange={(e) => dispatch({ type: 'SET_SELECTED_TOKEN_IN', payload: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TOKENS).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={state.amountIn}
                onChange={(e) => dispatch({ type: 'SET_AMOUNT_IN', payload: e.target.value })}
                placeholder="0.0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Balance: {state.tokenBalances[state.selectedTokenIn] || '0'} {getTokenInfo(state.selectedTokenIn)?.symbol}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleTokenSwap}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="flex space-x-2">
              <select
                value={state.selectedTokenOut}
                onChange={(e) => dispatch({ type: 'SET_SELECTED_TOKEN_OUT', payload: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TOKENS).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={state.amountOut}
                readOnly
                placeholder="0.0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Balance: {state.tokenBalances[state.selectedTokenOut] || '0'} {getTokenInfo(state.selectedTokenOut)?.symbol}
            </p>
          </div>
        </div>

        {/* Error Messages */}
        {state.estimateError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{state.estimateError}</p>
          </div>
        )}

        {state.swapError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{state.swapError}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={
            !state.amountIn || 
            !state.amountOut || 
            state.isSwapping || 
            state.isEstimating ||
            !walletService.isSepoliaNetwork()
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          {state.isSwapping ? 'Swapping...' : state.isEstimating ? 'Estimating...' : 'Swap'}
        </button>

        {/* Last Swap Result */}
        {state.lastSwapResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Swap Successful!</h3>
            <p className="text-sm text-green-700">
              Transaction Hash: {state.lastSwapResult.transactionHash}
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${state.lastSwapResult.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
