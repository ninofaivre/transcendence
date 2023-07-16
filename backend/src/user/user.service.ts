import type { Prisma } from "@prisma/client"

import { Inject, Injectable, forwardRef } from "@nestjs/common"
import { NotFoundException, ConflictException } from "@nestjs/common"
import { hash } from "bcrypt"
import { StatusVisibilityLevel } from "@prisma/client"
import { PrismaService } from "src/prisma/prisma.service"
import { NestRequestShapes, nestControllerContract } from "@ts-rest/nest"
import { contract, contractErrors } from "contract"
import { z } from "zod"
import { zUserProfileReturn } from "contract"
import { zMyProfileReturn, zUserProfilePreviewReturn, zUserStatus } from "contract"
import { SseService } from "src/sse/sse.service"
import { ChansService } from "src/chans/chans.service"
import { FriendsService } from "src/friends/friends.service"
import { DmsService } from "src/dms/dms.service"
import { EnrichedRequest } from "src/auth/auth.service"

const c = nestControllerContract(contract.users)
type RequestShapes = NestRequestShapes<typeof c>

type ProximityLevel = "FRIEND" | "COMMON_CHAN" | "ANYONE"

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

	private async formatUserStatusForUser(
		username: string,
		toGetStatusUserName: string,
	): Promise<z.infer<typeof zUserStatus>> {
		const data = await this.getUserByNameOrThrow(toGetStatusUserName, {
			statusVisibilityLevel: true,
			friend: {
				where: {
					requestingUser: { statusVisibilityLevel: { not: "NO_ONE" } },
					requestedUserName: username,
				},
				select: { id: true },
			},
			friendOf: {
				where: {
					requestedUser: { statusVisibilityLevel: { not: "NO_ONE" } },
					requestingUserName: username,
				},
				select: { id: true },
			},
			chans: {
				where: {
					AND: [
						{ users: { some: { name: username } } },
						{
							users: {
								some: {
									name: toGetStatusUserName,
									statusVisibilityLevel: "IN_COMMON_CHAN",
								},
							},
						},
					],
				},
				select: { id: true },
				take: 1,
			},
		})
		return this.getUserStatusFromVisibilityAndProximityLevel(
			{
				name: toGetStatusUserName,
				visibility: data.statusVisibilityLevel,
			},
			this.getProximityLevel(data),
		)
	}

	async getUserProfile({ user: { username } }: EnrichedRequest, toGetUserName: string) {
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
	}: {
		friend: {}[]
		friendOf: {}[]
		chans: {}[]
	}) {
		return friend.length || friendOf.length ? "FRIEND" : chans.length ? "COMMON_CHAN" : "ANYONE"
	}

	private async formatUserProfileForUser(
		username: string,
		toFormat: Prisma.UserGetPayload<typeof this.userProfileSelectGetPayload>,
	): Promise<z.infer<typeof zUserProfileReturn>> {
		const { name, chans, blockedUser, ...rest } = toFormat

		return {
			...rest,
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
				{ blockedByUser: { some: { blockingUserName: username } } },
			],
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
		const { name, ...rest } = toFormat
		return { ...rest, userName: name }
	}

	async getMe(username: string) {
		const me = await this.getUser(username, this.myProfileSelect)
		if (!me) return contractErrors.NotFoundUser(username)
		return this.formatMe(me)
	}

	getArrayOfUniqueUserNamesFromStatusData(
		data: Exclude<Awaited<ReturnType<typeof this.getNotifyStatusData>>, null>,
	) {
		return [
			...new Set<string>(
				data.friend
					.map((el) => el.requestedUserName)
					.concat(data.friendOf.map((el) => el.requestingUserName))
					.concat(data.directMessage.map((el) => el.requestedUserName))
					.concat(data.directMessageOf.map((el) => el.requestingUserName)),
			),
		]
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
		return this.sse.isUserOnline(username) ? "ONLINE" : "OFFLINE"
	}

	public getUserStatusFromVisibilityAndProximityLevel(
		user: {
			visibility: (typeof StatusVisibilityLevel)[keyof typeof StatusVisibilityLevel]
			name: string
		},
		proximity: ProximityLevel,
	) {
		return (proximity === "FRIEND" && user.visibility !== "NO_ONE") ||
			(user.visibility === "IN_COMMON_CHAN" && proximity === "COMMON_CHAN") ||
			user.visibility === "ANYONE"
			? this.getUserStatus(user.name)
			: "INVISIBLE"
	}

	public async notifyStatus(username: string) {
		const data = await this.getNotifyStatusData(username)
		if (!data) return
		const toNotifyUserNames = this.getArrayOfUniqueUserNamesFromStatusData(data)
		this.sse.pushEventMultipleUser(toNotifyUserNames, {
			type: "UPDATED_USER_STATUS",
			data: { userName: username, status: this.getUserStatus(username) },
		})
	}
}
