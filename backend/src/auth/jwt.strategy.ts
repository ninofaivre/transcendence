import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable } from "@nestjs/common"
import { Request } from "express"
import * as cookie from "cookie"
import { EnvService } from "src/env/env.service"

type JwtPayload = {
    sub: string
    username: string
    intraUserName: string
}

function extractJwtFromCookie(tokenType: "access_token" | "refresh_token") {
    return (req: Request): string | null => req.cookies?.[tokenType]
}

function extractJwtFromCookieWS(tokenType: "access_token" | "refresh_token") {
    return (req: any): string | null => cookie.parse(req.handshake?.headers?.cookie || "")?.[tokenType]
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {

	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				extractJwtFromCookie("access_token"),
				extractJwtFromCookieWS("access_token"),
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: EnvService.env.JWT_SECRET,
		})
	}

	validate = async (payload: JwtPayload) => payload
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    
    constructor() {
        super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				extractJwtFromCookie("refresh_token"),
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: EnvService.env.JWT_SECRET,
            passReqToCallback: true
        })
    }

    async validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.cookies.refresh_token
        return { ...payload, refreshToken }
    }

}
