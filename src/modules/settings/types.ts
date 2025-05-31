import { CHAIN_MODE, CHAIN_TYPE } from './constants';

export interface ISettings {
  app: {
    port: string;
    url: string;
    corsOrigins: string;
    swaggerPrefix: string;
  };
  blockchain: {
    ton: {
      mode: CHAIN_MODE;
      rpcUrl: string;
      escrowFactory: string;
    };
    evm: {
      mode: CHAIN_MODE;
      rpcUrl: string;
      escrowFactory: string;
      locContract: string;
    };
  };
  resolver: {
    ton: {
      privateKey: string;
    };
    evm: {
      privateKey: string;
    };
  };
}
