import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: any, prefix: string, appUrl: string): void => {
  const logger = new Logger('SWAGGER');
  const config = new DocumentBuilder()
    .setTitle('TONinch Cross-Chain Bridge')
    .setDescription('Proof of Concept cross-chain bridge for atomic swaps between EVM chains and TON blockchain')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  logger.log(`Server API ${appUrl}${prefix}`);
  SwaggerModule.setup(prefix, app, document);
};
