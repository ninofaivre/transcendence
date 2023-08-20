import { Controller, Res, Request, UseGuards } from "@nestjs/common"
import { AuthService, EnrichedRequest } from "./auth.service"
import { NestControllerInterface, TsRest, TsRestHandler, nestControllerContract, tsRestHandler } from "@ts-rest/nest"
import { contract } from "contract"
import { AuthGuard } from "@nestjs/passport"
import { Response } from "express"

const c = contract.auth

@TsRest({ jsonQuery: true })
@Controller()
export class AuthController{
	constructor(private authService: AuthService) {}

	@TsRestHandler(c.login)
	async login(@Res({ passthrough: true }) res: any/* TODO: any==>Response */) {
        return tsRestHandler(c.login, async ({ body: { code } }) => {
            const user = await this.authService.validateUser(code)
            if (!user)
                return { status: 401, body: { code: "Unauthorized" } }
            res.cookie("access_token", await this.authService.login(user), {
                secure: true,
                sameSite: true,
                HttpOnly: true,
            })
            return { status: 200, body: user }
        })
	}

    @TsRestHandler(c.loginDev)
    async loginDev(@Res({ passthrough: true }) res: any) {
        return tsRestHandler(c.loginDev, async ({ body: { username } }) => {
            const user = await this.authService.validateUserDev(username)
            if (!user)
                return { status: 404, body: { code: "NotFound" } }
            res.cookie("access_token", await this.authService.login(user), {
                secure: true,
                sameSite: true,
                HttpOnly: true
            })
            return { status: 200, body: user }
        })
    }
    
    // TODO Dev login

	@TsRestHandler(c.logout)
	async logout(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(c.logout, async () => {
            res.cookie("access_token", "", { expires: new Date(0) })
            return { status: 200 as const, body: null }
        })
	}
}
