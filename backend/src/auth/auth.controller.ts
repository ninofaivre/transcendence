import { Controller, Res, Request, Get, Post, UseGuards } from "@nestjs/common"
import { LocalAuthGuard } from "./local-auth.guard"
import { AuthService } from "./auth.service"
import { NestControllerInterface, TsRest, nestControllerContract } from "@ts-rest/nest"
import { contract } from "contract"

const c = nestControllerContract(contract.auth)

@Controller()
export class AuthController implements NestControllerInterface<typeof c> {
	constructor(private authService: AuthService) {}

	@UseGuards(LocalAuthGuard)
	@TsRest(c.login)
	async login(@Res({ passthrough: true }) res: any, @Request() req: any) {
		res.cookie("access_token", await this.authService.login(req.user), {
			secure: true,
			sameSite: true,
		})
		return { status: 202 as const, body: null }
	}

	@TsRest(c.logout)
	async logout(@Res({ passthrough: true }) res: any) {
		res.cookie("access_token", "", { expires: new Date(0) })
		return { status: 200 as const, body: null }
	}
}
