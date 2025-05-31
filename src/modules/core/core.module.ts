import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { ResolverModule } from '../resolver/resolver.module';
import { CoreService } from './core.service';

@Module({
  imports: [ResolverModule, OrderModule],
  providers: [CoreService],
  exports: [CoreService],
})
export class CoreModule {}
