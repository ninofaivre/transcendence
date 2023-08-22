import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket, IntraUserName } from "src/websocket/game.websocket.gateway";

export function WebSocketAuthMiddleware(
    authService: AuthService,
    clients: Map<IntraUserName, unknown>
) {
    return ((client: Socket, next: (err?: unknown) => void) => {
        try {
            const enrichedClient = client as EnrichedSocket
            enrichedClient.user = authService.isValidAccessTokenFromCookie(client)
            if (clients.has(enrichedClient.user.intraUserName))
                throw new Error("User already has an opened websocket")
            next()
        } catch (error) {
            next(error)
        }
    })
}
