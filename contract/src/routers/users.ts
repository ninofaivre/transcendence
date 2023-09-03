import { initContract } from "@ts-rest/core"

import { zChanType, zAccessPolicyLevel } from "../generated-zod"

import { zChanTitle } from "./chans"
import { zUserName, zUserStatus, zUserPassword } from "../zod/user.zod"
import { z } from "zod"
import { getErrorsForContract } from "../errors"
import { StreamableFile } from "@nestjs/common"

const c = initContract()

export const zUserProfilePreviewReturn = z.strictObject({
	userName: zUserName,
})

export const zUserProfileReturn = zUserProfilePreviewReturn.extend({
	dmPolicyLevel: zAccessPolicyLevel.exclude(["NO_ONE"]),
	commonChans: z.array(
		z.strictObject({ type: zChanType, title: zChanTitle.nullable(), id: z.string().uuid() }),
	),
    blockedId: z.string().uuid().nullable(),
    blockedById: z.string().uuid().nullable(),
    friendId: z.string().uuid().nullable(),
    invitedId: z.string().uuid().nullable(),
    invitingId: z.string().uuid().nullable(),
	status: zUserStatus,
    winRatePercentage: z.number().positive().int().max(100),
    nWin: z.number().positive().int(),
    nLoose: z.number().positive().int(),
    nMatches: z.number().positive().int()
})

export const zPartialUserProfileReturn = zUserProfileReturn.partial()

export const zMyProfileReturn = z.strictObject({
    enabledTwoFA: z.boolean(),
	userName: zUserName,
	dmPolicyLevel: zAccessPolicyLevel.exclude(["NO_ONE"]),
	statusVisibilityLevel: zAccessPolicyLevel,
})

const zSearchUsersQueryBase = z.strictObject({
	userNameContains: z.string().nonempty(),
	nResult: z.number().positive().int().max(30).default(10),
})

export const acceptedProfilePictureMimeTypes = ['image/png', 'image/jpeg'] as const

const zBlockedUser = z.strictObject({
    id: z.string().uuid(),
    blockedUserName: zUserName
})

