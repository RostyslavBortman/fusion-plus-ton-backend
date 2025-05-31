export enum CHAIN_MODE {
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

export enum CHAIN_TYPE {
  EVM = 'evm',
  TON = 'ton',
}

// Simple utility functions to determine chain type
export function isTonChain(chainId: string): boolean {
  const numericChainId = parseInt(chainId, 10);
  return !isNaN(numericChainId) && numericChainId < 0;
}

export function isEvmChain(chainId: string): boolean {
  const numericChainId = parseInt(chainId, 10);
  return !isNaN(numericChainId) && numericChainId > 0;
}

export function getChainType(chainId: string): CHAIN_TYPE {
  if (isTonChain(chainId)) {
    return CHAIN_TYPE.TON;
  }
  if (isEvmChain(chainId)) {
    return CHAIN_TYPE.EVM;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}
