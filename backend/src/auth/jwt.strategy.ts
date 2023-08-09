import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable } from "@nestjs/common"
import { Request as RequestType } from "express"
import * as cookie from "cookie"
import { EnvService } from "src/env/env.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				JwtStrategy.extractJwtFromCookie,
				JwtStrategy.extractJwtFromCookieWS,
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: EnvService.env.PGPASSWORD,
		})
	}

	private static extractJwtFromCookie(req: RequestType): string | null {
		return req.cookies?.access_token
	}

	private static extractJwtFromCookieWS(req: any): string | null {
		return cookie.parse(req.handshake?.headers?.cookie || "").access_token
	}

	async validate(payload: any) {
		return { userId: payload.sub, username: payload.username }
	}
}
