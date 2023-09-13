import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets"
import { Injectable, PipeTransform, Logger, Inject, forwardRef } from "@nestjs/common"
import { RemoteSocket, Server, Socket } from "socket.io"
import { EnrichedRequest } from "src/types"
import { AuthService } from "src/auth/auth.service"
import { WebSocketAuthMiddleware } from "src/auth/ws.mw";
import { GameService } from "src/game/game.service";
import { Schema, z } from "zod";
import { EnvService } from "src/env/env.service";
import { ClientToServerEvents, GameMovement, GameMovementSchema, Invitation, InvitationClientResponseSchema, InvitationSchema, ServerToClientEvents, timeReplyToInvitation } from "contract";
import { InGameMessageSchema } from "contract";
import { InGameMessage, InvitationServerResponse } from "contract";
import { UserService } from "src/user/user.service";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InternalEvents } from "src/internalEvents";
import { PrismaService } from "src/prisma/prisma.service";
import { rulesSchema } from "contract"
import { Rules } from "contract"

export type IntraUserName = string

export class SocketData {

    public readonly username: string;
    public readonly intraUserName: string;
    private _status:
        | {
            type: "IDLE" | "GAME" | "QUEUE" | "OFFLINE"
        }
        | {
            type: "INVITING" | "INVITED",
            username: string,
            displayName: string,
            startTimeoutMs: number
        } = { type: "IDLE" }

    constructor (
        user: EnrichedRequest['user'],
        private readonly userService: UserService,
        public readonly displayName: string
    ) {
        this.username = user.username
        this.intraUserName = user.intraUserName
    }
    
    get status() {
        return this._status
    }

    set status(newStatus) {
        if (this._status === newStatus)
            return
        this._status = newStatus
        this.userService.notifyStatus(this.username)
    }

}

export type EnrichedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
export type EnrichedRemoteSocket = RemoteSocket<ServerToClientEvents, SocketData>

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

