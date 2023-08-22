import { Module } from "@nestjs/common"
import { TestWebsocketGateway } from "./test-websocket.gateway"
import { AuthModule } from "src/auth/auth.module"

@Module({
    imports: [AuthModule],
	providers: [TestWebsocketGateway],
})
export class TestWebsocketModule {}
