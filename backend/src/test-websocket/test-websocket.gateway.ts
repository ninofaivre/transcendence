import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { UseGuards, Request, Injectable, Req } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server, Socket } from "socket.io"
import { AuthService, EnrichedRequest } from "src/auth/auth.service";
import { WebSocketAuthMiddleware } from "src/auth/ws.mw";
import * as cookie from "cookie"

type IntraUserName = string

export interface EnrichedSocket extends Socket {
    user: EnrichedRequest['user']
}

@WebSocketGateway({})
@Injectable()
export class TestWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    constructor(
        private readonly authService: AuthService
    ) {}

    @WebSocketServer()
    server: Server = new Server();

    afterInit(client: Socket) {
        client.use(WebSocketAuthMiddleware(this.authService) as any)
    }

    clients = new Map<IntraUserName, { socket: Socket }>()

    handleConnection(client: EnrichedSocket, ...args: any[]) {
        this.clients.set(client.user.intraUserName, { socket: client })
    }

    @UseGuards(WsJwtAuthGuard)
    handleDisconnect(client: EnrichedSocket) {
        this.clients.delete(client.user.intraUserName)       
    }

    @UseGuards(WsJwtAuthGuard)
    @SubscribeMessage("joinRoomOne")
    joinRoomOne(@Req(){ user: { username } }: EnrichedRequest) {
        this.clients.get(username)!.socket.join("roomOne")
    }

    @UseGuards(WsJwtAuthGuard)
    @SubscribeMessage("newMessageRoomOne")
    newMessageRoomOne(@Req(){ user: { username } }: EnrichedRequest, @MessageBody()body: any) {
        this.server.of("roomOne").emit("message", { msg: body.msg, room: "roomOne", username })
    }

    @UseGuards(WsJwtAuthGuard)
	@SubscribeMessage("newMessage")
	handleMessage(@Request() req: EnrichedRequest, @MessageBody()body: any) {
        console.log(body)
        this.server.emit('onMessage', { msg: body, author: req.user.username })
	}
}
