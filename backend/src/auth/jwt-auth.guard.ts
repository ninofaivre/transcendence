import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { WsException } from "@nestjs/websockets";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

@Injectable()
export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            await new JwtAuthGuard().canActivate(context)
        } catch {
            throw new WsException({ code: "Unauthorized", message: "unauthorized" }) 
        }
        return true 
    }

}
