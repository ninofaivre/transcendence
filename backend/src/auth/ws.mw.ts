import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, IntraUserName, SocketData } from "src/websocket/game.websocket.gateway";
import { UserService } from "src/user/user.service";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    userService: UserService,
    clients: Map<IntraUserName, unknown>
) {
    return ((client: EnrichedSocket, next: (err?: unknown) => void) => {
        console.log(`client tryed to connect in the middleware ${client.data.username}`)
        try {
            client.data = new SocketData(authService.isValidAccessTokenFromCookie(client), userService)
            if (clients.has(client.data.intraUserName))
                throw new Error("User already has an opened websocket")
            client.data.status = 'IDLE'
            next()
        } catch (error) {
            next(error)
        }
    })
}
