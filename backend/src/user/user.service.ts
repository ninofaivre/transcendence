import type { Prisma, AccessPolicyLevel as AccessPolicyLevelPrisma } from "@prisma/client"
import { Inject, Injectable, StreamableFile, forwardRef } from "@nestjs/common"
import { NotFoundException, ConflictException } from "@nestjs/common"
import { hash } from "bcrypt"
import { PrismaService } from "src/prisma/prisma.service"
import { NestRequestShapes } from "@ts-rest/nest"
import { contract, contractErrors } from "contract"
import { z } from "zod"
import { zUserProfileReturn, zMyProfileReturn, zUserProfilePreviewReturn, zUserStatus } from "contract"
import { SseService } from "src/sse/sse.service"
import { ChansService } from "src/chans/chans.service"
import { FriendsService } from "src/friends/friends.service"
import { DmsService } from "src/dms/dms.service"
import { EnrichedRequest } from "src/auth/auth.service"
import { AccessPolicyLevel, ProximityLevel } from "src/types"
import { fileTypeFromBuffer } from "../disgustingImports"
import { join } from "path"
import Jimp from "jimp";
import { EnvService } from "src/env/env.service"
import { createReadStream } from "fs"

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
	) {}

	private getUserProfilePreviewSelectForUser(username: string) {
		return {
			name: true,
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
			blockedUser: { where: { blockedUserName: username }, select: { id: true }, take: 1 },
		} satisfies Prisma.UserSelect
	}

	private myProfileSelect = {
		name: true,
		dmPolicyLevel: true,
		statusVisibilityLevel: true,
	} satisfies Prisma.UserSelect

	private myProfileSelectGetPayload = {
		select: this.myProfileSelect,
	} satisfies Prisma.UserArgs

	private userProfilePreviewSelectGetPayload = {
		select: this.getUserProfilePreviewSelectForUser("example"),
	} satisfies Prisma.UserArgs

	private userProfileSelectGetPayload = {
		select: this.getUserProfileSelectForUser("example"),
	} satisfies Prisma.UserArgs

	private userOwnProfileSelectGetPayload = {
		select: this.myProfileSelect,
	} satisfies Prisma.UserArgs

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
		const profile = await this.getUser(
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
		const { name, chans, blockedUser, dmPolicyLevel, ...rest } = toFormat

		return {
			...rest,
            dmPolicyLevel: (dmPolicyLevel === "NO_ONE") ? "ONLY_FRIEND" : dmPolicyLevel,
			status: await this.formatUserStatusForUser(username, name),
			...this.formatUserProfilePreviewForUser(username, { name }),
			commonChans: chans,
			blockedShipId: blockedUser.length ? blockedUser[0].id : undefined,
		}
	}

	test(username: string) {
		return {
			friends: [
				{ friend: { some: { requestedUserName: username } } },
				{ friendOf: { some: { requestingUserName: username } } },
			],
			mySelf: [{ name: username }],
			hasDm: [
				{ directMessage: { some: { requestedUserName: username } } },
				{ directMessageOf: { some: { requestingUserName: username } } },
			],
			blocked: [
				{ blockedUser: { some: { blockedUserName: username } } },
			],
            blockedBy: [
				{ blockedByUser: { some: { blockingUserName: username } } },
            ]
		} satisfies Record<
			keyof Omit<
				Extract<RequestShapes["searchUsers"]["query"]["filter"], { type: "inc" }>,
				"type"
			>,
			Prisma.Enumerable<Prisma.UserWhereInput>
		> &
			Record<
				keyof Omit<
					Extract<RequestShapes["searchUsers"]["query"]["filter"], { type: "only" }>,
					"type"
				>,
				Prisma.Enumerable<Prisma.UserWhereInput>
			>
	}

	getTest(
		arg: Omit<RequestShapes["searchUsers"]["query"]["filter"], "type">,
		type: "inc" | "only",
		username: string,
	) {
		let res: Prisma.Enumerable<Prisma.UserWhereInput> = []
		let k: keyof typeof arg
		for (k in arg) {
			if (arg[k] === (type !== "inc")) res.push(...this.test(username)[k])
		}
		return (type === "inc" ? { NOT: res } : { OR: res }) satisfies Prisma.UserWhereInput
	}

	async searchUsers(
		username: string,
		{ filter, nResult, userNameContains }: RequestShapes["searchUsers"]["query"],
	) {
		const where = {
			name: { contains: userNameContains },
			...this.getTest(filter, filter.type, username),
		} satisfies Prisma.UserWhereInput
		const res = await this.prisma.user.findMany({
			where,
			take: nResult,
			orderBy: { name: "asc" },
			select: this.getUserProfilePreviewSelectForUser(username),
		})
		return this.formatUserProfilePreviewForUserArray(username, res)
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
		const me = await this.getUser(username, this.myProfileSelect)
		if (!me) return contractErrors.NotFoundUser(username)
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

	async getUserByName(name: string, select: Prisma.UserSelect) {
		return this.prisma.user.findUnique({ where: { name: name }, select: select })
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

	public async getUser<T extends Prisma.UserSelect>(
		name: string,
		select: Prisma.SelectSubset<T, Prisma.UserSelect>,
	) {
		const user = await this.prisma.user.findUnique({
			where: { name },
			select,
		})
		return user
	}

	async createUser(user: RequestShapes["signUp"]["body"]) {
		if (await this.getUserByName(user.name, { name: true }))
			return contractErrors.UserAlreadyExist(user.name)
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}

	private async getNotifyStatusData(username: string) {
		return this.getUser(username, {
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

    public getUserStatus = (username: string) => this.sse.isUserOnline(username)
        ? "ONLINE"
        : "OFFLINE"

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

    public async setMyProfilePicture(username: string, profilePicture: Express.Multer.File) {
        if (!profilePicture)
            return { status: 400, body: { message: "no file" } } as const
        const ext = (await fileTypeFromBuffer(profilePicture.buffer))?.ext
        if (!ext || !['png', 'jpeg', 'jpg'].includes(ext))
            return { status: 400, body: { message: "wrong ext" } } as const
        const image = await Jimp.read(profilePicture.buffer)
        if (image.getWidth() !== image.getHeight())
            return { status: 400, body: { message: "not square" } } as const
        if (image.getWidth() < 50)
            return { status: 400, body: { message: "too small" } } as const
        const user = await this.getUser(username, { profilePicture: true })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(username)
        const { profilePicture: profilePictureFileName } = user
        if (username === 'tom')
            image.posterize(5)
        image.write(join(EnvService.env.PROFILE_PICTURE_DIR, profilePictureFileName))
    }

    public async getUserProfilePicture(username: string, otherUserName: string) {
        const user = await this.getUser(otherUserName, { profilePicture: true })
        if (!user)
            return contractErrors.NotFoundUserForValidToken(otherUserName)
        const { profilePicture: profilePictureFileName } = user

        let error = false
        try {
            const file = createReadStream(join(EnvService.env.PROFILE_PICTURE_DIR, profilePictureFileName));
            return new StreamableFile(file);
        } catch {}
        return contractErrors.NotFoundProfilePicture(otherUserName)
    }

}
