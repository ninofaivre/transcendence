import { HttpAdapterHost, NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger"
import * as cookieParser from "cookie-parser"
import { SwaggerTheme } from "swagger-themes"
import { generateOpenApi } from "@ts-rest/open-api"
import { contract } from "contract"
// import { HttpStatus } from "@nestjs/common"
import { join } from "path"
import { EnvService } from "./env/env.service"
import { PrismaClientExceptionFilter } from "./prisma/exception-filter"

import { install } from 'source-map-support';
install();

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// bodyParser: true,
		// httpsOptions:
		// {
		// 	key: fs.readFileSync('./secrets/key.pem'),
		// 	cert: fs.readFileSync('./secrets/cert.pem'),
		// },
		cors: {
			// Mandatory for any protected route to work (must be set on the client's fetch and EventSource constructor too)
			credentials: true,
			//Matches all localhost whether http/https or there's a port
			origin: [/https?:\/\/localhost(?::\d{1,6})?$/, EnvService.env.PUBLIC_FRONTEND_URL],
			methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
		},
		// Just this won't work because Access-Control-Allow-Origin can't be * when credentials are included
		// cors: true,
	})

	app.use(cookieParser())
	const config = new DocumentBuilder().setTitle("APIchat").setVersion("0.42").build()
	const theme = new SwaggerTheme("v3")
	const options = {
		customCss: theme.getBuffer("dark"),
	}
	const document = overrideTsRestGeneratedTags(
		generateOpenApi(contract, config, { setOperationId: true, jsonQuery: true }),
	)
	SwaggerModule.setup("api", app, document, options)
	const { httpAdapter } = app.get(HttpAdapterHost)
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter))
	// const prismaService: PrismaService = app.get(PrismaService)
	// prismaService.$on("query", (event) => {
	// 	console.log(event)
	// })

	// app.useGlobalFilters(
	// 	new PrismaClientExceptionFilter(httpAdapter, {
	// 		P2003: HttpStatus.NOT_FOUND,
	// 	}),
	// )

	await app.listen(EnvService.env.PRIVATE_BACKEND_PORT)
}

function overrideTsRestGeneratedTags(document: OpenAPIObject) {
	for (const path of Object.values(document.paths)) {
		for (const subpath of Object.values(path)) {
			if (!subpath["tags"]) continue
			const oldTags = subpath.tags as string[]
			if (oldTags.length < 2) continue
			let res = ""
			let newTags: string[] = []
			for (const tag of oldTags) {
				res = join(res, tag)
				newTags.push(res)
			}
			subpath.tags = newTags
		}
	}
	return document
}

bootstrap()
