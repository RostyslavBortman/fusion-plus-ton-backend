import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { ResolverService } from '../resolver/resolver.service';
import { CoreEvents } from '../core/constants';
import { OrderCreatedEvent } from '../core/events/order-created.event';
import { OrderStatus } from './constants';
import { OrderStatusModel } from './models/order-status.model';
import { OrderModel } from './models/order.model';

@Injectable()
export class OrderService {
  private orderStatusList: { [id: string]: OrderStatusModel } = {};

  constructor(
    private readonly resolverService: ResolverService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  createOrder(order: OrderModel): OrderModel {
    // Save order to list
    if (!order.id) {
      order.id = uuidv4();
    }
    this.orderStatusList[order.id] = {
      order,
      orderStatus: OrderStatus.PENDING,
    };

    // Emit order created event
    this.eventEmitter.emit(CoreEvents.ORDER_CREATED, new OrderCreatedEvent(order));

    return order;
  }

  getOrderStatus(id: string): OrderStatusModel {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return orderStatus;
  }
}
