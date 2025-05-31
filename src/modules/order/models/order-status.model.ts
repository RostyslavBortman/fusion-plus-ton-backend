import { OrderStatus } from '../constants';
import { OrderModel } from '../models/order.model';

export class EscrowDetailsDto {
  address: string;
  txHash: string;
}

export class BalanceDetailsDto {
  tokenAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
}

export class TransactionDetailsDto {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  gasUsed?: string;
  gasPrice?: string;
}

export class OrderStatusModel {
  order: OrderModel;
  orderStatus: OrderStatus;
  balances?: {
    maker: BalanceDetailsDto;
    taker: BalanceDetailsDto;
  };
  escrows?: {
    src: EscrowDetailsDto;
    dst: EscrowDetailsDto;
  };
}
