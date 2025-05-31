export interface ResolverCredentials {
  privateKey?: string;
  mnemonic?: string[];
}

export abstract class AbstractResolver {
  constructor(_credentials: ResolverCredentials) {}

  abstract initialize(): Promise<void>;
  abstract getAddress(): Promise<string>;
  abstract getBalance(): Promise<string>;
  abstract getTokenBalance(tokenAddress: string): Promise<string>;
  abstract deployEscrowContract(params: unknown): Promise<string>;
  abstract lockFunds(escrowAddress: string, amount: string, tokenAddress?: string): Promise<string>;
  abstract unlockFunds(escrowAddress: string): Promise<string>;
  abstract fillOrder(orderParams: unknown): Promise<string>;
  abstract getContractBalance(contractAddress: string, tokenAddress?: string): Promise<string>;
  abstract executeContractCall(contractAddress: string, methodName: string, params: unknown[]): Promise<unknown>;
  abstract getTransactionStatus(txHash: string): Promise<{ confirmed: boolean; blockNumber?: number }>;
}
