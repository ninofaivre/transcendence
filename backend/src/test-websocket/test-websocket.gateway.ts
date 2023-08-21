import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets"
import { UseGuards, Request } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"

@WebSocketGateway()
export class TestWebsocketGateway {

    @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("message")
	handleMessage(@Request() req: any): string {
		console.log("req.user :", req.user)
		// console.log(client, payload)
		return "Hello world!"
	}
}
