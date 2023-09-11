import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { FriendInvitationStatus, Prisma } from "@prisma/client"
import { FriendsService } from "src/friends/friends.service"
import { PrismaService } from "src/prisma/prisma.service"
import { SseService } from "src/sse/sse.service"
import { EnrichedRequest } from "src/types"
import { UserService } from "src/user/user.service"

type FriendInvitationPayload = Prisma.FriendInvitationGetPayload<
    { select: FriendInvitationsService['friendInvitationSelect'] }
>

@Injectable()
export class FriendInvitationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
		private readonly sse: SseService,
		private readonly friendService: FriendsService,
	) {}

	private friendInvitationSelect = {
		id: true,
		creationDate: true,
		invitingUserName: true,
        invitingUser: { select: { displayName: true } },
		invitedUserName: true,
        invitedUser: { select: { displayName: true } },
		status: true,
	} satisfies Prisma.FriendInvitationSelect

    private formatFriendInvitation(payload: FriendInvitationPayload) {
        const { invitingUser: { displayName: invitingDisplayName }, invitedUser: { displayName: invitedDisplayName }, ...rest } =  payload
        return {
            ...rest,
            invitingDisplayName,
            invitedDisplayName
        }
    }

    private formatFriendInvitationArray(payloads: FriendInvitationPayload[]) {
        return payloads.map(payload => this.formatFriendInvitation(payload))
    }

	private getFriendInvitationArgViaUser(
		status: (typeof FriendInvitationStatus)[keyof typeof FriendInvitationStatus][],
	) {
		const arg = {
			where: { status: { in: status } },
			select: this.friendInvitationSelect,
			orderBy: { creationDate: "asc" },
		} satisfies Prisma.FriendInvitationFindManyArgs
		return arg
	}

	async getFriendInvitations(
		username: string,
		status: (typeof FriendInvitationStatus)[keyof typeof FriendInvitationStatus][],
	) {
		const res = await this.userService.getUserByNameOrThrow(username, {
			incomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
			outcomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
		})
		return {
            incoming: this.formatFriendInvitationArray(res.incomingFriendInvitation),
            outcoming: this.formatFriendInvitationArray(res.outcomingFriendInvitation)
        }
	}

	private async getFriendInvitationOrThrow<T extends Prisma.FriendInvitationSelect>(
		username: string,
		id: string,
		select: Prisma.SelectSubset<T, Prisma.FriendInvitationSelect>,
	) {
		const res = await this.prisma.friendInvitation.findUnique({
			where: {
				id,
				OR: [{ invitingUserName: username }, { invitedUserName: username }],
			},
			select,
		})
		if (!res) throw new NotFoundException(`not found friend invitation ${id}`)
		return res
	}

	async createFriendInvitation(reqUser: EnrichedRequest['user'], invitedUserName: string) {
        const { username: invitingUserName } = reqUser
		if (invitingUserName === invitedUserName)
			throw new ForbiddenException(`self friend invitation`)
		const invitedUser = await this.userService.getUserByNameOrThrow(invitedUserName, {
            name: true,
            blockedUser: { where: { blockedUserName: invitingUserName } },
            blockedByUser: { where: { blockingUserName: invitingUserName } }
        })
        if (invitedUser.blockedByUser.length || invitedUser.blockedByUser.length)
            throw new ForbiddenException("can't invite blocked or blocked by user")
		const {
			blockedByUser,
			blockedUser,
			friend,
			friendOf,
			incomingFriendInvitation,
			outcomingFriendInvitation,
		} = await this.userService.getUserByNameOrThrow(invitingUserName, {
			blockedByUser: { where: { blockingUserName: invitedUserName }, select: { id: true } },
			blockedUser: { where: { blockedUserName: invitedUserName }, select: { id: true } },
			friend: { where: { requestedUserName: invitedUserName }, select: { id: true } }, // check that
			friendOf: { where: { requestingUserName: invitedUserName }, select: { id: true } },
			incomingFriendInvitation: {
				where: {
					invitingUserName: invitedUserName,
					status: FriendInvitationStatus.PENDING,
				},
				select: { id: true },
			},
			outcomingFriendInvitation: {
				where: { invitedUserName: invitedUserName, status: FriendInvitationStatus.PENDING },
				select: { id: true },
			},
		})
		if (blockedByUser.length)
			throw new ForbiddenException(
				`${invitingUserName} blocked by ${invitedUserName} (${blockedByUser[0]?.id})`,
			)
		if (blockedUser.length)
			throw new ForbiddenException(
				`${invitingUserName} blocked ${invitedUserName} (${blockedUser[0]?.id})`,
			)
		if (friend.length || friendOf.length)
			throw new ForbiddenException(
				`${invitingUserName} already friend with ${invitedUserName} (${
					friend[0]?.id || friendOf[0]?.id
				})`,
			)
		if (incomingFriendInvitation.length)
			throw new ForbiddenException(
				`${invitingUserName} has already a PENDING invitation from ${invitedUserName} (${incomingFriendInvitation[0]?.id})`,
			)
		if (outcomingFriendInvitation.length)
			throw new ForbiddenException(
				`${invitingUserName} has already a PENDING invitation for ${invitedUserName} (${outcomingFriendInvitation[0]?.id})`,
			)
		const newFriendInvitation = this.formatFriendInvitation(await this.prisma.friendInvitation.create({
			data: {
				invitingUserName: invitingUserName,
				invitedUserName: invitedUserName,
			},
			select: this.friendInvitationSelect,
		}))
		await this.sse.pushEventMultipleUser([invitedUserName, invitingUserName], {
			type: "CREATED_FRIEND_INVITATION",
			data: newFriendInvitation,
        }, reqUser)
		return newFriendInvitation
	}

	async updateFriendInvitation(
        reqUser: EnrichedRequest['user'],
		newStatus: (typeof FriendInvitationStatus)[keyof typeof FriendInvitationStatus],
		id: string,
	) {
        const { username } = reqUser
		const {
			invitedUserName,
			invitingUserName,
			status: oldStatus,
		} = await this.getFriendInvitationOrThrow(username, id, {
			status: true,
			invitedUserName: true,
			invitingUserName: true,
		})
		if (oldStatus !== FriendInvitationStatus.PENDING)
			throw new ForbiddenException(`can't update not PENDING friend invitation`)
		if (invitingUserName === username && newStatus === FriendInvitationStatus.ACCEPTED)
			throw new ForbiddenException(`can't accept OUTCOMING friend invitation`)
		if (invitingUserName === username && newStatus === FriendInvitationStatus.REFUSED)
			throw new ForbiddenException(`can't refuse OUTCOMING friend invitation`)
		if (invitedUserName === username && newStatus === FriendInvitationStatus.CANCELED)
			throw new ForbiddenException(`can't cancel incoming friend invitation`)
		if (newStatus === FriendInvitationStatus.ACCEPTED)
			await this.friendService.createFriend(invitingUserName, invitedUserName)
		const updatedFriendInvitation = this.formatFriendInvitation(await this.prisma.friendInvitation.update({
			where: { id },
			data: { status: newStatus },
			select: this.friendInvitationSelect,
		}))
		this.sse.pushEventMultipleUser([invitingUserName, invitedUserName], {
			type: "UPDATED_FRIEND_INVITATION_STATUS",
			data: { friendInvitationId: id, status: newStatus },
		}, reqUser)
		return updatedFriendInvitation
	}
}
