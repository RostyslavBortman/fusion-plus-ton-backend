import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { CHAIN_TYPE } from '../settings/constants';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EvmService {
  private readonly logger = new Logger(EvmService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;

  constructor(private readonly settingsService: SettingsService) {
    this.initializeProvider();
    this.logger.log('EVM Blockchain Service initialized');
  }

  private initializeProvider(): void {
    const rpcUrl = this.settingsService.getSettings().blockchain[CHAIN_TYPE.EVM].rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    try {
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      return await contract.balanceOf(walletAddress);
    } catch (error) {
      this.logger.error(`Failed to get token balance for ${walletAddress} on token ${tokenAddress}:`, error);
      throw error;
    }
  }

  async deployContract(
    bytecode: string,
    abi: ethers.InterfaceAbi,
    constructorArgs: unknown[] = [],
  ): Promise<ethers.BaseContract> {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Set EVM_PRIVATE_KEY environment variable.');
    }

    try {
      const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();

      this.logger.log(`Contract deployed at address: ${await contract.getAddress()}`);
      return contract;
    } catch (error) {
      this.logger.error('Failed to deploy contract:', error);
      throw error;
    }
  }

  async getContract(address: string, abi: ethers.InterfaceAbi): Promise<ethers.Contract> {
    const signer = this.wallet || this.provider;
    return new ethers.Contract(address, abi, signer);
  }

  async sendTransaction(to: string, value: bigint, data?: string): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Set EVM_PRIVATE_KEY environment variable.');
    }

    try {
      const tx = await this.wallet.sendTransaction({
        to,
        value,
        data,
      });

      this.logger.log(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      this.logger.error(`Failed to wait for transaction ${txHash}:`, error);
      throw error;
    }
  }

  async getCurrentBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error('Failed to get current block number:', error);
      throw error;
    }
  }
}
