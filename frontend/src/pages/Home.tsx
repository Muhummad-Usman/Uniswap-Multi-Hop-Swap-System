import React from 'react';
import { WalletConnection } from '../components/SimpleWalletConnection';
import { SwapInterface } from '../components/EnhancedSwapInterface';
import { OwnerPanel } from '../components/SimpleOwnerPanel';
import { useApp } from '../context/AppContext';

export function Home() {
  const { state, walletService } = useApp();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Uniswap Multihop Swapper
            </h1>
            <p className="text-gray-600">
              Swap tokens seamlessly between Uniswap V2 and V3 on Sepolia Testnet
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contract: <a href="https://sepolia.etherscan.io/address/0xFCa06Dd79f316277551fa391827f25Ffb797e5F1" 
                         target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-800 underline">
                0xFCa06Dd79f316277551fa391827f25Ffb797e5F1
              </a>
            </p>
          </header>

          <div className="card mb-6">
            <WalletConnection />
          </div>

          <div className="card mb-6">
            <SwapInterface />
          </div>

          <div className="card">
            <OwnerPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
