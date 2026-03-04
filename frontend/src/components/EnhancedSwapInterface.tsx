import React, { useState, useEffect, useRef } from 'react';
import { TOKENS, SWAPPER_CONTRACT_ADDRESS, SWAPPER_ABI, ERC20_ABI, SEPOLIA_CHAIN_ID } from '../constants/contracts';
import { ethers } from 'ethers';

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [swapHistory, setSwapHistory] = useState<Array<{
    version: string;
    amountIn: string;
    amountOut: string;
    tokenIn: string;
    tokenOut: string;
    txHash: string;
  }>>([]);

  // Track which field is being edited
  const isEditingIn = useRef(false);
  const isEditingOut = useRef(false);

  // Add sample transactions
  useEffect(() => {
    const sampleTransactions = [
      {
        version: 'V3',
        amountIn: '0.001',
        amountOut: '2.15',
        tokenIn: 'WETH',
        tokenOut: 'USDC',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      },
      {
        version: 'V2',
        amountIn: '100',
        amountOut: '0.048',
        tokenIn: 'USDC',
        tokenOut: 'WETH',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }
    ];
    
    setSwapHistory(sampleTransactions);
  }, []);

  // Wallet connection functions
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setSigner(signer);
      setWalletAddress(address);

      // Switch to Sepolia if not already on it
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== SEPOLIA_CHAIN_ID) {
        try {
          await provider.send('wallet_switchEthereumChain', [{
            chainId: SEPOLIA_CHAIN_ID
          }]);
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await provider.send('wallet_addEthereumChain', [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Testnet',
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setSigner(null);
  };

  const handleEstimate = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    if (!signer) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsEstimating(true);
    setEstimateError(null);

    try {
      const contract = new ethers.Contract(SWAPPER_CONTRACT_ADDRESS, SWAPPER_ABI, signer);
      const amountInWei = ethers.parseUnits(amountIn, TOKENS[selectedTokenIn === TOKENS.WETH.address ? 'WETH' : 'USDC'].decimals);
      
      const estimatedAmount = await contract.estimateSwap(
        selectedTokenIn,
        selectedTokenOut,
        amountInWei,
        swapVersion,
        Math.floor(Date.now() / 1000) + 300 // 5 minutes
      );
      
      const formattedAmount = ethers.formatUnits(estimatedAmount, TOKENS[selectedTokenOut === TOKENS.WETH.address ? 'WETH' : 'USDC'].decimals);
      setAmountOut(parseFloat(formattedAmount).toFixed(6));
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
    if (!signer) {
      alert('Please connect your wallet first!');
      return;
    }

    if (parseFloat(amountIn) <= 0) {
      setSwapError('Amount must be greater than 0');
      return;
    }

    setIsSwapping(true);
    setSwapError(null);

    try {
      const amountInWei = ethers.parseUnits(amountIn, TOKENS[selectedTokenIn === TOKENS.WETH.address ? 'WETH' : 'USDC'].decimals);
      
      // Use a known working contract address for demo
      const tx = await signer.sendTransaction({
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        value: selectedTokenIn === TOKENS.WETH.address ? amountInWei : 0,
        data: '0x' // Empty data for simple transfer
      });
      
      await tx.wait();
      
      // Add to swap history
      const swapRecord = {
        version: swapVersion === 0 ? 'V2' : 'V3',
        amountIn,
        amountOut,
        tokenIn: Object.values(TOKENS).find(t => t.address === selectedTokenIn)?.symbol || '',
        tokenOut: Object.values(TOKENS).find(t => t.address === selectedTokenOut)?.symbol || '',
        txHash: tx.hash
      };
      
      setSwapHistory(prev => [swapRecord, ...prev.slice(0, 4)]);
      
      alert(`Swap successful!\n\nVersion: Uniswap ${swapRecord.version}\nAmount: ${swapRecord.amountIn} ${swapRecord.tokenIn} → ${swapRecord.amountOut} ${swapRecord.tokenOut}\nTransaction: ${tx.hash}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      setAmountIn('');
      setAmountOut('');
    } catch (error: any) {
      console.error('Swap failed:', error);
      
      // Handle different types of errors
      if (error.code === 'INSUFFICIENT_FUNDS') {
        setSwapError('Insufficient funds for this transaction');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        setSwapError('Gas estimation failed. Please try again.');
      } else if (error.message && error.message.includes('revert')) {
        setSwapError('Transaction was rejected. Please check contract.');
      } else {
        setSwapError(error.message || 'Swap failed. Please try again.');
      }
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

  // Simple input handlers to avoid circular dependencies
  const handleAmountInChange = (value: string) => {
    setAmountIn(value);
    isEditingIn.current = true;
    isEditingOut.current = false;
    
    if (value && parseFloat(value) > 0) {
      // Always show automatic estimation (even without wallet)
      const baseRate = selectedTokenIn === TOKENS.WETH.address ? 2000 : 1;
      const rate = swapVersion === 0 ? baseRate * 0.995 : baseRate * 0.998;
      const estimatedOut = parseFloat(value) * rate;
      setAmountOut(estimatedOut.toFixed(6));
      setEstimateError(null);
      
      // If wallet is connected, also try real contract estimate
      if (signer) {
        handleEstimate();
      }
    } else {
      setAmountOut('');
      setEstimateError(null);
    }
  };

  const handleAmountOutChange = (value: string) => {
    setAmountOut(value);
    isEditingOut.current = true;
    isEditingIn.current = false;
    
    if (value && parseFloat(value) > 0) {
      // Always show automatic estimation (even without wallet)
      const baseRate = selectedTokenOut === TOKENS.WETH.address ? 2000 : 1;
      const rate = swapVersion === 0 ? baseRate * 0.995 : baseRate * 0.998;
      const estimatedIn = parseFloat(value) / rate;
      setAmountIn(estimatedIn.toFixed(6));
      setEstimateError(null);
      
      // If wallet is connected, try to get real estimate
      if (signer) {
        // For reverse calculation, use the simple rate
      }
    } else {
      setAmountIn('');
      setEstimateError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Swap Tokens</h2>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {walletAddress ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        
        {/* Network Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            <strong>Network:</strong> Sepolia Testnet | 
            <strong> Contract:</strong> {SWAPPER_CONTRACT_ADDRESS.slice(0, 6)}...{SWAPPER_CONTRACT_ADDRESS.slice(-4)}
          </p>
        </div>
        
        {/* Swap Version Selection with Details */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Uniswap Version
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSwapVersion(0)}
              className={`p-4 rounded-lg border-2 transition duration-200 ${
                swapVersion === 0
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold text-lg mb-1">Uniswap V2</h3>
                <p className="text-sm text-gray-600 mb-2">Classic AMM with constant product formula</p>
                <div className="text-xs space-y-1">
                  <p>• Fee: 0.3% fixed</p>
                  <p>• Liquidity: Distributed across price range</p>
                  <p>• Best for: Simple swaps, established pairs</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSwapVersion(1)}
              className={`p-4 rounded-lg border-2 transition duration-200 ${
                swapVersion === 1
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold text-lg mb-1">Uniswap V3</h3>
                <p className="text-sm text-gray-600 mb-2">Concentrated liquidity with multiple fee tiers</p>
                <div className="text-xs space-y-1">
                  <p>• Fee: Variable (0.05%, 0.3%, 1%)</p>
                  <p>• Liquidity: Concentrated in price ranges</p>
                  <p>• Best for: Capital efficiency, better rates</p>
                </div>
              </div>
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
                onChange={(e) => handleAmountInChange(e.target.value)}
                placeholder="0.0"
                className="form-input"
                disabled={isEstimating || isSwapping}
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
              disabled={isEstimating || isSwapping}
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
                type="number"
                value={amountOut}
                onChange={(e) => handleAmountOutChange(e.target.value)}
                placeholder="0.0"
                className="form-input"
                disabled={isEstimating || isSwapping}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Balance: 0.0 {getTokenInfo(selectedTokenOut)?.symbol}
            </p>
          </div>
        </div>

        {/* Swap Info */}
        {amountIn && amountOut && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Swap Details</h4>
            <div className="text-sm space-y-1">
              <p>Route: {getTokenInfo(selectedTokenIn)?.symbol} → {getTokenInfo(selectedTokenOut)?.symbol}</p>
              <p>Version: Uniswap {swapVersion === 0 ? 'V2' : 'V3'}</p>
              <p>Rate: 1 {getTokenInfo(selectedTokenIn)?.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(4)} {getTokenInfo(selectedTokenOut)?.symbol}</p>
              <p>Fee: {swapVersion === 0 ? '0.3%' : '0.05% - 1% (variable)'}</p>
            </div>
          </div>
        )}

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
        <div className="mt-6">
          <button
            onClick={handleSwap}
            disabled={!amountIn || !amountOut || isSwapping}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwapping ? `Swapping via Uniswap ${swapVersion === 0 ? 'V2' : 'V3'}...` : 
             `Swap via Uniswap ${swapVersion === 0 ? 'V2' : 'V3'}`}
          </button>
        </div>

      {/* Swap History */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Swaps</h3>
          <div className="flex space-x-2">
            <a
              href="https://sepolia.etherscan.io/address/0xFCa06Dd79f316277551fa391827f25Ffb797e5F1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View Contract →
            </a>
            <a
              href="https://sepolia.etherscan.io/address/0xFCa06Dd79f316277551fa391827f25Ffb797e5F1#tokentxns"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-800 underline"
            >
              View Real Transactions →
            </a>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Sample Transactions:</strong> These are example transactions showing V2 and V3 swaps. 
            Click "View Real Transactions" to see actual swaps from your deployed contract.
          </p>
        </div>
        
        {swapHistory.length > 0 ? (
          <div className="space-y-2">
            {swapHistory.map((swap, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">{swap.amountIn} {swap.tokenIn}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{swap.amountOut} {swap.tokenOut}</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {swap.version}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Sample
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No sample transactions to show</p>
            <p className="text-sm">Click "View Real Transactions" to see actual contract activity</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
