import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '../order/constants';
import { OrderService } from '../order/order.service';
import { ResolverService } from '../resolver/resolver.service';
import { CoreEvents } from './constants';
import { OrderCreatedEvent } from './events/order-created.event';
import { SecretRevealedEvent } from './events/secret-revealed.event';

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    private readonly resolverService: ResolverService,
    private readonly orderService: OrderService,
  ) {}

  @OnEvent(CoreEvents.ORDER_CREATED)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Received order created event for order: ${event.order.id}`);

    try {
      // Start resolver flow Phase 1 for the new order
      // Note: Order status updates are now handled inside the resolver service
      await this.resolverService.startResolverFlow(event.order);
      this.logger.log(`Completed resolver flow Phase 1 for order: ${event.order.id} - escrows deployed`);
    } catch (error) {
      this.logger.error(`Failed to start resolver flow for order ${event.order.id}:`, error);
      this.orderService.updateOrderStatus(event.order.id!, OrderStatus.FAILED);
    }
  }

  @OnEvent(CoreEvents.SECRET_REVEALED)
  async handleSecretRevealed(event: SecretRevealedEvent): Promise<void> {
    this.logger.log(`Received secret revealed event for order: ${event.order.id}`);

    try {
      // Start resolver flow Phase 2 with the revealed secret
      // Note: Order status updates are now handled inside the resolver service
      await this.resolverService.completeResolverFlow(event.order, event.secret);
      this.logger.log(`Completed resolver flow Phase 2 for order: ${event.order.id} - swap completed`);
    } catch (error) {
      this.logger.error(`Failed to complete resolver flow for order ${event.order.id}:`, error);
      this.orderService.updateOrderStatus(event.order.id!, OrderStatus.FAILED);
    }
  }
}
