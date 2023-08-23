import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, IntraUserName } from "src/websocket/game.websocket.gateway";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    clients: Map<IntraUserName, unknown>
) {
    return ((client: EnrichedSocket, next: (err?: unknown) => void) => {
        try {
            client.data = { ...authService.isValidAccessTokenFromCookie(client), status: 'IDLE' }
            if (clients.has(client.data.intraUserName))
                throw new Error("User already has an opened websocket")
            next()
        } catch (error) {
            next(error)
        }
    })
}
