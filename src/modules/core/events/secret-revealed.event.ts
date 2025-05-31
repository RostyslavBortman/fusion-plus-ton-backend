import { OrderModel } from '../../order/models/order.model';

export class SecretRevealedEvent {
  constructor(
    public readonly order: OrderModel,
    public readonly secret: string,
  ) {}
}