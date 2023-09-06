import type { Prisma, AccessPolicyLevel as AccessPolicyLevelPrisma } from "@prisma/client"
import { Inject, Injectable, StreamableFile, forwardRef } from "@nestjs/common"
import { NotFoundException, ConflictException } from "@nestjs/common"
import { hash } from "bcrypt"
import { PrismaService } from "src/prisma/prisma.service"
import { NestRequestShapes } from "@ts-rest/nest"
import { FlattenUnionObjectByDiscriminator, acceptedProfilePictureMimeTypes, contract, contractErrors, isContractError } from "contract"
import { z } from "zod"
import { zUserProfileReturn, zMyProfileReturn, zUserProfilePreviewReturn, zUserStatus } from "contract"
import { SseService } from "src/sse/sse.service"
import { ChansService } from "src/chans/chans.service"
import { FriendsService } from "src/friends/friends.service"
import { DmsService } from "src/dms/dms.service"
import { AccessPolicyLevel, ProximityLevel } from "src/types"
import { fileTypeFromBuffer } from "../disgustingImports"
import { join } from "path"
import { EnvService } from "src/env/env.service"
import { readFileSync, writeFileSync } from "fs"
import { Oauth42Service } from "src/oauth42/oauth42.service"
import { GameWebsocketGateway } from "src/websocket/game.websocket.gateway"
import { authenticator } from "otplib"

const sharp = require('sharp')

type RequestShapes = NestRequestShapes<typeof contract.users>

@Injectable()
export class UserService {
	constructor(
		private readonly prisma: PrismaService,
		@Inject(forwardRef(() => SseService))
		private readonly sse: SseService,
		@Inject(forwardRef(() => ChansService))
		private readonly chansService: ChansService,
		@Inject(forwardRef(() => FriendsService))
		private readonly friendsService: FriendsService,
		@Inject(forwardRef(() => DmsService))
		private readonly dmsService: DmsService,
        private readonly oauth: Oauth42Service,
        @Inject(forwardRef(() => GameWebsocketGateway))
        private readonly gameWs: GameWebsocketGateway
	) {}

	private getUserProfilePreviewSelectForUser(username: string) {
		return {
			name: true,
            displayName: true
		} satisfies Prisma.UserSelect
	}

	private getUserProfileSelectForUser(username: string) {
		return {
			...this.getUserProfilePreviewSelectForUser(username),
			chans: {
				where: { users: { some: { name: username } } },
				select: { title: true, id: true, type: true },
			},
			dmPolicyLevel: true,
            incomingFriendInvitation: {
                where: {
                    status: 'PENDING',
                    invitingUserName: username
                },
                select: { id: true }
            },
            outcomingFriendInvitation: {
                where: {
                    status: 'PENDING',
                    invitedUserName: username
                },
                select: { id: true }
            },
            friend: { where: { requestedUserName: username }, select: { id: true } },
            friendOf: { where: { requestingUserName: username}, select: { id: true } },
			blockedUser: { where: { blockedUserName: username }, select: { id: true } },
			blockedByUser: { where: { blockingUserName: username }, select: { id: true } },
            _count: {
                select: { wonMatchHistory: true, lostMatchHistory: true }
            }
		} satisfies Prisma.UserSelect
	}

	private myProfileSelect = {
		name: true,
        displayName: true,
		dmPolicyLevel: true,
		statusVisibilityLevel: true,
        enabledTwoFA: true
	} satisfies Prisma.UserSelect

	private myProfileSelectGetPayload = {
		select: this.myProfileSelect,
	} satisfies Prisma.UserDefaultArgs

	private userProfilePreviewSelectGetPayload = {
		select: this.getUserProfilePreviewSelectForUser("example"),
	} satisfies Prisma.UserDefaultArgs

	private userProfileSelectGetPayload = {
		select: this.getUserProfileSelectForUser("example"),
	} satisfies Prisma.UserDefaultArgs

	private userOwnProfileSelectGetPayload = {
		select: this.myProfileSelect,
	} satisfies Prisma.UserDefaultArgs

