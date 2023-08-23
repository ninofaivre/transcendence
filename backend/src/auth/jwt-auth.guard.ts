import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { WsException } from "@nestjs/websockets";
import { EnrichedSocket } from "src/websocket/game.websocket.gateway";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

@Injectable()
export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {

    constructor(private readonly authService: AuthService) {}

    canActivate(context: ExecutionContext): boolean {
        if (context.getType() !== 'ws')
            return true
        const client = context.switchToWs().getClient<EnrichedSocket>()
        const req = context.switchToHttp().getRequest()
        // BH //
        req.user = client.data
        // try {
        //     req.user = this.authService.isValidAccessTokenFromCookie(client)
        // } catch {}
        // BH //
        return true
    }

}
