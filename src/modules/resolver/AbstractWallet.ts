export abstract class AbstractWallet {
  abstract getBalance(): Promise<string>;
  abstract getAddress(): Promise<string>;
  abstract getPrivateKey(): Promise<string>;
  abstract getPublicKey(): Promise<string>;
  abstract sendTransaction(to: string, amount: string): Promise<string>;
  abstract deployContract(args: unknown[]): Promise<string>;
  abstract signMessage(message: string): Promise<string>;
}
