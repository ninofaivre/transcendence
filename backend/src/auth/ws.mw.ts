import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { EnrichedSocket } from "src/test-websocket/test-websocket.gateway";

export function WebSocketAuthMiddleware(
    authService: AuthService
) {
    return ((client: Socket, next: (err?: unknown) => void) => {
        try {
            const enrichedClient = client as EnrichedSocket
            enrichedClient.user = authService.isValidAccessTokenFromCookie(client)
            next()
        } catch (error) {
            next(error)
        }
    })
}
