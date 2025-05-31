import { Module } from '@nestjs/common';
import { RelayerService } from './relayer.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  providers: [RelayerService],
  exports: [RelayerService],
})
export class RelayerModule {}
