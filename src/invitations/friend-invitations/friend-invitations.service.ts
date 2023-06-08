import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendInvitationStatus, Prisma } from '@prisma/client';
import { NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { zInvitationFilterType } from 'contract/zod/inv.zod';
import { PrismaService } from 'nestjs-prisma';
import { FriendsService } from 'src/friends/friends.service';
import { SseService } from 'src/sse/sse.service';
import { UserService } from 'src/user/user.service';

const c = nestControllerContract(contract.invitations.friend)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class FriendInvitationsService
{

	constructor(private readonly prisma: PrismaService,
			    private readonly userService: UserService,
			    private readonly sse: SseService,
			    private readonly friendService: FriendsService) {}

	private friendInvitationSelect =
	{
		id: true,
		creationDate: true,
		invitingUserName: true,
		invitedUserName: true,
		status: true,

	} satisfies Prisma.FriendInvitationSelect

	private getFriendInvitationArgViaUser(status: FriendInvitationStatus[])
	{
		const arg =
		{
			where: { status: { in: status } },
			select: this.friendInvitationSelect,
			orderBy: { creationDate: 'asc' }
		} satisfies Prisma.FriendInvitationFindManyArgs
		return arg
	}

	async getFriendInvitations(username: string, status: FriendInvitationStatus[])
	{
		const res = await this.userService.getUserByNameOrThrow(username,
			{
				incomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
				outcomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
			})
		return { incoming: res.incomingFriendInvitation, outcoming: res.outcomingFriendInvitation }
	}

	async getFriendInvitationsByType(username: string, type: zInvitationFilterType, status: FriendInvitationStatus[])
	{
		if (type === 'INCOMING')
		{
			return (await this.userService.getUserByNameOrThrow(username,
				{
					incomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
				})).incomingFriendInvitation
		}
		return (await this.userService.getUserByNameOrThrow(username,
			{
				outcomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
			})).outcomingFriendInvitation
	}

	private async getFriendInvitationOrThrow<T extends Prisma.FriendInvitationSelect>(username: string, id: string, type: 'INCOMING' | 'OUTCOMING' | 'ANY', select: Prisma.SelectSubset<T, Prisma.FriendInvitationSelect>)
	{
		let whereArg = Prisma.validator<Prisma.FriendInvitationWhereUniqueInput>()
		({
			id: id,
			OR: [{}]
		})
		if (type === 'INCOMING' || type === 'ANY')
			whereArg.OR.push({ invitedUserName: username } satisfies Prisma.FriendInvitationWhereInput)
		if (type === 'OUTCOMING' || type === 'ANY')
			whereArg.OR.push({ invitingUserName: username } satisfies Prisma.FriendInvitationWhereInput)
		const res = await this.prisma.friendInvitation.findUnique({
			where: whereArg,
			select: select })
		if (!res)
			throw new NotFoundException(`not found friend invitation ${id}`)
		return res
	}

	async getFriendInvitationById(username: string, id: string)
	{
		return this.getFriendInvitationOrThrow(username, id, 'ANY', this.friendInvitationSelect)
	}

	async createFriendInvitation(invitingUserName: string, invitedUserName: string)
	{
		if (invitingUserName === invitedUserName)
			throw new ForbiddenException(`self friend invitation`)
		await this.userService.getUserByNameOrThrow(invitedUserName, { name: true })
		const { blockedByUser, blockedUser, friend, friendOf, incomingFriendInvitation, outcomingFriendInvitation } = await this.userService.getUserByNameOrThrow(invitingUserName,
			{
				blockedByUser: { where: { blockingUserName: invitedUserName }, select: { id: true } },
				blockedUser: { where: { blockedUserName: invitedUserName }, select: { id: true } },
				friend: { where: { requestedUserName: invitedUserName }, select: { id: true } }, // check that
				friendOf: { where: { requestingUserName: invitedUserName }, select: { id: true } },
				incomingFriendInvitation: { where: { invitingUserName: invitedUserName, status: FriendInvitationStatus.PENDING }, select: { id: true } },
				outcomingFriendInvitation: { where: { invitedUserName: invitedUserName, status: FriendInvitationStatus.PENDING }, select: { id: true } },
			})
		if (blockedByUser.length)
			throw new ForbiddenException(`${invitingUserName} blocked by ${invitedUserName} (${blockedByUser[0].id})`)
		if (blockedUser.length)
			throw new ForbiddenException(`${invitingUserName} blocked ${invitedUserName} (${blockedUser[0].id})`)
		if (friend.length || friendOf.length)
			throw new ForbiddenException(`${invitingUserName} friend with ${invitedUserName} (${friend[0]?.id || friendOf[0]?.id})`)
		if (incomingFriendInvitation.length)
			throw new ForbiddenException(`${invitingUserName} has already a PENDING invitation from ${invitedUserName} (${incomingFriendInvitation[0].id})`)
		if (outcomingFriendInvitation.length)
			throw new ForbiddenException(`${invitingUserName} has already a PENDING invitation for ${invitedUserName} (${outcomingFriendInvitation[0].id})`)
		return this.prisma.friendInvitation.create({
			data:
			{
				invitingUserName: invitingUserName,
				invitedUserName: invitedUserName
			},
			select: this.friendInvitationSelect })
	}

	async updateIncomingFriendInvitation(username: string, newStatus: RequestShapes['updateIncomingFriendInvitation']['body']['status'], id: string)
	{
		const { invitedUserName, invitingUserName, status: oldStatus } = await this.getFriendInvitationOrThrow(username, id, 'INCOMING', { status: true, invitedUserName: true, invitingUserName: true })
		if (oldStatus !== FriendInvitationStatus.PENDING)
			throw new ForbiddenException(`can't update not PENDING friend invitation`)
		if (newStatus === 'ACCEPTED')
			await this.friendService.createFriend(invitingUserName, invitedUserName)
		return this.prisma.friendInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.friendInvitationSelect })
	}

	async updateOutcomingFriendInvitation(username: string, newStatus: RequestShapes['updateOutcomingFriendInvitation']['body']['status'], id: string)
	{
		const { status: oldStatus } = await this.getFriendInvitationOrThrow(username, id, 'OUTCOMING', { status: true })
		if (oldStatus !== FriendInvitationStatus.PENDING)
			throw new ForbiddenException(`can't update not PENDING friend invitation`)
		return this.prisma.friendInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.friendInvitationSelect })
	}
}
