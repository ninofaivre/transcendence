import { Module, forwardRef } from "@nestjs/common"
import { GameWebsocketGateway } from "./game.websocket.gateway"
import { AuthModule } from "src/auth/auth.module"
import { GameModule } from "src/game/game.module"
import { UserModule } from "src/user/user.module"

@Module({
    imports: [
        forwardRef(() => AuthModule),
        forwardRef(() => GameModule),
        forwardRef(() => UserModule)
    ],
	providers: [GameWebsocketGateway],
    exports: [GameWebsocketGateway]
})
export class GameWebsocketModule {}
