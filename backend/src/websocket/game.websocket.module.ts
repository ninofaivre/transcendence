import { Module, forwardRef } from "@nestjs/common"
import { GameWebsocketGateway } from "./game.websocket.gateway"
import { AuthModule } from "src/auth/auth.module"
import { GameModule } from "src/game/game.module"

@Module({
    imports: [AuthModule, forwardRef(() => GameModule)],
	providers: [GameWebsocketGateway],
    exports: [GameWebsocketGateway]
})
export class GameWebsocketModule {}
