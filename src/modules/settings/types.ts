import { CHAIN_MODE, CHAIN_TYPE } from './constants';

export interface ISettings {
  app: {
    port: string;
    url: string;
    corsOrigins: string;
    swaggerPrefix: string;
  };
  blockchain: {
    [CHAIN_TYPE.TON]: {
      mode: CHAIN_MODE;
      rpcUrl: string;
      escrowFactory: string;
    };
    [CHAIN_TYPE.EVM]: {
      mode: CHAIN_MODE;
      rpcUrl: string;
      escrowFactory: string;
    };
  };
  resolver: {
    [CHAIN_TYPE.TON]: {
      privateKey: string;
    };
    [CHAIN_TYPE.EVM]: {
      privateKey: string;
    };
  };
}
