import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, GameWebsocketGateway, IntraUserName, SocketData } from "src/websocket/game.websocket.gateway";
import { UserService } from "src/user/user.service";
import { PrismaService } from "src/prisma/prisma.service";
import { contractErrors } from "contract";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    userService: UserService,
    gameWebsocketGateway: GameWebsocketGateway,
    prisma: PrismaService
) {
    return (async (client: EnrichedSocket, next: (err?: unknown) => void) => {
        try {
            const jwtPayload = authService.isValidAccessTokenFromCookie(client)
            const displayName = (await prisma.user.findUnique({
                where: { intraUserName: jwtPayload.intraUserName },
                select: { displayName: true }
            }))?.displayName
            if (!displayName) {
                next(new Error(JSON.stringify(contractErrors.NotFoundUserForValidToken(jwtPayload.intraUserName))))
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
            next(error)
        }
    })
}
