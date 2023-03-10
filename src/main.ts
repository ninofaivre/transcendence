import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser'
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser())
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: {enableImplicitConversion: true} }));

	const config = new DocumentBuilder()
		.setTitle('APIchat')
		.setVersion('0.42')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

	await app.listen(3000);
}

bootstrap();
