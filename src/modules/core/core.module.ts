import { Module } from '@nestjs/common';
import { ResolverModule } from '../resolver/resolver.module';
import { CoreService } from './core.service';

@Module({
  imports: [ResolverModule],
  providers: [CoreService],
  exports: [CoreService],
})
export class CoreModule {}
