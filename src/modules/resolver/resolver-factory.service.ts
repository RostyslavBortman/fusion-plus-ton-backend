import { Injectable } from '@nestjs/common';
import { EvmService } from '../blockchain/evm.service';
import { TonService } from '../blockchain/ton.service';
import { SettingsService } from '../settings/settings.service';
import { CHAIN_TYPE } from '../settings/constants';
import { AbstractResolver, ResolverCredentials } from './clients/AbstractResolver';
import { EvmResolver } from './clients/EvmResolver';
import { TonResolver } from './clients/TonResolver';

@Injectable()
export class ResolverFactoryService {
  constructor(
    private readonly evmService: EvmService,
    private readonly tonService: TonService,
    private readonly settingsService: SettingsService,
  ) {}

  getResolver(chainType: CHAIN_TYPE, credentials: ResolverCredentials): AbstractResolver {
    switch (chainType) {
      case CHAIN_TYPE.EVM:
        return new EvmResolver(this.evmService, credentials, this.settingsService.getSettings().blockchain.evm.locContract);

      case CHAIN_TYPE.TON:
        return new TonResolver(this.tonService, credentials);

      default:
        throw new Error(`Unsupported chain type: ${String(chainType)}`);
    }
  }

  getResolverFromPrivateKey(chainType: CHAIN_TYPE, privateKey: string): AbstractResolver {
    return this.getResolver(chainType, { privateKey });
  }

  getResolverFromMnemonic(chainType: CHAIN_TYPE, mnemonic: string[]): AbstractResolver {
    return this.getResolver(chainType, { mnemonic });
  }

  createEvmResolver(credentials: ResolverCredentials): AbstractResolver {
    return new EvmResolver(this.evmService, credentials, this.settingsService.getSettings().blockchain.evm.locContract);
  }

  createTonResolver(credentials: ResolverCredentials): AbstractResolver {
    return new TonResolver(this.tonService, credentials);
  }
}
