import { Injectable, Logger } from '@nestjs/common';
import { OrderModel } from '../order/models/order.model';
import { OrderService } from '../order/order.service';
import { SettingsService } from '../settings/settings.service';
import { isTonChain } from '../settings/constants';
import { AbstractResolver } from './clients/AbstractResolver';
import { ResolverFactoryService } from './resolver-factory.service';

interface EscrowDeploymentResult {
  address: string;
  txHash: string;
  blockHash?: string;
  blockTimestamp?: number;
}

interface ChainConfig {
  chainId: string;
  resolver: AbstractResolver;
  escrowFactoryAddress: string;
}

@Injectable()
export class ResolverService {
  private readonly logger = new Logger(ResolverService.name);

  constructor(
    private readonly resolverFactoryService: ResolverFactoryService,
    private readonly settingsService: SettingsService,
    private readonly orderService: OrderService,
  ) {}

  async startResolverFlow(order: OrderModel): Promise<{
    srcEscrowAddress: string;
    dstEscrowAddress: string;
    readyForSecret: boolean;
  }> {
    this.logger.log(`Starting resolver flow for order: ${order.id}`);

    try {
      // 1. Extract chain configurations from order
      const { srcChain, dstChain } = await this.extractChainConfigs(order);

      // 2. Initialize resolvers for both chains
      await this.initializeResolvers(srcChain, dstChain);

      // 3. Deploy source escrow (EscrowSrc) on source chain
      const srcEscrowResult = await this.deploySrcEscrow(order, srcChain);
      this.logger.log(`Source escrow deployed at: ${srcEscrowResult.address}`);

      // 4. Deploy destination escrow (EscrowDst) on destination chain
      const dstEscrowResult = await this.deployDstEscrow(order, dstChain, srcEscrowResult);
      this.logger.log(`Destination escrow deployed at: ${dstEscrowResult.address}`);

      // 5. Verify both escrows are properly funded
      await this.verifyEscrowsFunding(order, srcEscrowResult, dstEscrowResult, srcChain, dstChain);
      this.logger.log('Both escrows verified and funded');

      this.logger.log(`Resolver flow phase 1 completed for order: ${order.id}`);

      return {
        srcEscrowAddress: srcEscrowResult.address,
        dstEscrowAddress: dstEscrowResult.address,
        readyForSecret: true,
      };
    } catch (error) {
      this.logger.error(`Resolver flow phase 1 failed for order ${order.id}:`, error);
      await this.handleFailure(order, error);
      throw error;
    }
  }

  async completeResolverFlow(
    order: OrderModel,
    secret: string,
  ): Promise<{
    completed: boolean;
    dstWithdrawalTx: string;
    srcWithdrawalTx: string;
  }> {
    this.logger.log(`Completing resolver flow for order: ${order.id} with revealed secret`);

    try {
      // Extract chain configurations (same as phase 1)
      const { srcChain, dstChain } = await this.extractChainConfigs(order);
      await this.initializeResolvers(srcChain, dstChain);

      // Get escrow addresses (in production, these would be stored/retrieved)
      const srcEscrowAddress = await this.getStoredEscrowAddress(order.id!, 'src');
      const dstEscrowAddress = await this.getStoredEscrowAddress(order.id!, 'dst');

      const srcEscrowResult: EscrowDeploymentResult = {
        address: srcEscrowAddress,
        txHash: '', // Would be retrieved from storage
      };

      const dstEscrowResult: EscrowDeploymentResult = {
        address: dstEscrowAddress,
        txHash: '', // Would be retrieved from storage
      };

      // 6. Execute atomic withdrawals with provided secret
      const { dstTxHash, srcTxHash } = await this.executeWithdrawals(
        order,
        srcEscrowResult,
        dstEscrowResult,
        srcChain,
        dstChain,
        secret,
      );

      this.logger.log(`Resolver flow completed successfully for order: ${order.id}`);

      return {
        completed: true,
        dstWithdrawalTx: dstTxHash,
        srcWithdrawalTx: srcTxHash,
      };
    } catch (error) {
      this.logger.error(`Resolver flow phase 2 failed for order ${order.id}:`, error);
      await this.handleFailure(order, error);
      throw error;
    }
  }

