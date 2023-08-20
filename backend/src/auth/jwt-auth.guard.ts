import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

@Injectable()
export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
        console.log("test kdjqfkljdsklfjkl")
        await new JwtAuthGuard().canActivate(context)
    } catch (e) {
        console.log("test FINAL")
    }
    return false
  }

}
