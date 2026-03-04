import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URL } from '../constants/contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export interface TokenBalance {
  [tokenAddress: string]: string;
}

export class WalletService {
  private state: WalletState = {
    isConnected: false,
    account: null,
    balance: '0',
    chainId: null,
    provider: null,
    signer: null,
  };

  private listeners: ((state: WalletState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      this.updateState({ account: accounts[0] });
      this.updateBalance();
    }
  }

  private handleChainChanged(chainId: string) {
    this.updateState({ chainId });
    this.updateBalance();
  }

  private updateState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  async connect(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      // Try to get balance with retry logic
      let balance = '0';
      try {
        balance = ethers.formatEther(await provider.getBalance(account));
      } catch (balanceError) {
        console.warn('Could not fetch balance, using default:', balanceError);
        balance = '0';
      }
      
      const network = await provider.getNetwork();
      const chainId = ethers.toBeHex(network.chainId);

      this.updateState({
        isConnected: true,
        account,
        balance,
        chainId,
        provider,
        signer,
      });

      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async switchToSepolia(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                rpcUrls: [SEPOLIA_RPC_URL],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw addError;
        }
      }
      console.error('Failed to switch to Sepolia:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress: string): Promise<string> {
    if (!this.state.provider || !this.state.account) {
      throw new Error('Wallet not connected');
    }

    const tokenContract = new ethers.Contract(tokenAddress, [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ], this.state.provider);

    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(this.state.account),
      tokenContract.decimals(),
    ]);

    return ethers.formatUnits(balance, decimals);
  }

  async updateBalance(): Promise<void> {
    if (!this.state.provider || !this.state.account) return;

    try {
      const balance = ethers.formatEther(await this.state.provider.getBalance(this.state.account));
      this.updateState({ balance });
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  }

  disconnect(): void {
    this.updateState({
      isConnected: false,
      account: null,
      balance: '0',
      chainId: null,
      provider: null,
      signer: null,
    });
  }

  getState(): WalletState {
    return { ...this.state };
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isSepoliaNetwork(): boolean {
    return this.state.chainId === SEPOLIA_CHAIN_ID;
  }
}
