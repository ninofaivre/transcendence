import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { ServeStaticModule } from "@nestjs/serve-static"
import { AuthModule } from "./auth/auth.module"
import { join } from "path"
import { GameWebsocketModule } from "./websocket/game.websocket.module"
import { ChansModule } from "./chans/chans.module"
import { InvitationsModule } from "./invitations/invitations.module"
import { DmsModule } from "./dms/dms.module"
import { FriendsModule } from "./friends/friends.module"
import { SseModule } from "./sse/sse.module"
import { PrismaModule } from './prisma/prisma.module';
import { EnvModule } from './env/env.module';
import { CallbackModule } from './callback/callback.module';
import { Reflector } from "@nestjs/core"
import { Oauth42Module } from './oauth42/oauth42.module';
import { GameModule } from './game/game.module';
import { EventEmitterModule } from "@nestjs/event-emitter"

@Module({
	imports: [
       	ServeStaticModule.forRoot({
			rootPath: join(__dirname, "../../frontend/build"),
			exclude: ["/api*"],
		}),
        EventEmitterModule.forRoot(),
		AuthModule,
		GameWebsocketModule,
		ChansModule,
		InvitationsModule,
		DmsModule,
		FriendsModule,
		SseModule,
		PrismaModule,
		EnvModule,
		CallbackModule,
        Reflector,
        Oauth42Module,
        GameModule
	],
	controllers: [AppController],
	providers: [AppService],
	exports: [AppService],
})
export class AppModule {}
