import React, { useState } from 'react';
import { TOKENS } from '../constants/contracts';

export function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState('Unknown');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
        
        // Get network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setNetwork(chainId === '0xaa36a7' ? 'Sepolia' : 'Wrong Network');
        
        // Try to get balance
        try {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          setBalance((parseInt(balanceWei, 16) / 1e18).toFixed(4));
        } catch (balanceError) {
          console.warn('Could not fetch balance:', balanceError);
          setBalance('0');
        }
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.message?.includes('User rejected')) {
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
    setWalletConnected(false);
    setAccount(null);
    setBalance('0');
    setNetwork('Unknown');
  };

  const handleSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      setNetwork('Sepolia');
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          setNetwork('Sepolia');
        } catch (addError) {
          alert('Failed to add Sepolia network');
        }
      } else {
        alert('Failed to switch to Sepolia network');
      }
    }
  };

  if (!walletConnected) {
    return (
      <div className="text-center">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn btn-primary disabled:bg-gray-400"
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
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ETH Balance</p>
          <p className="font-semibold">{balance} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Network</p>
          <p className={`font-semibold ${network === 'Sepolia' ? 'text-green-600' : 'text-red-600'}`}>
            {network}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {network !== 'Sepolia' && (
          <button
            onClick={handleSwitchNetwork}
            className="btn btn-warning"
          >
            Switch to Sepolia
          </button>
        )}
        <button
          onClick={handleDisconnect}
          className="btn btn-danger"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