	private formatUserProfilePreviewForUser(
		username: string,
		toFormat: Prisma.UserGetPayload<typeof this.userProfilePreviewSelectGetPayload>,
	): z.infer<typeof zUserProfilePreviewReturn> {
		const { name, ...rest } = toFormat
		return { ...rest, userName: name }
	}

	private formatUserProfilePreviewForUserArray(
		username: string,
		toFormat: Prisma.UserGetPayload<typeof this.userProfilePreviewSelectGetPayload>[],
	): z.infer<typeof zUserProfilePreviewReturn>[] {
		return toFormat.map((el) => this.formatUserProfilePreviewForUser(username, el))
	}

    public getProximityLevelSelect(username: string) {
        return {
            friend: {
                where: { requestedUserName: username },
                take: 1,
                select: { id: true }
            },
            friendOf: {
                where: { requestingUserName: username },
                take: 1,
                select: { id: true }
            },
            chans: {
                where: { users: { some: { name: username } } },
                take: 1,
                select: { id: true }
            },
            blockedUser: {
                where: { blockedUserName: username },
                take: 1,
                select: { blockedUserName: true }
            },
            blockedByUser: {
                where: { blockingUserName: username },
                take: 1,
                select: { blockingUserName: true }
            }
        } satisfies Prisma.UserSelect
    }

	private async formatUserStatusForUser(
		username: string,
		toGetStatusUserName: string,
	): Promise<z.infer<typeof zUserStatus>> {
		const data = await this.getUserByNameOrThrow(toGetStatusUserName, {
			statusVisibilityLevel: true,
            ...this.getProximityLevelSelect(username)
		})
        return this.getUserStatusByProximity(toGetStatusUserName,
            this.getProximityLevel(data),
            data.statusVisibilityLevel)
	}

	async getUserProfile(username: string, toGetUserName: string) {
		const profile = await this.getUserByName(
			toGetUserName,
			this.getUserProfileSelectForUser(username),
		)
		if (!profile) return contractErrors.NotFoundUser(toGetUserName)
		return this.formatUserProfileForUser(username, profile)
	}

	public getProximityLevel({
		friend,
		friendOf,
		chans,
        blockedUser
	}: {
		friend: {}[],
		friendOf: {}[],
		chans: {}[],
        blockedUser: {}[]
	}): keyof typeof ProximityLevel {
        let level: keyof typeof ProximityLevel = chans.length ? "COMMON_CHAN" : "ANYONE"
        level = (friend.length || friendOf.length) ? "FRIEND" : level
        level = blockedUser.length ? "BLOCKED" : level
        return level
	}

	private async formatUserProfileForUser(
		username: string,
		toFormat: Prisma.UserGetPayload<typeof this.userProfileSelectGetPayload>,
	): Promise<z.infer<typeof zUserProfileReturn>> {
		const { name, displayName, chans, blockedUser, blockedByUser,
            dmPolicyLevel, friend, friendOf,
            incomingFriendInvitation, outcomingFriendInvitation,
            _count, ...rest } = toFormat

        const nMatches = _count.lostMatchHistory + _count.wonMatchHistory

		return {
			...rest,
            dmPolicyLevel: (dmPolicyLevel === "NO_ONE") ? "ONLY_FRIEND" : dmPolicyLevel,
			status: await this.formatUserStatusForUser(username, name),
			...this.formatUserProfilePreviewForUser(username, { name, displayName }),
			commonChans: chans,
            friendId: friend[0]?.id || friendOf[0]?.id || null,
            invitedId: outcomingFriendInvitation[0]?.id || null,
            invitingId: incomingFriendInvitation[0]?.id || null,
            blockedId: blockedByUser[0]?.id || null,
            blockedById: blockedUser[0]?.id || null,
            winRatePercentage: Math.round((nMatches !== 0)
                ? _count.wonMatchHistory / nMatches * 100
                : 0),
            nWin: _count.wonMatchHistory,
            nLoose: _count.lostMatchHistory,
            nMatches
		}
	}

