import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { OrderStatusModel } from './models/order-status.model';
import { OrderModel } from './models/order.model';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post('orders')
  async createOrder(@Body() orderDto: OrderModel): Promise<OrderModel> {
    const result = this.orderService.createOrder(orderDto);
    return result;
  }

  @Get('orders/:id/status')
  async getOrderStatus(@Param('id') id: string): Promise<OrderStatusModel> {
    const result = this.orderService.getOrderStatus(id);
    return result;
  }
}
