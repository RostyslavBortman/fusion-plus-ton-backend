import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './modules/common/interceptors/http.interceptor';
import { setupSwagger } from './modules/common/swagger/swagger.setup';
import { SettingsService } from './modules/settings/settings.service';

let logger: Logger;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const settingsService = app.get(SettingsService);
  logger = new Logger('bootstrap');

  const settings = settingsService.getSettings();

  const prefix = settings.app.swaggerPrefix;
  const url = settings.app.url;
  const port = settings.app.port;
  const corsOrigins = settings.app.corsOrigins;

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      enableDebugMessages: true,
      stopAtFirstError: false,
    }),
  );
  app.enableCors({
    origin: corsOrigins, // Allows requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // HTTP methods allowed
    allowedHeaders: '*', // Allows all headers
  });
  setupSwagger(app, prefix, url);
  await app.listen(port);
  logger.log(`Server is running on ${url}`);
}
bootstrap().catch((error) => {
  logger.error(error);
  process.exit(1);
});
