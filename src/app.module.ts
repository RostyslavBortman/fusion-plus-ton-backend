import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { CoreModule } from './modules/core/core.module';
import { OrderModule } from './modules/order/order.module';
import { RelayerModule } from './modules/relayer/relayer.module';
import { ResolverModule } from './modules/resolver/resolver.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    SettingsModule,
    BlockchainModule,
    CoreModule,
    OrderModule,
    RelayerModule,
    ResolverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
