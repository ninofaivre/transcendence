import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, GameWebsocketGateway, IntraUserName, SocketData } from "src/websocket/game.websocket.gateway";
import { UserService } from "src/user/user.service";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    userService: UserService,
    gameWebsocketGateway: GameWebsocketGateway
) {
    return (async (client: EnrichedSocket, next: (err?: unknown) => void) => {
        console.log(`client tryed to connect in the middleware ${client.data.username}`)
        try {
            const data = new SocketData(authService.isValidAccessTokenFromCookie(client), userService)
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
            // if (clients.has(client.data.intraUserName))
            //     throw new Error("User already has an opened websocket")
            next()
        } catch (error) {
            next(error)
        }
    })
}
