import { Injectable } from "@nestjs/common"
import { UserService } from "../user/user.service"
import { JwtService } from "@nestjs/jwt"
import { CookieOptions, Request, Response } from "express"
import { Oauth42Service } from "src/oauth42/oauth42.service"
import { PrismaService } from "src/prisma/prisma.service"
import { EnvService } from "src/env/env.service"
import * as bcrypt from "bcrypt"
import * as cookie from "cookie"
import { contract, contractErrors } from "contract"
import { Socket } from "socket.io"
import { JwtPayload } from "./jwt.strategy"
import { authenticator } from "otplib"
import { EnrichedRequest } from "src/types"

const c = contract.auth

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly usersService: UserService,
		private readonly jwtService: JwtService,
		private readonly oAuth: Oauth42Service,
	) {}

	private static readonly cookieOptions: CookieOptions = {
		httpOnly: true,
		sameSite: "strict",
		secure:
			(EnvService.env.PUBLIC_BACKEND_SCHEME === "https" &&
				EnvService.env.PUBLIC_FRONTEND_SCHEME === "https") ||
			(EnvService.env.PUBLIC_BACKEND_HOST === "localhost" &&
				EnvService.env.PUBLIC_FRONTEND_HOST === "localhost"),
		domain: EnvService.env.PUBLIC_BACKEND_HOST,
	} as const

	public isValidAccessTokenFromCookie(client: Socket) {
		const access_token = cookie.parse(client.handshake?.headers?.cookie || "").access_token
		return this.jwtService.verify<JwtPayload>(access_token || "", {
			secret: EnvService.env.JWT_SECRET,
		})
	}

	public async setNewTokensAsCookies(
		res: Response,
		user: EnrichedRequest["user"] & { twoFA: boolean },
	) {
		const tokens = await this.getTokens(user)
		res.cookie("access_token", tokens.accessToken, {
			...AuthService.cookieOptions,
			maxAge: (EnvService.env.PUBLIC_MODE === "DEV" ? 3600 : 900) * 1000,
		})
		res.cookie("refresh_token", tokens.refreshToken, {
			...AuthService.cookieOptions,
			maxAge: 604800 * 1000,
			path: c.refreshTokens.path,
		})
		this.updateRefreshToken(user.username, tokens.refreshToken)
	}

	public async getTokens(user: EnrichedRequest["user"] & { twoFA: boolean }) {
		const payload = {
			username: user.username,
			intraUserName: user.intraUserName,
			sub: user.username,
			twoFA: user.twoFA,
		}
		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(payload, {
				secret: EnvService.env.JWT_SECRET,
				expiresIn: EnvService.env.PUBLIC_MODE === "DEV" ? "1h" : "15m",
			}),
			this.jwtService.signAsync(payload, {
				secret: EnvService.env.JWT_SECRET,
				expiresIn: "7d",
			}),
		])
		return { accessToken, refreshToken }
	}

	public async validateUser(code: string, redirect_uri: string) {
		const intraUserName = await this.oAuth.getIntraUserName(code, redirect_uri)
		if (!intraUserName) return contractErrors.Invalid42ApiCode(code)
		const user = await this.prisma.user.findUnique({
			where: { intraUserName },
			select: { name: true, enabledTwoFA: true, displayName: true },
		})
		if (!user) return contractErrors.NotRegisteredUser(intraUserName)
		const { name, ...rest } = user
		return { ...rest, username: name, intraUserName }
	}

	public async validateUserDev(username: string) {
		const user = await this.prisma.user.findUnique({
			where: { name: username },
			select: { name: true, intraUserName: true, displayName: true },
		})
		if (!user) return null
		const { name, ...rest } = user
		return { ...rest, username: name }
	}

	public async updateRefreshToken(username: string, refreshToken: string) {
		return bcrypt.hash(refreshToken, 10).then((hashedRefreshToken) =>
			this.prisma.user.update({
				where: { name: username },
				data: { refreshToken: hashedRefreshToken },
			}),
		)
	}

	public async revokeRefreshToken(username: string) {
		return this.prisma.user.update({ where: { name: username }, data: { refreshToken: null } })
	}

	public async doesRefreshTokenMatch(username: string, refreshToken: string) {
		const user = await this.usersService.getUserByName(username, { refreshToken: true })
		if (!user || !user.refreshToken) return null
		return bcrypt.compareSync(refreshToken, user.refreshToken) ? true : false
	}

	public async twoFAauth(username: string, twoFAtoken: string) {
		const user = await this.usersService.getUserByName(username, {
			twoFAsecret: true,
			enabledTwoFA: true,
		})
		if (!user) return contractErrors.NotFoundUserForValidToken(username)
		if (!user.enabledTwoFA) return
		if (!user.twoFAsecret) return contractErrors.twoFAqrCodeNeverRequested()
		if (!authenticator.verify({ token: twoFAtoken, secret: user.twoFAsecret }))
			return contractErrors.InvalidTwoFAToken(twoFAtoken)
	}
}
