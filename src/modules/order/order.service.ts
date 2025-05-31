import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { CoreEvents } from '../core/constants';
import { OrderCreatedEvent } from '../core/events/order-created.event';
import { SecretRevealedEvent } from '../core/events/secret-revealed.event';
import { OrderStatus } from './constants';
import { OrderStatusModel } from './models/order-status.model';
import { OrderModel } from './models/order.model';

@Injectable()
export class OrderService {
  private orderStatusList: { [id: string]: OrderStatusModel } = {};

  constructor(private readonly eventEmitter: EventEmitter2) {}

  public createOrder(order: OrderModel): OrderModel {
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

  public getOrderStatus(id: string): OrderStatusModel {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return orderStatus;
  }

  public revealSecret(id: string, secret: string): void {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    if (orderStatus.orderStatus !== OrderStatus.ESCROWS_DEPLOYED) {
      throw new HttpException('Order is not ready for secret revelation', HttpStatus.BAD_REQUEST);
    }

    // Mark secret as revealed
    orderStatus.secretRevealed = true;

    // Emit secret revealed event for core service to handle
    this.eventEmitter.emit(CoreEvents.SECRET_REVEALED, new SecretRevealedEvent(orderStatus.order, secret));
  }

  updateOrderStatus(id: string, status: OrderStatus): void {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    orderStatus.orderStatus = status;
  }

  updateEscrowDetails(
    id: string,
    escrows: { src: { address: string; txHash: string }; dst: { address: string; txHash: string } },
  ): void {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    orderStatus.escrows = escrows;
  }

  updateWithdrawalDetails(id: string, transactions: { dstTxHash: string; srcTxHash: string }): void {
    const orderStatus = this.orderStatusList[id];
    if (!orderStatus) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    orderStatus.withdrawalTransactions = {
      dst: {
        hash: transactions.dstTxHash,
        blockNumber: 0, // TODO: Get actual block number
        timestamp: new Date(),
      },
      src: {
        hash: transactions.srcTxHash,
        blockNumber: 0, // TODO: Get actual block number
        timestamp: new Date(),
      },
    };
  }
}
