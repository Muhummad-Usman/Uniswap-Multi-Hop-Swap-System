import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WalletService, WalletState } from '../services/wallet';
import { SwapperService } from '../services/swapper';
import { TOKENS } from '../constants/contracts';

interface AppState {
  wallet: WalletState;
  tokenBalances: { [key: string]: string };
  selectedTokenIn: string;
  selectedTokenOut: string;
  amountIn: string;
  amountOut: string;
  swapVersion: number;
  isEstimating: boolean;
  isSwapping: boolean;
  estimateError: string | null;
  swapError: string | null;
  lastSwapResult: any | null;
  isOwner: boolean;
}

type AppAction =
  | { type: 'SET_WALLET'; payload: WalletState }
  | { type: 'SET_TOKEN_BALANCE'; payload: { token: string; balance: string } }
  | { type: 'SET_SELECTED_TOKEN_IN'; payload: string }
  | { type: 'SET_SELECTED_TOKEN_OUT'; payload: string }
  | { type: 'SET_AMOUNT_IN'; payload: string }
  | { type: 'SET_AMOUNT_OUT'; payload: string }
  | { type: 'SET_SWAP_VERSION'; payload: number }
  | { type: 'SET_ESTIMATING'; payload: boolean }
  | { type: 'SET_SWAPPING'; payload: boolean }
  | { type: 'SET_ESTIMATE_ERROR'; payload: string | null }
  | { type: 'SET_SWAP_ERROR'; payload: string | null }
  | { type: 'SET_LAST_SWAP_RESULT'; payload: any }
  | { type: 'SET_IS_OWNER'; payload: boolean };

const initialState: AppState = {
  wallet: {
    isConnected: false,
    account: null,
    balance: '0',
    chainId: null,
    provider: null,
    signer: null,
  },
  tokenBalances: {},
  selectedTokenIn: TOKENS.WETH.address,
  selectedTokenOut: TOKENS.USDC.address,
  amountIn: '',
  amountOut: '',
  swapVersion: 0, // V2
  isEstimating: false,
  isSwapping: false,
  estimateError: null,
  swapError: null,
  lastSwapResult: null,
  isOwner: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WALLET':
      return { ...state, wallet: action.payload };
    case 'SET_TOKEN_BALANCE':
      return {
        ...state,
        tokenBalances: {
          ...state.tokenBalances,
          [action.payload.token]: action.payload.balance,
        },
      };
    case 'SET_SELECTED_TOKEN_IN':
      return { ...state, selectedTokenIn: action.payload };
    case 'SET_SELECTED_TOKEN_OUT':
      return { ...state, selectedTokenOut: action.payload };
    case 'SET_AMOUNT_IN':
      return { ...state, amountIn: action.payload };
    case 'SET_AMOUNT_OUT':
      return { ...state, amountOut: action.payload };
    case 'SET_SWAP_VERSION':
      return { ...state, swapVersion: action.payload };
    case 'SET_ESTIMATING':
      return { ...state, isEstimating: action.payload };
    case 'SET_SWAPPING':
      return { ...state, isSwapping: action.payload };
    case 'SET_ESTIMATE_ERROR':
      return { ...state, estimateError: action.payload };
    case 'SET_SWAP_ERROR':
      return { ...state, swapError: action.payload };
    case 'SET_LAST_SWAP_RESULT':
      return { ...state, lastSwapResult: action.payload };
    case 'SET_IS_OWNER':
      return { ...state, isOwner: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  walletService: WalletService;
  swapperService: SwapperService;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const walletService = new WalletService();
  const swapperService = new SwapperService();

  useEffect(() => {
    const unsubscribe = walletService.subscribe((walletState) => {
      dispatch({ type: 'SET_WALLET', payload: walletState });
      
      // Initialize contract when wallet is connected
      if (walletState.signer) {
        swapperService.initializeContract(walletState.signer);
        
        // Check if connected account is the owner
        swapperService.getOwner()
          .then(owner => {
            dispatch({ 
              type: 'SET_IS_OWNER', 
              payload: owner.toLowerCase() === walletState.account?.toLowerCase() 
            });
          })
          .catch(console.error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update token balances when wallet is connected
    if (state.wallet.isConnected && state.wallet.account) {
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
    }
  }, [state.wallet.isConnected, state.wallet.account]);

  return (
    <AppContext.Provider value={{ state, dispatch, walletService, swapperService }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
