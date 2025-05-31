import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { OrderModule } from '../order/order.module';
import { ResolverFactoryService } from './resolver-factory.service';
import { ResolverService } from './resolver.service';

@Module({
  imports: [BlockchainModule, OrderModule],
  providers: [ResolverFactoryService, ResolverService],
  exports: [ResolverFactoryService, ResolverService],
})
export class ResolverModule {}
