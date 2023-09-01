import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable } from "@nestjs/common"
import { Request } from "express"
import { EnvService } from "src/env/env.service"

export type JwtPayload = {
    sub: string
    username: string
    intraUserName: string
    twoFA: boolean
}

function extractJwtFromCookie(tokenType: "access_token" | "refresh_token") {
    return (req: Request): string | null => req.cookies?.[tokenType] || null
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {

	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				extractJwtFromCookie("access_token"),
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
				extractJwtFromCookie("refresh_token")
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