	formatMe(
		toFormat: Prisma.UserGetPayload<typeof this.myProfileSelectGetPayload>,
	): z.infer<typeof zMyProfileReturn> {
		const { name, dmPolicyLevel, ...rest } = toFormat
		return {
            ...rest,
            dmPolicyLevel: (dmPolicyLevel === "NO_ONE") ? "ONLY_FRIEND" : dmPolicyLevel,
            userName: name
        }
	}

	async getMe(username: string) {
		const me = await this.getUserByName(username, this.myProfileSelect)
		if (!me) return contractErrors.NotFoundUserForValidToken(username)
		return this.formatMe(me)
	}

	getArrayOfUniqueUserNamesFromStatusData(
		data: Exclude<Awaited<ReturnType<typeof this.getNotifyStatusData>>, null>,
	) {
        const blockUserNames = data.blockedUser.map(el => el.blockedUserName)
            .concat(data.blockedByUser.map(el => el.blockingUserName))
		return [
			...new Set<string>(
				data.friend
					.map((el) => el.requestedUserName)
					.concat(data.friendOf.map((el) => el.requestingUserName))
					.concat(data.directMessage.map((el) => el.requestedUserName))
					.concat(data.directMessageOf.map((el) => el.requestingUserName)),
			),
		].filter(el => !blockUserNames.includes(el))
	}

	async updateMe(username: string, dto: RequestShapes["updateMe"]["body"]) {
		const oldData = await this.getNotifyStatusData(username)
		if (!oldData) return contractErrors.NotFoundUser(username)
		const oldUserNames = this.getArrayOfUniqueUserNamesFromStatusData(oldData)

		const updatedMe = await this.prisma.user.update({
			where: { name: username },
			data: dto,
			select: this.myProfileSelect,
		})

		const newData = await this.getNotifyStatusData(username)
		if (!newData) return contractErrors.NotFoundUser(username)
		const newUserNames = this.getArrayOfUniqueUserNamesFromStatusData(newData)

		this.sse.pushEventMultipleUser(
			oldUserNames.filter((el) => !newUserNames.includes(el)),
			{
				type: "UPDATED_USER_STATUS",
				data: { userName: username, status: "INVISIBLE" },
			},
		)
		this.sse.pushEventMultipleUser(
			newUserNames.filter((el) => !oldUserNames.includes(el)),
			{
				type: "UPDATED_USER_STATUS",
				data: { userName: username, status: this.getUserStatus(username) },
			},
		)

		return this.formatMe(updatedMe)
	}

	public async getUserByNameOrThrow<T extends Prisma.UserSelect>(
		username: string,
		select: Prisma.SelectSubset<T, Prisma.UserSelect>,
	) {
		const user = await this.prisma.user.findUnique({
			where: { name: username },
			select: select,
		})
		if (!user) throw new NotFoundException(`not found user ${username}`)
		return user
	}

	public async getUserByName<T extends Prisma.UserSelect>(
		name: string,
		select: Prisma.SelectSubset<T, Prisma.UserSelect>,
	) {
		const user = await this.prisma.user.findUnique({
			where: { name },
			select,
		})
		return user
	}

	async createUser({ code, displayName, redirect_uri }: RequestShapes["signUp"]["body"]) {
        const intraUserName = await this.oauth.getIntraUserName(code, redirect_uri)
        if (!intraUserName)
            return contractErrors.Invalid42ApiCode(code)
        const user = await this.prisma.user.findMany({
            where: {
                OR: [
                    { intraUserName },
                    { name: intraUserName },
                    { displayName }
                ]
            },
            select: {
                name: true,
                intraUserName: true
            },
            take: 1
        })
        if (user.length)
            return contractErrors.UserAlreadyExist(`${intraUserName} || ${displayName}`)
        await this.prisma.user.create({
            data: {
                intraUserName,
                name: intraUserName,
                displayName
            }
        })
		return { displayName, username: intraUserName, intraUserName }
	}

