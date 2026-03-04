import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function WalletConnection() {
  const { state, dispatch, walletService } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await walletService.connect();
      
      // Check if on correct network
      if (!walletService.isSepoliaNetwork()) {
        await walletService.switchToSepolia();
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.message?.includes('MetaMask is not installed')) {
        errorMessage = 'MetaMask is not installed. Please install MetaMask to continue.';
      } else if (error.message?.includes('User rejected')) {
        errorMessage = 'Connection rejected by user.';
      } else if (error.message?.includes('Failed to fetch') || error.code === -32603) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
  };

  const handleSwitchNetwork = async () => {
    try {
      await walletService.switchToSepolia();
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch to Sepolia network.');
    }
  };

  if (!state.wallet.isConnected) {
    return (
      <div className="text-center">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Connect your MetaMask wallet to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <p className="text-sm text-gray-500">Connected Account</p>
          <p className="font-mono text-sm">
            {state.wallet.account?.slice(0, 6)}...{state.wallet.account?.slice(-4)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ETH Balance</p>
          <p className="font-semibold">{parseFloat(state.wallet.balance).toFixed(4)} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Network</p>
          <p className={`font-semibold ${walletService.isSepoliaNetwork() ? 'text-green-600' : 'text-red-600'}`}>
            {walletService.isSepoliaNetwork() ? 'Sepolia' : 'Wrong Network'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {!walletService.isSepoliaNetwork() && (
          <button
            onClick={handleSwitchNetwork}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-200"
          >
            Switch to Sepolia
          </button>
        )}
        <button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-200"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
