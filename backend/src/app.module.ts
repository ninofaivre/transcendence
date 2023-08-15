import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { ServeStaticModule } from "@nestjs/serve-static"
import { AuthModule } from "./auth/auth.module"
import { join } from "path"
import { TestWebsocketModule } from "./test-websocket/test-websocket.module"
import { ChansModule } from "./chans/chans.module"
import { InvitationsModule } from "./invitations/invitations.module"
import { DmsModule } from "./dms/dms.module"
import { FriendsModule } from "./friends/friends.module"
import { SseModule } from "./sse/sse.module"
import { PrismaModule } from './prisma/prisma.module';
import { EnvModule } from './env/env.module';
import { CallbackModule } from './callback/callback.module';
import { Reflector } from "@nestjs/core"

@Module({
	imports: [
       	ServeStaticModule.forRoot({
			rootPath: join(__dirname, "../../frontend/build"),
			exclude: ["/api*"],
		}),
		AuthModule,
		TestWebsocketModule,
		ChansModule,
		InvitationsModule,
		DmsModule,
		FriendsModule,
		SseModule,
		PrismaModule,
		EnvModule,
		CallbackModule,
        Reflector
	],
	controllers: [AppController],
	providers: [AppService],
	exports: [AppService],
})
export class AppModule {}
