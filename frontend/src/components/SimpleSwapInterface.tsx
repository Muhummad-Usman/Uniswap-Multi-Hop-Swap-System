import React, { useState } from 'react';
import { TOKENS } from '../constants/contracts';

export function SwapInterface() {
  const [selectedTokenIn, setSelectedTokenIn] = useState(TOKENS.WETH.address);
  const [selectedTokenOut, setSelectedTokenOut] = useState(TOKENS.USDC.address);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [swapVersion, setSwapVersion] = useState(0); // V2
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;

    setIsEstimating(true);
    setEstimateError(null);

    try {
      // Mock estimation for demo purposes
      // In a real app, this would call the smart contract
      const mockRate = selectedTokenIn === TOKENS.WETH.address ? 2000 : 1;
      const estimated = (parseFloat(amountIn) * mockRate).toFixed(6);
      setAmountOut(estimated);
    } catch (error: any) {
      console.error('Estimation failed:', error);
      setEstimateError('Failed to estimate swap');
      setAmountOut('');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSwap = async () => {
    if (!amountIn || !amountOut) return;

    if (parseFloat(amountIn) <= 0) {
      setSwapError('Amount must be greater than 0');
      return;
    }

    setIsSwapping(true);
    setSwapError(null);

    try {
      // Mock swap for demo purposes
      // In a real app, this would call the smart contract
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Swap successful! Mock transaction executed.`);
      setAmountIn('');
      setAmountOut('');
    } catch (error: any) {
      console.error('Swap failed:', error);
      setSwapError('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleTokenSwap = () => {
    const tempToken = selectedTokenIn;
    setSelectedTokenIn(selectedTokenOut);
    setSelectedTokenOut(tempToken);
    setAmountIn('');
    setAmountOut('');
  };

  const getTokenInfo = (address: string) => {
    return Object.values(TOKENS).find(token => token.address === address);
  };

  React.useEffect(() => {
    if (amountIn) {
      handleEstimate();
    } else {
      setAmountOut('');
      setEstimateError(null);
    }
  }, [amountIn, selectedTokenIn, selectedTokenOut]);

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
              onClick={() => setSwapVersion(0)}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                swapVersion === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Uniswap V2
            </button>
            <button
              onClick={() => setSwapVersion(1)}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                swapVersion === 1
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
                value={selectedTokenIn}
                onChange={(e) => setSelectedTokenIn(e.target.value)}
                className="form-select"
              >
                {Object.values(TOKENS).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="form-input"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Balance: 0.0 {getTokenInfo(selectedTokenIn)?.symbol}
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
                value={selectedTokenOut}
                onChange={(e) => setSelectedTokenOut(e.target.value)}
                className="form-select"
              >
                {Object.values(TOKENS).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={amountOut}
                readOnly
                placeholder="0.0"
                className="form-input bg-gray-50"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Balance: 0.0 {getTokenInfo(selectedTokenOut)?.symbol}
            </p>
          </div>
        </div>

        {/* Error Messages */}
        {estimateError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{estimateError}</p>
          </div>
        )}

        {swapError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{swapError}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!amountIn || !amountOut || isSwapping || isEstimating}
          className="w-full btn btn-primary disabled:bg-gray-400"
        >
          {isSwapping ? 'Swapping...' : isEstimating ? 'Estimating...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}
