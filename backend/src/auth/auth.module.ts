import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { UserModule } from "../user/user.module"
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { AccessTokenStrategy, RefreshTokenStrategy } from "./jwt.strategy"
import { EnvService } from "src/env/env.service"
import { Oauth42Module } from "src/oauth42/oauth42.module"

@Module({
	imports: [
		PassportModule,
        JwtModule,
		UserModule,
        Oauth42Module
	],
	providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
	controllers: [AuthController],
})
export class AuthModule {}
