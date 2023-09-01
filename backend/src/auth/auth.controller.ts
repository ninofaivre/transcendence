import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common"
import { AuthService, EnrichedRequest } from "./auth.service"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { contract, contractErrors } from "contract"
import { Response } from "express"
import { EnvService } from "src/env/env.service"
import { JwtAuthGuard, RefreshTokenGuard } from "./jwt-auth.guard"
import { isContractError } from "contract"
import { DevGuard } from "src/env.guards"
import { authenticator } from 'otplib'
import { toFileStream } from 'qrcode'

const c = contract.auth

const twoFAsecret = authenticator.generateSecret()
console.log(twoFAsecret)
const otpAuthUrl = authenticator.keyuri('nino', EnvService.env.APP_NAME, twoFAsecret)
console.log(otpAuthUrl)

@TsRest({ jsonQuery: true })
@Controller()
export class AuthController{

	constructor(private authService: AuthService) {}

	@TsRestHandler(c.login)
	async login(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(c.login, async ({ body: { code, redirect_uri } }) => {
            const user = await this.authService.validateUser(code, redirect_uri)
            if (isContractError(user))
                return user
            await this.authService.setNewTokensAsCookies(res, user)
            return { status: 200, body: user }
        })
	}

    @Get('/TESTA')
    getTestA(@Res()response: Response) {
        return toFileStream(response, otpAuthUrl)
    }

    @Get('/TESTB/:code')
    getTestB(@Param('code')token: string) {
        if (authenticator.verify({ token, secret: twoFAsecret })) {
            console.log("user authentifié")
            return "SUCCESS"
        }
        else {
            console.log("user non authentifié")
            return "FAILURE"
        }
    }

    @UseGuards(DevGuard)
    @TsRestHandler(c.loginDev)
    async loginDev(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(c.loginDev, async ({ body: { username } }) => {
            const user = await this.authService.validateUserDev(username)
            if (!user)
                return { status: 404, body: { code: "NotFound" } }
            await this.authService.setNewTokensAsCookies(res, user)
            return { status: 200, body: user }
        })
    }

    @UseGuards(JwtAuthGuard)
	@TsRestHandler(c.logout)
	async logout(@Res({ passthrough: true }) res: Response, @Req(){ user: { username } }: EnrichedRequest) {
        return tsRestHandler(c.logout, async () => {
            res.cookie("access_token", "", { expires: new Date(0) })
            res.cookie("refresh_token", "", { expires: new Date(0) })
            this.authService.revokeRefreshToken(username)
            return { status: 200 as const, body: null }
        })
	}

    @UseGuards(RefreshTokenGuard)
    @TsRestHandler(c.refreshTokens)
    async refreshTokens(
        @Res({ passthrough: true })res: Response,
        @Req(){ user: { username, refreshToken } }: Omit<Request, "user"> & Record<"user", EnrichedRequest['user'] & { refreshToken: string }>
    ) {
        const user = await this.authService.doesRefreshTokenMatch(username, refreshToken)
        if (!user)
            return contractErrors.Unauthorized()
        await this.authService.setNewTokensAsCookies(res, user)
        return tsRestHandler(c.refreshTokens, async () => {
            return { status: 200, body: null }       
        })
    }

}
