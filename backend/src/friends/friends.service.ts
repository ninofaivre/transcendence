import { Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common"
import {
	ClassicDmEventType,
	DirectMessageStatus,
	Prisma,
} from "@prisma/client"
import { zFriendShipReturn } from "contract"
import { DmsService } from "src/dms/dms.service"
import { SseService } from "src/sse/sse.service"
import { UserService } from "src/user/user.service"
import { z } from "zod"
import { PrismaService } from "src/prisma/prisma.service"
import { contractErrors } from "contract"
import { request } from "http"

@Injectable()
export class FriendsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sse: SseService,
		private readonly dmsService: DmsService,
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
	) {}

	public friendShipSelect = {
		id: true,
		creationDate: true,
		requestingUserName: true,
		requestedUserName: true,
		requestingUser: {
            select: {
                statusVisibilityLevel: true,
                displayName: true
            }
        },
		requestedUser: {
            select: {
                statusVisibilityLevel: true,
                displayName: true
            }
        },
	} satisfies Prisma.FriendShipSelect

	private friendShipGetPayload = {
		select: this.friendShipSelect,
	} satisfies Prisma.FriendShipDefaultArgs

	public formatFriendShip(
		friendShip: Prisma.FriendShipGetPayload<typeof this.friendShipGetPayload>,
		username: string, // why the fuck can't I use z.infer here ? (can't find 'this')
	) //: z.infer<typeof zFriendShipReturn>
	{
		const {
			requestedUserName,
			requestingUserName,
			requestingUser,
			requestedUser,
			...rest
		} = friendShip
		const friend =
			requestedUserName === username
				? { name: requestingUserName, ...requestingUser }
				: { name: requestedUserName, ...requestedUser }
		const formattedFriendShip: z.infer<typeof zFriendShipReturn> = {
			...rest,
			friendName: friend.name,
            friendDisplayName: friend.displayName,
			friendStatus: this.usersService.getUserStatusByProximity(friend.name,
                "FRIEND",
                friend.statusVisibilityLevel),
		}
		return formattedFriendShip
	}

	private formatFriendShipArray(
		friendShips: Prisma.FriendShipGetPayload<typeof this.friendShipGetPayload>[],
		username: string,
	): z.infer<typeof zFriendShipReturn>[] {
		return friendShips.map((friendShip) => this.formatFriendShip(friendShip, username))
	}

	public async createFriend(requestingUserName: string, requestedUserName: string) {
		const directMessage = await this.dmsService.findDmBetweenUsers(
			requestingUserName,
			requestedUserName,
			{ id: true, status: true },
		)
		const newFriendShip = await this.prisma.friendShip.create({
			data: {
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
			},
			select: this.friendShipSelect,
		})
		await this.sse.pushEvent(requestingUserName, {
			type: "CREATED_FRIENDSHIP",
			data: this.formatFriendShip(newFriendShip, requestingUserName),
		})
		await this.sse.pushEvent(requestedUserName, {
			type: "CREATED_FRIENDSHIP",
			data: this.formatFriendShip(newFriendShip, requestedUserName),
		})
		let newDmId: string = "" // a bit dirty
		if (!directMessage)
			newDmId = await this.dmsService.createAndNotifyDm(requestingUserName, requestedUserName)
		const dmId = directMessage?.id || newDmId
		const newEvent = await this.dmsService.createClassicDmEvent(
			dmId,
			ClassicDmEventType.CREATED_FRIENDSHIP,
		)
        if (!newEvent)
            return
		await this.dmsService.formatAndNotifyDmElement(
			requestingUserName,
			requestedUserName,
			dmId,
			newEvent,
		)
	}

	public async areUsersFriend(usernameA: string, usernameB: string) {
		return Boolean(
			await this.prisma.friendShip.count({
				where: {
					OR: [
						{ requestedUserName: usernameA, requestingUserName: usernameB },
						{ requestedUserName: usernameB, requestingUserName: usernameA },
					],
				},
				take: 1,
			}),
		)
	}

	public async deleteFriend(username: string, friendShipId: string) {
        const friendShip = await this.prisma.friendShip.findUnique({
            where: { id: friendShipId },
            select: { requestedUserName: true, requestingUserName: true }
        })
        console.log(`user ${username} tryed to delete friendship ${friendShipId} :`, friendShip)
        if (!friendShip)
            return contractErrors.NotFoundFriendShip(friendShipId)
        const { requestedUserName, requestingUserName } = friendShip
        if (requestedUserName !== username && requestingUserName !== username)
            return contractErrors.NotFoundFriendShip(friendShipId)
        await this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], {
            type: "DELETED_FRIENDSHIP",
            data: { friendShipId: friendShipId },
        })
        const res = await this.dmsService.findDmBetweenUsers(
            requestingUserName,
            requestedUserName,
            { id: true },
        )
        if (!res)
            return
        const { id: dmId } = res
        await this.prisma.friendShip.delete({ where: { id: friendShipId } })
        const newEvent = await this.dmsService.createClassicDmEvent(
            dmId,
            ClassicDmEventType.DELETED_FRIENDSHIP,
        )
        if (!newEvent)
            return
        await this.prisma.directMessage.update({
            where: { id: dmId },
            data: { status: 'DISABLED' }
        })
        await this.dmsService.formatAndNotifyDmElement(
            requestingUserName,
            requestedUserName,
            dmId,
            newEvent
        )
	}

	async getFriends(username: string) {
		return this.formatFriendShipArray(
			await this.prisma.friendShip.findMany({
				where: {
					OR: [{ requestedUserName: username }, { requestingUserName: username }],
				},
				select: this.friendShipSelect,
			}),
			username,
		)
	}
}
