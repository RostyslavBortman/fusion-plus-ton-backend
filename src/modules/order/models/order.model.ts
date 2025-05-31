import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class OrderModel {
  @ApiPropertyOptional({
    description: 'Unique identifier for the order',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Ethereum address of the order maker',
    example: '0x742d35Cc6634C0532925a3b8D0e5e6e4A8b6E942',
  })
  @IsNotEmpty()
  @IsString()
  maker: string;

  @ApiProperty({
    description: 'Amount of tokens the maker is providing (in wei/smallest unit)',
    example: '1000000000000000000',
  })
  @IsNotEmpty()
  @IsNumberString()
  makingAmount: string;

  @ApiProperty({
    description: 'Amount of tokens the maker wants to receive (in wei/smallest unit)',
    example: '2000000000000000000',
  })
  @IsNotEmpty()
  @IsNumberString()
  takingAmount: string;

  @ApiProperty({
    description: 'Contract address of the token being provided by maker',
    example: '0xA0b86a33E6441be9da9d3E80a7f9c7b9f2a2C555',
  })
  @IsNotEmpty()
  @IsString()
  makerAsset: string;

  @ApiProperty({
    description: 'Contract address of the token the maker wants to receive',
    example: '0xB1c2D3E4F5a6B7c8D9e0F1a2B3c4D5e6F7a8B9c0',
  })
  @IsNotEmpty()
  @IsString()
  takerAsset: string;

  @ApiProperty({
    description: 'Source blockchain chain ID (EVM chains use positive numbers)',
    example: '42161',
  })
  @IsNotEmpty()
  @IsString()
  srcChainId: string;

  @ApiProperty({
    description: 'Destination blockchain chain ID (TON chains use negative numbers)',
    example: '-3',
  })
  @IsNotEmpty()
  @IsString()
  dstChainId: string;

  @ApiProperty({
    description: 'Some hash value',
    example: '0x123abc456def789012345678901234567890abcdef123456789012345678901234',
  })
  @IsNotEmpty()
  @IsString()
  secretHash: string;

  @ApiProperty({
    description: 'Safety deposit amount for source chain (in wei/smallest unit)',
    example: '100000000000000000',
  })
  @IsNotEmpty()
  @IsNumberString()
  srcSafetyDeposit: string;

  @ApiProperty({
    description: 'Safety deposit amount for destination chain (in wei/smallest unit)',
    example: '100000000000000000',
  })
  @IsNotEmpty()
  @IsNumberString()
  dstSafetyDeposit: string;

  @ApiProperty({
    description: 'Whether the order allows partial fills',
    example: false,
    default: false,
  })
  @IsBoolean()
  allowPartialFills: boolean = false;

  @ApiProperty({
    description: 'Whether the order allows multiple fills',
    example: false,
    default: false,
  })
  @IsBoolean()
  allowMultipleFills: boolean = false;
}
