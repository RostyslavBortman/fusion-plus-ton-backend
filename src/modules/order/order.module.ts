import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ResolverModule } from '../resolver/resolver.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [ResolverModule, EventEmitterModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
