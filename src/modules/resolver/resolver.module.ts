import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ResolverFactoryService } from './resolver-factory.service';
import { ResolverService } from './resolver.service';

@Module({
  imports: [BlockchainModule],
  providers: [ResolverFactoryService, ResolverService],
  exports: [ResolverFactoryService, ResolverService],
})
export class ResolverModule {}
