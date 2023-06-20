import { Inject, Injectable, forwardRef } from "@nestjs/common"
import { NotFoundException, ConflictException } from "@nestjs/common"
import { hash } from "bcrypt"
import { Prisma, StatusVisibilityLevel } from "prisma-client"
import { PrismaService } from "src/prisma/prisma.service"
import { NestRequestShapes, nestControllerContract } from "@ts-rest/nest"
import { contract } from "contract"
import { z } from "zod"
import { zUserProfileReturn } from "contract"
import { zMyProfileReturn, zUserProfilePreviewReturn, zUserStatus } from "contract/dist/routers/users"
import { SseService } from "src/sse/sse.service"
import { ChansService } from "src/chans/chans.service"
import { FriendsService } from "src/friends/friends.service"

const c = nestControllerContract(contract.users)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class UserService {

	constructor(private readonly prisma: PrismaService,
                @Inject(forwardRef(() => SseService))
                private readonly sse: SseService,
                @Inject(forwardRef(() => ChansService))
                private readonly chansService: ChansService,
                @Inject(forwardRef(() => FriendsService))
                private readonly friendsService: FriendsService) {}

    private getUserProfilePreviewSelectForUser(username: string) {
        return {
            name: true
        } satisfies Prisma.UserSelect
    }

    private getUserProfileSelectForUser(username: string) {
        return {
            ...this.getUserProfilePreviewSelectForUser(username),
            chans: {
                where: { users: { some: { name: username } } },
                select: { title: true, id: true, type: true }
            },
            dmPolicyLevel: true,
            blockedUser: { where: { blockedUserName: username }, select: { id: true }, take: 1 },
            statusVisibilityLevel: true
        } satisfies Prisma.UserSelect
    }

    private myProfileSelect = {
        name: true,
        dmPolicyLevel: true,
        statusVisibilityLevel: true
    } satisfies Prisma.UserSelect

    private myProfileSelectGetPayload = {
        select: this.myProfileSelect
    } satisfies Prisma.UserArgs

    private userProfilePreviewSelectGetPayload = {
        select: this.getUserProfilePreviewSelectForUser("example")
    } satisfies Prisma.UserArgs

    private userProfileSelectGetPayload = {
        select: this.getUserProfileSelectForUser("example")
    } satisfies Prisma.UserArgs

    private userOwnProfileSelectGetPayload = {
        select: this.myProfileSelect
    } satisfies Prisma.UserArgs


	// async getBlockedUsers(username: string, filter: blockedFilterType)
	// {
	// 	const tmp = await this.getUserByName(username,
	// 		{
	// 			blockedUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKED'],
	// 			blockedByUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKEDBY'],
	// 		})
	// 	switch(filter)
	// 	{
	// 		case (blockedFilterType['ALL']):
	// 			return { blocked: tmp.blockedUserList.map(el => el.name),
	// 				blockedBy: tmp.blockedByUserList.map(el => el.name) }
	// 		case (blockedFilterType['BLOCKED']):
	// 			return tmp.blockedUserList.map(el => el.name)
	// 		case (blockedFilterType['BLOCKEDBY']):
	// 			return tmp.blockedByUserList.map(el => el.name)
	// 	}
	// }
	//
	// async deleteBlocked(myUsername: string, blockedUsername: string)
	// {
	// 	await this.testUtils(myUsername,
	// 		{ blockedUserList: new NotFoundException(`${blockedUsername} is not in blockedUserList`) },
	// 		(usersArray: User[]) => !usersArray.some((el: User) => el.name === blockedUsername))
	// 	const updatePromise = this.prisma.user.update({ where: { name: myUsername },
	// 		data:
	// 		{
	// 			blockedUserList: { disconnect: { name: blockedUsername } }
	// 		}})
	// 	const addEventPromise = this.pushEvent(blockedUsername, { data: { user: myUsername }, type: "deletedBlocked" })
	// 	await Promise.all([updatePromise, addEventPromise])
	// }

	// async blockUser(blockingUsername: string, blockedUsername: string)
	// {
	// 	const checkBlockedUserExistance = this.getUserByNameOrThrow(blockedUsername)
	// 	const checkBlockingUserRequirements = this.testUtils(blockingUsername,
	// 		{ blockedUserList: new ConflictException(`you already blocked ${blockedUsername}`) },
	// 		(userArray: User[]) => userArray.some((el: User) => el.name === blockedUsername))
	//
	// 	await Promise.all([checkBlockedUserExistance, checkBlockingUserRequirements])
	// 	const updatePromise = this.prisma.user.update({ where: { name: blockingUsername },
	// 		data:
	// 		{
	// 			blockedUserList: { connect: { name: blockedUsername } },
	// 		}})
	// 	const addEventPromise = this.pushEvent(blockedUsername, { data: { user: blockingUsername }, type: "createdBlocked" })
	// 	await Promise.all([updatePromise, addEventPromise])
	// }
    
    private formatUserProfilePreviewForUser(username: string, toFormat: Prisma.UserGetPayload<typeof this.userProfilePreviewSelectGetPayload>)
    : z.infer<typeof zUserProfilePreviewReturn> {
        const { name, ...rest } = toFormat
        return { ...rest, userName: name }
    }

    private formatUserProfilePreviewForUserArray(username: string, toFormat: Prisma.UserGetPayload<typeof this.userProfilePreviewSelectGetPayload>[])
    : z.infer<typeof zUserProfilePreviewReturn>[] {
        return toFormat.map(el => this.formatUserProfilePreviewForUser(username, el))
    }

    private async formatUserStatusForUser(username: string, toGetStatusUserName: string, visibilityLevel: StatusVisibilityLevel)
    : Promise<z.infer<typeof zUserStatus>> {
        if (visibilityLevel === "NO_ONE")
            return "INVISIBLE"
        if (visibilityLevel === "ANYONE")
            return (this.sse.isUserOnline(toGetStatusUserName)) ? "ONLINE" : "OFFLINE"
        const proximityLevel = await this.getProximityLevelBetweenUsers(username, toGetStatusUserName)
        if (proximityLevel === "FRIEND" || (proximityLevel === "COMMON_CHAN" && visibilityLevel === "IN_COMMON_CHAN") )
            return (this.sse.isUserOnline(toGetStatusUserName)) ? "ONLINE" : "OFFLINE"
        return "INVISIBLE"
    }
    
    private async formatUserProfileForUser(username: string, toFormat: Prisma.UserGetPayload<typeof this.userProfileSelectGetPayload>)
    : Promise<z.infer<typeof zUserProfileReturn>> {
        const { name, statusVisibilityLevel, chans, blockedUser,...rest } = toFormat

        return {
            ...rest,
            status: await this.formatUserStatusForUser(username, name, statusVisibilityLevel),
            ...this.formatUserProfilePreviewForUser(username, { name }),
            commonChans: chans,
            blockedShipId: (blockedUser.length) ? blockedUser[0].id : undefined
        }
    }

    // async formatUserProfileForUserArray(username: string, toFormat: Prisma.UserGetPayload<typeof this.userProfileSelectGetPayload>[])
    // : Promise<z.infer<typeof zUserProfileReturn>[]> {
    //     return Promise.all(toFormat.map(el => this.formatUserProfileForUser(username, el)))
    // }

    async getProximityLevelBetweenUsers(usernameA: string, usernameB: string)
    : Promise<"FRIEND" | "COMMON_CHAN" | "ANYONE"> {
        if (await this.friendsService.areUsersFriend(usernameA, usernameB))
            return "FRIEND"
        if (await this.chansService.doesUsersHasCommonChan(usernameA, usernameB))
            return "COMMON_CHAN"
        return "ANYONE"
    }

    async searchUsers(username: string, contains: string, nRes: number) {
        const res = await this.prisma.user.findMany({
            where: { name: { contains } },
            take: nRes,
            orderBy: { name: "asc" },
            select: this.getUserProfilePreviewSelectForUser(username)
        })
        return this.formatUserProfilePreviewForUserArray(username, res)
    }

    async getUser(username: string, searchedUserName: string) {
        const res = await this.getUserByNameOrThrow(searchedUserName, this.getUserProfileSelectForUser(username))
        return this.formatUserProfileForUser(username, res)
    }

    formatMe(toFormat: Prisma.UserGetPayload<typeof this.myProfileSelectGetPayload>)
    : z.infer<typeof zMyProfileReturn> {
        const { name, ...rest } = toFormat
        return { ...rest, userName: name }
    }

    async getMe(username: string) {
        return this.formatMe(await this.getUserByNameOrThrow(username, this.myProfileSelect))
    }

    // remember to notify online status when status visibilityChange and to notify invisible
    async updateMe(username: string, dto: RequestShapes['updateMe']['body']) {
        return this.formatMe(await this.prisma.user.update({ where: { name: username },
            data: dto,
        select: this.myProfileSelect}))
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

	async createUser(user: RequestShapes["signUp"]["body"]) {
		if (await this.getUserByName(user.name, { name: true }))
			throw new ConflictException("user already exist")
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}

    public async notifyStatus(username: string, status: z.infer<typeof zUserStatus>) {
        const { statusVisibilityLevel: statusVisi, ...res } = await this.getUserByNameOrThrow(username, {
            chans: { select: { users: { select: { name: true } } } },
            friend: { select: { requestedUserName: true } },
            friendOf: { select: { requestingUserName: true } },
            directMessage: { select: { requestedUserName: true } },
            directMessageOf: { select: { requestingUserName: true } },
            statusVisibilityLevel: true })
        const friends = res.friend.map(el => el.requestedUserName)
            .concat(res.friendOf.map(el => el.requestingUserName))
        const dms = res.directMessage.map(el => el.requestedUserName)
            .concat(res.directMessageOf.map(el => el.requestingUserName))
        const chansUsers = res.chans.map(el => el.users.map(user => user.name)).flat()
        if (statusVisi === "NO_ONE")
            return
        const toNotify = friends
            .concat((statusVisi !== "ONLY_FRIEND") ? chansUsers : [],
                    (statusVisi === "ANYONE") ? dms : [])
        return this.sse.pushEventMultipleUser([...new Set(toNotify)], { type: "UPDATED_USER_PROFILE", data: { userName: username, userProfile: { status } } })
    }
}