  private async extractChainConfigs(order: OrderModel): Promise<{
    srcChain: ChainConfig;
    dstChain: ChainConfig;
  }> {
    this.logger.log(`Extracting chain configs for srcChain: ${order.srcChainId}, dstChain: ${order.dstChainId}`);

    // TODO: Get actual chain configurations from settings/config
    const srcChain: ChainConfig = {
      chainId: order.srcChainId,
      resolver: await this.getResolverForChain(order.srcChainId),
      escrowFactoryAddress: this.getEscrowFactoryAddress(order.srcChainId),
    };

    const dstChain: ChainConfig = {
      chainId: order.dstChainId,
      resolver: await this.getResolverForChain(order.dstChainId),
      escrowFactoryAddress: this.getEscrowFactoryAddress(order.dstChainId),
    };

    return { srcChain, dstChain };
  }

  private async getResolverForChain(chainId: string): Promise<AbstractResolver> {
    const settings = this.settingsService.getSettings();

    // Determine if chain is EVM or TON based on chainId
    if (isTonChain(chainId)) {
      return this.resolverFactoryService.createTonResolver({
        privateKey: settings.resolver.ton.privateKey,
      });
    } else {
      // EVM chain
      return this.resolverFactoryService.createEvmResolver({
        privateKey: settings.resolver.evm.privateKey,
      });
    }
  }

  private getEscrowFactoryAddress(chainId: string): string {
    const settings = this.settingsService.getSettings();

    // Determine chain type from chainId
    if (isTonChain(chainId)) {
      return settings.blockchain.ton.escrowFactory;
    } else {
      return settings.blockchain.evm.escrowFactory;
    }
  }

  private async initializeResolvers(srcChain: ChainConfig, dstChain: ChainConfig): Promise<void> {
    this.logger.log('Initializing resolvers for both chains');
    await Promise.all([srcChain.resolver.initialize(), dstChain.resolver.initialize()]);
  }

  private async deploySrcEscrow(order: OrderModel, srcChain: ChainConfig): Promise<EscrowDeploymentResult> {
    this.logger.log('Deploying source escrow contract');

    try {
      // Create order signature (mock for now)
      const signature = await this.createOrderSignature(order, srcChain);

      // Create taker traits (mock for now)
      const takerTraits = this.createTakerTraits(order);

      // Deploy source escrow using the resolver
      // TODO: Replace any with proper types when resolver interfaces are finalized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (srcChain.resolver as any).deploySrcEscrow({
        chainId: srcChain.chainId,
        order: this.convertToSdkOrder(order),
        signature,
        takerTraits,
        fillAmount: order.makingAmount,
      });

