import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser'
import { SwaggerTheme } from 'swagger-themes';
import { PrismaClientExceptionFilter, PrismaService } from 'nestjs-prisma';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { generateOpenApi } from '@ts-rest/open-api'
import contract from 'contract/contract'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// httpsOptions:
		// {
		// 	key: fs.readFileSync('./secrets/key.pem'),
		// 	cert: fs.readFileSync('./secrets/cert.pem'),
		// },
		// cors:
		// {
		// 	credentials: true,
		// 	origin: ['https://localhost:3000', 'https://localhost:5173', 'https://localhost'],
		// }
	});

    app.use(cookieParser())
    const config = new DocumentBuilder()
        .setTitle('APIchat')
        .setVersion('0.42')
        .build();
	const theme = new SwaggerTheme('v3')
	const options =
	{
		// explorer: true,
		customCss: theme.getBuffer('dark'),
	}
	patchNestjsSwagger()
    // const document = SwaggerModule.createDocument(app, config);
	const document = generateOpenApi(contract, config, { setOperationId: true })
    SwaggerModule.setup('api', app, document, options);

	const prismaService: PrismaService = app.get(PrismaService)
	prismaService.$on('query', (event) => { console.log(event) })

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

    await app.listen(3000);
}

bootstrap();
