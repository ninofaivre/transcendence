import { UseGuards } from "@nestjs/common"
import { Controller, Request } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { UserService } from "./user.service"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { contract, isContractError } from "contract"
import { EnrichedRequest } from "src/auth/auth.service"

const c = contract.users

/*
TODO: Update this comment later (and probably moove it to another place)

Below is a *signUp* method in the nest controller
That method is in the *contract.users* contract but *not* in the multi-handler,
Let's call it an **exception**.

Every **exception** needs to be omitted in the type passed to the *tsRestHandler* function.

Every **exception** that shares its path with another endpoint in the multi-handler
needs to be higher than the multi-handler in the controller.

If an **exception** doesn't share its path with another endpoint, it can be
below the multi-handler but in that case it needs to be omitted in the type
passed to the *TsRestHandler* decorator too.
*/

@TsRest({ jsonQuery: true })
@Controller()
export class UserController {
	constructor(private userService: UserService) {}

	@TsRestHandler(c.signUp)
	signUp() {
		return tsRestHandler(c.signUp, async ({ body }) => {
			const res = await this.userService.createUser(body)
			return isContractError(res) ? res : { status: 201, body: res }
		})
	}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c)
	async handler(@Request() req: EnrichedRequest) {
		return tsRestHandler<Omit<typeof c, "signUp">>(c, {
			getMe: async () => {
				const res = await this.userService.getMe(req.user.username)
				return isContractError(res) ? res : { status: 200, body: res }
			},

			updateMe: async ({ body }) => {
				const res = await this.userService.updateMe(req.user.username, body)
				return isContractError(res) ? res : { status: 200, body: res }
			},

			searchUsers: async ({ query }) => ({
				status: 200,
				body: await this.userService.searchUsers(req.user.username, query),
			}),

			getUser: async ({ params }) => {
				const res = await this.userService.getUserProfile(req, params.userName)
				return isContractError(res) ? res : { status: 200, body: res }
			},
		})
	}
}