@WebSocketGateway({
    cors: {
		origin: /https?:\/\/localhost(?::\d{1,6})?$/,
        credentials: true,
    }
})
@Injectable()
export class GameWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    constructor(
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        private readonly gameService: GameService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    @WebSocketServer()
    public server = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>();

    afterInit(server: Socket) {
        server.use(WebSocketAuthMiddleware(this.authService,
            this.userService, this, this.prisma) as any)
        this.server.sockets.adapter
            .on('delete-room', this.handleDeleteRoom.bind(this))
    }

    @OnEvent('game.end')
    endedGame(payload: InternalEvents['game.end']) {
        this.server.sockets.in([
            payload.playerA.intraUserName,
            payload.playerB.intraUserName
        ]).disconnectSockets(true)
    }

    userNameToSocketData = new Map<string, SocketData>()
    intraNameToSocketData = new Map<IntraUserName, SocketData>()

    handleConnection(client: EnrichedSocket, ...args: any[]) {
        this.userNameToSocketData.set(client.data.username, client.data)
        this.intraNameToSocketData.set(client.data.username, client.data)
    }

    handleDisconnect(client: EnrichedSocket) {
    }

    handleDeleteRoom(roomId: string) {
        const clientData = this.intraNameToSocketData.get(roomId)
        if (!clientData)
            return
        clientData.status = { type: "OFFLINE" }
        this.intraNameToSocketData.delete(clientData.intraUserName)
        this.userNameToSocketData.delete(clientData.username)
    }

    public getStatusByUserName(username: string) {
        const userData = this.userNameToSocketData.get(username)
        if (!userData)
            return "OFFLINE"
        if (userData.status.type === "IDLE" ||
            userData.status.type === 'INVITING' ||
            userData.status.type === 'INVITED'
        ) {
            return "ONLINE"
        }
        return userData.status.type
    }

    @SubscribeMessage('ping')
    async ping(
        @MessageBody(EmptyValidation)payload: never
    ) {
        return ""
    }

    @SubscribeMessage('invite')
    async invite(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(new ZodValidationPipe(InvitationSchema))payload: Invitation,
    ): Promise<InvitationServerResponse> {
        if (payload.intraUserName === client.data.intraUserName)
            return { status: 'error', reason: 'SelfInvitation' }
        if (client.data.status.type !== 'IDLE')
            return { status: 'error', reason: 'InvitingNotAvailable' }
        const invitedClient = (await this.server.sockets.to(payload.intraUserName).fetchSockets()).at(0)
        if (!invitedClient || invitedClient.data.status.type !== 'IDLE') {
            const invitedClient = await this.prisma.user.findUnique({
                where: { intraUserName: payload.intraUserName },
                select: { name: true, displayName: true }
            })
            if (!invitedClient)
                return { status: 'error', reason: 'NotFoundInvited' }
            client.data.status = {
                type: 'INVITING',
                username: invitedClient.name,
                displayName: invitedClient.displayName,
                startTimeoutMs: Date.now()
            }
            this.server.in(client.data.intraUserName)
                .emit('updatedGameStatus', {
                    status: 'INVITING',
                    username: invitedClient.name,
                    displayName: invitedClient.displayName,
                    timeout: timeReplyToInvitation
                })
            return new Promise(
                (res) => setTimeout((client: EnrichedSocket) => {
                    client.data.status = { type: 'IDLE' }
                    this.server.in(client.data.intraUserName)
                        .emit('updatedGameStatus', { status: 'IDLE' })
                    res({ status: 'timedOut', reason: null })
                }, timeReplyToInvitation, client)
            )
        }
        try {
            client.data.status = {
                type: 'INVITING',
                username: invitedClient.data.username,
                displayName: invitedClient.data.displayName,
                startTimeoutMs: Date.now()
            }
            invitedClient.data.status = {
                type: 'INVITED',
                username: client.data.username,
                displayName: client.data.displayName,
                startTimeoutMs: Date.now()
            }
            this.server.in(client.data.intraUserName)
                .emit('updatedGameStatus', {
                    status: 'INVITING',
                    displayName: invitedClient.data.displayName,
                    username: invitedClient.data.username,
                    timeout: timeReplyToInvitation
                })
            const payload: unknown = await Promise.race(
            (await this.server.in(invitedClient.data.intraUserName).fetchSockets())
                .map(socket => socket
                    .timeout(timeReplyToInvitation)
                    .emitWithAck('invited', { displayName: client.data.displayName })
                ))
            const status = InvitationClientResponseSchema.parse(payload)
            if (status == 'accepted')
                await this.gameService.createGame(client, invitedClient, client.data.intraUserName)
            else {
                this.server
                    .in([
                        client.data.intraUserName,
                        invitedClient.data.intraUserName
                    ])
                    .emit('updatedGameStatus', { status: 'IDLE' })
                client.data.status = { type: 'IDLE' }
                invitedClient.data.status = { type: 'IDLE' }
            }
            return { status: status, reason: null }
        }
        catch {}
        this.server
            .in([
                client.data.intraUserName,
                invitedClient.data.intraUserName
            ])
            .emit('updatedGameStatus', { status: 'IDLE' })
        client.data.status = { type: 'IDLE' }
        invitedClient.data.status = { type: 'IDLE' }
        return { status: 'timedOut', reason: null }
    }


    @SubscribeMessage("queue")
    queue(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ) {
        if (client.data.status.type !== 'IDLE')
            return
        client.data.status = { type: 'QUEUE' }
        this.server.sockets.to(client.data.intraUserName)
            .emit("updatedGameStatus", { status: "QUEUE" })
        this.gameService.queueUser(client)
    }

    @SubscribeMessage("surrend")
    surrend(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ) {
        if (client.data.status.type !== 'GAME')
            return
        this.gameService.surrend(client.data.intraUserName)
    }

    @SubscribeMessage("deQueue")
    deQueue(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ) {
        if (client.data.status.type !== 'QUEUE')
            return
        client.data.status = { type: 'IDLE' }
        this.server.sockets.to(client.data.intraUserName)
            .emit("updatedGameStatus", { status: "IDLE" })
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

    @SubscribeMessage("gameMovement")
    gameMovement(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(new ZodValidationPipe(GameMovementSchema))payload: GameMovement
    ) {
        if (client.data.status.type !== 'GAME')
            return
        this.gameService.movement(client.data.intraUserName, payload)
    }

    @SubscribeMessage("setRules")
    setRules(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(new ZodValidationPipe(rulesSchema))payload: Rules
    ) {
        this.gameService.setRules(payload, client.data.intraUserName)       
    }

    @SubscribeMessage("getGameStatus")
    getGameStatus(
        @ConnectedSocket()client: EnrichedSocket,
        @MessageBody(EmptyValidation)payload: never
    ): Parameters<Parameters<ClientToServerEvents['getGameStatus']>[1]>[0] {
        if (client.data.status.type === 'INVITING' ||
            client.data.status.type === 'INVITED'
        ) {
            const { type: status, startTimeoutMs, ...rest } = client.data.status
            return {
                ...rest,
                status,
                timeout: timeReplyToInvitation - (Date.now() - startTimeoutMs),
            }
        }
        if (client.data.status.type === 'GAME') {
            return this.gameService
                .getGameStatusForUser(client.data.intraUserName)
                || { status: 'IDLE' }
        }
        if (client.data.status.type === 'OFFLINE')
            return { status: 'IDLE' }
        return { status: client.data.status.type }
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
