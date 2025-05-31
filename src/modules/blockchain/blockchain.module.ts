import { Module } from '@nestjs/common';
import { EvmService } from './evm.service';
import { TonService } from './ton.service';

@Module({
  imports: [],
  providers: [TonService, EvmService],
  exports: [TonService, EvmService],
})
export class BlockchainModule {}
