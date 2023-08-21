import { Module, forwardRef } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { UserModule } from "../user/user.module"
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { AccessTokenStrategy, RefreshTokenStrategy } from "./jwt.strategy"
import { Oauth42Module } from "src/oauth42/oauth42.module"

@Module({
	imports: [
		PassportModule,
        JwtModule,
		forwardRef(() => UserModule),
        Oauth42Module
	],
	providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
	controllers: [AuthController],
    exports: [AuthService]
})
export class AuthModule {}
