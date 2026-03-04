import React, { useState } from 'react';
import { TOKENS } from '../constants/contracts';

export function OwnerPanel() {
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
      // Mock rescue for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Tokens rescued successfully! Mock transaction executed.`);
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
        // Mock transfer for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`Ownership transferred successfully! Mock transaction executed.`);
        setNewOwner('');
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
                className="form-select"
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
                className="form-input"
              />
            </div>
            
            <button
              onClick={handleRescueTokens}
              disabled={isRescuing || !rescueAmount}
              className="w-full btn btn-warning disabled:bg-gray-400"
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
                className="form-input"
              />
            </div>
            
            <button
              onClick={handleTransferOwnership}
              disabled={isTransferring || !newOwner}
              className="w-full btn btn-danger disabled:bg-gray-400"
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
              <span className="font-mono">Connected Account</span>
            </p>
            <p className="text-gray-600">
              Only the contract owner can perform these functions. Use them responsibly.
            </p>
            <p className="text-gray-600">
              <strong>Note:</strong> This is a demo interface. Actual contract interactions require deployment to Sepolia testnet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