      return {
        address: await this.calculateSrcEscrowAddress(order, srcChain, result),
        txHash: result.txHash,
        blockHash: result.blockHash,
      };
    } catch (error) {
      this.logger.error('Source escrow deployment failed:', error);
      throw error;
    }
  }

  private async deployDstEscrow(
    order: OrderModel,
    dstChain: ChainConfig,
    srcEscrowResult: EscrowDeploymentResult,
  ): Promise<EscrowDeploymentResult> {
    this.logger.log('Deploying destination escrow contract');

    try {
      // Get source deployment event details
      const srcEscrowEvent = await this.getSrcDeploymentEvent(order, srcEscrowResult);

      // Create destination immutables from source event
      const dstImmutables = await this.createDstImmutables(order, srcEscrowEvent, dstChain);

      // Deploy destination escrow using the resolver
      // TODO: Replace any with proper types when resolver interfaces are finalized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (dstChain.resolver as any).deployDstEscrow({
        dstImmutables,
      });

      return {
        address: await this.calculateDstEscrowAddress(order, dstChain, srcEscrowEvent, result),
        txHash: result.txHash,
        blockTimestamp: result.blockTimestamp,
      };
    } catch (error) {
      this.logger.error('Destination escrow deployment failed:', error);
      throw error;
    }
  }

  private async verifyEscrowsFunding(
    order: OrderModel,
    srcEscrowResult: EscrowDeploymentResult,
    dstEscrowResult: EscrowDeploymentResult,
    srcChain: ChainConfig,
    dstChain: ChainConfig,
  ): Promise<void> {
    this.logger.log('Verifying escrow funding');

    // Check source escrow has user's tokens
    const srcBalance = await srcChain.resolver.getContractBalance(srcEscrowResult.address, order.makerAsset);

    // Check destination escrow has resolver's tokens
    const dstBalance = await dstChain.resolver.getContractBalance(dstEscrowResult.address, order.takerAsset);

    this.logger.log(`Source escrow balance: ${srcBalance}, Destination escrow balance: ${dstBalance}`);

    // TODO: Add actual balance verification logic
    if (srcBalance === '0' || dstBalance === '0') {
      throw new Error('Escrow funding verification failed');
    }
  }

  private async executeWithdrawals(
    order: OrderModel,
    srcEscrowResult: EscrowDeploymentResult,
    dstEscrowResult: EscrowDeploymentResult,
    srcChain: ChainConfig,
    dstChain: ChainConfig,
    secret: string,
  ): Promise<{ dstTxHash: string; srcTxHash: string }> {
    this.logger.log('Executing atomic withdrawals');

    try {
      // Step 1: Execute destination withdrawal first (to user on destination chain)
      const dstTxHash = await this.executeDstWithdrawal(dstEscrowResult, dstChain, secret, order);
      this.logger.log('Destination withdrawal completed');

      // Step 2: Execute source withdrawal second (to resolver on source chain)
      const srcTxHash = await this.executeSrcWithdrawal(srcEscrowResult, srcChain, secret, order);
      this.logger.log('Source withdrawal completed');

      return { dstTxHash, srcTxHash };
    } catch (error) {
      this.logger.error('Withdrawal execution failed:', error);
      // TODO: Implement rollback mechanism if needed
      throw error;
    }
  }

  private async executeDstWithdrawal(
    dstEscrowResult: EscrowDeploymentResult,
    dstChain: ChainConfig,
    secret: string,
    order: OrderModel,
  ): Promise<string> {
    this.logger.log(`Withdrawing funds for user from destination escrow: ${dstEscrowResult.address}`);

    try {
      // Wait for finality lock to pass
      await this.waitForFinality(dstChain.chainId, dstEscrowResult.txHash);

      // Create withdrawal immutables
      const immutables = await this.createWithdrawalImmutables(order, dstEscrowResult, 'dst');

      // Execute withdrawal
      // TODO: Replace any with proper types when resolver interfaces are finalized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txHash = await (dstChain.resolver as any).withdrawFromEscrow({
        escrowType: 'dst',
        escrowAddress: dstEscrowResult.address,
        secret,
        immutables,
      });

      this.logger.log(`Destination withdrawal completed with tx: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error('Destination withdrawal failed:', error);
      throw error;
    }
  }

  private async executeSrcWithdrawal(
    srcEscrowResult: EscrowDeploymentResult,
    srcChain: ChainConfig,
    secret: string,
    order: OrderModel,
  ): Promise<string> {
    this.logger.log(`Withdrawing funds for resolver from source escrow: ${srcEscrowResult.address}`);

    try {
      // Create withdrawal immutables
      const immutables = await this.createWithdrawalImmutables(order, srcEscrowResult, 'src');

      // Execute withdrawal
      // TODO: Replace any with proper types when resolver interfaces are finalized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txHash = await (srcChain.resolver as any).withdrawFromEscrow({
        escrowType: 'src',
        escrowAddress: srcEscrowResult.address,
        secret,
        immutables,
      });

      this.logger.log(`Source withdrawal completed with tx: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error('Source withdrawal failed:', error);
      throw error;
    }
  }

  private async handleFailure(order: OrderModel, error: unknown): Promise<void> {
    this.logger.error(`Handling failure for order ${order.id}:`, error);

    // TODO: Implement failure handling:
    // - Cancel escrow contracts if deployed
    // - Return funds to original owners
    // - Distribute safety deposits appropriately
    // - Update order status

    throw new Error('NotImplemented: Failure handling not yet implemented');
  }

  // Additional utility methods for complex operations

  private async waitForFinality(chainId: string, txHash: string): Promise<void> {
    this.logger.log(`Waiting for finality on chain ${chainId} for tx: ${txHash}`);

    // TODO: Implement proper finality waiting based on chain type
    // EVM chains: wait for N confirmations
    // TON: wait for specific block confirmations

    // Mock finality wait
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds
  }

  // Helper methods for order processing

  private async getStoredEscrowAddress(orderId: string, escrowType: 'src' | 'dst'): Promise<string> {
    this.logger.log(`Retrieving ${escrowType} escrow address for order: ${orderId}`);

    const orderStatus = this.orderService.getOrderStatus(orderId);

    if (!orderStatus.escrows) {
      throw new Error(`Escrow details not found for order: ${orderId}`);
    }

    return escrowType === 'src' ? orderStatus.escrows.src.address : orderStatus.escrows.dst.address;
  }

  private async createOrderSignature(_order: OrderModel, _srcChain: ChainConfig): Promise<string> {
    // TODO: Implement proper order signing based on 1inch SDK
    // This should sign the order with the user's private key

    return '0x' + '0'.repeat(130); // Mock signature
  }

  private createTakerTraits(_order: OrderModel): unknown {
    // TODO: Implement proper taker traits creation based on 1inch SDK
    // This should include extension, amount mode, threshold, etc.

    return {}; // Mock taker traits
  }

  private convertToSdkOrder(_order: OrderModel): unknown {
    // TODO: Convert OrderModel to 1inch SDK CrossChainOrder
    // This should map all order fields properly

    return {}; // Mock SDK order
  }

  private async calculateSrcEscrowAddress(
    _order: OrderModel,
    _srcChain: ChainConfig,
    _result: unknown,
  ): Promise<string> {
    // TODO: Calculate actual source escrow address using EscrowFactory
    // Similar to EscrowFactory.getSrcEscrowAddress() in fusion-tests.ts

    return '0x' + '0'.repeat(40); // Mock address
  }

  private async calculateDstEscrowAddress(
    _order: OrderModel,
    _dstChain: ChainConfig,
    _srcEvent: unknown,
    _result: unknown,
  ): Promise<string> {
    // TODO: Calculate actual destination escrow address using EscrowFactory
    // Similar to EscrowFactory.getDstEscrowAddress() in fusion-tests.ts

    return '0x' + '0'.repeat(40); // Mock address
  }

  private async getSrcDeploymentEvent(_order: OrderModel, _srcEscrowResult: EscrowDeploymentResult): Promise<unknown> {
    // TODO: Parse source deployment event from blockchain
    // Should extract immutables and other required data

    return {}; // Mock event data
  }

  private async createDstImmutables(
    _order: OrderModel,
    _srcEscrowEvent: unknown,
    _dstChain: ChainConfig,
  ): Promise<unknown> {
    // TODO: Create destination immutables from source event
    // Similar to srcEscrowEvent[0].withComplement().withTaker() in fusion-tests.ts

    return {}; // Mock immutables
  }

  private async createWithdrawalImmutables(
    _order: OrderModel,
    _escrowResult: EscrowDeploymentResult,
    _type: 'src' | 'dst',
  ): Promise<unknown> {
    // TODO: Create immutables for withdrawal operations
    // Different format for src vs dst withdrawals

    return {}; // Mock immutables
  }
}
