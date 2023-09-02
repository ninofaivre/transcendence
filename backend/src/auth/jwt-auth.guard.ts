import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { WsException } from "@nestjs/websockets";
import { EnrichedSocket } from "src/websocket/game.websocket.gateway";
import { JwtPayload } from "./jwt.strategy";
import { getHttpExceptionFromContractError } from "src/utils";
import { contractErrors } from "contract";

@Injectable()
export class JwtAuthGuardBase extends AuthGuard("jwt") {}

@Injectable()
export class JwtAuthGuard extends JwtAuthGuardBase {
    handleRequest<TUser extends JwtPayload>(err: any, user: TUser, info: any, context: ExecutionContext, status?: any): TUser {
        if (!user)
            throw getHttpExceptionFromContractError(contractErrors.Unauthorized())
        if (!user.twoFA)
            throw getHttpExceptionFromContractError(contractErrors.TwoFATokenNeeded())
        return user
    }
}

@Injectable()
export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {}

// @Injectable()
// export class WsJwtAuthGuard implements CanActivate {

//     constructor(private readonly authService: AuthService) {}

//     canActivate(context: ExecutionContext): boolean {
//         if (context.getType() !== 'ws')
//             return true
//         const client = context.switchToWs().getClient<EnrichedSocket>()
//         const req = context.switchToHttp().getRequest()
//         // BH //
//         req.user = client.data
//         // try {
//         //     req.user = this.authService.isValidAccessTokenFromCookie(client)
//         // } catch {}
//         // BH //
//         return true
//     }

// }
