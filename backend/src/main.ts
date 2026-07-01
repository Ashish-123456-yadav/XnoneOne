import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: env.api.corsOrigins.includes('*') ? true : env.api.corsOrigins,
    credentials: true,
  });

  await app.listen(env.api.port, env.api.host);
}

bootstrap();
