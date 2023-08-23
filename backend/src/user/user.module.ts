import { Module, forwardRef } from "@nestjs/common"
import { UserService } from "./user.service"
import { UserController } from "./user.controller"
import { SseModule } from "src/sse/sse.module"
import { ChansModule } from "src/chans/chans.module"
import { FriendsModule } from "src/friends/friends.module"
import { DmsModule } from "src/dms/dms.module"
import { Oauth42Module } from "src/oauth42/oauth42.module"
import { AuthModule } from "src/auth/auth.module"
import { GameWebsocketModule } from "src/websocket/game.websocket.module"

@Module({
	imports: [
        forwardRef(() => SseModule),
        ChansModule,
        forwardRef(() => FriendsModule),
        DmsModule,
        Oauth42Module,
        forwardRef(() => AuthModule),
        forwardRef(() => GameWebsocketModule)
    ],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService],
})
export class UserModule {}
