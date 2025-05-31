import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { EvmService } from '../../blockchain/evm.service';
import { AbstractResolver, ResolverCredentials } from './AbstractResolver';

export class EvmResolver extends AbstractResolver {
  private readonly evmService: EvmService;
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private locContractAddress: string;

  constructor(evmService: EvmService, credentials: ResolverCredentials, locContractAddress: string) {
    super(credentials);
    this.evmService = evmService;
    this.locContractAddress = locContractAddress;

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

  // Fusion-specific methods for cross-chain operations

  async deploySrcEscrow(params: {
    chainId: string;
    order: any; // TODO: Use proper order type from 1inch SDK
    signature: string;
    takerTraits: any;
    fillAmount: string;
    hashLock?: any;
    userAddress: string;
    tokenAddress: string;
  }): Promise<{ txHash: string; blockHash: string; escrowAddress: string }> {
    const { fillAmount, userAddress, tokenAddress } = params;

    try {
      // Step 1: Deploy source escrow contract
      // TODO: Implement actual escrow factory deployment
      // For now, mock the deployment
      const escrowAddress = '0x' + '1'.repeat(40); // Mock escrow address
      const deployTx = await this.wallet.sendTransaction({
        to: this.wallet.address, // Mock transaction
        value: 0,
      });
      await deployTx.wait();

      // Step 2: Transfer approved funds from user to escrow
      await this.transferApprovedFunds({
        tokenAddress,
        fromAddress: userAddress,
        toAddress: escrowAddress,
        amount: fillAmount,
      });

      return {
        txHash: deployTx.hash,
        blockHash: deployTx.blockHash || '',
        escrowAddress,
      };
    } catch (error) {
      throw new Error(`Failed to deploy source escrow and transfer funds: ${error}`);
    }
  }

  async deployDstEscrow(params: {
    dstImmutables: any; // TODO: Use proper immutables type from 1inch SDK
  }): Promise<{ txHash: string; blockTimestamp: number }> {
    // TODO: Implement actual destination escrow deployment
    // This should create escrow with resolver's tokens
    // Similar to resolverContract.deployDst() in fusion-tests.ts

    throw new Error('NotImplemented: EVM destination escrow deployment not yet implemented');
  }

  async withdrawFromEscrow(params: {
    escrowType: 'src' | 'dst';
    escrowAddress: string;
    secret: string;
    immutables: any; // TODO: Use proper immutables type
  }): Promise<string> {
    // TODO: Implement actual escrow withdrawal
    // This should reveal secret and withdraw funds
    // Similar to resolverContract.withdraw() in fusion-tests.ts

    throw new Error('NotImplemented: EVM escrow withdrawal not yet implemented');
  }

  async cancelEscrow(params: { escrowType: 'src' | 'dst'; escrowAddress: string; immutables: any }): Promise<string> {
    // TODO: Implement escrow cancellation for timeout scenarios
    // Similar to resolverContract.cancel() in fusion-tests.ts

    throw new Error('NotImplemented: EVM escrow cancellation not yet implemented');
  }

  async getSrcDeployEvent(blockHash: string): Promise<any[]> {
    // TODO: Implement event parsing for source deployment
    // Should extract escrow immutables from deployment event

    throw new Error('NotImplemented: EVM source deploy event parsing not yet implemented');
  }

  async getEscrowAddress(params: {
    escrowType: 'src' | 'dst';
    factoryAddress: string;
    immutables: any;
    implementation?: string;
  }): Promise<string> {
    // TODO: Implement escrow address calculation
    // Should use EscrowFactory.getSrcEscrowAddress() or getDstEscrowAddress()

    throw new Error('NotImplemented: EVM escrow address calculation not yet implemented');
  }

  /**
   * Transfer approved funds from user's stablecoin address to escrow contract
   * using LOC contract transferFrom function
   */
  async transferApprovedFunds(params: {
    tokenAddress: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
  }): Promise<string> {
    const { tokenAddress, fromAddress, toAddress, amount } = params;

    try {
      // Load LOC ABI
      const abiPath = path.join(__dirname, '../../blockchain/abi/LOC.abi.json');
      const locAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

      // Create LOC contract instance
      const locContract = new ethers.Contract(this.locContractAddress, locAbi, this.wallet);

      // Parse amount to proper units (assuming 18 decimals for stablecoin)
      const amountInWei = ethers.parseUnits(amount, 18);

      // Execute transferFrom
      const tx = await locContract.transferFrom(tokenAddress, fromAddress, toAddress, amountInWei);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to transfer approved funds: ${error}`);
    }
  }

  /**
   * Get the LOC contract address
   */
  getLocContractAddress(): string {
    return this.locContractAddress;
  }
}
