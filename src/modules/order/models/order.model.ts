import {
  IsBoolean,
  IsEthereumAddress,
  IsHexadecimal,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class OrderModel {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  maker: string;

  @IsNotEmpty()
  @IsNumberString()
  makingAmount: string;

  @IsNotEmpty()
  @IsNumberString()
  takingAmount: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  makerAsset: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  takerAsset: string;

  @IsNotEmpty()
  @IsString()
  srcChainId: string;

  @IsNotEmpty()
  @IsString()
  dstChainId: string;

  @IsNotEmpty()
  @IsHexadecimal()
  @Length(66, 66)
  secretHash: string;

  @IsNotEmpty()
  @IsNumberString()
  srcSafetyDeposit: string;

  @IsNotEmpty()
  @IsNumberString()
  dstSafetyDeposit: string;

  @IsBoolean()
  allowPartialFills: boolean = false;

  @IsBoolean()
  allowMultipleFills: boolean = false;
}