	private async getNotifyStatusData(username: string) {
		return this.getUserByName(username, {
            blockedUser: {
                select: { blockedUserName: true }
            },
            blockedByUser: {
                select: { blockingUserName: true }
            },
			friend: {
				where: { requestingUser: { statusVisibilityLevel: { not: "NO_ONE" } } },
				select: { requestedUserName: true },
			},
			friendOf: {
				where: { requestedUser: { statusVisibilityLevel: { not: "NO_ONE" } } },
				select: { requestingUserName: true },
			},
			directMessage: {
				where: {
					requestingUser: { statusVisibilityLevel: { not: "NO_ONE" } },
					OR: [
						{
							OR: [
								{
									requestedUser: {
										friend: { some: { requestedUserName: username } },
									},
								},
								{
									requestedUser: {
										friendOf: { some: { requestingUserName: username } },
									},
								},
							],
						},
						{
							requestingUser: { statusVisibilityLevel: "IN_COMMON_CHAN" },
							requestedUser: {
								chans: { some: { users: { some: { name: username } } } },
							},
						},
						{
							requestingUser: { statusVisibilityLevel: "ANYONE" },
						},
					],
				},
				select: {
					requestedUserName: true,
				},
			},
			directMessageOf: {
				where: {
					requestedUser: { statusVisibilityLevel: { not: "NO_ONE" } },
					OR: [
						{
							OR: [
								{
									requestingUser: {
										friend: { some: { requestingUserName: username } },
									},
								},
								{
									requestingUser: {
										friendOf: { some: { requestedUserName: username } },
									},
								},
							],
						},
						{
							requestedUser: { statusVisibilityLevel: "IN_COMMON_CHAN" },
							requestingUser: {
								chans: { some: { users: { some: { name: username } } } },
							},
						},
						{
							requestedUser: { statusVisibilityLevel: "ANYONE" },
						},
					],
				},
				select: {
					requestingUserName: true,
				},
			},
		})
	}

    public getUserStatus(username: string) {
        const wsStatus = this.gameWs.getStatusByUserName(username)
        const sseStatus = this.sse.isUserOnline(username) ? "ONLINE" : "OFFLINE"
        if (wsStatus === "OFFLINE")
            return sseStatus
        return wsStatus
    }

	public getUserStatusByProximity = (
        username: string,
        proximity: keyof typeof ProximityLevel,
        visibility: AccessPolicyLevelPrisma
    ) => (ProximityLevel[proximity] < AccessPolicyLevel[visibility])
        ? "INVISIBLE"
        : this.getUserStatus(username)

	public async notifyStatus(username: string) {
		const data = await this.getNotifyStatusData(username)
		if (!data) return
		const toNotifyUserNames = this.getArrayOfUniqueUserNamesFromStatusData(data)
		this.sse.pushEventMultipleUser(toNotifyUserNames, {
			type: "UPDATED_USER_STATUS",
			data: { userName: username, status: this.getUserStatus(username) },
		})
	}

    // return contractError if invalid profile picture provided, else return null
    public async isInvalidProfilePicture(buffer: Buffer) {
        const fileType = await fileTypeFromBuffer(buffer)
        if (!fileType
            || !(acceptedProfilePictureMimeTypes as readonly string[])
                    .includes(fileType.mime)
        )
            return contractErrors.InvalidProfilePicture('unsupported mimetype')
        const { width, height } = await sharp(buffer).metadata()
        if (width !== height)
            return contractErrors.InvalidProfilePicture('not square')
        if (width < 50)
            return contractErrors.InvalidProfilePicture('too small')
        return null
    }

    public async setMyProfilePicture(username: string, profilePicture: Express.Multer.File) {
        if (!profilePicture)
            return contractErrors.InvalidProfilePicture('no file')
        let buffer = profilePicture.buffer
        const contractError = await this.isInvalidProfilePicture(buffer)
        if (contractError)
            return contractError 
        const user = await this.getUserByName(username, { profilePicture: true })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(username)
        const { profilePicture: profilePictureFileName } = user
        if (username === 'tom')
            buffer = await sharp(profilePicture.buffer).negate().toBuffer()
        try {
            writeFileSync(join(EnvService.env.PROFILE_PICTURE_DIR, profilePictureFileName), buffer)
            return null
        } catch {}
        return contractErrors.ServerUnableToWriteProfilePicture()
    }

