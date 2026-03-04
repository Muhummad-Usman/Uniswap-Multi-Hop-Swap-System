import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TOKENS } from '../constants/contracts';

export function OwnerPanel() {
  const { state, dispatch, swapperService } = useApp();
  const [rescueToken, setRescueToken] = useState(TOKENS.WETH.address);
  const [rescueAmount, setRescueAmount] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [isRescuing, setIsRescuing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleRescueTokens = async () => {
    if (!rescueAmount || parseFloat(rescueAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsRescuing(true);
    try {
      const txHash = await swapperService.rescueTokens(rescueToken, rescueAmount, state.wallet);
      alert(`Tokens rescued successfully! Transaction: ${txHash}`);
      setRescueAmount('');
    } catch (error: any) {
      console.error('Rescue failed:', error);
      alert(`Rescue failed: ${error.message}`);
    } finally {
      setIsRescuing(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwner || !newOwner.startsWith('0x') || newOwner.length !== 42) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    if (window.confirm('Are you sure you want to transfer ownership? This action cannot be undone.')) {
      setIsTransferring(true);
      try {
        const txHash = await swapperService.transferOwnership(newOwner, state.wallet);
        alert(`Ownership transferred successfully! Transaction: ${txHash}`);
        setNewOwner('');
        dispatch({ type: 'SET_IS_OWNER', payload: false });
      } catch (error: any) {
        console.error('Transfer failed:', error);
        alert(`Transfer failed: ${error.message}`);
      } finally {
        setIsTransferring(false);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Owner Functions</h2>
      
      <div className="space-y-8">
        {/* Rescue Tokens */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rescue Tokens</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token to Rescue
              </label>
              <select
                value={rescueToken}
                onChange={(e) => setRescueToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TOKENS).map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={rescueAmount}
                onChange={(e) => setRescueAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleRescueTokens}
              disabled={isRescuing || !rescueAmount}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {isRescuing ? 'Rescuing...' : 'Rescue Tokens'}
            </button>
          </div>
        </div>

        {/* Transfer Ownership */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer Ownership</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Owner Address
              </label>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleTransferOwnership}
              disabled={isTransferring || !newOwner}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </div>

        {/* Contract Info */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contract Information</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Current Owner:</span>{' '}
              <span className="font-mono">{state.wallet.account}</span>
            </p>
            <p className="text-gray-600">
              Only the contract owner can perform these functions. Use them responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
