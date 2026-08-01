import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('MANALINMAS API')
    .setDescription('Manajemen Kinerja Linmas & Pelaporan Darurat API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
  console.log('✅ OpenAPI specification exported to openapi.json');

  await app.close();
  process.exit(0);
}

bootstrap();
