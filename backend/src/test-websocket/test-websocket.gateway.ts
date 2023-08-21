import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { UseGuards, Request } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server } from "socket.io"

@WebSocketGateway()
export class TestWebsocketGateway {

    @WebSocketServer()
    io: Server = new Server();

    // @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("newMessage")
	handleMessage(@Request() req: any, @MessageBody()body: any) {
		console.log("req.user :", req.user)
        console.log(body)
        this.io.emit('onMessage', body.msg)
	}
}
