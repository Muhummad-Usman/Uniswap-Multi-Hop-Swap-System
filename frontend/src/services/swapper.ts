import { ethers } from 'ethers';
import { SWAPPER_CONTRACT_ADDRESS, SWAPPER_ABI, ERC20_ABI } from '../constants/contracts';
import { WalletState } from './wallet';

export interface SwapEstimate {
  estimatedAmount: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  version: number;
}

export interface SwapResult {
  transactionHash: string;
  amountOut: string;
  status: 'success' | 'failed';
  error?: string;
}

export class SwapperService {
  private contract: ethers.Contract | null = null;

  initializeContract(signer: ethers.JsonRpcSigner) {
    this.contract = new ethers.Contract(SWAPPER_CONTRACT_ADDRESS, SWAPPER_ABI, signer);
  }

  async estimateSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    version: number
  ): Promise<SwapEstimate> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const amountInWei = ethers.parseEther(amountIn);
      const estimatedAmount = await this.contract.estimateSwap(tokenIn, tokenOut, amountInWei, version);
      
      return {
        estimatedAmount: ethers.formatEther(estimatedAmount),
        tokenIn,
        tokenOut,
        amountIn,
        version,
      };
    } catch (error) {
      console.error('Swap estimation failed:', error);
      throw error;
    }
  }

  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    version: number,
    walletState: WalletState
  ): Promise<SwapResult> {
    if (!this.contract || !walletState.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const amountInWei = ethers.parseEther(amountIn);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // First approve the contract to spend the token
      if (tokenIn !== ethers.ZeroAddress) {
        const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, walletState.signer);
        const approveTx = await tokenContract.approve(SWAPPER_CONTRACT_ADDRESS, amountInWei);
        await approveTx.wait();
      }

      // Execute the swap
      const swapTx = await this.contract.swap(tokenIn, tokenOut, amountInWei, version, deadline);
      const receipt = await swapTx.wait();

      // Get the amount out from the event or receipt
      let amountOut = '0';
      if (receipt && receipt.logs) {
        // Parse the SwapExecuted event to get the amountOut
        try {
          const event = this.contract.interface.parseLog({
            topics: receipt.logs[receipt.logs.length - 1].topics,
            data: receipt.logs[receipt.logs.length - 1].data,
          });
          if (event && event.args) {
            amountOut = ethers.formatEther(event.args.amountOut);
          }
        } catch (parseError) {
          console.warn('Could not parse swap event:', parseError);
        }
      }

      return {
        transactionHash: swapTx.hash,
        amountOut,
        status: 'success',
      };
    } catch (error) {
      console.error('Swap execution failed:', error);
      return {
        transactionHash: '',
        amountOut: '0',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getOwner(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return await this.contract.owner();
  }

  async rescueTokens(token: string, amount: string, walletState: WalletState): Promise<string> {
    if (!this.contract || !walletState.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const amountWei = ethers.parseEther(amount);
    const tx = await this.contract.rescueTokens(token, amountWei);
    const receipt = await tx.wait();
    return tx.hash;
  }

  async transferOwnership(newOwner: string, walletState: WalletState): Promise<string> {
    if (!this.contract || !walletState.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const tx = await this.contract.transferOwnership(newOwner);
    const receipt = await tx.wait();
    return tx.hash;
  }
}
