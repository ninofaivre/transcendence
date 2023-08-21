import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { UseGuards, Request, Injectable } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server, Socket } from "socket.io"

@WebSocketGateway({})
@Injectable()
export class TestWebsocketGateway {

    @WebSocketServer()
    server: Server = new Server();

    afterInit(client: Socket) {

    }

    @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("newMessage")
	handleMessage(@Request() req: any, @MessageBody()body: any) {
        console.log("authorized websocket")
		console.log("req.user :", req.user)
        console.log(body)
        this.server.emit('onMessage', body.msg)
	}
}