    public async getUserProfilePicture(otherUserName: string) {
        const user = await this.getUserByName(otherUserName, { profilePicture: true })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(otherUserName)
        const { profilePicture: profilePictureFileName } = user

        try {
            const buffer = readFileSync(join(EnvService.env.PROFILE_PICTURE_DIR, profilePictureFileName))
            if (await this.isInvalidProfilePicture(buffer))
                return contractErrors.NotFoundProfilePicture(otherUserName)
            return new StreamableFile(buffer)
        } catch {}
        return contractErrors.NotFoundProfilePicture(otherUserName)
    }

    public async getUserTwoFAqrCode(username: string) {
        const user = await this.getUserByName(username, { twoFAsecret: true })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(username)
        let { twoFAsecret } = user
        if (!twoFAsecret) {
            twoFAsecret = authenticator.generateSecret()
            await this.prisma.user.update({ where: { name: username }, data: { twoFAsecret } })
        }
        return authenticator.keyuri(username, EnvService.env.APP_NAME, twoFAsecret)
    }

    public async enableTwoFA(username: string, twoFAtoken: string) {
        const user = await this.getUserByName(username, {
            twoFAsecret: true,
            enabledTwoFA: true
        })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(username)
        if (user.enabledTwoFA)
            return contractErrors.twoFAalreadyEnabled()
        if (!user.twoFAsecret)
            return contractErrors.twoFAqrCodeNeverRequested()
        if (!authenticator.verify({ token: twoFAtoken, secret: user.twoFAsecret }))
            return contractErrors.InvalidTwoFAToken(twoFAtoken)
        await this.prisma.user.update({ where: { name: username }, data: { enabledTwoFA: true } })
    }

    public async disableTwoFA(username: string, twoFAtoken: string) {
        const user = await this.getUserByName(username, {
            twoFAsecret: true,
            enabledTwoFA: true
        })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(username)
        if (!user.enabledTwoFA)
            return contractErrors.twoFAalreadyDisabled()
        if (!user.twoFAsecret)
            return
        if (!authenticator.verify({ token: twoFAtoken, secret: user.twoFAsecret }))
            return contractErrors.InvalidTwoFAToken(twoFAtoken)
        await this.prisma.user.update({
            where: { name: username },
            data: { enabledTwoFA: false, twoFAsecret: null }
        })
    }

    public async blockUser(username: string, blockedUserName: string) {
        if (username === blockedUserName)
            return contractErrors.ForbiddenSelfOperation('to block')
        const user = await this.getUserByName(blockedUserName, {
            blockedUser: {
                where: { blockedUserName: username },
                select: { id: true }
            }})
        if (!user)
            return contractErrors.NotFoundUser(blockedUserName)
        if (user.blockedUser.length)
            return contractErrors.UserAlreadyBlocked(blockedUserName)
        await Promise.all([
            this.prisma.directMessage.updateMany({
                where: {
                    OR: [
                        { requestedUserName: username, requestingUserName: blockedUserName },
                        { requestingUserName: username, requestedUserName: blockedUserName }
                    ]
                },
                data: {
                    status: "DISABLED"
                }
            }),
            this.prisma.friendShip.deleteMany({
                where: {
                    OR: [
                        { requestingUserName: username, requestedUserName: blockedUserName },
                        { requestedUserName: username, requestingUserName: blockedUserName }
                    ]
                }
            }),
            this.prisma.friendInvitation.updateMany({
                where: {
                    OR: [
                        { invitingUserName: username, invitedUserName: blockedUserName },
                        { invitedUserName: username, invitingUserName: blockedUserName }
                    ],
                    status: "PENDING"
                },
                data: {
                    status: "BLOCKED_USER"
                }
            }),
            this.prisma.chanInvitation.updateMany({
                where: {
                    OR: [
                        { invitingUserName: username, invitedUserName: blockedUserName },
                        { invitedUserName: username, invitingUserName: blockedUserName }
                    ],
                    status: "PENDING"
                },
                data: {
                    status: "BLOCKED_USER"
                }
            })
        ])
        const res = await this.prisma.blockedShip.create({
            data: {
                blockingUser: { connect: { name: username } },
                blockedUser: { connect: { name: blockedUserName } }
            },
            select: {
                id: true,
                blockedUserName: true
            }
        })
        await this.sse.pushEvent(blockedUserName, {
            type: "BLOCKED_BY_USER",
            data: { username }
        })
        return res
    }

