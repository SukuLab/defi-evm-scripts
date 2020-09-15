import { kovanNetworkConfig } from './kovan';
import { Contract} from 'ethers'

// Import Contract ABIs
import ERC20_ABI from '../abis/ERC20.abi.json';
import CERC20_ABI from '../abis/CErc20Immutable.abi.json';
import Comptroller_ABI from '../abis/Comptroller.abi.json';
import SimplePriceOracle_ABI from '../abis/SimplePriceOracle.abi.json';

// Import Contract Types
import { CErc20ImmutableAbi } from '../types/CErc20ImmutableAbi';
import { Erc20Abi } from '../types/Erc20Abi';
import { ComptrollerAbi } from '../types/ComptrollerAbi';
import { SimplePriceOracleAbi } from '../types/SimplePriceOracleAbi';


export const Networks = {
  MainNet: 1,
  Ropsten: 3,
  Rinkeby: 4,
  Goerli: 5,
  Kovan: 42,
};

export interface ContractAddress { 
  address: string; 
}

export interface ContractDetails<C extends Contract>{
  abi: {};
  contract: C;
}

/**
 * Using generic here to keep the shape the same, but allow different properties
 * between two objects. 
 */
export interface NetworkConfig<T> {
  unitroller: T;
  USDC: T;
  cUSDC: T
  SUKU: T;
  cSUKU: T
  priceOracle?: T; 
  comptroller?: T;
  governorAlpha?: T;
  maximillion?: T;
  timelock?: T;
  /**
   * Interest Rate Model
   * 500bps per year
   * 1200pbs multiplier per year
   */
  Base500bps_Slope1200bps?: T;
}


export const CONTRACTS_BY_NETWORK: {
  [key: number]: NetworkConfig<ContractAddress>;
} = {
  // [Networks.MainNet]: mainnetNetworkConfig
  [Networks.Kovan]: kovanNetworkConfig,
};

/**
 * Find if a specified chainId is supported by the configuration
 * 
 * @param chainId 
 */
export const getConfigByNetwork = (chainId: number): NetworkConfig<ContractAddress> | undefined => {
  return CONTRACTS_BY_NETWORK[chainId]
}


export const shorter = (str: string) =>
  str?.length > 8 ? str.slice(0, 6) + '...' + str.slice(-4) : str;
