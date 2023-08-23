import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets"
import { UseGuards, Request, Injectable, Req, PipeTransform, UsePipes, Logger, Inject, forwardRef } from "@nestjs/common"
import { JwtAuthGuard, WsJwtAuthGuard } from "../auth/jwt-auth.guard"
import { Server, Socket, Event } from "socket.io"
import { AuthService, EnrichedRequest } from "src/auth/auth.service";
import { WebSocketAuthMiddleware } from "src/auth/ws.mw";
import * as cookie from "cookie"
import { GameService } from "src/game/game.service";
import { Schema, z } from "zod";
import { EnvService } from "src/env/env.service";
import { ClientToServerEvents, GameMoovement, GameMoovementSchema, ServerToClientEvents } from "contract";
import { InGameMessageSchema } from "contract";
import { InGameMessage } from "contract";
import { UserService } from "src/user/user.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

export type IntraUserName = string

// export type SocketData = {
//     status: Status
// } & EnrichedRequest['user']

export class SocketData {

    public username: string;
    public intraUserName: string;
    private _status: "IDLE" | "GAME" | "QUEUE" | "OFFLINE" = "IDLE";

    constructor (
        user: EnrichedRequest['user'],
        private readonly userService: UserService
    ) {
        this.username = user.username
        this.intraUserName = user.intraUserName
    }
    
    get status() {
        return this._status
    }

    set status(status) {
        this._status = status
        this.userService.notifyStatus(this.username)
    }

}

export type EnrichedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

type GameEvents = string

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: Schema) {}

    transform(value: unknown) {
        const res = this.schema.safeParse(value)
        if (!res.success) {
            if (EnvService.env.PUBLIC_MODE === 'DEV')
                Logger.error(res.error)
            throw new WsException(res.error)
        }
        return res.data 
    }
}

const EmptyValidation = new ZodValidationPipe(z.literal(""))

@WebSocketGateway({})
@Injectable()
export class GameWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    constructor(
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        private readonly gameService: GameService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    @WebSocketServer()
    private server = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>();

    afterInit(server: Socket) {
        server.use(WebSocketAuthMiddleware(this.authService,
            this.userService, this.intraNameToClientId) as any)
    }

    intraNameToClientId = new Map<IntraUserName, string>()
    userNameToClientId = new Map<string, string>()

    handleConnection(client: EnrichedSocket, ...args: any[]) {
        console.log(`${client.data.intraUserName} logged in with id ${client.id}`)
        this.intraNameToClientId.set(client.data.intraUserName, client.id)
        this.userNameToClientId.set(client.data.username, client.id)
        this.gameService.connectUser(client.data.intraUserName)
    }

    handleDisconnect(client: EnrichedSocket) {
        console.log(`${client.data.intraUserName} logged out with id ${client.id}`)
        this.intraNameToClientId.delete(client.data.intraUserName)
        this.userNameToClientId.delete(client.data.username)
        this.gameService.disconnectUser(client.data.intraUserName)
        client.data.status = "OFFLINE"
    }

    public getStatusByUserName(username: string) {
        const client = this.findClientSocketByUserName(username)
        if (!client)
            return "OFFLINE"
        if (client.data.status === "IDLE")
            return "ONLINE"
        return client.data.status
    }

    private findClientSocketByUserName(userName: string) {
        const clientId = this.userNameToClientId.get(userName)
        if (!clientId)
            return
        return this.server.sockets.sockets.get(clientId)
    }

    private findClientSocketByName(clientName: IntraUserName) {
        const clientId = this.intraNameToClientId.get(clientName)
        if (!clientId)
            return
        return this.server.sockets.sockets.get(clientId)
    }

    public emitEventToGame(gameId: string, event: GameEvents) {
        console.log("emitEventToGame")
        // this.server.to(gameId).emit('game', event)
    }

    public clientInGame(clientName: IntraUserName, gameId: string) {
        console.log("clientInGame :", clientName)
        const client = this.findClientSocketByName(clientName)
        if (!client)
            return
        client.data.status = 'GAME'
        client.join(gameId)
    }

    @SubscribeMessage("queue")
    queue(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ) {
        if (client.data.status !== 'IDLE')
            return
        console.log("queue :", client.data.intraUserName)
        client.data.status = 'QUEUE'
        this.gameService.queueUser(client.data.intraUserName)
    }

    @SubscribeMessage("deQueue")
    deQueue(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ) {
        if (client.data.status !== 'QUEUE')
            return
        console.log("deQueue :", client.data.intraUserName)
        client.data.status = 'IDLE'
        this.gameService.deQueueUser(client.data.intraUserName)
    }

    @SubscribeMessage("newInGameMessage")
    newInGameMessage(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(new ZodValidationPipe(InGameMessageSchema))payload: InGameMessage
    ) {
        const gameId = this.gameService.getGameIdForUser(client.data.intraUserName)
        if (!gameId)
            return
        this.server.to(gameId).emit("newInGameMessage", {
            player: client.data.username,
            message: payload
        })
    }

    @SubscribeMessage("gameMoovement")
    gameMoovement(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(new ZodValidationPipe(GameMoovementSchema))payload: GameMoovement
    ) {
        if (client.data.status !== 'GAME')
            return
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
