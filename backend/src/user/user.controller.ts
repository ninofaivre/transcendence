import { Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common"
import { Controller, Request } from "@nestjs/common"
import { Response } from "express"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { UserService } from "./user.service"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { contract, isContractError } from "contract"
import { EnrichedRequest } from "src/auth/auth.service"
import { FileInterceptor } from "@nestjs/platform-express"
import { EnvService } from "src/env/env.service"

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
	constructor(
        private userService: UserService
    ) {}

	@TsRestHandler(c.signUp)
	async signUp() {
		return tsRestHandler(c.signUp, async ({ body }) => {
			const res = await this.userService.createUser(body)
			return isContractError(res) ? res : { status: 201, body: res }
		})
	}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('profilePicture',
        {
            limits: {
                fileSize: EnvService.env.PROFILE_PICTURE_MAX_SIZE_MB * 1000000,
            }
        }
    ))
    @TsRestHandler(c.setMyProfilePicture)
    async setMyProfilePicture(@Request() { user: { username } }: EnrichedRequest, @UploadedFile()profilePicture: Express.Multer.File) {
        return tsRestHandler(c.setMyProfilePicture, async ({ body }) => {
            const res = await this.userService.setMyProfilePicture(username, profilePicture)
            return res ? res : { status: 204, body: null }
        })
    }

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c)
	async handler(@Request() { user: { username } }: EnrichedRequest, @Res({ passthrough: true }) res: Response) {
		return tsRestHandler<Omit<typeof c, "signUp" | "setMyProfilePicture">>(c, {
			getMe: async () => {
				const res = await this.userService.getMe(username)
				return isContractError(res) ? res : { status: 200, body: res }
			},

			updateMe: async ({ body }) => {
				const res = await this.userService.updateMe(username, body)
				return isContractError(res) ? res : { status: 200, body: res }
			},

			searchUsers: async ({ query }) => ({
				status: 200,
				body: await this.userService.searchUsers(username, query),
			}),

			getUser: async ({ params }) => {
				const res = await this.userService.getUserProfile(username, params.userName)
				return isContractError(res) ? res : { status: 200, body: res }
			},

            getUserProfilePicture: async ({ params: { userName: otherUserName } }) => {
                // TODO get correct mime type instead of hard coded png
                res.set({
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="profilePicture_${otherUserName}.png"`,
                });
                const ress = await this.userService.getUserProfilePicture(username, otherUserName)
                return isContractError(ress) ? ress: { status: 200, body: ress as any }
            }
		})
	}
}
