import { Injectable } from '@nestjs/common';
import { isNumberString } from 'class-validator';
import * as dotenv from 'dotenv';
import { CHAIN_MODE, CHAIN_TYPE } from './constants';
import { ISettings } from './types';

dotenv.config({ path: ['.env'] });
const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value;
};

const getOrThrow = (key: string): string => {
  const value = getEnv(key);
  if (value == null) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const convertStringToBoolean = (value?: string): boolean => {
  if (value == null) {
    return false;
  }
  return value.toLowerCase() === 'true';
};

export const convertStringToBigInt = (value?: string): bigint | null => {
  if (value == null) {
    return null;
  }
  return isNumberString(value) ? BigInt(value) : null;
};

@Injectable()
export class SettingsService {
  getSettings(): ISettings {
    return {
      app: {
        port: getOrThrow('APP_PORT'),
        url: getOrThrow('APP_URL'),
        corsOrigins: getOrThrow('APP_CORS_ORIGINS'),
        swaggerPrefix: getOrThrow('APP_SWAGGER_PREFIX'),
      },
      blockchain: {
        [CHAIN_TYPE.TON]: {
          mode: CHAIN_MODE.TESTNET,
          rpcUrl: getOrThrow('TON_RPC_URL'),
          escrowFactory: getOrThrow('TON_ESCROW_FACTORY'),
        },
        [CHAIN_TYPE.EVM]: {
          mode: CHAIN_MODE.TESTNET,
          rpcUrl: getOrThrow('EVM_RPC_URL'),
          escrowFactory: getOrThrow('EVM_ESCROW_FACTORY'),
        },
      },
      resolver: {
        [CHAIN_TYPE.TON]: {
          privateKey: getOrThrow('TON_PRIVATE_KEY'),
        },
        [CHAIN_TYPE.EVM]: {
          privateKey: getOrThrow('EVM_PRIVATE_KEY'),
        },
      },
    };
  }
}
