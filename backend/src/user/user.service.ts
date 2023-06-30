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
import { DmsService } from "src/dms/dms.service"

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
                private readonly friendsService: FriendsService,
                @Inject(forwardRef(() => DmsService))
                private readonly dmsService: DmsService) {}

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

    public async getProximityLevelBetweenUsers(usernameA: string, usernameB: string)
    : Promise<"FRIEND" | "COMMON_CHAN" | "ANYONE"> {
        if (await this.friendsService.areUsersFriend(usernameA, usernameB))
            return "FRIEND"
        if (await this.chansService.doesUsersHasCommonChan(usernameA, usernameB))
            return "COMMON_CHAN"
        return "ANYONE"
    }

    public getUserStatus(username: string, proximityLevel: "FRIEND" | "COMMON_CHAN" | "ANYONE", statusVisibilityLevel: StatusVisibilityLevel)
    : "ONLINE" | "OFFLINE" | "INVISIBLE" {
        if (statusVisibilityLevel === "NO_ONE"
            || (statusVisibilityLevel === "ONLY_FRIEND" && proximityLevel !== "FRIEND")
            || (statusVisibilityLevel === "IN_COMMON_CHAN" && proximityLevel === "ANYONE"))
            return "INVISIBLE"
        return (this.sse.isUserOnline(username)) ? "ONLINE" : "OFFLINE"
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
        const oldData = await this.getNotifyStatusData(username)

        const { dmsIds: oldDmsIds, friendShipsIds: oldFriendShipsIds } = this.getToNotifyIds(oldData)

        const updatedMe = await this.prisma.user
            .update({
                where: { name: username },
                data: dto,
                select: this.myProfileSelect
            })

        const newData = await this.getNotifyStatusData(username)

        const { dmsIds: newDmsIds, friendShipsIds: newFriendShipsIds } = this.getToNotifyIds(newData)
        
        const friendShipsIds = newFriendShipsIds.filter(el => !oldFriendShipsIds.includes(el))
            .concat(oldFriendShipsIds.filter(el => !newFriendShipsIds.includes(el)))
        await this.notifyUpdateFriendShips(username, friendShipsIds)

        const dmsIds = newDmsIds.filter(el => !oldDmsIds.includes(el))
            .concat(oldDmsIds.filter(el => !newDmsIds.includes(el)))
        await this.notifyUpdateDms(username, dmsIds)

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

	async createUser(user: RequestShapes["signUp"]["body"]) {
		if (await this.getUserByName(user.name, { name: true }))
			throw new ConflictException("user already exist")
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}

    public getProximitySelect(username: string) {
        return {
            friend: { where: { requestedUserName: username } },
            friendOf: { where: { requestingUserName: username } },
            chans: {
                where: { users: { some: { name: username } } },
                take: 1
            }
        } satisfies Prisma.UserSelect
    }

    public formatProximity(arg: { friend: {}[], friendOf: {}[], chans: {}[] }) {
        const { friend, friendOf, chans } = arg
        if (friend.length || friendOf.length)
            return "FRIEND"
        if (chans.length)
            return "COMMON_CHAN"
        return "ANYONE"
    }

    private async getNotifyStatusData(username: string) {
        return this.getUserByNameOrThrow(username, {
            statusVisibilityLevel: true,
            friend: { select: { id: true } },
            friendOf: { select: { id: true } },
            directMessage: {
                select: {
                    id: true,
                    requestedUser: { select: this.getProximitySelect(username) }
                }
            },
            directMessageOf: {
                select: {
                    id: true,
                    requestingUser: { select: this.getProximitySelect(username) }
                }
            }
        })
    }

    private async notifyUpdateFriendShips(username: string, ids: string[]) {
        const friendShips = await this.prisma.friendShip.findMany({
            where: { id: { in: ids } },
            select: this.friendsService.friendShipSelect
        })
        return Promise.all(friendShips.map(friendShip => {
            const friendName = (friendShip.requestedUserName === username)
                ? friendShip.requestingUserName
                : friendShip.requestedUserName
            const data = this.friendsService.formatFriendShip(friendShip, friendName)
            return this.sse.pushEvent(friendName, { type: 'UPDATED_FRIENDSHIP', data })
        }))
    }

    private async notifyUpdateDms(username: string, ids: string[]) {
        const dms = await this.prisma.directMessage.findMany({
            where: { id: { in: ids } },
            select: this.dmsService.getDirectMessageSelect(username)
        })
        return Promise.all(dms.map(dm => {
            const otherName = (dm.requestedUser.name === username)
                ? dm.requestingUser.name
                : dm.requestedUser.name
            const data = this.dmsService.formatDirectMessage(dm, otherName)
            return this.sse.pushEvent(otherName, { type: 'UPDATED_DM', data })
        }))
    }

    private getToNotifyIds(data: Awaited<ReturnType<typeof this.getNotifyStatusData>>) {
        const statusVisi = data.statusVisibilityLevel

        const friendShipsIds = data.friend.map(el => el.id)
            .concat(data.friendOf.map(el => el.id))

        const dmsIds = data.directMessage.map(el => ({ id: el.id, prox: el.requestedUser }))
            .concat(data.directMessageOf.map(el => ({ id: el.id, prox: el.requestingUser })))
            .filter(el => {
                const proximityLevel = this.formatProximity(el.prox)
                return !((statusVisi === "ONLY_FRIEND" && proximityLevel !== "FRIEND")
                    || (statusVisi === "IN_COMMON_CHAN" && proximityLevel === "ANYONE"))
            })
            .map(el => el.id)
        return { friendShipsIds, dmsIds }
    }

    public async notifyStatus(username: string) {
        const data = await this.getNotifyStatusData(username)
        if (data.statusVisibilityLevel === 'NO_ONE')
            return

        const { friendShipsIds, dmsIds } = this.getToNotifyIds(data)

        await this.notifyUpdateFriendShips(username, friendShipsIds)
        await this.notifyUpdateDms(username, dmsIds)
    }
}