export const usersContract = c.router(
	{
		searchUsersV1: {
			method: "GET",
            deprecated: true,
			path: "/V1/",
			summary: "search for users",
			description: "not finished yet (beta)",
			query: z.union([
				zSearchUsersQueryBase.extend({
					filter: z.strictObject({
						type: z.literal("inc").default("inc"),
						friends: z.boolean().default(true),
						mySelf: z.boolean().default(false),
						blocked: z.boolean().default(true),
						blockedBy: z.boolean().default(true),
						// canStartDm: z.boolean().default(true)
					}),
				}),
				zSearchUsersQueryBase.extend({
					filter: z.strictObject({
						type: z.literal("only"),
						friends: z.boolean().default(false),
						hasDm: z.boolean().default(false),
						blocked: z.boolean().default(false),
						blockedBy: z.boolean().default(false),
						// canStartDm: z.boolean().default(false)
					}),
				}),
			]),
			responses: {
				200: z.array(zUserProfilePreviewReturn),
			},
		},
        searchUsersV2: {
            method: "GET",
            path: "/",
            query: z.union([
                zSearchUsersQueryBase.extend({
                    action: z.enum([/*"CREATE_DM", */"CREATE_FRIEND_INVITE", "*"]),
                    params: z.strictObject({})
                }),
                zSearchUsersQueryBase.extend({
                    action: z.literal("CREATE_CHAN_INVITE"),
                    params: z.strictObject({
                        chanId: z.string().uuid()
                    })
                })
            ]),
            responses: {
                200: z.array(zUserProfilePreviewReturn)
            }
        },
		getMe: {
			method: "GET",
			path: "/@me",
			responses: {
				200: zMyProfileReturn,
				...getErrorsForContract(c, [404, "NotFoundUserForValidToken"]),
			},
		},
		getUser: {
			method: "GET",
			path: "/:userName",
			pathParams: z.strictObject({
				userName: zUserName,
			}),
			responses: {
				200: zUserProfileReturn,
				...getErrorsForContract(c, [404, "NotFoundUser"]),
			},
		},
		getUserProfilePicture: {
			method: "GET",
			path: "/:userName/profilePicture",
			pathParams: z.strictObject({
				userName: zUserName,
			}),
			responses: {
				200: c.type<StreamableFile>(),
				...getErrorsForContract(c,
                    [404, "NotFoundProfilePicture", "NotFoundUserForValidToken"]
				),
			},
		},
		updateMe: {
			method: "PATCH",
			path: "/@me",
			// TODO after BH add userName
			body: zMyProfileReturn.omit({ userName: true }).partial(),
			responses: {
				200: zMyProfileReturn,
				...getErrorsForContract(c, [404, "NotFoundUser"]),
			},
		},
        qrCode: {
            method: "GET",
            query: z.strictObject({
                lightColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/).default("#ffffff"),
                darkColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/).default("#000000")
            }),
            path: "/@me/qr-code",
            responses: {
                200: c.type<StreamableFile>(),
                ...getErrorsForContract(c,
                    [404, "NotFoundUserForValidToken"],
                )
            }
        },
        enable2FA: {
            method: "POST",
            path: "/@me/twoFA",
            body: z.strictObject({
                twoFAtoken: z.string()
            }),
            responses: {
                204: c.type<null>(),
                ...getErrorsForContract(c,
                    [400, "twoFAqrCodeNeverRequested", "twoFAalreadyEnabled"],
                    [403, "InvalidTwoFAToken"],
                    [404, "NotFoundUserForValidToken"]
                )
            }
        },
        disable2FA: {
            method: "DELETE",
            path: "/@me/twoFA",
            body: z.strictObject({
                twoFAtoken: z.string()
            }),
            responses: {
                200: c.type<null>(),
                ...getErrorsForContract(c,
                    [400, "twoFAalreadyDisabled"],
                    [403, "InvalidTwoFAToken"],
                    [404, "NotFoundUserForValidToken"]
                )
            }
        },
		setMyProfilePicture: {
			method: "PUT",
			path: "/@me/PP",
			contentType: "multipart/form-data",
			body: c.type<{ profilePicture: File }>(),
			responses: {
				204: c.type<null>(),
                ...getErrorsForContract(c,
                    [404, "NotFoundProfilePicture", "NotFoundUserForValidToken"],
                    [409, "ServerUnableToWriteProfilePicture"]
                )
			},
		},
		signUp: {
			method: "POST",
			path: "/",
			body: z.strictObject({
				username: zUserName,
				code: z.string(),
                redirect_uri: z.string().url()
			}),
			responses: {
				201: z.object({
					username: zUserName,
                    intraUserName: z.string()
				}),
				...getErrorsForContract(c,
                    [409, "UserAlreadyExist"],
                    [403, "Invalid42ApiCode"]
                ),
			},
		},
        getBlockedUsers: {
            method: "GET",
            path: "/@me/blockedUsers",
            responses: {
                200: z.array(zBlockedUser)
            }
        },
        blockUser: {
            method: "POST",
            path: "/@me/blockedUsers",
            body: z.strictObject({
                username: zUserName
            }),
            responses: {
                201: zBlockedUser
            }
        },
        unBlockUser:  {
            method: "DELETE",
            path: "/@me/blockedUsers",
            query: z.strictObject({
                username: zUserName
            }),
            body: c.type<null>(),
            responses: {
                204: c.type<null>(),
                ...getErrorsForContract(c,
                    [404, "NotFoundBlockedUser"]
                )
            }
        }
	},
	{
		pathPrefix: "/users",
	},
)

export type UserEvent =
    | {
        type: "UPDATED_USER_STATUS"
        data: {
            userName: z.infer<typeof zUserName>
            status: z.infer<typeof zUserStatus>
        },
    }
    | {
        type: "BLOCKED_BY_USER",
        data: {
            username: z.infer<typeof zUserName>
        }
    }
    | {
        type: "UNBLOCKED_BY_USER",
        data: {
            username: z.infer<typeof zUserName>
        }
    }

