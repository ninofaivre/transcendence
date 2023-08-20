import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets"
import { UseGuards, Request } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"

@WebSocketGateway()
export class TestWebsocketGateway {

    @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("message")
	handleMessage(@Request() req: any, client: any, payload: any): string {
		console.log("req :", req.user.username)
		// console.log(client, payload)
		return "Hello world!"
	}
}
