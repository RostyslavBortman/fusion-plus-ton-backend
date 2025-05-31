import { ethers } from 'ethers';
import { EvmService } from '../../blockchain/evm.service';
import { AbstractResolver, ResolverCredentials } from './AbstractResolver';

export class EvmResolver extends AbstractResolver {
  private readonly evmService: EvmService;
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(evmService: EvmService, credentials: ResolverCredentials) {
    super(credentials);
    this.evmService = evmService;

    if (!credentials.privateKey) {
      throw new Error('Private key is required for EVM resolver');
    }

    this.provider = evmService.getProvider();
    this.wallet = new ethers.Wallet(credentials.privateKey, this.provider);
  }

  async initialize(): Promise<void> {}

  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(tokenAddress: string): Promise<string> {
    const balance = await this.evmService.getTokenBalance(tokenAddress, this.wallet.address);
    return ethers.formatUnits(balance, 18);
  }

  async deployEscrowContract(params: {
    bytecode: string;
    abi: ethers.InterfaceAbi;
    constructorArgs?: unknown[];
  }): Promise<string> {
    const { bytecode, abi, constructorArgs = [] } = params;
    const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    return await contract.getAddress();
  }

  async lockFunds(escrowAddress: string, amount: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
      ];
      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.wallet);
      const tx = await contract.transfer(escrowAddress, ethers.parseUnits(amount, 18));
      return tx.hash;
    } else {
      const tx = await this.wallet.sendTransaction({
        to: escrowAddress,
        value: ethers.parseEther(amount),
      });
      return tx.hash;
    }
  }

  async unlockFunds(escrowAddress: string): Promise<string> {
    const escrowAbi = ['function release() external'];
    const contract = new ethers.Contract(escrowAddress, escrowAbi, this.wallet);
    const tx = await contract.release();
    return tx.hash;
  }

  async fillOrder(orderParams: { to: string; amount: string; data?: string }): Promise<string> {
    const { to, amount, data } = orderParams;
    const tx = await this.wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
      data,
    });
    return tx.hash;
  }

  async getContractBalance(contractAddress: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      const balance = await this.evmService.getTokenBalance(tokenAddress, contractAddress);
      return ethers.formatUnits(balance, 18);
    } else {
      const balance = await this.evmService.getBalance(contractAddress);
      return ethers.formatEther(balance);
    }
  }

  async executeContractCall(contractAddress: string, methodName: string, params: unknown[]): Promise<unknown> {
    const abi = [`function ${methodName}(...args) external`];
    const contract = new ethers.Contract(contractAddress, abi, this.wallet);
    return await contract[methodName](...params);
  }

  async getTransactionStatus(txHash: string): Promise<{ confirmed: boolean; blockNumber?: number }> {
    const receipt = await this.evmService.waitForTransaction(txHash, 1);
    return {
      confirmed: receipt !== null,
      blockNumber: receipt?.blockNumber,
    };
  }
}
