import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../constants';
import { OrderModel } from '../models/order.model';

export class EscrowDetailsDto {
  @ApiProperty({ description: 'Escrow contract address', type: String })
  address: string;

  @ApiProperty({ description: 'Deployment transaction hash', type: String })
  txHash: string;
}

export class BalanceDetailsDto {
  @ApiProperty({ description: 'Token contract address', type: String })
  tokenAddress: string;

  @ApiProperty({ description: 'Token balance', type: String })
  balance: string;

  @ApiProperty({ description: 'Token decimals', type: Number })
  decimals: number;

  @ApiProperty({ description: 'Token symbol', type: String })
  symbol: string;
}

export class TransactionDetailsDto {
  @ApiProperty({ description: 'Transaction hash', type: String })
  hash: string;

  @ApiProperty({ description: 'Block number', type: Number })
  blockNumber: number;

  @ApiProperty({ description: 'Transaction timestamp', type: Date })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Gas used', type: String })
  gasUsed?: string;

  @ApiPropertyOptional({ description: 'Gas price', type: String })
  gasPrice?: string;
}

export class OrderStatusModel {
  @ApiProperty({ description: 'Order details', type: OrderModel })
  order: OrderModel;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiPropertyOptional({ description: 'Balance information' })
  balances?: {
    maker: BalanceDetailsDto;
    taker: BalanceDetailsDto;
  };

  @ApiPropertyOptional({ description: 'Escrow details' })
  escrows?: {
    src: EscrowDetailsDto;
    dst: EscrowDetailsDto;
  };

  @ApiPropertyOptional({ description: 'Whether secret has been revealed' })
  secretRevealed?: boolean;

  @ApiPropertyOptional({ description: 'Withdrawal transaction details' })
  withdrawalTransactions?: {
    dst: TransactionDetailsDto;
    src: TransactionDetailsDto;
  };
}
