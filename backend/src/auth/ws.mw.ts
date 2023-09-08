import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, GameWebsocketGateway, IntraUserName, SocketData } from "src/websocket/game.websocket.gateway";
import { UserService } from "src/user/user.service";
import { PrismaService } from "src/prisma/prisma.service";
import { contractErrors, zConnectErrorData } from "contract";
import z from "zod";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    userService: UserService,
    gameWebsocketGateway: GameWebsocketGateway,
    prisma: PrismaService
) {
    return (async (client: EnrichedSocket, next: (err?: { message: string, data?: z.infer<typeof zConnectErrorData> }) => void) => {
        try {
            const jwtPayload = authService.isValidAccessTokenFromCookie(client)
            const displayName = (await prisma.user.findUnique({
                where: { intraUserName: jwtPayload.intraUserName },
                select: { displayName: true }
            }))?.displayName
            if (!displayName) {
                const error = contractErrors.NotFoundUserForValidToken(jwtPayload.intraUserName).body
                next({ message: error.message, data: { code: error.code } })
                return ;
            }
            const data = new SocketData(jwtPayload, userService, displayName)
            const alreadyExistingClient = (await gameWebsocketGateway.server.sockets.in(data.intraUserName)
                    .fetchSockets()).at(0)
            if (!alreadyExistingClient) {
                client.join(data.intraUserName)
                client.data = data;
                next()
                return ;
            }
            client.join([...alreadyExistingClient.rooms])
            client.data = alreadyExistingClient.data
            next()
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'JsonWebTokenError')
                    next({ message: error.message, data: { code: "InvalidJwt" } })
                else if (error.name === 'TokenExpiredError')
                    next({ message: error.message, data: { code: "ExpiredJwt" } })
                else
                    next({ message: error.message, data: { code: "Error" } })
            }
            else
                next({ message: `undefined error : ${error}`, data: { code: "Error" } })
        }
    })
}
