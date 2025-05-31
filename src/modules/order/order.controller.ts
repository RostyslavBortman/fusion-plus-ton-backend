import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BalanceDetailsDto,
  EscrowDetailsDto,
  OrderStatusModel,
  TransactionDetailsDto,
} from './models/order-status.model';
import { OrderModel } from './models/order.model';
import { OrderService } from './order.service';

@ApiTags('orders')
@ApiExtraModels(OrderModel, OrderStatusModel, EscrowDetailsDto, BalanceDetailsDto, TransactionDetailsDto)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderModel })
  async createOrder(@Body() orderDto: OrderModel): Promise<OrderModel> {
    const result = this.orderService.createOrder(orderDto);
    return result;
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get order status' })
  @ApiResponse({ status: 200, description: 'Order status retrieved successfully', type: OrderStatusModel })
  async getOrderStatus(@Param('id') id: string): Promise<OrderStatusModel> {
    const result = this.orderService.getOrderStatus(id);
    return result;
  }

  @Post(':id/reveal-secret')
  @ApiOperation({ summary: 'Reveal secret to complete the swap' })
  @ApiResponse({
    status: 200,
    description: 'Secret revealed successfully, processing swap completion',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        orderId: { type: 'string' },
      },
    },
  })
  revealSecret(@Param('id') id: string, @Body() body: { secret: string }): { message: string; orderId: string } {
    this.orderService.revealSecret(id, body.secret);
    return {
      message: 'Secret revealed successfully, processing swap completion',
      orderId: id,
    };
  }
}
