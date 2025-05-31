import { OrderModel } from '../../order/models/order.model';

export class OrderCreatedEvent {
  constructor(public readonly order: OrderModel) {}
}