    public async unblockUser(username: string, unblockUserName: string) {
        const res = await this.prisma.blockedShip.delete({
            where: {
                blockingUserName_blockedUserName: {
                    blockedUserName: unblockUserName,
                    blockingUserName: username
                }
            }, select: { id: true }
        }).catch(() => null)
        if (!res)
            return contractErrors.NotFoundBlockedUser(unblockUserName)
        await this.prisma.directMessage.updateMany({
            where: {
                OR: [
                    { requestedUserName: username, requestingUserName: unblockUserName },
                    { requestingUserName: username, requestedUserName: unblockUserName }
                ]
            },
            data: {
                status: "ENABLED"
            }
        })
        await this.sse.pushEvent(unblockUserName, {
            type: "UNBLOCKED_BY_USER",
            data: { username }
        })
    }

    public async getBlockedUsers(username: string) {
        return this.prisma.blockedShip.findMany({
            where: {
                OR:[
                    { blockingUserName: username },
                    { blockedUserName: username }
                ]
            },
            select: {
                id: true,
                blockedUserName: true
            }
        })
    }

    private searchMode: {
        [key in RequestShapes['searchUsersV2']['query']['action']]:
            ((
                username: string,
                args: Extract<
                    FlattenUnionObjectByDiscriminator<
                        RequestShapes['searchUsersV2']['query'],
                        "action",
                        "params"
                    >,
                    { action: key }
                >['params']
            ) => Prisma.UserWhereInput)
    } = {
        "*": (username) => ({}),
        "CREATE_CHAN_INVITE": (username, { chanId }) => ({
            name: { not: username },
            blockedByUser: { none: { blockingUserName: username } },
            blockedUser: { none: { blockedUserName: username } },
            directMessage: {
                some: {
                    OR: [
                        { requestedUserName: username },
                        { requestingUserName: username }
                    ],
                    status: 'ENABLED'
                }
            },
            chans: { none: { id: chanId } },
            timedUserChan: { none: { chanId } },
            incomingChanInvitation: {
                none: {
                    chanId,
                    invitingUserName: username,
                    status: 'PENDING'
                }
            }
        }),
        "CREATE_FRIEND_INVITE": (username: string) => ({
            name: { not: username },
            blockedByUser: { none: { blockingUserName: username } },
            blockedUser: { none: { blockedUserName: username } },
            friend: { none: { requestedUserName: username } },
            friendOf: { none: { requestingUserName: username } },
            incomingFriendInvitation: {
                none: {
                    status: 'PENDING',
                    invitingUserName: username
                }
            },
            outcomingFriendInvitation: {
                none: {
                    status: 'PENDING',
                    invitedUserName: username
                }
            }
        }),
    }

    public async searchUsersV2(username: string, dto: RequestShapes['searchUsersV2']['query']) {
        // useless switch just to narrow type
        let whereSearch: Prisma.UserWhereInput;
        switch (dto.action) {
            case "CREATE_CHAN_INVITE": whereSearch = this.searchMode[dto.action](username, dto.params); break ;
            default : whereSearch = this.searchMode[dto.action](username, dto.params)
        }
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { displayName: { contains: dto.displayNameContains } },
                    whereSearch,
                ],
            },
            take: dto.nResult,
            select: this.getUserProfilePreviewSelectForUser(username)
        })
        return this.formatUserProfilePreviewForUserArray(username, users)
    }

}
