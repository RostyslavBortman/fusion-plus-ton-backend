import { Injectable, Logger } from '@nestjs/common';
import { Address, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { CHAIN_TYPE } from '../settings/constants';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TonService {
  private readonly logger = new Logger(TonService.name);
  private client: TonClient;

  constructor(private readonly settingsService: SettingsService) {
    this.initializeClient();
    this.logger.log('TON Blockchain Service initialized');
  }

  private initializeClient(): void {
    const rpcUrl = this.settingsService.getSettings().blockchain[CHAIN_TYPE.TON].rpcUrl;
    this.client = new TonClient({ endpoint: rpcUrl });
  }

  getProvider(): TonClient {
    return this.client;
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.client.getBalance(Address.parse(address));
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  async getTokenBalance(jettonMasterAddress: string, walletAddress: string): Promise<bigint> {
    try {
      // Get jetton wallet address for the user's wallet
      const jettonWalletAddress = await this.getJettonWalletAddress(jettonMasterAddress, walletAddress);

      // Query balance from jetton wallet contract
      const result = await this.client.runMethod(jettonWalletAddress, 'get_wallet_data');
      const balance = result.stack.readBigNumber();

      return balance;
    } catch (error) {
      this.logger.error(`Failed to get jetton balance for ${walletAddress} on jetton ${jettonMasterAddress}:`, error);
      throw error;
    }
  }

  private async getJettonWalletAddress(jettonMasterAddress: string, walletAddress: string): Promise<Address> {
    try {
      const addressCell = beginCell().storeAddress(Address.parse(walletAddress)).endCell();
      const result = await this.client.runMethod(Address.parse(jettonMasterAddress), 'get_wallet_address', [
        { type: 'slice', cell: addressCell },
      ]);

      return result.stack.readAddress();
    } catch (error) {
      this.logger.error(`Failed to get jetton wallet address for ${walletAddress}:`, error);
      throw error;
    }
  }

  async getCurrentBlockNumber(): Promise<number> {
    try {
      const masterchain = await this.client.getMasterchainInfo();
      return masterchain.latestSeqno;
    } catch (error) {
      this.logger.error('Failed to get current block number:', error);
      throw error;
    }
  }
}
