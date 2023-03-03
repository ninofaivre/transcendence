import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'
import { Request as RequestType } from 'express';
import * as cookie from 'cookie'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors(
			[
				JwtStrategy.extractJwtFromCookie,
				JwtStrategy.extractJwtFromCookieWS,
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET')
		});
	}

	private static extractJwtFromCookie(req: RequestType): string | null
	{
		return req.cookies?.access_token
	}

	private static extractJwtFromCookieWS(req: any): string | null
	{
		return cookie.parse(req.handshake?.headers?.cookie || "").access_token
	}

	async validate(payload: any) {
		return { userId: payload.sub, username: payload.username };
	}
}
