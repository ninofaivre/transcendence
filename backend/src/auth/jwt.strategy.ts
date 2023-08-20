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

function extractJwtFromCookie(req: Request): string | null {
    return req.cookies?.access_token
}

function extractJwtFromCookieWS(req: any): string | null {
    return cookie.parse(req.handshake?.headers?.cookie || "")?.access_token
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {

	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				extractJwtFromCookie,
				extractJwtFromCookieWS,
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
				extractJwtFromCookie,
				extractJwtFromCookieWS,
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: EnvService.env.JWT_SECRET,
        })
    }

    async validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim()
        return { ...payload, refreshToken }
    }

}
