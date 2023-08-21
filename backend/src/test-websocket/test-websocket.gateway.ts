import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { UseGuards, Request } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server } from "socket.io"

@WebSocketGateway()
export class TestWebsocketGateway {

    @WebSocketServer()
    io: Server = new Server();

    // @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("message")
	handleMessage(@Request() req: any): string {
		console.log("req.user :", req.user)
		// console.log(client, payload)
		return "Hello world!"
	}
}
