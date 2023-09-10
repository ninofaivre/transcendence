import { Get, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common"
import { Controller, Request } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { UserService } from "./user.service"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { contract, isContractError } from "contract"
import { EnrichedRequest } from "src/types"
import { AuthService } from "src/auth/auth.service"
import { FileInterceptor } from "@nestjs/platform-express"
import { EnvService } from "src/env/env.service"
import { Response } from "express"
import { toBuffer } from "qrcode"

const c = contract.users

/*
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
        private readonly userService: UserService,
        private readonly authService: AuthService
    ) {}

	@TsRestHandler(c.signUp)
	async signUp(@Res({ passthrough: true })res: Response) {
		return tsRestHandler(c.signUp, async ({ body }) => {
			const user = await this.userService.createUser(body)
			if(isContractError(user))
                return user
            await this.authService.setNewTokensAsCookies(res, { ...user, twoFA: true })
            return { status: 201, body: user }
		})
	}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('profilePicture',
        {
            limits: {
                fileSize: EnvService.env.PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB * 1000000,
            }
        }
    ))
    @TsRestHandler(c.setMyProfilePicture)
    async setMyProfilePicture(@EnrichedRequest() { user }: EnrichedRequest, @UploadedFile()profilePicture: Express.Multer.File) {
        return tsRestHandler(c.setMyProfilePicture, async ({ body }) => {
            const res = await this.userService.setMyProfilePicture(user, profilePicture)
            return res ? res : { status: 204, body: null }
        })
    }

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c)
	async handler(@EnrichedRequest() { user }: EnrichedRequest) {
        const { username } = user
		return tsRestHandler<Omit<typeof c, "signUp" | "setMyProfilePicture">>(c, {
			getMe: async () => {
				const res = await this.userService.getMe(username)
				return isContractError(res) ? res : { status: 200, body: res }

            },
			updateMe: async ({ body }) => {
				const res = await this.userService.updateMe(user, body)
				return isContractError(res) ? res : { status: 200, body: res }
			},

			searchUsersV2: async ({ query }) => ({
				status: 200,
				body: await this.userService.searchUsersV2(username, query),
			}),

			getUser: async ({ params }) => {
				const res = await this.userService.getUserProfile(username, params.userName)
				return isContractError(res) ? res : { status: 200, body: res }
			},

            getUserProfilePicture: async ({ params: { userName: otherUserName } }) => {
                const res = await this.userService.getUserProfilePicture(otherUserName)
                return isContractError(res) ? res : { status: 200, body: res }
            },

            qrCode: async ({ query: { lightColor, darkColor } }) => {
                const res = await this.userService.getUserTwoFAqrCode(username)
                if (isContractError(res))
                    return res
                const buffer = await toBuffer(res,
                    {
                        color: { light: lightColor, dark: darkColor },
                    })
                return { status: 200, body: new StreamableFile(buffer) }
            },

            enable2FA: async ({ body: { twoFAtoken } }) => {
                const res = await this.userService.enableTwoFA(username, twoFAtoken)
                return isContractError(res) ? res : { status: 200, body: null }
            },
            
            disable2FA: async ({ body: { twoFAtoken } }) => {
                const res = await this.userService.disableTwoFA(username, twoFAtoken)
                return isContractError(res) ? res : { status: 200, body: null }
            },

            blockUser: async ({ body: { username: blockedUserName } }) => {
                const res = await this.userService.blockUser(user, blockedUserName)
                return isContractError(res) ? res : { status: 201, body: res }
            },

            unBlockUser: async ({ query: { username: blockedUserName } }) => {
                const res = await this.userService.unblockUser(user, blockedUserName)
                return isContractError(res) ? res : { status: 204, body: null }
            },

		})
	}
}
