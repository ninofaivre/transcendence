import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets"
import { UseGuards, Request, Injectable, Req } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server, Socket } from "socket.io"
import { AuthService, EnrichedRequest } from "src/auth/auth.service";
import { WebSocketAuthMiddleware } from "src/auth/ws.mw";
import * as cookie from "cookie"
import { GameService } from "src/game/game.service";

export type IntraUserName = string
type Status = 'IDLE' | 'QUEUE' | 'GAME'

export interface EnrichedSocket extends Socket {
    user: EnrichedRequest['user']
}

type GameEvents = string

@WebSocketGateway({})
@Injectable()
export class GameWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    constructor(
        private readonly authService: AuthService,
        private readonly gameService: GameService
    ) {}

    @WebSocketServer()
    private server = new Server<{}, { game: (e: GameEvents) => void }>();

    afterInit(server: Socket) {
        server.use(WebSocketAuthMiddleware(this.authService, this.clients) as any)
    }

    clients = new Map<IntraUserName, { socket: Socket, status: Status }>()

    handleConnection(client: EnrichedSocket, ...args: any[]) {
        this.clients.set(client.user.intraUserName, { socket: client, status: 'IDLE' })
        this.gameService.connectUser(client.user.intraUserName)
    }

    @UseGuards(WsJwtAuthGuard)
    handleDisconnect(client: EnrichedSocket) {
        this.gameService.disconnectUser(client.user.intraUserName)
        this.clients.delete(client.user.intraUserName)
    }

    private setClientStatus(clientName: IntraUserName, status: Status): void {
        const client = this.clients.get(clientName)
        if (!client) return
        client.status = status 
    }

    public emitEventToGame(gameId: string, event: GameEvents) {
        console.log("emitEventToGame")
        this.server.to(gameId).emit('game', event)
    }

    public clientInGame(clientName: IntraUserName, gameId: string) {
        console.log("clientInGame")
        this.setClientStatus(clientName, 'GAME')
        const client = this.clients.get(clientName)?.socket
        client?.join(gameId)
    }

    @UseGuards(WsJwtAuthGuard)
    @SubscribeMessage("queue")
    queue(@Req(){ user: { intraUserName } }: EnrichedRequest) {
        console.log("queue")
        this.gameService.queueUser(intraUserName)
        this.setClientStatus(intraUserName, 'QUEUE')
    }

    // @UseGuards(WsJwtAuthGuard)
    // @SubscribeMessage("joinRoomOne")
    // joinRoomOne(@Req(){ user: { username } }: EnrichedRequest) {
    //     this.clients.get(username)!.socket.join("roomOne")
    // }

    // @UseGuards(WsJwtAuthGuard)
    // @SubscribeMessage("newMessageRoomOne")
    // newMessageRoomOne(@Req(){ user: { username } }: EnrichedRequest, @MessageBody()body: any) {
    //     this.server.to("roomOne").emit("message", { msg: body.msg, room: "roomOne", username })
    // }

 //    @UseGuards(WsJwtAuthGuard)
	// @SubscribeMessage("newMessage")
	// handleMessage(@Request() req: EnrichedRequest, @MessageBody()body: any) {
 //        console.log(body)
 //        this.server.emit('onMessage', { msg: body, author: req.user.username })
	// }
}
