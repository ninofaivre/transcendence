import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { LocalStrategy } from "./local.strategy"
import { UserModule } from "../user/user.module"
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { JwtStrategy } from "./jwt.strategy"
import { EnvService } from "src/env/env.service"

@Module({
	imports: [
		PassportModule,
		JwtModule.register({
			secret: EnvService.env.PGPASSWORD,
			signOptions: { expiresIn: "2d" },
		}),
		UserModule,
	],
	providers: [AuthService, LocalStrategy, JwtStrategy],
	controllers: [AuthController],
})
export class AuthModule {}
