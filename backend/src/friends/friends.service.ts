import { Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common"
import {
	ClassicDmEventType,
	DirectMessageStatus,
	DmPolicyLevelType,
	Prisma,
	StatusVisibilityLevel,
} from "@prisma/client"
import { zFriendShipReturn } from "contract"
import { ChansService } from "src/chans/chans.service"
import { DmsService } from "src/dms/dms.service"
import { SseService } from "src/sse/sse.service"
import { UserService } from "src/user/user.service"
import { z } from "zod"
import { PrismaService } from "src/prisma/prisma.service"

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
		requestingUser: { select: { statusVisibilityLevel: true } },
		requestedUser: { select: { statusVisibilityLevel: true } },
	} satisfies Prisma.FriendShipSelect

	private friendShipGetPayload = {
		select: this.friendShipSelect,
	} satisfies Prisma.FriendShipArgs

	public formatFriendShip(
		friendShip: Prisma.FriendShipGetPayload<typeof this.friendShipGetPayload>,
		username: string, // why the fuck can't I use z.infer here ? (can't find 'this') //: z.infer<typeof zFriendShipReturn>
	) {
		const {
			requestedUserName,
			requestingUserName,
			requestingUser: { statusVisibilityLevel: requestingVisi },
			requestedUser: { statusVisibilityLevel: requestedVisi },
			...rest
		} = friendShip
		const friend =
			requestedUserName === username
				? { name: requestingUserName, visibility: requestingVisi }
				: { name: requestedUserName, visibility: requestedVisi }
		const formattedFriendShip: z.infer<typeof zFriendShipReturn> = {
			...rest,
			friendName: friend.name,
			friendStatus: this.usersService.getUserStatus(friend.name, "FRIEND", friend.visibility),
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
		await this.dmsService.formatAntNotifyDmElement(
			requestingUserName,
			requestedUserName,
			dmId,
			newEvent,
		)
		if (directMessage && directMessage.status === DirectMessageStatus.DISABLED)
			await this.dmsService.updateAndNotifyDmStatus(
				directMessage.id,
				DirectMessageStatus.ENABLED,
				requestedUserName,
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

	// bien crade mais techniquement ça devrait marcher
	public async deleteFriend(username: string, friendShipId: string) {
		try {
			const { requestingUserName, requestedUserName } = await this.prisma.friendShip.delete({
				where: {
					id: friendShipId,
					OR: [{ requestedUserName: username }, { requestingUserName: username }],
				},
				select: { requestingUserName: true, requestedUserName: true },
			})
			await this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], {
				type: "DELETED_FRIENDSHIP",
				data: { friendShipId: friendShipId },
			})
			const res = await this.dmsService.findDmBetweenUsers(
				requestingUserName,
				requestedUserName,
				{ id: true },
			)
			if (!res) {
				// should never happen as dms is auto created at friendShip Creation and there should not be any way of deleting a dm
				throw new NotFoundException(
					`not found dm between ${requestedUserName} and ${requestingUserName}`,
				)
			}
			const { id: dmId } = res
			const newEvent = await this.dmsService.createClassicDmEvent(
				dmId,
				ClassicDmEventType.DELETED_FRIENDSHIP,
			)
			await this.dmsService.formatAntNotifyDmElement(
				requestingUserName,
				requestedUserName,
				dmId,
				newEvent,
			)
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
				throw new NotFoundException(`not found friendShip ${friendShipId}`)
			else throw e
		}
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
