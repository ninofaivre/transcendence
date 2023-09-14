import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { contract, contractErrors } from "contract"
import { Response } from "express"
import { EnvService } from "src/env/env.service"
import { JwtAuthGuard, JwtAuthGuardBase, RefreshTokenGuard } from "./jwt-auth.guard"
import { isContractError } from "contract"
import { DevGuard, EnvGuard } from "src/env/env.guards"
import { PrismaService } from "src/prisma/prisma.service"
import { EnrichedRequest } from "src/types"

const c = contract.auth

@TsRest({ jsonQuery: true })
@Controller()
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly prisma: PrismaService,
	) {}

	@TsRestHandler(c.login)
	async login(@Res({ passthrough: true }) res: Response) {
		return tsRestHandler(c.login, async ({ body: { code, redirect_uri } }) => {
			const user = await this.authService.validateUser(code, redirect_uri)
			if (isContractError(user)) return user
			const { enabledTwoFA, ...rest } = user
			await this.authService.setNewTokensAsCookies(res, { ...rest, twoFA: !enabledTwoFA })
			if (enabledTwoFA) return contractErrors.TwoFATokenNeeded()
			return { status: 200, body: rest }
		})
	}

	@UseGuards(new EnvGuard('some', ['PUBLIC_MODE', 'DEV'], ['PUBLIC_DEV_LOGIN', true]))
	@TsRestHandler(c.loginDev)
	async loginDev(@Res({ passthrough: true }) res: Response) {
		return tsRestHandler(c.loginDev, async ({ body: { username } }) => {
			let user = await this.authService.validateUserDev(username)
			if (!user) {
				const res = await this.prisma.user
					.create({
						data: {
							name: username,
							intraUserName: username,
							displayName: `displayName ${username}`,
						},
						select: {
							name: true,
							intraUserName: true,
							displayName: true,
						},
					})
					.catch(() => contractErrors.UserAlreadyExist(`displayName ${username}`))
				if (isContractError(res)) return res
				const { name, ...rest } = res
				user = { ...rest, username: name }
			}
			await this.authService.setNewTokensAsCookies(res, { ...user, twoFA: true })
			return { status: 200, body: user }
		})
	}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c.logout)
	async logout(
		@Res({ passthrough: true }) res: Response,
		@Req() { user: { username } }: EnrichedRequest,
	) {
		return tsRestHandler(c.logout, async () => {
			res.cookie("access_token", "", { expires: new Date(0) })
			res.cookie("refresh_token", "", { expires: new Date(0) })
			this.authService.revokeRefreshToken(username)
			return { status: 200 as const, body: null }
		})
	}

	@UseGuards(JwtAuthGuardBase)
	@TsRestHandler(c.twoFAauth)
	async twoFAauth(
		@Req() { user }: EnrichedRequest,
		@Res({ passthrough: true }) response: Response,
	) {
		return tsRestHandler(c.twoFAauth, async ({ body: { twoFAtoken } }) => {
			const res = await this.authService.twoFAauth(user.username, twoFAtoken)
			if (isContractError(res)) return res
			await this.authService.setNewTokensAsCookies(response, { ...user, twoFA: true })
			return { status: 200, body: null }
		})
	}

	@UseGuards(RefreshTokenGuard)
	@TsRestHandler(c.refreshTokens)
	async refreshTokens(
		@Res({ passthrough: true }) res: Response,
		@Req()
		{
			user,
		}: Omit<Request, "user"> &
			Record<"user", EnrichedRequest["user"] & { refreshToken: string; twoFA: boolean }>,
	) {
		return tsRestHandler(c.refreshTokens, async () => {
			if (!(await this.authService.doesRefreshTokenMatch(user.username, user.refreshToken)))
				return contractErrors.Unauthorized()
			await this.authService.setNewTokensAsCookies(res, user)
			return { status: 200, body: null }
		})
	}
}
