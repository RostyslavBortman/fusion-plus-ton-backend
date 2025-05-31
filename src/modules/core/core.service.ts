import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ResolverService } from '../resolver/resolver.service';
import { CoreEvents } from './constants';
import { OrderCreatedEvent } from './events/order-created.event';

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor(private readonly resolverService: ResolverService) {}

  @OnEvent(CoreEvents.ORDER_CREATED)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Received order created event for order: ${event.order.id}`);

    try {
      // Start resolver flow for the new order
      await this.resolverService.startResolverFlow(event.order);
      this.logger.log(`Started resolver flow for order: ${event.order.id}`);
    } catch (error) {
      this.logger.error(`Failed to start resolver flow for order ${event.order.id}:`, error);
    }
  }
}
